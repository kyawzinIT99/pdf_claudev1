"use client";

import { useEffect, useState } from "react";
import type { StaffUser } from "../lib/auth";

type InquirySummary = {
  id: number;
  status: string;
  follow_up_required: number | boolean | string;
};

export function InquiryAlert({
  currentUser,
  onOpenQueue,
}: {
  currentUser: StaffUser;
  onOpenQueue?: () => void;
}) {
  const [inquiries, setInquiries] = useState<InquirySummary[]>([]);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (currentUser.role === "editor") return;

    let active = true;
    async function refresh() {
      try {
        const response = await fetch("/api/inquiries", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) throw new Error();
        const payload = await response.json();
        if (active) {
          setInquiries(payload.inquiries || []);
          setAvailable(true);
        }
      } catch {
        if (active) setAvailable(false);
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [currentUser.role]);

  if (currentUser.role === "editor") return null;

  const formal = inquiries.filter((item) => {
    const flag = item.follow_up_required;
    return flag === true || flag === 1 || flag === "1";
  });
  const newCount = formal.filter((item) => item.status === "new").length;
  const activeCount = formal.filter(
    (item) => item.status === "in-progress" || item.status === "waiting",
  ).length;

  if (!available) {
    return (
      <div className="inquiry-alert is-unavailable" role="status">
        <strong>Enquiry monitoring is temporarily unavailable.</strong>
        <span>The protected queue can still be checked below.</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={newCount ? "inquiry-alert has-new" : "inquiry-alert"}
      onClick={() => onOpenQueue?.()}
      aria-label={`${newCount} new enquiries and ${activeCount} in progress. Open follow-up queue.`}
    >
      <span className="inquiry-alert-count">{newCount.toString().padStart(2, "0")}</span>
      <span>
        <strong>{newCount ? "New public questions need review" : "No new public questions"}</strong>
        <small>{activeCount} in progress · Open the administrator follow-up queue</small>
      </span>
      <b aria-hidden="true">View queue →</b>
    </button>
  );
}
