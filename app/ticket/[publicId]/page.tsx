import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TicketCheckinButton } from "@/components/admin/ticket-checkin-button";
import { getAdminSession } from "@/lib/auth";
import { getTicketLookup } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";

interface TicketPageProps {
  params: Promise<{ publicId: string }>;
}

export async function generateMetadata({ params }: TicketPageProps): Promise<Metadata> {
  const { publicId } = await params;
  const ticket = await getTicketLookup(publicId);
  if (!ticket) return { title: "Ticket not found" };
  return { title: `Ticket · ${ticket.guestName} · ${ticket.eventName}` };
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { publicId } = await params;
  const [ticket, adminSession] = await Promise.all([
    getTicketLookup(publicId),
    getAdminSession()
  ]);

  if (!ticket) notFound();

  const isAdmin = !!adminSession?.profile;

  const isValid = ticket.status === "issued";
  const isUsed  = ticket.status === "used";
  const isVoid  = ticket.status === "void";

  const statusColor = isValid
    ? { text: "#b8d98a",  border: "rgba(136,168,97,0.25)",  bg: "rgba(136,168,97,0.07)"  }
    : isUsed
    ? { text: "#9ec3e8",  border: "rgba(100,160,220,0.25)", bg: "rgba(100,160,220,0.07)" }
    : { text: "#f5a5a5",  border: "rgba(201,75,75,0.25)",   bg: "rgba(201,75,75,0.07)"   };

  const statusLabel = isValid ? "Valid — ready for entry" : isUsed ? "Entry recorded" : "Void — not valid";

  const statusIcon = isVoid
    ? (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
    : (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );

  const details = [
    { label: "Guest name",  value: ticket.guestName                },
    { label: "Ticket tier", value: ticket.tierName                  },
    { label: "Date",        value: formatDateTime(ticket.startsAt)  },
    { label: "Venue",       value: ticket.venueName                 },
    { label: "Address",     value: ticket.venueAddress              }
  ];

  return (
    <main className="section">
      <div className="page-shell">
        <div style={{ maxWidth: "56rem", margin: "0 auto" }}>

          {/* ── Header label ── */}
          <div className="fade-in" style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span className="eyebrow" style={{ justifyContent: "center" }}>
              J&amp;A Opulence Events
            </span>
            <p
              style={{
                margin: "-0.8rem 0 0",
                fontSize: "0.78rem",
                color: "var(--faint)"
              }}
            >
              Secure digital ticket · QR verified entry
            </p>
          </div>

          {/* ── Luxury ticket card ── */}
          <div
            className={`ticket-card${isValid ? " ticket-card--valid" : ""} scale-in`}
            style={{
              opacity: isVoid ? 0.7 : 1,
              filter: isVoid ? "saturate(0.35)" : undefined
            }}
          >
            {isVoid && <div className="ticket-void-stamp" />}

            {/* ── Header: event name + status ── */}
            <div
              style={{
                padding: "2.2rem 2.2rem 1.8rem",
                background: "linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.02) 60%, transparent 100%)",
                borderBottom: "1px solid rgba(212,175,55,0.1)",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {/* Corner ornament */}
              <div
                style={{
                  position: "absolute",
                  top: "1.2rem",
                  right: "1.8rem",
                  fontSize: "2.5rem",
                  color: "rgba(212,175,55,0.07)",
                  fontFamily: "var(--font-display)",
                  userSelect: "none",
                  lineHeight: 1
                }}
                aria-hidden="true"
              >
                ◈
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap"
                }}
              >
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: "0 0 0.5rem",
                      fontSize: "0.58rem",
                      fontWeight: 700,
                      letterSpacing: "0.28rem",
                      textTransform: "uppercase",
                      color: "var(--gold-soft)"
                    }}
                  >
                    Private Event · Admission Ticket
                  </p>
                  <h1
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(1.7rem, 4vw, 2.8rem)",
                      color: "var(--text-strong)",
                      lineHeight: 1.1,
                      letterSpacing: "-0.01em"
                    }}
                  >
                    {ticket.eventName}
                  </h1>
                </div>

                {/* Status badge */}
                <div
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "999px",
                    border: `1px solid ${statusColor.border}`,
                    background: statusColor.bg,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    flexShrink: 0,
                    color: statusColor.text
                  }}
                >
                  {statusIcon}
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase"
                    }}
                  >
                    {ticket.status}
                  </span>
                </div>
              </div>

              <p
                style={{
                  margin: "0.9rem 0 0",
                  fontSize: "0.82rem",
                  color: statusColor.text,
                  opacity: 0.85
                }}
              >
                {statusLabel}
              </p>
            </div>

            {/* ── Details grid ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))"
              }}
            >
              {details.map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    padding: "1.2rem 1.6rem",
                    borderRight: "1px solid rgba(212,175,55,0.07)",
                    borderBottom: "1px solid rgba(212,175,55,0.07)"
                  }}
                >
                  <div
                    style={{
                      color: "var(--gold-soft)",
                      fontSize: "0.56rem",
                      letterSpacing: "0.22rem",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      marginBottom: "0.35rem",
                      opacity: 0.85
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ color: "var(--text-strong)", fontSize: "0.9rem", lineHeight: 1.45 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* ── Perforation ── */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div
                style={{
                  position: "absolute",
                  left: "-14px",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#060606",
                  border: "1px solid rgba(212,175,55,0.08)",
                  zIndex: 2
                }}
              />
              <div style={{ flex: 1, borderTop: "2px dashed rgba(212,175,55,0.13)", margin: "0 14px" }} />
              <div
                style={{
                  position: "absolute",
                  right: "-14px",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#060606",
                  border: "1px solid rgba(212,175,55,0.08)",
                  zIndex: 2
                }}
              />
            </div>

            {/* ── Stub: ticket ID + QR indicator ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "1.5rem",
                padding: "1.6rem 2rem",
                alignItems: "center",
                background: "rgba(212,175,55,0.02)"
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 0.3rem",
                    fontSize: "0.56rem",
                    fontWeight: 700,
                    letterSpacing: "0.22rem",
                    textTransform: "uppercase",
                    color: "var(--gold-soft)"
                  }}
                >
                  Ticket ID
                </p>
                <p
                  style={{
                    margin: "0 0 0.85rem",
                    fontFamily: "monospace",
                    fontSize: "clamp(0.82rem, 2vw, 1.05rem)",
                    color: "var(--text-strong)",
                    letterSpacing: "0.06em",
                    fontWeight: 700,
                    wordBreak: "break-all"
                  }}
                >
                  {ticket.publicId}
                </p>
                <p style={{ margin: 0, fontSize: "0.74rem", color: "var(--faint)" }}>
                  Present this screen or your PDF ticket at the entrance
                </p>
              </div>

              {/* QR placeholder */}
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "12px",
                  border: "1px solid rgba(212,175,55,0.18)",
                  background: "rgba(212,175,55,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.3rem",
                  flexShrink: 0
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: "2px",
                    opacity: 0.45
                  }}
                  aria-hidden="true"
                >
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "2px",
                        background: [0,2,6,8].includes(i) ? "var(--gold-soft)" : "rgba(212,175,55,0.3)"
                      }}
                    />
                  ))}
                </div>
                <span
                  style={{
                    fontSize: "0.46rem",
                    letterSpacing: "0.1em",
                    color: "var(--faint)",
                    textTransform: "uppercase"
                  }}
                >
                  QR on PDF
                </span>
              </div>
            </div>

            {/* ── Footer actions ── */}
            <div
              style={{
                padding: "1.2rem 2rem",
                borderTop: "1px solid rgba(212,175,55,0.08)",
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
                {ticket.pdfPath && (
                  <a
                    className="button"
                    href={ticket.pdfPath}
                    target="_blank"
                    rel="noreferrer"
                    style={{ borderRadius: "12px" }}
                  >
                    Download PDF ticket
                  </a>
                )}
                <Link className="button-ghost" href="/" style={{ borderRadius: "12px" }}>
                  Back to events
                </Link>
              </div>
              {isAdmin && isValid && (
                <TicketCheckinButton publicId={ticket.publicId} />
              )}

              <p style={{ fontSize: "0.7rem", color: "var(--faint)", margin: 0 }}>
                J&amp;A Opulence Events · Stripe-verified
              </p>
            </div>
          </div>

          {/* PDF pending notice */}
          {!ticket.pdfPath && isValid && (
            <div
              className="fade-up delay-3"
              style={{
                marginTop: "1.4rem",
                fontSize: "0.84rem",
                padding: "1rem 1.4rem",
                borderRadius: "12px",
                background: "rgba(212,175,55,0.04)",
                border: "1px solid rgba(212,175,55,0.12)",
                textAlign: "center",
                color: "var(--muted)",
                lineHeight: 1.6
              }}
            >
              Your branded PDF ticket with QR code is being generated and will be emailed to you shortly.
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
