# The Science of the Stride (`/stride`): build and verification report

Session 28 Oct 2026, branch `feature/marwari-film-world`. Not pushed. QA scripts: `tools/qa-stride/`, captures and numbers: `docs/qa/stride/`.

**The two reference screenshots in the owner's brief were not attached.** The page is designed from the brief's text and the site's design system (Blueprint §3, ivory canvas, chestnut / antique-gold accents, Noto Serif Display and Newsreader, hairlines, no cards).

## What it is

A new, independent page, separate from the home stallion, the India map, the campus configurator and the anatomy exhibit (`public/anatomy/`). Linked from `/science` (a short strip before the comparison ledger) and from the sitemap. Nothing else was wired.

- **Opening:** ivory studio, the academy's black Marwari with the cadet in the saddle, headline "A hundred steps. A minute." (two voices, `Headline`), one paragraph on how horse and rider move together at the walk. One pinned WebGL canvas stays behind the page.
- **Three beats** (scroll steers the camera): four beats / one moving back / a seat that follows.
- **Laboratory:** play and pause, ¼× ½× 1× speed, previous and next frame, a stride timeline (hooves on the ground, 24 authored frames), a graph (horse's back at the saddle against the rider's pelvis, five movements in mm or degrees), views (horse and rider, horse, rider, skeleton), five camera angles plus drag-to-orbit, six hotspots (horse spine, pelvis, shoulder, hindquarters, rider pelvis, hoof and ground) each with a ledger-safe explanation and live numbers, and a table of the animation's own numbers.
- **Honest part** at the end of the page.

Stack: React Three Fiber and drei (`Canvas`, `PerformanceMonitor`), `motion` for the DOM, three r186. GSAP was **not** used: its ticker would be a second clock; the camera is a damped follow inside the one frame loop.

## Phase 1: audit of the Walk (`tools/qa-stride/audit-walk.*`, `docs/qa/stride/audit-walk.json`)

Clip `Walk` in `public/models/anatomy-exhibit.glb` (same rig and clip as the hero model): 0.8 s, 24 frames at 30 per second (25 key times), 34 tracks (one position, 33 rotations).

| Finding | Number |
| --- | --- |
| Cadence of the clip as authored | 75 strides a minute (1.25 Hz), 1.152 m a stride, 1.44 m/s |
| Seat movement in the clip (the seat frame under the saddle, four skinned coat vertices) | up and down 3.0 mm peak to peak, side to side 14.0 mm, forward and back 8.9 mm, tilt forward and back 2.4°, tilt side to side 1.7°, yaw 0.2° |
| Cycles per stride | up and down 2, forward and back 2, tilt forward and back 2, side to side 1, roll 1 |
| Trunk | the `Body.position` track is constant (0, 1.05, 0): **the authored trunk does not rise and fall**; the seat moves only through rotations of Body, Pelvis and the lumbar bone |
| Footfall order | left hind, left fore, right hind, right fore, landing at 0, 25, 50 and 75 % of the stride (even quarters), each hoof down 55 to 58 %, two or three hooves on the ground at every sample |
| Planted hoof, as authored | the sole sits on the floor on average (mean height 0 cm) but sinks 2 to 4 cm at touchdown and breakover, and **a point of the sole drifts 3 to 9 cm across the ground during the planted period** (speeds up to 2 m/s at the ends); toe bone point as in `marwari-gaits.json` |

**Decision.** The Walk supports a credible four-beat lateral walk (order, even spacing, never fewer than two hooves down). It does not plant its hooves cleanly and its trunk is nearly still. I kept the clip's trunk as authored (nothing invented) and corrected the feet (below). `components/stallion-film/footlock.ts` is a stateful, speed- and terrain-driven layer for the film; I ported its CCD into `lib/stride/plant.ts` as a stateless function of the stride phase (scrubbing, stepping and playing give the same pose) and left `footlock.ts` untouched.

## Cadence: "about a hundred"

Blueprint Part 9: the walk moves the rider's pelvis about a hundred times a minute (supported; American Hippotherapy Association, hippotherapy literature). The clip's channels that repeat twice a stride would give **150** a minute at the authored 0.8 s. **Retimed:** one stride lasts 1.2 s (`STUDY_STRIDE_SECONDS`), i.e. 50 strides a minute, **100** seat cycles a minute in the up-and-down, fore-and-aft and tilt channels; side-to-side and roll come round once a stride (50 a minute). Ground speed follows (0.96 m/s, stride length unchanged), so the floor stays consistent with the feet. The page says this in the laboratory ("authored at 75"), in the notes, and in the readout beside the transport ("Seat 100 cycles a minute", scaled by the speed buttons). The headline says "steps"; the supporting text says "about a hundred movements a minute".

## Phases 2 to 8: how each is met

| Brief | What the page does |
| --- | --- |
| 2 Opening | Pinned stage in the opening beat (3/4 view, ivory studio, soft floor lines), headline, lede, scroll cue; the camera glides through three beats into the laboratory while the panel and dock rise in. |
| 3 Horse | The Walk clip drives the horse; **stance hold** keeps each planted hoof where it landed from 5 % after touchdown to lift-off, hoof orientation (heel rise, roll) and swing are the clip's own; rings on the floor mark each landing and stay in the ground's frame, so a sliding hoof would leave its ring. Joint angles over the stride in the Numbers table. |
| 4 Rider | The rider has no animation of its own. The cadet's rig follows four skinned vertices of the coat (the seat frame); the pelvis follows the saddle through a soft-seat model (second order, 5 Hz, damping 0.7: gain 0.996, delay 46 ms at this tempo); the torso keeps 55 / 34 / 20 / 12 % of the tilt (spine, chest, neck, head). Reins are drawn from the rider's hands to the bit each frame. |
| 5 Laboratory | Every control writes the one clock or the store, and the stage reads them: see "Verification". |
| 6 Graph | Two curves per movement from the posed objects (saddle seat frame, rider pelvis bone), units on every axis, label "Illustrative: derived from the animation, not measured." The graph is scrubbable; playhead and dots move with the clock. |
| 7 UI | Ivory, deep-brown ink, chestnut / antique-gold accents, thin rules, no cards, no glass. |
| 8 Hotspots | Placed from the rig: `Anchor_Loin`, `Anchor_Croup` (exported with the model), the right shoulder, the thigh and the hoof bone pushed out to the right-hand coat surface by a vertex search, and the cadet's pelvis bone. Choosing one (list or marker) flies the camera to its stride-mean position, rings it, glows the coat (horse parts) and opens the explanation with live numbers. |
| 9 Performance | One clock and one frame loop for horse, rider, floor, graph playhead, timeline and markers (`StageController.frame`, called from R3F `useFrame`). `frameloop="demand"`: nothing renders while paused or off screen. Lazy mount (the model loads after first paint; in the reduced-motion layout when the stage is near the viewport). Adaptive DPR (`PerformanceMonitor`, 1 to 2 on desktop, 1 to 1.5 on phones). Reduced motion: nothing pinned, still pose, instant camera, no autoplay. No WebGL or a lost context: poster, the footfall diagram, the parts list and the words. The canvas takes no wheel (`touch-action: pan-y`, no zoom control). |

## Verification (own headless Chrome for Testing, Apple M2 Metal GPU, dev server on :3100)

Run: `export PLAYWRIGHT_CORE=<dir with playwright-core>` then `node tools/qa-stride/<script>.mjs`.

- **`interact.mjs` 1440x900: 35 passed, 0 failed.** Playback measured inside the page on the clock's own updates over 4 s: 50.00 / 25.00 / 12.50 strides a minute at 1x, ½x, ¼x. Pause holds the phase. Next and previous frame step exactly one authored frame; arrow keys, End, Page Down (next landing), Space work on the timeline. Scrubbing the graph moves the clock, and the playhead's x equals the clock's phase. **Graph against 3D:** after the page's own render at 24 phases, the live saddle seat and the live rider pelvis bone in the scene equal the graph curves at the same phase to **0.0000 mm** (peak to peak 3.02 and 2.96 mm), in both directions. Horse view hides the rider, Rider view ghosts the horse, Skeleton shows the bones; each camera preset moves the real camera; all six hotspots from the list and a marker click select, show the card and fly the camera; Escape closes; a real wheel over the canvas scrolls the page (3476 to 3729) and the canvas cancels no wheel event the page itself would not (the site's smooth scroll takes them); no console errors.
- **`feet.mjs` (hoof mesh, 240 samples, one material point of each sole followed over the planted period, about 0.44 to 0.48 of a stride):** stance hold on: drift 0.4 to 0.8 cm, speed over the ground at most 13 cm/s (rms 2 to 3 cm/s). Clip as authored: 3.0 to 8.7 cm, up to 2 m/s. Sole height mean 0.2 to 0.3 cm with the hold; sinking at breakover reduced from 2.3 to 3.9 cm to 1.3 to 2.2 cm; hover at lift-off unchanged (up to 2.3 cm). The toe bone point itself stays within 1 to 5 mm of its anchor.
- **`joints.mjs`:** with the hold, elbow, stifle and hock change by at most 0.5, 2.3 and 3.3°, the knee by 4.1° (178.1 to 179.7°, never past straight), and the fetlocks absorb the rest (up to 28° fore, 22° hind; fore 123 to 176.5°, hind 144 to 179.5°). No joint passes 180°.
- **`reduced.mjs`:** no `position: sticky` in the page, the clock is paused at the still pose (phase 0.12), two captures of the stage 1.5 s apart are byte-identical, Play still plays when pressed, camera changes are instant.
- **`a11y.mjs`:** no horizontal overflow at 1440 and 390; none of the page's controls in the top 80 px; every one of 33 (desktop) and 34 (phone) stops in the stage, dock and panel shows a focus ring (Tailwind 4's `outline-none` removes the ring even with `focus-visible:outline-2`: not used here); on a phone a tap on a marker selects its part and a vertical swipe starting on the canvas scrolls the page (3173 to 3476).
- **`perf.mjs`** (Metal GPU, not a phone): 1440x900 at 2x: the loop costs **1.4 ms of CPU a frame** (worst 3.1), a no-vsync benchmark that waits for the GPU (render plus one-pixel read) takes **9.4 ms a frame**, 49 draw calls, 89,198 triangles, 9 programs, 10 textures, JS heap 37 MB; frame pacing median 16.7 ms, p95 17.7, max 24.2 (60 Hz). 390x844 at 3x (DPR capped to 1.5): 3.8 ms, same CPU. **0 frames rendered in 1.5 s while paused, 0 while scrolled away.** Model transfer 1.35 MB plus 43 kB cadet plus 74 kB Draco; ready 1.1 s after navigation on a warm dev server. A full pose (horse, saddle, rider, reins) costs 0.3 ms with the stance hold on (0.13 ms off); the two sampling passes at load are 480 such poses, about 0.15 s on this machine.
- **Unit tests** `tests/stride-analysis.test.mjs`: 8 tests (harmonics, periodic low-pass against its analytic gain and delay, determinism, stance detection, landing order, ticks). `npm test` 132 / 132, `npm run lint` 0 errors, `npm run typecheck` clean.
- **Screenshots** (1440 and 390, top 120 px reviewed): `sheet-f.png` (desktop story), `g-055.png` (laboratory), `sheet-i.png` (cameras, skeleton, hotspots), `sheet-m.png` (phone), `rm-lab.png` (reduced motion), `sheet-rm-nw.png` (reduced motion and no WebGL), `strip-stride.png` (one stride in 12 frames, side view) and `strip-hoof.png` (right fore hoof close up, stance hold off against on).

## Real, approximate, not verified

**Real:** the horse model, rig and Walk clip; the seat, the footfalls, the joint angles and every curve (read from the posed scene); the clock, scrubbing and all controls; the stance hold's effect on the hoof mesh.

**Approximate or modelled:** the Walk is authored (planar IK from published stride data), not captured; its trunk does not bob (3 mm vertical), so the seat's motion is gentle and mostly rotational; the soft-seat coupling (5 Hz, 0.7) and the torso shares are modelling choices; the cadet is a stylised figure; "100 a minute" is the ledger's figure applied to this clip by retiming; the stance hold is a correction on top of the clip (the hoof still lifts a little before it leaves, and sinks 1 to 2 cm at touchdown, where the plane has no solid floor); the tail's strands look dithered on a light floor at 1x (the site's hair shader uses alpha to coverage; it is finer at 2x).

**Not verified:** a phone, Safari, Firefox (Chrome only); `next build` (the dev server holds `.next`, and a clean worktree of this branch, built after the commit, does not compile for reasons outside `/stride`: `app/legend/page.tsx` has an `import` inside `export const metadata`, `components/sections/schools/campus/CampusScene.tsx` imports `../scene-kit`, which does not exist, and `components/3d/ErrorBoundary.tsx` is untracked; the disk then filled up and I stopped); frame rate on integrated or mobile GPUs (the numbers above are an M2); a screen reader (the slider, tabs, buttons and the live regions are labelled, not heard); the headline's "steps" against a registered claim (the ledger's wording is "movements").

## Not used

The ledger's "No" rows (40 % cortisol, 300+ muscles, permanently reverses tech-neck, zero joint impact, 110 impulses) appear nowhere. No new dependency.
