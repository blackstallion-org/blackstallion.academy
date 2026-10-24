# Font licences

The original brand fonts below are licensed under the SIL Open Font License 1.1. The reference-inspired display additions are listed separately with their individual licences. They come from Fontsource tarballs on npm (no runtime dependency) and are subset to Latin + the punctuation the site uses.

| File | Family | Role | Source |
| --- | --- | --- | --- |
| kalnia-latin-standard-normal.woff2 | Kalnia (variable: wght 100–700, wdth 100–125) | Display: wide hairline capitals ("inscription") and heavy lowercase ("war voice") | @fontsource-variable/kalnia |
| newsreader-latin-wght-{normal,italic}.woff2 | Newsreader (variable: wght 200–800) | Story and body text; italic is the quiet voice | @fontsource-variable/newsreader |
| mona-sans-latin-standard-normal.woff2 | Mona Sans (variable: wght 200–900, wdth 75–125) | Labels, nav, buttons (condensed, uppercase) and UI text | @fontsource-variable/mona-sans |
| martian-mono-latin-standard-normal.woff2 | Martian Mono (variable: wght 100–800, wdth 75–112.5) | Numbers, codes, microchips, terminal | @fontsource-variable/martian-mono |
| inter-rupee-wght-normal.woff2 | Inter, only U+20B9 (₹) | Rupee sign fallback | @fontsource-variable/inter (latin-ext) |


## Reference-inspired display additions — 19 October 2026

Self-hosted, unmodified Latin WOFF2 files from Fontsource 5.3.0 npm tarballs. No package runtime was installed. Full copyright/licence notices are included beside each file in `editorial/`. These are alternatives inspired by the user’s moodboard, not the commercial faces pictured there.

| Family | File | Licence | Source | Use |
| --- | --- | --- | --- | --- |
| Rye | editorial/rye-latin-400-normal.woff2 | SIL OFL 1.1 | https://www.npmjs.com/package/@fontsource/rye/v/5.3.0 | Western chapter typography |
| Pirata One | editorial/pirata-one-latin-400-normal.woff2 | SIL OFL 1.1 | https://www.npmjs.com/package/@fontsource/pirata-one/v/5.3.0 | Heritage/blackletter chapters |
| Permanent Marker | editorial/permanent-marker-latin-400-normal.woff2 | Apache 2.0 | https://www.npmjs.com/package/@fontsource/permanent-marker/v/5.3.0 | Brush chapter accents |
| Anton | editorial/anton-latin-400-normal.woff2 | SIL OFL 1.1 | https://www.npmjs.com/package/@fontsource/anton/v/5.3.0 | Condensed kinetic chapters |

Four assets total 98,460 bytes. `next/font/local`, swap display and preload disabled. Existing Newsreader supplies the elegant contrast. Fonts are scoped to motion exhibits, not forms, navigation or body text.

## Editorial type system — 23 October 2026

Replaces the condensed blackletter display voice (Pirata One) and the condensed label width with a readable editorial pair, at the owner's request. Both are SIL OFL 1.1, unmodified Latin WOFF2 from Fontsource 5.3.0 npm tarballs; full notices beside the files.

| File | Family | Role | Source |
| --- | --- | --- | --- |
| noto-serif-display-latin-wght-{normal,italic}.woff2 | Noto Serif Display (variable: wght 100–900) | All display headlines (inscription + voice), statements, chapter titles | @fontsource-variable/noto-serif-display 5.3.0 · `noto-serif-display-LICENSE.txt` |
| plus-jakarta-sans-latin-wght-{normal,italic}.woff2 | Plus Jakarta Sans (variable: wght 200–800) | Labels, navigation, buttons, controls and supporting UI text | @fontsource-variable/plus-jakarta-sans 5.3.0 · `plus-jakarta-sans-LICENSE.txt` |

Newsreader stays as the long-form reading serif and Martian Mono for codes. Kalnia, Mona Sans and the reference display faces stay in the repository but are no longer preloaded or referenced by the type tokens.
