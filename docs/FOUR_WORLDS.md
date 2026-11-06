# Four Worlds (`/worlds`)

One horse, four worlds, one continuous camera. A separate route (in the Reels menu as reel 18 "Four Worlds" and in the top bar as "Worlds"), built as an isolated
module: nothing outside `components/worlds/`, `app/worlds/`, `lib/content/worlds.ts`, `public/worlds/` and
`tools/blender/12_worlds/` + `tools/qa-worlds/` was changed, so authentication, enrolment, payments, admin and the other pages
are untouched.

## Architecture

| Part | File | Job |
| --- | --- | --- |
| Page | `app/worlds/page.tsx` | server page: the film, then the credits line (CC BY 4.0 planet textures) |
| Mount | `components/worlds/FourWorlds.tsx` | capability check (WebGL 2, reduced motion), sticky stage in a 1300svh section (1000svh on phones), GSAP ScrollTrigger synced to Lenis (no snapping: the camera path holds on each beat itself), the page's smooth scroll follows the wheel more closely while the film is open, light-mode switch |
| Overlay | `components/worlds/WorldsOverlay.tsx` | Swiss-grid type: a large numeral, a hairline, the world and one short line (bottom left, clear of the nav), a bottom bar with the progress hairline, the four worlds (real buttons), the Smooth and Sound switches, loading line, final call to action. Never re-renders with the scroll: the page pushes progress in through `update()` |
| Sound | `components/worlds/WorldsSound.tsx` | the film's sound switch = the site's sound state in "music" mode; `setMusicSource` (lib/audio/mixer.ts) lends the music bus the film's own track (`public/audio/music/four-worlds.mp3`, 149 s, 2.4 MB, loops) and puts the open-range recording back on leaving |
| Fallback | `components/worlds/WorldsFallback.tsx` | reduced motion, no WebGL 2, or an engine error: four stills rendered from the real scenes + the same copy |
| Engine | `core/engine.ts` | renderer, the camera, world loading (current + neighbours, chunk per world), disposal of worlds two steps away, horse hand-over, critically damped follow of the scroll target, QA hooks (`window.__worlds` in development or with `?debug`) |
| Timeline | `core/timeline.ts` | the master timeline: spans per world, overlapping boundaries with a transition mode, holds, chapter ranges. Everything is a pure function of progress, so scrolling back plays the film backwards |
| Camera | `core/camera.ts` | named checkpoints (`key`, `orbit`), centripetal Catmull-Rom through positions and look targets, holds, `fitFov` for narrow screens |
| Horse | `core/horse.ts` | the one hero horse (`marwari-hero-refined.glb`, plain black coat map swapped in), ambient life on the clock, scroll-driven gait phase, gaze, bone positions |
| Image | `core/post.ts` | half-float scene → bloom → grade + transition (iris, dust, cloud, cheap fade) → ACES + sRGB; NaN guard |
| Quality | `core/quality.ts` | high / medium / low tiers and a frame governor (steps down on long frames, up after sustained headroom) |
| Assets | `core/assets.ts` | Draco GLB, textures, HDR, cached by URL, progress |
| Kit | `core/kit.ts` | `applySky` (equirect background + PMREM light), `Sun` (shadow follows the subject), `Motes` (GPU particles) |
| Worlds | `scenes/origins.ts`, `life.ts`, `legacy.ts`, `beyond.ts` (+ folders) | each owns its scene, camera path and grade |

## Master timeline (global scroll progress)

| Global | World | Shots |
| --- | --- | --- |
| 0.000–0.265 | 01 Origins | extreme wide establishing → push in → orbit the hill → **medium (hold 0.155)** → head → extreme close-up of the left eye |
| 0.235–0.265 | iris | the inner world opens from the pupil, centred on the eye's screen position |
| 0.235–0.500 | 02 Life | through the eye → fly the cell corridor → the clearing → **horse of light in profile (hold 0.37)** → muscles → shoulder → skeleton along the forelegs → pull back, light scatters |
| 0.470–0.500 | dust | the light dissolves into wind-blown grains |
| 0.470–0.745 | 03 Legacy | out of the dust → the fort → through the landscape → past the cavalry → **the black Marwari (hold 0.64)** → orbit to the horizon → rise into cloud |
| 0.715–0.745 | cloud | whiteout through moving cloud |
| 0.715–1.000 | 04 Beyond | above the cloud deck → planet and rings → through the arcs → round the platform → **the horse (hold 0.9)** → final brand composition and call to action (from 0.955) |

QA: `/worlds?p=0.37` opens at that point, `&freeze=1` stops ambient time, `&tier=low|medium|high` forces a tier.
`tools/qa-worlds/capture.mjs` captures frames with draw calls and triangles.

## Assets

See `tools/blender/12_worlds/README.md` and each world's `SOURCES.md`. Download per world (own files, excluding the shared
horse): Origins ≈ 4.2 MB high / 2.4 MB low; Life ≈ 1.6 MB (the existing anatomy model); Legacy ≈ 3.5 / 2.1 MB;
Beyond ≈ 3.3 / 1.5 MB. Only the current world and its neighbours are loaded at once.

## Known limits (honest list)

- Real-GPU frame rate has not been measured: every capture so far ran in headless Chromium on a software renderer
  (SwiftShader), where a frame takes seconds. Draw calls and triangles are measured (see PROGRESS.md); 60 fps is not claimed.
- Placeholders still in the world: Origins trees are camera-facing sprites; Legacy riders and props are low-poly (fine in
  haze, crude in close-up); the Beyond city is a small terrace skyline; Life cells are shader spheres, not sculpted.
- No glowing memory panels and no giant historical face in Legacy, by design (no specific person or event is depicted).
- Safari and real phones not tested; the low tier was checked at 390 px in Chromium only.

## Smoothness and compatibility (6 Nov 2026)

- Auto quality: high / medium / low tiers, plus a resolution scale (0.7 to 1) the frame governor spends before it gives up a tier; a device far over budget drops a tier at once. Multisampling follows the tier (4 / 2 / none). The governor only measures while the film moves; at rest the ambient life runs at 30 fps.
- Light mode ("Smooth" in the bottom bar, remembered in localStorage, or `?tier=low`): the lowest tier, locked, for devices that struggle.
- Textures are uploaded to the GPU one per frame when a world loads (`initTexture`) and shaders compile with `compileAsync`, so entering a world does not stall.
- One animation-frame chain only: a resize inside a frame (tier or scale change) used to start a second chain and halve the frame rate.
- The first frame's poster (`public/worlds/posters/origins.webp`) shows under the canvas until the engine's own frame is up. A sanitize pass before the bloom stops one non-finite pixel from blackening the frame on Apple GPUs.
