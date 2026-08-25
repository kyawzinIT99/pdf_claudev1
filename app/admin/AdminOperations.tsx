"use client";

import { FormEvent, useEffect, useState } from "react";
import type { StaffUser } from "../lib/auth";

type AuditEvent = {
  id: number;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_name: string | null;
  created_at: string;
};

type Inquiry = {
  id: number;
  source: string;
  kind: string;
  name: string;
  email: string;
  organisation: string;
  location: string;
  message: string;
  follow_up_required: number | boolean | string;
  assigned_to: string;
  follow_up_by: string | null;
  status: string;
  closed_by?: string;
  closed_at?: string | null;
  created_at: string;
};

const inquiryLabels: Record<string, string> = {
  "learning-referral": "AMEP learning referral",
  "donation-enquiry": "Donation or funding enquiry",
  volunteer: "Volunteer",
  partnership: "Partnership",
  contact: "General contact",
};

const inquirySourceLabels: Record<string, string> = {
  "quick-question": "Ask a question",
  "get-involved": "Get involved",
};

type MediaItem = {
  id: number;
  filename: string;
  content_type: string;
  size: number;
  uploaded_by: string;
  created_at: string;
};

function isFollowUpRequired(value: unknown) {
  return value === true || value === 1 || value === "1";
}

export function AdminOperations({
  currentUser,
  panel = "security",
}: {
  currentUser: StaffUser;
  panel?: "security" | "inquiries";
}) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMedia() {
      try {
        const response = await fetch("/api/media", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) throw new Error();
        const payload = await response.json();
        if (active) setMedia(payload.media || []);
      } catch {
        if (active) setMedia([]);
      }
    }

    async function loadAudit() {
      if (currentUser.role === "editor") return;
      try {
        const response = await fetch("/api/audit", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) throw new Error();
        const payload = await response.json();
        if (active) setEvents(payload.events || []);
      } catch {
        if (active) {
          setNotice((current) => current || "Audit records are temporarily unavailable.");
        }
      }
    }

    async function loadInquiries() {
      if (currentUser.role === "editor") return;
      try {
        const response = await fetch("/api/inquiries", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) throw new Error();
        const payload = await response.json();
        if (active) setInquiries(payload.inquiries || []);
      } catch {
        if (active) {
          setNotice((current) => current || "Enquiry queue is temporarily unavailable.");
        }
      }
    }

    void loadMedia();
    void loadAudit();
    void loadInquiries();

    const timer = window.setInterval(() => void loadInquiries(), 30_000);
    const onFocus = () => void loadInquiries();
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [currentUser.role]);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setNotice("");
    const response = await fetch("/api/auth/password", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: values.get("currentPassword"),
        newPassword: values.get("newPassword"),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setNotice(payload.error || "Unable to change password");
      return;
    }
    form.reset();
    setNotice("Password changed. Other active sessions were closed.");
  }

  async function patchInquiry(
    id: number,
    payload: Record<string, unknown>,
    localPatch: Partial<Inquiry>,
    successNotice: string,
  ) {
    const response = await fetch("/api/inquiries", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
    if (!response.ok) {
      setNotice("Unable to update the inquiry.");
      return false;
    }
    const body = await response.json().catch(() => ({}));
    const serverInquiry = (body?.inquiry || {}) as Partial<Inquiry>;
    setInquiries((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...localPatch, ...serverInquiry } : item,
      ),
    );
    setNotice(successNotice);
    return true;
  }

  const formalInquiries = inquiries.filter((item) =>
    isFollowUpRequired(item.follow_up_required),
  );
  const today = new Date().toISOString().slice(0, 10);

  if (panel === "inquiries" && currentUser.role !== "editor") {
    return (
      <div className="admin-focus-stack">
        {notice ? <div className="admin-notice" role="status">{notice}</div> : null}
        <section className="operations-panel is-focus" id="inquiries">
          <div className="panel-heading">
            <div><p>PRIVATE INQUIRIES</p><h2>Community follow-up queue</h2></div>
            <span>
              {formalInquiries.filter((item) => item.status === "new").length} new ·{" "}
              {formalInquiries.filter((item) =>
                item.status === "in-progress" || item.status === "waiting"
              ).length} active
            </span>
          </div>
          <div className="inquiry-list">
            {formalInquiries.slice(0, 20).map((item) => {
              const overdue =
                item.status !== "closed" &&
                Boolean(item.follow_up_by) &&
                item.follow_up_by! < today;
              return (
                <article className={overdue ? "is-overdue" : ""} key={item.id}>
                  <div>
                    <span className="inquiry-source">
                      {inquirySourceLabels[item.source] || "Existing enquiry"}
                    </span>
                    <strong>CK-{item.id} · {item.name} · {inquiryLabels[item.kind] || item.kind}</strong>
                    {item.email && <a href={`mailto:${item.email}`}>{item.email}</a>}
                    {(item.organisation || item.location) && (
                      <small>
                        {[item.organisation, item.location].filter(Boolean).join(" · ")}
                      </small>
                    )}
                    <p>{item.message}</p>
                    <time dateTime={item.created_at}>{item.created_at}</time>
                    {item.status === "closed" && item.closed_by ? (
                      <small>
                        Closed by {item.closed_by}
                        {item.closed_at ? ` · ${item.closed_at.slice(0, 10)}` : ""}
                      </small>
                    ) : null}
                    {overdue && <b className="inquiry-overdue">Follow-up overdue</b>}
                  </div>
                  <div className="inquiry-controls">
                    <label>
                      Assigned to
                      <input
                        aria-label={`Assigned staff for inquiry from ${item.name}`}
                        defaultValue={item.assigned_to}
                        maxLength={100}
                        onBlur={(event) => {
                          const assignedTo = event.currentTarget.value.trim();
                          if (assignedTo === item.assigned_to) return;
                          void patchInquiry(
                            item.id,
                            { assignedTo },
                            { assigned_to: assignedTo },
                            `Inquiry CK-${item.id} assignment updated.`,
                          );
                        }}
                      />
                    </label>
                    <label>
                      Follow up by
                      <input
                        aria-label={`Follow-up deadline for inquiry from ${item.name}`}
                        type="date"
                        value={item.follow_up_by || ""}
                        onChange={(event) => {
                          const followUpBy = event.currentTarget.value;
                          void patchInquiry(
                            item.id,
                            { followUpBy },
                            { follow_up_by: followUpBy || null },
                            `Inquiry CK-${item.id} deadline updated.`,
                          );
                        }}
                      />
                    </label>
                    <label>
                      Status
                      <select
                        aria-label={`Status for inquiry from ${item.name}`}
                        value={item.status}
                        onChange={(event) => {
                          const status = event.currentTarget.value;
                          const label =
                            status === "in-progress"
                              ? "In progress"
                              : status === "waiting"
                                ? "Waiting"
                                : status === "closed"
                                  ? "Closed"
                                  : "New";
                          void patchInquiry(
                            item.id,
                            { status },
                            { status },
                            `Inquiry CK-${item.id} moved to ${label}.`,
                          );
                        }}
                      >
                        <option value="new">New</option>
                        <option value="in-progress">In progress</option>
                        <option value="waiting">Waiting</option>
                        <option value="closed">Closed</option>
                      </select>
                    </label>
                  </div>
                </article>
              );
            })}
            {!formalInquiries.length && <p>No formal follow-up enquiries yet.</p>}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-focus-stack">
      <section className="operations-panel is-focus" id="security">
        <div className="panel-heading">
          <div><p>ACCOUNT SECURITY</p><h2>Password and active sessions</h2></div>
          <span>{currentUser.mustChangePassword ? "Action required" : "Protected"}</span>
        </div>
        <form className="password-form" onSubmit={changePassword}>
          <label>Current password<input name="currentPassword" type="password" required /></label>
          <label>New password<input name="newPassword" type="password" minLength={12} maxLength={128} required /></label>
          <button className="button-review" type="submit">Change password</button>
        </form>
        {notice ? <div className="admin-notice" role="status">{notice}</div> : null}
      </section>

      <section className="operations-panel" id="media-library">
        <div className="panel-heading">
          <div><p>MEDIA LIBRARY</p><h2>Verified uploads</h2></div>
          <span>{media.length} files</span>
        </div>
        <div className="compact-list">
          {media.slice(0, 8).map((item) => (
            <article key={item.id}>
              <strong>{item.filename}</strong>
              <span>{item.content_type} · {(item.size / 1024).toFixed(0)} KB</span>
              <small>{item.uploaded_by}</small>
            </article>
          ))}
          {!media.length && <p>No staff media has been uploaded.</p>}
        </div>
      </section>

      {currentUser.role !== "editor" ? (
        <section className="operations-panel" id="audit">
          <div className="panel-heading">
            <div><p>AUDIT HISTORY</p><h2>Recent protected actions</h2></div>
            <span>Latest 100 retained</span>
          </div>
          <div className="compact-list">
            {events.slice(0, 12).map((event) => (
              <article key={event.id}>
                <strong>{event.action.replaceAll(".", " ")}</strong>
                <span>{event.entity_type} {event.entity_id || ""}</span>
                <small>{event.actor_name || "System"} · {event.created_at}</small>
              </article>
            ))}
            {!events.length && <p>No protected actions have been recorded yet.</p>}
          </div>
        </section>
      ) : null}
    </div>
  );
}
