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
            <thead>
              <tr className="border-b border-white/10">
                <th scope="col" className={th}>Cadet</th>
                <th scope="col" className={th}>Guardian</th>
                <th scope="col" className={th}>Programme</th>
                <th scope="col" className={th}>Campus</th>
                <th scope="col" className={th}>Status</th>
                <th scope="col" className={th}>Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className={td}><span className="font-semibold text-white">{r.applications?.guardian_children ? `${r.applications.guardian_children.first_name} ${r.applications.guardian_children.last_name}` : "–"}</span></td>
                  <td className={td}><span className="text-white/80">{r.applications?.applicant_name}</span>{r.applications && <Link href={`/admin/applications/${r.applications.id}`} className="block font-mono text-xs font-semibold text-[#E8FF1F] hover:underline mt-0.5">{r.applications.reference}</Link>}</td>
                  <td className={td}><span className="text-white/70">{r.programs?.name ?? "–"}</span></td>
                  <td className={td}><span className="text-white/70">{r.school_hubs?.school_name ?? "Not assigned"}</span></td>
                  <td className={td}><span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium text-white/90">{r.status}</span></td>
                  <td className={td}><time dateTime={r.enrolled_at} className="font-mono text-xs text-white/50">{formatDateTimeIST(r.enrolled_at)}</time></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
      )}
    </AdminShell>
  );
}
