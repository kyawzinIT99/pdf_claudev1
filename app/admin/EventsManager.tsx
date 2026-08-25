"use client";

import { FormEvent, useEffect, useState } from "react";
import type { LivePlatform } from "../lib/live-stream";

type EventItem = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  description: string;
  recurring: boolean;
  status: string;
  livePlatform: LivePlatform;
  liveUrl: string;
  liveOn: boolean;
};

const CATEGORIES = [
  { value: "mass", label: "Mass & Prayer" },
  { value: "cultural", label: "Cultural" },
  { value: "service", label: "Community Service" },
  { value: "youth", label: "Youth" },
  { value: "learning", label: "Learning" },
];

const emptyEvent = (): Omit<EventItem, "id"> => ({
  title: "",
  date: "",
  time: "",
  location: "",
  category: "cultural",
  description: "",
  recurring: false,
  status: "published",
  livePlatform: "none",
  liveUrl: "",
  liveOn: false,
});

function livePasteCopy(platform: LivePlatform) {
  if (platform === "youtube") {
    return {
      label: "2. Paste YouTube live link here",
      placeholder: "https://www.youtube.com/watch?v=…  or  https://youtu.be/…  ← paste YouTube copy link",
      help: "On YouTube: open the live video → Share → Copy link → paste in this box.",
    };
  }
  if (platform === "tiktok") {
    return {
      label: "2. Paste TikTok live link here",
      placeholder: "https://www.tiktok.com/@account/live  ← paste TikTok copy link",
      help: "On TikTok: open the live → Share → Copy link → paste in this box.",
    };
  }
  return {
    label: "2. Paste Facebook live link here",
    placeholder: "https://www.facebook.com/yourpage/videos/123…  ← paste Facebook copy link",
    help: "On Facebook: open the live video → Share → Copy link → paste in this box.",
  };
}

export function EventsManager() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyEvent());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const loadEvents = () => {
    fetch("/api/events?scope=admin", { credentials: "same-origin", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (Array.isArray(d.events)) setEvents(d.events);
      })
      .catch(() => setEvents([]));
  };

  useEffect(() => { loadEvents(); }, []);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyEvent());
    setCreating(true);
    setMsg("");
  };

  const startEdit = (ev: EventItem) => {
    setCreating(false);
    setEditing(ev);
    setForm({
      title: ev.title,
      date: ev.date,
      time: ev.time,
      location: ev.location,
      category: ev.category,
      description: ev.description,
      recurring: ev.recurring,
      status: ev.status,
      livePlatform: ev.livePlatform || "none",
      liveUrl: ev.liveUrl || "",
      liveOn: Boolean(ev.liveOn),
    });
    setMsg("");
  };

  const cancel = () => {
    setCreating(false);
    setEditing(null);
    setMsg("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");

    try {
      const isNew = creating;
      const url = "/api/events";
      const method = isNew ? "POST" : "PATCH";
      const body = isNew
        ? form
        : { ...form, id: editing!.id };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }

      setMsg(isNew ? "✅ Event created!" : "✅ Event updated!");
      cancel();
      loadEvents();
    } catch (err: unknown) {
      setMsg(`❌ ${err instanceof Error ? err.message : "Error saving event"}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events?id=${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Delete failed");
      loadEvents();
      setMsg("✅ Event deleted");
    } catch {
      setMsg("❌ Failed to delete event");
    } finally {
      setBusy(false);
    }
  };

  const showForm = creating || editing;

  return (
    <section className="events-manager" id="events">
      <div className="events-manager-header">
        <div>
          <h2>Community Events</h2>
          <p>
            Create events for the public page. Live stream fields are ready here: start on Facebook,
            TikTok or YouTube, copy the live link, paste it, and save. The public Events player is
            not switched on yet — the link is stored in Admin only.
          </p>
        </div>
        <button
          type="button"
          className="events-create-btn"
          onClick={startCreate}
        >
          + New Event
        </button>
      </div>

      {msg && <p className="events-msg">{msg}</p>}

      {/* ── Form ──────────────────────────────────────── */}
      {showForm && (
        <form className="events-form" onSubmit={handleSubmit}>
          <h3>{creating ? "Create Event" : `Edit: ${editing!.title}`}</h3>

          <div className="events-live-box">
            <p className="events-live-box-title">Live stream (Facebook, TikTok or YouTube)</p>
            <label>
              1. Select where you went live
              <select
                value={form.livePlatform}
                onChange={(e) =>
                  setForm({
                    ...form,
                    livePlatform: e.target.value as EventItem["livePlatform"],
                    liveOn: e.target.value !== "none" ? true : form.liveOn,
                  })
                }
              >
                <option value="none">No live stream</option>
                <option value="facebook">Facebook Live</option>
                <option value="tiktok">TikTok Live</option>
                <option value="youtube">YouTube Live</option>
              </select>
            </label>
            {form.livePlatform !== "none" && (
              <label className="events-live-paste">
                {livePasteCopy(form.livePlatform).label}
                <input
                  type="text"
                  inputMode="url"
                  value={form.liveUrl}
                  maxLength={500}
                  required
                  onChange={(e) =>
                    setForm({
                      ...form,
                      liveUrl: e.target.value,
                      liveOn: true,
                    })
                  }
                  placeholder={livePasteCopy(form.livePlatform).placeholder}
                />
                <small>{livePasteCopy(form.livePlatform).help}</small>
              </label>
            )}
            {form.livePlatform !== "none" && (
              <label className="events-checkbox">
                <input
                  type="checkbox"
                  checked={form.liveOn}
                  onChange={(e) => setForm({ ...form, liveOn: e.target.checked })}
                />
                Live now — stored in Admin (public Events player is not on yet)
              </label>
            )}
          </div>

          <div className="events-form-grid">
            <label>
              Title *
              <input
                type="text"
                value={form.title}
                maxLength={160}
                required
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Burmese Catholic Sunday Mass"
              />
            </label>

            <label>
              Date *
              <input
                type="date"
                value={form.date}
                required
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>

            <label>
              Time
              <input
                type="text"
                value={form.time}
                maxLength={60}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                placeholder="e.g. 2:30 PM or 10:00 AM – 3:00 PM"
              />
            </label>

            <label>
              Location
              <input
                type="text"
                value={form.location}
                maxLength={200}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. St Bernadette's Church, Glendalough"
              />
            </label>

            <label>
              Category
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
          </div>

          <label>
            Description
            <textarea
              value={form.description}
              maxLength={2000}
              rows={3}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the event..."
            />
          </label>

          <label className="events-checkbox">
            <input
              type="checkbox"
              checked={form.recurring}
              onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
            />
            Recurring event (weekly/monthly)
          </label>

          <div className="events-form-actions">
            <button type="submit" disabled={busy} className="events-save-btn">
              {busy ? "Saving…" : creating ? "Create Event" : "Save Changes"}
            </button>
            <button type="button" onClick={cancel} className="events-cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Events List ───────────────────────────────── */}
      <div className="events-list-admin">
        {events.length === 0 ? (
          <p className="events-empty">
            No events yet. Click &quot;+ New Event&quot; to create your first event.
          </p>
        ) : (
          <table className="events-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Event</th>
                <th>Location</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className={ev.status === "draft" ? "draft-row" : ""}>
                  <td className="events-date-cell">{ev.date}</td>
                  <td>
                    <strong>{ev.title}</strong>
                    {ev.recurring && <span className="events-recurring-badge">↻</span>}
                    {ev.liveOn && <span className="events-recurring-badge">LIVE</span>}
                    {ev.time && <small>{ev.time}</small>}
                  </td>
                  <td>{ev.location}</td>
                  <td>
                    <span className="events-cat-badge" data-cat={ev.category}>
                      {ev.category}
                    </span>
                  </td>
                  <td>
                    <span className={`events-status-badge ${ev.status}`}>
                      {ev.status}
                    </span>
                  </td>
                  <td className="events-actions-cell">
                    <button type="button" onClick={() => startEdit(ev)}>Edit</button>
                    <button type="button" className="events-delete-btn" onClick={() => handleDelete(ev.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
