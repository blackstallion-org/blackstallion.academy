# Marwari realism, physics and cinematic world: report

Branch: `feature/marwari-film-world` (from `feature/marwari-3d-production`, commit `19ae6f9`) · date: 25 Oct 2026 · Blender 5.2.3 LTS, three.js r186, Apple M2.

Nothing is deployed, pushed or merged. The film is still behind `/?stallion=preview` (same flag as the hero stallion); without the flag the home page is unchanged.

**What this is.** The approved Marwari is untouched (same mesh, rig, ears, black coat, hero, gaze, hotspots). On top of it: a gait library authored from real stride data, a speed-driven locomotion controller with foot-contact sensing, three procedural places (Rajasthan desert, a Marwar village street, the academy), three story chapters wired into the existing home hero, and the adaptive-quality, reduced-motion and fallback paths around them.

**What this is not.** Not photorealistic: the places are stylised and procedural (no photographic scans), and the academy is an illustrative concept, labelled as such on the page. No real phone, Safari or Firefox was available; mobile numbers are the mobile *profile* measured on the Mac.

Status words: **Verified** = built and checked with the evidence named · **Implemented** = built, not independently checked · **Partial** · **Not implemented**.

## 1. Preserved (checked after the changes)

| Item | Result | Evidence |
| --- | --- | --- |
| Hero stallion (gaze, tilt, drag, click-to-dolly, time-of-day light, reduced motion, no-WebGL poster) | Verified | 1440 reduced-motion capture at 12:00 (`docs/qa/film/reduced_motion_noon.png`); no-WebGL capture (`no_webgl_1440.png`). The hero is *amber* at dawn by design (light follows the local hour), which looked like a colour regression at 05:00 and is not one |
| Home "Presence / Connection / Movement" 32-frame sequence | Verified | `docs/qa/film/sequence_now.png` vs `baseline/sequence_desktop_2.png` |
| Instrument 3D plate: hotspots, fly-to, region glow, 2D/3D switch | Verified | `plate_after_2.png` (Hoof focus), 0 console errors |
| Routes, nav, existing sections | Verified | `npm run build` (all routes), 84/84 `npm test` |

## 2. Layers and phases

| Layer | What was built | Status | Evidence |
| --- | --- | --- | --- |
| 0 Audit / preserve | Rig audit (`rig_audit.py`), reach probe (`reach_probe.py`); changes are additive layers that are undone each frame before the mixer runs | Verified | scripts run; hero identical with the film off |
| 1 Realism | Physical coat material with a subtle dark sheen; hooves glossier, muzzle matte, hair-scale roughness variation (rest-pose space, distance-faded); wet cornea (clear coat); film-only coat grade toward true black under warm light; ear flicks, breathing depth coupled to effort, tail swish, head noise (`life.ts`) | Partial | captures `horse_side_graded.png`, `m_campus_t31.png`. **Not done:** nostril flare (the mesh has no nostril rig or morph targets; `LifeLayer.flare` is computed, not shown), normal-map micro-bump |
| 2 Rig audit | IK reach measured against the rig; strides fitted to what the rig can reach; stance sweep = stride × duty so planted hooves are world-fixed | Partial | table in §3. **Not done:** a systematic deformation test at every joint extreme (checked visually in gallop and sprint only) |
| 3 Locomotion | Speed-driven controller: walk / trot / canter / gallop / sprint blended by speed band, lead follows turn direction, acceleration limited (`v(t+dt) = clamp(v + a·dt, 0, target)`), stride frequency from `f = v / L`; Stop and Alert layers; effort-coupled breathing that recovers over ~16 s | Verified (numbers in §3) | `locomotion.ts`, in-page runner `qaRun` |
| 4 Gallop physics | Transverse gallop footfall (LH RH LF RF) with suspension; hoof contact sensed from the skeleton; touchdown/lift-off events; root follows terrain with ground look-ahead and a penetration correction; tail and mane as damped springs driven by acceleration and wind | Verified | §3 |
| 5 Desert | GPU dune field with wind ripples, two terrain tiles, tufts, shrubs, khejri trees, buttes, hoof prints, dust per footfall, S-curve track, golden-hour atmosphere | Verified | `desert_idle.png`, `desert_gallop_side.png`, `horse_side_graded.png` |
| 6 Village | Lime-washed havelis (jharokha, chhatris, merlons, arched doors and windows), cottages with verandahs, round huts, compound walls, a sandstone gateway (pol), a paved square with a banyan on a platform and a well, street props, neem trees; the street repeats along z so it never ends | Verified | `village_t4.png`, `village_t16.png`, `village_t27.png` |
| 7 Academy | Sand arena with raked surface and dark-timber fence, dressage letters, jumps and cavaletti, arcaded stable block, sandstone hall, entry portal with the name board, avenue of neem trees, lamps, hedges, distant hills | Verified; **illustrative, not a survey of a real facility** (the chapter label says so) | `campus_t14.png`, `campus_t19.png`, `campus_t31.png`, `campus_portal.png` |
| 8 Story | I Heritage: idle, attention, walk, trot, canter, gallop, sprint, loop. II Identity: trot slowing to a walk through the gate to the square. III Excellence: trot, canter in the oval, deceleration to a halt, attentive stand, head turns to the camera | Verified | frames above; `m_campus_t31.png` |
| 9 Rendering, performance | Adaptive quality tiers, lazy environment chunks, instanced scatter by cell, pooled dust, phone geometry LOD, camera never enters buildings (`avoidCamera`), synthesized hoofbeats tied to the site sound toggle | Verified (measured on the Mac) | §4 |
| 10 QA | Lint (0 errors in changed code), typecheck, build, 84/84 tests, axe on the film section (0 violations), keyboard, reduced motion, no-WebGL, 390 and 1440 captures | Verified except as listed in §5 | §4–5 |

## 3. Locomotion, measured

Authored in Blender (`tools/blender/03_animation/stage11_gaits.py`: planar IK on the rig, footfall and duty tables after Hildebrand 1977 and Biancardi & Minetti 2012). Measured at run time in the browser with `window.__stallionFilm.qaRun(...)` (120 Hz simulation, settled speed only), desert terrain.

| Gait | Speed | Stride | Frequency | Authored suspension | Measured suspension (hooves > 4 cm) | Foot-slip RMS inside authored stance | Max hoof sink before correction | Footfall order measured |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Walk | 1.44 m/s | 1.44 m | 1.04 Hz | 0 | 0 | 0.20 m/s (14 % of speed) | 1.1 cm | HL FL HR FR |
| Trot | 3.33 m/s | 2.50 m | 1.34 Hz | 24 % | 18 % | 0.37 m/s (11 %) | 1.5 cm | diagonal pairs |
| Canter | 4.83 m/s | 2.90 m | 1.66 Hz | 22 % | 18 % | 0.61 m/s (13 %) | 1.5 cm | HL, FL+HR, FR |
| Gallop | 10.0 m/s | 4.20 m | 2.38 Hz | 35 % | 30 % | 1.37 m/s (14 %) | 1.8 cm | HL HR FL FR |
| Sprint | 12.0 m/s | 4.56 m | 2.63 Hz | 39 % | 41 % | 1.89 m/s (16 %) | 3.3 cm | HL HR FL FR |

- `v = L × f` holds by construction (frequency follows from speed and stride); measured touchdown intervals agree within 4 %.
- Stride lengths are shorter and frequencies higher than free-running horses: the rig's reach caps the stride (reach probe, IK error 7–12 cm at stance extremes), so strides are fitted to the rig.
- **Foot slip is not zero.** About 14 % of ground speed (RMS) inside the stance window; at gallop that is on the order of 10 cm of skid per stance, mostly the hind limbs, from the IK reach error. It is hidden by dust at speed and visible only in slow frame-by-frame inspection. A runtime foot-lock would remove it and is not built.
- Hoof penetration: the root follows terrain with a look-ahead and a contact correction; the correction averages under 1.1 mm per frame, and the lowest toe while in contact is −3 mm. Before this fix the sink was 7–14 cm at gallop and sprint.
- Gait changes were run through the full ladder (stand, walk, trot, canter, gallop, sprint, and back down to a stop): every step settled on the expected gait within 0.06 m/s of its target, and no hoof sank more than 2.7 cm before correction.
- The suspension numbers differ from the authored ones because the sensor uses a 4 cm toe threshold; they agree within 6 percentage points.

### 3b. Runtime foot-lock (second pass, 25 Oct)

`components/stallion-film/footlock.ts` anchors each hoof where its toe first reaches the ground, then solves the leg back
to that point (damped iterative solve, hinge joints about the body's lateral axis, limited abduction at the top joint,
hoof kept flat). It is removed before the mixer runs, like the other additive layers.

Two changes to the gait data were needed first:

- **Landing kinematics** (`stage11_gaits.py`, `RETRACT` 0.3 → 1.0): the swing now ends moving backward at the stance speed,
  so a hoof lands with no ground speed. Touchdown toe speed before the lock acts: walk 1.74 → 0.26 m/s, gallop 1.55 → 0.83
  m/s, sprint 2.16 → 1.48 m/s. Hero, mobile and anatomy GLBs and `marwari-gaits.json` re-exported.
- **Ground contact**: the lock anchors only once the toe is below 4 cm (the sensor's own contact threshold), because the
  stance phase can begin while the hoof is still in the air.

Measured in the browser on the desert scene, five settled speeds, three repeats, lock on vs off. Slip is now counted only
while a hoof is on the ground:

| Gait | Speed | Ground slip, lock off | Ground slip, lock on | Stances fully held | Notes |
| --- | --- | --- | --- | --- | --- |
| Walk | 1.44 m/s | 13 / 14 / 14 % | 4 / **31** / **28** % | 14 / 15 / 14 | front-left, late stance: 12 frames per run released (see below) |
| Trot | 3.33 m/s | 11 / 11 / 11 % | 4 / 4 / 4 % | 28 / 28 / 28 | 0 never engaged |
| Canter | 4.83 m/s | 12 / 12 / 12 % | 5 / 6 / 6 % | 33 / 33 / 33 | 0 never engaged |
| Gallop | 10 m/s | 11–12 % | 8 / 8 / 8 % | 46–53 | 1 stance per run never touches the ground |
| Sprint | 12 m/s | 12 % | 9 / 9 / 9 % | 17–18 | 7–10 stances per run never touch the ground (see below) |

- **Every stance was checked** (`qaRun`: `lock.stances`, `fullyLocked`, `neverEngaged`, `midUnlocked`): no unlocked frame in
  the middle of any stance except the walk front-left releases.
- **Residual** (toe to anchor, mid-stance): mean ≤ 3 mm at every gait; max 4 mm except the walk release (36 mm).
- **Walk front-left late stance is out of reach.** The authored stance sweeps the hoof back about 0.95 m. In the last third
  of the stance the joints reach their limits, the toe is pulled up by up to 20 cm (before the fix below), and it sits
  apart from its anchor by up to 16 cm. A reach clamp did not help (the limit is the joint, not the length). The lock now
  fades out when a leg's residual exceeds 2 cm and fades back in over 250 ms. That removes the lift but gives the sliding
  shown above (28–31 % in two of three runs). **This needs gait re-authoring** (shorter front sweep at walk, or more
  shoulder reach), not more lock tuning.
- **Sprint and some gallop stances never touch the ground** inside the authored stance: the toe reaches 1–3 cm above the
  ground through the stance and lands only in its last frame or two, so there is nothing to hold. Their hover is the
  same gait-authoring issue. Floating feet of this size are still present on those stances.
- **Cost**: `footLock.apply` takes 0.05 ms per frame on the quiet Mac of 25 Oct; 0.13 ms in the contended session below.

Not verified: the walk release on a phone, and any visual judgement of the lock by eye (the numbers above are the only
evidence). The measurement session on 25 Oct ran under load average 5–8 (iCloud Drive, WindowServer, Chrome, the IDE):
the page rendered at 1080×675 and was capped near 30 fps, so the figures in §4 are not a clean re-measure.

## 4. Performance (measured, not estimated)

Method: Chromium driven by Playwright, `renderer.info`, `EXT_disjoint_timer_query_webgl2` for GPU time per frame (this includes the shadow pass). Device: Apple M2 (ANGLE Metal). Frame rate is capped at 60 fps by the display, so the GPU times are the real headroom indicator.

**Desktop, 1440 × 900, quality tier 0, full-resolution hero model**

| Place | fps | p95 frame | GPU p50 / p95 | Draw calls | Triangles (last frame, with shadows) | JS heap |
| --- | --- | --- | --- | --- | --- | --- |
| Desert | 60 | 18.6 ms | 6.0 / 11.0 ms | 19 | 251k | 45 MB |
| Village | 60 | 18.6 ms | 5.9 / 8.0 ms | 37 | 708k | 46 MB |
| Academy | 60 | 18.6 ms | 5.3 / 10.8 ms | 32 | 653k | 50 MB |

**Mobile profile measured on the same Mac, 390 × 844, phone model (`marwari-hero-mobile.glb`), quality tier 2, geometry LOD 0.5** (not a phone)

| Place | fps | p95 frame | GPU p50 / p95 | Draw calls | Triangles | JS heap |
| --- | --- | --- | --- | --- | --- | --- |
| Desert | 60 | 18.5 ms | 4.0 / 4.1 ms | 19 | 199k | 41 MB |
| Village | 60 | 18.6 ms | 4.5 / 4.6 ms | 37 | 414k (693k before the LOD pass) | 41 MB |
| Academy | 60 | 18.6 ms | 5.1 / 5.2 ms | 33 | 321k (972k before the LOD pass) | 59 MB |

**Download**: phone hero GLB 612 KB, desktop 1.26 MB, gait table 1 KB, Draco decoder 73 KB; the film engine and scenery are lazy chunks of about 120 KB minified, 44 KB gzip (production build), fetched only when the stage opens. Each place is fetched when its chapter is requested.

**Not measured:** load time on a throttled network, a real phone, battery, Safari. The adaptive tiers react to frame time, and the phone profile starts at tier 2, but the thresholds have not been tuned on hardware.

## 5. Tests and what was not covered

| Check | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | 0 errors in changed code; 34 errors remain in untracked, vendored `public/anatomy/vendor/*.js` (not touched) |
| `npm run build` | pass |
| `npm test` | 84 / 84 |
| axe-core 4 (WCAG 2 A/AA, 2.1 AA, best practice) on the film section | 0 violations. Text contrast over the live canvas cannot be computed by axe; the labels sit on the shade gradients |
| Keyboard | chapter buttons and "Skip the film" reachable in order, 2 px focus ring, Enter on a chapter plays the transition and lands in that place; skip scrolls past the film |
| Reduced motion | no pinning, no film; the still hero stays; the note is shown |
| No WebGL | engine not created, poster horse shown, no page errors |
| Console | 0 errors across the three chapters (after fixing a zero-gain audio ramp found in testing) |
| Sound | the hoofbeats start (context running, no errors); **not listened to**: headless browser |
| Real phone, Safari, Firefox | **not tested** |

## 6. Known defects and honest limits

- Places are stylised and low-poly up close (tree crowns, plaster); fine at the film's camera distances, not photographic.
- The camera avoids walls with a clamp, not path planning; a shot can look tight in the village gate at the 160 m repeat.
- Slip at gallop about 14 % (see §3); no foot-lock.
- The state machine is continuous (speed bands and layers), not a table of named states: "Deceleration" and "Recovery" are what the speed controller and the effort model produce, not separate clips.
- Nostril flare and micro-bump are not built.
- Sound is a synthesized placeholder, quiet by design; replace with recorded hoofbeats if the owner wants realism.
- QA hooks (`window.__stallionFilm`, `qaRun`, `qaPick`, `qaMuzzle` / `qaEye` shots) are available only outside production or with `?filmdebug=1`.

## 7. Rebuilding and re-testing

```
Blender -b --factory-startup -P tools/blender/03_animation/stage11_gaits.py -- in.blend out.blend gaits.json
Blender -b --factory-startup -P tools/blender/04_export/stage10_export.py   -- out.blend marwari-hero.glb 2048 1024
```
Hero `s9` input: `tools/blender/source/marwari_hero_source.blend` (now includes the gait clips). Copy `gaits.json` to `public/models/marwari-gaits.json`. In the browser: `/?stallion=preview&filmdebug=1`, then in the console `__stallionFilm.goTo(1|2|3)` and `__stallionFilm.qaRun([[speed, seconds], ...])`.

## 8. Files

New: `components/stallion-film/{engine,locomotion,life,shots,terrain,sky,effects,environment,textures,noise,hoofsound}.ts`, `components/stallion-film/scenery/{desert,village,campus,geo}.ts`, `public/models/marwari-gaits.json`, `tools/blender/03_animation/{stage11_gaits,reach_probe}.py`, `tools/blender/00_import_inspect/rig_audit.py`, `docs/qa/film/*`.

Changed: `components/3d/marwari.ts` (physical coat, face materials, film coat grade), `components/hero/StallionStage.tsx` (film hooks), `components/sections/home/StallionHero.tsx` (pinned film, chapter navigation, skip), `lib/audio/engine.ts` (`soundReady()`), `public/models/marwari-{hero,hero-mobile,anatomy}.glb` (new clips), `tools/blender/source/marwari_hero_source.blend`, `docs/MARWARI_3D_PRODUCTION_REPORT.md` (rebuild note), `PROGRESS.md`.
