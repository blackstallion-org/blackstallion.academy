# Marwari three-view refinement (Phase 12, 3 Nov 2026)

Brings the hero Marwari toward the owner's three-view reference (front, side, rear; kept with the brief, not in git): a white
blaze running into a pale pink muzzle, four white stockings with their own ragged tops, horn-coloured hooves, warm brown in the
coat over the barrel, flank and lower neck, and a long, full tail that falls nearly to the ground. The master
(`tools/blender/source/marwari_hero_source.blend`) is only read; everything here builds a separate, reversible working copy.

| Layer | What changed | Where it lives |
| --- | --- | --- |
| L1 anatomy | Nothing. Belly clearance, neck base and barrel depth, as shares of the height at the withers, match the reference's side view within a few per cent; the rest is its lens and light. | (none) |
| L2/L3 coat, markings, hooves | A new colour map composited over the untouched graded map from per-texel masks (bind-pose position and normal, baked into the UVs). The ears reuse body texels, so they are left out of the bake and the shader keeps markings off them. | `textures/marwari_base_refined_2048.png`, `textures/masks/*.png` (one per effect, editable) |
| L4 tail | Rebuilt as one full bundle: every lock starts inside the croup at the dock (the quarters' midline, x = 0.055) and comes out as a tight rounded collar; three depth layers (dark core of wide locks, middle layer, outer layer of narrower longer ones) of 176 locks in all, each with its own width, length, phase and S-curve (neighbours wave together, so they read as clumps); the cross-section opens from 7 cm at the dock to about 25 cm across, flares a little at the ends, and the lock lengths are staggered (tips 10 to 55 cm above the ground) so the lower end thins out and is soft. The 72 original ribbons keep their vertex count, UVs and weights (only rest positions change); 104 new locks (15 rows each, weights from their height against the tail bones) are `Marwari_Hair_Add_Tail`, joined at export. | `Marwari_Hair` (reshaped), `Marwari_Hair_Add_Tail` (added, removable), `Marwari_Hair_Original` (kept) |
| L2c dock hole | The original bake left a hole at the croup beside the tail dock in three maps (colour 0, occlusion 0 on one side and 1 on the other, flat normals): the body showed a dark-and-tan patch with a hard edge. Filled from its surroundings (with the coat's own grain) in the colour, occlusion/roughness and normal maps; the originals stay in the blend with a fake user. | `textures/marwari_base_refined_dock_2048.png`, `marwari_orm_dock_2048.png`, `marwari_normal_dock_2048.png` (`fix_dock_texture.py`) |
| L5 mane | Lengthened 18 % and draped 8 to 14 mm off the neck instead of standing off it; the forelock is unchanged. | `Marwari_Hair` |
| Runtime | `components/3d/marwari-coat.ts` (v10): painted marks (luminance well above any coat texel) bypass the black-coat grade; red-rich warm brown is graded far less. Other models' maps never reach either threshold, so they render as before. `components/3d/marwari-hair.ts` (v10): the tail is shaded as solid locks (whole coverage with a one-pixel soft edge at the sides and tip; fine strands change tone and highlight only and fade out below two pixels, so alpha-to-coverage can no longer turn it into dither), darker toward the core of the bundle (measured from the geometry at load), dock in shade, stock specular cut and replaced by the strand highlight in clump-to-clump bands, flutter at the free end. The old tail branch read uv.y the wrong way round (in the browser uv.y is 0 at the root and 1 at the tip; the exporter flips Blender's v), so strands dissolved at the dock instead of the tips; the mane branch keeps the old reading and is unchanged. | |

The exported body and eyes are byte-identical to the previous export (same Draco data); the rig, inverse bind matrices, node
transforms and every clip are unchanged. Hair: 2 288 -> 5 408 vertices; triangles 49 364 -> 52 276 (+5.9 %); file 1.29 -> 1.37 MB
(+5.9 %), mobile 0.89 -> 0.93 MB (+5.2 %); still three draw calls.

```
# 1. masks and colour map (bake once per master)
blender -b --factory-startup -P tools/blender/10_refine/bake_maps.py -- tools/blender/source/marwari_hero_source.blend <work> 2048
blender -b --factory-startup -P tools/blender/10_refine/paint_markings.py -- <work> tools/blender/textures/marwari_base_graded_2048.png tools/blender/textures/marwari_orm_2048.png tools/blender/textures
# 1b. the dock hole in the colour, occlusion/roughness and normal maps (plain python: numpy, scipy, pillow)
python3 tools/blender/10_refine/fix_dock_texture.py tools/blender/textures/marwari_base_refined_2048.png tools/blender/textures/marwari_orm_2048.png tools/blender/textures/marwari_normal_2048.png tools/blender/textures/marwari_base_refined_dock_2048.png tools/blender/textures/marwari_orm_dock_2048.png tools/blender/textures/marwari_normal_dock_2048.png
# 2. working copy (layers: tex,hair; the last two arguments are the occlusion/roughness and normal maps from step 1b)
blender -b --factory-startup -P tools/blender/10_refine/build_refined.py -- tools/blender/source/marwari_hero_source.blend tools/blender/source/marwari_hero_refined.blend tools/blender/textures/marwari_base_refined_dock_2048.png tex,hair tools/blender/textures/marwari_orm_dock_2048.png tools/blender/textures/marwari_normal_dock_2048.png
# 3. exports (stage10 settings; joins the added hair, bakes any shape keys)
blender -b --factory-startup -P tools/blender/10_refine/export_refined.py -- tools/blender/source/marwari_hero_refined.blend public/models/marwari-hero-refined.glb 2048 1024
blender -b --factory-startup -P tools/blender/10_refine/export_refined.py -- tools/blender/source/marwari_hero_refined.blend public/models/marwari-hero-mobile-refined.glb 1024 512
```

Built with Blender 5.2.3 (glTF I/O 5.2.41, the version that wrote the shipped models; re-exporting the untouched master with it
reproduces `marwari-hero.glb` byte for byte). Marking shapes are parameters in `paint_markings.py` (stocking tops per leg, blaze
width along the head); a JSON object as a fifth argument overrides them.

Rollback: point `HERO_MODEL` / `HERO_MODEL_MOBILE` in `components/3d/marwari-paths.ts` back to `marwari-hero.glb` /
`marwari-hero-mobile.glb` (both untouched). The coat shader change is inert on the old files.

Known limits: the anatomy plate and exhibit (`marwari-anatomy.glb`, `anatomy-exhibit.glb`) still show the all-black coat and the
old tail; the hero poster (`marwari-hero-poster.webp`) is a still of the old coat; the lower tail can pass through a hind leg in
the static gallop pose (in the site the tail flow lifts it back with speed); the ears keep the strong Marwari curl; the tail is still
cards, not strands: at very large close-ups lock edges read as straight blades with pointed tips, and a strand-level hair system
(or more, narrower cards) would be the next step.

## Balanced ears and a mane that hangs from the crest (4 Nov 2026)

The scanned crown leans: above the brow the skull's midline drifts about 2 cm to the horse's right, and `refine_ears.py` places the
pair about that crown line, so the ears sat off the blaze and the right one came out 1.7 cm lower (closer to its eye) than the left.
`balance_ears.py` runs on the finished working copy and corrects that with one smooth field above the eyes: the crown, both ears and
the forelock slide back onto the face's midline (1.7 cm at the poll, nothing below z = 1.94 or behind the poll), each ear is levelled
by half the height difference (fading out round its root, so the skull stays welded), and the Ear / Ear_Tip bones move with them.
Measured after: bones at x = +/-0.048 about the midline at one height, tips meeting over the blaze at one height. The eyes, the face,
the neck, the body and the tail do not move.

```
blender -b --factory-startup -P tools/blender/10_refine/balance_ears.py -- tools/blender/source/marwari_hero_refined.blend tools/blender/source/marwari_hero_refined.blend
```

Runtime (`marwari-hair.ts` v12): the mane read its uv the old way round (transparent at the crest, whole at the ends), cut sixteen
strands across each ribbon (alpha-to-coverage dither: grey stripes and specks), took a screen-space strand direction that jumped at every
card edge (a light outline round each lock) and the stock specular at full strength; its flutter also moved the crest. It now uses the
tail's treatment: solid locks from the crest with soft sides and tip, tone-only strands that fade below a pixel, a per-vertex strand
direction, the reduced specular and strand highlight, a mane as dark as the coat, and flutter at the free ends.
