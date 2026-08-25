type RateLimitOptions = {
  key: string;
  limit: number;
  windowSeconds: number;
  blockSeconds: number;
};

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  let suppliedOrigin: string;
  try {
    suppliedOrigin = new URL(origin).origin;
  } catch {
    return false;
  }

  if (suppliedOrigin === new URL(request.url).origin) return true;

  if (process.env.NODE_ENV !== "production") {
    try {
      const host = new URL(suppliedOrigin).hostname;
      if (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.endsWith(".local") ||
        /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)
      ) {
        return true;
      }
    } catch {
      return false;
    }
  }

  // TLS is terminated before requests reach Node on managed Hostinger apps, so
  // request.url may contain a private upstream origin. Keep CSRF validation
  // strict by accepting only the explicitly configured public application URL.
  const configuredOrigin = process.env.APP_ORIGIN?.trim();
  if (!configuredOrigin) return false;
  try {
    return suppliedOrigin === new URL(configuredOrigin).origin;
  } catch {
    return false;
  }
}

export function mutationRejected(request: Request) {
  return sameOrigin(request)
    ? null
    : Response.json({ error: "Cross-site request rejected" }, { status: 403 });
}

export function noStoreHeaders(extra?: HeadersInit) {
  const headers = new Headers(extra);
  headers.set("Cache-Control", "no-store");
  return headers;
}

export function clientAddress(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  ).slice(0, 80);
}

async function digest(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function rateLimitKey(namespace: string, request: Request, subject = "") {
  return `${namespace}:${await digest(`${clientAddress(request)}:${subject}`)}`;
}

export async function ensureSecuritySchema(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS security_rate_limits (
      key TEXT PRIMARY KEY,
      window_started_at TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      blocked_until TEXT
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS audit_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(
      "CREATE INDEX IF NOT EXISTS audit_events_created_idx ON audit_events(created_at DESC)",
    ),
  ]);
}

export async function checkRateLimit(db: D1Database, options: RateLimitOptions) {
  await ensureSecuritySchema(db);
  const now = Date.now();
  const row = (await db
    .prepare(
      "SELECT window_started_at, count, blocked_until FROM security_rate_limits WHERE key = ?",
    )
    .bind(options.key)
    .first()) as Record<string, unknown> | null;
  const blockedUntil = row?.blocked_until
    ? Date.parse(String(row.blocked_until))
    : 0;
  if (blockedUntil > now) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((blockedUntil - now) / 1000)) };
  }
  const startedAt = row ? Date.parse(String(row.window_started_at)) : 0;
  const expired = !startedAt || now - startedAt >= options.windowSeconds * 1000;
  const count = expired ? 1 : Number(row?.count || 0) + 1;
  const nextBlocked =
    count > options.limit
      ? new Date(now + options.blockSeconds * 1000).toISOString()
      : null;
  await db
    .prepare(`INSERT INTO security_rate_limits (key, window_started_at, count, blocked_until)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        window_started_at = excluded.window_started_at,
        count = excluded.count,
        blocked_until = excluded.blocked_until`)
    .bind(
      options.key,
      expired ? new Date(now).toISOString() : String(row?.window_started_at),
      count,
      nextBlocked,
    )
    .run();
  return {
    allowed: !nextBlocked,
    retryAfter: nextBlocked ? options.blockSeconds : 0,
  };
}

export async function clearRateLimit(db: D1Database, key: string) {
  await db.prepare("DELETE FROM security_rate_limits WHERE key = ?").bind(key).run();
}

export async function recordAudit(
  db: D1Database,
  actorId: number | null,
  action: string,
  entityType: string,
  entityId?: string | number | null,
  details: Record<string, unknown> = {},
) {
  await ensureSecuritySchema(db);
  await db
    .prepare(`INSERT INTO audit_events
      (actor_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)`)
    .bind(
      actorId,
      action.slice(0, 80),
      entityType.slice(0, 80),
      entityId == null ? null : String(entityId).slice(0, 120),
      JSON.stringify(details).slice(0, 4000),
    )
    .run();
}

export function safeError(message: string, status = 500) {
  return Response.json({ error: message }, { status, headers: noStoreHeaders() });
}

export function applySecurityHeaders(request: Request, response: Response) {
  const headers = new Headers(response.headers);
  const production = new URL(request.url).protocol === "https:";
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "object-src 'none'",
      "img-src 'self' data: blob: https://www.facebook.com https://www.tiktok.com https://i.ytimg.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
      "frame-src https://www.facebook.com https://web.facebook.com https://www.tiktok.com https://www.youtube.com https://www.youtube-nocookie.com",
    ].join("; "),
  );
  if (production) {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
