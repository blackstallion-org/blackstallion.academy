# BSAH editorial motion review

Completed 17–18 October 2026. Scope: **Legend, Instrument, 3D Monument**. No production deployment.

## Review locally

The local production preview is running on port 3100:

- [Legend](http://localhost:3100/legend)
- [The Instrument](http://localhost:3100/anatomy)
- [3D Monument](http://localhost:3100/statue)

Scroll through the three pages to review pacing, image reveals, reading holds and chapter transitions. Reduced-motion users receive a quiet/static presentation. No additional pages have been opted into the direction.

## Before and after

| Page | Existing presentation | Implemented change |
|---|---|---|
| Legend | Shared two-line Motion entrances, existing chapter scenes, map, carousel and photo backgrounds | GSAP line/word masks, distinct chapter pacing, an editorial origin grid, image reveals and restrained desktop depth; opening copy positioned above the horizon; chapter controls and carousel retained |
| Instrument | Dark headline over a dark horse photograph, catalogue card and working interactive demonstrations | Existing approved white makes the headline legible; selective character entrance and catalogue reveal; responsive image focus keeps the head visible on narrow phones; specimen/model/hotspots and equipment remain intact |
| Monument | Existing six-chapter GSAP/3D camera journey, whole-card fades, blocking loader and overlapping copy | Word-mask choreography inside the existing master timeline, explicit reading holds, separated desktop text and sculpture, mobile copy below the visual, nonblocking progress, readable static/error/archive paths and stable initial geometry |

All original narrative copy, brand palette values, font families, source images/models, navigation destinations, forms and backend logic were preserved. No dependencies were installed. The shared Monument engine defaults to its previous presentation for `/lithos`; only `/statue` enables the new direction. The existing global smooth-scroll provider retains its settings and animation-loop ownership.

## Verification

Lint, TypeScript and production build passed. Lint retains four existing warnings outside scope. The browser harness passed 12 responsive layout cases and 10 accessibility/failure/navigation cases; the latter were rerun with stronger no-JS coverage. The existing Anatomy harness passed all 10 scenarios, including native vertical swipe and model lifecycle checks. Final phone image framing has a focused screenshot/overflow rerun.

Latest full-suite maximum observed CLS was approximately 0.001606 for Legend, 0.001529 for Anatomy and 0.001702 for Monument. These are local observations, not field benchmarks. The implementation's initial Monument layout-shift issue and no-JS loader obstruction were found and corrected during testing.

See [full test results](/Users/stingraj/blackstallion-website/BSAH_TEST_RESULTS.md), [motion suite evidence](/Users/stingraj/blackstallion-website/scratch/audit/editorial-motion/results.json), [final accessibility evidence](/Users/stingraj/blackstallion-website/scratch/audit/editorial-motion/final-accessibility/results.json) and [Anatomy regression evidence](/Users/stingraj/blackstallion-website/scratch/audit/editorial-anatomy-regression/results.json).

## Screenshots

Legend on desktop:

![Legend desktop](/Users/stingraj/blackstallion-website/scratch/audit/editorial-motion/legend-1440.png)

Instrument on desktop:

![Instrument desktop](/Users/stingraj/blackstallion-website/scratch/audit/editorial-motion/anatomy-1440.png)

Monument on desktop:

![Monument desktop](/Users/stingraj/blackstallion-website/scratch/audit/editorial-motion/statue-1440.png)

[Final Instrument phone framing](/Users/stingraj/blackstallion-website/scratch/audit/editorial-motion/final-framing/anatomy-390.png) · [Legend without JavaScript](/Users/stingraj/blackstallion-website/scratch/audit/editorial-motion/final-accessibility/legend-no-js.png) · [Monument without JavaScript](/Users/stingraj/blackstallion-website/scratch/audit/editorial-motion/final-accessibility/statue-no-js.png)

## Files changed by this task

The repository already contained extensive uncommitted work. This list covers this task's edits, independently of those earlier changes. The [task-only source patch](/Users/stingraj/blackstallion-website/scratch/audit/editorial-motion/source-changes.patch) compares against pre-edit working files, rather than replacing earlier work with Git HEAD.

| File | Change |
|---|---|
| [app/legend/page.tsx](/Users/stingraj/blackstallion-website/app/legend/page.tsx) | Opt-in headlines, origin grid, image wrappers and scroll synchronization. |
| [app/anatomy/page.tsx](/Users/stingraj/blackstallion-website/app/anatomy/page.tsx) | Opt-in section headlines/reveals and scroll synchronization. |
| [app/statue/page.tsx](/Users/stingraj/blackstallion-website/app/statue/page.tsx) | Enable the editorial presentation only on this route. |
| [components/sections/legend/LegendScenes.tsx](/Users/stingraj/blackstallion-website/components/sections/legend/LegendScenes.tsx) | Opening composition, image masks/depth, vow pacing, readable reduced-motion map/timeline. |
| [components/sections/anatomy/AnatomyScenes.tsx](/Users/stingraj/blackstallion-website/components/sections/anatomy/AnatomyScenes.tsx) | Legible opening title, character entrance, mobile image focus, catalogue reveal and reduced-motion controls. |
| [components/sections/statue/CinematicStatueScroll.tsx](/Users/stingraj/blackstallion-website/components/sections/statue/CinematicStatueScroll.tsx) | Extend the existing timeline, preserve the legacy alias, add reading holds and accessible failure/static paths. |
| [components/sections/statue/StatueEditorial.module.css](/Users/stingraj/blackstallion-website/components/sections/statue/StatueEditorial.module.css) | Scoped responsive text/3D composition and stable first-chapter geometry. |
| [components/motion/EditorialMotion.tsx](/Users/stingraj/blackstallion-website/components/motion/EditorialMotion.tsx) | Opt-in GSAP/SplitText headlines, image/reveal tools, Lenis subscription and route-only no-JS fallback. |
| [components/motion/EditorialMotion.module.css](/Users/stingraj/blackstallion-website/components/motion/EditorialMotion.module.css) | Scoped split-mask typography support. |
| [scripts/test-editorial-motion.mjs](/Users/stingraj/blackstallion-website/scripts/test-editorial-motion.mjs) | Repeatable browser checks and evidence capture. |
| [BSAH_IMPLEMENTATION_PLAN.md](/Users/stingraj/blackstallion-website/BSAH_IMPLEMENTATION_PLAN.md) | Approved route scope and implementation plan. |
| [BSAH_PROGRESS.md](/Users/stingraj/blackstallion-website/BSAH_PROGRESS.md) | Completed work and preserved boundaries. |
| [BSAH_TEST_RESULTS.md](/Users/stingraj/blackstallion-website/BSAH_TEST_RESULTS.md) | Commands, confirmed results, earlier failures and limitations. |
| [docs/editorial-motion-review.md](/Users/stingraj/blackstallion-website/docs/editorial-motion-review.md) | This review and preview links. |

## Limits and remaining review

- Chromium emulation was used. Physical iOS/Android and Safari/Firefox remain untested.
- There was no Lighthouse run, screen-reader session, hardware FPS benchmark or controlled original-site performance baseline. The loading-deadline tests accelerate the timeout.
- Existing asset resolution is retained. No replacement photography or 3D model was introduced.
- Unrelated concurrent Schools-page edits were observed and left untouched.
- Review the motion pacing and cropping on your own devices. No additional website pages will be implemented until you approve this direction.
