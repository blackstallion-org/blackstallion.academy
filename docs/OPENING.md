# The home page opening and the running-horse loader (30 Oct 2026)

Both use the three files the owner supplied, **placed as they are** (an earlier version rebuilt them into cut-outs and a traced silhouette;
the owner did not want that and it was deleted).

| Piece | What the visitor sees | Where |
| --- | --- | --- |
| **Opening** | First visit of a session, home page only, about 5.6 s: the first ink-horse picture, a dissolve to the second, the line "An 800-year lineage, handed to your child." in the site's two voices, then the page. Skippable at any moment. | `components/motion/OpeningFilm.tsx`, `public/opening/ink-1.webp`, `ink-2.webp` |
| **Running horse** | The loader (first visit and every page change) shows the supplied running-rider GIF. | `components/motion/RunningHorse.tsx`, `public/opening/loader.gif` |

## See it, switch it off, undo it

- **See it again** in the same visit: `/?opening`. Never shown with reduced motion or `?noload`.
- **Switch off without touching code** (set the variable, redeploy): `NEXT_PUBLIC_OPENING=off` (no opening); `NEXT_PUBLIC_LOADER_HORSE=pixel` (the earlier pixel horse).
- **Undo in code**: `git revert` the commit that introduced it (`90ee705`) and the one that simplified it.
- **Swap a picture**: replace the file in `public/opening/` with the same name.

## How it works

- The head script (`lib/opening/boot.ts`) marks `<html data-bsah-opening>` on a first visit to `/` and requests the first picture. The loader waits for
  the opening's pictures to be decoded, then finishes; when it is gone the opening starts. If a picture does not arrive there is no opening.
  A 12 s head timer and a 16 s CSS timer mean nothing can hold the page. The hero film waits until the opening ends.
- The pictures are multiplied into the page's ivory (their white has no box). The ink pictures fill the screen (`object-fit: cover`) and push in slowly.
- Skip button, Escape or a click ends it; focus stays on Skip; the page behind cannot scroll; silent; hidden for reduced motion.

## Where the pictures came from (please confirm the rights)

Two frames of a hand-drawn ink-horse animation and a 15-frame galloping-rider GIF, supplied by the owner. The ink frames look like parts of
another film, and the GIF's fill is printed paper that carries third-party lettering ("Roku") that is visible in the loader. No licence
note exists in the repository. Confirm the academy holds the rights to all three, or replace them.

## Not verified

Real phone or GPU speed; Safari and Firefox; windows other than 1440 x 900 and 390 x 844. In the software-rendered test browser the home page itself
blocks the main thread for several seconds at start-up (with or without the opening), which delays when the opening's overlay is removed.
