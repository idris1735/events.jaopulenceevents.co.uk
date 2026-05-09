import Link from "next/link";

import { Countdown } from "@/components/ui/countdown";
import { getActiveEventBundles } from "@/lib/data";
import { formatCurrencyPounds, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const bundles = await getActiveEventBundles();
  const featured = bundles[0];

  const totalRemaining = featured
    ? featured.tiers.reduce((s, t) => s + t.remaining, 0)
    : 0;

  const isLowInventory = totalRemaining > 0 && totalRemaining <= 30;

  return (
    <main>
      {/* ── HERO ── */}
      {featured ? (
        <section className="hero">
          <div className="page-shell hero-grid">

            {/* Left: event identity */}
            <div>
              <span className="eyebrow fade-up">{featured.event.hero_label}</span>
              <h1 className="headline fade-up delay-1">{featured.event.name}</h1>
              <p className="lede fade-up delay-2" style={{ marginBottom: "2rem" }}>
                {featured.event.description}
              </p>

              <div className="fade-up delay-3" style={{ marginBottom: "1.8rem" }}>
                <p className="kicker" style={{ marginBottom: "0.65rem", fontSize: "0.6rem" }}>
                  Event begins in
                </p>
                <Countdown target={featured.event.starts_at} />
              </div>

              <div className="hero-meta fade-up delay-3">
                <div className="hero-meta__item">
                  <div className="hero-meta__label">Date</div>
                  <div className="hero-meta__value">{formatDateTime(featured.event.starts_at)}</div>
                </div>
                <div className="hero-meta__item">
                  <div className="hero-meta__label">Venue</div>
                  <div className="hero-meta__value">{featured.event.venue_name}</div>
                </div>
                <div className="hero-meta__item">
                  <div className="hero-meta__label">Dress code</div>
                  <div className="hero-meta__value">{featured.event.dress_code}</div>
                </div>
                <div className="hero-meta__item">
                  <div className="hero-meta__label">Tickets from</div>
                  <div
                    className="hero-meta__value shimmer-gold"
                    style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700 }}
                  >
                    {formatCurrencyPounds(featured.tiers[0]?.price_gbp ?? 0)}
                  </div>
                </div>
              </div>

              {isLowInventory && (
                <div
                  className="fade-up delay-4"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    marginBottom: "1.6rem",
                    padding: "0.65rem 1rem",
                    borderRadius: "10px",
                    background: "rgba(245,200,66,0.06)",
                    border: "1px solid rgba(245,200,66,0.18)"
                  }}
                >
                  <span className="pulse-dot" />
                  <span style={{ fontSize: "0.82rem", color: "#f5c842", fontWeight: 600 }}>
                    Only {totalRemaining} seats remaining
                  </span>
                </div>
              )}

              <div className="fade-up delay-5" style={{ display: "flex", gap: "0.9rem", flexWrap: "wrap" }}>
                <Link className="button" href={`/events/${featured.event.slug}`} style={{ minWidth: "200px", fontSize: "1rem" }}>
                  Get your tickets →
                </Link>
                <a
                  className="button-secondary"
                  href="https://jaopulenceevents.co.uk/gallery.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  View gallery
                </a>
              </div>

              <div className="trust-strip fade-up delay-6" style={{ marginTop: "1.6rem" }}>
                <span className="trust-item">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <rect x="1.5" y="2.5" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
                    <path d="M4.5 6l1.5 1.5L8.5 5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Ticket straight to your inbox
                </span>
                <span className="trust-item">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <path d="M2 5.5C2 3.5 4 2 6.5 2C9 2 11 3.5 11 5.5V10.5H2V5.5Z" stroke="currentColor" strokeWidth="1.1"/>
                    <path d="M4.5 5.5V5C4.5 3.9 5.4 3 6.5 3C7.6 3 8.5 3.9 8.5 5V5.5" stroke="currentColor" strokeWidth="1.1"/>
                  </svg>
                  100% secure payment
                </span>
                <span className="trust-item">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.1"/>
                    <path d="M6.5 4v2.5l1.5 1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                  </svg>
                  Klarna &amp; Clearpay accepted
                </span>
              </div>
            </div>

            {/* Right: event card */}
            <div
              className="panel hero-card scale-in delay-2"
              style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
            >
              {featured.event.gallery[0] && (
                <div
                  style={{
                    aspectRatio: "16/9",
                    backgroundImage: `linear-gradient(180deg, rgba(6,6,6,0.08) 0%, rgba(6,6,6,0.6) 100%), url(${featured.event.gallery[0]})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: "22px 22px 0 0",
                    flexShrink: 0,
                    position: "relative"
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "1rem",
                      left: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.35rem 0.75rem",
                      borderRadius: "999px",
                      background: "rgba(6,6,6,0.75)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(212,175,55,0.25)"
                    }}
                  >
                    <span className="pulse-dot" />
                    <span style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.14em", color: "var(--gold-soft)", textTransform: "uppercase" }}>
                      On sale now
                    </span>
                  </div>
                </div>
              )}

              <div style={{ padding: "1.6rem 1.8rem 1.8rem" }}>
                <p className="kicker" style={{ marginBottom: "0.9rem" }}>Choose your ticket</p>

                <div className="stack" style={{ gap: "0.6rem", marginBottom: "1.4rem" }}>
                  {featured.tiers.slice(0, 4).map((tier) => (
                    <div
                      key={tier.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.9rem 1rem",
                        borderRadius: "12px",
                        border: "1px solid rgba(212,175,55,0.12)",
                        background: "rgba(255,255,255,0.02)"
                      }}
                    >
                      <div>
                        <div style={{ color: "var(--text-strong)", fontSize: "0.92rem", fontWeight: 600, marginBottom: "0.1rem" }}>
                          {tier.name}
                          {(tier.guests_per_unit ?? 1) > 1 && (
                            <span style={{ marginLeft: "0.5rem", fontSize: "0.68rem", color: "var(--gold-soft)", fontWeight: 700, padding: "0.1rem 0.4rem", border: "1px solid rgba(212,175,55,0.25)", borderRadius: "20px" }}>
                              {tier.guests_per_unit} guests
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.74rem", color: tier.remaining === 0 ? "#f5a5a5" : tier.remaining <= 10 ? "#f5c842" : "var(--muted)" }}>
                          {tier.remaining === 0 ? "Sold out" : `${tier.remaining} remaining`}
                        </div>
                      </div>
                      <div style={{ color: "var(--gold-soft)", fontWeight: 700, fontSize: "1.15rem" }}>
                        {formatCurrencyPounds(tier.price_gbp)}
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  className="button"
                  href={`/events/${featured.event.slug}`}
                  style={{ width: "100%", borderRadius: "14px", fontSize: "1rem", minHeight: "3.5rem" }}
                >
                  Book now — secure checkout
                </Link>

                <p style={{ fontSize: "0.72rem", textAlign: "center", marginTop: "0.9rem", color: "var(--faint)" }}>
                  Pay by card, Klarna, Clearpay or PayPal
                </p>
              </div>
            </div>

          </div>
        </section>
      ) : null}

      {/* ── HOW TO BOOK ── */}
      <section className="section" style={{ paddingTop: featured ? "0.5rem" : "4.5rem", paddingBottom: "0" }}>
        <div className="page-shell">
          <hr className="gold-line" />
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p className="kicker" style={{ marginBottom: "0.4rem" }}>Simple steps</p>
            <h2 className="section-title">Booking is easy — 3 steps</h2>
            <p className="note" style={{ maxWidth: "520px", margin: "0 auto", fontSize: "1rem" }}>
              No account needed. Takes under 2 minutes.
            </p>
          </div>
          <div className="how-steps">
            {[
              {
                num: "1",
                title: "Pick your ticket",
                body: "Choose Single, Couples, or Group. VIP gets you a seat and a hot 3-course dinner."
              },
              {
                num: "2",
                title: "Enter your details",
                body: "Just your name, email address, and phone number. That's all we need."
              },
              {
                num: "3",
                title: "Pay safely online",
                body: "Card, PayPal, Klarna or Clearpay. Your golden PDF ticket arrives in your inbox instantly."
              }
            ].map(({ num, title, body }) => (
              <div key={num} className="how-step">
                <div className="how-step__num">{num}</div>
                <h3 className="how-step__title">{title}</h3>
                <p className="how-step__body">{body}</p>
              </div>
            ))}
          </div>
          {featured && (
            <div style={{ textAlign: "center", marginTop: "2.5rem", paddingBottom: "1rem" }}>
              <Link className="button" href={`/events/${featured.event.slug}`} style={{ fontSize: "1.05rem", padding: "0 2.2rem", minHeight: "3.6rem" }}>
                Start booking now →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── ALL EVENTS ── */}
      <section className="section" style={{ paddingTop: "2.5rem" }}>
        <div className="page-shell">
          <hr className="gold-line" />
          <p className="kicker" style={{ marginBottom: "0.4rem" }}>Upcoming events</p>
          <h2 className="section-title" style={{ marginBottom: "2rem" }}>Reserve your place</h2>

          {bundles.length === 0 ? (
            <div className="empty-state">
              <p>No events currently available. Check back soon.</p>
            </div>
          ) : (
            <div className="event-showcase">
              {bundles.map(({ event, tiers }) => {
                const lowestPrice = Math.min(...tiers.map((t) => t.price_gbp));
                const allSoldOut  = tiers.every((t) => t.remaining === 0);
                const totalLeft   = tiers.reduce((s, t) => s + t.remaining, 0);
                const isLow       = totalLeft > 0 && totalLeft <= 30;
                return (
                  <article key={event.id} className="showcase-card">
                    {event.gallery[0] && (
                      <div
                        className="showcase-card__image"
                        style={{ backgroundImage: `linear-gradient(180deg, rgba(6,6,6,0.05) 0%, rgba(6,6,6,0.75) 100%), url(${event.gallery[0]})` }}
                      >
                        <div className="showcase-card__image-badge">
                          {allSoldOut ? (
                            <span style={{ color: "#f5a5a5" }}>Sold out</span>
                          ) : isLow ? (
                            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <span className="pulse-dot" />
                              <span style={{ color: "#f5c842" }}>Only {totalLeft} left</span>
                            </span>
                          ) : (
                            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <span className="pulse-dot" />
                              <span style={{ color: "var(--gold-soft)" }}>Available now</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="showcase-card__body">
                      <div>
                        <h3 className="showcase-card__title">{event.name}</h3>
                        <p className="showcase-card__meta">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                            <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M1.5 5.5h11" stroke="currentColor" strokeWidth="1.2"/>
                          </svg>
                          {formatDateTime(event.starts_at)}
                        </p>
                        <p className="showcase-card__meta">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                            <path d="M7 1.5C4.5 1.5 2.5 3.5 2.5 6c0 4 4.5 6.5 4.5 6.5S11.5 10 11.5 6c0-2.5-2-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.2"/>
                            <circle cx="7" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.1"/>
                          </svg>
                          {event.venue_name}
                        </p>
                        <p className="note" style={{ margin: "0.8rem 0 1rem", fontSize: "0.88rem" }}>{event.summary}</p>
                        <div className="showcase-card__tiers">
                          {tiers.slice(0, 3).map((t) => (
                            <div key={t.id} className="showcase-card__tier">
                              <span style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: "0.84rem" }}>{t.name}</span>
                              <span style={{ color: "var(--gold-soft)", fontWeight: 700 }}>{formatCurrencyPounds(t.price_gbp)}</span>
                            </div>
                          ))}
                          {tiers.length > 3 && (
                            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--faint)" }}>+ {tiers.length - 3} more options</p>
                          )}
                        </div>
                      </div>
                      <div style={{ marginTop: "1.5rem" }}>
                        <div style={{ marginBottom: "0.6rem" }}>
                          <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>From</span>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: "var(--gold-soft)", marginLeft: "0.5rem", lineHeight: 1 }}>
                            {formatCurrencyPounds(lowestPrice)}
                          </span>
                        </div>
                        <Link
                          className={allSoldOut ? "button-secondary" : "button"}
                          href={`/events/${event.slug}`}
                          style={{ width: "100%", borderRadius: "14px", fontSize: "1rem", minHeight: "3.5rem", opacity: allSoldOut ? 0.75 : 1 }}
                        >
                          {allSoldOut ? "View event details" : "Book your tickets →"}
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── PAYMENT METHODS ── */}
      <section className="section" style={{ paddingTop: "1rem", paddingBottom: "1rem" }}>
        <div className="page-shell">
          <div className="payment-strip">
            <p className="payment-strip__label">Pay your way</p>
            <div className="payment-strip__methods">
              <span className="payment-strip__method">
                <svg width="28" height="18" viewBox="0 0 28 18" fill="none" aria-hidden="true">
                  <rect x="0.5" y="0.5" width="27" height="17" rx="2.5" stroke="currentColor" strokeOpacity="0.3"/>
                  <rect x="0.5" y="5" width="27" height="4" fill="currentColor" fillOpacity="0.15"/>
                </svg>
                Debit / Credit Card
              </span>
              <span className="payment-strip__method payment-strip__method--paypal">PayPal</span>
              <span className="payment-strip__method payment-strip__method--klarna">
                Klarna
                <span className="payment-strip__sub">3 interest-free payments</span>
              </span>
              <span className="payment-strip__method payment-strip__method--clearpay">
                Clearpay
                <span className="payment-strip__sub">4 payments, every 2 weeks</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY BOOK DIRECT ── */}
      <section className="section" style={{ paddingTop: "1rem", paddingBottom: "5rem" }}>
        <div className="page-shell">
          <hr className="gold-line" />
          <p className="kicker" style={{ marginBottom: "0.4rem" }}>Why book with us directly</p>
          <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>
            Book direct. Pay less. Get more.
          </h2>
          <p className="note" style={{ marginBottom: "2.5rem", maxWidth: "540px", fontSize: "0.98rem" }}>
            Platforms like Eventbrite charge you up to £5 extra per ticket just to be the middleman. We don&apos;t do that.
          </p>
          <div className="features-grid">
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                    <circle cx="11" cy="11" r="9" stroke="var(--gold-soft)" strokeWidth="1.6"/>
                    <path d="M11 7v4.5l3 1.5" stroke="var(--gold-soft)" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                ),
                title: "No Eventbrite fees",
                body: "The price you see is the price you pay. No platform surcharges, no hidden booking fees."
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                    <rect x="3" y="5" width="16" height="12" rx="2" stroke="var(--gold-soft)" strokeWidth="1.6"/>
                    <path d="M7 5V4.5a4 4 0 018 0V5" stroke="var(--gold-soft)" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M8.5 11.5l2 2 4-4" stroke="var(--gold-soft)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Your ticket in your inbox",
                body: "A beautifully designed PDF ticket with a unique QR code is emailed to you the moment you pay."
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                    <path d="M11 2L3 6v5c0 4.5 3.5 8.7 8 10 4.5-1.3 8-5.5 8-10V6L11 2z" stroke="var(--gold-soft)" strokeWidth="1.6" strokeLinejoin="round"/>
                    <path d="M8 11l2 2 4-4" stroke="var(--gold-soft)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Safe and secure",
                body: "All payments go through Stripe — the same technology used by Amazon. Your card details are never stored."
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                    <circle cx="11" cy="9" r="4" stroke="var(--gold-soft)" strokeWidth="1.6"/>
                    <path d="M4 20c0-3.9 3.1-7 7-7h0c3.9 0 7 3.1 7 7" stroke="var(--gold-soft)" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                ),
                title: "Your privacy matters",
                body: "Your name and email are used only to deliver your ticket. We never sell or share your information."
              }
            ].map(({ icon, title, body }) => (
              <div className="feature-item" key={title}>
                <div className="feature-icon">{icon}</div>
                <div>
                  <p style={{ margin: "0 0 0.4rem", fontWeight: 700, fontSize: "1rem", color: "var(--text-strong)" }}>{title}</p>
                  <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.7 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
