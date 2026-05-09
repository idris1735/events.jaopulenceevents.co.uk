import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Admin Sign In"
};

export default function SignInPage() {
  return (
    <main
      className="section"
      style={{ minHeight: "calc(100vh - 5rem)", display: "flex", alignItems: "center" }}
    >
      <div className="page-shell" style={{ width: "100%" }}>
        <div style={{ maxWidth: "26rem", margin: "0 auto" }}>

          {/* Brand lockup */}
          <div className="fade-in" style={{ textAlign: "center", marginBottom: "2.2rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "3.4rem",
                height: "3.4rem",
                borderRadius: "50%",
                background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.25)",
                marginBottom: "1.2rem",
                fontSize: "1.4rem",
                color: "var(--gold-soft)",
                animation: "goldGlow 3s ease-in-out infinite"
              }}
              aria-hidden="true"
            >
              ◈
            </div>
            <span
              className="eyebrow"
              style={{ justifyContent: "center", marginBottom: "0.5rem" }}
            >
              Admin portal
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "1.9rem",
                color: "var(--text-strong)",
                lineHeight: 1.2
              }}
            >
              J&amp;A Opulence
            </h1>
            <p
              style={{
                margin: "0.4rem 0 0",
                fontSize: "0.8rem",
                color: "var(--faint)"
              }}
            >
              Restricted to authorised staff only
            </p>
          </div>

          {/* Sign-in card */}
          <div
            className="panel hero-card scale-in delay-1"
            style={{ padding: "1.8rem 2rem", borderRadius: "20px" }}
          >
            <SignInForm />
          </div>

          <p
            style={{
              textAlign: "center",
              marginTop: "1.4rem",
              fontSize: "0.72rem",
              color: "var(--faint)"
            }}
          >
            Access issues? Contact the account owner directly.
          </p>
        </div>
      </div>
    </main>
  );
}
