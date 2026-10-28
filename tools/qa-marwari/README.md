# Marwari visual QA harness

Reproducible captures and measurements for the 3D Marwari (hero stage, film worlds, anatomy plate). Written for the Layer 0
audit of 26 Oct 2026 (`docs/MARWARI_CINEMATIC_AUDIT.md`); every script takes its inputs on the command line, so the same
cameras and the same assets can be replayed after a change and compared.

## What it does

- Own headless Chrome for Testing through `playwright-core` (not the shared Playwright MCP profile). `harness.mjs` launches it
  with the Mac's Metal GPU (`gpu`) or SwiftShader software GL (`swift`, screenshots only). Always check the WebGL renderer string
  it prints: a number measured on SwiftShader is not an FPS figure.
- `pinAssets()` serves **pinned copies** of `marwari-hero.glb`, `marwari-hero-mobile.glb`, `marwari-anatomy.glb` and
  `marwari-gaits.json` through `page.route`, so another session re-exporting `public/models` cannot change a run half way.
  Pin a commit with `git show <commit>:public/models/<file> > <dir>/<file>`.
- `stage.mjs` drives the film engine through `window.__stallionFilm` (present on the dev server and with `?filmdebug=1`):
  opens the stage, enters a place, freezes the director and places a QA camera in the horse's own frame
  (`camRel` = forward / left / up metres; `camBone` = anchored to a bone, so close-ups follow the head). `shots.mjs` holds the camera
  presets used for the baseline, so before and after images match.

## Scripts

| Script | Output |
| --- | --- |
| `base_desktop.mjs <out> <assets> [dpr]` | hero views (noon), desert / village / academy views at 1440x900 |
| `base_2x.mjs <out> <assets>` | close-ups at devicePixelRatio 2 (eye, muzzle, ears, mane, shoulder, barrel, hindquarter, hoof, tail) |
| `base_misc.mjs <out> <assets> [mobile,plate,fallback]` | 390x844 set, anatomy plate hotspots (desktop and mobile), reduced-motion and no-WebGL fallbacks |
| `base_tod.mjs <out> <assets>` | hero stage at eight local hours (the studio light follows the clock) |
| `perf.mjs <desktop1\|desktop2\|mobile\|mobile4x> <assets> <out.json> [baseUrl]` | fps, frame-time percentiles, GPU timer queries, synchronous render cost, draw calls, triangles, heap |
| `loadtime.mjs <baseUrl> <out.json>` | model bytes and time to a ready horse, cold and warm, unthrottled and Slow 4G |
| `anim_qa.mjs <out> <assets>` | `qaRun` gait metrics with the foot-lock on and off, plus one-stride frame strips per gait |
| `lifecycle_switching.mjs <out> <assets> [baseUrl]` | same horse across environment switches, program / texture counts, GPU memory estimate |
| `lifecycle_focus_roundtrips.mjs <out> <assets> [baseUrl]` | keyboard focus order in the stage, ten route round trips (heap, listeners, WebGL contexts) |
| `checks.sh <logdir>` | `npm run typecheck`, `lint`, `test` with exit codes and timings |
| `montage.py out.jpg cols cellwidth label=path ...` | labelled contact sheets |

## Running

```sh
export PLAYWRIGHT_CORE=/path/to/node_modules/   # a directory that contains playwright-core
export QA_SCRATCH=/tmp/marwari-qa
node tools/qa-marwari/base_desktop.mjs docs/qa/marwari-cinematic/after/desktop /path/to/pinned/assets 1
```

Use the production server for numbers you intend to quote (`npm run build && npx next start -p 3101`); the dev server recompiles
and remounts the stage whenever any file changes, which also happens when another session edits the tree.

## Caveats

- Headless Chrome paces `requestAnimationFrame` at 60 Hz; `--disable-frame-rate-limit` did not lift it here. The `syncRenderMs`
  figure (render plus a one-pixel readback, no vsync) is the usable headroom indicator, and it is only comparable between
  runs made under similar system load. Record `os.loadavg()` with every number (the scripts do).
- GPU timer queries on Apple GPUs include time the GPU spends on other processes' work; they were 20 times too high on a loaded Mac.
- The measurements say nothing about a phone's GPU: the mobile profile is the phone code path measured on the Mac.
