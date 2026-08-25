"use client";

import { useEffect, useMemo, useState } from "react";
import type { StaffUser } from "../lib/auth";

type InquiryRow = {
  id: number;
  source: string;
  kind: string;
  name: string;
  email: string;
  organisation: string;
  location: string;
  message: string;
  assigned_to: string;
  follow_up_by: string | null;
  status: string;
  closed_by: string;
  closed_at: string | null;
  created_at: string;
};

type SubscriberRow = {
  id: number;
  name: string;
  email: string;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
};

type Summary = {
  inquiriesTotal: number;
  inquiriesOpen: number;
  inquiriesClosed: number;
  subscribersActive: number;
  subscribersTotal: number;
};

const kindLabels: Record<string, string> = {
  "learning-referral": "AMEP learning",
  "donation-enquiry": "Donation",
  volunteer: "Volunteer",
  partnership: "Partnership",
  contact: "Contact",
};

export function CustomersReport({ currentUser }: { currentUser: StaffUser }) {
  const canManage = currentUser.role !== "editor";
  const [summary, setSummary] = useState<Summary | null>(null);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all");
  const [q, setQ] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (kind !== "all") params.set("kind", kind);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [status, kind, q]);

  useEffect(() => {
    if (!canManage) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/reports/customers${query ? `?${query}` : ""}`, {
        credentials: "same-origin",
        cache: "no-store",
      })
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((payload) => {
          if (!active) return;
          setSummary(payload.summary || null);
          setInquiries(payload.inquiries || []);
          setSubscribers(payload.subscribers || []);
          setNotice("");
        })
        .catch(() => {
          if (active) setNotice("Customer report is temporarily unavailable.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [canManage, query]);

  if (!canManage) return null;

  function downloadExport(format: "xlsx" | "pdf") {
    const href = `/api/reports/customers?format=${format}${query ? `&${query}` : ""}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="admin-focus-stack">
      {notice ? <div className="admin-notice" role="status">{notice}</div> : null}
      <section className="operations-panel is-focus" id="reports">
        <div className="panel-heading">
          <div>
            <p>CUSTOMER REPORT</p>
            <h2>Enquiries and mail list</h2>
          </div>
          <span>
            {summary
              ? `${summary.inquiriesOpen} open · ${summary.inquiriesClosed} closed · ${summary.subscribersActive} active mail`
              : loading
                ? "Loading…"
                : "—"}
          </span>
        </div>
        <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: 13 }}>
          Combined view from the database for staff reporting. Closed enquiries
          include the account name that handled them.
        </p>
        <div className="report-filters">
          <label>
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.currentTarget.value)}
            >
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="in-progress">In progress</option>
              <option value="waiting">Waiting</option>
              <option value="closed">Closed</option>
              <option value="active">Active (mail)</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </label>
          <label>
            Enquiry kind
            <select
              value={kind}
              onChange={(event) => setKind(event.currentTarget.value)}
            >
              <option value="all">All kinds</option>
              <option value="contact">Contact</option>
              <option value="volunteer">Volunteer</option>
              <option value="partnership">Partnership</option>
              <option value="donation-enquiry">Donation</option>
              <option value="learning-referral">AMEP learning</option>
            </select>
          </label>
          <label className="report-search">
            Search
            <input
              type="search"
              value={q}
              placeholder="Name, email, handler…"
              onChange={(event) => setQ(event.currentTarget.value)}
            />
          </label>
          <div className="report-export-actions">
            <button
              type="button"
              className="events-cancel-btn"
              onClick={() => downloadExport("xlsx")}
            >
              Export Excel
            </button>
            <button
              type="button"
              className="events-cancel-btn"
              onClick={() => downloadExport("pdf")}
            >
              Export PDF
            </button>
          </div>
        </div>

        <h3 className="report-subtitle">Enquiries ({inquiries.length})</h3>
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Person</th>
                <th>Kind</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Closed by</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((item) => (
                <tr key={`inq-${item.id}`}>
                  <td>CK-{item.id}</td>
                  <td>
                    <strong>{item.name}</strong>
                    <small>{item.email}</small>
                  </td>
                  <td>{kindLabels[item.kind] || item.kind}</td>
                  <td>{item.status}</td>
                  <td>{item.assigned_to || "—"}</td>
                  <td>
                    {item.status === "closed"
                      ? item.closed_by || "—"
                      : "—"}
                    {item.closed_at ? (
                      <small>{item.closed_at.slice(0, 10)}</small>
                    ) : null}
                  </td>
                  <td>{item.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
              {!inquiries.length && !loading ? (
                <tr>
                  <td colSpan={7}>No enquiries match these filters.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <h3 className="report-subtitle">Mail subscribers ({subscribers.length})</h3>
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Source</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((item) => (
                <tr key={`sub-${item.id}`}>
                  <td>{item.name || "—"}</td>
                  <td>{item.email}</td>
                  <td>{item.status}</td>
                  <td>{item.source}</td>
                  <td>{item.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
              {!subscribers.length && !loading ? (
                <tr>
                  <td colSpan={5}>No subscribers match these filters.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
