import { NextResponse } from "next/server";

import { getEventBundle } from "@/lib/data";
import { getBaseUrl } from "@/lib/env";
import { releaseTicketInventory, reserveTicketInventory } from "@/lib/inventory";
import { appliesGroupDiscount, getUnitPriceGbp, GROUP_DISCOUNT_THRESHOLD } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";
import { isWithinSalesWindow } from "@/lib/utils";
import { checkoutPayloadSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout payload." }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
  }

  const { eventId, eventSlug, tierId, quantity, buyerName, buyerEmail, buyerPhone } = parsed.data;
  const bundle = await getEventBundle(eventSlug);

  if (!bundle || bundle.event.id !== eventId) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  if (bundle.event.status !== "published") {
    return NextResponse.json({ error: "Event is not currently bookable." }, { status: 400 });
  }

  if (!isWithinSalesWindow(bundle.event.sales_start_at, bundle.event.sales_end_at)) {
    return NextResponse.json({ error: "Ticket sales are not currently open." }, { status: 400 });
  }

  const tier = bundle.tiers.find((item) => item.id === tierId);
  if (!tier || tier.status !== "active") {
    return NextResponse.json({ error: "Ticket tier unavailable." }, { status: 400 });
  }

  if (quantity > tier.max_per_order || quantity > tier.remaining) {
    return NextResponse.json({ error: "Requested quantity exceeds available capacity." }, { status: 400 });
  }

  // Group discount: groups of 10+ pay £70 per ticket, applied automatically.
  const groupDiscountApplied = appliesGroupDiscount(tier) && quantity >= GROUP_DISCOUNT_THRESHOLD;
  const unitPriceGbp = getUnitPriceGbp(tier, quantity);

  // Finding 2 fix: reserve inventory BEFORE creating the Stripe session
  // This prevents overselling when multiple buyers checkout simultaneously
  const reservation = await reserveTicketInventory(tier.id, quantity);
  if (!reservation.success) {
    return NextResponse.json(
      { error: "These tickets are no longer available. Please refresh and try again." },
      { status: 409 }
    );
  }

  const successUrl = `${getBaseUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl  = `${getBaseUrl()}/events/${eventSlug}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: buyerEmail,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30-minute window
      phone_number_collection: { enabled: true },
      billing_address_collection: "required",
      allow_promotion_codes: true,
      line_items: [
        {
          quantity,
          price_data: {
            currency: "gbp",
            unit_amount: Math.round(unitPriceGbp * 100),
            product_data: {
              name: `${bundle.event.name} | ${tier.name}`,
              description: groupDiscountApplied
                ? `${tier.description} Group of 10+ discount applied.`
                : tier.description
            }
          }
        }
      ],
      metadata: {
        eventId,
        eventSlug,
        tierId,
        quantity: String(quantity),
        guestsPerUnit: String(tier.guests_per_unit ?? 1),
        unitPriceGbp: String(unitPriceGbp),
        groupDiscount: String(groupDiscountApplied),
        buyerName,
        buyerEmail,
        buyerPhone
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    await releaseTicketInventory(tier.id, quantity);
    const message = err instanceof Error ? err.message : "Checkout failed. Please try again.";
    console.error("[checkout] Stripe session creation failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
