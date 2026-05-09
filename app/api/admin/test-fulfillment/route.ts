import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { requireAdminSession } from "@/lib/auth";
import { processPaidCheckout } from "@/lib/fulfillment";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// POST /api/admin/test-fulfillment
// Body: { eventId, eventSlug, tierId, quantity, buyerName, buyerEmail, buyerPhone }
// Owner-only. Simulates a paid Stripe checkout — generates tickets, PDFs, email.
// For development/testing only. Remove in production if desired.
export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (session.profile.role !== "owner") {
    return NextResponse.json({ error: "Owner only." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.eventId || !body?.tierId || !body?.eventSlug) {
    return NextResponse.json({ error: "eventId, eventSlug, and tierId are required." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  // Look up tier price for the order total
  const { data: tier } = await supabase
    .from("ticket_tiers")
    .select("price_gbp, name")
    .eq("id", body.tierId)
    .maybeSingle();

  if (!tier) {
    return NextResponse.json({ error: "Tier not found." }, { status: 404 });
  }

  const qty = parseInt(body.quantity ?? "1", 10) || 1;
  const fakeSessionId = `cs_test_${crypto.randomBytes(16).toString("hex")}`;
  const fakeEventId   = `evt_test_${crypto.randomBytes(8).toString("hex")}`;

  const result = await processPaidCheckout({
    stripeEventId:     fakeEventId,
    checkoutSessionId: fakeSessionId,
    paymentIntentId:   `pi_test_${crypto.randomBytes(8).toString("hex")}`,
    paymentStatus:     "paid",
    eventId:           body.eventId,
    eventSlug:         body.eventSlug,
    tierId:            body.tierId,
    quantity:          qty,
    guestsPerUnit:     tier.guests_per_unit ?? 1,
    buyerName:         body.buyerName  ?? "Test Guest",
    buyerEmail:        body.buyerEmail ?? "test@example.com",
    buyerPhone:        body.buyerPhone ?? "+447000000000",
    amountTotal:       Math.round(Number(tier.price_gbp) * 100 * qty),
    currency:          "gbp"
  });

  return NextResponse.json(result);
}
