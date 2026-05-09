"use client";

import { useState } from "react";

interface StaffMember {
  id: string;
  displayName: string;
  email: string;
  role: string;
  lastSignIn: string | null;
}

interface InviteStaffFormProps {
  initialStaff: StaffMember[];
}

export function InviteStaffForm({ initialStaff }: InviteStaffFormProps) {
  const [staff, setStaff]           = useState<StaffMember[]>(initialStaff);
  const [email, setEmail]           = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pending, setPending]       = useState(false);
  const [message, setMessage]       = useState<{ text: string; ok: boolean } | null>(null);
  const [removing, setRemoving]     = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage(null);

    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), displayName: displayName.trim() })
    });

    const payload = await res.json().catch(() => null);
    setPending(false);

    if (!res.ok) {
      setMessage({ text: payload?.error ?? "Invite failed.", ok: false });
      return;
    }

    setMessage({ text: `Invite sent to ${payload.email}. They will receive a sign-in link by email.`, ok: true });
    setEmail("");
    setDisplayName("");

    const refreshRes = await fetch("/api/admin/staff");
    const refreshData = await refreshRes.json().catch(() => null);
    if (refreshData?.staff) setStaff(refreshData.staff);
  }

  async function handleRemove(profileId: string, name: string) {
    if (!confirm(`Remove ${name} from staff? They will lose admin access immediately.`)) return;
    setRemoving(profileId);

    const res = await fetch(`/api/admin/staff?profileId=${profileId}`, { method: "DELETE" });
    const payload = await res.json().catch(() => null);
    setRemoving(null);

    if (!res.ok) {
      alert(payload?.error ?? "Could not remove staff member.");
      return;
    }

    setStaff((prev) => prev.filter((s) => s.id !== profileId));
  }

  function formatDate(iso: string | null) {
    if (!iso) return "Never";
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

      {/* Current staff list */}
      <div>
        <p className="kicker" style={{ marginBottom: "0.8rem" }}>Current staff</p>
        <div className="table-wrapper">
          <div className="table-scroll">
            <table className="table" style={{ minWidth: "480px" }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Last sign-in</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--faint)", padding: "2rem" }}>
                      No staff yet.
                    </td>
                  </tr>
                ) : (
                  staff.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.displayName}</td>
                      <td style={{ color: "var(--muted)", fontSize: "0.86rem" }}>{s.email}</td>
                      <td>
                        <span
                          className="status-pill"
                          style={{
                            background: s.role === "owner" ? "rgba(212,175,55,0.14)" : "rgba(100,160,220,0.14)",
                            color: s.role === "owner" ? "var(--gold-soft)" : "rgba(100,160,220,0.9)",
                            border: `1px solid ${s.role === "owner" ? "rgba(212,175,55,0.2)" : "rgba(100,160,220,0.2)"}`
                          }}
                        >
                          {s.role}
                        </span>
                      </td>
                      <td style={{ color: "var(--faint)", fontSize: "0.82rem" }}>{formatDate(s.lastSignIn)}</td>
                      <td>
                        {s.role !== "owner" && (
                          <button
                            className="button-ghost"
                            type="button"
                            disabled={removing === s.id}
                            onClick={() => handleRemove(s.id, s.displayName)}
                            style={{
                              padding: "0.3rem 0.7rem",
                              borderRadius: "8px",
                              fontSize: "0.76rem",
                              color: "#f5a5a5",
                              borderColor: "rgba(201,75,75,0.25)"
                            }}
                          >
                            {removing === s.id ? "Removing…" : "Remove"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invite form */}
      <div>
        <p className="kicker" style={{ marginBottom: "0.4rem" }}>Invite a staff member</p>
        <p style={{ margin: "0 0 1.2rem", fontSize: "0.82rem", color: "var(--faint)" }}>
          They will receive a sign-in link by email. Staff can manage orders and check tickets but cannot create or delete events.
        </p>

        <form onSubmit={handleInvite} style={{ display: "flex", flexDirection: "column", gap: "0.9rem", maxWidth: "400px" }}>
          <div className="stack" style={{ gap: "0.3rem" }}>
            <label className="kicker" style={{ fontSize: "0.62rem" }}>Display name</label>
            <input
              className="field"
              type="text"
              placeholder="e.g. Sarah Jones"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div className="stack" style={{ gap: "0.3rem" }}>
            <label className="kicker" style={{ fontSize: "0.62rem" }}>Email address</label>
            <input
              className="field"
              type="email"
              placeholder="staff@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            className="button"
            type="submit"
            disabled={pending}
            style={{ borderRadius: "12px", alignSelf: "flex-start", minWidth: "10rem" }}
          >
            {pending ? "Sending invite…" : "Send invite"}
          </button>

          {message && (
            <p
              style={{
                margin: 0,
                padding: "0.8rem 1rem",
                borderRadius: "10px",
                fontSize: "0.82rem",
                color: message.ok ? "#b8d98a" : "#f5a5a5",
                background: message.ok ? "rgba(136,168,97,0.08)" : "rgba(201,75,75,0.08)",
                border: `1px solid ${message.ok ? "rgba(136,168,97,0.2)" : "rgba(201,75,75,0.2)"}`
              }}
            >
              {message.text}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
