"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { logAdminError } from "@/lib/admin/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Saving a Motion Lab session to the signed-in person's account. The browser keeps the data first; this only runs when they press
 * "Save to account". The row, and the two files (measurements JSON, recording), are private to the owner: Row Level Security and
 * the storage policies in supabase/live/migrations/20261106001700_motion_lab.sql key everything on auth.uid(). The files go
 * straight from the browser to storage through one-time signed upload URLs, so large recordings never pass through a serverless function.
 */
const MAX_SAMPLES_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;          // the Free plan's per-file ceiling
const VIDEO_TYPES = ["video/webm", "video/mp4", "video/quicktime"] as const;

const Summary = z.object({ durationMs: z.number().min(0).max(4 * 3600_000) }).passthrough();
const Input = z.object({
  clientId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  source: z.enum(["camera", "upload"]),
  createdAt: z.string().datetime(),
  videoWidth: z.number().int().min(0).max(16384),
  videoHeight: z.number().int().min(0).max(16384),
  summary: Summary,
  models: z.object({ detector: z.string().max(120), pose: z.string().max(120), runtime: z.string().max(60), accelerator: z.string().max(20) }),
  samplesBytes: z.number().int().min(1).max(MAX_SAMPLES_BYTES),
  videoBytes: z.number().int().min(0).max(MAX_VIDEO_BYTES),
  videoType: z.enum(VIDEO_TYPES).nullable(),
});

export type MotionSaveInput = z.input<typeof Input>;
export type PrepareResult =
  | { status: "signin" }
  | { status: "error"; message: string }
  | { status: "ok"; id: string; samples: { url: string }; video: { url: string } | null };

const EXT: Record<string, string> = { "video/webm": "webm", "video/mp4": "mp4", "video/quicktime": "mov" };

export async function prepareMotionSave(raw: MotionSaveInput): Promise<PrepareResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Saving to an account is not switched on yet." };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: "signin" };
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim().slice(0, 64);
  if (!(await consumeRateLimit("document", `${auth.user.id}:${ip}`)).allowed) return { status: "error", message: "Too many saves just now. Please wait a few minutes." };
  const parsed = Input.safeParse(raw);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ? `That session could not be saved (${parsed.error.issues[0].path.join(".") || "data"} is not valid).` : "That session could not be saved." };
  const v = parsed.data;
  if (raw.videoBytes > MAX_VIDEO_BYTES) return { status: "error", message: "The recording is larger than 50 MB, the most the account can hold. Export it instead." };

  const base = `${auth.user.id}/${v.clientId}`;
  const samplesPath = `${base}/samples.json`;
  const videoPath = v.videoType && v.videoBytes > 0 ? `${base}/recording.${EXT[v.videoType]}` : null;
  const { data: row, error } = await supabase.from("motion_sessions").upsert({
    owner_id: auth.user.id, client_id: v.clientId, name: v.name, source: v.source, recorded_at: v.createdAt,
    duration_ms: Math.round(v.summary.durationMs), video_width: v.videoWidth, video_height: v.videoHeight,
    summary: v.summary, models: v.models, samples_path: samplesPath, video_path: videoPath, video_bytes: v.videoBytes, status: "uploading",
  }, { onConflict: "owner_id,client_id" }).select("id").single();
  if (error || !row) { logAdminError("motion.save_row_failed", error); return { status: "error", message: "The session could not be recorded in your account. Please try again." }; }

  const bucket = supabase.storage.from("motion-lab");
  const s = await bucket.createSignedUploadUrl(samplesPath, { upsert: true });
  if (s.error || !s.data) { logAdminError("motion.sign_samples_failed", s.error); return { status: "error", message: "The upload could not be prepared. Please try again." }; }
  let video: { url: string } | null = null;
  if (videoPath) {
    const r = await bucket.createSignedUploadUrl(videoPath, { upsert: true });
    if (r.error || !r.data) { logAdminError("motion.sign_video_failed", r.error); return { status: "error", message: "The upload could not be prepared. Please try again." }; }
    video = { url: r.data.signedUrl };
  }
  return { status: "ok", id: row.id as string, samples: { url: s.data.signedUrl }, video };
}

/** Marks the row complete after the browser has uploaded the files (checks that they are really there). */
export async function finishMotionSave(id: string): Promise<{ ok: boolean; message?: string }> {
  const parsed = z.string().uuid().safeParse(id);
  const supabase = await createSupabaseServerClient();
  if (!parsed.success || !supabase) return { ok: false, message: "Not available." };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "Sign in first." };
  const { data: row } = await supabase.from("motion_sessions").select("samples_path, video_path").eq("id", parsed.data).maybeSingle();
  if (!row) return { ok: false, message: "That saved session was not found." };
  const bucket = supabase.storage.from("motion-lab");
  for (const p of [row.samples_path, row.video_path].filter((x): x is string => !!x)) {
    const dir = p.slice(0, p.lastIndexOf("/")), file = p.slice(p.lastIndexOf("/") + 1);
    const { data } = await bucket.list(dir, { search: file, limit: 5 });
    if (!data?.some((o) => o.name === file)) return { ok: false, message: "An upload did not arrive. Please try saving again." };
  }
  const { error } = await supabase.from("motion_sessions").update({ status: "complete" }).eq("id", parsed.data);
  if (error) { logAdminError("motion.finish_failed", error); return { ok: false, message: "The session could not be completed. Please try again." }; }
  return { ok: true };
}
