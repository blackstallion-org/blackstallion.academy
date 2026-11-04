# The unveiling openings and the studio plate (28 Oct 2026)

Two changes the owner asked for after seeing the lantern effect on `/fleet` and a studio render of a black horse:

1. **The 3D living horse is back on the Instrument plate** (`/anatomy`), now lit and framed like that render.
2. **Three pages open with an unveiling**: first a white marble statue, then the lantern carried over it turns it into the living stallion,
   then the lit horse holds the frame and the page's own light and images follow. The three beats never share the screen.

## The unveiling

`components/sections/shared/Unveiling.tsx`, content in `lib/content/unveiling.ts`, mounted before the title card of `/anatomy`
("The Instrument"), `/curriculum` ("The Ledger") and `/parents` ("The Guardian").

- **Stills.** Six pictures made with Higgsfield (GPT Image 2.5, 28 Oct 2026): a marble statue for each page, and its living twin generated *from the
  statue* as the reference, so the pose and the framing line up. They are placeholder art and the page says so. Each has a neural depth map made with
  `scripts/make-depth.py` (Depth Anything V2 Small, Apache-2.0; see `docs/THIRD_PARTY.md`).
- **How it works.** A pinned scene (4.2 screens, `PinnedScene`). Both pictures stay on screen as photographs; the relighting shader
  (`components/3d/relight`) draws a lantern's light over each *on top of* its photograph (screen blending), so the statue stays white and keeps its
  veining, and the black coat keeps the studio's rim light. The living picture is revealed through a circle that grows from the lantern as the page
  scrolls. The lantern follows the scroll along a path, the pointer (or a finger), or the arrow keys when the picture has focus. The headline lines
  fade one after another with a gap, never over each other.
- **Fallbacks.** No WebGL: the two photographs and a CSS glow carry the same reveal. Reduced motion: nothing is pinned; the statue block and the
  living block follow each other.
- **Measured** (1440 × 900, headless Chrome, Metal): scrolling the whole unveiling in 4 s gave 241 frames, median 16.7 ms, 95th percentile
  17.8 ms, worst 22.6 ms; at most two canvases exist at once (the statue's stops drawing once the horse is revealed).

## The plate

`components/sections/anatomy/Anatomy3DHorse.tsx` (+ `components/3d/studio-floor.ts`, `SpecimenPlate.tsx`).

- **Framing.** The overview looks at the horse's left side, a little from the front, from just above the floor. It no longer circles to face the
  camera head-on; it turns back and forth through about ±15° (still under reduced motion). The camera distance is fitted to the shape of the plate, so
  the whole horse fits wide or square. On a phone the 3D plate is 4:5 (the archive plate keeps 4:3) so the controls do not cover the horse.
- **Light.** A low-key studio: a modest key so the face reads, no flat fill, strong edge lights from behind on both sides that draw the crest, the
  croup and the legs of a black coat, a warm pool of light behind the animal and a vignette (colours read from the page's tokens).
- **Floor.** A glossy floor that mirrors the horse, softened and fading with distance from the hooves (three's `Reflector` with a custom shader, drawn
  at half resolution). It is a second render of the scene, so it is on only where `lib/3d/device-tier.ts` says "high"; phones and tablets keep
  the soft contact shadow.
- **Tail.** The tail is hair cards driven by a few bones and read as one stiff plank from the side, so its flutter is livelier and the strand highlight
  is halved. It is better, not solved.
- **Measured** (same setup): 61 frames a second with the reflection on, in three one-second samples on `/anatomy`; the home page's plate read 61, then 45 once (that page has other heavy scenes running).
- The hotspot views (ears, neck, hoof) keep working under the new light; the hoof view shows the walking legs mirrored in the floor.

## What was checked

Screenshots in `docs/qa/unveiling-and-plate/` at 1440 and 390 px: the three openings at several scroll positions, the phone layout, reduced motion, no WebGL,
keyboard steering (arrow keys move the lantern; the picture shows a focus ring), the plate on desktop and phone, and three hotspot views. No console error came
from these components in any of them. `npm run lint` and `npx tsc --noEmit` pass, and so does `npm run build`.

## Limits to know about

- **Not checked:** a real phone or an integrated GPU. The reflection and the two relight canvases were only measured on a fast Apple-silicon GPU.
  (`npm run build` was run later, with the whole branch, and passes: `/anatomy`, `/curriculum` and `/parents` prerender.)
- The horse is the existing model: the plate looks much closer to the studio render, but it is not a photograph; the mane and tail cards still show
  at some angles.
- The stills are AI placeholder art with a depth map estimated from each picture; the lantern's relief is an approximation of real geometry.
- **Files this work depends on that another session wrote and had not committed:** `components/3d/relight/*` (the relighting shader, MIT, from the
  Codrops demo) and `components/3d/ErrorBoundary.tsx`. They are committed together with this work so the pages build; they are otherwise unchanged.
  `app/anatomy/page.tsx` also contains that session's own uncommitted edits (a marble `RelightScene` section, the equipment section removed); only
  the lines for the unveiling are in this commit.
