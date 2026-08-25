import { authRuntime, authenticateRequest } from "../../lib/auth";
import { notifySubscribeAutomation } from "../../lib/n8n";
import {
  checkRateLimit,
  mutationRejected,
  noStoreHeaders,
  rateLimitKey,
  recordAudit,
} from "../../lib/security";
import { subscribeAutomationContext } from "../../lib/site-context";

async function ensureSchema(db: D1Database) {
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
  await db
    .prepare(
      "CREATE INDEX IF NOT EXISTS mail_subscribers_status_idx ON mail_subscribers(status, created_at DESC)",
    )
    .run();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export async function GET(request: Request) {
  const user = await authenticateRequest(request);
  if (!user) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  if (user.role === "editor") {
    return Response.json(
      { error: "Administrator access is required" },
      { status: 403 },
    );
  }
  const db = authRuntime().DB;
  if (!db) {
    return Response.json(
      { error: "Database is not connected", subscribers: [] },
      { status: 503, headers: noStoreHeaders() },
    );
  }
  await ensureSchema(db);
  const result = await db
    .prepare(
      `SELECT id, name, email, status, source, consent, created_at, updated_at
        FROM mail_subscribers
        ORDER BY created_at DESC
        LIMIT 500`,
    )
    .all();
  return Response.json(
    { subscribers: result.results },
    { headers: noStoreHeaders() },
  );
}

export async function POST(request: Request) {
  const rejected = mutationRejected(request);
  if (rejected) return rejected;
  const db = authRuntime().DB;
  if (!db) {
    return Response.json(
      {
        error:
          "Subscribe is not connected yet. Set DB_HOST, DB_USER, DB_PASSWORD and DB_NAME in .env.local.",
      },
      { status: 503 },
    );
  }
  await ensureSchema(db);

  const key = await rateLimitKey("mail-subscribe", request);
  const limit = await checkRateLimit(db, {
    key,
    limit: 6,
    windowSeconds: 60 * 60,
    blockSeconds: 60 * 60,
  });
  if (!limit.allowed) {
    return Response.json(
      { error: "Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const payload = (await request.json()) as {
    name?: string;
    email?: string;
    consent?: boolean;
    source?: string;
    page?: string;
    website?: string;
  };

  // Honeypot
  if (payload.website) {
    return Response.json({ ok: true }, { status: 201 });
  }

  const name = String(payload.name || "").trim().slice(0, 80);
  const email = normalizeEmail(String(payload.email || ""));
  const source = String(payload.source || "website").trim().slice(0, 40) || "website";
  const page = String(payload.page || source).trim().slice(0, 80) || "/";
  const context = subscribeAutomationContext(request, { source, page });

  if (!isValidEmail(email)) {
    return Response.json({ error: "A valid email address is required." }, { status: 400 });
  }
  if (!payload.consent) {
    return Response.json(
      { error: "Please confirm you want to receive community updates." },
      { status: 400 },
    );
  }

  try {
    const existing = await db
      .prepare("SELECT id, status FROM mail_subscribers WHERE email = ?")
      .bind(email)
      .first<Record<string, unknown>>();

    if (existing) {
      if (String(existing.status) === "active") {
        return Response.json({
          ok: true,
          message: "You are already subscribed to community updates.",
        });
      }
      await db
        .prepare(
          `UPDATE mail_subscribers
            SET name = CASE WHEN ? != '' THEN ? ELSE name END,
                status = 'active',
                consent = 1,
                source = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
        )
        .bind(name, name, source, Number(existing.id))
        .run();
      await notifySubscribeAutomation({
        event: "community.subscriber.reactivated",
        id: Number(existing.id),
        name,
        email,
        source,
        page,
        consent: true,
        ...context,
      });
      return Response.json({
        ok: true,
        message: "Welcome back — your subscription is active again.",
      });
    }

    const row = await db
      .prepare(
        `INSERT INTO mail_subscribers (name, email, status, source, consent)
          VALUES (?, ?, 'active', ?, 1)
          RETURNING id, name, email, status, source, created_at`,
      )
      .bind(name, email, source)
      .first();

    await notifySubscribeAutomation({
      event: "community.subscriber.created",
      id: Number((row as Record<string, unknown>).id),
      name,
      email,
      source,
      page,
      consent: true,
      ...context,
    });

    return Response.json(
      {
        ok: true,
        message: "Thanks — you will receive community event updates by email.",
        subscriber: row,
      },
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "Unable to save subscription." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const rejected = mutationRejected(request);
  if (rejected) return rejected;
  const user = await authenticateRequest(request);
  if (!user) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  if (user.role === "editor") {
    return Response.json(
      { error: "Administrator access is required" },
      { status: 403 },
    );
  }

  try {
    const payload = (await request.json()) as {
      id?: number;
      status?: "active" | "unsubscribed";
    };
    const id = Number(payload.id);
    const status = payload.status;
    if (!Number.isSafeInteger(id) || (status !== "active" && status !== "unsubscribed")) {
      return Response.json({ error: "Valid subscriber update required" }, { status: 400 });
    }

    const db = authRuntime().DB;
    if (!db) {
      return Response.json({ error: "Database is not connected" }, { status: 503 });
    }
    await ensureSchema(db);
    const row = await db
      .prepare(
        `UPDATE mail_subscribers
          SET status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          RETURNING id, name, email, status, source, created_at, updated_at`,
      )
      .bind(status, id)
      .first();
    if (!row) {
      return Response.json({ error: "Subscriber not found" }, { status: 404 });
    }
    await recordAudit(db, user.id, `subscriber.${status}`, "mail_subscriber", id);
    return Response.json({ subscriber: row }, { headers: noStoreHeaders() });
  } catch {
    return Response.json({ error: "Unable to update subscriber" }, { status: 500 });
  }
}
