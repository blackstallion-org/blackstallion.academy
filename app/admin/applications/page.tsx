import Link from "next/link";
import { connection } from "next/server";
import { formatDateTimeIST } from "@/lib/admin/present";
import { APPLICATION_KINDS, APPLICATION_STATUSES, KIND_INFO, STATUS_INFO, type ApplicationKind, type ApplicationStatus } from "@/lib/registration/model";
import { requireAdmissions } from "@/lib/registration/server";
import { AdminShell } from "../AdminShell";
import { EmptyState, FilterForm, LoadError, PageHeading, SelectFilter, TableRegion, TextFilter, td, th } from "../ui";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Every application (drafts are the applicant's own and are not listed), newest first, with filters. Read under RLS. */
export default async function ApplicationsPage({ searchParams }: PageProps<"/admin/applications">) {
  await connection();
  const { supabase, profile } = await requireAdmissions();
  const sp = await searchParams;
  const kind = APPLICATION_KINDS.find((k) => k === one(sp.kind));
  const status = APPLICATION_STATUSES.find((s) => s === one(sp.status));
  const q = (one(sp.q) ?? "").trim().slice(0, 80).replace(/[%,()]/g, "");
  let list = supabase.from("applications").select("id, reference, kind, status, applicant_name, applicant_email, submitted_at, payment_status", { count: "exact" })
    .neq("status", "draft").order("submitted_at", { ascending: false, nullsFirst: false }).limit(200);
  if (kind) list = list.eq("kind", kind);
  if (status) list = list.eq("status", status);
  if (q) list = list.or(`reference.ilike.%${q}%,applicant_name.ilike.%${q}%,applicant_email.ilike.%${q}%`);
  const { data, error, count } = await list;
  const rows = (data ?? []) as { id: string; reference: string; kind: ApplicationKind; status: ApplicationStatus; applicant_name: string | null; applicant_email: string | null; submitted_at: string | null; payment_status: string }[];
  const filtered = Boolean(kind || status || q);
  return (
    <AdminShell name={profile.display_name} current="applications">
      <PageHeading title="Applications">Cadet enrolments, school, staff and partner applications. Drafts stay private to the applicant until submitted. Times are India Standard Time.</PageHeading>
      <FilterForm action="/admin/applications" label="Filter applications" active={filtered}>
        <SelectFilter name="kind" label="Kind" defaultValue={kind} options={APPLICATION_KINDS.map((k) => ({ value: k, label: KIND_INFO[k].label }))} />
        <SelectFilter name="status" label="Status" defaultValue={status} options={APPLICATION_STATUSES.filter((s) => s !== "draft").map((s) => ({ value: s, label: STATUS_INFO[s].label }))} />
        <TextFilter name="q" label="Reference, name or e-mail" defaultValue={q} maxLength={80} />
      </FilterForm>
      {error ? <LoadError>Applications could not be loaded. If the registration migration has not been applied to this database yet, that is why.</LoadError>
        : !rows.length ? <EmptyState clearHref={filtered ? "/admin/applications" : undefined}>{filtered ? "No applications match these filters." : "No applications yet."}</EmptyState>
        : (
          <>
            <p className="t-ui mt-6 text-sm text-dust" role="status">{count ?? rows.length} {count === 1 ? "application" : "applications"}{filtered ? " match." : "."}</p>
            <TableRegion label="Applications (scrolls sideways on small screens)" minWidth="min-w-[52rem]">
              <table className="w-full border-collapse">
                <thead><tr className="border-b border-line"><th scope="col" className={th}>Reference</th><th scope="col" className={th}>Kind</th><th scope="col" className={th}>Applicant</th><th scope="col" className={th}>Status</th><th scope="col" className={th}>Submitted</th><th scope="col" className={th}>Fee</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-line/60">
                      <td className={td}><Link href={`/admin/applications/${r.id}`} className="font-mono text-gold underline-offset-4 hover:underline">{r.reference}</Link></td>
                      <td className={td}>{KIND_INFO[r.kind].label}</td>
                      <td className={td}>{r.applicant_name}<span className="block text-xs text-dust">{r.applicant_email}</span></td>
                      <td className={td}>{STATUS_INFO[r.status].label}</td>
                      <td className={td}>{formatDateTimeIST(r.submitted_at)}</td>
                      <td className={td}>{r.payment_status.replace("_", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableRegion>
          </>
        )}
    </AdminShell>
  );
}
