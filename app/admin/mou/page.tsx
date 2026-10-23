import Link from "next/link";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/admin";
import { MOU_STATUSES, REFERENCE_PATTERN } from "@/lib/admin/constants";
import { applyMouFilters, hasFilters, isPastLastPage, listHref, pageWindow, parseMouFilters, totalPages, type MouFilters } from "@/lib/admin/filters";
import { documentReference, formatCalendarDay, formatDateTimeIST, indexLeads, leadForReference, mouReference, referenceLookups, statusLabel, type LeadLink } from "@/lib/admin/present";
import { logAdminError, signDocumentPaths } from "@/lib/admin/server";
import { AdminNav } from "../AdminNav";
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
    <div>
      <AdminNav name={profile.display_name} current="mou" />
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
          <ul className="mt-4 divide-y divide-line border-y border-line">
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
                <li key={r.id} className="grid gap-3 py-5 md:grid-cols-[minmax(0,1fr)_14rem] md:gap-8">
                  <div className="min-w-0">
                    <p className="label flex flex-wrap items-center gap-x-3 gap-y-2 text-brass">
                      <Tag>{statusLabel(r.status)}</Tag>
                      <time dateTime={r.created_at ?? undefined} className="text-dust">{formatDateTimeIST(r.created_at)}</time>
                    </p>
                    <p className="t-ui mt-2 break-words text-bone">{r.school_name}</p>
                    <p className="t-ui break-words text-sm text-sand">{[r.representative_name, r.designation].filter(Boolean).join(" · ")}</p>
                    <p className="t-ui break-words text-sm text-sand">{[r.email, r.phone_number].filter(Boolean).join(" · ")}</p>
                    {facts.length > 0 && <p className="t-ui mt-1 text-sm text-dust">{facts.join(" · ")}</p>}
                    {r.notes && <p className="t-ui mt-2 max-w-3xl whitespace-pre-wrap break-words text-sm text-sand">{r.notes}</p>}
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    {lead ? (
                      <Link href={`/admin/leads/${lead.id}`} className="label py-1 text-gold hover:text-bone">Website enquiry →<span className="sr-only"> for {r.school_name}</span></Link>
                    ) : refs[i] ? (
                      <span className="t-ui text-xs text-dust">Website reference not found</span>
                    ) : (
                      <span className="t-ui text-xs text-dust">Not from the website form</span>
                    )}
                    {docUrl && <a href={docUrl} className="label py-1 text-gold hover:text-bone">MOU draft (PDF)<span className="sr-only"> for {r.school_name}</span></a>}
                    {doc && !docUrl && <span className="t-ui text-xs text-dust">Draft PDF unavailable</span>}
                  </div>
                </li>
              );
            })}
          </ul>
          {docByRef.size > 0 && <p className="t-ui mt-2 text-xs text-dust">PDF links expire after five minutes. Reload the page for new ones.</p>}
          <Pagination page={page} pages={totalPages(total)} hrefFor={href} />
        </>
      )}
    </div>
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
