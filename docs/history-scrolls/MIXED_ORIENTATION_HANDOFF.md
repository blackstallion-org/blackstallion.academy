# Claude handoff: parallel horizontal and vertical story rhythm

The owner wants both long horizontal and long vertical paintings. Do not make India or World a single repetitive strip. Treat each story as a pair of complementary views:

- **Horizontal 3:1:** geography, travel, landscape and passage through time.
- **Vertical 9:16:** the intimate horse-and-human relationship, hands, reins, faces, care, trust and responsibility.

## Desktop rhythm

Use the 12-panel horizontal track from `HORIZONTAL_SCROLL_HANDOFF.md` as the continuous journey. At each numbered story, reveal its portrait plate in a parallel vertical lane or an overlapping manuscript folio. Alternate the portrait side left/right. The portrait may rise while the horizontal landscape continues behind it, then settle back into the track.

Do not scroll two independent containers. One page scroll drives both axes. Text remains HTML on a separate solid surface and never overlaps faces or horses. Horizontal panels remain 3:1; portrait plates remain 9:16 and are never stretched into the opposite orientation.

## Mobile and reduced motion

Use normal vertical flow: portrait plate, narrative, then a shallow crop of the associated horizontal panel. No pinned sideways translation is required on mobile or reduced motion. Preserve chapter anchors, browser back, and the fixed SiteNav safe zone.

## Portrait sequence

India: `IN-V01` through `IN-V07`, corresponding to `IN01` through `IN07`.

World: `WO-V01` through `WO-V07`, corresponding to `WO01` through `WO07`.

Paths and review state are recorded in `VERTICAL_ASSET_LEDGER.json`. Originals live in `artifacts/history-scrolls/vertical/masters/`; web derivatives live under `public/images/history/vertical/`.

## Copy-paste Claude instruction

Implement the India and World history pages as one coordinated mixed-orientation scroll. Keep the accepted 3:1 horizontal panorama track for geography and travel. Pair every numbered story with its accepted 9:16 portrait plate showing the horse-and-human bond. Drive both axes from the existing vertical page scroll: the landscape track translates horizontally while portrait folios enter vertically in an alternating left/right rhythm. Do not create nested scroll traps. Keep all narrative and sources in HTML, preserve SiteNav clearance, and use normal vertical flow on mobile and reduced motion. Read `HORIZONTAL_SCROLL_HANDOFF.md`, `MIXED_ORIENTATION_HANDOFF.md`, `HORIZONTAL_ASSET_LEDGER.json`, and `VERTICAL_ASSET_LEDGER.json` as the source of truth.
