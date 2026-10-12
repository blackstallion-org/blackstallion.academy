# Cinematic redesign · page specifications

One signature move per page. Each opening is a full-screen `.tone-dark` scene (100svh, safe-area aware); the page's own content follows in the ivory system. Shared rules: house curves (`lib/motion/tokens.ts`), timing in `lib/motion/cinematic.ts`, scroll ranges through `r()`, nothing plays behind the first-visit loader, the navigation takes the tone of the scene beneath it.

## 1 · Home `/` — split-screen kinetic reveal
Component: `components/cinematic/SplitReveal.tsx`, used by `components/sections/home/Hero.tsx`.

1. The film (cropped hero cut, poster first) sits under two leather masks cut on an asymmetric diagonal (57% top → 41% bottom); an antique-gold seam draws along the cut.
2. The masks part (left first, right 0.12 s later, 1.7 s, in-out curve); the film settles from a 1.12 push-in.
3. One line lands bottom-left: *We do not teach / children to ride.* (h1), then one CTA (*Watch the legend*), then the existing sound and play controls and a scroll cue.
- Copy never crosses the horse's head (bottom-left band, held by a bottom gradient).
- Below: the doctrine now leads with the second frame (*We forge them / to lead.*, h2), lede, both CTAs, figures, ticker. Nothing removed.
- Reduced motion: no masks, no push-in, film paused, copy fades. No JS: masks hidden by a `<noscript>` style.

## 2 · Curriculum `/curriculum` — scroll-driven aperture
Component: `components/cinematic/PortalReveal.tsx`, used by `CurriculumTitle`.

1. Desert at dusk (`currPortal`) with a lit antique-brass ring above the title; through it, the cadets in formation (`currFormation`).
2. Scrolling (pinned for 1.3 screens only) widens the aperture from 11 to 86 vmax and pushes the landscape to 1.55×; the title drifts up and fades.
3. The arrival line from the reel index appears: *The Ledger · Four ranks. / Thirteen pillars.* The pin releases straight into the ranks.
- Reduced motion: no pin; a still frame with the aperture half-open, title and arrival both visible.

## 3 · Hubs `/schools` — layered silhouette marquee
Component: `components/cinematic/LayeredMarquee.tsx`, used by `SchoolsTitle`.

Layers: (1) the active hub's own photograph, crossfading; (2) its area name set enormous (Kalnia inscription, 16vw) drifting sideways; (3) the cadet-on-Marwari cut-out standing in front of the name; (4) interface.
- Interface: reel mark, h1 *Your campus / becomes a citadel.*, one line, *Request a draft MOU* + *Run the numbers*; the three hubs from `lib/content/schools.ts` as links to `/schools/[slug]`.
- Rotation every 7 s with a dwell hairline; hovering or focusing a hub selects it and holds; a Pause control stops it (WCAG 2.2.2). Paused when the tab is hidden.
- Scroll parallax: background 14%, name −10%, rider −22%.
- Reduced motion: no rotation, drift or parallax.

## 4 · Individual hub `/schools/[slug]` — vertical parallax stack
Component: `components/cinematic/ParallaxStack.tsx`, used once in `app/schools/[slug]/page.tsx` for every slug.

1. Card 1: the hub's own `image`, *← All hubs*, tier line, h1 from `hub.name`, `hub.note`.
2. Card 2 rises over it (one screen of scroll) while card 1 sinks to 0.9, dims and its picture drifts slower; a dust layer travels faster on top. Card 2 carries the facts that used to sit in a grid below (status, tier, stallions, cadets, faculty) and *Book a hub visit* (anchors to the form).
3. The pin releases into the existing batches, stallions and enquiry form.
- Keyboard: focusing anything in a card that has not risen yet scrolls it up (no content is hidden from assistive tech).
- Reduced motion: the two scenes simply follow one another.

## 5 · Verify `/verify` — pixel dissolve
Component: `components/cinematic/PixelDissolve.tsx`, used by `VerifyTitle`.

1. The Marwari portrait (`verifyPortrait`) arrives as 64 px blocks with rows slipping sideways (a sorted-scan look), then resolves through 13 steps over 2.2 s and hands over to the sharp `<img>`. Canvas 2D at half resolution; drawing stops at the end.
2. Heading *Every hour / sealed in brass.* and one line fade in at 0.5 s.
3. The real `Verifier` form is in the opening (stacked layout) and usable within 0.35 s; the effect sits behind it, never takes focus or input, and never alters results. The separate "Enter the code" section is folded into the opening; chain and privacy sections unchanged.
- Fallbacks: reduced motion, no canvas, missing file or a slow file (>4 s) all show the plain photograph.
