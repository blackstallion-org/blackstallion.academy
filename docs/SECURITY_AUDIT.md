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
| S8 | Five seed accounts (`…@test.com`, one per role, including a `SUPER_ADMIN`) exist in the live project, never signed in | High (if their passwords are known/weak) | **Open** — owner decision before launch. Restrict rather than delete (see "S8 detail" below); any change to user data needs approval |
| S9 | Resend API key and Supabase secret key were pasted into a chat on 23 Oct | High | **Open** — staged rotation in `docs/ENVIRONMENT_VARIABLES.md`; the replacement keys must be entered into Vercel by the owner (an assistant may not type secrets into a form); revocation needs approval (see "S9 detail") |
| S10 | `zod` < 4.6.6: memory exhaustion on oversized constrained collections (GHSA-mrhx-c7xc-m3w5, CVSS 7.5) | High | **Fixed (code)** — upgraded to 4.6.7; `npm audit --omit=dev` now reports 0 |
| S11 | No bot challenge on forms (Turnstile coded, no keys) | Medium | **Open** — needs a Cloudflare account; mitigated by honeypot, consent, idempotency, per-IP limits (memory + database) |
| S12 | Supabase Auth Site URL is `http://localhost:3000`; no redirect allow-list | Medium (broken reset links) | **Fixed (live)** — allow-list added for previews, `blackstallion-academy.vercel.app` and `blackstallion.academy`; Site URL left unchanged to preserve other apps |
| S13 | Free Supabase plan: no downloadable backups / PITR | Medium (availability) | **Open** — owner decision (paid plan) or manual `pg_dump` routine (`docs/DATABASE_ARCHITECTURE.md` §7) |
| S14 | Reduced-motion visitors triggered a full client re-render (React #418) | Low (robustness) | **Fixed (code)** |
| S15 | The repository is **public** and its documents name the project reference, the open exposures (S3–S5, S7) and the pre-flight queries | Medium (it lowers the effort for anyone who already has, or can extract, the publishable key that the operations apps ship) | **Open** — owner decision: apply 001200 soon (closes S3–S6 for anonymous clients) and/or make the repository private before launch. No credential is in git (scan below) |
| S16 | Staff sign-in is password only: Supabase Auth has no second factor configured, and a `SUPER_ADMIN` can read every enquiry and private document | Medium | **Open** — enable TOTP for the staff account(s) and require it in `requireStaff()` (a small code change, not yet written because enforcing it would lock the owner out until enrolled) |
| S17 | The first production deployment is public by default: Vercel's Standard Protection covers previews only, so merging to `main` would publish `blackstallion-academy.vercel.app` | Medium (premature exposure) | **Accepted by the owner on 24 Oct 2026**: production is public at `https://project-t9r95.vercel.app` (indexing off). To take it private again set Deployment Protection to *All Deployments* (`docs/LAUNCH_INSTRUCTIONS.md` §2.1; it is the owner's account setting) |
| S18 | Eight videos (67.5 MB), 21 journal images (6.2 MB), two hero images and eight stills are loaded from the image provider's CDN (no integrity check; availability and licence depend on the provider) | Low | **Open** — self-host (`scripts/fetch-media.sh`); the CSP names the three origins; the stills now go through the provider's resizer (0.2 MB instead of 7.5 MB) in the meantime |

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
only `xxxx` placeholders (`.env.example`, a PRD example). Deployed secrets are Vercel *sensitive* variables. A
temporary GitHub push token (named `bsah-temp-push-2026-10-24`) was used for the push and the draft
pull request; it is kept only in a protected folder on the owner's Mac VM (never in git, logs or chat). It is to be
revoked in GitHub → Settings → Developer settings after the last push, which needs the owner's confirmation, and the
folder deleted afterwards.

**Dependencies**: `npm audit --omit=dev` → 0 vulnerabilities after the zod upgrade; CI fails on any new high/critical.

**Webhooks**: the optional lead webhook sends a bearer secret and an idempotency key; there are no inbound webhooks
yet (payments are not connected — the Razorpay signature check exists in `lib/payments/core.ts` and is unit-tested).

**Live evidence gathered on 24 Oct (read-only, nothing changed)**

- *Pre-flight for 001200* (`supabase/live/HARDENING_NOTES.md` §4): the columns of `equine_fleet` and `school_hubs` match
  the snapshot; no grant to `PUBLIC` and no inherited role membership that the revoke could not remove; no existing row
  breaks the new format checks; the largest burst of intake rows in any 10 minutes is below the limit of 5; no website
  QR code would stop being mirrored; `submit_lead_v2` and `mirror_lead` are owned by `postgres` and are
  `SECURITY DEFINER`. Nothing blocks applying it.
- *Other consumers*: the project's API logs for the previous 24 hours show no request to the restricted columns or
  tables from any client other than the audit's own read-only checks. One quiet day is not proof for a quarterly job or
  a rarely used screen, so `HARDENING_NOTES.md` §2 still lists who to tell, and the rollback script restores the old
  behaviour in one transaction.
- *Auth*: five users, all `@test.com`, none has signed in; the redirect allow-list holds the three website patterns;
  the Site URL still points at `http://localhost:3000` for the other apps (left alone on purpose).

**S8 detail (seed accounts).** The five accounts are `PARENT`, `INSTRUCTOR`, `GROOM`, `SCHOOL_ADMIN` and `SUPER_ADMIN`.
They have never signed in, but their passwords are not known to this audit, so "weak" cannot be ruled out. Deleting an
account in Supabase Auth cascades: the `parent@test.com` row takes its `public.users` row and the linked cadet row with
it. Banning (Authentication → Users → "Ban user", or a `ban_duration` through the Auth Admin API) is reversible and
enough to make sign-in impossible, so the plan is: ban all five now, delete later only if the owner confirms that no
operations app uses them. Neither step has been run; both need the owner's approval because they change live user data.

**S9 detail (pasted keys).** The Resend account has a single API key (the default "Onboarding" key), so a replacement
must be created before the old one is revoked. `SUPABASE_SECRET_KEY` bypasses RLS and the shared project may also be used
by the operations apps; revoking it before those apps are checked could break them. Both keys are stored in Vercel for
Production and Preview, so the replacement has to be pasted into both scopes (the owner does that; an assistant must not
type a secret into a form), then redeploy, then one synthetic enquiry must reach Supabase, Formspree and Resend before
anything is revoked.

## 3. Recommended order of the open items

1. Approve and apply 001200 (S3–S6) — the pre-flight is clean (above); keep the rollback script at hand.
2. Decide on the seed accounts (S8) before launch: ban now, delete later.
3. Rotate the two pasted keys (S9) using the staged procedure; revoke the old ones only after the check above.
4. Decide on repository visibility (S15) and set Deployment Protection to *All Deployments* before the first merge (S17).
5. Agree role-based read policies with the operations apps (S7), and add a second factor for staff (S16).
6. Turnstile (S11), backups (S13) and self-hosted media (S18) when the accounts/plan are in place.
