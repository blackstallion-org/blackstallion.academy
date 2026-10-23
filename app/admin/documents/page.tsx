import { Suspense } from "react";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/admin";
import { AdminNav } from "../AdminNav";

export default function DocumentsPage() {
  return <Suspense fallback={<p role="status" className="text-sand">Loading documents…</p>}><Documents /></Suspense>;
}

async function Documents() {
  await connection();
  const { supabase, profile } = await requireStaff();
  const { data, error } = await supabase.from("generated_documents").select("id, kind, title, storage_path, lead_reference, created_at").order("created_at", { ascending: false }).limit(100);
  const docs = data ?? [];
  // Short-lived signed links, minted per request for the signed-in staff member (bucket is private).
  const links = docs.length
    ? (await supabase.storage.from("private-documents").createSignedUrls(docs.map((d) => d.storage_path), 300)).data ?? []
    : [];
  return (
    <div>
      <AdminNav name={profile.display_name} current="documents" />
      <h1 className="t-voice mt-8 text-[clamp(1.8rem,4vw,3rem)] text-bone">Documents</h1>
      <p className="t-ui mt-2 text-sm text-dust">Draft MOUs generated from requests. Download links expire after five minutes.</p>
      {error && <p role="alert" className="mt-4 text-blood">Documents could not be loaded.</p>}
      {!error && !docs.length && <p className="t-ui mt-6 text-sand">No documents yet.</p>}
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {docs.map((d, i) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div><p className="t-ui text-bone">{d.title}</p><p className="font-mono text-[0.7rem] text-dust">{d.kind} · {new Date(d.created_at).toLocaleDateString("en-IN")}</p></div>
            {links[i]?.signedUrl ? <a href={links[i].signedUrl} className="label text-gold hover:text-bone">Download PDF</a> : <span className="label text-dust">Unavailable</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
