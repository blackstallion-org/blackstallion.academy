# Black Stallion Academy — Design, Photography & Workflow Instructions

## 1. Natural, Original Full-Color Photography (Strict Rule)
- **Zero Black & White / Sepia Filters**: Never apply grayscale, monochrome, desaturation, or sepia CSS/SVG filters (`grayscale()`, `sepia()`, `--grade-mono`, etc.) to photography.
- **Vibrant Natural Colors**: All horses, riders, and desert/arena landscapes must be shown in their rich, natural, true-to-life colors (warm chestnut, bay, palomino, nukra white, sand, blue sky, golden sunset).
- **Use Original User Assets**: Prioritize the high-resolution photography provided by the user (`0_hero.png`, `1_desert.png`, `2_war.png`, `3_fall.png`, `4_revival.png`, `5_academy.png`, arena photography, and WhatsApp photography).
- **Eliminate Moody Desaturated Stock**: Do not use dark, muddy, desaturated stock images (e.g. `tahir-osman.webp`, `fethi-benattallah`).
- **No Desaturated / Color-Graded WebP Copies**: All `.webp` assets in `cinematic-images` must maintain 100% original RGB color channels identical to their uncompressed `.jpg` source files. Never apply artificial dark-brown, sepia, or desaturation color grading.

## 2. Clean, Independent, Screen-Filling Images (Reference: Iron Vale Equine)
- **Screen & Frame Filling**: Images must fill the screen/viewport cleanly and boldly (`object-cover`, edge-to-edge full frame).
- **Independent & Crisp**: Images must not be hidden behind heavy artificial dark vignettes, milky fog overlays, or muddy gradients. The photography must look crisp, clear, and proud.
- **Clean Layout**: Follow the aesthetic of the provided benchmark (*Iron Vale Equine*):
  - Natural outdoor lighting.
  - Generous negative space with warm ivory/cream or clean dark backgrounds.
  - Thin, elegant accent borders and dividers.
  - Minimal, high-contrast, uncluttered typography that lets the visual breathe.

## 3. Dynamic Forward-Zoom Story Reels (Restored & Protected)
- **Signature 3D Forward-Zoom**: In `CinematicStoryReel`, text and imagery smoothly scale forward along the z-axis towards the viewer during slide transitions (`scale: 4.2` for titles, `scale: 2.2` for subtitles, `scale: 1.48` for background imagery) before gracefully transitioning to the next chapter.
- **Readable Hold**: Each slide holds for a clear reading window (~2.4s) before initiating the forward zoom (~1.8s), giving viewers time to absorb the typography.
- **Synchronized Controls**: Slide numbers, progress indicators, and keyboard/touch navigation must remain fully responsive and synchronized.

## 4. Strict Single-Page Workflow (Mandatory Protocol)
- **ONE Page at a Time**: Work exclusively on **one single page** per turn.
- **No Cross-Page Scope Creep**: Do not touch other pages until the current page is reviewed and approved.
- **Inspect & Audit**: Visually verify that all images on the active page are in full natural color, fill the frame, have zero filters/fades, and that text animations run cleanly.
- **Ask User Permission**: After presenting the output of each page, **explicitly ask the user for permission** before proceeding to any subsequent page.

## 5. Strict 1-to-1 Cinematic Image Policy (Zero Looping & Zero Duplicates)
- **Every Cinematic Image Used Exactly Once**: Every single one of the 24 images in `/images/cinematic-images/` must be used across the website, and each one must be used **only once** (zero repetition, zero duplicate keys, zero modulo looping).
- **Hero Section Cowboy Image**: The hero section on the homepage (`/`) must feature the cowboy image (`pexels-furkanelveren-26700308.webp`): a full-frame screen presentation of the cowboy on horseback herding charging horses into the morning sun, clean, independent, original natural color, no filters, minimal text, followed by the institutional doctrine below.
- **Ring-of-Fire Desert Silhouette**: `5b42ebb6-b222-40d1-a49e-173c638eb525.webp` must be used in **strictly ONE single place** on the entire site: the homepage finale close (`duneSilhouette`).
- **Authentic Cadet Cure Photo**: The cure side of Crisis & Cure (`whyCure`) must strictly use the original authentic photo (`why-cure.webp`) of the cadet boy in uniform sitting tall on a Marwari horse.

