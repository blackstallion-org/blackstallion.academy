# Registration and admissions: architecture (4 Nov 2026)

Built into the existing site and the live operations schema; nothing is rebuilt. Audit: `docs/REGISTRATION_AUDIT.md`.

## Flow

```
Visitor -> /register (choose kind) -> account (/admin/login "Join now", e-mail confirmed by Supabase Auth)
        -> application form (draft) -> documents -> consent + submit -> admissions review
        -> info required (applicant edits, resubmits) | approved | rejected
        -> [cadet] fee (Razorpay, verified webhook) -> enrolment (operations cadet + passport code) -> parent dashboard
        -> [staff/school] SUPER_ADMIN activates the operational role (INSTRUCTOR, GROOM, SCHOOL_ADMIN) -> field apps
```

Statuses: `draft`, `submitted`, `under_review`, `info_required`, `approved`, `rejected`, `enrolled`, `withdrawn`. The applicant moves
draft/info_required -> submitted and can withdraw until a decision; reviewers move submitted/under_review onward; enrolment is a separate
step that needs `approved` and a paid (or no) fee.

## Roles (public.users.role on the live project)

| Brief's role | Implemented as | Can |
| --- | --- | --- |
| PARENT | `PARENT` (everyone who signs up) | own children, own applications and documents, own payments, cadets, sessions |
| CADET | no login (guardian-mediated) | a minor is a `guardian_children` record and, once enrolled, an operations `cadets` row owned by the parent |
| SCHOOL_ADMIN | `SCHOOL_ADMIN` (existing) | granted by a SUPER_ADMIN to an approved school applicant |
| INSTRUCTOR / FIELD_OPS | `INSTRUCTOR`, `GROOM` (existing) | granted by a SUPER_ADMIN to an approved staff applicant; the field apps already read these |
| ADMISSIONS | `ADMISSIONS` (new) | read and review applications, children, documents, enrolments; enrol; cannot grant roles, set prices or read `users` |
| SUPER_ADMIN | `SUPER_ADMIN` (existing) | everything above, plus programme fees, account activation, payment events |

Submitting any form grants nothing: staff, school and partner applicants stay `PARENT` until a SUPER_ADMIN activates them.

## Data (supabase/live/migrations/20261104001400_registration_admissions.sql)

| Table | Purpose | Notes |
| --- | --- | --- |
| `programs` | programmes with age band, enrolment fee (paise) and GST rate | public read of active rows; SUPER_ADMIN writes |
| `guardian_children` | children held by their guardian | guardian CRUD (not the cadet link); admissions read |
| `applications` | one row per application, four kinds, status, payload (validated JSON), consent version and time, decision, fee, payment state | applicant name/e-mail stamped at insert; unique open application per child (cadet) and per person (other kinds) |
| `application_events` | append-only history, each step marked visible to the applicant or internal | written only by functions |
| `application_documents` | metadata of files in the private bucket `application-documents` (`<user>/<application>/<file>`) | PDF/JPEG/PNG/WebP, 10 MB, only while the application is editable |
| `enrollments` | enrolment of an approved application into a programme and campus | links the operations `cadets` row |
| `payment_records` (+columns) | existing ledger; adds `application_id`, `amount_paise`, `invoice_number`, `paid_at`, `refunded_paise` | parent reads own (existing policy) |
| `payment_events` | Razorpay events applied once (event id primary key) | SUPER_ADMIN read |
| `consent_records` (+column) | existing; adds `application_id`; one row per submitted cadet application | |
| `notification_log` | template, channel, outcome per e-mail; no address, no content | admissions read |

Functions: `application_submit`, `application_withdraw`, `application_review`, `application_enrol`, `application_activate_account`
(authenticated, each checks the caller), `ingest_payment_event` (service role only). Every step writes `application_events` and the
existing `audit_events`.

## Code

| Area | Files |
| --- | --- |
| Rules shared by forms, actions, console | `lib/registration/model.ts` (kinds, statuses, transitions, documents, Zod schemas, fees), `lib/registration/fields.ts` (questions per kind) |
| Guards | `lib/registration/server.ts` (`requireAccount`, `requireAdmissions`, error messages) |
| Applicant actions | `app/enroll/actions.ts` (children, drafts, uploads with content sniffing, submit, withdraw, payment start) |
| Applicant pages | `/register`, `/login`, `/enroll`, `/enroll/status`, `/enroll/status/[id]`, `/schools/apply`, `/careers/apply`, `/partners/apply`, `/sovereign` |
| Console | `/admin/admissions`, `/admin/applications`, `/admin/applications/[id]`, `/admin/cadets`, `/admin/schools`; actions in `app/admin/applications/actions.ts` |
| Payments | `lib/registration/razorpay.ts`, `app/api/payments/razorpay/route.ts` (webhook), `lib/payments/core.ts` (signatures, existing) |
| E-mail | `lib/registration/notify.ts` on `lib/email/resend.ts` |
| Session | `proxy.ts` covers the new private routes and returns to them after sign-in |

## Not in this pass

Phone OTP (no SMS provider approved), SMS/WhatsApp notices, attendance and progress modules beyond the existing training sessions,
admin MFA enforcement in code (see `docs/REGISTRATION_SECURITY.md`), changes to the separate operations apps in `bsah-platform/`.
