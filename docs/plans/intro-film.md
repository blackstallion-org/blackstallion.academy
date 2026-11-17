# Plan: "The Lineage", a one-minute intro film

Status: planned 17 Nov 2026, not built. Owner's choices: Remotion in this repo, 16:9 (1920×1080), music and horse sounds
with no voice, and used on the home page as well as for social and pitch use.

## Idea
One unbroken camera journey across a painted parchment map of the horse's history, ending at the academy:
**"An 800-year lineage, handed to your child."** Every scene uses artwork the site already has, so the film and the
website look like one thing.

## The style, and how each part is built
| Technique | What the viewer sees | How it is built (Remotion + Three.js) |
| --- | --- | --- |
| Parchment base | Aged paper grain under everything | `public/images/history/shared/sh01–sh08.webp` on a back plane; paintings over it with multiply blending so the grain shows through |
| 2.5D multi-plane | Paintings with real depth as the camera glides | Each scene's back/middle/front cutouts (`-b`, `-s`, `-f`) and the Pratap bands placed at different depths; one camera on a CatmullRom spline |
| Ink-bleed reveals | Scenes and titles soak into the paper instead of fading | A GLSL noise-threshold matte driven by frame number; feathered blotchy edges |
| Map lines | Rivers, coasts and routes drawn on | SVG strokes revealed with stroke-dashoffset (India map and the Silk Road) |
| Curved titles | Place names set along a ridge or coastline, eroding in | SVG text on a path, sharing the ink matte; the site's display font |
| Occluder wipes | A dark silhouette sweeps past the lens to change scene, never a hard cut | Large dark cutouts (rider, banner, ridge, cliff) close to the camera, blurred |
| Finish | One continuous move with a film feel | Eased spline camera, grain, vignette, a little bloom on lit moments |

## Storyboard (60 s, 30 fps = 1800 frames)
| Time | Scene | Artwork already in the repo | Move | Title (ink-bleed) | Transition out |
| --- | --- | --- | --- | --- | --- |
| 0:00–0:04 | Parchment, the crest inks in | `public/brand/bsah-stamp-mark.webp`, `sh01` | Slow push-in | — | Ink blooms outward |
| 0:04–0:10 | The Thar at dusk: the Marwari | India IN01 layers, Pratap `band-sky`, `band-ridge-*` | Dolly across the dunes | *The Marwar* (on the dune line) | A rider silhouette crosses the lens |
| 0:10–0:16 | Shalihotra to the Mughal stables | IN02, IN08 layers | Drift along the arcades | *Eight centuries* | Arcade pillar wipe |
| 0:16–0:23 | Haldighati, 1576: Pratap and Chetak | `public/images/story/pratap/` bands and `battle-army` | Push into the charge, banners at the lens | *Pratap & Chetak* | `banners` occluder |
| 0:23–0:29 | Jhansi at night: Lakshmibai rides out | JH06 layers (fort, crescent moon) | Low tracking shot, embers | *Jhansi will not be surrendered* | Fort-wall cliff wipe |
| 0:29–0:35 | Alexander and Bucephalus | AL02/AL04 layers | Turn toward the sun | *The shadow. The boy.* | Dark ridge wipe |
| 0:35–0:41 | The world: Silk Road and steppe archer | WO02, WO05, WO08 layers | Long lateral glide, route line draws on | *Silk roads. Iron roads.* | Pull back |
| 0:41–0:48 | Pull back to the whole map | India map art, all scene positions as small inked vignettes | The camera rises; routes connect the scenes | — | Light sweep |
| 0:48–0:55 | Today: a cadet and a Marwari | `bondField` and `black-marwari-stallion` photographs, graded to sit on parchment | Slow push; the photo inks in over the map | *Handed to your child* | Paper fades to ivory |
| 0:55–1:00 | End card | Crest, `Wordmark`, motto | Still | **Black Stallion Academy of Horsemanship** · *Dominus sui, dominus equi* · blackstallion.academy | — |

Rules: one camera move per scene, nothing on the top or bottom 8% of the frame (social-safe), no claims beyond the
site's own copy, and any reconstructed or legendary scene stays in the painted miniature style.

## Sound
- Score: the site's music, but `music/open-range.mp3` is **not licensed** (see `public/audio/LICENSES.md`). Before
  publishing, the owner must clear it or supply licensed music; the render uses a placeholder bed until then.
- Effects already licensed in `public/audio`: `ambience/cavalry-gallop.mp3` under the Haldighati charge,
  `bsah_stallion_breath.wav` at the cadet shot, `cavalry-bed.mp3` for the steppe, and a low drone under the end card.
- Mix around −14 LUFS for social; a separate silent encode is made for the home page (autoplay muted).

## Build
1. **New `video/` folder** with its own `package.json` (Remotion, @remotion/three, three). The website's dependencies
   are untouched. The owner approved the Remotion approach; the exact package versions are listed in the PR.
2. `video/src/`: `Film.tsx` (the 1800-frame composition), `scenes/*.tsx` (one per storyboard row), `lib/camera.ts`
   (spline and easing), `lib/inkMatte.glsl`, `lib/Plane.tsx` (a textured plane at a depth), `lib/OccluderWipe.tsx`,
   `lib/PathTitle.tsx`. Assets are read straight from `public/`, so nothing is copied.
3. Render commands: `npm run render` → `video/out/bsah-lineage-1080p.mp4` (H.264, about 25 MB) plus a stills sheet for
   review.
4. **Home page:** a web encode (1080p and 720p mobile, about 8 MB and 4 MB, muted) plus a poster frame, added through
   `lib/content/hero-films.ts` like the Marwar film. Whether it replaces the Marwar band or sits beside it is the
   owner's call at review.

## Review steps
1. A **storyboard sheet** first (one still per scene) for the owner to approve before animation.
2. A **draft render** at 720p for timing and transitions.
3. The **final render** and the home-page encode; check it plays on desktop and phone with reduced motion showing the
   poster only.

## Open items for the owner
- A licence for the music (or new music) before public release.
- Approve the title lines (taken from the site's own headlines).
- Replace or sit beside the Marwar film on the home page.
