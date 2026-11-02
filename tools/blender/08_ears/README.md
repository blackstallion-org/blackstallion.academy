# Ear cups (Phase 10, 2 Nov 2026)

The canonical Marwari's ears were solid, round tubes ending in knobs: close up (the /anatomy ear study, the bond scenes) they read
as horns. `ear_cup.py` reshapes only the low coat mesh's ear vertices (selected by their Ear_* / Ear_Tip_* weights): the ear is made
thinner front to back above a third of its height, the tip is tapered to a point along the curled tip bone, and the face toward the
opening is hollowed into a cup (up to 55 % of the local thickness, deepest a third of the way up, closing at the rim, base and tip),
with the displacement smoothed over the mesh. Rig, weights and UVs are unchanged.

Applied to both masters, then every derivative was re-exported:

```
blender -b -P tools/blender/08_ears/ear_cup.py -- <pre-ears hero master> tools/blender/source/marwari_hero_source.blend
blender -b -P tools/blender/08_ears/ear_cup.py -- <pre-ears anatomy master> tools/blender/source/marwari_anatomy_source.blend
blender -b --factory-startup -P tools/blender/04_export/stage10_export.py -- tools/blender/source/marwari_hero_source.blend public/models/marwari-hero.glb 2048 1024
blender -b --factory-startup -P tools/blender/04_export/stage10_export.py -- tools/blender/source/marwari_hero_source.blend public/models/marwari-hero-mobile.glb 1024 512
blender -b --factory-startup -P tools/blender/04_export/stage10_export.py -- tools/blender/source/marwari_anatomy_source.blend public/models/marwari-anatomy.glb 2048 1024
sh tools/blender/06_exhibit/build_all.sh <work>   # anatomy-exhibit.glb (keep public/models/cadet-rider.glb: export the rider to a scratch path)
```

Check renders: `render_ears.py -- <blend> <outdir> <tag>` (front, three-quarter, side, top). Before/after:
`scratch/claude-run/ears/ears-ab4.jpg` on the owner's machine. The tips still curl inward to meet, as the breed's do.
