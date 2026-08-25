import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull().default(""),
  category: text("category").notNull().default("Field notes"),
  placement: text("placement").notNull().default("stories"),
  status: text("status").notNull().default("draft"),
  channels: text("channels").notNull().default("[]"),
  author: text("author").notNull().default("Community editor"),
  mediaId: integer("media_id"),
  scheduledAt: text("scheduled_at"),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  objectKey: text("object_key").notNull().unique(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  altText: text("alt_text").notNull().default(""),
  uploadedBy: text("uploaded_by").notNull().default("Community editor"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const distributionEvents = sqliteTable("distribution_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  channel: text("channel").notNull(),
  status: text("status").notNull().default("queued"),
  externalId: text("external_id"),
  error: text("error"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const staffUsers = sqliteTable("staff_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("editor"),
  passwordHash: text("password_hash").notNull(),
  status: text("status").notNull().default("active"),
  mustChangePassword: integer("must_change_password", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const postRevisions = sqliteTable("post_revisions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  snapshot: text("snapshot").notNull(),
  changedBy: integer("changed_by").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditEvents = sqliteTable("audit_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorId: integer("actor_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  details: text("details").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const securityRateLimits = sqliteTable("security_rate_limits", {
  key: text("key").primaryKey(),
  windowStartedAt: text("window_started_at").notNull(),
  count: integer("count").notNull().default(0),
  blockedUntil: text("blocked_until"),
});

export const publicInquiries = sqliteTable("public_inquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull().default("get-involved"),
  kind: text("kind").notNull().default("contact"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  organisation: text("organisation").notNull().default(""),
  location: text("location").notNull().default(""),
  message: text("message").notNull(),
  consent: integer("consent", { mode: "boolean" }).notNull().default(false),
  followUpRequired: integer("follow_up_required", { mode: "boolean" })
    .notNull()
    .default(true),
  assignedTo: text("assigned_to").notNull().default(""),
  followUpBy: text("follow_up_by"),
  status: text("status").notNull().default("new"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sitePages = sqliteTable("site_pages", {
  key: text("key").primaryKey(),
  eyebrow: text("eyebrow").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  statement: text("statement").notNull(),
  featuresJson: text("features_json").notNull().default("[]"),
  aboutJson: text("about_json").notNull().default("{}"),
  updatedBy: integer("updated_by").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const staffSessions = sqliteTable("staff_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => staffUsers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const siteHomeSettings = sqliteTable("site_home_settings", {
  id: integer("id").primaryKey(),
  announcement: text("announcement").notNull(),
  eyebrow: text("eyebrow").notNull(),
  title: text("title").notNull(),
  intro: text("intro").notNull(),
  heroImageUrl: text("hero_image_url").notNull().default("/pdf-hero-civilian.png"),
  heroImageAlt: text("hero_image_alt").notNull().default("Civilians packing relief supplies together in a community hall."),
  helpTitle: text("help_title").notNull(),
  helpIntro: text("help_intro").notNull(),
  pathwaysJson: text("pathways_json").notNull(),
  updatedBy: integer("updated_by").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const homeSettingsSchemaSql = `CREATE TABLE IF NOT EXISTS site_home_settings (
  id INTEGER PRIMARY KEY,
  announcement TEXT NOT NULL,
  eyebrow TEXT NOT NULL,
  title TEXT NOT NULL,
  intro TEXT NOT NULL,
  hero_image_url TEXT NOT NULL DEFAULT '/pdf-hero-civilian.png',
  hero_image_alt TEXT NOT NULL DEFAULT 'Civilians packing relief supplies together in a community hall.',
  help_title TEXT NOT NULL,
  help_intro TEXT NOT NULL,
  pathways_json TEXT NOT NULL,
  updated_by INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
