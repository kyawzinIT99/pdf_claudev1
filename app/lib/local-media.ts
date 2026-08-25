import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

function mediaRoot() {
  return join(process.cwd(), ".data", "media");
}

function fileFor(key: string) {
  const safe = key.replace(/[^a-zA-Z0-9._/-]+/g, "-").replace(/^\//, "");
  return join(mediaRoot(), safe);
}

async function toBuffer(value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob | Uint8Array) {
  if (typeof value === "string") return Buffer.from(value);
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (value instanceof Blob) return Buffer.from(await value.arrayBuffer());
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  return Buffer.from(await new Response(value).arrayBuffer());
}

export class LocalFileMedia implements R2Bucket {
  constructor(private root = mediaRoot()) {
    mkdirSync(this.root, { recursive: true });
  }

  async put(key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob | Uint8Array, options?: R2PutOptions) {
    const path = fileFor(key);
    mkdirSync(dirname(path), { recursive: true });
    const body = await toBuffer(value);
    writeFileSync(path, body);
    const metadata = options?.httpMetadata || {};
    writeFileSync(`${path}.meta.json`, JSON.stringify(metadata));
    return { key, size: body.length, etag: "local", httpMetadata: metadata };
  }

  async get(key: string) {
    const path = fileFor(key);
    if (!existsSync(path)) return null;
    const body = readFileSync(path);
    const metaPath = `${path}.meta.json`;
    const httpMetadata = existsSync(metaPath)
      ? (JSON.parse(readFileSync(metaPath, "utf8")) as Record<string, string>)
      : { contentType: "application/octet-stream" };
    const type = httpMetadata.contentType || "application/octet-stream";
    const blob = new Blob([body], { type });
    return {
      key,
      size: blob.size,
      etag: "local",
      httpMetadata,
      body: blob.stream(),
      arrayBuffer: () => blob.arrayBuffer(),
      text: () => blob.text(),
      json: async <T>() => JSON.parse(await blob.text()) as T,
      blob: async () => blob,
    };
  }

  async delete(key: string | string[]) {
    for (const item of Array.isArray(key) ? key : [key]) {
      const path = fileFor(item);
      if (existsSync(path)) unlinkSync(path);
      if (existsSync(`${path}.meta.json`)) unlinkSync(`${path}.meta.json`);
    }
  }

  async head(key: string) {
    const item = await this.get(key);
    return item
      ? { key: item.key, size: item.size, etag: item.etag, httpMetadata: item.httpMetadata }
      : null;
  }

  async list() {
    return { objects: [], truncated: false };
  }
}

export function createLocalMedia() {
  return new LocalFileMedia();
}
