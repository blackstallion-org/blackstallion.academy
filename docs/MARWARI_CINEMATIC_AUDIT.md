# Marwari cinematic realism: Layer 0 audit

Branch `feature/marwari-film-world` · baseline commit `223ce67` · 26 Oct 2026 · Apple M2 (8 GB), Chrome for Testing 156, Blender 5.2.3, three.js r186.

**Update 27 Oct 2026: Gate A (A1 to A7) was approved and applied. §0 to §10 describe the horse as found (baseline commit `223ce67`); §11 records what changed, the matched before / after frames and the re-measurements, and corrects one claim of the baseline (the academy frames).** Nothing was committed, pushed, merged or deployed; no GLB, rig, dependency or tooling was touched, and `footlock.ts` / `locomotion.ts` (the other session's) were not edited.

The first version of this report was an audit only: no source file, asset or configuration was changed. What it added: this report, `docs/qa/marwari-cinematic/` (captures and evidence), `tools/qa-marwari/` (the harness that made them, so the same cameras can be replayed after each change).

Status words: **Implemented** (works, with evidence) · **Weak** (works, visibly below the target) · **Partial** · **Missing** · **Unverified** (could not be checked here). "Evidence" is a file in `docs/qa/marwari-cinematic/` unless stated.

---

## 0. The short version

1. **The horse is a competent real-time character, not yet cinematic.** The identity reads: Marwari lyre ears that curl in until the tips meet, an arched neck, a clean-limbed black stallion. None of the ten baseline frames could be mistaken for photography. At 3 m or closer the illusion breaks in the coat, the mane and tail, the eye and the muzzle.
2. **What prevents realism, in order:** (1) the coat is a 2048 px bake of an AI texture, brown-biased, with cloud-like mottling and no fur detail; (2) the mane, forelock and tail are alpha-tested ribbons with a near-black stripe atlas (stair-stepped edges, a tail that hangs like a sheet); (3) the head has no nostril, lips, lids or whiskers, and the eye domes sit 2 to 3 cm above the sculpted sockets; (4) the lighting has no soft key, no ambient occlusion, no post stack and, in the hero, no shadows; (5) the three places are procedural low-poly sets, and the third one is not the field that was asked for.
3. **Three defects no earlier report lists as defects:**
   - **The black stallion turns chestnut and mahogany at dawn and dusk.** The hero light follows the visitor's clock; at 03:00, 06:00, 09:00 and 18:00 the coat reads copper-brown (`baseline/sheets/sheet_tod.jpg`). The film report calls the amber dawn "by design"; against the directive (a black horse that stays black and readable) it is a defect.
   - **The eye domes are misregistered.** In the bind pose, with every animation stopped, the glossy dome of the near eye sits about 2.3 cm above the sculpted socket and shows as a bead on the brow (`evidence/eye/`). Invisible at hero distance, fatal for the "Eye" shot.
   - **Environment switches leak a little.** Three GPU textures per place re-entered (13 → 16 → 19 for the desert), JS heap +0.7 MB and about 19 event listeners per route round trip, and a WebGL context that is not released on unmount.
4. **Verified good:** one horse object and one GLB load across nine environment switches; four gaits with the right footfall order, suspension and low foot slip (0.5 to 6.1 % with the lock, 10 to 15 % without); 60 fps on the M2 in the hero, desert and village; reduced-motion still; poster fallback without WebGL; keyboard focus rings on the stage controls; typecheck, 84 / 84 unit tests and the production build pass.
5. **Another session is editing the same files right now** (see §1.2). That needs an owner decision before anyone re-exports a GLB.
6. **Approvals asked for are listed in §10.** Everything in Gate A below is code-only and reversible; asset replacement, re-rigging, a post-processing stack and new tooling are Gate B.

### Where the nine deliverables stand

| # | Deliverable | Status |
| --- | --- | --- |
| 1 | Existing implementation audit | **Done**, §1 to §5 |
| 2 | Feature-by-feature completion matrix | **Done**, §6 |
| 3 | All changes made | **§11.1** (Gate A, A1 to A7). The baseline audit itself changed nothing in the product |
| 4 | Before and after screenshots | **Both captured**: `baseline/` and `after/A1` to `A7` (same cameras, same pinned assets); sheets named `compare_*.jpg`, §11.2 |
| 5 | Animation verification evidence | **Done for the current clips**, §6 Layer 4 and `evidence/animation/` |
| 6 | Desktop and mobile performance | **Baseline §4; after-change comparison §11.4** (M2 only; no phone) |
| 7 | Tests and build | **§11.5**: lint, typecheck, 84 / 84 tests, production build re-run after Gate A |
| 8 | Remaining realism limitations | **§11.6** (revised), §9 |
| 9 | Recommended next improvements | **§11.7**, §8 (Gate B) |

---

## 1. Baseline state

### 1.1 Branch, commit, what was run

| Item | Value |
| --- | --- |
| Branch | `feature/marwari-film-world` (the brief named `feature/marwari-3d-production`; that branch exists, but this checkout is not on it) |
| HEAD | `223ce67` "trot and canter swings lose the hoof flick" (25 Oct 23:10) was the baseline; **HEAD moved to `ff838fe` "banked turns hold the hoof" (26 Oct 00:41) while this report was being written**, a foot-lock commit by the other session (§1.2) that does not change a standing horse, materials, lights or sets. Earlier horse commits: `0f72b17`, `feda90a`, `9e0c847`, `d0bc318`, `8d27874`, `5858426` (film world), `19ae6f9` (3D production), `a77c9da` (rig) |
| Working tree | about 230 modified or untracked paths from several sessions (schools 3D, legend museum, footer, etc.); none of them is horse code except `components/stallion-film/footlock.ts` and `locomotion.ts` (§1.2) |
| Where the horse is visible | only at `/?stallion=preview` (or when `NEXT_PUBLIC_STALLION_MODEL` is set). Without the flag the home page is unchanged. The 3D plate is on the home page ("Instrument"); `/anatomy` shows the 2D archive plate only |
| Machine during the audit | Apple M2, 8 GB unified memory, 7.4 GB in use, system load average 5 to 31 (iCloud, WindowServer, other sessions, Chrome). Every number below carries the load it was taken under |

### 1.2 A second session is working on the same files

A second session, `Realistic Marwari horse 3D model` (`local_7b470dec-040d-457a-a2fa-293bf3d648f2`, the only other session running in this checkout; attribution is by timing, the commits carry the same git author), appears to be working on the same files. During the audit it re-exported the hero, mobile and anatomy GLBs, `marwari-gaits.json` and both source `.blend` files (23:07), committed them as `223ce67` (23:10), and is now editing `components/stallion-film/footlock.ts` and `locomotion.ts` (changed 00:25 and 00:33). That is foot-lock tuning: it does not change a standing horse, but it does make the dev server remount the stage whenever it saves, which broke one of my runs. So:

- all captures were taken from **pinned copies** of the assets served through `page.route`, hashes in `evidence/pinned_asset_hashes.txt`;
- numbers worth quoting come from a **production build** (`next start`), which does not react to file edits;
- gait metrics (§7) were measured on the dev server at 23:51, before the latest foot-lock edits, and agree with the film report within noise. Treat them as "HEAD, ± in-progress edits".

Proposed split to avoid two writers on one file: that session owns `public/models/*`, `tools/blender/03_animation/*`, `footlock.ts`, `locomotion.ts`; this work owns materials, lighting, camera, environments and post (`components/3d/marwari.ts`, `StallionStage.tsx`, `engine.ts` look and camera parts, `shots.ts`, `sky.ts`, `environment.ts`, `scenery/*`). Any GLB re-export is coordinated through the owner. **Decision needed (§10).**

### 1.3 Recent horse commits

| Commit | Date | What |
| --- | --- | --- |
| `a77c9da` | 24 Oct | Rigged Marwari: Blender pipeline, hero and anatomy GLBs, three.js hero stage, anatomy hotspots |
| `19ae6f9` | 24 Oct | 3D production pass: hybrid retopology, hair cards, eyes, ten clips, mobile profile |
| `5858426` | 25 Oct | Film: gait library, locomotion physics, desert / village / academy, three story chapters |
| `8d27874`, `d0bc318` | 25 Oct | Runtime foot-lock, reach guard |
| `9e0c847` | 25 Oct | Gaits re-authored (searched reach bias, shorter walk) |
| `feda90a` | 25 Oct | Held hoof seated on the terrain |
| `0f72b17`, `223ce67` | 25 Oct | Walk, then trot and canter swing speed reduced |

---

## 2. Inventory

### 2.1 Components

| Area | Files |
| --- | --- |
| Loader, coat, eyes, hair, gaze, daylight, studio lights, contact shadow | `components/3d/marwari.ts` (330 lines), `marwari-paths.ts` |
| Hero stage (three.js directly, not R3F) | `components/hero/StallionStage.tsx` (424), `stallion-flags.ts`, `components/sections/home/StallionHero.tsx` (pinned film, chapter buttons, skip, poster fallback) |
| Film engine (director, chapters, veil transitions, quality tiers, QA hooks) | `components/stallion-film/engine.ts` (830) |
| Locomotion (speed-banded, phase-locked gait blend; hoof sensing) · foot-lock (runtime IK) · micro-motion and spring tail / mane | `locomotion.ts` (474), `footlock.ts` (303), `life.ts` (194) |
| Camera rig and 16 shot specs · sky, haze, three atmospheres · terrain · dust and hoof prints · canvas textures | `shots.ts` (200), `sky.ts` (111), `terrain.ts` (247), `effects.ts` (230), `textures.ts` (177) |
| Places | `scenery/desert.ts` (198), `village.ts` (365), `campus.ts` (453), `geo.ts` |
| Anatomy plate (5 bone-anchored hotspots, region glow, fly-to) | `components/sections/anatomy/Anatomy3DHorse.tsx` (545), `SpecimenPlate.tsx`, `lib/content/anatomy.ts` |
| "Last exhibit" on `/legend` (the same hero GLB under a three/webgpu cloak shader) | `components/3d/cloak/*`, `components/sections/legend/LastExhibit.tsx` (uncommitted, another session) |
| Not the Marwari | `HorseHandBond`, `BondHero`, `GateBondScene` (Tripo original, 5.6 MB), `FleetCovenantCanvas`, `StatueCanvas`, `TorchHorseStage`, `public/anatomy/dual-body.html` (procedural horse and rider, iframe) |
| Pipeline | `tools/blender/00_import_inspect … 05_validate_render`, sources `tools/blender/source/*.blend`, `docs/MARWARI_3D_PRODUCTION_REPORT.md`, `docs/MARWARI_FILM_WORLD_REPORT.md` |

Legacy GLBs in `public/models/` that no code references: `midnight_black_horse_3d_model_free.glb` (12.2 MB), `riding+gear+3d+model.glb` (5.4 MB), `horse-bond.glb` (5.6 MB), `marwari-animated-home.glb` (3.0 MB), `marwari-mobile.glb` (2.5 MB), `contact-horse.glb` (1.4 MB), `bond-human-hand.glb`, `marwari-proxy.glb`, and two `horse+3d+model (n).glb` copies. About 43 MB (42.7 MB) of dead weight in the repo and the deploy bundle (not the page weight).

### 2.2 Assets (pinned, `evidence/pinned_asset_hashes.txt`)

| File | On disk | On the wire (gzip) | Triangles | Textures | Rig / clips |
| --- | --- | --- | --- | --- | --- |
| `marwari-hero.glb` | 1,253,180 B | 1,027,986 B | 37,640 (coat 34,722 · hair 2,038 · eyes 880) | 4 WebP: coat colour, normal, ORM at 2048², hair atlas 1024² (656 KB) | 46 joints, depth 9; 18 clips |
| `marwari-hero-mobile.glb` | 847,624 B | 624,321 B | same | same four at 1024 / 512 (251 KB) | same |
| `marwari-anatomy.glb` | 1,394,168 B | n/a | 63,194 (coat 60,276) | same four at 2048² (695 KB) | same |
| `marwari-gaits.json` | 7,074 B | 3,114 B | | | stride, contact windows per gait |
| Draco decoder (local) | 250 KB | 78 KB | | | |

Geometry and animation take 502 KB of the hero GLB; textures 656 KB. 3 skinned meshes, 3 materials, 3 draw calls (+1 for the hero contact shadow). Draco geometry, WebP textures, no KTX2, no meshopt.

Clips (all 30 fps, linear unless noted): `Idle_Breathing` 4 s, `Ear_Rotate` 4 s, `Mane_Sway` 4 s (cubic), `Tail_Sway` 3 s, `Blink` 0.5 s, `Weight_Shift` 6 s, `Head_Turn` 8 s, `Attention_Response` 3 s (cubic), `Alert` 4 s, `Stop` 1.8 s, `Walk` 0.8 s, `Trot` 0.75 s, `Canter_L/R` 0.6 s, `Gallop_L/R` 0.42 s, `Sprint_L/R` 0.383 s. Gait clips key 33 bones plus one translation; face clips key only 2 to 8 bones.

### 2.3 Rendering stack (what exists, what does not)

| Item | Hero stage | Film places | Anatomy plate |
| --- | --- | --- | --- |
| Renderer | `WebGLRenderer`, MSAA on, alpha, high-performance | same canvas | own renderer, MSAA on, DPR cap 1.5 |
| Tone mapping | ACES filmic, exposure 1.45 | ACES, exposure 1.0 (per atmosphere) | ACES, exposure 1.25 |
| Colour management | three default (sRGB output, linear working space, sRGB base colour, linear ORM / normal) | same | same |
| Key / rim / fill | three directional lights (3.0 / 3.4 / 1.0, colours from the visitor's hour) + hemisphere 0.7 | one sun (3.4 to 3.6) + hemisphere 0.55 to 0.65 | same studio set, fixed at noon |
| Image-based light | `RoomEnvironment` PMREM at 0.45 | PMREM of the procedural sky sphere at 0.38 to 0.42 | `RoomEnvironment` at 0.5 |
| Shadows | **none**; a radial-gradient sprite under the hooves | one `DirectionalLight`, PCF, 2048 / 1024 / 512 by tier, follows the horse | none |
| Fog / atmosphere | none | `FogExp2` (0.0026 to 0.0042) + sky haze + dust particles | none |
| Ambient occlusion | baked AO in the ORM texture only | same | same |
| Post-processing | **none**: no composer, bloom, SSAO, DOF, grade or motion blur anywhere | same | same |
| Anti-aliasing | MSAA 4x | same | same |
| Camera | fixed three-quarter, FOV 30 (40 on narrow screens), dolly to the head on click | `CameraRig`: 16 shots, 2.2 s smoothstep blends, damped follow, `avoidCamera` for walls | region fly-to (lerp 0.06), drag to rotate |
| Adaptive quality | pixel ratio 0.75 to 1.75 from 45-frame averages | four tiers (shadow size, scatter, dust, terrain segments) from 60-frame averages; phone geometry LOD | none |
| Fallbacks | poster + passport link without WebGL; still frame under reduced motion | film off under reduced motion | 2D archive plate |

### 2.4 Geometry, UV and rig inspection (Blender, rest pose, `evidence/geometry/hero_geometry_audit.json`)

`Marwari_Low`: 17,453 vertices, 18,378 faces (16,240 quads, 2,136 triangles, 2 n-gons), 34,616 triangles after splitting.

| Check | Result |
| --- | --- |
| Edge length | median 17.5 mm (p5 9.5, p95 23.1, max 61); head region mean 13.6 mm, trunk 17.8 mm |
| Topology | 0 non-manifold edges, 0 loose vertices; 93 % valence-4; 169 three-poles, 302 five-poles, 703 of valence six or more (not broken down by region); **two shells**: 16,295 vertices (body) and 1,158 (per the production report, the ears and the poll tuft, decimated pieces), 178 boundary edges |
| Triangle quality | median minimum angle 41°; 195 triangles under 10° and 239 with edge ratio above 4 (0.6 %); 533 strongly non-planar quads (3.3 %) |
| Normals | outward (signed volume +0.49 m³, a plausible horse); 21 edges with opposed neighbour normals, all at the tuft |
| UV | one UV set; 188 islands, 3,564 seam edges, **only 47 % of the square covered**; no flipped or degenerate faces; area stretch p5 to p95 −0.35 to +0.20 log2 (worst face −0.73), 0 faces stretched 2×; overlap 0.18 % |
| Texel density | **uniform 6.4 texels/cm (1.6 mm per texel) on every region, including the head** (head 6.44, trunk 6.48, hooves 6.41) |
| Symmetry (mirror, rest pose) | median 37 mm, p90 80 mm; head 20 mm, neck 28, trunk 34, upper legs 50, lower legs 87, hooves 69. The rest pose is a staggered resting stance (right hind forward by 18 cm), so this is natural asymmetry from the sculpt, not authored |
| Skin | 40 vertex groups on the coat; all vertices weighted, max 4 influences, weights sum to 1.0 ± 0.0002; 17 edges with a weight jump above 0.5. Joint blend lengths: carpus 7.3 cm, fetlock 7.3, hock 13.5, stifle 19, elbow 15, poll 15, neck 25 to 28 |
| Hair vs coat | 1,019 hair quads (mane 53 ribbons, tail 72); 291 touch the coat (872 triangle pairs), consistent with roots seated in the skin |
| Eyes | domes of 1.48 cm radius (3 cm across; a horse's eye is about 4 to 5 cm); left dome centre 0.98 cm inside the coat surface, **88 % of its vertices inside the coat**; the coat's own socket is a separate sculpted cavity about 2.3 cm below the dome (measured on `evidence/eye/*.jpg`) |

Proportions from the mesh (breed references: the official Marwari Horse Society of India standard was not found; secondary sources agree that the ears are the signature, medium length (about 9 to 15 cm), curve inward at the tips, often touching, and rotate through 180°: [Marwari horse, Wikipedia](https://en.wikipedia.org/wiki/Marwari_horse), [Marwari horses, Oklahoma State University breed profile](https://breeds.okstate.edu/horses/marwari-horses.html); height figures differ between sources, 145 to 169 cm in the OSU profile):

| Measure | Model | Reads as |
| --- | --- | --- |
| Ear length (bones) | 14.7 / 14.9 cm; tip gap 5 cm at rest | inside the 9 to 15 cm range, tips meet in the lyre pose |
| Topline | croup 1.52 m, back 1.46 m, base of the neck at the withers 1.51 to 1.59 m (14.8 to 15.6 hh) | matches the plate's "15 hh" label |
| Withers | the topline rises **monotonically** from the back into the neck: no defined withers or wither pocket | a visible anatomical weakness (side view) |
| Girth / leg length | belly at 0.85 m, so legs 55 % of the height | leggy and refined, plausible for the breed |
| Neck | 46° from horizontal, 0.77 m of bone | arched, upright |
| Head | width 23 cm at the eyes, muzzle 12.3 cm; head bone points 46° nose-down | plausible |
| Cannon cross-section | 6.0 × 7.7 cm (fore), 6.3 × 9.1 cm (hind) | fine-boned |

### 2.5 Textures (measured on the embedded 2048² maps, `baseline/sheets/sheet_textures.jpg`)

- Base colour: mean sRGB (30, 27.5, 25.3), linear luminance 0.0128, red exceeds blue by 4.8/255 and green by 2.6/255, mean saturation 0.17. **A warm, brown-leaning black**; under warm light it turns bronze.
- Low-frequency blotches dominate: the luminance standard deviation after a 24 px blur is 0.29 of the mean, and the hair-scale (2 px high-pass) variation is only 0.43 of that low-frequency spread. The coat looks cloudy, not furred.
- ORM: roughness 0.50 to 0.80 (p5 to p95, mean 0.61), baked AO mean 0.88; the B channel is full white, harmless because the material's metalness is forced to 0.
- Normal: 42 % of texels deviate from flat by more than 0.05, 16 % by more than 0.15: baked sculpt creases and the mane region; no hair-scale micro-normal.
- Hair atlas: near-black vertical stripes, alpha-tested at 0.45.

---

## 3. Baseline captures (all before any change)

`docs/qa/marwari-cinematic/baseline/README.md` explains the conditions. Contact sheets are in `baseline/sheets/`.

| Layer 10 view | Frames | Anatomy | Material | Lighting | Composition | Environment | Texture | Defects seen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Full-body side | `desktop/desert_side.jpg`, `desktop_2x/desert_side.jpg`, `desktop/hero_side_left_noon.jpg` | Implemented: arched neck, deep girth, clean legs; withers undefined | Weak: satin bronze-black, cloudy | Weak: one hard sun, hard shadow, no AO | OK, centred | Weak: stylised | Weak: soft | tail is a flat sheet; mane cards stair-stepped |
| 2 Three-quarter | `desktop/desert_threeQuarter.jpg`, `desktop_2x/hero_3q_noon.jpg` | Implemented | Weak: blotchy brown highlights on shoulder and croup | Weak in studio: dark box, no soft key | Good | Weak | Weak | forelock slab; tail ribbon seams |
| 3 Front, ears | `desktop/desert_front.jpg`, `desktop/desert_earsClose.jpg`, `desktop_2x/desert_ears.jpg` | Ears: **Implemented** (inward curl, tips meet); detail Weak | Weak: ears are smooth horns, no inner cavity or hair | Weak | OK | Weak | Weak | ear tips merge into one hook |
| 4 Eye and muzzle | `desktop_2x/desert_eye.jpg`, `desktop_2x/desert_muzzle.jpg`, `desktop/desert_headEyeMuzzle.jpg` | **Poor**: no lids, lashes, tear duct, nostril, lips or whiskers; dome floats above the socket | Poor | Weak | n/a | n/a | **Poor**: 1.6 mm per texel; rectangular bake patches on the face | polygonal muzzle silhouette; patch seams; bead eye |
| 5 Mane and neck | `desktop/desert_maneNeck.jpg`, `desktop_2x/desert_maneNeck.jpg` | Neck Implemented | Weak | Weak | OK | Weak | Poor: mane cards | stair-stepped alpha edges, hard slabs standing off the crest |
| 6 Hoof and ground | `desktop/desert_hoofGround.jpg`, `desktop/campus_hoofGround.jpg` | Implemented: glossy hooves, fetlock, pastern | OK | OK: sun shadow grounds the hooves in the desert; **hooves vanish on the academy's dark ground** | Good | Weak | OK | no dust or print at rest (by design) |
| 7 Desert | `desktop/desert_film_wide.jpg` | n/a | n/a | Implemented: golden haze, long shadows | Weak: horse small in the establishing shot | **Weak**: flat-shaded buttes, cone tufts, gradient sky | Weak | none structural |
| 8 Village | `desktop/village_film_reveal.jpg`, `village_film_courtyard.jpg`, `village_side.jpg` | n/a | n/a | OK: warm afternoon, plaster bounce | OK | **Weak**: clean plaster, arches, pots; reads as a game set | Weak | none structural |
| 9 Equestrian field | `desktop/campus_film_arena.jpg`, `campus_film_final.jpg`, `campus_threeQuarter.jpg` | Horse reads as a near-black silhouette | Poor: crushed | **Poor** on dark slate ground | **Poor**: the arena shot is inside a tree canopy; a lamp post crosses the final wide | Partial: a hedged academy, not a grass training field with fencing and countryside | Weak | camera in set geometry |
| 10 Mobile portrait | `mobile_plate_fallback/*_mobile.jpg`, `plate_v2/plate_mobile_*.jpg` | Hero: muzzle touches the left edge at 390 px | same as desktop | same | Hero crop; plate horse small, gait and view buttons overlap the horse | OK | n/a | 2 of 5 plate markers off-frame at the overview |

Nothing in this table is "photorealistic merely because it has PBR materials": the materials are physically based and still read as a painted satin statue.

---

## 4. Measured performance

Method and caveats: `tools/qa-marwari/README.md`. Chrome for Testing in new headless mode on the M2 GPU (renderer string `ANGLE (Apple, ANGLE Metal Renderer: Apple M2)` printed in every run). Frame pacing in headless Chrome is locked to 60 Hz, so "fps" cannot exceed about 62 and shows no headroom; the **synchronous render cost** (render plus a 1-pixel readback, no vsync, three passes of 60 frames) is the headroom figure. GPU timer queries were unreliable on this loaded Mac (values from 3 to 250 ms for the same scene), so they are in the JSON files but not used here. **No phone, Safari or Firefox was available: the mobile rows are the phone code path (mobile GLB, pixel ratio cap 1.25, tier 2, geometry LOD) measured on the Mac.**

### 4.1 Production server, 12 s per scene after 4.5 s warm-up (`evidence/perf/prod_*.json`)

| Scene | Desktop retina 1440×900 @2x (canvas 2160×1350) fps · p95 frame · sync ms | Phone profile 390×844 @3x (canvas 487×1055) fps · p95 · sync ms | Draw calls | Triangles (incl. shadow pass) |
| --- | --- | --- | --- | --- |
| Hero studio, idle | 62.2 · 17 ms · 3 | 54.9 · 18 ms · 2 | 4 | 37,642 |
| Desert, standing | 61.1 · 17 ms · 5 to 6 | 58.8 · 19 ms · 2 to 3 | 19 | 250,600 (phone 197,982) |
| Desert, gallop 10 m/s | 57.0 · 19 ms · 11 to 19 | 57.7 · 19 ms · 3 to 4 | 19 | 251,368 (phone 199,338) |
| Village, trot | 61.2 · 17 ms · 8 to 11 | 59.7 · 18 ms · 3 to 5 | 37 | 693,666 (phone 410,480) |
| Academy, canter | 55.4 · 29 ms · 16 to 18 (tier dropped to 1, pixel ratio to 1.25) | 61.4 · 18 ms · 3 to 4 | 32 | 623,805 (phone 314,528) |

System load average during these runs: 5.8 to 8.1, and **26.7 for the academy row**, so that row is contended. In the dev-server runs at 1440×900 @1x the same scenes were 57 to 62.5 fps with sync costs of 2, 4, 6, 4 and 7 ms (hero → academy), p95 17 ms, and no frame above 33 ms in the desert, village and academy (5 in the hero run, a start-up hitch of 733 ms); load 5.5 to 6.1.

Reading: on this GPU the hero, desert and village have headroom at 1x and run near budget at retina; the academy is the heaviest place (≈17 ms synchronous at retina) and the engine's own adaptive tiers react to it. **There is no spare frame budget on a retina desktop for ambient occlusion, bloom and depth of field in the academy without lowering the pixel ratio or the shadow cost.**

### 4.2 Size and load time (production server, real network path, `evidence/perf/prod_loadtime.json`)

| | Desktop | Phone profile |
| --- | --- | --- |
| GLB over the wire | 1,027,986 B | 624,321 B |
| Draco decoder + gaits | 78 KB + 3 KB | same |
| Page JavaScript before the horse is ready | 951 KB in 47 files | 652 KB in 31 files |
| Horse and engine ready, localhost, cold | 2.0 s | 1.2 s |
| Warm (304 revalidation, 1.5 KB) | 3.3 s (load average 8+) | 1.9 s |
| Horse ready on "Slow 4G" (1.6 Mbit/s, 150 ms RTT; phone also 4× CPU) | **29.5 s** (GLB request starts at 9.1 s, ends at 25.3 s) | **22.4 s** (starts 8.9 s, ends 18.2 s) |

On Slow 4G the model is not the bottleneck: it competes with 2.1 to 2.8 MB of other page bytes and its request starts only after hydration and the dynamic import (about 9 s), because nothing preloads it. `Cache-Control: public, max-age=0` on `/models/*` means every visit revalidates.

### 4.3 GPU memory (arithmetic from texture sizes and framebuffer sizes; WebGL has no memory API)

| | Desktop 1x | Desktop retina (1.5× render) | Phone profile |
| --- | --- | --- | --- |
| Coat + hair textures, uncompressed with mips | 72.5 MB (3 × 21.8 + 5.5) | 72.5 MB | about 18 MB |
| MSAA drawing buffer | 44.5 MB | about 105 MB | about 18 MB |
| Shadow map | 16 MB (2048²) | 16 MB | 4 MB (1024²) |
| Total, horse and framebuffer | ≈ 133 MB | ≈ 194 MB | ≈ 40 MB |

KTX2 / Basis would cut the 72.5 MB of coat textures to roughly 12 to 18 MB. It needs `toktx`, which is not installed, and the transcoder files: Gate B (new tooling).

### 4.4 Lifecycle (`evidence/lifecycle/`)

| Check | Result |
| --- | --- |
| Same horse across environments | **Implemented.** Root object `1ce52df0` unchanged through hero → desert → village → academy → desert → village → academy → hero → desert; 17 mixer actions throughout; no further GLB or gait request after the first load |
| Shader programs | 4 (hero) → 23 → 24 → 28 (first visit of each place); re-entering recreates them (25, 25, 28). Hitches on a switch: 55 to 282 ms worst frame, hidden behind the veil |
| Textures | **+3 per place re-entry** (desert 13 → 16 → 19, village 17 → 20, academy 19 → 22); geometries are stable (28 / 36 / 37). Root cause not isolated: `Environment.dispose()` frees the scene textures it knows about; the PMREM render target of each place (`envTexture.dispose()` frees the texture, not the target) and the terrain textures are the candidates |
| JS heap after GC | 22.1 → 26.1 MB over nine switches (dev); 13.6 → 17.3 MB (prod) |
| Ten `/` ↔ `/cadets` round trips | heap 29.9 → 37.2 MB (+0.7 MB a trip, still rising); event listeners 1,115 → 1,380 (about +19 a trip once warm); DOM nodes flat at 8,336; GLB and gait table re-requested every return (1 → 10) and the two Draco decoder files with them; WebGL contexts created 3 → 15 with only 2 lost: the stage's context is not released on unmount (`renderer.dispose()` without `forceContextLoss()`), so enough round trips will reach Chrome's 16-context limit and its "oldest context will be lost" eviction (not reached in ten) |
| Console | no WebGL errors in any run; `THREE.Clock` deprecation warnings come from the `/cadets` page (React Three Fiber), not the stage; aborted hero-video requests when scrolling |

---

## 5. Verification run (before any change)

| Check | Result |
| --- | --- |
| `npm run typecheck` | **pass** (3 s) |
| `npm run lint` | **1,509 problems, 34 errors, 1,475 warnings; all 34 errors are in the vendored `public/anatomy/vendor/three.min.js` (25), `gsap.min.js` (8), `OrbitControls.js` (1)**, as the earlier reports say. No error in horse code |
| `npm test` | **84 / 84 pass** |
| `npm run build` | **pass** (20 s with the Turbopack cache); all routes built |
| `node scripts/e2e-smoke.mjs` (existing browser smoke) | **16 passed, 2 failed**: `verify: unknown code says the registry is not connected` (15 s timeout) and `staff console: signed-out visitors are redirected to login` (30 s timeout). Neither touches the horse; both routes have uncommitted edits from other sessions, and the machine was at load 20+. Not investigated. The script needed a one-line preload to find the installed Chromium (revision 1248 installed, 1247 expected) |
| Browser checks done by the harness | hero, three places, plate hotspots, mobile profile, reduced motion, no-WebGL poster, keyboard focus order (Open the passport → I → II → III → Skip), route round trips |
| **Not run / cannot be run here** | a real phone, Safari, Firefox; axe-core (earlier report: 0 violations on the film section, not repeated); gyro on a device; sound (headless); Lighthouse; any video-based check of shimmer or temporal stability (single frames only); exact GPU memory |

---

## 6. Requirements matrix

Directive layers 1 to 9 plus the requirements PDF (`BSAH_3D_Marwari_Horse_Requirements_and_Claude_Audit_Prompt.pdf`, its pages 2 to 7). Evidence paths are relative to `docs/qa/marwari-cinematic/`.

### Layer 1: anatomy

| Requirement | Status | Evidence and note |
| --- | --- | --- |
| Inward-curving Marwari ears, unmistakable silhouette | **Implemented** | front and 3/4 frames; ears 14.7 cm, tips meet; `baseline/desktop/desert_front.jpg` |
| Ear detail (cavity, thin cartilage, hair) | Weak | smooth horn-like pieces; 3.8k-triangle decimated sculpt pieces (report §3) |
| Skull, forehead, cheekbone, jaw, muzzle | Weak | plausible proportions; polygonal muzzle silhouette; rectangular bake patches (`desktop_2x/desert_muzzle.jpg`) |
| Nostril shape and tissue thickness | **Missing** | baked shading only; `LifeLayer.flare` is computed and never shown |
| Mouth, lips, whisker distribution | **Missing** | no lip geometry, no whiskers |
| Eye position, lids, tear duct, reflections | Partial, with a defect | wet clear-coated domes with a catch-light exist; domes sit 2 to 3 cm above the sockets; no lids, lashes or caruncle; blink squashes the dome (`evidence/eye/`) |
| Natural asymmetry | **Implemented** | mirror error median 37 mm, from the sculpt and the staggered stance |
| Neck, shoulder, chest, barrel, hindquarters, legs, hooves, stance | **Implemented**, one weakness | believable at every angle; withers undefined |
| Geometry inspection and repair | Inspection done; **no repair made** | §2.4; the eye registration and the ear / forelock shells are the verified defects |

### Layer 2: coat

| Requirement | Status | Evidence and note |
| --- | --- | --- |
| PBR, correct sRGB / linear, energy-conserving specular | **Implemented** | `MeshPhysicalMaterial`, three's colour management, ORM channels |
| Roughness variation | Partial | baked 0.50 to 0.80 + 30 % noise under 4 m; hooves 0.4, muzzle 0.78 by region |
| Coat-direction anisotropy | **Missing** | |
| Hair-scale normal and roughness detail | Weak | normal map is sculpt creases only |
| "Not uniformly black"; colour variation | Weak | cloudy brown-leaning bake; **reads chestnut at 06:00 and 18:00** (`baseline/time_of_day/`) |
| Hair-growth direction maps, whiskers, skin folds | **Missing** | |
| Wetness near eyes and nostrils | Partial | eye clear-coat only |
| Close-up check at head, neck, shoulder, barrel, hindquarters | **Done in this audit** | `desktop_2x/`; result: soft, blotchy, no fur read |

### Layer 3: mane and tail

| Requirement | Status | Evidence and note |
| --- | --- | --- |
| Hair cards, efficient | **Implemented** | 53 mane + 72 tail ribbons, 2,038 triangles |
| Strand grouping, length and thickness variation | **Missing** | one stripe atlas; no per-card variation |
| Believable gravity, wind, secondary motion | Partial | four-bone springs for each, wind from the place; the tail stays a straight sheet at gallop (`evidence/animation/sheet_gallop.jpg`) |
| No rigid or rubber deformation, no billboard seams | Weak | stair-stepped alpha edges; visible card slabs |
| Tail swish | **Implemented** | impulse every 5 to 17 s at rest |

### Layer 4: animation

| Requirement | Status | Evidence and note |
| --- | --- | --- |
| Breathing, rib expansion | **Implemented** | idle clip + effort-coupled depth |
| Independent ears, blinking, small head and neck movement, tail swish, weight shifts | **Implemented** | clips + noise layers; blink is a scale squash |
| Nostril movement | **Missing** | no nostril geometry or bones |
| Walk (four-beat), trot (two-beat), canter (three-beat), gallop with suspension | **Implemented, verified** | footfall order from `qaRun`; strips `evidence/animation/sheet_*.jpg`; suspension trot 10 %, canter 15 %, gallop 28 %, sprint 32 % |
| Smooth transitions | **Implemented** | speed-banded, phase-locked blend with an acceleration limit; each speed step settled within 0.06 m/s |
| No foot sliding, floating, snapping, robotic cycles | Partial | slip 0.5 to 6.1 % of ground speed with the lock, 10 to 15 % without; no snapping seen; **the same pose repeats every stride** (no variation); banked-turn hover was measured by the film report, not re-measured |
| Valid skeleton | **Implemented** | 46 joints, ≤ 4 influences, normalised; **limits:** no control rig, no face bones (lids, jaw, nostrils), 4 + 4 mane and tail bones. The clips are procedural IK baked to FK, not captured |

Gait metrics reproduced on the current clips (`evidence/animation/qarun.json`, simulated at 120 Hz, desert):

| Gait | Stride · frequency | Slip, lock on / off | Suspension (lock on) | Footfall order (events) |
| --- | --- | --- | --- | --- |
| Walk 1.44 m/s | 1.15 m · 1.29 Hz (lock-off measure) | 0.5 % / 14.6 % | 0 | RF, LH, LF, RH (lateral four-beat) |
| Trot 3.33 | 2.50 · 1.35 | 2.5 % / 10.4 % | 10.4 % | diagonal pairs |
| Canter 4.83 | 2.90 · 1.66 | 3.1 % / 11.8 % | 14.6 % | HL, FL+HR, FR |
| Gallop 10 | 4.20 · 2.38 | 4.7 % / 11.3 % | 28.3 % | HL, HR, FL, FR (transverse) |
| Sprint 12 | 4.57 · 2.63 | 6.1 % / 11.8 % | 31.9 % | HL, HR, FL, FR |

The lock-on walk stride and order are noisy (the toe-height contact sensor double-triggers when the lock seats the hoof); the strips and the lock-off numbers show the real pattern.

### Layer 5: lighting

| Requirement | Status | Evidence and note |
| --- | --- | --- |
| Soft key, rim, fill | Partial | three hard directional lights in the hero; one sun in the film; no area light, no soft shadow |
| Contact shadows under all four hooves | Partial | film: sun shadow; hero: a radial sprite |
| Deep blacks with detail, no crushed regions | Weak | warm-bronze in the hero; crushed in the academy |
| Tone mapping and exposure | **Implemented**, untuned | ACES, 1.45 / 1.0 / 1.25; not tuned per place for black readability |
| Black coat readable in every environment | Weak | hero by hour (`baseline/time_of_day/`), academy (`baseline/desktop/campus_*.jpg`) |

### Layer 6: camera

| Requirement | Status | Evidence and note |
| --- | --- | --- |
| Shot 1 Royal Reveal (silhouette to light) | **Missing** | the hero is a static three-quarter; the film opens on a wide establishing shot |
| Shot 2 The Eye | **Missing** in the product | only a QA shot (`qaEye`); blocked by the eye defect |
| Shot 3 The Marwari Ears | Partial | plate hotspot, 1.5 m, ears off-centre (`plate_v2/plate_ears.jpg`) |
| Shot 4 The Anatomy | Partial | plate hotspots (neck, saddle, flank, hoof) and the film's tracking shots |
| Shot 5 The Full Stallion | **Implemented** | hero default and `finalWide` |
| Smooth easing, no jumps | **Implemented** | smoothstep blends 2.2 s, damped follow 4.5 to 5.7 / s |
| No clipping, no cropped ears, tail, hooves | Partial | **academy arena shot sits inside a tree canopy; a lamp post crosses `finalWide`; mobile hero crops the muzzle at 390 px** |
| Guided camera optional, never fights input | Partial | the film is optional ("Skip the film") and scripted, with no free-look; the plate has drag and fly-to |
| Controlled DOF, motion blur if justified | **Missing** | none |

### Layer 7: environments

| Requirement | Status | Evidence and note |
| --- | --- | --- |
| Three places and the switching mechanism preserved | **Implemented, verified** | §4.4: one horse, nine switches |
| A. Thar desert at sunset | Weak | golden haze, long shadows, drifting dust ✔; flat-shaded buttes, cone-shaped tufts, a gradient sky |
| B. Marwar village | Weak | lime-washed havelis, arches, pots, pol, paving, restrained palette ✔; clean game-set plaster |
| C. Equestrian training field (natural grass, professional fencing, soft daylight, distant countryside) | Partial | the third place is "the academy": sand arena, dark timber fence, arcaded stables, avenue trees, hedges, lamps; the ground is dark slate, the horse crushes into it; labelled "illustrative" |
| Horse centred, 2.5D layers, depth-consistent ground shadow | Partial | full 3D worlds with a tracking camera, not 2.5D layers; ground shadow ✔ |
| Same GLB and animation state across switches | **Implemented, verified** | |

### Layer 8: atmosphere and post

| Requirement | Status | Evidence and note |
| --- | --- | --- |
| Atmospheric perspective, fog | Partial | `FogExp2` + sky haze in the film, nothing in the hero |
| Ambient occlusion, contact shadows | **Missing** / Partial | baked AO only; sun shadow only |
| Tone mapping | **Implemented** | ACES |
| Colour grading | Partial | film-only coat grade toward black; no grade |
| Subtle DOF, controlled bloom | **Missing** | |
| Temporal stability, anti-aliasing | Partial; stability **Unverified** | MSAA 4x; no TAA; shimmer needs video |

### Layer 9: performance

| Requirement | Status | Evidence and note |
| --- | --- | --- |
| 60 fps on capable desktop | **Implemented, measured** | §4.1 (M2; academy at retina is at the limit) |
| Usable on supported mobile | **Unverified** | phone profile measured on the Mac only |
| Adaptive quality, presets | **Implemented** | tiers 0 to 3 + dynamic pixel ratio; engaged in the academy run |
| Controlled GPU memory | Partial | 133 to 194 MB desktop, uncompressed |
| Optimised loading | Partial | Draco + WebP, 1.0 MB; no preload, no KTX2, no immutable cache headers |
| Animation cleanup, no recompilation, no leaks | Partial | §4.4 |
| Graceful fallback without WebGL | **Implemented, verified** | `mobile_plate_fallback/fallback_no_webgl.jpg`, `fallback_reduced_motion.jpg` |

### Requirements PDF, items not covered above

| Requirement | Status | Note |
| --- | --- | --- |
| Hotspots with names, pointer, touch and keyboard, visible active state | **Implemented** | markers are labelled buttons; Tab order in `evidence/lifecycle/focus_and_roundtrips.json` |
| Select highlights the region and glides the camera; closing restores the view | **Implemented** | `plate_v2/*`; "Reset View" |
| Mobile: no tiny hit areas, no overlap, clear close control | Partial | markers are 40 px; **at 390 px the Reins and Hoof markers are off-frame at the overview** and the gait / view buttons overlap the horse (`plate_v2/plate_mobile_*.jpg`); the 2D archive plate is the non-3D alternative |
| Gaze tracking (desktop) and tilt (mobile, permission-based, touch alternative) | **Implemented**; tilt **Unverified** on a device | stubbed API only (earlier report) |
| Reduced motion honoured; stop when hidden | **Implemented, verified** | still frame; loop pauses off-screen (IntersectionObserver) |
| Camera framing checked at 375, 390, 768, 1280, 1440 px | Partial | 390 and 1440 captured; 375, 768, 1280 not yet |
| Poster image and loading feedback | **Implemented** | `marwari-hero-poster.webp` 23 KB; "Saddling the stallion…" |
| No unsupported physiology claims | **Implemented** in the plate copy (earlier report); the site-wide "Ten grams" line is still an editorial decision | |

---

## 7. What prevents cinematic realism, ranked

| # | Cause | Evidence | Fixed by |
| --- | --- | --- | --- |
| 1 | **Coat**: low-resolution, brown-biased albedo with cloud-like mottling, uniform 1.6 mm texels, no hair-scale normal, no anisotropy | §2.5; `desktop_2x/desert_shoulder.jpg`, `desert_barrel.jpg` | shader neutralisation and micro-detail (Gate A); a re-texture with head at 3× density and a flow map (Gate B) |
| 2 | **Hair**: alpha-tested ribbons, near-black stripe atlas, sheet tail, 4 + 4 bones | `desert_maneNeck.jpg`, `desert_tail.jpg`, gallop strip | alpha-to-coverage, anisotropic highlight, wind in the vertex shader (Gate A); new cards and bones (Gate B) |
| 3 | **Head**: no nostril, lips, lids, whiskers; floating eye domes; polygonal muzzle; bake patches | `desktop_2x/desert_eye.jpg`, `desert_muzzle.jpg`, `evidence/eye/` | runtime eye re-seat and eyelid shading (Gate A); Blender head pass (Gate B) |
| 4 | **Light**: hard sun or three hard lights, no AO, no soft key, no post; the black reads bronze or crushed | `baseline/time_of_day/`, `campus_*` | grade and light rebalance (Gate A); AO / bloom / DOF stack (Gate B) |
| 5 | **Sets**: procedural low-poly, canvas textures, no photographic detail; the field is not a field | `baseline/sheets/sheet_places.jpg` | procedural polish (Gate A); photographic textures or HDRIs (asset licensing, Gate B) |
| 6 | **Camera**: no authored reveal, eye or ear shots; the camera can sit in scenery | §6 Layer 6 | Gate A (uses the existing rig) |
| 7 | **Motion**: procedural IK clips repeat identically; tail does not stream; no spine undulation | gait strips | partly Gate A (tail, noise on the stride), the rest needs the other session's pipeline |
| 8 | **Budget**: no headroom at retina in the academy; uncompressed textures; MSAA at retina costs about 105 MB | §4 | quality presets, KTX2 (Gate B), pixel-ratio policy |

**What WebGL can and cannot reach.** Real-time WebGL in a 1 to 2 MB GLB can deliver a believable black Marwari at hero and wide distances at 60 fps on desktop, with strong art direction (neutral black albedo, a proper key and rim, ground contact, haze, a restrained grade). It cannot reach strand-level fur, subsurface skin, path-traced soft light and macro-distance eyes on a phone. The "mistaken for real equestrian cinematography" standard is reachable for **offline-rendered frames** (Blender Cycles with fur, from the same rig and the same horse), and only approachable live. A hybrid is the honest route to the standard: pre-rendered plates for the Royal Reveal, Eye and Ears shots, the live model for interaction. That is an owner decision (§10).

---

## 8. Plan, in order, with gates

Each step ends with matched before / after captures from `tools/qa-marwari/` (same cameras, same pinned assets), a measured cost, and lint / typecheck / tests / build.

### Gate A: code only, reversible, no asset change (proceed on go-ahead)

| Step | Layer | What | Cost / risk |
| --- | --- | --- | --- |
| A1 | 2, 5 | **Black stays black.** Neutral, cooler coat albedo in the shader for all hours (the film's `coat` uniform extended to the hero), warmth carried by the specular, hero light and exposure rebalanced per hour, contact shadow upgraded (soft blob plus a short-range shadow), pale sand in the academy so hooves read | none measured; one shader hook that already exists |
| A2 | 1, 2 | **Re-seat the eyes at load** (bone-local offset of the dome meshes), eyelid and brow wet-line and iris shading on the dome in the shader, blink re-checked | reversible; if it does not hold at 0.7 m, it becomes B2 |
| A3 | 3 | Hair: alpha-to-coverage (MSAA is on), Kajiya-Kay anisotropic highlight, per-card tint, vertex-shader wind and sway, tail spring retuned so it streams | small |
| A4 | 2 | Coat micro-detail in the shader: hair-scale normal and roughness noise faded by distance, flow-direction anisotropy approximated from bone axes, regional roughness (nostril, lip, inner ear) | cost to be measured at retina |
| A5 | 6 | Optional five-shot guided sequence (Reveal → Eye → Ears → Anatomy → Full) on the existing `CameraRig`; pauses on any pointer, touch or scroll input; off under reduced motion; camera avoidance for trees and lamps; mobile hero fit | uses existing code |
| A6 | 9 | `forceContextLoss()` on unmount; dispose each place's PMREM target and textures; start the GLB fetch early; versioned model names with immutable cache headers (a `next.config.mjs` change, flagged); expose high / medium / low presets over the existing tiers | each is a few lines |
| A7 | 7 | Procedural polish of the three places; re-dress the third as a field (grass, timber rails, countryside horizon) | no new assets |

### Gate B: approval needed (options, technical reason, recommendation)

| # | Decision | Options | Recommendation |
| --- | --- | --- | --- |
| B1 | **Post-processing stack** (touches the render loop; `EffectComposer` ships with three, so no new dependency) | (a) none, keep MSAA; (b) output pass + SMAA + subtle bloom + vignette / grade on the high tier only; (c) (b) + GTAO + depth of field for the close-up shots only | (b), then (c) only for the Eye shot if the retina academy cost allows (the academy has no spare frame budget at 2x today) |
| B2 | **Head pass in Blender, re-export the GLBs** (eyes, lids, nostrils, lips, ear cavities) | (a) targeted: proper eyeballs, eyelid cards, nostril cavity, lip cards, whisker cards, about +100 to 150 KB, adds a few face bones (a partial re-rig); (b) full head re-sculpt and retopo; (c) licence a photoreal head or horse asset (replaces the approved horse) | (a), after A2 shows whether the runtime fix is enough; tag a checkpoint first, as the earlier session did |
| B3 | **Coat re-texture and re-bake** | (a) keep the UVs, repaint neutral black, add a flow map, head at 3× density by re-packing; (b) 4096 for head and shoulder; (c) KTX2 / Basis compression (new tooling: `toktx` and the transcoder) | (a) now, (c) later if memory demands it |
| B4 | **Mane and tail rebuild** | (a) new cards and atlas on the existing 4 + 4 bones; (b) more bones (re-rig) | (a), (b) if the tail still reads stiff |
| B5 | **Pre-rendered cinematic plates** for shots 1 to 3 | yes / no | yes: it is the only route to the "could be mistaken for real" standard for close shots |
| B6 | **Photographic textures or HDRIs for the places** | licensed or CC0 sets | decide after A7 |

Before B2 to B4 the Blender sources need an owner: the other session re-exports from the same `.blend`.

---

## 9. Remaining realism limitations (honest list)

- Even after Gate A, the coat will read as a good CG satin black, not skin and hair at macro distance; the eye will still be a modelled dome with shader detail.
- The mane and tail stay cards; at gallop they will move better, not like strands.
- The clips are procedural IK, with no captured weight transfer or spine flex.
- No phone, Safari or Firefox has been tested; every mobile number is the phone code path on an M2.
- The hero stays behind `?stallion=preview`; enabling it for everyone is a separate owner decision.
- The Tripo licence plan for the source sculpt is still unconfirmed (production report §12).

## 10. Decisions and approvals requested

1. **File ownership** between this work and the `Realistic Marwari horse 3D model` session (§1.2), and who may re-export `public/models/*`.
2. **Gate A (A1 to A7)**: proceed, in that order? (code-only, reversible)
3. **B1** post-processing: (a), (b) or (c)?
4. **B2, B3, B4** asset work: which options, and a go-ahead to tag a checkpoint before touching the GLBs.
5. **B5** pre-rendered plates: yes or no?
6. Whether the unreferenced legacy GLBs (about 43 MB) may be deleted from the repo (a destructive change; nothing was deleted).

No push, merge, deploy or DNS change has been made, and none will be without explicit approval.

---

## 11. Gate A applied (A1 to A7), 27 Oct 2026

Approved by the owner: "proceed with Gate A steps A1 to A7 in that order, code-only and reversible", not touching the GLBs, the rig, a post-processing stack or new tooling, and not editing `footlock.ts` / `locomotion.ts`. All of it is uncommitted in the working tree (`git status` lists the files); nothing was committed, pushed, merged or deployed. Each step was captured with the same cameras and the same pinned copies of the GLBs as the baseline (`tools/qa-marwari/capture_set.mjs`, `base_desktop.mjs`, `capture_reveal.mjs`), so a before and an after frame are two files with the same name.

### 11.0 Correction to the baseline report

The baseline academy frames (`baseline/desktop/campus_*.jpg`, the "academy" row of `baseline/sheets/sheet_places.jpg`) were taken with the horse stopped **on the shaded gravel drive**, under the avenue of trees. That is where the film's third chapter starts, not where it ends. Three statements in §0, §6 and §7 that came from those frames describe the drive and not the academy as a whole: "the academy arena shot sits inside a tree canopy", "a lamp post crosses `finalWide`" and the crushed, dark look of the horse in the academy. The arena itself (`baseline/arena/`, `baseline/sheets/sheet_arena.jpg`) was already a good black coat on pale sand. The drive is still a real defect (a black horse on dark gravel under a canopy), and A7 fixes it; the arena was not the problem.

### 11.1 What changed

| Step | What | Files |
| --- | --- | --- |
| A1 Black stays black | Neutral, luminance-capped coat albedo for every hour (warmth is carried by the specular, the rim light and a dark sheen, not by the diffuse); a studio environment built from emissive panels replaces the room environment; hero light stops (`daylight`) rebalanced for night, dawn, day and dusk; soft hoof contact blobs and a ground patch replace the single shadow disc; the film uses the same coat with its own grade | new `components/3d/marwari-coat.ts`, `studio.ts`, `contact.ts`; `marwari.ts`, `hero/StallionStage.tsx`, `sections/anatomy/Anatomy3DHorse.tsx`, `stallion-film/engine.ts` |
| A2 Eyes | Each eye dome is moved into its painted socket at load (offsets found per eye against the bind pose, guarded by the known dome positions so a re-exported model with the eyes fixed is left alone); the dome is shaded as a dark amber iris with fibres, a limbal ring and a horizontal pupil under a wet cornea | new `marwari-eye.ts` |
| A3 Hair | Alpha to coverage (MSAA is on) instead of a hard alpha test; each ribbon is shaped into ragged strands; a Kajiya-Kay highlight for every directional light; flutter at the tip; a stronger stream in the tail and mane sway | new `marwari-hair.ts`; `stallion-film/life.ts` |
| A4 Coat micro-detail | Hair-scale normal and roughness noise faded by distance; a per-vertex hair-flow attribute (from the skin weights) drives anisotropic highlights along the coat; region roughness (oiled hooves, matte muzzle, wet lid margins); the baked normal map is partly taken out at body scale and calmed at the pasterns | `marwari-coat.ts` |
| A5 Camera | An optional guided sequence on the hero: *Reveal* (lights down to a rim-lit silhouette, a cut in the dark to a low view from behind, the key light rises while the camera swings round) → *Eye* → *Ears* → *Anatomy* (shoulder, barrel, hindquarter) → *Full stallion*, about 40 s, with captions. A "Play the reveal" button; any key, touch, wheel or scroll stops it and hands the camera back in 1.2 s; not offered under reduced motion. The camera now keeps out of the academy's avenue trunks, crowns and lamp posts. Mobile hero fit: the muzzle was cut at 390 px; at 768 px the ears met the header labels | new `hero/reveal.ts`; `StallionStage.tsx`, `3d/marwari.ts` (`addLights().level`), `stallion-film/scenery/campus.ts` |
| A6 Lifecycle and loading | The PMREM render target is disposed, not only its texture (the source of "+3 textures per place re-entry"); `releaseRenderer()` frees the WebGL context when the canvas has left the page (stage and anatomy plate); the hero preloads the model and the Draco decoder as soon as it knows it will show the stallion; production builds ask for `/models/<name>.glb?v=<content hash>` and only that URL is served `immutable`; `FilmEngine.setPreset("auto" / "high" / "medium" / "low")` and `?quality=` over the existing tiers | `stallion-film/engine.ts`, `3d/marwari.ts`, `3d/marwari-paths.ts`, `hero/stallion-flags.ts`, `sections/home/StallionHero.tsx`, **`next.config.mjs` (flagged)** |
| A7 Places | Academy only: lighter, warmer gravel; avenue trees every 28 m instead of 14 and a little smaller, so the drive is no longer a dark tunnel; the clipped hedges are replaced by a timber post-and-rail paddock fence; sun-bleached and darker patches in the grass. **Desert and village were not changed** | `stallion-film/terrain.ts`, `scenery/campus.ts` |

The one flagged item is `next.config.mjs`: it computes a hash of the three model files at build time (production only), exposes it as `NEXT_PUBLIC_MODEL_V`, and adds a header rule that matches `/models/*` **only when the `v` query equals that hash**. Any other URL, `next dev` and `marwari-gaits.json` are unchanged (`Cache-Control: public, max-age=0`). A re-exported model changes the hash, so nobody keeps a stale file, and no GLB was renamed.

### 11.2 Before and after

| Step | Matched frames | What the comparison shows |
| --- | --- | --- |
| A1 | `after/A1/compare_hero_hours.jpg`, `compare_film_plate.jpg` | The coat stays black at 06:00 and 18:00. Mean warm bias (R minus B over a fixed body box of the hero crop, 8-bit values): 00:00 3.3 → 1.5, 06:00 **14.6 → 4.7**, 12:00 4.8 → 2.0, 18:00 4.7 → 2.5. The body is also darker (mean 31 → 13 at noon): it reads black, and its form is carried by the rim and the highlights, not by a lit diffuse |
| A2 | `after/A2/compare_eye.jpg` | Domes sit in the sockets; amber iris with a catch-light |
| A3 | `after/A3/compare_hair.jpg` | The tail is no longer see-through; ragged strand tips; the mane catches a long soft highlight. At under a metre the mane ribbons still read as planks (§11.6) |
| A4 | `after/A4/compare_coat.jpg` | Calm satin instead of cloud-like mottling; no zig-zag creases at the pasterns |
| A5 | `after/A5/sheet_reveal_desktop.jpg`, `sheet_reveal_mobile.jpg` (19 frames each), `desktop_zz_interrupt_*.jpg` (input hands the camera back), `compare_hero_fit.jpg` (390 / 360 / 768 px, before and after) | The sequence plays end to end; the horse is whole at 390, 360 and 768 px and clear of the header and the nav |
| A6 | `after/A6/reduced_motion_desktop.jpg`, `reduced_motion_mobile.jpg`, `plate_*.jpg` | Reduced motion: one still frame, the passport link, no reveal button, no film. The anatomy plate still renders and focuses its markers after the context-release change |
| A7 | `after/A7/compare_academy.jpg` | Hooves and shadows read on the drive; the camera is no longer inside a canopy; the academy reads as a paddock with timber rails |

A5 needed two lighting decisions worth recording. (1) The sequence cuts, in the dark, to a view from behind instead of flying the camera there: a straight camera path from the front to behind passed within three metres of the horse's flank and cropped the head. (2) In the head-on close-ups a large pale dome appeared at the lower right. It was the back of the horse catching the rim light, which sits behind and above, at a grazing angle (removing every light removed it; removing the environment, the key, the sheen or the specular did not). It is correct light on a glossy surface and a bad shot, so each close-up lowers the rim to 30 % and the wide shots keep it.

### 11.3 Lifecycle (A6), measured

| | Baseline (§4.4) | After A6 |
| --- | --- | --- |
| GPU textures, desert / village / academy, entered again and again | 13 → 16 → 19, 17 → 20, 19 → 22 (**+3 per re-entry**) | **15 / 18 / 18, the same on the second and third visit** (dev server, `goTo` through the three chapters three times, then back to the hero) |
| Cause | not isolated | `texture.dispose()` on a PMREM texture does not release its render target. In isolation, three `PMREMGenerator.fromScene` calls each added one texture, and disposing the texture changed nothing; disposing the render target gave the slot back. The engine regenerates the place's environment on every entry and kept only the texture |
| WebGL contexts created over ten `/` ↔ `/cadets` round trips (production server) | 3 → 15, 2 lost | **3 → 5, flat from the first trip**, 2 lost (`after/lifecycle/`) |
| Heap per round trip | about +0.7 MB, still rising (29.9 → 37.2 MB) | about +0.2 MB (21.4 → 24.0 MB over ten trips) |
| Event listeners per round trip | about +19 | about +13 |
| DOM nodes | 8,336, flat | 5,155, flat |

What this does and does not show. The texture leak is fixed and measured. The contexts stopped accumulating, but this test cannot say whether `releaseRenderer()` is the reason: it forces the context loss only when the canvas has left the document, because a force-lost context cannot be given to a new renderer, and a route that is only cached keeps its canvas. Heap and listeners still creep up a little per trip; the leak is smaller, not gone. The model is requested again on every return in this harness because it serves the pinned file with `no-store`; with the immutable URL a real browser reuses its cached copy, which this harness cannot show.

### 11.4 Frame cost and loading, before and after

**Method.** Frame cost is only comparable when both sides are measured under the same load, and the machine was not quiet: the first production-server run after the changes was taken at a load average of 25 to 47 and showed sync costs two to three times the baseline's, for every scene including ones nothing touched. It is kept (`after/perf/prod_desktop2.json`) but not used. The comparison below is an interleaved A/B: the baseline commit `777833b` exported with `git archive` and run as a second dev server, against this working tree's dev server, both on the same pinned GLBs, alternating, three runs each (two on the phone profile), at a load average of 9 to 12. Both sides are dev builds, so the React overhead is the same. `after/perf/ab_*.json`. 1440×900 at 2x, canvas 2160×1350, Apple M2; the display is locked to about 62 fps, so the **synchronous render cost** and the GPU time are the numbers that show headroom.

| Scene | fps (cap about 62.5) | Sync render ms, baseline → after | GPU p50 ms, baseline → after | Draw calls | Triangles |
| --- | --- | --- | --- | --- | --- |
| Hero studio, idle | 62.5 → 62.5 | 3 → 3 to 4 | 3.6 → 3.6 to 4.2 | 4 → 9 | 37,642 → 37,652 |
| Desert, standing | 62.5 → 62.5 | 6 → 6 | 4.5 to 6.4 → 6.2 to 6.3 | 19 → 23 | 250,600 → 250,608 |
| Desert, gallop 10 m/s | 62.2 → 62.5 | 8 → 8 | 5.9 to 6.6 → 6.7 to 7.0 | 19 → 19 | 251,350 → 251,350 |
| Village, trot | 62.5 → 62.5 | 7 → 7 | 6.4 to 6.9 → 6.5 to 7.0 | 37 → 41 | 693,666 → 693,674 |
| Academy, canter | 62.5 → 62.4 | 9 to 10 → 10 | 7.3 to 7.7 → 7.6 to 7.9 | 33 → 35 to 37 | 636,656 → 562,070 |
| *Phone profile 390×844 @3x (canvas ratio 1.25, tier 2): hero* | 62.5 → 62.5 | 2 to 3 → 2 to 3 | 1.6 to 3.0 → 2.0 | 4 → 9 | same |
| *Phone profile: desert, standing* | 62.5 → 62.5 | 3 to 4 → 3 to 5 | 3.3 to 5.0 → 3.7 | 19 → 23 | 197,982 → 197,990 |
| *Phone profile: academy, canter* | 62.5 → 62.5 | 3 to 5 → 3 to 5 | 4.4 to 5.6 → 4.8 | 33 → 33 | 314,528 → 281,848 |

Reading: **no measurable frame-cost change on this GPU.** The hero costs about 0.5 ms more on the GPU (the coat, hair and eye shaders and five more draw calls: four hoof contact blobs and the ground patch); the places are within the run-to-run spread; the academy draws 12 % fewer triangles because of the thinned avenue, and two more draw calls for the timber rails. A real phone, Safari and Firefox are still not measured, so none of this says anything about them.

**A correction to §4.1.** The academy's 16 to 18 ms and its "no spare frame budget for ambient occlusion, bloom and depth of field" were taken at a load average of 26.7. On the quiet runs the same scene costs 9 to 10 ms at retina on both the baseline and the changed code, so the headroom for a restrained post stack (B1 option b) is larger than §4.1 said. It still has to be measured on a phone and on a quiet machine before it is promised.

**Load time** (production server, the real network path, `after/perf/prod_loadtime.json`; before in `evidence/perf/prod_loadtime.json`). A6 started the model download earlier: the hero now asks for the model and the Draco decoder as soon as it knows it will show the stallion, instead of after the stage's chunk has loaded.

| On "Slow 4G" (1.6 Mbit/s, 150 ms RTT), cold | Desktop, before → after | Phone profile, before → after |
| --- | --- | --- |
| Model request starts | 9.1 s → **6.0 s** | 8.9 s → **6.2 s** |
| Model finished | 25.3 s → 24.4 s | 18.2 s → 17.1 s |
| Horse and engine ready | 29.5 s → **26.8 s** | 22.4 s → **19.7 s** |
| Localhost, cold, ready | 2.0 s → 1.4 s | 1.2 s → 1.0 s |
| Second visit, model | revalidated, 304 → **served from cache, 0 bytes** (200, 0.2 s) | same |

The six seconds before the request are the page's own JavaScript (about 960 KB on the wire at that speed); the model cannot start before the page knows it wants the stallion. The preload only runs where the stallion is enabled (`?stallion=preview` or `NEXT_PUBLIC_STALLION_MODEL`), so the live home page is not affected.

### 11.5 Tests and build

| Check | Result |
| --- | --- |
| `npm run lint` | 0 errors in every source file I touched (`eslint` on `components/hero`, `components/3d`, `components/stallion-film`, `StallionHero.tsx`, `Anatomy3DHorse.tsx`, `next.config.mjs`). The full run still reports 34 errors, all `no-this-alias` in the vendored `public/anatomy/vendor/*.js` files, unchanged from the baseline |
| `npm run typecheck` | pass |
| `npm test` | 84 / 84 |
| `npm run build` | pass (Next.js 16.4.2, Turbopack) |
| Production server | `Cache-Control` checked with `curl -I`: `…glb?v=<current hash>` → `public, max-age=31536000, immutable`; the plain URL, a stale `v` and `marwari-gaits.json` → `public, max-age=0` |
| Browser | no console error, page error or failed request in any A5, A7 or perf run (the logs are in the `_log.json` files and the runs' output) |
| `npm run test:e2e` (production build, smoke) | **17 passed, 1 failed**: the staff-console redirect check (a login page, not a horse route; it also failed at the baseline, where 16 passed and 2 failed). It ran through a one-line wrapper that points a cached Playwright at the installed Chromium 1248, because none of the cached Playwright versions expected that revision; nothing was installed |

### 11.6 Remaining realism limitations (revised)

- **Close-ups are the limit.** The eye now reads (catch-light, amber iris, wet rim), but the skin around it is a baked texture: at 0.8 m it shows faceted patches. The forelock reads as a smooth satin sheet over the forehead from the front, and the mane ribbons read as planks under a metre (both visible in the transition frames of the reveal, `after/A5/desktop_11_*` to `desktop_14_*`). No eyelid, nostril or lip geometry exists; that is B2.
- **Coat:** a convincing CG satin black at hero and wide distance; not strand-level fur or skin. The rim light can make large surfaces glow pale at grazing angles from the front (handled per shot in the reveal, not in the film's own shots).
- **Places:** the academy is improved; the desert and the village are unchanged and still procedural low-poly with canvas textures. A lamp post can still cross a shot on the drive (the camera keeps 2.4 m from posts, but a post in front of the lens is not avoided). No photographic textures or HDRIs (B6).
- **Light:** no ambient occlusion, bloom or depth of field (B1); the hero still casts no shadow of its own beyond the contact blobs.
- **Motion:** untouched (the other session's pipeline).
- **Performance:** measured on one Apple M2 under heavy background load; no phone, Safari or Firefox (§11.4).
- **The hero is still behind `?stallion=preview`**; the reveal button appears only there.

### 11.7 Recommended next steps

1. **B1 (b)**: output pass + SMAA + a restrained grade on the high tier only; it needs frame budget that the retina academy does not have today, so measure on a quiet machine first (§11.4).
2. **B2 (a)**: the targeted head pass in Blender (eyelid cards, nostril cavity, lip and whisker cards). It is the biggest remaining gap in the Eye shot and cannot be done in a shader.
3. **B5**: pre-rendered plates for the Eye and Ears shots; they are the route to the "mistaken for real" standard for the shots that go closest.
4. Small code items left from Gate A: desert and village polish (A7 covered the academy), line-of-sight avoidance for lamp posts, a visible quality control on top of `setPreset`.
5. Tell whoever re-exports the GLBs about the model-versioning rule (`next.config.mjs`) to whoever re-exports the GLBs: nothing to do, the hash follows the files, but they should know that a deploy after an export changes the URL.
