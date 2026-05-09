import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Booking Confirmed"
};

const steps = [
  {
    label: "Payment confirmed",
    sub: "Stripe verifies your card",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="var(--gold-soft)" strokeWidth="1.4"/>
        <path d="M1.5 7h13" stroke="var(--gold-soft)" strokeWidth="1.4"/>
        <circle cx="4.5" cy="10" r="1" fill="var(--gold-soft)"/>
      </svg>
    )
  },
  {
    label: "Guest record created",
    sub: "Your details are registered",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="5.5" r="3" stroke="var(--gold-soft)" strokeWidth="1.4"/>
        <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="var(--gold-soft)" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    label: "QR ticket generating",
    sub: "Unique code being assigned",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="5" height="5" rx="1" stroke="var(--gold-soft)" strokeWidth="1.4"/>
        <rect x="9" y="2" width="5" height="5" rx="1" stroke="var(--gold-soft)" strokeWidth="1.4"/>
        <rect x="2" y="9" width="5" height="5" rx="1" stroke="var(--gold-soft)" strokeWidth="1.4"/>
        <path d="M9 9h2v2H9zM11 11h2v2h-2zM9 13h2" stroke="var(--gold-soft)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    label: "Email on its way",
    sub: "Check your inbox shortly",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="var(--gold-soft)" strokeWidth="1.4"/>
        <path d="M1.5 5.5l6.5 4 6.5-4" stroke="var(--gold-soft)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }
];

export default function CheckoutSuccessPage() {
  return (
    <main
      className="section"
      style={{ minHeight: "calc(100vh - 5rem)", display: "flex", alignItems: "center" }}
    >
      <div className="page-shell" style={{ width: "100%" }}>
        <div style={{ maxWidth: "52rem", margin: "0 auto" }}>

          {/* ── Celebration header ── */}
          <div className="fade-in" style={{ textAlign: "center", marginBottom: "2.5rem" }}>

            {/* Animated check circle */}
            <div style={{ position: "relative", display: "inline-block", marginBottom: "1.8rem" }}>
              <div
                style={{
                  position: "absolute",
                  inset: "-14px",
                  borderRadius: "50%",
                  border: "1px solid rgba(212,175,55,0.1)",
                  animation: "pulseRing 2.8s ease-out infinite"
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "-26px",
                  borderRadius: "50%",
                  border: "1px solid rgba(212,175,55,0.05)",
                  animation: "pulseRing 2.8s ease-out 0.5s infinite"
                }}
              />
              <div
                style={{
                  width: "5.2rem",
                  height: "5.2rem",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.06) 100%)",
                  border: "1px solid rgba(212,175,55,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "goldGlow 3s ease-in-out infinite"
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                  stroke="#d4af37"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M5 14l7 7L23 8"
                    strokeDasharray="60"
                    strokeDashoffset="60"
                    style={{ animation: "checkDraw 0.6s 0.3s var(--ease) forwards" }}
                  />
                </svg>
              </div>
            </div>

            <span className="eyebrow" style={{ justifyContent: "center", marginBottom: "0.7rem" }}>
              Payment received
            </span>
            <h1
              className="shimmer-gold fade-up delay-1"
              style={{
                margin: "0 0 0.9rem",
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
                lineHeight: 1.1
              }}
            >
              Your seat is reserved.
            </h1>
            <p className="note fade-up delay-2" style={{ maxWidth: "32rem", margin: "0 auto", fontSize: "0.9rem" }}>
              Your branded PDF ticket and QR code will be emailed to you automatically
              once payment settles — usually within a minute.
            </p>
          </div>

          {/* ── Main card ── */}
          <div className="panel hero-card scale-in delay-2" style={{ padding: "2rem 2.2rem" }}>

            <p className="kicker" style={{ marginBottom: "1.4rem" }}>What happens next</p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: "0.75rem",
                marginBottom: "2rem"
              }}
            >
              {steps.map(({ label, sub, icon }, i) => (
                <div
                  key={label}
                  style={{
                    padding: "1.2rem 1rem",
                    borderRadius: "14px",
                    border: "1px solid rgba(212,175,55,0.1)",
                    background: "rgba(212,175,55,0.025)",
                    textAlign: "center"
                  }}
                >
                  <div className="step-icon">{icon}</div>
                  <div
                    style={{
                      color: "var(--gold-soft)",
                      fontSize: "0.52rem",
                      letterSpacing: "0.2rem",
                      textTransform: "uppercase",
                      marginBottom: "0.35rem",
                      fontWeight: 700
                    }}
                  >
                    Step 0{i + 1}
                  </div>
                  <div style={{ color: "var(--text)", fontSize: "0.82rem", fontWeight: 600, lineHeight: 1.35, marginBottom: "0.2rem" }}>
                    {label}
                  </div>
                  <div style={{ color: "var(--faint)", fontSize: "0.74rem" }}>{sub}</div>
                </div>
              ))}
            </div>

            <hr className="gold-line" style={{ margin: "0 0 1.4rem" }} />

            <p
              style={{
                fontSize: "0.82rem",
                marginBottom: "1.8rem",
                color: "var(--faint)",
                textAlign: "center",
                lineHeight: 1.65
              }}
            >
              Using Klarna, Clearpay, PayPal, or another deferred payment method? Your booking updates automatically
              once Stripe confirms. Check your inbox in a few minutes.
            </p>

            <div style={{ display: "flex", gap: "0.85rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link className="button" href="/">
                Back to events
              </Link>
              <a
                className="button-secondary"
                href="https://jaopulenceevents.co.uk"
                target="_blank"
                rel="noreferrer"
              >
                Visit main site
              </a>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
