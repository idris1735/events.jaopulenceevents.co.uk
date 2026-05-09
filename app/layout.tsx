import type { Metadata } from "next";
import Link from "next/link";

import { MobileNav } from "@/components/ui/mobile-nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "J&A Opulence Events",
    template: "%s — J&A Opulence Events"
  },
  description: "Private luxury event ticketing by J&A Opulence Events. Browse and book upcoming events."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Prevent flash of wrong theme before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})()`
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="site-header">
          <div className="page-shell site-header__bar">
            <Link href="/" className="brand">
              <span className="brand__eyebrow">J&amp;A Opulence</span>
              <span className="brand__name">Private Event Platform</span>
            </Link>

            {/* Desktop nav */}
            <nav className="nav-links" aria-label="Primary navigation">
              <Link href="/">Events</Link>
              <Link href="/auth/sign-in">Admin</Link>
              <a
                href="https://jaopulenceevents.co.uk"
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--gold-dim)" }}
              >
                Main Site ↗
              </a>
            </nav>

            {/* Theme toggle + Mobile nav */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ThemeToggle />
              <MobileNav />
            </div>
          </div>
        </header>

        {children}

        <footer className="footer">
          <div
            className="page-shell"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap"
            }}
          >
            <span>© {new Date().getFullYear()} J&amp;A Opulence Events. All rights reserved.</span>
            <span style={{ color: "var(--faint)", fontSize: "0.75rem" }}>
              Secure booking · Stripe-powered · Branded ticket delivery
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
