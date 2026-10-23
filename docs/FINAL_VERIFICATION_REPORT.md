# BSAH final verification report

19 October 2026 · Local engineering implementation and verification pass finished. **The website is not production-ready for sign-off.** External delivery, production access safeguards, approved institutional/product assets, and physical-device verification remain open. No deployment was performed.

The current result preserves Next.js 16.4 / React 19.3, existing routes, BSAH palette/fonts, editorial structure, signature animations and real backend architecture. Earlier visual restructuring and supplied-model optimization were inspected and reused rather than rebuilt. The global loader now uses the supplied procedural horse foundation, not the former photographic/eyes opening. The only public names removed were unconfirmed proposed council nominees, as required by the current directive.

## Final counts

| Status | Requirements |
| --- | ---: |
| VERIFIED YES | 160 |
| IMPLEMENTED — UNVERIFIED | 7 |
| FAILED | 0 |
| BLOCKED | 18 |
| NOT APPLICABLE | 2 |
| IN PROGRESS | 0 |
| NOT STARTED | 0 |
| Total | 187 |

These are granular checklist records, including repeated layer gates. Source review can verify a static fact but is never used to establish untested browser or production behavior. The seven implemented/unverified records are explicitly retained: exhaustive animation/rerender profiling, natural film completion, independent gallop anatomy review, flicker across all refresh rates, hardware-adaptive quality, Trojan concept memory profiling, and manual pixel-by-pixel comparison of every section at all widths.

## Baseline and protection

Repository: `/Users/stingraj/blackstallion-website`; existing branch: `restore/original-bsah-design`. The tree was already substantially modified and contained untracked application work. No reset, checkout, clean, submodule change or destructive deletion was performed. Supplied Downloads were not modified.

Before implementation, existing tracked work was saved to `output/engineering/baseline/tracked-work.patch`; application sources/instructions were saved to `source-before.tgz`. Git state and baseline logs are beside them. The source archive excludes environment credentials. Comparing source to that archive found no missing source files; `source-change-inventory.json` records the actual modified/new files, excluding macOS archive metadata.

Baseline typecheck and production build passed. Baseline lint had 16 errors and 33 warnings. The final lint has zero errors and nine warnings; existing scratch captures/generated output are excluded, application rules remain enabled. Remaining warnings concern Matrix's external font stylesheet/raw SVG-aligned images, three stable animation-state ref cleanup references, and two unused variables. These warnings are not represented as resolved.

An additional whole-working-tree `git diff --check` reports pre-existing whitespace issues. Comparison against the preserved source archive confirms the whitespace counts and blank EOF state are unchanged (`diff-check-final.log`, `diff-check-baseline-comparison.json`). Existing unrelated formatting was preserved; this ancillary check is not represented as passing.

## Fresh results for the eleven directive groups

There was no separate complete audit dossier attached to this request. The eleven groups below map the supplied master directive and its cited problems; no unseen dossier has been represented as reviewed.

| Directive | Original problem | Implemented solution and modified files | Verification and actual result | Remaining issue | Final status |
| --- | --- | --- | --- | --- | --- |
| 1. Architecture, scrolling and performance | Lint/lifecycle errors, offscreen GPU work, shared-loader cancellation, eager media and mobile gesture risk. | Visibility gating, bounded DPR, GPU/resource disposal, throttled map projection, ordinary wheel/pan retained, one Lenis. Files: `Anatomy3DHorse.tsx`, `ViscousLiquidCanvas.tsx`, `India3DMap.tsx`, `Hyderabad3DMap.tsx`, `CitadelScene.tsx`, `StatueCanvas.tsx`, `lib/three-dispose.ts`, `FieldSphereHero.tsx`, `Footer.tsx`, `LedgerAscent.tsx`, `eslint.config.mjs`. | Production starts/builds; 312 responsive cases; anatomy and monument draw counters stop offscreen; development Strict Mode loads one model/one canvas without errors. Footer makes no MP4 request until visible, then loads. CPU/network trace reviewed. | Sample LCP remains 3.484 seconds; no physical iOS/Android trace or constant FPS measurement; exhaustive component profiling not complete. | IMPLEMENTED — UNVERIFIED |
| 2. Hero film | Original 34.54 MB source, playback/failure-state gaps and black video leader. | Reused optimized films and small responsive posters; 2.8-second start beyond leader; mute/pause/play/skip/progress; buffering/autoplay/source-error handling. Files: `HeroFilm.tsx`, `Hero.tsx`, `public/video/hero-main-*`. | Mobile and desktop source selection, controls, progress, skip/focus, blocked autoplay and missing video all pass. Mobile is 3,148,814 bytes / 720p / 24 fps; desktop 8,176,105 bytes / 900p / 25 fps. | Natural completion not observed because the approved film loops; physical mobile autoplay not tested. | IMPLEMENTED — UNVERIFIED |
| 3. Pixel horse loader | Previous loader/opening did not match requested compact ivory pixel horse; failed navigation could leave overlay. | Standalone Canvas 2D prototype reviewed before integration; four independent articulated legs, body/neck/tail, 12 periodic poses, 510 ms gait, compact 180–280px composition. Single initial/internal-link controller with settle/fade and deadlines. Files: `public/animations/pixel-horse.js`, `public/prototypes/pixel-horse.html`, `PixelHorse.tsx`, `Loader.tsx`, `Loader.module.css`, `app/layout.tsx`. | 426 lit cells in sampled pose; independent limbs and changing torso/neck/tail; phase 0 equals phase 1; approximately 1.19 ms/sample render in desktop test. Initial, route, cancelled navigation, missing engine and no-JavaScript releases pass; reduced motion tested. | Veterinary gait certification, all-refresh-rate flicker and physical mobile battery/FPS not verified. Optional scroll-scrub integration intentionally not added. | IMPLEMENTED — UNVERIFIED |
| 4. Academy/K-12 layout | Narrow-width statistical grid needed readable stacking and navigation. | Reused institutional content with native mobile scroll-snap, pagination, 44px controls and clamp typography; desktop remains three columns. Files: `AcademyStats.tsx`, `Hero.tsx`. | Touch swipe, pagination and keyboard/region accessibility pass; no overflow in the eight-width home sweep. | Physical-device checks remain part of global mobile sign-off. | VERIFIED YES |
| 5. Somatic engine | Existing illustration needed accessible node interaction and separation of explanations from visual. | Mounted existing conceptual 2D map; cervical/core/lumbar and ears/withers/reins paths; details below illustration, selected highlight, reduced pulse, keyboard and focus-safe Matrix dialogs. Files: `SomaticMap.tsx`, `Matrix.tsx`, `lib/motion/use-dialog-focus.ts`. | All six nodes, correct selected detail/path, keyboard selection, reduced motion, modal focus/Escape and responsive containment pass. | Clinical/neurological wording remains explicitly unverified editorial content requiring specialist review. | BLOCKED |
| 6. Marwari and monument models | Required supplied model swaps, optimization, safe loading/gesture/failure behavior. | Preserved previously optimized user-supplied black home/anatomy model and monument statue; fixed shared-download cleanup, normalized camera axis, DPR/offscreen work, readable fallbacks and restrained lighting. Files: `Anatomy3DHorse.tsx`, `StatueCanvas.tsx`, `CinematicStatueScroll.tsx`, two `public/models/*.glb` assets. | Both Draco/WebP models actually load; 1,273,444 and 1,348,784 bytes. Ten anatomy scenarios pass, including renderer/model/decoder/deadline/context-loss fallback, retry and late result disposal. Monument chapter 6/orbit, offscreen draw stop and both reduced-motion routes pass. | Device-specific adaptive quality and physical-device GPU/lighting not certified. | IMPLEMENTED — UNVERIFIED |
| 7. Sovereign Council | Unconfirmed named nominees and unavailable approved portraits. | Kept proposed institutional seat structure/initials and disclosures; removed unverified public nominees. File: `SovereignCouncil.tsx`. | Cards align in responsive sweep; keyboard disclosure works; no new appointment, title, consent or credential invented. | Approved names/roles, consent, biographies and portraits must be supplied/verified before publication. | BLOCKED |
| 8. Trojan Box | Final approved product sequence/model absent. | Retained existing lightweight CSS concept with drag/touch and keyboard rotation; no invented product detail. File: `TrojanBox.tsx`. | Concept loads, touch rotation/keyboard controls and vertical pan pass. | Approved product asset required to implement and verify a faithful physical-product 360 viewer; concept memory profiling not performed. | BLOCKED |
| 9. Trustee gateway | Needed honest secure access behavior and production safeguards. | Retained server hash validation, signed scoped HttpOnly session, expiry/revocation and fail-closed config; fixed retry input reset. Files: `app/schools/access/AccessForm.tsx`; existing server actions and `lib/security/trustee.ts` inspected/tested, not replaced. | Ephemeral local code: anonymous exclusion, invalid rejection, valid server access, cookie flags and signout pass. Crypto suite passes tampering, expiry, revocation and fail-closed tests. No hardcoded real frontend passcode. | Production credentials/invitations are not provisioned in this pass. A fixed 650ms delay is not distributed rate limiting. Rate limiter/infrastructure and production resource authorization tests remain blocked. | BLOCKED |
| 10. Contact/onboarding/MOU forms | Configurator simulated MOU success; validation, retry and duplicate protections incomplete. | Connected configurator to existing server action; strengthened server validation and native fields; pending/error/value retention and duplicate guards. Files: `app/actions.ts`, `LeadForm.tsx`, `MouGenerator.tsx`, `CitadelConfigurator.tsx`. | Fifteen action scenarios pass, including invalid fields, honeypot, missing configuration, destination failure and transport contract. Three enquiry wizards, configurator MOU and standalone MOU generator each deliver one acknowledged synthetic request under double-click tests. Generator preview/required fields/retained values pass. | All test deliveries went only to loopback. Actual production Supabase persistence/RLS, destination receipt and cross-request production idempotency remain unverified. No fake success substituted. | BLOCKED |
| 11. Visual, responsive, accessibility, SEO and final QA | Text contrast/overlap, blocked journal controls, inaccessible scroll regions, nested main and inherited root canonicals. | Preserved editorial separation; fixed school/journal header collision, dead film link, corrupt thumbnail fallback, science text opacity, readable captions, table focus, valid definitions/ARIA, accessible replay names and page canonicals. Files: affected route metadata, `FieldSphereHero.tsx`, `CommandExperience.tsx/.module.css`, `Terminal.tsx`, `CadetScenes.tsx`, `CurriculumScenes.tsx`, `FleetScenes.tsx`, `TournamentScenes.tsx`, `ScienceScenes.tsx`, `WhyScenes.tsx`, `WebGLTransitionSlider.tsx`, `WillemExpandingHero.tsx`, `app/curriculum/page.tsx`, `app/legend/page.tsx`, `app/verify/page.tsx`. | 39 pages × eight widths = 312 cases pass. After final accessibility edits, 12 affected routes × four widths = 48 additional cases pass. All 39 full-document axe scans report zero automated WCAG A/AA violations. Build/type/lint pass; selected before/after and final screenshots reviewed. | Automated checks do not certify full visual perfection, all interaction states or WCAG conformance. Manual screen-reader and physical-device review remain open. | IMPLEMENTED — UNVERIFIED |

All filenames in the table resolve within the repository; the detailed checklist and `source-change-inventory.json` provide the change/evidence ledger. Existing functioning backend operations were preserved. The two requested model replacements were already authorized by the earlier explicit supplied-asset request; no additional substantial functionality was replaced.

## Automated verification evidence

| Check | Actual final result | Evidence under `output/engineering/` |
| --- | --- | --- |
| Type checking | PASS | `typecheck-final.log` |
| Lint | PASS, 0 errors / 9 warnings | `lint-final.log` |
| Production build | PASS | `build-final.log` |
| Server-action scenarios | 15 PASS; 7 acknowledged synthetic local transport deliveries | `actions/results.json`, `actions-final.log` |
| Trustee cryptography | PASS | `trustee-final.log` |
| Primary browser interactions | 13 PASS; 0 unexpected page errors | `browser/results-interactions.json` |
| Anatomy lifecycle/fallback | 10 PASS; 0 errors | `browser/anatomy/results.json` |
| Additional footer/loader/monument/journal | 5 PASS | `browser/results-extras.json` |
| Standalone MOU generator | PASS, one acknowledged local request | `browser/results-mou.json` |
| Full responsive route sweep | 312 PASS | `browser/results-site-matrix.json` |
| Post-fix affected-page layouts | 48 PASS | `browser/results-final-layout.json` |
| Automated accessibility | 39 pages PASS, 0 reported violations | `browser/results-accessibility-all.json`, `browser/axe-*.json` |
| Development Strict Mode | PASS, one model request and canvas | `dev-strict.json`, `dev-strict-anatomy.png` |
| Throttled performance capture | Captured/reviewed; not an FPS or launch-quality pass | `browser/mobile-metrics.json`, `mobile-trace.json`, `trace-review.json` |

The deliberately aborted statue request produces one expected exception in the failure test; the readable fallback is asserted and that exact exception is recorded separately in `results-extras.json`. There are zero unexpected page errors in the final successful browser groups. Superseded failing runs remain historical evidence, not final passing results.

Browser package: installed Playwright with Chrome 155. No application test package was added. Axecore was downloaded into local verification tooling only. Standalone tests use synthetic `.invalid` contact data and ephemeral invitation secrets in process memory. No personal enquiries or test messages were sent to production destinations.

Representative reproduction commands:

```sh
npm run typecheck
npm run lint
npm run build
node scripts/test-engineering-actions.mjs
node scripts/test-trustee-security.mjs
BSAH_CHECK=interactions BSAH_TEST_PORT=3104 node scripts/test-engineering-browser.mjs
BSAH_CHECK=site-matrix BSAH_TEST_PORT=3107 node scripts/test-engineering-browser.mjs
BSAH_CHECK=accessibility-all BSAH_TEST_PORT=3110 node scripts/test-engineering-browser.mjs
BSAH_CHECK=performance BSAH_TEST_PORT=3111 node scripts/test-engineering-browser.mjs
```

Set `BSAH_PLAYWRIGHT_MODULE` to an installed Playwright module if it is not resolvable normally. Current Codex bundled module: `/Users/stingraj/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`. Browser runner starts/stops its own local production server and synthetic receiver; use the other documented groups `anatomy`, `extras`, `mou` and `final-layout` for focused repeats. Run performance without concurrent browser/build work.

## Mobile performance findings

Desktop Chromium emulating 390×844 at DPR 3, CPU 4× slower, 1.6 Mbps download and 100 ms latency, fresh context, no other test/build job running:

| Metric | Before final media deferment sample | Final sample |
| --- | ---: | ---: |
| Observed LCP | 4.316 s | 3.484 s |
| Cumulative layout shift | 0.00172 | 0.00172 |
| Long tasks | 5 | 4 |
| Largest long task | 242 ms | 247 ms |
| Total long-task duration | 704 ms | 576 ms |
| Completed resource transfer timing bytes | 1,621,507 | 1,577,920 |
| DOM content ready | 2.223 s | 2.104 s |

The observed 3.484-second LCP and remaining long tasks warrant further performance work and real-device validation. This is a measured limitation, not a mobile performance sign-off.

The first full-load attempt timed out at 45 seconds under throttling. Follow-up measurements intentionally begin at DOM content readiness and take a 20-second observation window plus eight scroll gestures; `loadEventEnd` is still zero at capture, so these are not claims that all media finished loading. Resource timing transfer bytes include only completed/visible timing entries, not total future/cross-origin media transfer. LCP is an observed candidate in this bounded lab window, not field Core Web Vitals.

The trace contains layout, paint and scripting work; four main-thread long tasks remain, with the largest 247 ms. Below-fold poster/CSS image transfers and initial script/font work still compete on the throttled connection. The targeted footer fix is separately verified by network request assertions. A single before/after run cannot establish statistically reliable performance improvement, and no constant 60 FPS, hardware battery result or physical mobile performance pass is claimed.

## Visual verification scope

Baseline screenshots are in `baseline/`; final top/footer screenshots for the 39 routes at 390px and 1440px are `browser/site-*.png`. Additional final journal/command screenshots are `browser/final-*.png`; anatomy, monument and loader previews have their own named captures. Selected screenshots were visually inspected, including compact pixel prototype and 12-pose contact sheet, school header, journal header/controls, command layout and supplied anatomy model.

The eight-width sweep checks visible section containment, completed image decode failures, reachability, a single main landmark and canonical paths. It cannot detect every overlap, pending lazy image, visual taste issue or animation frame. It used reduced motion for deterministic broad coverage; separate normal-motion interaction/3D suites cover the affected interactive systems. It is not a claim of exhaustive manual screenshot review at every width.

## Exact blockers and approval boundaries

1. **Live enquiry delivery:** actual production Supabase/RPC persistence, RLS and recipient receipt have not been verified. The current environment has a configured Supabase endpoint/key, but its values were not printed or changed. Local contract tests do not establish a deployed database function or successful delivery. Production cross-request idempotency is also unverified.
2. **Institutional access:** production invitation/session configuration, approved private institutional resources and distributed attempt limiting remain unavailable/unverified. The current fixed delay is insufficient as a distributed limiter. New infrastructure, authentication architecture changes, credentials or database migrations require the user's stated approval gate.
3. **Council:** approved appointments/titles/consent/biographies/portraits are absent. Proposed seats remain generic.
4. **Trojan Box:** approved physical product sequence/model is absent. Current presentation is a concept, not a verified product 360.
5. **Scientific copy:** no specialist approval of neurological/clinical claims was supplied. Existing information remains explicitly qualified.
6. **Physical/accessibility QA:** real iPhone/Android, physical GPU/FPS, mobile autoplay, hardware refresh-rate checks and manual screen-reader assessment were unavailable.

No deployment, publishing, destructive change, migration, credential update or appointment publication was attempted. The independent safe local work has been completed; blocked items have not been relabeled as verified to manufacture a production-readiness claim.

## Follow-up — scroll-driven paragraph reveal · 19 October 2026

Added `components/motion/ScrollRevealText.tsx` and its small CSS module, using existing GSAP/ScrollTrigger dependencies. Applied it to 40 selected editorial paragraphs in 28 source files. Existing paragraph classes, typography, inline elements, text and whitespace remain in place. Small labels/forms, drop caps, dim captions and photo-overlay descriptions were deliberately excluded. Existing homepage paragraph entrance tweens skip the new component to avoid competing animation controllers.

Defaults: word reveal, viewport start 92%, completion 65%, unrevealed opacity 0.35 and 0.25-second scrub smoothing. Reusable props also support character splitting and custom start/end/dim/smoothing; custom font settings continue through ordinary paragraph className/style. React renders the spans, so content changes do not depend on destructive DOM text splitting. All text remains present in server HTML. Reduced motion, keyboard focus within the paragraph, and print render at full opacity.

Fresh production build and type checking pass. Targeted lint passes. Production Chromium tests at 390 and 1440 verify dim-to-partial-to-full progression, backward scrubbing, matching inherited typography, unchanged text during animation, no horizontal overflow, actual client navigation/back, keyboard-focus and print full opacity, reduced-motion readability and no-JavaScript content. Zero page errors. Evidence: `output/engineering/paragraph-*.log`, `paragraph-reveal/results.json`, `paragraph-reveal/progress-*.png` and `revealed-*.png`.

This follow-up has targeted verification; the earlier 39-route accessibility/performance audit predates this new animation and was not repeated in full. Active unrevealed words intentionally use reduced opacity as requested. The broader production blockers remain unchanged. Nothing was deployed.
