/**
 * Upload validation. The file's real type is detected from its first bytes (never trusted from the browser's
 * declared type or the file name); size and type are limited per bucket. Pure functions, unit-tested.
 */
export type BucketId = "website-assets" | "user-uploads" | "private-documents" | "bsah-media";
export type Detected = {
  mime: "image/png" | "image/jpeg" | "image/webp" | "image/avif" | "video/mp4" | "video/webm" | "model/gltf-binary" | "application/pdf";
  ext: "png" | "jpg" | "webp" | "avif" | "mp4" | "webm" | "glb" | "pdf";
};

/** Server actions on Vercel accept at most ~4.5 MB per request; keep a margin. */
export const MAX_ACTION_UPLOAD = 4 * 1024 * 1024;

export const BUCKET_RULES: Record<BucketId, { maxBytes: number; types: Detected["mime"][] }> = {
  "website-assets": { maxBytes: Math.min(8 * 1024 * 1024, MAX_ACTION_UPLOAD), types: ["image/png", "image/jpeg", "image/webp"] },
  "user-uploads": { maxBytes: Math.min(10 * 1024 * 1024, MAX_ACTION_UPLOAD), types: ["image/png", "image/jpeg", "image/webp", "application/pdf"] },
  "private-documents": { maxBytes: 20 * 1024 * 1024, types: ["application/pdf"] },
  // The media library (images, video, 3D models) is uploaded straight to Storage, not through a server action; see verifyLibraryObject.
  "bsah-media": { maxBytes: 50 * 1024 * 1024, types: ["image/png", "image/jpeg", "image/webp", "image/avif", "video/mp4", "video/webm", "model/gltf-binary"] },
};

export function detectType(bytes: Uint8Array): Detected | null {
  const b = bytes;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return { mime: "image/png", ext: "png" };
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return { mime: "image/webp", ext: "webp" };
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return { mime: "application/pdf", ext: "pdf" };
  // ISO base media ("ftyp" box): AVIF stills and MP4 video share it and differ by the major brand. QuickTime, HEIC and the rest are refused.
  if (b.length >= 12 && ascii(b, 4, 8) === "ftyp") {
    const brand = ascii(b, 8, 12);
    if (brand === "avif" || brand === "avis") return { mime: "image/avif", ext: "avif" };
    if (MP4_BRANDS.has(brand)) return { mime: "video/mp4", ext: "mp4" };
    return null;
  }
  // WebM is Matroska with the DocType "webm" near the start; a plain .mkv carries "matroska" there instead and is refused.
  if (b.length >= 16 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 && ascii(b, 0, Math.min(b.length, 64)).includes("webm")) return { mime: "video/webm", ext: "webm" };
  // GLB: "glTF", version 2, and the first chunk is the JSON chunk.
  if (b.length >= 20 && ascii(b, 0, 4) === "glTF" && (b[4] | (b[5] << 8) | (b[6] << 16) | (b[7] << 24)) === 2 && ascii(b, 16, 20) === "JSON") return { mime: "model/gltf-binary", ext: "glb" };
  return null;
}

function ascii(b: Uint8Array, from: number, to: number): string {
  let out = "";
  for (let i = from; i < to && i < b.length; i++) out += String.fromCharCode(b[i]);
  return out;
}

/** Major brands of MP4 files that browsers play. */
const MP4_BRANDS = new Set(["isom", "iso2", "iso4", "iso5", "iso6", "iso7", "iso8", "iso9", "mp41", "mp42", "avc1", "dash", "M4V "]);

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

/* ------------------------------------------------------------------------------------------------------------------
   Media library (bucket bsah-media): images, video and 3D models up to 50 MB, uploaded from the browser straight to Storage.
   The server checks the declared name and size before it issues an upload link, and the real bytes afterwards.
   ------------------------------------------------------------------------------------------------------------------ */
export type MediaKind = "image" | "video" | "model";

export const LIBRARY_MAX_BYTES = BUCKET_RULES["bsah-media"].maxBytes;

/** File extensions the library accepts, and the type each one must turn out to be. */
export const LIBRARY_EXTENSIONS: Readonly<Record<string, Detected["mime"]>> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", avif: "image/avif", mp4: "video/mp4", webm: "video/webm", glb: "model/gltf-binary",
};

export function kindOf(mime: string): MediaKind | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "model/gltf-binary") return "model";
  return null;
}

const KIND_FOLDER: Record<MediaKind, string> = { image: "images", video: "videos", model: "models" };

export type Declared = { ok: true; mime: Detected["mime"]; ext: Detected["ext"]; kind: MediaKind } | { ok: false; error: string };

/** What the browser says it is about to upload (name and size). The real type is checked again after the upload. */
export function checkDeclared(name: string, size: number): Declared {
  if (!Number.isFinite(size) || size <= 0) return { ok: false, error: "The file is empty." };
  if (size > LIBRARY_MAX_BYTES) return { ok: false, error: `The file is larger than ${LIBRARY_MAX_BYTES / 1048576} MB.` };
  const dot = name.lastIndexOf(".");
  const extension = dot < 0 ? "" : name.slice(dot + 1).toLowerCase();
  const mime = Object.hasOwn(LIBRARY_EXTENSIONS, extension) ? LIBRARY_EXTENSIONS[extension] : undefined;
  const kind = mime ? kindOf(mime) : null;
  if (!mime || !kind) return { ok: false, error: "Unsupported file type. Allowed: PNG, JPEG, WebP, AVIF, MP4, WebM and GLB." };
  return { ok: true, mime, kind, ext: (extension === "jpeg" ? "jpg" : extension) as Detected["ext"] };
}

/** Object path for a library file: <images|videos|models>/<yyyy>/<mm>/<uuid>.<ext>. */
export function libraryPath(kind: MediaKind, ext: string, now = new Date(), id = crypto.randomUUID()) {
  return objectPath(KIND_FOLDER[kind], ext, now, id);
}

/** Exactly the paths libraryPath makes; anything else is refused before it is looked at. */
export const LIBRARY_PATH = /^(images|videos|models)\/\d{4}\/\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|avif|mp4|webm|glb)$/;

export type Verified = { ok: true; type: Detected; kind: MediaKind } | { ok: false; error: string };

/**
 * After the upload: the first bytes of the stored object and its total size, against the path it was given. The file's
 * real type (from its bytes, never from its name or the browser) must be the one its extension and folder promise.
 */
export function verifyLibraryObject(path: string, head: Uint8Array, total: number): Verified {
  if (!LIBRARY_PATH.test(path)) return { ok: false, error: "That file is not one this library issued." };
  if (!Number.isFinite(total) || total <= 0) return { ok: false, error: "The uploaded file is empty." };
  if (total > LIBRARY_MAX_BYTES) return { ok: false, error: `The file is larger than ${LIBRARY_MAX_BYTES / 1048576} MB.` };
  const type = detectType(head);
  if (!type || !BUCKET_RULES["bsah-media"].types.includes(type.mime)) return { ok: false, error: "The file is not a supported image, video or 3D model." };
  const kind = kindOf(type.mime);
  const extension = path.slice(path.lastIndexOf(".") + 1);
  if (!kind || path.split("/")[0] !== KIND_FOLDER[kind] || extension !== type.ext) return { ok: false, error: "The file's contents do not match its name." };
  return { ok: true, type, kind };
}
