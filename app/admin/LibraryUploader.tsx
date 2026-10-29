"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { LIBRARY_BUCKET } from "@/lib/storage/library";
import { LIBRARY_MAX_BYTES } from "@/lib/storage/validate";
import { prepareLibraryUpload, recordLibraryUpload } from "./library-actions";

const field = "field w-full";
const ACCEPT = ".png,.jpg,.jpeg,.webp,.avif,.mp4,.webm,.glb";

type Status = { kind: "idle" } | { kind: "working"; step: string } | { kind: "error"; message: string } | { kind: "done"; message: string };

/**
 * Media library upload (staff). The file goes from this page straight to Supabase Storage on a one-time link issued by the server
 * (videos and 3D models are too big for a server action). The publishable key is public by design; the link, not the key, is
 * what authorises the upload, and the server re-checks the stored file before it is shown on the site.
 */
export function LibraryUploader({ url, publishableKey, ready }: { url: string; publishableKey: string; ready: boolean }) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const busy = status.kind === "working";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const file = data.get("file");
    const alt = String(data.get("alt") ?? "");
    if (!(file instanceof File) || !file.size) return setStatus({ kind: "error", message: "Choose a file." });
    if (file.size > LIBRARY_MAX_BYTES) return setStatus({ kind: "error", message: `The file is larger than ${LIBRARY_MAX_BYTES / 1048576} MB.` });
    try {
      setStatus({ kind: "working", step: "Checking the file…" });
      const prepared = await prepareLibraryUpload({ name: file.name, size: file.size });
      if (!prepared.ok) return setStatus({ kind: "error", message: prepared.error });
      setStatus({ kind: "working", step: `Uploading ${(file.size / 1048576).toFixed(1)} MB…` });
      const storage = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } }).storage.from(LIBRARY_BUCKET);
      const sent = await storage.uploadToSignedUrl(prepared.path, prepared.token, file, { contentType: prepared.mime });
      if (sent.error) return setStatus({ kind: "error", message: "Upload failed. Nothing was saved." });
      setStatus({ kind: "working", step: "Checking what was stored…" });
      const recorded = await recordLibraryUpload({ path: prepared.path, alt });
      if (!recorded.ok) return setStatus({ kind: "error", message: recorded.error });
      form.current?.reset();
      setStatus({ kind: "done", message: recorded.notice });
      router.refresh();
    } catch {
      setStatus({ kind: "error", message: "Upload failed. Nothing was saved." });
    }
  }

  return (
    <form ref={form} onSubmit={submit} className="grid max-w-xl gap-5" aria-busy={busy}>
      <label className="flex min-w-0 flex-col gap-1">
        <span className="label text-dust">Image, video or 3D model (PNG, JPEG, WebP, AVIF, MP4, WebM or GLB, up to 50 MB)</span>
        <input className="t-ui w-full min-w-0 text-sm text-sand" name="file" type="file" accept={ACCEPT} required disabled={!ready || busy} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="label text-dust">Description (alt text)</span>
        <input className={field} name="alt" required minLength={3} maxLength={300} placeholder="Describe what the file shows" disabled={!ready || busy} />
      </label>
      <div aria-live="polite">
        {status.kind === "working" && <p role="status" className="t-ui text-sm text-sand">{status.step}</p>}
        {status.kind === "error" && <p role="alert" className="t-ui text-sm text-blood">{status.message}</p>}
        {status.kind === "done" && <p role="status" className="t-ui text-sm text-sand">{status.message}</p>}
      </div>
      <button disabled={!ready || busy} className="label justify-self-start bg-gold px-6 py-4 text-night hover:bg-bone disabled:opacity-60">{busy ? "Uploading…" : "Upload to the library"}</button>
    </form>
  );
}

/** Copies a file's public address. */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="label text-left text-dust hover:text-bone"
      onClick={() => { void navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {}); }}
    >
      {copied ? "Link copied" : "Copy link"}
    </button>
  );
}
