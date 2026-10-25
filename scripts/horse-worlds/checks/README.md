# Browser checks for the horse environments

These scripts drive the real page in a real browser and measure the three places (Desert, Horse Field, Village) the way a
visitor meets them. They are not part of `npm test` (they need a running site and Playwright); the unit tests in
`tests/horse-worlds.test.mjs` are. Read `docs/horse-worlds/README.md` for what each result means.

## Before you run them

1. Playwright with Chromium must be importable (`npm i -g playwright && npx playwright install chromium`, or any install
   that `require('playwright')` can find). It is **not** a dependency of this repository.
2. Start the site: `npm run dev -- -p 3100` (the scripts open `http://localhost:3100/anatomy?hwdebug=1`). To check a production
   build instead, run `npm run build && npm start -- -p 3200` and set `HW_BASE=http://localhost:3200` before the script.
3. `?hwdebug=1` makes the viewer publish `window.__horseWorlds` (the controller, a pause switch, a fixed-step `step(dt, n)`,
   `draw()`, the camera, scene and renderer). Without that query the hook does not exist.

The scripts start Chromium with software GL (`--use-angle=swiftshader`), so a machine without a GPU can run them. **Software GL
says nothing about frame rate.** Everything the scripts report is a count, a size, a position or a time inside the
simulation, none of which depends on the graphics card. Run them one at a time on a small machine.

## What each one checks

| Script | What it measures |
| --- | --- |
| `t-sim.cjs` | v = L x f against the speed the scenery is scrolled at, the integral of v, planted-hoof slip, float and sink, hoof strikes per stride, footprints staying put, grass pressed under planted hooves; one pair of ground-only frames per gait for `analyse-layers.py` |
| `t-layers.cjs` + `analyse-layers.py` | one layer at a time: how far its picture moved against where the camera geometry says it must move |
| `dbg-replay.cjs` + `ncc-consec.py` | frame-to-frame ground shift against the recorded camera (smooth world = steady residual); also proves a frame is a pure function of (distance, time, camera) |
| `t-stop.cjs` | when the horse stops the world stops; the scroll speed never climbs while braking; two ground pictures a moment apart are identical after the stop |
| `t-transition.cjs` | the switch: about 1 s, one phase at a time, monotonic fades, the horse settles to a halt, the camera heads for the new standing shot, the newest request wins, a change of mind fades back in |
| `t-frame.cjs` | the horse stays whole and near the middle at every gait, desktop and phone, and clear of the buttons; also writes pictures of the viewer and of the page's top 120 px |
| `t-a11y.cjs` | roles, names, keyboard (arrows, Home, End, Enter, Space), focus rings, one canvas, live-region announcements, and that scrolling or the mouse wheel never changes the place |
| `t-modes.cjs` | reduced motion (the horse stands, places change without a fade, the loop sleeps) and no-WebGL (still pictures, working buttons, announcements) |
| `t-reduced-real.cjs` | reduced motion with the viewer's **own** loop (not test stepping): the picture really changes, the newest request wins, busy is reported while art loads, the loop sleeps again |
| `t-reduced-resize.cjs` | reduced motion: after the viewer is resized the camera is where a page opened at that size puts it |
| `t-network.cjs` | a very slow download (the old place stays faded out, the horse stands, busy is reported) and art that cannot be fetched (clean fall back to stills) |
| `t-longwait.cjs` | a place whose download is held for 40 s of simulated time (parked in the browser, then released): the viewer keeps waiting and shows "Loading the scene"; then the three ways out: the art arrives, the visitor goes back to the place that was on screen (fades straight back in, no remount), or picks the third place |
| `t-perf.cjs` | bytes downloaded per place, draw calls, triangles, textures and an estimate of the video memory they take, desktop and phone |
| `t-hoof.cjs` | close-ups of planted hooves in the middle of their stance, in every place and at several gaits |
| `t-coat.cjs` + `analyse-coat.py` | the horse alone on two flat greys in each place's own light; the opaque body's brightness and warmth compared between the places (the "same black coat" requirement) |
| `t-existing.cjs` | the viewer that was on the site before the places (the compact plate in the home page's "Instrument" section) still draws, has its gaits, orbit toggle and plate marking, and is not in the places mode |

Usage is in the first lines of each file, for example `node scripts/horse-worlds/checks/t-transition.cjs --out transition.json`.
Most take `--w` and `--h` (use `--w 390 --h 844` for a phone). The scripts that decide something (`t-a11y`, `t-transition`,
`t-modes`, `t-network`, `t-longwait`, `t-reduced-*`, `t-existing`) print `PASS` or `FAIL` for each check, end with `N/N checks pass`
and exit with a non-zero code if one fails; the others (`t-sim`, `t-stop`, `t-frame`, `t-perf`, `t-hoof`, `t-layers`, `t-coat`)
measure and write numbers and pictures that the documentation quotes.
