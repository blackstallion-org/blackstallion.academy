# World 03 (Legacy): asset sources and licences

Every third-party file used to make `public/worlds/legacy/*`. All are CC0 (public domain dedication, no attribution
required); they are listed here so the provenance is on record.

| Used for | Asset | Source URL | Licence | Shipped as |
| --- | --- | --- | --- | --- |
| Sky and image-based light | HDRI "Table Mountain 2 (Pure Sky)" `table_mountain_2_puresky`, 4K .hdr | https://polyhaven.com/a/table_mountain_2_puresky | CC0 | `sky-4k.webp`, `sky-2k.webp` (graded LDR), `env.hdr` (512×256) via `make_sky.py` |
| Plain / flats sand | Texture "Coast Sand 01" `coast_sand_01`, 2K diffuse + normal (GL) | https://polyhaven.com/a/coast_sand_01 | CC0 | `tex/sand-diff-{hi,lo}.webp`, `tex/sand-nor-{hi,lo}.webp` |
| Ridge rock face | Texture "Cliff Side" `cliff_side`, 2K diffuse + normal (GL) | https://polyhaven.com/a/cliff_side | CC0 | `tex/rock-diff-{hi,lo}.webp`, `tex/rock-nor-{hi,lo}.webp` |
| Fort masonry | Texture "Old Sandstone 02" `old_sandstone_02`, 2K diffuse + normal (GL) | https://polyhaven.com/a/old_sandstone_02 | CC0 | `tex/stone-diff-{hi,lo}.webp`, `tex/stone-nor-{hi,lo}.webp` |

Made here (no third-party content):

- `fort.glb`, `terrain-height.png/.json`: procedural, `build_fort.py` + `legacy_field.py`.
- `cavalry.glb`: the academy's own rigged Marwari (`public/models/marwari-hero-mobile-refined.glb`, built in
  `tools/blender/02_rig` … `10_refine`), decimated and untextured, plus two riders modelled in `build_cavalry.py`.
- `props.glb`: procedural boulder and shrub, `build_cavalry.py`.

Downloaded but not shipped (evaluated): `aerial_sand` (rejected: it shows vehicle tyre tracks), `dry_ground_01`,
`medieval_blocks_02`, `defense_wall`, and the HDRIs `wasteland_clouds_puresky`, `kloppenheim_06_puresky`,
`belfast_sunset_puresky`, `industrial_sunset_puresky`, `evening_road_01_puresky` (all CC0, Poly Haven).
