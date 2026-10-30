"use client";

import { useActionState } from "react";
import type { MemberStatus } from "@/lib/accounts/kinds";
import { reviewMemberAccount, type ReviewState } from "./actions";

/** The next steps for an account: a pending one can be approved or held; an active one held; a held one reopened. */
const OFFERS: Record<MemberStatus, readonly { status: MemberStatus; label: string }[]> = {
  pending: [{ status: "active", label: "Approve" }, { status: "suspended", label: "Hold" }],
  active: [{ status: "suspended", label: "Hold" }],
  suspended: [{ status: "active", label: "Reactivate" }],
};

export function ReviewButtons({ profile, status, name }: { profile: string; status: MemberStatus; name: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(reviewMemberAccount, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-busy={pending}>
      <input type="hidden" name="profile" value={profile} />
      {OFFERS[status].map((o) => (
        <button key={o.status} name="status" value={o.status} disabled={pending} aria-label={`${o.label} ${name}`} className={o.status === "active" ? "label bg-gold px-3 py-2 text-night hover:bg-bone disabled:opacity-60" : "label border border-line px-3 py-2 text-bone hover:border-gold hover:text-gold disabled:opacity-60"}>{o.label}</button>
      ))}
      {state?.error && <span role="alert" className="t-ui text-xs text-blood">{state.error}</span>}
      {state?.notice && <span role="status" className="t-ui text-xs text-gold">{state.notice}</span>}
    </form>
  );
}
