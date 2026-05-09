import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdminSession } from "@/lib/auth";
import { getAdminOrderDetail } from "@/lib/data";
import { formatCurrencyPounds, formatDateTime } from "@/lib/utils";
import { ResendOrderButton } from "@/components/admin/resend-order-button";

export const metadata: Metadata = { title: "Order Detail — Admin" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  const { id }  = await params;
  const detail  = await getAdminOrderDetail(id);
  if (!detail) notFound();

  const { order, tickets, emailLogs } = detail;
  const isOwner = session.profile.role === "owner";

  const o = order as {
    id: string; buyer_name: string; buyer_email: string; buyer_phone?: string;
    total_pence: number; currency: string; status: string;
    stripe_checkout_session_id?: string; stripe_payment_intent_id?: string;
    created_at: string;
    events: { id: string; name: string; slug: string; starts_at: string; venue_name: string } | null;
    order_items: Array<{ id: string; quantity: number; ticket_tiers: { name: string; price_gbp: number } | null }> | null;
  };

  const statusColor = (s: string) =>
    s === "paid" || s === "sent" || s === "issued" ? "#b8d98a"
    : s === "failed" || s === "void" ? "#f5a5a5"
    : s === "pending" || s === "skipped" ? "#f5c842"
    : "var(--muted)";

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/admin/orders" style={{ fontSize: "0.78rem", color: "var(--muted)", textDecoration: "none" }}>
          &larr; All orders
        </Link>
        <p className="kicker" style={{ marginBottom: "0.3rem", marginTop: "0.8rem" }}>Order detail</p>
        <h1 className="section-title" style={{ fontSize: "1.8rem", marginBottom: "0.3rem" }}>
          {o.buyer_name}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span className="status-pill" data-status={o.status}>{o.status}</span>
          <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
            {formatDateTime(o.created_at)}
          </span>
          {isOwner && o.status === "paid" && <ResendOrderButton orderId={o.id} />}
        </div>
      </div>

      <div className="stack" style={{ gap: "1.4rem" }}>

        {/* ── Buyer + payment ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="panel" style={{ padding: "1.4rem 1.6rem" }}>
            <p className="kicker" style={{ marginBottom: "0.8rem", fontSize: "0.58rem" }}>Buyer</p>
            <div className="stack" style={{ gap: "0.45rem" }}>
              <Row label="Name"  value={o.buyer_name} />
              <Row label="Email" value={o.buyer_email} />
              {o.buyer_phone && <Row label="Phone" value={o.buyer_phone} />}
            </div>
          </div>
          <div className="panel" style={{ padding: "1.4rem 1.6rem" }}>
            <p className="kicker" style={{ marginBottom: "0.8rem", fontSize: "0.58rem" }}>Payment</p>
            <div className="stack" style={{ gap: "0.45rem" }}>
              <Row label="Total"  value={formatCurrencyPounds(o.total_pence / 100)} gold />
              <Row label="Status" value={o.status} statusColor={statusColor(o.status)} />
              {o.stripe_checkout_session_id && (
                <Row label="Session" value={o.stripe_checkout_session_id} mono truncate />
              )}
              {o.stripe_payment_intent_id && (
                <Row label="Intent" value={o.stripe_payment_intent_id} mono truncate />
              )}
            </div>
          </div>
        </div>

        {/* ── Event + items ── */}
        {o.events && (
          <div className="panel" style={{ padding: "1.4rem 1.6rem" }}>
            <p className="kicker" style={{ marginBottom: "0.8rem", fontSize: "0.58rem" }}>Event</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: "0.95rem" }}>{o.events.name}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                  {formatDateTime(o.events.starts_at)} &middot; {o.events.venue_name}
                </div>
              </div>
              <Link
                href={`/admin/events/${o.events.id}`}
                className="button-ghost"
                style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem" }}
              >
                Manage event
              </Link>
            </div>

            {(o.order_items ?? []).length > 0 && (
              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {(o.order_items ?? []).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "0.6rem 0.8rem", borderRadius: "8px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      fontSize: "0.84rem"
                    }}
                  >
                    <span style={{ color: "var(--text)" }}>
                      {item.ticket_tiers?.name ?? "Ticket"} &times; {item.quantity}
                    </span>
                    <span style={{ color: "var(--gold-soft)", fontWeight: 700 }}>
                      {item.ticket_tiers ? formatCurrencyPounds(item.ticket_tiers.price_gbp * item.quantity) : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Issued tickets ── */}
        <div className="panel" style={{ padding: "1.4rem 1.6rem" }}>
          <p className="kicker" style={{ marginBottom: "0.8rem", fontSize: "0.58rem" }}>
            Tickets ({tickets.length})
          </p>
          {tickets.length === 0 ? (
            <p style={{ color: "var(--faint)", fontSize: "0.85rem", margin: 0 }}>
              No tickets issued yet — webhook may still be processing.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {tickets.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: "1rem", flexWrap: "wrap",
                    padding: "0.7rem 0.9rem", borderRadius: "10px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.86rem", color: "var(--text-strong)" }}>
                      {t.guest_name || "Guest"}
                    </div>
                    <code style={{ fontSize: "0.72rem", color: "var(--faint)", fontFamily: "monospace" }}>
                      {t.public_id}
                    </code>
                  </div>
                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", color: statusColor(t.status), fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {t.status}
                    </span>
                    <Link
                      href={`/ticket/${t.public_id}`}
                      target="_blank"
                      className="button-ghost"
                      style={{ fontSize: "0.74rem", padding: "0.25rem 0.65rem" }}
                    >
                      View
                    </Link>
                    {t.pdf_url && (
                      <a
                        href={t.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="button-ghost"
                        style={{ fontSize: "0.74rem", padding: "0.25rem 0.65rem" }}
                      >
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Email delivery log ── */}
        <div className="panel" style={{ padding: "1.4rem 1.6rem" }}>
          <p className="kicker" style={{ marginBottom: "0.8rem", fontSize: "0.58rem" }}>
            Email delivery log
          </p>
          {emailLogs.length === 0 ? (
            <p style={{ color: "var(--faint)", fontSize: "0.85rem", margin: 0 }}>No email attempts recorded.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {(emailLogs as Array<{ id: string; status: string; recipient_email: string; provider_message_id?: string; created_at: string }>).map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: "1rem", flexWrap: "wrap",
                    padding: "0.65rem 0.9rem", borderRadius: "8px",
                    background: "rgba(255,255,255,0.015)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    fontSize: "0.82rem"
                  }}
                >
                  <div>
                    <span style={{ color: statusColor(log.status), fontWeight: 600, textTransform: "capitalize", marginRight: "0.6rem" }}>
                      {log.status}
                    </span>
                    <span style={{ color: "var(--muted)" }}>{log.recipient_email}</span>
                  </div>
                  <span style={{ color: "var(--faint)", fontSize: "0.74rem" }}>
                    {formatDateTime(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function Row({
  label, value, gold, statusColor, mono, truncate
}: {
  label: string; value: string;
  gold?: boolean; statusColor?: string; mono?: boolean; truncate?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", fontSize: "0.84rem" }}>
      <span style={{ color: "var(--faint)", flexShrink: 0 }}>{label}</span>
      <span style={{
        color: gold ? "var(--gold-soft)" : statusColor ?? "var(--text)",
        fontWeight: gold ? 700 : 500,
        fontFamily: mono ? "monospace" : undefined,
        fontSize: mono ? "0.74rem" : undefined,
        textOverflow: truncate ? "ellipsis" : undefined,
        overflow: truncate ? "hidden" : undefined,
        maxWidth: truncate ? "200px" : undefined,
        whiteSpace: truncate ? "nowrap" : undefined
      }}>
        {value}
      </span>
    </div>
  );
}
