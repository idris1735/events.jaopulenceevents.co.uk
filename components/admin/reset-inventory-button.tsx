"use client";

import { useState } from "react";

interface ResetInventoryButtonProps {
  eventId: string;
  onDone?: () => void;
}

export function ResetInventoryButton({ eventId, onDone }: ResetInventoryButtonProps) {
  const [status, setStatus]   = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function run(mode: "inventory" | "full") {
    const label = mode === "full"
      ? "This will permanently delete ALL orders, guests, tickets, and email records for this event, then restore inventory to full capacity.\n\nType DELETE to confirm:"
      : "This will restore all tier inventory to full capacity without touching orders.\n\nType RESET to confirm:";
    const expected = mode === "full" ? "DELETE" : "RESET";

    const answer = window.prompt(label);
    if (answer?.trim().toUpperCase() !== expected) {
      window.alert("Cancelled — confirmation text did not match.");
      return;
    }

    setStatus("busy");
    setMessage("");

    try {
      const res  = await fetch("/api/admin/reset-inventory", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ eventId, mode })
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Unknown error.");
      } else {
        setStatus("done");
        setMessage(mode === "full" ? "All test data cleared and inventory restored." : "Inventory restored to full capacity.");
        onDone?.();
        // Auto-reset status after 5 s
        setTimeout(() => setStatus("idle"), 5000);
      }
    } catch {
      setStatus("error");
      setMessage("Network error — please try again.");
    }
  }

  return (
    <div
      style={{
        padding: "1.4rem 1.6rem",
        borderRadius: "14px",
        border: "1px solid rgba(201,75,75,0.2)",
        background: "rgba(201,75,75,0.04)"
      }}
    >
      <p
        style={{
          margin: "0 0 0.35rem",
          fontSize: "0.68rem",
          textTransform: "uppercase",
          letterSpacing: "0.18rem",
          fontWeight: 700,
          color: "#f5a5a5"
        }}
      >
        Danger zone · Owner only
      </p>
      <p style={{ margin: "0 0 1.1rem", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.6 }}>
        Use these to undo test simulations. Both actions restore inventory to full capacity.
        <strong style={{ color: "var(--text)" }}> "Clear all data"</strong> also deletes every order, guest, ticket, and email record.
      </p>

      <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
        <button
          className="button-ghost"
          style={{ fontSize: "0.82rem" }}
          disabled={status === "busy"}
          onClick={() => run("inventory")}
        >
          {status === "busy" ? "Working…" : "Reset inventory only"}
        </button>

        <button
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "3.1rem",
            borderRadius: "999px",
            padding: "0 1.4rem",
            border: "1px solid rgba(201,75,75,0.45)",
            background: "rgba(201,75,75,0.08)",
            color: "#f5a5a5",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: status === "busy" ? "not-allowed" : "pointer",
            opacity: status === "busy" ? 0.6 : 1,
            transition: "background 0.2s, border-color 0.2s"
          }}
          disabled={status === "busy"}
          onClick={() => run("full")}
        >
          Clear all test data
        </button>
      </div>

      {status === "done" && (
        <p style={{ margin: "0.9rem 0 0", fontSize: "0.83rem", color: "#b8d98a" }}>
          ✓ {message}
        </p>
      )}
      {status === "error" && (
        <p style={{ margin: "0.9rem 0 0", fontSize: "0.83rem", color: "#f5a5a5" }}>
          ✗ {message}
        </p>
      )}
    </div>
  );
}
