import Link from "next/link";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/admin";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/admin/constants";
import { applyAuditFilters, hasFilters, isPastLastPage, listHref, pageWindow, parseAuditFilters, totalPages, type AuditFilters } from "@/lib/admin/filters";
import { auditActionLabel, auditDetails, auditEntityHref, formatDateTimeIST, staffLabel } from "@/lib/admin/present";
import { logAdminError, staffNames } from "@/lib/admin/server";
import { AdminNav } from "../AdminNav";
import { DateFilter, EmptyState, FilterForm, FilterNotes, LoadError, PageHeading, Pagination, PastLastPage, ResultCount, SelectFilter, TableRegion, td, th } from "../ui";

type AuditRow = { id: number; actor_user_id: string | null; action: string; entity_type: string; entity_id: string | null; metadata: unknown; created_at: string };

const ENTITY_OPTIONS = AUDIT_ENTITIES.map(({ value, label }) => ({ value, label }));

/** Append-only audit trail (staff select policy; no update or delete for anyone). */
export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await connection();
  const { supabase, profile, user } = await requireStaff();
  const { filters, issues } = parseAuditFilters(await searchParams);
  const { from, to } = pageWindow(filters.page);
  const { data, error, count } = await applyAuditFilters(
    supabase.from("audit_events").select("id, actor_user_id, action, entity_type, entity_id, metadata, created_at", { count: "exact" }),
    filters,
  )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);
  if (error && !isPastLastPage(error)) logAdminError("admin.audit_load_failed", error);
  const rows = (data ?? []) as AuditRow[];
  const names = await staffNames(supabase, rows.map((r) => r.actor_user_id));

  const total = count ?? rows.length;
  const filtered = hasFilters(filters);
  const { page, ...criteria } = filters;
  const href = (p: number) => listHref("/admin/audit", criteria, p);

  return (
    <div>
      <AdminNav name={profile.display_name} current="audit" />
      <PageHeading title="Audit log">
        Append-only record of enquiries received and of changes to enquiries, documents and website images, newest first. It records who
        changed which columns, never the values. Times are India Standard Time.
      </PageHeading>
      <AuditFilterForm filters={filters} active={filtered} />
      <FilterNotes issues={issues} />

      {isPastLastPage(error) ? (
        <PastLastPage firstHref={href(1)} />
      ) : error ? (
        <LoadError>The audit log could not be loaded. Try again shortly.</LoadError>
      ) : !rows.length ? (
        <EmptyState clearHref={filtered ? "/admin/audit" : undefined}>{filtered ? "No events match these filters." : "No events recorded yet."}</EmptyState>
      ) : (
        <>
          <ResultCount count={total} page={page} shown={rows.length} singular="event" plural="events" filtered={filtered} />
          <TableRegion label="Audit events (scrolls sideways on small screens)" minWidth="min-w-[52rem]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className={th}>When</th>
                  <th scope="col" className={th}>Event</th>
                  <th scope="col" className={th}>Record</th>
                  <th scope="col" className={th}>By</th>
                  <th scope="col" className={th}>Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => {
                  const target = auditEntityHref(r.entity_type, r.entity_id);
                  return (
                    <tr key={r.id}>
                      <td className={`${td} whitespace-nowrap`}><time dateTime={r.created_at}>{formatDateTimeIST(r.created_at)}</time></td>
                      <td className={td}>
                        <span className="text-bone">{auditActionLabel(r.action, r.entity_type)}</span>
                        <span className="font-mono block text-[0.7rem] text-dust">{r.action}</span>
                      </td>
                      <td className={td}>
                        <span className="font-mono block text-xs">{r.entity_type}</span>
                        {r.entity_id && (target ? (
                          <Link href={target} className="font-mono block break-all text-[0.7rem] text-gold underline decoration-line underline-offset-4 hover:text-bone">{r.entity_id}</Link>
                        ) : (
                          <span className="font-mono block break-all text-[0.7rem] text-dust">{r.entity_id}</span>
                        ))}
                      </td>
                      <td className={td}>{staffLabel(r.actor_user_id, user.id, names)}</td>
                      <td className={`${td} font-mono break-words text-[0.7rem]`}>{auditDetails(r.metadata) || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableRegion>
          <Pagination page={page} pages={totalPages(total)} hrefFor={href} />
        </>
      )}
    </div>
  );
}

function AuditFilterForm({ filters, active }: { filters: AuditFilters; active: boolean }) {
  return (
    <FilterForm action="/admin/audit" label="Filter the audit log" active={active}>
      <SelectFilter name="entity" label="Record type" options={ENTITY_OPTIONS} defaultValue={filters.entity} anyLabel="Any record" className="sm:col-span-2" />
      <SelectFilter name="action" label="Event" options={AUDIT_ACTIONS} defaultValue={filters.action} anyLabel="Any event" className="sm:col-span-2" />
      <div className="grid grid-cols-2 gap-4 sm:col-span-2">
        <DateFilter name="from" label="From" defaultValue={filters.from} />
        <DateFilter name="to" label="To" defaultValue={filters.to} />
      </div>
    </FilterForm>
  );
}
