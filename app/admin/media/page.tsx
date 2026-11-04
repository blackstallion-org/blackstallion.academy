import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/admin";
import { logAdminError } from "@/lib/admin/server";
import { LIBRARY_BUCKET, publicObjectUrl } from "@/lib/storage/library";
import { supabaseConfig } from "@/lib/supabase/rest";
import { deleteMedia } from "../actions";
import { deleteLibraryItem } from "../library-actions";
import { AdminShell } from "../AdminShell";
import { UploadForm } from "../forms";
import { CopyLink, LibraryUploader } from "../LibraryUploader";

type MediaRow = { id: string; storage_path: string; alt_text: string; mime_type: string; bytes: number; created_at: string; bucket?: string };

const size = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);

export default async function MediaPage() {
  await connection();
  const { supabase, profile } = await requireStaff();
  const config = supabaseConfig();
  // The bucket column arrives with the bsah-media migration (supabase/live/migrations/20261029001300_bsah_media_library.sql).
  // Until it is applied, ask for the columns this page always had, so the page keeps working and says what is missing.
  let libraryReady = true;
  let result = await supabase.from("media_assets").select("id, storage_path, alt_text, mime_type, bytes, created_at, bucket").order("created_at", { ascending: false }).limit(120);
  if (result.error?.code === "42703") {
    libraryReady = false;
    result = (await supabase.from("media_assets").select("id, storage_path, alt_text, mime_type, bytes, created_at").order("created_at", { ascending: false }).limit(60)) as unknown as typeof result;
  }
  if (result.error) logAdminError("admin.media_load_failed", result.error);
  const rows = (result.data ?? []) as unknown as MediaRow[];
  const images = rows.filter((m) => m.bucket !== LIBRARY_BUCKET);
  const library = rows.filter((m) => m.bucket === LIBRARY_BUCKET);
  return (
    <AdminShell name={profile.display_name} current="media">
      <h1 className="t-voice mt-8 text-[clamp(1.8rem,4vw,3rem)] text-bone">Website images</h1>
      <p className="t-ui mt-2 max-w-2xl text-sm text-dust">Images uploaded here are public (website-assets bucket). Existing site photography and 3D models stay where they are.</p>
      <div className="mt-8"><UploadForm /></div>
      {result.error && <p role="alert" className="mt-4 text-blood">Images could not be loaded.</p>}
      <ul className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
        {images.map((m) => {
          const url = supabase.storage.from("website-assets").getPublicUrl(m.storage_path).data.publicUrl;
          return (
            <li key={m.id} className="flex flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of user-uploaded storage objects */}
              <img src={url} alt={m.alt_text} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <p className="t-ui text-xs text-sand">{m.alt_text}</p>
              <p className="font-mono text-[0.65rem] text-dust">{m.mime_type} · {Math.round(m.bytes / 1024)} KB</p>
              <form action={deleteMedia}><input type="hidden" name="id" value={m.id} /><button className="label text-blood hover:text-bone">Delete</button></form>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="library-h" className="mt-20 border-t border-line/50 pt-12">
        <h2 id="library-h" className="t-voice text-[clamp(1.5rem,3vw,2.2rem)] text-bone">Media library</h2>
        <p className="t-ui mt-2 max-w-2xl text-sm text-dust">
          Images, videos and 3D models up to 50 MB, kept in the public <span className="font-mono">{LIBRARY_BUCKET}</span> bucket and shown on the{" "}
          <a href="/gallery" className="underline hover:text-bone">gallery page</a>. A file is checked by its real contents before it is shown.
        </p>
        {!libraryReady && (
          <p role="alert" className="mt-4 max-w-2xl text-sm text-blood">
            The media library is not switched on yet: apply <span className="font-mono">supabase/live/migrations/20261029001300_bsah_media_library.sql</span> to the project first.
          </p>
        )}
        <div className="mt-8">
          <LibraryUploader url={config?.url ?? ""} publishableKey={config?.publishable ?? ""} ready={Boolean(config) && libraryReady} />
        </div>
        {libraryReady && library.length === 0 && <p className="t-ui mt-10 text-sm text-dust">Nothing has been uploaded to the library yet.</p>}
        <ul className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {library.map((m) => {
            const url = config ? publicObjectUrl(config.url, LIBRARY_BUCKET, m.storage_path) : "";
            return (
              <li key={m.id} className="flex min-w-0 flex-col gap-2">
                {m.mime_type.startsWith("video/") ? (
                  <video src={url} controls preload="metadata" playsInline className="aspect-video w-full bg-night object-contain" aria-label={m.alt_text} />
                ) : m.mime_type === "model/gltf-binary" ? (
                  <div className="flex aspect-video w-full items-center justify-center border border-line/50 text-dust"><span className="label">3D model · GLB</span></div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- admin preview of user-uploaded storage objects
                  <img src={url} alt={m.alt_text} className="aspect-video w-full object-cover" loading="lazy" />
                )}
                <p className="t-ui text-xs text-sand">{m.alt_text}</p>
                <p className="font-mono text-[0.65rem] text-dust">{m.mime_type} · {size(m.bytes)}</p>
                <p className="break-all font-mono text-[0.6rem] text-dust">{m.storage_path}</p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="label text-dust hover:text-bone">Open</a>
                  <CopyLink url={url} />
                  <form action={deleteLibraryItem}><input type="hidden" name="id" value={m.id} /><button className="label text-blood hover:text-bone">Delete</button></form>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </AdminShell>
  );
}
