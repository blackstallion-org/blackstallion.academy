import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/app/admin/AdminShell";
import { DateFilter, FilterForm, PageHeading, Pagination, QrBadge, ResultCount, SelectFilter, TableRegion, TextFilter, th, td } from "@/app/admin/ui";

export const instant = false;
export const metadata: Metadata = { title: "Console list preview (SAMPLE)", robots: { index: false, follow: false }, alternates: { canonical: null } };

/** Development only: an enquiries-style list and a wide table inside the new shell, with invented rows, to check the frame around the existing pages. 404 in production. */
export default function ListPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <section data-parallax-skip className="console min-h-[100svh]">
      <AdminShell name="Preview" current="leads">
        <PageHeading title="Enquiries">Every website enquiry, newest first. Times are India Standard Time. (SAMPLE rows)</PageHeading>
        <FilterForm action="/dev/admin-dashboard/list" label="Filter enquiries" active={false}>
          <TextFilter name="q" label="Search" maxLength={80} className="sm:col-span-2" placeholder="Name, e-mail, phone or organisation" />
          <SelectFilter name="gate" label="Form" options={[{ value: "parents", label: "Parents" }]} anyLabel="Any form" />
          <SelectFilter name="status" label="Status" options={[{ value: "new", label: "New" }]} anyLabel="Any status" />
          <DateFilter name="from" label="Received from" />
        </FilterForm>
        <ResultCount count={128} page={1} shown={3} singular="enquiry" plural="enquiries" filtered={false} />
        <ul className="mt-6 flex flex-col gap-3.5">
          {["Meera Rao", "Aarav Mehta", "Diya Rathore"].map((n, i) => (
            <li key={n} className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-xl shadow-lg transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-8">
              <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
              <div className="relative z-10 min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#E8FF1F]">
                    Schools
                  </span>
                  <span className="font-mono text-xs text-white/45">29 Oct 2026, 3:45 pm IST</span>
                  {i === 0 && <QrBadge code="HYD-ZONE-01" />}
                </div>
                <p className="mt-3 text-base font-semibold text-white">
                  {n} <span className="font-normal text-white/60">· Sample School</span>
                </p>
                <p className="mt-1 text-sm text-white/60">sample@example.test · +91 00000 00000</p>
              </div>
              <div className="relative z-10 shrink-0">
                <span className="inline-flex items-center rounded-xl bg-[#E8FF1F] px-4 py-2 text-xs font-semibold text-[#0b0b0c] shadow-sm">
                  Status: New
                </span>
              </div>
            </li>
          ))}
        </ul>
        <TableRegion label="Sample wide table" minWidth="min-w-[46rem]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className={th}>Hub</th>
                <th className={th}>Source</th>
                <th className={th}>Captured</th>
                <th className={th}>Enrolled</th>
                <th className={th}>When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {["hyderabad-zone-01", "jaipur-central", "pune-east"].map((h) => (
                <tr key={h} className="hover:bg-white/[0.02] transition-colors">
                  <td className={`${td} font-mono text-[#E8FF1F]`}>{h}</td>
                  <td className={td}>website-qr</td>
                  <td className={`${td} font-mono font-semibold text-white`}>64</td>
                  <td className={`${td} font-mono text-white/70`}>11</td>
                  <td className={`${td} font-mono text-white/50`}>29 Oct 2026</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
        <Pagination page={1} pages={3} hrefFor={() => "#"} />
      </AdminShell>
    </section>
  );
}
