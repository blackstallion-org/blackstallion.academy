/**
 * Staff console constants. Dependency-free on purpose: client components (the status form) import from here without
 * pulling zod or the filter parsers into the browser bundle.
 */

export const PAGE_SIZE = 50;
/** Deep enough for any real backlog; beyond it, filters are the better tool (and offsets stay cheap). */
export const MAX_PAGE = 2000;
export const SEARCH_MAX_LENGTH = 80;

export const LEAD_STATUSES = ["new", "reviewing", "contacted", "qualified", "closed", "rejected"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
/** Form gates the website sends (app/actions.ts) plus the legacy generic form. */
export const LEAD_GATES = ["parents", "hub", "schools", "partners", "audit", "mou", "generic"] as const;
export const LEAD_SOURCES = ["qr", "utm"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];
export const MOU_STATUSES = ["PENDING", "REVIEWING", "SIGNED", "REJECTED"] as const;
export type MouStatus = (typeof MOU_STATUSES)[number];

/** Audit rows about an enquiry: row changes use the table name, the intake RPC logs 'onboarding_lead'. */
export const LEAD_ENTITY_TYPES = ["onboarding_leads", "onboarding_lead"] as const;

/** Friendly record types for the audit log filter; any other table name is still accepted from the URL. */
export const AUDIT_ENTITIES: readonly { value: string; label: string; types: readonly string[] }[] = [
  { value: "onboarding_leads", label: "Enquiries", types: LEAD_ENTITY_TYPES },
  { value: "generated_documents", label: "Generated documents", types: ["generated_documents"] },
  { value: "media_assets", label: "Website images", types: ["media_assets"] },
];
export const AUDIT_ACTIONS: readonly { value: string; label: string }[] = [
  { value: "lead.submitted", label: "Enquiry received" },
  { value: "row.update", label: "Record changed" },
  { value: "row.insert", label: "Record created" },
  { value: "row.delete", label: "Record deleted" },
];

/** Capture sources the website and the operations flyers write; the filter accepts others too. */
export const QR_SOURCES = ["website-qr", "website", "flyer"] as const;

/** Lenient UUID shape (any version): ids come from the database and are only ever compared, never trusted. */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID_PATTERN.test(value);
/** Lead idempotency keys (the enquiry "reference"): same rule as the database check and lib/leads/attribution.ts. */
export const REFERENCE_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;
