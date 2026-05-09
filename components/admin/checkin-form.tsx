"use client";

import { useEffect, useRef, useState } from "react";

type TicketInfo = {
  publicId: string;
  guestName: string;
  eventName: string;
  tierName: string;
  status: "issued" | "used" | "void";
};

type CheckinState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "admitted";    ticket: TicketInfo }
  | { phase: "already_used"; ticket: TicketInfo }
  | { phase: "void";        ticket: TicketInfo }
  | { phase: "error";       message: string };

export function CheckinForm() {
  const [input, setInput]   = useState("");
  const [state, setState]   = useState<CheckinState>({ phase: "idle" });
  const inputRef            = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = input.trim().toUpperCase();
    if (!id) return;

    setState({ phase: "loading" });

    const res = await fetch("/api/admin/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId: id })
    });

    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      if (payload?.ticket?.status === "void") {
        setState({ phase: "void", ticket: payload.ticket });
      } else {
        setState({ phase: "error", message: payload?.error ?? "Something went wrong." });
      }
      return;
    }

    if (payload.alreadyUsed) {
      setState({ phase: "already_used", ticket: payload.ticket });
      return;
    }

    setState({ phase: "admitted", ticket: payload.ticket });
  }

  function reset() {
    setInput("");
    setState({ phase: "idle" });
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const resultBg: Record<string, string> = {
    admitted:    "rgba(136,168,97,0.10)",
    already_used: "rgba(212,175,55,0.10)",
    void:        "rgba(201,75,75,0.10)",
    error:       "rgba(201,75,75,0.10)"
  };
  const resultBorder: Record<string, string> = {
    admitted:    "rgba(136,168,97,0.30)",
    already_used: "rgba(212,175,55,0.35)",
    void:        "rgba(201,75,75,0.30)",
    error:       "rgba(201,75,75,0.30)"
  };
  const resultColor: Record<string, string> = {
    admitted:    "#b8d98a",
    already_used: "var(--gold-soft)",
    void:        "#f5a5a5",
    error:       "#f5a5a5"
  };

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto" }}>

      {/* Search form */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "stretch" }}>
          <input
            ref={inputRef}
            className="field"
            type="text"
            placeholder="Ticket ID — e.g. A3F9C1"
            value={input}
            onChange={(e) => {
              setInput(e.target.value.toUpperCase());
              if (state.phase !== "idle" && state.phase !== "loading") setState({ phase: "idle" });
            }}
            style={{
              flex: 1,
              fontFamily: "monospace",
              fontSize: "1.05rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase"
            }}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            className="button"
            type="submit"
            disabled={state.phase === "loading" || !input.trim()}
            style={{ borderRadius: "12px", minWidth: "5rem", whiteSpace: "nowrap" }}
          >
            {state.phase === "loading" ? "…" : "Look up"}
          </button>
        </div>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--faint)" }}>
          Paste the 6-character code from the QR ticket, or scan the QR to open the ticket page directly.
        </p>
      </form>

      {/* Result card */}
      {state.phase !== "idle" && state.phase !== "loading" && (
        <div
          style={{
            marginTop: "1.6rem",
            borderRadius: "16px",
            background: resultBg[state.phase] ?? "rgba(255,255,255,0.04)",
            border: `1px solid ${resultBorder[state.phase] ?? "var(--line)"}`,
            padding: "1.6rem 1.8rem",
            animation: "scaleIn 0.22s var(--ease) both"
          }}
        >
          {/* Status headline */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>
              {state.phase === "admitted"    ? "✓"
              : state.phase === "already_used" ? "⚠"
              : "✕"}
            </span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem", color: resultColor[state.phase] }}>
                {state.phase === "admitted"    ? "Admitted"
                : state.phase === "already_used" ? "Already checked in"
                : state.phase === "void"        ? "Ticket voided"
                : "Not found"}
              </p>
              {state.phase === "error" && (
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)" }}>{state.message}</p>
              )}
            </div>
          </div>

          {/* Guest details */}
          {"ticket" in state && (
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.07)",
                paddingTop: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem"
              }}
            >
              {[
                { label: "Guest",  value: state.ticket.guestName },
                { label: "Tier",   value: state.ticket.tierName  },
                { label: "Event",  value: state.ticket.eventName },
                { label: "Ticket", value: state.ticket.publicId  }
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", gap: "0.5rem", fontSize: "0.88rem" }}>
                  <span style={{ color: "var(--faint)", minWidth: "3.5rem" }}>{label}</span>
                  <span style={{ color: "var(--text-strong)", fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Next action */}
          <div style={{ marginTop: "1.2rem" }}>
            <button
              className="button-ghost"
              type="button"
              onClick={reset}
              style={{ borderRadius: "10px", fontSize: "0.82rem" }}
            >
              ← Check another ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
