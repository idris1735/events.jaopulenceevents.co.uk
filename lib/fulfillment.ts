import crypto from "node:crypto";

import { getEventBundle, getTierById } from "@/lib/data";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { generateTicketPdf } from "@/lib/pdf";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { signTicketToken } from "@/lib/ticket-token";
import { TicketTierRecord } from "@/lib/types";

interface FulfillmentInput {
  stripeEventId: string;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  paymentStatus: "paid" | "failed" | "pending";
  eventId: string;
  eventSlug: string;
  tierId: string;
  quantity: number;
  guestsPerUnit: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  amountTotal: number;
  currency: string;
}

function createTicketPublicId() {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

async function storeTicketPdf(path: string, bytes: Uint8Array) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { error } = await supabase.storage.from("tickets").upload(path, bytes, {
    contentType: "application/pdf",
    upsert: true
  });

  if (error) return null;
  // Store raw path only — signed URLs are generated at read time in data.ts
  return path;
}

async function createGuestTickets(params: {
  orderId: string;
  eventId: string;
  eventSlug: string;
  tier: TicketTierRecord;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  quantity: number;
}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const bundle = await getEventBundle(params.eventSlug);
  if (!bundle) return [];

  const createdTickets: Array<{ publicId: string; pdfPath: string | null }> = [];

  for (let index = 0; index < params.quantity; index += 1) {
    const guestIndex = index + 1;
    const isCouples  = params.tier.name.toLowerCase().includes("couples");
    const guestSuffix = isCouples ? `Couple ${guestIndex}` : `Guest ${guestIndex}`;
    const guestName  =
      params.quantity === 1 ? params.buyerName : `${params.buyerName} (${guestSuffix})`;
    const publicId = createTicketPublicId();
    const token    = signTicketToken(`${params.orderId}:${publicId}:${guestIndex}`);

    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .insert({
        order_id:    params.orderId,
        full_name:   guestName,
        email:       params.buyerEmail,
        phone:       params.buyerPhone,
        guest_index: guestIndex
      })
      .select("id, full_name")
      .single();

    if (guestError || !guest) {
      throw new Error(guestError?.message ?? "Unable to create guest record.");
    }

    const pdfBytes = await generateTicketPdf({
      eventName:    bundle.event.name,
      guestName:    guest.full_name,
      publicId,
      ticketTier:   params.tier.name,
      startsAt:     bundle.event.starts_at,
      venueName:    bundle.event.venue_name,
      venueAddress: bundle.event.venue_address,
      qrPayload:    token,
      guestIndex,
      totalGuests:  params.quantity
    });

    const pdfPath = await storeTicketPdf(
      `${params.eventId}/${params.orderId}/${publicId}.pdf`,
      pdfBytes
    );

    const { error: ticketError } = await supabase.from("tickets").insert({
      guest_id:       guest.id,
      event_id:       params.eventId,
      ticket_tier_id: params.tier.id,
      public_id:      publicId,
      qr_payload:     token,
      pdf_path:       pdfPath,
      status:         "issued"
    });

    if (ticketError) throw new Error(ticketError.message);

    createdTickets.push({ publicId, pdfPath });
  }

  return createdTickets;
}

export async function processPaidCheckout(input: FulfillmentInput) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: true, mode: "no-db" };

  const tier = await getTierById(input.eventId, input.tierId);
  if (!tier) throw new Error("Ticket tier not found for fulfillment.");

  // Upsert order
  const existingOrder = await supabase
    .from("orders")
    .select("id, status")
    .eq("stripe_checkout_session_id", input.checkoutSessionId)
    .maybeSingle();

  let orderId = existingOrder.data?.id as string | undefined;

  if (!orderId) {
    const { data: createdOrder, error } = await supabase
      .from("orders")
      .insert({
        event_id:                    input.eventId,
        stripe_checkout_session_id:  input.checkoutSessionId,
        stripe_payment_intent_id:    input.paymentIntentId,
        buyer_name:                  input.buyerName,
        buyer_email:                 input.buyerEmail,
        buyer_phone:                 input.buyerPhone,
        total_pence:                 input.amountTotal,
        currency:                    input.currency.toUpperCase(),
        status:                      input.paymentStatus
      })
      .select("id")
      .single();

    if (error || !createdOrder) throw new Error(error?.message ?? "Unable to create order.");
    orderId = createdOrder.id;
  } else if (existingOrder.data?.status !== input.paymentStatus) {
    await supabase
      .from("orders")
      .update({ status: input.paymentStatus, stripe_payment_intent_id: input.paymentIntentId })
      .eq("id", orderId);
  }

  if (input.paymentStatus !== "paid" || existingOrder.data?.status === "paid") {
    return { ok: true, orderId };
  }

  if (!orderId) throw new Error("Order ID is missing after order creation.");

  // Idempotency: skip if guests already created
  const existingGuests = await supabase
    .from("guests")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId);

  if ((existingGuests.count ?? 0) > 0) {
    return { ok: true, orderId, ticketsIssued: 0 };
  }

  // Finding 2 fix: inventory was already reserved in the checkout route.
  // We just write the order_items record here without re-reserving.
  const existingItems = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId);

  if ((existingItems.count ?? 0) === 0) {
    const { error: itemError } = await supabase.from("order_items").insert({
      order_id:        orderId,
      ticket_tier_id:  tier.id,
      quantity:        input.quantity,
      unit_price_pence: Math.round(tier.price_gbp * 100)
    });
    if (itemError) throw new Error(itemError.message);
  }

  const createdTickets = await createGuestTickets({
    orderId,
    eventId:   input.eventId,
    eventSlug: input.eventSlug,
    tier,
    buyerName:  input.buyerName,
    buyerEmail: input.buyerEmail,
    buyerPhone: input.buyerPhone,
    quantity:   input.quantity * (input.guestsPerUnit ?? 1)
  });

  await sendOrderConfirmationEmail({
    orderId,
    stripeEventId: input.stripeEventId,
    buyerEmail:    input.buyerEmail,
    buyerName:     input.buyerName,
    eventSlug:     input.eventSlug,
    eventName:     (await getEventBundle(input.eventSlug))?.event.name ?? "J&A Opulence Event",
    tierName:      tier.name,
    ticketLinks:   createdTickets.map((t) => ({ publicId: t.publicId, pdfPath: t.pdfPath }))
  });

  return {
    ok: true,
    orderId,
    ticketsIssued: createdTickets.length
  };
}
