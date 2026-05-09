export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: "draft" | "published" | "archived";
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
          policies: Json;
          gallery: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          status?: "draft" | "published" | "archived";
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
          policies?: Json;
          gallery?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
      };
      ticket_tiers: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          description: string;
          price_gbp: number;
          capacity: number;
          remaining: number;
          max_per_order: number;
          status: "active" | "sold_out" | "hidden";
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          description: string;
          price_gbp: number;
          capacity: number;
          remaining: number;
          max_per_order?: number;
          status?: "active" | "sold_out" | "hidden";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ticket_tiers"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          event_id: string;
          stripe_checkout_session_id: string;
          stripe_payment_intent_id: string | null;
          buyer_name: string;
          buyer_email: string;
          buyer_phone: string;
          total_pence: number;
          currency: string;
          status: "pending" | "paid" | "failed" | "refunded";
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          stripe_checkout_session_id: string;
          stripe_payment_intent_id?: string | null;
          buyer_name: string;
          buyer_email: string;
          buyer_phone: string;
          total_pence: number;
          currency?: string;
          status?: "pending" | "paid" | "failed" | "refunded";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          ticket_tier_id: string;
          quantity: number;
          unit_price_pence: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          ticket_tier_id: string;
          quantity: number;
          unit_price_pence: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      guests: {
        Row: {
          id: string;
          order_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          guest_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          guest_index: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["guests"]["Insert"]>;
      };
      tickets: {
        Row: {
          id: string;
          guest_id: string;
          event_id: string;
          ticket_tier_id: string;
          public_id: string;
          qr_payload: string;
          pdf_path: string | null;
          status: "issued" | "used" | "void";
          created_at: string;
        };
        Insert: {
          id?: string;
          guest_id: string;
          event_id: string;
          ticket_tier_id: string;
          public_id: string;
          qr_payload: string;
          pdf_path?: string | null;
          status?: "issued" | "used" | "void";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tickets"]["Insert"]>;
      };
      webhook_events: {
        Row: {
          stripe_event_id: string;
          type: string;
          status: string;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          stripe_event_id: string;
          type: string;
          status: string;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["webhook_events"]["Insert"]>;
      };
      admin_profiles: {
        Row: {
          id: string;
          supabase_user_id: string;
          display_name: string;
          role: "owner" | "staff";
          created_at: string;
        };
        Insert: {
          id?: string;
          supabase_user_id: string;
          display_name: string;
          role: "owner" | "staff";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_profiles"]["Insert"]>;
      };
      email_deliveries: {
        Row: {
          id: string;
          order_id: string;
          provider: string;
          status: string;
          recipient_email: string;
          provider_message_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          provider: string;
          status: string;
          recipient_email: string;
          provider_message_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_deliveries"]["Insert"]>;
      };
    };
    Functions: {
      reserve_ticket_inventory: {
        Args: {
          target_tier_id: string;
          requested_qty: number;
        };
        Returns: {
          success: boolean;
          remaining: number | null;
          new_status: string | null;
        }[];
      };
    };
  };
}
