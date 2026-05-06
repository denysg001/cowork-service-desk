import { createHash } from "node:crypto";

export function makeEtag(input: { updatedAt: Date; version: number }): string {
  const hash = createHash("sha256").update(`${input.updatedAt.toISOString()}:${input.version}`).digest("base64url");
  return `"${hash}"`;
}
