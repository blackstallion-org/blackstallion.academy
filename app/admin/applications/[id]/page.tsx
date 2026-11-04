import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { formatDateTimeIST } from "@/lib/admin/present";
import { describePayload } from "@/lib/registration/fields";
import { ageOn, DOC_LABEL, KIND_INFO, STATUS_INFO, feeWithGst, rupees, type ApplicationKind, type ApplicationStatus, type DocType } from "@/lib/registration/model";
import { requireAdmissions } from "@/lib/registration/server";
import { AdminShell } from "../../AdminShell";
import { PageHeading } from "../../ui";
import { ReviewPanel } from "../ReviewPanel";

type App = {
  id: string; reference: string; kind: ApplicationKind; status: ApplicationStatus; payload: Record<string, unknown>; applicant_name: string | null; applicant_email: string | null;
  info_request: string | null; fee_paise: number | null; payment_status: string; submitted_at: string | null; decided_at: string | null; consent_version: string | null; consented_at: string | null;
  guardian_children: { first_name: string; last_name: string; date_of_birth: string; current_school: string | null; grade: string | null; riding_experience: string | null; medical_notes: string | null } | null;
  programs: { name: string; gst_rate: number } | null; school_hubs: { school_name: string } | null;
};

/** One application for a reviewer: answers, documents (signed links, five minutes), the full history and the allowed actions. */
export default async function ApplicationReviewPage({ params }: PageProps<"/admin/applications/[id]">) {
  await connection();
  const { supabase, profile } = await requireAdmissions();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [appRes, docsRes, eventsRes, hubsRes, notesRes] = await Promise.all([
    supabase.from("applications").select("id, reference, kind, status, payload, applicant_name, applicant_email, info_request, fee_paise, payment_status, submitted_at, decided_at, consent_version, consented_at, guardian_children(first_name, last_name, date_of_birth, current_school, grade, riding_experience, medical_notes), programs(name, gst_rate), school_hubs(school_name)").eq("id", id).maybeSingle(),
    supabase.from("application_documents").select("id, doc_type, file_name, mime_type, size_bytes, storage_path, created_at").eq("application_id", id).order("created_at"),
    supabase.from("application_events").select("id, from_status, to_status, note, visible_to_applicant, created_at").eq("application_id", id).order("created_at"),
    supabase.from("school_hubs").select("id, school_name").order("school_name").limit(200),
    supabase.from("notification_log").select("template, status, created_at").eq("application_id", id).order("created_at", { ascending: false }).limit(20),
  ]);
  const app = appRes.data as unknown as App | null;
  if (!app || app.status === "draft") notFound();
  const docs = (docsRes.data ?? []) as { id: string; doc_type: DocType; file_name: string; mime_type: string; size_bytes: number; storage_path: string; created_at: string }[];
  const signed = await Promise.all(docs.map((d) => supabase.storage.from("application-documents").createSignedUrl(d.storage_path, 300)));
  const events = (eventsRes.data ?? []) as { id: number; from_status: ApplicationStatus | null; to_status: ApplicationStatus; note: string | null; visible_to_applicant: boolean; created_at: string }[];
  const child = app.guardian_children;
  const fee = app.fee_paise ? feeWithGst(app.fee_paise, Number(app.programs?.gst_rate ?? 0.18)) : null;
  const dl = "grid gap-x-8 gap-y-4 sm:grid-cols-2";
  const item = (label: string, value: string | null | undefined) => value ? <div key={label}><dt className="label text-dust">{label}</dt><dd className="t-ui mt-1 whitespace-pre-wrap text-bone">{value}</dd></div> : null;

  return (
    <AdminShell name={profile.display_name} current="applications">
      <p><Link href="/admin/applications" className="label text-gold hover:text-bone">← Applications</Link></p>
      <PageHeading title={`${KIND_INFO[app.kind].label} · ${app.reference}`}>Status: {STATUS_INFO[app.status].label}. Submitted {formatDateTimeIST(app.submitted_at)}. Consent {app.consent_version ?? "not given"}{app.consented_at ? ` (${formatDateTimeIST(app.consented_at)})` : ""}.</PageHeading>
      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-10">
          <section aria-labelledby="applicant-h"><h2 id="applicant-h" className="label text-bone">Applicant</h2>
            <dl className={`mt-4 ${dl}`}>{item("Name", app.applicant_name)}{item("E-mail", app.applicant_email)}</dl>
          </section>
          {child && (
            <section aria-labelledby="child-h"><h2 id="child-h" className="label text-bone">Child</h2>
              <dl className={`mt-4 ${dl}`}>
                {item("Name", `${child.first_name} ${child.last_name}`)}{item("Age", `${ageOn(child.date_of_birth)} (born ${child.date_of_birth})`)}
                {item("School", child.current_school)}{item("Grade", child.grade)}{item("Riding", child.riding_experience)}{item("Medical notes", child.medical_notes)}
                {item("Programme", app.programs?.name)}{item("Preferred campus", app.school_hubs?.school_name)}
              </dl>
            </section>
          )}
          <section aria-labelledby="answers-h"><h2 id="answers-h" className="label text-bone">Answers</h2>
            <dl className={`mt-4 ${dl}`}>{describePayload(app.kind, app.payload).map((r) => item(r.label, r.value))}</dl>
          </section>
          <section aria-labelledby="docs-h"><h2 id="docs-h" className="label text-bone">Documents</h2>
            {docs.length ? (
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {docs.map((d, i) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <span className="t-ui text-sm text-bone">{DOC_LABEL[d.doc_type]}<span className="block text-xs text-dust">{d.file_name} · {Math.ceil(d.size_bytes / 1024)} KB</span></span>
                    {signed[i].data?.signedUrl ? <a href={signed[i].data!.signedUrl} target="_blank" rel="noopener noreferrer" className="label text-gold hover:text-bone">Open (5 min link)</a> : <span className="label text-dust">unavailable</span>}
                  </li>
                ))}
              </ul>
            ) : <p className="t-ui mt-4 text-sm text-dust">No documents.</p>}
          </section>
        </div>
        <div className="flex flex-col gap-10">
          <section aria-labelledby="act-h"><h2 id="act-h" className="label text-bone">Decision</h2>
            {app.info_request && app.status === "info_required" && <p className="t-ui mt-4 text-sm text-sand">Asked: {app.info_request}</p>}
            {fee && <p className="t-ui mt-4 text-sm text-sand">Fee {rupees(fee.total)} including GST · payment {app.payment_status.replace("_", " ")}</p>}
            <div className="mt-6"><ReviewPanel id={app.id} status={app.status} kind={app.kind} paymentStatus={app.payment_status} isSuperAdmin={profile.role === "SUPER_ADMIN"} hubs={(hubsRes.data ?? []).map((h) => ({ id: h.id as string, label: String(h.school_name) }))} /></div>
          </section>
          <section aria-labelledby="hist-h"><h2 id="hist-h" className="label text-bone">History</h2>
            <ol className="mt-4 flex flex-col gap-3">
              {events.map((e) => (
                <li key={e.id} className="t-ui text-sm"><span className="text-bone">{e.from_status ? `${STATUS_INFO[e.from_status].label} → ` : ""}{STATUS_INFO[e.to_status].label}</span> <span className="text-dust">· {formatDateTimeIST(e.created_at)}{e.visible_to_applicant ? "" : " · internal"}</span>
                  {e.note && <span className="mt-1 block text-sand">{e.note}</span>}</li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="mail-h"><h2 id="mail-h" className="label text-bone">E-mails</h2>
            {(notesRes.data ?? []).length ? (
              <ul className="mt-4 flex flex-col gap-2">{(notesRes.data ?? []).map((n, i) => <li key={i} className="t-ui text-xs text-dust">{String(n.template).replace(/_/g, " ")} · {String(n.status)} · {formatDateTimeIST(n.created_at as string)}</li>)}</ul>
            ) : <p className="t-ui mt-4 text-xs text-dust">None recorded.</p>}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
