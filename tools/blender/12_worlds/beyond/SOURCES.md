# World 04 Beyond — asset sources and licences

| Runtime file (public/worlds/beyond) | Source | Licence | Made by |
| --- | --- | --- | --- |
| earth-day-hi/lo.webp | Solar System Scope, "8K Earth Day Map", https://www.solarsystemscope.com/textures/download/8k_earth_daymap.jpg (based on NASA Blue Marble imagery) | CC BY 4.0 — attribution: "Planet textures: Solar System Scope (solarsystemscope.com), CC BY 4.0, based on NASA imagery" | resized, `prepare_textures.py` |
| earth-data-hi/lo.webp (R) | Solar System Scope, "8K Earth Night Map", https://www.solarsystemscope.com/textures/download/8k_earth_nightmap.jpg (NASA Black Marble based) | CC BY 4.0 (as above) | luminance packed into R |
| earth-data-hi/lo.webp (G) | Solar System Scope, "8K Earth Clouds", https://www.solarsystemscope.com/textures/download/8k_earth_clouds.jpg | CC BY 4.0 (as above) | packed into G |
| earth-data-hi/lo.webp (B) | Solar System Scope, "8K Earth Specular Map", https://www.solarsystemscope.com/textures/download/8k_earth_specular_map.tif | CC BY 4.0 (as above) | ocean mask packed into B |
| moon.webp | Solar System Scope, "2K Moon", https://www.solarsystemscope.com/textures/download/2k_moon.jpg | CC BY 4.0 (as above) | resized |
| stars-hi/lo.webp | original: rendered in Blender 5.0.1 Cycles by `render_starfield.py` (procedural Voronoi stars, noise nebula) | owned by BSAH (no third-party content) | Blender |
| galaxy.webp | original: procedural, `make_galaxy.py` (numpy) | owned by BSAH | script |
| beyond-platform.glb | original: modelled procedurally in Blender by `build_station.py` | owned by BSAH | Blender |
| beyond-arcs.glb | original: modelled procedurally in Blender by `build_station.py` | owned by BSAH | Blender |

The CC BY 4.0 attribution must appear somewhere public (a credits line on /worlds or the site credits page). It is not
on the page yet: the overlay and page files are outside this world's lane.

Downloads were kept outside the repo (`/root/dl/beyond` in the build container); re-download from the URLs above to rebuild.
