import type { Metadata } from "next";
import Link from "next/link";

import { requireAdminSession } from "@/lib/auth";
import { EventForm } from "@/components/admin/event-form";

export const metadata: Metadata = { title: "New Event — Admin" };

export default async function NewEventPage() {
  await requireAdminSession();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <Link
          href="/admin/events"
          style={{ fontSize: "0.78rem", color: "var(--muted)", textDecoration: "none", letterSpacing: "0.05em" }}
        >
          ← All events
        </Link>
        <p className="kicker" style={{ marginBottom: "0.3rem", marginTop: "0.8rem" }}>Events</p>
        <h1 className="section-title" style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>
          Create new event
        </h1>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--faint)" }}>
          Fill in the details below. You can add ticket tiers after saving.
        </p>
      </div>

      <div className="panel" style={{ padding: "2rem 2.2rem", maxWidth: "800px" }}>
        <EventForm mode="create" />
      </div>
    </div>
  );
}
