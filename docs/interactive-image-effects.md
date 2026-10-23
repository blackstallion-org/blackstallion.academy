# BSAH interactive image and typography effects

Implemented 18 October 2026. Existing project packages and image assets are reused; no dependencies installed or production deployment performed.

## Placements

- Homepage, after the existing horse study: `ImageCubeGallery` adds six photographic views across 24 CSS cubes (16 visible on narrow screens). Each tile carries a correctly cropped portion of the whole photograph. Buttons, arrow keys, Home/End, and horizontal pointer swipes select a view. GSAP staggers cube rotation from the centre.
- Homepage horse-study titles, new archive title, and the Fleet Marwari masthead: `ScrambleText` uses GSAP SplitText only during interaction. A short wave changes glyphs and adds temporary measurement details in the brand palette. Original text, widths and DOM are restored after every pass. Native buttons support focus, Enter and tap.
- Fleet Marwari main portrait: `ParticlePortrait` lazily imports the already-installed OGL library. A 50,000-point image-coloured field reacts to pointer momentum above the original photograph. It renders only during interaction and settling, pauses outside the viewport or hidden tab, and disposes its buffers, program, texture and listeners on cleanup. Touch/coarse-pointer and reduced-motion presentations use the photograph.

## Fallbacks

The archive's ordinary image is always available while faces load, if a face fails, under reduced motion, or without CSS 3D support. The portrait photograph stays visible if WebGL cannot start. No page-wide mouse handler, extra Lenis instance, continuous gallery autoplay, experimental CSS sibling functions, remote demo imagery or remote fonts were introduced.

## Sources and adaptation

- User-supplied Andrea Catanzaro character-hover snippet; preview: https://codepen.io/Andrea-Catanzaro/fullembedgrid/bNgyqbp (external preview could not be retrieved). BSAH implementation preserves its centre-out glyph idea with local colours, layout-stable outlines, semantic text restoration and keyboard activation.
- User-supplied Niklas Knaack cube-gallery markup and scroll-driven reference: https://codepen.io/NiklasKnaack/pen/xbgpYNy . BSAH uses an original React/GSAP/CSS-transform implementation with existing BSAH photos, rather than the reference's experimental CSS-only architecture.
- User attachment `7148648c-e4e7-4e43-a3bf-277d18c19b71/Pasted text.txt`: image-coloured pointer-momentum particles. The BSAH adaptation uses existing OGL with shader displacement; it is not the attachment's 600,000-particle transform-feedback simulation or its external wtc-gl dependency.

## Confirmed validation

- `npm run typecheck`: passed.
- Focused ESLint on all changed components and OGL declarations: passed.
- `npm run build`: passed; all 49 generated pages completed.
- Chromium desktop at 1440 × 1000: selected and confirmed all six cube-gallery views, inspected first and final-face screenshots.
- Typography hover and keyboard activation: measurement details appeared; exact original text returned; zero detail elements remained after completion.
- Narrow layout at 390 × 844: cube selection worked; ArrowRight changed both selection and focus; document horizontal overflow measured 0 px.
- Fleet portrait: WebGL2 context rendered the particle overlay. Instrumentation counted 33 draw calls during the interaction sample and 0 additional calls in the measured idle interval after settling.
- Reduced motion: portrait canvas hidden; cube grid hidden; selecting a photograph still worked; heading retained original text with zero split character elements. Browser reported zero errors during this check (Motion emitted its expected reduced-motion warning).

Screenshots: `output/playwright/archive-desktop.png`, `archive-desktop-face6.png`, `archive-mobile.png`, `portrait-particles.png`.

## Limits

Browser checks used desktop Chromium and a resized viewport; physical touch devices, Safari/Firefox, low-end GPU performance, screen-reader sessions, and production field metrics were not measured. The effects preserve the existing palette and fonts; referenced photos and existing institutional copy retain their pre-existing approval status.
