# The Lineage — BSAH intro film (Remotion)

A 60-second, 1920×1080, 30 fps film built only from the website's own approved artwork and copy. Plan and storyboard:
`docs/plans/intro-film.md`. This folder has its own `package.json`, so the website's dependencies are untouched.

## Commands (run inside `video/`)
```bash
npm install
npm run studio          # live preview in the browser
npm run stills          # storyboard stills → out/stills/
npm run draft           # 720p review draft → out/bsah-lineage-draft-720p.mp4
npm run render          # final 1080p MP4 → out/bsah-lineage-1080p.mp4
```
On a Mac, drop the `--browser-executable …` flag from the `render` script (it points at this cloud machine's Chrome);
Remotion downloads its own browser. The same applies to `scripts/stills.mjs`.

## What is in each scene
| Time | Scene | Artwork (all in `public/`) | Title (site copy) |
| --- | --- | --- | --- |
| 0:00 | Crest inks into parchment | `brand/bsah-stamp-mark.webp`, `history/shared/sh01` | "An 800-year lineage" |
| 0:04 | The Thar, the Marwari | India `in01` b/s/f | Marwar, Rajasthan · THE HORSE, *the crown & the empire.* (/history/marwar) |
| 0:11 | Shalihotra to the Mughal stables | `in08-b`, `in02-s`, `in08-s`, `in02-f` | EIGHT CENTURIES. *One lineage.* (/history/india) |
| 0:16 | Haldighati, 1576 | Pratap bands: sunset, el-birds, haldighati, battle-army, dust, charge, band-fg | Haldighati, June 1576 · A BOND *through the storm.* (/story/pratap-chetak) |
| 0:24 | Jhansi at night | `jh06` b/s/f + embers | Jhansi to Kalpi, April 1858 · JHANSI WILL NOT *be surrendered.* (/story/rani-lakshmibai) |
| 0:30 | Alexander and Bucephalus | `al02` b/s/f, sun bloom | Macedon, Alexander's boyhood · THE SHADOW. *The boy.* (/story/alexander-bucephalus) |
| 0:35 | Silk Roads and the steppe | `wo02` b/s/f, `wo05-s`, route line | THE SILK ROADS · SILK ROADS. *Iron roads.* (/history/world) |
| 0:41 | The whole lineage on the map | six inked medallions of the scenes, route drawn on | place labels |
| 0:48 | Today | `media/bond-field-cadet.webp` | EIGHT HUNDRED YEARS, *handed to your child.* (/legend, Marwari origins) |
| 0:55 | End card | crest, brand lockup, motto | BLACK STALLION · ACADEMY OF HORSEMANSHIP · *Dominus sui, dominus equi* · blackstallion.academy |

Transitions: ink-bleed mattes (turbulence-torn growing circle), occluder wipes (the rider, the Pratap banners and the
rocks as blurred silhouettes passing the lens), and the world scene shrinking as ink into its medallion on the map.

## Code
- `src/lib/stage.tsx` — `Plane`/`Plate`: painted layers at a parallax depth `p` under one scene camera.
- `src/lib/ink.tsx` — the ink-bleed masks for scenes and titles.
- `src/lib/title.tsx` — the two-voice headline on an arc, inked in and out; `Shade` gradients.
- `src/lib/occluder.tsx` — the silhouette wipes. `src/lib/finish.tsx` — paper grain, film grain, vignette, preload.
- `src/scenes/scenes.tsx` — the ten scenes. `src/Film.tsx` — the timeline.

## Sound
Not added yet. `public/audio/music/open-range.mp3` is unlicensed and must not be used. A licensed score is needed
before publishing.
