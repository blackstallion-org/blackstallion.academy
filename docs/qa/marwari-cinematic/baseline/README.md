# Baseline captures (before any change)

Taken 25-26 Oct 2026 on an Apple M2 (8 GB, display 2560x1664) with Chrome for Testing 156 in new headless mode, which reached the GPU
(`ANGLE (Apple, ANGLE Metal Renderer: Apple M2)`, checked in every run). Harness: `tools/qa-marwari/`. The code under test was
`feature/marwari-film-world` at `223ce67` (plus uncommitted edits to `footlock.ts` / `locomotion.ts` made by another session during the
audit; they do not change a standing horse). Assets were served pinned (`page.route`), not read live from `public/models`:

| Folder | Assets served | Notes |
| --- | --- | --- |
| `desktop/` (1440x900, devicePixelRatio 1) | commit `0f72b17` (hero.glb `36ccb15b…`) | standing horse, hero studio at 12:00 and the three film places; cameras in `tools/qa-marwari/shots.mjs` |
| `desktop_2x/` (1440x900 @2x, engine renders at 1.5x) | commit `0f72b17` | close-ups: eye, muzzle, ears, mane and neck, shoulder, barrel, hindquarter, hoof, tail |
| `mobile_plate_fallback/` (390x844 @2x/3x touch) | `0f72b17` | hero, desert, village, academy on the phone profile, reduced-motion still, no-WebGL poster |
| `plate_v2/` | `223ce67` (hero.glb `891ea143…`) | anatomy plate, desktop and mobile, overview and the five hotspots (5.5 s settle after each selection) |
| `time_of_day/` | `223ce67` | hero stage at 00, 03, 06, 09, 12, 15, 18, 21 h (the studio light follows the visitor's clock) |
| `sheets/` | | labelled contact sheets of the above, plus the four coat textures and the eye test |

`0f72b17` and `223ce67` differ only in the trot and canter clip data (`hero.glb`, `hero-mobile.glb`, `anatomy.glb`, `gaits.json`); mesh, textures,
rig and materials are byte-identical, so a standing horse looks the same in both. Hashes: `../evidence/pinned_asset_hashes.txt`.

The film's chapter text and buttons are part of the page and appear in the frames; the Next.js dev badge is hidden by the harness.
