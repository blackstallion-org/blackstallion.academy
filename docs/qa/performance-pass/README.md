# Performance, mobile navigation and media pass

Branch `perf/mobile-scroll-media-speed` (worktree `/Users/stingraj/bsah-live`), cut from the redesigned film world (`deploy/film-world-plus-horse`).
**Nothing here has been pushed or deployed.** Every number below was measured on a local production build (`next build` + `next start`)
with headless Chrome for Testing 1248 and Lighthouse; the baseline is a second worktree built from the same commit without these changes.

Screenshots: [menu-bottom-390.png](menu-bottom-390.png), [hero-after-390.png](hero-after-390.png), [hero-after-1440.png](hero-after-1440.png),
[hero_pair_mobile.jpg](hero_pair_mobile.jpg) and [hero_pair_desktop.jpg](hero_pair_desktop.jpg) (before left, after right; the pair was taken before the final two-row crop trim described under 2).

## Verdict

| Ask | Result |
| --- | --- |
| 1. Sharp video edges | Fixed. The mask, the two gradient shades and the blur are gone; the baked black bars are cropped instead of hidden. On a phone the film is its true 2.5:1 shape, a band, and its edges are now visible (see "Decisions for you"). |
| 2. Mobile menu and scrolling "stuck" | Fixed, three separate causes. Verified in a phone-sized touch browser; **not** on a real iPhone or Android handset. |
| 3. Image loading | Images −41 % and total transfer −32 % over ten sampled pages, at the same visible quality. |
| 4. Rate limiting and API | Audited; already correct. **No change made** (and no security setting or credential touched). |
| 5. Overall smoothness | Lighthouse mobile on the home page: median 38 → 47. **90+ is not reachable without restructuring** (see limitations). Slow-4G LCP is unchanged within noise. |
| 6. Testing | 281/281 tests, lint 0 errors (21 warnings, none in files I touched), typecheck and build clean, all 19 routes scroll on desktop, console clean. |

## 1. Intro video edges

**Root cause.** `HeroFilm.tsx` wrapped the film in a CSS `mask-image` (a vertical fade), laid two "held shade" gradients over it and put
`backdrop-blur-[2px]` on the buttons. The files are 16:9 with a 2.5:1 picture inside baked black bars (rows 131 to 769 of 900), and the mask existed to
dissolve those bars. The result, on a phone, was the soft smeared top and bottom you photographed.

**Fix.** The picture is cropped to its own rows, so the bars are never drawn and nothing needs to be faded. Aspect ratio is untouched
(no stretch, no zoom beyond the existing 1.28-screen framing that keeps the title cards whole).

**A second finding while verifying.** The first and last picture rows are half-dark blends of the bar (row 131 reads 64 against 100 for the picture; row 768 reads 86).
Scaling smeared that into a dark hairline on the top edge (pixel rows 2 and 18 against a picture at about 100). The crop now runs rows 133 to 767 (0.5 % of the picture).
Measured on the final build, the edge rows read `49 50 49 | 82 90 90 …` on a phone and `21 21 21 | 96 95 96 …` on desktop: a clean step with no dark line.

## 2. Mobile navigation

Three causes, all in `components/site/SiteNav.tsx`:

1. **The open menu could not scroll.** Opening it calls `lenis.stop()`, and while stopped Lenis `preventDefault`s every wheel and touch event *except inside `[data-lenis-prevent]`*.
   The panel was not marked, so its own list could not scroll: the screenshot cut off at "09 The Guardian". Now marked, plus `overscroll-contain`.
2. **The lock lived as long as the menu's 0.8 s exit animation**, and was set and cleaned up inside the animated child. It is now one effect keyed on `open` that
   locks on open and releases at the *start* of closing. The menu belongs to the route it was opened on (`openAt === pathname`), so picking a page closes it,
   and a `pageshow` guard unlocks a page restored from the back-forward cache.
3. **The dying menu still caught touches.** During the wipe-away the full-screen panel stayed a scroll container, so the first swipe after picking a page hit the menu.
   Found by measurement, not by reading the code: after the first two fixes a swipe 350 ms after the tap still moved the page 0 px. The exiting panel now has
   `pointer-events: none` (`useIsPresent`).

Baseline = the same commit built without this pass, measured with the same scripts on the same machine.

| Check (390×844, touch, Chrome for Testing) | Baseline | After |
| --- | --- | --- |
| Menu open, swipe the list | list does not move (`panelTop` stays 0 of 496): cut off at 09 | scrolls to "16 The Gate" and the footer links (`panelTop` 496 = max) |
| Menu open, mouse wheel on the list | 0 | 496 (the page behind stays at 0) |
| Close with the button, wait 1.5 s, swipe the page | 602 px | 594–603 px (no regression) |
| Tap a link, swipe 350 ms later | lock still on (`overflow: hidden`, Lenis stopped); page moved 0 px on 3 of 4 pages | lock clear; page moved 591–607 px on 4 of 4 |
| First swipe after the route changes, old menu still wiping away | lock still on; 0 px (first working swipe about 1 s later) | lock clear; 244–258 px |
| Browser back, then swipe | 706 px | 706 px, lock clear |
| Desktop 1440×900: wheel on the open menu, Esc, wheel 300 ms later | not run | page stays locked while open; 578 px 300 ms after Esc |

Menu opened on `/` and `/legend`; link taps on `/science`, `/curriculum`, `/cadets`, `/safety`. Desktop wheel scrolling was also run on all 19 routes
(`/`, `/legend`, `/anatomy`, `/statue`, `/science`, `/why`, `/curriculum`, `/fleet`, `/cadets`, `/parents`, `/safety`, `/schools`, `/verify`, `/tournaments`, `/command`, `/journal`,
`/contact`, `/about`, `/gallery`): all scroll, no page errors, no 4xx/5xx responses. Two pages (`/anatomy`, `/gallery`) are short or pin their scene, so the second wheel step moves less; both respond.

## 3. Images and video

| | Before | After |
| --- | --- | --- |
| Shipped stills (65, WebP/PNG) | 31 048 KB | unchanged files, kept as the fallback |
| Full-size AVIF twins (already shipped) | 14 612 KB | unchanged |
| New responsive AVIF sizes | none | 640 w 1 369 KB · 1 080 w 3 126 KB · 1 440 w 5 501 KB (all 65 stills, 9 996 KB on disk, q65, 4:2:0) |
| `marwari_horse_ear_biomechanics_loop.mp4` | 7 082 KB | `marwari-ear-loop-web.mp4` 546 KB |
| `portal-loop.mp4` | 5 235 KB | `portal-loop-web.mp4` 948 KB |
| `footer-ambient-h264.mp4` | 1 732 KB | `footer-ambient-web.mp4` 640 KB |

How it is served: `FilmImage` and the new `Still` emit `<picture><source type="image/avif" srcset="…-640 640w, …-1080 1080w, …-1440 1440w, full twin" sizes=…>` over the
WebP, so the browser picks the smallest file that covers the box at its pixel density (a 390 px phone at 3× still gets the 1440; at 2× it gets the 1080). Browsers without
AVIF skip the `<source>` and use the WebP as before. The story reel (`CinematicStoryReel`) uses `Still` for its slides, keeping its lazy "armed" behaviour. The WebGL transition's textures use
`sizedAvif` behind a one-pixel AVIF decode probe (`lib/content/avif-support.ts`); **that component is not mounted anywhere on the site today**, so it is covered by tests only.
Videos: web encodes come first in each `<source>` list with the masters as fallback (PSNR checked); `WhyScenes` videos got `preload="metadata"`.
Dimensions were already defined everywhere; CLS is 0.000–0.006 on every page measured.

Measured with a real browser on ten pages at 390 px (`/`, `/legend`, `/anatomy`, `/science`, `/curriculum`, `/fleet`, `/cadets`, `/schools`, `/journal`, `/gallery`), scrolled through:

| | Before | After | Change |
| --- | --- | --- | --- |
| Total transfer, ten pages | 67 053 KB | 45 831 KB | **−31.6 %** |
| Images only | 28 010 KB | 16 520 KB | **−41.0 %** |
| First screen only | 34 878 KB | 32 866 KB | −5.8 % |

Biggest single pages: `/anatomy` 14 737 → 7 086 KB, `/gallery` 3 442 → 2 350 KB, `/fleet` 5 789 → 3 530 KB, `/journal` 13 171 → 10 577 KB, `/home` 4 096 → 2 513 KB.
Quality: same 8-bit pixels at the displayed size, AVIF q65 against the shipped q55 twins at full size; I compared stills side by side at 390 and 1440 and the story reel renders at 1440 px on desktop
and at 3× on a phone without artefacts. A numeric SSIM across all 65 sizes was not run.

**Duplicate requests, investigated and not a problem.** A log showed `pixel-horse.js`, the hero GLB and the Draco decoder fetched two or three times. Measured per request,
only the first carries bytes (hero GLB 624 KB, Draco wasm 65 KB, anatomy GLB 1 387 KB); the repeats transfer 0 bytes (HTTP cache) and `pixel-horse.js` is a preload followed by its script tag. Nothing to fix.

**Supabase Storage delivery.** The media switch is OFF in production (`18c9c02`), so images are served by Vercel from `public/`, with immutable caching for hashed assets. I did not change the switch or any bucket policy.

## 4. Rate limiting and API efficiency

Read, not changed. `lib/security/rate-limit.ts`: per-kind fixed windows (lead 5 per 10 min, trustee 8 per 15 min, verify 30 per 10 min, login 8 per 15 min, MOU document 12 per 10 min, signup 5 per hour),
keyed by a salted hash of the client address, so one visitor cannot fill another's bucket. It is applied only in server actions and the credential lookup (`app/actions.ts`, `app/admin/actions.ts`,
`app/account/actions.ts`, `app/schools/access/actions.ts`, `app/schools/mou/actions.ts`, `lib/verify/lookup.ts`). **Pages, images, video, GLB models and `_next` assets are never rate limited**, so a visitor
browsing the site cannot be blocked by it. Supabase failure falls back to the in-process limiter. `/api/health?deep=1` reuses its database probe for 15 s per instance, so it cannot become database load.
Only code change on this front: `/admin/login` is no longer prefetched from the staff-login icon in the top nav (`prefetch={false}`), so visitors no longer fetch the staff page in the background on every page view.
Nothing was run that would exercise the limiter against the real database. `git diff` of `app/api` and `lib/security` is empty.

## 5. Smoothness and Core Web Vitals

Lighthouse, home page, mobile preset, three runs each (the site is JS and hydration bound):

| | Baseline (runs) | After (runs) | Median |
| --- | --- | --- | --- |
| Performance | 35 · 38 · 52 | 45 · 47 · 51 | **38 → 47** |
| LCP (ms) | 11 012 · 6 488 · 5 990 | 6 480 · 5 992 · 6 211 | 6 488 → 6 211 |
| TBT (ms) | 10 770 · 4 132 · 1 086 | 1 741 · 1 836 · 1 260 | 4 132 → 1 741 |
| CLS | 0.006 · 0.003 · 0 | 0 · 0 · 0 | |
| Bytes (KB) | 2 093 | 1 866 | −11 % |

Treat the score gain as real but modest: most of it is lower, steadier blocking time; LCP is about the same (the hero poster and the JavaScript decide it).
Slow-4G (Chrome throttling) first-screen LCP: `/` 2 340 → 2 328 ms, `/curriculum` 2 672 → 2 088 ms, `/fleet` 2 068 → 2 680 ms: unchanged within run-to-run noise of about ±600 ms.
**Mobile Lighthouse 90+ is not realistic here** without restructuring: the first screen needs about 0.9 MB of JavaScript to hydrate three motion systems (Lenis, motion, the 3D stage), and the hero must play a film.

## Remaining limitations and what I did not test

* **Real devices.** No iPhone or Android handset, and no Safari or Firefox, was available. Phone behaviour was verified with Chrome's touch emulation and synthesized touch gestures. iOS rubber-banding and
  address-bar behaviour should be checked on a handset before release. Safari 16.4+ decodes the AVIF; older Safari uses the WebP by construction (covered by the tests, not by a browser).
* `/curriculum` still loads a 5.3 MB GLB on the first screen; `/gallery` and `/journal` load Journal CDN images that I do not host. Lazy-loading the curriculum model, or a lighter export, is the next real win and changes what the page shows, so I left it.
* `/images/**` stills referenced directly (not through `FilmImage`) are still single WebPs.
* Hydration cost (TBT) is the remaining Lighthouse gap; it needs code-splitting work across the 3D and motion layers.
* Slow-4G LCP did not improve; the numbers above are honest about that.

## Decisions for you

1. **Phone hero.** With the fade gone, the 2.5:1 film shows as a sharp band across the middle of the phone screen with the dim dust still above and below it, and the seam between them is visible.
   That is what "keep the edges sharp, keep the aspect ratio" produces on a portrait screen. Alternatives if you dislike the seam: (a) a flat dark surround instead of the dust still, (b) fill the portrait screen with a cover crop of the film,
   which cuts the title cards at the sides. Say which and it is a small change.
2. **Push and deploy.** Not done. This branch is local only.

## Files

Changed: `components/site/SiteNav.tsx`, `components/sections/home/HeroFilm.tsx`, `components/film/{FilmImage,CinematicStoryReel,WebGLNoiseTransition}.tsx`, `components/sections/{anatomy/AnatomyScenes,why/WhyScenes,journal/FieldSphereHero}.tsx`,
`components/site/Footer.tsx`, `lib/content/media.ts`, `scripts/media-manifest.json`, `tests/still-avif.test.mjs`.
New: `components/film/Still.tsx`, `lib/content/{avif-support.ts,still-sizes.json}`, `scripts/make-still-sizes.mjs` (regenerates the sizes), `public/media/*-{640,1080,1440}.avif` (195 files),
`public/video/{marwari-ear-loop,portal-loop,footer-ambient}-web.mp4`, `tests/mobile-scroll-and-film.test.mjs` (6 tests).
