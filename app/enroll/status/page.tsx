import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { RegistrationFrame } from "@/components/registration/Frame";
import { formatDateTimeIST } from "@/lib/admin/present";
import { KIND_INFO, STATUS_INFO, type ApplicationKind, type ApplicationStatus } from "@/lib/registration/model";
import { requireAccount } from "@/lib/registration/server";

export const metadata: Metadata = { title: "Your applications" };

/** Every application on this account, newest first (read under RLS: only the caller's own rows exist for them). */
export default async function StatusPage() {
  await connection();
  const { supabase } = await requireAccount("/enroll/status");
  const { data, error } = await supabase.from("applications").select("id, reference, kind, status, created_at, submitted_at, guardian_children(first_name)").order("created_at", { ascending: false }).limit(50);
  const rows = (data ?? []) as unknown as { id: string; reference: string; kind: ApplicationKind; status: ApplicationStatus; created_at: string; guardian_children: { first_name: string } | null }[];
  return (
    <RegistrationFrame eyebrow="Your applications" title="Application" voice="status." lead={<p>Where each application stands. Open one to add documents, answer a question from the admissions team, submit or pay.</p>}>
      {error ? (
        <p role="alert" className="t-ui text-blood">Applications could not be loaded. Please try again shortly.</p>
      ) : !rows.length ? (
        <p className="t-ui text-sand">No applications yet. <Link href="/register" className="text-gold underline underline-offset-4">Start one</Link>.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((a) => (
            <li key={a.id}>
              <Link href={`/enroll/status/${a.id}`} className="flex flex-wrap items-center justify-between gap-4 py-5 hover:bg-umber/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
                <span>
                  <span className="label block text-gold">{KIND_INFO[a.kind].label}{a.guardian_children ? ` · ${a.guardian_children.first_name}` : ""}</span>
                  <span className="font-mono mt-1 block text-xs text-dust">{a.reference} · started {formatDateTimeIST(a.created_at)}</span>
                </span>
                <span className="label border border-line px-3 py-1 text-bone">{STATUS_INFO[a.status].label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="t-ui mt-10 text-sm text-dust"><Link href="/register" className="text-gold underline underline-offset-4">New application</Link> · <Link href="/sovereign" className="text-gold underline underline-offset-4">Dashboard</Link></p>
    </RegistrationFrame>
  );
}
