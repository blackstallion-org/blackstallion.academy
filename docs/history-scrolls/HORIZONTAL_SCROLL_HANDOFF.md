# India and World sideways-scroll extension

This package gives Claude two 12-panel horizontal journeys. Each sequence reuses eight accepted wide paintings and adds four new **3:1 bridge panoramas**. The companion portrait system is defined in `MIXED_ORIENTATION_HANDOFF.md`.

## Interaction

- The horizontal journey begins after the existing anthology introduction and returns to normal vertical flow at its end.
- Desktop: pin only the horizontal viewport while one track translates left. The visitor continues using ordinary vertical wheel/trackpad movement; do not hijack horizontal input globally.
- Mobile and reduced motion: render the same 12 panels as a vertical reading sequence or a keyboard-operable snap carousel without pinning.
- Narrative remains HTML. Artwork contains no lettering.
- Use painted foreground bands, gentle overlap, or a short crossfade at joins. Never stretch an image to force edge matching.
- Keep `SiteNav` clear. The pinned artwork begins below the navigation-safe opening and no controls occupy the top 96/112px.

## India: 12-panel track

| Position | Asset | Purpose |
|---:|---|---|
| 1 | `IN00` | Opening atlas landscape |
| 2 | `IN-H01` | Desert road becomes a stable courtyard |
| 3 | `IN01-B` | Keepers of Marwar |
| 4 | `IN02-B` | Knowledge passed through hands |
| 5 | `IN-H02` | Manuscript courtyard opens into the Deccan hills |
| 6 | `IN03-B` | Shivaji's hill country |
| 7 | `IN04-B` | Bajirao's long roads |
| 8 | `IN-H03` | River road travels toward Lahore and greener country |
| 9 | `IN05-B` | Ranjit Singh's stables |
| 10 | `IN06-B` | Manipur's polo ponies |
| 11 | `IN-H04` | Polo meadow becomes a coastal road of remembrance |
| 12 | `IN07-B` | The riders who reached Haifa |

## World: 12-panel track

| Position | Asset | Purpose |
|---:|---|---|
| 1 | `WO00` | Opening manuscript atlas |
| 2 | `WO-H01` | Aegean shore leads into the Greek courtyard |
| 3 | `WO01-B` | Xenophon and understanding the horse |
| 4 | `WO02-B` | Horses along the Silk Roads |
| 5 | `WO-H02` | Caravan pass widens into the relay steppe |
| 6 | `WO03-B` | The relay across the steppe |
| 7 | `WO04-B` | The horse beside the tent |
| 8 | `WO-H03` | Desert camp becomes mounted-archery country |
| 9 | `WO05-B` | The mounted archer |
| 10 | `WO06-B` | Napoleon and Marengo |
| 11 | `WO-H04` | Campaign camp becomes a veterinary station |
| 12 | `WO07-B` | Behind the lines |

## New master paths

- Originals: `artifacts/history-scrolls/horizontal/masters/`
- Web images: `public/images/history/horizontal/{india,world}/`
- Ledger: `docs/history-scrolls/HORIZONTAL_ASSET_LEDGER.json`

Each new bridge is an independent 2400 x 800 (3:1) painting designed for overlap/crossfade at both sides. These bridges are environmental images only; Claude layers existing subject cutouts above them where appropriate.
