# BSAH website — production readiness (24 October 2026, final audit, updated after the effects integration)

Fresh audit after the "Final Master Execution Directive". Every status is backed by evidence observed this session;
nothing is claimed live that was not observed. No credential appears in this file, in git or in any log.

Status words: **Complete** (works in the intended environment, evidence below) · **Partial** · **Blocked** (needs an
external account/approval) · **Deferred** (excluded from launch scope by instruction) · **Not started**.

## 1. Verdict

- **Verified website completion: 83 %** (weighted, §3). Not 100 %: production is not published, staff sign-in and the
  admin console have not been exercised against live data, and several security items wait for approval.
- **Launch readiness:** the code is ready for a controlled production release once (1) this branch is pushed and its
  preview passes the runbook checks, (2) a `SUPER_ADMIN` signs in once, and (3) the owner approves the release.
  DNS, Resend domain, indexing and the shared-schema hardening are separate approvals.
- **Mobile apps:** the shared backend foundations are documented in `docs/MOBILE_BACKEND_CONTRACTS.md` (auth, roles,
  profiles, cadets/guardians, hubs, credentials, storage, permissions, audit), with implemented vs planned marked.

## 2. Where everything is

| Item | Value |
| --- | --- |
| Code | GitHub `blackstallion-org/blackstallion.academy` (public). Working branch `session/2026-10-24-final-completion` (local commits `aa11096`, `4db10f8`, `866f77a`, `a05f398`, `2812e70` effects (another session), `56fee69` docs, `116222a` effects review + one performance follow-up; push pending). `session/2026-10-24-fx-integration` points at the same commit. Previous branch `session/2026-10-23-production-integration` pushed. `main` = original boilerplate. Rollback tag `checkpoint/pre-final-2026-10-23` |
| CI | `.github/workflows/ci.yml` (`verify`, `database`, `e2e`), `.github/workflows/uptime.yml` |
| Hosting | Vercel team `blackstallion`, project `blackstallion-academy` (Git-connected, production branch `main`, protected previews). Last preview: commit `03e8d2b`. No production deployment |
| Database | Supabase `tgwadczrfbljnepoaqtb` (shared with the operations apps). Website layer + F1/F2 live; hardening 001200 prepared |
| Auth URLs | Redirect allow-list: `https://blackstallion-academy-*-blackstallion.vercel.app/**`, `https://blackstallion-academy.vercel.app/**`, `https://blackstallion.academy/**`. Site URL unchanged (`http://localhost:3000`, other apps) |
| Docs | `docs/WEBSITE_HANDOVER.md` (start here), `DATABASE_ARCHITECTURE.md`, `SECURITY_AUDIT.md`, `PERFORMANCE_REPORT.md`, `TEST_RESULTS.md`, `DEPLOYMENT_RUNBOOK.md`, `ENVIRONMENT_VARIABLES.md`, `MOBILE_BACKEND_CONTRACTS.md`, `ADMIN_CONSOLE.md`, `PERF_NOTES.md`, `IMPLEMENTATION_PROGRESS.md` |

## 3. Status by area (weights sum to 103; payments carry 0 because they are outside the launch scope)

| # | Area | Status | Score | Weight | Evidence / remaining |
| --- | --- | --- | ---: | ---: | --- |
| 1 | Frontend | Complete | 94 | 8 | 41 routes; audit (410 runs) → 12 major + 11 minor fixed and re-checked; effects integration (11 effects, 2 scenes) reviewed → 2 high + 6 medium fixed; new code not yet on a preview |
| 2 | UI/UX | Complete | 92 | 6 | design preserved; nav, menu, footer, reels fixed; 3 minor items open (m2, m10, part of m9) |
| 3 | Animations | Complete | 95 | 5 | GSAP/Motion/Lenis/3D kept; reduced motion fixed site-wide (#418 gone, reels, /lore, /statue, /equipment); new effects still under reduced motion (checked) |
| 4 | Mobile performance | Partial | 65 | 6 | lab: home 40 → 66, reels 70–77; effects add no measurable cost after the review (§2b of the report); 80+ not reached; options in `docs/PERFORMANCE_REPORT.md` |
| 5 | Backend | Complete | 92 | 6 | server actions validated and tested; live enquiries on preview |
| 6 | Supabase | Partial | 80 | 7 | layer + F1/F2 live; 001200 needs approval; no backups on the current plan |
| 7 | Authentication | Partial | 70 | 6 | server-side role checks, redirect allow-list, generic errors (live); staff sign-in not yet exercised (owner) |
| 8 | Admin dashboard | Partial | 70 | 6 | complete feature set, 30 tests, no-JS safe; not yet run by a signed-in SUPER_ADMIN |
| 9 | Enquiry pipeline | Complete | 92 | 6 | live MOU + QR parent enquiries → Supabase + Formspree + Resend; other gates covered by tests |
| 10 | Resend | Partial | 70 | 3 | live staff notifications; domain unverified → no branded sender/receipts (DNS approval) |
| 11 | Formspree | Complete | 100 | 2 | live (`channels: ["database","formspree"]`) |
| 12 | Storage | Partial | 80 | 3 | private PDF storage live; staff media upload untested live |
| 13 | MOU PDF | Complete | 100 | 3 | download + private copy live; content parity tested |
| 14 | Certificate verification | Complete | 85 | 4 | `/verify` live on the registry; `/verify/[code]` (QR) now uses it too (deploys with the push); no revocation fields in the schema |
| 15 | QR tracking | Complete | 100 | 3 | live attribution + `qr_lead_captures` mirror |
| 16 | Payments | Deferred | — | 0 | not in launch scope; helpers tested, nothing live, clearly labelled |
| 17 | Security | Partial | 72 | 8 | critical S1/S2 fixed live; zod CVE fixed; S3–S9 open/approval (`docs/SECURITY_AUDIT.md`) |
| 18 | Accessibility | Complete | 90 | 4 | Lighthouse 96–100; ARIA, labels, focus, inert, one h1 fixed; effects: hidden copy exposed, panel focus, live region; m10 contrast is a design decision |
| 19 | SEO | Complete | 90 | 3 | metadata, canonicals, sitemap, robots, OG, JSON-LD, 404s; indexing waits for launch approval |
| 20 | Monitoring | Partial | 65 | 3 | redacted server-error logs + optional alerts, uptime workflow, deployment emails; not yet configured on production |
| 21 | Testing | Complete | 92 | 5 | 79 unit, 176 + 179 SQL, 18 browser, 410 audit runs + effects audit, CI |
| 22 | Deployment readiness | Partial | 70 | 6 | previews work; push blocked on GitHub identity check; branch protection after push; production needs approval |
| | **Weighted total** | | **83** | 103 | |

## 4. What this session delivered

- **Staff console** (`/admin`): search/filters, enquiry detail with documents and audit trail, assign-to-me, MOU,
  QR and audit views; server-side role checks everywhere.
- **Shared-schema hardening** (prepared, 179/179 replica checks): CCTV links, microchips, revenue shares, children's
  achievements no longer readable anonymously; rate-limited anonymous inserts.
- **Performance**: hero LCP, lazy start of heavy work, WebP stills, CSS title rise (§3 row 4).
- **Route-audit fixes**: navigation wrap, reduced-motion failures, `/lore` hero, dark-scene contrast, overlaps,
  broken link, inert grid, template copy, soft 404s, canonicals, accessible names.
- **QR verification**: `/verify/<code>` asks the live registry (rank and issue date only).
- **Monitoring and CI**: error reporting, uptime workflow, browser tests in CI.
- **Security**: zod 4.6.7 (high CVE).
- **Auth**: redirect allow-list (live).
- **Handover**: nine documents + mobile backend contracts.
- **Effects integration** (another session's commit `2812e70`): merged with this work, reviewed (code + browser), 2 high,
  6 medium and the useful low findings fixed; effects now cost nothing measurable on mobile (deferred until near).

## 5. Blockers and approvals (exact asks in the final message)

| Ref | Item | Type |
| --- | --- | --- |
| B1 | GitHub identity check so the push token can be regenerated | B (owner sign-in) |
| B2 | First SUPER_ADMIN sign-in to verify `/admin` on the preview (or create the owner's staff account) | B (owner) |
| A1 | Apply `20261023001200_anon_privacy_hardening.sql` (changes what anonymous clients of the shared project can read) | A |
| A2 | Delete the synthetic QA rows (2 enquiries, 1 MOU request, 1 QR capture, 1 document + PDF) | A (live data) |
| A3 | Seed accounts `…@test.com` incl. a SUPER_ADMIN: delete or reset | A (user data) |
| A4 | Rotate the Resend and Supabase secret keys (staged procedure) | A (credentials) |
| A5 | Production release (merge to `main`) | A |
| A6 | DNS for `blackstallion.academy` + Resend domain verification | A |
| A7 | Search indexing, analytics switch | A (+ privacy notice) |
| C1 | ROI calculator assumptions: fee slider ₹24k–₹72k/year vs published ₹8,500/month + GST; "zero CapEx / zero overhead" claims | C (business) |
| C2 | Privacy notice and minors' consent wording (still "draft, pending legal review") | C (legal) |
| C3 | Equine anatomy notes in the `/anatomy` dual-body scene: corrected here, but should be signed off by an equine vet or anatomist | C (expert) |
| D2 | Eight new stills (peg run, academy morning) are served as 2K PNGs from the Higgsfield CDN, which this sandbox and the Mac's Linux VM cannot reach: run `sh scripts/fetch-media.sh` on the Mac, then they can be switched to WebP and committed | D (owner's machine) |
| D1 | Turnstile (Cloudflare account), backups (paid plan) | B/D |

## 6. Not done on purpose

- Mobile apps, Field Ops app, standalone Command Center (out of scope).
- The HTML prototypes "The Art of the Peg" and "One Conversation. Two Bodies" were integrated by the effects session as
  `PegRun` (`/tournaments` §3) and `DualBody` (`/anatomy` §1b); this session reviewed and fixed them.
- Pre-existing, left for a design decision: on phones ≤ 430 px the home finale's motto and "Begin at reel one" sit over
  the horse silhouette (options: shorter copy on phones, a different crop, a darker band).
- Unreferenced media (~280 MB) not deleted (needs approval; no effect on page speed).
