"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicHeader } from "./PublicHeader";
import { MailSubscribe } from "./MailSubscribe";
import { usePublicLanguage } from "./usePublicLanguage";
import { eventsUi } from "../lib/i18n";
import { LiveStreamPlayer } from "./LiveStreamPlayer";
import { isWatchableLivePlatform, PUBLIC_LIVE_STREAM_ENABLED, type LivePlatform } from "../lib/live-stream";

type CommunityEvent = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  category: "mass" | "cultural" | "service" | "youth" | "learning";
  description: string;
  recurring?: boolean;
  livePlatform?: LivePlatform;
  liveUrl?: string;
  liveOn?: boolean;
};

const categoryColors: Record<CommunityEvent["category"], string> = {
  mass: "#f4c430",
  cultural: "#e8634a",
  service: "#7ec8d9",
  youth: "#1f5747",
  learning: "#0a2540",
};

const seedEvents: CommunityEvent[] = [
  { id: 1, title: "Community solidarity evening", date: "2026-08-16", time: "6:00 PM", location: "To be published", category: "cultural", description: "A public gathering for families and supporters. Details are updated from the Admin Panel.", recurring: true },
  { id: 2, title: "Relief coordination briefing", date: "2026-08-22", time: "4:00 PM – 5:30 PM", location: "To be published", category: "service", description: "Staff and volunteers review civilian care priorities. Not a combat briefing.", recurring: true },
  { id: 3, title: "Youth circle", date: "2026-08-29", time: "5:30 PM – 8:00 PM", location: "To be published", category: "youth", description: "Young people share culture, language and community projects.", recurring: true },
  { id: 4, title: "Language and civic literacy class", date: "2026-09-10", time: "10:00 AM – 12:00 PM", location: "To be published", category: "learning", description: "Community learning session. All levels welcome.", recurring: true },
  { id: 5, title: "Martyrs’ Day remembrance", date: "2026-07-19", time: "3:00 PM", location: "To be published", category: "cultural", description: "A civilian remembrance gathering. Programme published by administrators." },
  { id: 6, title: "Fundraising dinner for civilian relief", date: "2026-09-20", time: "6:00 PM – 9:30 PM", location: "To be published", category: "service", description: "Community dinner supporting published humanitarian appeals. Tickets via authorised channels only." },
];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDate(dateStr: string) {
  const parts = dateStr.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return {
    day: d.getDate(),
    month: MONTHS_SHORT[d.getMonth()],
    weekday: WEEKDAYS[d.getDay()],
  };
}

function livePlatformName(platform?: LivePlatform) {
  if (platform === "tiktok") return "TikTok";
  if (platform === "youtube") return "YouTube";
  return "Facebook";
}

function watchLabelFor(
  platform: LivePlatform | undefined,
  ui: (typeof eventsUi)["en"],
) {
  if (platform === "tiktok") return ui.watchTiktok;
  if (platform === "youtube") return ui.watchYouTube;
  return ui.watchFacebook;
}



export function EventsPage() {
  const { language, onLanguageChange } = usePublicLanguage();
  const ui = language === "my" ? eventsUi.my : eventsUi.en;
  const [filter, setFilter] = useState<string>("all");
  const [showPast, setShowPast] = useState(false);
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>(seedEvents);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    function loadEvents() {
      fetch("/api/events", { cache: "no-store", credentials: "same-origin" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => {
          if (Array.isArray(d.events) && d.events.length > 0) {
            setCommunityEvents(d.events);
          }
        })
        .catch(() => {/* keep seed events */ });
    }
    loadEvents();
    window.addEventListener("focus", loadEvents);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", loadEvents);
    };
  }, []);

  // Defer date-dependent filtering to client to avoid SSR hydration mismatch
  const upcomingEvents = mounted
    ? communityEvents
      .filter((e) => new Date(e.date + "T23:59:59") >= new Date())
      .sort((a, b) => a.date.localeCompare(b.date))
    : communityEvents.sort((a, b) => a.date.localeCompare(b.date));
  const pastEvents = mounted
    ? communityEvents
      .filter((e) => new Date(e.date + "T23:59:59") < new Date())
      .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const displayEvents = showPast ? pastEvents : upcomingEvents;
  const filteredEvents =
    filter === "all"
      ? displayEvents
      : displayEvents.filter((e) => e.category === filter);

  const allCategories = Object.entries(ui.categories);
  const liveNow = PUBLIC_LIVE_STREAM_ENABLED
    ? communityEvents.filter(
        (event) =>
          event.liveOn && event.liveUrl && isWatchableLivePlatform(event.livePlatform || "none"),
      )
    : [];

  return (
    <main className={`pdf-shell pdf-inner${language === "my" ? " is-my" : ""}`}>
      <PublicHeader
        activeHref="/events"
        language={language}
        onLanguageChange={onLanguageChange}
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="v2-events-hero">
        <div className="v2-events-hero-content">
          <p className="v2-section-eyebrow">{ui.eyebrow}</p>
          <h1>{ui.title}</h1>
          <p className="v2-events-subtitle">
            {ui.subtitle}
          </p>
        </div>
      </section>

      {liveNow.length > 0 && (
        <section className="pdf-live-stage" aria-label={ui.liveNow}>
          {liveNow.map((event) => (
            <article key={`live-${event.id}`}>
              <p className="pdf-kicker">{ui.liveNow} · {livePlatformName(event.livePlatform)}</p>
              <h2>{event.title}</h2>
              <p>{ui.liveNote}</p>
              <LiveStreamPlayer
                platform={event.livePlatform || "none"}
                liveUrl={event.liveUrl || ""}
                title={event.title}
                watchLabel={watchLabelFor(event.livePlatform, ui)}
              />
            </article>
          ))}
        </section>
      )}

      {/* ── Toggle + Filters ─────────────────────────────────── */}
      <div className="v2-events-controls">
        <div className="v2-events-toggle">
          <button
            className={!showPast ? "active" : ""}
            onClick={() => setShowPast(false)}
          >
            {ui.upcoming}
          </button>
          <button
            className={showPast ? "active" : ""}
            onClick={() => setShowPast(true)}
          >
            {ui.past}
          </button>
        </div>
        <div className="v2-events-filters">
          <button
            className={`v2-events-filter-btn ${filter === "all" ? "active" : ""
              }`}
            onClick={() => setFilter("all")}
          >
            {ui.all}
          </button>
          {allCategories.map(([key, label]) => (
            <button
              key={key}
              className={`v2-events-filter-btn ${filter === key ? "active" : ""
                }`}
              onClick={() => setFilter(key)}
              style={
                {
                  "--filter-color":
                    categoryColors[key as CommunityEvent["category"]],
                } as React.CSSProperties
              }
            >
              <span
                className="v2-events-filter-dot"
                style={{
                  background:
                    categoryColors[key as CommunityEvent["category"]],
                }}
              />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Events List ──────────────────────────────────────── */}
      <section className="v2-events-list-section">
        {filteredEvents.length === 0 ? (
          <div className="v2-events-empty">
            <p>
              {showPast
                ? ui.emptyPast
                : ui.emptyUpcoming}
            </p>
          </div>
        ) : (
          <div className="v2-events-list">
            {filteredEvents.map((event) => {
              const d = formatDate(event.date);
              return (
                <article key={event.id} className="v2-event-card">
                  <div
                    className="v2-event-date-block"
                    style={{
                      borderColor: categoryColors[event.category],
                    }}
                  >
                    <span className="v2-event-month">{d.month}</span>
                    <span className="v2-event-day">{d.day}</span>
                    <span className="v2-event-weekday">{d.weekday}</span>
                  </div>
                  <div className="v2-event-body">
                    <div className="v2-event-meta">
                      <span
                        className="v2-event-category-badge"
                        style={{
                          background: categoryColors[event.category],
                          color:
                            event.category === "mass" ||
                              event.category === "service"
                              ? "#061b2e"
                              : "white",
                        }}
                      >
                        {ui.categories[event.category]}
                      </span>
                      {event.recurring && (
                        <span className="v2-event-recurring">↻ {ui.recurring}</span>
                      )}
                      {PUBLIC_LIVE_STREAM_ENABLED && event.liveOn && event.liveUrl ? (
                        <span className="v2-event-recurring">{ui.liveNow}</span>
                      ) : null}
                    </div>
                    <h3>{event.title}</h3>
                    <p>{event.description}</p>
                    {PUBLIC_LIVE_STREAM_ENABLED && event.liveOn && event.liveUrl ? (
                      <LiveStreamPlayer
                        platform={event.livePlatform || "none"}
                        liveUrl={event.liveUrl}
                        title={event.title}
                        watchLabel={watchLabelFor(event.livePlatform, ui)}
                      />
                    ) : null}
                    <div className="v2-event-details">
                      <span className="v2-event-time">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {event.time}
                      </span>
                      <span className="v2-event-location">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {event.location}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <MailSubscribe source="events" compact />

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="v2-events-cta">
        <div className="v2-events-cta-inner">
          <div>
            <h2>{ui.ctaTitle}</h2>
            <p>
              {ui.ctaBody}
            </p>
          </div>
          <Link href="/get-involved" className="pdf-cta">
            {ui.contact}
          </Link>
        </div>
      </section>
    </main>
  );
}
