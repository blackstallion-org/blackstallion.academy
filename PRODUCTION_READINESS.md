# BSAH website — production readiness (24 October 2026, final completion pass)

Re-audit after the "Final Production Completion" directive. Every status is backed by evidence observed this session;
nothing is claimed live that was not observed. No credential appears in this file, in git or in any log.

Status words: **Complete** (works in the intended environment, evidence below) · **Partial** · **Blocked** (needs an
external account or approval) · **Deferred** (excluded from launch scope by instruction) · **Not started**.

## 1. Verdict

- **Verified website readiness: 82.5 % (weighted, §3; 100 % is not claimed).** The score is flat against the previous
  audit (83 %) on purpose: deployment readiness went up (the branch is pushed, CI is green, previews run against the
  real database), while four new findings (S15 to S18, one of them the third-party media dependency) are now counted
  and nobody has looked at the Formspree inbox.
- **Production verdict: not yet.** The code is ready for a controlled, *private* first production deployment. Public
  launch waits for the gates G1 to G16 in `docs/LAUNCH_INSTRUCTIONS.md`, and those depend on the owner:
  (1) a staff account has to exist and be exercised, (2) the shared-schema hardening, the seed accounts, the pasted
  keys and the plan choices need decisions, (3) the legal and business items in `docs/BUSINESS_LEGAL_REVIEW.md`
  (D1 to D12) need sign-off, (4) merge, DNS, Resend domain and indexing are five separate approvals. The first
  production deployment would be public by default (S17); `docs/LAUNCH_INSTRUCTIONS.md` §2.1 keeps it private first.
- **Mobile apps' backend: the foundation is ready for app development, not for a public app launch**
  (`docs/MOBILE_BACKEND_CONTRACTS.md` §0): sign-in, roles, profiles, cadets, credential check, lead capture and
  private storage are implemented and tested; any signed-in user can still read camera links, microchips, revenue
  shares and all achievements (S7); no backups on the current plan; app deep links are not in the Auth allow-list yet.

## 2. Where everything is

| Item | Value |
| --- | --- |
| Code | GitHub `blackstallion-org/blackstallion.academy` (public). Branch `session/2026-10-24-final-completion` is **pushed** (code head `561c8c8`, 84 commits ahead of `main`; document-only commits follow). **Draft pull request #1** is open and mergeable (889 files). `main` is the original boilerplate and **has no branch protection** (the push token cannot set it; owner, `docs/DEPLOYMENT_RUNBOOK.md` §6). Rollback tag `checkpoint/pre-final-2026-10-23`. Earlier branch `session/2026-10-23-production-integration` also pushed |
| CI | `.github/workflows/ci.yml` (`verify`, `database`, `e2e`) green on the code head for the push run and the pull-request run, and on four earlier heads; `.github/workflows/uptime.yml` waits for the repository variable `UPTIME_URL` (set only after a production deployment exists) |
| Hosting | Vercel team `blackstallion` (**Hobby plan**: non-commercial use only, a commercial launch needs Pro), project `blackstallion-academy`, Git-connected, production branch `main`, eight environment variables for Production and Preview, functions pinned to Seoul (`icn1`). Deployment Protection is "Standard" (previews private, production domains public). Previews of `395216b` and `561c8c8` built and were checked. **No production deployment exists** |
| Database | Supabase `tgwadczrfbljnepoaqtb` (Free plan, Seoul; shared with the operations apps). Website layer and fixes F1/F2 live; hardening 001200 prepared, pre-flight clean, **not applied** |
| Auth URLs | Redirect allow-list: `https://blackstallion-academy-*-blackstallion.vercel.app/**`, `https://blackstallion-academy.vercel.app/**`, `https://blackstallion.academy/**`. Site URL unchanged (`http://localhost:3000`, other apps) |
| Docs | `docs/WEBSITE_HANDOVER.md` (start here), `docs/LAUNCH_INSTRUCTIONS.md`, `docs/BUSINESS_LEGAL_REVIEW.md`, `DATABASE_ARCHITECTURE.md`, `SECURITY_AUDIT.md`, `PERFORMANCE_REPORT.md`, `TEST_RESULTS.md`, `DEPLOYMENT_RUNBOOK.md`, `ENVIRONMENT_VARIABLES.md`, `MOBILE_BACKEND_CONTRACTS.md`, `ADMIN_CONSOLE.md`, `PERF_NOTES.md`, `IMPLEMENTATION_PROGRESS.md` (all under `docs/`) |

## 3. Status by area

Weights sum to 106 (payments carry 0 because they are outside the launch scope). The scores are judgments backed by
the evidence column, not measurements; the weights are the earlier ones plus one new row (23).

| # | Area | Status | Score | Weight | Evidence / remaining |
| --- | --- | --- | ---: | ---: | --- |
| 1 | Frontend | Complete | 94 | 8 | 41 routes; route audit (410 runs) and final matrix (240 runs): no horizontal scrolling, one `h1` and one `main` everywhere, 0 unnamed controls; forbidden font fixed; `/tournaments` and `/parents` checked on the preview. Open: the damaged `royal` thumbnail on `/schools`, three minor items (m2, m10, part of m9) |
| 2 | UI/UX | Complete | 92 | 6 | design preserved; nav, menu, footer, reels fixed; finale motto over the horse silhouette on phones is a design decision |
| 3 | Animations | Complete | 95 | 5 | GSAP/Motion/Lenis/3D kept; reduced motion fixed site-wide; effects deferred until near the viewport |
| 4 | Mobile performance | Partial | 65 | 6 | lab: home 40 to 66, reels 70 to 77; server to database 635 to 45 ms; eight CDN stills 60.8 to 3.5 MB; 80+ not reached and nothing measured on a real device (`docs/PERFORMANCE_REPORT.md`) |
| 5 | Backend | Complete | 92 | 6 | server actions validated; 85 unit tests; health endpoint (`/api/health`) |
| 6 | Supabase | Partial | 80 | 7 | layer and F1/F2 live; 001200 pre-flight clean and API logs show no other consumers, but it needs approval; no backups on the Free plan; restore rehearsed locally only |
| 7 | Authentication | Partial | 70 | 6 | server-side role checks, redirect allow-list, generic errors; staff sign-in not yet exercised (owner); staff password only, no second factor (S16) |
| 8 | Admin dashboard | Partial | 70 | 6 | complete feature set, 30 tests, no-JS safe; never run by a signed-in `SUPER_ADMIN` |
| 9 | Enquiry pipeline | Complete | 92 | 6 | live MOU and QR parent enquiries reached Supabase, Formspree and Resend on a preview; other gates covered by tests |
| 10 | Resend | Partial | 70 | 3 | live staff notifications; sending domain unverified, so no branded sender or receipts (DNS approval) |
| 11 | Formspree | Partial | 90 | 2 | submissions accepted by Formspree's endpoint (logged `channels: ["database","formspree"]`); nobody has looked at the Formspree inbox (owner sign-in) |
| 12 | Storage | Partial | 80 | 3 | private PDF storage live; staff media upload untested live |
| 13 | MOU PDF | Complete | 100 | 3 | download and private copy live; content parity tested |
| 14 | Certificate verification | Complete | 85 | 4 | `/verify` and `/verify/[code]` use the live registry; no revocation fields in the schema |
| 15 | QR tracking | Complete | 100 | 3 | live attribution and `qr_lead_captures` mirror |
| 16 | Payments | Deferred | — | 0 | not in launch scope; helpers tested, nothing live, clearly labelled |
| 17 | Security | Partial | 70 | 8 | S1/S2 fixed live, zod CVE fixed; S3 to S9 and S15 to S18 open or waiting for approval (`docs/SECURITY_AUDIT.md`) |
| 18 | Accessibility | Complete | 90 | 4 | Lighthouse 96 to 100; WCAG 2.2 target size: 0 failures in 80 page-widths; ARIA, labels, focus, inert fixed; m10 contrast is a design decision |
| 19 | SEO | Complete | 90 | 3 | metadata, canonicals, sitemap, robots, OG, JSON-LD, 404s; indexing waits for launch approval |
| 20 | Monitoring | Partial | 65 | 3 | health endpoint, redacted server-error logs, uptime workflow, deployment e-mails; no alert address set, nothing configured on production |
| 21 | Testing | Complete | 92 | 5 | 85 unit, 176 + 179 + 12 SQL, 19 browser, 410 + 240 audit runs and the effects audit, CI green on the code head (`docs/TEST_RESULTS.md`) |
| 22 | Deployment readiness | Partial | 80 | 6 | pushed, draft PR #1 with green CI, previews build and reach the database; launch plan with gates written; branch protection not set (owner); production not deployed |
| 23 | Media delivery | Partial | 60 | 3 | the eight new stills now load through the provider's resizer (0.2 to 0.8 MB each), but those eight, the 21 journal images and eight videos still come from a third party's CDN: no integrity check, licence unconfirmed (D8), self-hosting needs the owner's machine (the other 60 stills are shipped files) |
| | **Weighted total** | | **82.5** | 106 | 8,748 / 106 |

## 4. What the final completion pass delivered (24 Oct)

- **GitHub**: the branch is on GitHub with all history; draft pull request #1; CI (`verify`, `database`, `e2e`) green on
  push and pull-request runs; a secret scan of every pushed range (no secret-shaped line); the temporary push token is
  named `bsah-temp-push-2026-10-24` and is still to be revoked by the owner after the last push.
- **Vercel previews** of two commits: build, environment variables, database reachability, enquiry pipeline, routes,
  mobile widths and media checked (`docs/TEST_RESULTS.md` §3).
- **Fonts**: a forbidden face hard-coded in the home anatomy labels and two canvases was replaced by the role tokens.
- **Media payload**: the eight new stills were 7.2 to 8.0 MB each (60.8 MB); through the provider's resizer they are
  0.2 to 0.8 MB (about 3.5 MB), verified on the preview; the permanent fix is in `scripts/fetch-media.sh`.
- **Launch plan**: `docs/LAUNCH_INSTRUCTIONS.md` (five separate approvals, gates, undo table) and the business and
  legal packet `docs/BUSINESS_LEGAL_REVIEW.md` (twelve decisions, nothing invented).
- **Security findings** S15 to S18 added, live read-only evidence gathered for 001200, the seed accounts and the keys.
- **Tests re-run on the final code**: all suites green (`docs/TEST_RESULTS.md` §1); 240-run matrix and a WCAG 2.2
  target-size check added.
- **Handover documents** updated: this file, `PROGRESS.md`, `docs/WEBSITE_HANDOVER.md`, `docs/IMPLEMENTATION_PROGRESS.md`,
  `docs/DATABASE_ARCHITECTURE.md`, `docs/SECURITY_AUDIT.md`, `docs/PERFORMANCE_REPORT.md`, `docs/TEST_RESULTS.md`,
  `docs/DEPLOYMENT_RUNBOOK.md`, `docs/MOBILE_BACKEND_CONTRACTS.md`.

Earlier work this builds on: staff console (`/admin`), prepared shared-schema hardening (179/179 replica checks),
performance pass, the 410-run route audit and its fixes, QR verification, monitoring and CI, the zod upgrade, the Auth
redirect allow-list, and the effects integration (reviewed and fixed).

## 5. Blockers and approvals (exact asks in the final message)

Type: **A** approval, **B** owner signs in or enters a secret personally, **C** business, legal or expert sign-off,
**D** owner's machine or paid account.

| Ref | Item | Type |
| --- | --- | --- |
| B2 | Create the owner's staff account in Supabase Auth (Add user, Auto Confirm); then it is mapped to `SUPER_ADMIN` and the owner signs in personally so the admin console can be tested | B |
| B3 | Branch protection on `main` (the push token has no administration permission; steps in the runbook §6); revoke the temporary token `bsah-temp-push-2026-10-24` | B |
| A1 | Apply `20261023001200_anon_privacy_hardening.sql` (changes what anonymous clients of the shared project can read; pre-flight clean) | A |
| A2 | Delete the synthetic QA rows (3 enquiries, 2 QR captures, 1 MOU request, 1 document and its PDF; the exact ids are in the approval message) | A (live data) |
| A3 | Seed accounts `…@test.com` including a `SUPER_ADMIN`: ban now (reversible), delete later | A (user data) |
| A4 | Rotate the Resend and Supabase secret keys (staged procedure; the owner pastes the new keys; revoke the old ones only after a synthetic enquiry succeeds) | A + B |
| A5 | Production release: merge pull request #1 into `main` | A |
| A6 | DNS for `blackstallion.academy` and Resend domain verification | A |
| A7 | Search indexing and analytics switch (with the privacy notice) | A |
| A8 | Vercel Deployment Protection set to "All Deployments" before the first merge (S17) | A (account setting) |
| A9 | Paid plans: Vercel Pro ($20 per user per month; needed for a commercial site) and Supabase Pro (about $25 per organisation per month; backups; point-in-time recovery is extra) | A (cost) |
| A10 | Second factor for staff (S16) and the decision on repository visibility (S15) | A |
| C1 | ROI calculator assumptions: fee slider ₹24k to ₹72k per year vs the published ₹8,500 per month + GST; "zero CapEx / zero overhead" claims | C |
| C2 | Privacy notice and minors' consent wording (still "draft, pending legal review"); notice region (Seoul vs Mumbai) | C |
| C3 | Equine anatomy notes in `/anatomy`: corrected here, to be signed off by an equine vet or anatomist | C |
| C4 | The remaining business and legal decisions D1 to D12 in `docs/BUSINESS_LEGAL_REVIEW.md` (including the licence for the generated imagery, D8) | C |
| D1 | Turnstile (a free Cloudflare account) and backups (paid plan) | B/D |
| D2 | Self-host the media: run `sh scripts/fetch-media.sh` on the Mac in the project folder (the sandbox cannot reach the CDN), or allow the CDN host for the assistant; then the eight stills are committed as WebP | D |
| D3 | The original image for the `royal` hub thumbnail on `/schools` (the embedded copy is damaged) | D |

## 6. Not done on purpose

- Mobile apps, Field Ops app, standalone Command Center (out of scope).
- The HTML prototypes "The Art of the Peg" and "One Conversation. Two Bodies" were integrated by the effects session as
  `PegRun` (`/tournaments` §3) and `DualBody` (`/anatomy` §1b); this work reviewed and fixed them.
- Pre-existing, left for a design decision: on phones up to 430 px the home finale's motto and "Begin at reel one" sit
  over the horse silhouette (options: shorter copy on phones, a different crop, a darker band).
- Unreferenced media (about 280 MB) not deleted (needs approval; no effect on page speed).
- Nothing was merged, published, pointed at a domain, indexed or charged. No live data was changed in this pass.
