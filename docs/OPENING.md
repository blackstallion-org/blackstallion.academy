# The home page opening and the running-horse loader (30 Oct 2026)

Two pieces, both built from three animations the owner supplied. Built to be easy to judge and easy to undo.

| Piece | What the visitor sees | Where |
| --- | --- | --- |
| **Opening** | First visit of a session, on the home page only: two shots of an ink horse at the gallop (about 5.6 s), then the line "An 800-year lineage, handed to your child.", then the page. Skippable at any moment. | `components/motion/OpeningFilm.tsx` |
| **Running horse** | The loader (first visit, and on every page change) is now a rider on a galloping horse, drawn as an ink silhouette that fills from the hooves as the page loads and completes when it is ready. | `components/motion/SilhouetteRunner.tsx`, used by `Loader.tsx` |

## See it, switch it off, undo it

- **See it again** in the same visit: add `?opening` to the home page address (`/?opening`). Never shown with reduced motion or `?noload`.
- **Switch off without touching code** (set the variable, redeploy; remove it to bring the piece back):
  - `NEXT_PUBLIC_OPENING=off`: no opening.
  - `NEXT_PUBLIC_LOADER_HORSE=pixel`: the earlier pixel horse in the loader again.
- **Undo completely**: the whole change is one commit; `git revert <that commit>`. Nothing else in the site depends on it except three small
  additions (the loader waits for the opening's pictures and says when it is gone; the hero film waits for the opening to end; the head
  script is built in `lib/opening/boot.ts`), and they all do nothing when the opening is off.

## How it works (so it can be changed)

- **Shots.** Each ink frame was a single still, so each is split into a plate (the picture with the horse and its shadow painted out) and the
  cut-out horse. The plate slides under the horse, which gallops in place (a bob and a lean) with a soft shadow, while the stage slowly
  pushes in; shot 2 dissolves in over shot 1. All of it is CSS (`OpeningFilm.module.css`; times are seconds from the moment the loader has
  gone, and the `master` animation is the clock). The two lines are the site's own two voices (`.t-inscribe`, `.t-voice`).
- **Order.** The head script (`lib/opening/boot.ts`) marks `<html data-bsah-opening>` on a first visit to `/` and requests the first shot's
  pictures. The loader waits until the opening's pictures are decoded, then finishes; when it has gone the opening starts. If the pictures do
  not arrive, there is simply no opening. A last-resort timer (12 s in the head script, 16 s in CSS) means it can never hold the page.
- **Fast.** All pictures together are about 190 KB (plates 31 KB each, horses 4 KB each, the loader's 15 poses 71 KB), requested in the head.
- **Accessible.** A labelled modal dialog; focus goes to Skip and stays there; Escape, the Skip button or a click anywhere ends it; the page
  behind cannot scroll; focus returns afterwards; silent; hidden for reduced motion. Skip is at the foot of the screen, clear of the navigation.
- **Pictures.** Regenerate with `node scripts/make-opening-assets.mjs` from `scripts/opening-source/` (kept out of deployments). It writes
  `public/opening/*.webp` and `lib/opening/layout.ts`.

## Where the pictures came from (please confirm the rights)

The owner supplied three files in this session: two frames of a hand-drawn ink-horse animation (`ink-horse-1.webp`, `ink-horse-2.webp`) and a
15-frame galloping-rider GIF (`gallop-silhouette.gif`). The ink frames are used as supplied (the horse cut out and enlarged). The GIF's pixels carry
a collage of printed paper with third-party lettering, so **only its outline is used**, painted in the site's own ink; none of its lettering
or colour is shown. None of the three has a licence note in the repository. **Before launch, confirm that the academy holds the rights to
all three** (the ink frames and the gallop cycle look like parts of other people's films), or replace them: only the three files in
`scripts/opening-source/` need to change.

## Not verified

Speed and smoothness on a real phone or GPU (checked only in a software-rendered browser: the opening's own clock ran at 5.8 s, but
a busy development server delayed it once to 9 s); Safari and Firefox (the sprite uses CSS `mask-image`, with the `-webkit-` form too);
the opening on very wide or very short windows beyond 1440 x 900 and 390 x 844.
