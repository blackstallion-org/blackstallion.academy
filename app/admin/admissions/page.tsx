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
          <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {tiles.map((t) => (
              <li
                key={t.label}
                className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] group"
              >
                <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
                <Link href={t.href} className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50 group-hover:text-white/80 transition-colors">{t.label}</span>
                    <span className="mt-2 block text-3xl font-bold tracking-tight text-white group-hover:text-[#E8FF1F] transition-colors">{t.value}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-[#E8FF1F] font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                    <span>View applications</span> →
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="relative mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-xl">
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th scope="col" className="py-4 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/45">Kind</th>
                    {COLUMNS.map((s) => <th key={s} scope="col" className="py-4 px-5 text-right text-[11px] font-semibold uppercase tracking-wider text-white/45">{STATUS_INFO[s].label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {APPLICATION_KINDS.map((k) => (
                    <tr key={k} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <th scope="row" className="py-4 px-5 text-left text-sm font-semibold text-white">{KIND_INFO[k].plural}</th>
                      {COLUMNS.map((s) => (
                        <td key={s} className="py-4 px-5 text-right text-sm">
                          <Link href={`/admin/applications?kind=${k}&status=${s}`} className={n(k, s) ? "font-mono font-semibold text-[#E8FF1F] hover:underline" : "font-mono text-white/30"}>
                            {n(k, s)}
                          </Link>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
