# Evidence for the horse environments

Taken on 25 Oct 2026 with the code that is committed on `feature/horse-environments`, by the scripts in
`scripts/horse-worlds/checks/`, in a cloud Chromium that draws with software WebGL (SwiftShader) against `npm run dev` on port 3100.
**Software drawing says nothing about frame rate**; everything here is a picture, a count, a size, a position or a time inside the
simulation. The pictures are JPEG copies of the PNGs the checks take.

The red "1 Issue" badge in the lower left of some pictures is Next's development-mode overlay. It reports one React hydration
warning that comes from the existing still archive plate on `/anatomy` and appears identically on a clean copy of `main`
(`docs/horse-worlds/README.md`, section 11). It does not exist in a production build.

| Folder | What it shows | Made by |
| --- | --- | --- |
| `places-1440/` | Each place at each gait it offers, on a 1440 x 900 screen (the viewer is 1323 x 743): Desert stand, walk, canter, gallop; Horse Field stand, walk, trot, canter; Village stand, walk | `t-frame.cjs` |
| `places-390/` | The same on a 390 x 844 phone | `t-frame.cjs --w 390 --h 844` |
| `page-top-1440/`, `page-top-390/` | `page-top.jpg`: the top of `/anatomy` with the fixed navigation. `section-top.jpg`: the new section scrolled to the top of the screen (the navigation slides away while scrolling down). The top 120 px is clear in both | `t-frame.cjs` |
| `hooves/` | Close-ups of planted hooves in the middle of their stance, from the side and from the front: Desert walk and canter, Horse Field walk and trot, Village walk; one front and one hind hoof each. Every hoof is on the ground, none is in it | `t-hoof.cjs` |
| `coat/` | The horse alone on a flat grey in each place's own light (the comparison behind the "same black coat" figures in section 6 of the README) | `t-coat.cjs`, `analyse-coat.py` |
| `network/` | `slow-during-load.jpg`: a very slow download (40 KB/s, 400 ms): the old place is faded out, nothing half-drawn. `slow-after.jpg`: the new place when the art has arrived. `failed-fallback.jpg`: art that cannot be fetched: the viewer says so and shows a still | `t-network.cjs` |
| `longwait/` | A place whose download is held for 40 s: `wait-during.jpg` (still waiting, "Loading the scene"), `wait-after.jpg` (art arrived), `back-after.jpg` (visitor went back to the place on screen), `other-after.jpg` (visitor picked the third place) | `t-longwait.cjs` |
| `modes/` | Reduced motion (the place changes without a fade, the horse stands) and no WebGL (a still of the place with a description), at 1440 and at 390 | `t-modes.cjs` |
| `home-plate/` | The home page's compact specimen plate after this work: the viewer that existed before, in its own mode | `t-existing.cjs` |
| `numbers/` | The JSON the checks wrote: framing, simulation (`sim-sim.json`, `sim-meta.json`), stopping, transitions and their verdict, layers, performance counts, accessibility, modes, network, long wait, hooves, coat | all |
| `logs/` | What each check printed (`PASS` and `FAIL` lines, numbers) | all |
| `logs/production/`, `numbers/production/` | The same checks repeated against a production build (`npm run build`, `npm start -- -p 3200`, `HW_BASE=http://localhost:3200`): what each printed, the coat figures and the switch verdict | the scripts named below |

`logs/modes-m-first-run-with-the-old-comparison.log` is kept on purpose. In that first phone-size run of `t-modes.cjs`, one
comparison check ("with motion allowed the loop draws steadily") counted 1 frame in a 2.5 s window while the software renderer
stalled, so that run reported 16 of 17. The comparison now counts frames over 6 s; `logs/modes-m.log` and `logs/modes-d.log` are the
runs with the final script and both pass 17 of 17. No behaviour check had failed.

Results at a glance (all on the final code):

| Check | Result |
| --- | --- |
| `t-a11y.cjs` at 1440 and at 390 | 25 of 25 each |
| `t-transition.cjs` | 12 of 12 |
| `t-modes.cjs` at 1440 and at 390 | 17 of 17 each |
| `t-reduced-real.cjs`, `t-reduced-resize.cjs` | 7 of 7, 4 of 4 |
| `t-network.cjs` | 12 of 12 |
| `t-longwait.cjs` | 27 of 27 |
| `t-existing.cjs` | 7 of 7 |
| `t-frame.cjs` at 1440 and at 390 | the horse whole and clear of the controls in all 10 pictures at each size |
| `t-sim.cjs`, `t-stop.cjs`, `t-hoof.cjs`, `t-layers.cjs` + `analyse-layers.py`, `t-perf.cjs`, `t-coat.cjs` | the figures quoted in the README, sections 3, 4, 6 and 8 |

The scripts that decide something were then repeated against a **production build** (the pictures above are from the development
server; the logs of the production runs are in `logs/production/`). Same results: `t-a11y.cjs` 25 of 25 at 1440 and at 390,
`t-transition.cjs` 12 of 12, `t-modes.cjs` 17 of 17 at both sizes, `t-reduced-real.cjs` 7 of 7, `t-network.cjs` 12 of 12,
`t-longwait.cjs` 27 of 27, `t-existing.cjs` 7 of 7, `t-frame.cjs` the horse whole and clear of the controls in all 10 pictures
at each size with the same framing numbers as the development run, and `t-coat.cjs` with figures identical to the development
run (`numbers/production/coat.json`). No script printed an uncaught page error or a console error or warning, apart from the
three Three.js errors that appear when `t-modes.cjs` switches WebGL off on purpose (the scripts ignore only React's hydration
warning, which a production build does not have, and the `motion` library's "Reduced Motion enabled" notice). `t-sim.cjs`,
`t-stop.cjs`, `t-hoof.cjs`, `t-layers.cjs`, `t-perf.cjs` and `t-reduced-resize.cjs` were **not** repeated on the production build.
