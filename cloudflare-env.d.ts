declare module "cloudflare:workers" {
  const env: Record<string, unknown>;
  export { env };
}

// Cloudflare D1 bindings
interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  exec(sql: string): Promise<D1ExecResult>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  dump(): Promise<ArrayBuffer>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  raw<T = unknown[]>(options?: { columnNames?: boolean }): Promise<T[]>;
}

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

interface D1ExecResult {
  count: number;
  duration: number;
}

// Cloudflare R2 bindings
interface R2Bucket {
  put(key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob, options?: R2PutOptions): Promise<R2Object>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string | string[]): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
  head(key: string): Promise<R2Object | null>;
}

interface R2PutOptions {
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
}

interface R2HTTPMetadata {
  contentType?: string;
  contentDisposition?: string;
  cacheControl?: string;
}

interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
}

interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
  blob(): Promise<Blob>;
}

interface R2ListOptions {
  prefix?: string;
  cursor?: string;
  limit?: number;
  delimiter?: string;
}

interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
}
