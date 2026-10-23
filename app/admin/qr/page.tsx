import Link from "next/link";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/admin";
import { QR_SOURCES } from "@/lib/admin/constants";
import { applyQrFilters, hasFilters, isPastLastPage, listHref, pageWindow, parseQrFilters, totalPages, type QrFilters } from "@/lib/admin/filters";
import { NO_HUB, formatDateTimeIST, summariseByHub, type HubCount } from "@/lib/admin/present";
import { logAdminError } from "@/lib/admin/server";
import { AdminNav } from "../AdminNav";
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
    <div>
      <AdminNav name={profile.display_name} current="qr" />
      <PageHeading title="QR captures">
        Parent leads captured from hub QR codes, flyers and the website (operations table), newest first. Read-only here. Times are India Standard Time.
      </PageHeading>
      <QrFilterForm filters={filters} active={filtered} hubs={hubOptions} sources={sourceOptions} />
      <FilterNotes issues={issues} />

      <HubSummary summary={summary} sampled={sampleRows.length} failed={!!sample.error} filters={criteria} />

      <section aria-labelledby="captures-h" className="mt-12">
        <h2 id="captures-h" className="label text-brass">Captures</h2>
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
                  <tr className="border-b border-line">
                    <th scope="col" className={th}>Received</th>
                    <th scope="col" className={th}>Hub</th>
                    <th scope="col" className={th}>Parent</th>
                    <th scope="col" className={th}>Phone</th>
                    <th scope="col" className={th}>Grade</th>
                    <th scope="col" className={th}>Source</th>
                    <th scope="col" className={th}>Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className={`${td} whitespace-nowrap`}><time dateTime={r.created_at ?? undefined}>{formatDateTimeIST(r.created_at)}</time></td>
                      <td className={`${td} font-mono whitespace-nowrap text-xs text-bone`}>{r.hub_slug}</td>
                      <td className={`${td} text-bone`}>{r.parent_name || "—"}</td>
                      <td className={`${td} whitespace-nowrap`}>{r.parent_phone || "—"}</td>
                      <td className={td}>{r.student_grade || "—"}</td>
                      <td className={`${td} font-mono text-xs`}>{r.source || "—"}</td>
                      <td className={td}>{r.converted_to_enrollment ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableRegion>
            <Pagination page={page} pages={totalPages(total)} hrefFor={href} />
          </>
        )}
      </section>
    </div>
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
    <section aria-labelledby="hubs-h" className="mt-10">
      <h2 id="hubs-h" className="label text-brass">Captures per hub</h2>
      {!failed && sampled > 0 && (
        <p className="t-ui mt-2 max-w-3xl text-xs text-dust">
          Based on the latest {sampled.toLocaleString("en-IN")} capture{sampled === 1 ? "" : "s"}
          {narrowed ? " for the chosen source and dates" : ""}. This summary reads at most {SUMMARY_SAMPLE.toLocaleString("en-IN")} rows
          {sampled >= SUMMARY_SAMPLE ? ", so older captures are left out" : ""}, and the hub filter does not narrow it.
        </p>
      )}
      {failed ? (
        <LoadError>The per-hub summary could not be loaded.</LoadError>
      ) : !summary.length ? (
        <p className="t-ui mt-3 text-sm text-dust">No captures to count.</p>
      ) : (
        <TableRegion label="Captures per hub" minWidth="min-w-[20rem]" className="max-w-2xl">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className={th}>Hub</th>
                <th scope="col" className={`${th} text-right`}>Captures</th>
                <th scope="col" className={`${th} text-right`}>Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {summary.map((h) => (
                <tr key={h.hub}>
                  <th scope="row" className={`${td} text-left font-normal`}>
                    {h.hub === NO_HUB ? (
                      <span className="text-dust">{h.hub}</span>
                    ) : (
                      <Link href={listHref("/admin/qr", { ...filters, hub: h.hub })} className="font-mono whitespace-nowrap text-xs text-bone underline decoration-line underline-offset-4 hover:text-gold">{h.hub}</Link>
                    )}
                  </th>
                  <td className={`${td} font-mono text-right text-bone`}>{h.captures.toLocaleString("en-IN")}</td>
                  <td className={`${td} font-mono text-right`}>{h.converted.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
      )}
    </section>
  );
}
