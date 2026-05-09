"use client";

import { useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignInForm() {
  const [email, setEmail]       = useState("");
  const [mode, setMode]         = useState<"magic" | "password">("magic");
  const [password, setPassword] = useState("");
  const [message, setMessage]   = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [pending, setPending]   = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage({ text: "Supabase is not configured. Add the environment variables to continue.", type: "error" });
      return;
    }

    setPending(true);
    setMessage(null);

    const redirectTo = `${window.location.origin}/auth/callback`;

    if (mode === "magic") {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo }
      });
      setPending(false);
      setMessage(
        error
          ? { text: error.message, type: "error" }
          : { text: "Magic link sent. Check your inbox and open the link on this device.", type: "success" }
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);

    if (error) {
      setMessage({ text: error.message, type: "error" });
      return;
    }

    window.location.assign("/admin");
  }

  return (
    <form className="stack" onSubmit={handleSubmit} style={{ gap: "1.1rem" }}>

      {/* Mode toggle */}
      <div
        style={{
          display: "flex",
          borderRadius: "10px",
          border: "1px solid var(--line-subtle)",
          overflow: "hidden",
          marginBottom: "0.2rem"
        }}
      >
        {(["magic", "password"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setMessage(null); }}
            style={{
              flex: 1,
              padding: "0.6rem 0.9rem",
              fontSize: "0.78rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
              background: mode === m ? "rgba(212,175,55,0.12)" : "transparent",
              color: mode === m ? "var(--gold-soft)" : "var(--muted)"
            }}
          >
            {m === "magic" ? "Magic link" : "Password"}
          </button>
        ))}
      </div>

      {/* Email */}
      <div className="stack" style={{ gap: "0.4rem" }}>
        <label
          className="kicker"
          htmlFor="email"
          style={{ fontSize: "0.62rem", letterSpacing: "0.2rem" }}
        >
          Email address
        </label>
        <input
          id="email"
          className="field"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
        />
      </div>

      {/* Password (conditional) */}
      {mode === "password" && (
        <div className="stack" style={{ gap: "0.4rem" }}>
          <label
            className="kicker"
            htmlFor="password"
            style={{ fontSize: "0.62rem", letterSpacing: "0.2rem" }}
          >
            Password
          </label>
          <input
            id="password"
            className="field"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
      )}

      {/* Magic link info */}
      {mode === "magic" && (
        <p className="note" style={{ fontSize: "0.78rem", color: "var(--faint)", margin: 0 }}>
          A one-time link will be sent to your inbox. Open it on this device to authenticate.
        </p>
      )}

      {/* Submit */}
      <button
        className="button"
        type="submit"
        disabled={pending}
        style={{ width: "100%", borderRadius: "12px", minHeight: "3rem" }}
      >
        {pending
          ? "Working..."
          : mode === "magic"
          ? "Send magic link"
          : "Sign in"}
      </button>

      {/* Feedback message */}
      {message && (
        <p
          className="note"
          style={{
            margin: 0,
            padding: "0.85rem 1rem",
            borderRadius: "10px",
            fontSize: "0.82rem",
            lineHeight: 1.5,
            color: message.type === "success" ? "#b8d98a" : "#f5a5a5",
            background: message.type === "success" ? "rgba(136,168,97,0.08)" : "rgba(201,75,75,0.08)",
            border: `1px solid ${message.type === "success" ? "rgba(136,168,97,0.2)" : "rgba(201,75,75,0.2)"}`
          }}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
