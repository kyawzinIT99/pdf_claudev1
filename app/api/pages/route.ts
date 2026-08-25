import { authRuntime, authenticateRequest } from "../../lib/auth";
import {
  defaultAboutProfile,
  normalizeAboutProfile,
  type AboutProfile,
} from "../../lib/bcc-profile";
import {
  defaultCertificatesContent,
  defaultGivingContent,
  normalizeCertificatesContent,
  normalizeGivingContent,
  parsePageContent,
  serializePageContent,
  supportsPageContent,
  type CertificatesContent,
  type GivingContent,
  type PageStructuredContent,
} from "../../lib/page-content";
import {
  normalizePageMedia,
  parsePageMedia,
  supportsPageMedia,
  type PageMedia,
} from "../../lib/page-media";
import {
  sectionDefinitions,
  sectionKeys,
  type SectionFeature,
  type SectionKey,
} from "../../lib/sections";
import { mutationRejected, noStoreHeaders, recordAudit } from "../../lib/security";

async function ensureSchema(db: D1Database) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS site_pages (
    key TEXT PRIMARY KEY,
    eyebrow TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    statement TEXT NOT NULL,
    features_json TEXT NOT NULL DEFAULT '[]',
    about_json TEXT NOT NULL DEFAULT '{}',
    media_json TEXT NOT NULL DEFAULT '{}',
    content_json TEXT NOT NULL DEFAULT '{}',
    updated_by INTEGER NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  const columns = await db.prepare("PRAGMA table_info(site_pages)").all<{ name: string }>();
  const names = new Set((columns.results || []).map((column) => column.name));
  if (!names.has("features_json")) {
    await db.prepare("ALTER TABLE site_pages ADD COLUMN features_json TEXT NOT NULL DEFAULT '[]'").run();
  }
  if (!names.has("about_json")) {
    await db.prepare("ALTER TABLE site_pages ADD COLUMN about_json TEXT NOT NULL DEFAULT '{}'").run();
  }
  if (!names.has("media_json")) {
    await db.prepare("ALTER TABLE site_pages ADD COLUMN media_json TEXT NOT NULL DEFAULT '{}'").run();
  }
  if (!names.has("content_json")) {
    await db.prepare("ALTER TABLE site_pages ADD COLUMN content_json TEXT NOT NULL DEFAULT '{}'").run();
  }
}

function normalizeFeatures(value: unknown, key: SectionKey) {
  const defaults = sectionDefinitions[key].features;
  if (!Array.isArray(value) || value.length !== defaults.length) return defaults;
  return value.map((feature, index) => {
    const candidate = feature as Partial<SectionFeature>;
    return {
      number: defaults[index].number,
      title: candidate.title?.trim() || defaults[index].title,
      description: candidate.description?.trim() || defaults[index].description,
    };
  }) as typeof defaults;
}

function rowFeatures(value: unknown, key: SectionKey) {
  try {
    return normalizeFeatures(JSON.parse(String(value || "[]")), key);
  } catch {
    return sectionDefinitions[key].features;
  }
}

function rowAbout(value: unknown) {
  try {
    return normalizeAboutProfile(JSON.parse(String(value || "{}")));
  } catch {
    return normalizeAboutProfile(defaultAboutProfile);
  }
}

function validText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function validAbout(value: unknown): value is AboutProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<AboutProfile>;
  const textFields: Array<[unknown, number]> = [
    [profile.historyEyebrow, 80], [profile.historyTitle, 160], [profile.historyBody, 1600],
    [profile.formed, 80], [profile.incorporated, 80], [profile.legalName, 180], [profile.abn, 40],
    [profile.focusEyebrow, 80], [profile.focusTitle, 160],
    [profile.committeeEyebrow, 80], [profile.committeeTitle, 160], [profile.committeeNote, 360],
    [profile.committeeUpdated, 80], [profile.address, 240], [profile.phone, 40],
    [profile.contactEyebrow, 80], [profile.contactTitle, 160], [profile.sourceNote, 500],
  ];
  if (!textFields.every(([field, max]) => validText(field, max))) return false;
  if (!Array.isArray(profile.focuses) || profile.focuses.length !== 3) return false;
  if (!profile.focuses.every((focus) => validText(focus?.title, 100) && validText(focus?.description, 360))) return false;
  if (!Array.isArray(profile.committee) || profile.committee.length !== defaultAboutProfile.committee.length) return false;
  return profile.committee.every((member) =>
    validText(member?.name, 120) && validText(member?.role, 100) && validText(member?.phone, 40)
  );
}

function pageResponse(key: SectionKey, page: Record<string, unknown> | null) {
  if (!page) {
    if (!supportsPageContent(key)) return null;
    return {
      ...sectionDefinitions[key],
      key,
      features: sectionDefinitions[key].features,
      content: key === "giving"
        ? { giving: defaultGivingContent }
        : { certificates: defaultCertificatesContent },
      updated_at: null,
    };
  }
  const content = parsePageContent(key, page.content_json);
  return {
    key: page.key,
    eyebrow: page.eyebrow,
    title: page.title,
    summary: page.summary,
    statement: page.statement,
    features: rowFeatures(page.features_json, key),
    about: key === "about" ? rowAbout(page.about_json) : undefined,
    media: parsePageMedia(key, page.media_json),
    content: supportsPageContent(key) ? content : undefined,
    updated_at: page.updated_at,
  };
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key") || "";
  if (!sectionKeys.includes(key as SectionKey)) {
    return Response.json({ error: "Valid page key is required" }, { status: 400 });
  }
  const db = authRuntime().DB;
  if (!db) {
    return Response.json(
      { page: pageResponse(key as SectionKey, null) },
      { headers: noStoreHeaders() },
    );
  }
  await ensureSchema(db);
  const page = await db
    .prepare("SELECT key, eyebrow, title, summary, statement, features_json, about_json, media_json, content_json, updated_at FROM site_pages WHERE key = ?")
    .bind(key)
    .first<Record<string, unknown>>();
  return Response.json(
    { page: pageResponse(key as SectionKey, page) },
    { headers: noStoreHeaders() },
  );
}

export async function PATCH(request: Request) {
  const rejected = mutationRejected(request);
  if (rejected) return rejected;
  const user = await authenticateRequest(request);
  if (!user || user.role === "editor") {
    return Response.json({ error: "Administrator access is required" }, { status: 403 });
  }
  const payload = (await request.json()) as {
    key?: SectionKey;
    eyebrow?: string;
    title?: string;
    summary?: string;
    statement?: string;
    features?: SectionFeature[];
    about?: AboutProfile;
    media?: PageMedia;
    content?: PageStructuredContent;
    giving?: GivingContent;
    certificates?: CertificatesContent;
  };
  if (!sectionKeys.includes(payload.key as SectionKey)) {
    return Response.json({ error: "Valid page key is required" }, { status: 400 });
  }
  const eyebrow = payload.eyebrow?.trim() || "";
  const title = payload.title?.trim() || "";
  const summary = payload.summary?.trim() || "";
  const statement = payload.statement?.trim() || "";
  const featuresAreValid =
    Array.isArray(payload.features) &&
    payload.features.length === 3 &&
    payload.features.every((feature) =>
      typeof feature.title === "string" &&
      feature.title.trim().length > 0 &&
      feature.title.trim().length <= 100 &&
      typeof feature.description === "string" &&
      feature.description.trim().length > 0 &&
      feature.description.trim().length <= 360
    );
  const features = normalizeFeatures(payload.features, payload.key as SectionKey);
  const aboutIsValid = payload.key !== "about" || validAbout(payload.about);
  const media = supportsPageMedia(payload.key as string)
    ? normalizePageMedia(payload.key as SectionKey, payload.media)
    : undefined;

  let content: PageStructuredContent | undefined;
  if (payload.key === "giving") {
    content = {
      giving: normalizeGivingContent(payload.content?.giving || payload.giving),
    };
  } else if (payload.key === "certificates") {
    content = {
      certificates: normalizeCertificatesContent(
        payload.content?.certificates || payload.certificates,
      ),
    };
  }

  if (
    !eyebrow || eyebrow.length > 80 ||
    !title || title.length > 160 ||
    !summary || summary.length > 600 ||
    !statement || statement.length > 220 ||
    !featuresAreValid ||
    !aboutIsValid
  ) {
    return Response.json({ error: "Complete all page fields within their limits" }, { status: 400 });
  }
  const db = authRuntime().DB;
  if (!db) {
    return Response.json({ error: "Database is not connected" }, { status: 503 });
  }
  await ensureSchema(db);
  const about = payload.key === "about"
    ? normalizeAboutProfile(payload.about)
    : normalizeAboutProfile(defaultAboutProfile);
  const contentJson = serializePageContent(payload.key as string, content);
  await db
    .prepare(`INSERT INTO site_pages
      (key, eyebrow, title, summary, statement, features_json, about_json, media_json, content_json, updated_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        eyebrow = excluded.eyebrow,
        title = excluded.title,
        summary = excluded.summary,
        statement = excluded.statement,
        features_json = excluded.features_json,
        about_json = excluded.about_json,
        media_json = excluded.media_json,
        content_json = excluded.content_json,
        updated_by = excluded.updated_by,
        updated_at = CURRENT_TIMESTAMP`)
    .bind(
      payload.key,
      eyebrow,
      title,
      summary,
      statement,
      JSON.stringify(features),
      JSON.stringify(about),
      JSON.stringify(media || {}),
      contentJson,
      user.id,
    )
    .run();
  await recordAudit(db, user.id, "page.update", "site_page", payload.key);
  return Response.json(
    {
      page: {
        key: payload.key,
        eyebrow,
        title,
        summary,
        statement,
        features,
        about: payload.key === "about" ? about : undefined,
        media,
        content,
      },
    },
    { headers: noStoreHeaders() },
  );
}
