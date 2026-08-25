import {
  authRuntime,
  authenticateRequest,
  cleanEmail,
  ensureAuthSchema,
  hashPassword,
  staffRoles,
  type StaffRole,
  userFromRow,
  validPassword,
} from "../../lib/auth";
import { mutationRejected, noStoreHeaders, recordAudit } from "../../lib/security";

const selectUsers = `SELECT id, email, display_name, role, status, must_change_password
  FROM staff_users ORDER BY
  CASE role WHEN 'owner' THEN 1 WHEN 'administrator' THEN 2 ELSE 3 END,
  display_name`;

export async function GET(request: Request) {
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (user.role !== "owner") {
    return Response.json({ error: "Owner access is required" }, { status: 403 });
  }
  const db = authRuntime().DB;
  if (!db) {
    return Response.json({ error: "Database is not connected", users: [] }, { status: 503 });
  }
  const result = await db.prepare(selectUsers).all();
  return Response.json({
    users: (result.results as Record<string, unknown>[]).map(userFromRow),
  }, { headers: noStoreHeaders() });
}

export async function POST(request: Request) {
  const rejected = mutationRejected(request);
  if (rejected) return rejected;
  const currentUser = await authenticateRequest(request);
  if (!currentUser) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (currentUser.role !== "owner") {
    return Response.json({ error: "Owner access is required" }, { status: 403 });
  }

  try {
    const payload = (await request.json()) as {
      email?: string;
      displayName?: string;
      password?: string;
      role?: StaffRole;
    };
    const email = cleanEmail(payload.email || "");
    const displayName = payload.displayName?.trim() || "";
    const password = payload.password || "";
    const role = staffRoles.includes(payload.role as StaffRole)
      ? payload.role!
      : "editor";
    if (!email.includes("@") || !displayName) {
      return Response.json(
        { error: "A valid email and display name are required" },
        { status: 400 },
      );
    }
    if (!validPassword(password)) {
      return Response.json(
        { error: "Passwords must contain between 12 and 128 characters" },
        { status: 400 },
      );
    }

    const db = authRuntime().DB;
    if (!db) {
      return Response.json({ error: "Database is not connected" }, { status: 503 });
    }
    await ensureAuthSchema(db);
    const row = await db
      .prepare(`INSERT INTO staff_users
        (email, display_name, role, password_hash, status, must_change_password, updated_at)
        VALUES (?, ?, ?, ?, 'active', 1, CURRENT_TIMESTAMP)
        RETURNING id, email, display_name, role, status, must_change_password`)
      .bind(email, displayName, role, await hashPassword(password))
      .first();
    const created = userFromRow(row as Record<string, unknown>);
    await recordAudit(db, currentUser.id, "staff.create", "staff_user", created.id, {
      role: created.role,
    });
    return Response.json(
      { user: created },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create account";
    return Response.json(
      { error: message.toLowerCase().includes("unique") ? "Email already exists" : "Unable to create account" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const rejected = mutationRejected(request);
  if (rejected) return rejected;
  const currentUser = await authenticateRequest(request);
  if (!currentUser) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (currentUser.role !== "owner") {
    return Response.json({ error: "Owner access is required" }, { status: 403 });
  }

  try {
    const payload = (await request.json()) as {
      id?: number;
      email?: string;
      displayName?: string;
      password?: string;
      role?: StaffRole;
      status?: "active" | "disabled";
    };
    const id = Number(payload.id);
    const email = cleanEmail(payload.email || "");
    const displayName = payload.displayName?.trim() || "";
    const role = staffRoles.includes(payload.role as StaffRole)
      ? payload.role!
      : "editor";
    const status = payload.status === "disabled" ? "disabled" : "active";
    if (!Number.isSafeInteger(id) || !email.includes("@") || !displayName) {
      return Response.json({ error: "Valid account details are required" }, { status: 400 });
    }
    if (id === currentUser.id && (status === "disabled" || role !== "owner")) {
      return Response.json(
        { error: "The active owner cannot remove their own owner access" },
        { status: 400 },
      );
    }
    if (payload.password && !validPassword(payload.password)) {
      return Response.json(
        { error: "Passwords must contain between 12 and 128 characters" },
        { status: 400 },
      );
    }

    const db = authRuntime().DB;
    if (!db) {
      return Response.json({ error: "Database is not connected" }, { status: 503 });
    }
    await ensureAuthSchema(db);
    if (payload.password) {
      await db
        .prepare(`UPDATE staff_users SET
          email = ?, display_name = ?, role = ?, status = ?, password_hash = ?,
          updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .bind(
          email,
          displayName,
          role,
          status,
          await hashPassword(payload.password),
          id,
        )
        .run();
      if (id !== currentUser.id) {
        await db.prepare("DELETE FROM staff_sessions WHERE user_id = ?").bind(id).run();
      }
    } else {
      await db
        .prepare(`UPDATE staff_users SET
          email = ?, display_name = ?, role = ?, status = ?,
          updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .bind(email, displayName, role, status, id)
        .run();
    }
    const row = await db
      .prepare(
        "SELECT id, email, display_name, role, status, must_change_password FROM staff_users WHERE id = ?",
      )
      .bind(id)
      .first();
    if (!row) return Response.json({ error: "Account not found" }, { status: 404 });
    const updated = userFromRow(row as Record<string, unknown>);
    await recordAudit(db, currentUser.id, "staff.update", "staff_user", updated.id, {
      role: updated.role,
      status: updated.status,
      passwordReset: Boolean(payload.password),
    });
    return Response.json({ user: updated }, { headers: noStoreHeaders() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update account";
    return Response.json(
      { error: message.toLowerCase().includes("unique") ? "Email already exists" : "Unable to update account" },
      { status: 400 },
    );
  }
}
