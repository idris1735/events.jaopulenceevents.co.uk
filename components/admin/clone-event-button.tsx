"use client";

import { useTransition, useState } from "react";
import { cloneEvent } from "@/lib/admin-actions";

export function CloneEventButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClone() {
    setError(null);
    startTransition(async () => {
      const result = await cloneEvent(eventId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div>
      <button
        type="button"
        className="button-ghost"
        onClick={handleClone}
        disabled={pending}
        title="Duplicate this event as a draft"
        style={{ fontSize: "0.78rem", padding: "0.38rem 0.9rem" }}
      >
        {pending ? "Cloning..." : "Clone"}
      </button>
      {error && (
        <p style={{ margin: "0.3rem 0 0", fontSize: "0.72rem", color: "#f5a5a5" }}>{error}</p>
      )}
    </div>
  );
}
