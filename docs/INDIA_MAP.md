# The India sculpture on /schools (28 Oct 2026)

A lit relief model of India that you can turn, zoom and fly around. It is **the first screen of `/schools`** (the owner chose it over the older
Earth-to-India relief map, `India3DMap`: that component and its textures are still in the repository but no page uses them now). It is built from open
datasets, baked once, and drawn with three.js. The component fills whatever it is given, so it can also be placed in a section.

## What it shows, and what it does not

- **India raised in sandstone** on one slab with its neighbours, cast in the same relief in a muted ocean-grey, so the Himalaya runs on
  unbroken and India is the only warm thing in the picture. A dark, calm sea around it with a faint coastal glow. Rivers as thin turquoise
  ribbons on the surface; a restrained packet of light travels along the main ones.
- **Eight markers**: the six target circuits of the Pan-India network (the same corridors `PanIndiaNetwork` lists) and two heritage places
  the site already writes about (Marwar, where the Marwari comes from; Jaipur, the 61st Cavalry's station and a faculty-plan source).
  Each card says in one line what the marker is not. **No campus is shown, because none is contracted.** Marker positions live in
  `lib/content/india-map-places.json`; the copy in `lib/content/india-map.ts` is built from `network` in `lib/content/schools.ts`.
- **Cartography.** One national outline from one source: Natural Earth 1:10m admin-0 countries, *India point of view*, which draws the
  Union territories of Jammu & Kashmir and Ladakh as India's own maps do. The neighbours come from the same file so their borders agree
  with it. The page says this, and says it is illustrative and not an authority on boundaries. State borders are not drawn (Natural Earth's
  admin-1 layer follows a different convention in the north and would put two conventions on one map).
- **Not shown:** Mahanadi (it is not in the river dataset), the Lakshadweep islands (smaller than a pixel at this scale), any bathymetry.

## Where things are

| Piece | File |
| --- | --- |
| Data build (downloads, projects, triangulates, bakes) | `scripts/build-india-map.py` |
| Baked data, served as static files | `public/data/india-sculpture/` (`terrain-hi.bin.gz`, `terrain-lo.bin.gz`, `lines.bin.gz`, `coast.png`, `meta.json`) |
| Posters (first paint, and what a device without WebGL sees; renders of the model: one wide, one tall) | `public/images/schools/india-sculpture-poster.webp`, `india-sculpture-poster-narrow.webp` |
| Markers and copy | `lib/content/india-map.ts`, `lib/content/india-map-places.json` |
| Binary reader | `components/sections/schools/india-map/data.ts` |
| Engine: scene, lights, loop, adaptive pixel ratio | `.../india-map/engine.ts` |
| Materials and shaders: terrain, sea, rivers | `.../india-map/materials.ts` |
| Camera rig: limits, clearance, focus poses | `.../india-map/rig.ts` |
| CPU height field (marker heights, camera floor) | `.../india-map/heightfield.ts` |
| The stage: loading, controls, markers, card, line, chips, fallbacks | `.../india-map/IndiaSculpture.tsx` |
| The hero that holds it (headline, links and the sources line below the stage) | `SchoolsTitle` in `components/sections/schools/SchoolScenes.tsx` |
| Tests | `tests/india-map.test.mjs` |

## Data sources

| What | Source | Licence |
| --- | --- | --- |
| Outline and neighbours | Natural Earth 1:10m `admin_0_countries_ind` (India point of view) | Public domain |
| Rivers | Natural Earth 1:10m `rivers_lake_centerlines` | Public domain |
| Terrain | Terrain Tiles on AWS Open Data (Terrarium encoding, zoom 7, 225 tiles): SRTM and other public elevation sources composited by Mapzen | Open data, attribution required (see `docs/THIRD_PARTY.md`) |

Projection: the Survey of India national Lambert conformal conic (EPSG:7755 parameters: standard parallels 12.472955° and 35.172805°,
origin 24° N 80° E). Everything (outline, terrain, rivers, markers) goes through the same transform in the build. 1 world unit is 250 km.

## How the data is made (all measured on this run)

1. Project the outline; keep the mainland and the larger Andaman and Nicobar islands (islands under 40 km² are dropped, and so are the smallest
   islets of those chains); close inlets narrower than 6.4 km and cut spits narrower than 3.2 km, detail a pixel could not show and the chamfer along the
   coast could not follow; plate = India's box plus 300 km, 3,472 × 3,872 km.
2. Resample the elevation onto a 2 km grid (1,736 × 1,936). India's relief is kept at full detail; the neighbours' relief is smoothed more
   the further it is from India's border (from 70 km, fully by 310 km), so the plateau beyond the Himalaya does not compete with India.
3. **Triangulate by error-driven point insertion** (the mesh simplification): start from the outline and a coarse grid, then repeatedly add a
   vertex wherever the mesh is furthest from the grid, so the Himalaya is dense and the plains and the plateau are sparse. Interior points are
   kept off the outline so its edges survive the triangulation. Flat triangles along straight stretches of the outline are dropped.
4. Bake per vertex: smooth normals from the fine grid (so the lighting is finer than the triangles), horizon ambient occlusion (8 directions,
   out to 70 km, with the exaggeration applied), and the signed distance to India's land border (a hairline of ivory is drawn where it crosses
   zero; its sign comes from whichever country owns the nearest land, extended over the sea, so a vertex on the coast and the wall under it always take
   their own country's tint). Coastal walls with a chamfer, down to the floor of the block, their outward direction smoothed along the loop so a jagged
   coast cannot fold the chamfer over itself.
5. Drape the rivers on the exact surface of the final mesh (barycentric height in the same triangulation, 3.5 km spacing), and write
   the markers' projected positions, each checked to lie inside India's outline.
6. Pack: positions quantised to 16 bits over the plate (53 m), normals 8-bit, AO 8-bit, border distance 16-bit, indices delta-coded, then gzip.

| | High (desktop) | Low (phones, tablets, ≤4 cores or ≤4 GB) |
| --- | --- | --- |
| Vertices / triangles (with walls) | 104,652 / 182,678 | 37,021 / 62,294 |
| File, gzip | 1.30 MB | 0.45 MB |
| Vertical error against the 2 km grid, India (median / 95% / 99% / max) | 10 / 53 / 74 / 351 m | 21 / 130 / 190 / 928 m |
| Owners of the coast change along the walls (earlier rule: 498 / 304) | 26 | 18 |
| Shadow map | 2048², soft | 1024² |
| Pixel ratio cap | 2 | 1.5 |

Also shipped: `lines.bin.gz` 113 kB (49 river lines, 7,562 points), `coast.png` 6.5 kB, `meta.json` 8 kB, and two posters of 54 kB (wide) and 38 kB (tall). There are no textures to compress:
colour comes from the brief's palette by height, slope, occlusion and a procedural grain that fades out wherever it would be smaller than a pixel.
The terrain is real data at 12× vertical exaggeration; no noise is added to it.

To rebuild after changing the places or the sources:

```bash
python3 -m venv .venv && .venv/bin/pip install numpy scipy pillow shapely pyproj
.venv/bin/python scripts/build-india-map.py --cache ~/.cache/bsah-india-map   # about 40 s after the first run (it downloads about 60 MB)
node --test tests/india-map.test.mjs
```

## How it behaves

- **Camera.** It orbits a target on the surface, looking roughly north. Turn is limited to ±41° of north, tilt keeps the map below the horizon
  (11°–58° from straight down), zoom has a floor (3.4 units) and a ceiling (the whole country), the target stays within India's box plus a
  margin, and the camera is lifted until it clears the terrain under it. A narrow frame looks more nearly straight down so the country fills it.
- **Input.** Drag turns; Shift-drag, right-drag or two fingers move; Ctrl or ⌘ + wheel (a trackpad pinch arrives as Ctrl + wheel), pinch and the
  + / − buttons zoom. **A plain wheel always scrolls the page**: the map fills the first screen and must never trap it. On touch, one finger turns
  sideways only; vertical movement scrolls the page. Arrow keys, + / −, Esc and Home work from the keyboard.
- **Choosing a place.** The camera travels there with GSAP (1.7 s, `power3.inOut`; any input stops it), the picture slides left to leave room, the
  marker grows, the others fade, and a line of light is drawn from the marker to the card; focus moves into the card, and Esc closes it and returns
  focus to the map. On a phone the card is a sheet over the lower part of the stage and the places are also a row of chips above the controls (the
  anchors are small targets). Labels pick a free side and are hidden, never laid over each other; markers under the card, the controls or the site's
  fixed navigation are hidden, and the picture keeps clear of the navigation (96 px on desktop, 76 px on phones) and of the controls.
- **Cost.** It draws only when something changes, and about 24 frames a second when only the river light is running. The pixel ratio steps down
  if frames take longer than 27 ms and back up when there is room. The loop stops when the stage is off screen. The first paint is the poster (a
  plain `picture` element, so only the shape that fits is fetched, with high priority); three.js, the engine and the terrain load straight after.
- **Fallbacks.** No WebGL, a lost context, or data that fails to load: the poster stays and the places are listed as cards along the bottom of the stage.
  Reduced motion: the camera moves to a place in one step and the river light is off; the map stays interactive.

## What was checked, and the numbers (Apple-silicon Mac, headless Chrome with Metal, dev server)

| Check | Result |
| --- | --- |
| `node --test tests/india-map.test.mjs` | 11 pass: the data decodes; every index in range; no degenerate triangles; every terrain triangle faces up; budgets (hi ≤ 230k triangles and 1.8 MB, lo ≤ 90k and 0.7 MB); the six rivers the brief names are present; **every marker equals an independent ellipsoidal Lambert conformal conic within 0.5 × 10⁻³ unit (125 m)**; marker elevations plausible (Mumbai 7 m, Hyderabad 498 m, Dehradun 649 m, Bengaluru 910 m…); the coast walls keep their own country's tint; both posters exist and are light |
| Engine start | constructed about 0.6 to 1.1 s after the page loads, with a warm dev server (it has loaded 1.30 MB, built the mesh and the height field); the first frame follows on the next animation frame |
| Frame pacing in a camera move (hero, 1440 × 900, pixel ratio 1) | 150 frames: median 16.7 ms, 95th percentile 17.6 ms (locked to the display's 60 Hz); CPU time to submit a frame 0.3 ms |
| Draw calls / triangles per frame | 8 / 380k on desktop (the shadow pass doubles the mesh); 8 / 140k on the phone profile (390 × 844) |
| Camera limits (measured on the hero) | six hard drags each way end exactly at the limits (±0.72 rad, 0.2–1.02 rad); zoom floor 3.4, ceiling 29.4 (the whole country fits at 26.2) |
| Wheel | a plain wheel over the map scrolled the page by 399 px and left the zoom unchanged; Ctrl + wheel zoomed to the floor |
| Camera over terrain | worst case over 12 poses at minimum zoom: 1.85 units above the terrain under it (≥ 0.5 required) |
| Navigation clearance | at rest at the top of the page no marker is within 96 px of the viewport's top (the nearest is 285 px down); zoomed on the far north, none is visible inside the navigation's band |
| Keyboard | Enter on the Mumbai marker flew there and moved focus into its card; Esc closed it, returned the camera and put focus back on the map; ArrowLeft, + and Esc work on the map itself |
| Phone (390 × 844) | 8 chips; tapping one opens the sheet with focus in it and hides the controls; Esc closes it |
| Reduced motion | the pose reaches its target in one step; river light level 0 |
| No WebGL (`--disable-3d-apis`) | no canvas; the poster and 8 cards listed along the bottom; no error from this component |
| Pages | `/schools`, `/anatomy`, `/curriculum` and `/parents` at 1440 and 390: no console error from these components, no HTTP error, no horizontal overflow |
| Screenshots | `docs/qa/india-sculpture/` at 1440 and 390 px: the hero, three angles (turned east, low from the west, top-down), two close-ups (Himalaya; the peninsula and the Godavari delta coast), a circuit card, a heritage card, the hand-off to the page below, the phone hero, sheet and hand-off, and the no-WebGL fallback on both |

**Reference.** The brief asks to compare with an attached reference screenshot; the four images attached to that message were the anatomy plate,
an older mobile horse view, a studio horse render and the lantern screenshot. No picture of the map was supplied, so the comparison below is
against the brief's own reference analysis, not against a screenshot:

| Brief | In the render |
| --- | --- |
| Three-dimensional subcontinent, raised landmass, bevelled edge | yes: one slab, India standing 0.1 unit above the sea, chamfered coast |
| Sculpted Himalaya | yes: real SRTM relief at 12×, lit from the west with cast shadows |
| Dark blue surrounding ocean | yes: `#102D35`, flat, with a faint glow near coasts |
| Thin turquoise rivers | yes: `#66BDD0` ribbons on the surface, never under 1.7 px wide |
| Muted sandstone and ivory | yes: `#D8CEAB` → `#E7D9B6` → `#F0E7D1` by height, `#A99E87` on steep slopes and in valleys |
| Floating labels, circular illuminated markers | yes: HTML pills with a hairline to a glowing ring |
| Editorial information panels | yes: the card, with the line of light |
| Cinematic overhead/isometric camera | yes: 28° lens, 42° tilt (more nearly overhead on narrow frames) |
| Minimal black navigation bar | the site's own solid navigation above the stage; the map adds none and keeps clear of it |

## Limits to know about

- **Production build:** `npm run build` (Next 16.4.2, Turbopack) passes with the hero in place and prerenders `/schools` as static. **Not measured:**
  the size of the production JavaScript for the page, and any real phone or integrated-GPU frame rate. The low profile is exercised by a
  phone-sized headless browser on a fast GPU, which proves it works, not that it is fast on a three-year-old handset.
- The elevation grid is 2 km, so features smaller than that (a ridge crest, a gorge) are smoothed; the 99th percentile mesh error is 74 m, but
  the grid itself is an average of SRTM-derived tiles. This is a model for orientation and atmosphere, not for measuring anything.
- The relief is exaggerated 12 times, and the plate is 3,472 × 3,872 km: distances on screen are not to scale vertically.
- **One statement on the cards is not already on the site:** that the 61st Cavalry is stationed at Jaipur. It is public record, but the owner should confirm the wording before launch. Everything else on the cards comes from `network`, `anatomy.ts` and `command.ts`.
- The terrain tiles' attribution must appear on the site's open-source notices page (see `docs/THIRD_PARTY.md`); the hero's text block carries a short credit.
- `India3DMap` and `public/images/schools/india-relief-*.webp` are no longer used by any page. They were left in place (they belong to earlier work); delete them when convenient.
