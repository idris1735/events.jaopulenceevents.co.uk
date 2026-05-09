"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { createEvent, updateEvent, EventFormData } from "@/lib/admin-actions";
import { EventRecord, EventStatus } from "@/lib/types";

interface EventFormProps {
  mode: "create" | "edit";
  eventId?: string;
  initial?: Partial<EventRecord>;
}

function toDatetimeLocal(iso: string | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function EventForm({ mode, eventId, initial }: EventFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [name, setName]                   = useState(initial?.name ?? "");
  const [slug, setSlug]                   = useState(initial?.slug ?? "");
  const [summary, setSummary]             = useState(initial?.summary ?? "");
  const [description, setDescription]     = useState(initial?.description ?? "");
  const [venueName, setVenueName]         = useState(initial?.venue_name ?? "");
  const [venueAddress, setVenueAddress]   = useState(initial?.venue_address ?? "");
  const [startsAt, setStartsAt]           = useState(toDatetimeLocal(initial?.starts_at));
  const [endsAt, setEndsAt]               = useState(toDatetimeLocal(initial?.ends_at));
  const [heroLabel, setHeroLabel]         = useState(initial?.hero_label ?? "");
  const [dressCode, setDressCode]         = useState(initial?.dress_code ?? "");
  const [salesStart, setSalesStart]       = useState(toDatetimeLocal(initial?.sales_start_at));
  const [salesEnd, setSalesEnd]           = useState(toDatetimeLocal(initial?.sales_end_at));
  const [gallery, setGallery]             = useState((initial?.gallery ?? []).join("\n"));
  const [policyRefund, setPolicyRefund]   = useState(initial?.policies?.refund ?? "All sales are final. No refunds.");
  const [policyPrivacy, setPolicyPrivacy] = useState(initial?.policies?.privacy ?? "Guest data is used solely for this event.");
  const [policyTerms, setPolicyTerms]     = useState(initial?.policies?.terms ?? "By purchasing you agree to our terms of entry.");
  const [status, setStatus]               = useState<EventStatus>(initial?.status ?? "draft");

  function handleNameChange(value: string) {
    setName(value);
    if (mode === "create") setSlug(slugify(value));
  }

  function buildPayload(): EventFormData {
    return {
      name, slug, summary, description,
      venue_name: venueName, venue_address: venueAddress,
      starts_at: startsAt ? new Date(startsAt).toISOString() : "",
      ends_at: endsAt ? new Date(endsAt).toISOString() : "",
      hero_label: heroLabel, dress_code: dressCode,
      sales_start_at: salesStart ? new Date(salesStart).toISOString() : "",
      sales_end_at: salesEnd ? new Date(salesEnd).toISOString() : "",
      gallery: gallery.split("\n").map(s => s.trim()).filter(Boolean),
      policies_refund: policyRefund,
      policies_privacy: policyPrivacy,
      policies_terms: policyTerms,
      status
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      if (mode === "create") {
        const result = await createEvent(buildPayload());
        if (result?.error) setError(result.error);
      } else {
        const result = await updateEvent(eventId!, buildPayload());
        if (result?.error) setError(result.error);
        else setSaved(true);
      }
    });
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.65rem 0.9rem",
    borderRadius: "10px",
    border: "1px solid rgba(212,175,55,0.2)",
    background: "rgba(255,255,255,0.04)",
    color: "var(--text)",
    fontSize: "0.88rem",
    outline: "none",
    boxSizing: "border-box"
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.62rem",
    letterSpacing: "0.18rem",
    textTransform: "uppercase",
    color: "var(--muted)",
    fontWeight: 700,
    display: "block",
    marginBottom: "0.4rem"
  };

  const rowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem"
  };

  return (
    <form onSubmit={handleSubmit} className="stack" style={{ gap: "1.4rem" }}>

      {/* Name + slug */}
      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Event name *</label>
          <input
            style={fieldStyle}
            type="text"
            required
            value={name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="Summer Gala 2026"
          />
        </div>
        <div>
          <label style={labelStyle}>URL slug *</label>
          <input
            style={fieldStyle}
            type="text"
            required
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="summer-gala-2026"
          />
          <p style={{ margin: "0.3rem 0 0", fontSize: "0.7rem", color: "var(--faint)" }}>
            events.jaopulenceevents.co.uk/events/{slug || "…"}
          </p>
        </div>
      </div>

      {/* Hero label + dress code */}
      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Hero label</label>
          <input
            style={fieldStyle}
            type="text"
            value={heroLabel}
            onChange={e => setHeroLabel(e.target.value)}
            placeholder="An Evening of Elegance"
          />
        </div>
        <div>
          <label style={labelStyle}>Dress code</label>
          <input
            style={fieldStyle}
            type="text"
            value={dressCode}
            onChange={e => setDressCode(e.target.value)}
            placeholder="Black tie"
          />
        </div>
      </div>

      {/* Summary */}
      <div>
        <label style={labelStyle}>Short summary *</label>
        <input
          style={fieldStyle}
          type="text"
          required
          value={summary}
          onChange={e => setSummary(e.target.value)}
          placeholder="One-line description shown on event cards"
        />
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>Full description</label>
        <textarea
          style={{ ...fieldStyle, minHeight: "7rem", resize: "vertical" }}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe the event in detail..."
        />
      </div>

      {/* Venue */}
      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Venue name *</label>
          <input
            style={fieldStyle}
            type="text"
            required
            value={venueName}
            onChange={e => setVenueName(e.target.value)}
            placeholder="The Grand Ballroom"
          />
        </div>
        <div>
          <label style={labelStyle}>Venue address *</label>
          <input
            style={fieldStyle}
            type="text"
            required
            value={venueAddress}
            onChange={e => setVenueAddress(e.target.value)}
            placeholder="123 Mayfair, London W1K"
          />
        </div>
      </div>

      {/* Dates */}
      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Event starts *</label>
          <input
            style={fieldStyle}
            type="datetime-local"
            required
            value={startsAt}
            onChange={e => setStartsAt(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Event ends *</label>
          <input
            style={fieldStyle}
            type="datetime-local"
            required
            value={endsAt}
            onChange={e => setEndsAt(e.target.value)}
          />
        </div>
      </div>

      {/* Sales window */}
      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Sales open</label>
          <input
            style={fieldStyle}
            type="datetime-local"
            value={salesStart}
            onChange={e => setSalesStart(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Sales close</label>
          <input
            style={fieldStyle}
            type="datetime-local"
            value={salesEnd}
            onChange={e => setSalesEnd(e.target.value)}
          />
        </div>
      </div>

      {/* Gallery URLs */}
      <div>
        <label style={labelStyle}>Gallery image URLs</label>
        <textarea
          style={{ ...fieldStyle, minHeight: "5rem", resize: "vertical", fontFamily: "monospace", fontSize: "0.78rem" }}
          value={gallery}
          onChange={e => setGallery(e.target.value)}
          placeholder={"https://…/image1.jpg\nhttps://…/image2.jpg"}
        />
        <p style={{ margin: "0.3rem 0 0", fontSize: "0.7rem", color: "var(--faint)" }}>
          One URL per line
        </p>
      </div>

      {/* Policies */}
      <div>
        <p style={{ ...labelStyle, marginBottom: "0.8rem" }}>Policies</p>
        <div className="stack" style={{ gap: "0.8rem" }}>
          <div>
            <label style={labelStyle}>Refund policy</label>
            <textarea
              style={{ ...fieldStyle, minHeight: "3.5rem", resize: "vertical" }}
              value={policyRefund}
              onChange={e => setPolicyRefund(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Privacy policy</label>
            <textarea
              style={{ ...fieldStyle, minHeight: "3.5rem", resize: "vertical" }}
              value={policyPrivacy}
              onChange={e => setPolicyPrivacy(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Terms of entry</label>
            <textarea
              style={{ ...fieldStyle, minHeight: "3.5rem", resize: "vertical" }}
              value={policyTerms}
              onChange={e => setPolicyTerms(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <label style={labelStyle}>Status</label>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          {(["draft", "published", "archived"] as EventStatus[]).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              style={{
                padding: "0.5rem 1.1rem",
                borderRadius: "8px",
                border: `1px solid ${status === s ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.1)"}`,
                background: status === s ? "rgba(212,175,55,0.12)" : "transparent",
                color: status === s ? "var(--gold-soft)" : "var(--muted)",
                fontSize: "0.78rem",
                fontWeight: 600,
                textTransform: "capitalize",
                cursor: "pointer",
                letterSpacing: "0.05em"
              }}
            >
              {s}
            </button>
          ))}
        </div>
        {status === "draft" && (
          <p style={{ margin: "0.4rem 0 0", fontSize: "0.74rem", color: "var(--faint)" }}>
            Draft events are invisible to the public. Publish when ready.
          </p>
        )}
      </div>

      {/* Feedback */}
      {error && (
        <p style={{ margin: 0, padding: "0.85rem 1rem", borderRadius: "10px", fontSize: "0.82rem", color: "#f5a5a5", background: "rgba(201,75,75,0.08)", border: "1px solid rgba(201,75,75,0.2)" }}>
          {error}
        </p>
      )}
      {saved && (
        <p style={{ margin: 0, padding: "0.85rem 1rem", borderRadius: "10px", fontSize: "0.82rem", color: "#b8d98a", background: "rgba(136,168,97,0.08)", border: "1px solid rgba(136,168,97,0.2)" }}>
          Event saved successfully.
        </p>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
        <button
          className="button"
          type="submit"
          disabled={pending}
          style={{ minWidth: "140px" }}
        >
          {pending ? "Saving..." : mode === "create" ? "Create event" : "Save changes"}
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={() => router.push("/admin/events")}
          disabled={pending}
        >
          Cancel
        </button>
      </div>

    </form>
  );
}
