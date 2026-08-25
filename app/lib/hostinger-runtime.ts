import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { createLocalDatabase } from "./local-sqlite";
import { createLocalMedia } from "./local-media";

type RuntimeValues = Record<string, unknown> & { DB?: D1Database; MEDIA?: R2Bucket };
type RuntimeGlobal = typeof globalThis & {
  __bccRuntime?: RuntimeValues;
  __bccSchemaReady?: Promise<void>;
};

const runtimeGlobal = globalThis as RuntimeGlobal;

function environment(): Record<string, string | undefined> {
  return typeof process === "undefined" ? {} : process.env;
}

const schema = [
  `CREATE TABLE IF NOT EXISTS staff_users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, email VARCHAR(254) NOT NULL UNIQUE,
    display_name VARCHAR(160) NOT NULL, role VARCHAR(32) NOT NULL DEFAULT 'editor',
    password_hash VARCHAR(255) NOT NULL, status VARCHAR(32) NOT NULL DEFAULT 'active',
    must_change_password TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS staff_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL,
    token_hash VARCHAR(128) NOT NULL UNIQUE, expires_at DATETIME(3) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX staff_sessions_user_expiry_idx (user_id, expires_at),
    CONSTRAINT staff_sessions_user_fk FOREIGN KEY (user_id) REFERENCES staff_users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS media (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, object_key VARCHAR(500) NOT NULL UNIQUE,
    filename VARCHAR(255) NOT NULL, content_type VARCHAR(120) NOT NULL, size BIGINT UNSIGNED NOT NULL,
    alt_text VARCHAR(500) NOT NULL DEFAULT '', uploaded_by VARCHAR(160) NOT NULL DEFAULT 'Community editor',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS media_objects (
    object_key VARCHAR(500) PRIMARY KEY, content_type VARCHAR(120) NOT NULL,
    content_disposition VARCHAR(500), cache_control VARCHAR(255), body LONGBLOB NOT NULL,
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS posts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(190) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL, excerpt TEXT NOT NULL, body LONGTEXT NOT NULL,
    category VARCHAR(80) NOT NULL DEFAULT 'Field notes', placement VARCHAR(80) NOT NULL DEFAULT 'stories',
    status VARCHAR(32) NOT NULL DEFAULT 'draft', channels TEXT NOT NULL,
    author VARCHAR(160) NOT NULL DEFAULT 'Community editor', media_id BIGINT UNSIGNED,
    scheduled_at DATETIME(3), published_at DATETIME(3),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX posts_status_updated_idx (status, updated_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS post_media (
    post_id BIGINT UNSIGNED NOT NULL, media_id BIGINT UNSIGNED NOT NULL, sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (post_id, media_id), INDEX post_media_post_idx (post_id, sort_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS post_revisions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, post_id BIGINT UNSIGNED NOT NULL,
    snapshot LONGTEXT NOT NULL, changed_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS public_inquiries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, source VARCHAR(80) NOT NULL DEFAULT 'get-involved',
    kind VARCHAR(80) NOT NULL DEFAULT 'contact', name VARCHAR(160) NOT NULL, email VARCHAR(254) NOT NULL,
    organisation VARCHAR(200) NOT NULL DEFAULT '', location VARCHAR(200) NOT NULL DEFAULT '', message TEXT NOT NULL,
    consent TINYINT(1) NOT NULL DEFAULT 0, follow_up_required TINYINT(1) NOT NULL DEFAULT 1,
    assigned_to VARCHAR(160) NOT NULL DEFAULT '', follow_up_by DATE, status VARCHAR(40) NOT NULL DEFAULT 'new',
    closed_by VARCHAR(160) NOT NULL DEFAULT '', closed_at DATETIME(3),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX public_inquiries_status_created_idx (status, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS mail_subscribers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(160) NOT NULL DEFAULT '',
    email VARCHAR(254) NOT NULL UNIQUE, status VARCHAR(40) NOT NULL DEFAULT 'active',
    source VARCHAR(80) NOT NULL DEFAULT 'website', consent TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX mail_subscribers_status_idx (status, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS community_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, event_date DATE NOT NULL,
    event_time VARCHAR(80) NOT NULL DEFAULT '', location VARCHAR(255) NOT NULL DEFAULT '',
    category VARCHAR(80) NOT NULL DEFAULT 'cultural', description TEXT NOT NULL,
    recurring TINYINT(1) NOT NULL DEFAULT 0, status VARCHAR(40) NOT NULL DEFAULT 'published',
    created_by BIGINT UNSIGNED, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    live_platform VARCHAR(20) NOT NULL DEFAULT 'none',
    live_url VARCHAR(500) NOT NULL DEFAULT '',
    live_on TINYINT(1) NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS site_pages (
    \`key\` VARCHAR(80) PRIMARY KEY, eyebrow VARCHAR(160) NOT NULL, title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL, statement TEXT NOT NULL, features_json LONGTEXT NOT NULL,
    about_json LONGTEXT NOT NULL, media_json LONGTEXT NULL, content_json LONGTEXT NULL,
    updated_by BIGINT UNSIGNED NOT NULL,
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS site_home_settings (
    id BIGINT UNSIGNED PRIMARY KEY, announcement VARCHAR(255) NOT NULL, eyebrow VARCHAR(160) NOT NULL,
    title VARCHAR(255) NOT NULL, intro TEXT NOT NULL,
    hero_image_url VARCHAR(1000) NOT NULL DEFAULT '/pdf-hero-civilian.png',
    hero_image_alt VARCHAR(500) NOT NULL DEFAULT 'Civilians packing relief supplies together in a community hall.',
    help_title VARCHAR(255) NOT NULL, help_intro TEXT NOT NULL, pathways_json LONGTEXT NOT NULL,
    telegram_json LONGTEXT NOT NULL,
    updated_by BIGINT UNSIGNED NOT NULL, updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS security_rate_limits (
    \`key\` VARCHAR(255) PRIMARY KEY, window_started_at DATETIME(3) NOT NULL,
    count INT NOT NULL DEFAULT 0, blocked_until DATETIME(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS audit_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, actor_id BIGINT UNSIGNED, action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL, entity_id VARCHAR(160), details LONGTEXT NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), INDEX audit_events_created_idx (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

function databaseConfig() {
  const env = environment();
  if (!env.DB_HOST || !env.DB_USER || env.DB_PASSWORD == null || !env.DB_NAME) return null;
  return {
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: 8,
    charset: "utf8mb4",
    dateStrings: true as const,
  };
}

const schemaMigrations = [
  "ALTER TABLE site_pages ADD COLUMN media_json LONGTEXT NULL",
  "ALTER TABLE site_pages ADD COLUMN content_json LONGTEXT NULL",
  "ALTER TABLE community_events ADD COLUMN live_platform VARCHAR(20) NOT NULL DEFAULT 'none'",
  "ALTER TABLE community_events ADD COLUMN live_url VARCHAR(500) NOT NULL DEFAULT ''",
  "ALTER TABLE community_events ADD COLUMN live_on TINYINT(1) NOT NULL DEFAULT 0",
  "ALTER TABLE site_home_settings ADD COLUMN telegram_json LONGTEXT NULL",
];

async function ensureSchema(pool: Pool) {
  runtimeGlobal.__bccSchemaReady ??= (async () => {
    for (const statement of schema) await pool.query(statement);
    for (const migration of schemaMigrations) {
      try {
        await pool.query(migration);
      } catch {
        // Column may already exist on upgraded databases.
      }
    }
  })();
  return runtimeGlobal.__bccSchemaReady;
}

function dbValue(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value)
    ? value.replace("T", " ").replace("Z", "")
    : value;
}

function translateSql(source: string) {
  return source
    .replace(/\bkey\b/gi, "`key`")
    .replace(/ON CONFLICT\s*\([^)]*\)\s*DO UPDATE SET/gi, "ON DUPLICATE KEY UPDATE")
    .replace(/excluded\.([a-z_]+)/gi, "VALUES($1)");
}

class MySqlStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private pool: Pool, private sql: string) {}
  bind(...values: unknown[]) { this.values = values.map(dbValue); return this; }

  private async execute(): Promise<{
    rows: Record<string, unknown>[];
    meta: Record<string, unknown>;
  }> {
    await ensureSchema(this.pool);
    const trimmed = this.sql.trim();
    if (/^(CREATE\s+(TABLE|INDEX)|ALTER\s+TABLE)/i.test(trimmed)) return { rows: [], meta: {} };
    const pragma = trimmed.match(/^PRAGMA\s+table_info\(([^)]+)\)/i);
    if (pragma) {
      const table = pragma[1].replace(/[^a-z0-9_]/gi, "");
      const [rows] = await this.pool.query<RowDataPacket[]>(`SHOW COLUMNS FROM \`${table}\``);
      return { rows: rows.map((row) => ({ name: row.Field })) as Record<string, unknown>[], meta: {} };
    }
    const returning = trimmed.match(/\s+RETURNING\s+[\s\S]+$/i);
    const query = translateSql(returning ? trimmed.slice(0, returning.index) : trimmed);
    const [result] = await this.pool.execute<RowDataPacket[] | ResultSetHeader>(query, this.values);
    if (Array.isArray(result)) return { rows: result as Record<string, unknown>[], meta: {} };
    let rows: Record<string, unknown>[] = [];
    if (returning) {
      const table = query.match(/^\s*(?:INSERT\s+INTO|UPDATE)\s+`?([a-z_]+)`?/i)?.[1];
      let id = Number(result.insertId || 0);
      if (!id && /\bWHERE\s+id\s*=\s*\?/i.test(query)) {
        id = Number(this.values.at(-1) || 0);
      }
      if (table && Number.isSafeInteger(id) && id > 0) {
        const [selected] = await this.pool.query<RowDataPacket[]>(
          `SELECT * FROM \`${table}\` WHERE id = ? LIMIT 1`,
          [id],
        );
        rows = selected as Record<string, unknown>[];
      }
    }
    return { rows, meta: { changes: result.affectedRows, last_row_id: result.insertId } };
  }
  async first<T = Record<string, unknown>>(column?: string) {
    const row = (await this.execute()).rows[0];
    if (!row) return null;
    return (column ? row[column] : row) as T;
  }
  async run<T = Record<string, unknown>>() {
    const result = await this.execute();
    return { results: result.rows as T[], success: true, meta: result.meta };
  }
  all<T = Record<string, unknown>>() { return this.run<T>(); }
  async raw<T = unknown[]>(options?: { columnNames?: boolean }) {
    const rows = (await this.execute()).rows;
    const data = rows.map((row) => Object.values(row));
    return (options?.columnNames && rows[0] ? [Object.keys(rows[0]), ...data] : data) as T[];
  }
}

class MySqlDatabase implements D1Database {
  constructor(private pool: Pool) {}
  prepare(sql: string) { return new MySqlStatement(this.pool, sql); }
  async batch<T = unknown>(statements: D1PreparedStatement[]) {
    const output: D1Result<T>[] = [];
    for (const statement of statements) output.push(await statement.run<T>());
    return output;
  }
  async exec(sql: string) { await ensureSchema(this.pool); await this.pool.query(translateSql(sql)); return { count: 1, duration: 0 }; }
  async dump(): Promise<ArrayBuffer> { throw new Error("Use Hostinger database backups for production exports"); }
}

async function toBuffer(value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob) {
  if (typeof value === "string") return Buffer.from(value);
  if (value instanceof Blob) return Buffer.from(await value.arrayBuffer());
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  return Buffer.from(await new Response(value).arrayBuffer());
}

class MySqlMedia implements R2Bucket {
  constructor(private pool: Pool) {}
  async put(key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob, options?: R2PutOptions) {
    await ensureSchema(this.pool);
    const body = await toBuffer(value);
    const metadata = options?.httpMetadata || {};
    await this.pool.execute(
      `INSERT INTO media_objects (object_key, content_type, content_disposition, cache_control, body)
       VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE content_type=VALUES(content_type),
       content_disposition=VALUES(content_disposition), cache_control=VALUES(cache_control), body=VALUES(body)`,
      [key, metadata.contentType || "application/octet-stream", metadata.contentDisposition || null, metadata.cacheControl || null, body],
    );
    return { key, size: body.length, etag: "mysql", httpMetadata: metadata };
  }
  async get(key: string) {
    await ensureSchema(this.pool);
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      "SELECT body, content_type, content_disposition, cache_control FROM media_objects WHERE object_key = ? LIMIT 1", [key],
    );
    const row = rows[0];
    if (!row) return null;
    const blob = new Blob([Buffer.from(row.body as Buffer)], { type: String(row.content_type) });
    const httpMetadata = {
      contentType: String(row.content_type),
      contentDisposition: row.content_disposition ? String(row.content_disposition) : undefined,
      cacheControl: row.cache_control ? String(row.cache_control) : undefined,
    };
    return { key, size: blob.size, etag: "mysql", httpMetadata, body: blob.stream(),
      arrayBuffer: () => blob.arrayBuffer(), text: () => blob.text(),
      json: async <T>() => JSON.parse(await blob.text()) as T, blob: async () => blob };
  }
  async delete(key: string | string[]) {
    await ensureSchema(this.pool);
    const keys = Array.isArray(key) ? key : [key];
    if (keys.length) await this.pool.query(`DELETE FROM media_objects WHERE object_key IN (${keys.map(() => "?").join(",")})`, keys);
  }
  async head(key: string) {
    const item = await this.get(key);
    return item ? { key: item.key, size: item.size, etag: item.etag, httpMetadata: item.httpMetadata } : null;
  }
  async list() { return { objects: [], truncated: false }; }
}

export function applicationRuntime(): RuntimeValues {
  if (runtimeGlobal.__bccRuntime) return runtimeGlobal.__bccRuntime;
  const env = environment();
  const config = databaseConfig();
  if (!config) {
    return (runtimeGlobal.__bccRuntime = {
      ...env,
      DB: createLocalDatabase() as unknown as D1Database,
      MEDIA: createLocalMedia() as unknown as R2Bucket,
    });
  }
  const pool = mysql.createPool(config);
  return (runtimeGlobal.__bccRuntime = { ...env, DB: new MySqlDatabase(pool), MEDIA: new MySqlMedia(pool) });
}
