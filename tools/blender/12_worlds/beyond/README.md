# World 04 — Beyond (the future world)

Runtime: `components/worlds/scenes/beyond.ts` (+ `beyond/planet.ts`, `beyond/station.ts`). Assets: `public/worlds/beyond`.
Sources and licences: `SOURCES.md`.

## Rebuild

Blender is the pip `bpy` module (5.0.1, Python 3.11) at `~/bpyenv/bin/python`. Parameters go through environment variables
(the `bpy` module's logger aborts on unknown command-line arguments); run from a neutral directory.

```sh
# 1. star field panorama (Cycles, ~6 min on one CPU thread at 4096x2048, 16 samples)
OUT=/root/dl/beyond/stars_4k.png W=4096 SAMPLES=16 ~/bpyenv/bin/python tools/blender/12_worlds/beyond/render_starfield.py
# 2. platform + terrace + truss arcs -> beyond-platform.glb, beyond-arcs.glb (Draco)
BUILD=platform,arcs ~/bpyenv/bin/python tools/blender/12_worlds/beyond/build_station.py
# 3. galaxy sprite
python3 tools/blender/12_worlds/beyond/make_galaxy.py
# 4. planet, moon and star textures (needs the SOURCES.md downloads in $SRC)
SRC=/root/dl/beyond python3 tools/blender/12_worlds/beyond/prepare_textures.py
```

QA captures for software GL (pauses the engine before each screenshot so SwiftShader does not time out):

```sh
NODE_PATH=$(npm root -g) node tools/blender/12_worlds/beyond/capture_beyond.mjs --p 0.75,0.79,0.83,0.87,0.9,0.95,1 --w 1440 --h 900
```

## The world

- **Scale.** Metres at the station. The planet (radius 1500) is 11.5 km away along `PLANET_DIR`, so it has true parallax as the
  camera flies; its rings (five bands, 1.5–2.25 R) lie in a tilted plane.
- **Planet** (`planet.ts`). Day map, night lights (on the dark side only, dimmed under cloud), drifting clouds with close-range
  billows (the opening shot skims the cloud tops), ocean glint, a narrow warm terminator, and an analytic atmosphere: a 6-step
  march through an exponential shell, used both by the surface shader (air over the ground) and by a back-face shell drawn
  first in the opaque list (limb glow from outside, daylight sky from inside).
- **Station** (`station.ts`). Blender placeholder materials are swapped by name: `Floor` (dark polished, clearcoat), `Seam`,
  `Trim` (brushed brass), `Hull` (gunmetal), `Glass`, `Light` (gold emissive; pulses travel along each strip's UV.x).
  The platform is turned by `PLATFORM_YAW` so the terrace skyline sits right of the hero frame, clear of the planet.
- **Floor reflection** (high tier): a `Reflector` that only sees `REFLECT_LAYER` (horse, planet, rings, arcs, moons, galaxy),
  without the star field, blurred and faded toward the rim, added over the floor.
- **Light.** The planet is lit by `SUN`; the station's key is the same sun lifted (`KEY`) so its glint stays out of the frames;
  a cool planet fill comes from high on the planet side (a low fill put a white glint on the floor); three warm platform lights.
- **Camera** (local p): 0 cloud tops (horizon levelled with `levelRoll`, because up is the surface normal there) → 0.2 above the
  atmosphere → 0.3 the whole planet → 0.39 planet, rings and the tiny station → 0.47–0.54 in through the arcs → 0.6–0.8 an
  orbit of the platform (0.649 = the global 0.9 hold: planet, rings, horse) → 0.88 the horse → 1.0 the brand frame (planet top
  centre, horse right, calm lower centre). Portrait screens turn and dolly toward the horse on the platform shots.
