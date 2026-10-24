# Marwari 3D production report

Branch: `feature/marwari-3d-production` (from `session/2026-10-24-marwari-rig`) · rollback checkpoint: tag `checkpoint/pre-marwari-production` (commit `a77c9da`, the single-mesh rig delivered the same day) · date: 24 Oct 2026 · Blender 5.2.3 LTS on an Apple M2 (8 GB RAM, 5.6 GB free disk).

Nothing is deployed or merged. The hero stage is still behind `/?stallion=preview` and `NEXT_PUBLIC_STALLION_MODEL`; the anatomy plate uses the new model for everyone.

**Is it photorealistic? No.** The renders in `docs/reference/3d/marwari/renders/final/` show a convincing, anatomically sound black Marwari with a satin coat, real hair cards and wet-looking eyes. Coat detail is a 2048 px bake of a 1024 px AI texture, the mane reads blocky up close, and the animation is procedural, not captured. See "Known defects".

Status words: **Verified** = implemented and checked with evidence named here · **Implemented** = built, not independently verified · **Partial** · **Blocked** · **Not implemented**.

## 1. Deliverables

| # | Deliverable | Status | Path |
| --- | --- | --- | --- |
| 1 | Editable Blender project | Verified (opens, rebuilds, exports) | `tools/blender/source/marwari_hero_source.blend` (committed). `marwari_anatomy_source.blend` is kept locally (git-excluded, 24 MB; regenerate with the scripts). |
| 2 | Clean animation-ready mesh | **Partial**: hybrid, see §3 | in the `.blend`: `Marwari_Low`, `Marwari_Hair`, `Marwari_Eyes` |
| 3 | Functional skeleton | Verified | 46 bones (`MarwariRig`), see §5 |
| 4 | Animation actions | Verified (rendered contact sheets) | 10 actions, §6 |
| 5 | Hero GLB | Verified | `public/models/marwari-hero.glb` 1.03 MB, 37.6k tris, 3 draw calls |
| 5b | Mobile hero GLB | Verified (loads on phone-width/coarse-pointer) | `public/models/marwari-hero-mobile.glb` 0.65 MB (1024 px textures) |
| 6 | Anatomy GLB | Verified | `public/models/marwari-anatomy.glb` 1.2 MB, 63.2k tris |
| 7 | Texture assets | Verified | `tools/blender/textures/` (2048 base, normal, ORM; 1024 hair atlas) |
| 8 | Blender automation | Verified (ran end to end) | `tools/blender/` (00 inspect → 05 validate/render) |
| 9 | Multi-angle renders | Verified | `docs/reference/3d/marwari/renders/final/` |
| 10 | Animation previews | Verified | `…/final/sheet_{idle,walk,trot,head_turn,ears,attention}.png` |
| 11 | Three.js integration | Verified | `components/3d/marwari.ts`, `components/hero/StallionStage.tsx`, `components/sections/anatomy/Anatomy3DHorse.tsx`, `components/sections/home/StallionHero.tsx` |
| 12–14 | Hotspots, camera, gyro/touch | see §8–9 | |
| 15 | A11y / reduced-motion fallbacks | Verified (§10) | |
| 16 | Performance report | **Partial** (§11) | |
| 17 | Model licence record | Verified (research) | §12, `docs/reference/3d/marwari/LICENCE.md` |
| 18 | QA report | §10 | |

The stack is three.js directly (not React Three Fiber): the existing hero and plate were already three.js/WebGL components and loading a skinned, Draco-compressed GLB with mixer, custom shader injection and a gaze layer is simpler without a reconciler. R3F stays installed for the other 3D sections.

## 2. Layer 00: inspection and safety

| Item | Status | Evidence |
| --- | --- | --- |
| Inspect Tripo asset and verify the "reported" facts | Verified | `tools/blender/00_import_inspect/audit_mesh.py`, `glbmeta.py` on `backups/marwari-original/tripo-original-horse.glb` |
| Branch `feature/marwari-3d-production` | Verified | `git branch` |
| Backup of original GLB + checksum | Verified | `backups/marwari-original/` (git-excluded, 29.6 MB), SHA-256 `8696707164feff40fde8f3920e9ab42469816c48c2615a981eb8fee914cf9ace` |
| Rollback checkpoint | Verified | tag `checkpoint/pre-marwari-production` → `a77c9da` |
| Read `BLUEPRINT.md`, `HeroFilm`, `HorseSequence`, `Instrument`, plate/anatomy/stage components | **Partial** | components read in full; `BLUEPRINT.md` and `HeroFilm.tsx` only searched/skimmed for the facts needed (breed standard, hero structure) |

Facts verified from the actual asset: generator **Tripo**; **970,583 triangles** (566,401 raw vertices, 485,282 after welding); **three 1024×1024 JPEG maps** (base colour, normal, roughness/metal); **one mesh, one node, no skin, no animations**; 29.6 MB; one connected component (so mane and tail are fused into the body); 5 non-manifold edges and 1 boundary edge after welding (the model is watertight apart from those); median edge length 1.9 mm at native scale; inward-curving lyre ears, bay/brown coat, white blaze and socks. The "30 MB" and "970 k" figures in the brief were correct. (A crude "inward-facing normals" counter in the audit returned a large number and is not meaningful; orientation was instead confirmed by signed volume: +0.496 m³ on the detail mesh, +0.515 m³ on the new low mesh.)

## 3. Layers 01–04: Blender, anatomy study, retopology, refinement

| Item | Status | Notes |
| --- | --- | --- |
| Blender installed, importer/exporter, render engine | Verified | Blender 5.2.3 was already installed; headless glTF import/export and Eevee/Cycles renders run every stage |
| `tools/blender/` workspace | Verified | scripts grouped 00_import_inspect, 01_prepare, 02_rig, 03_animation, 04_export, 05_validate_render |
| Reference study | **Partial** | one real Marwari photograph (`MarwariHorseRajasthan.jpg`: black stallion, ears meeting at the tips, long arched neck) plus the supplied sculpt; no wider photographic or veterinary-atlas study was performed |
| Quad retopology, 20–40k quads | **Partial** | see below |
| Edge loops at eyes, mouth, joints | **Not implemented** | Quadriflow follows curvature but does not honour hand-placed loops; legs/neck came out with clean flow, face loops are not controlled |
| Anatomical refinement (ear cavities, eyelids, nostrils, tear ducts…) | **Not implemented** | the sculpt's own detail is baked; only eye domes were added. No new anatomy was invented, per the directive |

### What the retopology really is

A pure Quadriflow of the whole horse (`tools/blender/01_prepare/retopo_quadriflow.py`) gave a clean all-quad body (25.7k quads) but destroyed the thin or curled parts: the Marwari ears flattened into wedges, the tail became a solid blob, the mane merged into the neck. So the final mesh is a hybrid (`stage7_hybrid_retopo.py`):

- **Body, head, legs**: voxel shell → Quadriflow. Hero 18.7k quads, anatomy 32.0k quads (all-quad, good flow). Cut open at the ear bases and tail root, then closed.
- **Ears and the poll/forelock tuft**: cut from the 213k detail mesh and decimated to triangles (2.1k tris hero, 3.8k anatomy). **This is decimation, not retopology**, and it is the one region that most needs hand work.
- **Tail**: removed from the mesh; replaced by hair cards (§4).
- **Mane**: baked into the neck ridge plus hair cards.
- All surface detail (colour, normals, roughness, AO) is **baked** from the 213k detail mesh onto one UV atlas with Cycles (`stage8_uv_bake.py`). Hi-vs-low renders (`render_hi_vs_low.py`) match closely.
- Weights transferred from the rigged detail mesh by nearest surface (`Data Transfer`), limited to 4 influences.

Hero totals: 18,378 faces / 34.7k tris (body + ears) + 2.0k tris hair + 0.9k tris eyes = **37.6k tris**.

## 4. Layer 05: materials and hair

| Item | Status | Notes |
| --- | --- | --- |
| Black non-metallic coat, subtle warm highlights | Verified (renders) | metallic 0; base colour regraded to flatten the broad warm patches left by the first repaint (`stage9_finish.py`) |
| Roughness variation, AO | Verified | ORM texture: R = baked AO, G = roughness (clamped 0.3–0.95), B = 0 |
| Normal, base colour, roughness, AO bakes | Verified | `tools/blender/textures/`, 2048 px |
| Eye material, wet look | **Partial** | glossy dome per eye (roughness 0.06, env-map reflection); no refraction, no tear film, no corneal bulge shading |
| Hair material | Verified | alpha-tested cards, procedural strand atlas (`marwari_hair_1024.png`), double-sided |
| Separate materials for inner ears, nostrils, muzzle, hooves | **Not implemented** | one coat material covers them (single atlas) |
| Two profiles (desktop / mobile) | Verified | 2048 px vs 1024 px textures; mobile GLB chosen on `max-width: 820px`, coarse pointer or Save-Data |
| Compressed GPU textures (KTX2) | **Not implemented** | no `toktx` on this machine; textures ship as WebP |
| Hair cards instead of plastic sheets | Verified | tail: 72 ribbons (9 segments each); mane: 53 ribbons over the crest, falling to the horse's left; weighted to `Tail_1–4` / `Mane_1–4` |

## 5. Layer 06: rig

46 bones: `Root`, `Body`, `Pelvis`, `Spine_Lumbar`, `Spine_Thoracic`, `Ribcage`, `Neck_1–3`, `Head`, `Ear_L/R` + tips, `Eye_L/R`, `Tail_1–4`, `Mane_1–4`, per foreleg scapula/humerus/forearm/cannon/pastern/hoof, per hind leg femur/gaskin/cannon/pastern/hoof.

| Item | Status | Notes |
| --- | --- | --- |
| Skeleton, weights, deformation | Verified | walk and trot contact sheets show no collapsing shoulders, broken fetlocks or neck stretching; carpus reads slightly rubbery at full swing flexion |
| IK/FK controls in the rig | **Partial** | legs are posed by a planar two-bone IK solver inside the animation script and baked to FK keys; no IK constraints or control bones are left in the rig for animators |
| Ground contact | **Verified for the previous (single-mesh) rig** by numeric hoof-height checks (`tools/blender/03_animation/diag_feet.py`); on the new mesh, checked visually in the walk/trot contact sheets only |
| Facial controls: blink, ear swivel | Verified (sheets) | eyelid closure is a squash of the eye bones and the dome, not true lids |
| Nostril movement, jaw | **Not implemented** | no separate geometry exists; breathing is chest-only |

## 6. Layers 07–08: animation

Ten actions, exported with only the bones each one needs so they layer freely (`tools/blender/00_import_inspect/anim_channels.py` lists channels per clip):

| Clip | Length | Status | Notes |
| --- | --- | --- | --- |
| `Idle_Breathing` | 4.0 s | Verified | rib swell 2.4 %, played continuously (hero and plate) |
| `Head_Turn` | 8.0 s | Verified (sheet) | exists as a clip; the hero's live head tracking is a runtime layer over the idle pose (§8) |
| `Ear_Rotate` | 4.0 s | Verified (sheet) | independent swivels, asymmetric |
| `Blink` | 0.5 s | Verified | random interval in the hero and plate |
| `Weight_Shift` | 6.0 s | Verified | rests the right hind; played occasionally in the hero |
| `Walk` | 1.2 s | Verified (sheet) | four-beat lateral sequence (LH, LF, RH, RF) |
| `Trot` | 0.7 s | Verified (sheet) | two-beat diagonal pairs with suspension |
| `Tail_Sway` | 3.0 s | Verified | travelling wave, bounded |
| `Attention_Response` | 3.0 s | Verified (sheet) | new: ears forward, small head lift and turn, eye widening; plays when a visitor's pointer enters the hero and when "Ears" is chosen in the plate |
| `Mane_Sway` | 4.0 s | Implemented | new: small bounded wave down the four mane bones |
| Calm transition (idle ⇄ gaze ⇄ camera focus) | n/a | **Partial** | not a clip: done at runtime by eased gaze, 0.6 s clip cross-fades between stand/walk/trot, and an eased camera |

Secondary motion is bounded bone animation (tail, mane, ears), deliberately no cloth/hair physics. No motion capture; gait timing is procedural.

## 7. Layer 09: render validation

`docs/reference/3d/marwari/renders/final/`:

- Neutral studio (grey) from the front, back, left, right, front three-quarter, rear three-quarter: `qa_*.png`, tiled in `sheet_neutral_views.png`.
- Head `qa_head.png`, ear `qa_ears.png`, hoof/lower-leg `qa_legs.png` close-ups.
- Cinematic hero still, warm rim light on a dark background: `hero_cinematic.png` (Eevee, AgX).
- Contact sheets: idle, walk, trot, head turn, ears, attention.
- Earlier-stage evidence: `docs/reference/3d/marwari/renders/` (skeleton overlay, first-generation rig sheets).

Comparison against real Marwari references was limited to one photograph (§3). No approval is claimed from a single angle: all six neutral views were inspected and the defects below were recorded.

### Known defects (from those renders)

1. A small flat darker notch at the croup where the tail root is closed (visible from behind).
2. A faint smooth stripe and specular line on the face where the white blaze was repainted.
3. Mane and forelock: the cards look blocky up close; the poll/forelock tuft is a decimated sculpt piece with ragged edges.
4. Ears and tail are baked from a 1024 px source; close-ups are soft. The ears read as thick, smooth horns more than as thin, veined organs (no inner-ear cavity).
5. Eyes are bead-like domes: wet, but not anatomically detailed.
6. The coat is texture-painted (no fur shading); it reads as satin, not as individual hairs.
7. Carpus softness at full flexion (§5).

## 8. Layers 10–11: GLB export and the homepage hero

| Item | Status | Evidence |
| --- | --- | --- |
| Hero GLB < 4 MB | Verified | 1.03 MB (desktop), 0.65 MB (mobile); 37.6k tris; 3 meshes/materials (coat, hair, eyes) |
| Draco geometry, WebP textures | Verified | existing local decoder (`public/draco`) |
| Meshopt | **Not implemented** | Draco kept for compatibility with the existing loader |
| Cursor gaze, bounded and eased | Verified (browser) | head turned left and right under the pointer; gaze is applied *over* the playing clips (`createGaze` undo/apply) |
| iOS motion permission after a gesture, denial fallback | **Verified with a stubbed API; not on a device** | permission requested only after the "Enable tilt" tap; on `denied` the button hides, the hero keeps running, touch drag remains; 0 page errors |
| Touch drag | **Implemented, not verified on a touch device** | pointer handler sets the gaze target; page scroll is not blocked (`touch-action: pan-y`) |
| Breathing, tail, ears, mane, blink, occasional weight shift | Verified | continuous while visible; the loop pauses off-screen (IntersectionObserver) |
| Time-of-day lighting (dawn gold, day neutral, dusk amber, night low-key) | **Implemented; only the current-hour state was viewed** | continuous interpolation across four stops, refreshed each minute |
| Click-to-dolly → `/cadets#passport` | Verified | camera eased to the head in 1.3 s, then navigation; 7 repeat cycles OK after the fix below |
| Keyboard activation | Verified | focus-visible ring, Enter reaches `/cadets#passport` |
| Reduced motion | Verified | one still frame, no gaze/clips, click goes straight to the passport (0.6 s) |
| WebGL unavailable | Verified | a stubbed `getContext` returned null: the poster still (`marwari-hero-poster.webp`) and the passport link show; the plate falls back to the 2D archive plate with a notice |
| "Weak device" fallback | **Not implemented** | only failure and reduced motion fall back; weak GPUs get the mobile GLB and dynamic resolution instead |
| Camera never clips the model | Verified by view | the dolly target stays outside the head; distance is fitted to the canvas aspect so the whole horse always fits |

A real bug was found and fixed during QA: after navigating to `/cadets` and back, Next's route cache re-shows the stage with its old state (camera stuck at the dolly end; click ignored). The stage now resets that state when it starts and when it re-enters the viewport. Seven consecutive round trips pass.

## 9. Layers 12–14: anatomy plate, switcher, scroll sequence

| Item | Status | Notes |
| --- | --- | --- |
| Five hotspots: Ears, Neck, Saddle, Reins, Hooves | Verified | markers are projected from skeleton bones each frame, so they follow the pose |
| Labels: 180° of Attention · The Crest · The Moving Floor · Ten Grams · Desert Feet | Verified | `lib/content/anatomy.ts` |
| Highlight, fly-to camera, info panel | Verified | region glow injected into the coat shader; panel updates; keyboard Enter on a focused marker selects (axe: no issue with the markers) |
| Mouse / touch / keyboard, focus indication, screen-reader labels | Verified (mouse, keyboard) | touch not tested on a device |
| Return to overview | Verified | "Reset View" |
| Ears demonstrate movement; Hooves demonstrate contact | Implemented | Ears plays `Attention_Response`; Hooves switches to a slow Walk |
| Reins: tack | **Partial** | the asset has no reins or bridle, and none were built; the highlight sits at the mouth/noseband region and the copy was adapted |
| Headline "Five hundred kilograms / that read you first." | Verified, unchanged | `lib/content/home.ts` |
| Fullscreen | Implemented | "Full Screen" button on the plate |
| 2D / 3D switcher keeps topic, no layout jump, stops WebGL in 2D | Verified | topic survived 3D → 2D → 3D; the viewer unmounts in 2D so rendering stops |
| `HorseSequence.tsx` (32-frame scroll scrub) | **Reviewed, not modified** | it already had uncommitted edits in the working tree from before this task; no change made |

Copy changes made for evidence safety (flag for the owner): the "Ten Grams" hotspot metric now reads "LIGHT-CONTACT INTERFACE" and its text no longer states a pressure figure; the ears text no longer says they "track the rider's breathing". The site-wide "Ten grams against half a tonne" line (`AnatomyScenes.tsx`, journal, `docs/BLUEPRINT.md`) was **not** changed and is still an unsupported figure if read literally; that is an editorial decision for the owner.

## 10. Layer 17: QA

| Check | Result |
| --- | --- |
| `npm test` (unit) | 79 / 79 pass |
| `npm run typecheck` | pass |
| `eslint components lib app` | 0 errors; 8 warnings, all in files this work does not touch |
| `npm run build` | pass (final code) |
| Browser: model loads, animations play, hotspots, camera transitions | Verified (Chrome via Playwright and the built-in browser; production build) |
| axe-core (hero section) | 0 violations |
| axe-core (anatomy plate) | 1 `color-contrast` finding on the info-panel paragraph, which is mid-fade in the existing `ScrollRevealText`; present before this work |
| Reduced motion | Verified (hero, plate) |
| Keyboard | Verified (hero button, markers, switcher) |
| Gyro permission denied | Verified with a stubbed API only |
| WebGL unavailable | Verified |
| Slow network | Verified: slow-4G-style throttling (1.6 Mbit/s, 150 ms) showed the model in 2.5 s |
| Low-powered device | **Partial**: CPU throttle 4×/6× held ~60 fps, but the GPU was an unthrottled M2, so this says nothing about phone GPUs |
| Console errors | 0 from this work. Remaining warnings come from the vendored `public/anatomy/vendor/three.min.js` (other pages). `THREE.Clock` deprecation fixed. |
| Memory / leak | Heap after GC: 13 → 21 MB over 7 hero mount/unmount cycles, flat DOM node count from cycle 2, heap growth ~0.3 MB/cycle and event listeners +11/cycle at the end; **not attributed to this code and not fully explained**. WebGL objects are disposed on cleanup (`disposeObject`, renderer, environment). |
| **Safari, mobile Safari, real iPhone/Android, Firefox** | **Not tested**: none available here |
| Visual regression suite | **Not implemented** (screenshots reviewed manually) |
| Lighthouse | **Not run**: not installed, and nothing was added to the project |

## 11. Layer 16: performance (what was measured)

All on an Apple M2, production build, headless Chrome with the real GPU.

- Hero model on the network: 0.92 MB over the wire (desktop), plus 11 KB + 62 KB Draco wrapper and decoder; the hero was visible about **0.7 s after the page load event** on localhost. Slow-4G-style: 2.5 s.
- Frame rate: **60 fps**, but that is the display's vsync cap and shows no headroom; **do not read it as a phone figure**. Worst frame at 4× CPU throttle: 49 ms (one hitch), otherwise 19 ms.
- JS: the largest first-party chunk is 97 KB gzip (the three.js chunk); the stage and plate code is only ~5–7 KB gzip each. Both are loaded only when the stage or plate mounts (dynamic import).
- Mobile profile: 0.65 MB GLB, canvas pixel ratio capped at 1.25 on coarse pointers; **dynamic resolution** steps the pixel ratio between 0.75 and 1.75 on 45-frame averages (26 ms / 15 ms thresholds).
- Not measured: main-thread blocking time, GPU memory, Lighthouse score, any real phone.

## 12. Model licence record

- **Source**: the owner-supplied `horse+3d+model (5).glb`, generated with **Tripo** (generator tag in the glTF). No other third-party geometry was used. The CC BY-NC `rossbandiger` statue and other GLBs in `public/models/` were inspected, not reused.
- **Terms** depend on the Tripo plan used when the model was generated. Per Tripo's own pages and third-party summaries: paid plans grant commercial use and private models; the free plan publishes models under **CC BY 4.0** and the sources disagree on whether commercial use is allowed (some say it is, with attribution; some say non-commercial). Platform terms also do not guarantee copyright or freedom from third-party claims.
- **Action needed before launch**: confirm the plan and the account/date of generation in Tripo's history, keep the receipt, and add attribution if it was a free-plan generation. Re-check Tripo's current Terms of Use; they were not readable directly during this work.
- Sources: <https://www.tripo3d.ai/blog/commercial-use-ai-3d-models> · <https://www.tripo3d.ai/blog/are-ai-3d-models-royalty-free> · <https://costbench.com/software/ai-3d-generation/tripo-ai/>

## 13. How to rebuild and what to do next

Scripts run as `Blender -b --factory-startup -P <script> -- <args>`; the chain is 1 → 1b → 2 → 3 → 4 → 4b → 5 (see `docs/reference/3d/marwari/README.md` for stages 1–6 of the single-mesh rig), then:

```
stage7_hybrid_retopo.py  in.blend out.blend <body_faces> <voxel> <ear_piece_scale> 0
stage8_uv_bake.py        in.blend out.blend <texdir> 2048
stage9_finish.py         in.blend out.blend <texdir>
stage10_export.py        in.blend out.glb   <tex_size> <hair_tex_size>
```
(hero: `20000 0.006 1.0`, anatomy: `38000 0.0045 1.8`; mobile: tex size 1024 / 512.)

Remaining work, in the order it would help most:
1. Hand-retopologise the head (eye, mouth, ear-base loops) and the ears; sculpt ear cavities. This is the one task automation did not solve.
2. Replace the 1024 px source texture with a new high-resolution hand-painted coat, and re-bake.
3. Test on real iPhone/Android and Safari; run Lighthouse.
4. Build tack (bridle, reins) if the Reins hotspot should show real contact.
5. Owner decisions: Tripo licence plan; the "Ten grams" claim site-wide; whether to enable the hero for everyone.
