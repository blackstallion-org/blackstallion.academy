# Marwari ear crescent (Phase 11, 3 Nov 2026)

`08_ears/ear_cup.py` thinned and hollowed the scan's ears, but they were still tubes: close up (the /anatomy ear study, the bond
scenes) they read as horns. `ear_crescent.py` replaces them. Each ear is cut off at its root and re-grown as a crescent:

- a broad, flat base (about 6 cm across, 3.5 cm deep) that tapers to a blunt, rounded tip (about a third of the base width);
- a centre line that curls inward until the two tips nearly meet (tip centres 2.2 cm apart, surfaces about 6 mm), with a small
  forward lean and a few percent of left/right difference in length, curl and twist (no mirrored ears);
- a smooth convex back and a front that is a cup (a kidney-shaped section: raised rim, hollow, a few millimetres of cartilage);
- the ear is lofted straight off the ring of head vertices the old ear left, so it is welded to the head, and the old skin round
  the root is smoothed so it grows out without a boss.

Rig: `Ear_L/R` and `Ear_Tip_L/R` are the same bones with the same orientations (the weights are re-split along the new centre
line); only the tip joints move, onto the new line, so the tip bends about the cartilage. A second UV layer, `EarMask`, is exported
as `TEXCOORD_1` (the exporter flips v) and carries cup depth (u) and an ear / rim flag (v) for the coat shader in
`components/3d/marwari-coat.ts`. The runtime ear motion is `components/3d/ear-motion.ts`.

```
# input: the masters from before ear_cup.py (kept out of git: tools/blender/source/*.pre-ears-2026-11-02.blend)
blender -b --factory-startup -P tools/blender/09_ear_crescent/ear_crescent.py -- tools/blender/source/marwari_hero_source.pre-ears-2026-11-02.blend tools/blender/source/marwari_hero_source.blend
blender -b --factory-startup -P tools/blender/09_ear_crescent/ear_crescent.py -- tools/blender/source/marwari_anatomy_source.pre-ears-2026-11-02.blend tools/blender/source/marwari_anatomy_source.blend
blender -b --factory-startup -P tools/blender/04_export/stage10_export.py -- tools/blender/source/marwari_hero_source.blend public/models/marwari-hero.glb 2048 1024
blender -b --factory-startup -P tools/blender/04_export/stage10_export.py -- tools/blender/source/marwari_hero_source.blend public/models/marwari-hero-mobile.glb 1024 512
blender -b --factory-startup -P tools/blender/04_export/stage10_export.py -- tools/blender/source/marwari_anatomy_source.blend public/models/marwari-anatomy.glb 2048 1024
sh tools/blender/06_exhibit/build_all.sh <work>   # anatomy-exhibit.glb (keep public/models/cadet-rider.glb: export the rider to a scratch path)
```

Check renders (rest pose, matte studio light, hair removed): `render_views.py -- <blend> <outdir> <tag> [width] [hide_hair]`
(front, three-quarter, side, rear three-quarter, back, top; env `TX`, `TZ`, `DIST`, `VIEWS` aim and limit it).

Known limits: the ear roots sit on the scan's skin, which is rough around the poll (the mane and forelock cards cover most of it);
the ear's colour UVs reuse the root's, so the ear takes its colour from the shader, not from the baked map; the high-resolution
sculpt (`Marwari_High`, never exported) still has the old ears.
