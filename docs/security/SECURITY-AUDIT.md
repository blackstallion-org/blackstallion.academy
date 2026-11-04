# BSAH production security audit

4 Nov 2026 · working tree of `claude/site-refinement-2026-11-02` · architecture and inventory: `01-architecture-audit.md`.
Earlier audit (24 Oct, findings S1 to S18): `docs/SECURITY_AUDIT.md`; its open items were re-checked here and keep their S numbers.

**Limits of this audit.** The Supabase account connected to this session cannot reach the BSAH project (`tgwadczrfbljnepoaqtb`; it
lists two unrelated projects, which were not touched), so the live schema, policies, Auth settings, users and storage were checked
only from the outside: read-only anonymous REST and Storage requests with the public key, printing status codes, row counts and
column names (never values). Vercel environment settings were not readable. No account was created, no record was written, and no
real payment was attempted.

## 1. Findings

| ID | Sev. | Component | Evidence | Exploitability / impact | Remediation | Test performed | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S3 | High | live `public.equine_fleet` | anonymous `GET /rest/v1/equine_fleet?select=*` → 200 with `microchip_iso_id` and `stall_cctv_rtsp_url` columns; 1 row has a microchip id (CCTV currently empty) | anyone with the public key (shipped in the operations apps) reads horse microchip ids, and camera links as soon as they are entered | apply `supabase/live/migrations/20261023001200_anon_privacy_hardening.sql` (prepared, tested on the replica, rollback ready) | live anonymous probe | **Open**: needs owner approval and database access |
| S4 | High | live `public.school_hubs` | anonymous read returns `revenue_share_percentage` (1 row filled) and `contact_email` | business terms readable by anyone | same migration (001200) | live anonymous probe | **Open** (as S3) |
| S5 | High | live `achievements`, `session_skills` | anonymous read answers 200 with 0 rows today (empty or filtered; not distinguishable from outside) | children's records would be readable once present | same migration (001200) | live anonymous probe (inconclusive) | **Open** |
| S7 | High | live operations schema | not testable without a signed-in account (none was created) | any signed-up parent can read S3 to S5 data (24 Oct finding) | role-based policies agreed with the operations apps (`supabase/live/HARDENING_NOTES.md`) | none | **Blocked**: test account and approval |
| S8 | High | live Auth users | not readable from here | five `@test.com` seed accounts including a SUPER_ADMIN (24 Oct finding) | disable or restrict, owner decision | none | **Blocked** |
| S9 | High | Resend key, Supabase secret key | pasted into a chat on 23 Oct; rotation status not visible | whoever has the transcript has working credentials | rotate both, enter the new values in Vercel, redeploy (`docs/ENVIRONMENT_VARIABLES.md`) | none possible | **Open**: owner to confirm rotation |
| F-06 | Medium | `app/auth/confirm/route.ts` | `?next=/%5Cevil.com` passed the "starts with `/`, not `//`" check; `new URL("/\\evil.com", base)` resolves to `https://evil.com/` (reproduced in Node) | with a recovery link for the attacker's own account, the victim is signed into that account and sent to a lookalike site (login CSRF + phishing) | use the existing strict `safeNext()` (no backslash, no scheme) | `tests/security-audit-fixes.test.mjs` F-06 (8 bad inputs, 4 good) | **Fixed** (code, not deployed) |
| F-07 | Medium | `proxy.ts`, `lib/supabase/server.ts` | `@supabase/ssr` defaults: `httpOnly: false`, no `secure` (`node_modules/@supabase/ssr/dist/main/utils/constants.js`) | any script injection could read the session token; a first plain-HTTP request could carry it | `AUTH_COOKIE_OPTIONS` (HttpOnly, SameSite=Lax, Secure in production) passed to both clients; safe because there is no browser Supabase client | test F-07 (options, both call sites, no `createBrowserClient`); e2e "staff console redirect" passes | **Fixed** (code, not deployed) |
| S16 | Medium | staff sign-in | password only; no TOTP | a phished staff password exposes every enquiry and private document | enable TOTP, then require AAL2 in `requireStaff()` | none | **Open**: enforcing it before enrolment would lock the owner out |
| S11 | Medium | public forms | Turnstile keys absent (`lib/security/turnstile.ts` skips) | scripted spam within the rate limits | create the Cloudflare keys; code is ready | unit tests (existing) | **Open** (mitigated: honeypot, consent, idempotency, per-IP limits) |
| S13 | Medium | Supabase Free plan | no downloadable backups / PITR (24 Oct) | data loss on an incident | paid plan or the scripted `pg_dump` routine | not re-checked | **Open** |
| S15 | Medium | public GitHub repository | docs name the project reference and the open exposures | lowers the effort to exploit S3 to S7 | apply 001200, consider a private repository before launch | read the repo | **Open** (owner) |
| F-08 | Medium | CSP | `script-src 'unsafe-inline'` (live header) | an HTML-injection bug would execute; none was found (`dangerouslySetInnerHTML` only on static strings and escaped JSON-LD) | nonces need dynamic rendering of every page (performance trade-off) | header read on production | **Accepted risk** (documented in `next.config.mjs`) |
| F-11 | Low | `lib/security/rate-limit.ts` | without `RATE_LIMIT_SALT`/`TRUSTEE_SESSION_SECRET` each server instance used its own random salt, splitting the shared database limit per instance | limits multiply by the number of instances if the salt is ever missing (Vercel has it per `docs/ENVIRONMENT_VARIABLES.md`, not verifiable here) | derive a stable salt from the server-only Supabase secret before the per-process fallback | test F-11 | **Fixed** (code, not deployed) |
| F-09 | Low | `/api/payments/razorpay` | the `x-razorpay-event-id` header is not covered by the signature | replaying a captured signed refund body with a new event id would add the refund twice to the ledger (capped at the paid amount); needs a body only Razorpay and the server see | de-duplicate on a hash of the raw body as well | read the code and `ingest_payment_event` | **Open** (payments not live) |
| F-10 | Low | `application-documents` storage policies | owner may insert or delete objects in their own folder whatever the application status (the table row is status-checked) | an applicant could remove a file behind a submitted record | add the status check to the storage policies | read the migration | **Open** (needs a migration) |
| F-12 | Low | auth e-mail links | `NEXT_PUBLIC_SITE_URL` unset, so links use the request origin | mitigated: Vercel sets the forwarded host and Supabase only accepts allow-listed redirect URLs | set `NEXT_PUBLIC_SITE_URL` at launch; add the live domain to the Auth allow-list | read the code | **Mitigated** |
| F-13 | Low | Vercel | `access-control-allow-origin: *` on HTML responses (platform default) | no effect on credentialed requests; no private data in public pages; console pages are `private, no-store` | none needed | headers read on production | **Not applicable** |
| F-14 | Low | GitHub | actions pinned by tag, not commit SHA; `main` has no branch protection | a compromised action tag or a direct push reaches CI / production | pin SHAs; protect `main` (owner) | read the workflows | **Open** |
| F-15 | Info | dev dependencies | `npm audit`: 0 in production dependencies; 16 moderate in the ESLint chain (`minimatch`); npm's suggested "fix" is a downgrade | not shipped | update ESLint when a compatible release exists | `npm audit` | **Accepted** |

S1, S2, S10, S12, S14 (fixed on 24 Oct) were not regressed: role guard and sign-up role are still the live behaviour per the
migrations, zod is 4.6.7, the Auth allow-list is unchanged in the docs.

## 2. Controls verified this time

Server-side authorisation on every admin, admissions, account and enrolment page and action (`requireStaff` / `requireAdmissions`
/ `requireMember` / `requireAccount`, roles read fresh under RLS); generic sign-in and reset errors; rate limits on sign-in, reset,
sign-up, leads, verify, trustee and applications; zod on every action; magic-byte checks on uploads; payment amount from the
database and only the signed webhook marks paid; `SECURITY DEFINER` functions all pin `search_path`; anonymous REST is refused on
`onboarding_leads`, `applications`, `application_documents`, `guardian_children`, `payment_events`, `audit_events`,
`generated_documents` (401) and returns nothing from `users`, `payment_records`, `cadets`; anonymous Storage lists nothing in any
bucket; no secrets in source, git history (253 commits), or the 122 client bundle files of a fresh build; no source maps, `.env` or
`.git` served; dev routes 404 in production; email templates escape user input.

## 3. Summary

| Area | Result |
| --- | --- |
| Secrets | **BLOCKED**: none in code, history or bundles; S9 rotation unconfirmed |
| Authentication | **PASS** after F-06/F-07 (code); MFA open (S16) |
| Admin Authorization | **PASS** (code); never exercised by a live SUPER_ADMIN session in this audit |
| Supabase RLS | **FAIL**: S3/S4 confirmed live; S5/S7/S8 not verifiable here |
| APIs | **PASS** (F-09 low, payments not live) |
| Forms | **PASS** (Turnstile not configured: S11) |
| XSS / CSRF / CORS | **PASS** (CSP `unsafe-inline` accepted risk) |
| Rate Limiting | **PASS** (shared database limiter; F-11 fixed) |
| Security Headers | **PASS** (production headers read) |
| Storage | **PASS** with F-10 low; live policies seen from outside only |
| Payments | **BLOCKED**: configuration required (no Razorpay keys) |
| Dependencies | **PASS** (0 production advisories) |
| GitHub / Vercel | **FAIL**: public repository with the exposure plan (S15), no branch protection, Vercel env not readable |
| Regression Tests | **FAIL**: typecheck, lint (touched files) and build pass; `npm test` 271/279 and e2e 16/19, every failure in media and home-page tests touched by other uncommitted work, none in security code |

## 4. Release gate: **NO-GO**

| Requirement | Result |
| --- | --- |
| No unresolved Critical | pass (none found) |
| No unresolved High without an approved exception | **fail**: S3, S4 (live), S5, S7, S8, S9 |
| No known active credential exposure | **unknown**: S9 rotation not confirmed |
| Authentication and authorisation tests pass | pass in code and unit tests; not exercised with a live staff account |
| RLS verified against the target environment | **fail**: S3/S4 open; no catalog access |
| Abuse protections operational | partial: rate limits yes, Turnstile no |
| Security headers verified | pass |
| Production build succeeds | pass |
| Critical functional regression tests pass | **fail**: 8 unit and 3 e2e failures from other uncommitted work in this tree |
| Database changes reviewed with rollback | 001200 reviewed with rollback; **not applied** |
| Payments verified before real payments | **blocked** (not configured; must stay off) |

Per the brief nothing was committed, pushed or deployed. The three code fixes (F-06, F-07, F-11) and their tests are in the
working tree. Production still serves the 24 Oct commit.

## 5. What unblocks the gate, in order

1. Owner: confirm the Resend and Supabase secret keys were rotated (S9), or rotate them now.
2. Owner approval and database access: apply `20261023001200_anon_privacy_hardening.sql` (closes S3 to S6 for anonymous clients),
   then re-run `supabase/live/tests/run.sh` and this audit's anonymous probe.
3. Owner: decide the seed accounts (S8) and the authenticated read policies (S7).
4. Settle the other sessions' uncommitted media and home-page work so `npm test` and the e2e smoke are green again.
5. Commit F-06/F-07/F-11, push the branch, deploy a Vercel preview, smoke-test it, then ask for production approval.
6. Before launch: Turnstile keys (S11), staff TOTP (S16), backups (S13), `NEXT_PUBLIC_SITE_URL` and the Auth allow-list (F-12),
   branch protection and SHA-pinned actions (F-14).

## 6. Launch preparation (4 Nov 2026, second pass)

**Approvals.** The owner approved applying 001200 (A) and 001600 (B) to the live project. Not applied yet: this session still
has no access to `tgwadczrfbljnepoaqtb` (the connected Supabase account lists two unrelated projects; the CLI has no login).

**Prepared and tested, waiting for access**

| Item | What | Evidence |
| --- | --- | --- |
| S3, S4, S5, S6 | `supabase/live/migrations/20261023001200_anon_privacy_hardening.sql` + rollback; read-only pre-flight in `supabase/live/HARDENING_NOTES.md` §4 | live columns match its snapshot exactly (anonymous probe); website reads `school_hubs` only signed in, safe columns; replica 382 / 382 |
| F-10 | `supabase/live/migrations/20261104001600_application_documents_storage_status.sql` + rollback; tests 76, 77 | replica: uploads only into an own draft / info_required application; files behind a submitted application can no longer be deleted; reads unchanged; rollback restores the 001400 policies |

**Fixed in code since §1 (not deployed)**

| Item | Change |
| --- | --- |
| F-14 | `.github/workflows/ci.yml`: every action pinned to the commit its `v4` tag points to today (checkout v4.4.0, setup-node v4.4.0, upload-artifact v4.6.2); no behaviour change |
| S16 | Authenticator-app second factor for staff and admissions: `lib/auth/mfa.ts`, `lib/auth/mfa-session.ts`, `/admin/mfa` (enrol with a QR code, then a code per session), hooks in `requireStaff()` and `requireAdmissions()`. **Off until `STAFF_MFA_REQUIRED=1`**, so nobody is locked out; codes are rate limited like passwords |

**Re-verified**: no secret-shaped strings in the 30 scripts the live production site serves; tests `tests/security-audit-fixes.test.mjs` 5 / 5,
`tests/admin-console.test.mjs` 30 / 30 (one explicit exception added for `/admin/mfa`), `npm test` 296 / 304 (the 8 failures are the
media-manifest tests of other sessions' uncommitted work), typecheck clean, production build passes.

**S7 in detail (replica, live policies).** After 001200 a signed-in account (any self-registered parent) still reads, through
`public_read_horses`, `public_read_hubs`, `public_read_achievements` and `read_session_skills` (all `using (true)` or `is_active`):
every horse's CCTV link and microchip id, every hub's revenue share and contact e-mail, every child's achievements and session
skills. Closing it changes what the operations apps' instructors, grooms and parents can read, so it needs those apps' contract:
**owner decision**, then a migration in the same pattern (column grants for `authenticated`, ownership policies for achievements).

**Other sessions' work, observed only.** The phone-code and Google sign-in being added in this tree keep `safeNext` and rate-limit
code requests per connection and per number. Before switching phone sign-in on: Turnstile on the code request and the SMS
provider's country allow-list (SMS-cost abuse).
