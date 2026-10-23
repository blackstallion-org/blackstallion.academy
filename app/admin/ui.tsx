import Link from "next/link";
import type { ReactNode } from "react";
import { PAGE_SIZE } from "@/lib/admin/constants";
import { cn } from "@/lib/utils";

/** Shared, server-rendered building blocks for the staff console lists (no client JavaScript needed). */

export function PageHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="mt-8">
      <h1 className="t-voice text-[clamp(1.8rem,4vw,3rem)] leading-tight text-bone">{title}</h1>
      {children && <div className="t-ui mt-2 max-w-3xl text-sm text-dust">{children}</div>}
    </header>
  );
}

/** A plain GET form: works without JavaScript, and the URL it produces can be bookmarked or shared with staff. */
export function FilterForm({ action, label, active, children }: { action: string; label: string; active: boolean; children: ReactNode }) {
  return (
    <form method="get" action={action} role="search" aria-label={label} className="mt-8 border-y border-line py-6">
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-6">{children}</div>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button type="submit" className="label bg-gold px-5 py-3 text-night hover:bg-bone">Apply filters</button>
        {active && <Link href={action} className="label py-2 text-gold hover:text-bone">Clear filters</Link>}
      </div>
    </form>
  );
}

type FieldProps = { name: string; label: string; className?: string };

export function TextFilter({ name, label, defaultValue, placeholder, maxLength, list, hint, className }: FieldProps & { defaultValue?: string; placeholder?: string; maxLength?: number; list?: string; hint?: string }) {
  const hintId = hint ? `filter-${name}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="flex flex-col gap-1">
        <span className="label text-dust">{label}</span>
        <input type="search" name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} maxLength={maxLength} list={list} autoComplete="off" spellCheck={false} aria-describedby={hintId} className="field" />
      </label>
      {hint && <p id={hintId} className="t-ui text-xs text-dust">{hint}</p>}
    </div>
  );
}

export function SelectFilter({ name, label, options, defaultValue, anyLabel = "Any", className }: FieldProps & { options: readonly { value: string; label: string }[]; defaultValue?: string; anyLabel?: string }) {
  // A value that came from the URL but is not one of the usual options still shows as selected.
  const all = defaultValue && !options.some((o) => o.value === defaultValue) ? [...options, { value: defaultValue, label: defaultValue }] : options;
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="label text-dust">{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className="field">
        <option value="">{anyLabel}</option>
        {all.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function DateFilter({ name, label, defaultValue, className }: FieldProps & { defaultValue?: string }) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="label text-dust">{label}</span>
      <input type="date" name={name} defaultValue={defaultValue ?? ""} className="field" />
    </label>
  );
}

/** Honest feedback when part of the URL could not be used as a filter. */
export function FilterNotes({ issues }: { issues: readonly string[] }) {
  if (!issues.length) return null;
  return (
    <div role="status" className="mt-4 border-l-2 border-brass pl-4">
      <p className="label text-brass">Filters adjusted</p>
      <ul className="t-ui mt-1 text-sm text-sand">
        {issues.map((issue) => <li key={issue}>{issue}</li>)}
      </ul>
    </div>
  );
}

export function ResultCount({ count, page, shown, singular, plural, filtered }: { count: number; page: number; shown: number; singular: string; plural: string; filtered: boolean }) {
  const first = (page - 1) * PAGE_SIZE + 1;
  return (
    <p className="t-ui mt-6 text-sm text-sand">
      <span className="font-mono text-bone">{count.toLocaleString("en-IN")}</span> {count === 1 ? singular : plural}
      {filtered ? (count === 1 ? " matches these filters" : " match these filters") : ""}
      {shown > 0 && count > shown && <> · showing <span className="font-mono">{first}–{first + shown - 1}</span></>}
    </p>
  );
}

export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (page: number) => string }) {
  if (pages <= 1) return null;
  const link = "label inline-block border border-line px-4 py-2 text-bone hover:border-gold hover:text-gold";
  const off = "label inline-block border border-line px-4 py-2 text-dust opacity-50";
  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-between gap-4">
      {page > 1 ? <Link href={hrefFor(page - 1)} rel="prev" className={link}>← Previous<span className="sr-only"> page</span></Link> : <span aria-hidden="true" className={off}>← Previous</span>}
      <p className="t-ui text-sm text-dust">Page <span className="font-mono">{page}</span> of <span className="font-mono">{pages}</span></p>
      {page < pages ? <Link href={hrefFor(page + 1)} rel="next" className={link}>Next<span className="sr-only"> page</span> →</Link> : <span aria-hidden="true" className={off}>Next →</span>}
    </nav>
  );
}

export function LoadError({ children }: { children: ReactNode }) {
  return <p role="alert" className="t-ui mt-6 text-blood">{children}</p>;
}

export function EmptyState({ children, clearHref }: { children: ReactNode; clearHref?: string }) {
  return (
    <div className="mt-6">
      <p className="t-ui text-sand">{children}</p>
      {clearHref && <Link href={clearHref} className="label mt-3 inline-block py-2 text-gold hover:text-bone">Clear filters</Link>}
    </div>
  );
}

export function PastLastPage({ firstHref }: { firstHref: string }) {
  return (
    <div className="mt-6">
      <p className="t-ui text-sand">This page is past the end of the list.</p>
      <Link href={firstHref} className="label mt-3 inline-block py-2 text-gold hover:text-bone">Go to the first page</Link>
    </div>
  );
}

/** An enquiry that arrived through a QR code, with the code itself. */
export function QrBadge({ code }: { code: string }) {
  return (
    <span className="label inline-flex max-w-full items-center gap-1.5 border border-brass px-1.5 py-0.5 text-brass">
      QR <span className="font-mono break-all normal-case tracking-normal">{code}</span>
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="label inline-block border border-line px-2 py-0.5 text-gold">{children}</span>;
}

export type FieldItem = { key: string; label: string; value: ReactNode; mono?: boolean };

/** Label/value rows; values are text (React escapes them), wrapped so long e-mails or JSON never widen the page. */
export function Fields({ items, empty }: { items: readonly FieldItem[]; empty?: string }) {
  if (!items.length) return empty ? <p className="t-ui mt-3 text-sm text-dust">{empty}</p> : null;
  return (
    <dl className="mt-3 divide-y divide-line border-y border-line">
      {items.map((f) => (
        <div key={f.key} className="grid gap-1 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
          <dt className="label pt-0.5 text-dust">{f.label}</dt>
          <dd className={cn("min-w-0 whitespace-pre-wrap break-words text-bone", f.mono ? "font-mono text-xs" : "t-ui text-sm")}>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A wide table scrolls inside this focusable region on a phone (keyboard users can scroll it too); the page itself
 * never scrolls sideways. The minimum width sits on a block wrapper because browsers do not reliably honour
 * min-width on a <table>. Pass it as a literal class (e.g. "min-w-[46rem]") so Tailwind generates it.
 */
export function TableRegion({ label, minWidth, className, children }: { label: string; minWidth: string; className?: string; children: ReactNode }) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className={cn("mt-4 max-w-full overflow-x-auto border-y border-line", className)}>
      <div className={minWidth}>{children}</div>
    </div>
  );
}

export const th = "label py-3 pr-6 text-left align-bottom text-dust";
export const td = "t-ui py-3 pr-6 align-top text-sm text-sand";
