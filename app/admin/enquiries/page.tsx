import Link from "next/link";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/admin";
import { gateTitle } from "@/lib/email/templates";
import { LEAD_GATES, LEAD_STATUSES } from "@/lib/admin/constants";
import { applyLeadFilters, hasFilters, isPastLastPage, listHref, pageWindow, parseLeadFilters, totalPages, type LeadFilters } from "@/lib/admin/filters";
import { formatDateTimeIST, messageOf, organisationOf, qrCode, staffLabel, statusLabel, utmSummary } from "@/lib/admin/present";
import { logAdminError, staffNames } from "@/lib/admin/server";
import { AdminShell } from "../AdminShell";
import { LeadStatusForm } from "../forms";
import { DateFilter, EmptyState, FilterForm, FilterNotes, LoadError, PageHeading, Pagination, PastLastPage, QrBadge, ResultCount, SelectFilter, TextFilter } from "../ui";

type Lead = {
  id: string; lead_type: string; gate: string | null; status: string; contact_name: string; email: string | null; phone: string | null;
  payload: unknown; attribution: unknown; assigned_to: string | null; created_at: string;
};

const GATE_OPTIONS = LEAD_GATES.map((g) => ({ value: g, label: gateTitle(g) }));
const STATUS_OPTIONS = LEAD_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }));
const SOURCE_OPTIONS = [{ value: "qr", label: "QR code" }, { value: "utm", label: "Campaign link (UTM)" }];

/** Rendered whole per request (see app/admin/layout.tsx), so the list and its forms also work without JavaScript. */
export default async function AdminHome({ searchParams }: PageProps<"/admin/enquiries">) {
  await connection();
  const { supabase, profile, user } = await requireStaff();
  const { filters, issues } = parseLeadFilters(await searchParams);
  const { from, to } = pageWindow(filters.page);
  const { data, error, count } = await applyLeadFilters(
    supabase.from("onboarding_leads").select("id, lead_type, gate, status, contact_name, email, phone, payload, attribution, assigned_to, created_at", { count: "exact" }),
    filters,
  )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);
  if (error && !isPastLastPage(error)) logAdminError("admin.leads_load_failed", error);

  const leads = (data ?? []) as Lead[];
  const names = await staffNames(supabase, leads.map((l) => l.assigned_to));
  const total = count ?? leads.length;
  const filtered = hasFilters(filters);
  const { page, ...criteria } = filters;
  const href = (p: number) => listHref("/admin/enquiries", criteria, p);

  return (
    <AdminShell name={profile.display_name} current="leads">
      <PageHeading title="Enquiries">Every website enquiry, newest first. Times are India Standard Time.</PageHeading>
      <LeadFilterForm filters={filters} active={filtered} />
      <FilterNotes issues={issues} />

      {isPastLastPage(error) ? (
        <PastLastPage firstHref={href(1)} />
      ) : error ? (
        <LoadError>Enquiries could not be loaded. Try again shortly.</LoadError>
      ) : !leads.length ? (
        <EmptyState clearHref={filtered ? "/admin/enquiries" : undefined}>{filtered ? "No enquiries match these filters." : "No enquiries yet."}</EmptyState>
      ) : (
        <>
          <ResultCount count={total} page={page} shown={leads.length} singular="enquiry" plural="enquiries" filtered={filtered} />
          <ul className="mt-6 flex flex-col gap-3.5">
            {leads.map((l) => <LeadRow key={l.id} lead={l} currentUserId={user.id} names={names} />)}
          </ul>
          <Pagination page={page} pages={totalPages(total)} hrefFor={href} />
        </>
      )}
    </AdminShell>
  );
}

function LeadFilterForm({ filters, active }: { filters: LeadFilters; active: boolean }) {
  return (
    <FilterForm action="/admin/enquiries" label="Filter enquiries" active={active}>
      <TextFilter
        name="q" label="Search" defaultValue={filters.q} maxLength={80} className="sm:col-span-2"
        placeholder="Name, e-mail, phone or organisation" hint="Letters, digits, spaces and @ . + - _ only."
      />
      <SelectFilter name="gate" label="Form" options={GATE_OPTIONS} defaultValue={filters.gate} anyLabel="Any form" />
      <SelectFilter name="status" label="Status" options={STATUS_OPTIONS} defaultValue={filters.status} anyLabel="Any status" />
      <SelectFilter name="source" label="Source" options={SOURCE_OPTIONS} defaultValue={filters.source} anyLabel="Any source" />
      <div className="grid grid-cols-2 gap-4 sm:col-span-2 lg:col-span-6 lg:max-w-md">
        <DateFilter name="from" label="Received from" defaultValue={filters.from} />
        <DateFilter name="to" label="Received to" defaultValue={filters.to} />
      </div>
    </FilterForm>
  );
}

function LeadRow({ lead: l, currentUserId, names }: { lead: Lead; currentUserId: string; names: ReadonlyMap<string, string> }) {
  const organisation = organisationOf(l.payload);
  const message = messageOf(l.payload);
  const qr = qrCode(l.attribution);
  const utm = utmSummary(l.attribution);
  const assigned = l.assigned_to ? (l.assigned_to === currentUserId ? "Assigned to you" : `Assigned to ${staffLabel(l.assigned_to, currentUserId, names)}`) : null;
  return (
    <li className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-xl shadow-lg transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-8">
      {/* Rim highlight */}
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
      <div className="relative z-10 min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#E8FF1F]">
            {gateTitle(l.gate ?? "generic")}
          </span>
          <time dateTime={l.created_at} className="font-mono text-xs text-white/45">{formatDateTimeIST(l.created_at)}</time>
          {qr && <QrBadge code={qr} />}
        </div>
        <p className="mt-3 text-base font-semibold text-white">
          <Link href={`/admin/leads/${l.id}`} className="hover:text-[#E8FF1F] transition-colors">{l.contact_name}</Link>
          {organisation && <span className="font-normal text-white/60"> · {organisation}</span>}
        </p>
        <p className="mt-1 text-sm text-white/60">{[l.email, l.phone].filter(Boolean).join(" · ") || "No direct contact provided"}</p>
        {message && (
          <p className="mt-2.5 line-clamp-2 max-w-3xl rounded-xl border border-white/5 bg-black/30 p-3 text-xs leading-relaxed text-white/70">
            {message}
          </p>
        )}
        {(utm || assigned) && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/45">
            {assigned && <span className="font-medium text-[#E8FF1F]">{assigned}</span>}
            {utm && <span className="font-mono text-white/40">{utm}</span>}
          </div>
        )}
      </div>
      <div className="relative z-10 shrink-0">
        <LeadStatusForm id={l.id} status={l.status} contactName={l.contact_name} compact />
      </div>
    </li>
  );
}
