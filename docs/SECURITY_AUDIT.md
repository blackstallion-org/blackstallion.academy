# Security audit (website + shared Supabase project, 24 Oct 2026)

Scope: the Next.js website, its Vercel deployment and the Supabase project it shares with the operations apps.
Method: code review, automated tests (unit, server-action, SQL replica, browser), live read-only and rolled-back checks
against Supabase, header checks on the Vercel preview, dependency audit and a secret scan of the whole git history.
No penetration test by a third party has been done.

Severity: **Critical** (data exposure or privilege escalation now) · **High** · **Medium** · **Low**.
Status: **Fixed (live)** · **Fixed (code, deploys with the next push)** · **Prepared (needs approval)** · **Open**.

## 1. Findings

| # | Finding | Severity | Status |
| --- | --- | --- | --- |
| S1 | Any signed-in user could promote themselves to `SUPER_ADMIN` (own-profile update policy + full column grants) | Critical | **Fixed (live)** — F1 guard trigger (`supabase/live/migrations/20261023001100_security_fixes.sql`) |
| S2 | Sign-up could request any role through user metadata (`handle_new_user`) | Critical | **Fixed (live)** — F2: role from server-controlled app metadata, default PARENT |
| S3 | Anonymous internet users can read stall CCTV stream links and microchip ids (`equine_fleet`) | High | **Prepared** — 001200 hardening (anonymous column grants) |
| S4 | Anonymous users can read hub revenue shares and contact e-mails (`school_hubs`) | High | **Prepared** — 001200 |
| S5 | Anonymous users can read children's achievements (`achievements`) and session skills | High | **Prepared** — 001200 |
| S6 | Open anonymous inserts (`mou_requests`, `executive_appointments`, `qr_lead_captures`) with `check (true)` — spam/abuse | Medium | **Prepared** — 001200 adds format checks + per-client rate limit; the website itself only writes through `submit_lead_v2` |
| S7 | Any **signed-in** user (anyone who can create a parent account) can still read S3–S5 data | High | **Open** — needs role-based policies agreed with the operations apps; listed in `supabase/live/HARDENING_NOTES.md` |
| S8 | Five seed accounts (`…@test.com`, one per role, including a `SUPER_ADMIN`) exist in the live project, never signed in | High (if their passwords are known/weak) | **Open** — owner decision: delete or reset before launch (deleting user data needs approval) |
| S9 | Resend API key and Supabase secret key were pasted into a chat on 23 Oct | High | **Open** — staged rotation in `docs/ENVIRONMENT_VARIABLES.md`; revocation needs approval |
| S10 | `zod` < 4.6.6: memory exhaustion on oversized constrained collections (GHSA-mrhx-c7xc-m3w5, CVSS 7.5) | High | **Fixed (code)** — upgraded to 4.6.7; `npm audit --omit=dev` now reports 0 |
| S11 | No bot challenge on forms (Turnstile coded, no keys) | Medium | **Open** — needs a Cloudflare account; mitigated by honeypot, consent, idempotency, per-IP limits (memory + database) |
| S12 | Supabase Auth Site URL is `http://localhost:3000`; no redirect allow-list | Medium (broken reset links) | **Fixed (live)** — allow-list added for previews, `blackstallion-academy.vercel.app` and `blackstallion.academy`; Site URL left unchanged to preserve other apps |
| S13 | Free Supabase plan: no downloadable backups / PITR | Medium (availability) | **Open** — owner decision (paid plan) or manual `pg_dump` routine (`docs/DATABASE_ARCHITECTURE.md` §7) |
| S14 | Reduced-motion visitors triggered a full client re-render (React #418) | Low (robustness) | **Fixed (code)** |

## 2. Controls verified

**Transport and headers** (preview, 23 Oct): CSP allow-list (`default-src 'self'`, `frame-ancestors 'none'`,
`object-src 'none'`, `form-action 'self'`, named media/font/Turnstile origins), HSTS 2 years with subdomains,
`X-Frame-Options: DENY`, `nosniff`, `strict-origin-when-cross-origin`, Permissions-Policy (camera, microphone,
geolocation, payment, USB off), COOP `same-origin`, no `x-powered-by`. Previews: `x-robots-tag: noindex` and
`robots.txt` → `Disallow: /`. The CSP still allows `'unsafe-inline'` scripts/styles (nonces would disable static
rendering) — accepted trade-off, documented in `next.config.mjs`.

**Authentication and authorisation**: Supabase Auth (cookies via `@supabase/ssr`); `proxy.ts` guards `/admin/*`
(redirect, `noindex`, `no-store`); every admin page and server action calls `requireStaff()` on the server (role
`SUPER_ADMIN` from `public.users`), never trusting the UI; RLS is the final gate (staff-only read on enquiries,
documents, audit; staff may update only `status`/`assigned_to`). Sign-in errors are generic; password reset always
answers the same way (verified live); reset links use the request origin and are restricted by the redirect allow-list;
new passwords ≥ 12 characters with letters and digits. Login and reset are rate-limited.

**Enquiries**: zod validation server-side, consent required, honeypot, idempotency key (database unique + in-memory
replay guard), memory + database rate limits keyed by a salted hash of the client address, attribution allow-list,
payload size cap, the anonymous role cannot read or update `onboarding_leads` (verified live, rolled back).

**Storage**: magic-byte type detection and size limits before upload; private bucket for generated documents with
5-minute signed URLs; per-bucket `storage.objects` policies (staff write for site assets, owner folder for user
uploads, staff only for private documents); object names are random UUIDs under dated folders.

**Verification**: `verify_passport` returns rank and issue date only; it honours the operations team's
`site_settings.verify_public` switch; lookups are rate-limited; sample records are labelled SAMPLE.

**Logging**: structured JSON with event names and statuses only; e-mails, phone numbers and key-like strings are
redacted from server-error logs (`lib/monitoring/report.ts`, unit-tested); no request bodies are logged.

**Secrets**: none in git — a scan of every commit for Supabase/Resend/Razorpay/GitHub/JWT/private-key patterns found
only `xxxx` placeholders (`.env.example`, a PRD example). Deployed secrets are Vercel *sensitive* variables. The
temporary GitHub push token was stored only in the VM's home folder and deleted after use.

**Dependencies**: `npm audit --omit=dev` → 0 vulnerabilities after the zod upgrade; CI fails on any new high/critical.

**Webhooks**: the optional lead webhook sends a bearer secret and an idempotency key; there are no inbound webhooks
yet (payments are not connected — the Razorpay signature check exists in `lib/payments/core.ts` and is unit-tested).

## 3. Recommended order of the open items

1. Approve and apply 001200 (S3–S6) after the pre-flight queries in `supabase/live/HARDENING_NOTES.md`.
2. Decide on the seed accounts (S8) before launch.
3. Rotate the two pasted keys (S9) using the staged procedure.
4. Agree role-based read policies with the operations apps (S7).
5. Turnstile (S11) and backups (S13) when the accounts/plan are in place.
