/**
 * Upload validation. The file's real type is detected from its first bytes (never trusted from the browser's
 * declared type or the file name); size and type are limited per bucket. Pure functions, unit-tested.
 */
export type BucketId = "website-assets" | "user-uploads" | "private-documents";
export type Detected = { mime: "image/png" | "image/jpeg" | "image/webp" | "application/pdf"; ext: "png" | "jpg" | "webp" | "pdf" };

/** Server actions on Vercel accept at most ~4.5 MB per request; keep a margin. */
export const MAX_ACTION_UPLOAD = 4 * 1024 * 1024;

export const BUCKET_RULES: Record<BucketId, { maxBytes: number; types: Detected["mime"][] }> = {
  "website-assets": { maxBytes: Math.min(8 * 1024 * 1024, MAX_ACTION_UPLOAD), types: ["image/png", "image/jpeg", "image/webp"] },
  "user-uploads": { maxBytes: Math.min(10 * 1024 * 1024, MAX_ACTION_UPLOAD), types: ["image/png", "image/jpeg", "image/webp", "application/pdf"] },
  "private-documents": { maxBytes: 20 * 1024 * 1024, types: ["application/pdf"] },
};

export function detectType(bytes: Uint8Array): Detected | null {
  const b = bytes;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return { mime: "image/png", ext: "png" };
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return { mime: "image/webp", ext: "webp" };
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return { mime: "application/pdf", ext: "pdf" };
  return null;
}

export type Validation = { ok: true; type: Detected } | { ok: false; error: string };

export function validateUpload(bytes: Uint8Array, bucket: BucketId): Validation {
  const rule = BUCKET_RULES[bucket];
  if (!bytes.length) return { ok: false, error: "The file is empty." };
  if (bytes.length > rule.maxBytes) return { ok: false, error: `The file is larger than ${Math.round(rule.maxBytes / 1048576)} MB.` };
  const type = detectType(bytes);
  if (!type || !rule.types.includes(type.mime)) return { ok: false, error: `Unsupported file type. Allowed: ${rule.types.map((t) => t.split("/")[1].toUpperCase()).join(", ")}.` };
  return { ok: true, type };
}

/** Unique, unguessable, safe object path: <prefix>/<yyyy>/<mm>/<uuid>.<ext> (lowercase, no user input). */
export function objectPath(prefix: string, ext: string, now = new Date(), id = crypto.randomUUID()) {
  const safePrefix = prefix.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || "files";
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${safePrefix}/${y}/${m}/${id.toLowerCase()}.${ext.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
}
