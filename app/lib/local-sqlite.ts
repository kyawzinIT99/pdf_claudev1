import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync, type SQLInputValue, type StatementSync } from "node:sqlite";

function sqlitePath() {
  const custom = process.env.LOCAL_SQLITE_PATH?.trim();
  if (custom) return custom;
  return join(process.cwd(), ".data", "pdf-local.sqlite");
}

class SqliteStatement implements D1PreparedStatement {
  private values: SQLInputValue[] = [];

  constructor(
    private db: DatabaseSync,
    private sql: string,
  ) {}

  bind(...values: unknown[]) {
    this.values = values as SQLInputValue[];
    return this;
  }

  private statement(): StatementSync {
    return this.db.prepare(this.sql);
  }

  private rows(): Record<string, unknown>[] {
    const stmt = this.statement();
    const trimmed = this.sql.trim();
    if (/^(CREATE|ALTER|DROP|CREATE\s+INDEX)/i.test(trimmed) || /^\s*(INSERT|UPDATE|DELETE)/i.test(trimmed) && !/\bRETURNING\b/i.test(trimmed)) {
      if (this.values.length) stmt.run(...this.values);
      else stmt.run();
      return [];
    }
    const result = this.values.length ? stmt.all(...this.values) : stmt.all();
    return (result as Record<string, unknown>[]) || [];
  }

  async first<T = Record<string, unknown>>(column?: string) {
    const stmt = this.statement();
    const row = (
      this.values.length ? stmt.get(...this.values) : stmt.get()
    ) as Record<string, unknown> | undefined;
    if (!row) return null;
    return (column ? row[column] : row) as T;
  }

  async run<T = Record<string, unknown>>() {
    const stmt = this.statement();
    const trimmed = this.sql.trim();
    if (/\bRETURNING\b/i.test(trimmed) || /^\s*SELECT\b/i.test(trimmed) || /^\s*PRAGMA\b/i.test(trimmed)) {
      const results = (this.values.length ? stmt.all(...this.values) : stmt.all()) as T[];
      return { results, success: true, meta: { changes: results.length } };
    }
    const info = this.values.length ? stmt.run(...this.values) : stmt.run();
    return {
      results: [] as T[],
      success: true,
      meta: {
        changes: Number(info.changes || 0),
        last_row_id: Number(info.lastInsertRowid || 0),
      },
    };
  }

  all<T = Record<string, unknown>>() {
    return this.run<T>();
  }

  async raw<T = unknown[]>() {
    const rows = (await this.run()).results as Record<string, unknown>[];
    return rows.map((row) => Object.values(row)) as T[];
  }
}

export class LocalSqliteDatabase implements D1Database {
  private db: DatabaseSync;

  constructor(filePath = sqlitePath()) {
    mkdirSync(dirname(filePath), { recursive: true });
    this.db = new DatabaseSync(filePath);
  }

  prepare(sql: string) {
    return new SqliteStatement(this.db, sql);
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]) {
    const output: D1Result<T>[] = [];
    for (const statement of statements) output.push(await statement.run<T>());
    return output;
  }

  async exec(sql: string) {
    this.db.exec(sql);
    return { count: 1, duration: 0 };
  }

  async dump(): Promise<ArrayBuffer> {
    throw new Error("Local SQLite dump is not used in development");
  }
}

export function createLocalDatabase() {
  return new LocalSqliteDatabase();
}
