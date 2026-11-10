import Link from "next/link";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/admin";
import { REFERENCE_PATTERN } from "@/lib/admin/constants";
import { formatDateTimeIST, type LeadLink } from "@/lib/admin/present";
import { logAdminError, signDocumentPaths } from "@/lib/admin/server";
import { AdminShell } from "../AdminShell";
import { EmptyState, LoadError, PageHeading } from "../ui";

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
    <AdminShell name={profile.display_name} current="documents">
      <PageHeading title="Documents">Draft MOUs generated from requests. Download links expire after five minutes.</PageHeading>
      {error && <LoadError>Documents could not be loaded.</LoadError>}
      {!error && !docs.length && <EmptyState>No documents yet.</EmptyState>}
      {leadsRes.error && <LoadError>Links to the matching enquiries could not be loaded.</LoadError>}
      {docs.length > 0 && (
        <ul className="mt-6 flex flex-col gap-3.5">
          {docs.map((d) => {
            const url = urls.get(d.storage_path);
            const lead = d.lead_reference ? leadByRef.get(d.lead_reference) : undefined;
            return (
              <li
                key={d.id}
                className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-xl shadow-lg transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] flex flex-wrap items-center justify-between gap-4"
              >
                <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
                <div className="relative z-10 min-w-0">
                  <p className="text-base font-semibold text-white">{d.title}</p>
                  <p className="font-mono text-xs text-white/45 mt-1">{d.kind} · {formatDateTimeIST(d.created_at)}</p>
                  {lead ? (
                    <Link href={`/admin/leads/${lead.id}`} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#E8FF1F] hover:underline">
                      Enquiry from {lead.contact_name ?? "website visitor"} →
                    </Link>
                  ) : d.lead_reference ? (
                    <p className="font-mono mt-1 break-all text-xs text-white/40">Reference {d.lead_reference} · no matching enquiry</p>
                  ) : null}
                </div>
                <div className="relative z-10">
                  {url ? (
                    <a
                      href={url}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8FF1F] px-4 py-2 text-xs font-semibold text-[#0b0b0c] shadow-sm shadow-[#E8FF1F]/20 hover:brightness-105 active:scale-[0.98] transition-all"
                    >
                      Download PDF<span className="sr-only">: {d.title}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-white/40">Unavailable</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}
