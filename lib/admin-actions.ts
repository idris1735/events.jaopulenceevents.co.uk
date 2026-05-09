"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { EventStatus, TicketTierStatus } from "@/lib/types";

export interface EventFormData {
  name: string;
  slug: string;
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
  policies_refund: string;
  policies_privacy: string;
  policies_terms: string;
  status: EventStatus;
}

export interface TierFormData {
  name: string;
  description: string;
  price_gbp: number;
  capacity: number;
  max_per_order: number;
  guests_per_unit: number;
  status: TicketTierStatus;
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateEvent(f: EventFormData): string | null {
  if (!f.name.trim())         return "Event name is required.";
  if (!f.slug.trim())         return "URL slug is required.";
  if (!/^[a-z0-9-]+$/.test(f.slug.trim()))
    return "Slug may only contain lowercase letters, numbers, and hyphens.";
  if (!f.summary.trim())      return "Short summary is required.";
  if (!f.venue_name.trim())   return "Venue name is required.";
  if (!f.venue_address.trim()) return "Venue address is required.";
  if (!f.starts_at)           return "Event start date is required.";
  if (!f.ends_at)             return "Event end date is required.";
  if (new Date(f.ends_at) <= new Date(f.starts_at))
    return "Event end must be after start.";
  return null;
}

function validateTier(f: TierFormData): string | null {
  if (!f.name.trim())    return "Tier name is required.";
  if (f.price_gbp < 0)  return "Price cannot be negative.";
  if (f.capacity < 1)   return "Capacity must be at least 1.";
  if (f.max_per_order < 1) return "Max per order must be at least 1.";
  if (f.guests_per_unit < 1) return "Guests per unit must be at least 1.";
  return null;
}

// ── Event CRUD (owner-only) ───────────────────────────────────────────────────

export async function createEvent(formData: EventFormData): Promise<{ error?: string }> {
  await requireAdminSession(true);

  const err = validateEvent(formData);
  if (err) return { error: err };

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { error: "Database unavailable." };

  const { data, error } = await supabase
    .from("events")
    .insert({
      name:          formData.name.trim(),
      slug:          formData.slug.trim().toLowerCase(),
      summary:       formData.summary.trim(),
      description:   formData.description.trim(),
      venue_name:    formData.venue_name.trim(),
      venue_address: formData.venue_address.trim(),
      starts_at:     formData.starts_at,
      ends_at:       formData.ends_at,
      hero_label:    formData.hero_label.trim(),
      dress_code:    formData.dress_code.trim(),
      sales_start_at: formData.sales_start_at,
      sales_end_at:   formData.sales_end_at,
      gallery:       formData.gallery.filter(Boolean),
      policies: {
        refund:  formData.policies_refund.trim(),
        privacy: formData.policies_privacy.trim(),
        terms:   formData.policies_terms.trim()
      },
      status: formData.status
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  redirect(`/admin/events/${data.id}`);
}

export async function updateEvent(id: string, formData: EventFormData): Promise<{ error?: string }> {
  await requireAdminSession(true);

  const err = validateEvent(formData);
  if (err) return { error: err };

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { error: "Database unavailable." };

  const { error } = await supabase
    .from("events")
    .update({
      name:          formData.name.trim(),
      slug:          formData.slug.trim().toLowerCase(),
      summary:       formData.summary.trim(),
      description:   formData.description.trim(),
      venue_name:    formData.venue_name.trim(),
      venue_address: formData.venue_address.trim(),
      starts_at:     formData.starts_at,
      ends_at:       formData.ends_at,
      hero_label:    formData.hero_label.trim(),
      dress_code:    formData.dress_code.trim(),
      sales_start_at: formData.sales_start_at,
      sales_end_at:   formData.sales_end_at,
      gallery:       formData.gallery.filter(Boolean),
      policies: {
        refund:  formData.policies_refund.trim(),
        privacy: formData.policies_privacy.trim(),
        terms:   formData.policies_terms.trim()
      },
      status: formData.status
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
  return {};
}

export async function setEventStatus(id: string, status: EventStatus): Promise<{ error?: string }> {
  await requireAdminSession(true);

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { error: "Database unavailable." };

  // Publish readiness check: must have at least one active tier
  if (status === "published") {
    const { count } = await supabase
      .from("ticket_tiers")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id)
      .eq("status", "active");

    if (!count || count === 0) {
      return { error: "Add at least one active ticket tier before publishing." };
    }
  }

  const { error } = await supabase.from("events").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
  return {};
}

export async function cloneEvent(sourceId: string): Promise<{ error?: string }> {
  await requireAdminSession(true);

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { error: "Database unavailable." };

  const { data: source } = await supabase
    .from("events")
    .select("*")
    .eq("id", sourceId)
    .maybeSingle();

  if (!source) return { error: "Source event not found." };

  const { data: sourceTiers } = await supabase
    .from("ticket_tiers")
    .select("*")
    .eq("event_id", sourceId)
    .neq("status", "hidden");

  // Generate a unique slug with a short timestamp suffix
  const newSlug = `${source.slug}-${Date.now().toString(36)}`;

  const { data: newEvent, error: eventErr } = await supabase
    .from("events")
    .insert({
      name:          `${source.name} (Copy)`,
      slug:          newSlug,
      summary:       source.summary,
      description:   source.description,
      venue_name:    source.venue_name,
      venue_address: source.venue_address,
      starts_at:     source.starts_at,
      ends_at:       source.ends_at,
      hero_label:    source.hero_label,
      dress_code:    source.dress_code,
      sales_start_at: source.sales_start_at,
      sales_end_at:   source.sales_end_at,
      gallery:       source.gallery,
      policies:      source.policies,
      status:        "draft"
    })
    .select("id")
    .single();

  if (eventErr || !newEvent) return { error: eventErr?.message ?? "Clone failed." };

  if (sourceTiers && sourceTiers.length > 0) {
    await supabase.from("ticket_tiers").insert(
      sourceTiers.map((t: { name: string; description: string; price_gbp: number; capacity: number; max_per_order: number; guests_per_unit?: number }) => ({
        event_id:        newEvent.id,
        name:            t.name,
        description:     t.description,
        price_gbp:       t.price_gbp,
        capacity:        t.capacity,
        remaining:       t.capacity,
        max_per_order:   t.max_per_order,
        guests_per_unit: t.guests_per_unit ?? 1,
        status:          "active" as TicketTierStatus
      }))
    );
  }

  revalidatePath("/admin/events");
  redirect(`/admin/events/${newEvent.id}`);
}

// ── Tier CRUD (any admin) ─────────────────────────────────────────────────────

export async function createTier(eventId: string, formData: TierFormData): Promise<{ error?: string }> {
  await requireAdminSession();

  const err = validateTier(formData);
  if (err) return { error: err };

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { error: "Database unavailable." };

  const { error } = await supabase.from("ticket_tiers").insert({
    event_id:        eventId,
    name:            formData.name.trim(),
    description:     formData.description.trim(),
    price_gbp:       formData.price_gbp,
    capacity:        formData.capacity,
    remaining:       formData.capacity,
    max_per_order:   formData.max_per_order,
    guests_per_unit: formData.guests_per_unit,
    status:          formData.status
  });

  if (error) return { error: error.message };
  revalidatePath(`/admin/events/${eventId}`);
  return {};
}

export async function updateTier(tierId: string, eventId: string, formData: TierFormData): Promise<{ error?: string; newRemaining?: number }> {
  await requireAdminSession();

  const err = validateTier(formData);
  if (err) return { error: err };

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { error: "Database unavailable." };

  // Fetch current tier to recalculate remaining from actual sold count
  const { data: current } = await supabase
    .from("ticket_tiers")
    .select("capacity, remaining")
    .eq("id", tierId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (!current) return { error: "Tier not found." };

  const sold         = current.capacity - current.remaining;
  const newRemaining = Math.max(0, formData.capacity - sold);

  const { error } = await supabase
    .from("ticket_tiers")
    .update({
      name:            formData.name.trim(),
      description:     formData.description.trim(),
      price_gbp:       formData.price_gbp,
      capacity:        formData.capacity,
      remaining:       newRemaining,
      max_per_order:   formData.max_per_order,
      guests_per_unit: formData.guests_per_unit,
      status:          formData.status
    })
    .eq("id", tierId)
    .eq("event_id", eventId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/events/${eventId}`);
  return { newRemaining };
}

// Soft-hide instead of hard delete — preserves data for historical orders
export async function hideTier(tierId: string, eventId: string): Promise<{ error?: string }> {
  await requireAdminSession();

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { error: "Database unavailable." };

  const { error } = await supabase
    .from("ticket_tiers")
    .update({ status: "hidden" })
    .eq("id", tierId)
    .eq("event_id", eventId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/events/${eventId}`);
  return {};
}

export async function restoreTier(tierId: string, eventId: string): Promise<{ error?: string }> {
  await requireAdminSession();

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { error: "Database unavailable." };

  const { error } = await supabase
    .from("ticket_tiers")
    .update({ status: "active" })
    .eq("id", tierId)
    .eq("event_id", eventId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/events/${eventId}`);
  return {};
}
