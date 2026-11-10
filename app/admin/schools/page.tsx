import Link from "next/link";
import { connection } from "next/server";
import { formatDateTimeIST } from "@/lib/admin/present";
import { STATUS_INFO, type ApplicationStatus } from "@/lib/registration/model";
import { requireAdmissions } from "@/lib/registration/server";
import { AdminShell } from "../AdminShell";
import { EmptyState, LoadError, PageHeading, TableRegion, td, th } from "../ui";

/** School applications and the campus hubs that exist. Hubs are created by a SUPER_ADMIN in the field apps once a school signs. */
export default async function SchoolsAdminPage() {
  await connection();
  const { supabase, profile } = await requireAdmissions();
  const [appsRes, hubsRes] = await Promise.all([
    supabase.from("applications").select("id, reference, status, payload, applicant_name, submitted_at").eq("kind", "school").neq("status", "draft").order("submitted_at", { ascending: false }).limit(300),
    supabase.from("school_hubs").select("id, school_name, slug, is_active").order("school_name").limit(300),
  ]);
  const apps = (appsRes.data ?? []) as { id: string; reference: string; status: ApplicationStatus; payload: Record<string, string>; applicant_name: string | null; submitted_at: string | null }[];
  return (
    <AdminShell name={profile.display_name} current="schools">
      <PageHeading title="Schools">Applications from school representatives, and the campus hubs already set up.</PageHeading>
      <div className="mt-8 flex items-center gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#E8FF1F]">Applications</h2>
        <span className="h-1.5 w-1.5 rounded-full bg-[#E8FF1F] shadow-[0_0_8px_#E8FF1F]" />
      </div>
      {appsRes.error ? <LoadError>School applications could not be loaded.</LoadError> : !apps.length ? <EmptyState>No school applications yet.</EmptyState> : (
        <TableRegion label="School applications (scrolls sideways on small screens)" minWidth="min-w-[48rem]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th scope="col" className={th}>Institution</th>
                <th scope="col" className={th}>City</th>
                <th scope="col" className={th}>Representative</th>
                <th scope="col" className={th}>Status</th>
                <th scope="col" className={th}>Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {apps.map((a) => (
                <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className={td}>
                    <Link href={`/admin/applications/${a.id}`} className="font-semibold text-white hover:text-[#E8FF1F] transition-colors">
                      {a.payload.institution_name ?? a.reference}
                    </Link>
                    <span className="block font-mono text-xs text-[#E8FF1F] mt-0.5">{a.reference}</span>
                  </td>
                  <td className={td}><span className="text-white/80">{a.payload.city}{a.payload.state ? `, ${a.payload.state}` : ""}</span></td>
                  <td className={td}><span className="text-white/90">{a.applicant_name}</span><span className="block text-xs text-white/50">{a.payload.representative_designation}</span></td>
                  <td className={td}><span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium text-white/90">{STATUS_INFO[a.status].label}</span></td>
                  <td className={td}><time dateTime={a.submitted_at ?? undefined} className="font-mono text-xs text-white/50">{formatDateTimeIST(a.submitted_at)}</time></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
      )}

      <div className="mt-12 flex items-center gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#E8FF1F]">Campus hubs</h2>
        <span className="h-1.5 w-1.5 rounded-full bg-[#E8FF1F] shadow-[0_0_8px_#E8FF1F]" />
      </div>
      {hubsRes.error ? <LoadError>Hubs could not be loaded.</LoadError> : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(hubsRes.data ?? []).map((h) => (
            <li
              key={h.id as string}
              className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <span className="text-base font-semibold text-white">{String(h.school_name)}</span>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-xs text-[#E8FF1F]">{String(h.slug)}</span>
                  {h.is_active === false ? (
                    <span className="text-xs text-red-400 font-medium">Inactive</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-[#E8FF1F] font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E8FF1F] shadow-[0_0_6px_#E8FF1F]" /> Active
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
