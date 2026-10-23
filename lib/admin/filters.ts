import { z } from "zod";
import { ATTRIBUTION_KEYS } from "@/lib/leads/attribution";
import {
  AUDIT_ENTITIES,
  LEAD_GATES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  MAX_PAGE,
  MOU_STATUSES,
  PAGE_SIZE,
  SEARCH_MAX_LENGTH,
  UUID_PATTERN,
  type LeadSource,
  type LeadStatus,
  type MouStatus,
} from "@/lib/admin/constants";

/**
 * Staff console list filters: parse and validate `searchParams` with zod, sanitise the free-text search, and apply the
 * result to a Supabase (PostgREST) query. Pure: no Next.js or Supabase imports, so every rule here is unit-tested
 * (tests/admin-console.test.mjs).
 *
 * SECURITY. PostgREST `.or()` takes a raw filter string (`col.op.value,col.op.value`), so an unescaped `,` `(` `)` or
 * `"` in user input could add conditions of its own. The search term is therefore reduced to an allow-list (letters,
 * combining marks, digits, spaces and `@ . + - _`) before it is interpolated, LIKE wildcards are escaped, and every
 * other filter is an exact value from a fixed list or a strict pattern.
 */

/** Search params exactly as Next.js passes them to a page. */
export type SearchParams = Record<string, string | string[] | undefined>;
export type Parsed<T> = { filters: T; issues: string[] };

export const uuidSchema = z.string().trim().regex(UUID_PATTERN).transform((v) => v.toLowerCase());

// ------------------------------------------------------------------ search term

/** Anything outside the allow-list. Letters include combining marks so Indic names survive (e.g. Devanagari). */
const DISALLOWED = /[^\p{L}\p{M}\p{N} @.+_-]+/gu;
const ALLOWED_ONLY = /^[\p{L}\p{M}\p{N} @.+_-]+$/u;

/**
 * Reduce free text to a safe search term: disallowed characters become spaces, whitespace collapses, length is capped
 * at 80 characters (code points, so a surrogate pair is never split). Returns undefined when nothing usable is left.
 */
export function sanitizeSearchTerm(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const cleaned = raw.slice(0, 400).normalize("NFC").replace(DISALLOWED, " ").replace(/\s+/g, " ").trim();
  const capped = Array.from(cleaned).slice(0, SEARCH_MAX_LENGTH).join("").trim();
  return capped || undefined;
}

/** Escape LIKE/ILIKE wildcards (and the escape character itself) so they match literally. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** `%term%` with the term escaped. The term must already be sanitised. */
export function containsPattern(term: string): string {
  return `%${escapeLike(term)}%`;
}

/** Columns the enquiry search looks at. */
export const LEAD_SEARCH_COLUMNS = ["contact_name", "email", "phone", "payload->>organisation"] as const;

/**
 * The `.or()` filter for an enquiry search. Refuses anything that did not come through sanitizeSearchTerm, so a
 * future caller cannot interpolate raw input by accident.
 */
export function leadSearchFilter(term: string): string {
  if (!ALLOWED_ONLY.test(term) || Array.from(term).length > SEARCH_MAX_LENGTH) throw new Error("leadSearchFilter: unsanitised search term");
  const pattern = containsPattern(term);
  return LEAD_SEARCH_COLUMNS.map((column) => `${column}.ilike.${pattern}`).join(",");
}

/** "Came from a campaign": any utm_* attribution key present. A constant: no user input. */
export const UTM_KEYS = ATTRIBUTION_KEYS.filter((k) => k.startsWith("utm_"));
export const UTM_FILTER = UTM_KEYS.map((k) => `attribution->>${k}.not.is.null`).join(",");

// ------------------------------------------------------------------ dates (India Standard Time)

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar day written YYYY-MM-DD (rejects 2026-02-30). */
export function isCalendarDay(value: string): boolean {
  if (!DAY.test(value)) return false;
  const t = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === value;
}
export const daySchema = z.string().refine(isCalendarDay);

/** Midnight at the start of `day` in India (UTC+05:30, no daylight saving), as an ISO instant. */
export function istDayStart(day: string): string {
  return new Date(`${day}T00:00:00+05:30`).toISOString();
}

/** Midnight at the start of the following IST day: the exclusive upper bound for an inclusive "to" date. */
export function istNextDayStart(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00+05:30`) + 86_400_000).toISOString();
}

// ------------------------------------------------------------------ parsing

/** First value of a parameter (a repeated parameter keeps its first), trimmed; empty means absent. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t || undefined;
}

function read<T>(sp: SearchParams, key: string, schema: z.ZodType<T>, issue: string, issues: string[]): T | undefined {
  const raw = firstParam(sp[key]);
  if (raw === undefined) return undefined;
  const parsed = schema.safeParse(raw);
  if (parsed.success) return parsed.data;
  issues.push(issue);
  return undefined;
}

function readSearch(sp: SearchParams, key: string, issues: string[]): string | undefined {
  const raw = firstParam(sp[key]);
  if (raw === undefined) return undefined;
  const term = sanitizeSearchTerm(raw);
  if (term !== raw.normalize("NFC").replace(/\s+/g, " ")) {
    issues.push(`Some of the search text was left out: only letters, digits, spaces and @ . + - _ are searched, up to ${SEARCH_MAX_LENGTH} characters.`);
  }
  return term;
}

function readDateRange(sp: SearchParams, issues: string[]): { from?: string; to?: string } {
  const from = read(sp, "from", daySchema, "The start date is not a valid date, so it was ignored.", issues);
  const to = read(sp, "to", daySchema, "The end date is not a valid date, so it was ignored.", issues);
  if (from && to && from > to) {
    issues.push("The start date is after the end date, so the date filter was ignored.");
    return {};
  }
  return { ...(from ? { from } : {}), ...(to ? { to } : {}) };
}

const pageSchema = z.coerce.number().int().min(1).max(MAX_PAGE);

function readPage(sp: SearchParams, issues: string[]): number {
  return read(sp, "page", pageSchema, "That page number is not valid, so the first page is shown.", issues) ?? 1;
}

/** Drop undefined keys, so a parsed filter object only lists what is actually applied. */
function compact<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
}

export type LeadFilters = { q?: string; gate?: string; status?: LeadStatus; source?: LeadSource; from?: string; to?: string; page: number };

export function parseLeadFilters(sp: SearchParams): Parsed<LeadFilters> {
  const issues: string[] = [];
  const filters = compact({
    q: readSearch(sp, "q", issues),
    gate: read(sp, "gate", z.enum(LEAD_GATES), "Unknown form, so the form filter was ignored.", issues),
    status: read(sp, "status", z.enum(LEAD_STATUSES), "Unknown status, so the status filter was ignored.", issues),
    source: read(sp, "source", z.enum(LEAD_SOURCES), "Unknown source, so the source filter was ignored.", issues),
    ...readDateRange(sp, issues),
    page: readPage(sp, issues),
  });
  return { filters, issues };
}

export type MouFilters = { q?: string; status?: MouStatus; page: number };

export function parseMouFilters(sp: SearchParams): Parsed<MouFilters> {
  const issues: string[] = [];
  const filters = compact({
    q: readSearch(sp, "q", issues),
    status: read(sp, "status", z.enum(MOU_STATUSES), "Unknown status, so the status filter was ignored.", issues),
    page: readPage(sp, issues),
  });
  return { filters, issues };
}

/** Hub slugs and capture sources are free text in the operations table; accept the attribution character set only. */
const captureText = z.string().max(100).regex(/^[\p{L}\p{N} ._~:/@+-]+$/u);

export type QrFilters = { hub?: string; source?: string; from?: string; to?: string; page: number };

export function parseQrFilters(sp: SearchParams): Parsed<QrFilters> {
  const issues: string[] = [];
  const filters = compact({
    hub: read(sp, "hub", captureText, "That hub is not a valid hub code, so the hub filter was ignored.", issues),
    source: read(sp, "source", captureText, "That source is not valid, so the source filter was ignored.", issues),
    ...readDateRange(sp, issues),
    page: readPage(sp, issues),
  });
  return { filters, issues };
}

export type AuditFilters = { entity?: string; action?: string; from?: string; to?: string; page: number };

export function parseAuditFilters(sp: SearchParams): Parsed<AuditFilters> {
  const issues: string[] = [];
  const filters = compact({
    entity: read(sp, "entity", z.string().regex(/^[a-z][a-z0-9_]{1,62}$/), "Unknown record type, so that filter was ignored.", issues),
    action: read(sp, "action", z.string().regex(/^[a-z][a-z0-9_.:-]{1,62}$/), "Unknown action, so that filter was ignored.", issues),
    ...readDateRange(sp, issues),
    page: readPage(sp, issues),
  });
  return { filters, issues };
}

/** True when anything other than the page number narrows the list. */
export function hasFilters(filters: { page: number } & Record<string, unknown>): boolean {
  return Object.entries(filters).some(([k, v]) => k !== "page" && v !== undefined && v !== "");
}

// ------------------------------------------------------------------ applying filters to a query

/**
 * The PostgREST filter methods used here (supabase-js filter builders have them; tests pass a fake that records
 * calls). Every value passed is a constant, an allow-listed enum, a strict pattern or a sanitised term.
 */
type FilterChain = {
  eq(column: string, value: string): FilterChain;
  in(column: string, values: readonly string[]): FilterChain;
  gte(column: string, value: string): FilterChain;
  lt(column: string, value: string): FilterChain;
  ilike(column: string, pattern: string): FilterChain;
  or(filters: string): FilterChain;
  not(column: string, operator: string, value: null): FilterChain;
};
/**
 * Only the presence of the methods is checked on the caller's builder: relating supabase-js's generic builder types
 * to FilterChain structurally exceeds TypeScript's instantiation depth. Each apply* returns the caller's own type.
 */
export type Filterable = { [K in keyof FilterChain]: unknown };

function applyDates(q: FilterChain, f: { from?: string; to?: string }, column = "created_at"): FilterChain {
  if (f.from) q = q.gte(column, istDayStart(f.from));
  if (f.to) q = q.lt(column, istNextDayStart(f.to));
  return q;
}

export function applyLeadFilters<Q extends Filterable>(query: Q, f: LeadFilters): Q {
  let q = query as unknown as FilterChain;
  if (f.q) q = q.or(leadSearchFilter(f.q));
  if (f.gate) q = q.eq("gate", f.gate);
  if (f.status) q = q.eq("status", f.status);
  if (f.source === "qr") q = q.not("attribution->>qr", "is", null);
  if (f.source === "utm") q = q.or(UTM_FILTER);
  return applyDates(q, f) as unknown as Q;
}

export function applyMouFilters<Q extends Filterable>(query: Q, f: MouFilters): Q {
  let q = query as unknown as FilterChain;
  if (f.q) q = q.ilike("school_name", containsPattern(f.q));
  if (f.status) q = q.eq("status", f.status);
  return q as unknown as Q;
}

/** `includeHub: false` for the per-hub summary, which shows every hub for the chosen dates and source. */
export function applyQrFilters<Q extends Filterable>(query: Q, f: QrFilters, { includeHub = true } = {}): Q {
  let q = query as unknown as FilterChain;
  if (includeHub && f.hub) q = q.eq("hub_slug", f.hub);
  if (f.source) q = q.eq("source", f.source);
  return applyDates(q, f) as unknown as Q;
}

export function applyAuditFilters<Q extends Filterable>(query: Q, f: AuditFilters): Q {
  let q = query as unknown as FilterChain;
  const known = AUDIT_ENTITIES.find((e) => e.value === f.entity);
  if (known) q = q.in("entity_type", known.types);
  else if (f.entity) q = q.eq("entity_type", f.entity);
  if (f.action) q = q.eq("action", f.action);
  return applyDates(q, f) as unknown as Q;
}

// ------------------------------------------------------------------ pagination and links

/** Zero-based inclusive row window for `.range(from, to)`. */
export function pageWindow(page: number, size = PAGE_SIZE): { from: number; to: number } {
  const from = (Math.max(1, Math.floor(page)) - 1) * size;
  return { from, to: from + size - 1 };
}

export function totalPages(count: number, size = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(Math.max(0, count) / size));
}

/** The same list with these filters (empty values dropped) at `page` (omitted for page 1). */
export function listHref(pathname: string, filters: Record<string, string | number | undefined>, page = 1): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (k !== "page" && v !== undefined && v !== "") params.set(k, String(v));
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** PostgREST answers an offset past the last row (with an exact count) with PGRST103, "range not satisfiable". */
export function isPastLastPage(error: { code?: string } | null | undefined): boolean {
  return error?.code === "PGRST103";
}
