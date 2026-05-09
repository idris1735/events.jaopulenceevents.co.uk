import Link from "next/link";

import { requireAdminSession } from "@/lib/auth";
import { getAdminAllEventBundles } from "@/lib/data";
import { CloneEventButton } from "@/components/admin/clone-event-button";
import { formatCurrencyPounds, formatDateTime } from "@/lib/utils";
import { EventStatus } from "@/lib/types";

const STATUS_COLOR: Record<EventStatus, string> = {
  published: "#b8d98a",
  draft:     "#f5c842",
  archived:  "var(--muted)"
};

const STATUS_LABEL: Record<EventStatus, string> = {
  published: "Published",
  draft:     "Draft",
  archived:  "Archived"
};

export default async function AdminEventsPage() {
  await requireAdminSession();
  const bundles = await getAdminAllEventBundles();

  const published = bundles.filter(b => b.event.status === "published");
  const drafts    = bundles.filter(b => b.event.status === "draft");
  const archived  = bundles.filter(b => b.event.status === "archived");

  return (
    <div>
      {/* Page header */}
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
          <p className="kicker" style={{ marginBottom: "0.3rem" }}>Events</p>
          <h1 className="section-title" style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>
            All events
          </h1>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--faint)" }}>
            {published.length} published · {drafts.length} draft · {archived.length} archived
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="button"
          style={{ flexShrink: 0, alignSelf: "center" }}
        >
          + New event
        </Link>
      </div>

      {bundles.length === 0 ? (
        <div
          style={{
            padding: "3rem 2rem",
            borderRadius: "16px",
            border: "1px dashed rgba(212,175,55,0.2)",
            textAlign: "center"
          }}
        >
          <p style={{ margin: "0 0 1.2rem", color: "var(--faint)", fontSize: "0.9rem" }}>
            No events yet. Create your first event to get started.
          </p>
          <Link href="/admin/events/new" className="button">
            Create first event
          </Link>
        </div>
      ) : (
        <div className="stack" style={{ gap: "1rem" }}>
          {bundles.map(({ event, tiers }) => {
            const totalCapacity  = tiers.reduce((s, t) => s + t.capacity, 0);
            const totalRemaining = tiers.reduce((s, t) => s + t.remaining, 0);
            const sold           = totalCapacity - totalRemaining;
            const pctSold        = totalCapacity > 0 ? Math.round((sold / totalCapacity) * 100) : 0;
            const barColor       = pctSold >= 90 ? "#f5a5a5" : pctSold >= 70 ? "#f5c842" : "var(--gold-soft)";
            const statusColor    = STATUS_COLOR[event.status];

            return (
              <div
                key={event.id}
                className="panel"
                style={{ padding: "1.4rem 1.6rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "1rem",
                    marginBottom: tiers.length > 0 ? "1.1rem" : 0,
                    flexWrap: "wrap"
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                      <h2
                        style={{
                          margin: 0,
                          fontFamily: "var(--font-display)",
                          fontSize: "1.2rem",
                          color: "var(--text-strong)",
                          lineHeight: 1.2
                        }}
                      >
                        {event.name}
                      </h2>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          letterSpacing: "0.15rem",
                          textTransform: "uppercase",
                          fontWeight: 700,
                          color: statusColor,
                          padding: "0.2rem 0.6rem",
                          borderRadius: "6px",
                          border: `1px solid ${statusColor}33`,
                          background: `${statusColor}11`
                        }}
                      >
                        {STATUS_LABEL[event.status]}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
                      {formatDateTime(event.starts_at)} · {event.venue_name}
                    </p>
                    {tiers.length > 0 && (
                      <p style={{ margin: "0.15rem 0 0", fontSize: "0.78rem", color: "var(--faint)" }}>
                        {tiers.length} tier{tiers.length !== 1 ? "s" : ""} ·{" "}
                        from {formatCurrencyPounds(Math.min(...tiers.map(t => t.price_gbp)))}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, flexWrap: "wrap", alignItems: "flex-start" }}>
                    {event.status === "published" && (
                      <Link
                        href={`/events/${event.slug}`}
                        className="button-ghost"
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: "0.78rem", padding: "0.38rem 0.8rem" }}
                      >
                        View
                      </Link>
                    )}
                    <CloneEventButton eventId={event.id} />
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="button-secondary"
                      style={{ fontSize: "0.78rem", padding: "0.38rem 0.9rem" }}
                    >
                      Manage
                    </Link>
                  </div>
                </div>

                {/* Capacity bar (only if tiers exist) */}
                {tiers.length > 0 && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.4rem",
                        fontSize: "0.74rem",
                        color: "var(--muted)"
                      }}
                    >
                      <span>{sold} sold of {totalCapacity}</span>
                      <span style={{ color: barColor, fontWeight: 700 }}>{pctSold}%</span>
                    </div>
                    <div className="cap-bar">
                      <div className="cap-bar__fill" style={{ width: `${pctSold}%`, background: barColor }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
