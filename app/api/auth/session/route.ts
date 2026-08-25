import {
  authRuntime,
  cleanEmail,
  createSession,
  endSession,
  ensureAuthSchema,
  hashPassword,
  authenticateRequest,
  userFromRow,
  validPassword,
  verifyPassword,
} from "../../../lib/auth";
import {
  checkRateLimit,
  clearRateLimit,
  mutationRejected,
  noStoreHeaders,
  rateLimitKey,
  recordAudit,
} from "../../../lib/security";

export async function GET(request: Request) {
  const user = await authenticateRequest(request);
  return user
    ? Response.json({ user }, { headers: noStoreHeaders() })
    : Response.json({ error: "Sign in required" }, { status: 401, headers: noStoreHeaders() });
}

export async function POST(request: Request) {
  const rejected = mutationRejected(request);
  if (rejected) return rejected;
  try {
    const db = authRuntime().DB;
    if (!db) throw new Error("Staff database is unavailable");
    await ensureAuthSchema(db);
    const payload = (await request.json()) as { email?: string; password?: string };
    const email = cleanEmail(payload.email || "");
    const password = payload.password || "";
    const limitKey = await rateLimitKey("staff-login", request, email);
    const limit = await checkRateLimit(db, {
      key: limitKey,
      limit: 5,
      windowSeconds: 15 * 60,
      blockSeconds: 15 * 60,
    });
    if (!limit.allowed) {
      return Response.json(
        { error: "Too many sign-in attempts. Try again later." },
        {
          status: 429,
          headers: noStoreHeaders({ "Retry-After": String(limit.retryAfter) }),
        },
      );
    }

    const countRow = await db
      .prepare("SELECT COUNT(*) AS count FROM staff_users")
      .first();
    const userCount = Number((countRow as Record<string, unknown> | null)?.count || 0);

    if (userCount === 0) {
      const bootstrapEmail = cleanEmail(authRuntime().BOOTSTRAP_ADMIN_EMAIL || "");
      const bootstrapPassword = authRuntime().BOOTSTRAP_ADMIN_PASSWORD || "";
      if (!bootstrapEmail || !validPassword(bootstrapPassword)) {
        return Response.json(
          { error: "Owner setup is required before staff can sign in" },
          { status: 503 },
        );
      }
      if (email === bootstrapEmail && password === bootstrapPassword) {
        await db
          .prepare(`INSERT INTO staff_users
            (email, display_name, role, password_hash, status)
            VALUES (?, ?, 'owner', ?, 'active')`)
          .bind(email, "Platform owner", await hashPassword(password))
          .run();
      }
    }

    const row = await db
      .prepare(`SELECT id, email, display_name, role, status, password_hash, must_change_password
        FROM staff_users WHERE email = ? LIMIT 1`)
      .bind(email)
      .first();
    if (
      !row ||
      String((row as Record<string, unknown>).status) !== "active" ||
      !(await verifyPassword(
        password,
        String((row as Record<string, unknown>).password_hash),
      ))
    ) {
      return Response.json({ error: "Email or password is incorrect" }, { status: 401 });
    }

    const user = userFromRow(row as Record<string, unknown>);
    await clearRateLimit(db, limitKey);
    const cookie = await createSession(db, user.id, request);
    await recordAudit(db, user.id, "session.login", "staff_user", user.id);
    return Response.json(
      { user },
      { headers: { "Set-Cookie": cookie, "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unable to sign in";
    return Response.json(
      { error: process.env.NODE_ENV === "production" ? "Unable to sign in" : detail },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}

export async function DELETE(request: Request) {
  const rejected = mutationRejected(request);
  if (rejected) return rejected;
  const currentUser = await authenticateRequest(request);
  const db = authRuntime().DB;
  if (!db) return Response.json({ ok: true });
  await ensureAuthSchema(db);
  const cookie = await endSession(db, request);
  if (currentUser) {
    await recordAudit(db, currentUser.id, "session.logout", "staff_user", currentUser.id);
  }
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": cookie, "Cache-Control": "no-store" } },
  );
}
