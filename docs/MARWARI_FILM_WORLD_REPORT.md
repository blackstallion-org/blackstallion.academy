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

- Banked turns still leave some hover (campus sprint 21 % of mid-stance frames over 2 cm, 11 % over 4 cm) and the lock lets go
  in about a third of mid-stance frames there.
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
Hero `s9` input: `tools/blender/source/marwari_hero_source.blend` (now includes the gait clips). The generator prints `AUTOBIAS` lines (chosen reach offsets) and per-clip `toeSwing…` figures; `GAIT_PRECOMP=1` turns on the rejected sole pre-compensation; `GAIT_ONLY=Walk` builds one gait (about 25 s); `GAIT_OVERRIDE='Walk:foldScale=0.3,lift.F=0.12'` edits a copy of one gait's table for an experiment; `GAIT_DEBUG=FL,HL` prints the per-key swing speed of those hooves. The matching anatomy source (`marwari_anatomy_source.blend`) is excluded from git on this machine (`.git/info/exclude`) and was updated on disk only. Copy `gaits.json` to `public/models/marwari-gaits.json`. In the browser: `/?stallion=preview&filmdebug=1`, then in the console `__stallionFilm.goTo(1|2|3)` and `__stallionFilm.qaRun([[speed, seconds], ...])`.

## 8. Files

New: `components/stallion-film/{engine,locomotion,footlock,life,shots,terrain,sky,effects,environment,textures,noise,hoofsound}.ts`, `components/stallion-film/scenery/{desert,village,campus,geo}.ts`, `public/models/marwari-gaits.json`, `tools/blender/03_animation/{stage11_gaits,reach_probe}.py`, `tools/blender/00_import_inspect/rig_audit.py`, `docs/qa/film/*`.

Changed: `components/3d/marwari.ts` (physical coat, face materials, film coat grade), `components/hero/StallionStage.tsx` (film hooks), `components/sections/home/StallionHero.tsx` (pinned film, chapter navigation, skip), `lib/audio/engine.ts` (`soundReady()`), `public/models/marwari-{hero,hero-mobile,anatomy}.glb` (new clips), `tools/blender/source/marwari_hero_source.blend`, `docs/MARWARI_3D_PRODUCTION_REPORT.md` (rebuild note), `PROGRESS.md`.
