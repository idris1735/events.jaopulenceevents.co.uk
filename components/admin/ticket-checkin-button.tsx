"use client";

import { useState } from "react";

export function TicketCheckinButton({ publicId }: { publicId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "already" | "error">("idle");
  const [error, setError] = useState("");

  async function handleCheckin() {
    setState("loading");
    const res = await fetch("/api/admin/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId })
    });
    const payload = await res.json().catch(() => null);

    if (payload?.alreadyUsed) { setState("already"); return; }
    if (!res.ok) { setError(payload?.error ?? "Error"); setState("error"); return; }
    setState("done");
  }

  if (state === "done") {
    return (
      <div
        style={{
          padding: "0.85rem 1.2rem",
          borderRadius: "12px",
          background: "rgba(136,168,97,0.10)",
          border: "1px solid rgba(136,168,97,0.28)",
          fontSize: "0.88rem",
          fontWeight: 600,
          color: "#b8d98a",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Guest admitted — ticket marked used
      </div>
    );
  }

  if (state === "already") {
    return (
      <div
        style={{
          padding: "0.85rem 1.2rem",
          borderRadius: "12px",
          background: "rgba(212,175,55,0.08)",
          border: "1px solid rgba(212,175,55,0.3)",
          fontSize: "0.88rem",
          color: "var(--gold-soft)"
        }}
      >
        ⚠ Already checked in — this ticket was previously used
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <button
        className="button"
        type="button"
        disabled={state === "loading"}
        onClick={handleCheckin}
        style={{ borderRadius: "12px" }}
      >
        {state === "loading" ? "Processing…" : "Check in this guest"}
      </button>
      {state === "error" && (
        <p style={{ margin: 0, fontSize: "0.78rem", color: "#f5a5a5" }}>{error}</p>
      )}
    </div>
  );
}
