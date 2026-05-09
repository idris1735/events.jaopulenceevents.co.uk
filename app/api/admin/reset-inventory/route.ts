import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session?.profile || session.profile.role !== "owner") {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const eventId = body?.eventId as string | undefined;
  const mode    = body?.mode as "inventory" | "full" | undefined;

  if (!eventId || !mode) {
    return NextResponse.json({ error: "Missing eventId or mode." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  if (mode === "full") {
    // Delete all orders + related records for this event, then reset inventory.
    // Order matters: delete children before parents.

    // 1. Fetch all order IDs for this event
    const { data: orders } = await supabase
      .from("orders")
      .select("id")
      .eq("event_id", eventId);

    const orderIds = (orders ?? []).map((o: { id: string }) => o.id);

    if (orderIds.length > 0) {
      // 2. Email deliveries
      await supabase.from("email_deliveries").delete().in("order_id", orderIds);

      // 3. Fetch guest IDs
      const { data: guests } = await supabase
        .from("guests")
        .select("id")
        .in("order_id", orderIds);
      const guestIds = (guests ?? []).map((g: { id: string }) => g.id);

      // 4. Tickets
      if (guestIds.length > 0) {
        await supabase.from("tickets").delete().in("guest_id", guestIds);
      }

      // 5. Guests
      await supabase.from("guests").delete().in("order_id", orderIds);

      // 6. Order items
      await supabase.from("order_items").delete().in("order_id", orderIds);

      // 7. Orders
      await supabase.from("orders").delete().eq("event_id", eventId);
    }
  }

  // Reset inventory: remaining = capacity, status = active for all tiers
  const { error } = await supabase.rpc("reset_tier_inventory", { target_event_id: eventId });

  if (error) {
    // Fallback: update directly if RPC doesn't exist yet
    const { error: directError } = await supabase
      .from("ticket_tiers")
      .update({ status: "active" })
      .eq("event_id", eventId)
      .neq("capacity", 0);

    if (directError) {
      return NextResponse.json({ error: directError.message }, { status: 500 });
    }

    // Update remaining to match capacity individually
    const { data: tiers } = await supabase
      .from("ticket_tiers")
      .select("id, capacity")
      .eq("event_id", eventId);

    for (const tier of tiers ?? []) {
      await supabase
        .from("ticket_tiers")
        .update({ remaining: tier.capacity, status: "active" })
        .eq("id", tier.id);
    }
  }

  return NextResponse.json({ ok: true, mode });
}
