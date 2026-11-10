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
    <form action={action} className="flex flex-wrap items-center gap-2" aria-busy={pending}>
      <input type="hidden" name="profile" value={profile} />
      {OFFERS[status].map((o) => (
        <button
          key={o.status}
          name="status"
          value={o.status}
          disabled={pending}
          aria-label={`${o.label} ${name}`}
          className={
            o.status === "active"
              ? "inline-flex items-center justify-center rounded-xl bg-[#E8FF1F] px-3.5 py-1.5 text-xs font-semibold text-[#0b0b0c] shadow-sm shadow-[#E8FF1F]/20 hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-60"
              : "inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80 hover:border-white/25 hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-60"
          }
        >
          {o.label}
        </button>
      ))}
      {state?.error && <span role="alert" className="text-xs font-medium text-red-400">{state.error}</span>}
      {state?.notice && <span role="status" className="text-xs font-medium text-[#E8FF1F]">{state.notice}</span>}
    </form>
  );
}
