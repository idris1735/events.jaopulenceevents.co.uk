"use client";

import { useState, useTransition } from "react";

import { createTier, updateTier, hideTier, restoreTier, TierFormData } from "@/lib/admin-actions";
import { TicketTierRecord, TicketTierStatus } from "@/lib/types";

interface TierManagerProps {
  eventId: string;
  initialTiers: TicketTierRecord[];
}

const EMPTY_TIER: TierFormData = {
  name: "",
  description: "",
  price_gbp: 0,
  capacity: 100,
  max_per_order: 6,
  guests_per_unit: 1,
  status: "active"
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.8rem",
  borderRadius: "8px",
  border: "1px solid rgba(212,175,55,0.18)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--text)",
  fontSize: "0.84rem",
  outline: "none",
  boxSizing: "border-box"
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.6rem",
  letterSpacing: "0.16rem",
  textTransform: "uppercase",
  color: "var(--muted)",
  fontWeight: 700,
  display: "block",
  marginBottom: "0.3rem"
};

function TierForm({
  initial,
  onSave,
  onCancel,
  pending
}: {
  initial: TierFormData;
  onSave: (data: TierFormData) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [form, setForm] = useState<TierFormData>(initial);

  function set<K extends keyof TierFormData>(key: K, value: TierFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div
      style={{
        padding: "1.2rem",
        borderRadius: "12px",
        border: "1px solid rgba(212,175,55,0.2)",
        background: "rgba(212,175,55,0.03)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0.85rem"
      }}
    >
      <div>
        <label style={labelStyle}>Tier name *</label>
        <input
          style={fieldStyle}
          type="text"
          required
          value={form.name}
          onChange={e => set("name", e.target.value)}
          placeholder="VIP, General, Early Bird..."
        />
      </div>
      <div>
        <label style={labelStyle}>Price (GBP) *</label>
        <input
          style={fieldStyle}
          type="number"
          required
          min={0}
          step={0.01}
          value={form.price_gbp}
          onChange={e => set("price_gbp", parseFloat(e.target.value) || 0)}
        />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Description</label>
        <input
          style={fieldStyle}
          type="text"
          value={form.description}
          onChange={e => set("description", e.target.value)}
          placeholder="What's included in this tier"
        />
      </div>
      <div>
        <label style={labelStyle}>Capacity *</label>
        <input
          style={fieldStyle}
          type="number"
          required
          min={1}
          value={form.capacity}
          onChange={e => set("capacity", parseInt(e.target.value) || 1)}
        />
      </div>
      <div>
        <label style={labelStyle}>Max per order</label>
        <input
          style={fieldStyle}
          type="number"
          min={1}
          max={20}
          value={form.max_per_order}
          onChange={e => set("max_per_order", parseInt(e.target.value) || 1)}
        />
      </div>
      <div>
        <label style={labelStyle}>Guests per unit</label>
        <input
          style={fieldStyle}
          type="number"
          min={1}
          max={50}
          value={form.guests_per_unit}
          onChange={e => set("guests_per_unit", parseInt(e.target.value) || 1)}
          title="1 = single ticket, 2 = couples, 10 = group of 10"
        />
      </div>
      <div>
        <label style={labelStyle}>Status</label>
        <select
          style={{ ...fieldStyle, cursor: "pointer" }}
          value={form.status}
          onChange={e => set("status", e.target.value as TicketTierStatus)}
        >
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
          <option value="sold_out">Sold out</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-end" }}>
        <button
          type="button"
          className="button"
          onClick={() => onSave(form)}
          disabled={pending || !form.name.trim()}
          style={{ fontSize: "0.82rem", padding: "0.5rem 1.1rem" }}
        >
          {pending ? "Saving..." : "Save tier"}
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={onCancel}
          disabled={pending}
          style={{ fontSize: "0.82rem", padding: "0.5rem 0.9rem" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function TierManager({ eventId, initialTiers }: TierManagerProps) {
  const [tiers, setTiers]           = useState<TicketTierRecord[]>(initialTiers);
  const [adding, setAdding]         = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [pending, startTransition]  = useTransition();
  const [error, setError]           = useState<string | null>(null);

  const visibleTiers = tiers.filter(t => t.status !== "hidden");
  const hiddenTiers  = tiers.filter(t => t.status === "hidden");

  function handleCreate(data: TierFormData) {
    setError(null);
    startTransition(async () => {
      const result = await createTier(eventId, data);
      if (result.error) { setError(result.error); return; }
      setTiers(prev => [...prev, {
        id: crypto.randomUUID(),
        event_id: eventId,
        ...data,
        remaining: data.capacity
      }]);
      setAdding(false);
    });
  }

  function handleUpdate(tier: TicketTierRecord, data: TierFormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateTier(tier.id, eventId, data);
      if (result.error) { setError(result.error); return; }
      // Recalculate remaining the same way the server does
      const sold         = tier.capacity - tier.remaining;
      const newRemaining = result.newRemaining ?? Math.max(0, data.capacity - sold);
      setTiers(prev => prev.map(t =>
        t.id === tier.id ? { ...t, ...data, remaining: newRemaining } : t
      ));
      setEditingId(null);
    });
  }

  function handleHide(tierId: string) {
    setError(null);
    startTransition(async () => {
      const result = await hideTier(tierId, eventId);
      if (result.error) { setError(result.error); return; }
      setTiers(prev => prev.map(t => t.id === tierId ? { ...t, status: "hidden" } : t));
    });
  }

  function handleRestore(tierId: string) {
    setError(null);
    startTransition(async () => {
      const result = await restoreTier(tierId, eventId);
      if (result.error) { setError(result.error); return; }
      setTiers(prev => prev.map(t => t.id === tierId ? { ...t, status: "active" } : t));
    });
  }

  const statusColor = (s: TicketTierStatus) =>
    s === "active" ? "#b8d98a" : s === "sold_out" ? "#f5a5a5" : "var(--muted)";

  function TierRow({ tier, isHidden = false }: { tier: TicketTierRecord; isHidden?: boolean }) {
    if (editingId === tier.id) {
      return (
        <TierForm
          initial={{ name: tier.name, description: tier.description, price_gbp: tier.price_gbp, capacity: tier.capacity, max_per_order: tier.max_per_order, guests_per_unit: tier.guests_per_unit ?? 1, status: tier.status }}
          onSave={data => handleUpdate(tier, data)}
          onCancel={() => setEditingId(null)}
          pending={pending}
        />
      );
    }

    return (
      <div
        style={{
          padding: "1rem 1.2rem",
          borderRadius: "12px",
          border: `1px solid ${isHidden ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.07)"}`,
          background: isHidden ? "transparent" : "rgba(255,255,255,0.02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          opacity: isHidden ? 0.6 : 1
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: "0.9rem" }}>
              {tier.name}
            </div>
            {tier.description && (
              <div style={{ fontSize: "0.76rem", color: "var(--faint)", marginTop: "0.1rem" }}>{tier.description}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.9rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--gold-soft)", fontWeight: 700 }}>
              £{tier.price_gbp.toFixed(2)}
            </span>
            {!isHidden && (
              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                {tier.remaining}/{tier.capacity} remaining
              </span>
            )}
            <span style={{ fontSize: "0.74rem", color: statusColor(tier.status), fontWeight: 600, textTransform: "capitalize" }}>
              {isHidden ? "Hidden" : tier.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {isHidden ? (
            <button
              type="button"
              className="button-ghost"
              onClick={() => handleRestore(tier.id)}
              disabled={pending}
              style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem" }}
            >
              Restore
            </button>
          ) : (
            <>
              <button
                type="button"
                className="button-ghost"
                onClick={() => setEditingId(tier.id)}
                disabled={pending}
                style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem" }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleHide(tier.id)}
                disabled={pending}
                style={{
                  padding: "0.35rem 0.8rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  color: "var(--muted)",
                  fontSize: "0.78rem",
                  cursor: "pointer"
                }}
              >
                Hide
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: "1rem" }}>

      {error && (
        <p style={{ margin: 0, padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.82rem", color: "#f5a5a5", background: "rgba(201,75,75,0.08)", border: "1px solid rgba(201,75,75,0.2)" }}>
          {error}
        </p>
      )}

      {visibleTiers.length === 0 && !adding && (
        <p style={{ color: "var(--faint)", fontSize: "0.85rem", margin: 0 }}>
          No active ticket tiers yet. Add at least one before publishing.
        </p>
      )}

      {visibleTiers.map(tier => <TierRow key={tier.id} tier={tier} />)}

      {adding ? (
        <TierForm
          initial={EMPTY_TIER}
          onSave={handleCreate}
          onCancel={() => setAdding(false)}
          pending={pending}
        />
      ) : (
        <button
          type="button"
          className="button-secondary"
          onClick={() => setAdding(true)}
          style={{ alignSelf: "flex-start", fontSize: "0.84rem" }}
        >
          + Add ticket tier
        </button>
      )}

      {/* Hidden tiers — collapsible */}
      {hiddenTiers.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          <button
            type="button"
            onClick={() => setShowHidden(v => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--faint)",
              fontSize: "0.76rem",
              letterSpacing: "0.08em",
              padding: "0.3rem 0",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <span style={{ fontSize: "0.6rem" }}>{showHidden ? "▾" : "▸"}</span>
            {hiddenTiers.length} hidden tier{hiddenTiers.length !== 1 ? "s" : ""}
          </button>
          {showHidden && (
            <div className="stack" style={{ gap: "0.6rem", marginTop: "0.6rem" }}>
              {hiddenTiers.map(tier => <TierRow key={tier.id} tier={tier} isHidden />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
