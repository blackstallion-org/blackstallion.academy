# Backend contracts for the mobile apps (24 Oct 2026)

The website and the future apps share one Supabase project (`tgwadczrfbljnepoaqtb`). This file lists only what
**exists today**, marks what the website added, and separates what is merely **planned** (tables without any
implemented workflow). No API is described here that has not been implemented. Schema details:
`docs/DATABASE_ARCHITECTURE.md`; replica of the live schema: `supabase/live/baseline/20261023_live_snapshot.sql`.

Legend: **Implemented** (live, exercised) · **Schema only** (table + RLS exist, no workflow/code in this repository) ·
**Planned** (nothing exists yet).

## 0. Readiness verdict for the mobile apps (24 Oct 2026)

**The backend foundation is ready for app development; it is not ready for a public app launch.** What an app can rely
on today is tested live or on the replica (176 + 179 SQL checks, restore rehearsal 12/12): sign-in and sign-up with the
role fixed server-side (F1, F2), the five roles and their row-level security, profiles, cadets linked to a guardian,
the public credential check (`verify_passport`), anonymous-safe lead capture (`submit_lead_v2`), the shared rate limiter,
and private document storage (website side). What still stands between that foundation and a launched app:

| Gap | Why it matters to an app | Owner of the decision |
| --- | --- | --- |
| S7: every signed-in user, including any self-registered parent, can read camera links, microchips, revenue shares, school e-mails and all achievements | an app that lets parents sign up exposes that data to every parent | apps team + owner (role-scoped policies) |
| 001200 not applied (S3–S6) | anonymous clients can read the same data without signing in | owner (approval; pre-flight is clean) |
| Auth Site URL is `http://localhost:3000`; the allow-list has only website addresses | password-reset and magic links in an app need its deep-link scheme in the allow-list; the Site URL should become the production address when the other apps are updated | owner + apps team |
| No backups on the Free plan | a shared production project with children's records | owner (G12) |
| Operations storage buckets have no object policies; no push sender; no payment gateway; no revocation/expiry fields; operations tables are not audited | each is **planned**, none exists, none is described as working | apps team |
| Rotating `SUPABASE_SECRET_KEY` | the apps may use it; revoking it without checking breaks them | owner (S9 procedure) |

Nothing in this file promises an endpoint that does not exist: **Implemented** items have been exercised, **Schema only**
means a table with row-level security but no code, **Planned** means nothing exists yet.

## 1. Authentication — Implemented

- Supabase Auth (e-mail + password). Clients use the project URL and the **publishable** key; never ship the secret key.
- Sign-up creates `public.users` through the `on_auth_user_created` trigger. The role comes **only** from
  `raw_app_meta_data.role` (set by a trusted server/admin), otherwise `PARENT` (security fix F2, live).
- Users cannot change their own `role`, `hub_id`, `email` or `id` (F1 guard trigger, live); only a `SUPER_ADMIN`
  session or a trusted server context can.
- Password reset redirect URLs must be in Supabase → Auth → URL configuration. Today the allow-list holds the website
  addresses only; add the apps' deep-link schemes (e.g. `bsah://auth-callback`) when they exist. The Site URL is still
  `http://localhost:3000` (left unchanged for the existing apps).
- Session handling on web: cookies via `@supabase/ssr` (`lib/supabase/server.ts`). Apps use supabase-js / supabase-dart
  sessions as usual.

## 2. Roles and permissions — Implemented (RLS)

Roles: `PARENT`, `INSTRUCTOR`, `GROOM`, `SCHOOL_ADMIN`, `SUPER_ADMIN` (`public.users.role`). Policy helpers:
`public.current_role_name()`, `public.current_hub_id()`. Every public table has RLS on (event trigger `ensure_rls`).

| Data | PARENT | INSTRUCTOR | GROOM | SCHOOL_ADMIN | SUPER_ADMIN | anonymous today |
| --- | --- | --- | --- | --- | --- | --- |
| own `users` row | read/update (not role/hub/email) | same | same | same | all rows | — |
| `cadets` | own children | own hub | — | own hub | all | — |
| `training_sessions` | own children | own (insert own) | — | own hub | all | — |
| `groom_daily_logs` | — | — | own (insert own) | own hub | all | — |
| `staff_attendance` | — | — | own | own hub | all | — |
| `payment_records` | own | — | — | — | all | — |
| `consent_records`, `device_tokens` | own | own tokens | own tokens | own tokens | — | — |
| `school_hubs`, active `equine_fleet`, `achievements`, `session_skills`, `site_settings`, active `skills` | read | read | read | read | all | **read** (S3–S5: hardening prepared) |
| `mou_requests`, `executive_appointments`, `qr_lead_captures` | insert | insert | insert | insert | read | **insert** |
| website `onboarding_leads`, `audit_events`, `generated_documents` | — | — | — | — | read (status/assignee update on leads) | — |

Known gap (security finding S7): every signed-in role can read camera links, revenue shares and all achievements.
The apps team should agree role-based read policies before launch.

## 3. Profiles and guardians — Schema + Implemented

- Profile = `public.users (id, full_name, email, phone_number, role, hub_id)`; one row per Auth user.
- A guardian is a `users` row with role `PARENT`; children link through `cadets.parent_id`. There is no separate
  guardian table and no multi-guardian relation (**Planned** if needed).

## 4. Cadets and credentials — Schema + Implemented (verification)

- `public.cadets (id, parent_id, hub_id, assigned_horse_id, first_name, last_name, passport_code, current_rank,
  efi_registration_id, onboarding_fee_paid, created_at)`; promotions in `rank_history`; awards in `achievements`.
- Public credential check — **Implemented**: `rpc('verify_passport', { p_code })` →
  `{ status: 'valid', rank, credential_type, issued_at }` | `{ status: 'unknown' }` | `{ status: 'unavailable' }`
  (operations switch `site_settings.verify_public`). Minimal disclosure: no names. Used by `/verify` and the passport
  QR target `/verify/<code>`. Rank values are the `current_rank` code lower-cased without `CADET_` (e.g. `squire`).
- Revocation/expiry: **Planned** — the website already displays `revoked`/`expired` if the function ever returns them,
  but the schema has no revocation or expiry columns today.

## 5. Schools and hubs — Schema only

`public.school_hubs (id, school_name, slug, architectural_tier, address, latitude, longitude, contact_email,
revenue_share_percentage, is_active)`. Hub pages on the website use static content (`lib/content/schools.ts`), not this
table. Hub slugs are the QR attribution codes used by `qr_lead_captures.hub_slug`.

## 6. Enquiries and leads — Implemented

- Write: `rpc('submit_lead_v2', { p_type, p_gate, p_name, p_email, p_phone, p_payload, p_privacy_version,
  p_consent: true, p_attribution, p_idempotency_key })` → `{ status: 'stored', mirror }` | `{ status: 'duplicate' }`.
  Anonymous-safe (SECURITY DEFINER, validates everything, idempotent). An app capturing leads should call this rather
  than inserting into the operations tables directly.
- Read/triage: staff only (`onboarding_leads`; status values `new, reviewing, contacted, qualified, closed, rejected`).
- Rate limiting for any client: `rpc('consume_rate_limit', { p_bucket, p_limit, p_window_seconds })` → `true` while
  under the limit, `false` once exceeded (fixed window). `p_bucket` must match `^[a-z]{2,16}:[a-f0-9]{32,64}$`, i.e.
  `<purpose>:<hex hash of the client key>` — never a raw IP or e-mail; `p_limit` 1–1000, `p_window_seconds` 10–86400.

## 7. Documents and storage — Implemented (website buckets), Schema only (operations buckets)

- `private-documents` (staff; signed URLs), `website-assets` (public read), `user-uploads` (per-user folder
  `<auth.uid()>/…`, images and PDF). Records: `generated_documents`, `media_assets`.
- Operations buckets `session-videos`, `proof-photos`, `invoices` are private with **no object policies** (only the
  service role can read/write); `site-assets` is public. App access needs policies — **Planned**.

## 8. Audit events — Implemented (website tables)

`public.audit_events (actor_user_id, action, entity_type, entity_id, metadata, created_at)`, append-only, staff read.
Written by triggers on website tables (who changed which row/columns, never values) and by `submit_lead_v2`
(`onboarding_lead` submissions). Operations tables are **not** audited yet (**Planned**: attach
`app_private.audit_row_change` triggers per table once agreed).

## 9. Payments, notifications, consent — Schema only / Planned

- `payment_records` exists; no gateway integration is live. `lib/payments/core.ts` (website) has tested helpers for
  Razorpay order/webhook signature checks but is not connected. Live charging needs approval.
- `device_tokens` exists; no push sender exists in this repository.
- `consent_records` exists; the website records consent per enquiry in `onboarding_leads.consent_at` +
  `privacy_notice_version`, not in `consent_records`.

## 10. Edge Functions / server APIs

None are defined in this repository. The website's server logic runs as Next.js server actions (not callable by apps).
If the apps need server-side logic (payments, push, admin tasks), add Supabase Edge Functions or route handlers with
their own contracts and tests.
