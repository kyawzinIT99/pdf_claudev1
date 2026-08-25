"use client";

import { FormEvent, useId, useState } from "react";

export function MailSubscribe({
  source = "website",
  compact = false,
}: {
  source?: string;
  compact?: boolean;
}) {
  const titleId = useId();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError(false);
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    try {
      const response = await fetch("/api/subscribers", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          consent: form.get("consent") === "on",
          source,
          page: typeof window !== "undefined" ? window.location.pathname : source,
          website: form.get("website"),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          payload.error || "Unable to subscribe right now. Check your connection and try again.",
        );
      }
      setNotice(
        payload.message ||
          "Thanks — PDF will email you approved event notices. Staff are alerted through n8n.",
      );
      formEl.reset();
    } catch (err) {
      setError(true);
      setNotice(
        err instanceof Error ? err.message : "Unable to subscribe right now.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className={compact ? "mail-subscribe pdf-subscribe is-compact" : "mail-subscribe pdf-subscribe"}
      aria-labelledby={titleId}
    >
      <div className="mail-subscribe-copy">
        <p className="mail-subscribe-eyebrow">PDF mailing list</p>
        <h2 id={titleId}>Event notices from this website</h2>
        <p>
          Subscribe to <strong>PDF Myanmar Relief</strong> only. You get approved
          upcoming-event emails. Your address stays in the Admin Panel; n8n
          alerts staff and can send the mail. This is not a BCC WA list.
        </p>
      </div>
      <form className="mail-subscribe-form" onSubmit={onSubmit}>
        <label>
          Name
          <input
            name="name"
            type="text"
            maxLength={80}
            autoComplete="name"
            placeholder="Your name"
          />
        </label>
        <label>
          Email
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <label className="mail-subscribe-honeypot" aria-hidden="true">
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
        <label className="mail-subscribe-consent">
          <input name="consent" type="checkbox" value="on" required />
          <span>
            I want PDF event emails and I understand I can ask staff to remove me.
          </span>
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Subscribing…" : "Subscribe to PDF events"}
        </button>
        {notice ? (
          <p
            className={`mail-subscribe-notice${error ? " is-error" : " is-ok"}`}
            role="status"
          >
            {notice}
          </p>
        ) : null}
      </form>
    </section>
  );
}
