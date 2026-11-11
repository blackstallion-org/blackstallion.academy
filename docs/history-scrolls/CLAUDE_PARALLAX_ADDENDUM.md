# Claude addendum: fixed painted stage and scroll-driven scenes

This addendum records the owner's requested interaction reference. Read it together with `PLAN.md`, `STORYBOARDS.md`, and `ASSET_LEDGER.json`.

## Required experience

All four new history pages should feel like one tall illustrated story. A painted stage stays visually steady while the visitor's vertical scroll advances hills, architecture, riders, horses, clouds, light, and foreground bands at different speeds. Use the supplied SVG/GSAP demo as a movement reference, not as markup to paste unchanged.

- India and World: each of the seven stories receives its own sticky/fixed-feeling painted stage and scroll runway. Do not pin the entire anthology as one inaccessible 6,000-pixel canvas; release each story before the next begins.
- Lakshmibai and Alexander/Bucephalus: use the stronger continuous-stage treatment across the eight scenes, divided into four chapters. A foreground arch, rock band, branch, cloud, shadow, road, or river edge carries the eye into the next scene.
- World remains seven stories about a horse-and-human relationship. Architecture, clothing, tack, horse type, and landscape remain specific to the stated civilisation.
- Text stays as server-rendered HTML on a solid reading surface. Never bake narrative, controls, or labels into the SVG or paintings.

## Adaptation of the supplied CSS

Do **not** add global `body`, `svg`, `.btn`, or `.scrollElement` rules. Scope the pattern to the history system, for example:

```css
.historyScrollRoot {
  position: relative;
  margin: 0;
}

.historyScrollStage {
  position: sticky;
  top: 0;
  width: 100%;
  height: 100svh;
  overflow: hidden;
  isolation: isolate;
}

.historyScrollStage > svg,
.historyScrollStage > .historyArtLayers {
  display: block;
  width: 100%;
  height: 100%;
}

.historyScrollRunway {
  position: relative;
  min-height: var(--scene-scroll-height, 160svh);
}
```

The existing `SiteNav` remains fixed above the page. Hero copy starts below `clamp(5.5rem, 9vh, 7.5rem)`, and all secondary controls remain below 112px desktop / 96px mobile. Do not place a fixed canvas or control over the top navigation. Keep the existing project typography; do not introduce Canva Sans.

## Motion mapping from the references

- Background/sky: slowest movement.
- Distant terrain and forts: shallow vertical parallax.
- Horse and human subject: restrained entrance or framing shift; never fake a gallop by sliding a still cutout.
- Foreground: strongest movement, used to hide scene joins.
- Clouds, birds, dust, rain, water, leaves, torchlight, and shadows: sparse local movement inside painted bounds.
- Scene colour: subtle palette transitions like the reference sun/sky gradient, but keep the miniature pigments intact.
- Use the existing Lenis instance and scoped GSAP ScrollTrigger timelines. Use `gsap.matchMedia()` and revert every context on unmount.
- Do not copy the reference's `window.onbeforeunload = scrollTo(0, 0)` behavior. Browser back, anchors, and restored scroll position must continue to work.
- Reduced motion renders every scene in reading order with no pinning, scrub, parallax, or ambient loop.
- On phones, use a shorter sticky stage only where it remains readable; otherwise place the artwork in flow followed by its narrative. Never crop away the horse or rider to preserve an effect.

## Required verification

Verify forward and reverse scroll, direct chapter anchors, browser back, reduced motion, and missing-image fallback. Capture and inspect every route at 1440 x 900 and 390 x 844, with explicit inspection of the top 120px for navigation clearance.

## Supplied reference files

The exact user attachments are indexed in `references/parallax-scroll/README.md`. Preserve them as source references; the production implementation should use the project's own classes, components, accessibility behavior, and artwork layers.
