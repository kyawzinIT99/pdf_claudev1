import {
  authRuntime,
  authenticateRequest,
  ensureAuthSchema,
  hashPassword,
  validPassword,
  verifyPassword,
} from "../../../lib/auth";
import { mutationRejected, noStoreHeaders, recordAudit } from "../../../lib/security";

export async function POST(request: Request) {
  const rejected = mutationRejected(request);
  if (rejected) return rejected;
  const user = await authenticateRequest(request);
  if (!user) {
    return Response.json(
      { error: "Sign in required" },
      { status: 401, headers: noStoreHeaders() },
    );
  }
  const payload = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (!validPassword(payload.newPassword || "")) {
    return Response.json(
      { error: "New passwords must contain between 12 and 128 characters" },
      { status: 400, headers: noStoreHeaders() },
    );
  }
  const db = authRuntime().DB;
  if (!db) {
    return Response.json(
      { error: "Database is not connected" },
      { status: 503, headers: noStoreHeaders() },
    );
  }
  await ensureAuthSchema(db);
  const row = (await db
    .prepare("SELECT password_hash FROM staff_users WHERE id = ?")
    .bind(user.id)
    .first()) as Record<string, unknown> | null;
  if (
    !row ||
    !(await verifyPassword(
      payload.currentPassword || "",
      String(row.password_hash),
    ))
  ) {
    return Response.json(
      { error: "Current password is incorrect" },
      { status: 400, headers: noStoreHeaders() },
    );
  }
  await db
    .prepare(`UPDATE staff_users
      SET password_hash = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`)
    .bind(await hashPassword(payload.newPassword!), user.id)
    .run();
  // Invalidate ALL other sessions after password change (security best practice)
  await db
    .prepare("DELETE FROM staff_sessions WHERE user_id = ?")
    .bind(user.id)
    .run();
  await recordAudit(db, user.id, "staff.password_changed", "staff_user", user.id);
  return Response.json({ ok: true }, { headers: noStoreHeaders() });
}
