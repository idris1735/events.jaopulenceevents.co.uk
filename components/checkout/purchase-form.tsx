"use client";

import { useMemo, useState } from "react";

import { TicketTierRecord } from "@/lib/types";
import { formatCurrencyPounds } from "@/lib/utils";

interface PurchaseFormProps {
  eventId: string;
  eventSlug: string;
  tiers: TicketTierRecord[];
}

function PaymentBadges() {
  return (
    <div className="payment-badges">
      <span className="payment-badge payment-badge--card">
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
          <rect x="0.5" y="0.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1"/>
          <rect x="0.5" y="3" width="13" height="2" fill="currentColor"/>
        </svg>
        Card
      </span>
      <span className="payment-badge payment-badge--paypal">PayPal</span>
      <span className="payment-badge payment-badge--klarna">Klarna</span>
      <span className="payment-badge payment-badge--clearpay">Clearpay</span>
    </div>
  );
}

function guestLabel(guestsPerUnit: number, qty: number): string {
  const total = qty * guestsPerUnit;
  if (guestsPerUnit === 1) return `${total} ${total === 1 ? "guest" : "guests"}`;
  return `${qty} × ${guestsPerUnit} = ${total} guests`;
}

function unitWord(guestsPerUnit: number): string {
  if (guestsPerUnit === 2) return "couples package";
  if (guestsPerUnit >= 3) return "group package";
  return "ticket";
}

export function PurchaseForm({ eventId, eventSlug, tiers }: PurchaseFormProps) {
  const activeTiers = tiers.filter((t) => t.status === "active" && t.remaining > 0);

  const [tierId, setTierId]         = useState(activeTiers[0]?.id ?? tiers[0]?.id ?? "");
  const [quantity, setQuantity]     = useState(1);
  const [buyerName, setBuyerName]   = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [pending, setPending]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const selectedTier = useMemo(
    () => tiers.find((t) => t.id === tierId) ?? tiers[0],
    [tierId, tiers]
  );

  const guestsPerUnit = selectedTier?.guests_per_unit ?? 1;
  const isBundle      = guestsPerUnit > 1;
  const totalGuests   = quantity * guestsPerUnit;
  const maxQty        = Math.min(selectedTier?.max_per_order ?? 6, selectedTier?.remaining ?? 6);
  const total         = selectedTier ? selectedTier.price_gbp * quantity : 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, eventSlug, tierId, quantity, buyerName, buyerEmail, buyerPhone })
    });

    const payload = await response.json();
    setPending(false);

    if (!response.ok || !payload.url) {
      setError(payload.error ?? "Unable to create checkout session. Please try again.");
      return;
    }

    window.location.assign(payload.url);
  }

  const isSoldOut = activeTiers.length === 0;

  return (
    <form className="stack" onSubmit={handleSubmit} style={{ gap: "1.25rem" }}>

      {/* ── Step 1: Choose tier ── */}
      <div>
        <p className="kicker" style={{ fontSize: "0.6rem", letterSpacing: "0.2rem", marginBottom: "0.65rem" }}>
          Step 1 · Choose your ticket
        </p>
        <div className="stack" style={{ gap: "0.6rem" }}>
          {tiers.map((tier) => {
            const unavailable = tier.status !== "active" || tier.remaining === 0;
            const selected    = tier.id === tierId;
            const gpu         = tier.guests_per_unit ?? 1;
            const isBundle    = gpu > 1;
            return (
              <button
                key={tier.id}
                type="button"
                disabled={unavailable}
                onClick={() => { setTierId(tier.id); setQuantity(1); }}
                className={`tier-option${selected ? " tier-option--selected" : ""}`}
                style={{ textAlign: "left" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                      <span style={{ color: "var(--text-strong)", fontWeight: 700, fontSize: "0.97rem" }}>
                        {tier.name}
                      </span>
                      {isBundle && (
                        <span className="guest-badge">
                          {gpu} guests
                        </span>
                      )}
                    </div>
                    {tier.description && (
                      <div style={{ color: "var(--muted)", fontSize: "0.79rem", lineHeight: 1.5, marginBottom: "0.35rem" }}>
                        {tier.description}
                      </div>
                    )}
                    <div style={{ fontSize: "0.72rem", color: unavailable ? "#f5a5a5" : tier.remaining <= 10 ? "var(--text-warning)" : "var(--muted)" }}>
                      {unavailable ? "Sold out" : `${tier.remaining} remaining`}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.55rem", flexShrink: 0 }}>
                    <span style={{ color: selected ? "var(--gold-soft)" : "var(--text-strong)", fontWeight: 700, fontSize: "1.2rem", lineHeight: 1, transition: "color 0.2s" }}>
                      {formatCurrencyPounds(tier.price_gbp)}
                    </span>
                    <span className="tier-option__radio">
                      <span className="tier-option__radio-dot" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Step 2: Quantity ── */}
      {!isSoldOut && (
        <div style={{ borderTop: "1px solid var(--line-subtle)", paddingTop: "1.1rem" }}>
          <p className="kicker" style={{ fontSize: "0.6rem", letterSpacing: "0.2rem", marginBottom: "0.7rem" }}>
            Step 2 · How many?
          </p>
          <div className="qty-row">
            <div>
              <p style={{ margin: "0 0 0.15rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-strong)" }}>
                {isBundle ? `${unitWord(guestsPerUnit).charAt(0).toUpperCase() + unitWord(guestsPerUnit).slice(1)}s` : "Tickets"}
              </p>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--gold-soft)", fontWeight: 600 }}>
                {guestLabel(guestsPerUnit, quantity)}
              </p>
              {maxQty > 1 && (
                <p style={{ margin: "0.1rem 0 0", fontSize: "0.72rem", color: "var(--faint)" }}>
                  Up to {maxQty} per order
                </p>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center" }} className="qty-stepper">
              <button
                type="button"
                className="qty-stepper__btn"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={maxQty}
                value={quantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v)) setQuantity(Math.min(maxQty, Math.max(1, v)));
                }}
                onFocus={(e) => e.target.select()}
                onBlur={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setQuantity(isNaN(v) || v < 1 ? 1 : Math.min(v, maxQty));
                }}
                className="qty-stepper__value"
                aria-label="Quantity"
              />
              <button
                type="button"
                className="qty-stepper__btn"
                disabled={quantity >= maxQty}
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Your details ── */}
      {!isSoldOut && (
        <div style={{ borderTop: "1px solid var(--line-subtle)", paddingTop: "1.1rem" }}>
          <p className="kicker" style={{ fontSize: "0.6rem", letterSpacing: "0.2rem", marginBottom: "0.85rem" }}>
            Step 3 · Your details
          </p>
          <div className="stack" style={{ gap: "0.65rem" }}>
            <input
              className="field"
              type="text"
              placeholder="Full name"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              required
              autoComplete="name"
            />
            <input
              className="field"
              type="email"
              placeholder="Email address"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              className="field"
              type="tel"
              placeholder="Phone number"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              required
              autoComplete="tel"
            />
          </div>
        </div>
      )}

      {/* ── Total + CTA ── */}
      {!isSoldOut && (
        <>
          <div style={{ borderTop: "1px solid var(--line-subtle)", paddingTop: "1.1rem" }}>
            <div className="total-box">
              <div>
                <p className="kicker" style={{ fontSize: "0.6rem", letterSpacing: "0.2rem", marginBottom: "0.1rem" }}>
                  Total
                </p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-strong)", fontWeight: 500 }}>
                  {quantity} {isBundle ? unitWord(guestsPerUnit) : quantity === 1 ? "ticket" : "tickets"}
                  {isBundle && <span style={{ color: "var(--muted)", fontWeight: 400 }}> · {totalGuests} guests</span>}
                </p>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.7rem",
                  fontWeight: 700,
                  color: "var(--gold-soft)",
                  lineHeight: 1
                }}
              >
                {formatCurrencyPounds(total)}
              </span>
            </div>

            {/* BNPL hint */}
            <p style={{ margin: "0.55rem 0 0", fontSize: "0.75rem", color: "var(--muted)", textAlign: "center" }}>
              Pay in installments with{" "}
              <span style={{ color: "#e8aab9", fontWeight: 600 }}>Klarna</span> or{" "}
              <span style={{ color: "#3dbfa8", fontWeight: 600 }}>Clearpay</span> at checkout
            </p>
          </div>

          <button
            className="button"
            type="submit"
            disabled={pending || !tierId}
            style={{ width: "100%", borderRadius: "14px", minHeight: "3.5rem", fontSize: "1rem" }}
          >
            {pending ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
                <span
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid rgba(0,0,0,0.2)",
                    borderTopColor: "#0c0c0c",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    flexShrink: 0
                  }}
                />
                Securing your booking...
              </span>
            ) : (
              `Proceed to payment · ${formatCurrencyPounds(total)}`
            )}
          </button>

          {/* Payment methods */}
          <div>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.67rem", color: "var(--faint)", textAlign: "center", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              We accept
            </p>
            <PaymentBadges />
          </div>

          <div className="trust-strip" style={{ justifyContent: "center" }}>
            <span className="trust-item">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <rect x="1" y="4" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" opacity="0.7"/>
                <path d="M4 4V3a2 2 0 114 0v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
              </svg>
              SSL encrypted
            </span>
            <span className="trust-item">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" opacity="0.7"/>
                <path d="M4 6l1.5 1.5L8 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
              </svg>
              Instant confirmation
            </span>
            <span className="trust-item">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 1L7.5 4.5H11L8.5 6.5L9.5 10L6 8L2.5 10L3.5 6.5L1 4.5H4.5L6 1Z" fill="currentColor" opacity="0.7"/>
              </svg>
              Stripe secured
            </span>
          </div>
        </>
      )}

      {isSoldOut && (
        <div
          style={{
            padding: "1.2rem",
            borderRadius: "12px",
            background: "rgba(201,75,75,0.06)",
            border: "1px solid rgba(201,75,75,0.18)",
            textAlign: "center"
          }}
        >
          <p style={{ margin: 0, color: "#f5a5a5", fontSize: "0.88rem", fontWeight: 600 }}>
            This event is fully sold out
          </p>
          <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "var(--faint)" }}>
            Check back for future events or visit our main site.
          </p>
        </div>
      )}

      {error && (
        <p
          style={{
            color: "#f5a5a5",
            background: "rgba(201,75,75,0.08)",
            border: "1px solid rgba(201,75,75,0.2)",
            borderRadius: "10px",
            padding: "0.85rem 1rem",
            margin: 0,
            fontSize: "0.85rem",
            lineHeight: 1.5
          }}
        >
          {error}
        </p>
      )}
    </form>
  );
}
