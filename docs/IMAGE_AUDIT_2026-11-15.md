# BSAH image audit and replacement manifest

Audit date: 15 November 2026

## Scope and method

- Traversed every route, component, content manifest, and public asset reference in the repository.
- Inventoried the complete current `public/` image set: 1,163 raster assets and 2 SVG brand assets.
- Ran OCR over the 1,085 raster assets present at the start of the audit, then reviewed the returned text regions and contact sheets. The subsequently generated 76-frame inward-ear sequence and its poster were checked from the source sequence and sampled across its duration; they contain no text or marks.
- Distinguished intentional BSAH/STPCI identity artwork, story copy, maps, passports, and ledgers from unintended third-party marks.
- Visually inspected the marked editorial library, generated original replacement plates from written subject/layout descriptions (not by editing the protected files), and retained the published pixel dimensions.
- Verified every affected route at 1440×900 and 390×844 with a real Chromium browser. Screenshots are in `output/playwright/bsah-image-audit/`.

## Actionable findings

All affected files below were retired after replacement verification. Replacement files are original AI-generated photographs created with the built-in image-generation tool.

| Retired file | Website location | Detected issue | Replacement |
| --- | --- | --- | --- |
| `public/images/marwari-editorial/about-01.webp` | `/about`, “The keepers” gallery | “Ekaterina Druz / EQUINE-PHOTO.NET” photographer signature and domain | `about-01-original.webp` |
| `public/images/marwari-editorial/about-05.webp` | `/about`, “The keepers” gallery | Repeating Alamy stock watermark | `about-05-original.webp` |
| `public/images/marwari-editorial/curriculum-01.webp` | `/curriculum`, “The training ground” gallery | Handwritten photographer signature at lower edge | `curriculum-01-original.webp` |
| `public/images/marwari-editorial/curriculum-02.webp` | `/curriculum`, “The training ground” gallery | Embedded photographer credit at lower edge | `curriculum-02-original.webp` |
| `public/images/marwari-editorial/home-01.webp` | `/`, “The royal folio” gallery | Photographer signature | `home-01-original.webp` |
| `public/images/marwari-editorial/home-02.webp` | `/`, “The royal folio” gallery | “EKATERINA DRUZ / EQUINE-PHOTO.NET” credit | `home-02-original.webp` |
| `public/images/marwari-editorial/legend-07.webp` | `/tournaments`, “Speed” gallery | Photographer signature at lower-left | `legend-07-original.webp` |
| `public/images/marwari-editorial/parents-02.webp` | `/parents`, “Trust” gallery | Photographer signature and “2017” date | `parents-02-original.webp` |
| `public/images/marwari-editorial/parents-03.webp` | `/parents`, “Trust” gallery | “EKATERINA DRUZ / EQUINE-PHOTO.NET” credit across top edge | `parents-03-original.webp` |
| `public/images/marwari-editorial/parents-05.webp` | `/parents`, “Trust” gallery | Photographer signature and “2016” date | `parents-05-original.webp` |
| `public/images/marwari-editorial/safety-02.webp` | `/safety`, “The stable” gallery | “Gill photography” signature | `safety-02-original.webp` |
| `public/images/marwari-editorial/schools-02.webp` | `/schools` gallery and `/` “Five thresholds” | “EKATERINA DRUZ / EQUINE-PHOTO.NET” credit | `schools-02-original.webp` |
| `public/images/marwari-editorial/schools-03.webp` | `/schools` gallery and `/` “Five thresholds” | Unwanted embedded numeric/credit text | `schools-03-original.webp` |
| `public/images/marwari-editorial/schools-04.webp` | `/schools` gallery and `/` “Five thresholds” | “Ekaterina Druz / EQUINE-PHOTO.NET” signature | `schools-04-original.webp` |
| `public/images/marwari-editorial/schools-05.webp` | `/schools`, “Heritage” gallery | Large “Ekaterina Druz / EQUINE-PHOTO.NET” signature | `schools-05-original.webp` |
| `public/images/marwari-editorial/science-01.webp` | `/science`, “The body at work” gallery | Faint embedded photographer mark along lower edge | `science-01-original.webp` |
| `public/images/marwari-editorial/science-05.webp` | `/science`, “The body at work” gallery | Cropped “EQUINE-PHOTO.NET” credit at top-right | `science-05-original.webp` |
| `public/images/marwari-editorial/tournaments-05.webp` | `/tournaments`, “Speed” gallery | Handwritten photographer signature at top-left | `tournaments-05-original.webp` |
| `public/images/story/lakshmibai/statue.webp` | `/story/rani-lakshmibai`, monument plate before the afterword | Third-party “HOTEL BRIDGE VIEW / PREMIUM” commercial signage and in-scene plaque text | `statue-original.webp` |

## Generation prompt set

Every prompt used the `photorealistic-natural` use case and ended with the same hard constraint: **entirely original composition; anatomically coherent horse and rider where applicable; no text, letters, digits, logos, signatures, watermarks, commercial signs, plaques, dates, or brand marks.**

The per-asset subject directions were:

- Black Marwari with restrained gold-and-red ceremonial tack in an ochre haveli courtyard.
- Elderly Rajasthani horse keeper in saffron beside a black Marwari at golden hour.
- Black Marwari walking on a loose lead across pale Rajasthan sand.
- Dark bay Marwari conformation portrait on rural sandy ground.
- Dark Marwari before a sandstone chhatri at dawn.
- Black Marwari before monumental carved wooden doors.
- Dark Marwari surging through luminous dusk dust.
- Two Marwari horses touching noses around the setting sun.
- Pale grey Marwari beside a misty lake.
- Single Marwari in profile with the sunset behind its shoulder.
- Chestnut Marwari leaning over a stable half-door.
- Chestnut Marwari between pale carved marble columns.
- Black Marwari at the top of a monumental sandstone gateway.
- Black Marwari in an indigo-and-ivory painted haveli doorway.
- Dark Marwari beneath bougainvillea at an old courtyard door.
- Black Marwari pivoting on a dusty woodland track.
- White Marwari cantering toward camera across green grass.
- Black Marwari airborne in layered golden dust.
- Original bronze memorial interpretation of Rani Lakshmibai on a rearing horse in a clean Himalayan public setting.

## Attribution retained

- Gallery-level photographer attribution remains because unmarked, permission-confirmed third-party photographs are still used in those mixed galleries.
- Existing Wikimedia/Creative Commons credit links remain on historical monument photographs that are still used.
- BSAH and STPCI identity marks remain where they are intentional academy/council branding rather than third-party watermarks.

## Verification outcome

- 18 route screenshots captured: 9 affected routes × desktop and mobile.
- No image request returned an HTTP error.
- No browser console or page errors were observed during the verification run.
- The fixed `SiteNav` remained unobstructed in the top 120px at both viewport sizes.
- Replacement dimensions match the retired assets, so existing layout, cropping, animation, and responsive behavior are preserved.
- Type generation and TypeScript checking completed successfully.
