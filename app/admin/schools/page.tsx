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
      <h2 className="label mt-10 text-bone">Applications</h2>
      {appsRes.error ? <LoadError>School applications could not be loaded.</LoadError> : !apps.length ? <EmptyState>No school applications yet.</EmptyState> : (
        <TableRegion label="School applications (scrolls sideways on small screens)" minWidth="min-w-[48rem]">
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-line"><th scope="col" className={th}>Institution</th><th scope="col" className={th}>City</th><th scope="col" className={th}>Representative</th><th scope="col" className={th}>Status</th><th scope="col" className={th}>Submitted</th></tr></thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className="border-b border-line/60">
                  <td className={td}><Link href={`/admin/applications/${a.id}`} className="text-gold hover:underline">{a.payload.institution_name ?? a.reference}</Link><span className="block font-mono text-xs text-dust">{a.reference}</span></td>
                  <td className={td}>{a.payload.city}{a.payload.state ? `, ${a.payload.state}` : ""}</td>
                  <td className={td}>{a.applicant_name}<span className="block text-xs text-dust">{a.payload.representative_designation}</span></td>
                  <td className={td}>{STATUS_INFO[a.status].label}</td>
                  <td className={td}>{formatDateTimeIST(a.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
      )}
      <h2 className="label mt-14 text-bone">Campus hubs</h2>
      {hubsRes.error ? <LoadError>Hubs could not be loaded.</LoadError> : (
        <ul className="mt-4 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {(hubsRes.data ?? []).map((h) => <li key={h.id as string} className="bg-night p-4"><span className="t-ui text-bone">{String(h.school_name)}</span><span className="block font-mono text-xs text-dust">{String(h.slug)}{h.is_active === false ? " · inactive" : ""}</span></li>)}
        </ul>
      )}
    </AdminShell>
  );
}
