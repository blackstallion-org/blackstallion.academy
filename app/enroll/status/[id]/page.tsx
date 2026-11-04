import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { removeDocument, withdrawApplication } from "@/app/enroll/actions";
import { DocumentUpload, PayButton, Steps, SubmitForm } from "@/components/registration/ApplyForms";
import { Panel, RegistrationFrame } from "@/components/registration/Frame";
import { formatDateTimeIST } from "@/lib/admin/present";
import { describePayload } from "@/lib/registration/fields";
import {
  CADET_STEPS, DOC_LABEL, DOCS_FOR, KIND_INFO, OTHER_STEPS, STATUS_INFO, feeWithGst, isEditable, isWithdrawable, rupees,
  type ApplicationKind, type ApplicationStatus, type DocType,
} from "@/lib/registration/model";
import { razorpayConfigured } from "@/lib/registration/razorpay";
import { requireAccount } from "@/lib/registration/server";

export const metadata: Metadata = { title: "Application" };

type App = {
  id: string; reference: string; kind: ApplicationKind; status: ApplicationStatus; payload: Record<string, unknown>; info_request: string | null;
  fee_paise: number | null; payment_status: string; created_at: string; submitted_at: string | null; applicant_id: string;
  guardian_children: { first_name: string; last_name: string } | null; programs: { name: string; gst_rate: number } | null; school_hubs: { school_name: string } | null;
};

function stepFor(kind: ApplicationKind, status: ApplicationStatus, docs: number): number {
  const base = kind === "cadet" ? 1 : 0;
  if (status === "draft" || status === "info_required") return base + (docs ? 2 : 1);
  if (status === "submitted" || status === "under_review") return base + 3;
  return base + 4;
}

/** One application, as its applicant sees it (RLS returns it only to them; an id that is not theirs is simply not found). */
export default async function ApplicationPage({ params }: PageProps<"/enroll/status/[id]">) {
  await connection();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { supabase } = await requireAccount(`/enroll/status/${id}`);
  const [appRes, docsRes, eventsRes, payRes] = await Promise.all([
    supabase.from("applications").select("id, reference, kind, status, payload, info_request, fee_paise, payment_status, created_at, submitted_at, applicant_id, guardian_children(first_name, last_name), programs(name, gst_rate), school_hubs(school_name)").eq("id", id).maybeSingle(),
    supabase.from("application_documents").select("id, doc_type, file_name, size_bytes, created_at").eq("application_id", id).order("created_at"),
    supabase.from("application_events").select("id, to_status, note, created_at").eq("application_id", id).order("created_at"),
    supabase.from("payment_records").select("invoice_number, amount_paise, gst_amount, status, paid_at").eq("application_id", id).order("created_at", { ascending: false }),
  ]);
  const app = appRes.data as unknown as App | null;
  if (!app) notFound();
  const docs = (docsRes.data ?? []) as { id: string; doc_type: DocType; file_name: string; size_bytes: number; created_at: string }[];
  const events = (eventsRes.data ?? []) as { id: number; to_status: ApplicationStatus; note: string | null; created_at: string }[];
  const payments = (payRes.data ?? []) as { invoice_number: string | null; amount_paise: number | null; gst_amount: number | null; status: string; paid_at: string | null }[];
  const editable = isEditable(app.status);
  const need = DOCS_FOR[app.kind];
  const missing = need.required.filter((t) => !docs.some((d) => d.doc_type === t));
  const steps = app.kind === "cadet" ? CADET_STEPS : OTHER_STEPS;
  const info = STATUS_INFO[app.status];
  const editHref = `${KIND_INFO[app.kind].route}?application=${app.id}`;
  const fee = app.fee_paise ? feeWithGst(app.fee_paise, Number(app.programs?.gst_rate ?? 0.18)) : null;
  const paid = payments.find((p) => p.status === "PAID" || p.status === "REFUNDED");

  return (
    <RegistrationFrame eyebrow={KIND_INFO[app.kind].label} title="Application" voice={app.reference} back={{ href: "/enroll/status", label: "All applications" }}>
      <Steps steps={steps} current={app.status === "enrolled" ? steps.length - 1 : stepFor(app.kind, app.status, docs.length)} />

      <div className="mt-10 border border-line p-6" role="status">
        <p className="label text-gold">{info.label}</p>
        <p className="t-ui mt-2 text-sand">{info.applicant}</p>
        {app.status === "info_required" && app.info_request && (
          <blockquote className="t-story mt-4 border-l-2 border-gold pl-4 text-bone">{app.info_request}</blockquote>
        )}
      </div>

      <div className="mt-12 flex flex-col gap-14">
        <Panel title="Your answers" id="answers-h">
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {app.guardian_children && <div><dt className="label text-dust">Child</dt><dd className="t-ui mt-1 text-bone">{app.guardian_children.first_name} {app.guardian_children.last_name}</dd></div>}
            {app.programs && <div><dt className="label text-dust">Programme</dt><dd className="t-ui mt-1 text-bone">{app.programs.name}</dd></div>}
            {app.school_hubs && <div><dt className="label text-dust">Preferred campus</dt><dd className="t-ui mt-1 text-bone">{app.school_hubs.school_name}</dd></div>}
            {describePayload(app.kind, app.payload).map((r) => <div key={r.label}><dt className="label text-dust">{r.label}</dt><dd className="t-ui mt-1 whitespace-pre-wrap text-bone">{r.value}</dd></div>)}
          </dl>
          {editable && <p className="mt-6"><Link href={editHref} className="label text-gold hover:text-bone">Edit answers →</Link></p>}
        </Panel>

        <Panel title="Documents" id="docs-h">
          {docs.length ? (
            <ul className="mb-6 divide-y divide-line border-y border-line">
              {docs.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="t-ui text-bone">{DOC_LABEL[d.doc_type]}<span className="block text-xs text-dust">{d.file_name} · {Math.ceil(d.size_bytes / 1024)} KB</span></span>
                  {editable && (
                    <form action={removeDocument}><input type="hidden" name="document_id" value={d.id} /><button className="label text-dust hover:text-blood">Remove</button></form>
                  )}
                </li>
              ))}
            </ul>
          ) : <p className="t-ui mb-6 text-sm text-dust">No documents yet.</p>}
          {missing.length > 0 && <p className="t-ui mb-6 text-sm text-gold">Still needed: {missing.map((t) => DOC_LABEL[t]).join(", ")}.</p>}
          {editable && <DocumentUpload applicationId={app.id} types={[...need.required, ...need.optional]} />}
          <p className="t-ui mt-4 text-xs text-dust">Files are kept in a private store that only you and the admissions team can open.</p>
        </Panel>

        {editable && (
          <Panel title="Consent and submit" id="submit-h">
            {missing.length ? <p className="t-ui text-sm text-dust">Upload the documents above first.</p> : <SubmitForm applicationId={app.id} kind={app.kind} />}
          </Panel>
        )}

        {app.kind === "cadet" && (app.status === "approved" || app.status === "enrolled") && fee && (
          <Panel title="Enrolment fee" id="fee-h">
            <dl className="grid max-w-md grid-cols-2 gap-y-2 font-mono text-sm">
              <dt className="text-dust">Fee</dt><dd className="text-right text-bone">{rupees(fee.base)}</dd>
              <dt className="text-dust">GST</dt><dd className="text-right text-bone">{rupees(fee.gst)}</dd>
              <dt className="text-dust">Total</dt><dd className="text-right text-gold">{rupees(fee.total)}</dd>
            </dl>
            <div className="mt-6">
              {app.payment_status === "paid" || paid ? (
                <p className="t-ui text-sand">Paid{paid?.paid_at ? ` on ${formatDateTimeIST(paid.paid_at)}` : ""}. Invoice {paid?.invoice_number ?? "being issued"}.</p>
              ) : app.payment_status === "pending" ? (
                razorpayConfigured() ? <PayButton applicationId={app.id} amountPaise={fee.total} /> : <p className="t-ui text-sm text-dust">Online payment is not switched on yet. The academy will contact you about the fee.</p>
              ) : null}
            </div>
          </Panel>
        )}

        <Panel title="History" id="history-h">
          <ol className="flex flex-col gap-4">
            <li className="t-ui text-sm text-dust">Started {formatDateTimeIST(app.created_at)}</li>
            {events.map((e) => (
              <li key={e.id} className="t-ui text-sm">
                <span className="text-bone">{STATUS_INFO[e.to_status].label}</span> <span className="text-dust">· {formatDateTimeIST(e.created_at)}</span>
                {e.note && e.to_status !== "info_required" && <span className="mt-1 block text-sand">{e.note}</span>}
              </li>
            ))}
          </ol>
        </Panel>

        {isWithdrawable(app.status) && (
          <form action={withdrawApplication} className="border-t border-line pt-8">
            <input type="hidden" name="application_id" value={app.id} />
            <button className="label text-dust hover:text-blood">Withdraw this application</button>
          </form>
        )}
      </div>
    </RegistrationFrame>
  );
}
