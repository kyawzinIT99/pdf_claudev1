import { applicationRuntime } from "../../lib/hostinger-runtime";
import { authenticateRequest } from "../../lib/auth";
import { mutationRejected, noStoreHeaders, recordAudit } from "../../lib/security";

type RuntimeEnv = {
  DB: D1Database;
  MEDIA: R2Bucket;
  ADMIN_WRITE_TOKEN?: string;
};

function runtime() {
  return applicationRuntime() as unknown as RuntimeEnv;
}

const allowedTypes = new Map([
  ["image/jpeg", [[0xff, 0xd8, 0xff]]],
  ["image/png", [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]]],
  ["image/gif", [[0x47, 0x49, 0x46, 0x38]]],
  ["image/webp", [[0x52, 0x49, 0x46, 0x46]]],
  ["application/pdf", [[0x25, 0x50, 0x44, 0x46]]],
]);

function matchesMagic(bytes: Uint8Array, signatures: number[][], type: string) {
  const prefix = signatures.some((signature) =>
    signature.every((byte, index) => bytes[index] === byte),
  );
  return type !== "image/webp"
    ? prefix
    : prefix &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50;
}

async function ensureMediaSchema(db: D1Database) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    object_key TEXT NOT NULL UNIQUE,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    alt_text TEXT NOT NULL DEFAULT '',
    uploaded_by TEXT NOT NULL DEFAULT 'Community editor',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS post_media (
    post_id INTEGER NOT NULL,
    media_id INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (post_id, media_id)
  )`).run();
  try {
    await db.prepare("ALTER TABLE media ADD COLUMN alt_text TEXT NOT NULL DEFAULT ''").run();
  } catch (error) {
    if (!(error instanceof Error) || !error.message.toLowerCase().includes("duplicate column")) {
      throw error;
    }
  }
}

export async function GET(request: Request) {
  const user = await authenticateRequest(request);
  const db = runtime().DB;
  if (!db) {
    return Response.json({ error: "Database is not connected" }, { status: 503 });
  }
  await ensureMediaSchema(db);
  const mediaId = Number(new URL(request.url).searchParams.get("id"));

  if (Number.isSafeInteger(mediaId) && mediaId > 0) {
    // Staff uploads are community assets. Serve by id so hero URLs and
    // published stories work on Hostinger without requiring a second publish gate.
    const media = await db
      .prepare(
        "SELECT object_key, filename, content_type FROM media WHERE id = ?",
      )
      .bind(mediaId)
      .first<Record<string, unknown>>();

    if (!media) {
      return Response.json({ error: "Media not found" }, { status: 404 });
    }
    const storage = runtime().MEDIA;
    if (!storage) {
      return Response.json(
        { error: "Media storage is not connected. Hero photos cannot be saved yet." },
        { status: 503 },
      );
    }
    const object = await storage.get(String(media.object_key));
    if (!object) {
      return Response.json({ error: "Media file not found" }, { status: 404 });
    }
    return new Response(object.body, {
      headers: {
        "Content-Type": String(media.content_type),
        "Cache-Control": user
          ? "private, no-store"
          : "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Disposition": `inline; filename="${String(media.filename).replace(/["\r\n]/g, "")}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (!user) {
    return Response.json({ error: "Authorized staff access is required" }, { status: 401 });
  }
  const result = await db
    .prepare("SELECT id, filename, content_type, size, alt_text, uploaded_by, created_at FROM media ORDER BY created_at DESC LIMIT 100")
    .all();
  return Response.json({ media: result.results }, { headers: noStoreHeaders() });
}

export async function POST(request: Request) {
  const rejected = mutationRejected(request);
  if (rejected) return rejected;
  const user = await authenticateRequest(request);
  const expected = runtime().ADMIN_WRITE_TOKEN;
  const authorized =
    Boolean(user) ||
    Boolean(expected && request.headers.get("x-admin-token") === expected);
  if (!authorized) {
    return Response.json({ error: "Authorized staff access is required" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const altText = String(form.get("altText") || "").trim().slice(0, 240);
    if (!(file instanceof File)) {
      return Response.json({ error: "file is required" }, { status: 400 });
    }
    if (file.size > 15 * 1024 * 1024) {
      return Response.json({ error: "file exceeds the 15 MB preview limit" }, { status: 413 });
    }
    const signatures = allowedTypes.get(file.type);
    if (!signatures) {
      return Response.json({ error: "Only JPEG, PNG, GIF, WebP and PDF files are accepted" }, { status: 415 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesMagic(bytes, signatures, file.type)) {
      return Response.json({ error: "The file contents do not match the selected file type" }, { status: 415 });
    }

    const storage = runtime().MEDIA;
    if (!storage) {
      return Response.json(
        { error: "Media storage is not connected. Set MySQL or use the local .data store." },
        { status: 503 },
      );
    }
    const objectKey = `community/${crypto.randomUUID()}-${file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")}`;
    await storage.put(objectKey, bytes, {
      httpMetadata: { contentType: file.type },
      customMetadata: { originalFilename: file.name },
    });

    const db = runtime().DB;
    if (!db) {
      return Response.json({ error: "Database is not connected" }, { status: 503 });
    }
    await ensureMediaSchema(db);
    const record = await db
      .prepare(
        "INSERT INTO media (object_key, filename, content_type, size, alt_text, uploaded_by) VALUES (?, ?, ?, ?, ?, ?) RETURNING *",
      )
      .bind(
        objectKey,
        file.name,
        file.type,
        file.size,
        altText,
        user?.displayName || "Approved automation",
      )
      .first();

    if (user) {
      await recordAudit(db, user.id, "media.upload", "media", Number((record as Record<string, unknown>).id), {
        contentType: file.type,
        size: file.size,
      });
    }
    return Response.json({ media: record }, { status: 201, headers: noStoreHeaders() });
  } catch {
    return Response.json(
      { error: "Unable to store media" },
      { status: 500 },
    );
  }
}
