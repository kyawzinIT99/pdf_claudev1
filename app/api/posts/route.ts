import { applicationRuntime } from "../../lib/hostinger-runtime";
import { sectionKeys, type SectionKey } from "../../lib/sections";
import { authenticateRequest } from "../../lib/auth";
import { notifyPublishAutomation } from "../../lib/n8n";
import {
  mutationRejected,
  noStoreHeaders,
  recordAudit,
} from "../../lib/security";

type RuntimeEnv = {
  DB: D1Database;
  ADMIN_WRITE_TOKEN?: string;
  N8N_PUBLISH_WEBHOOK?: string;
};

function runtime() {
  return applicationRuntime() as unknown as RuntimeEnv;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70) || `post-${Date.now()}`
  );
}

async function canWrite(request: Request) {
  if (await authenticateRequest(request)) return true;
  const expected = runtime().ADMIN_WRITE_TOKEN;
  return Boolean(expected && request.headers.get("x-admin-token") === expected);
}

const MAX_GALLERY_MEDIA = 4;

type GalleryItem = {
  id: number;
  url: string;
  contentType: string;
  alt: string;
};

async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'Field notes',
      placement TEXT NOT NULL DEFAULT 'stories',
      status TEXT NOT NULL DEFAULT 'draft',
      channels TEXT NOT NULL DEFAULT '[]',
      author TEXT NOT NULL DEFAULT 'Community editor',
      media_id INTEGER,
      scheduled_at TEXT,
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(
      "CREATE INDEX IF NOT EXISTS posts_status_updated_idx ON posts(status, updated_at DESC)",
    ),
    db.prepare(`CREATE TABLE IF NOT EXISTS post_revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      snapshot TEXT NOT NULL,
      changed_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      object_key TEXT NOT NULL UNIQUE,
      filename TEXT NOT NULL,
      content_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      alt_text TEXT NOT NULL DEFAULT '',
      uploaded_by TEXT NOT NULL DEFAULT 'Community editor',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS post_media (
      post_id INTEGER NOT NULL,
      media_id INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (post_id, media_id)
    )`),
    db.prepare(
      "CREATE INDEX IF NOT EXISTS post_media_post_idx ON post_media(post_id, sort_order)",
    ),
  ]);
  try {
    await db
      .prepare(
        "ALTER TABLE posts ADD COLUMN placement TEXT NOT NULL DEFAULT 'stories'",
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
  try {
    await db.prepare("ALTER TABLE posts ADD COLUMN media_id INTEGER").run();
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.toLowerCase().includes("duplicate column")
    ) {
      throw error;
    }
  }
  try {
    await db.prepare("ALTER TABLE posts ADD COLUMN scheduled_at TEXT").run();
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.toLowerCase().includes("duplicate column")
    ) {
      throw error;
    }
  }
}

function parseMediaIds(payload: {
  mediaId?: number | null;
  mediaIds?: unknown;
}): number[] {
  const fromArray = Array.isArray(payload.mediaIds)
    ? payload.mediaIds
        .map((value) => Number(value))
        .filter((id) => Number.isSafeInteger(id) && id > 0)
    : [];
  if (fromArray.length) {
    return [...new Set(fromArray)].slice(0, MAX_GALLERY_MEDIA);
  }
  const single = Number(payload.mediaId);
  return Number.isSafeInteger(single) && single > 0 ? [single] : [];
}

async function syncPostMedia(db: D1Database, postId: number, mediaIds: number[]) {
  await db.prepare("DELETE FROM post_media WHERE post_id = ?").bind(postId).run();
  for (let index = 0; index < mediaIds.length; index += 1) {
    await db
      .prepare(
        "INSERT INTO post_media (post_id, media_id, sort_order) VALUES (?, ?, ?)",
      )
      .bind(postId, mediaIds[index], index)
      .run();
  }
  await db
    .prepare("UPDATE posts SET media_id = ? WHERE id = ?")
    .bind(mediaIds[0] ?? null, postId)
    .run();
}

async function loadGalleries(
  db: D1Database,
  postIds: number[],
): Promise<Map<number, GalleryItem[]>> {
  const galleries = new Map<number, GalleryItem[]>();
  if (!postIds.length) return galleries;

  const placeholders = postIds.map(() => "?").join(", ");
  const linked = await db
    .prepare(
      `SELECT pm.post_id, m.id, m.content_type, m.alt_text, pm.sort_order
        FROM post_media pm
        INNER JOIN media m ON m.id = pm.media_id
        WHERE pm.post_id IN (${placeholders})
        ORDER BY pm.post_id ASC, pm.sort_order ASC`,
    )
    .bind(...postIds)
    .all();

  for (const row of linked.results as Record<string, unknown>[]) {
    const postId = Number(row.post_id);
    const list = galleries.get(postId) || [];
    list.push({
      id: Number(row.id),
      url: `/api/media?id=${Number(row.id)}`,
      contentType: String(row.content_type || ""),
      alt: String(row.alt_text || ""),
    });
    galleries.set(postId, list);
  }

  // Backward compatibility: older posts with only posts.media_id
  const missing = postIds.filter((id) => !galleries.get(id)?.length);
  if (missing.length) {
    const coverPlaceholders = missing.map(() => "?").join(", ");
    const covers = await db
      .prepare(
        `SELECT p.id AS post_id, m.id, m.content_type, m.alt_text
          FROM posts p
          INNER JOIN media m ON m.id = p.media_id
          WHERE p.id IN (${coverPlaceholders}) AND p.media_id IS NOT NULL`,
      )
      .bind(...missing)
      .all();
    for (const row of covers.results as Record<string, unknown>[]) {
      galleries.set(Number(row.post_id), [
        {
          id: Number(row.id),
          url: `/api/media?id=${Number(row.id)}`,
          contentType: String(row.content_type || ""),
          alt: String(row.alt_text || ""),
        },
      ]);
    }
  }

  return galleries;
}

function parseChannels(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string").slice(0, 8);
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item) => typeof item === "string").slice(0, 8)
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalize(row: Record<string, unknown>, gallery: GalleryItem[] = []) {
  const cover = gallery[0];
  const mediaId = cover?.id ?? (row.media_id ? Number(row.media_id) : null);
  return {
    id: Number(row.id),
    slug: String(row.slug || ""),
    title: String(row.title || ""),
    excerpt: String(row.excerpt || ""),
    body: String(row.body || ""),
    category: String(row.category || "Field notes"),
    placement: String(row.placement || "stories"),
    status: String(row.status || "draft"),
    channels: parseChannels(row.channels),
    author: String(row.author || "Community editor"),
    mediaId,
    mediaIds: gallery.map((item) => item.id),
    mediaUrl: mediaId ? `/api/media?id=${mediaId}` : null,
    mediaType:
      cover?.contentType ||
      (row.media_content_type ? String(row.media_content_type) : null),
    mediaAlt:
      cover?.alt || (row.media_alt_text ? String(row.media_alt_text) : ""),
    gallery,
    scheduledAt: row.scheduled_at ? String(row.scheduled_at) : null,
    date: row.published_at || row.updated_at,
    visualLabel: "COMMUNITY UPDATE",
  };
}

async function enrichPosts(db: D1Database, rows: Record<string, unknown>[]) {
  const galleries = await loadGalleries(
    db,
    rows.map((row) => Number(row.id)).filter((id) => Number.isSafeInteger(id)),
  );
  return rows.map((row) => normalize(row, galleries.get(Number(row.id)) || []));
}

export async function GET(request: Request) {
  try {
    const db = runtime().DB;
    if (!db) {
      return Response.json({ posts: [] }, { headers: noStoreHeaders() });
    }
    await ensureSchema(db);
    const url = new URL(request.url);
    const adminScope = url.searchParams.get("scope") === "admin";
    if (adminScope && !(await canWrite(request))) {
      return Response.json(
        { error: "Authorized staff access is required" },
        { status: 401 },
      );
    }
    const requestedPlacement = url.searchParams.get("placement") || "";
    const placement = sectionKeys.includes(requestedPlacement as SectionKey)
      ? requestedPlacement
      : null;
    const result = adminScope
      ? await db
          .prepare(
            `SELECT p.*, m.content_type AS media_content_type, m.alt_text AS media_alt_text
              FROM posts p LEFT JOIN media m ON m.id = p.media_id
              ORDER BY p.updated_at DESC, p.id DESC LIMIT 50`,
          )
          .all()
      : placement
        ? await db
            .prepare(
              `SELECT p.*, m.content_type AS media_content_type, m.alt_text AS media_alt_text
                FROM posts p LEFT JOIN media m ON m.id = p.media_id
                WHERE p.status = 'published' AND p.placement = ?
                ORDER BY p.published_at DESC, p.id DESC LIMIT 50`,
            )
            .bind(placement)
            .all()
        : await db
            .prepare(
              `SELECT p.*, m.content_type AS media_content_type, m.alt_text AS media_alt_text
                FROM posts p LEFT JOIN media m ON m.id = p.media_id
                WHERE p.status = 'published'
                ORDER BY p.published_at DESC, p.id DESC LIMIT 50`,
            )
            .all();
    const posts = await enrichPosts(
      db,
      result.results as Record<string, unknown>[],
    );
    return Response.json({ posts }, { headers: noStoreHeaders() });
  } catch {
    return Response.json(
      { error: "Unable to load posts" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const rejected = mutationRejected(request);
  if (rejected) return rejected;
  const staffUser = await authenticateRequest(request);
  const expectedToken = runtime().ADMIN_WRITE_TOKEN;
  const automationAuthorized = Boolean(
    expectedToken && request.headers.get("x-admin-token") === expectedToken,
  );
  if (!staffUser && !automationAuthorized) {
    return Response.json({ error: "Authorized staff access is required" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      title?: string;
      excerpt?: string;
      body?: string;
      category?: string;
      placement?: SectionKey;
      status?: "draft" | "review" | "published";
      channels?: string[];
      author?: string;
      mediaId?: number | null;
      mediaIds?: number[];
      scheduledAt?: string | null;
    };
    const title = payload.title?.trim() || "";
    if (!title) {
      return Response.json({ error: "title is required" }, { status: 400 });
    }
    if (
      title.length > 140 ||
      (payload.excerpt || "").length > 420 ||
      (payload.body || "").length > 20_000 ||
      (payload.category || "").length > 40
    ) {
      return Response.json({ error: "One or more fields exceed the allowed length" }, { status: 400 });
    }

    const allowedStatuses = new Set(["draft", "review", "published"]);
    const status = allowedStatuses.has(payload.status || "") ? payload.status! : "draft";
    // Publishing is a human act. A machine token may create drafts and items
    // for review, but never put content in front of the public: the token
    // lives in an automation environment, and anything holding it could
    // otherwise publish unreviewed content under the organisation's name.
    if (status === "published" && !staffUser) {
      return Response.json(
        { error: "Publishing requires a signed-in administrator" },
        { status: 403 },
      );
    }
    if (status === "published" && staffUser?.role === "editor") {
      return Response.json(
        { error: "Administrator approval is required to publish" },
        { status: 403 },
      );
    }
    const channels = Array.isArray(payload.channels)
      ? payload.channels.filter((item) => typeof item === "string").slice(0, 8)
      : ["Website"];
    const placement = sectionKeys.includes(payload.placement as SectionKey)
      ? payload.placement!
      : "stories";
    const slug = `${slugify(title)}-${Date.now().toString(36)}`;
    const mediaIds = parseMediaIds(payload);
    const mediaId = mediaIds[0] ?? null;
    const db = runtime().DB;
    if (!db) {
      return Response.json({ error: "Database is not connected" }, { status: 503 });
    }
    await ensureSchema(db);

    const row = await db
      .prepare(`INSERT INTO posts
        (slug, title, excerpt, body, category, placement, status, channels, author, media_id, scheduled_at, published_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        RETURNING *`)
      .bind(
        slug,
        title,
        payload.excerpt?.trim() || "",
        payload.body?.trim() || "",
        payload.category || "Field notes",
        placement,
        status,
        JSON.stringify(channels),
        staffUser?.displayName || payload.author || "Approved automation",
        mediaId,
        null,
        status === "published" ? new Date().toISOString() : null,
      )
      .first();

    const postId = Number((row as Record<string, unknown>).id);
    await syncPostMedia(db, postId, mediaIds);

    const storedPost = await db
      .prepare(`SELECT p.*, m.content_type AS media_content_type, m.alt_text AS media_alt_text
        FROM posts p LEFT JOIN media m ON m.id = p.media_id WHERE p.id = ?`)
      .bind(postId)
      .first();
    const [post] = await enrichPosts(db, [
      storedPost as Record<string, unknown>,
    ]);

    if (staffUser) {
      await recordAudit(db, staffUser.id, "post.create", "post", Number(post.id), {
        status,
        placement,
      });
    }

    if (status === "published") {
      const automation = await notifyPublishAutomation({
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        placement: post.placement,
        channels: post.channels,
        author: post.author,
        publishedAt: post.date,
      });
      if (automation === "failed") {
        await recordAudit(db, staffUser?.id ?? null, "post.webhook-failed", "post", Number(post.id), {
          placement,
        });
      } else if (automation === "delivered") {
        await recordAudit(
          db,
          staffUser?.id ?? null,
          "post.webhook-delivered",
          "post",
          Number(post.id),
          { placement, automation: "n8n" },
        );
      }
    }

    return Response.json({ post }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Unable to save post" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const rejected = mutationRejected(request);
  if (rejected) return rejected;
  const staffUser = await authenticateRequest(request);
  if (!staffUser) {
    return Response.json({ error: "Authorized staff access is required" }, { status: 401 });
  }
  try {
    const payload = (await request.json()) as {
      id?: number;
      title?: string;
      excerpt?: string;
      body?: string;
      category?: string;
      placement?: SectionKey;
      status?: "draft" | "review" | "published";
      channels?: string[];
      mediaId?: number | null;
      mediaIds?: number[];
    };
    const id = Number(payload.id);
    const title = payload.title?.trim() || "";
    if (
      !Number.isSafeInteger(id) ||
      !title ||
      title.length > 140 ||
      (payload.excerpt || "").length > 420 ||
      (payload.body || "").length > 20_000
    ) {
      return Response.json({ error: "Valid post details are required" }, { status: 400 });
    }
    const allowedStatuses = new Set(["draft", "review", "published"]);
    const status = allowedStatuses.has(payload.status || "") ? payload.status! : "draft";
    if (status === "published" && staffUser.role === "editor") {
      return Response.json(
        { error: "Administrator approval is required to publish" },
        { status: 403 },
      );
    }
    const db = runtime().DB;
    if (!db) {
      return Response.json({ error: "Database is not connected" }, { status: 503 });
    }
    await ensureSchema(db);
    const existing = await db.prepare("SELECT * FROM posts WHERE id = ?").bind(id).first();
    if (!existing) return Response.json({ error: "Post not found" }, { status: 404 });
    const previousStatus = String((existing as Record<string, unknown>).status || "draft");
    const [existingEnriched] = await enrichPosts(db, [
      existing as Record<string, unknown>,
    ]);
    await db
      .prepare(
        "INSERT INTO post_revisions (post_id, snapshot, changed_by) VALUES (?, ?, ?)",
      )
      .bind(
        id,
        JSON.stringify(existingEnriched, (_key, value) =>
          typeof value === "bigint" ? Number(value) : value,
        ),
        staffUser.id,
      )
      .run();
    const placement = sectionKeys.includes(payload.placement as SectionKey)
      ? payload.placement!
      : "stories";
    const channels = Array.isArray(payload.channels)
      ? payload.channels.filter((item) => typeof item === "string").slice(0, 8)
      : ["Website"];
    const mediaIds = parseMediaIds(payload);
    const mediaId = mediaIds[0] ?? null;
    // Compute publish timestamp in JS — MySQL CASE + bound params is unreliable here.
    let publishedAt: string | null = (existing as Record<string, unknown>).published_at
      ? String((existing as Record<string, unknown>).published_at)
      : null;
    if (status === "published" && previousStatus !== "published") {
      publishedAt = new Date().toISOString();
    } else if (status !== "published") {
      publishedAt = null;
    }
    await db
      .prepare(`UPDATE posts SET
        title = ?, excerpt = ?, body = ?, category = ?, placement = ?,
        status = ?, channels = ?, media_id = ?, published_at = ?,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`)
      .bind(
        title,
        payload.excerpt?.trim() || "",
        payload.body?.trim() || "",
        (payload.category || "Field notes").slice(0, 40),
        placement,
        status,
        JSON.stringify(channels),
        mediaId,
        publishedAt,
        id,
      )
      .run();
    await syncPostMedia(db, id, mediaIds);
    await recordAudit(db, staffUser.id, `post.${status}`, "post", id, {
      previousStatus,
      placement,
    });
    const storedPost = await db
      .prepare(`SELECT p.*, m.content_type AS media_content_type, m.alt_text AS media_alt_text
        FROM posts p LEFT JOIN media m ON m.id = p.media_id WHERE p.id = ?`)
      .bind(id)
      .first();
    if (!storedPost) {
      return Response.json({ error: "Post not found after update" }, { status: 404 });
    }
    const [post] = await enrichPosts(db, [
      storedPost as Record<string, unknown>,
    ]);

    if (status === "published" && previousStatus !== "published") {
      const automation = await notifyPublishAutomation({
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        placement: post.placement,
        channels: post.channels,
        author: post.author,
        publishedAt: post.date,
      });
      if (automation === "failed") {
        await recordAudit(db, staffUser.id, "post.webhook-failed", "post", id, { placement });
      } else if (automation === "delivered") {
        await recordAudit(db, staffUser.id, "post.webhook-delivered", "post", id, {
          placement,
          automation: "n8n",
        });
      }
    }

    return Response.json({ post }, { headers: noStoreHeaders() });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown error";
    return Response.json(
      { error: "Unable to update post", detail },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const rejected = mutationRejected(request);
  if (rejected) return rejected;
  const staffUser = await authenticateRequest(request);
  if (!staffUser) {
    return Response.json({ error: "Authorized staff access is required" }, { status: 401 });
  }
  if (staffUser.role === "editor") {
    return Response.json(
      { error: "Administrator or owner access is required to delete posts" },
      { status: 403 },
    );
  }

  try {
    const url = new URL(request.url);
    const idFromQuery = Number(url.searchParams.get("id"));
    let id = idFromQuery;
    if (!Number.isSafeInteger(id) || id <= 0) {
      const payload = (await request.json().catch(() => ({}))) as { id?: number };
      id = Number(payload.id);
    }
    if (!Number.isSafeInteger(id) || id <= 0) {
      return Response.json({ error: "Valid post id is required" }, { status: 400 });
    }

    const db = runtime().DB;
    if (!db) {
      return Response.json({ error: "Database is not connected" }, { status: 503 });
    }
    await ensureSchema(db);
    const existing = await db.prepare("SELECT id, title, status FROM posts WHERE id = ?").bind(id).first();
    if (!existing) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    await db.prepare("DELETE FROM post_media WHERE post_id = ?").bind(id).run();
    await db.prepare("DELETE FROM post_revisions WHERE post_id = ?").bind(id).run();
    await db.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
    await recordAudit(db, staffUser.id, "post.delete", "post", id, {
      title: String((existing as Record<string, unknown>).title || ""),
      previousStatus: String((existing as Record<string, unknown>).status || ""),
    });

    return Response.json({ deleted: true, id }, { headers: noStoreHeaders() });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown error";
    return Response.json(
      { error: "Unable to delete post", detail },
      { status: 500 },
    );
  }
}
