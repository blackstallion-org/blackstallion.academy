# BSAH progress

Date: 17 October 2026 (Asia/Kolkata).

## Confirmed baseline

Phase 0 read-only discovery completed before this approval. Existing implementation is mixed with uncommitted developer/design/media work. Detailed baseline, requirement mapping and proposed roadmap are recorded in BSAH_IMPLEMENTATION_PLAN.md and the preceding conversation. Previous `docs/audit-completion-report.md` is historical; it is not proof of full dossier/production completion.

## Approved task A1: anatomy stability

Status: completed and verified locally. Ready for user review; no production deployment.

Confirmed changes:
- Automatic interactive-archive fallback after renderer/environment setup failure, model/decoder failure, load deadline or context loss.
- Explicit retry through the existing 3D button.
- Render scheduling stops while offscreen/hidden and after a paused view settles; user controls wake it without rebuilding the scene.
- Reused camera target vectors and cached media query rather than allocating/querying each frame.
- Reduced motion defaults to archive; explicit 3D selection permits a still view with working point/reset controls.
- Existing compressed model, lighting, photographs, native pan-y and homepage cream retained.
- Shared component also serves home; homepage regression check included, without changing that route or global styling.

Affected files: two anatomy viewer components, a focused browser regression script, and the three canonical tracking documents. No application dependency, media source, authentication/backend, nested platform, migration or deployment change is authorized by A1.

## Current verification

- Targeted lint, TypeScript, production build, script syntax and whitespace checks passed.
- Full lint passed with four unchanged pre-existing warnings.
- Ten production-server browser scenarios passed with no detected uncaught script/hydration errors.
- Measured zero draw calls in sampled paused/offscreen/hidden states; one model request across controls; DPR cap and native vertical swipe verified.
- Failure fallback, retry, cancellation of an in-flight model load, reduced motion, keyboard/desktop and shared-homepage regression checks passed.
- Screenshots visually reviewed. Reused development-server attempts had incomplete results/stale hydration warnings; the fresh production build passed. Physical-device tests and FPS benchmarking remain unperformed.
- Details, limitations and evidence paths are in BSAH_TEST_RESULTS.md.

## Proposed follow-up work

No follow-up feature is marked complete by this task. Desktop hero resolution/media handling, the intended K-12 carousel, full somatic illustrations/node interactions, remaining renderer lifecycles, council/product assets, trustee production provisioning and form/backend gaps retain the statuses established in Phase 0.

## Known external blockers

- Institutional claims/appointments and profile rights remain unconfirmed.
- Statue metadata lists CC-BY-NC-4.0; public-launch rights/replacement remain unresolved.
- Final product assets, site-specific approved blueprints, private proposal content and booking process are absent.
- Trustee production credentials, rate limiting and revocation design need approval/provisioning.
- Physical-device profiling, current live backend verification and repository/submodule release reconciliation are outstanding.
- No production deployment is approved.


## Editorial typography and motion — 17–18 October 2026

Completed the user-approved scope: `/legend`, `/anatomy`, `/statue`. No other route opts into the new presentation. `/lithos` shares the Monument component, so an `editorial` prop defaults to false and is enabled only by `/statue`.

- Added GSAP/SplitText line masks, restrained word and character entrances, image masks and desktop depth through opt-in components. Existing shared Headline, Reveal, FilmImage, SmoothScroll, root layout, fonts and global stylesheet remain unchanged.
- Legend retains its chapter navigation, original photographs, native honour carousel and ear-story interaction; gains editorial headline composition, image entrances and shorter vow pacing. Opening text sits above the horizon on narrow screens.
- Anatomy retains its specimen/model, hotspot, equipment and ear controls. Its opening headline uses existing approved white against the dark photo, gains a character entrance and catalogue reveal, and the existing photograph uses a mobile focal position to keep the horse's head in frame.
- Monument retains its six chapters, model and camera code; gains word choreography, explicit reading holds, desktop text/image separation and mobile copy below the visual. Loading is nonblocking. Reduced motion, no JavaScript, failed model or a 20-second deadline produce a readable archive using the existing image and natural-flow chapter copy.
- The route-mounted Lenis callback updates ScrollTrigger while preserving the existing RAF owner and scrolling settings. Contexts, media conditions and SplitText are reverted on cleanup. New motion skips reduced-motion users.
- Route-only noscript styles remove the pre-existing loader obstruction and restore initially hidden shared-component copy. Stronger browser assertions check parent visibility and whether headings are covered.

Verification: lint, typecheck, production build and whitespace checks passed. Four pre-existing lint warnings remain outside scope. Twelve layout cases (1440/768/390/320), ten accessibility/failure/navigation/alias cases and ten existing Anatomy regressions passed; accessibility cases were rerun with stronger assertions on the final fallback code. See BSAH_TEST_RESULTS.md and docs/editorial-motion-review.md for evidence, screenshots, commands and limitations.

No dependencies installed, no asset sources replaced, no palette values/font families/written narrative/destinations/backend logic changed, no commit or deployment performed. Unrelated concurrent changes in SchoolScenes.tsx were detected and left untouched. Remaining dossier requirements retain their earlier statuses. Stopped for visual review of these three routes.


## Interactive archive, typography and portrait — 18 October 2026

Added a six-view cube mosaic to the homepage, short reversible glyph scrambles on selected headings, and pointer-driven image-coloured particles over the existing Fleet Marwari portrait. Existing GSAP/OGL and local assets are reused. Reduced motion uses static text/images; keyboard gallery controls are available. No deployment or dependency installation. See docs/interactive-image-effects.md for placements, changed architecture, source references and limitations.


## Admissions and Command redesign — 19 October 2026

Implemented the three supplied visual directions at `/contact`, `/command` and homepage `#home-command`. Added a generated equestrian arcade WebP backdrop, three admission corridors and a three-step form with review; added the editorial command terminal, navigation rail and dossier, reusing existing scripted answers and submission action. Preserved existing brand/font families and destinations. Removed visible ReplayHeadline controls; entrance style varies between visits and plays slowly.

Changed files: app/contact/page.tsx; app/command/page.tsx; components/sections/contact/Gates.tsx and Gates.module.css; components/sections/shared/LeadForm.tsx and LeadFormWizard.module.css; components/sections/command/Terminal.tsx, Terminal.module.css, CommandExperience.tsx and CommandExperience.module.css; components/sections/home/HomeClose.tsx and HomeTypography.module.css; components/motion/ReplayHeadline.tsx and ReplayHeadline.module.css; public/images/admissions/academy-gate-backdrop.webp. No dependencies installed or deployment performed.

Focused lint, TypeScript and production build passed; desktop/mobile browser checks and combined visual comparisons documented in design-qa.md. One synthetic QA enquiry was accidentally submitted before correcting the advance-button behavior; user informed, no record deleted.


## Reference-inspired typography — 19 October 2026

Added reference-inspired western (Rye), heritage (Pirata One), brush (Permanent Marker), condensed (Anton) and existing elegant Newsreader pairings to the existing motion exhibits across 13 routes. Added four self-hosted, licensed WOFF2 files (98,460 bytes) and retained notices. Body/UI fonts, palette, backend and animation behavior preserved. Exact commercial reference fonts were not supplied; alternatives documented. See docs/typography-font-review.md for per-page mapping, changed files and evidence.


## Interaction soundscape — 19 October 2026

Added an opt-in, site-wide interaction soundscape using all seven supplied recordings, optimized as short faded mono MP3 cues, plus two original synthetic UI accents. Mapped gallop/chase/herd/chariot to selected journey links, snort/neigh to horse controls, and horse call to archive buttons. Single voice, quiet caps, cooldowns, immediate mute, hidden-tab stop, audible-video priority. Removed the background drone loop and per-keystroke terminal noise. Originals preserved; no dependencies or deployment. See docs/soundscape-review.md.
