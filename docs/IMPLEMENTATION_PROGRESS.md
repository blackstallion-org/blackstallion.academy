# BSAH implementation progress

> **Canonical progress file.** This is the single place for current status. Older status files are kept for history
> and are not current evidence: `PROGRESS.md`, `BSAH_PROGRESS.md`, `COMPLETED_SECTIONS.md`, `BSAH_TEST_RESULTS.md`,
> `RESTORATION_AUDIT.md`, `BSAH_RESTORATION_REPORT.md`, `docs/FINAL_VERIFICATION_REPORT.md`,
> `docs/IMPLEMENTATION_MASTER_CHECKLIST.md`, `docs/audit-completion-report.md`. Latest session: **23 October 2026**
> (bottom of this file). Supporting documents: `docs/DATABASE_RECONCILIATION.md`, `docs/REPOSITORY_HYGIENE.md`,
> `docs/MEDIA_INVENTORY.md`, `docs/DEPLOYMENT_RUNBOOK.md`.

## Scope and baseline — 19 October 2026

Repository: `/Users/stingraj/blackstallion-website`; branch: `restore/original-bsah-design`.

The current user directive authorizes a systematic site-wide audit and safe implementation; it supersedes the older one-page-at-a-time review workflow in `INSTRUCTIONS.md`. Brand, content, routes, framework and signature cinematic motion remain protected. No deployment, migration, credential change or authentication architecture replacement is authorized.

Pre-existing tracked changes are preserved in `output/engineering/baseline/tracked-work.patch`; source, instructions and documentation are backed up in `source-before.tgz`. Git status and HEAD are recorded beside them. No reset, checkout, clean, submodule mutation or asset deletion is part of this work.

Baseline: Next.js 16.4, React 19.3, GSAP, Motion, Lenis, Three.js/R3F/Drei and OGL. Read installed Next documentation for public assets, loading boundaries and Cache Components/Activity lifecycle. Existing scripts use standalone Playwright browser checks; the application has no unit-test runner dependency.

Baseline typecheck and production build pass. Full ESLint fails: 16 errors and 33 warnings (including scratch capture scripts). Existing trustee cryptographic tests pass. Evidence: `output/engineering/baseline/`.

## Inventory

| Area | Existing implementation | Observed issue / next action |
| --- | --- | --- |
| Home | `app/page.tsx`, `Hero`, `Instrument`, `Matrix`, `Doors`, conversion sections | Hero uses original 34.54 MB film despite optimized alternatives; playback state gaps. |
| Scroll | Root `SmoothScroll` (`ReactLenis`), Motion viewport hooks, GSAP scenes | Preserve one controller; measure route cleanup and mobile pan. |
| Loader | `Loader.tsx`, four photographic frames, internal-link overlay | Current request now requires procedural ivory pixel horse. No failed-navigation timeout in route overlay. Prototype and review before integration. |
| Academy | Hero institutional statistics | Current grid needs re-verification at narrow widths; earlier carousel report is stale. |
| Somatic | `Matrix.tsx`, unused `SomaticMap.tsx` | Matrix already interactive SVG/image composition; audit keyboard, dialogs and reduced motion before changing. Scientific copy is unverified editorial content. |
| Marwari | `Anatomy3DHorse`, `SpecimenPlate` | Supplied black GLB 1,273,444 bytes, Draco/WebP. Production previously loaded; development Strict Mode abort interaction needs fresh regression check. |
| Monument | `StatueCanvas`, `CinematicStatueScroll` | Supplied statue approximately 1.35 MB. Preserve camera sequence and check fallback/pan. |
| Schools | `CitadelConfigurator`, India/Hyderabad maps, council, Trojan Box | Lint/lifecycle errors; configurator MOU currently simulates success without delivery — must connect to existing action. |
| Council | Four proposed seats / initials | Two unconfirmed people publicly named. Remove public nominees while preserving institutional seat structure. Approved portraits/appointments unavailable. |
| Trojan | Lightweight CSS concept with drag and keyboard slider | No approved product sequence or 3D asset; final product fidelity BLOCKED. Verify existing concept, do not fabricate product. |
| Trustee | Signed scoped HttpOnly cookie, server invitation hashing/expiry/revocation | Fail-closed config; no distributed rate limiter. Production invitations/approved private documents/edge configuration BLOCKED; preserve architecture. |
| Leads | Shared wizard, MOU generator, configurator MOU; server Zod + Supabase RPC / webhook | Never send personal test data externally. Controlled local destination can verify transport, not production delivery. |
| Other forms | Passport demo lookup; Command FAQ search | Existing demo labels retained; not represented as live institutional verification. |

## Safe execution sequence

1. Record baseline and screenshots; repair lint/lifecycle issues without changing the approved presentation.
2. Restore existing adaptive hero assets, poster, playback states and controls; measure media.
3. Build and visually review standalone Canvas 2D horse prototype, then integrate a bounded loading controller.
4. Verify responsive Academy cards, interactive anatomy, 3D, council and Trojan concept; fix identified defects.
5. Repair honest form submission and accessibility, retain server authorization; document unavailable infrastructure.
6. Run fresh production build, browser route/viewport/interaction checks, accessibility and performance sampling; record actual results and limits.

Each layer follows audit → implement → test → verify → record. Existing reports are historical context, never current evidence.

## Layers 01–03 — implementation and first checks

- Repaired all baseline ESLint errors without disabling application rules. Excluded only existing scratch capture experiments and generated output, consistent with the already excluded scripts/submodule. Current full lint: zero errors, 21 warnings. Typecheck and production build pass (`layer01-final-lint.log`, `implementation-build.log`). Browser verification is still pending.
- Fluid effects now allocate GPU resources near the viewport, cap DPR at 1.5, stop drawing outside the viewport/hidden tab, retain a visible poster and release materials/textures/render targets. Replaced `touch-none` on their wrappers with vertical pan. Procedural school maps also defer initialization, stop offscreen rendering, throttle DOM projection updates, release scene resources and preserve ordinary wheel scrolling; Ctrl/Meta-wheel retains zoom.
- Repaired anatomy cancellation: Three FileLoader shares in-flight URL requests, so aborting the first Strict Mode effect can cancel the replacement viewer. Cleanup now ignores/disposes abandoned results without aborting the shared request. Fresh dev/production lifecycle verification remains pending.
- Restored measured hero alternatives: desktop H.264 1606×900, 25 fps, 8,176,105 bytes; mobile H.264 1284×720, 24 fps, 3,148,814 bytes. Existing optional mobile WebM is 3,016,634 bytes but has no audio; MP4 is selected so sound controls remain meaningful. Lightweight responsive posters are in use. Added progress/buffer transforms, explicit playback/failure states, offscreen pause, reduced-motion preference and Lenis-compatible Skip Intro.

## Layer 04 — standalone prototype review before integration

Adapted the actual user-supplied HTML horse engine, rather than introducing another 3D engine or prerecorded media. It has a skinned signed-distance body, independent four-limb joint chains, periodic 12-pose gait interpolation, head/neck/spine/tail movement and a composed pose. Removed unverified accuracy claims from its comments. Canvas-only preview: `public/prototypes/pixel-horse.html`; engine: `public/animations/pixel-horse.js`.

Reviewed desktop and mobile screenshots in `output/engineering/pixel-prototype-desktop.png` and `pixel-prototype-mobile.png` before integration. Ivory grid pixels are recognizable, centered and compact with negative space. Source reference remains untouched. Cadence is 510 ms per cycle. The integrated single controller replaces photographic frames, exits after hydration/route commit, finishes a cycle where practical, settles/fades and has JS plus CSS deadlines. Timing, timeout, reduced motion, loop continuity and performance tests are still pending.

## Layers 05–11 — targeted implementation, verification pending

- Academy figures now use native mobile scroll-snap and labeled pagination; desktop remains three columns.
- Preserved the existing Matrix illustration and interactive systems. Reused the existing 2D SomaticMap for all six rider/equine nodes, keyboard controls, selected path and detail outside the illustration. Added a clinical-review notice and proper reduced-motion pulse removal. Matrix animations now clean up through a GSAP context; dialogs trap/restore focus.
- Removed public unconfirmed council nominees; retained proposed institutional seats and honest approval status. No portraits, credentials or appointments invented.
- Preserved the lightweight Trojan concept. Approved physical product imagery/geometry is unavailable; product-fidelity verification is BLOCKED.
- Kept trustee authentication architecture unchanged. Cryptographic baseline tests pass; distributed rate limiting and production provisioning remain BLOCKED.
- Replaced configurator's fabricated MOU success with the existing server action. Added field names/labels, pending state, keyboard modal focus/Escape, required server MOU fields and guarded duplicate submission in shared forms. Failure copy now says delivery is unconfirmed, since a network timeout cannot prove that a remote system saved nothing. Local-only transport tests are pending; no personal information has been sent externally.

## First browser verification and repairs

- Production browser run: all 56 page/width combinations passed overflow and broken-image checks for home, schools, anatomy, statue, contact, MOU and institutional access at 320/375/390/430/768/1024/1440/1920. Section-by-section scrolling and top/footer screenshots were recorded. This is Chromium emulation, not physical iPhone/Android verification.
- Anatomy regression suite passed ten scenarios: one model request, 1.5 DPR at simulated DPR 3, zero draw calls after pause/settling, zero hidden/offscreen draw calls, vertical swipe, context-loss archive, reduced-motion still 3D, renderer/model/decoder/deadline fallbacks, retry, keyboard and late-result disposal. Source orientation was subsequently aligned to the existing hotspot camera axis; a fresh final run is required.
- Interaction pass: loaders exit, mobile/desktop hero controls and media selection work, Academy swipe/pagination work, all six somatic nodes work with keyboard, Matrix focus/Escape works, council disclosures and Trojan touch/keyboard rotation work. All three enquiry wizards and configurator MOU each delivered exactly one synthetic request to an acknowledged loopback receiver under double-click testing.
- Found and fixed two failures: video source failure could be overwritten by a later buffering event; rejected trustee submissions could reset the uncontrolled password input during retry. The latter now uses controlled local state (no authentication architecture change); valid server-side access, cookie flags and signout passed on the second run. Fresh hero failure verification is pending.
- Direct server-action tests pass 15 scenarios, including required fields for all six gates, invalid email/phone/calendar date, honeypot, missing configuration, six acknowledged loopback webhook deliveries, receiver failure, preserved values and existing RPC transport shape. Existing trustee cryptographic tests pass. Local transport does not establish production database persistence/RLS or production email delivery.
- Added an image-decode fallback using the existing site-plan illustration for a corrupt supplied hub thumbnail. Kept source data intact. Added keyboard operation to the hub cards.
- A broader code inspection found a dead journal replay control: it hid the gallery but no video element existed. It now links to the functioning opening film. Gallery grid controls and lightbox focus are keyboard accessible, offscreen/reduced-motion rotation is suppressed, and close timers clean up. Recurring tournament timers and equipment-copy timers also clean up; copy feedback appears only after clipboard success.
- Current full lint: zero errors, ten warnings; typecheck passes. These latest changes still require the final build/browser pass.

## Fresh final audit and additional repairs

- The expanded route sweep passed 312 cases: 39 routes at all eight requested widths. Visible sections were scrolled, viewport containment and decoded images checked, exactly one main landmark and route canonical asserted, and top/footer screenshots saved for 390/1440. This is a DOM/browser check, not a claim that every pixel at every width was manually reviewed.
- Fresh production anatomy regression passed all ten scenarios; a separate check against the existing development server passed with one model request, one canvas and no page/model-request errors under Strict Mode.
- Seven primary-page full-document axe scans initially passed with zero violations. Expanding the scan to all 39 routes revealed additional issues on 11 pages: low-contrast/faded text, non-focusable horizontal regions, one malformed definition list, a generic element with prohibited aria-label, and a visible/accessible replay-label mismatch. Those issues were repaired with existing palette tokens, structural semantics and keyboard focus; final full-site scans are being repeated. Science comparison rules retain their drawing animation while text remains fully readable.
- Fixed the journal header's collision with the global header and exposed its headline to assistive technology while keeping decorative gallery copies hidden. Added the existing dark tone scope so its controls use the proper approved palette.
- All 13 primary interaction scenarios passed again, with zero unexpected page errors. Extra checks now verify footer deferment, loader release without JavaScript or engine availability, monument orbit/offscreen/fallback, and journal replay/grid/lightbox.
- Initial slow-network attempt exceeded the harness's 45-second full-load wait. A subsequent DOM-ready performance sample recorded LCP 4.316 seconds, CLS 0.00172 and five long tasks (largest 242 ms) under 4x CPU / 1.6 Mbps / 100 ms Chromium emulation. This is not a passing mobile performance result. Evidence is retained as browser/before-footer-fix-*.json. Inspection found a below-fold ledger preload and footer autoplay/preload=auto competing with initial content. Removed the ledger priority and made the footer film load/play only when its existing visibility observer reaches it; poster and visuals remain intact. Final measurement remains pending.
- Baseline comparison excludes macOS archive metadata, records changed/new source files and confirms no source file is missing. The original dirty working tree, supplied Downloads, and credentials remain untouched. No deployment, migration, external personal-data submission or production configuration change was performed.

## Final accessibility and forms evidence

The repeated whole-document axe scan now asserts zero violations rather than only reporting scan completion. All 39 routes pass at 390px with reduced motion and no horizontal overflow: zero automated WCAG 2 A/AA and WCAG 2.1 A/AA violations, zero unexpected page errors. The earlier findings are retained separately under `browser/accessibility-before-final-fixes/`. This does not certify screen-reader usability, all interaction states, or WCAG conformance.

The standalone MOU generator also passed native required validation, live draft updates, an acknowledged loopback submission, double-click duplicate prevention (one request), and retained field values (`browser/results-mou.json`). No production destination was contacted.

## Local pass closure

Final local results: build and typecheck pass; lint passes with 0 errors / 9 warnings; 15 action scenarios; trustee tests; 13 primary browser scenarios; 10 anatomy cases; 5 extra cases; standalone MOU generator; 312 route/width cases; 48 post-fix layouts; and 39 full-page accessibility scans all pass. The final performance sample records LCP 3.484s, CLS 0.00172, 4 long tasks, largest 247ms. This is a bounded Chromium lab sample, not physical-device/field performance certification.

The master ledger has 187 records: 160 VERIFIED YES, 7 IMPLEMENTED — UNVERIFIED, 0 FAILED, 18 BLOCKED, 2 NOT APPLICABLE. No requirement remains ambiguously IN PROGRESS; explicit external/unverified work is retained. See FINAL_VERIFICATION_REPORT.md for eleven directive groups, evidence, exact blockers and production-readiness assessment. The website is not signed off as production-ready.

Final ancillary diff check: existing dirty-tree whitespace flags remain; baseline archive comparison confirms unchanged counts/EOF state. No source file is missing. The task-owned prototype server and browser preview session were closed; the user’s existing development server remains running.

## Follow-up — scroll-driven paragraph reveal · 19 October 2026

Added `components/motion/ScrollRevealText.tsx` and its small CSS module, using existing GSAP/ScrollTrigger dependencies. Applied it to 40 selected editorial paragraphs in 28 source files. Existing paragraph classes, typography, inline elements, text and whitespace remain in place. Small labels/forms, drop caps, dim captions and photo-overlay descriptions were deliberately excluded. Existing homepage paragraph entrance tweens skip the new component to avoid competing animation controllers.

Defaults: word reveal, viewport start 92%, completion 65%, unrevealed opacity 0.35 and 0.25-second scrub smoothing. Reusable props also support character splitting and custom start/end/dim/smoothing; custom font settings continue through ordinary paragraph className/style. React renders the spans, so content changes do not depend on destructive DOM text splitting. All text remains present in server HTML. Reduced motion, keyboard focus within the paragraph, and print render at full opacity.

Fresh production build and type checking pass. Targeted lint passes. Production Chromium tests at 390 and 1440 verify dim-to-partial-to-full progression, backward scrubbing, matching inherited typography, unchanged text during animation, no horizontal overflow, actual client navigation/back, keyboard-focus and print full opacity, reduced-motion readability and no-JavaScript content. Zero page errors. Evidence: `output/engineering/paragraph-*.log`, `paragraph-reveal/results.json`, `paragraph-reveal/progress-*.png` and `revealed-*.png`.

This follow-up has targeted verification; the earlier 39-route accessibility/performance audit predates this new animation and was not repeated in full. Active unrevealed words intentionally use reduced opacity as requested. The broader production blockers remain unchanged. Nothing was deployed.

---

## Session 23 October 2026 · Completion Master Directive (layers 01–11)

Scope: public Next.js website and its essential backend (directive §B09: the two Flutter apps, the Command Center and
stall-cam/video platform are separate deliverables and were not started). Method: every change was built and tested
on a Linux copy (the Mac's `node_modules` are macOS binaries), then written back to this folder after confirming none
of the target files had changed since the snapshot. Nothing was deployed, no live database was touched, no commit was
made. Status values follow the directive: DONE, TESTED, CODED_UNVERIFIED, BLOCKED_EXTERNAL, NOT_STARTED.

### Rollback

`_session_snapshots/2026-10-23-pre-session/` (git-ignored): `tracked-changes.patch` (49 MB, binary-safe diff of all
pre-existing tracked edits), `untracked-source.tar.gz` (137 untracked non-media files), `git-status.txt`, `HEAD.txt`.
The 55 files written this session are listed in `_session_snapshots/bsah-session-changes-1.tar.gz`.

### Checks run (all on 23 Oct, Linux, Node 22, production build)

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | **0 errors**, 9 warnings (was 21 errors, 20 warnings) |
| Types | `npm run typecheck` | pass |
| Unit/server tests | `npm test` | **29/29 pass** + trustee crypto script pass |
| Production build | `npm run build` | pass, 51 pages (Next.js 16.4.2) |
| Browser E2E | `npm run test:e2e` | **12/12 pass** with the real 3D models present (39 routes, 0 page errors, 0 CSP violations) |
| Database | `bash supabase/tests/run.sh` (throwaway Postgres 16) | **147/147 pass** (122 existing + 25 new) |
| Prod dependency audit | `npm audit --omit=dev` | **0 vulnerabilities** (was 1 critical) |
| Full audit | `npm audit` | 5 high in dev-only lint tooling (`braces` via `eslint-config-next`); not shipped |

### Layer-by-layer

| Layer | Task | Status | Files | Evidence |
| --- | --- | --- | --- | --- |
| 01 | Snapshot, classify 759 changes, cleanup proposal | DONE | `docs/REPOSITORY_HYGIENE.md`, `.gitignore` | No deletes/resets; scratch/output/.playwright-cli ignored |
| 01 | Fix 21 lint errors | DONE | `FleetCovenantScene.tsx`, `Matrix.tsx`, `CinematicStatueScroll.tsx`, `eslint.config.mjs` (+3 warning fixes) | 0 errors. The vendored Framer component `CrumpledPaperReveal.tsx` (17 errors) is isolated by a file-scoped override, not rewritten |
| 01 | **Critical Next.js advisories** (RCE in image optimizer and `use cache`, server-action DoS) | DONE | `package.json`, `package-lock.json` (16.4.0 → 16.4.2, patch) | `npm audit --omit=dev`: 0. **On the Mac run `npm install` once** |
| 01 | Reproducible build on a compatible platform | DONE | – | Linux build passes; macOS `node_modules` mismatch is environmental |
| 01 | CI (lint, typecheck, tests, build, audit) | CODED_UNVERIFIED | `.github/workflows/ci.yml` | Every step passes locally; not yet run on GitHub (no remote push) |
| 02 | Compare the two schema trees, recommend | DONE (decision BLOCKED_EXTERNAL B01) | `docs/DATABASE_RECONCILIATION.md` | Table map, options A/B, rollback |
| 02 | Website intake migration: consent, attribution, idempotency, rate limiter | TESTED (not applied) | `supabase/migrations/20261023000700_website_intake.sql`, `supabase/tests/30_website_intake_tests.sql`, `run.sh` | 25 new checks; re-apply is idempotent |
| 02 | Live persistence proof | BLOCKED_EXTERNAL (B02) | – | Project `bsah-academy` paused; restore needs approval |
| 03 | Security headers + CSP | TESTED | `next.config.mjs` | E2E: headers present, 0 CSP violations on 39 routes with real 3D/Draco |
| 03 | Rate limits: leads 5/10 min, trustee 8/15 min, verify 30/10 min | TESTED | `lib/security/rate-limit.ts`, `app/actions.ts`, `app/schools/access/actions.ts`, `lib/verify/lookup.ts` | Unit tests; DB-shared limiter used when Supabase is configured |
| 03 | Turnstile anti-bot | CODED + unit-tested; keys BLOCKED_EXTERNAL | `lib/security/turnstile.ts`, `LeadFormExtras.tsx` | Off until both keys are set |
| 03 | User auth / admin roles in the app | NOT_STARTED (depends on B01) | – | RLS roles exist in SQL only |
| 04 | Consent checkbox on every enquiry form | TESTED | `LeadFormExtras.tsx`, `LeadForm.tsx`, `MouGenerator.tsx`, `CitadelConfigurator.tsx`, `app/actions.ts` | Server rejects without consent (all 6 gates); E2E |
| 04 | Attribution (path, hub, campaign, QR, referrer host, UTM; no IP/UA) | TESTED | `lib/leads/attribution.ts`, `LeadFormExtras.tsx` | E2E: `utm_source` and path reached the receiver |
| 04 | Idempotency (double click / retry = one lead) | TESTED | same + migration | E2E double-click → 1 delivery; DB duplicate → "Already received" |
| 04 | Honest states: not configured / failed / rate-limited / blocked | TESTED | `app/actions.ts`, `LeadForm.tsx` | Unit tests incl. unreachable DB |
| 04 | E-mail notification, admin lead view | BLOCKED_EXTERNAL / NOT_STARTED | – | Needs provider + auth |
| 05 | `/verify`: server lookup, valid/revoked/expired/unknown, minimal disclosure | TESTED | `lib/verify/lookup.ts`, `app/verify/actions.ts`, `Verifier.tsx` | Unit + E2E; honest "registry not connected" |
| 05 | Remove unsupported payment and stall-cam claims | DONE | `ParentScenes.tsx`, `FleetScenes.tsx`, `Doors.tsx`, `lib/content/{academy,home,command}.ts`, `app/parents/page.tsx` | "Payments via Razorpay / UPI Autopay" → "online payment not yet live"; stall-cam marked planned |
| 05 | MOU PDF, real hubs/fleet/standings, ROI finance sign-off | NOT_STARTED / BLOCKED_EXTERNAL (B05) | – | Samples remain labelled |
| 06 | Payment core: paise pricing, webhook + checkout signatures, state machine | TESTED, NOT CONNECTED | `lib/payments/core.ts`, `tests/payments.test.mjs` | Duplicate/out-of-order/over-refund cases. Gateway BLOCKED_EXTERNAL (B03) |
| 07 | Route error boundary + global error page | TESTED | `app/error.tsx`, `app/global-error.tsx` | |
| 07 | 3D model failure no longer crashes routes | TESTED | `components/three/ModelBoundary.tsx` + 4 scenes | Before: missing GLB → whole page error on 8 routes; after: 0 crashes |
| 07 | `loading.tsx` | Deliberately not added | – | Would replace the existing route Loader during navigation (redesign risk) |
| 08 | Media inventory | DONE | `scripts/media-inventory.mjs`, `docs/MEDIA_INVENTORY.md` | 456 files / 946 MB; 287 unreferenced candidates (297 MB); 89 referenced files > 3 MB |
| 08 | Compression, lazy loading, Lighthouse | NOT_STARTED | – | Needs approved final media (B04) |
| 09 | `sitemap.xml`, `robots.txt` (indexing off unless approved), contact canonical, Organisation JSON-LD | TESTED | `app/sitemap.ts`, `app/robots.ts`, `app/contact/page.tsx`, `app/page.tsx` | E2E |
| 09 | Privacy notice / minors' consent legal sign-off | BLOCKED_EXTERNAL (B06) | – | Consent label says "draft, pending legal review" |
| 10 | Test suites + E2E harness | DONE | `tests/*.test.mjs`, `tests/helpers/load-ts.mjs`, `scripts/e2e-smoke.mjs` | No new dependencies (jiti already in the lockfile; Playwright resolved from a local install) |
| 11 | Runbook, env checklist | DONE | `docs/DEPLOYMENT_RUNBOOK.md`, `.env.example` | Monitoring/backup drill BLOCKED_EXTERNAL (B08) |

### New findings this session

1. Next.js 16.4.0 carried three critical/high advisories (fixed by the 16.4.2 patch above).
2. `bsah-platform/` working tree shows **187 deleted files under `apps/web/`**; the gitlink has no `.gitmodules`.
3. About 70 source files the site imports are **untracked**: the last commit cannot build on its own. Commit soon.
4. `app/globals.css` and `Matrix.tsx` load Google Fonts (Cinzel, Cormorant Garamond, Inter), which CLAUDE.md forbids.
   Left unchanged (visual change needs approval); the CSP allows Google Fonts so nothing breaks.
5. Several films load from third-party Higgsfield CloudFront URLs at runtime (licence, availability and privacy risk).
6. `CrumpledPaperReveal.tsx` is a vendored Framer component by a named third party; commercial licence unconfirmed (B04).

### Weighted score (audit weights; only verified evidence counts)

| Dimension | Weight | 23 Oct audit | Now | Why |
| --- | ---: | ---: | ---: | --- |
| Frontend | 15 | 85 | 88 | Lint clean, error boundaries, 3D failure resilience, 39-route E2E |
| UI/UX | 10 | 85 | 85 | No redesign (by instruction) |
| Animation/3D | 7 | 78 | 80 | React 19 fixes; scenes degrade instead of crashing |
| Backend | 10 | 25 | 40 | Hardened actions, verify lookup, payment core; nothing live |
| Database | 8 | 30 | 38 | Intake migration tested (147/147); still paused, schema undecided |
| Auth | 6 | 10 | 12 | Trustee rate limit only; no user auth |
| API integration | 8 | 15 | 20 | RPC contracts tested against loopback; nothing live |
| Features | 12 | 45 | 52 | Lead path verified to webhook in a browser; verify statuses; truthful copy |
| Security | 8 | 40 | 62 | Critical CVEs patched, CSP/headers, rate limits, consent, idempotency |
| Performance | 6 | 30 | 32 | Measured inventory only |
| Testing | 6 | 25 | 55 | 29 unit + 147 SQL + 12 E2E; CI written, not yet run remotely |
| Production readiness | 4 | 20 | 30 | Runbook, robots gating, error pages; no deploy/monitoring/DB |
| **Public website** | 100 | **46.1** | **54.3** | |

Full ecosystem (35% website, 20% backend, apps and Command Center 35%, payments/streaming 10%): about **24%** (was ≈19–20%).

**Stage: demo-ready.** Not beta-ready until: B01 schema decision, B02 database restored with a live test lead, a lead
notification receiver, and an authenticated admin view of leads.

### Next session: exact first steps

1. On the Mac: `npm install` (Next.js 16.4.2), then `npm run lint && npm run typecheck && npm test && npm run build`.
2. Create the session branch and commit (see `docs/REPOSITORY_HYGIENE.md`); push to GitHub so CI runs.
3. Owner decisions: B01 (schema A or B), B02 (restore approval), e-mail provider, Turnstile account.
4. Then: apply the chosen migration to a dev project, live lead test, admin lead view behind Supabase Auth.

## Session 23 October 2026 (second directive: Master Production Integration, Layers 00–15)

Full detail, evidence and blockers: **`PRODUCTION_READINESS.md`**. Summary:

- Built: Supabase Auth staff console (`/admin`: enquiries with status, private MOU documents via 5-minute signed URLs,
  media uploads with magic-byte validation), `proxy.ts` guard (`noindex`, `no-store`), password reset flow, storage
  buckets and policies, MOU → PDF (download on the page; private copy stored when the database is live), Formspree
  server-side forward, Resend notifications with idempotency, new-format Supabase key handling.
- Owner-requested design: Noto Serif Display + Plus Jakarta Sans (self-hosted, OFL); doctrine statement reset as one
  sentence pair; hero film framed at its true scope ratio with attached controls; letter-roll navigation animation;
  house-palette moodboard section. No other visual change.
- New dependencies (exact versions, directive-authorised): `@supabase/supabase-js` 2.118.0, `@supabase/ssr` 0.12.7,
  `pdf-lib` 1.17.1. **On the Mac run `npm install` once.**
- Tests: lint 0 errors; typecheck pass; 43/43 unit; 176/176 database; build pass; 18/18 browser.
- Not live: database (new project unreachable from this session), Resend and Formspree (hosts blocked here),
  Vercel deployment (see readiness file). Pasted Resend and Supabase secret keys must be rotated after launch.

### Weighted score (same weights; only verified evidence counts)

| Dimension | Weight | Before | Now | Why |
| --- | ---: | ---: | ---: | --- |
| Frontend | 15 | 88 | 90 | Typography system, hero framing, admin UI; 18 E2E |
| UI/UX | 10 | 85 | 88 | Owner-requested type, film and moodboard changes, verified at 360–1920 px |
| Animation/3D | 7 | 80 | 81 | Letter-roll navigation (reduced-motion safe) |
| Backend | 10 | 40 | 55 | Formspree, Resend, PDF, storage, auth actions — tested on loopback, not live |
| Database | 8 | 38 | 45 | Auth/storage/documents migration tested (176/176); not applied |
| Auth | 6 | 12 | 45 | Staff auth, roles, proxy guard, reset — tested, not live |
| API integration | 8 | 20 | 32 | Contracts for three providers tested; no live call possible here |
| Features | 12 | 52 | 62 | MOU PDF, staff lead view, media library, moodboard |
| Security | 8 | 62 | 66 | Upload validation, private bucket, admin rate limits, noindex; key rotation pending |
| Performance | 6 | 32 | 34 | Fonts self-hosted, Google Fonts removed |
| Testing | 6 | 55 | 65 | 43 unit + 176 SQL + 18 E2E |
| Production readiness | 4 | 30 | 36 | Readiness file, env plan, clean-clone build verified; Vercel project and deploy pending |
| **Public website** | 100 | **54.3** | **62.4** | |

## Session 23 October 2026 (third directive: Full Autonomous Production Setup, Layers 01–06)

Full status and evidence: **`PRODUCTION_READINESS.md`** (rewritten for this pass). Summary:

- **GitHub:** session branch pushed to the public `blackstallion-org/blackstallion.academy` (owner kept it public);
  CI now also runs the database suites (`database` job). `main` untouched.
- **Supabase (live, owner-approved):** the project already runs the operations schema, so the website was added as an
  additive layer (`supabase/live/`): intake table with consent/idempotency/attribution, mirrors into the operations
  tables, rate limiter, minimal-disclosure passport verification, documents/media records, three buckets, append-only
  audit. Two security fixes for the operations schema (self-promotion and sign-up role injection). Replica suite 75/75;
  live checks rolled back. `lib/auth/admin.ts` reads staff roles from `public.users` (SUPER_ADMIN) with the old
  `profiles` table as fallback; `/verify` handles "verification switched off".
- **Vercel:** project `blackstallion-academy` (team `blackstallion`), Git-connected, eight sensitive variables on
  production + preview, protected preview deployed from the branch. No production deployment.
- **Live on the preview:** MOU and QR-attributed parent enquiries reached Supabase, Formspree and Resend; MOU PDF stored
  privately; `/verify` sample and unknown answers; reset form gives the generic answer; headers and noindex in place.
- **Fixed in this pass:** stills were blank on Vercel because `mediaSrc` returned git-ignored PNG masters (now the
  shipped WebP copies; `tests/media.test.mjs`); headline spans no longer carry a prohibited `aria-label` (home
  accessibility 94 → 97); 24 reel labels renumbered after `/statue` became reel 03.
- **Owner approvals pending:** production promotion, Supabase Auth URLs, first staff sign-in, deleting the synthetic QA
  rows, DNS + Resend domain, indexing, key rotation; optional operations-schema fixes, Turnstile, monitoring, backups.

## Session 23–24 October 2026 · Mobile performance pass (branch `perf/mobile-lighthouse`)

Full method, numbers, visible changes, remaining options and risks: **`docs/PERF_NOTES.md`**.

- Hero LCP fixed (the `<video>` replaced the poster as LCP after hydration): home LCP 17.5 → 6.5 s in Lighthouse,
  poster painted from the first frame.
- Scroll set-ups (SplitText, ScrollTrigger, parallax), story reels, the cube gallery, three.js, the R3F stages and
  below-the-fold media now start as they approach the viewport; statue renders on demand; offscreen loops pause.
- Bytes at load: `/` 6.68 → 3.00 MB, `/parents` 3.73 → 1.53, `/legend` 1.84 → 1.42, `/anatomy` 13.59 → 1.04 MB.
  Main-thread CPU blocking (×4, from the traces): `/` 2,300 → 455 ms, `/legend` 1,490 → 145, `/parents` 462 → 55.
- Fixed on the way: loader opt-out CSS lost to the loader's own CSS; reduced motion re-mounted the site and threw
  React #418. Per-section `<Suspense>` boundaries were tried and removed (they hid content without JavaScript).
- Checked: lint (0 errors), typecheck, tests (46/46), build; 390/1440 + reduced-motion screenshots in `output/perf/`.
  Lighthouse TBT on this shared sandbox is dominated by CPU contention — see the notes before quoting scores.

## Session 24 October 2026 · Final Master Execution Directive (layers 01–20) — active checklist

Branch `session/2026-10-24-final-completion` (rollback tag `checkpoint/pre-final-2026-10-23`). Final audit and score:
`PRODUCTION_READINESS.md`. Legend: [x] done and verified · [~] partial · [ ] open · (A) needs owner approval ·
(B) blocked by an external account/service.

- 01 Inventory and safety
  - [x] repository, branch, commits, remote, Vercel, Supabase and env names recorded
  - [x] rollback tag created
  - [x] no user work lost (pre-existing untracked `index.html` and `bsah-platform` changes left untouched)
- 02 GitHub/CI
  - [x] secret scan of all history (placeholders only)
  - [x] CI: lint, types, unit, build, audit, both DB suites, browser smoke (new `e2e` job)
  - [x] uptime workflow
  - [ ] push of this branch (B: GitHub identity check for the token)
  - [ ] branch protection on `main` (after the push)
- 03 Supabase
  - [x] live schema reconciled (`docs/DATABASE_ARCHITECTURE.md`)
  - [x] website layer + F1/F2 live
  - [x] anon hardening prepared and tested (179/179)
  - [ ] apply it (A)
  - [ ] backups (A: paid plan or manual dump routine)
- 04 Auth
  - [x] redirect allow-list for previews / production / domain (Site URL unchanged)
  - [x] server-side role checks
  - [x] generic errors and reset
  - [ ] staff sign-in on a deployment (owner)
- 05 Admin console
  - [x] search/filters, detail, assign, MOU, QR, audit, documents, media
  - [x] 30 new tests
  - [ ] live check by a SUPER_ADMIN (owner)
- 06 Enquiries
  - [x] all gates validated
  - [x] consent, honeypot, idempotency, rate limits
  - [x] live MOU + QR parent enquiry through Supabase, Formspree and Resend
  - [ ] Turnstile (B)
  - [ ] Resend domain (A: DNS)
- 07 Business features
  - [x] MOU PDF (live)
  - [x] `/verify` + `/verify/[code]` on the live registry (QR target)
  - [~] ROI calculator and campus configurator unchanged (assumptions need business sign-off)
  - [x] payments deferred and labelled
- 08 Security
  - [x] critical S1/S2 live
  - [x] zod CVE fixed
  - [x] headers, upload, storage, logging reviewed (`docs/SECURITY_AUDIT.md`)
  - [ ] S3–S6 (A)
  - [ ] S7 role policies (needs the apps team)
  - [ ] S8 seed accounts (A)
  - [ ] S9 key rotation (A)
- 09 Performance
  - [x] lazy start of heavy work, WebP stills, hero LCP, CSS title rise; home 40 → 66, reel pages 70–76 (lab)
  - [~] 80+ not reached; options documented (`docs/PERFORMANCE_REPORT.md`)
- 10 Frontend audit
  - [x] 41 routes × 8 widths + reduced motion
  - [x] 12 major + 11 minor fixed
  - [~] 3 minor open (m2, m10, part of m9)
  - [x] HTML prototypes "The Art of the Peg" / "One Conversation. Two Bodies" stay reference-only (not part of the agreed routes)
- 11 SEO/monitoring
  - [x] metadata, canonical (incl. `/lithos` → `/statue`), sitemap, robots, OG image, JSON-LD
  - [x] server error reporting
  - [x] uptime workflow
  - [x] consent-free analytics behind a flag (A: switch on)
- 12 Tests
  - [x] 79 unit, 176 + 179 SQL, 18 browser, 410 audit runs, targeted re-checks
- 13 Infrastructure
  - [x] Vercel project, env, previews
  - [ ] production (A)
  - [ ] DNS (A)
- 14–16 Audit, handover, mobile contracts
  - [x] `PRODUCTION_READINESS.md`, `docs/*.md` (9 handover documents + `MOBILE_BACKEND_CONTRACTS.md`)
