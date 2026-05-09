import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function reserveTicketInventory(tierId: string, quantity: number) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { success: true, remaining: null as number | null, newStatus: null as string | null };
  }

  const { data, error } = await supabase.rpc("reserve_ticket_inventory", {
    target_tier_id: tierId,
    requested_qty: quantity
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    success: Boolean(data?.[0]?.success),
    remaining: data?.[0]?.remaining ?? null,
    newStatus: data?.[0]?.new_status ?? null
  };
}

export async function releaseTicketInventory(tierId: string, quantity: number) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const { data: tier } = await supabase
    .from("ticket_tiers")
    .select("remaining, capacity, status")
    .eq("id", tierId)
    .maybeSingle();

  if (!tier) return;

  const newRemaining = Math.min(tier.capacity as number, (tier.remaining as number) + quantity);
  const newStatus =
    (tier.status as string) === "sold_out" && newRemaining > 0 ? "active" : tier.status;

  await supabase
    .from("ticket_tiers")
    .update({ remaining: newRemaining, status: newStatus })
    .eq("id", tierId);
}
