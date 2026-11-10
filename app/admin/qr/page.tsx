import Link from "next/link";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/admin";
import { QR_SOURCES } from "@/lib/admin/constants";
import { applyQrFilters, hasFilters, isPastLastPage, listHref, pageWindow, parseQrFilters, totalPages, type QrFilters } from "@/lib/admin/filters";
import { NO_HUB, formatDateTimeIST, summariseByHub, type HubCount } from "@/lib/admin/present";
import { logAdminError } from "@/lib/admin/server";
import { AdminShell } from "../AdminShell";
import { DateFilter, EmptyState, FilterForm, FilterNotes, LoadError, PageHeading, Pagination, PastLastPage, ResultCount, TableRegion, TextFilter, td, th } from "../ui";

type CaptureRow = {
  id: string; hub_slug: string; parent_name: string | null; parent_phone: string | null; student_grade: string | null;
  source: string | null; converted_to_enrollment: boolean | null; created_at: string | null;
};

/** The per-hub summary is counted in JavaScript from at most this many of the latest captures (no SQL aggregate). */
const SUMMARY_SAMPLE = 1000;

/** Read-only view of the operations table (SUPER_ADMIN select policy; there is no update policy for the website). */
export default async function QrPage({ searchParams }: PageProps<"/admin/qr">) {
  await connection();
  const { supabase, profile } = await requireStaff();
  const { filters, issues } = parseQrFilters(await searchParams);
  const { from, to } = pageWindow(filters.page);
  // device_info and ip_address are deliberately not selected: staff do not need them to follow up a capture.
  const [list, sample] = await Promise.all([
    applyQrFilters(
      supabase.from("qr_lead_captures").select("id, hub_slug, parent_name, parent_phone, student_grade, source, converted_to_enrollment, created_at", { count: "exact" }),
      filters,
    )
      .order("created_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .range(from, to),
    applyQrFilters(supabase.from("qr_lead_captures").select("hub_slug, source, converted_to_enrollment"), filters, { includeHub: false })
      .order("created_at", { ascending: false, nullsFirst: false })
      .limit(SUMMARY_SAMPLE),
  ]);
  if (list.error && !isPastLastPage(list.error)) logAdminError("admin.qr_load_failed", list.error);
  if (sample.error) logAdminError("admin.qr_summary_failed", sample.error);

  const rows = (list.data ?? []) as CaptureRow[];
  const sampleRows = (sample.data ?? []) as Pick<CaptureRow, "hub_slug" | "source" | "converted_to_enrollment">[];
  const summary = summariseByHub(sampleRows);
  const hubOptions = summary.map((h) => h.hub).filter((h) => h !== NO_HUB);
  const sourceOptions = [...new Set([...QR_SOURCES, ...sampleRows.map((r) => r.source).filter((s): s is string => !!s)])];

  const total = list.count ?? rows.length;
  const filtered = hasFilters(filters);
  const { page, ...criteria } = filters;
  const href = (p: number) => listHref("/admin/qr", criteria, p);

  return (
    <AdminShell name={profile.display_name} current="qr">
      <PageHeading title="QR captures">
        Parent leads captured from hub QR codes, flyers and the website (operations table), newest first. Read-only here. Times are India Standard Time.
      </PageHeading>
      <QrFilterForm filters={filters} active={filtered} hubs={hubOptions} sources={sourceOptions} />
      <FilterNotes issues={issues} />

      <HubSummary summary={summary} sampled={sampleRows.length} failed={!!sample.error} filters={criteria} />

      <section aria-labelledby="captures-h" className="mt-12">
        <div className="flex items-center gap-2">
          <h2 id="captures-h" className="text-sm font-bold uppercase tracking-wider text-[#E8FF1F]">Captures</h2>
          <span className="h-1.5 w-1.5 rounded-full bg-[#E8FF1F] shadow-[0_0_8px_#E8FF1F]" />
        </div>
        {isPastLastPage(list.error) ? (
          <PastLastPage firstHref={href(1)} />
        ) : list.error ? (
          <LoadError>QR captures could not be loaded. Try again shortly.</LoadError>
        ) : !rows.length ? (
          <EmptyState clearHref={filtered ? "/admin/qr" : undefined}>{filtered ? "No captures match these filters." : "No captures yet."}</EmptyState>
        ) : (
          <>
            <ResultCount count={total} page={page} shown={rows.length} singular="capture" plural="captures" filtered={filtered} />
            <TableRegion label="QR captures (scrolls sideways on small screens)" minWidth="min-w-[54rem]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th scope="col" className={th}>Received</th>
                    <th scope="col" className={th}>Hub</th>
                    <th scope="col" className={th}>Parent</th>
                    <th scope="col" className={th}>Phone</th>
                    <th scope="col" className={th}>Grade</th>
                    <th scope="col" className={th}>Source</th>
                    <th scope="col" className={th}>Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className={`${td} whitespace-nowrap`}><time dateTime={r.created_at ?? undefined} className="font-mono text-xs text-white/50">{formatDateTimeIST(r.created_at)}</time></td>
                      <td className={`${td} font-mono whitespace-nowrap text-xs text-[#E8FF1F]`}>{r.hub_slug}</td>
                      <td className={`${td} font-semibold text-white`}>{r.parent_name || "—"}</td>
                      <td className={`${td} whitespace-nowrap text-white/70`}>{r.parent_phone || "—"}</td>
                      <td className={`${td} text-white/80`}>{r.student_grade || "—"}</td>
                      <td className={`${td} font-mono text-xs text-white/50`}>{r.source || "—"}</td>
                      <td className={td}>
                        {r.converted_to_enrollment ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#E8FF1F]">Yes</span>
                        ) : (
                          <span className="text-xs text-white/40">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableRegion>
            <Pagination page={page} pages={totalPages(total)} hrefFor={href} />
          </>
        )}
      </section>
    </AdminShell>
  );
}

function QrFilterForm({ filters, active, hubs, sources }: { filters: QrFilters; active: boolean; hubs: string[]; sources: string[] }) {
  return (
    <FilterForm action="/admin/qr" label="Filter QR captures" active={active}>
      <TextFilter name="hub" label="Hub code" defaultValue={filters.hub} maxLength={100} list="qr-hubs" placeholder="Exact hub code" className="sm:col-span-2" />
      <TextFilter name="source" label="Source" defaultValue={filters.source} maxLength={100} list="qr-sources" placeholder="e.g. website-qr" className="sm:col-span-2" />
      <div className="grid grid-cols-2 gap-4 sm:col-span-2">
        <DateFilter name="from" label="Captured from" defaultValue={filters.from} />
        <DateFilter name="to" label="Captured to" defaultValue={filters.to} />
      </div>
      <datalist id="qr-hubs">{hubs.map((h) => <option key={h} value={h} />)}</datalist>
      <datalist id="qr-sources">{sources.map((s) => <option key={s} value={s} />)}</datalist>
    </FilterForm>
  );
}

function HubSummary({ summary, sampled, failed, filters }: { summary: HubCount[]; sampled: number; failed: boolean; filters: Omit<QrFilters, "page"> }) {
  const narrowed = Boolean(filters.source || filters.from || filters.to);
  return (
    <section aria-labelledby="hubs-h" className="mt-8">
      <div className="flex items-center gap-2">
        <h2 id="hubs-h" className="text-sm font-bold uppercase tracking-wider text-[#E8FF1F]">Captures per hub</h2>
        <span className="h-1.5 w-1.5 rounded-full bg-[#E8FF1F] shadow-[0_0_8px_#E8FF1F]" />
      </div>
      {!failed && sampled > 0 && (
        <p className="mt-2 max-w-3xl text-xs text-white/50">
          Based on the latest {sampled.toLocaleString("en-IN")} capture{sampled === 1 ? "" : "s"}
          {narrowed ? " for the chosen source and dates" : ""}. This summary reads at most {SUMMARY_SAMPLE.toLocaleString("en-IN")} rows
          {sampled >= SUMMARY_SAMPLE ? ", so older captures are left out" : ""}, and the hub filter does not narrow it.
        </p>
      )}
      {failed ? (
        <LoadError>The per-hub summary could not be loaded.</LoadError>
      ) : !summary.length ? (
        <p className="mt-3 text-sm text-white/40">No captures to count.</p>
      ) : (
        <TableRegion label="Captures per hub" minWidth="min-w-[20rem]" className="max-w-2xl">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th scope="col" className={th}>Hub</th>
                <th scope="col" className={`${th} text-right`}>Captures</th>
                <th scope="col" className={`${th} text-right`}>Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {summary.map((h) => (
                <tr key={h.hub} className="hover:bg-white/[0.02] transition-colors">
                  <th scope="row" className={`${td} text-left font-normal`}>
                    {h.hub === NO_HUB ? (
                      <span className="text-white/40">{h.hub}</span>
                    ) : (
                      <Link href={listHref("/admin/qr", { ...filters, hub: h.hub })} className="font-mono whitespace-nowrap text-xs text-[#E8FF1F] underline decoration-white/20 underline-offset-4 hover:decoration-[#E8FF1F]">{h.hub}</Link>
                    )}
                  </th>
                  <td className={`${td} font-mono text-right text-white font-semibold`}>{h.captures.toLocaleString("en-IN")}</td>
                  <td className={`${td} font-mono text-right text-white/70`}>{h.converted.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
      )}
    </section>
  );
}
