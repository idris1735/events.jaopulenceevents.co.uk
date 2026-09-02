import { EventRecord, TicketBundle } from "@/lib/types";

const event: EventRecord = {
  id: "ad40d369-f379-4f2a-a19f-41c5fe7d1f72",
  name: "Winter Masquerade Ball",
  slug: "winter-masquerade-ball",
  status: "published",
  summary: "A premium party experience bringing together culture, elegance, and connection.",
  description:
    "J&A Opulence Events proudly presents the Winter Masquerade Ball — a night of mystery, joy, and opulence. Cocktail reception, red carpet arrivals, live sax, DJ KK with a surprise DJ, live entertainment, bottomless drinks, and Best Masquerade awards for male and female guests. Dress with intention and step into a space that feels rare, elevated, and unforgettable.",
  venue_name: "Venue to be announced",
  venue_address: "Full venue details will be released to guests soon.",
  starts_at: "2099-12-31T20:00:00.000Z",
  ends_at: "2099-12-31T23:59:00.000Z",
  hero_label: "An Evening of Elegance",
  dress_code: "Masquerade ball eveningwear.",
  sales_start_at: "2026-04-01T00:00:00.000Z",
  sales_end_at: "2026-06-30T23:00:00.000Z",
  gallery: [
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80"
  ],
  policies: {
    refund: "Tickets are non-refundable unless the event is cancelled by the organiser.",
    privacy: "Guest information is used only for ticket delivery, event operations, and approved customer communication.",
    terms: "Ticket holders must present valid QR tickets at entry. Event management reserves the right to refuse entry for policy breaches."
  }
};

export const demoEventBundle: TicketBundle = {
  event,
  tiers: [
    {
      id: "tier_standard_single",
      event_id: event.id,
      name: "Standard Single",
      description: "Standard entry for one guest.",
      price_gbp: 85,
      capacity: 120,
      remaining: 120,
      max_per_order: 6,
      guests_per_unit: 1,
      status: "active"
    },
    {
      id: "tier_standard_couple",
      event_id: event.id,
      name: "Standard Couples",
      description: "Standard entry for two guests.",
      price_gbp: 165,
      capacity: 60,
      remaining: 60,
      max_per_order: 4,
      guests_per_unit: 2,
      status: "active"
    },
    {
      id: "tier_standard_group_10",
      event_id: event.id,
      name: "Standard Group of 10",
      description: "Group booking for ten guests.",
      price_gbp: 800,
      capacity: 12,
      remaining: 12,
      max_per_order: 1,
      guests_per_unit: 10,
      status: "active"
    },
    {
      id: "tier_vip_single",
      event_id: event.id,
      name: "VIP Experience Single",
      description: "VIP seated service plus a 3-course plated dinner for one guest.",
      price_gbp: 110,
      capacity: 80,
      remaining: 80,
      max_per_order: 6,
      guests_per_unit: 1,
      status: "active"
    },
    {
      id: "tier_vip_couple",
      event_id: event.id,
      name: "VIP Experience Couples",
      description: "VIP seated service plus a 3-course plated dinner for two guests.",
      price_gbp: 210,
      capacity: 40,
      remaining: 40,
      max_per_order: 4,
      guests_per_unit: 2,
      status: "active"
    },
    {
      id: "tier_vip_group_10",
      event_id: event.id,
      name: "VIP Experience Group of 10",
      description: "VIP group booking with seated service and 3-course plated dinner.",
      price_gbp: 1000,
      capacity: 10,
      remaining: 10,
      max_per_order: 1,
      guests_per_unit: 10,
      status: "active"
    }
  ]
};

export function getDemoEventBySlug(slug: string) {
  return demoEventBundle.event.slug === slug ? demoEventBundle : null;
}

export function getDemoEvents(): TicketBundle[] {
  return [demoEventBundle];
}
