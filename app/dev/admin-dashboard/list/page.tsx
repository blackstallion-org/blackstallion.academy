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
    <section data-parallax-skip className="gutter min-h-[80svh] bg-night pb-24 pt-28 md:pt-32">
      <AdminShell name="Preview" current="leads">
        <PageHeading title="Enquiries">Every website enquiry, newest first. Times are India Standard Time. (SAMPLE rows)</PageHeading>
        <FilterForm action="/dev/admin-dashboard/list" label="Filter enquiries" active={false}>
          <TextFilter name="q" label="Search" maxLength={80} className="sm:col-span-2" placeholder="Name, e-mail, phone or organisation" />
          <SelectFilter name="gate" label="Form" options={[{ value: "parents", label: "Parents" }]} anyLabel="Any form" />
          <SelectFilter name="status" label="Status" options={[{ value: "new", label: "New" }]} anyLabel="Any status" />
          <DateFilter name="from" label="Received from" />
        </FilterForm>
        <ResultCount count={128} page={1} shown={3} singular="enquiry" plural="enquiries" filtered={false} />
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {["Meera Rao", "Aarav Mehta", "Diya Rathore"].map((n, i) => (
            <li key={n} className="grid gap-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-8">
              <div className="min-w-0">
                <p className="label flex flex-wrap items-center gap-x-3 gap-y-2 text-brass"><span>Schools</span><span className="text-dust">29 Oct 2026, 3:45 pm IST</span>{i === 0 && <QrBadge code="HYD-ZONE-01" />}</p>
                <p className="t-ui mt-2 text-bone underline decoration-line underline-offset-4">{n} <span className="text-sand">· Sample School</span></p>
                <p className="t-ui text-sm text-sand">sample@example.test · +91 00000 00000</p>
              </div>
              <span className="label border border-line px-4 py-3 text-bone">Status: New</span>
            </li>
          ))}
        </ul>
        <TableRegion label="Sample wide table" minWidth="min-w-[46rem]">
          <table className="w-full">
            <thead><tr><th className={th}>Hub</th><th className={th}>Source</th><th className={th}>Captured</th><th className={th}>Enrolled</th><th className={th}>When</th></tr></thead>
            <tbody>{["hyderabad-zone-01", "jaipur-central", "pune-east"].map((h) => <tr key={h} className="border-t border-line"><td className={td}>{h}</td><td className={td}>website-qr</td><td className={td}>64</td><td className={td}>11</td><td className={td}>29 Oct 2026</td></tr>)}</tbody>
          </table>
        </TableRegion>
        <Pagination page={1} pages={3} hrefFor={() => "#"} />
      </AdminShell>
    </section>
  );
}
