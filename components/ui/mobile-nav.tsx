"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        className="nav-hamburger"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <svg width="22" height="15" viewBox="0 0 22 15" fill="none" aria-hidden="true">
          <rect width="22" height="2" rx="1" fill="currentColor" />
          <rect y="6.5" width="15" height="2" rx="1" fill="currentColor" />
          <rect y="13" width="22" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>

      <div className={`mobile-nav${open ? " mobile-nav--open" : ""}`} aria-hidden={!open}>
        <div className="mobile-nav__backdrop" onClick={() => setOpen(false)} />
        <nav className="mobile-nav__panel">
          <button
            className="mobile-nav__close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div style={{ marginTop: "3rem" }}>
            <p className="kicker" style={{ marginBottom: "1.5rem" }}>Navigation</p>
            <Link className="mobile-nav__link" href="/" onClick={() => setOpen(false)}>
              Events
            </Link>
            <Link className="mobile-nav__link" href="/auth/sign-in" onClick={() => setOpen(false)}>
              Admin
            </Link>
            <a
              className="mobile-nav__link mobile-nav__link--muted"
              href="https://jaopulenceevents.co.uk"
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
            >
              Main Site ↗
            </a>
          </div>

          <div style={{ marginTop: "auto", paddingTop: "2rem" }}>
            <p style={{ fontSize: "0.7rem", color: "var(--faint)", letterSpacing: "0.04em" }}>
              J&amp;A Opulence Events
            </p>
          </div>
        </nav>
      </div>
    </>
  );
}
