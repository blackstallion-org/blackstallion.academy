# World 01 · Origins — third-party sources

Every third-party file used to build `public/worlds/origins/`. All are CC0 (public domain dedication): no attribution is
required, but it is recorded here.

| Asset | Used for | Source | Licence |
| --- | --- | --- | --- |
| `kloppenheim_06_puresky` HDRI (4K .hdr) | the visible sky (`sky-hi.webp`, `sky-lo.webp`) and the image-based light (`sky-env.hdr`) | https://polyhaven.com/a/kloppenheim_06_puresky (file: https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/4k/kloppenheim_06_puresky_4k.hdr) | CC0 |
| `Grass004` (1K JPG: Color, NormalGL) | close ground texture under the grass (`ground-grass-*.webp`) | https://ambientcg.com/view?id=Grass004 | CC0 |
| `aerial_grass_rock` (1K: diff, nor_gl) | mid and far valley ground (`ground-meadow-*.webp`) | https://polyhaven.com/a/aerial_grass_rock | CC0 |
| `aerial_rocks_02` (1K: diff, nor_gl) | rock on steep slopes and the mountains (`ground-rock-*.webp`) | https://polyhaven.com/a/aerial_rocks_02 | CC0 |
| `boulder_01` (1K glTF: mesh, diff, nor_gl, arm) | the hill's boulders and outcrops (`origins-rocks.glb`, decimated 66k → 3.3k triangles) | https://polyhaven.com/a/boulder_01 | CC0 |

Not third-party (made here): the terrain, river line, tree and rock placements (`terrain.py`), the academy model
(`academy.py`), the grass, tree impostors, river and sky shaders (`components/worlds/scenes/origins/`). The horse is the
site's own rigged Marwari (`public/models/marwari-hero-refined.glb`).

Downloads were made with the Poly Haven API (`https://api.polyhaven.com/files/<id>`) and ambientCG
(`https://ambientcg.com/get?file=Grass004_1K-JPG.zip`) on 6 Nov 2026; the raw downloads are not committed.
