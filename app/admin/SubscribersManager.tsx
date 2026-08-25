"use client";

import { useEffect, useState } from "react";
import type { StaffUser } from "../lib/auth";

type Subscriber = {
  id: number;
  name: string;
  email: string;
  status: string;
  source: string;
  created_at: string;
};

export function SubscribersManager({ currentUser }: { currentUser: StaffUser }) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const canManage = currentUser.role !== "editor";

  useEffect(() => {
    if (!canManage) return;
    let active = true;
    fetch("/api/subscribers", { credentials: "same-origin", cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload) => {
        if (active) setSubscribers(payload.subscribers || []);
      })
      .catch(() => {
        if (active) setNotice("Subscriber list is temporarily unavailable.");
      });
    return () => {
      active = false;
    };
  }, [canManage]);

  if (!canManage) return null;

  async function setStatus(id: number, status: "active" | "unsubscribed") {
    setBusyId(id);
    setNotice("");
    try {
      const response = await fetch("/api/subscribers", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) throw new Error();
      const payload = await response.json();
      setSubscribers((current) =>
        current.map((item) =>
          item.id === id ? { ...item, ...payload.subscriber } : item,
        ),
      );
      setNotice(
        status === "active"
          ? "Subscriber reactivated."
          : "Subscriber marked unsubscribed.",
      );
    } catch {
      setNotice("Unable to update subscriber.");
    } finally {
      setBusyId(null);
    }
  }

  const active = subscribers.filter((item) => item.status === "active").length;

  return (
    <section className="content-table" id="subscribers">
      <div className="panel-heading">
        <div>
          <p>MAIL LIST</p>
          <h2>Event email subscribers</h2>
        </div>
        <span>
          {active} active · {subscribers.length} total
        </span>
      </div>
      <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: 13 }}>
        New sign-ups alert staff via n8n. When you publish an upcoming event,
        n8n can email this active list.
      </p>
      {notice ? <p className="contact-notice" role="status">{notice}</p> : null}
      <div className="table-head">
        <span>Person</span>
        <span>Status</span>
        <span>Source</span>
        <span>Action</span>
      </div>
      {subscribers.length === 0 ? (
        <article className="content-row">
          <div>
            <p>
              No subscribers yet
              <small>The public form appears on Home and Events.</small>
            </p>
          </div>
        </article>
      ) : (
        subscribers.map((item) => (
          <article className="content-row" key={item.id}>
            <div>
              <p>
                {item.name || "Community member"}
                <small>{item.email}</small>
              </p>
            </div>
            <strong
              className={`status-${item.status === "active" ? "published" : "draft"}`}
            >
              {item.status}
            </strong>
            <p>{item.source}</p>
            <div className="row-actions">
              {item.status === "active" ? (
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void setStatus(item.id, "unsubscribed")}
                >
                  Unsubscribe
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void setStatus(item.id, "active")}
                >
                  Reactivate
                </button>
              )}
            </div>
          </article>
        ))
      )}
    </section>
  );
}
