"use client";

import { useActionState } from "react";
import { REVIEW_MOVES, STATUS_INFO, type ApplicationKind, type ApplicationStatus } from "@/lib/registration/model";
import { activateAccount, enrolApplication, reviewApplication, type ReviewState } from "./actions";

const btn = "label inline-flex min-h-11 items-center border border-line px-4 py-2 text-bone hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-50";
const Msg = ({ s }: { s: ReviewState }) => (s?.error ? <p role="alert" className="t-ui text-sm text-blood">{s.error}</p> : s?.notice ? <p role="status" className="t-ui text-sm text-gold">{s.notice}</p> : null);

const VERB: Partial<Record<ApplicationStatus, string>> = { under_review: "Start review", info_required: "Ask for information", approved: "Approve", rejected: "Reject" };

/** Review controls: only the moves the database allows from the current status are offered. */
export function ReviewPanel({ id, status, kind, paymentStatus, isSuperAdmin, hubs }: { id: string; status: ApplicationStatus; kind: ApplicationKind; paymentStatus: string; isSuperAdmin: boolean; hubs: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(reviewApplication, null);
  const [enrolState, enrol, enrolling] = useActionState<ReviewState, FormData>(enrolApplication, null);
  const [actState, activate, activating] = useActionState<ReviewState, FormData>(activateAccount, null);
  const moves = REVIEW_MOVES[status] ?? [];
  return (
    <div className="flex flex-col gap-8">
      {moves.length > 0 && (
        <form action={action} className="flex flex-col gap-4" aria-busy={pending}>
          <input type="hidden" name="id" value={id} />
          <label className="flex flex-col gap-1"><span className="label text-dust">Note (sent to the applicant when asking for information; kept internal when starting a review)</span>
            <textarea name="note" rows={3} maxLength={2000} className="field w-full resize-y" />
          </label>
          <div className="flex flex-wrap gap-3">
            {moves.map((m) => <button key={m} name="to" value={m} disabled={pending} className={btn}>{VERB[m] ?? STATUS_INFO[m].label}</button>)}
          </div>
          <Msg s={state} />
        </form>
      )}
      {kind === "cadet" && status === "approved" && (
        <form action={enrol} className="flex flex-col gap-3" aria-busy={enrolling}>
          <input type="hidden" name="id" value={id} />
          <p className="t-ui text-sm text-sand">{paymentStatus === "pending" ? "The enrolment fee is not paid yet; enrolment opens when the payment is verified." : "Ready to enrol: this creates the cadet record and passport code."}</p>
          <div><button disabled={enrolling || paymentStatus === "pending"} className={btn}>Enrol cadet</button></div>
          <Msg s={enrolState} />
        </form>
      )}
      {(kind === "staff" || kind === "school") && status === "approved" && (
        isSuperAdmin ? (
          <form action={activate} className="flex flex-col gap-3" aria-busy={activating}>
            <input type="hidden" name="id" value={id} />
            <div className="flex flex-wrap gap-4">
              <label className="flex flex-col gap-1"><span className="label text-dust">Role</span>
                <select name="role" className="field" defaultValue={kind === "school" ? "SCHOOL_ADMIN" : "INSTRUCTOR"}>
                  {kind === "school" ? <option value="SCHOOL_ADMIN">School admin</option> : <><option value="INSTRUCTOR">Instructor</option><option value="GROOM">Groom</option></>}
                </select>
              </label>
              <label className="flex flex-col gap-1"><span className="label text-dust">Hub</span>
                <select name="hub" className="field" defaultValue="">
                  <option value="">Keep as it is</option>
                  {hubs.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
                </select>
              </label>
            </div>
            <div><button disabled={activating} className={btn}>Activate account</button></div>
            <Msg s={actState} />
          </form>
        ) : <p className="t-ui text-sm text-dust">A SUPER_ADMIN activates approved staff and school accounts.</p>
      )}
    </div>
  );
}
