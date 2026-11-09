# Painted reliefs: provenance

Manifest: `lib/content/history/reliefs.ts`. Renderer: `components/history-scroll/reliefs/ReliefCanvas.tsx`. All four
are built at runtime from files already in the repository; nothing is downloaded from a third party and no GLB is
shipped, so `public/models/history/` is intentionally empty.

| Id | Kind | Source | Geometry | Camera |
|---|---|---|---|---|
| IN01 | plate | `public/images/history/india/in01-b.webp` + `in01-b-depth.webp` | 1 × 1/aspect plane, 256 × 144 segments, displaced ≤ 0.055 | orthographic, mesh turns ±0.07 rad with scroll, zoom 1 → 1.03 |
| WO02 | plate | `public/images/history/world/wo02-b.webp` + `wo02-b-depth.webp` | as IN01 | as IN01 |
| JH01 | plate | `public/images/history/lakshmibai/jh01-b.webp` + `jh01-b-depth.webp` | as IN01 | −0.07 → +0.06 rad |
| AL04 | map | coordinates in `reliefs.ts` (`ALEXANDER_ROUTE`, `SEAS`, `RIVERS`) | 20 × 6.67 unit terrain, 120 × 40 segments, vertex-painted; tube route; cone pins | orthographic, elevation 1.15 rad, azimuth ±0.06 |

**Plate reliefs.** The relief is the accepted background painting, cropped exactly as the flat plate is (cover at its
focal point) and laid on a shallow mesh displaced by a depth map made from the same painting
(`scripts/history-relief-depth.py`: sky flood-filled flat, the features above the horizon swelled from their
silhouettes, ground rising toward the viewer, all four edges pinned to zero). Unlit `MeshBasicMaterial`, no tone
mapping, so at rest it is the same picture as the flat plate underneath; scrolling turns it a few hundredths of a radian.
The fort or the range is therefore never drawn twice. A plate relief appears only once its plate is accepted and its
depth map exists.

**AL04 map.** Equirectangular, 18°–78° E, 24°–44° N. Route stops at published coordinates of the ancient sites.
Seas and rivers are simplified outlines for orientation, not survey data. No political borders. Labels are HTML,
projected each frame, not part of the scene.

**Fallbacks.** No WebGL, a lost context, a failed chunk or reduced motion: the relief never mounts; the flat painting
and the whole story remain.
