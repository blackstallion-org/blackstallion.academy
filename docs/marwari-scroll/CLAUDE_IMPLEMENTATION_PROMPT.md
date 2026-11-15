# Claude implementation prompt — The Marwari, one painted journey

You are working in `/Users/stingraj/blackstallion-website`. **Implement the new `/legend` page, not just a design proposal.** The owner wants the current 3D museum opening and existing fragmented page replaced by one long, animated, illustrated Marwari story. The paintings should feel related to `/story/pratap-chetak`, `/story/rani-lakshmibai`, `/history/india`, and `/history/world`, while this page has its own identity and rhythm.

## Read before editing

1. Read root `AGENTS.md`. This project's Next.js 16.4.2 has breaking changes: read the relevant local guides in `node_modules/next/dist/docs/01-app/` before writing code, especially pages, server/client components, images, CSS, and metadata. Follow deprecation notices.
2. Read `docs/marwari-scroll/STORY_SOURCE.txt` in full. This is the owner's pasted Reel 01 narrative. Read `lib/content/legend.ts` for existing copy, caveats, chronology, and links.
3. Inspect the actual reference routes and components: `app/story/pratap-chetak/page.tsx`, `app/story/rani-lakshmibai/page.tsx`, `app/history/india/page.tsx`, `app/history/world/page.tsx`, `components/history-scroll/`, and `components/sections/pratap-story/`. Reuse proven ideas and utilities where appropriate, but make a purpose-built Marwari page. Do not simply pass these 20 assets into `PersonalStoryPage` or produce 20 identical sticky panels.
4. Inspect `public/images/story/marwari/manifest.json` and `GENERATION_NOTES.md`. All 60 generated image layers are saved together in that folder. Files `mw##-b.png`, `mw##-s.png`, and `mw##-f.png` are respectively background, transparent subject, and transparent foreground. Scene IDs run `00`–`19`. The PNGs are ~100 MiB total, so shipping all original PNGs eagerly is unacceptable.
5. Inspect the current `/legend` page and find every reference to the museum before removing it. Preserve the `/legend` route, metadata, site navigation, related links, lore link, and the story's factual qualifications.

## The creative direction

Design **one continuous painted journey through Marwar**, not a museum, grid, slideshow, exhibition of framed cards, or a clone of the other history pages. It should feel as if the visitor is traveling through an illustrated manuscript: landscape recedes, the horse and riders enter and leave, and smaller detail moments interrupt the scale. Use the supplied Rajasthani miniature palette and linework: crimson/vermillion sky, ochre desert, malachite hills, cream sandstone, ink outlines, and warm wasli paper. Avoid generic luxury gold styling. The horse is the protagonist, not a decoration behind text.

Use four acts with a clear shift in atmosphere and pace:

| Act | Story | Image sequence | Motion character |
| --- | --- | --- | --- |
| Prologue / Land | Bond, possible influences, migration into Marwar, desert selection | `00 → 10 → 02 → 01 → 11` | Slow walk opens into long horizontal travel; heat and dust build. |
| Body / Culture | Breeding, working hoof, ears, revaal, wedding dance, bards | `03 → 12 → 04 → 13 → 14 → 15` | Intimate holds and close details; gait and music create a measured rhythm. |
| Service / Loss | Cavalry, ballads, wall-leap folklore, twentieth-century lancers, cart | `05 → 06 → 16 → 17 → 07` | Broad advance, brief leap, then a deliberate slowdown and muted palette. |
| Return / Future | Revival, colt vignette, registration, modern cadet | `08 → 19 → 18 → 09` | Warm light returns; motion settles into a long final hold on trust. |

This is a **single route and a single long story**. The ten original anchor scenes (`00`–`09`) carry the main argument. The ten added scenes (`10`–`19`) are detail inserts woven into those acts. Vary their treatment: some full-bleed, some shorter inset or close detail, some paired with an editorial passage. Do not give every asset the same viewport height or animation. Include chapter wayfinding and a progress cue, but keep both below the fixed site nav and out of the first 80 px. Provide a concise “Read the story” mode that turns off parallax and shows all text in normal flow.

## Story and factual treatment

- Preserve the story's essential arc: origins and uncertainty; Thar adaptation; breeding and ears; ceremonial culture; cavalry and oral lore; decline; revival; today's cadet.
- Keep the three origin accounts differentiated. The Kutch shipwreck is **legend about Kutch/Kathiawari**, not a proven Marwari origin. Do not infer a precise genetic pedigree from scene 10's painting.
- Scenes `06`, `14`, `15`, `16`, and `19` are folklore or interpretive vignettes. Label this in real HTML near their reading copy. Do not present the stream horse, wall leap, wedding traditions, or Vangalia anecdote as verified documentary events.
- Scene `02` is a reconstruction, not an image of a precisely witnessed 1193 event. Scene `17` is an interpretive period painting; avoid invented military specifics in captions.
- Use the existing copy and source notes as a starting point, edit for coherence, and retain qualifications. Do not put facts, dates, captions, controls, or text into the painted images.
- End at the academy's living horse-and-cadet bond, with a clear path to the next reel and the `/lore` story.

## Motion direction — visibly alive, still readable

The B/S/F assets must be **separate DOM layers**, ordered background → subject → foreground, so each can move at a different rate. A scene's subject PNG is one full-canvas cutout, sometimes containing several figures. It is **not** a skeletal animation rig. Animate the whole cutout with restrained transforms unless you create a genuinely clean, separately masked part. Avoid a rubbery horse, independently moving limbs cut from a flat painting, stretched pixels, shaking text, and automatic endless motion that distracts from reading.

Give each moment a specific cue rather than one generic parallax preset:

- `00` handler and horse drift slowly into the page; near grasses pass faster.
- `10` caravan recedes laterally; use distance and small scale shift.
- `02` riders advance along the fort approach; background stays almost still.
- `01` the galloping cutout travels farther with a slight whole-body lift and dust sweep.
- `11` hold at the well, with a tiny settling motion and a slow heat shimmer behind it.
- `03` quiet stable hold; subject breathes with a barely perceptible transform.
- `12` hoof detail advances into view; foreground sand moves past and then pauses.
- `04` slow push toward the ears; avoid zooming past the anatomy or putting the ears under text.
- `13` a gentle traveling amble with small vertical cadence, not a gallop.
- `14` a restrained rhythmic step in the night procession; lantern glow may pulse subtly.
- `15` bard scene rests; embers and foreground drift while figures remain legible.
- `05` cavalry advances across the desert; dust crosses the join to the next passage.
- `06` stream crossing progresses slowly; subtle ripples may be CSS/canvas atmosphere.
- `16` one controlled diagonal leap tied to scroll progress, then release into the next scene. Keep the folklore label visible.
- `17` measured mounted march, calmer than the cavalry scene.
- `07` cart moves very slowly, with color and motion dropping away.
- `08` morning revival scene opens and warms; foreground flowers drift.
- `19` colt selection is mostly a still human moment with gentle camera push.
- `18` studbook detail reveals with a modest push or masked transition, no fake writing.
- `09` cadet and horse settle into a long, quiet final image; no perpetual looping hero animation.

Scroll backwards must reverse the visual story cleanly. Prefer deterministic scroll progress, scoped GSAP/ScrollTrigger or the site's established motion utilities, and transform/opacity animations. Keep text stationary on a solid reading surface while art moves. Use the existing root smooth-scroll connection; do not create a second Lenis instance. Pause offscreen work and clean up all timelines/observers on unmount. Respect `prefers-reduced-motion` and the reading toggle with a complete static version.

## Layout and asset handling

- Keep `SiteNav` distinct and readable. It is fixed at the top, 64 px on mobile and 80 px on desktop. Every hero and custom header needs at least `pt-24` mobile / `pt-28` desktop, or equivalent `clamp(5.5rem, 9vh, 7.5rem)`. No folio, control, label, or secondary bar may occupy the top 80 px.
- No overlapping text, badges, or controls. On mobile place painting and narrative in normal vertical order. Avoid tiny text over painted detail. Use flex-wrap and gap protection for secondary controls.
- The source canvases are nominally 16:9 at roughly 1672 × 941, and some transparent cutouts are one or two pixels narrower. Align all layers through a shared stage box with percentage sizing; inspect and tune any edge mismatch. Do not stretch figures independently of the background. The paintings are compositionally quiet on alternating sides, but check each crop at desktop and phone width.
- Preserve the original PNG masters. Create optimized WebP/AVIF derivatives with alpha where supported, or use a proven optimization approach for deployment. Load only the opening visual eagerly, lazy-load later assets with correct dimensions, and avoid mounting all 60 full-resolution images at once. Keep full fidelity where artwork is visible. Prevent layout shifts.
- Preserve an accessible HTML narrative, semantic headings, alt text for meaningful subject art, decorative alt for redundant B/F layers, keyboard-accessible chapter navigation, visible focus, and sufficient contrast.
- Do not add WebGL or a new 3D museum. Remove the current `MarwariMuseum` from `/legend`. Remove dead museum-specific code only after confirming it has no other consumers; do not touch unrelated user work.

## Deliver and verify

Implement the page and all necessary content/component/style changes, then run the appropriate lint, typecheck, and build gates. Start the site in a browser and capture **actual screenshots at 1440 × 900 and 390 × 844**, including the opening and representative middle/end scenes. Inspect the **top 120 px of every screenshot** for clear SiteNav separation and inspect every reading area for collisions and cropping. Check reduced-motion and reading mode. Verify that only opening assets load initially and later scenes load as needed. Fix issues before reporting completion. Report changed files, tests, screenshot paths, any remaining asset-alignment limits, and the final scene order.

The task is complete only when `/legend` has become this working, long-form Marwari scroll story, the museum opening is gone, the images animate as independent layers, and the page has been visually checked on desktop and mobile.
