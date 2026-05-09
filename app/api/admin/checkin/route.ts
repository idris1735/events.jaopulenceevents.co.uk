import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  await requireAdminSession();

  const body = await request.json().catch(() => null);
  const publicId = (body?.publicId ?? "").trim().toUpperCase();

  if (!publicId) {
    return NextResponse.json({ error: "Ticket ID is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  const { data } = await supabase
    .from("tickets")
    .select(`
      id, public_id, status,
      guests!inner(full_name),
      events!inner(name),
      ticket_tiers!inner(name)
    `)
    .eq("public_id", publicId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Ticket not found. Check the ID and try again." }, { status: 404 });
  }

  const t = data as {
    id: string;
    public_id: string;
    status: "issued" | "used" | "void";
    guests: { full_name: string };
    events: { name: string };
    ticket_tiers: { name: string };
  };

  const ticket = {
    publicId: t.public_id,
    guestName: t.guests.full_name,
    eventName: t.events.name,
    tierName: t.ticket_tiers.name,
    status: t.status
  };

  if (t.status === "void") {
    return NextResponse.json({ error: "This ticket has been voided.", ticket }, { status: 422 });
  }

  if (t.status === "used") {
    return NextResponse.json({ alreadyUsed: true, ticket });
  }

  const { error: updateError } = await supabase
    .from("tickets")
    .update({ status: "used" })
    .eq("id", t.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ticket: { ...ticket, status: "used" } });
}
