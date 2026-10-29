# Black Marwari realism pass: mane, forelock, tail, coat and the ground (29 Oct 2026)

Branch `feature/horse-realism`, cut from `origin/main` (`e47a770`). **Nothing was merged, pushed or deployed, and no image-generation
credits were spent.** The horse's body shape, gaits, controls, places, anatomy layers and animation clips are unchanged. The work is hair,
coat shading, hoof contact and the ground.

## At a glance

- **Mane, forelock, tail, dock:** rebuilt as soft, tapered locks that lie on the real neck and hang from a real dock, skinned to the same bones;
  no flat blades, no saw-tooth crest, no grainy tail; a short forelock between the ears that were already there.
- **Hair and coat shading:** black hair with dark roots, lighter tips and a sheen that runs along the strand as glints (no white or grey wash, in the
  film's sun or the hero's studio rig); a blue-black sheen on the rounded masses, darker hollows, and the old pale flap at the tail root gone.
- **Ground:** no dark discs, no floating dust (highest grain 4 cm, was 1.1 m), small kicks that stay on the ground, faint hoof prints,
  textured arena sand.
- **Cost:** about +1 ms of GPU per frame on desktop at the top tier (+0.5 at 2x, +0.3 on the phone profile); 60 fps held; weak devices start
  on, and the frame-time governor drops to, simpler hair; reduced motion switches the hair's own movement off.
- **Checks:** 160 tests pass (27 new), lint, typecheck and build pass; before/after pictures in all three places at 1440 and 390.

## Where the pictures were taken ("One horse, three horizons")

No page or section carries that name in the code. The three scenes in the brief (Desert, Horse Field, Village) are the three chapters of
the stallion film on the home page: *I · Heritage, the Desert of Marwar*, *II · Identity, the Village* and *III · Excellence, the Academy*
(the horse field, `campus` in the code). That is where every picture below was taken. The `/anatomy` page does not draw this horse (its
specimen plate is a 2D archive picture and "One conversation. Two bodies." is a separate procedural model); the same horse is drawn by the
film, by the "Instrument" plate on the home page (checked with the new hair, no errors) and by an unlinked static exhibit in `public/anatomy`
(kept in step, see below).

## What changed

### Mane and forelock (`components/3d/hair-locks.ts`, `marwari-hair-locks.ts`)

The 125 exported hair ribbons were flat planks that stood up from the crest as blades. They are still in the GLB, hidden, and come back if the
new hair cannot be built. The new mane is 170 locks in three layers (inner, middle, outer):

- each lock is a narrow three-column card with a raised ridge (rounded, not flat) that **lies on the real neck**: the neck's skin is measured
  from the coat mesh at 14 ring stations, and a lock rooted on the crest sweeps down the horse's left side at the skin's own radius plus a
  layer offset (0.5 / 1.3 / 2.2 cm), so it can neither float nor sink;
- locks taper to about a fifth of their width, tips lift off the neck by 0.6 / 1.8 / 3.6 cm so the silhouette is layered, each lock has its own
  slow S-curve and slides toward the withers as it falls;
- roots start within 20 degrees of the crest, sit 1.4 cm under the skin and **fade in over their first fifth** (soft alpha, each lock its own
  length), so the crest never shows a row of square tops; the locks at the withers and the poll are shorter and finer, where the neck turns;
- skinned to `Neck_1..3`, `Head` and `Mane_1..4`, so every clip and gait moves them; on top of that the mane lags the neck by a damped spring
  and flutters a little at the free end (wind of the place).

The **forelock** is 13 short locks (12 to 22 cm) from the poll between the ears, standing up to 3 cm off the skin in an arch and coming
down over the forehead, each turned about its own axis so that it shows from the side too. (The skin between the ears is weighted to the ear bones, so the
profile is found geometrically, not by bone weight; a first version found nothing and silently built no forelock.) The ears are untouched: the
inward-curving tips are clear in the front and three-quarter views below.

### Tail and dock

110 strands whose roots fill a disc round the tail's axis (phyllotaxis: any prefix is evenly spread, which is how the tiers drop strands),
starting below the dock, dense and overlapping at the root, **opening into separate tapering strands** toward the tip. The strands follow
the four tail bones with Gaussian weights so the tail bends in a curve, not at four joints; the frame along the axis is parallel-transported
(a recomputed "up" flips where the tail runs straight down). A light swing comes from a damped spring on the first tail bone, and the tail
lifts at pace (up to 26 cm at a canter).
The **dock** is a short opaque tube (4.2 to 2.6 cm radius) with a rounded start, so no flat end can show above the croup, and its root follows
the pelvis (0.69, the share measured on the coat there) so a lifted tail does not pull it out of the rump.

### Hair shading

- **No dither.** The old hair was alpha-to-coverage on a 4x multisampled canvas, which quantises every soft edge to five levels and shows as
  speckle on the tail. At the top tier the hair is drawn twice: an opaque alpha-tested pass for the strand cores (writes depth, casts the
  shadow) and a blended pass for the soft fringe. Lower tiers keep one pass with alpha to coverage.
- **Real black hair, not plastic.** Roots are near black and in shadow (the layers above and the neck cover them), tips lighten to a slightly
  sun-bleached brown (linear 0.0065 to 0.0098), every lock a little different (plus or minus 22%). The highlight is two Kajiya-Kay lobes
  along the strand (a narrow white one and a wide blue-black one); each of the 16 strands the atlas draws across a card is tilted by its own
  amount, so only a few are in line with the light at once and the sheen is a scatter of glints along the lock, not one bar.
- **Under any light rig.** The first version went light grey in the home hero's studio rig (a key in front, a rim behind, a fill): the stock
  isotropic highlight of a dielectric at roughness 0.85 is a broad wash over every card that faces a key, and the strand lobes of three lights
  add up. Found by looking at the hero, not by a test. Now the stock highlight is cut to a fifth, the strand highlights of all the lights
  are summed and bounded by a soft shoulder (linear for the film's single sun, never above about 0.09), and each strand has its own tilt.
  Pictures: `evidence/hero_desktop_before_after.jpg`, `evidence/hero_mobile_before_after.jpg`.

### Coat (`components/3d/marwari-coat.ts`)

- A curvature measure on the welded coat mesh gives each vertex a cavity and a convexity value: **hollows take less light** (elbow, flank
  fold, between the legs, under the jaw, the nostril and the eye socket), and a **blue-black sky sheen** sits on the rounded masses (shoulder,
  barrel, hindquarters), strongest at a grazing view and on surfaces that face up.
- **The pale flap at the tail root is gone.** Triangles whose UVs land in an empty part of the baked normal map decoded to a normal pointing
  into the body and caught a bright reflection (it showed from behind as a ragged light wedge, in the old picture too). Where the map is empty
  the coat now uses the geometry's own normal.

### Ground contact (`components/stallion-film/ground-policy.ts`, `effects.ts`, `engine.ts`, `terrain.ts`)

- **The dark discs under the hooves are gone**: the soft contact blobs are drawn only when the quality tier has switched the sun's cast shadow
  off (a horse with no shadow at all would float). Otherwise the only shadow is the real one.
- **The floating grey puffs are gone**: the ambient dust system (up to 220 motes drifting 0.25 to 2.65 m above the ground) is removed. Dust now
  comes only from a hoof that strikes or leaves the ground: a few grains with a little sideways and backward speed, pulled down hard
  (3.4 m/s squared), clamped to the terrain (never below it, never more than 0.4 m above it), faded within a second.
- **Faint hoof prints** in the sand: a U-shaped trench with a darker floor and a pale frog, laid at each touchdown, fading over 14 s
  (desert 0.26, academy 0.20, village lane 0.10). The drawn ground is straight between vertices 1.25 m apart, so in a dune hollow it stands
  above the true height; each print is lifted by that clearance (it was half buried there).
- **Arena sand** has its own texture: broad drifts of drier and damper sand, scuffed tracks, a fine grain and the odd glinting grain (the fine
  terms fade with distance so they cannot shimmer).

### Quality tiers, reduced motion, fallbacks

- Hair tier 0 = every lock and the soft fringe pass (16,600 triangles), tier 1 = about two thirds in one pass (7,950), tier 2 = about a third
  (3,360). The film's frame-time governor sets the tier (its tiers 0 and 1 keep every lock, 2 maps to 1, 3 to 2), and **before any frame is
  timed** a weak device already starts lower: 2 cores or 2 GB, 4 cores or 4 GB, Data Saver, or a phone-sized coarse-pointer screen with up to
  6 cores. In the headless phone profile the film settles on its tier 2 and the hair on tier 1.
- **Reduced motion:** the hair's own movement (lag, flutter, tail lift) is one factor, `uMotion`, and it is 0 when the system setting is on (read
  live). The home film does not start at all under reduced motion; two frames of the home stage 1.6 s apart under the setting differ in 0 of
  1,296,000 pixels, with the setting off in 501,428.
- If the new hair throws while building, the exported ribbons are shown (caught in `marwari.ts`, logged as a warning).
- The static exhibit in `public/anatomy` switched hair layers by the old mesh name, which would have turned the exported ribbons back on over
  the new hair; it now drives the new locks and the ribbons only when they are showing.

## Tests

`tests/horse-realism.test.mjs`: 27 new checks, all in node without WebGL, on the geometry and the numbers: lock counts, rows and buffers at
every tier; locks lie on the neck and fall to the chosen side; roots hug the crest; end locks are shorter and finer; every lock tapers and is a
rounded card; weights are normalised; forelock count, length, spread and facing, and its geometric profile; tail root overlap and tip
separation, no kinks where the axis runs straight down; dock cap, taper and pelvis weights; tier mapping and the weak-device start; reduced
motion; the fallback; ground policy (no discs under a real shadow, no ambient dust, kicks are small and low at every speed, dust never above
the cap and gone within its life, prints faint, print clearance); the coat's normal-map guard; the hair shader's root fade; the exhibit's
layer switch. `npm test` was 133 passing on clean main and is 160 passing now.

## What was measured

All frame figures are from production builds (`next build` and `next start`): clean `origin/main` on port 3500 and this branch on port 3400,
the same pinned model files (`marwari-hero.glb`, `marwari-gaits.json` from main), Chrome for Testing (headless) on an Apple M2 through
Metal. Each scene: a 4.5 s warm-up, then 12 s sampled (about 740 frames); before and after were run one after the other, and a second
set in the opposite order. It is one Mac with other programs on it (the load average rose above 60 during the session) and the "phone"
is an emulated profile, not a phone, so these figures show the size of the change and not what a given phone will do.

**Frame rate: unchanged at the 60 Hz cap.** In the rounds when the machine was quiet both builds sit on the cap in every scene
(60 to 62.5 fps on desktop at pixel ratio 1 and 2 and on the phone profile with the CPU slowed 4x). When something else loaded the
machine, both builds dropped together (47 to 59 fps in one round), and two runs of the same build differ by more than the two builds
differ: the GPU median of one scene moves by 2.6 ms on average between rounds of the same build at desktop 1x (up to 5.1 ms),
1.4 ms at 2x and 0.8 ms on the phone profile.

The tail of the frame-time distribution is noisier than the median and does not move with the build: frames over 20 ms (of about 740),
averaged over the five scenes, before > after, by round: desktop 1x 4.6 > 7.2, 38 > 40, 3.6 > 25, 2.6 > 7.8 (the last run in the opposite
order); desktop 2x 18 > 8, 25 > 6; phone profile 29 > 12, 90 > 109, 12 > 12, 5 > 15. Higher after in every desktop 1x round, lower in
both 2x rounds, mixed on the phone profile.

**Cost of the new hair.** GPU time per frame (timer queries, median), after minus before, over every pair measured:
desktop 1x **+1.1 ms (15 pairs in 3 rounds, 13 positive, range -0.4 to +2.5)**; desktop 2x **+0.5 ms (9 pairs in 2 rounds, range -2.0 to +3.5)**; phone profile **+0.3 ms (15 pairs in 3 rounds, 12 positive, range -0.5 to +1.8)**. That is about a tenth of a 16.7 ms frame
at the top tier on desktop and a few percent on the phone profile (where the film runs its tier 2 and the hair its tier 1). Triangles per
frame rise by about 80,000 on desktop (the hair, 16,600 at the top tier, is drawn three times: the sun's shadow, the core pass and the
fringe pass) and by about 12,000 on the phone profile; draw calls change by -5 to +2.

The last round, per scene (`>` reads "before > after"):

**Desktop, 1440 x 900 at device pixel ratio 1**

| scene | frames per second | GPU ms per frame (median) | frames over 20 ms (of about 740) | draw calls | triangles |
|---|---|---|---|---|---|
| home hero (studio light) | 61.2 > 61.7 | 3.67 > 3.27 | 2 > 8 | 9 > 11 | 37,652 > 85,414 |
| desert, standing | 62.2 > 62.5 | 4.53 > 5.16 | 3 > 1 | 23 > 21 | 250,608 > 329,524 |
| desert, gallop 10 m/s | 62.4 > 54.6 | 5.5 > 5.21 | 4 > 32 | 19 > 21 | 251,350 > 330,292 |
| village, trot 3.4 m/s | 62.3 > 58.7 | 5.34 > 5.62 | 5 > 19 | 37 > 39 | 693,666 > 772,590 |
| horse field, canter 5.2 m/s | 62.3 > 56.5 | 4.96 > 6.82 | 4 > 63 | 33 > 35 | 562,064 > 640,988 |

**Desktop, 1440 x 900 at device pixel ratio 2 (canvas 2160 x 1350)**

| scene | frames per second | GPU ms per frame (median) | frames over 20 ms (of about 740) | draw calls | triangles |
|---|---|---|---|---|---|
| home hero (studio light) | 59.8 > 62.3 | 4.54 > 3.98 | 17 > 2 | 9 > 11 | 37,652 > 85,414 |
| desert, standing | 61.8 > 62.5 | 6.81 > 6.17 | 24 > 1 | 23 > 21 | 250,608 > 329,524 |
| desert, gallop 10 m/s | 56.6 > 61.6 | 9.12 > 7.09 | 56 > 7 | 19 > 21 | 251,350 > 330,274 |
| village, trot 3.4 m/s | 62 > 60.3 | 7.88 > 8.29 | 16 > 19 | 37 > 39 | 693,666 > 772,590 |
| horse field, canter 5.2 m/s | 59.1 > 62.5 | 7.4 > 66.81* | 13 > 0 | 33 > 35 | 561,560 > 640,988 |

**Phone profile, 390 x 844 at pixel ratio 3 (canvas 487 x 1055, film tier 2, hair tier 1), CPU slowed 4x**

| scene | frames per second | GPU ms per frame (median) | frames over 20 ms (of about 740) | draw calls | triangles |
|---|---|---|---|---|---|
| home hero (studio light) | 62.5 > 62 | 1.91 > 2.18 | 25 > 23 | 9 > 9 | 37,652 > 43,566 |
| desert, standing | 62.5 > 62.1 | 3.48 > 3.81 | 6 > 9 | 23 > 18 | 197,990 > 209,810 |
| desert, gallop 10 m/s | 62.3 > 62.5 | 3.84 > 4.06 | 11 > 7 | 19 > 18 | 199,338 > 211,154 |
| village, trot 3.4 m/s | 62.3 > 62.3 | 4.19 > 4.5 | 17 > 14 | 37 > 36 | 410,480 > 422,308 |
| horse field, canter 5.2 m/s | 62.2 > 62.4 | 4.64 > 5.4 | 2 > 5 | 33 > 32 | 281,848 > 293,676 |


(\* One timer-query artefact (66.8 ms in a scene that ran at 62.5 fps with no frame over 20 ms); it is left
out of the statistics. The raw files are in `evidence/perf/`.)

**Load time.** Building the hair geometry takes about 17 ms at the top tier (13 ms and 5 ms at the lower ones; node, this Mac). The
coat's curvature measure, which runs once at load, takes 21 ms on the real coat mesh (21,179 vertices) and 96 ms with the CPU slowed 4x.

**Ground contact** (canter at 5.2 m/s for 20 s; the highest grain of hoof dust above the terrain under it, and the most grains alive at once):

| place | before | after |
| --- | --- | --- |
| desert | 1.14 m, 60 grains | **4.3 cm**, 22 grains |
| horse field | 1.14 m, 48 grains | **3.1 cm**, 13 grains |

The cap is 0.4 m. The old ambient dust (a second system, up to 220 motes 0.25 to 2.65 m above the ground) is not in the "before" figures
and is gone. Pictures: `evidence/dust_strip_before_desert.jpg`, `evidence/dust_strip_after_desert.jpg`.

**Reduced motion.** With the setting on, the home stage is completely still (two frames 1.6 s apart differ in 0 of 1,296,000 pixels; with
the setting off, in 501,428), the film does not start, and the hair's movement factor is 0 wherever else the horse is drawn (unit test, read
live). With motion on, at a canter, the tail lags by up to 0.36 and lifts by up to 0.26 and the mane lags by up to 0.16 (mesh units, metres).

**Checks.** `npm test`: 160 pass, 0 fail (133 on clean main plus the 27 new ones in `tests/horse-realism.test.mjs`); `npm run lint`: 0 errors and 21 warnings that were already there (none in the files of this work); `npm run typecheck` and `npm run build` pass. The tests check the geometry and the numbers in node; how it looks is checked in the pictures below.

## Pictures

Before is clean `origin/main` (production build, port 3500), after is this branch (production build, port 3400), the same pinned model files,
Chrome for Testing on this Mac's GPU (Metal), noon light. 1440 x 900 for desktop, 390 x 844 at device pixel ratio 2 for the phone profile.
Per place and device: the mane, the tail, the hooves and the horse trotting; on desktop also the forelock (three-quarter and side, head-anchored
camera), the ears from the front, the eye and muzzle, and the shoulder.

| Sheet | Contents |
| --- | --- |
| `sheet_desert_desktop.jpg`, `sheet_village_desktop.jpg`, `sheet_field_desktop.jpg` | before (left) and after (right), eight views each |
| `sheet_desert_mobile.jpg`, `sheet_village_mobile.jpg`, `sheet_field_mobile.jpg` | before (top row) and after (bottom row), four views each |
| `before/`, `after/` | every frame as a JPEG (`<place>_<device>_<view>.jpg`) |
| `evidence/` | the home hero and the "Instrument" plate before and after, hoof dust strips, a hoof print, reduced motion, ground-contact numbers, the raw frame-rate files (`perf/`) |

## Still not right

- **Cards, not strands.** The hair is 170 + 110 + 13 tapered cards with a strand texture, not tens of thousands of strands. From a normal distance it reads as hair; close to the lens (the `mane` and `tail` frames on the phone profile) the locks still show as ribbons, and a real tail has far more than 110 strands.
- **The last locks at the withers.** The end of the mane, where the neck turns into the withers, still makes a small dark tab in some frames (the end of the crest in `sheet_field_desktop.jpg`). The locks there are shorter and finer than before, not gone.
- **The forelock** is a sparse fan of 13 short locks; a real Marwari's is often thicker. From the side it reads as one wedge, and in a still it can look blown forward off the brow (a 3 cm arch and no droop at the tip).
- **The dock** is a plain tube. With the tail carried high at a canter the joint between the tube and the start of the strands can show as a seam (`desert_desktop_trot_tail`).
- **Hoof prints and dust kicks are small on purpose, and easy to miss.** At the film's low angle the prints read as faint ovals; the U shape and the pale frog show only from a steeper angle (`evidence/hoof_print_after.jpg`). A kick is two to ten grains a few centimetres high: you see it in motion more than in a still (`evidence/dust_strip_after_desert.jpg`).
- **The coat's colour is still the baked, cloudy photo texture** (a little over half of it is kept, as before), so the blue-black sheen is subtle in the warm desert light and shows most in the academy and the village. The normal-map flap is fixed by a guard in the shader; the map itself still has empty regions and the mesh is unchanged.
- **First version of this work made the mane and tail light grey under the home hero's studio rig** (a rim light behind the horse and a key in front lit every strand at once). Found in review, fixed in the shader (the stock highlight is cut to a fifth, the strand highlights are summed and bounded, and every strand of the atlas is tilted on its own so the highlight is a scatter of glints), and checked in the hero on desktop and phone (`evidence/hero_*_before_after.jpg`). Other rigs (other hours of the day in the hero, the Instrument plate at its other poses) were looked at once, not reviewed pose by pose.
- **One Mac, noon only.** Frame rates are from an Apple M2 (Metal) in headless Chrome with other programs running, and the phone is an emulated profile (device pixel ratio 3, CPU 4x slower), not a real phone; nothing was run on a real device or on a slow GPU, where the hair's two passes cost more (that is what tiers 1 and 2 are for). The stills are all at the harness's fixed hour (noon); dawn and evening light were not reviewed.
- **Loading.** On this Mac the coat's curvature measure takes about 21 ms (96 ms with the CPU 4x slower) and building the hair geometry about 17 ms at the top tier (13 ms and 5 ms at the lower ones), once per load and again at a tier change; on a phone both will be several times slower.
- **Merging.** This branch is cut from `origin/main`. `feature/marwari-film-world` is 35 commits ahead and changes the same two source files (`components/3d/marwari.ts`, `components/stallion-film/engine.ts`) and the generated `public/anatomy/vendor/marwari/marwari.js` (regenerate it with `node scripts/build-anatomy-vendor.mjs`): expect conflicts there. The old hair file `marwari-hair.ts` is untouched here.

## Repeating it

```sh
# production builds of the clean checkout and this branch, on two ports
npm run build && npx next start -p 3400          # in each checkout (3500 for the clean one)
export PLAYWRIGHT_CORE=/path/to/node_modules/    # a directory that contains playwright-core
QA_BASE=http://localhost:3500 node tools/qa-marwari/realism/capture_before_after.mjs out/before <pinned assets> both
QA_BASE=http://localhost:3400 node tools/qa-marwari/realism/capture_before_after.mjs out/after  <pinned assets> both
python3 tools/qa-marwari/realism/pairs.py out/before out/after out/pairs
node tools/qa-marwari/perf.mjs desktop1 <pinned assets> out/perf/after-desktop1.json http://localhost:3400   # and before-..., 3500
python3 tools/qa-marwari/realism/summarize_perf.py out/perf
QA_BASE=http://localhost:3400 node tools/qa-marwari/realism/ground_contact.mjs out/dust <pinned assets> 1
```
