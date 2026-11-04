# Registration and admissions: audit of what exists (4 Nov 2026)

Audit before building the registration and admissions system. Every line was checked in the repository on this date.

## Two database trees, one live project

| Tree | What it is | Live? |
| --- | --- | --- |
| `supabase/live/` | The live Supabase project `tgwadczrfbljnepoaqtb` runs the **operations schema** (shared with the operations apps in `bsah-platform/`): `users` (role PARENT, INSTRUCTOR, GROOM, SCHOOL_ADMIN, SUPER_ADMIN), `cadets` (parent_id, hub_id, passport_code), `consent_records`, `payment_records` (Razorpay-shaped: gateway order/payment ids, GST), `school_hubs`, `training_sessions`, `achievements`, `mou_requests`, `executive_appointments`, `qr_lead_captures`. The website added a layer on top (`supabase/live/migrations/`): `onboarding_leads`, `submit_lead_v2`, `consume_rate_limit`, `audit_events` (append-only), `generated_documents`, `media_assets`, private storage buckets, F1/F2 role-escalation fixes. | yes |
| `supabase/migrations/` | A website-only schema (`profiles`, `member_accounts`, its own `cadets`, `school_hubs`). It **collides** with the live project and must never be applied there. | no |

**Consequence:** the registration system is built as a new additive layer in `supabase/live/migrations/`, on the operations
tables, and tested on the replica harness `supabase/live/tests/run.sh` (stub → live snapshot → every live migration).

## What exists and is reused

| Area | Existing | Reuse |
| --- | --- | --- |
| Sign-up / sign-in / reset | `/admin/login` (one page: "Join now" with four kinds, "Sign in"), `/admin/reset`, `/auth/confirm` (e-mail verification and recovery links), server actions in `app/admin/actions.ts` and `app/account/actions.ts`, Zod-style validation in `lib/accounts/kinds.ts` | `/register` and `/login` lead to it; applications require a signed-in, e-mail-confirmed account |
| Role model | `public.users.role`, read fresh per request (`lib/auth/admin.ts`); roles granted only from `raw_app_meta_data` or by a SUPER_ADMIN (F1/F2, guard trigger) | extended with **ADMISSIONS**; everyone who signs up is PARENT (least privilege) |
| Staff console | `/admin` (overview, leads, enquiries, accounts, documents, media, MOU, QR, audit), `requireStaff()` | new pages: applications, admissions, cadets, schools |
| Anti-abuse | `public.consume_rate_limit`, Cloudflare Turnstile (`lib/security/turnstile.ts`, off until keys exist), honeypots | used by every new form |
| Audit | `public.audit_events` + `app_private.audit()` (append-only, no personal values) | every status change and staff action |
| Payments | `lib/payments/core.ts`: server pricing in paise, Razorpay webhook and checkout signature checks, a state machine where only a verified webhook marks paid. **Not connected** (no keys, no routes) | wired to orders, a webhook route and `payment_records` |
| E-mail | `lib/email/resend.ts` (REST, idempotency keys, no addresses in logs), templates | new transactional templates |
| Storage | private buckets with owner/staff policies | a new private bucket for application documents |
| Parent area | `/account` reads `member_accounts`, which exists only in the website-only tree: **on the live project it has no table to read** | the parent dashboard is built on the live tables at `/sovereign` |

## What is missing (built in this pass)

- applications for four kinds (cadet enrolment, school, staff, partner) with a tracked status, history, documents, duplicate prevention;
- guardian-held child records (minors never get their own login), guardian consent recorded in `consent_records`;
- programmes and campuses (campuses = `school_hubs`), enrolments that create the operations `cadets` row with a passport code;
- admissions review (ADMISSIONS / SUPER_ADMIN), staff account activation by a SUPER_ADMIN;
- enrolment-fee checkout (server-made Razorpay order, verified webhook, idempotent ingestion, invoice fields);
- transactional e-mails with a delivery log;
- the routes `/register`, `/login`, `/enroll`, `/enroll/status`, `/schools/apply`, `/careers/apply`, `/partners/apply`, `/sovereign`,
  `/admin/applications`, `/admin/admissions`, `/admin/cadets`, `/admin/schools`.

## Blockers found

- **No database access from this workspace** to the live project (no access token, database password or secret key here; the
  connected Supabase account belongs to another organisation). The migration is written and tested on the replica; applying it
  is an owner step (`docs/REGISTRATION_SETUP.md`).
- Razorpay keys, the Resend sending domain and Turnstile keys are not provisioned (already recorded in `PRODUCTION_READINESS.md`).
- `bsah-platform/` (operations apps: Sovereign, Field Ops, Command) is a separate project; this pass does not change it. Field Ops access
  follows from the role a SUPER_ADMIN grants on activation (INSTRUCTOR or GROOM), which those apps already read.
