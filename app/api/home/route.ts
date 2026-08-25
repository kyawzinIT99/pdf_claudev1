import { homeSettingsSchemaSql } from "../../../db/schema";
import { authRuntime, authenticateRequest } from "../../lib/auth";
import {
  defaultHomePage,
  normalizeTelegramTraining,
  type HomePageSettings,
  type HomePathway,
} from "../../lib/home";
import { mutationRejected, noStoreHeaders, recordAudit } from "../../lib/security";

async function ensureSchema(db: D1Database) {
  await db.prepare(homeSettingsSchemaSql).run();
  for (const statement of [
    "ALTER TABLE site_home_settings ADD COLUMN hero_image_url TEXT NOT NULL DEFAULT '/pdf-hero-civilian.png'",
    "ALTER TABLE site_home_settings ADD COLUMN hero_image_alt TEXT NOT NULL DEFAULT 'Civilians packing relief supplies together in a community hall.'",
    "ALTER TABLE site_home_settings ADD COLUMN telegram_json TEXT NOT NULL DEFAULT '{}'",
  ]) {
    try {
      await db.prepare(statement).run();
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.toLowerCase().includes("duplicate column")
      ) {
        throw error;
      }
    }
  }
}

function isSafeHref(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function normalizePathway(value: Partial<HomePathway>, index: number): HomePathway {
  const fallback = defaultHomePage.pathways[index];
  return {
    title: value.title?.trim() || fallback.title,
    description: value.description?.trim() || fallback.description,
    href: value.href?.trim() || fallback.href,
    visible: value.visible !== false,
  };
}

function rowToSettings(row: Record<string, unknown>): HomePageSettings {
  let pathways = defaultHomePage.pathways;
  try {
    const parsed = JSON.parse(String(row.pathways_json));
    if (Array.isArray(parsed) && parsed.length === 4) {
      pathways = parsed.map(normalizePathway) as HomePageSettings["pathways"];
    }
  } catch {
    pathways = defaultHomePage.pathways;
  }
  return {
    announcement: String(row.announcement),
    eyebrow: String(row.eyebrow),
    title: String(row.title),
    intro: String(row.intro),
    heroImageUrl: String(row.hero_image_url || defaultHomePage.heroImageUrl),
    heroImageAlt: String(row.hero_image_alt || defaultHomePage.heroImageAlt),
    helpTitle: String(row.help_title),
    helpIntro: String(row.help_intro),
    pathways,
    telegramTraining: normalizeTelegramTraining(parseJson(row.telegram_json)),
  };
}

function parseJson(value: unknown) {
  try {
    return JSON.parse(String(value || "{}"));
  } catch {
    return {};
  }
}

function validSettings(settings: HomePageSettings) {
  return (
    settings.announcement.length <= 120 &&
    settings.eyebrow.length <= 80 &&
    settings.title.length <= 160 &&
    settings.intro.length <= 600 &&
    settings.heroImageUrl.length <= 500 &&
    isSafeHref(settings.heroImageUrl) &&
    settings.heroImageAlt.length > 0 &&
    settings.heroImageAlt.length <= 240 &&
    settings.helpTitle.length <= 160 &&
    settings.helpIntro.length <= 300 &&
    settings.pathways.length === 4 &&
    settings.pathways.every(
      (pathway) =>
        pathway.title.length > 0 &&
        pathway.title.length <= 100 &&
        pathway.description.length > 0 &&
        pathway.description.length <= 360 &&
        pathway.href.length <= 500 &&
        isSafeHref(pathway.href),
    ) &&
    home.telegramTraining.title.length > 0 &&
    home.telegramTraining.description.length > 0 &&
    home.telegramTraining.cta.length > 0 &&
    isSafeHref(home.telegramTraining.url)
  );
}

export async function GET() {
  const db = authRuntime().DB;
  if (!db) {
    return Response.json({ home: defaultHomePage }, { headers: noStoreHeaders() });
  }
  await ensureSchema(db);
  const row = await db
    .prepare(`SELECT announcement, eyebrow, title, intro, hero_image_url, hero_image_alt, help_title, help_intro,
      pathways_json, telegram_json FROM site_home_settings WHERE id = 1`)
    .first();
  return Response.json(
    { home: row ? rowToSettings(row as Record<string, unknown>) : defaultHomePage },
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
  const payload = (await request.json()) as Partial<HomePageSettings>;
  if (!Array.isArray(payload.pathways) || payload.pathways.length !== 4) {
    return Response.json({ error: "All four homepage pathways are required" }, { status: 400 });
  }
  const home: HomePageSettings = {
    announcement: payload.announcement?.trim() || "",
    eyebrow: payload.eyebrow?.trim() || "",
    title: payload.title?.trim() || "",
    intro: payload.intro?.trim() || "",
    heroImageUrl: payload.heroImageUrl?.trim() || "",
    heroImageAlt: payload.heroImageAlt?.trim() || "",
    helpTitle: payload.helpTitle?.trim() || "",
    helpIntro: payload.helpIntro?.trim() || "",
    pathways: payload.pathways.map(normalizePathway) as HomePageSettings["pathways"],
    telegramTraining: normalizeTelegramTraining(payload.telegramTraining),
  };
  if (
    !home.announcement ||
    !home.eyebrow ||
    !home.title ||
    !home.intro ||
    !home.heroImageUrl ||
    !home.heroImageAlt ||
    !home.helpTitle ||
    !home.helpIntro ||
    !validSettings(home)
  ) {
    return Response.json(
      { error: "Complete the homepage fields with valid internal or HTTPS links" },
      { status: 400 },
    );
  }
  const db = authRuntime().DB;
  if (!db) {
    return Response.json({ error: "Database is not connected" }, { status: 503 });
  }
  await ensureSchema(db);
  await db
    .prepare(`INSERT INTO site_home_settings
      (id, announcement, eyebrow, title, intro, hero_image_url, hero_image_alt,
       help_title, help_intro, pathways_json, telegram_json, updated_by, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        announcement = excluded.announcement,
        eyebrow = excluded.eyebrow,
        title = excluded.title,
        intro = excluded.intro,
        hero_image_url = excluded.hero_image_url,
        hero_image_alt = excluded.hero_image_alt,
        help_title = excluded.help_title,
        help_intro = excluded.help_intro,
        pathways_json = excluded.pathways_json,
        telegram_json = excluded.telegram_json,
        updated_by = excluded.updated_by,
        updated_at = CURRENT_TIMESTAMP`)
    .bind(
      home.announcement,
      home.eyebrow,
      home.title,
      home.intro,
      home.heroImageUrl,
      home.heroImageAlt,
      home.helpTitle,
      home.helpIntro,
      JSON.stringify(home.pathways),
      JSON.stringify(home.telegramTraining),
      user.id,
    )
    .run();
  await recordAudit(db, user.id, "home.update", "site_home_settings", 1);
  return Response.json({ home }, { headers: noStoreHeaders() });
}
