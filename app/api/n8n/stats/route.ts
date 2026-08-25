import { authRuntime } from "../../../lib/auth";
import { noStoreHeaders } from "../../../lib/security";

export async function GET(request: Request) {
  const secret = request.headers.get("x-n8n-secret");
  const expected = process.env.N8N_INQUIRY_WEBHOOK_SECRET;
  if (!expected || !secret || secret !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = authRuntime().DB;
  if (!db) {
    return Response.json(
      {
        error: "Database is not connected",
        openInquiries: 0,
        staleInquiries: 0,
        closedThisMonth: 0,
        activeSubscribers: 0,
        newSubscribersThisMonth: 0,
        upcomingEvents: 0,
      },
      { status: 503, headers: noStoreHeaders() },
    );
  }

  const now = new Date();

  // Threshold: 3 days ago (for stale open inquiries)
  const threeDaysAgo = new Date(now.getTime() - 3 * 86400000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  // Start of current month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  const [openRow, staleRow, closedRow, subActiveRow, subNewRow, eventRow] =
    await Promise.all([
      db
        .prepare(
          `SELECT COUNT(*) AS cnt FROM public_inquiries
           WHERE status NOT IN ('closed','resolved')`,
        )
        .first<{ cnt: number }>(),

      db
        .prepare(
          `SELECT COUNT(*) AS cnt FROM public_inquiries
           WHERE status NOT IN ('closed','resolved') AND created_at < ?`,
        )
        .bind(threeDaysAgo)
        .first<{ cnt: number }>(),

      db
        .prepare(
          `SELECT COUNT(*) AS cnt FROM public_inquiries
           WHERE status IN ('closed','resolved') AND closed_at >= ?`,
        )
        .bind(monthStart)
        .first<{ cnt: number }>(),

      db
        .prepare(
          `SELECT COUNT(*) AS cnt FROM mail_subscribers WHERE status = 'active'`,
        )
        .first<{ cnt: number }>(),

      db
        .prepare(
          `SELECT COUNT(*) AS cnt FROM mail_subscribers WHERE created_at >= ?`,
        )
        .bind(monthStart)
        .first<{ cnt: number }>(),

      db
        .prepare(
          `SELECT updated_at AS last_published_at
           FROM community_events
           WHERE status = 'published'
           ORDER BY updated_at DESC
           LIMIT 1`,
        )
        .first<{ last_published_at: string | null }>(),
    ]);

  // Stalest open inquiry (max days without update)
  const stalestRow = await db
    .prepare(
      `SELECT created_at FROM public_inquiries
       WHERE status NOT IN ('closed','resolved')
       ORDER BY created_at ASC
       LIMIT 1`,
    )
    .first<{ created_at: string | null }>();

  const stalestDays = stalestRow?.created_at
    ? Math.floor((now.getTime() - new Date(stalestRow.created_at).getTime()) / 86400000)
    : 0;

  const lastPublishedAt = eventRow?.last_published_at ?? null;
  const daysSinceLastEvent = lastPublishedAt
    ? Math.floor((now.getTime() - new Date(lastPublishedAt).getTime()) / 86400000)
    : null;

  return Response.json(
    {
      generated_at: now.toISOString(),
      inquiries: {
        open: Number(openRow?.cnt ?? 0),
        stale: Number(staleRow?.cnt ?? 0),
        stalest_days: stalestDays,
        closed_this_month: Number(closedRow?.cnt ?? 0),
      },
      subscribers: {
        active: Number(subActiveRow?.cnt ?? 0),
        new_this_month: Number(subNewRow?.cnt ?? 0),
      },
      events: {
        last_published_at: lastPublishedAt,
        days_since_last_event: daysSinceLastEvent,
      },
    },
    { headers: noStoreHeaders() },
  );
}
