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
| Walk | 1.44 m/s | 1.15 m | 1.25 Hz | 0 | 0 | 0.20 m/s (14 % of speed) | 1.1 cm | HL FL HR FR |
| Trot | 3.33 m/s | 2.50 m | 1.34 Hz | 24 % | 18 % | 0.37 m/s (11 %) | 1.5 cm | diagonal pairs |
| Canter | 4.83 m/s | 2.90 m | 1.66 Hz | 22 % | 18 % | 0.61 m/s (13 %) | 1.5 cm | HL, FL+HR, FR |
| Gallop | 10.0 m/s | 4.20 m | 2.38 Hz | 35 % | 30 % | 1.37 m/s (14 %) | 1.8 cm | HL HR FL FR |
| Sprint | 12.0 m/s | 4.56 m | 2.63 Hz | 39 % | 41 % | 1.89 m/s (16 %) | 3.3 cm | HL HR FL FR |

- `v = L × f` holds by construction (frequency follows from speed and stride); measured touchdown intervals agree within 4 %.
- The slip column is the first-pass figure with no foot-lock (all stance frames, including hooves still in the air). The ground-only figures with and without the lock are in §3b. The suspension, sink and footfall columns were measured on the first-pass clips and **were not repeated** after the gait re-authoring of 25 Oct (§3b); the walk row's stride and frequency are the new ones.
- Stride lengths are shorter and frequencies higher than free-running horses: the rig's reach caps the stride (reach probe, IK error 7–12 cm at stance extremes), so strides are fitted to the rig.
- **Foot slip is not zero.** In the first pass it was about 14 % of ground speed (RMS) inside the stance window, mostly the hind limbs, from the IK reach error. A runtime foot-lock (§3b) brought the on-ground figure to 3–9 % in the browser; it is not removed.
- Hoof penetration: the root follows terrain with a look-ahead and a contact correction; the correction averages under 1.1 mm per frame, and the lowest toe while in contact is −3 mm. Before this fix the sink was 7–14 cm at gallop and sprint.
- Gait changes were run through the full ladder (stand, walk, trot, canter, gallop, sprint, and back down to a stop): every step settled on the expected gait within 0.06 m/s of its target, and no hoof sank more than 2.7 cm before correction.
- The suspension numbers differ from the authored ones because the sensor uses a 4 cm toe threshold; they agree within 6 percentage points.

### 3b. Runtime foot-lock and gait re-authoring (second pass, 25 Oct)

`components/stallion-film/footlock.ts` anchors each hoof where its toe first reaches the ground, then solves the leg back
to that point (damped iterative solve, hinge joints about the body's lateral axis, limited abduction at the top joint,
hoof kept flat). It is removed before the mixer runs, like the other additive layers. Three changes to the gait data
(`stage11_gaits.py`) came with it; hero, mobile and anatomy GLBs and `marwari-gaits.json` were re-exported after each.

- **Landing kinematics** (`RETRACT` 0.3 → 1.0): the swing now ends moving backward at the stance speed, so a hoof lands
  with no ground speed. Touchdown toe speed before the lock acts: walk 1.74 → 0.26 m/s, gallop 1.55 → 0.83 m/s, sprint
  2.16 → 1.48 m/s.
- **Per-gait reach bias** (`auto_bias`): the old table of hand-set offsets for where the stance sits in the leg's reach is
  replaced by a search (−0.4 … +0.4 m, five stance samples) that picks the offset with the smallest worst-case two-bone
  reach error. Chosen offsets (front / hind, m): walk 0.02 / 0.14, trot −0.04 / 0.28, canter, gallop and sprint 0.00 / 0.28.
- **Shorter walk**: the rig cannot reach the old walk (stride 1.44 m, stance sweep 0.95 m; front-limb error 16 cm at the
  stance end). The walk is now stride 1.152 m at 1.25 Hz (was 1.44 m at 1.04 Hz), duty 0.55, sweep 0.63 m. Ground speed is
  unchanged (1.44 m/s). **It reads as a quicker, shorter-strided walk**, and a duty of 0.55 is at the low end of a real horse
  walk (0.60–0.70). That is a visible change; look at it before keeping it.
- **Ground contact**: the lock anchors only once the toe is below 4 cm (the sensor's own contact threshold), because the
  stance phase can begin while the hoof is still in the air. It ramps in over 30 ms and holds through the stance.

Authored stance sweeps still exceed the rig's low-error reach (about ±0.2 m front, −0.1 … +0.15 m hind) at every gait above
the walk. Worst reach error at the stance ends in the generator (cm, front / hind): walk 4.9 / 5.1, trot 5.8 / 8.0, canter
6.5 / 6.4–8.6, gallop 9.8–10.2 / 6.5–8.3, sprint 8.2–8.5 / 8.6–9.4. The lock hides most of this on the ground; it cannot
create reach the leg does not have.

Measured in the browser on the desert scene, five settled speeds, three repeats, lock off vs on. Slip is counted only while a
hoof is on the ground (toe below 4 cm) inside the middle of its authored stance (u 0.12–0.88):

| Gait | Speed | Ground slip, lock off | Ground slip, lock on | Stances never touching the ground (per run) |
| --- | --- | --- | --- | --- |
| Walk | 1.44 m/s | 14 / 15 / 14 % | 4 / 3 / **18** % | 0 (all 18 stances held in each run) |
| Trot | 3.33 m/s | 11 / 11 / 10 % | 4 / 3 / 3 % | 0 / 0 / 1 |
| Canter | 4.83 m/s | 12 / 12 / 12 % | 5 / 5 / 6 % | 0 |
| Gallop | 10 m/s | 11 / 11 / 11 % | 7 / 8 / 8 % | 4 / 0 / 1 |
| Sprint | 12 m/s | 12 / 12 / 12 % | 9 / 9 / 9 % | 4 / 5 / 3 (of 25–34 stances) |

- Compared with the first foot-lock result (same day, before the re-authoring) the walk no longer releases the front-left
  hoof in late stance (it was 31 / 28 % in two of three runs); the walk residual (toe to anchor, mid-stance) is at most 3 mm.
- **One walk run in ten is bad.** About one lock-on run in ten (one of three here, and one in an earlier variant) comes out at
  14–18 % instead of 3–4 %. It coincides with a high touchdown speed (about 1.9–2.0 m/s); the cause was not isolated. Eight
  alternating on/off harness runs afterwards all gave 3–4 % with the lock on.
- **Hover** (sole height above the ground mid-stance, u 0.2–0.8, from the Blender rig, first-pass clips → final clips; mean /
  95th percentile / frames over 2 cm / over 4 cm):

| Limb | First-pass clips | Final clips |
| --- | --- | --- |
| Sprint front | 1.4 / 5.0 cm / 20 % / 8 % | 0.8 / 2.6 cm / 11 % / 2 % |
| Sprint hind | 1.0 / 3.6 cm / 37 % / 2 % | 0.9 / 3.4 cm / 28 % / 1 % |
| Gallop front | 1.2 / 4.2 cm / 21 % / 5 % | 0.8 / 2.6 cm / 10 % / 0 % |
| Gallop hind | 0.4 / 2.6 cm / 11 % | 0.4 / 1.8 cm / 2 % |
| Canter front | 1.1 / 2.9 cm / 14 % / 1 % | 0.8 / 2.5 cm / 7 % / 2 % |
| Canter hind | 0.7 / 2.0 cm / 5 % | 0.3 / 1.7 cm / 1 % |
| Trot front | 0.7 / 2.8 cm / 8 % | 0.7 / 1.9 cm / 4 % |
| Walk front | 1.0 / 2.3 cm / 9 % | 0.8 / 2.0 cm / 5 % |
| Walk hind | 0.7 / 1.7 cm / 2 % | 1.0 / 2.1 cm / 7 % |

  The hoof's toe point sits 1.9 cm above the sole, so a grounded toe reads about 2 cm; the figures above already subtract that.
  The walk hind got slightly worse (2 % → 7 % of frames over 2 cm) when the stride was shortened.
- **A third variant was tried and rejected**: pre-compensating the authored sole height at the stance ends (`GAIT_PRECOMP=1`
  in the generator, off by default). It raised ground slip by 1–3 points and did not reduce the sprint hind hover, so the
  default stays off.
- **Cost**: `footLock.apply` takes 0.05 ms per frame on the quiet Mac of 25 Oct; 0.13 ms in a contended session.

**Still wrong at the end of this pass (items 1 and 2 are addressed in §3c):**

1. **Sprint and gallop stances that never touch the ground**: 3–5 of about 30 sprint stances per run, 0–4 at gallop. The toe
   stays 1–3 cm above the ground through the stance and lands only in its last frame or two, so there is nothing to hold.
2. **Sprint hind hover**: 28 % of mid-stance frames are more than 2 cm above the ground (1 % over 4 cm).
3. **Trot to sprint stride lengths are still beyond the rig's reach** (errors above); they were not shortened the way the
   walk was, because that would change the look of the faster gaits more than the walk. A rig change (longer reach at the
   shoulder and hip) is the proper fix.
4. **The walk is shorter and quicker than before** and its hind hover is a little higher.

Not verified: any gait on a phone, the lock by eye (the numbers above are the only evidence), and a clean performance
re-measure. The measurement session ran under load average 5–8 (iCloud Drive, WindowServer, Chrome, the IDE): the page
rendered at 1080×675 and was capped near 30 fps, so the figures in §4 predate the foot-lock and are not a clean re-measure.
Captures of the final walk and sprint: `docs/qa/film/gait_walk_r4.png`, `docs/qa/film/gait_sprint_r4.png`.

### 3c. Seating the hoof on the terrain (third pass, 25 Oct)

**The missed stances were not mainly the gait data.** Measured in the browser with the lock off and with the sideways-only lock of
§3b, over 20 s of settled running per gait (a stance "misses" when its toe never comes within the sensor's 4 cm contact height):

| Ground | Gait | Stances that miss (clip only / sideways lock) | Mid-stance frames with the sole over 4 cm up (clip only / sideways lock) |
| --- | --- | --- | --- |
| Flat (terrain replaced by a plane) | gallop / sprint, sideways lock only | 0 of 98 / 0 of 110 | 0 % / 0 % |
| Desert, straight | gallop | 0 of 124 / 0 of 124 | 0.8 % / 0.8 % |
| Desert, straight | sprint | 0 of 136 / 1 of 136 (12 of 110 over an earlier stretch of sand, 11 of them the right hind) | 2.0 % / 3.6 % |
| Campus, turning at 0.43 rad/s, body rolled 17° | gallop | 52 of 125 / 62 of 124 | 36.8 % / 49.3 % |
| Campus, turning at 0.43 rad/s, body rolled 17° | sprint | 69 of 137 / 68 of 136 | 49.8 % / 49.9 % |

Two causes. (1) The desert has ±3 cm of fine relief (`terrain.ts`, the 0.06 × noise term) while the root follows a smoothed
average of five samples, so a hoof landing in a trough hangs 2–5 cm above the sand and one on a crest sinks into it. (2) In a
banked turn the roll lifts the outside feet (they sit about 0.2 m from the roll axis; 17° of roll is up to 11 cm), and the
body-lift correction, which runs only when a hoof sinks, then raised the whole body to the lowest hoof and left the others
higher still. The lock of §3b pinned the toe only sideways, so it could not help with either.

**Change** (`footlock.ts`, `locomotion.ts`; no change to the clips or the GLBs):

- While a hoof is held, its toe is brought to the terrain height under the anchor plus 1.9 cm (the sole on the surface), blended
  in with the lock weight; at any moment the toe is kept out of the surface. A target beyond 97 % of the straight-leg reach is
  clamped as before, so a trough deeper than the leg can reach still leaves a gap.
- A hoof is anchored as soon as its stance begins and its toe is within 15 cm of the surface (was: toe within 4 cm), because the
  lock now draws it down. Trying 7 cm first gave less: engaging at the start of the stance gave lower hover in every case
  measured and lower slip in all but the campus sprint (3.8 → 4.6 %).
- `FootLock.seat = false` restores the §3b behaviour (QA comparison).

**Result**, same measurements with the seated lock (misses / over 4 cm / over 2 cm):

| Ground | Gait | Stances that miss | Sole over 2 cm up | Sole over 4 cm up |
| --- | --- | --- | --- | --- |
| Desert, straight | gallop | 0 of 124 | 0.4 % (clip only 5.2 %) | 0 % |
| Desert, straight | sprint | 0 of 137 | 1.7 % (clip only 25.2 %) | 0 % |
| Campus, turning | gallop | 0 of 123 | 15.7 % (clip only 44.7 %) | 6.2 % |
| Campus, turning | sprint | 0 of 137 | 21.2 % (clip only 49.9 %) | 11.2 % |

Full ladder (`qaRun`, ground slip with the lock on; three repeats on the desert, one on the village and campus; the lock-off
figures on the desert are 14 / 10.5 / 11.9 / 11.2 / 12 %):

| Gait | Desert | Village | Campus (turning) | Stances held on the desert |
| --- | --- | --- | --- | --- |
| Walk | 0.4 / 0.4 / 0.5 % | 0.6 % | 0.6 % | 29 / 29, 29 / 29, 28 / 28 |
| Trot | 2.3 / 2.6 / 2.7 % | 3.0 % | 2.7 % | 30 / 30, 29 / 30, 32 / 32 |
| Canter | 3.0 / 3.1 / 3.2 % | 3.2 % | 3.6 % | 39 / 40, 39 / 39, 37 / 37 |
| Gallop | 4.5 / 4.5 / 4.6 % | 4.4 % | 4.0 % | 85 / 85, 86 / 86, 88 / 88 |
| Sprint | 6.1 / 6.1 / 6.4 % | 5.9 % | 4.5 % | 95 / 95, 96 / 96, 95 / 95 |

- Stances that miss: 0 at every gait on every ground in these runs. The walk's occasional 14–18 % run did not appear in three
  repeats (0.4–0.5 %).
- Mid-stance residual (toe to its target) averages 0.2–1.5 mm on straight runs (4 mm in the campus turn); the largest single
  frame is 22 mm (canter). The largest joint offset the lock applies is 14–26° (joint limits 11–43°).
- A stance fully held means its weight was at 99 % or more for the middle of the stance. On the campus turning at 0.43 rad/s the
  lock lets go in about a third of those frames (gallop 57 of 85 stances fully held, sprint 71 of 96): the legs cannot reach
  their anchors against the roll, and the lock fades out rather than pull the toe up.
- Over the whole ladder (stand, walk, trot, canter, 8, 10, 12 m/s, and back down to a stop; 60 s), mid-stance frames with the
  sole more than 3 cm up fall from 8.7 % to 4.9 % on the desert and from 7.4 % to 4.4 % on the village; the largest body lift
  from the correction drops from 3.8 to 2.1 cm (desert). The largest single-frame toe movement while the lock holds is 42 mm vertical and
  93 mm horizontal (before: 34 and 81 mm); these occur at landings and lift-offs, not mid-stance, and were not traced further.
- Cost: `footLock.apply` 0.042 ms per frame at the sprint (lock off 0.006 ms), measured on a lightly loaded machine.

**Open after this pass**

- Banked turns left hover and let-go (campus sprint 21 % of mid-stance frames over 2 cm, 11 % over 4 cm; the lock let go in about
  a third of mid-stance frames); fixed in §3f, apart from what is listed there.
- A hoof can still sink up to about 0.4–0.8 cm at a steady gait and up to 2 cm in gait changes (the sensor treats the toe point,
  not the sole, as the contact point for the body-lift correction).
- The authored clips are unchanged: in Blender the sprint hind still hovers over 2 cm in 28 % of mid-stance frames on flat
  ground; the lock now closes that gap at run time, but any viewer that plays the clips without it (the anatomy plate) sees it.
- The walk's swing was too fast (peak 10 m/s); fixed in §3d.
- Not tested: a phone, a clean performance run, the production build (not re-run for this change), and any by-eye judgement
  beyond one frame (`docs/qa/film/gait_sprint_terrain_seat.png`).

### 3d. Walk swing speed (fourth pass, 25 Oct)

**Correction to §3c.** There I wrote that a real walk's hoof peaks at 3–4 m/s. That is the **average** swing speed, not the
peak. A hoof that advances one stride (1.15 m) in one swing (0.36 s at duty 0.55) averages 3.2 m/s over the ground, and starting
and ending at rest it cannot peak below 1.5 × that, about 4.8 m/s. A real walk is the same arithmetic (stride about 1.6–1.8 m,
swing about 0.4 s, mean about 4 m/s). The target for this pass was therefore a peak close to 4.8 m/s and a median near the mean.

**Cause of the 10 m/s peak** (`stage11_gaits.py` now reports `toeSwingPeakMps`, `toeSwingMeanMps`, `toeSwingMaxHeightM` per clip):
the fetlock path itself is the smooth 4.8 m/s profile. The extra 5 m/s was the pastern and hoof unfolding into the landing, which
swings the toe point forward and down (up to 5 m/s vertically over 33 ms) just where the fetlock is also moving, and a 17 cm lift
plus the fold carried the toe to 35 cm above the ground, high for a walk.

**Change** (Walk only; `foldScale` 0.2 scales the swing's fold, the breakover heel lift of the stance still runs into the swing
start; `lift` 17 / 14 cm → 12 / 10 cm). Generator values, front and hind limbs together:

| Setting | Toe swing peak | Toe height at the top of the swing |
| --- | --- | --- |
| Before (fold 1.0, lift 17 / 14 cm) | 9.4 m/s | 35 cm |
| Fold 0.5, lift 11 / 9 cm | 7.6 m/s | 8 cm |
| Fold 0.3, lift 12 / 10 cm | 6.35 m/s | 10 cm |
| **Fold 0.2, lift 12 / 10 cm (used)** | **5.7 m/s** | **11 cm** |
| Fold 0.1, lift 12 / 10 cm | 5.1 m/s | 11 cm |
| Fold 0 (hoof held rigid), lift 11 / 9 cm | 4.8 m/s | 13 cm |

The fold 0.5 and fold 0 rows were run with the first version of the scaling, which also scaled the stance's heel lift; the others
use the final version.

Measured in the browser (120 Hz, desert, 1.44 m/s, planar toe speed through the swing, lock on or off): peak **5.7 m/s** (was
10.0), 99th percentile 5.7, median 3.9 (was 4.2); the toe tops out 11–12 cm above the ground (was 35). Trot, canter, gallop and
sprint have identical keyframe data to before (browser peaks 12.7, 17 and 26.9 m/s for trot, canter and gallop; the sprint was not measured here).

Walk with the lock on, three repeats on the desert: ground slip 0.9 / 0.6 / 0.7 % (0.4–0.5 % before this pass), stances held
27 of 29, 28 of 28, 29 of 29 (the two stances not fully held in the first repeat: 18 of 1016 mid-stance frames), 0 stances miss
the ground, mid-stance residual 0.3–0.7 mm mean and 15 mm at most, joint offset up to 26°. Mid-stance sole height over 2 cm: 0 %
with the lock (clip alone 9.5 %), 0 % on the campus turn (2.9 %). Trot to sprint slip in the same run: trot 2.8–3.6 % (2.3–2.7 %
in §3c), canter 3.2–3.5 %, gallop 4.3–4.7 %, sprint 6.0–6.1 %; those clips are unchanged, so the trot difference is where on the
sand the run happened, not the walk change. One frame of the new walk: `docs/qa/film/gait_walk_r6.png`.

**Still true after this pass:** the other gaits kept the same style of fold; trot and canter are fixed in §3e. Gallop and sprint
are not: their swing peaks are 24.8–25.2 and 28.6–29.1 m/s against floors of about 19 and 22 m/s, and their toes reach 88 and 95 cm.

### 3e. Trot and canter swings (fifth pass, 25 Oct)

Same fix as the walk (`foldScale` 0.2) applied to the Trot and Canter (both leads); the lifts are **unchanged** (trot 26 / 20 cm,
canter 34 / 28 cm). Trimming the lifts as well, as for the walk, only lowered the toe further (16–20 cm at the trot against 21–22 cm) without
reducing the peak, because the fold, not the lift, had carried the toe to 54 and 72 cm.

Generator, front and hind limbs together (floor = 1.5 × the mean swing speed for the authored stride and duty):

| Clip | Floor | Fold 1.0 (before) | Fold 0.5 | Fold 0.4 | Fold 0.3 | Fold 0.25 | Fold 0.2 (used) | Toe height, before → used |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trot | 8.1 m/s | 11.7 | 11.2 (lifts also trimmed) | 10.6 | 9.9 | 9.5 | **9.2** | 54 → 22 cm |
| Canter R / L | 10–11 m/s | 13.9 / 14.3 | 14.7 / 14.9 (lifts also trimmed) | 13.9 / 14.1 | 12.8 / 12.9 | 12.3 / 12.4 | **11.7 / 11.8** | 72 → 30 cm |

Measured in the browser (120 Hz, desert, planar toe speed through the swing, lock on or off give the same figures to 0.1 m/s):

| Gait | Peak before → now | Median before → now | Toe height before → now |
| --- | --- | --- | --- |
| Trot | 12.8 → 9.3 m/s | 6.7 → 6.3 m/s | 55 → 22 cm |
| Canter | 17.0 → 12.0 m/s | 8.3 → 8.0 m/s | 74 → 31 cm |
| Gallop (not changed; clip only) | 25.2 → 25.2 m/s | 14.7 → 14.7 m/s | 89 → 89 cm |

Ladder with the seated lock, three repeats on the desert (the walk, gallop and sprint clips are the same as in §3d):

| Gait | Ground slip | Stances held | Stances that miss | Mid-stance residual mean / max |
| --- | --- | --- | --- | --- |
| Trot | 3.5 / 3.0 / 2.6 % (2.8–3.6 % in §3d) | 30 of 32, 30 of 30, 29 of 30 | 0 | 1.3–1.6 mm / 25 mm |
| Canter | 3.7 / 3.6 / 3.0 % (3.2–3.5 %) | 38 of 38, 39 of 39, 39 of 39 | 0 | 1.4–1.6 mm / 16 mm |

The trot's unheld stances (22 and 13 of about 700 mid-stance frames) are frames where a joint reached its limit (offset 25.8°). Mid-stance
sole height over 2 cm, desert: trot 0.5 %, canter 0.3 %; campus turn: trot 0 %, canter 0.2 %. One frame of the new trot:
`docs/qa/film/gait_trot_r7.png`. Only Trot and Canter_R/L changed in `marwari-gaits.json` and in the clips.

**Flight phase is shorter than the clips author, and the seated lock shortens it further.** Measured as the fraction of time all four
toes are at least 4 cm up (runs of 9–14 s each, desert; the second figure for the seated lock is a repeat):

| Gait | Authored (stance windows) | First-pass clips, no lock | Clips now, no lock | Sideways-only lock | Seated lock |
| --- | --- | --- | --- | --- | --- |
| Trot | 24 % | 18 % | 15–16 % | 13.8 % | 10–11 % |
| Canter | 22 % | 18 % | 16 % | 15.5 % | 14–16 % |
| Gallop | 35 % | 30 % | 30–31 % | 31 % | 28–29 % |
| Sprint | 39 % | 41 % | 37–39 % | 36.8 % | 32–34 % |

The seated lock brings each hoof down as soon as its stance starts (within 15 cm), so the sensed flight is 3–5 points shorter than with
the sideways-only lock. The trot, which loses about a third of its flight against the clip, is the visible case. I tried releasing the seating
over the last 12 % of each stance (so the toe leaves when the clip lifts it): the flight phase did not change, and the campus turn got worse
(13 of 124 gallop stances missing the ground, against 0), so it was reverted.

### 3f. Banked turns (sixth pass, 26 Oct)

**Correction (27 Oct, see §3h).** The paragraph that stood here said the campus film corners hard at trot and canter (1.47 rad/s at
3.4 m/s, 16° of roll). That was wrong. Those figures came from QA runs that started the horse wherever the previous run left it,
off the path, so it circled at the yaw limit. Run from the gate with the director's speeds, the film's worst turn is a canter at
0.61 rad/s with 10.8° of roll, and the trot never exceeds 0.11 rad/s. The changes below are still right for the cases they were
measured on (forced constant-yaw circles, and anything that turns hard), but the "campus path" table is a robustness result, not
what the film shows. What the film does show is in §3h.

**What the harness measured as "the campus path".** At 3.4 m/s the yaw rate was 1.47 rad/s (a radius of 2.3 m) with the body
rolled 16°, for 43 % of the time; at 5.2 m/s the whole run was 1.0 rad/s at 16.7° (`goTo(3)`, 90 s per speed, 120 Hz, "corner" =
yaw rate above 0.8 rad/s), and forced constant-yaw circles on the desert.

**What was wrong, in order of size** (traced per limb with `footLock.debug` and a new `err` readout of the toe's miss in the
body's lateral, up and forward axes):

1. **The safety fade judged the draw-in.** The lock fades itself out when a leg's toe is more than 2 cm from its target. The first
   30 ms of a stance (the hoof coming down from 5–15 cm) and a push out of the surface always exceed that, so the weight was cut
   before the stance had begun: 24–53 % of mid-stance frames were unlocked in the turns measured.
2. **The outside forefoot ran out of sideways reach.** In a hairpin the body yaws 24° across one trot stance, so a planted forefoot
   moves about 30 cm sideways relative to the shoulder (an estimate from the yaw and the 0.8 m of reach ahead of the body's centre). The shoulder and hip abduction limit was 13° (0.22 rad), and the error in
   late stance was 4–7 cm sideways.
3. **The roll lifts the outside feet and sinks the inside ones** (about 4 cm each at 16°), and the outside legs, already near full
   stretch, could not reach down.

**Changes** (`footlock.ts`, `locomotion.ts`; no asset changes):

- The residual is not held against a leg during a push-up alone or for the first 60 ms of a stance (`SAFE_AFTER_S`); the seating takes
  hold over 15 ms (`SEAT_RAMP_S`) while the sideways hold keeps 30 ms.
- The give-up residual is 6 cm (was 2 cm): a hoof held 2–6 cm off its anchor by a straight leg beats one let go to slide.
- Shoulder abduction limit 0.22 → 0.45 rad (26°), hip 0.22 → 0.40 (23°).
- The body drops 0.15 m per unit of sin(bank) in a turn (4 cm at 16°; `Locomotor.bankDrop`), so the outside legs have less to reach.

**Result on the off-path campus runs** (committed code → now):

| Run | Slip | Mid-stance frames unlocked | Sole over 2 cm / over 4 cm up | Stances that miss the ground |
| --- | --- | --- | --- | --- |
| Trot 3.4 m/s, corners (4323 frames) | 5.6 → 4.4 % | 48.8 → 0.0 % | 24.8 / 9.4 → 23.3 / 0.0 % | 0 of 196 → **45 of 196** |
| Trot, straights (5757 frames) | 3.0 → 3.1 % | 0 → 0 % | 0 → 0 % | 0 → 0 |
| Canter 5.2 m/s, all corners (10080 frames) | 5.2 → 4.4 % | 52.6 → 0.0 % | 24.9 / 7.6 → 7.1 / 0.0 % | 0 of 603 → 0 of 604 |

The trot corner trades the lock letting go for a hoof that stays 2–3 cm up: the outside forefoot is held where it landed but the leg
cannot stretch to the ground (a leg abducted 25° is 10 % shorter vertically). 23 % of trot-corner stances never come within the
sensor's 4 cm contact height; none is more than 4 cm up, and none slides.

**Forced hairpins on the desert** (constant yaw limit, 18 s; the walk and trot at 1.5 rad/s, the canter at 1.08):

| Gait | Slip, abduction 13° / 26° | Unlocked, 13° / 26° | Mid-stance sole over 2 cm, 26° |
| --- | --- | --- | --- |
| Walk | 62 % / 1.9–9.5 % | 25–27 / 2–3 % | 25–30 % |
| Trot | 17–19 % / 3.5–4.3 % | 5–7 / 0 % | 21–22 % |
| Canter | 4.6–5.3 % / 4.5–4.6 % | 0 / 0 % | 6–10 % |

(The walk at 1.5 rad/s is a pirouette, not a walk anyone films; it is there because the same joints do the work.)

**Gallop and sprint in constant-yaw turns** (desert, 20 s each way; the film never turns these gaits, so this is a robustness
check). Committed code → now, `dt` = 1/120:

| Turn | Gait | Sole over 2 / 4 cm | Unlocked | Stances held (all frames) | Slip |
| --- | --- | --- | --- | --- | --- |
| Left, roll 14–19° | Gallop | 16.3 / 6.2 → 3.6 / 0.1 % | 39 → 0 % | 81 of 136 → 124 of 124 | 3.9 → 4.7 % |
| Left | Sprint | 21.6 / 10.4 → 6.0 / 0.7 % | 29 → 0 % | 116 of 148 → 137 of 137 | 4.5 → 5.4 % |
| Right, roll 16–18° | Gallop | 31.4 / 9.3 → 1.2 / 0.0 % (16 stances missed → 0) | 28 → 0 % | 105 of 137 → 124 of 124 | 7.1 → 7.6 % |
| Right | Sprint | 36.1 / 14.3 → 2.9 / 0.3 % | 31 → 0 % | 112 of 149 → 136 of 136 | 8.8 → 9.8 % |

At the real 60 fps step (`dt` 1/60) the lock holds every stance in the same runs (unlocked 0 %); hover is higher (left sprint 11.5 / 1.4 %,
right sprint 4.9 / 0.3 %) and slip is 5.1–11.0 %. Straight runs, desert ladder, three repeats: every stance held, slip walk 0.4–0.5,
trot 2.5–2.8, canter 2.7–2.8, gallop 4.5–4.8, sprint 6.3–6.5 % (as in §3e). `footLock.apply` costs 0.075 ms per frame at the sprint
(0.042 before; the machine was under load average 15–20). One frame in a hairpin trot corner: `docs/qa/film/gait_trot_corner_r8.png`.

**Tried and not kept**

- A larger body drop (0.22, 0.30): the outside forefoot reaches, the inside one (which must flex further) fails; with the abduction
  limit at 13° no drop between 0.05 and 0.30 worked at the trot.
- Lowering the lean (gain 0.6 → 0.45 or 0.3): less hover, but it halves the visible lean; kept at 0.6.
- Weighting the solve toward the proximal joints (the pastern sits at its 26° limit through a banked stance): the inside hind
  went from 37 % unlocked to 100 %.
- Faster sideways hold (12–20 ms instead of 30): slip falls (straight sprint 6.4 → 2.2–4.1 %; right-turn sprint 9.6 → 5.4–8.3 %), but
  the largest single-frame toe step while held rises from 33–41 mm to 54–61 mm, which at 60 fps is a visible snap. Not adopted; it is
  the lever to pull if the right-turn slip below matters.

**Still open**

- **(Fixed in §3g.)** **Right turns slip more than left** (gallop 7.6 vs 4.7 %, sprint 9.8 vs 5.4 %), almost all in the first 40 % of the stance of the
  right hind (26 % early slip against 9 % for the left). The rig's rest pose is asymmetric: the right hind fetlock rests 16 cm ahead
  of the left and 13 cm closer to the midline (cannon tails at y 0.397 / 0.561, x −0.084 / +0.215), and the generator centres each
  stance on that leg's own rest position with one reach bias computed on the left side. Centring both sides on a common line (and a
  per-side bias) is the likely fix; it changes every gait's hind placement, so it needs a regeneration and a look.
- Trot corners: 23 % of stances 2–3 cm up (see above). Walk and trot hairpins leave the outside forefoot 2 cm up for 20–30 % of the
  stance.
- Hover and slip were measured on the desert and the campus path; the village has no turns at speed.
- Not done: phone, production build, an eye on the new leg splay beyond one frame.

### 3g. Left-right symmetry (seventh pass, 26 Oct)

**Cause.** The generator centred every stance window on that leg's own rest fetlock and computed one reach offset on the left side
only. The rig's rest pose is asymmetric (cannon tails, body frame, y toward the tail): hind 0.561 (left) / 0.397 (right), fore
−0.600 / −0.626. With the sprint's offset of 0.28 m the two hind stances sat at y 0.281 and 0.117, 16 cm apart, and the right
hind was solved with an offset searched for the left. Measured at the sprint's hind sweep (0.919 m), the best offsets on each
leg's own centre were 0.28 (left, 4.7 cm worst reach error) and 0.14 (right, 2.4 cm).

**Change** (`tools/blender/03_animation/stage11_gaits.py`): each pair is centred on the mean of its two rest positions
(`STANCE_FET`; `GAIT_SYM=0` restores the old centres), and `auto_bias(kind, sweep)` searches one offset for both sides, the one that
minimises the worse side with the other as a tie-breaker. I did not use a different offset per side: it would put the two stance
windows apart again, which is the asymmetry. On the common centre the two sides' best offsets are within 2 cm of each other
(sprint 0.20 left, 0.22 right) and the shared offset costs the worse side nothing (4.8 cm against 4.7). The error of each leg is
now reported (`ikReachErrorByLimbM`, `stanceCentreY` in `marwari-gaits.json`). The fore pairs are centred the same way (a 2.6 cm
shift of the right foreleg). Walk, trot, canter, gallop and sprint clips changed; Stop and Alert did not. Hero, mobile and
anatomy GLBs and the hero source .blend re-exported.

Worst stance reach error per leg in the generator, cm (hind pair, before as one figure for both legs → left / right now):

| Clip | Before | Now (HL / HR) |
| --- | --- | --- |
| Walk | 5.1 | 6.1 / 1.4 |
| Trot | 8.0 | 4.8 / 2.4 |
| Canter R | 6.4 | 6.5 / 4.2 |
| Canter L | 8.6 | 4.4 / 3.0 |
| Gallop R | 6.5 | 6.5 / 3.1 |
| Gallop L | 8.3 | 2.9 / 3.4 |
| Sprint R | 9.4 | 6.7 / 3.4 |
| Sprint L | 8.6 | 4.6 / 3.4 |

**Measured in the browser** (desert, forced constant-yaw circles, 20 s each, ground slip as before → now):

| Run | Gait | `dt` 1/120 | `dt` 1/60 |
| --- | --- | --- | --- |
| Straight | canter / gallop / sprint | 2.6 / 4.7 / 6.1 → 2.0 / 4.4 / 5.0 % | 2.9 / 5.5 / 7.6 → 2.4 / 5.4 / 6.6 % |
| Left turn | canter / gallop / sprint | 4.8 / 4.7 / 5.4 → 3.7 / 5.6 / 4.8 % | 5.1 / 5.1 / 6.6 → 4.5 / 5.6 / 5.8 % |
| Right turn | canter / gallop / sprint | 4.6 / 7.6 / 9.8 → 4.4 / **4.1 / 4.1** % | 5.8 / 8.5 / 11.0 → 4.8 / 4.3 / 6.1 % |

The right hind's early-stance slip in the right turn fell from 26 % of speed to 7 %. Every stance is still held in every run
(unlocked 0 %). Hover (mid-stance sole over 2 cm up) changed little and not always for the better: left-turn gallop 3.6 → 7.0 %
(8.6 → 12.8 % at 60 fps), left sprint 6.0 → 4.4 %, right 1.2 → 1.0 % and 2.9 → 2.6 %; over 4 cm stays at or under 1.3 %.

Straight desert ladder, three repeats, ground slip: walk 0.3–0.5 % (0.4–0.5), trot **0.8–1.1** (2.5–2.8), canter **2.0–2.1** (2.7–2.8),
gallop 4.2–4.4 (4.5–4.8), sprint 5.0–5.2 (6.3–6.5); every stance held, none misses the ground, mid-stance residual 0.1–1.0 mm on
average. The flight phase is unchanged (trot 7–9 %, canter 15–16 %, gallop 28–30 %, sprint 32–33 %). Campus path, film speeds (90 s):
trot corners slip 4.4 → 3.0 % (still 42 of 192 stances 2–3 cm up, was 45 of 196), trot straights 3.1 → 1.2 %, canter corners
4.4 → 3.7 %; unlocked 0 %. One frame from behind at the trot: `docs/qa/film/gait_trot_rear_r9.png`.

**Left as it is**

- **The feet are still not symmetric sideways.** The generator's IK is planar, so it cannot move a foot across the body: the left
  hind foot stands at x +0.23 and the right at −0.09 (hoof tips), about 13 cm closer to the midline on the right, and the
  forefeet at +0.15 / −0.15. In a banked turn that changes how far the roll lifts each foot. The residual left-right gap in hover
  above is probably that; fixing it needs a lateral correction in the rig or an abduction term in the generator.
- **The fore pair differs by lead, not by rig:** at the gallop and sprint (right lead) the left forefoot slips 0.82 m/s against
  0.35 m/s for the right; in the left-lead clips it is the other way round (the trailing foreleg's reach error is the larger one,
  9.6 against 4.4 cm in Gallop R).
- The walk's left hind error is 6.1 cm (5.1 before); the right hind is 1.4 cm.
- Not checked: the anatomy page (its GLB was regenerated the same way and loads the same clips), a phone, the production build.

### 3h. Hover in hard turns, and what the film path really does (eighth pass, 27 Oct)

**Findings, in order of importance**

1. **The campus film never turns hard** (correction to §3f, above). Director-run from the gate on the campus path: trot yaw at most
   0.11 rad/s (roll 2.9°), canter at most 0.61 (roll 10.8°); nothing over 0.8. On it the trot has no float (0 % of mid-stance
   frames over 2 cm, slip 1.1 %) and the canter oval has none either (slip 2–4 %).
2. **The film's real foot problems are the gait changes**, which I had not looked at. Binned per second on the director's own beats
   (120 Hz, lock on; mean gait purity is the share of the dominant clip while two are blended):

| Where | Second | Speed | Purity | Slip | Mid-stance unlocked | Sole over 2 cm |
| --- | --- | --- | --- | --- | --- | --- |
| Campus, trot → canter | 8 | 3.4 → 5.2 | 0.93 | 13 % | 19 % | 7 % |
| Campus, lead change on the oval | 12–13 | 5.2 | 0.80–0.98 | 8–10 % | 8–48 % | 0–6 % |
| Desert, walk → trot | 8 | 1.5 → 3.4 | 0.93 | **100 %** of speed (1.9 m/s) | 21 % | 10 % |
| Desert, trot → canter | 11 | 3.5 → 5.2 | 0.93 | 21 % | 28 % | 5 % |
| Desert, canter → gallop | 14 | 5.3 → 10 | 0.86 | 10 % | 38 % | 1 % |
| Desert, gallop → sprint | 19–20 | 10 → 12 | 0.89–0.92 | 4–5 % | 8–27 % | 0 % |
| Desert, sprint → gallop | 24 | 12 → 10 | 0.86 | 6 % | 20 % | 0 % |

   Between the changes slip is 1–5 % and nothing floats. The cause is in `FootLock.apply`: the lock's weight is gated by
   `smoothstep(0.6, 0.85, gaitPurity)`, and during a cross-fade the stance windows come from the dominant clip only. **Not touched in
   this pass**; this is where a viewer will see feet slide in the film (the walk-to-trot second most of all).
3. The hover the previous passes left in hard turns had two causes, both in the lock's joint limits.

**What the traces showed** (per limb, with the joints at their limits counted):

- The outside forefoot in a trot hairpin: the pastern sat at its 26° limit in 100 % of held frames, the toe 3 cm above its target.
- The outside hind in a left-turn gallop: toe 2–2.4 cm up in the second half of the stance with no residual (the lock was hitting its
  target), the pastern climbing to 22° of its 26°.

**What I changed** (`footlock.ts`, `locomotion.ts`)

- Pastern limit 26° → 40° (0.45 → 0.7 rad), fore and hind. It is the joint the solve uses first; a loaded fetlock sinks past that.
  It gives about 2 cm more reach each way. Tried and not kept: raising the share of the straight-leg reach a target may ask for from
  0.97 to 1.0 (no change), a wider scapula hinge (0.35, no further gain), a 52° pastern (a little less trot float, a bigger bend).
- Maximum yaw rate 1.5 → 1.1 rad/s. Even with the 40° pastern the outside forefoot floated in a 1.5 rad/s trot turn: the leg is
  abducted 25° (its limit) and a leg tilted that far has about a tenth less vertical reach. 1.1 rad/s at 3.3 m/s is a 3 m radius, about
  what a ridden trot turns in (my estimate). At canter and faster the lateral-acceleration bound already caps it at 1.0 and under. The
  film's greatest yaw is 0.61, so the film is unchanged.

Same session, forced left-turn gallop / sprint, mid-stance sole over 2 cm up:

| Limits | Gallop | Sprint |
| --- | --- | --- |
| Before (pastern 26°, reach 0.97) | 8.5 % | 5.3 % |
| Reach 1.0 | 9.2 % | 6.6 % |
| Pastern 40° | **1.4 %** | **1.6 %** |
| Pastern 40° and reach 1.0 | 0.7 % | 3.0 % |
| Pastern 40° and scapula 20° | 1.7 % | 1.5 % |

**Result, forced constant-yaw circles on the desert** (§3g → now; sole over 2 cm up; ground slip in brackets):

| Run | Canter | Gallop | Sprint |
| --- | --- | --- | --- |
| Left, `dt` 1/120 | 11.0 → 6.2 % (3.7 → 3.6) | 7.0 → 1.3 % (5.6 → 5.1) | 4.4 → 1.0 % (4.8 → 4.7) |
| Right, `dt` 1/120 | 7.7 → 0.0 % (4.4 → 3.8) | 1.0 → 0.5 % (4.1 → 3.7) | 2.6 → 1.6 % (4.1 → 4.1) |
| Left, `dt` 1/60 | 5.5 → 4.7 % | 12.8 → 6.8 % | 10.6 → 4.0 % |
| Right, `dt` 1/60 | 2.8 → 1.1 % | 1.8 → 2.3 % | 4.7 → 4.1 % |

Every stance is still held in every run (unlocked 0 %) and none misses the ground. Straight runs: unchanged (canter 0.2, gallop 0.1,
sprint 0.1 % over 2 cm; slip 2.0 / 4.4 / 5.0 %). Straight desert ladder, three repeats: slip walk 0.3–0.5, trot 0.8–1.1, canter 2.0–2.1,
gallop 4.2–4.4, sprint 5.0–5.2 %, every stance held, flight phase as before.

Hairpins at the new yaw cap (forced circles, 18 s, 1.1 rad/s), against 1.5 rad/s with the 40° pastern:

| Gait | Sole over 2 cm | Stances that miss | Slip |
| --- | --- | --- | --- |
| Trot, left / right | 4.9 / 5.1 % (was 23.7 / 20.6) | 0 of 62 (was 12 / 5) | 2.5 / 1.7 % |
| Walk, left / right | 6.3 / 6.9 % (was 19.1) | 0 of 58 | 1.0 % |

Yaw caps of 1.2 / 1.0 / 0.8 gave a trot float of 10 / 5 / 3 %. One frame of the 40° pastern in a banked gallop (the outside hind at
the end of its push-off, pastern 40°): `docs/qa/film/gait_pastern_bend_r10.png`; the hoof is flat on the ground and the leg is not
distorted.

**Still open**

- The gait-change slip and let-go in finding 2: fixed in §3i. (The one-run figures in that table varied with the phase of the stride at which
  the change began, from 26 % to 100 % for the walk-to-trot second; §3i uses four starting phases.)
- Left-turn canter at a forced 1.08 rad/s still floats 6 % of mid-stance frames.
- Not checked: a phone, the production build, the anatomy page.

### 3i. Gait changes and lead changes (ninth pass, 27 Oct)

**Cause.** `FootLock.apply` multiplied the lock's weight by `smoothstep(0.6, 0.85, gaitPurity)`, where purity is the dominant clip's
share of the blend. During a gait change (walk to trot, trot to canter, and so on) or a change of canter lead, purity falls to
0.55–0.9 for about a second and the gate cut the lock on **every** foot, including the feet the blend had planted. The planted feet
then slid, and the stance windows of the other clip made the weight swing between feet.

**What I tried** (film beats, four starting phases of the stride, windows around the changes only: desert 8–9.6, 10.6–12, 13.6–16,
19–21 and 24.5–26 s; campus 8–10 and 12–16 s; slip is the RMS toe speed over the planted, mid-stance frames):

| Lock during a change | Desert slip | Unlocked | Sole over 2 cm up | Verdict |
| --- | --- | --- | --- | --- |
| Global purity gate (before) | 0.74 m/s | 13.3 % | 1.4 % | |
| **No gate** | **0.34 m/s** | **0.0 %** | **0.1 %** | kept |
| Per-hoof gate from the clips' weighted vote of stance | 0.89 m/s | 8.7 % | 3.0 % | worse; 36 frames with the toe moving over 10 cm (500 mm at the worst) |
| Plant and release from the pose (toe height and rise speed) during a blend | 0.73 m/s | 5.4 % | 5.4 % | worse; 30 such frames |
| No gate, and a hold let go over distance ÷ 3 m/s | 0.34 m/s | 0.0 % | 0.1 % | no change in slip, one 411 mm jump; dropped |

**Change** (`footlock.ts` only; no new assets): the gate is removed. The lock keeps the stance windows of the dominant clip and runs at
full weight through a change, as in a steady gait. A hoof the blend lifts is released as before. `LimbLock.clipToe` (the hoof's own
pose before the lock moves it) is exposed for QA.

**Result** (before → now, same harness; the director's beats; four starting phases):

| Scene | Frame step | Slip | Unlocked | Sole over 2 cm / over 4 cm up |
| --- | --- | --- | --- | --- |
| Desert | 1/120 s | 0.74 → 0.34 m/s | 13.3 → 0.0 % | 1.4 / 0.5 → 0.1 / 0.0 % |
| Desert | 1/60 s | 0.74 → 0.39 m/s | 13.5 → 0.0 % | 1.9 / 0.4 → 0.8 / 0.0 % |
| Campus | 1/120 s | 0.52 → 0.20 m/s | 11.3 → 0.5 % | 2.8 / 1.6 → 1.2 / 0.9 % |
| Campus | 1/60 s | 0.62 → 0.44 m/s | 12.1 → 0.8 % | 3.1 / 1.9 → 2.0 / 1.4 % |

The desert, second by second at 1/120 s with the stride at phase 0 (slip as a share of speed / mid-stance frames unlocked):

| Change | Second | Before | Now |
| --- | --- | --- | --- |
| Walk → trot | 8 | 26 % / 20 % | 12 % / 0 % |
| Trot → canter | 11 | 17 % / 11 % | 8 % / 0 % |
| Canter → gallop | 14 | 11 % / 42 % | 3 % / 0 % |
| Gallop → sprint | 19 | 5 % / 14 % | 5 % / 0 % |
| Sprint | 20 | 6 % / 17 % | 5 % / 0 % |
| Sprint → gallop | 24 | 5 % / 10 % | 5 % / 0 % |

Steady gaits are unchanged (there is no blend): desert ladder, three repeats, slip walk 0.3–0.5, trot 0.8–1.1, canter 2.0–2.1, gallop
4.2–4.4, sprint 5.0–5.2 %, every stance held, flight phase as before. How far the lock moves a toe from one frame to the next (the
frame-to-frame change of the offset between the hoof's own pose and the locked one, 1/120 s): 99th percentile 47 → 50 mm in the
desert and 41 → 43 mm on the campus; the largest frame 89 → 119 and 105 → 128 mm. A steady gallop's 99th percentile is 51 mm. At
1/60 s the same figures are 76 and 78 mm (largest 208 and 292), twice a 1/120 s frame, as expected.

**Left as it is**
- **A start from standing** (0.6 m/s, the first walking steps): 21 % slip of a speed of 0.6 m/s and 17 % of mid-stance frames over 2 cm
  up, for about a second. It is not a blend. (Taken up in §3j.)
- Walk → trot still slips 12 % of the speed for a second and trot → canter 8 %; at 1/60 s the campus change is 0.44 m/s.
- The lock's largest single-frame displacement is a little higher (119 against 89 mm); I did not look at a frame in the middle of a
  change by eye.
- Not checked: a phone, the production build, the anatomy page.

### 3j. Starting from standing (tenth pass, 27 Oct)

**Cause.** `FootLock.apply` ran the lock only above 0.4 m/s. A horse setting off takes about a second to get there (the walk is
blended in as `smoothstep(0.12, 0.55, speed)`), and for that second the pose is mostly the stand pose, whose feet move with the
body: the planted feet skated at up to the body's speed, 0.3 m/s, before the lock took hold.

**What I tried** (stand 0.5 s, then a target of 1.5 m/s; the lock runs once the walk holds more than the given share of the pose,
and in any case above 0.4 m/s; window 0.5–2.5 s; four starting phases of the stride; 1/120 s; "Planted-foot speed" is the toe's speed
over frames in mid-stance with the toe within 4.5 cm of the ground; "over 2 / 4 cm" is the share of mid-stance frames with the sole
that high):

| Lock from a walk share of | Planted-foot speed rms / max | Sole over 2 cm / over 4 cm | Verdict |
| --- | --- | --- | --- |
| 0.9 (as before: from 0.4 m/s) | 0.28 / 2.09 m/s | 1.9 / 0.0 % | |
| 0.55 | 0.22 / 2.09 | 1.5 / 0.0 | |
| 0.45 | 0.15 / 1.28 | 1.4 / 0.0 | |
| **0.4 (about 0.3 m/s)** | **0.13 / 1.12** | **2.1 / 0.0** | kept |
| 0.3 | 0.12 / 1.09 | 3.6 / 0.0 | |
| 0.25 | 0.11 / 1.05 | 3.8 / 0.4 | |
| 0.1 | 0.07 / 0.80 | 5.8 / 1.8 | |
| 0.02 (from the first moment) | 0.04 / 0.44 | 7.2 / 3.1 | float: see below |

Locking from the very first moment almost stops the skating (0.04 m/s) but a hind foot then floats. It is anchored at the stand
pose's toe, which is where the stand pose puts it and not where the stride would, and the body walks on past what the leg can reach:
the toe rose 3–5 cm over the stance (hind feet only, 0.5–1.1 s after the set-off, lock at full weight, the safety fade only starting
once the residual passed 6 cm). 0.4 is the point where the slip has fallen by half and the float is back to what it was.

A second change goes with it. The lock now runs from a latch: on when the speed passes 0.4 m/s or the walk holds 0.4 of the pose
while the horse is not slowing; off when the speed is under 0.4 m/s and falling. Slowing down it behaves exactly as before. (A first
version that kept the lock on as long as any walk was in the pose made the stop worse: feet up to 11.7 m/s.)

**Change** (`footlock.ts` only; no new assets): `MOVING_GAIT = 0.4`, the `active` latch, and `movingGait` as a QA setting.

**Result** (before → now; four starting phases; every run starts from the same state):

| Scene and window | Frame step | Planted-foot speed rms / max | Sensor slip | Sole over 2 / 4 cm |
| --- | --- | --- | --- | --- |
| Desert, stand → walk (4.8–7 s) | 1/120 s | 0.23 / 2.0 → **0.13 / 1.1** m/s | 0.10 → 0.01 m/s | 1.9 / 0.0 → 2.0 / 0.0 % |
| Desert, stand → walk | 1/60 s | 0.24 / 2.0 → 0.13 / 1.1 | 0.12 → 0.01 | 1.8 / 0.0 → 1.3 / 0.0 |
| Campus, stand → trot (0–3 s) | 1/120 s | 0.27 / 3.8 → 0.21 / 3.8 | 0.19 → 0.17 | 1.6 / 0.4 → 2.0 / 0.1 |
| Campus, stand → trot | 1/60 s | 0.28 / 3.4 → 0.21 / 3.4 | 0.20 → 0.17 | 1.6 / 0.2 → 1.5 / 0.2 |

The first second of the campus start, by starting phase of the stride (rms / max planted-foot speed, m/s): 0.41 / 2.1 → 0.06 / 0.2,
0.49 / 1.2 → 0.35 / 1.2, 0.31 / 1.6 → 0.07 / 0.2 and 0.32 / 0.9 → 0.22 / 0.7. A target of 3.4 m/s from standing at 1/120 s: 0.35 → 0.24
m/s. The whole beats (desert 27 s, campus 17 s, windows around the changes) are unchanged: desert slip 0.29 → 0.28 m/s at 1/120 s and
0.33 → 0.32 at 1/60 s, campus 0.24 → 0.24 and 0.26 → 0.25. The lock's frame-to-frame displacement is a little higher at the start
(99th percentile 20 → 23 mm, largest 34 → 78 mm at 1/120 s; 37 → 39 and 65 → 137 mm at 1/60 s), as the lock now takes hold of a pose
that is still changing. One frame each (1440 and 390 px, the walk 1–2 s after a set-off, `docs/qa/film/start_walk_r11_*.png`) shows
the horse and its hooves as before; there is no horizontal overflow at 390.

**A correction to my own measuring.** The first comparison of this pass put campus slip at 0.20 → 0.27 m/s and a window at 8–10 s
at 0.22 → 0.48 with 9.5 m/s frames. That was my harness: a run kept the speed-dependent state of the one before it (acceleration,
exertion, the stop cooldown), so a run after a fast beat started differently. The runs above start from a six-second settle and zero
those three, and a repeated run now gives the same figures (the 8–10 s window is identical with and without this change). The earlier
before / after tables (§3g–§3i) compared like with like in the same order, so what they say about a change stands; their absolute
figures for later runs of a session I have not re-measured.

**Left as it is**
- **The stop.** Planted-foot speed with the horse stopping from 1.5 m/s (window 5–8 s, four phases) is 0.44 m/s rms with a worst frame of
  7.7 m/s, and 12.4 % of mid-stance frames are unlocked. This pass does not change it (the committed code gives the same figures). Under
  0.4 m/s and falling the lock lets go of all four feet in 50 ms, including feet still in mid-stance whose anchors are up to tens of
  centimetres from the clip's toes, so those toes snap across. It depends on the stride phase (a single walk and stop at phase 0.3
  gave 1.5 m/s). A longer release, or one that waits for each foot's own lift-off, is the likely fix; not tried. (Taken up in §3k.)
- The campus start has one frame at 3.8 m/s at the walk → trot change, about 1.9 s after the set-off; unchanged.
- The skating that remains (0.13 m/s rms) is the first 0.3 s, until the walk holds 0.4 of the pose. A starting phase with 11 % of
  the mid-stance frames over 2 cm up in the second after the campus set-off (it was 0 %) is the one place the float is worse.
- "Float" at the start: before the change the measured hover was 1.9 % of mid-stance frames over 2 cm and none over 4 cm, so what I could
  measure was the skating; I did not find a hover to remove. Looked at by eye: one frame at each width; not a sequence.
- Not checked: a phone, the production build, the anatomy page.

### 3k. The stop (eleventh pass, 27 Oct)

**Cause.** Two, one of them found while measuring.
1. *The lock-off.* Under 0.4 m/s and slowing the lock stops, and every foot that was still planted went into the 50 ms release. At
   that moment (0.22 s before the horse is still) two feet are anchored 28–125 mm from where the blended pose wants them; 125 mm in
   25 ms is the 7.7 m/s. The pose then carried those toes on to the stand position at 1–3 m/s for another 60 ms, with the lock off.
2. *A reopened stance.* A foot that had begun to let go, and whose stance window then opened again (the dominant clip changed under it,
   for instance canter → trot 0.42 s after the stop was ordered), kept its old anchor and was pulled 13–20 cm back across the ground at
   weight 0.93: a 435 mm one-frame jump and a toe at 44.6 m/s. It is the "411 mm jump" of §3i that made me drop the distance-scaled
   release there; I had not found its cause then.

**What I tried** (four starting phases, 1/120 s, from a clean start; planted-foot speed rms / max over the stop and the second after it,
on frames in mid-stance with the toe within 4.5 cm of the ground; "glide" is the time, summed over four phases and four feet, that a
foot on the ground moves over 0.1 m/s after the horse is still, with its fastest speed):

| Stop from 1.5 m/s | Planted-foot speed rms / max | Unlocked | Glide after standstill | Verdict |
| --- | --- | --- | --- | --- |
| Committed (50 ms release) | 0.67 / 5.9 m/s | 5.8 % | 3.1 s, max 0.14 m/s (body noise) | |
| Anchor slides at 8 m/s (about the old snap) | 0.77 / 8.0 | 0.0 | 3.1 s, 0.14 | |
| Slides at 1.0 m/s | 0.34 / 1.0 | 0.0 | 3.5 s, 1.01 | **kept** |
| Slides at 0.5 m/s | 0.22 / 0.5 | 0.0 | 4.6 s, 0.50 | |
| Slides at 0.3 m/s | 0.17 / 0.3 | 0.0 | 5.8 s, 0.30 | |

The slower the slide, the smaller the snap and the longer a foot goes on gliding after the horse has stopped (80 ms per stop at 1.0 m/s,
370 at 0.5, 660 at 0.3). 1.0 m/s turns the snap into a quick settle.

A second change was tried and removed: lengthening the lift-off release in proportion to how far the anchor is from the clip's toe
(a toe leaves its anchor at no more than 3, then 2 m/s). It is worse where it matters. Stop from 5.2 m/s: planted-foot speed max
15.8 m/s with the fixed 50 ms release, 36.9 at 3 m/s and 40.9 at 2 m/s; the largest lock jump 106 mm, 348 and 604 mm. At canter the
clip's toe leaves at 4+ m/s, so a longer hold drags the foot further from its anchor. From 3.4 m/s it gained almost nothing (rms 1.45
→ 1.21 and 1.14, max 13.4 → 13.6 and 11.5 m/s on the ground). From 1.5 m/s no change.

**Change** (`footlock.ts` only; no new assets):
- A foot still planted when the lock stops has its anchor slide to the pose's own toe at no more than `STOP_SLIDE_MPS` = 1 m/s, then the
  lock lets go (`stopSlideMps`, a QA setting). A foot already lifting keeps the 50 ms release.
- A foot that had begun to let go, whose stance window opens again with its toe within `LOCK_TOUCH_M` of the ground, is a new stance: its
  anchor is set at its toe now (it used to continue with the old one).

**Result** (committed → now; four phases; slowing from a steady speed; the window runs from the stop order to one second after
standstill):

| Stop from | Step | Planted-foot speed rms / max | Unlocked | Any toe on the ground, max | Lock jump, largest |
| --- | --- | --- | --- | --- | --- |
| 1.5 m/s | 1/120 s | 0.67 / 5.9 → **0.34 / 1.0** m/s | 5.8 → 0.0 % | 5.9 → 4.1 m/s | 35 → 41 mm |
| 1.5 m/s | 1/60 s | 0.53 / 5.2 → 0.34 / 1.0 | 4.0 → 0.0 | 5.2 → 4.1 | 58 → 58 |
| 3.4 m/s | 1/120 s | 0.68 / 8.6 → 0.54 / 8.6 | 9.6 → 3.4 | 13.4 → 13.4 | 112 → 112 |
| 3.4 m/s | 1/60 s | 0.81 / 8.1 → 0.71 / 8.1 | 7.5 → 2.8 | 12.6 → 12.6 | 192 → 192 |
| 5.2 m/s | 1/120 s | 0.79 / 6.6 → 0.73 / 15.8 | 9.4 → 3.7 | 44.6 → 18.7 | 435 → 106 |
| 5.2 m/s | 1/60 s | 0.91 / 6.7 → 0.84 / 9.6 | 6.0 → 3.4 | 15.7 → 15.7 | 281 → 191 |

The one number that rose, the planted-foot maximum from 5.2 m/s (6.6 → 15.8 m/s at 1/120 s, 6.7 → 9.6 at 1/60 s), is a foot that was
letting go from an anchor about 19 cm away at 10–12 m/s on the frames before; at the frame where its stance window reopens it is now
counted as planted. From the trace I believe it is the same flick as before, not a new one; I did not check that frame by frame
against the committed code.

**The film's own end beat** (campus: 14 s at 5.2 m/s, then the stop; four phases):

| Step | Planted-foot speed rms / max | Unlocked | Any toe on the ground, max | Lock jump p99 / largest |
| --- | --- | --- | --- | --- |
| 1/120 s | 1.34 / 37.5 → **0.59 / 9.0** m/s | 8.8 → 2.3 % | 39.0 → 18.8 m/s | 63 / 360 → 54 / 127 mm |
| 1/60 s | 0.83 / 10.0 → 0.67 / 10.0 | 3.7 → 1.6 | 19.3 → 19.3 | 116 / 260 → 104 / 181 |

Everything else is unchanged to the printed figures: the desert beats (sensor slip 0.28 → 0.28 m/s at 1/120 s, 0.32 → 0.32 at 1/60 s;
the start 0.13 / 1.1 m/s rms / max), the campus beats (0.24 → 0.24 and 0.25 → 0.25) and their starts, as in §3j. Lint is clean on the film module, `npm test` 84 / 84.
One frame each at 1440 and 390 px of the horse standing after a stop (`docs/qa/film/stop_stand_r12_*.png`): four hooves on the sand,
no lock held, no overflow at 390.

**Left as it is**
- **Flicks while slowing through the gaits** (stops from 3.4 and 5.2 m/s). Frames with a toe on the ground over 5 m/s, four phases at
  1/120 s: 69 and 88. By the toe's own motion: 46 % and 33 % are the clip's swing toe itself (the pose, not the lock), 36 % and 34 % are
  lift-offs where the lock moves the toe 10–25 cm from a barely moving clip toe in 50 ms, the rest mixed. The cause of the large offset
  at a lift-off while slowing I did not find; the distance-scaled release above does not cure it at canter. A cap on the release that
  follows the body's speed is the next thing I would try. (Taken up in §3l.)
- **A glide after standstill:** a foot may slide at up to 1 m/s for about 80 ms after the horse is still. The committed code had none
  beyond body noise (0.14 m/s). A foot that slides does not lift: there is no small step.
- The campus start's single 3.8 m/s frame at the walk → trot change (§3j) is as it was.
- Not checked: a phone, the production build, the anatomy page; the stop in motion by eye (still frames only).

### 3l. Lift-offs while slowing (twelfth pass, 27 Oct)

**What the flicks are.** Every release of a planted foot during the stops from 3.4 and 5.2 m/s, logged at its first frame (body speed,
distance from the anchor to the clip's toe, the toe's fastest speed over the next 60 ms; four phases, 1/120 s):

| Body speed at the lift-off | Releases | Anchor to clip toe, mean / largest | Toe speed, mean / largest |
| --- | --- | --- | --- |
| Stop from 1.5 m/s, 0.8–1.6 m/s | 8 | 87 / 114 mm | 2.8 / 3.5 m/s |
| Stops from 3.4 and 5.2 m/s, 0.8–1.6 m/s | 4 + 4 | 478 / 551 and 452 / 623 mm | 12.1 / 13.1 and 10.3 / 12.5 |
| 1.6–2.6 m/s | 10 + 10 | 172 / 263 and 209 / 332 mm | 8.1 / 13.4 and 9.3 / 18.7 |
| 2.6–4 m/s | 8 + 8 | 95 / 131 and 129 / 279 mm | 3.8 / 4.3 and 4.8 / 8.5 |
| Over 4 m/s (from 5.2 m/s) | 19 | 131 / 302 mm | 8.0 / 15.8 |

So the distance is not the 10–25 cm I had assumed: 40–60 cm when the horse slows through a walk or a slow trot. My reading of
`locomotion.ts`, consistent with the table but not isolated: the stride phase advances by speed ÷ the stride length of the blend, and
that length changes with the gait weights, so mid-stance the clip's foot sweeps back faster than the body moves while the lock holds the
foot; at the lift-off the lock pays the difference in one 50 ms release. **(Refuted in §3m: advancing the phase by the dominant clip's
own stride length changes nothing; the cause is the clips' footfall timing at the shared phase.)** At a canter (over 4 m/s) a toe speed
of 8–16 m/s is about twice the body speed, which is what a swinging toe does, so those are not flicks.

**What I tried** (stops from 3.4 and 5.2 m/s, four phases, 1/120 s; a release lasting 1.5 × distance ÷ cap, between 50 ms and 0.3 s, with
the cap = base + per × body speed; "lock-driven" is a frame with a toe on the ground over 5 m/s whose clip toe moves under 30 % of that):

| Cap (base + per × speed) | Ground rms 3.4 / 5.2 m/s | Frames over 5 m/s (lock-driven) 3.4 / 5.2 m/s | 5.2 m/s: ground max, largest jump | Verdict |
| --- | --- | --- | --- | --- |
| Fixed 50 ms (committed) | 1.45 / 1.68 | 69 (25) / 88 (30) | 18.7 m/s, 106 mm | |
| 1 + 1 × v | 1.23 / 1.60 | 47 (4) / 52 (5) | 33.1, 260 mm | worse at canter |
| 0.5 + 1 × v | 1.21 / 1.78 | 41 (0) / 48 (5) | 49.3, 396 mm | worse at canter |
| **1 + 2 × v** | **1.25 / 1.52** | 50 (4) / 59 (5) | **16.7, 94 mm** | kept |
| 2 + 2 × v | 1.25 / 1.54 | 51 (7) / 62 (8) | 17.8, 94 mm | |
| 1 + 3 × v | 1.27 / 1.56 | 54 (10) / 71 (12) | 18.3, 94 mm | |

A cap that is too soft at canter speeds (0.5–1 m/s per m/s) stretches the release of a canter's feet past the next touchdown, and the
re-anchor then jumps the toe by what is left of it. 1 + 2 × v leaves a canter's release at 50 ms (cap 10 m/s) and stretches only the walk
and slow trot (cap 3–6 m/s).

Applied to every lift-off it broke the film's acceleration beats: a foot whose release outlasted the next touchdown (walk → trot at
8.85 s, the toe still 33 cm from the clip's with the weight at 0.52) was re-anchored in one frame and jumped 328 mm (desert beat, largest
lock jump 119 → 328 mm at 1/120 s, 208 → 376 at 1/60 s). Two ways to treat a reopened stance were tried: let the release finish first
(jump 91 mm, but desert slip 0.28 → 0.31 m/s and a planted-foot maximum 4.2 → 6.1 m/s) and re-anchor once the toe is within 3 cm of
the clip's (jump 91 mm, slip 0.32, maximum 8.5). Limiting the longer release to the case that needs it was simpler and better than
either: **the horse must be slowing by more than 0.3 m/s²**. With that, every film window is identical to the committed figures. In
the stops the three treatments of a reopened stance (re-anchor at once, within 3 cm, after the release) give the same figures except the
5.2 m/s stop with the release finished first (planted-foot maximum 12.4 instead of 15.8 m/s, unlocked 4.0 instead of 3.7 %). The 3 cm
rule is kept: it bounds the jump by construction.

**Change** (`footlock.ts` only; no new assets):
- While the horse slows by more than 0.3 m/s², a lift-off lasts 1.5 × (anchor to clip toe) ÷ (1 + 2 × body speed) seconds, at least
  `LOCK_RELEASE_S` (50 ms) and at most 0.3 s (`releaseBaseMps`, `releasePerMps`: QA settings).
- A foot that is letting go when its stance window opens again keeps letting go until its toe is within 3 cm of the clip's, and takes
  a new anchor then (§3k set it at once).

**Result** (committed → now; four phases; same harness as §3k):

| Stop from | Step | Ground rms | Frames over 5 m/s (lock-driven) | Ground max | Lock jump p99 / largest |
| --- | --- | --- | --- | --- | --- |
| 1.5 m/s | 1/120, 1/60 s | unchanged | 0 | 4.1 m/s | 18 / 41, 32 / 58 mm |
| 3.4 m/s | 1/120 s | 1.45 → 1.25 | 69 (25) → 50 (4) | 13.4 → 13.3 | 55 / 112 → 46 / 100 mm |
| 3.4 m/s | 1/60 s | 1.43 → 1.28 | 33 (11) → 26 (2) | 12.6 → 13.8 | 100 / 192 → 77 / 146 |
| 5.2 m/s | 1/120 s | 1.68 → 1.52 | 88 (30) → 59 (5) | 18.7 → 16.7 | 61 / 106 → 54 / 94 |
| 5.2 m/s | 1/60 s | 1.61 → 1.49 | 44 (15) → 34 (6) | 15.7 → 15.8 | 114 / 191 → 100 / 144 |
| Film end beat (campus) | 1/120 s | 1.82 → 1.69 | 136 (32) → 115 (9) | 18.8 → 18.8 | 54 / 127 → 50 / 127 |
| Film end beat (campus) | 1/60 s | 1.80 → 1.71 | 68 (18) → 56 (6) | 19.3 → 21.2 | 104 / 181 → 87 / 177 |

The planted-foot figures: stop from 5.2 m/s 0.73 / 15.8 → 0.68 / 15.8 m/s (1/120 s), 0.84 / 9.6 unchanged (1/60 s); the end beat 0.59 / 9.0
→ 0.61 / 11.4 (1/120 s) and 0.67 / 10.0 unchanged (1/60 s). The 11.4 m/s that rose is one frame at the trot → walk change 1.1 s after
the stop order: the clip's own toe is already moving at 6.3 m/s and the 3 cm re-anchor adds the rest. (I traced that one at 1/120 s; I
did not trace the 21.2 m/s at 1/60 s.)
Everything that is not a slowdown is unchanged to the printed figure: the starts (§3j), the desert beats (slip 0.28 / 0.32 m/s at
1/120 and 1/60 s, largest lock jump 119 / 208 mm) and the campus beats (0.24 / 0.25; 136 / 251 mm). `npm test` 84 / 84; lint and
typecheck clean on the film module. One frame each at 1440 and 390 px of the horse standing after a trot stop
(`docs/qa/film/stop_trot_stand_r13_*.png`): four hooves on the sand, no lock held, no overflow, no console errors.

**Left as it is**
- **What is left of the over-5 m/s frames is the pose.** In the end beat 62 of 115 are the clip's own toe (a swing, or the blend of two
  gaits), 44 mixed, 9 the lock. The ground maxima therefore hardly moved. The cause of the 40–60 cm anchor distance is in `locomotion.ts`,
  not the lock (§3m shows it is the footfall timing of the clips at the shared phase, not the stride-length blend I suspected here).
- **Two maxima a little higher** (above), one frame each.
- **The longer release (up to 0.3 s) lets a foot trail its clip toe as it lifts.** I have looked at stills only, not the motion.
- The constants (1 + 2 × speed, 0.3 m/s², 3 cm, 0.3 s) come from a sweep over three stops and one film beat in the desert and the
  campus; the village, a steeper stop and a stop that is interrupted by a start were not tried.
- Not checked: a phone, the production build, the anatomy page.

### 3m. Why the anchor ends up so far from the clip's toe (thirteenth pass, 27 Oct)

**The hypothesis I was asked to test, and my reading of §3l:** the stride phase advances by speed ÷ the stride length of the gait blend,
so while the weights change mid-stance the clip's foot sweeps back faster than the body moves.

**It is not the cause.** Three pieces of evidence.
1. *Arithmetic.* The blend's stride length is the weight-averaged one, so each clip's foot slip is 1 − L_clip ÷ L_blend and the weighted
   sum of those slips is exactly zero: the rate mismatch cancels in the blended pose.
2. *With the lock off, advancing the phase by the dominant clip's own stride length instead of the blend's* (stops from 3.4 and 5.2 m/s,
   four phases, 1/120 s; the mean ground drift of the clip's toe over a stance of the dominant clip's window, slowing stances only):

   | Stances | Blend (as it is) | Dominant clip's length |
   | --- | --- | --- |
   | Dominant clip changed during the stance | 478 mm (n = 6) | 488 mm (n = 6) |
   | Blended, same dominant clip | 207 mm (n = 29) | 204 mm (n = 34) |
   | Pure | 92 mm (n = 4) | 91 mm (n = 4) |

3. *What the clips do at the same phase.* Walk: L = 1.152 m, feet land HL, FL, HR, FR at 0, 0.25, 0.5, 0.75, each in stance for 0.55 of the
   cycle. Trot: L = 2.498 m, diagonals land at 0 and 0.5, each in stance for 0.38. Walk's left hind foot at phase 0.30 is in stance, 10 cm
   behind the root's origin; trot's is in swing, 25 cm ahead and 13 cm up; at 0.45 they are 67 cm apart. A cross-fade of the two puts the
   foot halfway between stance and swing.

**What the lock-off measurement does show** (same runs, plus steady gaits and the film's speed-ups; the clip's own toe over each stance):
steady and pure 95 mm (median 94, n = 544); speeding up, blended 152 mm; slowing, blended 207 mm (median 226); **slowing, with the
dominant clip changing during the stance 478 mm (median 581, max 632 mm, with the body moving 1.4–1.6 m)**. (The 580 mm outliers in the
pure groups are the start from standing.) That is the 40–60 cm of §3l: it is the clip's pose across a gait change.

**A fixed phase offset per clip.** Mismatch (rms over the four feet, the clips' toe positions in the root frame, at the same phase) and
the offset that minimises it, from the clips' own toe paths:

| Pair | At the same phase | Best offset (cycles) | At the best offset |
| --- | --- | --- | --- |
| Walk → trot | 59.1 cm | 0.55 | 31.2 cm |
| Trot → canter (right lead / left lead) | 58.7 / 58.6 | 0.25 / 0.75 | 43.1 / 44.1 |
| Canter → gallop | 45.0 | 0.925 | 36.8 |
| Gallop → sprint | 11.8 | 0.975 | 6.2 |
| Canter right ↔ left (the lead change) | 60.9 | none better than 58.8 | |

With the whole chain applied and the lock off, the stances with a changing dominant clip fell from 478 mm (n = 6) to 204 mm (n = 16),
blended ones from 207 to 145 mm, pure ones unchanged; all slowing stances 237 → 164 mm. A control with every offset shifted half a cycle
did nothing (429 mm, max 718). With the lock on, the stops from 3.4 and 5.2 m/s improved a lot, but the trot → canter offset hurt the
desert's speed-up at 1/120 s (slip 0.29 → 0.61 m/s, an 11.6 m/s frame at 11.2 s). I swept it (right lead 0.55 + x, left lead half a cycle
further, x from 0 to 0.9): the results jump about from one x to the next (the speed-up's slip 0.20 at x = 0.40, 0.27 at 0.30, 0.61 at 0.25;
the slow-down's frames over 5 m/s 19–51) and the cost curve is flat (43 cm at the best offset, 60 cm at the median), so four stride phases
cannot tell the offsets apart. **Only the walk ↔ trot offset is kept**; the trot, canter, gallop and sprint keep their relations to each
other (all four play the same 0.52 ahead of the walk). Sensitivity of that single offset (the lock on; four phases; 1/120 s; slip m/s /
largest planted-foot speed m/s / frames over 5 m/s / largest lock jump mm):

| Trot offset | Walk → trot speed-up | Trot → walk, stop from 3.4 m/s |
| --- | --- | --- |
| none | 0.13 / 2.3 / 61 / 119 | 0.38 / 6.6 / 50 / 100 |
| 0.45 | 0.02 / 0.2 / 12 / 84 | 0.19 / 3.4 / 4 / 46 |
| 0.49–0.51 | 0.02 / 0.2 / 12–13 / 78–82 | 0.05–0.06 / 1.1–1.5 / 0–2 / 43 |
| **0.52** | 0.02 / 0.2 / 15 / 75 | 0.04 / 1.0 / 0 / 43 |
| 0.53–0.57 | 0.02–0.05 / 0.2–0.9 / 13–15 / 78–86 | 0.02–0.03 / 1.0 / 0 / 43–54 |
| 0.60 | 0.05 / 0.9 / 14 / 89 | 0.66 / 13.8 / 9 / 74 |
| 0.65 | 0.05 / 0.9 / 24 / 87 | 0.30 / 5.9 / 12 / 79 |

0.49–0.57 all work; 0.60 and above do not. 0.52 is the middle of the plateau.

**Change** (`locomotion.ts` only; no new assets; `footlock.ts` untouched): each gait clip plays at the stride phase plus its offset (the
walk 0, the trot and every faster gait 0.52), and `stancePhase` follows the same offset. `GAIT_PHASE_OFFSET` carries the derivation;
`phaseOffset` is a QA setting. Steady gaits are the same animation, started 0.52 of a cycle later.

**Result** (previous commit → now; four phases; same harness; "ground" is any toe within 3 cm of the ground):

| Stop from | Step | Planted-foot rms / max | Unlocked | Ground rms / max | Frames over 5 m/s | Lock jump p99 / largest |
| --- | --- | --- | --- | --- | --- | --- |
| 1.5 m/s | both | unchanged | 0 | 0.54 / 4.1 | 0 | 18 / 41, 32 / 58 mm |
| 3.4 m/s | 1/120 s | 0.54 / 8.6 → **0.30 / 1.0** m/s | 3.4 → 0.0 % | 1.25 / 13.3 → 0.62 / 5.0 | 50 → 0 | 46 / 100 → 26 / 43 |
| 3.4 m/s | 1/60 s | 0.71 / 8.1 → 0.30 / 1.0 | 2.8 → 0.0 % | 1.28 / 13.8 → 0.63 / 5.5 | 26 → 1 | 77 / 146 → 49 / 87 |
| 5.2 m/s | 1/120 s | 0.68 / 15.8 → 0.41 / 6.0 | 3.7 → 0.0 % | 1.52 / 16.7 → 1.19 / 14.1 | 59 → 43 | 54 / 94 → 40 / 100 |
| 5.2 m/s | 1/60 s | 0.84 / 9.6 → 0.53 / 10.1 | 3.4 → 0.0 % | 1.49 / 15.8 → 1.14 / 11.4 | 34 → 19 | 100 / 144 → 79 / 171 |

The film's end beat (campus, 5.2 m/s for 14 s, then the stop; the offsets off → on in one session):

| Step | Planted-foot rms / max | Unlocked | Ground rms / max | Frames over 5 m/s | Lock jump p99 / largest |
| --- | --- | --- | --- | --- | --- |
| 1/120 s | 0.61 / 11.4 → 0.52 / 8.0 | 2.3 → 2.0 % | 1.69 / 18.8 → 1.46 / 21.5 | 115 → 93 | 50 / 127 → 44 / 120 |
| 1/60 s | 0.67 / 10.0 → 0.59 / 9.7 | 1.6 → 1.6 % | 1.71 / 21.2 → 1.41 / 17.0 | 56 → 41 | 87 / 177 → 78 / 162 |

The film's beats (slip, sensor / largest lock jump):

| Window | 1/120 s | 1/60 s |
| --- | --- | --- |
| Campus, whole beat | 0.24 → 0.18 / 136 → 141 mm | 0.25 → 0.16 / 251 → 262 |
| Campus, stand → trot (0–3 s) | 0.17 → 0.02 / 108 → 81 | 0.17 → 0.02 / 208 → 144 |
| Desert, whole beat | 0.28 → 0.27 / 119 → 92 | 0.32 → 0.35 / 208 → 171 |
| Desert, stand → walk | unchanged (0.01 / 78) | unchanged (0.01 / 137) |

The campus beat's largest planted-foot speed falls 7.6 → 5.7 m/s (1/120 s) and 7.2 → 2.4 (1/60 s), and the campus start's 3.8 m/s frame
at the walk → trot change is gone (3.8 → 1.2). Steady gaits are unchanged (desert ladder, lock fully holding every stance: walk 0.5 %, trot
1.1 %, canter 2.1 %, gallop 4.4 % slip; the 11.5 m/s step, inside the gallop → sprint band, 6.6 → 5.4 %); a canter lead change R → L at
5.2 m/s is identical (slip 0.11 m/s, jump 54 mm). `npm test` 84 / 84; lint and typecheck clean on the film module. One frame each, at
1440 px in the middle of a trot → walk change (`docs/qa/film/gait_change_trot_walk_r14_1440.png`) and at 390 px after a trot stop
(`docs/qa/film/stop_trot_stand_r14_390.png`): natural poses, hooves seated, no overflow, no console errors.

**Left as it is**
- **Trot ↔ canter, canter ↔ gallop and gallop ↔ sprint are as before**, 59 / 45 / 12 cm of mismatch. (Taken up in §3n: canter ↔ gallop is
  now aligned; trot ↔ canter cannot be, because of the lead change.) The canter → trot part of the 5.2 m/s
  stop still has 43 frames over 5 m/s (22 of them the clip's own toe, 13 mixed, 8 the lock) and the end beat 93; the trot → canter offset
  needs a better method than four stride phases (more phases, or a cost that weights the stance feet).
- **Four figures a little worse:** the desert beat at 1/60 s (slip 0.32 → 0.35 m/s, largest planted-foot speed 2.6 → 4.5), the end beat's
  ground maximum at 1/120 s (18.8 → 21.5 m/s), the 5.2 m/s stop's largest lock jump at 1/60 s (144 → 171 mm) and its planted-foot maximum
  at 1/60 s (9.6 → 10.1 m/s). I did not trace them.
- **The offset belongs to these clips.** It comes from their toe paths; re-derive it (`GAIT_PHASE_OFFSET`) if the gaits are re-authored.
  The starting phases of the QA harness are the shared phase, so for the trot and above they now sample the cycle 0.52 shifted.
- Not checked: the village, a phone, the production build, the anatomy page; the motion by eye (two stills).

### 3n. Aligning trot with canter, and canter with gallop (fourteenth pass, 27–28 Oct)

**A better method than §3m's.** Geometry: the clips' toe paths at 80 phase samples (not 40), and a cost that counts a foot in full if it is
in stance in either clip and at a quarter if it is in swing in both, with the share of (phase, foot) samples on which the two clips agree
about stance as a second readout. Measuring: twelve starting phases (not four), the lead forced to right or left on every frame, and four
transitions, each as a speed-up and a slow-down, on the desert path with the lock on (1/120 s; sensor slip m/s, ground rms m/s, frames over
5 m/s on the ground, largest lock jump mm): trot → canter 3.4 → 5.2 m/s (window 6–8.5 s) and canter → trot (8–10.5 s), canter → gallop
5.2 → 10 (8–12 s) and gallop → canter (10–13.5 s). **The rule for keeping an offset, fixed before the runs:** for each lead and direction
the geometric mean of the four ratios (candidate ÷ baseline) is at most 0.95, none of the four rises by more than 10 %, and no planted-foot
maximum newly passes 5 m/s.

**Geometry** (stance-weighted rms of the four feet, share agreeing on stance; at the same phase → at the best offset; median of all offsets):

| Pair | At the same phase | Best offset (cycles) | Median |
| --- | --- | --- | --- |
| Trot → right canter | 55.2 cm, 54 % | 0.237: 42.3 cm, 69 % | 55.2 cm |
| Trot → left canter | 54.3 cm, 57 % | 0.750: 43.3 cm, 69 % | 55.2 cm |
| Right canter → right gallop | 47.5 cm, 81 % | 0.900: 34.0 cm, 87 % | 73.1 cm |
| Left canter → left gallop | 45.2 cm, 81 % | 0.912: 32.8 cm, 87 % | 73.7 cm |

Each has one clear minimum (the weighting does not move it: 0.250 / 0.750 / 0.912 / 0.925 unweighted). **A correction to §3m:** I called the
trot → canter cost flat; it is 13 cm under the median and has no rival. The erratic results of §3m were four-phase noise.

**Trot → canter, each lead at its own optimum** (right 0.245 further than the trot, left half a cycle more; the committed state is every
faster clip at 0.52, left included; twelve phases):

| | Speed-up | Slow-down |
| --- | --- | --- |
| Right lead | 0.32 / 1.72 / 92 / 151 → 0.20 / 1.16 / 33 / 93 | 0.25 / 1.60 / 96 / 113 → 0.23 / 1.12 / 40 / 88 |
| Left lead | 0.28 / 1.47 / 79 / 141 → 0.19 / 1.10 / 33 / 93 | 0.44 / 1.53 / 93 / 118 → 0.23 / 1.12 / 38 / 88 |

(slip / ground rms / frames over 5 m/s / largest jump.) All four pass the rule (0.55–0.69). The right lead's window is narrow: the
slow-down is good from 0.23 to 0.255 and has 14–15 m/s frames at 0.21 and from 0.26 (the speed-up is good from 0.21 to 0.27); I took
0.245. **It is not kept.** On the campus path, whose turns change the lead (four changes over the four 16 s runs), the whole beat got worse: slip 0.18 → 0.31
m/s and a 14.1 m/s planted-foot frame at 1/120 s (0.16 → 0.22, 2.4 → 7.3 at 1/60 s). The frame is at 14.06 s, mid lead change (`leadMix`
0.52, gait purity 0.5), on the front-right foot. The trot is symmetric under half a cycle and a left-right swap and the canters are not:
the right canter wants 0.245, the left one 0.745, and a lead change cross-fades the two, which half a cycle apart is far worse than
together (the same campus run's trot → canter window improved, slip 0.28 → 0.17, so the alignment itself works). A single offset for
both leads helps only the lead it matches:

| Offset of both canters | Right lead (speed-up / slow-down frames over 5 m/s) | Left lead |
| --- | --- | --- |
| 0.52 (as committed) | 92 / 96 | 79 / 93 |
| 0.765 | **33 / 40** | 143 / 136, slip 0.28 → 0.34 and 0.44 → 0.55 |
| 0.265 | 142 / 136, slip 0.25 → 0.57, a 15.3 m/s frame | **33 / 38** |

**Canter → gallop, one offset for both leads, canter and everything below it at 0.52** (the right and left optima agree here, 0.900 and 0.912,
because the gallops are the canters' mirrors by the same relation, so every right-left relation stays as it was; twelve phases; slip /
ground rms / frames over 5 m/s / largest jump):

| Gallop offset | Right speed-up | Right slow-down | Left speed-up | Left slow-down |
| --- | --- | --- | --- | --- |
| 0.52 (committed) | 0.33 / 1.23 / 61 / 90 | 0.35 / 1.04 / 26 / 98 | 0.36 / 1.16 / 48 / 88 | 0.37 / 1.02 / 34 / 96 |
| 0.395 (y = 0.875) | 0.35 / 1.16 / 34 / 78 | 0.22 / 0.97 / 22 / 75 | 0.36 / 1.04 / 16 / 61 | 0.26 / 0.94 / 19 / 60 |
| **0.42 (y = 0.90)** | 0.34 / 1.18 / 42 / 78 | 0.22 / 0.96 / 21 / 77 | 0.35 / 1.06 / 21 / 62 | 0.26 / 0.95 / 21 / 60 |
| 0.445 (y = 0.925) | 0.36 / 1.16 / 34 / 78 | 0.21 / 0.98 / 20 / 77 | 0.35 / 1.08 / 22 / 61 | 0.25 / 0.95 / 19 / 68 |

At 0.42 all four pass the rule (0.88, 0.78, 0.72, 0.71). The planted-foot maximum of the speed-up, one frame at 8.9 s in the middle of the
canter → gallop cross-fade, is 1.7–2.1 m/s at 0.900–0.905 on both leads (on the left lead also at 0.91 and 0.92) and 5.0–6.2 m/s at 0.88,
0.89 and 0.895 on both leads and at 0.91 and 0.92 on the right lead; the other figures are smooth across 0.88–0.92. **Kept at 0.9025, the gallop and sprint at 0.4225** (canter and trot
0.52, the left and right together, as before).

**Change** (`locomotion.ts` only; `footlock.ts` untouched): `PHASE_OFFSET` gives the gallop and the sprint 0.4225 instead of 0.52;
`GALLOP_PHASE_OFFSET` and the comment above it carry the derivation and the lead-change reason.

**Result** (committed gallop offset → now; the same session):

| Test | Before → now |
| --- | --- |
| Stop from 10 m/s, twelve phases, 1/120 s: frames over 5 m/s (lock-driven) | 128 (14) → 122 (8) |
| The same, ground rms / largest jump | 1.17 / 118 → 1.15 / 118 |
| The same at 1/60 s: frames over 5 m/s (lock-driven) | 54 (7) → 46 (6) |
| Desert canter → gallop, largest lock jump, 1/120 s and 1/60 s | 72 → 61 mm and 128 → 95 mm |
| Desert gallop → sprint | unchanged |
| Desert sprint → gallop, largest lock jump | 88 → 71 mm at 1/120 s, 87 → 99 mm at 1/60 s |
| Sprint → gallop, twelve phases, both leads: frames over 5 m/s | 50 → 24 (right), 49 → 23 (left) |
| Gallop → sprint and a steady 11.5 m/s, twelve phases, both leads | slip 0.56 / 0.54 either way, jump 63–98 either way |
| Lead change R → L at 5.2 m/s (12 phases) | identical (slip 0.11, jump 54 mm) |
| Lead change R → L at 9 m/s (12 phases) | slip 0.38 → 0.39, jump 56 → 55 mm |

The film's own gain is small, much smaller than in the isolated transitions: the whole desert beat is identical, and the stop from 10 m/s
improves 3–15 %. The stops from 1.5, 3.4 and 5.2 m/s, the end beat, the campus beats and the starts are identical to §3m to the printed
figure (none of them reaches a gallop). The single-run ladder step at 11.5 m/s read 5.1 → 6.3 % slip, which twelve phases show to be noise
(0.54 and 0.55 m/s). `npm test` 84 / 84; lint and typecheck clean on the film module. One frame at 1440 px in the middle of a gallop →
canter change (`docs/qa/film/gait_change_gallop_canter_r15_1440.png`) and one at 390 px after a stop from 10 m/s
(`docs/qa/film/stop_from_gallop_r15_390.png`): natural poses, no overflow.

**An error of mine on the way.** My first left-lead baseline used a canter half a cycle from the committed one (the helper put the left clip
at the mirror offset even for "no alignment"), so the left rows of one table were measured against the wrong state. I found it by reading the
printed offsets and redid the left lead against the committed configuration; the numbers above are from the redo.

**Left as it is**
- **Trot ↔ canter stays unaligned** (55 cm of mismatch, 54 % of the feet agreeing on stance). The canter → trot part of the 5.2 m/s stop
  still has 43 frames over 5 m/s. Aligning both leads needs the lead change to blend the two canters while their offsets differ by half
  a cycle, which is a time-warp of the clip, or re-authored clips; I tried neither.
- The film's own gain from the gallop offset is small, and the sprint → gallop jump at 1/60 s is 14 % higher (87 → 99 mm).
- The offsets belong to these clips; re-derive them if the gaits are re-authored. The constants come from the desert path with the lead
  forced; the village and a steeper change were not tried.
- Not checked: the village, a phone, the production build, the anatomy page; the motion by eye (two stills).

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
- Ground slip 3–9 % with the foot-lock on (was 11–14 % without it), and 0–5 stances per run at gallop and sprint never touch the ground (§3b). The walk is a shorter, quicker stride than first built.
- The state machine is continuous (speed bands and layers), not a table of named states: "Deceleration" and "Recovery" are what the speed controller and the effort model produce, not separate clips.
- Nostril flare and micro-bump are not built.
- Sound is a synthesized placeholder, quiet by design; replace with recorded hoofbeats if the owner wants realism.
- QA hooks (`window.__stallionFilm`, `qaRun`, `qaPick`, `qaMuzzle` / `qaEye` shots) are available only outside production or with `?filmdebug=1`.

## 7. Rebuilding and re-testing

```
Blender -b --factory-startup -P tools/blender/03_animation/stage11_gaits.py -- in.blend out.blend gaits.json
Blender -b --factory-startup -P tools/blender/04_export/stage10_export.py   -- out.blend marwari-hero.glb 2048 1024
```
Hero `s9` input: `tools/blender/source/marwari_hero_source.blend` (now includes the gait clips). The generator prints `AUTOBIAS` lines (chosen reach offsets and each side's error); `GAIT_SYM=0` centres each stance on its own leg's rest position as before and per-clip `toeSwing…` figures; `GAIT_PRECOMP=1` turns on the rejected sole pre-compensation; `GAIT_ONLY=Walk` builds one gait (about 25 s); `GAIT_OVERRIDE='Walk:foldScale=0.3,lift.F=0.12'` edits a copy of one gait's table for an experiment; `GAIT_DEBUG=FL,HL` prints the per-key swing speed of those hooves. The matching anatomy source (`marwari_anatomy_source.blend`) is excluded from git on this machine (`.git/info/exclude`) and was updated on disk only. Copy `gaits.json` to `public/models/marwari-gaits.json`. In the browser: `/?stallion=preview&filmdebug=1`, then in the console `__stallionFilm.goTo(1|2|3)` and `__stallionFilm.qaRun([[speed, seconds], ...])`.

## 8. Files

New: `components/stallion-film/{engine,locomotion,footlock,life,shots,terrain,sky,effects,environment,textures,noise,hoofsound}.ts`, `components/stallion-film/scenery/{desert,village,campus,geo}.ts`, `public/models/marwari-gaits.json`, `tools/blender/03_animation/{stage11_gaits,reach_probe}.py`, `tools/blender/00_import_inspect/rig_audit.py`, `docs/qa/film/*`.

Changed: `components/3d/marwari.ts` (physical coat, face materials, film coat grade), `components/hero/StallionStage.tsx` (film hooks), `components/sections/home/StallionHero.tsx` (pinned film, chapter navigation, skip), `lib/audio/engine.ts` (`soundReady()`), `public/models/marwari-{hero,hero-mobile,anatomy}.glb` (new clips), `tools/blender/source/marwari_hero_source.blend`, `docs/MARWARI_3D_PRODUCTION_REPORT.md` (rebuild note), `PROGRESS.md`.
