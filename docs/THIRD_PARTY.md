# Third-party code, techniques and assets

Written 25 Oct 2026. It covers the three Codrops-style repositories the owner supplied and the textures added with them.
Everything else in `package.json` is covered by its own licence file in `node_modules`.

## What was supplied, and what was taken from it

| Source | Licence found | What the site uses | What the site does not use |
| --- | --- | --- | --- |
| `codrops-relightning-images` ("Relighting Images with Three.js", Dominik Fojcik, Codrops) | MIT, as stated in its README (the `LICENSE` file it links to was not in the zip) | The relighting **technique and code**, ported to TypeScript: depth smoothing (`smoothBands`), normals from depth gradients plus luminance detail, the 12-step ray-marched self-shadow, the pointer-driven point light and the cover-fit UVs. Files: `components/3d/relight/*`. | The repo's photographs and its depth maps. |
| `predator-material` | **No licence file** | The **technique only**: a stylised "cloak" in which the surface dissolves to glass, written fresh as TSL node graphs for the site's own Marwari model. Files: `components/3d/cloak/*`. | Its model, textures, HDRI, audio, glyphs, name and copy. No source file was copied. |
| `Arvista` | **No licence file** | The **engine idea only**: a sticky stage in a tall scroll track, a scrubbed GSAP timeline writing into a store, a camera rig following waypoints, quality tiers, procedural textures, and a canvas that mounts only near the viewport. Re-written for the Marwari story. Files: `components/3d/museum/*`, `lib/museum/*`, `components/sections/legend/museum/*`. | Its paintings, artists, name, copy, audio, models and textures. |

Two of the three repositories carry no licence, which under default copyright means all rights are reserved. The site
therefore ships no asset, text or file from them. If the owner obtains written permission from their authors, this note
should be updated; until then the Predator and Arvista folders must not be added to the repository.

## Credits to keep

- Relighting: *Relighting Images with Three.js*, Dominik Fojcik, Codrops, MIT licence. The MIT licence asks for the
  copyright notice to accompany substantial portions of the code. The header comments in `components/3d/relight/` name
  the author and source; because the zip did not include the `LICENSE` file, the full notice text should be copied from
  the upstream repository onto the site's open-source notices page. The upstream README also credits Three.js (MIT)
  and the Depth Anything 3 model and Depth Generation Tool for the original depth maps; none of those are used here.
- Textures in `public/textures/museum/` (limestone, ivory marble, nero marble, walnut): ambientCG, CC0 1.0 (public
  domain). Credit is not required and is given anyway.

## Generated assets, with caveats

- `public/images/relight/*-depth.webp`: **neural depth maps** (since 26 Oct 2026), made by `scripts/make-depth.py`
  with **Depth Anything V2 Small** (Yang et al., NeurIPS 2024), Apache-2.0. Only the Small checkpoint is Apache-2.0;
  Base, Large and Giant are CC-BY-NC-4.0 and must not be used on this commercial site. The model file is the int8 ONNX
  export `onnx/model_quantized.onnx` from huggingface.co/onnx-community/depth-anything-v2-small (27,258,801 bytes,
  SHA-256 `fcf51f1b230362b28690bb9d1809bf0431f29cad20534e3f589bd7285547f20d`, checked against the Hugging Face file
  record). It was obtained from the npm package `@richardmcquiston01/ai-tools@0.5.1`, which redistributes that exact
  file unmodified with its Apache licence, because the build sandbox cannot reach Hugging Face. The model is a build
  tool only: it is not committed and not shipped to visitors. The earlier classical bas-relief maps
  (`scripts/make-relief-depth.py`) are superseded.
- `public/images/anatomy/marble-stallion.webp`: Higgsfield placeholder art (GPT Image 2.5), a rendered marble study,
  labelled on the page as an illustration and not a real sculpture.
- `public/images/legend/museum/*-small.webp`: down-scaled copies of the site's own Higgsfield placeholder art, used as
  the low-quality texture tier in the museum. They remain placeholders and are labelled "Illustration" on the plates.

## Libraries added

None. The work uses packages already in `package.json`: `three` (`three/webgpu`, `three/tsl`), `@react-three/fiber`,
`gsap` (ScrollTrigger), `lenis`.

## India sculpture data (28 Oct 2026)

Baked by `scripts/build-india-map.py` into `public/data/india-sculpture/` (see `docs/INDIA_MAP.md`). Nothing is fetched by visitors.

- **Natural Earth** (naturalearthdata.com), 1:10m `admin_0_countries_ind` (India point of view) and `rivers_lake_centerlines`: public domain. No
  credit is required and one is given on the page.
- **Terrain Tiles** (Terrarium encoding, zoom 7) on AWS Open Data, composited by Mapzen from SRTM and other public elevation sources.
  Attribution is required: the sources are listed at github.com/tilezen/joerd/blob/master/docs/attribution.md and should be copied onto the
  site's open-source notices page. The page carries a short credit now.
- `public/images/schools/india-sculpture-poster.webp` is a render of that model by the site's own engine, not a photograph or a licensed map image.

