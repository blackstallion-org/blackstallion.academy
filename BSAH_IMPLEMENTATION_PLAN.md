# BSAH implementation plan

Date: 17 October 2026 (Asia/Kolkata).

## Authority and scope

The user approved the recommended first implementation task following the read-only Phase 0 audit: stabilize the anatomy viewer. This approval covers that bounded task and its verification/tracking documents. The rest of this roadmap is proposed, not permission to change other features, publish institutional claims, deploy, or run migrations.

Preserve the current warm-cream homepage (#EFDFC6), photography, existing components and developer changes. The repository already has substantial uncommitted work. The nested `bsah-platform` checkout has separate changes and must not be restored or migrated as part of this task. Installed Next.js documentation is authoritative for implementation APIs.

## Baseline established during Phase 0

- Root branch: `restore/original-bsah-design`; HEAD `293042e`.
- Root status: 84 modified entries, 11 deleted entries, 159 untracked entries/directories. No staged changes. These counts describe entries, not individual files within untracked directories.
- Nested platform: branch `feat/T-P3-pages`, 187 deleted entries and an untracked directory; gitlink exists without `.gitmodules`. Root TypeScript/lint exclude that checkout.
- Existing infrastructure: Next.js 16.4, React 19.3, Tailwind 4, Motion, GSAP, Lenis, Three.js, React Three Fiber/Drei, Zod. Reuse it; no duplicate framework or new application dependency is needed for the approved task.
- Source dossier: the supplied four-page PDF. Requirements are proposals; its reported FPS and institutional appointments are not verified facts.
- Previous reports/tests are historical evidence. Current test runs must be listed separately in BSAH_TEST_RESULTS.md.

## Task A1 — Anatomy mobile stability (approved)

1. **Existing implementation:** `Anatomy3DHorse.tsx` uses the 2.54 MB Draco model, local decoder, DPR 1.5, native pan-y, studio lighting and disposal. `SpecimenPlate.tsx` supplies an interactive archive alternative and near-viewport loading. It is shared by `/anatomy` and the homepage.
2. **Current problem:** renderer initialization can return without leaving the loader; failed/slow models need manual fallback; the animation callback continues offscreen and while paused; per-frame allocations and media-query lookups are unnecessary.
3. **Solution:** automatically switch to the existing archive on setup/model/decoder/context failure or a bounded load deadline; allow an explicit retry; schedule frames only while visible and moving or responding to input. Default reduced motion to archive and permit an explicit still 3D view.
4. **Files:** `components/sections/anatomy/Anatomy3DHorse.tsx`, `components/sections/anatomy/SpecimenPlate.tsx`, `scripts/test-anatomy-browser.mjs`, and the three canonical tracking documents.
5. **Dependencies:** current Three.js/local Draco decoder/React; installed Chrome and a Playwright module for browser verification. No model regeneration, secret, database or new application dependency.
6. **Sequence:** retain current assets/appearance; implement fallback; implement rendering lifecycle; add browser regression coverage; run static checks, production build and production-server checks; record results.
7. **Verification:** renderer/model/decoder/context-loss/timeout failure injection; retry; measure WebGL draw calls during orbit, idle, offscreen and simulated hidden-tab states; reduced-motion behavior; keyboard, mobile pan-y and desktop layout; inspect screenshots; check shared homepage.
8. **Risks:** shared-homepage regression, lost input wake-ups, callbacks after disposal, long downloads incorrectly treated as failure, WebGL differences across real devices. Preserve user selection and native pan-y; retain source assets.
9. **Completion:** no persistent loader after tested failures; archive controls remain usable; successful retry; zero draw calls during measured idle/offscreen/hidden windows; no control-triggered model reload; DPR <=1.5; page scroll passes through viewer; required checks pass with limitations reported.

## Task A2 — Remaining WebGL viewers (proposed)

1. **Existing:** `TorchHorseStage.tsx`, `StatueCanvas.tsx`, cinematic statue scenes and transition effects; DPR caps exist.
2. **Problem:** verification viewer continuously renders and can download the 33.25 MB original as a fallback; reduced-motion, visibility and context-loss handling are inconsistent.
3. **Solution:** apply measured lifecycle/fallback behavior to one viewer at a time; replace the large failure fallback with an approved static/optimized alternative; review statue render passes.
4. **Files:** verification stage/scenes, statue canvas/scroll scene; transition files only when profiling justifies changes.
5. **Dependencies:** A1 evidence, rights-cleared visual alternatives; statue metadata currently specifies CC-BY-NC-4.0.
6. **Sequence:** resolve asset permission/replacement; address `/verify`; verify; consider `/statue` and `/lithos` separately.
7. **Verification:** asset request budget, hidden/offscreen draws, low-power/WebGL failure, touch gestures, reduced motion, physical-device traces.
8. **Risks:** visual degradation, unavailable fallback, unapproved redistribution, shared statue-route regression.
9. **Completion:** no oversized failure download; no idle/background work without a reason; usable fallback and approved assets; measured behavior documented.

## Task B — Hero video (proposed)

1. **Existing:** `Hero.tsx` already provides posters, adaptive video sources, buffer/playback bars, sound/play/retry/skip controls and visibility pause.
2. **Problem:** desktop is 1606x900 rather than requested 1080p; source contains black leader bypassed by a seek; landscape titles crop in portrait. Safari, orientation and slow-network behavior need current verification.
3. **Solution:** confirm approved video master and desktop resolution target; derive optimized media without overwriting sources; refine source switching or initial-frame handling only where tests expose a defect.
4. **Files:** `components/sections/home/Hero.tsx`, derived `public/video` assets, browser tests.
5. **Dependencies:** approved master, FFmpeg, size/quality acceptance. Existing controls must remain.
6. **Sequence:** record baseline; agree media output; encode; verify source selection/fallbacks; compare visuals.
7. **Verification:** metadata/bytes, first visible frame, slow network, autoplay rejection, muted playback, skip/retry, mobile/desktop Safari and Chromium.
8. **Risks:** inferior upscale, sound loss, new black frames on loops, duplicate downloads.
9. **Completion:** approved resolutions and byte budgets, readable composition, immediate poster, reliable controls/fallbacks; no unsupported 60 FPS claim.

## Task C — Scroll/animation performance (proposed)

1. **Existing:** Lenis, Motion, GSAP/ScrollTrigger, IntersectionObserver and transform-based animation. No app-owned raw scroll listener was found in app/components/lib.
2. **Problem:** some layout-property animations remain, including the cadet day-clock `top`; global frame cost is unmeasured.
3. **Solution:** profile before editing; convert proven layout hotspots to transforms; avoid broad permanent will-change layers or another scrolling framework.
4. **Files:** measured hotspot components, starting with `CadetScenes.tsx` only if evidence supports it; preserve shared motion providers.
5. **Dependencies:** representative physical devices and performance traces; A1/A2 lifecycle evidence.
6. **Sequence:** baseline routes; identify bottleneck; change one animation; compare traces and screenshots.
7. **Verification:** long tasks/frame times, scroll responsiveness, reduced motion, pinning/navigation and resize behavior.
8. **Risks:** altered story timing, compositing memory, scroll-position drift, overgeneralizing one browser result.
9. **Completion:** measured improvement without visual/input regression; explicit device/network conditions recorded.

## Task D — Cadet/K-12 responsive value cards (proposed)

1. **Existing:** homepage has a snap carousel for 13 pillars / revenue share / stall cameras; school model and cadet sections use separate grids. Fluid headline tokens already exist.
2. **Problem:** this is not the dossier's exact Zero CapEx / STPCI / 100 cadets-per-hub card set; intended placement and claims need confirmation.
3. **Solution:** identify/approve target cards, then reuse native snap/pagination; retain desktop grid and fluid typography.
4. **Files:** approved section in `Hero.tsx`, `SchoolScenes.tsx` or `CadetScenes.tsx`; associated content module, not all three by default.
5. **Dependencies:** target section and claim approval; no new carousel library.
6. **Sequence:** approve content/placement; adapt one section; check widths and keyboard/touch behavior.
7. **Verification:** 360/390/768/1440px, pagination, focus, wrapping, native scrolling and reduced motion.
8. **Risks:** inadvertently replacing a working carousel or publishing unsupported accreditation/capacity.
9. **Completion:** the approved institutional cards use accessible mobile paging and an intact desktop layout, with no overflow.

## Task E — Somatic SVG (proposed)

1. **Existing:** `SomaticMap.tsx` has selectable pathways, pulses and explanations; existing Matrix/RiderDiagram remain.
2. **Problem:** nodes themselves are not clickable; anatomy is abstract rather than the requested illustrations; no scroll-activation implementation.
3. **Solution:** agree the anatomical presentation, then extend current SVG and controls with accessible node activation and intentional viewport behavior.
4. **Files:** `SomaticMap.tsx`; Matrix/RiderDiagram only if approved composition requires it.
5. **Dependencies:** approved illustrations/copy; avoid unsupported medical-treatment claims.
6. **Sequence:** approve visual mapping; add nodes; connect selection and explanatory panel; verify narrow widths.
7. **Verification:** keyboard/pointer parity, screen-reader labels, non-overlapping copy, reduced motion, color contrast.
8. **Risks:** duplicate controls, small targets, medical overclaims, animation distraction.
9. **Completion:** anatomically approved cadet/equine connections, usable node controls, readable text and motion alternatives.

## Task F — Sovereign Council (proposed; content blocked)

1. **Existing:** responsive square placeholders, proposed-seat labels and native expandable details.
2. **Problem:** no confirmed appointments, approved biographies or portrait rights; current candidates must not be presented as appointed.
3. **Solution:** retain honest proposed labels until documented approval; then populate typed profiles and approved imagery.
4. **Files:** `SovereignCouncil.tsx`, approved profile data/assets, relevant claim copy.
5. **Dependencies:** appointment confirmation, institutional alignment, portrait permission and approved biographies.
6. **Sequence:** obtain evidence; review copy; populate one profile set; verify layout/accessibility.
7. **Verification:** image ratios, mobile alignment, details/keyboard, source-to-profile accuracy.
8. **Risks:** implied endorsement, inaccurate service titles, unlicensed images.
9. **Completion:** only approved profiles/claims published; images not distorted; disclosure remains accessible.

## Task G — Trojan Box (proposed; final assets blocked)

1. **Existing:** CSS box rotates through pointer input and a keyboard slider; clearly labeled concept.
2. **Problem:** approved physical product geometry/material/contents are absent; foam/leather details are mostly descriptive copy.
3. **Solution:** obtain approved turntable frames or a lightweight licensed model; keep the existing concept until replacement is approved.
4. **Files:** `TrojanBox.tsx`, scoped styling and derived product assets.
5. **Dependencies:** product photography/model, dimensions, contents and branding approval.
6. **Sequence:** approve assets; choose lowest-cost viewer; implement within current component; verify gestures.
7. **Verification:** image/model fidelity, bytes, horizontal rotation vs vertical scroll, keyboard equivalent and loading fallback.
8. **Risks:** misleading product presentation, heavy download, scroll trapping.
9. **Completion:** accurate approved product, usable 360-degree controls, intact native vertical pan and documented media budget.

## Task H — Trustee authentication/private resources (proposed; launch blocked)

1. **Existing:** server-side invitation hashes, HMAC signed expiring sessions, HttpOnly/Strict cookies, logout and authorization before proposal rendering.
2. **Problem:** local credentials absent; no distributed rate limiting or individual session revocation store; conceptual plans and MoU enquiry are not private engineering deliverables/direct booking.
3. **Solution:** agree invitation lifecycle and revocation; add approved abuse protection; authorize each private resource/action; provision secrets outside client code; add approved private documents/booking integration only after approval.
4. **Files:** `lib/security/trustee.ts`, `app/schools/access/*`, approved private-resource handlers and provider configuration.
5. **Dependencies:** real invitation provisioning, session secret, approved private content, hosting rate-limit mechanism, booking process; no automatic migration.
6. **Sequence:** security design approval; implementation/test with fixtures; private assets; staging verification; owner-approved production provisioning.
7. **Verification:** wrong/expired/tampered/revoked access, institution isolation, HTTP resource/action authorization, cookie flags, no caching leaks, rate limits and logout semantics.
8. **Risks:** frontend-only gates, public asset URLs, replayable copied sessions, secret leakage, mistaken booking confirmation.
9. **Completion:** reviewed access model, protected resources/actions, configured abuse controls and verified invitation/delivery lifecycle; explicit launch approval.

## Task I — Forms and backend submission (proposed)

1. **Existing:** shared native tel/email inputs, autocomplete, Zod action validation, inline errors, pending/success UI, Supabase RPC with optional webhook. Root SQL and tests exist separately from nested platform schema.
2. **Problem:** MoU client-required fields differ from server schema; phone pattern accepts separator-only strings; no demonstrated distributed abuse control or current end-to-end production delivery.
3. **Solution:** align schema with each form; validate digit count/international formatting; preserve truthful delivery feedback and typed values; define institution authorization for protected submissions; test delivery using fixtures before approved live verification.
4. **Files:** `app/actions.ts`, `LeadForm.tsx`, protected proposal form, focused validation tests; SQL only if separately justified/approved.
5. **Dependencies:** agreed required fields, backend contract, approved test contact, provider configuration. Read Supabase skill/current documentation before Supabase implementation.
6. **Sequence:** contract tests; validation fix; transport failure/success tests; staging submission; approved production test.
7. **Verification:** malformed inputs, missing fields, duplicate/timeout outcomes, mocked RPC/webhook failures, no false success, authorized institution binding.
8. **Risks:** rejected valid international numbers, duplicates after ambiguous network failures, privacy leaks or mixing incompatible schemas.
9. **Completion:** UI/server requirements agree; known abuse controls; approved delivery confirmed without exposing lead data.

## Task J — Production verification and deployment (proposed; separate approval)

1. **Existing:** npm lint/typecheck/build, standalone trustee test, older QA scripts and browser evidence; root and nested application histories are separate.
2. **Problem:** no reproducible current full-site baseline or physical-device FPS measurement; untracked changes and submodule state make release provenance uncertain; rights/content/security blockers remain.
3. **Solution:** reconcile intended release files without deleting developer work; run staged route/device/accessibility/performance checks; resolve approvals; deploy a reviewable build only after explicit authorization.
4. **Files:** canonical tracking docs, focused browser scripts, release configuration only when needed/approved.
5. **Dependencies:** accepted feature checks, approved assets/claims, secrets, verified backend, repository reconciliation and deployment permission.
6. **Sequence:** current build/tests; staging review; physical devices; release checklist; production approval; deploy and smoke test.
7. **Verification:** recorded commit/build, device/browser/network conditions, route/media errors, private-resource checks, real submission with approved data, rollback path.
8. **Risks:** shipping untracked omissions, deploying nested deleted app, treating emulation as device evidence, unapproved production mutation.
9. **Completion:** approved release with reproducible evidence and no unresolved launch blockers; 60 FPS claimed only where measured.

## Dependency order

A1 is the only approved implementation task. A2/C rely on lifecycle/profile evidence; D/E require presentation decisions; F/G depend on institutional/product approvals; H requires access-policy/configuration/private assets; I requires a backend contract and approved delivery test. J depends on accepted work, rights/security/content clearance and explicit deployment approval.


## Approved editorial motion scope — 17 October 2026

Approval: user approved the audited route mapping and motion plan. Only `/legend` (reel 01), `/anatomy` (reel 02), and `/statue` (reel 03) are in scope. “Hook” is an act/homepage-zone label, not a route. Homepage, protected reels and other routes are excluded. The current request authorizes these three routes together.

- Preserve current uncommitted work, palette values, font families, images, written copy, destinations, backend and interactive controls.
- Reuse GSAP 3.15.0, Lenis 1.3.26 and Motion 14.0.0. No dependency installations or upgrades.
- Add opt-in semantic headline splitting, line masks, restrained word/character stagger, image masks and desktop image depth. Server-rendered copy stays visible; reduced motion skips splitting and parallax.
- Use a route-mounted Lenis scroll callback for ScrollTrigger updates. Keep the existing ReactLenis RAF owner, wheel settings and native touch behavior. No global ticker or scroll-policy change.
- Legend: documentary opening; origin portrait/grid; coordinated map headings; trait, honour, fall/revival and final photograph treatments. Preserve chapter rail, native horizontal carousel, and existing ear storytelling.
- Anatomy: legible headline over the existing photograph; character reveal; catalogue entrance; section typography. Preserve specimen/model, hotspots, equipment controls and ear dial.
- Monument: extend the existing six-chapter timeline with word masks and explicit reading holds, retain its camera trajectory, improve text placement using existing approved colors, and provide natural-flow text plus an existing archive image without JS/reduced motion/failed 3D. Replace blocking load overlay with unobtrusive progress.
- Verify lint, typecheck, production build, 1440/768/390/320 layouts, headings/overflow, reduced motion, no-JS copy, model failure, navigation/restoration, and original anatomy interactions. Record observations separately from performance claims. No production deployment.

Implementation files: `components/motion/EditorialMotion.tsx`, its CSS module, the three approved route entry points, their scene files, and Monument's scene/CSS module. Test harness: `scripts/test-editorial-motion.mjs`. Existing shared `Headline`, `Reveal`, `FilmImage`, `SmoothScroll`, root layout, fonts and global stylesheet remain unchanged.


## Reference-inspired typography — 19 October 2026

Completed a scoped reference-inspired type pass on existing HorizontalChapter, ReplayHeadline and ScrambleText exhibits across their 13 routes. Use per-section typeface props, preserving the existing GSAP animations, reduced-motion paths and default brand/body fonts. Four licensed self-hosted display alternatives installed as assets, no npm dependencies. Exact commercial reference faces remain optional pending supplied licensed webfont files. Mapping and validation: docs/typography-font-review.md.


## Interaction soundscape — 19 October 2026

Completed the user-authorized minimal sound layer: seven supplied recording derivatives + two original UI foley accents, globally governed by the existing Sound toggle and applied to meaningful controls across routes. No autoplay loop, hover or typing sounds. Additional third-party assets were unnecessary. Placement/mix/test details: docs/soundscape-review.md and public/audio/README.md.
