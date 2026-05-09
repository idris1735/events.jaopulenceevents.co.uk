"use client";

import { useState } from "react";
import { TicketTierRecord } from "@/lib/types";

interface TestFulfillmentPanelProps {
  eventId: string;
  eventSlug: string;
  tiers: TicketTierRecord[];
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.8rem",
  borderRadius: "8px",
  border: "1px solid rgba(212,175,55,0.18)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--text)",
  fontSize: "0.84rem",
  outline: "none",
  boxSizing: "border-box"
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.58rem",
  letterSpacing: "0.16rem",
  textTransform: "uppercase",
  color: "var(--muted)",
  fontWeight: 700,
  display: "block",
  marginBottom: "0.25rem"
};

export function TestFulfillmentPanel({ eventId, eventSlug, tiers }: TestFulfillmentPanelProps) {
  const activeTiers = tiers.filter(t => t.status === "active");
  const [tierId, setTierId]       = useState(activeTiers[0]?.id ?? tiers[0]?.id ?? "");
  const [quantity, setQuantity]   = useState(1);
  const [buyerName, setBuyerName] = useState("Test Guest");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("+447000000000");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<{ ok?: boolean; orderId?: string; ticketsIssued?: number; error?: string } | null>(null);

  async function handleTest() {
    if (!tierId || !buyerEmail) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/test-fulfillment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, eventSlug, tierId, quantity, buyerName, buyerEmail, buyerPhone })
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Network error — check console." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        padding: "1.4rem 1.6rem",
        borderRadius: "12px",
        border: "1px solid rgba(212,175,55,0.15)",
        background: "rgba(212,175,55,0.02)"
      }}
    >
      <p className="kicker" style={{ fontSize: "0.56rem", marginBottom: "0.6rem" }}>Dev tool — owner only</p>
      <p style={{ margin: "0 0 1.2rem", fontSize: "0.82rem", color: "var(--muted)" }}>
        Simulate a completed Stripe checkout: creates an order, issues PDF tickets, decrements inventory, and triggers the confirmation email.
      </p>

      {tiers.length === 0 ? (
        <p style={{ color: "var(--faint)", fontSize: "0.82rem", margin: 0 }}>No ticket tiers available.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
          <div>
            <label style={labelStyle}>Tier</label>
            <select
              style={{ ...fieldStyle, cursor: "pointer" }}
              value={tierId}
              onChange={e => setTierId(e.target.value)}
            >
              {tiers.map(t => (
                <option key={t.id} value={t.id}>{t.name} — £{t.price_gbp.toFixed(2)} ({t.remaining} left)</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Quantity</label>
            <input
              style={fieldStyle}
              type="number"
              min={1}
              max={6}
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>
          <div>
            <label style={labelStyle}>Buyer name</label>
            <input
              style={fieldStyle}
              type="text"
              value={buyerName}
              onChange={e => setBuyerName(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Buyer email *</label>
            <input
              style={fieldStyle}
              type="email"
              placeholder="owner@example.com"
              value={buyerEmail}
              onChange={e => setBuyerEmail(e.target.value)}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <button
              type="button"
              className="button"
              onClick={handleTest}
              disabled={loading || !tierId || !buyerEmail.includes("@")}
              style={{ fontSize: "0.84rem" }}
            >
              {loading ? "Processing..." : "Run test sale"}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.9rem 1rem",
            borderRadius: "10px",
            fontSize: "0.82rem",
            background: result.error ? "rgba(201,75,75,0.08)" : "rgba(136,168,97,0.08)",
            border: `1px solid ${result.error ? "rgba(201,75,75,0.2)" : "rgba(136,168,97,0.2)"}`,
            color: result.error ? "#f5a5a5" : "#b8d98a"
          }}
        >
          {result.error ? (
            <>Error: {result.error}</>
          ) : (
            <>
              ✓ Order created — {result.ticketsIssued} ticket{result.ticketsIssued !== 1 ? "s" : ""} issued.
              {result.orderId && (
                <> <a href={`/admin/orders/${result.orderId}`} style={{ color: "var(--gold-soft)" }}>View order →</a></>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
