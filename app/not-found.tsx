import Link from "next/link";

export default function NotFound() {
  return (
    <main className="section" style={{ minHeight: "calc(100vh - 5rem)", display: "flex", alignItems: "center" }}>
      <div className="page-shell" style={{ width: "100%" }}>
        <div style={{ maxWidth: "40rem", margin: "0 auto", textAlign: "center" }}>

          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "6rem",
              fontWeight: 700,
              lineHeight: 1,
              color: "rgba(212,175,55,0.12)",
              marginBottom: "1.5rem",
              letterSpacing: "-0.04em"
            }}
          >
            404
          </div>

          <span className="eyebrow" style={{ justifyContent: "center", marginBottom: "0.6rem" }}>
            Not found
          </span>

          <h1
            style={{
              margin: "0 0 1rem",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
              color: "var(--text-strong)",
              lineHeight: 1.2
            }}
          >
            That page does not exist.
          </h1>

          <p className="note" style={{ marginBottom: "2rem", color: "var(--faint)" }}>
            The event, ticket, or resource you requested could not be found.
            It may have been moved or removed.
          </p>

          <Link className="button" href="/" style={{ borderRadius: "12px" }}>
            Back to events
          </Link>
        </div>
      </div>
    </main>
  );
}
