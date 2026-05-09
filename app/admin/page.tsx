import { requireAdminSession } from "@/lib/auth";
import { getAdminMetrics } from "@/lib/data";
import { formatCurrencyPounds } from "@/lib/utils";

export default async function AdminHomePage() {
  await requireAdminSession();
  const metrics = await getAdminMetrics();

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <p className="kicker" style={{ marginBottom: "0.3rem" }}>Command center</p>
        <h1 className="section-title" style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>Overview</h1>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--faint)" }}>
          Live metrics for your event platform
        </p>
      </div>

      {/* ── Primary metrics ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
          gap: "1rem",
          marginBottom: "1rem"
        }}
      >
        {/* Gross revenue — hero metric */}
        <div
          className="metric-card"
          style={{
            gridColumn: "span 2",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap"
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 0.5rem",
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.22rem",
                textTransform: "uppercase",
                color: "var(--muted)"
              }}
            >
              Gross revenue
            </p>
            <p
              style={{
                margin: "0 0 0.35rem",
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.4rem, 5vw, 3.4rem)",
                fontWeight: 700,
                lineHeight: 1,
                color: "var(--gold-soft)"
              }}
            >
              {formatCurrencyPounds(metrics.grossRevenuePence / 100)}
            </p>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--faint)" }}>
              From {metrics.paidOrders} confirmed {metrics.paidOrders === 1 ? "order" : "orders"}
            </p>
          </div>
          <div
            style={{
              width: "3.5rem",
              height: "3.5rem",
              borderRadius: "50%",
              background: "rgba(212,175,55,0.1)",
              border: "1px solid rgba(212,175,55,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="8" stroke="var(--gold-soft)" strokeWidth="1.5"/>
              <path d="M10 6v1.5M10 12.5V14M7.5 8.5C7.5 7.4 8.6 7 10 7s2.5.5 2.5 1.5S11.4 10 10 10s-2.5.5-2.5 1.5S8.6 13 10 13s2.5-.5 2.5-1.5" stroke="var(--gold-soft)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Active events */}
        <div className="metric-card">
          <p
            style={{
              margin: "0 0 0.55rem",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.22rem",
              textTransform: "uppercase",
              color: "var(--muted)"
            }}
          >
            Active events
          </p>
          <p
            style={{
              margin: "0 0 0.3rem",
              fontSize: "2.8rem",
              fontWeight: 700,
              lineHeight: 1,
              color: "var(--text-strong)"
            }}
          >
            {metrics.activeEvents}
          </p>
          <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--faint)" }}>
            Published &amp; on sale
          </p>
        </div>

        {/* Tickets issued */}
        <div className="metric-card">
          <p
            style={{
              margin: "0 0 0.55rem",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.22rem",
              textTransform: "uppercase",
              color: "var(--muted)"
            }}
          >
            Tickets issued
          </p>
          <p
            style={{
              margin: "0 0 0.3rem",
              fontSize: "2.8rem",
              fontWeight: 700,
              lineHeight: 1,
              color: "var(--text-strong)"
            }}
          >
            {metrics.ticketsIssued}
          </p>
          <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--faint)" }}>
            QR credentials generated
          </p>
        </div>

        {/* Delivery status */}
        <div className={`metric-card${metrics.deliveryFailures > 0 ? " metric-card--danger" : ""}`}>
          <p
            style={{
              margin: "0 0 0.55rem",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.22rem",
              textTransform: "uppercase",
              color: "var(--muted)"
            }}
          >
            Email delivery
          </p>
          <p
            style={{
              margin: "0 0 0.3rem",
              fontSize: "2.8rem",
              fontWeight: 700,
              lineHeight: 1,
              color: metrics.deliveryFailures > 0 ? "#f5a5a5" : "#b8d98a"
            }}
          >
            {metrics.deliveryFailures > 0 ? metrics.deliveryFailures : "✓"}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.76rem",
              color: metrics.deliveryFailures > 0 ? "#f5a5a5" : "var(--faint)"
            }}
          >
            {metrics.deliveryFailures === 0 ? "All emails delivered" : `failure${metrics.deliveryFailures !== 1 ? "s" : ""} — check orders`}
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "0.75rem",
          marginTop: "0.5rem"
        }}
      >
        {[
          { href: "/admin/orders",  label: "View all orders",  note: "Payment activity"   },
          { href: "/admin/tickets", label: "View all tickets", note: "Issued credentials"  },
          { href: "/admin/events",  label: "View events",      note: "Capacity & catalogue" }
        ].map(({ href, label, note }) => (
          <a
            key={href}
            href={href}
            className="button-ghost"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "1rem 1.2rem",
              borderRadius: "14px",
              gap: "0.2rem",
              minHeight: "auto",
              textAlign: "left"
            }}
          >
            <span style={{ fontWeight: 600, fontSize: "0.86rem" }}>{label}</span>
            <span style={{ fontSize: "0.74rem", color: "var(--faint)", fontWeight: 400 }}>{note}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
