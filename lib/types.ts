export type EventStatus = "draft" | "published" | "archived";
export type TicketTierStatus = "active" | "sold_out" | "hidden";
export type OrderStatus = "pending" | "paid" | "failed" | "refunded";
export type TicketStatus = "issued" | "used" | "void";
export type AdminRole = "owner" | "staff";

export interface EventRecord {
  id: string;
  name: string;
  slug: string;
  status: EventStatus;
  summary: string;
  description: string;
  venue_name: string;
  venue_address: string;
  starts_at: string;
  ends_at: string;
  hero_label: string;
  dress_code: string;
  sales_start_at: string;
  sales_end_at: string;
  gallery: string[];
  policies: {
    refund: string;
    privacy: string;
    terms: string;
  };
}

export interface TicketTierRecord {
  id: string;
  event_id: string;
  name: string;
  description: string;
  price_gbp: number;
  capacity: number;
  remaining: number;
  max_per_order: number;
  guests_per_unit: number;
  status: TicketTierStatus;
}

export interface TicketBundle {
  event: EventRecord;
  tiers: TicketTierRecord[];
}

export interface TicketLookupRecord {
  eventName: string;
  guestName: string;
  tierName: string;
  startsAt: string;
  venueName: string;
  venueAddress: string;
  publicId: string;
  status: TicketStatus;
  pdfPath?: string | null;
}

export interface AdminProfileRecord {
  id: string;
  supabase_user_id: string;
  display_name: string;
  role: AdminRole;
}

export interface AdminDashboardMetrics {
  activeEvents: number;
  paidOrders: number;
  ticketsIssued: number;
  grossRevenuePence: number;
  deliveryFailures: number;
}

export interface AdminOrderRecord {
  id: string;
  buyer_name: string;
  buyer_email: string;
  total_pence: number;
  currency: string;
  status: OrderStatus;
  event_name?: string;
  ticket_count?: number;
  stripe_checkout_session_id?: string | null;
  created_at: string;
}

export interface AdminTicketRecord {
  id: string;
  public_id: string;
  status: TicketStatus;
  pdf_path?: string | null;
  guest_name: string;
  event_name: string;
}
