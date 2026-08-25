import { authRuntime, authenticateRequest } from "../../lib/auth";
import { ensureSecuritySchema, noStoreHeaders } from "../../lib/security";

export async function GET(request: Request) {
  const user = await authenticateRequest(request);
  if (!user) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  if (user.role === "editor") {
    return Response.json({ error: "Administrator access is required" }, { status: 403 });
  }
  const db = authRuntime().DB;
  if (!db) {
    return Response.json({ events: [] }, { headers: noStoreHeaders() });
  }
  await ensureSecuritySchema(db);
  const result = await db
    .prepare(`SELECT a.id, a.action, a.entity_type, a.entity_id, a.details,
      a.created_at, u.display_name AS actor_name
      FROM audit_events a
      LEFT JOIN staff_users u ON u.id = a.actor_id
      ORDER BY a.created_at DESC, a.id DESC LIMIT 100`)
    .all();
  return Response.json({ events: result.results }, { headers: noStoreHeaders() });
}
