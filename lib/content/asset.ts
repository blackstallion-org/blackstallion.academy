import { assetUrl, parseMediaBase } from "./media-base.mjs";

/**
 * The address media is loaded from: "" (this site's own public/ folder, the default) or the public Supabase Storage
 * bucket `website-media`, which mirrors /images, /media, /models, /video and /audio path for path.
 *
 * Set NEXT_PUBLIC_MEDIA_BASE_URL (build-time, so a redeploy is needed) to switch the whole site over; remove it and
 * redeploy to go back. The files stay in public/ as the fallback. See docs/MEDIA_HOSTING.md.
 */
export const MEDIA_BASE: string = parseMediaBase(process.env.NEXT_PUBLIC_MEDIA_BASE_URL);

/** True when media comes from the remote base instead of this site. */
export const MEDIA_REMOTE: boolean = MEDIA_BASE !== "";

/**
 * Wrap every site path to a still, model, video or audio file: asset("/models/horse-hand-draco.glb").
 * Paths outside those folders and absolute URLs pass through unchanged. Remote media is cross-origin: code that reads
 * pixels back or uploads a texture to WebGL must set crossOrigin = "anonymous" (the bucket answers with CORS headers).
 */
export const asset = (path: string): string => assetUrl(MEDIA_BASE, path);

/**
 * "anonymous" for a file that comes from the media base, otherwise undefined. Set it as `img.crossOrigin` before `img.src`
 * when the code reads pixels back (getImageData) or loads the file as a WebGL texture; files from other hosts are left as
 * they were because those hosts may not send CORS headers.
 */
export const mediaCrossOrigin = (url: string): "anonymous" | undefined =>
  MEDIA_REMOTE && url.startsWith(`${MEDIA_BASE}/`) ? "anonymous" : undefined;
