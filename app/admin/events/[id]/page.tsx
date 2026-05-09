import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdminSession } from "@/lib/auth";
import { getAdminEventById } from "@/lib/data";
import { EventForm } from "@/components/admin/event-form";
import { TierManager } from "@/components/admin/tier-manager";
import { EventStatusToggle } from "@/components/admin/event-status-toggle";
import { TestFulfillmentPanel } from "@/components/admin/test-fulfillment-panel";
import { ResetInventoryButton } from "@/components/admin/reset-inventory-button";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage Event — Admin" };

export default async function ManageEventPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  const isOwner = session.profile.role === "owner";
  const { id } = await params;
  const bundle = await getAdminEventById(id);
  if (!bundle) notFound();

  const { event, tiers } = bundle;
  const totalSold = tiers.reduce((s, t) => s + (t.capacity - t.remaining), 0);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "2rem"
        }}
      >
        <div>
          <Link
            href="/admin/events"
            style={{ fontSize: "0.78rem", color: "var(--muted)", textDecoration: "none", letterSpacing: "0.05em" }}
          >
            ← All events
          </Link>
          <p className="kicker" style={{ marginBottom: "0.3rem", marginTop: "0.8rem" }}>Manage event</p>
          <h1
            className="section-title"
            style={{ fontSize: "1.8rem", marginBottom: "0.3rem", fontFamily: "var(--font-display)" }}
          >
            {event.name}
          </h1>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)" }}>
            {formatDateTime(event.starts_at)} · {event.venue_name}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
          {event.status === "published" && (
            <Link
              href={`/events/${event.slug}`}
              target="_blank"
              rel="noreferrer"
              className="button-ghost"
              style={{ fontSize: "0.8rem" }}
            >
              View live
            </Link>
          )}
          <a
            href={`/api/admin/export?eventId=${id}`}
            download
            className="button-ghost"
            style={{ fontSize: "0.8rem" }}
          >
            Export guests
          </a>
          <EventStatusToggle eventId={id} currentStatus={event.status} />
        </div>
      </div>

      {/* Stats bar */}
      {tiers.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            flexWrap: "wrap",
            padding: "1rem 1.4rem",
            borderRadius: "12px",
            border: "1px solid rgba(212,175,55,0.1)",
            background: "rgba(212,175,55,0.025)",
            marginBottom: "2rem"
          }}
        >
          <div>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.18rem", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>Tiers</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--gold-soft)" }}>{tiers.length}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.18rem", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>Tickets sold</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-strong)" }}>{totalSold}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.18rem", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>Total capacity</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-strong)" }}>{tiers.reduce((s, t) => s + t.capacity, 0)}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.18rem", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>Status</div>
            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: 700,
                textTransform: "capitalize",
                color: event.status === "published" ? "#b8d98a" : event.status === "draft" ? "#f5c842" : "var(--muted)"
              }}
            >
              {event.status}
            </div>
          </div>
        </div>
      )}

      <div className="stack" style={{ gap: "2.5rem" }}>

        {/* ── Ticket tiers ── */}
        <section>
          <div style={{ marginBottom: "1.2rem" }}>
            <p className="kicker" style={{ marginBottom: "0.2rem", fontSize: "0.6rem" }}>Ticket tiers</p>
            <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--text-strong)" }}>Pricing &amp; capacity</h2>
          </div>
          <div className="panel" style={{ padding: "1.6rem 1.8rem" }}>
            <TierManager eventId={id} initialTiers={tiers} />
          </div>
        </section>

        {/* ── Owner-only tools ── */}
        {isOwner && (
          <section>
            <div style={{ marginBottom: "1.2rem" }}>
              <p className="kicker" style={{ marginBottom: "0.2rem", fontSize: "0.6rem" }}>Testing</p>
              <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--text-strong)" }}>Simulate a sale</h2>
            </div>
            <TestFulfillmentPanel eventId={id} eventSlug={event.slug} tiers={tiers} />
          </section>
        )}

        {isOwner && (
          <section>
            <div style={{ marginBottom: "1.2rem" }}>
              <p className="kicker" style={{ marginBottom: "0.2rem", fontSize: "0.6rem", color: "#f5a5a5" }}>Data management</p>
              <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--text-strong)" }}>Reset &amp; cleanup</h2>
            </div>
            <ResetInventoryButton eventId={id} />
          </section>
        )}

        {/* ── Event details ── */}
        <section>
          <div style={{ marginBottom: "1.2rem" }}>
            <p className="kicker" style={{ marginBottom: "0.2rem", fontSize: "0.6rem" }}>Event details</p>
            <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--text-strong)" }}>Edit information</h2>
          </div>
          <div className="panel" style={{ padding: "2rem 2.2rem" }}>
            <EventForm mode="edit" eventId={id} initial={event} />
          </div>
        </section>

      </div>
    </div>
  );
}
