# Motion Lab: multi-animal upgrade, test results and limits (7 Nov 2026)

`/motion-lab` finds animals in a video or a live camera, names the species, gives each animal its own ID, draws its skeleton and
reads how it moves. Everything runs in the browser (LiteRT.js: WebAssembly, or WebGPU when asked). No paid API, nothing uploaded
unless a signed-in person presses "Save to account".

This page records what was tested, on what, and what failed. A species, gait or device is listed as supported only where a test
below supports it.

## 1. Setup

```bash
npm run motion-lab:assets   # copies the LiteRT runtime, downloads both models, checks SHA-256 (also runs before dev and build)
npm run dev                 # then open /motion-lab
node --test tests/motion-lab.test.mjs
```

Models (Apache-2.0, pinned revisions in `scripts/motion-lab-assets.mjs`): YOLOX-Nano COCO detector (2.2 MB) and RTMPose-m AP-10K
(27.5 MB, fp16). Both file hashes were verified on download.

Test footage is kept in `test-media/` (git-ignored) with sources and licences in `test-media/SOURCES.md`. In a development
browser `window.__bsahMotion` exposes the estimator (`probeDetect`, `probePose`) for benchmarks; production builds never set it.

## 2. What changed

| Area | Before | Now |
| --- | --- | --- |
| Detection | horse class only | nine COCO animal classes (horse, dog, cat, sheep, cow, zebra, bear, elephant, giraffe), one species per box (class-agnostic NMS), a person is never called an animal, runner-up class kept to flag doubt |
| Tracking | one animal | `lib/motion-lab/tracker.ts`: IDs, colour-histogram look-alike check, species vote, revival after occlusion |
| Species rule | n/a | named only when the vote share is 0.7 or more and detector score 0.4 or more; otherwise "Animal (species unsure)", box only |
| Pose | horse only | the same RTMPose model per animal, only for species that were tested (`lib/motion-lab/species.ts`); the rest are boxed and labelled "detected only" |
| Gait | horse method, one signal | species profiles, two signals (paw position along the body, paw lift), detrending, foreshortening gate, aliasing check, reasons for "unclear" |
| Reports | one PDF per session | one PDF per animal plus a session summary (species, ID, coverage, visibility per joint, movement timeline and reasons, angles, proportions, charts, annotated frames, speed, models, limits) |

## 3. Why gait came out "100% unclear" (found on real footage, fixed)

Real horse clips were run through the old pipeline and the saved keypoints analysed offline.

1. **Unstable body-length normalisation.** Each paw position was divided by that frame's neck-to-tail length. When the animal
   turned toward the camera that length fell to under 1 px (the old guard was 8 px), so paw signals swung by about one body length
   and no rhythm survived. Fix: divide by the window's typical (75th percentile) body length, and leave out foreshortened frames.
2. **Drift mistaken for a stride.** The strongest spectral peak sat on the lowest allowed frequency (0.40 strides/s) in most windows:
   body movement and a turning path, not legs. Fix: remove a moving average first, search from 0.5 strides/s, reject edge peaks.
3. **Only one reading of the legs.** A paw's position along the body needs a side view. Added the paw's lift under its own shoulder
   or hip, which still works when the animal approaches the camera; the steadier of the two is used.
4. **No reasons.** "Unclear" hid whether the view, the footage length or the rhythm was at fault. Each unclear window now carries a
   reason, counted in the report.
5. **Frame sampling.** A rhythm above 45% of the real frame rate cannot be told from its alias and is now refused.

Effect on the same saved keypoints (`horse_r3c_a`, a horse circling a round pen): from every window unclear to 11 of 17 windows
named (standing, trot, canter, walk). `horse_r3c_b` (ridden): unchanged, 22 of 22 trot.
The original report the owner mentioned (89% detection, 17 of 17 joints, 100% unclear) was not available, so this diagnosis comes
from the clips below, not from that file.

## 4. Results

### 4.1 Pose accuracy against human annotations

AP-10K validation split (CC BY 4.0, via `tlpss/ap10k-cropped-512x512`), 240 random instances with at least 8 labelled points,
3,053 labelled points. The model was given the ground-truth box (this measures pose only, not detection). PCK = share of points
within a fraction of the box's longer side. The species column is what the detector named on the crop (not the dataset's label,
which was removed upstream).

| Group | Images | PCK@0.05 | PCK@0.1 | PCK@0.2 |
| --- | --- | --- | --- | --- |
| All | 240 | 0.759 | **0.914** | 0.966 |
| Detector said horse | 11 | 0.839 | 0.950 | 0.988 |
| Detector said dog | 42 | 0.746 | 0.910 | 0.962 |
| Detector said cat | 15 | 0.768 | 0.919 | 0.973 |
| Other or not detected | 172 | 0.755 | 0.911 | 0.964 |

Weakest points (PCK@0.1): hind paws, hips and knees (0.85 to 0.89). Eyes and nose are best (0.95 to 0.98). The horse and cat rows
rest on few images. The model was trained on AP-10K train, so this is held-out data but the same domain.

### 4.2 Real video

All clips are real footage except `hero-loop` (AI-generated, used only for the pipeline test). Gait ground truth does not exist for
these clips; labels were judged by checking stride rate against textbook ranges and by looking at frames, not by an expert.

| Clip | Animals | Result |
| --- | --- | --- |
| `horse_r3c_b` (ridden horse, 24 s, 720p) | 1 horse, 1 ID | skeleton 100% of frames; trot at 1.24 strides/s in 22 of 22 windows, diagonals in step |
| `horse_r3c_a` (horse circling a round pen with a handler) | 1 horse, 1 ID; the handler is not labelled an animal | skeleton 100%; 11 of 17 windows named (trot, canter, walk, standing); the rest unclear because the horse faces the camera or turns |
| `dog_walk_sf` (leashed dog, side view, 17 s) | 1 dog, 1 ID | skeleton 100%; "moving" at 1.3 to 1.8 strides/s in 12 of 15 windows |
| `dog_greyhound_run` (running dog, vertical, panning camera; the file is titled slow motion) | 1 dog, 1 ID | skeleton in 93% of frames; **0 of 12 windows named**. Cause found in the raw paw signals (see 4.6): the dog turns away (body length 450 px to 200 px) and the paw values drift slowly with no stride oscillation for any method to find |
| `cat_sophy_ledge`, `cat_calico_kitten` (colour phone video) | 1 cat each (plus 2 short unsure tracks on the kitten clip) | named "Cat", skeleton in 74 to 79% of frames; "moving" in 2 of 5 and 5 of 13 windows |
| `cat_stealth_1` (grayscale 352x288 lab footage) | none found | **fail**: best detector score 0.07, called a cow. 0% tracked |
| `multi_wild_dogs` (about 12 African wild dogs from behind, 24 s) | after the second round: 36 raw IDs (was 54), 8 reported, none named | still a weak multi-animal test: all stay "species unsure" (no wrong names), IDs are fragmented. See 4.4 and 4.7 |
| `hero-loop` (AI horse) | 1 horse | detected, 17 of 17 joints; the rearing horse gives "unclear" |

### 4.3 Camera, recording, reports

Tested in Chromium with a stand-in camera stream made from a horse clip (no physical camera): consent dialog, detection of "Horse 1"
at about 7 frames/s on the CPU, a 6 s recording that replays with a correct duration, CSV, JSON and PDF downloads. PDF reports for a
single dog and a multi-animal summary were generated and read (3 pages for the dog: identity and coverage, visibility table, movement
timeline with reasons, angles and proportions, three charts, annotated frames, speed, models, limitations).

### 4.4 Tracking and IDs

* Single-animal clips: one ID per animal in all six, no spurious second animal that lived 10 frames or more (the kitten clip's two
  extra tracks lived about 1.5 s and were never named).
* Crowd: the wild-dog pack produced 54 raw IDs for roughly 12 animals with the animals partly hidden behind each other. After the
  second round (stricter confirmation, 6 s revival, duplicate-track merging) the same clip gives 36 raw IDs. That is better but still
  about three times the animals; IDs are not reliable in dense groups. Sessions report only the 8 longest-lived tracks and count the rest.
* Not measured: ID-switch rate against a labelled multi-animal ground truth. No such labelled clip was available.

### 4.5 Speed (Chromium on this Mac, 1 animal unless noted)

| Accelerator | Per-frame time (mean / p95) | Frames per second |
| --- | --- | --- |
| WebAssembly (CPU) | horse 139 / 182 ms, cat 128 / 162 ms, dog 189 to 223 / 292 to 453 ms | about 4 to 7 live, 2.6 to 4 in upload analysis |
| WebGPU | pose 31 ms (single horse); 4 to 8 animals 43 ms mean / 105 ms p95 | about 2 in upload analysis of the pack (limited by the pose budget) |

Pose is about 110 to 120 ms per animal on the CPU, so a frame with four animals takes about half a second: the estimator caps pose
work at about 350 ms per frame and boxes the smaller animals that frame. Memory, GPU use and battery were not profiled.

### 4.6 Second round: the greyhound

The clip is titled "Slow motion of running greyhound", and slow motion stretches the stride below the normal search band (0.5 per
second), where the 1.4 s detrend filter also removes it. A slow-footage pass was added (`estimateGait`: 8 s window, 0.2 to 1.6 per
second, 3.5 s detrend, no real-time stride ranges, no canter/gallop split). It runs only when the normal pass finds legs moving without
a steady rhythm, and says so in the note. On the leashed dog it recovered two more windows (13 s and 16 s) at the same stride rate as their
neighbours. On the greyhound it still finds nothing, and the raw paw signals show why: during the run the dog turns away, the paw
heights drift for over a second at a time, and there is no stride oscillation at 15 frames per second to find. This is a limit of the
pose model on this clip, not of the thresholds, so the thresholds were not loosened to force a label.

### 4.7 Second round: the pack

The detector's raw output on the pack was recorded (355 frames, 1,770 boxes): "dog" 46 times, "horse" 1,063, "cow" 503, others 158.
The animals are all dogs, so no tracker rule can name them correctly; the aim is to not name them wrongly. Changes, tested first
offline on that recording (`probeDetect` plus a replay of the tracker) and then in the browser:

| Change | Effect on the recorded pack |
| --- | --- |
| three detections to confirm a track, 6 s revival, looser overlap gate | 59 to 40 raw IDs |
| merge two live tracks that sit on one animal | 40 to 39 |
| crowd rule: with four or more animals in view, name a species only at vote share 0.85 and score 0.55 | wrongly named track-frames 555 to 25 |

End to end in the browser (WebGPU): raw IDs 54 to 36, and 25 of 3,569 track-frames still carry a name ("horse"). The cost of the crowd rule
is that a real horse inside a herd of four or more is also "unsure" unless the detector is very sure of it.

### 4.8 CPU and WebGPU give different legs

The same round-pen clip names 11 of 17 windows on the CPU and 7 of 17 on WebGPU (fp16 on the GPU shifts paw points slightly). Gait labels
are therefore not identical across devices; treat a label as an estimate that can change with the accelerator.

## 5. What works, what is experimental, what fails

**Works (tested)**
* Species naming of single horses and dogs in real video, and of cats in colour video.
* Skeletons for horse, dog and cat, with PCK@0.1 of about 0.91 on human-labelled data.
* One stable ID per animal in single-animal videos; separate PDF per animal and a summary PDF.
* WebGPU with automatic fallback to WebAssembly; camera, recording, replay, CSV, JSON, PDF in Chromium.

**Experimental (works, weakly evidenced)**
* Horse gait names. Trot is supported by one clean clip; canter and walk windows appeared but were not confirmed against ground truth;
  gallop was never observed.
* Dog and cat movement: only "stationary" and "moving (type unclear)" with a stride rate. Walk, trot and run are deliberately not
  named: the pose model confuses near-side and far-side legs, so a walk cannot be told from a trot, and no clip confirmed a run.
* Two animals in one frame (one kitten clip); tracking behind occlusion.

**Fails or not supported**
* Cats in grayscale or very low-resolution footage (not detected).
* Crowds and overlapping animals: the detector names wild dogs horse or cow; the crowd rule now leaves them "species unsure" instead, and IDs are still fragmented (about three times too many).
* Sheep, cow, zebra, bear, elephant, giraffe: found and named by the detector, boxed only, no skeleton or movement.
* Animals seen head-on, small in the frame, or hidden by a rider, rail or other animal: skeleton degrades, gait is "unclear".
* Any species the COCO detector does not know (named as the nearest class or missed).
* Veterinary or lameness conclusions: never offered; the skeleton points are generic AP-10K points, not hoof, fetlock or hock.

## 6. Not tested

Safari, iPhone, Android, Firefox, a physical camera and its permission prompt, long recordings, memory and battery, a labelled
multi-animal ID benchmark, gait ground truth from an expert, cloud save (and its Supabase migration), `npm run build`.
Chromium on this Mac no longer decodes Ogg/Theora (`.ogv`); the page says so, and the clips were converted to WebM for testing.

## 7. Files

`lib/motion-lab/{species,detect,tracker,runtime,analysis,export,draw,types}.ts`, `components/sections/motion-lab/{MotionLab,Panels}.tsx`,
`app/motion-lab/page.tsx`, `tests/motion-lab.test.mjs` (28 tests: maths, decoding, tracker and gait rules; synthetic inputs check the
code and are not results), `scripts/motion-lab-assets.mjs`.
