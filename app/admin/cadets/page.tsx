import Link from "next/link";
import { connection } from "next/server";
import { formatDateTimeIST } from "@/lib/admin/present";
import { requireAdmissions } from "@/lib/registration/server";
import { AdminShell } from "../AdminShell";
import { EmptyState, LoadError, PageHeading, TableRegion, td, th } from "../ui";

type Row = { id: string; status: string; enrolled_at: string; programs: { name: string } | null; school_hubs: { school_name: string } | null;
  applications: { id: string; reference: string; applicant_name: string | null; guardian_children: { first_name: string; last_name: string } | null } | null };

/** Enrolled cadets (from the enrolments this system created). The operations cadet record itself stays in the field apps. */
export default async function CadetsPage() {
  await connection();
  const { supabase, profile } = await requireAdmissions();
  const { data, error } = await supabase.from("enrollments").select("id, status, enrolled_at, programs(name), school_hubs(school_name), applications(id, reference, applicant_name, guardian_children(first_name, last_name))").order("enrolled_at", { ascending: false }).limit(500);
  const rows = (data ?? []) as unknown as Row[];
  return (
    <AdminShell name={profile.display_name} current="cadets">
      <PageHeading title="Cadets">Children enrolled through registration, with their guardian, programme and campus. Training, ranks and attendance live in the field apps.</PageHeading>
      {error ? <LoadError>Enrolments could not be loaded.</LoadError> : !rows.length ? <EmptyState>No enrolments yet.</EmptyState> : (
        <TableRegion label="Enrolled cadets (scrolls sideways on small screens)" minWidth="min-w-[48rem]">
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-line"><th scope="col" className={th}>Cadet</th><th scope="col" className={th}>Guardian</th><th scope="col" className={th}>Programme</th><th scope="col" className={th}>Campus</th><th scope="col" className={th}>Status</th><th scope="col" className={th}>Enrolled</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line/60">
                  <td className={td}>{r.applications?.guardian_children ? `${r.applications.guardian_children.first_name} ${r.applications.guardian_children.last_name}` : "–"}</td>
                  <td className={td}>{r.applications?.applicant_name}{r.applications && <Link href={`/admin/applications/${r.applications.id}`} className="block font-mono text-xs text-gold">{r.applications.reference}</Link>}</td>
                  <td className={td}>{r.programs?.name ?? "–"}</td>
                  <td className={td}>{r.school_hubs?.school_name ?? "Not assigned"}</td>
                  <td className={td}>{r.status}</td>
                  <td className={td}>{formatDateTimeIST(r.enrolled_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
      )}
    </AdminShell>
  );
}
