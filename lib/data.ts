import { cache } from "react";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  AdminDashboardMetrics,
  AdminOrderRecord,
  AdminTicketRecord,
  EventRecord,
  TicketBundle,
  TicketLookupRecord,
  TicketTierRecord
} from "@/lib/types";

async function getSignedPdfUrl(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, rawPath: string | null): Promise<string | null> {
  if (!rawPath) return null;
  const { data } = await supabase.storage.from("tickets").createSignedUrl(rawPath, 3600);
  return data?.signedUrl ?? null;
}

async function getEventBundleFromSupabase(slug?: string): Promise<TicketBundle[] | TicketBundle | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  let eventQuery = supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: true });

  if (slug) {
    eventQuery = eventQuery.eq("slug", slug).limit(1);
  } else {
    eventQuery = eventQuery.eq("status", "published");
  }

  const { data: events, error: eventError } = await eventQuery;
  const typedEvents = (events as EventRecord[] | null) ?? [];

  if (eventError || !typedEvents.length) return null;

  const eventIds = typedEvents.map((item: EventRecord) => item.id);
  const { data: tiers } = await supabase
    .from("ticket_tiers")
    .select("*")
    .in("event_id", eventIds)
    .order("price_gbp", { ascending: true });

  const typedTiers = (tiers as TicketTierRecord[] | null) ?? [];

  const bundles = typedEvents.map((event: EventRecord) => ({
    event,
    tiers: typedTiers.filter((tier: TicketTierRecord) => tier.event_id === event.id)
  }));

  return slug ? bundles[0] ?? null : bundles;
}

// Finding 1 fix: no demo fallbacks — return empty/null when Supabase is unavailable
export const getActiveEventBundles = cache(async (): Promise<TicketBundle[]> => {
  const liveBundles = await getEventBundleFromSupabase();
  if (Array.isArray(liveBundles) && liveBundles.length > 0) return liveBundles;
  return [];
});

export const getEventBundle = cache(async (slug: string): Promise<TicketBundle | null> => {
  const liveBundle = await getEventBundleFromSupabase(slug);
  if (liveBundle && !Array.isArray(liveBundle)) return liveBundle;
  return null;
});

export async function getTierById(eventId: string, tierId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("ticket_tiers")
    .select("*")
    .eq("event_id", eventId)
    .eq("id", tierId)
    .maybeSingle();

  return data ? (data as TicketTierRecord) : null;
}

export async function getTicketLookup(publicId: string): Promise<TicketLookupRecord | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("tickets")
    .select(`
      public_id,
      status,
      pdf_path,
      guests!inner(full_name),
      events!inner(name, starts_at, venue_name, venue_address),
      ticket_tiers!inner(name)
    `)
    .eq("public_id", publicId)
    .maybeSingle();

  const typedData = data as {
    public_id: string;
    status: "issued" | "used" | "void";
    pdf_path: string | null;
    guests: { full_name: string };
    events: { name: string; starts_at: string; venue_name: string; venue_address: string };
    ticket_tiers: { name: string };
  } | null;

  if (!typedData) return null;

  // Finding 3 fix: generate a 1-hour signed URL instead of exposing raw path
  const pdfPath = await getSignedPdfUrl(supabase, typedData.pdf_path);

  return {
    eventName: typedData.events.name,
    guestName: typedData.guests.full_name,
    tierName: typedData.ticket_tiers.name,
    startsAt: typedData.events.starts_at,
    venueName: typedData.events.venue_name,
    venueAddress: typedData.events.venue_address,
    publicId: typedData.public_id,
    status: typedData.status,
    pdfPath
  };
}

export async function getAdminMetrics(): Promise<AdminDashboardMetrics> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { activeEvents: 0, paidOrders: 0, ticketsIssued: 0, grossRevenuePence: 0, deliveryFailures: 0 };
  }

  const [{ count: activeEvents }, { count: paidOrders }, { count: ticketsIssued }, orderTotals, failedDeliveries] =
    await Promise.all([
      supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "paid"),
      supabase.from("tickets").select("*", { count: "exact", head: true }).eq("status", "issued"),
      supabase.from("orders").select("total_pence").eq("status", "paid"),
      supabase.from("email_deliveries").select("*", { count: "exact", head: true }).eq("status", "failed")
    ]);

  const grossRevenuePence =
    ((orderTotals.data as Array<{ total_pence: number | null }> | null) ?? []).reduce(
      (sum, order) => sum + (order.total_pence ?? 0),
      0
    );

  return {
    activeEvents: activeEvents ?? 0,
    paidOrders: paidOrders ?? 0,
    ticketsIssued: ticketsIssued ?? 0,
    grossRevenuePence,
    deliveryFailures: failedDeliveries.count ?? 0
  };
}

export async function getAdminOrders(): Promise<AdminOrderRecord[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("orders")
    .select(`
      id,
      buyer_name,
      buyer_email,
      total_pence,
      currency,
      status,
      stripe_checkout_session_id,
      created_at,
      events(name),
      order_items(quantity)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    ((data as Array<{
      id: string;
      buyer_name: string;
      buyer_email: string;
      total_pence: number;
      currency: string;
      status: "pending" | "paid" | "failed" | "refunded";
      stripe_checkout_session_id: string | null;
      created_at: string;
      events: { name: string } | { name: string }[] | null;
      order_items: Array<{ quantity: number }> | null;
    }> | null) ?? []).map((order) => ({
      id: order.id,
      buyer_name: order.buyer_name,
      buyer_email: order.buyer_email,
      total_pence: order.total_pence,
      currency: order.currency,
      status: order.status,
      stripe_checkout_session_id: order.stripe_checkout_session_id,
      created_at: order.created_at,
      event_name: Array.isArray(order.events) ? order.events[0]?.name : order.events?.name,
      ticket_count: (order.order_items ?? []).reduce((sum, item) => sum + item.quantity, 0)
    }))
  );
}

export async function getAdminOrderDetail(orderId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data: order } = await supabase
    .from("orders")
    .select(`
      id, buyer_name, buyer_email, buyer_phone,
      total_pence, currency, status,
      stripe_checkout_session_id, stripe_payment_intent_id,
      created_at,
      events(id, name, slug, starts_at, venue_name),
      order_items(id, quantity, ticket_tiers(name, price_gbp))
    `)
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, public_id, status, pdf_path, guests!inner(full_name)")
    .eq("guests.order_id", orderId);

  const { data: emailLogs } = await supabase
    .from("email_deliveries")
    .select("id, status, recipient_email, provider_message_id, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  const typedTickets = (tickets ?? []) as Array<{
    id: string; public_id: string; status: string; pdf_path: string | null;
    guests: { full_name: string } | null;
  }>;

  const signedTickets = await Promise.all(
    typedTickets.map(async (t) => ({
      id: t.id,
      public_id: t.public_id,
      status: t.status,
      guest_name: t.guests?.full_name ?? "",
      pdf_url: await getSignedPdfUrl(supabase, t.pdf_path)
    }))
  );

  return { order, tickets: signedTickets, emailLogs: emailLogs ?? [] };
}

export async function getAdminAllEventBundles(): Promise<TicketBundle[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false });

  const typedEvents = (events as EventRecord[] | null) ?? [];
  if (!typedEvents.length) return [];

  const eventIds = typedEvents.map((e: EventRecord) => e.id);
  const { data: tiers } = await supabase
    .from("ticket_tiers")
    .select("*")
    .in("event_id", eventIds)
    .order("price_gbp", { ascending: true });

  const typedTiers = (tiers as TicketTierRecord[] | null) ?? [];

  return typedEvents.map((event: EventRecord) => ({
    event,
    tiers: typedTiers.filter((tier: TicketTierRecord) => tier.event_id === event.id)
  }));
}

export async function getAdminEventById(id: string): Promise<TicketBundle | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!event) return null;

  const { data: tiers } = await supabase
    .from("ticket_tiers")
    .select("*")
    .eq("event_id", id)
    .order("price_gbp", { ascending: true });

  return {
    event: event as EventRecord,
    tiers: (tiers as TicketTierRecord[] | null) ?? []
  };
}

export async function getAdminTickets(): Promise<AdminTicketRecord[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("tickets")
    .select(`
      id,
      public_id,
      status,
      pdf_path,
      guests!inner(full_name),
      events!inner(name)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (data as Array<{
    id: string;
    public_id: string;
    status: "issued" | "used" | "void";
    pdf_path: string | null;
    guests: { full_name: string };
    events: { name: string };
  }> | null) ?? [];

  // Finding 3 fix: sign all PDF paths in one pass
  return Promise.all(
    rows.map(async (item) => ({
      id: item.id,
      public_id: item.public_id,
      status: item.status,
      pdf_path: await getSignedPdfUrl(supabase, item.pdf_path),
      guest_name: item.guests.full_name,
      event_name: item.events.name
    }))
  );
}
