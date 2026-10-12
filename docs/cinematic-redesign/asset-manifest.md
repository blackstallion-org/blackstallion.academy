# Cinematic redesign · asset manifest

Generated 12 Oct 2026 with Higgsfield **Cinema Studio Image 2.5** (`cinematic_studio_2_5`, 2K, 2 credits each) plus one background removal. Total spent: 8 credits + 1 removal. Keys live in `lib/content/media.ts`; local copies are fetched with `sh scripts/fetch-media.sh` (lines added). All are AI placeholders until the commissioned shoot (Blueprint 11.4).

| Key | Local file | Size | Used by | Job |
| --- | --- | --- | --- | --- |
| `currPortal` | `public/media/cinematic-curriculum-portal.png` | 2752×1536 | `/curriculum` aperture landscape | 837d442d |
| `riderStudio` | `public/media/cinematic-rider-studio.png` | 1856×2304 | source for the cut-out (not shown) | e5044e71 |
| `riderCutout` | `public/media/cinematic-rider-cutout.png` | 1856×2304, transparent | `/schools` foreground layer | e5ca080a (background removal of e5044e71) |
| `hubArena` | `public/media/cinematic-hub-arena.png` | 2752×1536 | `/schools/[slug]` second card (labelled indicative) | 38fcd9ba |
| `verifyPortrait` | `public/media/cinematic-verify-portrait.png` | 2752×1536 | `/verify` pixel dissolve | 035e1ba3 |

Reused, not regenerated: `currFormation` (through the aperture), `schoolAerial`, `schoolArenaNight`, `bgPavilion` (each hub's own `image`), `dustPlume` (hub foreground layer).

## Prompts

House style: Blueprint Part 8 PHOTO suffix; cadets in the BSAH uniform line, helmet on when mounted.

- **currPortal (16:9):** Vast Thar desert at the last light of dusk seen from a low dune crest, perfectly symmetrical one-point composition, a single rider on a Marwari horse in silhouette standing small at the exact centre of the horizon, an enormous calm empty sky above, a thin band of copper glow along the horizon behind the rider, long curving dune ridges leading the eye to the centre, obsidian-dark foreground sand. + PHOTO suffix.
- **riderStudio (4:5):** Full-body side view of a 14-year-old Indian cadet sitting tall on a dark bay Marwari horse with inward-curving lyre-shaped ears, standing square facing right, whole horse and rider in frame with space around them, plain seamless dark grey studio backdrop, soft even light with a warm gold rim light, crisp clean edges. + uniform line. Photorealistic, no dust or smoke (clean edges for the cut-out).
- **hubArena (16:9):** A new sand riding arena with white post-and-rail fencing beside a red-brick Indian school campus at dawn, a row of timber stables, a single young cadet leading a bay Marwari horse across the raked sand, low mist, warm first light, calm sky in the upper third. + uniform line + PHOTO suffix.
- **verifyPortrait (16:9):** Head-and-neck portrait of a dark bay Marwari stallion with inward-curving lyre-shaped ears whose tips nearly touch, three-quarter view looking left, placed in the right third, black leather bridle with small brass studs, pure black background with empty space on the left, thin antique-gold rim light on ears, crest and eye, extremely fine coat detail. 85 mm, low-key, antique gold grade.

## Video (home)

The original `public/video/hero-main.mp4` (34.5 MB, 1920×1076) carries baked-in letterbox bars, so it can never fill a viewport. New derived files, originals untouched:

| File | Spec | Size |
| --- | --- | --- |
| `public/video/home-hero-cropped-1920.mp4` | crop 1920×768 @ y156, H.264 CRF 28, AAC 128k, faststart | 14.6 MB |
| `public/video/home-hero-cropped-1280.mp4` | same crop scaled to 1280×512, CRF 29, AAC 96k (served ≤ 900 px wide) | 6.6 MB |
| `public/video/home-hero-cropped-poster.jpg` | `hero-main-poster.jpg` cropped to the picture, 1920×766 | 52 KB |

Sound is kept (the hero's existing "Sound on/off" control); autoplay is always muted.

## To check before launch

- Owner review of the four stills in the Higgsfield gallery: Marwari ears, anatomy, uniform, crop. The implementer could not view them.
- Run `sh scripts/fetch-media.sh` on the Mac and set `NEXT_PUBLIC_LOCAL_MEDIA=1` for optimised local delivery.
