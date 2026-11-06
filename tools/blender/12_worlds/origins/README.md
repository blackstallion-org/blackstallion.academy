# World 01 · Origins — asset pipeline

The valley, the academy and the hill rocks for `/worlds` (World 01, `components/worlds/scenes/origins.ts`). Everything is
reproducible from the scripts here plus the CC0 downloads listed in `SOURCES.md`. Blender 5.0 runs as a Python module
(`pip install bpy==5.0.1`, Python 3.11); parameters go through environment variables (Blender's logging aborts on extra argv).

```sh
# 0. downloads (see SOURCES.md for the URLs) into $ORIGINS_DL: sky_4k.hdr, boulder_01/, grass004/, aerial_*_1k.jpg
# 1. sky: HDR -> encoded panorama + small HDR for the light
ORIGINS_DL=... OUT=public/worlds/origins python sky_encode.py      # (bpy)  -> sky-env.hdr, sky.json, raw array
python3 sky_webp.py                                               # (Pillow) -> sky-hi.webp (4096x1152), sky-lo.webp
# 2. terrain, near heightmap, river line, tree placements
OUT=public/worlds/origins python terrain.py                         # -> origins-terrain.glb, -lo.glb, origins-height.bin, origins-layout.json
# 3. academy
OUT=public/worlds/origins python academy.py                         # -> origins-academy.glb
# 4. rocks (decimated Poly Haven scan)
ORIGINS_DL=... OUT=public/worlds/origins python rocks.py            # -> origins-rocks.glb
# 5. ground textures: the 1K JPGs re-encoded to WebP (q84) and 512 px "-lo" copies (Pillow; see the one-liner in the session log)
```

## What each file is

| File | Size | What |
| --- | --- | --- |
| `sky-hi.webp` / `sky-lo.webp` | 103 / 36 KB | top 56 % of the HDR panorama, 8-bit, encoded `y = sqrt(h/(h+1))`; the sky shader decodes it back to HDR (sun ≈ 120, sky 0.5–3) |
| `sky-env.hdr` | 256 KB | 512×256 Radiance HDR (box-filtered from 4K) for the PMREM image-based light |
| `origins-terrain.glb` / `-lo.glb` | 0.69 / 0.39 MB | radial heightfield: a disc to 1.5 km (geometric rings, 270 segments) and a 540-segment annulus to 14 km for the mountains (188k / 98k triangles); `COLOR_0` = rock, sand/track, lush masks and, in alpha, the sun visibility baked by marching the heightfield toward the key light (long golden-hour shadows across the valley) |
| `origins-height.bin` | 132 KB | 257×257 uint16 heights in cm, 1 m grid centred on the hilltop (grass, rocks, horse contacts) |
| `origins-layout.json` | 299 KB | river centre line with widths, academy site, ~8.7k tree placements `[x, y, z, scale, kind, sunVisibility]` |
| `origins-academy.glb` | 143 KB | the academy: two stepped glass tiers under deep white eaves, glazed drum, bronze fins and halo ring, four stables, arena and track fences; no signage, no flags |
| `origins-rocks.glb` | 0.69 MB | `boulder_01` scan as `Rock_Boulder` (66k → 3.3k triangles) and `Rock_Boulder_Lo` (700), one 1K WebP material; drawn as two instanced meshes |
| `ground-*.webp` | 1.9 MB (hi), 0.44 MB (lo) | grass (near), meadow (far), rock — tiled in world space by the terrain shader |

Layout (three.js metres, before the world's 0.309 rad yaw under the fixed sky): hilltop (the horse's mark) at the origin,
70 m above the valley floor; the valley opens toward +z; the river passes ~300 m in front of the hill; the academy sits at
(-430, 1.1, 640); valley walls from ~0.7–2 km, the far range 6–10 km out, up to ~1.4 km high.

The sun in the panorama is at azimuth 0.703 rad from +x toward +z, 4.6° above the horizon; the key light uses the same
azimuth at ~11.5° so the valley stays readable. Horizon colours measured from the HDR (`horizon_probe` in the session) set
the aerial-perspective colours in `scenes/origins/aerial.ts`.

Download per tier (Origins only; the horse GLB is loaded once by the engine for every world): high ≈ 4.2 MB, low ≈ 2.4 MB.
