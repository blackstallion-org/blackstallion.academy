# Mobile performance pass — notes

Work done in an isolated copy (local branch `perf/mobile-lighthouse`, sandbox commits `44d1fcf..b931489`) and merged into
the repository in commit `a05f398` on branch `session/2026-10-24-final-completion`. Summary and the final before/after
measurement: `docs/PERFORMANCE_REPORT.md`.
No dependency, `package.json`, lockfile, `next.config.mjs` or `node_modules` change. Two new image files (WebP copies);
every original asset is kept. `productionBrowserSourceMaps` was only ever enabled in a scratch copy, never here.

## 1. How it was measured

- **Builds.** Baseline = `44d1fcf`, built in a separate copy (`npm run build`, `next start`, port 3201). After = this
  branch, built and served the same way (port 3200). Same machine, same Chromium (1243, the Playwright build).
- **Lighthouse 12.8.2** (the global CLI, driven through its Node API by a small runner that always kills its own
  Chrome): mobile preset, simulated throttling, performance only, `--headless=new --no-sandbox --disable-gpu`, fresh
  profile per run. **Interleaved A/B**: baseline and after alternate and the order flips every round, so drifting
  machine load hits both sides alike. Medians.
- **Environment caveat — read before the TBT column.** The sandbox has 2 vCPUs shared with other agents' browsers,
  builds and dev servers; the load average stayed between 5 and 30 (mostly 15–25, CPU pressure ≈ 97 %). Lighthouse's
  simulation multiplies the *observed* duration of every main-thread task by 4, so time Chrome spent waiting for a CPU
  becomes TBT. Example: one after-run of `/` logged 12.0 s of main-thread task time after FCP of which only 2.0 s was
  CPU time; the same baseline home page scored TBT 19.0 s, 11.1 s and 6.0 s in three consecutive runs. Bytes, request
  lists and the LCP element are stable; FCP, LCP and Speed Index move moderately; **Lighthouse TBT, and the score
  through it, is not reliable in absolute terms here.** Compare the pairs, not these numbers with the brief's.
- **Contention-robust CPU measure.** Every run of the final rounds also summarised its own trace: thread CPU time
  (`tdur`) of each top-level main-thread task after the observed FCP. **"CPU blocking ×4"** = Σ max(0, 4 × task CPU
  − 50 ms) — the shape of TBT with Lighthouse's 4× multiplier, but blind to time spent waiting for a CPU.
- **Visual and behavioural checks.** Playwright (same Chromium, WebGL through SwiftShader) screenshots of every
  top-level section at 390×844 and 1440×900, baseline vs after, plus 390×844 with `prefers-reduced-motion: reduce`;
  pixel diffs and side-by-side images in `output/perf/` (git-ignored). Details in section 5.

## 2. Before / after

### 2a. Lighthouse (mobile, simulated), medians

Final code vs baseline. `/`, `/parents`, `/legend`: one interleaved batch, n = 3 + 3. Heavy routes: every baseline
run of the session that produced a report (the baseline rarely completes there) vs the final code's runs (two from that
batch, two from a later interleaved pair for `/anatomy` and `/statue`).

| Route | n (base / after) | Perf | FCP s | LCP s | TBT ms ‡ | CLS | Total bytes | JS bytes |
|---|---|---|---|---|---|---|---|---|
| `/` | 3 / 3 | 34 → **37** | 1.7 → 1.8 | 17.5 → **6.5** | 11,128 → 15,184 ‡ | 0.000 → 0.000 | 6.68 → **3.00 MB** | 0.82 → **0.69 MB** |
| `/parents` | 3 / 3 | 41 → **47** | 1.9 → 1.6 | 10.1 → **5.7** | 4,168 → 2,011 | 0.000 → 0.000 | 3.73 → **1.53 MB** | 0.73 → **0.42 MB** |
| `/legend` | 3 / 3 | 40 → **54** | 1.6 → 1.6 | 5.8 → **4.5** | 4,551 → 2,266 | 0.000 → 0.000 | 1.84 → **1.42 MB** | 0.72 → **0.41 MB** |
| `/anatomy` | 2 † / 4 | 42 → **65** | 1.4 → 1.4 | 6.0 → **5.7** | 5,345 → **474** | 0.000 → 0.000 | 13.59 → **1.04 MB** | 0.80 → **0.41 MB** |
| `/statue` | 3 / 4 † | 38 → 38 | 1.5 → 1.6 | 6.8 → 6.7 | ≈161,000 → ≈163,000 § | 0.001 → 0.002 | 2.95 → **2.72 MB** | 0.85 → **0.72 MB** |
| `/fleet` | 0 ¶ / 2 | – → 42 | – → 1.7 | – → 5.9 | – → 3,818 | – → 0.000 | – → 3.71 MB | – → 0.62 MB |

‡ TBT is wall-clock and dominated by CPU contention here (see section 1); use table 2b for main-thread work.
† Lighthouse flagged runs with `PROTOCOL_TIMEOUT` (results partial): both usable baseline `/anatomy` runs, one of
three baseline and three of four after `/statue` runs. Three further baseline `/anatomy` attempts and two baseline
`/statue` attempts ended with "Target closed"; every after run of `/anatomy` completed.
§ `/statue` TBT here is software WebGL (SwiftShader) waiting on a shared CPU, not page script; see table 2b.
¶ Baseline `/fleet` never finished: two attempts timed out at 900 s (and at 170 s in the brief's measurement).
MB = 2^20 bytes, from Lighthouse's byte counts.

### 2b. Main-thread CPU (contention-robust, from each run's own trace), medians

| Route | n (base / after) | CPU blocking ×4 | main-thread CPU after FCP | longest task (CPU) |
|---|---|---|---|---|
| `/` | 3 / 3 | 2,300 → **455 ms** | 2,128 → **1,356 ms** | 411 → **44 ms** |
| `/parents` | 3 / 3 | 462 → **55 ms** | 505 → **456 ms** | 105 → **23 ms** |
| `/legend` | 3 / 3 | 1,490 → **145 ms** | 840 → **521 ms** | 352 → **38 ms** |
| `/anatomy` | – / 2 | (no baseline trace: runs crashed) → 142 ms | – → 548 ms | – → 33 ms |
| `/statue` | 1 / 2 | 973 → 866 ms | 913 → 944 ms | 146 → 96 ms |
| `/fleet` | – / 2 | (baseline never finished) → 936 ms | – → 961 ms | – → 64 ms |

### 2c. What the bytes were (request lists, baseline → after)

- `/`: −3.13 MB of cube-gallery photographs (six files, 1,655 + 1,120 + 166 + 146 + 74 + 46 KB), −165 KB home-route
  chunk with the crumpled-paper component, −303 KB deed JPEG (+85 KB WebP), −188 KB footer poster JPEG (+76 KB WebP),
  −90 KB Matrix images; LCP element: hero `<video>` (render delay 14.9 s) → hero poster `<img>`.
- `/parents`: −1.82 MB story-reel slides 2–5 (749 + 524 + 404 + 146 KB); −0.31 MB JS: the prefetch of `/` (logo link)
  no longer pulls 165 + 100 + 84 KB of home-route chunks including three.js; −112 KB footer poster.
- `/legend`: same −0.31 MB prefetch JS and −112 KB footer poster.
- `/anatomy`: −7,084 KB ear film, −5,177 KB riding-gear model, −64 KB Draco decoder, −0.39 MB JS.
- `/fleet` (request initiators, first 8 s at 412×823; no baseline Lighthouse run finished): no longer at load — the
  covenant model (5,264 KB) and Draco files (77 KB), four bento portraits (821 KB) and story-reel slides 1–4
  (1,140 KB; these now load as the reel approaches, which happens within Lighthouse's window).
- `/statue`: −0.13 MB JS, −0.24 MB total (shared savings: footer poster, prefetched home chunks).

## 3. Changes and their measured effect

Commits in order; "measured" lines name the instrument. Several effects were measured together (one build per
round); where a number belongs to a group of commits it says so.

1. **Hero film paints its poster from the first frame** — `components/sections/home/HeroFilm.tsx` (605ede0).
   The `<video>` sat at opacity 0 until it played and was a fraction of a pixel larger than the `<picture>` poster
   under it, so Chrome logged it as a new, larger LCP candidate the moment it appeared — after hydration and video
   buffering. The video is now visible from the first paint showing its own `poster` (the same still); the jump to the
   title card (2.8 s) moved from `loadedmetadata` to just before the first `play()` (seeking earlier would replace the
   poster with the 2.8 s frame); the video is hidden only between that seek and `playing`, as before. "Buffering
   film…", which takes its own row on phones, appears only after 1 s of stalling.
   *Measured:* Lighthouse LCP element `<video>` (render delay 14.9 s) → poster `<img>` (load delay 1.2 s, load time
   1.2 s, render delay 3.5 s in Lantern's simulation); home LCP 17.5 → 6.5 s. Playwright LCP probe (4× CPU,
   412 px): baseline logged the poster at FCP and then the video at 3.7 / 6.1 / 7.9 s (three runs); after, only the
   poster (1.0–2.0 s). CLS: in the first round, without the 1 s rule, home CLS was 0.018 vs 0.006 (medians), from
   that row moving the Doctrine section; final medians are 0.000 on both sides. A stall longer than a second still
   shows the row: one home run in three on each side (baseline and after alike) logged the same two 0.0122 shifts.

2. **Scroll-linked set-ups run as they approach the viewport** — new `lib/motion/near-viewport.ts`,
   `components/motion/ScrollRevealText.tsx`, `EditorialMotion.tsx` (headline / reveal / image), `SiteParallax.tsx`,
   `components/sections/home/HomeTypography.tsx`, `Matrix.tsx` (5616cdc, 0a3d7eb).
   Every SplitText split, ScrollTrigger and scrubbed tween on a page was created in the hydration effects, each
   measuring layout: one long, layout-thrashing task. Each set-up now registers with one shared IntersectionObserver
   and runs when its element is within one viewport height (`rootMargin: 100% 0px`); until then the element is plain
   and fully visible, exactly as it was before its set-up ran. A paragraph that was set up once rebuilds synchronously
   on re-render (0a3d7eb, so a visible paragraph never flashes). Matrix images got `loading="lazy"`.
   *Measured:* Playwright trace of `/` (4× CPU, first 12 s, sourcemapped; single traces, commits 1–6 together):
   JS-forced style/layout among the top 25 sources — ScrollRevealText 155 → 41 ms, EditorialMotion 130 → 24 ms,
   ImageCubeGallery 96 → 0 (change 3), HomeTypography 69 → 0, CrumpledPaperReveal 58 → 0 (change 5), SiteParallax
   13 → 3 ms; the story reel's own set-up rose (33 → 78 ms) at that stage and was moved out of hydration in 8e89543.
   In the final runs the longest main-thread task fell from 411 → 44 ms CPU (`/`), 352 → 38 (`/legend`), 105 → 23
   (`/parents`); table 2b is the combined effect of all changes. Title-card entrance timing at
   load is unchanged: e.g. `/anatomy` 390 px, split/hide → revealed at 1.37 → 2.78 s and 1.04 → 2.33 s (baseline)
   vs 1.30 → 2.77 s and 0.89 → 2.30 s (after).

3. **Story reels and the cube gallery start near the viewport** — `components/film/CinematicStoryReel.tsx`,
   `components/sections/home/ImageCubeGallery.tsx` (d28d775; reel set-up timing in 8e89543).
   The reel's GSAP loop ran from page load, offscreen, and every slide's photograph downloaded with the page; the cube
   gallery put six photographs on 144 cube faces as CSS backgrounds in the server HTML. Reels now apply their slide
   states one screen ahead, start on slide 1 when visible and pause offscreen; slides 2+ get their `src` one screen
   ahead (`loading="lazy"`). Cube faces get their backgrounds 500 px ahead, with the depth measurement.
   *Measured (request lists):* `/` −3.13 MB (six cube photographs), `/parents` −1.82 MB (slides 2–5), `/fleet` the
   reel's four slides (1,140 KB) are no longer requested at load (8 s window, 412 px; they load as the reel nears).

4. **three.js and the 3D stages load when they are needed** — `components/sections/shared/ViscousLiquidCanvas.tsx`,
   new `components/sections/equipment/RidingGearStage.tsx`, `HorseEquipmentSection.tsx`, new
   `components/sections/fleet/FleetCovenantCanvas.tsx`, `FleetCovenantScene.tsx`, `lib/motion/use-near-viewport.ts`
   (64d95f5, b4f6410).
   ViscousLiquidCanvas imported three.js statically, which made three.js part of the home route's code: loaded by `/`
   at start and prefetched by every other page through the logo link. The riding-gear stage (`/anatomy`, `/safety`,
   `/equipment`) and the covenant scene (`/fleet`) mounted R3F canvases at hydration and preloaded 5 MB Draco models
   when the page's JS ran. Now: three.js is imported when the plate is ~1,600 px away (scene creation still at 250 px,
   as before); the R3F code moved into its own modules, requested three screens ahead (which starts the model
   download and decode), with the canvas mounted one screen ahead in the same-size frame and `frameloop="never"`
   while offscreen. The riding-gear stage caps its pixel ratio at 1.5 on phones (the covenant scene already did).
   *Measured:* JS at load `/parents` 0.73 → 0.42 MB and `/legend` 0.72 → 0.41 MB (request initiators: in the
   baseline the prefetch of `/` pulled 165 + 100 + 84 KB of home-route chunks, three.js included); `/` 0.82 →
   0.69 MB (three.js is no longer in the page's own start-up code; in these runs the same two chunks still arrive
   3–5 s after load through Next's prefetch of linked routes). `/anatomy`: riding-gear model (5,177 KB) and Draco
   decoder (64 KB) gone from the load; `/fleet`: covenant model (5,264 KB) + Draco (77 KB) gone from the load.
   With b4f6410, on `/anatomy` (390 px, steady wheel scrolling) the model request started with the stage 3,211 px
   below the viewport top (one-screen look-ahead: 1,582 px) and had finished before the canvas mounted.

5. **Below-the-fold media no longer downloads with the page** — `components/sections/anatomy/AnatomyScenes.tsx`,
   `components/sections/legend/LegendScenes.tsx`, `components/site/Footer.tsx`,
   `components/sections/home/HomeConvert.tsx`, `components/sections/fleet/StallionBentoGallery.tsx`,
   new `public/video/footer-ambient-poster.webp`, new `public/images/bsah-commission-deed.webp` (1e79c7e, 312ac74).
   Ear film (`/anatomy`, 7 MB) and gallop reel (`/legend`): `preload="none"`, buffering starts one screen ahead; the
   ear film keeps its existing in-view play/pause, the gallop reel now plays in view and pauses offscreen (it
   autoplayed). Footer poster: 1920×1080 WebP q78, 76,614 B, SSIM 0.995 against the JPEG (191 KB). Home seal: deed
   WebP 85,618 B (SSIM 0.993) instead of the 308 KB JPEG, and the vendored `CrumpledPaperReveal` (≈200 kB raw JS) is
   fetched and hydrated only as the plate approaches; React keeps the server-rendered sheet until then, and a
   `<noscript>` fallback keeps the deed and its link without JavaScript. Bento portraits: all lazy (the first four,
   821 KB, were eager although the gallery is far below the title).
   *Measured:* `/anatomy` 13.59 → 1.04 MB (−7,084 KB film, −5,177 KB model, see 4); every route −112 KB (footer
   poster); `/` −218 KB (deed) and −165 KB JS (paper chunk).

6. **Loader opt-out honoured; Lenis no longer re-mounts the site** — `components/motion/Loader.module.css`,
   `components/motion/SmoothScroll.tsx` (b786654).
   The boot script marks `<html data-bsah-loaded>` before first paint when the loader must not show (already seen this
   session, reduced motion, `?noload`), but its hiding rule sat in `@layer components` and lost to the loader's
   unlayered module CSS, so the dark overlay still covered those visits until hydration. `SmoothScroll` wrapped the
   page in `<ReactLenis root>` and swapped it for a fragment after hydration under reduced motion, which unmounted
   and re-created the whole page; the root instance is now mounted beside the page (`useLenis()` reads it from
   Lenis's store, so consumers are unchanged).
   *Measured:* with the attribute set, overlay `display: grid; visible` → `display: none` before first paint (not in
   the Lighthouse table: Lighthouse always measures a first visit). MutationObserver: under reduced motion `<main>`
   was replaced once after hydration on `/` and `/legend` → 0 times. Lenis checked in both builds: a 600 px wheel eases
   to ≈500 px over 0.6 s, `lenis` class present, off under reduced motion, "Skip intro" lands on the hero's bottom.

7. **Reduced-motion hydration error** — `components/ui/animated-menu.tsx`, `components/sections/home/Hero.tsx`
   (198a764). motion's `useReducedMotion` reads the media query during hydration, so under reduced motion the
   letter-roll nav rendered plain text over the server's letter rows (React #418) and React re-rendered the page on
   the client. Both now use the project's hydration-safe `lib/motion/reduced.ts` (first render matches the server).
   *Measured:* React #418 under reduced motion (baseline, checked on `/`, `/parents`, `/legend`, `/statue`) → none on
   any of the six routes.

8. **Statue renders on demand; loader horse ready in time** — `components/sections/statue/StatueCanvas.tsx`,
   `components/motion/Loader.tsx` (8e89543).
   The statue canvas rendered every display frame while nothing moved. `frameloop="demand"` with a small driver: a
   frame whenever the scroll-driven camera/lights change, ten a second at rest (the halo's breath moves its opacity by
   under 0.002 between two such frames). *Measured:* at rest, WebGL draw calls 3.7 → 1.2 per second — but this sandbox
   renders WebGL in software at about one frame a second either way, so the real-device effect (every display frame →
   10 renders/s at rest) cannot be shown here, and `/statue`'s TBT here is dominated by software rendering.
   Loader: when the first-visit loader will show, the boot script preloads `/animations/pixel-horse.js`; with faster
   hydration the overlay could otherwise settle before the engine had loaded and the horse never appeared (seen in a
   filmstrip during this work; with the preload the horse gallops in both filmstrips taken since).

9. **Somatic map pulse pauses offscreen** — `components/sections/home/SomaticMap.tsx` (7d2a8b6). The travelling pulse
   is SMIL, which runs on the main thread every frame from page load; it now pauses offscreen and resumes where it
   stopped. *Not measured separately* (small).

10. **Tried and reverted: per-section `<Suspense>` boundaries** (1c89604, d3fba60 → a6bd34e). Meant to let React
    hydrate below-the-fold sections later, they changed the server HTML: React 19 streams every completed boundary
    over 500 bytes (once the shell exceeds its 12.8 kB progressive chunk) out of order into `<div hidden>` at the end
    of the document and reveals it with an inline script. With JavaScript disabled `/` then showed 1,201 of 8,522
    characters of `<main>` (the other four pages likewise). Against the same code without them (3 interleaved runs
    each) the CPU-blocking difference was within noise (`/` 496 vs 746 ms, ranges overlapping; `/parents` 188 vs 138;
    `/legend` 260 vs 188), because change 2 had already emptied the hydration task and React's root hydration is
    itself time-sliced. Removed; no-JS text is back to the baseline's on all six routes.

## 4. Visible changes (all minimal; listed as required)

1. **Loader lifts sooner on first visits.** Its rule is unchanged (settle once the page has hydrated and the hero
   poster has loaded; same overlay, same pixel horse), but that point now comes sooner. Filmstrip of a first visit
   (412×823, 4× CPU): overlay lifted at 3.9 s instead of 6.5 s (`output/perf/loader/`). Consequences: (a) the hero
   shows its poster still until the film starts, then cuts to the title card — the same thing the baseline showed
   whenever the film started after the loader; (b) the Doctrine headline's reveal, which used to finish under the
   overlay, now plays in view.
2. **Hero film start.** The seek to the title card now happens at the first `play()` instead of on metadata, which
   adds the seek time (≈0.3–0.4 s on this machine) before the first frame of the film; the poster shows meanwhile.
3. **"Buffering film…"** appears only after 1 s of stalling (brief stalls no longer push the page down on phones).
4. **Story reels** (home, parents, fleet) start on slide 1 when they first come into view and pause while offscreen
   (they used to run from page load, so a visitor arrived at whichever slide the clock had reached).
5. **Gallop reel and ear film** start buffering one screen ahead instead of with the page; on a slow connection the
   first frames can arrive later than before when the visitor gets there. The gallop reel no longer plays offscreen.
6. **3D stages, fluid plates and the cube gallery** are created as they approach (riding gear and covenant models
   fetched three screens ahead, three.js for the fluid plates ~1,600 px ahead, cube photographs 500 px ahead); their
   frames keep their size meanwhile. On a slow connection a visitor who scrolls fast can reach one before its model
   or photographs arrive. In the 390 px captures the riding-gear model was rendered when its section was reached
   (`output/perf/after/390/anatomy-03-equipment.png`).
7. **Reduced motion, home story reel:** the baseline capture shows an empty dark frame on "03 / 03"; after, slide 1
   with its title (`output/perf/compare/reduced-390/home-03-legend-reel-h.jpg`, and
   `output/perf/after-final-reduced/390/` from the final build). Not targeted; it coincides with removing the
   reduced-motion re-mount (changes 6 and 7).
8. **Statue at rest** renders ten frames a second instead of every display frame; the halo's breath is the only thing
   moving then, and it changes by < 0.002 opacity per frame.

## 5. Checks run on the final code

- `npm run lint`: 0 errors, 8 warnings — all pre-existing (the 4 in files touched here are the same rule on the same
  code in the baseline: three `<img>` warnings in `Matrix.tsx`, one unused parameter moved with the covenant code).
- `npm run typecheck`: passes. `npm test`: trustee security script passes; 46/46 tests pass. `npm run build`: passes.
- **Screenshots** (`output/perf/`): every top-level section of `/`, `/parents`, `/legend` at 390×844 and 1440×900,
  baseline vs after, plus reduced motion at 390; `/anatomy` and `/fleet` the changed sections (titles, editorial
  reveals, ear film, riding-gear stage, viscous plate, registry, bento gallery, covenant); `/statue` at four scroll
  depths. The `/parents` and `/legend` "after" sets were taken before the Suspense boundaries were removed (they do
  not change what renders with JavaScript); `/` was re-captured from the final build (`after-final/`), as were
  `/anatomy` and `/fleet`. All pairs were pixel-diffed and every pair over a small threshold was inspected: the
  differences are video frames, reel/loop timing, fluid-simulation state, 3D loading state and capture-time scroll
  offsets with Lenis and pinned scenes. Where a difference could have been a regression it was re-checked with a dedicated probe:
  headline reveals (wheel-scrolled probe: complete in both builds), section geometry after a full scroll (every
  top-level section of `/`, `/parents`, `/legend`, `/anatomy` at 390 and of `/` and `/fleet` at 1440: same top and
  height within 3 px; in one earlier `/` 1440 run the Instrument section was 36 px taller on one side at measurement
  time — its height depends on the state of its 3D view, which this sandbox's software WebGL makes erratic — and the
  repeat run matched exactly), the bento expansion (scrubbed captures in `output/perf/bento/`: in the baseline capture
  the mosaic sat below the frame at the start of its pin; after, the mosaic → expansion sequence plays), and motion
  coverage (per section of `/` after a full scroll: same numbers of parallax images and scroll-reveal units set up;
  only the story reel differs, because its later slides have not played yet — change 3).
- **Nav (top 120 px):** the bar is identical on all six routes at both widths, nothing overlaps it
  (`output/perf/nav-top120/`); the only pixel differences come from what shows through the translucent bar (hero
  video frame, title images mid-entrance).
- **Reduced motion:** content renders on every route (screenshots); no pinning or parallax (unchanged code paths),
  Lenis off, no hydration error (all six routes), no re-mount (checked on `/` and `/legend`).
- **No JavaScript:** visible text equals the baseline's on all six routes.
- **Console (final build, all six routes, 390 px, with and without reduced motion):** nothing new. Remaining messages
  are pre-existing: 404s for `/images/matrix/{brain,spine,muscle,heart}-thumb.webp` (also in the baseline), three.js
  deprecation and SwiftShader "GPU stall" warnings, and the CloudFront gallop video blocked by this sandbox's proxy.

## 6. Remaining bottlenecks and options that need a decision

1. **Main thread on `/`** is still ≈1.4 s of CPU after FCP (4× multiplier: ≈455 ms of blocking in short tasks). The
   largest remaining items in the traces: hydration of the shell (the letter-roll nav renders each letter as a motion
   span, in two rows), Next's router, `tailwind-merge` in `cn()`, motion + Lenis + GSAP animation-frame loops, and
   style/layout of a ≈2,000-element page.
   *Option:* reimplement the letter-roll with CSS transitions (same look; implementation change to a signature piece).
2. **Fonts:** six WOFF2 files (≈300 KB) at high priority on every route (Noto Serif Display, Newsreader, Plus Jakarta,
   each upright + italic), a large share of what Lighthouse's simulation loads before the hero poster. *Option:*
   drop italic preloads not used above the fold, or subset — a typography decision.
3. **Full-bleed stills** are 2752×1536 WebP served as-is (`FilmImage` sets `unoptimized` unless
   `NEXT_PUBLIC_LOCAL_MEDIA=1`): 365–640 KB each; `/` loads three (story reel), `/parents` one (638 KB), `/legend` one
   (482 KB), `/fleet` seven (≈2.5 MB). On portrait phones `object-cover` uses the full 1,536 px height at
   DPR ≥ 1.75, so plain downscaling would visibly soften them. *Options:* portrait crops for phones (art
   direction), a lower WebP quality, or Next image optimisation (hosting/cost decision on Vercel).
4. **Text-led title cards** (`/parents`, `/fleet`): the headline is server-rendered at `translateY(105%)` inside a
   mask and revealed by motion after hydration, so LCP waits for hydration + animation (Lighthouse LCP 5.7–5.9 s).
   *Option:* run the same mask reveal in CSS from first paint — changes when the entrance plays (it could play under
   the first-visit loader).
5. **Hero LCP (6.5 s simulated)** is now the poster image, which paints at FCP in practice; Lantern charges it the
   bandwidth of everything requested before it (fonts, CSS, ≈0.4–0.7 MB of JS at its simulated 1.6 Mbit/s). Only
   less early JS/fonts (items 1–2) moves it.
6. **Prefetch:** `/` prefetches linked routes after load (RSC for `/legend` and `/schools`, then ≈255 KB of their JS
   including three.js chunks, 3–5 s after load in these runs).
   *Option:* prefetch heavy routes on hover/intent (slower first click).
7. **Loader:** `pixel-horse.js` is 0.5–0.9 s of scripting in Lighthouse's bootup, and the overlay holds a first visit
   until hydration. *Options:* a sprite/CSS horse (same identity, new implementation), or no overlay when hydration
   is fast.
8. **`/statue`:** the 1.3 MB statue and its WebGL scene are the page; here TBT measures software rendering.
   *Option:* a still until the first scroll (visible change).
9. **Assets:** `public/models/rossbandiger-1/statue.glb` (32 MB) is requested by no route (only named in a comment in
   `TorchHorseStage`, which loads `statue-mobile.glb`, 2.9 MB Draco + WebP, with `rossbandiger.glb` as fallback), so
   compressing it would not change any page; `/statue` uses `horse-statue-monument.glb` (1.3 MB, already Draco +
   WebP). The 5–8 MB PNGs in `public/images/legend`, `public/images/fleet` and `why-cure.png` are not requested by the
   measured routes (pages use the WebP copies; `legend-sand.png` on `/equipment` goes through `next/image`). Deleting
   them only shrinks the deployment — owner's call.
10. **Hero status row (pre-existing):** on phones "Buffering film…" takes its own row under the film, so a stall
    longer than a second still moves the page (two 0.0122 shifts, in one home run in three on both sides). Reserving
    the row's height would remove it but adds a permanent empty line under the controls — a layout decision.
11. **Pre-existing:** the four Matrix thumbnails 404 on `/`, and the home story reel's "Explore chronicle" link
    points to `/history`, which 404s (its prefetch shows in the console; baseline too).

## 7. Risks

- **Look-ahead set-ups.** Reveals, parallax and splits are created one screen ahead. A jump (anchor link, very fast
  fling) can bring a section into view before its set-up: the content is fully visible until then and the entrance
  plays as soon as it is created; a scrubbed paragraph created mid-range dims to its scrubbed opacity in one step.
- **IntersectionObserver dependence.** Set-ups, reels, 3D stages and media buffering are triggered by
  IntersectionObserver (as the hero film already was); the shared helpers fall back to running immediately without
  it.
- **3D stages render only while visible** (`frameloop="never"` offscreen) and mount on approach; a stage reached faster
  than its model downloads shows its empty frame until the model arrives (as the baseline did on slow connections,
  where the model also had to download).
- **Lenis** consumers now get the root instance from Lenis's store instead of React context (checked: parallax and
  scroll reveals update while Lenis scrolls, "Skip intro" scrolls through Lenis, smoothing unchanged).
- **HomeConvert paper** hydrates late: until it nears the viewport the sheet is static server HTML (not interactive
  until then).
- **Measurement noise:** see section 1; TBT and score deltas here are indicative only; bytes, LCP element and the CPU
  measure are the robust signals.
