import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  await requireAdminSession();

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  let query = supabase
    .from("guests")
    .select(`
      full_name, email, phone,
      tickets(public_id, status, ticket_tiers(name), events(name, starts_at))
    `)
    .order("full_name", { ascending: true });

  // If eventId provided, filter to that event via the tickets join
  if (eventId) {
    query = supabase
      .from("tickets")
      .select(`
        public_id, status,
        ticket_tiers(name),
        events(name, starts_at),
        guests(full_name, email, phone)
      `)
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }) as typeof query;
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows: string[] = [];
  const header = ["Full Name", "Email", "Phone", "Ticket ID", "Ticket Status", "Tier", "Event", "Event Date"];
  rows.push(header.map(csvCell).join(","));

  if (eventId) {
    const tickets = (data ?? []) as Array<{
      public_id: string; status: string;
      ticket_tiers: { name: string } | null;
      events: { name: string; starts_at: string } | null;
      guests: { full_name: string; email: string; phone?: string } | null;
    }>;
    for (const t of tickets) {
      rows.push([
        t.guests?.full_name ?? "",
        t.guests?.email ?? "",
        t.guests?.phone ?? "",
        t.public_id,
        t.status,
        t.ticket_tiers?.name ?? "",
        t.events?.name ?? "",
        t.events?.starts_at ? new Date(t.events.starts_at).toLocaleDateString("en-GB") : ""
      ].map(csvCell).join(","));
    }
  } else {
    const guests = (data ?? []) as Array<{
      full_name: string; email: string; phone?: string;
      tickets: Array<{
        public_id: string; status: string;
        ticket_tiers: { name: string } | null;
        events: { name: string; starts_at: string } | null;
      }>;
    }>;
    for (const g of guests) {
      for (const t of (g.tickets ?? [])) {
        rows.push([
          g.full_name, g.email, g.phone ?? "",
          t.public_id, t.status,
          t.ticket_tiers?.name ?? "",
          t.events?.name ?? "",
          t.events?.starts_at ? new Date(t.events.starts_at).toLocaleDateString("en-GB") : ""
        ].map(csvCell).join(","));
      }
    }
  }

  const csv = rows.join("\r\n");
  const filename = eventId ? `guests-${eventId.slice(0, 8)}.csv` : "all-guests.csv";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}

function csvCell(value: string): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
