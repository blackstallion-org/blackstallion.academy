import Link from "next/link";
import { connection } from "next/server";
import { APPLICATION_KINDS, KIND_INFO, STATUS_INFO, type ApplicationKind, type ApplicationStatus } from "@/lib/registration/model";
import { requireAdmissions } from "@/lib/registration/server";
import { AdminShell } from "../AdminShell";
import { LoadError, PageHeading } from "../ui";

const COLUMNS: readonly ApplicationStatus[] = ["submitted", "under_review", "info_required", "approved", "enrolled", "rejected"];

/** Registration at a glance: applications by kind and status, and what is waiting for whom. */
export default async function AdmissionsPage() {
  await connection();
  const { supabase, profile } = await requireAdmissions();
  const [appsRes, enrolRes] = await Promise.all([
    supabase.from("applications").select("kind, status, payment_status").neq("status", "draft").limit(10000),
    supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);
  const rows = (appsRes.data ?? []) as { kind: ApplicationKind; status: ApplicationStatus; payment_status: string }[];
  const n = (k: ApplicationKind, s: ApplicationStatus) => rows.filter((r) => r.kind === k && r.status === s).length;
  const waiting = rows.filter((r) => r.status === "submitted").length;
  const unpaid = rows.filter((r) => r.status === "approved" && r.payment_status === "pending").length;
  const tiles = [
    { label: "Waiting for a reviewer", value: waiting, href: "/admin/applications?status=submitted" },
    { label: "Waiting for the applicant", value: rows.filter((r) => r.status === "info_required").length, href: "/admin/applications?status=info_required" },
    { label: "Approved, fee unpaid", value: unpaid, href: "/admin/applications?status=approved&kind=cadet" },
    { label: "Active enrolments", value: enrolRes.count ?? 0, href: "/admin/cadets" },
  ];
  return (
    <AdminShell name={profile.display_name} current="admissions">
      <PageHeading title="Admissions">Every application by kind and status. Open a number to see the applications behind it.</PageHeading>
      {appsRes.error ? <LoadError>Registration data could not be loaded. If the registration migration has not been applied to this database yet, that is why.</LoadError> : (
        <>
          <ul className="mt-8 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
            {tiles.map((t) => (
              <li key={t.label} className="bg-night p-5"><Link href={t.href} className="block hover:text-gold"><span className="label text-dust">{t.label}</span><span className="t-voice mt-2 block text-3xl text-bone">{t.value}</span></Link></li>
            ))}
          </ul>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse">
              <thead><tr className="border-b border-line"><th scope="col" className="label py-3 pr-6 text-left text-dust">Kind</th>{COLUMNS.map((s) => <th key={s} scope="col" className="label py-3 pr-6 text-right text-dust">{STATUS_INFO[s].label}</th>)}</tr></thead>
              <tbody>
                {APPLICATION_KINDS.map((k) => (
                  <tr key={k} className="border-b border-line/60">
                    <th scope="row" className="t-ui py-3 pr-6 text-left text-sm text-bone">{KIND_INFO[k].plural}</th>
                    {COLUMNS.map((s) => <td key={s} className="t-ui py-3 pr-6 text-right text-sm"><Link href={`/admin/applications?kind=${k}&status=${s}`} className={n(k, s) ? "text-gold hover:underline" : "text-dust"}>{n(k, s)}</Link></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminShell>
  );
}
