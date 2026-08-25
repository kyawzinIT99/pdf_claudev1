import { applicationRuntime } from "../../lib/hostinger-runtime";
import { authenticateRequest } from "../../lib/auth";
import { notifyEventMailAutomation } from "../../lib/n8n";
import {
  detectLivePlatform,
  isWatchableLivePlatform,
  PUBLIC_LIVE_STREAM_ENABLED,
  sanitizeLiveUrl,
  type LivePlatform,
} from "../../lib/live-stream";
import { mutationRejected, noStoreHeaders, recordAudit } from "../../lib/security";
import { publicOrigin, siteIdentity } from "../../lib/site-context";

type RuntimeEnv = {
  DB: D1Database;
};

function runtime() {
  return applicationRuntime() as unknown as RuntimeEnv;
}

async function ensureSchema(db: D1Database) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS community_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    event_time TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'cultural',
    description TEXT NOT NULL DEFAULT '',
    recurring INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published',
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    live_platform TEXT NOT NULL DEFAULT 'none',
    live_url TEXT NOT NULL DEFAULT '',
    live_on INTEGER NOT NULL DEFAULT 0
  )`).run();
  for (const statement of [
    "ALTER TABLE community_events ADD COLUMN live_platform TEXT NOT NULL DEFAULT 'none'",
    "ALTER TABLE community_events ADD COLUMN live_url TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE community_events ADD COLUMN live_on INTEGER NOT NULL DEFAULT 0",
  ]) {
    try {
      await db.prepare(statement).run();
    } catch {
      /* column may already exist */
    }
  }
}

function normalize(row: Record<string, unknown>) {
  const liveUrl = sanitizeLiveUrl(String(row.live_url || ""));
  const detected = detectLivePlatform(liveUrl);
  const stored = String(row.live_platform || "none");
  const livePlatform: LivePlatform = isWatchableLivePlatform(stored) ? stored : detected;
  return {
    id: row.id,
    title: row.title,
    date: row.event_date,
    time: row.event_time || "",
    location: row.location || "",
    category: row.category || "cultural",
    description: row.description || "",
    recurring: Boolean(row.recurring),
    status: row.status || "published",
    createdAt: row.created_at,
    livePlatform: liveUrl ? livePlatform : "none",
    liveUrl,
    liveOn: Boolean(row.live_on) && Boolean(liveUrl),
  };
}

function resolveLivePlatform(requested: string | undefined, liveUrl: string): LivePlatform {
  const value = requested || "";
  if (liveUrl && isWatchableLivePlatform(value)) return value;
  return detectLivePlatform(liveUrl);
}

async function loadActiveSubscriberEmails(db: D1Database) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS mail_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active',
    source TEXT NOT NULL DEFAULT 'website',
    consent INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  const result = await db
    .prepare(
      `SELECT name, email FROM mail_subscribers
        WHERE status = 'active' AND consent = 1
        ORDER BY id ASC
        LIMIT 500`,
    )
    .all();
  return (result.results as Record<string, unknown>[]).map((row) => ({
    name: String(row.name || ""),
    email: String(row.email || ""),
  }));
}

function isUpcomingDate(dateValue: string) {
  const today = new Date().toISOString().slice(0, 10);
  return dateValue >= today;
}

async function maybeNotifyEventMail(
  request: Request,
  db: D1Database,
  event: ReturnType<typeof normalize>,
  previous?: { status?: string; liveOn?: boolean; liveUrl?: string },
) {
  if (event.status !== "published") return;
  const firstPublish = !previous || previous.status !== "published";
  const wentLive = Boolean(
    PUBLIC_LIVE_STREAM_ENABLED &&
      event.liveOn &&
      (!previous?.liveOn || previous.liveUrl !== event.liveUrl),
  );
  if (!firstPublish && !wentLive) return;
  if (!wentLive && !isUpcomingDate(String(event.date))) return;

  const subscribers = await loadActiveSubscriberEmails(db);
  const origin = publicOrigin(request);
  await notifyEventMailAutomation({
    id: event.id,
    title: event.title,
    date: event.date,
    time: event.time,
    location: event.location,
    category: event.category,
    description: event.description,
    recurring: event.recurring,
    liveOn: event.liveOn,
    livePlatform: event.livePlatform,
    liveUrl: event.liveUrl,
    watchOnWebsite: `${origin}/events`,
    organisation: siteIdentity.name,
    contactEmail: siteIdentity.contactEmail,
    subscriberCount: subscribers.length,
    subscribers,
  });
}

export async function GET(request: Request) {
  try {
    const db = runtime().DB;
    if (!db) {
      return Response.json({ events: [] }, { headers: noStoreHeaders() });
    }
    await ensureSchema(db);

    const url = new URL(request.url);
    const adminScope = url.searchParams.get("scope") === "admin";

    if (adminScope) {
      const user = await authenticateRequest(request);
      if (!user) {
        return Response.json({ error: "Sign in required" }, { status: 401 });
      }
      const result = await db
        .prepare("SELECT * FROM community_events ORDER BY event_date DESC, id DESC LIMIT 100")
        .all();
      return Response.json(
        { events: (result.results as Record<string, unknown>[]).map(normalize) },
        { headers: noStoreHeaders() }
      );
    }

    // Public: only published events. Live fields stay admin-only until the public player is enabled.
    const result = await db
      .prepare(
        "SELECT * FROM community_events WHERE status = 'published' ORDER BY event_date ASC, id ASC LIMIT 50"
      )
      .all();
    const events = (result.results as Record<string, unknown>[]).map((row) => {
      const event = normalize(row);
      if (PUBLIC_LIVE_STREAM_ENABLED) return event;
      return { ...event, livePlatform: "none" as const, liveUrl: "", liveOn: false };
    });
    return Response.json({ events }, { headers: noStoreHeaders() });
  } catch {
    return Response.json({ error: "Unable to load events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rejected = mutationRejected(request);
  if (rejected) return rejected;
  const user = await authenticateRequest(request);
  if (!user) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      title?: string;
      date?: string;
      time?: string;
      location?: string;
      category?: string;
      description?: string;
      recurring?: boolean;
      status?: string;
      livePlatform?: string;
      liveUrl?: string;
      liveOn?: boolean;
    };

    const title = payload.title?.trim() || "";
    if (!title || title.length > 160) {
      return Response.json({ error: "A valid title is required (max 160 characters)" }, { status: 400 });
    }
    if (!payload.date || !/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
      return Response.json({ error: "A valid date (YYYY-MM-DD) is required" }, { status: 400 });
    }

    const allowedCategories = new Set(["mass", "cultural", "service", "youth", "learning"]);
    const category = allowedCategories.has(payload.category || "") ? payload.category! : "cultural";
    const allowedStatuses = new Set(["draft", "published"]);
    const status = allowedStatuses.has(payload.status || "") ? payload.status! : "published";
    const liveUrl = sanitizeLiveUrl(payload.liveUrl || "");
    const livePlatform = resolveLivePlatform(payload.livePlatform, liveUrl);
    const liveOn = Boolean(payload.liveOn) && Boolean(liveUrl);

    const db = runtime().DB;
    if (!db) {
      return Response.json({ error: "Database is not connected" }, { status: 503 });
    }
    await ensureSchema(db);

    const row = await db
      .prepare(`INSERT INTO community_events
        (title, event_date, event_time, location, category, description, recurring, status, created_by,
         live_platform, live_url, live_on)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *`)
      .bind(
        title,
        payload.date,
        (payload.time || "").trim().slice(0, 60),
        (payload.location || "").trim().slice(0, 200),
        category,
        (payload.description || "").trim().slice(0, 2000),
        payload.recurring ? 1 : 0,
        status,
        user.id,
        livePlatform,
        liveUrl,
        liveOn ? 1 : 0,
      )
      .first();

    const event = normalize(row as Record<string, unknown>);
    await recordAudit(db, user.id, "event.create", "community_event", Number(event.id));
    await maybeNotifyEventMail(request, db, event);
    return Response.json(
      { event },
      { status: 201, headers: noStoreHeaders() }
    );
  } catch {
    return Response.json({ error: "Unable to save event" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const rejected = mutationRejected(request);
  if (rejected) return rejected;
  const user = await authenticateRequest(request);
  if (!user) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      id?: number;
      title?: string;
      date?: string;
      time?: string;
      location?: string;
      category?: string;
      description?: string;
      recurring?: boolean;
      status?: string;
      livePlatform?: string;
      liveUrl?: string;
      liveOn?: boolean;
    };

    const id = Number(payload.id);
    if (!Number.isSafeInteger(id)) {
      return Response.json({ error: "Valid event ID required" }, { status: 400 });
    }
    const title = payload.title?.trim() || "";
    if (!title || title.length > 160) {
      return Response.json({ error: "A valid title is required" }, { status: 400 });
    }
    if (!payload.date || !/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
      return Response.json({ error: "A valid date (YYYY-MM-DD) is required" }, { status: 400 });
    }

    const allowedCategories = new Set(["mass", "cultural", "service", "youth", "learning"]);
    const category = allowedCategories.has(payload.category || "") ? payload.category! : "cultural";
    const allowedStatuses = new Set(["draft", "published"]);
    const status = allowedStatuses.has(payload.status || "") ? payload.status! : "published";
    const liveUrl = sanitizeLiveUrl(payload.liveUrl || "");
    const livePlatform = resolveLivePlatform(payload.livePlatform, liveUrl);
    const liveOn = Boolean(payload.liveOn) && Boolean(liveUrl);

    const db = runtime().DB;
    if (!db) {
      return Response.json({ error: "Database is not connected" }, { status: 503 });
    }
    await ensureSchema(db);
    const existing = await db
      .prepare("SELECT status, live_on, live_url FROM community_events WHERE id = ?")
      .bind(id)
      .first<Record<string, unknown>>();
    if (!existing) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    const row = await db
      .prepare(`UPDATE community_events SET
        title = ?, event_date = ?, event_time = ?, location = ?,
        category = ?, description = ?, recurring = ?, status = ?,
        live_platform = ?, live_url = ?, live_on = ?,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ? RETURNING *`)
      .bind(
        title,
        payload.date,
        (payload.time || "").trim().slice(0, 60),
        (payload.location || "").trim().slice(0, 200),
        category,
        (payload.description || "").trim().slice(0, 2000),
        payload.recurring ? 1 : 0,
        status,
        livePlatform,
        liveUrl,
        liveOn ? 1 : 0,
        id,
      )
      .first();

    if (!row) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    const event = normalize(row as Record<string, unknown>);
    await recordAudit(db, user.id, "event.update", "community_event", id);
    await maybeNotifyEventMail(request, db, event, {
      status: String(existing.status || ""),
      liveOn: Boolean(existing.live_on),
      liveUrl: String(existing.live_url || ""),
    });
    return Response.json(
      { event },
      { headers: noStoreHeaders() }
    );
  } catch {
    return Response.json({ error: "Unable to update event" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const rejected = mutationRejected(request);
  if (rejected) return rejected;
  const user = await authenticateRequest(request);
  if (!user) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id"));
    if (!Number.isSafeInteger(id)) {
      return Response.json({ error: "Valid event ID required" }, { status: 400 });
    }

    const db = runtime().DB;
    if (!db) {
      return Response.json({ error: "Database is not connected" }, { status: 503 });
    }
    await ensureSchema(db);
    await db.prepare("DELETE FROM community_events WHERE id = ?").bind(id).run();
    await recordAudit(db, user.id, "event.delete", "community_event", id);
    return Response.json({ ok: true }, { headers: noStoreHeaders() });
  } catch {
    return Response.json({ error: "Unable to delete event" }, { status: 500 });
  }
}
