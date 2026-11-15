# Marwari painted scroll asset pack

These images were generated with the built-in image generation tool from the two Rajasthani miniature paintings supplied by the site owner. The reference paintings guided palette, linework, ornament, and composition; their figures were not copied.

## File roles

For each scene `00` through `19`:

- `mw##-b.png`: opaque, full-canvas painted background.
- `mw##-s.png`: horse and people on genuine transparent alpha.
- `mw##-f.png`: foreground environment on genuine transparent alpha.

Layer order is **B → S → F**. Keep all three layers stretched to the same stage box. The source canvases are nominally 16:9 at about 1672 × 941 px. A few subject exports are one or two pixels narrower; use percentage-based full-canvas placement. The foregrounds are intentionally thin strips near the bottom. Text belongs in HTML, above these images.

## Generation prompt set

Shared style: “One landscape Rajasthani/Rajput miniature painting for a Marwari story scroll. Use the two supplied paintings as style references only: vivid vermilion sky, malachite terrain, cream sandstone architecture, crisp black ink contours, jewel mineral pigments, fine ornament, handmade wasli texture. Preserve plausible horse anatomy and short inward-curving Marwari ears. Leave quiet space on one side for reading copy. No text, border, watermark, interface, photography, 3D, or European details.”

Scenes:

| ID | Prompt subject | Reading side |
| --- | --- | --- |
| 00 | The bond: black Marwari and handler walking at dawn below distant fort | Left |
| 01 | Born in the Thar: black stallion lifting its hooves through deep desert sand | Right |
| 02 | Driven into Marwar: a small Rathore horse party approaching an arid hill fort | Left |
| 03 | Bred for survival: breeder examining a black horse in a sandstone stable | Right |
| 04 | The ears: close portrait of the black horse with inward-curving ears | Left |
| 05 | Three reasons: disciplined Marwari cavalry crossing desert dust | Right |
| 06 | The ballads: unnamed grey horse carrying a rider across a stream; folklore | Left |
| 07 | From royalty to the cart: working horse pulling sacks and fodder past an empty stable | Right |
| 08 | Revival: breeder tending a small group of Marwari horses at a stud farm | Left |
| 09 | Every cadet rides one: present-day cadet meeting a black Marwari at dawn | Right |
| 10 | Origin routes: local horses and visitors on a Rajasthan trade road | Left |
| 11 | Desert well: horse and handler at a scarce water source | Right |
| 12 | The working hoof: shoulder, foreleg and hoof lifting from deep sand | Left |
| 13 | The revaal: bay horse and rider moving along a long desert route | Right |
| 14 | Nachni heritage: rhythmic wedding procession at night | Left |
| 15 | Bards: oral storytelling by a campfire | Right |
| 16 | Wall leap: an explicitly folkloric horse and rider vignette | Left |
| 17 | Marwar Lancers: early twentieth-century mounted parade | Right |
| 18 | Register: horse keeper, blank studbook and horses | Left |
| 19 | Stallion that stayed: interpretive colt-selection vignette | Right |

Layer extraction prompts applied to each scene master:

1. **B:** “Remove only the main horses and people; reconstruct the exact original architecture, landscape, and ground behind them. Preserve the scene’s painting style and composition. Deliver an opaque background plate.”
2. **S:** “Isolate only the main horses and people with full tack, reins, mane, tails, hands, and hooves. Preserve their original position and scale on the full canvas. Make every other pixel genuinely transparent.”
3. **F:** “Create only a thin foreground band of location-specific grasses, sand, rocks, water, or flowers across the bottom of an otherwise transparent full canvas, matching the scene’s pigments, linework, and viewpoint.”

The subjects in scenes 00, 01, 04, 06, and 09 received targeted ear corrections. Scene 07 was corrected to show a working cart with sacks and fodder. Scenes 10–19 were generated as additional detail inserts, then split by the same background, subject, foreground process.

## Review limits

The files are layered art for parallax, but generated extraction can have small edge or alignment differences when composited. Check these in the implemented stage and tune CSS positioning before publication. Scenes 06, 14, 15, 16, and 19 depict folklore or interpretive vignettes; scene 02 is an evocative reconstruction. None is a historical record. The generated files are about 1.7K wide, not 4K masters.
