# Horse environments: one black Marwari in three places

Built 25 Oct 2026 on branch `feature/horse-environments`. **Local commits only: not pushed, not merged, not deployed.**
It lives on `/anatomy`, in a new section ("One horse, three horizons", §1a) between the specimen plate and the two-bodies
section. This work changes no other page. **One thing to know before merging:** the baseline commit it sits on (`a5014c7`, the
Mac's rigged Marwari) also upgrades the small 3D plate in the home page's "Instrument" section from the old idle-only model to
the rigged one, with stand, walk and trot buttons (section 2). That is the Mac branch's change, not this one's, and it needs
your decision at merge time.

**What was and was not proven.** Everything was built and measured in a cloud Chromium that draws with software WebGL
(SwiftShader). Positions, distances, speeds, counts, byte sizes and timings are exact; **frame rate is not**, because software
drawing says nothing about a real graphics card. The viewer has never been run on a physical phone or on a real GPU.
The three reference photographs named in the brief never reached the session, so the scenery is **original generated art**
that follows the written description of each place, not a reconstruction of those photographs (section 6).

## 1. What a visitor gets

A section on `/anatomy` with the existing 3D viewer and three buttons: **DESERT**, **HORSE FIELD**, **VILLAGE**.

- One black Marwari, one canvas, one horse. The horse never leaves the middle of the frame. What moves is the world: ground,
  sky and distance slide past at the speed of the horse's own stride, so a walk looks like a walk and a halt is a halt.
- A place changes only when a button is pressed (never on scroll or mouse wheel). The change takes about one second
  (1.03 s measured): the horse settles to a stand, the old place fades out, the light and the camera head for the new place,
  the new place fades in, and the horse takes up its gait again in it (a horse that was standing keeps standing).
- Each place offers the gaits that suit it: Desert stand / walk / canter / gallop; Horse Field stand / walk / trot / canter;
  Village stand / walk.
- The camera is guided, not free: one shot per gait, easing between shots. A drag nudges the angle by at most 32° across and
  5° up and it eases back.
- Reduced motion, no WebGL, a failed download, keyboard use and phones are all handled (section 7).

## 2. What existed, what is new

| | Before this work | Now |
| --- | --- | --- |
| Live `main` (`01d083f`) | An anatomy viewer with six hotspot camera presets and auto-orbit, on an older horse model. No gaits, no places. | Unchanged. This branch is not merged. |
| The Mac's `feature/marwari-film-world` (unpushed) | The rigged Marwari (three GLBs with idle, walk, trot, canter, gallop and sprint clips), the `Locomotor` (speed-band gait blending, hoof contact), the life layer, the dust and hoof-print pools, the hotspot viewer, and a scroll-driven film. | Only the committed runtime that the places need was brought in as the baseline commit `a5014c7`, adapted to this repo's media rules (model paths through `asset()`; the measured gait table as `components/horse-worlds/gait-table.ts` because the media bucket does not serve `.json`). The scroll-driven film was not brought in. |
| The viewer | `Anatomy3DHorse` with hotspots. | The same component with an optional `worlds` mode. Without the prop it behaves as before. Its other user is the compact specimen plate in the home page's "Instrument" section (`t-existing.cjs` checks that it still draws, still has its three gaits, its orbit toggle and its "3D Specimen" marking). `/anatomy`'s own specimen plate is the still archive plate and does not use it. |
| The home page's 3D plate | The old `marwari-animated-home.glb` with an idle-breathing loop and six hotspot buttons. | **Changed by the baseline commit, not by the places:** the rigged `marwari-anatomy.glb` with stand, walk and trot buttons and the same hotspots. Merging this branch brings that to the home page. |
| Places | None. | `components/horse-worlds/` (engine), `components/sections/anatomy/HorseWorlds.tsx` and `WorldSwitcher.tsx` (the section and the three buttons), `lib/content/horse-worlds.ts` (words), `public/images/horse-worlds/` (art), `scripts/horse-worlds/` (generators and checks), `tests/horse-worlds.test.mjs`. |

The model was not replaced and no second horse, second canvas or second renderer exists: the places are added to the one
scene the viewer already owns.

## 3. How a place is built (five layers)

All layers are placed in **world space** at real distances and all scroll by the same ground distance, so parallax comes out
of the perspective camera by itself instead of being faked with a speed per layer.

| Layer | What it is | How it moves | Cost |
| --- | --- | --- | --- |
| A sky | A dome that follows the camera: gradient, haze, sun glow, soft clouds | Clouds drift with time; the dome does not scroll | one draw call |
| B distant | A ring of far dunes, hills or roofs around the camera (desert 700 m, field 700 m, village 320 m) | Turns by `distance / (2 pi R) x repeats` (the slowest layer) | one draw call |
| C middle | Upright cut-outs behind the horse (trees, fences, stables, house fronts, walls), instanced | World position minus ground distance, wrapped along the track (`wrapAlongTrack`), re-rolled each lap | one instanced draw per field |
| D foreground | A few low cut-outs (tufts, stones, pots) between the camera and the horse, kept below the hooves' line of sight | As C | one instanced draw |
| E ground | A real 3D plane under the hooves, the contact shadow, the horse's cast shadow, cut-out shadows sheared onto the ground, hoof prints, dust, and (field only) real grass tufts | Texture offset `distance / tileMetres`; prints and dust move with the ground; grass tufts wrap along the track and are pressed aside by planted hooves | plane + shadows + particles |

Measured, one layer at a time (`t-layers.cjs` + `analyse-layers.py`, desktop): how far each isolated layer's picture moved
for a known ground movement, against where the camera geometry says it must move.

| Layer | Desert | Field | Village |
| --- | --- | --- | --- |
| Ground near (5.5 m) | -0.7 % | -1.1 % | -1.5 % |
| Ground middle (7.4 m) | +1.8 % | +1.1 % | +1.3 % |
| Ground far (10.8 m) | +17.7 % (low-contrast sand, correlation 0.38) | +6.1 % | +6.0 % |
| Distant ring | -0.6 % (700 m) | +2.8 % (700 m) | -0.4 % (320 m) |
| Middle cut-outs | no single depth to compare | no single depth to compare | -1.0 % (22.9 m) |

(error = measured minus expected, as a share of the expected pixels moved). The far-ground figure for the desert is the weakest
measurement (a faint ripple pattern gives a low correlation peak), not a sign that the layer moves wrongly.

Lazy loading and weight: three.js and the viewer are fetched only when the section is within 200 px of the screen; each
place's art is fetched at first use (and ahead of the press, on hover, touch or focus of its button). Art is WebP, with half-size
copies for phones. Overdraw is kept low: 17 to 25 draw calls per frame in every place.

## 4. Movement and ground contact

The horse stays at the origin and the world is the treadmill. The existing `Locomotor` runs the clips; `treadmill.ts`
turns its stride into a scroll distance:

```
v = L x f                      ground speed = stride length x stride frequency (from the measured gait table)
d(t + dt) = d(t) + v dt        the ground distance is the integral of v
```

- The gait speeds the viewer asks for are the speeds the clips were authored and measured at: walk 1.44, trot 3.33,
  canter 4.9, gallop 10.0 m/s (`GAIT_SPEED`). `stand` is 0, so a stopped horse stops the whole world.
- The measured speed of the planted hooves trims the scroll speed, by at most 15 % either way, and **only while the horse is at
  the pace it was asked for** (`steadiness`). While it brakes or sets off the clips blend and the hooves read up to 25 % fast;
  following that made the ground surge, so the trust eases back to 1 instead (finding 2, section 10).
- Footprints and dust are emitted on the real touchdowns and lift-offs the `Locomotor` reports, in the horse's frame, and then
  ride with the ground, so a print stays where it was made (largest drift against the ground in the checks: 4 x 10^-5 m).

Results (`t-sim.cjs`, 1440 x 900, software GL; same figures at every size because they come from the simulation):

| Place | Gait | L (m) | f (Hz) | L x f | Scroll speed (mean) | Planted hooves (mean) | Slip RMS | Hoof strikes per s (4 f) | Highest planted toe | Lowest planted toe |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Desert | walk | 1.44 | 0.993 | 1.43 | 1.37 | 1.36 | 0.20 | 4.00 (3.97) | 4.8 cm | 0 |
| Desert | canter | 2.90 | 1.691 | 4.90 | 4.65 | 4.61 | 0.46 | 6.63 (6.76) | 5.8 cm | 0 |
| Desert | gallop | 4.20 | 2.381 | 10.00 | 9.61 | 9.55 | 0.96 | 9.50 (9.53) | 6.0 cm | 0 |
| Field | walk | 1.44 | 0.993 | 1.43 | 1.37 | 1.36 | 0.20 | 4.00 (3.97) | 4.8 cm | 0 |
| Field | trot | 2.50 | 1.334 | 3.33 | 3.20 | 3.18 | 0.30 | 5.25 (5.33) | 4.6 cm | 0 |
| Field | canter | 2.90 | 1.689 | 4.89 | 4.63 | 4.58 | 0.43 | 6.63 (6.75) | 6.2 cm | 0 |
| Village | walk | 1.44 | 0.993 | 1.43 | 1.37 | 1.36 | 0.20 | 4.00 (3.97) | 4.8 cm | 0 |

What this says and does not say:

- The scenery speed equals the speed of the hooves that are on the ground to within about 1 % (0.7 to 1.0 % below it), and the
  integral of `v` matches the scrolled distance to better than 10^-12 m.
- **Slip is not zero.** A planted hoof still slides against the ground by an RMS of 0.20 m/s at a walk up to 0.96 m/s at a
  gallop (about 14 %, 9 %, 9 % and 10 % of the ground speed at walk, trot, canter and gallop). That is the authored clips' own
  foot slide; the treadmill removes what a speed trim can remove and no more. No gait was faked or retimed to hide it.
- The "highest planted toe" is the height of the toe-bone point of a hoof in mid-stance (4.6 to 6.2 cm), which is where the
  hoof's wall meets the ground in the rig. Close-ups of the hooves in the middle of their stance (`t-hoof.cjs`, evidence
  `hoof/`) show the hooves on the ground in every place and no hoof below it (the lowest is 0).
- The hoof strike rate is within 2 % of four times the stride frequency at every gait, so footfalls and dust are
  in step with the legs.
- Stopping (`t-stop.cjs`): the scroll speed does not rise while the horse brakes (the largest rise in any run is 0.0003 m/s); once the horse is still, the world has stopped
  (0 m scrolled afterwards) and two ground pictures taken a moment apart are identical. From a walk the horse is still after
  0.73 s, from a trot 1.30 s, from a canter 1.78 s and from a gallop 3.38 s (the engine's easy 3.2 m/s^2 stop, by design).
  Setting off again, the ground's largest jump in a frame is under 0.055 m and it starts to move within 0.17 s.

## 5. Switching places and the camera

`transition.ts` is a small state machine so it can be tested without a renderer:

```
idle --press--> out (0.45 s) --> load (as long as the next place's art takes) --> in (0.55 s) --> idle
```

- One switch runs at a time. A press during `out` re-aims at the newest choice; a press for the place on screen fades it back in
  from where it is; a press during `in` is kept (only the newest) and runs after it. Switches never overlap.
- While a switch runs, the horse is brought to a stand by a scripted halt (0.75 s, smoothstep), whatever it was doing: the new
  place fades in around a calm horse, and the halt is hidden by the fade. It then resumes its gait (or the one picked during
  the switch). This halt is deliberately not physical.
- The wait in `load` has **no time limit**: a place is never shown before its art is here, because showing the old place under
  the new place's name would be wrong. The visitor is never stuck: a press during the wait replaces the place being waited for,
  and a place whose art is already here (the one that was on screen, or a cached one) comes in on the next frame. After 1.6 s of
  busy the words "Loading the scene" appear. A download that fails for good drops the viewer to stills (section 7).
- The lights (sun, rim, fill, hemisphere, exposure, environment) mix between the two places over 0.8 s; fog, sky, dust colour and
  ground texture belong to the place and fade with it.

The camera (`cameraRig.ts`) is a guided rig. Each gait of each place has a shot (azimuth, elevation, distance, field of view,
target); moves are critically damped springs (0.85 s, no overshoot, no overlap). The shots start full-body and a faster gait never
comes closer than a slower one (a unit test enforces it). The distance is never shorter than what keeps the whole horse in frame
at the current aspect (`fitDistance`, at least 2.2 m either side): 7 m on a wide screen, 9.6 m on a 390 px phone.

Measured switch (`t-transition.cjs`): 1.033 s from press to rest (out 0.45 s, in 0.567 s); the fades only fall and then only
rise (largest step 0.056 per frame); the horse is at a standstill 0.65 to 0.72 s after the press, from a walk or a gallop; the
camera heads for the new place's standing shot; the change of mind after 0.2 s fades back with no swap and no load.

Framing (`t-frame.cjs`): the horse is whole and inside the picture at every gait in every place, a little right of the middle
(2 to 6 %) and a little above it (2 to 4 %), and clear of the buttons, on a 1440 x 900 desktop (the horse is 23 to 32 % of the
picture's width; the gallop shot is a wide shot, 20 %) and on a 390 x 844 phone (43 to 47 % of the width). Pictures of the
page's top 120 px (below the fixed navigation) are in the evidence.

## 6. The art, the coat, and the reference-image rule

**The coat.** The black coat is graded once (`COAT_GRADE`) and never touched by the scenery; the mane and tail keep one tone
(`HAIR_GRADE`). Each place has its own light, so the coat's *highlights* differ (warm gold in the desert, cool and soft in the
field, a low sun in the village), but its base tone is the same.

Measured (`t-coat.cjs` + `analyse-coat.py`): the horse is drawn alone, standing, on two flat greys in each place's own light, and
only the pixels that read the same on both greys (the opaque body, about 75,800 pixels, the same silhouette in all three places)
are counted. Brightness is on a 0 to 255 scale.

| The coat's brightness | Desert | Horse Field | Village | Spread |
| --- | --- | --- | --- | --- |
| Median | 22.6 | 25.6 | 24.3 | 3.0 |
| The darkest tenth is below | 14.6 | 16.9 | 16.2 | 2.3 |
| The lightest tenth is above | 44.3 | 46.8 | 41.3 | 5.5 |
| Share of the coat darker than 40 | 88.4 % | 87.1 % | 89.5 % | 2.4 points |
| The brightest 1 % is above (the sheen on back and croup) | 141 | 175 | 146 | 34 |
| Warmth (red minus blue) | +11.1 | +1.4 | +8.7 | 9.7 |

So the base tone is the same black to within 3 of 255, and what changes is the light: the field's sun and sky give a stronger
sheen on the back, and the golden-hour light of the Desert and the Village warms the coat. On a flat grey the Desert and Village
coats look brown-black; inside their scenes they read black (screenshots in the evidence). The mane and tail are see-through
cards and are not in these numbers. If the warm sheen is unwanted, the colours to cool are each place's sun, rim and fill light in
`worlds.ts`.

**The scenery is original.** `scripts/horse-worlds/gen_*.py` draw every picture from noise and simple shapes with numpy, scipy
and Pillow (ground, normal maps, the distant band, the cut-out atlases, the village props). No photograph, no AI image and no
reference image went into them, and none contains a horse. The generators also record each cut-out's rectangle and real-world
size (`atlas-data.json`, merged into `components/horse-worlds/atlas-data.ts`), so the engine knows where each sits and how big it
is. A unit test checks that no file name hints at a supplied reference image or a horse and that every recorded rectangle lies
inside its picture.

**The reference-image rule.** The brief says the three supplied photographs contain a horse and must never be used as a
backdrop. They are not: they never reached the session, and the scenery does not use them. What is missing, exactly:

1. The three reference photographs themselves. Until they are re-sent, nothing here was traced, matched or painted from them
   and no visual match to them is claimed.
2. Painted (AI-made) scenery. **No Higgsfield credits were spent**, and none will be without your approval of an exact amount.
   The plan put to you is up to 40 credits (about 24 two-kilopixel images at about 1 credit each): horse-free transparent
   cut-outs and plates, packed into the same atlas layout.
3. GPU-compressed textures (KTX2/Basis). Not built: it needs a new dependency and a toolchain, which the repo rules say to ask for.

How to replace the art once it exists: make horse-free RGBA atlases laid out as in `atlas-data.ts`, write them to
`public/images/horse-worlds/<place>/`, update the rectangles, run `node scripts/media-manifest.mjs`.

What each place looks like (grounded in the written brief; screenshots in the evidence):

- **Desert**: flat golden-hour sand with wind ripples, far dunes in haze, khejri and kair trees (the Marwar desert's own), grass
  clumps and small rocks.
- **Horse Field**: short green grass that leans in the wind and parts under planted hooves, a timber fence, a stable block with a
  red roof, mature trees, soft hills in morning mist, flowers.
- **Village**: a packed-earth lane with lime-plaster and sandstone house fronts and wooden doors, a haveli with a jharokha
  balcony and chhatris, round huts with conical thatch, compound walls with studded gates, an alley under a stone arch, clay pots,
  a stone trough and a haystack; a low sun, long shadows from the buildings, a little dust.

## 7. Accessibility, reduced motion, fallbacks and phones

- **Buttons.** A `role="group"` named "Choose a place" holding three real `<button>`s with `aria-pressed`; `aria-busy` on the group
  while a switch runs. Arrow keys, Home and End move focus between them (they do not choose); Enter and Space choose. Each is at
  least 44 px tall and has a gold focus ring of 2 px or more with an offset (`t-a11y.cjs`, 25 checks at 1440 and at 390).
- **A polite live region** says "Now showing ..." once the new place is on stage (after the fade, not before). Nothing is
  announced for a place that never came.
- **One canvas** on the whole page. Pressing the place already shown does nothing. Scrolling, the wheel and dragging never change
  the place.
- **Reduced motion** (`t-modes.cjs`, `t-reduced-real.cjs`, `t-reduced-resize.cjs`): the horse stands, places change without a fade
  or a camera glide, the ground and the dust do not move, a short note says so, and the viewer's loop goes to sleep when nothing
  changes (0 frames in 2.5 s). If two places are asked for in a row, the one asked for last is the one shown, however long each
  takes to arrive. After a resize the camera is where a page opened at that size puts it.
- **No WebGL, or art that cannot be fetched** (`t-modes.cjs`, `t-network.cjs`): the viewer says so and shows a still of the
  place that was asked for (three posters, 211 to 280 KB each, fetched only in this case) with a description; the buttons keep
  working and swap the still and the announcement. No uncaught error.
- **Phones** (width up to 767 px): half-size art, fewer cut-outs and grass tufts, fewer particles (dust 360 against 720, motes 90
  against 220, prints 70 against 140, and each strike kicks up 0.55 times as much), a 1024 px shadow map (2048 on a computer),
  a pixel ratio capped at 1.25, one place kept in memory (two on a computer), and the lighter hero model. If frames run long for
  2.5 s the viewer halves the shadow map, and if they still run long it turns the shadows off and draws one pixel per pixel.

## 8. Performance (counts and sizes; not frame rate)

Per frame, with the horse and all layers drawn (`t-perf.cjs`; the same on any GPU):

| Place | Draw calls | Triangles (computer / phone) | Textures in memory (computer / phone) | The place's own art downloaded (computer / phone) |
| --- | --- | --- | --- | --- |
| Desert | 17 | 133,934 / 82,166 | 17 / 17 | 849,028 B / 301,824 B (5 files) |
| Horse Field | 22 | 408,938 / 187,290 | 23 / 18 | 1,503,258 B / 418,950 B (5 files) |
| Village | 25 | 133,738 / 82,198 | 25 / 20 | 1,468,722 B / 492,050 B (6 files) |

The field's triangle count is the grass (real blades). The desert's art is fetched with the first load; the other two on first use.
Estimated GPU memory for the *place's own* textures, uncompressed: desert 28 MB, field 40 MB, village 56 MB on a computer;
7, 10 and 14 MB on a phone. The horse's textures (about 73 MB on a computer, 18 MB on a phone), the environment map (8 MB) and
the shadow map (17 MB, 4 MB) are on top. These are estimates from texture sizes, not measurements from a driver. The JS heap
read 33.5 MB on a computer profile and 35.6 MB on a phone profile at the end of the run (it moves with garbage collection: an
earlier run read 48 MB on the computer profile).

**No frame-rate figure is claimed.** If the work is to be signed off for real phones, run it on one and read the frame time.

## 9. Tests and evidence

**Unit tests** (`node --test tests/horse-worlds.test.mjs`, 33 tests, no browser): the arithmetic (`v = L x f` for every gait in the
table; each asked-for gait sits on a measured speed; the integral; layer scroll rates by flat tiles and rings; wrapping along the
track; the scroll direction; the hoof-measurement trust; the ground grid), the camera (shots, narrow screens), the switch
machine (about one second; no overlap; newest wins; change of mind; waits as long as the art takes; choosing again while it
waits; going back to the place on screen; monotonic fades), the three places (names, gaits, shots, original art, atlas rectangles,
house rows, clearances, light, grass, hoof pressing, tuft shape).

**Browser checks** (`scripts/horse-worlds/checks/`, not in `npm test` because they need a running site and Playwright; see the
README there). Results on the final code:

| Check | Result |
| --- | --- |
| `t-a11y.cjs` at 1440 and at 390 | 25 of 25 at each size: roles, names, `aria-pressed` and `aria-busy`, arrow keys, Home, End, Enter and Space, focus ring, touch size, one canvas, the live message, scroll and wheel change nothing, a drag stays within its limits and springs back |
| `t-transition.cjs` | 12 of 12 over seven scenarios (from a walk, from a stand, from a gallop, two quick presses, a change of mind, a switch to art not yet fetched): 1.033 s each, one phase at a time, fades monotonic, standstill within 0.72 s |
| `t-frame.cjs` at 1440 and at 390 | horse whole, near the middle and clear of the buttons in all 10 place and gait pictures at each size |
| `t-sim.cjs`, `t-stop.cjs`, `t-hoof.cjs`, `t-layers.cjs` + `analyse-layers.py` | the figures in sections 3 and 4 |
| `dbg-replay.cjs` + `ncc-consec.py` (desert, canter, 17 frames) | every frame is reproduced exactly from its recorded distance, time and camera (17 of 17); the ground's shift from frame to frame is steady (largest jump from the steady rate 0.34 px, rms 0.20 px; correlation at least 0.99) |
| `t-modes.cjs` at 1440 and at 390 | 17 of 17 each (reduced motion and no WebGL). One comparison inside it ("with motion allowed the loop draws steadily") counted 1 frame in a 2.5 s window on the first phone-size run while the software renderer stalled; it now counts frames over 6 s (21 and 13 frames), and both runs pass. The first run's log is kept in the evidence |
| `t-reduced-real.cjs`, `t-reduced-resize.cjs` | 7 of 7 and 4 of 4 |
| `t-network.cjs` | 12 of 12 at 40 KB/s and 400 ms latency: a place whose art took 35.6 s to arrive (the old place stayed faded out, the horse stood still, the switcher said busy); art that cannot be fetched (clean fall back to stills, buttons keep working) |
| `t-longwait.cjs` | 27 of 27: a place held for 40 s of simulated time keeps the viewer waiting and says so; then the three ways out (the art arrives; back to the place on screen; another place) |
| `t-existing.cjs` | 7 of 7: the home page's compact plate is unchanged by the places (section 2) |
| `t-coat.cjs` + `analyse-coat.py` | the figures in section 6 |
| `t-perf.cjs` | section 8 |
| The decisive scripts again on a **production build** (`npm run build`, `npm start -- -p 3200`, `HW_BASE=http://localhost:3200`) | the same results: `t-a11y` 25 of 25 at 1440 and at 390, `t-transition` 12 of 12, `t-modes` 17 of 17 at both sizes, `t-reduced-real` 7 of 7, `t-network` 12 of 12, `t-longwait` 27 of 27, `t-existing` 7 of 7, `t-frame` the horse whole and clear of the controls in all 10 pictures at each size with the same framing numbers, `t-coat` with figures identical to the development run. No uncaught page error and no console error or warning except the three Three.js errors that `t-modes` provokes on purpose by switching WebGL off. `t-sim`, `t-stop`, `t-hoof`, `t-layers`, `t-perf` and `t-reduced-resize` were **not** repeated on the production build |

**Where the evidence is.** `docs/horse-worlds/evidence/` (5.7 MB; its own `README.md` says what each file is and which check made
it): the three places at each gait on a 1440 and a 390 screen, the page's top 120 px and the section's top, hoof close-ups, the
coat comparison, the slow-download, failed-download and long-wait pictures, reduced-motion and no-WebGL pictures, the home page's
plate, and the logs and the JSON the checks wrote (including the logs of the production-build runs). Pictures are JPEG copies of
the PNGs the checks took on the development server.

**About tests A to G.** The brief listed seven acceptance tests lettered A to G. The text of that list was lost when my
working session had to be summarised, and the saved record only keeps the first words of the brief, so **I cannot tick them off
by letter**. Instead this table maps each requirement of the brief that I could recover to what covers it. If you paste the A to
G list again I will map it line by line.

| Requirement | Covered by |
| --- | --- |
| Three buttons DESERT, HORSE FIELD, VILLAGE; one horse; one canvas | `t-a11y.cjs` (structure, one canvas on the page), unit test on names |
| Switching by button only, never by scroll | `t-a11y.cjs` (scroll and wheel change neither place nor camera) |
| About one second, settles the horse, fades scenery and lights, retargets the camera, no overlap | `t-transition.cjs`, unit tests |
| Guided camera, starts full-body, horse centred, in place and uncropped | `t-frame.cjs`, `t-a11y.cjs` (drag clamps), unit tests |
| Layers A to E, lazy loading, compressed images, low overdraw | section 3, `t-layers.cjs`, `t-perf.cjs` (GPU-compressed textures not done) |
| Reference images never a backdrop | section 6, unit test on file names |
| Desert: ground scrolls at `v = L x f`, integral, stops when the horse stops, footprints and dust in step with the gait | `t-sim.cjs`, `t-stop.cjs`, unit tests |
| No floating, sinking or sliding hooves | `t-sim.cjs` (float, sink, slip: slip is not zero, see section 4), `t-hoof.cjs` |
| Field: stand, walk, trot, controlled canter; grass moves and is pressed by hooves | `t-sim.cjs` (grass counts), unit tests |
| Village: calm, standing and walking; building shadows; mild dust | unit tests (gaits, light), pictures |
| Same deep-black coat in every place | section 6, `t-coat.cjs` + `analyse-coat.py` (median brightness within 3 of 255 across the places; highlights and warmth differ with the light) |
| Responsive; fewer particles on phones | `t-frame.cjs` at 390, `t-perf.cjs` at 390 |
| Graceful WebGL fallback | `t-modes.cjs`, `t-network.cjs` |
| Reduced motion | `t-modes.cjs`, `t-reduced-real.cjs`, `t-reduced-resize.cjs` |
| Keyboard and ARIA | `t-a11y.cjs` |
| Do not replace the model, rebuild the site, change the home page or unrelated pages | the file list in section 13: only `/anatomy` and the viewer's optional mode were touched |

## 10. Problems found on the way, and how they were fixed

1. **Sand that shimmered.** The ground was one huge two-triangle quad, and the GPU's interpolation of texture and shadow
   coordinates over a triangle thousands of times bigger than the picture jumped by centimetres as the camera drifted. The
   ground is now a fine grid about the hooves (cuts 24, power 2), spread out toward the edge. A frame is a pure function of
   distance, time and camera (`dbg-replay.cjs`).
2. **The ground surged while the horse braked.** The hoof measurement reads up to 25 % fast while clips blend. It is now trusted
   only at the asked-for pace and eased back otherwise.
3. **A gallop took three seconds to stop during a switch.** The engine's easy stop has a long tail. During a switch the halt is
   scripted (0.75 s) and hidden by the fade.
4. **Reduced motion: a race and a resize bug**, found only with the viewer's own loop (a stepped test hid them): with two places
   asked for in a row the one that arrived last won; and a resize left the camera at the old distance. Both fixed (ticket for
   the newest request; the camera snaps on a new shape).
5. **Footprints glowed in the dark** during a long load. The print layer now fades with the scene.
6. **A very slow download** could, after a fixed 15 s, fade the old place back in under the new place's name. The wait now has
   no limit, and the visitor can choose again meanwhile (section 5).

## 11. Limitations and open items

- Frame rate and real-device behaviour are unmeasured (software GL only).
- The scenery is generated art in the style of its description. It has not been compared with the reference photographs, and the
  desert's trees are in an older, thinner art style than the other places' trees.
- Textures are uncompressed on the GPU (estimates in section 8). The field's normal map is 578 KB, the largest single file.
- The hair and tail are graded at runtime (a material tweak), and the tail's strands read as slightly striped and lighter than the coat.
- Planted-hoof slip is the clips' own (RMS up to 0.96 m/s at a gallop); the horse is not "slip-free".
- The gallop shot is a wide shot (the horse is about a fifth of a desktop picture's width): a tuning knob in `worlds.ts`.
- Village: in tall-facade views, shadows from the buildings can faintly reappear on the camera side; a haystack passes behind
  the horse's neck; the ground shows faint blotching at a distance.
- From a gallop, outside a switch, the horse takes about 3.4 s to stop (the engine's comfortable deceleration).
- Reduced motion: after a drag, the nudge spring-back still glides for 1.1 s.
- On a phone, a stage that finished loading after its request was cancelled stays in memory until the next place mounts and trims it.
- The control pills use `backdrop-blur`, like the viewer's existing controls (the house style asks for no glassmorphism; it was
  kept for consistency with those controls).
- On `/anatomy`, `npm run dev` shows one React hydration warning (the red "1 Issue" badge in the screenshots, which are development
  screenshots). It comes from the existing still archive plate (`SpecimenPlate` > `FilmImage`, an `img` style that the server and
  the client write differently). The same warning appears on a clean copy of `main` (`01d083f`), which I checked, so it is not from
  this work; I left it alone because it is outside the brief. The home page and `/legend` show no such warning.
- Not done: the three reference photographs (not received), painted scenery (not approved), GPU-compressed textures, testing on a
  real phone, anything outside `/anatomy`.

## 12. How to

- **Run it:** `npm run dev`, open `/anatomy`. Add `?hwdebug=1` to expose `window.__horseWorlds` for the checks.
- **Run the checks:** start the site on port 3100 (`npm run dev -- -p 3100`), then
  `node scripts/horse-worlds/checks/t-transition.cjs --out transition.json` (and the others; the checks README lists them). Run
  them one at a time on a small machine.
- **Change a place's look or pace:** `components/horse-worlds/worlds.ts` holds each place's light, sky, ground, layers, camera
  shots and gait menu as data. Words are in `lib/content/horse-worlds.ts`.
- **Add a place:** add its id to `lib/content/horse-worlds.ts`, a `WorldConfig` to `worlds.ts`, art under
  `public/images/horse-worlds/<id>/`, a poster under `posters/`, and run `node scripts/media-manifest.mjs`.
- **Redraw the art:** from the repository root, `python3 scripts/horse-worlds/gen_desert.py` (and `gen_field.py`,
  `gen_village.py`, then `gen_atlas_data.py`), then `node scripts/media-manifest.mjs`.

## 13. Files

New: `components/horse-worlds/` (`atlas-data`, `cameraRig`, `controller`, `grass`, `materials`, `math`, `stage`, `transition`,
`treadmill`, `types`, `worlds`), `components/sections/anatomy/HorseWorlds.tsx`, `components/sections/anatomy/WorldSwitcher.tsx`,
`lib/content/horse-worlds.ts`, `public/images/horse-worlds/` (desert, field, village, posters), `scripts/horse-worlds/`,
`tests/horse-worlds.test.mjs`, `docs/horse-worlds/`.

Changed: `app/anatomy/page.tsx` (one new section), `components/sections/anatomy/Anatomy3DHorse.tsx` (the optional `worlds` mode and
a debug hook that exists only with `?hwdebug`), `components/stallion-film/effects.ts` (a default-1 opacity on the dust and print layers, and a `shiftZ`
method on each so the treadmill can carry what the ground holds; the viewer's other mode never calls them, so it is unchanged), `scripts/media-manifest.json` (the new files), `PROGRESS.md`.

Baseline commit `a5014c7` (before this work) brought in the rigged Marwari runtime from the Mac's branch.
