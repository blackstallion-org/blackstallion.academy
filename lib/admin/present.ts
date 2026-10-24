import { ATTRIBUTION_KEYS } from "@/lib/leads/attribution";
import { LEAD_ENTITY_TYPES, REFERENCE_PATTERN, isUuid } from "@/lib/admin/constants";

/**
 * Pure mapping from database rows to what the staff console shows. Values are returned as plain text for React to
 * escape; nothing here produces HTML. Dependency-free (safe in client components). Unit-tested in
 * tests/admin-console.test.mjs.
 */

export const TIME_ZONE = "Asia/Kolkata";

type Rec = Record<string, unknown>;
const isRecord = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);

// ------------------------------------------------------------------ dates

/** "23 Oct 2026, 3:45 pm IST". Unknown or invalid instants show a dash. */
export function formatDateTimeIST(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: TIME_ZONE })} IST`;
}

/** A `date` column (no time, no zone), e.g. a preferred signing date: shown as written, never shifted. */
export function formatCalendarDay(value: string | null | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "—";
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "UTC" });
}

// ------------------------------------------------------------------ enquiry fields

export type DisplayField = { key: string; label: string; value: string; json: boolean };

const PAYLOAD_LABELS: Record<string, string> = {
  organisation: "Organisation",
  designation: "Designation",
  student: "Student",
  zone: "Zone",
  tier: "Tier",
  acreage: "Acreage",
  capacity: "Student capacity",
  date: "Preferred date",
  slot: "Preferred slot",
  message: "Message",
  gate: "Form",
  name: "Name",
  email: "E-mail",
  phone: "Phone",
  consent: "Consent (older record)",
  attribution: "Attribution (older record)",
};
const PAYLOAD_ORDER = ["organisation", "designation", "student", "zone", "tier", "acreage", "capacity", "date", "slot", "message", "gate"];

const ATTRIBUTION_LABELS: Record<string, string> = {
  path: "Page",
  hub: "Hub",
  campaign: "Campaign",
  qr: "QR code",
  referrer: "Referring site",
};

/** Any JSON value as display text: strings verbatim, scalars stringified, objects and arrays as indented JSON. */
export function displayValue(value: unknown): { value: string; json: boolean } {
  if (typeof value === "string") return { value, json: false };
  if (typeof value === "number" || typeof value === "boolean") return { value: String(value), json: false };
  if (value === null || value === undefined) return { value: "—", json: false };
  try {
    return { value: JSON.stringify(value, null, 2) ?? "—", json: true };
  } catch {
    return { value: "[unreadable value]", json: false };
  }
}

function fields(record: Rec, order: readonly string[], labels: Record<string, string>): DisplayField[] {
  const keys = Object.keys(record);
  const ordered = [...order.filter((k) => keys.includes(k)), ...keys.filter((k) => !order.includes(k)).sort()];
  return ordered.map((key) => ({ key, label: labels[key] ?? key, ...displayValue(record[key]) }));
}

/** Every payload field, known ones first in form order, then the rest alphabetically under their raw key. */
export function payloadFields(payload: unknown): DisplayField[] {
  if (payload === null || payload === undefined) return [];
  if (!isRecord(payload)) return [{ key: "payload", label: "Payload", ...displayValue(payload) }];
  return fields(payload, PAYLOAD_ORDER, PAYLOAD_LABELS);
}

export function attributionFields(attribution: unknown): DisplayField[] {
  if (!isRecord(attribution)) return [];
  return fields(attribution, ATTRIBUTION_KEYS, ATTRIBUTION_LABELS);
}

const text = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);

export const organisationOf = (payload: unknown): string | undefined => (isRecord(payload) ? text(payload.organisation) : undefined);
export const messageOf = (payload: unknown): string | undefined => (isRecord(payload) ? text(payload.message) : undefined);
/** The QR code an enquiry arrived with, if any (attribution.qr). */
export const qrCode = (attribution: unknown): string | undefined => (isRecord(attribution) ? text(attribution.qr) : undefined);

/** "utm_source=flyer · utm_campaign=autumn" for the UTM tags present, or undefined. */
export function utmSummary(attribution: unknown): string | undefined {
  if (!isRecord(attribution)) return undefined;
  const parts = ATTRIBUTION_KEYS.filter((k) => k.startsWith("utm_") && text(attribution[k])).map((k) => `${k}=${text(attribution[k])}`);
  return parts.length ? parts.join(" · ") : undefined;
}

export const statusLabel = (status: string | null | undefined): string =>
  status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "—";

/** mailto: only for a plain address (no header injection through ? or &). */
export function mailHref(email: string | null | undefined): string | undefined {
  return email && /^[^\s@?&#]+@[^\s@?&#]+$/.test(email) ? `mailto:${email}` : undefined;
}

/** tel: with digits only (and a leading +), or undefined when it does not look like a phone number. */
export function telHref(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 16 ? `tel:${trimmed.startsWith("+") ? "+" : ""}${digits}` : undefined;
}

// ------------------------------------------------------------------ people

/** "You", the staff member's name, a short id, or "Website / system" when no signed-in user acted. */
export function staffLabel(id: string | null | undefined, currentUserId: string, names: ReadonlyMap<string, string>): string {
  if (!id) return "Website / system";
  if (id === currentUserId) return "You";
  return names.get(id) ?? `Staff member ${id.slice(0, 8)}`;
}

// ------------------------------------------------------------------ documents

type SignedRow = { path: string | null; signedUrl: string | null; error: string | null };

/** Signed links keyed by storage path (never by array position), skipping any path the storage API refused. */
export function signedUrlsByPath(rows: readonly SignedRow[] | null | undefined): Map<string, string> {
  const out = new Map<string, string>();
  for (const r of rows ?? []) if (r.path && r.signedUrl && !r.error) out.set(r.path, r.signedUrl);
  return out;
}

// ------------------------------------------------------------------ MOU requests ↔ website enquiries

/**
 * The website mirror writes `Website MOU enquiry. Reference <ref>` into mou_requests.notes. The migration passes the
 * enquiry's id (a UUID); a lead idempotency key is also accepted, so either form links back to the enquiry.
 */
export type MouReference = { kind: "lead_id" | "key"; value: string };
const MOU_NOTE_REFERENCE = /Website MOU enquiry\. Reference ([A-Za-z0-9_-]{16,64})(?![A-Za-z0-9_-])/;

export function mouReference(notes: unknown): MouReference | undefined {
  if (typeof notes !== "string") return undefined;
  const match = MOU_NOTE_REFERENCE.exec(notes);
  if (!match) return undefined;
  return isUuid(match[1]) ? { kind: "lead_id", value: match[1].toLowerCase() } : { kind: "key", value: match[1] };
}

/** Distinct, validated values to look up (`.in()` lists only ever receive these). */
export function referenceLookups(refs: readonly (MouReference | undefined)[]): { ids: string[]; keys: string[] } {
  const ids = new Set<string>();
  const keys = new Set<string>();
  for (const r of refs) {
    if (r?.kind === "lead_id" && isUuid(r.value)) ids.add(r.value);
    if (r?.kind === "key" && REFERENCE_PATTERN.test(r.value)) keys.add(r.value);
  }
  return { ids: [...ids], keys: [...keys] };
}

export type LeadLink = { id: string; idempotency_key: string; contact_name?: string | null };

export function indexLeads<T extends LeadLink>(leads: readonly T[]): { byId: Map<string, T>; byKey: Map<string, T> } {
  return { byId: new Map(leads.map((l) => [l.id.toLowerCase(), l])), byKey: new Map(leads.map((l) => [l.idempotency_key, l])) };
}

export function leadForReference<T extends LeadLink>(ref: MouReference | undefined, index: { byId: Map<string, T>; byKey: Map<string, T> }): T | undefined {
  if (!ref) return undefined;
  return ref.kind === "lead_id" ? index.byId.get(ref.value) : index.byKey.get(ref.value);
}

/** generated_documents.lead_reference for an MOU row: the matched enquiry's key, or the key written in the note. */
export function documentReference(ref: MouReference | undefined, lead: LeadLink | undefined): string | undefined {
  return lead?.idempotency_key ?? (ref?.kind === "key" ? ref.value : undefined);
}

// ------------------------------------------------------------------ QR captures

export type HubCount = { hub: string; captures: number; converted: number };
export const NO_HUB = "(no hub)";

/** Captures and conversions per hub, most captures first. Counts only the rows given (the caller caps them). */
export function summariseByHub(rows: readonly { hub_slug?: string | null; converted_to_enrollment?: boolean | null }[]): HubCount[] {
  const byHub = new Map<string, HubCount>();
  for (const r of rows) {
    const hub = text(r.hub_slug) ?? NO_HUB;
    const entry = byHub.get(hub) ?? { hub, captures: 0, converted: 0 };
    entry.captures += 1;
    if (r.converted_to_enrollment === true) entry.converted += 1;
    byHub.set(hub, entry);
  }
  return [...byHub.values()].sort((a, b) => b.captures - a.captures || a.hub.localeCompare(b.hub));
}

// ------------------------------------------------------------------ audit trail

const isLeadEntity = (entityType: string) => (LEAD_ENTITY_TYPES as readonly string[]).includes(entityType);

export function auditActionLabel(action: string, entityType: string): string {
  if (action === "lead.submitted") return "Enquiry received";
  if (action === "row.update") return isLeadEntity(entityType) ? "Enquiry updated" : entityType === "generated_documents" ? "Document changed" : "Record changed";
  if (action === "row.insert") return entityType === "generated_documents" ? "Document generated" : entityType === "media_assets" ? "Image uploaded" : "Record created";
  if (action === "row.delete") return entityType === "media_assets" ? "Image deleted" : isLeadEntity(entityType) ? "Enquiry deleted" : "Record deleted";
  return action;
}

/** Where an audited record can be seen in the console, if anywhere. */
export function auditEntityHref(entityType: string, entityId: string | null | undefined): string | undefined {
  if (isLeadEntity(entityType)) return isUuid(entityId) ? `/admin/leads/${entityId.toLowerCase()}` : undefined;
  if (entityType === "generated_documents") return "/admin/documents";
  if (entityType === "media_assets") return "/admin/media";
  return undefined;
}

/**
 * Audit metadata as one line. The database records column NAMES only (never values), plus intake facts such as the
 * form and the operations mirror, so this never contains contact details.
 */
export function auditDetails(metadata: unknown): string {
  if (!isRecord(metadata)) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    if (key === "changed_columns" && Array.isArray(value)) {
      const cols = value.filter((c): c is string => typeof c === "string" && c !== "updated_at");
      parts.push(cols.length ? `Changed: ${cols.join(", ")}` : "Changed: timestamp only");
    } else {
      parts.push(`${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`);
    }
  }
  return parts.join(" · ");
}
