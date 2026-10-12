# Cinematic redesign · implementation plan (as executed)

1. **Audit** → `audit.md`. Real routes mapped; no new routes, no new dependencies.
2. **Art direction** → `page-specifications.md`. Owner decisions: openings are dark scenes, content stays ivory; generate ~8 stills (4 were enough).
3. **Assets** → `asset-manifest.md`. Four Higgsfield stills + one cut-out; hero film cropped and re-encoded on the Mac.
4. **Shared foundation**
   - `lib/motion/cinematic.ts`: loader-aware start delay, signature/copy/crossfade/dwell timings.
   - `components/cinematic/`: `SplitReveal`, `PortalReveal`, `LayeredMarquee`, `ParallaxStack`, `PixelDissolve`, `ScrollIndicator`. Each takes content through props, cleans up its timers/rAF, and has a reduced-motion path.
   - `components/site/SiteNav.tsx`: the bar samples the element beneath it and takes `.tone-dark` when over a dark scene.
   - `components/film/PinnedScene.tsx`: ref attached under reduced motion (fixes a pre-existing runtime error).
5. **Pages**: Home → Curriculum → Hubs → Individual hub → Verify, each screenshotted at 1440 and 390 before moving on.
6. **Integration**: existing sections below each opening unchanged except where the opening absorbed them (home h1, hub facts grid, verify form section).
7. **QA** → `testing-checklist.md`.

Not done, by decision: GSAP/ScrollTrigger and Three.js (not installed, not needed); new fonts (forbidden by CLAUDE.md); generated video (the existing film was the stronger asset).
