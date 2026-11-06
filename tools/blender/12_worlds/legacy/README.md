# World 03 — Legacy (the memory world): asset pipeline

Runtime module: `components/worlds/scenes/legacy.ts` (+ `scenes/legacy/{terrain,skyfog,water,cavalry}.ts`).
Runtime assets: `public/worlds/legacy/`. Sources and licences: `SOURCES.md`.

Blender here is Blender 5.0.1 used as a Python module (`~/bpyenv/bin/python`, `import bpy`). Run every script from a
neutral working directory (`cd /`), pass options through environment variables (extra argv crashes Blender's glog), and
never name a script after a standard-library module.

| Step | Command | Writes |
| --- | --- | --- |
| 1. Height field + fort | `cd / && LEGACY_OUT=/root/bsah/public/worlds/legacy ~/bpyenv/bin/python …/legacy/build_fort.py` | `terrain-height.png/.json`, `fort.glb`, `legacy_fort.blend` (local, not shipped) |
| 2. Cavalry + props | `cd / && LEGACY_OUT=… ~/bpyenv/bin/python …/legacy/build_cavalry.py` | `cavalry.glb`, `props.glb` |
| 3. Sky | `python3 …/legacy/make_sky.py /path/to/table_mountain_2_puresky_4k.hdr` (numpy, OpenCV, Pillow) | `sky-4k.webp`, `sky-2k.webp`, `env.hdr`, `sky.json` |
| 4. Textures | Poly Haven 2K JPGs resized to WebP (2K/1K hi, 1K/512 lo; see SOURCES.md) | `tex/*.webp` |

## What is modelled

- **Terrain** (`legacy_field.py`): rolling sand with low dune lines, level wet flats round the horse (origin) and along the
  cavalry track (z = −105), a rocky ridge 110–120 m high with a steep face and gullies along z ≈ 760, a level crest for the
  fort, and a ring of distant hills from ~1.3 km. Shipped as a 512² 16-bit height map (R high byte, G low byte, B rock mask);
  the mesh is built in the browser on a non-uniform grid (dense where the camera flies).
- **Fort** (`build_fort.py`): generic Rajasthan hill-fort architecture, not a replica of any fort: battered curtain walls
  following the crest (buried 12 m so they sit on any slope), round bastions every ~56 m with merlon crowns and loopholes, a
  gate between two bastions, a stepped palace at the west end with storeys of arched windows, jharokha balconies with
  bangaldar-style roofs and chhatri pavilions, inner houses. World-space box UVs (4 m tile) for the sandstone texture and a
  vertex-colour grime/occlusion pass. ~28k triangles, Draco.
- **Cavalry** (`build_cavalry.py`): the academy's Marwari rig, coat decimated to ~6k triangles (mane/tail joined in, no
  textures; the coat colour is set per horse at runtime) with clips Gallop_R, Canter_R, Trot only. Two riders skinned 100 %
  to `Spine_Lumbar`: turban (safa), angarkha flaring over the saddle, cummerbund, trousers, boots, a dhal shield with brass
  bosses on the back, a talwar scabbard, and a bhala lance held upright. **No flags, banners or standards.**

## Historical note

The scene shows the cavalry country of Marwar (western Rajasthan) in general: a hill fort of the regional type, riders on
Marwari horses in period dress with lance, shield and sword. It does not depict a particular fort, ruler, battle or date, and
the page copy makes no claim about one.
