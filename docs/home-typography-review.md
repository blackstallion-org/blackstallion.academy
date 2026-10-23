# Homepage typography and GSAP — implementation record

Completed before the subsequent Matrix Phase 1 request. Homepage only: opt-in heading line/word/character reveals, restrained detail/image entrances, coordinated act typography and responsive editorial scale. Reused current Kalnia/Newsreader fonts, palette, GSAP 3.15.0, Lenis 1.3.26 and the existing animation utilities. No dependency added or updated.

Official GSAP reference cloned to `/Users/stingraj/.codex/reference-repos/gsap`, commit `13e2b790546426a1a2e0e9b409f3f8dc6d6611f2` (package 3.15.0). Repository source was studied, not copied into the application or executed as installation scripts.

Files: app/page.tsx; components/sections/home/HomeTypography.tsx and .module.css; homepage Hero, Instrument, CrisisCure, Doors, LedgerAscent, Studbook, SchoolsTeaser, HomeConvert and HomeClose components. Matrix's earlier motion treatment was subsequently superseded by the user-requested static Phase 1 implementation. Shared EditorialMotion and the core cinematic reel engine were reused without edits for this homepage work.

Validation before the Matrix replacement: production build and TypeScript passed; seven browser scenarios passed (1440/768/390/320 layouts, reduced motion, no JavaScript, other-route isolation). Original Matrix/Doors/rank/hub/horse controls and comparison keyboard, specimen hotspot and verifier input checks passed. No form submission performed. Existing three unused-variable lint warnings remained at that point. Evidence: scratch/audit/home-typography/results.json and control-results.json; screenshots in the same directory. These artifacts predate Matrix Phase 1.

Performance limitation: observed local maximum CLS session values were 0.228 at 1440, 0.558 at 768, 0.008 at 390 and 0.027 at 320. Desktop/tablet layout-shift performance is not marked passed. Sampling includes existing live components and scripted scrolling; no original-site performance baseline or field measurements exist. Physical devices, Safari/Firefox and hardware profiling remain untested. No production deployment.
