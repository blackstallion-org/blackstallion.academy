# 12 · Four Worlds (`/worlds`) asset pipeline

The `/worlds` page (`components/worlds/`) is one scroll-controlled film through four worlds. Every asset it loads is in
`public/worlds/<world>/` and is rebuilt by the scripts here. Each world folder has its own `README.md` (how to rebuild,
in order) and `SOURCES.md` (every third-party file, its URL and licence).

| World | Scripts | Built here in Blender | Third-party (licence) |
| --- | --- | --- | --- |
| 01 Origins | `origins/` | valley terrain (near + far LOD, baked golden-hour shading), academy, rock scatter | Poly Haven sky HDRI, ground textures, boulder scan; ambientCG grass (all CC0) |
| 02 Life | (no Blender assets) | — | none: cells, tissue, pathways and particles are shaders in `components/worlds/scenes/life/`; the horse of light is `public/models/anatomy-exhibit.glb` (the academy's own model) |
| 03 Legacy | `legacy/` | hill fort, ridge and desert height field, cavalry horse (decimated academy Marwari) and riders, props | Poly Haven sky HDRI and sand/rock/sandstone textures (CC0) |
| 04 Beyond | `beyond/` | star field (Cycles), observation platform, terrace, towers, orbital arcs; procedural galaxy | Solar System Scope Earth and Moon textures (**CC BY 4.0**, credited on `/worlds`) |

Shared: `public/worlds/shared/coat-black.webp` is the plain black coat colour map baked into `public/models/marwari-hero.glb`;
the worlds load the refined horse (`marwari-hero-refined.glb`: crescent ears, full tail, same rig and UVs) and swap this map in
so the hero reads as the solid black Marwari of the art direction.

## Running Blender

The scripts were run with Blender 5.0.1 as a Python module (`pip install bpy==5.0.1`, Python 3.11) in a Linux container:

```sh
uv venv -p 3.11 ~/bpyenv && uv pip install -p ~/bpyenv/bin/python bpy==5.0.1 numpy
cd /tmp && ~/bpyenv/bin/python /path/to/repo/tools/blender/12_worlds/origins/terrain.py
```

Two gotchas: parameters go in environment variables (the module's logging library aborts on unknown command-line
arguments), and never run a script from a folder that holds a file named like a standard-library module (`inspect.py`
broke `import bpy`). Desktop Blender 5.x runs the same scripts from its Scripting tab or `blender -b -P script.py`.

## Checking

`tools/qa-worlds/capture.mjs` opens `/worlds` in headless Chromium at chosen progress values and saves frames plus draw-call
and triangle counts (`NODE_PATH="$(npm root -g)" node tools/qa-worlds/capture.mjs --p 0,0.155,0.37,0.64,0.9,1`).
