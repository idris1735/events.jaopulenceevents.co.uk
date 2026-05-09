"use client";

import { useTransition, useState } from "react";
import { setEventStatus } from "@/lib/admin-actions";
import { EventStatus } from "@/lib/types";

interface Props {
  eventId: string;
  currentStatus: EventStatus;
}

export function EventStatusToggle({ eventId, currentStatus }: Props) {
  const [status, setStatus] = useState<EventStatus>(currentStatus);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: EventStatus) {
    if (next === status) return;
    setError(null);
    startTransition(async () => {
      const result = await setEventStatus(eventId, next);
      if (result.error) setError(result.error);
      else setStatus(next);
    });
  }

  const options: { value: EventStatus; label: string; confirm?: string }[] = [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Publish", confirm: "Publish this event? It will be visible to the public." },
    { value: "archived", label: "Archive", confirm: "Archive this event? It will be hidden from the public." }
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          borderRadius: "10px",
          border: "1px solid var(--line-subtle)",
          overflow: "hidden"
        }}
      >
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            disabled={pending || status === opt.value}
            onClick={() => {
              if (opt.confirm && !confirm(opt.confirm)) return;
              change(opt.value);
            }}
            style={{
              flex: 1,
              padding: "0.5rem 0.9rem",
              fontSize: "0.76rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
              border: "none",
              cursor: status === opt.value ? "default" : "pointer",
              transition: "background 0.15s, color 0.15s",
              background: status === opt.value ? "rgba(212,175,55,0.12)" : "transparent",
              color: status === opt.value ? "var(--gold-soft)" : "var(--muted)",
              opacity: pending ? 0.6 : 1
            }}
          >
            {status === opt.value && pending ? "..." : opt.label}
          </button>
        ))}
      </div>
      {error && (
        <p style={{ margin: "0.4rem 0 0", fontSize: "0.74rem", color: "#f5a5a5" }}>{error}</p>
      )}
    </div>
  );
}
