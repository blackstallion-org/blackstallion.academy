# BSAH website: architecture and security-relevant inventory

4 Nov 2026 · branch `claude/site-refinement-2026-11-02` (working tree) · Phase 1 of `SECURITY-AUDIT.md`. Verified by reading
the code and configuration in this repository and by read-only requests to the live deployment
(`https://project-t9r95.vercel.app`) and the live Supabase API with the public key. Nothing here was assumed from earlier reports
without a check; where a check was impossible it says so.

## 1. Stack

| Item | Value | Where checked |
| --- | --- | --- |
| Framework | Next.js 16.4.2 (App Router, Turbopack, `cacheComponents`, `partialPrefetching`), React 19.3.0 | `package.json` |
| Language | TypeScript 5 (strict), Node 22 in CI (`.github/workflows/ci.yml`), Node 26 on the Mac | CI file, `node -v` |
| Supabase | `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.118.0; one project `tgwadczrfbljnepoaqtb` (Seoul), **shared with the operations apps** | `package.json`, `.env.local` (ref only), `supabase/live/README.md` |
| Validation | zod 4.6.7 on every server action | `app/**/actions.ts`, `lib/**` |
| Hosting | Vercel, functions in `icn1` (`vercel.json`); production serves merge commit `b76131b` (24 Oct), **not this working tree** | `PRODUCTION_READINESS.md` §2, response headers |
| Repository | GitHub `blackstallion-org/blackstallion.academy`, **public**; CI `ci.yml` (`permissions: contents: read`), `uptime.yml` | workflows |

## 2. Entry points

| Kind | Path | Protection that exists today |
| --- | --- | --- |
| Route handler | `GET /api/health` (`?deep=1` pings the database) | public by design; returns only `ok`, region, latency; `no-store` |
| Route handler | `POST /api/payments/razorpay` | HMAC-SHA256 over the raw body (`RAZORPAY_WEBHOOK_SECRET`), 100 kB cap, event-id format check, idempotent `ingest_payment_event` (service role only) that re-checks the amount |
| Route handler | `GET /auth/confirm` | exchanges a PKCE code or OTP token hash; continues to a relative path (**F-06 fixed here**) |
| Server actions | `app/actions.ts` `submitLead` (every public form) | zod per gate, consent, honeypot, idempotency key, rate limit (memory + database), Turnstile when configured |
| Server actions | `app/admin/actions.ts` (sign-in, sign-out, password reset/update, lead status, assign, media upload/delete) | sign-in and reset rate limited, generic errors; every staff action calls `requireStaff()` first |
| Server actions | `app/admin/{accounts,applications}/actions.ts`, `library-actions.ts`, `overview-actions.ts` | `requireStaff()` or `requireAdmissions()` first; database functions re-check the role |
| Server actions | `app/account/actions.ts` (sign-up, own profile) | sign-up rate limited, honeypot, enumeration-safe answer; profile update under RLS + column grants |
| Server actions | `app/enroll/actions.ts` (children, applications, documents, payment start) | `requireAccount()`, rate limit, zod, magic-byte file check, amount from the database |
| Server actions | `app/verify/actions.ts`, `app/schools/access/actions.ts` | rate limited; trustee codes stored as SHA-256 only, HMAC session cookie (HttpOnly, Secure, Strict) |
| Pages behind sign-in | `/admin/*`, `/account`, `/enroll/*`, `/sovereign`, `/{schools,careers,partners}/apply` | `proxy.ts` redirects signed-out visitors; **every page and action re-checks on the server** (proxy is not relied on) |
| Development only | `/dev/admin-dashboard` (SAMPLE data) | `notFound()` and a throwing action when `NODE_ENV=production`; 404 on the live site (checked) |

## 3. Authentication and roles

- Supabase Auth, email + password. Sessions live in cookies set by `@supabase/ssr`; there is **no browser Supabase client**, so
  sessions are only read on the server (`proxy.ts`, `lib/supabase/server.ts`). `getUser()` re-validates the token on every request.
- Staff (`lib/auth/admin.ts`): `public.users.role = 'SUPER_ADMIN'` (live) or `profiles.role in ('operations','executive_admin')`
  (website-only schema). Admissions (`lib/registration/server.ts`): `SUPER_ADMIN` or `ADMISSIONS`. Roles are read fresh from the
  database under RLS on every request, never from the client.
- Role changes: only `SUPER_ADMIN` (database guard trigger F1, `supabase/live/migrations/20261023001100_security_fixes.sql`);
  sign-up role comes from app metadata only (F2). Staff activation (`application_activate_account`) is SUPER_ADMIN-only in SQL.

## 4. Data and storage

- Live schema = operations tables (users, cadets, equine_fleet, school_hubs, achievements, sessions, payment_records, …) plus the
  website layer (`supabase/live/migrations/20261023001000` …`20261104001400`). Website-only schema `supabase/migrations/` is
  **not** applied to live (it would collide).
- Buckets: `website-assets` (public images), `bsah-media` (public media library, staff-only writes), `user-uploads`,
  `private-documents` (MOU PDFs), `application-documents` (applicant folders `<uid>/<application>/…`, 10 MB, PDF/JPEG/PNG/WebP).
- Privileged key `SUPABASE_SECRET_KEY` is used only in `lib/supabase/admin.ts` (MOU PDFs, payment webhook, payment start, app
  metadata after activation). It has no `NEXT_PUBLIC_` prefix; a production build's client bundles contain no secret (checked).

## 5. Integrations

Resend (notifications), Formspree (backup inbox), optional lead webhook (bearer secret), Cloudflare Turnstile (coded, **no keys**),
Razorpay (coded, **no keys**: payments not live), MapTiler (public key, client side), Higgsfield/CloudFront media CDN.

## 6. Protections that already exist (verified)

Security headers on every response (CSP, HSTS 2 years + subdomains, nosniff, DENY framing, strict referrer, permissions policy,
COOP), `poweredByHeader: false`, server-action origin check (Next default, no `allowedOrigins` widening), 4.5 MB action body cap,
redacted server-error logging (`lib/monitoring/report.ts`), structured logs without personal data, `noindex` + `no-store` on the
console, no production source maps (`.map` → 403), no secret files served (`/.env`, `/.git/config` → 404).
