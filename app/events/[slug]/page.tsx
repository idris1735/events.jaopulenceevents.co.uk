import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PurchaseForm } from "@/components/checkout/purchase-form";
import { Countdown } from "@/components/ui/countdown";
import { getEventBundle } from "@/lib/data";
import { formatCurrencyPounds, formatDateTime, formatTimeLondon } from "@/lib/utils";

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getEventBundle(slug);
  if (!bundle) return {};
  return {
    title: bundle.event.name,
    description: bundle.event.summary
  };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { slug } = await params;
  const bundle = await getEventBundle(slug);

  if (!bundle) notFound();

  const totalRemaining = bundle.tiers.reduce((s, t) => s + t.remaining, 0);
  const isLowInventory = totalRemaining > 0 && totalRemaining <= 20;
  const isSoldOut      = totalRemaining === 0;
  const lowestPrice    = bundle.tiers[0]?.price_gbp ?? 0;

  return (
    <main>
      {/* ── Full-bleed hero banner ── */}
      {bundle.event.gallery[0] && (
        <div
          style={{
            height: "clamp(240px, 42vh, 480px)",
            backgroundImage: `linear-gradient(180deg, rgba(6,6,6,0.12) 0%, rgba(6,6,6,0.88) 100%), url(${bundle.event.gallery[0]})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            display: "flex",
            alignItems: "flex-end",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div className="page-shell" style={{ paddingBottom: "2.8rem", position: "relative", zIndex: 1 }}>
            <span className="eyebrow" style={{ marginBottom: "0.6rem" }}>{bundle.event.hero_label}</span>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.4rem, 5vw, 4.4rem)",
                color: "var(--text-strong)",
                lineHeight: 1.05,
                letterSpacing: "-0.015em",
                textShadow: "0 4px 30px rgba(0,0,0,0.6)"
              }}
            >
              {bundle.event.name}
            </h1>
          </div>
        </div>
      )}

      <section className="hero" style={{ paddingTop: bundle.event.gallery[0] ? "3rem" : "4.5rem" }}>
        <div className="page-shell hero-grid">

          {/* ── Left: event details ── */}
          <div>
            {!bundle.event.gallery[0] && (
              <>
                <span className="eyebrow">{bundle.event.hero_label}</span>
                <h1 className="headline">{bundle.event.name}</h1>
              </>
            )}

            <p className="lede" style={{ marginTop: bundle.event.gallery[0] ? 0 : undefined, marginBottom: "2rem" }}>
              {bundle.event.description}
            </p>

            {/* Details grid */}
            <div className="hero-meta">
              <div className="hero-meta__item">
                <div className="hero-meta__label">Date &amp; Time</div>
                <div className="hero-meta__value">{formatDateTime(bundle.event.starts_at)}</div>
              </div>
              <div className="hero-meta__item">
                <div className="hero-meta__label">Venue</div>
                <div className="hero-meta__value">{bundle.event.venue_name}</div>
              </div>
              <div className="hero-meta__item" style={{ gridColumn: "span 2" }}>
                <div className="hero-meta__label">Address</div>
                <div className="hero-meta__value">{bundle.event.venue_address}</div>
              </div>
              <div className="hero-meta__item">
                <div className="hero-meta__label">Dress code</div>
                <div className="hero-meta__value">{bundle.event.dress_code}</div>
              </div>
              <div className="hero-meta__item">
                <div className="hero-meta__label">Doors open</div>
                <div className="hero-meta__value">{formatTimeLondon(bundle.event.starts_at)}</div>
              </div>
            </div>

            {/* What's included */}
            <div style={{ marginTop: "0.5rem" }}>
              <p className="kicker" style={{ marginBottom: "0.9rem" }}>What&apos;s included</p>
              <div className="features-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                {[
                  {
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M2 5h10M2 5v6a1 1 0 001 1h6a1 1 0 001-1V5M2 5V4a1 1 0 011-1h6a1 1 0 011 1v1" stroke="var(--gold-soft)" strokeWidth="1.3" strokeLinecap="round"/>
                        <path d="M5 8h1.5M7.5 8H9" stroke="var(--gold-soft)" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    ),
                    title: "Red carpet arrival",
                    body: "Grand entrance with bottomless drinks all evening"
                  },
                  {
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M7 1.5l1.5 3.5H12L9.5 7l1 3L7 8 3.5 10l1-3L2 5h3.5L7 1.5z" stroke="var(--gold-soft)" strokeWidth="1.2" strokeLinejoin="round"/>
                      </svg>
                    ),
                    title: "Live entertainment",
                    body: "DJ KK, surprise DJ, live sax, and live acts"
                  },
                  {
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <circle cx="7" cy="5" r="2.5" stroke="var(--gold-soft)" strokeWidth="1.3"/>
                        <path d="M2.5 12c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="var(--gold-soft)" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    ),
                    title: "Masquerade awards",
                    body: "Best masquerade prize for male & female guests"
                  },
                  {
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M7 1.5C4 1.5 2 3.5 2 6c0 4 5 6.5 5 6.5S12 10 12 6c0-2.5-2-4.5-5-4.5z" stroke="var(--gold-soft)" strokeWidth="1.3" strokeLinejoin="round"/>
                        <circle cx="7" cy="6" r="1.5" stroke="var(--gold-soft)" strokeWidth="1.2"/>
                      </svg>
                    ),
                    title: "VIP dining",
                    body: "Premium seating with a 3-course plated dinner"
                  }
                ].map(({ icon, title, body }) => (
                  <div className="feature-item" key={title}>
                    <div className="feature-icon">{icon}</div>
                    <div>
                      <p style={{ margin: "0 0 0.2rem", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-strong)" }}>{title}</p>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.5 }}>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: booking panel ── */}
          <aside
            id="booking"
            className="panel hero-card"
            style={{ position: "sticky", top: "6rem", alignSelf: "start" }}
          >
            <p className="kicker" style={{ marginBottom: "0.4rem" }}>Secure booking</p>
            <h2
              className="section-title"
              style={{ fontSize: "1.75rem", marginBottom: "1rem" }}
            >
              Reserve your place
            </h2>

            {/* Countdown */}
            <div
              className="booking-countdown-wrap"
              style={{
                marginBottom: "1.2rem",
                padding: "0.9rem 1rem",
                borderRadius: "12px",
                background: "rgba(212,175,55,0.04)",
                border: "1px solid rgba(212,175,55,0.1)"
              }}
            >
              <p className="kicker" style={{ fontSize: "0.58rem", marginBottom: "0.55rem" }}>
                Event begins in
              </p>
              <Countdown target={bundle.event.starts_at} />
            </div>

            {/* Urgency / sold out banners */}
            {isLowInventory && (
              <div
                className="urgency-banner"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  marginBottom: "1rem",
                  padding: "0.65rem 0.9rem",
                  borderRadius: "10px",
                  background: "rgba(245,200,66,0.06)",
                  border: "1px solid rgba(245,200,66,0.18)"
                }}
              >
                <span className="pulse-dot" />
                <span style={{ fontSize: "0.82rem", color: "#f5c842", fontWeight: 600 }}>
                  Only {totalRemaining} seats left
                </span>
              </div>
            )}

            {isSoldOut && (
              <div
                className="soldout-banner"
                style={{
                  marginBottom: "1rem",
                  padding: "0.65rem 0.9rem",
                  borderRadius: "10px",
                  background: "rgba(201,75,75,0.07)",
                  border: "1px solid rgba(201,75,75,0.2)"
                }}
              >
                <span style={{ fontSize: "0.82rem", color: "#f5a5a5", fontWeight: 600 }}>
                  This event is sold out
                </span>
              </div>
            )}

            <PurchaseForm
              eventId={bundle.event.id}
              eventSlug={bundle.event.slug}
              tiers={bundle.tiers}
            />
          </aside>

        </div>
      </section>

      {/* ── Policy cards ── */}
      <section className="section" style={{ paddingTop: "1rem" }}>
        <div className="page-shell">
          <hr className="gold-line" />
          <div className="event-grid">
            <article className="panel detail-card">
              <p className="kicker">Guest experience</p>
              <h2 className="section-title" style={{ fontSize: "1.65rem" }}>
                Private by design.
              </h2>
              <p className="note">
                Confirmation email, branded PDF ticket, unique QR issuance, and direct
                guest ownership from your first click to the final toast.
              </p>
            </article>

            <article className="panel detail-card">
              <p className="kicker">Refund policy</p>
              <h2 className="section-title" style={{ fontSize: "1.65rem" }}>
                Booking terms
              </h2>
              <p className="note">{bundle.event.policies.refund}</p>
            </article>

            <article className="panel detail-card">
              <p className="kicker">Your data</p>
              <h2 className="section-title" style={{ fontSize: "1.65rem" }}>
                Privacy
              </h2>
              <p className="note">{bundle.event.policies.privacy}</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Mobile sticky book bar ── */}
      {!isSoldOut && (
        <div className="mobile-book-bar">
          <div>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--faint)" }}>From</p>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "var(--gold-soft)",
                lineHeight: 1.1
              }}
            >
              {formatCurrencyPounds(lowestPrice)}
            </p>
          </div>
          <a className="button" href="#booking" style={{ borderRadius: "12px", minWidth: "140px" }}>
            Book now
          </a>
        </div>
      )}
    </main>
  );
}
