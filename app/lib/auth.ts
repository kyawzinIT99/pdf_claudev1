import { applicationRuntime } from "./hostinger-runtime";

export const staffRoles = ["owner", "administrator", "editor"] as const;
export type StaffRole = (typeof staffRoles)[number];

export type StaffUser = {
  id: number;
  email: string;
  displayName: string;
  role: StaffRole;
  status: "active" | "disabled";
  mustChangePassword: boolean;
};

type AuthRuntime = {
  DB: D1Database;
  BOOTSTRAP_ADMIN_EMAIL?: string;
  BOOTSTRAP_ADMIN_PASSWORD?: string;
  ADMIN_WRITE_TOKEN?: string;
  CRM_ALERTS_ENABLED?: string;
  CRM_TELEGRAM_CHAT_ID?: string;
  CRM_ALERT_EMAIL?: string;
  N8N_INQUIRY_ALERT_WEBHOOK?: string;
  N8N_INQUIRY_WEBHOOK_SECRET?: string;
  N8N_PUBLISH_WEBHOOK?: string;
  N8N_SUBSCRIBE_ALERT_WEBHOOK?: string;
  N8N_EVENT_MAIL_WEBHOOK?: string;
  N8N_BASE_URL?: string;
  N8N_API_KEY?: string;
};

const sessionCookie = "common_kind_session";
const passwordIterations = 210_000;

export function authRuntime() {
  return applicationRuntime() as unknown as AuthRuntime;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string) {
  if (!/^[a-f0-9]+$/i.test(value) || value.length % 2 !== 0) {
    return new Uint8Array();
  }
  return new Uint8Array(value.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16)));
}

function randomHex(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function derivePassword(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: Uint8Array.from(salt).buffer, iterations },
    key,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt, passwordIterations);
  return `pbkdf2-sha256$${passwordIterations}$${bytesToHex(salt)}$${hash}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, iterationText, saltText, expected] = stored.split("$");
  if (algorithm !== "pbkdf2-sha256" || !iterationText || !saltText || !expected) {
    return false;
  }
  const iterations = Number.parseInt(iterationText, 10);
  const salt = hexToBytes(saltText);
  if (!Number.isSafeInteger(iterations) || iterations < 100_000 || salt.length !== 16) {
    return false;
  }
  const actual = await derivePassword(password, salt, iterations);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return bytesToHex(new Uint8Array(digest));
}

export async function ensureAuthSchema(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS staff_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'editor',
      password_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      must_change_password INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS staff_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES staff_users(id) ON DELETE CASCADE
    )`),
    db.prepare(
      "CREATE INDEX IF NOT EXISTS staff_sessions_user_expiry_idx ON staff_sessions(user_id, expires_at)",
    ),
  ]);
  try {
    await db
      .prepare(
        "ALTER TABLE staff_users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0",
      )
      .run();
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.toLowerCase().includes("duplicate column")
    ) {
      throw error;
    }
  }
}

function cookieValue(request: Request, name: string) {
  const cookie = request.headers.get("cookie") || "";
  for (const item of cookie.split(";")) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) return decodeURIComponent(parts.join("="));
  }
  return "";
}

function normalizeUser(row: Record<string, unknown>): StaffUser {
  return {
    id: Number(row.id),
    email: String(row.email),
    displayName: String(row.display_name),
    role: row.role as StaffRole,
    status: row.status as StaffUser["status"],
    mustChangePassword: Boolean(row.must_change_password),
  };
}

export async function authenticateRequest(request: Request) {
  const db = authRuntime().DB;
  if (!db) return null;
  await ensureAuthSchema(db);
  const token = cookieValue(request, sessionCookie);
  if (!token) return null;
  const tokenHash = await hashToken(token);
  const row = await db
    .prepare(`SELECT u.id, u.email, u.display_name, u.role, u.status, u.must_change_password
      FROM staff_sessions s
      JOIN staff_users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.status = 'active'
      LIMIT 1`)
    .bind(tokenHash)
    .first();
  return row ? normalizeUser(row as Record<string, unknown>) : null;
}

export function hasRole(user: StaffUser | null, roles: readonly StaffRole[]) {
  return Boolean(user && roles.includes(user.role));
}

export async function createSession(db: D1Database, userId: number, request: Request) {
  const token = randomHex(32);
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  await db
    .prepare(
      "INSERT INTO staff_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    )
    .bind(userId, tokenHash, expiresAt)
    .run();
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${sessionCookie}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Priority=High; Max-Age=28800${secure}`;
}

export async function endSession(db: D1Database, request: Request) {
  const token = cookieValue(request, sessionCookie);
  if (token) {
    await db
      .prepare("DELETE FROM staff_sessions WHERE token_hash = ?")
      .bind(await hashToken(token))
      .run();
  }
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${sessionCookie}=; Path=/; HttpOnly; SameSite=Lax; Priority=High; Max-Age=0${secure}`;
}

export function cleanEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validPassword(value: string) {
  return value.length >= 12 && value.length <= 128;
}

export function userFromRow(row: Record<string, unknown>) {
  return normalizeUser(row);
}
