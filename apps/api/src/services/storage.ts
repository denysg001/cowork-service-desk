import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { env } from "../config/env.js";
import { badRequest } from "../utils/errors.js";

const allowed = new Map([
  ["image/png", [".png"]],
  ["image/jpeg", [".jpg", ".jpeg"]],
  ["application/pdf", [".pdf"]]
]);

export type StoredFile = { key: string; mime: string; sizeBytes: number; checksum: string };

export interface StorageProvider {
  put(input: { filename: string; buffer: Buffer }): Promise<StoredFile>;
}

export class LocalStorageProvider implements StorageProvider {
  async put(input: { filename: string; buffer: Buffer }) {
    const checked = await validateUpload(input.filename, input.buffer);
    await mkdir(env.UPLOAD_DIR, { recursive: true });
    const key = `${Date.now()}-${checked.checksum}${path.extname(input.filename).toLowerCase()}`;
    await writeFile(path.join(env.UPLOAD_DIR, key), input.buffer, { flag: "wx" });
    return { key, ...checked };
  }
}

export class S3StorageProvider implements StorageProvider {
  private readonly client = new S3Client({
    ...optional("region", env.S3_REGION),
    ...optional("endpoint", env.S3_ENDPOINT),
    requestHandler: new NodeHttpHandler({ requestTimeout: env.S3_TIMEOUT_MS }),
    ...(env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
      ? { credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY } }
      : {})
  });

  async put(input: { filename: string; buffer: Buffer }) {
    const checked = await validateUpload(input.filename, input.buffer);
    const key = `${Date.now()}-${checked.checksum}${path.extname(input.filename).toLowerCase()}`;
    await this.client.send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, Body: input.buffer, ContentType: checked.mime }));
    return { key, ...checked };
  }
}

function optional<T extends string>(key: T, value: string | undefined): Record<T, string> | Record<string, never> {
  return value ? { [key]: value } as Record<T, string> : {};
}

export function storageProvider(): StorageProvider {
  return env.STORAGE_PROVIDER === "s3" ? new S3StorageProvider() : new LocalStorageProvider();
}

async function validateUpload(filename: string, buffer: Buffer) {
  const base = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
  if (base !== filename || filename.includes("..")) throw badRequest("Invalid filename");
  if (buffer.byteLength > 10 * 1024 * 1024) throw badRequest("File too large");
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !allowed.has(detected.mime)) throw badRequest("Unsupported file type");
  const ext = path.extname(filename).toLowerCase();
  if (!allowed.get(detected.mime)!.includes(ext)) throw badRequest("File extension does not match MIME");
  return { mime: detected.mime, sizeBytes: buffer.byteLength, checksum: createHash("sha256").update(buffer).digest("hex") };
}
