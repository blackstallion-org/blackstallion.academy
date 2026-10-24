# Rigged Marwari stallion: build and verification report (24 Oct 2026)

## What was delivered

| File | What it is |
| --- | --- |
| `public/models/marwari-hero.glb` | Hero LOD: 76.9k triangles, 42-bone skin, 8 clips, Draco geometry, 3 × 1024 WebP textures. **619 KB.** |
| `public/models/marwari-anatomy.glb` | Anatomy LOD: 213.5k triangles, same rig, clips and textures. **1.07 MB.** |
| `public/models/marwari-hero-poster.webp` | Eevee still (transparent) shown when WebGL is unavailable. |
| `docs/reference/3d/marwari/marwari_rigged_source.blend` | Blender 5.2 source: the 213k mesh, armature, weights, all eight actions (NLA tracks), packed textures. |
| `docs/reference/3d/marwari/scripts/` | The headless pipeline, stage by stage (below), plus the render and QA helpers. |
| `docs/reference/3d/marwari/renders/` | QA sheets: six views, skeleton overlay, walk, trot, weight shift, head, ears, blink. |
| `components/3d/marwari.ts` | Shared three.js loader, coat material, region highlight, gaze, time-of-day light. |
| `components/hero/StallionStage.tsx` | The hero stage (rewritten on three.js; the old hand-written WebGL2 renderer is removed). |
| `components/sections/anatomy/Anatomy3DHorse.tsx` | The anatomy viewer (new model, five hotspots, gait switch). |
| `components/sections/home/StallionHero.tsx` | Home section for the stage, shown only with `?stallion=preview` or `NEXT_PUBLIC_STALLION_MODEL`. |

## Source geometry and licence

- Base sculpt: the owner-supplied `horse+3d+model (5).glb` (generator: **Tripo**, 970k triangles, 1024 px base colour / normal / roughness-metal maps, no rig).
  The sculpt already carried Marwari lyre ears (tips curving inward until they nearly touch), so the ears were not re-sculpted.
- **Licence to confirm:** Tripo's terms depend on the account plan used to generate the model (paid plans grant the
  generator commercial ownership; free-plan outputs have been published under CC BY 4.0). Confirm the plan before public launch,
  and add attribution if it was a free generation.
- No third-party geometry was used. The CC BY-NC `rossbandiger` statue and the other GLBs in `public/models/` were inspected, not reused.

## Pipeline (`scripts/`, run with `Blender -b --factory-startup -P <script> -- <args>`)

1. `stage1_orient.py`, `stage1b_scale_grid.py`: face the horse -Y (glTF +Z), stand it on the floor, scale the withers to 1.52 m (Marwari stallion average, Blueprint §breed standard); gridded orthographic side and front views for landmarking.
2. `stage2_prepare.py`: weld split vertices (566k → 485k), collapse-decimate to 213.5k triangles, repaint the bay coat as a Kala (black) coat in texture space (white blaze, snip, socks and pale hooves removed by masked in-painting; hair grain kept; warm undertone in the sheen); metallic removed, roughness floor raised.
3. `stage3_rig.py`: joint landmarks measured from mesh cross-sections (each leg separately: the horse stands square-ish but not symmetric), 42-bone skeleton (spine, ribcage, 3-bone neck, head, ears with tips, eyelid bones, 4-bone tail, scapula/humerus/forearm/cannon/pastern/hoof, femur/gaskin/cannon/pastern/hoof); weights by bone heat on a watertight voxel proxy, transferred to the render mesh, 4 influences.
4. `stage4_straighten.py`, `stage4b_roll_weights.py`: the supplied head was turned 23° to one side; neck and head straightened and applied as the rest pose (neutral for gaze); bone rolls set so local X is the horse's width axis; knee, hock and fetlock weights smoothed.
5. `stage5_anim.py`: eight clips, keyed per frame at 30 fps. Legs use a planar two-bone IK (forearm + cannon, gaskin + cannon) with the shoulder/hip swinging the limb, so stance hooves stay on the ground; pastern and hoof fold in swing and lie flat in stance.
6. `stage6_export.py`: decimate (hero), weight repair, glTF export with Draco (q14 position, q10 normal, q12 UV), WebP q82, actions exported unsampled so each clip carries only its own bones (they layer at runtime).

## Clips

| Clip | Length | Bones | Notes |
| --- | --- | --- | --- |
| `Idle_Breathing` | 4.0 s | Ribcage (scale), Spine_Thoracic, Neck_1 | 2.4 % lateral rib swell |
| `Head_Turn` | 8.0 s | Neck_2, Neck_3, Head | right, centre, left, centre |
| `Ear_Rotate` | 4.0 s | Ear_L, Ear_R | independent swivels up to 55° |
| `Blink` | 0.5 s | Eye_L, Eye_R | played at random intervals |
| `Weight_Shift` | 6.0 s | pelvis, spine, hind legs | rests the right hind on its toe |
| `Walk` | 1.2 s | trunk, neck, head, legs, tail | four-beat lateral sequence (LH, LF, RH, RF), 0.62 duty |
| `Trot` | 0.7 s | trunk, neck, head, legs, tail | diagonal pairs, suspension, 0.44 duty |
| `Tail_Sway` | 3.0 s | Tail_1–4 | travelling wave |

## Verification (what was actually checked)

- **Renders** (Eevee, `renders/`): front, back, left, right, three-quarter front and rear at rest; skeleton X-ray (side, front); walk frames 0/9/18/27; trot 0/5/10/15; weight shift (back, right); head turn; ear swivel; blink close-up.
- **Hoof contact** (`diag_feet.py`): during stance the toe stays at 0.02 m and the coronet at 0.10 m (rest heights), sliding back under the body as intended. Worst stance dip: 3 cm at breakover.
- **Deformation:** no tearing or inverted faces at the carpus, hock, fetlock, neck or tail in any QA frame after weight smoothing. Known softness: the carpus reads slightly rubbery at full swing flexion (no corrective shapes).
- **Website** (dev server, built-in browser and Playwright): the hero loads and fades in; the head follows the cursor left and right; a click dollies to the head and lands on `/cadets#passport`; tilt permission button appears on touch devices that require it; the anatomy plate loads, orbits, focuses all five hotspots with region glow (mouse, and keyboard via Enter on a focused marker), the info panel updates, and Stand / Walk / Trot crossfade; 390 px and 1440 px checked, no horizontal overflow, nav clear.
- **Reduced motion:** the hero renders a single still and the click goes straight to the passport; the plate opens on the 2D archive plate as before, and the still 3D view places markers and disables the gait switch.
- `npm run typecheck` and `npm run build` pass. `npm run lint`: no findings in the touched files; the 47 errors it reports are all in the untracked, vendored `public/anatomy/vendor/*.js` (pre-existing, not part of this work).

## Honest limits

- **Not photorealistic.** The renders show a convincing, anatomically sound horse with a satin black coat, but the coat is texture-painted (no hair cards or fur shading), the mane and tail are sculpted solids, the 1024 px textures soften close-ups, and the former blaze leaves a faint smooth stripe and a specular line down the face. A faint ring is visible on the hind cannons at a UV seam.
- Ears swivel and eyes blink by bone deformation (squash), not separate lids; fine at hero distance, visible in close-up.
- Gait clips are in place (no root motion) and procedurally keyed from an IK solver, not motion capture.
- On-device frame rate was not measured (the test browser pane was hidden, which throttles animation frames). Asset weight: 619 KB hero + Draco decoder (local, `public/draco`).
- No automated accessibility scan (axe) was run; checks were manual (roles, labels, `aria-pressed`, focus rings, 44 px targets on the hero buttons).

## Turning it on

The hero stage is shown only for review: `/?stallion=preview`. To show it to everyone set `NEXT_PUBLIC_STALLION_MODEL=/models/marwari-hero.glb` (owner approval required; not deployed). The anatomy plate on the home page uses the new model now (it replaced `marwari-animated-home.glb`, which is left in place, unused).
