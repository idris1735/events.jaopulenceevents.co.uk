import Link from "next/link";

import { ResendOrderButton } from "@/components/admin/resend-order-button";
import { requireAdminSession } from "@/lib/auth";
import { getAdminOrders } from "@/lib/data";
import { formatCurrencyPounds } from "@/lib/utils";

function truncateRef(ref: string | null | undefined): string {
  if (!ref) return "—";
  return ref.length > 12 ? `…${ref.slice(-12)}` : ref;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export default async function AdminOrdersPage() {
  const session = await requireAdminSession();
  const orders  = await getAdminOrders();
  const isOwner = session.profile.role === "owner";

  const totalRevenue = orders
    .filter((o) => o.status === "paid")
    .reduce((s, o) => s + o.total_pence, 0);

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          marginBottom: "2rem",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div>
          <p className="kicker" style={{ marginBottom: "0.3rem" }}>Orders</p>
          <h1 className="section-title" style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>
            Payment activity
          </h1>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--faint)" }}>
            {orders.length} record{orders.length !== 1 ? "s" : ""}
            {totalRevenue > 0 && (
              <span style={{ color: "var(--gold-soft)", marginLeft: "0.5rem" }}>
                · {formatCurrencyPounds(totalRevenue / 100)} confirmed
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="table" style={{ minWidth: "720px" }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Buyer</th>
                <th>Event</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th style={{ textAlign: "center" }}>Qty</th>
                <th>Status</th>
                <th>Stripe ref</th>
                <th></th>
                {isOwner && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={isOwner ? 9 : 8}
                    style={{ textAlign: "center", color: "var(--faint)", padding: "3rem 2rem" }}
                  >
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td
                      style={{
                        color: "var(--muted)",
                        fontSize: "0.82rem",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {formatDate(order.created_at)}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{order.buyer_name}</div>
                      <div style={{ fontSize: "0.76rem", color: "var(--faint)", marginTop: "0.1rem" }}>
                        {order.buyer_email}
                      </div>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: "0.86rem" }}>
                      {order.event_name ?? "—"}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--gold-soft)" }}>
                      {formatCurrencyPounds(order.total_pence / 100)}
                    </td>
                    <td style={{ textAlign: "center", color: "var(--muted)" }}>
                      {order.ticket_count ?? "—"}
                    </td>
                    <td>
                      <span className="status-pill" data-status={order.status}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <code
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--faint)",
                          fontFamily: "monospace",
                          background: "rgba(255,255,255,0.04)",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "5px",
                          display: "inline-block"
                        }}
                      >
                        {truncateRef(order.stripe_checkout_session_id)}
                      </code>
                    </td>
                    <td>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="button-ghost"
                        style={{ fontSize: "0.74rem", padding: "0.25rem 0.65rem" }}
                      >
                        View
                      </Link>
                    </td>
                    {isOwner && (
                      <td>
                        {order.status === "paid" ? (
                          <ResendOrderButton orderId={order.id} />
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "var(--faint)" }}>—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
