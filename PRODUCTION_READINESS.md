# BSAH website — production readiness (23 October 2026)

Written for the Master Production Integration Directive (Layers 00–15). Each statement is backed by a test run or an
explicit status. **Nothing below claims a live result that was not observed.** No credential appears in this file, in
git, or in any log. The only places that hold them are the git-ignored `.env.local` on the Mac and the Vercel project's
encrypted (sensitive) environment variables.

Status words: **LIVE** (observed working against the real service) · **TESTED** (automated tests pass against
local stand-ins) · **CODED** (written, not exercised) · **BLOCKED_EXTERNAL** (needs an owner action or access this
session does not have) · **DEFERRED** (deliberately not built yet).

## 1. Verdict

| Surface | Readiness | Why |
| --- | --- | --- |
| Public website (marketing reels, forms, MOU, verify) | **Ready for a soft launch on `*.vercel.app` with indexing off.** | Build, lint, types, 43 unit, 176 database and 18 browser checks pass. Every enquiry is delivered through Formspree even if Supabase is not live; failures are shown honestly. |
| Staff console (`/admin`: enquiries, documents, media) | **Code complete, not live.** | Needs the Supabase schema applied to the new project and a first staff account. Until then sign-in fails closed. |
| Database (Supabase `tgwadczrfbljnepoaqtb`) | **Not applied.** BLOCKED_EXTERNAL | This session could not reach the project: the network proxy denies `*.supabase.co` and the Supabase connector only sees the old organisation. One-shot SQL is ready. |
| E-mail (Resend) | **Coded and tested, not live.** | `api.resend.com` is blocked from this session. The sending domain is not verified, so only the Resend account owner can receive mail for now. |
| Payments | **DEFERRED** by instruction | `lib/payments/core.ts` is tested but not connected. No live payment code path exists. |
| Apps / Command Center / streaming | Out of scope | Not part of the website build. |

**Stage: beta-ready for the public site once deployed; staff features are beta-ready once the schema is applied.**

## 2. What changed this session, by layer

| Layer | Work | Status | Files |
| --- | --- | --- | --- |
| 00 Audit | Full re-read of the stack, routes, env use and the prior audit | DONE | — |
| 01 Safety | Pre-session archive and patch on the Mac (`_session_snapshots/2026-10-23-pre-session/`); every sync to the Mac is hash-guarded against the last known version so no user edit can be overwritten | DONE | — |
| 02 Database | Additive migration `20261023000800_auth_storage_documents.sql`: profile-on-signup trigger (least-privilege `cadet` role), `generated_documents`, `media_assets`, RLS on both, three storage buckets with size/type limits and per-bucket policies, audit triggers. `supabase/combined/bsah_website_schema.sql` = all eight migrations for a new empty project | TESTED (176/176, re-apply idempotent); **not applied** | `supabase/migrations/…0800…`, `supabase/combined/`, `supabase/tests/40_*.sql` |
| 03 Storage | `website-assets` (public read, staff write; PNG/JPEG/WebP ≤ 4 MB), `user-uploads` (owner folder only; + PDF), `private-documents` (staff only; PDF ≤ 20 MB). Magic-byte type detection, size checks, `prefix/yyyy/mm/uuid.ext` names, 5-minute signed URLs for private files. Existing images and 3D models are untouched | TESTED | `lib/storage/validate.ts`, `app/admin/media/`, `app/admin/documents/` |
| 04 Auth | Supabase Auth for staff only: sign-in, sign-out, password reset by e-mail, new-password form (12+ chars, letters and a number), `/auth/confirm` callback, role check (`operations`, `executive_admin`) via RLS. `proxy.ts` guards `/admin/*`, adds `noindex` and `no-store`. No login on public pages. **No account is created by code** | TESTED (unit + browser redirect) | `proxy.ts`, `lib/auth/admin.ts`, `lib/supabase/{server,admin,rest}.ts`, `app/admin/**`, `app/auth/confirm/route.ts` |
| 05 Forms | All six gates: zod validation, consent, honeypot, idempotency key, memory + database rate limits. Delivery order: Supabase → Formspree (server-side forward of the validated fields) → optional webhook → Resend notification. Success is shown only when at least one channel confirmed. MOU drafts are also stored as a private PDF when the database is live | TESTED | `app/actions.ts`, `lib/leads/formspree.ts` |
| 06 E-mail | Resend client with idempotency keys, escaped HTML templates in the house palette, staff notification, optional applicant receipt (off by default). Logs carry event and status only, never addresses | TESTED (loopback) | `lib/email/resend.ts`, `lib/email/templates.ts` |
| 07 Documents | MOU draft → A4 PDF (pdf-lib) with the same six paragraphs as the on-page draft, unsigned signature lines and a "draft only" footer. No invented clauses, figures or signatures | TESTED (text extracted from the PDF) | `lib/content/mou.ts`, `lib/documents/mou-pdf.ts`, `lib/documents/store.ts`, `app/schools/mou/actions.ts`, `MouGenerator.tsx` |
| 08 Real data | No cadet progress, ranking, certificate or verification result is fabricated. `/verify` answers "registry not connected" until the database is live; demo codes stay labelled SAMPLE | TESTED | `lib/verify/lookup.ts` |
| 09 Security | Supabase new-format keys sent only as `apikey`; the secret key is server-only and used only for private-bucket writes. CSP updated for the Supabase origin. `robots.txt` blocks `/admin` and `/auth/`. Login and document actions rate-limited | TESTED | `next.config.mjs`, `app/robots.ts`, `lib/security/rate-limit.ts` |
| 10 Vercel/GitHub | See section 5. `.vercelignore` now also excludes env files, snapshots and local placeholder stills | BLOCKED_EXTERNAL (approval + push) | `.vercelignore` |
| 11 Performance | Self-hosted fonts (removed the Google Fonts `@import` and `<link>`s), unused faces no longer preloaded. GSAP, Lenis and 3D kept | TESTED (build) | `lib/fonts.ts`, `app/globals.css`, `Matrix.tsx` |
| 12 Monitoring | Structured, PII-free server logs for each delivery channel. Error tracking (Sentry) and uptime checks are not set up | PARTIAL / BLOCKED_EXTERNAL | — |
| 13 Testing | See section 4 | TESTED | `tests/`, `supabase/tests/`, `scripts/e2e-smoke.mjs` |
| 14–15 Readiness | This file; runbook and progress log updated | DONE | `PRODUCTION_READINESS.md`, `docs/DEPLOYMENT_RUNBOOK.md`, `docs/IMPLEMENTATION_PROGRESS.md` |

Owner-requested design work (no redesign of anything else):

- **Typography:** Noto Serif Display (display) + Plus Jakarta Sans (UI), both SIL OFL, self-hosted with licences in
  `app/fonts/`. The doctrine line now reads as one statement, "We do not teach children to ride. *We forge them to lead.*",
  balanced across 2–4 lines with no collisions from 320 px to 1920 px.
- **Hero film:** the frame now matches the footage's true scope ratio (≈ 2.48 : 1), sits full-width under the
  navigation, has no black bands, and the controls sit directly under the picture. Measured frame heights: 145 px
  (360 px wide), 157 px (390), 173 px (430), 581 px (1440).
- **Letter-roll menu animation** (AlignUI pattern, rebuilt on the site's `motion/react` and tokens; reduced motion =
  plain text) on the desktop navigation and the Reels menu.
- **House palette moodboard** section on the home page (after the image gallery): five existing stills in a collage on
  ivory with the palette circles down the seam, plus a text column and swatch list. Built from the site's own images
  and tokens, not copied from the reference.
- **Not done:** the two uploaded HTML prototypes ("The Art of the Peg", "One Conversation. Two Bodies") are reference
  only and are not integrated.

## 3. Environment variables

Set in Vercel as **sensitive** (production + preview) — values are never printed:

`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `FORMSPREE_ENDPOINT`,
`LEAD_NOTIFY_EMAIL`, `RATE_LIMIT_SALT`, `TRUSTEE_SESSION_SECRET` (both random, generated for this project).

Deliberately left empty: `NEXT_PUBLIC_ALLOW_INDEXING` (search engines stay out), `RESEND_CONFIRMATIONS` (no mail to
applicants until the sending domain is verified), `RESEND_FROM` (defaults to Resend's test sender),
`NEXT_PUBLIC_SITE_URL` (auth links fall back to the request origin), `TRUSTEE_INVITATIONS_JSON` (no invitations
issued), Turnstile keys (no account), payment keys (deferred).

## 4. Test evidence (cloud build copy, Linux, 23 Oct 2026)

| Check | Result |
| --- | --- |
| `npm run lint` | 0 errors, 8 warnings (pre-existing, in untouched files) |
| `npm run typecheck` | pass |
| `npm test` | trustee crypto script pass; **43/43** node tests (leads incl. Formspree-only and database-down paths, Resend escaping and idempotency, storage validation, MOU PDF content, storage upload/rollback, staff roles, proxy redirects and headers, payments core, verify) |
| `bash supabase/tests/run.sh` | **176 passed, 0 failed** (all 8 migrations, RLS, storage policies, re-apply) |
| `npm run build` | pass; all routes including `/admin/*` and the Proxy |
| `npm run test:e2e` | **18/18** in Chromium: headers/CSP, 39 routes without CSP violations, hero frame ratio at 360/390/430/1440, doctrine statement, letter-roll hover, moodboard, lead double-click → one delivery, consent, verify, MOU PDF download, `/admin` redirect + `noindex` |
| Live Supabase / Resend / Formspree calls | **Not run** — hosts blocked from this session (403 at the network proxy) |

## 5. Deployment status

- Vercel team: `stingrajx7-8034s-projects`. Planned project `blackstallion-academy` (Next.js). Target: production on the
  free `*.vercel.app` address, indexing off, **no DNS change**, no custom domain.
- **Not created yet:** the Vercel connection can read the team but needs one more approval (team write access) before it
  can create the project and add the sensitive variables. Approval links were sent in the chat; they expire after 10 minutes.
- Local commits (not pushed): branch `session/2026-10-23-production-integration`. A clean copy of that commit was
  checked separately: lint 0 errors, types pass, 43/43 tests, 176/176 database checks, build passes (57 pages).
- The code is not on GitHub yet (the repo `blackstallion-org/blackstallion.academy` has one boilerplate commit and is
  **public** — anything pushed there can be read by anyone). Vercel's GitHub app is installed only on the personal
  `Stingraj` account, not on `blackstallion-org`.
- Media: about 549 MB of files under `public/` would be committed (largest: `public/video/hero-main.mp4` 34.5 MB,
  `public/models/rossbandiger-1/statue.glb` 33 MB). All are under GitHub's 100 MB limit. About 297 MB are unreferenced
  (`docs/MEDIA_INVENTORY.md`) and could be moved out before pushing.

## 6. Blockers and the owner action that clears each

| # | Blocker | Owner action |
| --- | --- | --- |
| P1 | Database not applied | Supabase dashboard → project `tgwadczrfbljnepoaqtb` → SQL editor → run `supabase/combined/bsah_website_schema.sql` once (new, empty project only). Or reconnect the Supabase connector to that organisation and ask Claude to apply the migrations |
| P2 | No staff account | Supabase → Authentication → Add user (your own e-mail). Then in SQL: `update public.profiles set role = 'executive_admin' where id = (select id from auth.users where email = '<your e-mail>');` |
| P3 | Auth e-mail links | Supabase → Authentication → URL configuration: Site URL = the Vercel production address; add `<that address>/auth/confirm` to redirect URLs. Optional: Resend SMTP |
| P4 | Resend sending domain | Verify `blackstallion.academy` in Resend (DNS records — needs your approval), then set `RESEND_FROM` and, if wanted, `RESEND_CONFIRMATIONS=1` |
| P5 | Code on GitHub | Push the session branch from the Mac (command in the final report), and install the Vercel GitHub app on `blackstallion-org` — or deploy with `npx vercel --prod` from the Mac |
| P6 | **Exposed credentials** | The Resend API key and the Supabase secret key were pasted into a chat. After the site is live, rotate both (Resend → API keys; Supabase → Settings → API keys) and update `.env.local` and the Vercel variables |
| P7 | Monitoring | Choose an error tracker (e.g. Sentry) and an uptime check; neither is set up |
| P8 | Legal | Privacy notice and minors' consent still marked "draft, pending legal review" (B06) |
| P9 | Media licences | Higgsfield placeholder art, vendored components and 3D models need licence confirmation before a public launch (B04) |

## 7. Approvals still required before a full public launch

DNS for `blackstallion.academy`, turning on search indexing, live payments (gateway account + sign-off), sending
e-mail to applicants, and any change to production records. None of these has been done.
