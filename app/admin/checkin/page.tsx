import type { Metadata } from "next";

import { CheckinForm } from "@/components/admin/checkin-form";
import { requireAdminSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Check-in · Admin" };

export default async function CheckinPage() {
  await requireAdminSession();

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <p className="kicker" style={{ marginBottom: "0.3rem" }}>Event day</p>
        <h1 className="section-title" style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>
          Guest check-in
        </h1>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--faint)" }}>
          Enter the 6-character ticket ID to look up and admit a guest. The ticket status updates instantly.
        </p>
      </div>

      <div
        className="panel"
        style={{ padding: "2rem", borderRadius: "18px", maxWidth: "520px" }}
      >
        <CheckinForm />
      </div>

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem 1.4rem",
          borderRadius: "12px",
          background: "rgba(212,175,55,0.04)",
          border: "1px solid rgba(212,175,55,0.12)",
          maxWidth: "520px",
          fontSize: "0.8rem",
          color: "var(--faint)",
          lineHeight: 1.7
        }}
      >
        <strong style={{ color: "var(--muted)" }}>How to use on the door</strong><br />
        Option A — Guest shows their phone: tap the QR code image on their ticket page, it opens directly here.<br />
        Option B — Guest shows printed PDF: scan the QR with your phone camera. It opens the ticket page which has a check-in button if you are logged in.
      </div>
    </div>
  );
}
