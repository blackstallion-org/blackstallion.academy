# The home page opening and the running-horse loader (30 Oct 2026)

One supplied file, **placed as it is**: the 15-frame running-rider GIF, `public/opening/loader.gif`. (Earlier versions rebuilt the supplied pictures
into cut-outs and a traced silhouette, then used two ink-horse frames as a separate opening film. The owner did not want that; all of it was deleted.)

| Piece | What the visitor sees | Where |
| --- | --- | --- |
| **Loader** | On a first load, a reload, or a click to another section: the running rider on the page's ivory while it loads, then a short fade. | `components/motion/Loader.tsx`, `RunningHorse.tsx`, `public/opening/loader.gif` |
| **Opening** | The first visit of a session, home page only: the same running rider, and then, instead of the fade, the camera **zooms into the horse** (2.3 s) until it fills the screen, then fades (0.6 s) and the website is there. | the "zooming" phase of the same loader; `RunningHorse.module.css` (`into`), `Loader.module.css` (`opens`) |

The opening is not a separate overlay: it is the loader's last step on the first visit to `/`. Reloads and page changes never zoom.

## See it, switch it off, undo it

- **See it again** in the same visit: `/?opening`. Never shown with reduced motion (no loader at all) or `?noload`.
- **Switch off without touching code** (set the variable, redeploy): `NEXT_PUBLIC_OPENING=off` (the first visit ends in the plain fade, no zoom);
  `NEXT_PUBLIC_LOADER_HORSE=pixel` (the earlier pixel horse in the loader).
- **Undo in code**: `git revert` the commit that introduced the zoom (the one after `0ea1efc`).
- **Swap the picture**: replace `public/opening/loader.gif` (keep the name; it is shown at 500 x 333 proportions).

## How it works

- The head script (`lib/opening/boot.ts`) decides before first paint whether the loader shows (not when seen this session, reduced motion or `?noload`;
  `?opening` forgets the session) and requests the GIF at once.
- The GIF is multiplied into the page's ivory (`mix-blend-mode: multiply`), so its white ground has no box.
- At the end of the first load on `/`, the loader goes to a "zooming" phase: the GIF scales from 1 to 22 over 2.3 s (origin at the horse's chest, behind the rider,
  ease-in) with the overlay fully opaque; only once the horse fills the screen does the overlay fade (0.6 s). The overlay is removed after 2.95 s.
- Nothing else waits on it: the hero film starts as it did before, and the 3.5 s / 4.5 s / 6 s deadlines of the loader still stop it whatever happens.

## Where the picture came from (please confirm the rights)

A 15-frame galloping-rider GIF, supplied by the owner. Its fill is printed paper that carries third-party lettering ("Roku"), visible in the loader as
the owner asked. No licence note exists in the repository. Confirm the academy holds the rights, or replace it.

## Not verified

Real phone or GPU speed; Safari and Firefox; windows other than 1440 x 900 and 390 x 844. In the software-rendered test browser the zoom is
slow to render, so it was checked by scrubbing the two CSS animations to fixed times rather than by watching it play.
