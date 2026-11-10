import { connection } from "next/server";
import { KINDS, MEMBER_KINDS, MEMBER_STATUSES, STATUS_LABEL, isMemberKind, type MemberKind, type MemberStatus } from "@/lib/accounts/kinds";
import { MEMBER_COLUMNS, toMember, type Member } from "@/lib/accounts/server";
import { formatDateTimeIST } from "@/lib/admin/present";
import { logAdminError } from "@/lib/admin/server";
import { requireStaff } from "@/lib/auth/admin";
import { AdminShell } from "../AdminShell";
import { EmptyState, FilterForm, LoadError, PageHeading, SelectFilter, Tag, TableRegion, td, th } from "../ui";
import { ReviewButtons } from "./ReviewButtons";

const LIST_LIMIT = 200;
const isStatus = (v: unknown): v is MemberStatus => typeof v === "string" && (MEMBER_STATUSES as readonly string[]).includes(v);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Who has created an account: counts by kind, a filterable list, and approve / hold for each. Read under RLS (staff only);
 * the review buttons call a database function that checks the role again and writes the audit row.
 */
export default async function AccountsPage({ searchParams }: PageProps<"/admin/accounts">) {
  await connection();
  const { supabase, profile } = await requireStaff();
  const sp = await searchParams;
  const kindParam = one(sp.kind);
  const statusParam = one(sp.status);
  const kind = isMemberKind(kindParam) ? kindParam : undefined;
  const status = isStatus(statusParam) ? statusParam : undefined;

  let list = supabase.from("member_accounts").select(MEMBER_COLUMNS, { count: "exact" }).order("created_at", { ascending: false }).limit(LIST_LIMIT);
  if (kind) list = list.eq("kind", kind);
  if (status) list = list.eq("status", status);
  const [rowsRes, tallyRes] = await Promise.all([list, supabase.from("member_accounts").select("kind, status").limit(5000)]);
  if (rowsRes.error) logAdminError("admin.accounts_load_failed", rowsRes.error);
  const rows = (rowsRes.data ?? []).map(toMember).filter((m): m is Member => m !== null);
  const total = rowsRes.count ?? rows.length;

  const tally = new Map<string, { all: number; pending: number }>();
  for (const k of MEMBER_KINDS) tally.set(k, { all: 0, pending: 0 });
  for (const r of (tallyRes.data ?? []) as { kind: string; status: string }[]) {
    const t = tally.get(r.kind);
    if (t) {
      t.all += 1;
      if (r.status === "pending") t.pending += 1;
    }
  }
  const filtered = Boolean(kind || status);

  return (
    <AdminShell name={profile.display_name} current="accounts">
      <PageHeading title="Accounts">
        People who created an account from the sign-in page: students, parents, teachers and schools. Students and parents are active at once; teachers and
        schools wait here for approval. Every approval or hold is written to the audit log. Times are India Standard Time.
      </PageHeading>

      <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4" aria-label="Accounts by kind">
        {MEMBER_KINDS.map((k) => {
          const pending = tally.get(k)?.pending ?? 0;
          return (
            <li
              key={k}
              className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{KINDS[k].label}s</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-white">{tally.get(k)?.all ?? 0}</p>
                </div>
                <div className="mt-3">
                  {pending > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8FF1F]/15 border border-[#E8FF1F]/30 px-2.5 py-0.5 text-xs font-semibold text-[#E8FF1F]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E8FF1F] shadow-[0_0_6px_#E8FF1F]" />
                      {pending} awaiting review
                    </span>
                  ) : (
                    <span className="text-xs text-white/40">all reviewed</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <FilterForm action="/admin/accounts" label="Filter accounts" active={filtered}>
        <SelectFilter name="kind" label="Kind" defaultValue={kind} options={MEMBER_KINDS.map((k: MemberKind) => ({ value: k, label: KINDS[k].label }))} />
        <SelectFilter name="status" label="Status" defaultValue={status} options={MEMBER_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))} />
      </FilterForm>

      {rowsRes.error ? (
        <LoadError>Accounts could not be loaded. If the member-accounts migration has not been applied to this database yet, that is why.</LoadError>
      ) : !rows.length ? (
        <EmptyState clearHref={filtered ? "/admin/accounts" : undefined}>{filtered ? "No accounts match these filters." : "No accounts yet."}</EmptyState>
      ) : (
        <>
          <p className="mt-6 text-sm text-white/60" role="status">
            {total > rows.length ? `Showing the newest ${rows.length} of ${total} accounts.` : `${total} ${total === 1 ? "account" : "accounts"}${filtered ? " match." : "."}`}
          </p>
          <TableRegion label="Accounts (scrolls sideways on small screens)" minWidth="min-w-[56rem]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th scope="col" className={th}>Created</th>
                  <th scope="col" className={th}>Name</th>
                  <th scope="col" className={th}>Kind</th>
                  <th scope="col" className={th}>Details</th>
                  <th scope="col" className={th}>Status</th>
                  <th scope="col" className={th}>Review</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.profile_id} className="border-b border-white/5 align-top hover:bg-white/[0.02] transition-colors">
                    <td className={td}><time dateTime={m.created_at} className="font-mono text-xs text-white/50">{formatDateTimeIST(m.created_at)}</time></td>
                    <td className={td}><span className="font-semibold text-white">{m.full_name}</span><br /><span className="break-all text-xs text-white/45">{m.email ?? "no e-mail"}</span></td>
                    <td className={td}><Tag>{KINDS[m.kind].label}</Tag></td>
                    <td className={td}>
                      <span className="text-white/70">{[m.organisation, m.city, m.phone].filter(Boolean).join(" · ") || "none given"}</span>
                      {Object.entries(m.details).map(([k, v]) => <span key={k} className="mt-1 block break-words text-xs text-white/45"><span className="uppercase tracking-wide text-white/30">{k.replace(/_/g, " ")}:</span> {v}</span>)}
                    </td>
                    <td className={td}><span className={m.status === "active" ? "font-semibold text-[#E8FF1F]" : m.status === "suspended" ? "text-red-400" : "text-white/60"}>{STATUS_LABEL[m.status]}</span></td>
                    <td className={td}><ReviewButtons profile={m.profile_id} status={m.status} name={m.full_name} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableRegion>
        </>
      )}
    </AdminShell>
  );
}
