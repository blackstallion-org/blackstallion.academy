# Test results (24 Oct 2026, final code)

Every number below was observed in this session on the code that is on GitHub (branch
`session/2026-10-24-final-completion`, code head `561c8c8`; the commits after it change documents only).
"Local" = the production build run in the cloud sandbox (Linux, Node 22, Postgres 16, Chromium, no GPU). "Preview" =
the protected Vercel preview of the pushed branch. "Live DB" = the Supabase project, inside transactions that were
rolled back unless stated. "CI" = GitHub Actions on the pushed commit.

## 1. Automated suites on the final code

Re-run in full on 24 Oct after the last code change (the media resizer commit). Nothing was skipped.

| Suite | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | 0 errors, 8 warnings (pre-existing, untouched files) |
| Types | `npm run typecheck` | pass |
| Unit + server | `npm test` | trustee crypto script pass; **85/85** node tests |
| Production build | `npm run build` | pass (62 static pages; `ensureStatic` validation of the slug routes) |
| Browser smoke | `npm run test:e2e` | **19/19** (own server, loopback lead receiver) |
| Database, website schema | `bash supabase/tests/run.sh` | **176/176** |
| Database, live replica | `bash supabase/live/tests/run.sh` | **179/179** (75 existing + 104 hardening) |
| Backup and restore rehearsal | `bash supabase/live/tests/backup_restore_rehearsal.sh` | **12/12** |
| Dependencies | `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities |
| CI (GitHub Actions) | jobs `verify`, `database`, `e2e` | green on `561c8c8` for both the push run and the pull-request run; also green on `8e6652d`, `ea4e8e4`, `9afc10c` and `395216b`. Vercel's own check passes |

The 19 browser checks: security headers; `robots.txt` blocks indexing unless switched on; health probe (shallow 200,
deep reports a missing database setting, never cached); sitemap (34 routes); a 38-route sweep with no page errors or
CSP violations; no route falls back to the error boundary; unknown route returns the 404 page; MOU form refused
without consent and delivered exactly once on a double click; `/verify` sample code is labelled SAMPLE and an unknown
code never invents a record; hero film keeps its ratio at 360/390/430/1440; doctrine statement; navigation letter-roll;
moodboard; MOU "Download PDF" returns a real PDF; signed-out visitors are redirected from the staff console and the
login page is `noindex`; first Tab stop is the skip link; home and `/parents` have no horizontal overflow at 390 px.

What the 85 node tests cover (by file, 9 files):

- `lead-action` (17): every enquiry gate's validation, consent and honeypot; duplicate submissions (double click and
  retry); **no backend configured**; **database unreachable**; **database down but Formspree up** (the enquiry is not
  lost); **receiver failure**; **e-mail failure**; the rate limit (sixth submission in ten minutes refused); Turnstile;
  Resend idempotency and escaping; new-format Supabase keys sent only as `apikey`.
- `admin-console` (30): search sanitiser against PostgREST injection, LIKE escaping, IST day windows, every filter,
  pagination, payload and attribution display, assign-to-me and status actions (staff check first, only the allowed
  columns, zero-row updates reported as failures, errors logged without raw messages), signed document links, and a
  check that every admin page calls `requireStaff()` before querying.
- `documents-storage-auth` (10): upload validation by magic bytes, per-bucket types and sizes, unique object paths,
  MOU PDF content parity with the on-page draft, private storage record and clean-up, staff roles, proxy redirects.
- `health` (5), `monitoring` (3), `payments` (7: signature failures, refunds, out-of-order events), `security` (5: rate
  limits, salted buckets, attribution allow-list, Turnstile), `verify` (5: invalid codes, registry statuses, rate limit),
  `media` (3: every media key resolves to a shipped file or a remote URL; the eight CDN-only stills go through the
  resizer as WebP, never as the 7.5 MB master; WebP swap rule).

## 2. Database (live project)

- 23 Oct, rolled back (`docs/evidence/2026-10-23-live-supabase-check.md`): RLS on all website tables; anonymous submit
  stored and mirrored; duplicate detected; anonymous read denied; rate limit allow then block; consent required; parent
  reads nothing, cannot self-promote and cannot write private files; super admin reads and updates leads, uploads and
  records documents; a real passport verifies (rank and date only); unknown stays unknown; sign-up role injection
  becomes `PARENT`.
- 24 Oct, read-only (SQL editor): five users (one per role, all `@test.com` seed accounts, never signed in, none
  banned); the synthetic QA rows made by the preview tests plus one enquiry this audit did not create (left untouched);
  hardening 001200 **not** applied; the pre-flight queries for it came
  back clean; the project's API logs for the previous 24 hours show no other client using the restricted tables; Auth
  redirect allow-list holds the three website patterns (`docs/SECURITY_AUDIT.md`, "Live evidence").
- Replica and rehearsal: see §1. The rehearsal also proves the extra restore steps are needed: a naive restore gives
  anonymous visitors read access to enquiries back (9 policy lines and 16 privilege lines differ). Restoring into a real
  Supabase project has **not** been rehearsed.

## 3. Preview (Vercel)

| Check | Result |
| --- | --- |
| Build on Vercel | commits `395216b` and `561c8c8` built and went Ready (Next 16.4.2, functions in `icn1`) |
| Server to database (`/api/health?deep=1`) | `db: "up"`; median 45 ms from a browser in India (was 635 ms before the region pin; `docs/DEPLOYMENT_RUNBOOK.md` §10) |
| `/tournaments` peg run (561c8c8) | the four stills load through the resizer (213, 255, 281, 225 KB), stage switching and the WebGL transition work, no console errors except Vercel's own feedback toolbar being refused by the CSP (expected on previews) |
| `/parents` (561c8c8) | the four morning stills load (417 to 778 KB each, decode at 1920 x 2571) instead of 7.8 MB each |
| Fonts (preview built after `aa8e627`) | the home anatomy labels and numerals resolve to the house fonts (see §4c) |
| Synthetic MOU enquiry (`/schools/mou`, earlier preview `03e8d2b`) | stored + `mou_requests` mirror + private PDF + audit row; accepted by Formspree's endpoint (logged channel `formspree`); Resend delivered |
| Synthetic parent enquiry with `?qr=` (`03e8d2b`) | stored with QR attribution; `qr_lead_captures` mirror (`website-qr`); Formspree + Resend |
| `/verify` (`03e8d2b`) | sample record labelled SAMPLE; unknown code shows "No sealed record" from the live registry |
| `/admin/reset` (`03e8d2b`) | the same generic answer for an unknown address |
| Headers and robots | CSP, HSTS, `X-Frame-Options: DENY`, nosniff, `noindex`; `robots.txt` `Disallow: /` |
| Media (`03e8d2b`) | `/`, `/legend`, `/fleet`, `/verify`: 0 failed requests, 0 broken images |

The synthetic enquiries were sent once, on the earlier preview; they were not repeated for every commit because the
enquiry code did not change in between (the unit tests cover it).

## 4. Browser audits (local, Playwright, production build)

### 4a. Route audit, first pass

41 routes x 8 widths (320 to 1920) + reduced motion at 390/1440 = 410 full-scroll runs, axe at 390/1440. Found 0
critical, 14 major, 14 minor. Two were false positives caused by the sandbox's partial media copy. Fixed and
re-verified: M1-M6, M8-M14 (12 major) and m1, m3-m9 (partly), m11, m13, m14. Still open (minor): m2 (`/curriculum`
cards at 768 px), m9 heading order and one small target on `/schools`, m10 (text-reveal words rest at 35 % opacity,
a design decision), m12 (remote videos without posters). Targeted re-verification after the fixes: nav on one line at
1280/1366/1440 (12/12); Reels menu at 768/1024; footer at 320; `/lore` hero clear of the nav (4/4); equipment headline
on dark (2/2); story reels with reduced motion (4/4); `/statue` reduced motion (2/2); `/journal` grid inert while
closed, one `h1`; MOU title clear of the date; `/cadets` bar labels; `/verify/<code>` honest registry message; home
with reduced motion; title-card rise (animated normally, static with reduced motion).

### 4b. Effects integration audit

Commit `2812e70` (another session) added 11 effects and 2 interactive scenes; checked with an independent code review
and two browser audits of every new section (320, 390, 768, 1024, 1440, 1920 px; reduced motion at 390/1440;
keyboard). Found 2 high, 6 medium, 15 low (list: `docs/IMPLEMENTATION_PROGRESS.md` F17), fixed, then re-checked:
finale e-mails on a dark backing; `/schools` frame headline and `/parents` chapters in the accessibility tree before
scrolling, chapter labels read "Sample"; ember trail creates no WebGL context at load, none on a touch phone profile or
with reduced motion; peg-run gallery idle when off screen; `/legend` revival and `/why` crisis requested only near
their sections; peg-run panel focusable, Arrow keys move the tabs (peg run, dual body); dual-body 3D mounts with the
corrected muscle note; no page errors on any checked route. Remaining audit flags were checked by eye and are not
defects (tight leading on two-voice headlines, screen-reader-only copy).

### 4c. Final matrix (24 Oct, production build of `61c62dc`)

40 routes (every page, the six journal articles, three hub pages, three tournaments, three QR codes, MOU, access,
admin login and reset) x 6 widths (320, 390, 768, 1024, 1440, 1920) = **240 full-scroll runs**, reduced motion (static
layout), plus a WCAG 2.2 target-size check and a font check. The matrix and the target-size check ran on the build
before the font fix below; the font check was re-run on the fixed build.

Zero-count results: all 240 runs loaded with HTTP 200; no horizontal scrolling at any width; exactly one `h1` and one
`main` on every page; `lang` set everywhere; 0 controls without an accessible name; 0 inputs without a label; 0 images
without `alt`; 0 `target="_blank"` links without `rel`; the fixed navigation measured 64-65 px below 768 px and 80-81 px
from 768 px up, as the layout rules require.

Findings and what was done with them:

| Finding | Disposition |
| --- | --- |
| Forbidden font `Inter` (12 page-widths: `/` and `/science`) hard-coded in the home anatomy "matrix" SVG labels, `DM Mono` in its numerals, and `Inter` in two canvas textures (the Hyderabad diorama and the Citadel site plan). None of these faces is loaded by the site, so the text rendered in the browser's fallback face | **Fixed** (GitHub `aa8e627`): labels and numerals use `var(--font-sans)` / `var(--font-mono)`; the canvases read `--font-sans` from the body when they draw. Re-checked on the production build with a computed-style crawl (no forbidden face on `/` or `/science` at 390 and 1440 px, labels fit their badges) and on the preview |
| `/schools`: two console errors `ERR_INVALID_URL` at every width | **Open, minor.** Traced to the embedded `royal` hub thumbnail in `CitadelConfigurator.tsx`: its base64 JPEG has one character missing (14,799 characters, not a multiple of 4), so the browser refuses the data URL; `CitadelHubImage` then shows the illustrative site plan in its place, so nothing looks broken. A one-character brute-force repair was tried but its result is a guess, so nothing was committed; no original file is in git, so the owner should supply the image |
| `/verify` at 320 and 390 px: nine boxes extend 4 px past the left edge (the two-ring illustration and the "Issued" heading) | **No change**: it is the scenes' optical offset; the glyphs are inside the viewport (screenshot at 320 px) and the page has no horizontal scroll |
| Skip link flagged as "clipped" and "under the nav" on all 240 runs | **Expected**: it is visually hidden until focused (and verified as the first Tab stop in the browser smoke test) |
| 35 requests failed with `ERR_TUNNEL_CONNECTION_FAILED` (`/tournaments`, `/journal` and others) | **Sandbox artefact**: the sandbox's proxy refuses the image provider's CDN. The same images load on the preview (§3) |
| 12 x 404 for four home thumbnails (`brain`, `spine`, `muscle`, `heart` under `/images/matrix/`) | **Sandbox artefact**: the thumbnails exist in git but not in the sandbox's partial media copy; they load on Vercel (checked on the preview earlier) |
| 24 `ERR_ABORTED` requests on the local server | Requests cancelled by navigation (media and prefetch); not failures |
| "Targets smaller than 24 x 24" on all 240 runs (1,355 of 3,624 targets in the later check) | Superseded by the correct rule below |

Target size (WCAG 2.2 SC 2.5.8, minimum 24 x 24 px unless 24 px circles around undersized targets do not overlap
another target, inline links in running text excepted): 80 page-widths (40 routes x 390 and 1440 px), 3,624
interactive targets, 1,355 under 24 px, **0 failures**. The checker was self-tested on synthetic cases first.

## 5. Performance (local Lighthouse, mobile)

Summary in `docs/PERFORMANCE_REPORT.md` (method, every change and its own measurement in `docs/PERF_NOTES.md`):

- home 40 to 66; `/legend` 51 to 72; `/parents` 59 to 70-76; `/anatomy` run did not finish to 74; `/safety` 75;
  `/schools` 32 to 33 (software WebGL)
- server to database 635 ms to 45 ms after pinning the functions to Seoul (measured on the preview)
- the eight CDN-only stills 60.8 MB to about 3.5 MB through the provider's resizer (measured from the browser, §2e of
  the report). Lighthouse cannot see the provider's CDN from the sandbox, so these sizes are not in the scores.

## 6. Not tested (and why)

| Item | Reason |
| --- | --- |
| Staff sign-in, session expiry, logout, non-admin denial, every admin workflow against live data, media upload, document download by staff | needs a `SUPER_ADMIN` account that the owner signs in to personally; the account has not been created yet. Only the signed-out redirect and the server-side role checks (unit tests) are covered |
| Password-reset e-mail end to end | needs a real staff mailbox |
| Applicant receipts and the branded sender | the Resend sending domain is not verified (DNS approval) |
| Formspree inbox | the submission was accepted by Formspree's endpoint; nobody has viewed the inbox (needs the owner's sign-in) |
| Turnstile | no Cloudflare account / keys |
| Payments | deferred by instruction; only unit-tested helpers exist |
| Real phones, Safari, Firefox, a real GPU | the sandbox has Chromium only and software WebGL |
| Lighthouse or PageSpeed on the preview or a production CDN | the preview is protected and the sandbox cannot reach `*.vercel.app` |
| Production deployment, DNS, search indexing | not approved |
| Restore into a real Supabase project | needs a scratch project and the database password (owner); only the local rehearsal exists |
| Hardening 001200 on the live project | not applied (approval); tested on the replica only |
| Load or stress testing; third-party penetration test | not performed |
| The eight stills, 21 journal images and eight videos served from the project's own files | still loaded from the image provider's CDN (self-hosting needs the owner's machine) |
