"use client";

import { useState } from "react";

interface ResendOrderButtonProps {
  orderId: string;
}

export function ResendOrderButton({ orderId }: ResendOrderButtonProps) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleResend() {
    setPending(true);
    setResult(null);

    const response = await fetch("/api/admin/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId })
    });

    const payload = await response.json().catch(() => null);
    setPending(false);

    setResult({
      ok: response.ok,
      message: response.ok
        ? "Email queued."
        : (payload?.error ?? "Unable to resend confirmation.")
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", alignItems: "flex-start" }}>
      <button
        className="button-ghost"
        type="button"
        onClick={handleResend}
        disabled={pending}
        style={{ fontSize: "0.78rem", padding: "0.3rem 0.7rem", borderRadius: "8px", whiteSpace: "nowrap" }}
      >
        {pending ? "Sending…" : "Resend email"}
      </button>
      {result && (
        <span
          style={{
            fontSize: "0.72rem",
            color: result.ok ? "#b8d98a" : "#f5a5a5"
          }}
        >
          {result.message}
        </span>
      )}
    </div>
  );
}
