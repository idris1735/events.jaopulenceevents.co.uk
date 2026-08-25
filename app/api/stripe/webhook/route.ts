import { NextResponse } from "next/server";
import Stripe from "stripe";

import { env } from "@/lib/env";
import { processPaidCheckout } from "@/lib/fulfillment";
import { releaseTicketInventory } from "@/lib/inventory";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

async function markWebhookStatus(eventId: string, status: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  const db = supabase as any;

  const existing = await db
    .from("webhook_events")
    .select("stripe_event_id")
    .eq("stripe_event_id", eventId)
    .maybeSingle();

  if (existing.data) {
    await db
      .from("webhook_events")
      .update({ status, processed_at: new Date().toISOString() })
      .eq("stripe_event_id", eventId);
    return;
  }

  await db.from("webhook_events").insert({
    stripe_event_id: eventId,
    type: "unknown",
    status,
    processed_at: new Date().toISOString()
  });
}

async function isWebhookProcessed(eventId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;
  const db = supabase as any;
  const { data } = await db
    .from("webhook_events")
    .select("stripe_event_id, status")
    .eq("stripe_event_id", eventId)
    .maybeSingle();
  return data?.status === "processed";
}

async function registerWebhookEvent(event: Stripe.Event) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  const db = supabase as any;
  await db.from("webhook_events").upsert({
    stripe_event_id: event.id,
    type: event.type,
    status: "received",
    processed_at: new Date().toISOString()
  });
}

function getPaymentStatus(session: Stripe.Checkout.Session) {
  if (session.payment_status === "paid") return "paid";
  if (session.status === "expired") return "failed";
  return "pending";
}

async function processCheckoutSession(session: Stripe.Checkout.Session, stripeEventId: string) {
  const metadata     = session.metadata ?? {};
  const eventId      = metadata.eventId;
  const eventSlug    = metadata.eventSlug;
  const tierId       = metadata.tierId;
  const quantity     = Number(metadata.quantity ?? 1);
  const guestsPerUnit = Number(metadata.guestsPerUnit ?? 1);
  const buyerName    = metadata.buyerName ?? session.customer_details?.name ?? "Guest";
  const buyerEmail   = metadata.buyerEmail ?? session.customer_details?.email ?? "";
  const buyerPhone   = metadata.buyerPhone ?? session.customer_details?.phone ?? "";

  if (!eventId || !eventSlug || !tierId || !buyerEmail) {
    throw new Error("Checkout session metadata is incomplete.");
  }

  await processPaidCheckout({
    stripeEventId,
    checkoutSessionId:  session.id,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    paymentStatus: getPaymentStatus(session),
    eventId,
    eventSlug,
    tierId,
    quantity,
    guestsPerUnit,
    buyerName,
    buyerEmail,
    buyerPhone,
    amountTotal: session.amount_total ?? 0,
    currency: session.currency ?? "gbp"
  });
}

// Finding 2 fix: release inventory when session expires or payment fails
async function releaseSessionInventory(session: Stripe.Checkout.Session) {
  const tierId   = session.metadata?.tierId;
  const quantity = Number(session.metadata?.quantity ?? 1);
  if (tierId && quantity > 0) {
    await releaseTicketInventory(tierId, quantity);
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid webhook signature." },
      { status: 400 }
    );
  }

  if (await isWebhookProcessed(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await registerWebhookEvent(event);

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.async_payment_failed":
        await processCheckoutSession(event.data.object as Stripe.Checkout.Session, event.id);
        break;

      // Finding 2 fix: release reserved inventory on session expiry
      case "checkout.session.expired":
        await releaseSessionInventory(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        break;
    }

    await markWebhookStatus(event.id, "processed");
    return NextResponse.json({ received: true });
  } catch (error) {
    await markWebhookStatus(event.id, "failed");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed." },
      { status: 500 }
    );
  }
}
