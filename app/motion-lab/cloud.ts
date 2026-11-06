import type { SessionMeta } from "@/lib/motion-lab/types";
import { finishMotionSave, prepareMotionSave, type MotionSaveInput } from "./actions";

export type CloudResult = { status: "ok" } | { status: "signin" } | { status: "error"; message: string };

async function put(url: string, blob: Blob) {
  const body = new FormData();
  body.append("cacheControl", "3600");
  body.append("", blob);                      // storage's signed-upload form: the file is the field with an empty name
  const res = await fetch(url, { method: "PUT", body, headers: { "x-upsert": "true" } });
  if (!res.ok) throw new Error(`The upload failed (${res.status}).`);
}

/** Uploads one session (measurements JSON and the recording) to the signed-in person's private storage. */
export async function cloudSave(meta: SessionMeta, json: string, video: Blob | null): Promise<CloudResult> {
  const samples = new Blob([json], { type: "application/json" });
  const input: MotionSaveInput = {
    clientId: meta.id, name: meta.name, source: meta.source, createdAt: meta.createdAt, videoWidth: meta.videoWidth, videoHeight: meta.videoHeight,
    summary: meta.summary, models: meta.models, samplesBytes: samples.size,
    videoBytes: video?.size ?? 0, videoType: video ? (video.type.split(";")[0] as MotionSaveInput["videoType"]) : null,
  };
  const prep = await prepareMotionSave(input);
  if (prep.status !== "ok") return prep;
  try {
    await put(prep.samples.url, samples);
    if (prep.video && video) await put(prep.video.url, video);
  } catch (e) { return { status: "error", message: (e as Error).message }; }
  const done = await finishMotionSave(prep.id);
  return done.ok ? { status: "ok" } : { status: "error", message: done.message ?? "The save could not be completed." };
}
