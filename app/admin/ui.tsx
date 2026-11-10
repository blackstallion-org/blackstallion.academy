import Link from "next/link";
import type { ReactNode } from "react";
import { PAGE_SIZE } from "@/lib/admin/constants";
import { cn } from "@/lib/utils";

/** Shared, server-rendered building blocks for the staff console lists (Finance Bento pro dark aesthetic). */

export function PageHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="mt-8 mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{title}</h1>
        <span className="h-2 w-2 rounded-full bg-[#E8FF1F] shadow-[0_0_10px_#E8FF1F]" aria-hidden />
      </div>
      {children && <div className="mt-2 max-w-3xl text-sm leading-relaxed text-white/60">{children}</div>}
    </header>
  );
}

/** A plain GET form inside a 28px rounded Finance Bento glass card with rim highlight. */
export function FilterForm({ action, label, active, children }: { action: string; label: string; active: boolean; children: ReactNode }) {
  return (
    <form
      method="get"
      action={action}
      role="search"
      aria-label={label}
      className="relative mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-xl shadow-2xl"
    >
      {/* Rim highlight */}
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
      <div className="relative z-10 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-6">{children}</div>
      <div className="relative z-10 mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-[#E8FF1F] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0b0b0c] shadow-md shadow-[#E8FF1F]/20 transition-all hover:brightness-105 active:scale-[0.98]"
        >
          Apply filters
        </button>
        {active && (
          <Link
            href={action}
            className="inline-flex items-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
          >
            Clear filters
          </Link>
        )}
      </div>
    </form>
  );
}

type FieldProps = { name: string; label: string; className?: string };

export function TextFilter({ name, label, defaultValue, placeholder, maxLength, list, hint, className }: FieldProps & { defaultValue?: string; placeholder?: string; maxLength?: number; list?: string; hint?: string }) {
  const hintId = hint ? `filter-${name}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{label}</span>
        <input
          type="search"
          name={name}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          maxLength={maxLength}
          list={list}
          autoComplete="off"
          spellCheck={false}
          aria-describedby={hintId}
          className="field"
        />
      </label>
      {hint && <p id={hintId} className="text-xs text-white/40">{hint}</p>}
    </div>
  );
}

export function SelectFilter({ name, label, options, defaultValue, anyLabel = "Any", className }: FieldProps & { options: readonly { value: string; label: string }[]; defaultValue?: string; anyLabel?: string }) {
  const all = defaultValue && !options.some((o) => o.value === defaultValue) ? [...options, { value: defaultValue, label: defaultValue }] : options;
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className="field">
        <option value="">{anyLabel}</option>
        {all.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function DateFilter({ name, label, defaultValue, className }: FieldProps & { defaultValue?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{label}</span>
      <input type="date" name={name} defaultValue={defaultValue ?? ""} className="field" />
    </label>
  );
}

/** Honest feedback when part of the URL could not be used as a filter. */
export function FilterNotes({ issues }: { issues: readonly string[] }) {
  if (!issues.length) return null;
  return (
    <div role="status" className="mt-4 rounded-2xl border border-[#E8FF1F]/30 bg-[#E8FF1F]/10 p-4 backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#E8FF1F]">Filters adjusted</p>
      <ul className="mt-1 space-y-1 text-sm text-white/80">
        {issues.map((issue) => <li key={issue}>{issue}</li>)}
      </ul>
    </div>
  );
}

export function ResultCount({ count, page, shown, singular, plural, filtered }: { count: number; page: number; shown: number; singular: string; plural: string; filtered: boolean }) {
  const first = (page - 1) * PAGE_SIZE + 1;
  return (
    <p className="mt-6 text-sm text-white/60">
      <span className="font-mono font-semibold text-[#E8FF1F]">{count.toLocaleString("en-IN")}</span> {count === 1 ? singular : plural}
      {filtered ? (count === 1 ? " matches these filters" : " match these filters") : ""}
      {shown > 0 && count > shown && <> · showing <span className="font-mono text-white">{first}–{first + shown - 1}</span></>}
    </p>
  );
}

export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (page: number) => string }) {
  if (pages <= 1) return null;
  const link = "inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition-all hover:border-[#E8FF1F] hover:text-[#E8FF1F] hover:bg-white/[0.08]";
  const off = "inline-flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2 text-xs text-white/30 opacity-50 cursor-not-allowed";
  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-between gap-4">
      {page > 1 ? <Link href={hrefFor(page - 1)} rel="prev" className={link}>← Previous<span className="sr-only"> page</span></Link> : <span aria-hidden="true" className={off}>← Previous</span>}
      <p className="text-sm text-white/60">Page <span className="font-mono font-semibold text-[#E8FF1F]">{page}</span> of <span className="font-mono text-white">{pages}</span></p>
      {page < pages ? <Link href={hrefFor(page + 1)} rel="next" className={link}>Next<span className="sr-only"> page</span> →</Link> : <span aria-hidden="true" className={off}>Next →</span>}
    </nav>
  );
}

export function LoadError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="mt-6 rounded-[28px] border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300 backdrop-blur-xl">
      {children}
    </div>
  );
}

export function EmptyState({ children, clearHref }: { children: ReactNode; clearHref?: string }) {
  return (
    <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-center text-white/60 backdrop-blur-xl shadow-xl">
      <p className="text-base text-white/70">{children}</p>
      {clearHref && (
        <Link href={clearHref} className="mt-4 inline-flex items-center rounded-xl bg-white/[0.06] border border-white/12 px-4 py-2 text-xs font-medium text-[#E8FF1F] hover:bg-white/[0.1] hover:border-[#E8FF1F]/30 transition-all">
          Clear filters
        </Link>
      )}
    </div>
  );
}

export function PastLastPage({ firstHref }: { firstHref: string }) {
  return (
    <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-center text-white/60 backdrop-blur-xl shadow-xl">
      <p className="text-base text-white/70">This page is past the end of the list.</p>
      <Link href={firstHref} className="mt-4 inline-flex items-center rounded-xl bg-[#E8FF1F] px-4 py-2 text-xs font-semibold text-[#0b0b0c] hover:brightness-105 transition-all">
        Go to the first page
      </Link>
    </div>
  );
}

/** An enquiry that arrived through a QR code, with the code itself. */
export function QrBadge({ code }: { code: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[#E8FF1F]/30 bg-[#E8FF1F]/10 px-2 py-0.5 text-xs font-mono font-medium text-[#E8FF1F]">
      QR <span className="break-all normal-case tracking-normal text-white">{code}</span>
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium text-[#E8FF1F]">
      {children}
    </span>
  );
}

export type FieldItem = { key: string; label: string; value: ReactNode; mono?: boolean };

/** Label/value rows; values are text (React escapes them), wrapped so long e-mails or JSON never widen the page. */
export function Fields({ items, empty }: { items: readonly FieldItem[]; empty?: string }) {
  if (!items.length) return empty ? <p className="mt-3 text-sm text-white/40">{empty}</p> : null;
  return (
    <dl className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-md">
      {items.map((f) => (
        <div key={f.key} className="grid gap-1 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4 first:pt-1 last:pb-1">
          <dt className="text-xs font-semibold uppercase tracking-wider text-white/45 pt-0.5">{f.label}</dt>
          <dd className={cn("min-w-0 whitespace-pre-wrap break-words text-white/85", f.mono ? "font-mono text-xs text-[#E8FF1F]" : "text-sm")}>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A wide table scrolls inside this focusable region on a phone;
 * Styled as a 28px rounded glass plate with rim highlight.
 */
export function TableRegion({ label, minWidth, className, children }: { label: string; minWidth: string; className?: string; children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "relative mt-6 max-w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-xl",
        className,
      )}
    >
      {/* Inset rim highlight */}
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
      <div className={cn("overflow-x-auto", minWidth)}>{children}</div>
    </div>
  );
}

export const th = "py-4 px-5 text-left align-bottom text-[11px] font-semibold uppercase tracking-wider text-white/45 border-b border-white/10";
export const td = "py-4 px-5 align-top text-sm text-white/85 border-b border-white/5 transition-colors";
