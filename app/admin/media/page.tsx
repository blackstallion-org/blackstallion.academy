import { Suspense } from "react";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/admin";
import { deleteMedia } from "../actions";
import { AdminNav } from "../AdminNav";
import { UploadForm } from "../forms";

export default function MediaPage() {
  return <Suspense fallback={<p role="status" className="text-sand">Loading images…</p>}><Media /></Suspense>;
}

async function Media() {
  await connection();
  const { supabase, profile } = await requireStaff();
  const { data, error } = await supabase.from("media_assets").select("id, storage_path, alt_text, mime_type, bytes, created_at").order("created_at", { ascending: false }).limit(60);
  const items = data ?? [];
  return (
    <div>
      <AdminNav name={profile.display_name} current="media" />
      <h1 className="t-voice mt-8 text-[clamp(1.8rem,4vw,3rem)] text-bone">Website images</h1>
      <p className="t-ui mt-2 max-w-2xl text-sm text-dust">Images uploaded here are public (website-assets bucket). Existing site photography and 3D models stay where they are.</p>
      <div className="mt-8"><UploadForm /></div>
      {error && <p role="alert" className="mt-4 text-blood">Images could not be loaded.</p>}
      <ul className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
        {items.map((m) => {
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
    </div>
  );
}
