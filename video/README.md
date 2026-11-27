# The Lineage — BSAH intro film (Remotion)

A 60-second, 1920×1080, 30 fps film built only from the website's own approved artwork and copy. Plan and storyboard:
`docs/plans/intro-film.md`. This folder has its own `package.json`, so the website's dependencies are untouched.

## Commands (run inside `video/`)
```bash
npm install
npm run studio          # live preview in the browser
npm run stills          # storyboard stills → out/stills/
npm run draft           # 720p review draft (picture only) → out/bsah-lineage-draft-720p.mp4
npm run render          # final 1080p picture → out/bsah-lineage-1080p-picture.mp4
npm run mix             # the soundtrack → out/lineage-mix.m4a
npm run finish          # master with sound (out/bsah-lineage-1080p.mp4), web cuts and posters in public/video/the-lineage*
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
| 0:48 | Today | `images/academy-uniforms/stable-care.webp` (cadets with their black Marwari; since 26 Nov 2026) | EIGHT HUNDRED YEARS, *handed to your child.* (/legend, Marwari origins), then the line "From ancient saddle to modern character" |
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
- **Score:** "Desert Rajasthan Folk Music", alex-morgan, https://pixabay.com/music/folk-desert-rajasthan-folk-music-583283/
  (Pixabay Content License: free for commercial use, no attribution required; downloaded 17 Nov 2026). The first 61 s are kept
  in `audio/`; the mix uses 0–60 s, loudness-normalised, with a 4.5 s fade out.
- **Horse sounds** (all already licensed in `public/audio/LICENSES.md`): `walk.mp3` under the Marwar rider (swiftoid, CC0),
  `cavalry-gallop.mp3` under Haldighati and Jhansi (craigsmith, CC0), `horse-call.mp3` at the charge (Pixabay licence),
  `snort.mp3` at Alexander and at the cadet (Mixkit free licence).
- The mix is about −14.6 LUFS (social level). No voice.

## On the website
`/film` (`app/film/page.tsx`, `components/sections/film/LineageFilm.tsx`, `lib/content/lineage-film.ts`) plays the web cut with
a chapter list; every chapter links to the page its scene comes from. The menu entry is `introFilm` in `lib/content/site.ts`.
