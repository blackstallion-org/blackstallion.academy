import { z } from "zod";

/**
 * Registration and admissions: the shapes and rules the forms, the server actions and the staff console share.
 * The database (supabase/live/migrations/20261104001400_registration_admissions.sql) enforces every rule again; this module
 * exists so the visitor gets a clear message before a request is made, and so the rules can be unit-tested.
 */

export const APPLICATION_KINDS = ["cadet", "school", "staff", "partner"] as const;
export type ApplicationKind = (typeof APPLICATION_KINDS)[number];

export const APPLICATION_STATUSES = ["draft", "submitted", "under_review", "info_required", "approved", "rejected", "enrolled", "withdrawn"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Version of the consent text shown on the forms. Change it whenever the wording changes; the database records it per application. */
export const CONSENT_VERSION = "2026-11-04";

export const KIND_INFO: Record<ApplicationKind, { label: string; plural: string; route: string; blurb: string }> = {
  cadet: { label: "Cadet enrolment", plural: "Cadet enrolments", route: "/enroll", blurb: "Parents and guardians enrol a child. The child never needs an account." },
  school: { label: "School partnership", plural: "School applications", route: "/schools/apply", blurb: "An authorised representative applies for a campus hub." },
  staff: { label: "Instructor or staff", plural: "Staff applications", route: "/careers/apply", blurb: "Riding instructors, grooms and operations staff apply to join." },
  partner: { label: "Partner or sponsor", plural: "Partner enquiries", route: "/partners/apply", blurb: "Organisations who want to partner with or sponsor the academy." },
};

/** What the applicant sees for each status (never an internal note). */
export const STATUS_INFO: Record<ApplicationStatus, { label: string; applicant: string; tone: "neutral" | "progress" | "action" | "good" | "bad" }> = {
  draft: { label: "Draft", applicant: "Not sent yet. Finish the form and submit it when you are ready.", tone: "neutral" },
  submitted: { label: "Submitted", applicant: "Received. The admissions team will start the review shortly.", tone: "progress" },
  under_review: { label: "Under review", applicant: "The admissions team is reviewing your application.", tone: "progress" },
  info_required: { label: "More information needed", applicant: "We need something more from you. See the note below, update the application and submit it again.", tone: "action" },
  approved: { label: "Approved", applicant: "Approved. Any remaining step (such as the enrolment fee) is shown below.", tone: "good" },
  rejected: { label: "Not accepted", applicant: "This application was not accepted. You may contact the academy if you have questions.", tone: "bad" },
  enrolled: { label: "Enrolled", applicant: "Enrolled. Welcome to the academy.", tone: "good" },
  withdrawn: { label: "Withdrawn", applicant: "You withdrew this application.", tone: "neutral" },
};

/** The steps shown on the forms (cadet enrolment, and the other three kinds). */
export const CADET_STEPS = ["Child", "Programme and details", "Documents", "Consent and submit", "Review", "Enrolment"] as const;
export const OTHER_STEPS = ["Details", "Documents", "Consent and submit", "Review", "Decision"] as const;

/** Moves a reviewer may make (mirrors public.application_review). Enrolment has its own step; resubmission is the applicant's. */
export const REVIEW_MOVES: Partial<Record<ApplicationStatus, readonly ApplicationStatus[]>> = {
  submitted: ["under_review", "info_required", "approved", "rejected"],
  under_review: ["info_required", "approved", "rejected"],
};
export function canReview(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return (REVIEW_MOVES[from] ?? []).includes(to);
}
export const isEditable = (s: ApplicationStatus) => s === "draft" || s === "info_required";
export const isWithdrawable = (s: ApplicationStatus) => s === "draft" || s === "submitted" || s === "under_review" || s === "info_required";

/* ------------------------------------------------------------------ documents */

export const DOC_TYPES = ["proof_of_age", "photo", "medical_fitness", "school_letter", "cv", "qualification", "id_proof", "organisation_profile", "other"] as const;
export type DocType = (typeof DOC_TYPES)[number];
export const DOC_LABEL: Record<DocType, string> = {
  proof_of_age: "Proof of age (birth certificate or school ID)",
  photo: "Recent photograph",
  medical_fitness: "Medical fitness note",
  school_letter: "Letter from the school",
  cv: "CV or résumé",
  qualification: "Qualification or certificate",
  id_proof: "Government ID",
  organisation_profile: "Organisation profile",
  other: "Other document",
};
export const DOCS_FOR: Record<ApplicationKind, { required: readonly DocType[]; optional: readonly DocType[] }> = {
  cadet: { required: ["proof_of_age"], optional: ["photo", "medical_fitness", "school_letter"] },
  school: { required: [], optional: ["school_letter", "organisation_profile", "other"] },
  staff: { required: ["cv"], optional: ["qualification", "id_proof", "other"] },
  partner: { required: [], optional: ["organisation_profile", "other"] },
};
export const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export const MAX_DOC_BYTES = 10 * 1024 * 1024;

/** Checks an upload before it is stored. The file's own first bytes must match its declared type (no renamed executables). */
export function checkDocument(file: { name: string; type: string; size: number }, head: Uint8Array): { ok: true; safeName: string } | { ok: false; error: string } {
  if (!(ALLOWED_MIME as readonly string[]).includes(file.type)) return { ok: false, error: "Upload a PDF, JPEG, PNG or WebP file." };
  if (file.size <= 0) return { ok: false, error: "That file is empty." };
  if (file.size > MAX_DOC_BYTES) return { ok: false, error: "Files must be 10 MB or smaller." };
  const starts = (...b: number[]) => b.every((v, i) => head[i] === v);
  const magic =
    file.type === "application/pdf" ? starts(0x25, 0x50, 0x44, 0x46) :
    file.type === "image/jpeg" ? starts(0xff, 0xd8, 0xff) :
    file.type === "image/png" ? starts(0x89, 0x50, 0x4e, 0x47) :
    starts(0x52, 0x49, 0x46, 0x46) && head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
  if (!magic) return { ok: false, error: "That file's contents do not match its type." };
  const ext = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type as (typeof ALLOWED_MIME)[number]];
  const base = file.name.replace(/\.[^.]*$/, "").normalize("NFKD").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "document";
  return { ok: true, safeName: `${base}.${ext}` };
}

/* ------------------------------------------------------------------ form schemas */

const text = (max: number, min = 1) => z.string().trim().min(min, "This field is required.").max(max, `Keep this under ${max} characters.`);
const optionalText = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`).optional().transform((v) => (v ? v : undefined));
const phone = z.string().trim().regex(/^\+?[0-9 ()-]{8,20}$/, "Enter a phone number with its area code.");
const email = z.string().trim().toLowerCase().email("Enter a valid e-mail address.").max(160);

/** Age in whole years on a given day (default today), from an ISO date. */
export function ageOn(dob: string, today = new Date()): number {
  const d = new Date(`${dob}T00:00:00Z`);
  let age = today.getUTCFullYear() - d.getUTCFullYear();
  const m = today.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < d.getUTCDate())) age -= 1;
  return age;
}

export const childSchema = z.object({
  first_name: text(80),
  last_name: text(80),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the date of birth.").refine((v) => {
    const a = ageOn(v);
    return Number.isFinite(a) && a >= 3 && a <= 21;
  }, "Cadets are between 3 and 21 years old."),
  current_school: optionalText(160),
  grade: optionalText(20),
  riding_experience: z.enum(["none", "some", "regular", "competitive"]).default("none"),
  medical_notes: optionalText(1000),
});
export type ChildInput = z.infer<typeof childSchema>;

export const cadetPayloadSchema = z.object({
  preferred_days: z.enum(["weekdays", "weekends", "either"]).default("either"),
  emergency_contact_name: text(120),
  emergency_contact_phone: phone,
  relationship: z.enum(["mother", "father", "legal_guardian", "other"]),
  how_heard: optionalText(120),
});

export const schoolPayloadSchema = z.object({
  institution_name: text(160, 2),
  board: z.enum(["CBSE", "ICSE", "IB", "Cambridge", "State", "Other"]),
  city: text(80),
  state: text(80),
  representative_designation: text(100),
  representative_phone: phone,
  official_email: email,
  student_strength: z.coerce.number().int().min(50, "At least 50 students.").max(20000),
  campus_area_acres: z.coerce.number().min(0.5, "Half an acre or more.").max(1000),
  authorised: z.literal("on", { message: "Confirm that you are authorised to apply for the school." }),
  requirements: optionalText(1500),
});

export const staffPayloadSchema = z.object({
  position: z.enum(["riding_instructor", "groom", "stable_manager", "operations", "other"]),
  years_experience: z.coerce.number().int().min(0).max(60),
  phone,
  city: text(80),
  ex_service: z.enum(["yes", "no"]).default("no"),
  certifications: optionalText(500),
  availability: z.enum(["immediate", "one_month", "three_months"]),
  statement: text(1500, 20),
});

export const partnerPayloadSchema = z.object({
  organisation: text(160, 2),
  category: z.enum(["corporate_sponsor", "csr", "equipment", "media", "venue", "academic", "other"]),
  website: z.string().trim().max(200).refine((v) => v === "" || /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v), "Enter the full address, starting with https://").optional().transform((v) => v || undefined),
  contact_phone: phone,
  contact_designation: text(100),
  proposal: text(2000, 20),
});

export const PAYLOAD_SCHEMAS = { cadet: cadetPayloadSchema, school: schoolPayloadSchema, staff: staffPayloadSchema, partner: partnerPayloadSchema } as const;

/** Parses the fields a kind needs from a form. Unknown fields are dropped; the first problem is returned as one sentence. */
export function parsePayload(kind: ApplicationKind, raw: Record<string, unknown>): { ok: true; value: Record<string, unknown> } | { ok: false; error: string; field?: string } {
  const result = PAYLOAD_SCHEMAS[kind].safeParse(raw);
  if (result.success) return { ok: true, value: result.data as Record<string, unknown> };
  const issue = result.error.issues[0];
  return { ok: false, error: issue?.message ?? "Check the form.", field: issue?.path[0] as string | undefined };
}

/* ------------------------------------------------------------------ money */

/** Enrolment fee with GST, in integer paise. GST is rounded half-up once, on the paise total (as lib/payments/core.ts). */
export function feeWithGst(feePaise: number, gstRate: number): { base: number; gst: number; total: number } {
  if (!Number.isInteger(feePaise) || feePaise < 0) throw new Error("invalid fee");
  if (!(gstRate >= 0 && gstRate <= 0.5)) throw new Error("invalid GST rate");
  const gst = Math.round(feePaise * gstRate);
  return { base: feePaise, gst, total: feePaise + gst };
}
export const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** A safe internal path to return to after sign-in (never an absolute or protocol-relative URL). */
export function safeNext(value: unknown, fallback = "/sovereign"): string {
  return typeof value === "string" && /^\/(?!\/)[A-Za-z0-9/_?=&.-]{0,200}$/.test(value) && !value.startsWith("/\\") ? value : fallback;
}
