"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    const current = document.documentElement.getAttribute("data-theme");
    const resolved = (saved ?? current ?? "dark") as "dark" | "light";
    setTheme(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  if (!mounted) {
    return <div style={{ width: "2.2rem", height: "2.2rem", flexShrink: 0 }} aria-hidden="true" />;
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        /* Sun icon */
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <circle cx="7.5" cy="7.5" r="2.8" stroke="currentColor" strokeWidth="1.4" />
          <line x1="7.5" y1="0.5" x2="7.5" y2="2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="7.5" y1="12.5" x2="7.5" y2="14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="0.5" y1="7.5" x2="2.5" y2="7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="12.5" y1="7.5" x2="14.5" y2="7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="2.55" y1="2.55" x2="3.96" y2="3.96" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="11.04" y1="11.04" x2="12.45" y2="12.45" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="12.45" y1="2.55" x2="11.04" y2="3.96" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="3.96" y1="11.04" x2="2.55" y2="12.45" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ) : (
        /* Moon icon */
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M12.5 8.5A6 6 0 1 1 5.5 1.5a4.5 4.5 0 0 0 7 7z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
