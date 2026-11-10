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
import { LoadError, PageHeading } from "../ui";

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
      <PageHeading title="Website images">Images uploaded here are public (website-assets bucket). Existing site photography and 3D models stay where they are.</PageHeading>
      <div className="mt-8"><UploadForm /></div>
      {result.error && <LoadError>Images could not be loaded.</LoadError>}
      <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {images.map((m) => {
          const url = supabase.storage.from("website-assets").getPublicUrl(m.storage_path).data.publicUrl;
          return (
            <li key={m.id} className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] flex flex-col gap-2.5 group">
              <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of user-uploaded storage objects */}
              <img src={url} alt={m.alt_text} className="aspect-[4/3] w-full rounded-xl object-cover bg-black/40" loading="lazy" />
              <div className="relative z-10 px-1">
                <p className="text-xs font-medium text-white/80 line-clamp-1">{m.alt_text}</p>
                <p className="font-mono text-[10px] text-white/40 mt-0.5">{m.mime_type} · {Math.round(m.bytes / 1024)} KB</p>
                <form action={deleteMedia} className="mt-2">
                  <input type="hidden" name="id" value={m.id} />
                  <button className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors">Delete</button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="library-h" className="mt-20 border-t border-white/10 pt-12">
        <div className="flex items-center gap-2">
          <h2 id="library-h" className="text-xl sm:text-2xl font-bold tracking-tight text-white">Media library</h2>
          <span className="h-2 w-2 rounded-full bg-[#E8FF1F] shadow-[0_0_8px_#E8FF1F]" />
        </div>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Images, videos and 3D models up to 50 MB, kept in the public <span className="font-mono text-[#E8FF1F]">{LIBRARY_BUCKET}</span> bucket and shown on the{" "}
          <a href="/gallery" className="text-[#E8FF1F] underline decoration-white/20 underline-offset-4 hover:decoration-[#E8FF1F]">gallery page</a>. A file is checked by its real contents before it is shown.
        </p>
        {!libraryReady && (
          <p role="alert" className="mt-4 max-w-2xl text-sm text-red-400">
            The media library is not switched on yet: apply <span className="font-mono">supabase/live/migrations/20261029001300_bsah_media_library.sql</span> to the project first.
          </p>
        )}
        <div className="mt-8">
          <LibraryUploader url={config?.url ?? ""} publishableKey={config?.publishable ?? ""} ready={Boolean(config) && libraryReady} />
        </div>
        {libraryReady && library.length === 0 && <p className="mt-10 text-sm text-white/40">Nothing has been uploaded to the library yet.</p>}
        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {library.map((m) => {
            const url = config ? publicObjectUrl(config.url, LIBRARY_BUCKET, m.storage_path) : "";
            return (
              <li key={m.id} className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl shadow-xl flex flex-col gap-3 group">
                <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/50">
                  {m.mime_type.startsWith("video/") ? (
                    <video src={url} controls preload="metadata" playsInline className="h-full w-full object-contain" aria-label={m.alt_text} />
                  ) : m.mime_type === "model/gltf-binary" ? (
                    <div className="flex h-full w-full items-center justify-center border border-white/10 text-white/50"><span className="text-xs uppercase tracking-wider font-semibold">3D model · GLB</span></div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- admin preview of user-uploaded storage objects
                    <img src={url} alt={m.alt_text} className="h-full w-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="relative z-10 flex flex-col gap-1">
                  <p className="text-sm font-semibold text-white">{m.alt_text}</p>
                  <p className="font-mono text-xs text-white/45">{m.mime_type} · {size(m.bytes)}</p>
                  <p className="break-all font-mono text-[10px] text-white/40">{m.storage_path}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-white/70 hover:text-white transition-colors">Open</a>
                    <CopyLink url={url} />
                    <form action={deleteLibraryItem}>
                      <input type="hidden" name="id" value={m.id} />
                      <button className="text-xs font-semibold text-red-400 hover:text-red-300">Delete</button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </AdminShell>
  );
}
