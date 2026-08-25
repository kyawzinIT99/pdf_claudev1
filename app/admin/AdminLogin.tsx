"use client";

import { FormEvent, useState } from "react";
import type { StaffUser } from "../lib/auth";
import { LogoMark } from "../components/LogoMark";

export function AdminLogin({ onSignedIn }: { onSignedIn: (user: StaffUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setNotice("");
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to sign in");
      onSignedIn(payload.user);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-login-shell">
      <section className="admin-login-brand">
        <div className="wordmark">
          <LogoMark />
          <span>PDF<br />MYANMAR RELIEF</span>
        </div>
        <p>PRIVATE STAFF WORKSPACE</p>
        <h1>Publish with care. Manage access with confidence.</h1>
        <div className="access-boundary">
          <strong>Two separate responsibilities</strong>
          <p>Website staff accounts live here. Hostinger hPanel remains owner-only infrastructure access.</p>
        </div>
      </section>
      <form className="admin-login-card" onSubmit={signIn}>
        <p className="eyebrow">Secure sign in</p>
        <h2>Staff Admin Panel</h2>
        <p>Use the account created for your publishing role.</p>
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {notice && <div className="admin-notice" role="alert">{notice}</div>}
        <button className="button-review" type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in →"}
        </button>
        <small>
          The first Owner account is created from protected deployment secrets.
          No default password is stored in the code.
        </small>
      </form>
    </main>
  );
}
