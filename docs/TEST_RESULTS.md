# Test results (24 Oct 2026)

All numbers below were observed in this session. "Local" = the integrated branch built and run in the cloud sandbox
(Linux, Node 22, production build, Postgres 16, Chromium). "Preview" = the protected Vercel preview of the pushed
branch. "Live DB" = the Supabase project, inside transactions that were rolled back unless stated.

## 1. Automated suites (local, branch `session/2026-10-24-final-completion`)

| Suite | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | 0 errors, 8 warnings (pre-existing, untouched files) |
| Types | `npm run typecheck` | pass |
| Unit + server | `npm test` | trustee crypto script pass; **79/79** node tests |
| Production build | `npm run build` | pass (incl. `ensureStatic` validation of the slug routes) |
| Browser smoke | `npm run test:e2e` | **18/18** |
| Database, website schema | `bash supabase/tests/run.sh` | **176/176** |
| Database, live replica | `bash supabase/live/tests/run.sh` | **179/179** (75 existing + 104 hardening) |
| Dependencies | `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities (after zod 4.6.7) |
| CI (GitHub Actions) | `verify`, `database` (+ `e2e` from this push) | runs #1–#4 green; this push: see `PRODUCTION_READINESS.md` |

What the 79 node tests cover (selection): every enquiry gate's validation, consent, honeypot; duplicate submissions
(double click/retry); **database unreachable**, **database down but Formspree up**, **receiver failure**, **e-mail
failure**, rate limit, Turnstile; Resend idempotency and escaping; storage **invalid uploads** (magic bytes, sizes);
MOU PDF content parity with the on-page draft; **staff-only access** (`requireStaff` on every admin page, proxy
redirects, roles); admin filter sanitiser against PostgREST injection; assign/status actions (only allowed columns,
zero-row updates reported); **invalid verification codes**, registry statuses, rate limit; payment webhook/checkout
**signature failures**, refund and out-of-order states; media paths; error-report redaction and alert throttling.

## 2. Database (live project)

- 23 Oct, rolled back (`docs/evidence/2026-10-23-live-supabase-check.md`): RLS on all website tables; anonymous submit
  stored and mirrored; duplicate detected; anonymous read denied; rate limit allow→block; consent required; parent
  reads nothing / cannot self-promote / cannot write private files; super admin reads and updates leads, uploads,
  records documents; real passport verifies (rank + date only); unknown → unknown; sign-up role injection → PARENT.
- 24 Oct, read-only: 5 users (one per role, all `@test.com` seed accounts, never signed in); 2 enquiries (both the
  synthetic QA ones); hardening 001200 **not** applied; Auth redirect allow-list now has the 3 website patterns.

## 3. Preview (Vercel)

| Check | Result |
| --- | --- |
| Synthetic MOU enquiry (`/schools/mou`) | stored + `mou_requests` mirror + private PDF + audit; Formspree accepted; Resend delivered |
| Synthetic parent enquiry with `?qr=` | stored with QR attribution; `qr_lead_captures` mirror (`website-qr`); Formspree + Resend |
| `/verify` | sample → labelled SAMPLE; unknown → "No sealed record" from the live registry |
| `/admin/reset` | generic answer for an unknown address |
| Headers / robots | CSP, HSTS, DENY, nosniff, noindex; `Disallow: /` |
| Media (commit `03e8d2b`) | `/`, `/legend`, `/fleet`, `/verify`: 0 failed requests, 0 broken images |
| Branch with this session's commits | pending the push (see `PRODUCTION_READINESS.md`) |

## 4. Route audit (local, before fixes)

41 routes × 8 widths (320–1920) + reduced motion at 390/1440 = 410 full-scroll runs (Playwright, axe at 390/1440).
Found 0 critical, 14 major, 14 minor. Two were false positives caused by the sandbox's partial media copy (Matrix
thumbnails and the `/cadets` loop video both exist in git and load on Vercel — checked). Fixed and re-verified: M1–M6,
M8–M14 (12 major) and m1, m3–m9 (partly), m11, m13, m14. Still open (minor): m2 (`/curriculum` cards at 768 px), m9
heading order and one small target on `/schools`, m10 (text-reveal words rest at 35 % opacity — design decision),
m12 remote videos without posters.

Targeted re-verification after the fixes (local, Playwright):
- nav on one line at 1280/1366/1440 on 4 reel pages (12/12)
- Reels menu fits at 768/1024
- footer fits at 320
- `/lore` photo, title, folio clear of nav, dark scene (4/4, normal + reduced)
- equipment headline light on dark (2/2)
- story reels with reduced motion: visible, no auto-advance, arrows work (4/4); swipe hint hidden ≤ 430
- `/statue` with reduced motion: one chapter visible (2/2)
- `/journal`: grid inert while closed, one h1
- MOU title clear of the date
- `/cadets` bar labels clear
- `/verify/<code>` honest registry message
- home with reduced motion: film usable, no page errors
- title-card rise: animates in normal motion, static in reduced motion, no console errors

## 5. Performance (local Lighthouse, mobile)

Summary in `docs/PERFORMANCE_REPORT.md`:

- home 40 → 66
- `/legend` 51 → 72
- `/parents` 59 → 70–76
- `/anatomy` did not finish → 74
- `/safety` 75
- `/schools` 32 → 33 (software WebGL)

## 6. Not tested (and why)

| Item | Reason |
| --- | --- |
| Staff sign-in, admin console against live data, media upload, document download by staff | needs a `SUPER_ADMIN` to sign in (owner) |
| Password-reset e-mail end to end | needs a real staff mailbox |
| Applicant receipts, branded sender | Resend domain not verified (DNS approval) |
| Turnstile | no Cloudflare account / keys |
| Payments | deferred by instruction; only unit-tested helpers exist |
| Real phones, Safari/Firefox, real GPU | sandbox has Chromium only, software WebGL |
| Production deployment | not approved yet |
