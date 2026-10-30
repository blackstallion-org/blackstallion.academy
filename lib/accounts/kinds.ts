import { z } from "zod";

/**
 * Self-service accounts: who can create one and what each kind is asked. Dependency-light on purpose: the sign-up form
 * (a client component) imports the field lists, the server action imports the same lists to validate, and the database
 * (supabase/migrations/20261028000900_member_accounts.sql) clips whatever arrives, so the three can never disagree about
 * the kinds. A member is never a staff member: roles stay in public.profiles and only an executive can change them.
 */

export const MEMBER_KINDS = ["student", "parent", "teacher", "school"] as const;
export type MemberKind = (typeof MEMBER_KINDS)[number];
export const MEMBER_STATUSES = ["pending", "active", "suspended"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

/** Columns of public.member_accounts that live beside `details`. Everything else a form asks for goes into `details`. */
export const TOP_LEVEL_FIELDS = ["phone", "organisation", "city"] as const;

export type FieldSpec = {
  name: string;
  label: string;
  type: "text" | "tel" | "select" | "textarea";
  required?: boolean;
  max: number;
  options?: readonly string[];
  hint?: string;
  placeholder?: string;
};

export type KindInfo = {
  kind: MemberKind;
  label: string;
  /** One line on the role card. */
  blurb: string;
  /** Teachers and schools are reviewed by the academy team before their account is active. */
  reviewed: boolean;
  /** Label of the account's name field (for a school: the contact person). */
  nameLabel: string;
  fields: readonly FieldSpec[];
};

const AGE_BANDS = ["Under 8", "8 to 10", "11 to 13", "14 to 17", "18 or over"] as const;
const BOARDS = ["CBSE", "ICSE / ISC", "State board", "IB / IGCSE", "Other"] as const;
const SIZES = ["Under 300", "300 to 800", "800 to 1,500", "Over 1,500"] as const;

export const KINDS: Record<MemberKind, KindInfo> = {
  student: {
    kind: "student",
    label: "Student",
    blurb: "A young rider, or someone who wants to become one.",
    reviewed: false,
    nameLabel: "Your name",
    fields: [
      { name: "age_band", label: "Your age", type: "select", required: true, max: 20, options: AGE_BANDS },
      { name: "city", label: "City", type: "text", max: 80 },
      { name: "guardian", label: "Parent or guardian (name and phone)", type: "text", max: 160, hint: "If you are under 18, a parent or guardian should help you create this account." },
    ],
  },
  parent: {
    kind: "parent",
    label: "Parent",
    blurb: "A parent or guardian following a child's progress.",
    reviewed: false,
    nameLabel: "Your name",
    fields: [
      { name: "phone", label: "Phone", type: "tel", max: 24 },
      { name: "city", label: "City", type: "text", max: 80 },
      { name: "children", label: "Your children (first names and ages)", type: "textarea", max: 300, placeholder: "Meera, 9" },
    ],
  },
  teacher: {
    kind: "teacher",
    label: "Teacher",
    blurb: "A teacher or coach at a school or a riding centre.",
    reviewed: true,
    nameLabel: "Your name",
    fields: [
      { name: "organisation", label: "School or institution", type: "text", required: true, max: 160 },
      { name: "city", label: "City", type: "text", required: true, max: 80 },
      { name: "title", label: "Your role or subject", type: "text", max: 80 },
      { name: "phone", label: "Phone", type: "tel", max: 24 },
    ],
  },
  school: {
    kind: "school",
    label: "School",
    blurb: "A school that wants to bring the academy to its students.",
    reviewed: true,
    nameLabel: "Contact person",
    fields: [
      { name: "organisation", label: "School name", type: "text", required: true, max: 160 },
      { name: "city", label: "City", type: "text", required: true, max: 80 },
      { name: "board", label: "Board", type: "select", max: 20, options: BOARDS },
      { name: "size", label: "Number of students", type: "select", max: 20, options: SIZES },
      { name: "phone", label: "Phone", type: "tel", required: true, max: 24 },
    ],
  },
};

export function isMemberKind(value: unknown): value is MemberKind {
  return typeof value === "string" && (MEMBER_KINDS as readonly string[]).includes(value);
}

/** Same rule as the staff password reset: 12+ characters, letters and at least one number. */
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(200, "That password is too long.")
  .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), "Use letters and at least one number.");

const clean = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);

function fieldSchema(spec: FieldSpec) {
  let s: z.ZodType<string> = clean(spec.max);
  if (spec.type === "select" && spec.options) {
    s = z.string().trim().refine((v) => v === "" || spec.options!.includes(v), "Choose one of the options.");
  }
  if (spec.type === "tel") {
    s = clean(spec.max).refine((v) => v === "" || /^[+()\d][\d\s().-]{5,23}$/.test(v), "Enter a phone number with digits only.");
  }
  if (spec.required) s = s.refine((v) => v.length > 0, `${spec.label} is required.`);
  // a question left out of the form entirely counts as unanswered
  return z.preprocess((v) => v ?? "", s);
}

export type SignUpValues = {
  kind: MemberKind;
  email: string;
  password: string;
  full_name: string;
  phone: string | null;
  organisation: string | null;
  city: string | null;
  details: Record<string, string>;
};

/** Reads and validates the sign-up form for the chosen kind. Returns the first problem in plain words. */
export function parseSignUp(input: Record<string, FormDataEntryValue | null>): { ok: true; value: SignUpValues } | { ok: false; error: string } {
  const kind = input.kind;
  if (!isMemberKind(kind)) return { ok: false, error: "Choose who you are: student, parent, teacher or school." };
  const info = KINDS[kind];
  const shape: Record<string, z.ZodType<unknown>> = {
    email: z.string().trim().toLowerCase().email("Enter a valid e-mail address.").max(160),
    password: passwordSchema,
    confirm: z.string(),
    full_name: z.string().trim().min(2, `${info.nameLabel} is required.`).max(120, "That name is too long."),
    consent: z.literal("yes", { error: "Please tick the box to continue." }),
  };
  for (const f of info.fields) shape[f.name] = fieldSchema(f);
  const parsed = z.object(shape).safeParse(Object.fromEntries(Object.entries(input).map(([k, v]) => [k, typeof v === "string" ? v : v === null ? undefined : ""])));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const v = parsed.data as Record<string, string | undefined>;
  if (v.password !== v.confirm) return { ok: false, error: "The two passwords do not match." };
  const details: Record<string, string> = {};
  for (const f of info.fields) {
    const value = (v[f.name] ?? "").trim();
    if (value && !(TOP_LEVEL_FIELDS as readonly string[]).includes(f.name)) details[f.name] = value;
  }
  const top = (name: string) => (v[name] ?? "").trim() || null;
  return {
    ok: true,
    value: { kind, email: v.email as string, password: v.password as string, full_name: (v.full_name as string).trim(), phone: top("phone"), organisation: top("organisation"), city: top("city"), details },
  };
}

/** Fields a member may change later (never kind, status or e-mail). Returns the columns to write. */
export function parseProfileUpdate(kind: MemberKind, input: Record<string, FormDataEntryValue | null>): { ok: true; value: { full_name: string; phone: string | null; organisation: string | null; city: string | null; details: Record<string, string> } } | { ok: false; error: string } {
  const info = KINDS[kind];
  const shape: Record<string, z.ZodType<unknown>> = { full_name: z.string().trim().min(2, `${info.nameLabel} is required.`).max(120, "That name is too long.") };
  for (const f of info.fields) shape[f.name] = fieldSchema(f);
  const parsed = z.object(shape).safeParse(Object.fromEntries(Object.entries(input).map(([k, v]) => [k, typeof v === "string" ? v : ""])));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const v = parsed.data as Record<string, string | undefined>;
  const details: Record<string, string> = {};
  for (const f of info.fields) {
    const value = (v[f.name] ?? "").trim();
    if (value && !(TOP_LEVEL_FIELDS as readonly string[]).includes(f.name)) details[f.name] = value;
  }
  const top = (name: string) => (v[name] ?? "").trim() || null;
  return { ok: true, value: { full_name: (v.full_name as string).trim(), phone: top("phone"), organisation: top("organisation"), city: top("city"), details } };
}

export const STATUS_LABEL: Record<MemberStatus, string> = { pending: "Awaiting review", active: "Active", suspended: "On hold" };
export const ENQUIRY_KIND_LABEL: Record<string, string> = { cadet: "Cadet enquiry", school: "School enquiry", board_audit: "Board audit" };
