import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface ResendOrderRow {
  id: string;
  buyer_email: string;
  buyer_name: string;
  stripe_checkout_session_id: string | null;
  event_id: string;
  events: {
    id: string;
    name: string;
    slug: string;
  };
}

interface ResendTicketRow {
  public_id: string;
  pdf_path: string | null;
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session?.profile || session.profile.role !== "owner") {
    return NextResponse.json({ error: "Owner access is required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const orderId = body?.orderId as string | undefined;

  if (!orderId) {
    return NextResponse.json({ error: "Missing order ID." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 503 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, buyer_email, buyer_name, stripe_checkout_session_id, event_id, events!inner(id, name, slug)")
    .eq("id", orderId)
    .single();

  const typedOrder = order as ResendOrderRow | null;

  if (!typedOrder) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const { data: tickets } = await supabase
    .from("tickets")
    .select("public_id, pdf_path, guests!inner(order_id)")
    .eq("guests.order_id", orderId)
    .limit(20);

  const { data: orderItem } = await supabase
    .from("order_items")
    .select("ticket_tiers(name)")
    .eq("order_id", orderId)
    .limit(1)
    .maybeSingle();

  const tierName = (orderItem?.ticket_tiers as { name: string } | null)?.name ?? "Standard Single";

  await sendOrderConfirmationEmail({
    orderId: typedOrder.id,
    stripeEventId: typedOrder.stripe_checkout_session_id ?? typedOrder.id,
    buyerEmail: typedOrder.buyer_email,
    buyerName: typedOrder.buyer_name,
    eventSlug: typedOrder.events.slug,
    eventName: typedOrder.events.name,
    tierName,
    ticketLinks:
      ((tickets as ResendTicketRow[] | null) ?? []).map((ticket) => ({
        publicId: ticket.public_id,
        pdfPath: ticket.pdf_path
      }))
  });

  return NextResponse.json({ ok: true });
}
