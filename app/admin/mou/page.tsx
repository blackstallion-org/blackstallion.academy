import Link from "next/link";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/admin";
import { MOU_STATUSES, REFERENCE_PATTERN } from "@/lib/admin/constants";
import { applyMouFilters, hasFilters, isPastLastPage, listHref, pageWindow, parseMouFilters, totalPages, type MouFilters } from "@/lib/admin/filters";
import { documentReference, formatCalendarDay, formatDateTimeIST, indexLeads, leadForReference, mouReference, referenceLookups, statusLabel, type LeadLink } from "@/lib/admin/present";
import { logAdminError, signDocumentPaths } from "@/lib/admin/server";
import { AdminShell } from "../AdminShell";
import { EmptyState, FilterForm, FilterNotes, LoadError, PageHeading, Pagination, PastLastPage, ResultCount, SelectFilter, Tag, TextFilter } from "../ui";

type MouRow = {
  id: string; school_name: string; representative_name: string; designation: string | null; email: string; phone_number: string;
  campus_tier: string | null; land_area_sqft: number | null; preferred_signing_date: string | null; status: string | null; notes: string | null; created_at: string | null;
};
type DocRow = { id: string; title: string; storage_path: string; lead_reference: string; created_at: string };

const STATUS_OPTIONS = MOU_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }));
const LEAD_LINK_COLUMNS = "id, idempotency_key, contact_name";

/** Read-only view of the operations table (SUPER_ADMIN select policy; there is no update policy for the website). */
export default async function MouPage({ searchParams }: PageProps<"/admin/mou">) {
  await connection();
  const { supabase, profile } = await requireStaff();
  const { filters, issues } = parseMouFilters(await searchParams);
  const { from, to } = pageWindow(filters.page);
  const { data, error, count } = await applyMouFilters(
    supabase.from("mou_requests").select("id, school_name, representative_name, designation, email, phone_number, campus_tier, land_area_sqft, preferred_signing_date, status, notes, created_at", { count: "exact" }),
    filters,
  )
    .order("created_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    .range(from, to);
  if (error && !isPastLastPage(error)) logAdminError("admin.mou_load_failed", error);
  const rows = (data ?? []) as MouRow[];

  // Link each request back to its website enquiry (reference in the notes) and to the drafted PDF, if any.
  const refs = rows.map((r) => mouReference(r.notes));
  const { ids, keys } = referenceLookups(refs);
  const empty = { data: [] as LeadLink[], error: null };
  const [byId, byKey] = await Promise.all([
    ids.length ? supabase.from("onboarding_leads").select(LEAD_LINK_COLUMNS).in("id", ids) : empty,
    keys.length ? supabase.from("onboarding_leads").select(LEAD_LINK_COLUMNS).in("idempotency_key", keys) : empty,
  ]);
  if (byId.error || byKey.error) logAdminError("admin.mou_lead_links_failed", byId.error ?? byKey.error);
  const index = indexLeads([...((byId.data ?? []) as LeadLink[]), ...((byKey.data ?? []) as LeadLink[])]);
  const matches = rows.map((_, i) => {
    const lead = leadForReference(refs[i], index);
    return { lead, docRef: documentReference(refs[i], lead) };
  });
  const docRefs = [...new Set(matches.map((m) => m.docRef).filter((r): r is string => !!r && REFERENCE_PATTERN.test(r)))];
  const docsRes = docRefs.length
    ? await supabase.from("generated_documents").select("id, title, storage_path, lead_reference, created_at").in("lead_reference", docRefs).order("created_at", { ascending: false })
    : { data: [] as DocRow[], error: null };
  if (docsRes.error) logAdminError("admin.mou_documents_failed", docsRes.error);
  const docByRef = new Map<string, DocRow>();
  for (const d of (docsRes.data ?? []) as DocRow[]) if (!docByRef.has(d.lead_reference)) docByRef.set(d.lead_reference, d); // newest wins
  const { urls } = await signDocumentPaths(supabase, [...docByRef.values()].map((d) => d.storage_path));

  const total = count ?? rows.length;
  const filtered = hasFilters(filters);
  const { page, ...criteria } = filters;
  const href = (p: number) => listHref("/admin/mou", criteria, p);

  return (
    <AdminShell name={profile.display_name} current="mou">
      <PageHeading title="MOU requests">
        Requests in the operations table, newest first, including those mirrored from the website MOU form. Read-only here:
        statuses are changed in the operations system.
      </PageHeading>
      <MouFilterForm filters={filters} active={filtered} />
      <FilterNotes issues={issues} />

      {isPastLastPage(error) ? (
        <PastLastPage firstHref={href(1)} />
      ) : error ? (
        <LoadError>MOU requests could not be loaded. Try again shortly.</LoadError>
      ) : !rows.length ? (
        <EmptyState clearHref={filtered ? "/admin/mou" : undefined}>{filtered ? "No MOU requests match these filters." : "No MOU requests yet."}</EmptyState>
      ) : (
        <>
          <ResultCount count={total} page={page} shown={rows.length} singular="request" plural="requests" filtered={filtered} />
          {(byId.error || byKey.error || docsRes.error) && <LoadError>Links to website enquiries or documents could not all be loaded.</LoadError>}
          <ul className="mt-6 flex flex-col gap-3.5">
            {rows.map((r, i) => {
              const { lead, docRef } = matches[i];
              const doc = docRef ? docByRef.get(docRef) : undefined;
              const docUrl = doc ? urls.get(doc.storage_path) : undefined;
              const facts = [
                r.campus_tier && `Tier: ${r.campus_tier}`,
                r.land_area_sqft != null && `Land: ${r.land_area_sqft.toLocaleString("en-IN")} sq ft`,
                r.preferred_signing_date && `Preferred signing: ${formatCalendarDay(r.preferred_signing_date)}`,
              ].filter(Boolean);
              return (
                <li
                  key={r.id}
                  className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-xl shadow-lg transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-8"
                >
                  <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
                  <div className="relative z-10 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <Tag>{statusLabel(r.status)}</Tag>
                      <time dateTime={r.created_at ?? undefined} className="font-mono text-xs text-white/45">{formatDateTimeIST(r.created_at)}</time>
                    </div>
                    <p className="mt-3 text-base font-semibold text-white">{r.school_name}</p>
                    <p className="mt-1 text-sm text-white/70">{[r.representative_name, r.designation].filter(Boolean).join(" · ")}</p>
                    <p className="mt-0.5 text-xs text-white/50">{[r.email, r.phone_number].filter(Boolean).join(" · ")}</p>
                    {facts.length > 0 && <p className="mt-2 text-xs text-[#E8FF1F]/80">{facts.join(" · ")}</p>}
                    {r.notes && (
                      <p className="mt-2.5 line-clamp-2 max-w-3xl rounded-xl border border-white/5 bg-black/30 p-3 text-xs leading-relaxed text-white/70">
                        {r.notes}
                      </p>
                    )}
                  </div>
                  <div className="relative z-10 flex flex-col items-start gap-2.5 shrink-0">
                    {lead ? (
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/80 hover:border-white/25 hover:text-white transition-all"
                      >
                        Website enquiry →<span className="sr-only"> for {r.school_name}</span>
                      </Link>
                    ) : refs[i] ? (
                      <span className="text-xs text-white/40">Website reference not found</span>
                    ) : (
                      <span className="text-xs text-white/40">Not from the website form</span>
                    )}
                    {docUrl && (
                      <a
                        href={docUrl}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8FF1F] px-4 py-2 text-xs font-semibold text-[#0b0b0c] shadow-sm shadow-[#E8FF1F]/20 hover:brightness-105 active:scale-[0.98] transition-all"
                      >
                        MOU draft (PDF)<span className="sr-only"> for {r.school_name}</span>
                      </a>
                    )}
                    {doc && !docUrl && <span className="text-xs text-white/40">Draft PDF unavailable</span>}
                  </div>
                </li>
              );
            })}
          </ul>
          {docByRef.size > 0 && <p className="mt-3 text-xs text-white/40">PDF links expire after five minutes. Reload the page for new ones.</p>}
          <Pagination page={page} pages={totalPages(total)} hrefFor={href} />
        </>
      )}
    </AdminShell>
  );
}

function MouFilterForm({ filters, active }: { filters: MouFilters; active: boolean }) {
  return (
    <FilterForm action="/admin/mou" label="Filter MOU requests" active={active}>
      <TextFilter name="q" label="School" defaultValue={filters.q} maxLength={80} className="sm:col-span-2" placeholder="Part of the school's name" />
      <SelectFilter name="status" label="Status" options={STATUS_OPTIONS} defaultValue={filters.status} anyLabel="Any status" />
    </FilterForm>
  );
}
