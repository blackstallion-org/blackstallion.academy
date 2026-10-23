import Link from "next/link";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/admin";
import { REFERENCE_PATTERN } from "@/lib/admin/constants";
import { formatDateTimeIST, type LeadLink } from "@/lib/admin/present";
import { logAdminError, signDocumentPaths } from "@/lib/admin/server";
import { AdminNav } from "../AdminNav";

type DocRow = { id: string; kind: string; title: string; storage_path: string; lead_reference: string | null; created_at: string };

export default async function DocumentsPage() {
  await connection();
  const { supabase, profile } = await requireStaff();
  const { data, error } = await supabase.from("generated_documents").select("id, kind, title, storage_path, lead_reference, created_at").order("created_at", { ascending: false }).limit(100);
  if (error) logAdminError("admin.documents_load_failed", error);
  const docs = (data ?? []) as DocRow[];
  // Short-lived signed links, minted per request for the signed-in staff member (bucket is private), keyed by path.
  const { urls } = await signDocumentPaths(supabase, docs.map((d) => d.storage_path));
  // Each document's lead_reference is the enquiry's idempotency key: link back to that enquiry when it exists.
  const refs = [...new Set(docs.map((d) => d.lead_reference).filter((r): r is string => !!r && REFERENCE_PATTERN.test(r)))];
  const leadsRes = refs.length ? await supabase.from("onboarding_leads").select("id, idempotency_key, contact_name").in("idempotency_key", refs) : { data: [] as LeadLink[], error: null };
  if (leadsRes.error) logAdminError("admin.documents_lead_links_failed", leadsRes.error);
  const leadByRef = new Map(((leadsRes.data ?? []) as LeadLink[]).map((l) => [l.idempotency_key, l]));
  return (
    <div>
      <AdminNav name={profile.display_name} current="documents" />
      <h1 className="t-voice mt-8 text-[clamp(1.8rem,4vw,3rem)] text-bone">Documents</h1>
      <p className="t-ui mt-2 text-sm text-dust">Draft MOUs generated from requests. Download links expire after five minutes.</p>
      {error && <p role="alert" className="mt-4 text-blood">Documents could not be loaded.</p>}
      {!error && !docs.length && <p className="t-ui mt-6 text-sand">No documents yet.</p>}
      {leadsRes.error && <p role="alert" className="t-ui mt-4 text-sm text-blood">Links to the matching enquiries could not be loaded.</p>}
      {docs.length > 0 && <ul className="mt-8 divide-y divide-line border-y border-line">
        {docs.map((d) => {
          const url = urls.get(d.storage_path);
          const lead = d.lead_reference ? leadByRef.get(d.lead_reference) : undefined;
          return (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="t-ui break-words text-bone">{d.title}</p>
                <p className="font-mono text-[0.7rem] text-dust">{d.kind} · {formatDateTimeIST(d.created_at)}</p>
                {lead ? (
                  <Link href={`/admin/leads/${lead.id}`} className="label mt-1 inline-block py-1 text-sand hover:text-gold">Enquiry from {lead.contact_name ?? "website visitor"} →</Link>
                ) : d.lead_reference ? (
                  <p className="font-mono mt-1 break-all text-[0.7rem] text-dust">Reference {d.lead_reference} · no matching enquiry</p>
                ) : null}
              </div>
              {url ? <a href={url} className="label py-2 text-gold hover:text-bone">Download PDF<span className="sr-only">: {d.title}</span></a> : <span className="label text-dust">Unavailable</span>}
            </li>
          );
        })}
      </ul>}
    </div>
  );
}
