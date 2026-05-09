import Link from "next/link";

import { AdminNavLink } from "@/components/admin/admin-nav-link";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { requireAdminSession } from "@/lib/auth";

export default async function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAdminSession();
  const profile = session.profile;

  return (
    <div>
      {/* Admin header */}
      <header
        style={{
          borderBottom: "1px solid var(--line)",
          background: "linear-gradient(180deg, rgba(212,175,55,0.035) 0%, rgba(0,0,0,0) 100%)"
        }}
      >
        <div
          className="page-shell"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            paddingTop: "1rem",
            paddingBottom: "1rem",
            flexWrap: "wrap"
          }}
        >
          {/* Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "2.2rem",
                height: "2.2rem",
                borderRadius: "8px",
                background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.2)",
                fontSize: "1rem",
                color: "var(--gold-soft)",
                flexShrink: 0,
                transition: "background 0.2s"
              }}
              title="Back to site"
            >
              ◈
            </Link>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1rem",
                    color: "var(--text-strong)",
                    fontWeight: 600
                  }}
                >
                  {profile.display_name}
                </span>
                <span
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    padding: "0.2rem 0.55rem",
                    borderRadius: "6px",
                    background: profile.role === "owner"
                      ? "rgba(212,175,55,0.14)"
                      : "rgba(100,160,220,0.14)",
                    color: profile.role === "owner"
                      ? "var(--gold-soft)"
                      : "rgba(100,160,220,0.9)",
                    border: `1px solid ${profile.role === "owner"
                      ? "rgba(212,175,55,0.2)"
                      : "rgba(100,160,220,0.2)"}`
                  }}
                >
                  {profile.role}
                </span>
              </div>
              <p
                style={{ margin: 0, fontSize: "0.72rem", color: "var(--faint)", marginTop: "0.1rem" }}
              >
                {session.email}
              </p>
            </div>
          </div>

          <SignOutButton />
        </div>

        {/* Nav tabs — using AdminNavLink for active state */}
        <div className="page-shell" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <nav
            style={{
              display: "flex",
              gap: 0,
              borderTop: "1px solid var(--line-subtle)",
              overflowX: "auto",
              msOverflowStyle: "none",
              scrollbarWidth: "none"
            }}
            aria-label="Admin navigation"
          >
            {(
              [
                { href: "/admin",          label: "Overview" },
                { href: "/admin/events",   label: "Events"   },
                { href: "/admin/orders",   label: "Orders"   },
                { href: "/admin/tickets",  label: "Tickets"  },
                { href: "/admin/checkin",  label: "Check-in" }
              ] as const
            ).map(({ href, label }) => (
              <AdminNavLink key={href} href={href} label={label} />
            ))}
            {profile.role === "owner" && (
              <AdminNavLink href="/admin/staff" label="Staff" />
            )}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="section" style={{ paddingBottom: "5rem" }}>
        <div className="page-shell stack">
          {children}
        </div>
      </main>
    </div>
  );
}
