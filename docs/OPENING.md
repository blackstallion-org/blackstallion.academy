# The first-visit opening and the running-horse loader (updated 7 Nov 2026)

**Sequence:** running-horse loader (when a load needs one) → the Four Worlds intro film (first visit only) → a slow fade into the home hero → normal smooth
scrolling. On later visits and reloads the homepage opens directly.

| Piece | What the visitor sees | Where |
| --- | --- | --- |
| **Loader** | On a first load in a session, or a click to another section: the running rider on the page's ivory while it loads, then a short fade. **No zoom** (the old horse-zoom opening was removed 7 Nov 2026). | `components/motion/Loader.tsx`, `RunningHorse.tsx`, `public/opening/loader.gif` |
| **Intro film** | A visitor's first visit to `/`: the Four Worlds film plays by itself (no scrolling needed). At its end the page appears beneath it and the film fades over 2.8 s into the home hero. | `components/worlds/WorldsIntro.tsx`, `FourWorlds.tsx`, `lib/opening/intro-boot.ts` |

## Remembering that it was seen

- Completion is stored in **localStorage** (`bsah-intro-seen`) when the film ends or is skipped, by `markIntroSeen()` (falls back to sessionStorage if localStorage
  is blocked). Reloads, new tabs and later visits skip the intro and open the homepage directly. Closing the tab halfway through plays it again next time.
- The loader keeps its own per-session flag (`bsah-loaded`), so a new browser session shows the running horse (no film) before the homepage.
- **See the intro again:** `/?intro` (clears the flag). Never plays with reduced motion, data saver, a very slow connection, `?nointro` or `?noload`.
- **Replay page:** `/worlds` plays the same film as a page; when it ends the homepage rises from black.

## The fade into the hero

The boot script hides the page under the film only while `<html data-bsah-intro="1">`. When the film ends, `WorldsIntro` sets the marker to `"reveal"`:
the page becomes visible beneath the film, the hero film is told to start (`bsah:loader-gone`), and the film's stage fades from opaque to clear
(`.root` opacity transition, 2.8 s). The marker is removed and scrolling returns (`done`) after 3 s. No cut to black, no zoom, no layout jump.

## Switches

- `NEXT_PUBLIC_LOADER_HORSE=pixel` (redeploy): the earlier pixel horse in the loader. (`NEXT_PUBLIC_OPENING` and `?opening` no longer exist.)
- **Swap the picture**: replace `public/opening/loader.gif` (keep the name; it is shown at 500 x 333 proportions).

## Where the picture came from (please confirm the rights)

A 15-frame galloping-rider GIF, supplied by the owner. Its fill is printed paper that carries third-party lettering ("Roku"), visible in the loader as
the owner asked. No licence note exists in the repository. Confirm the academy holds the rights, or replace it.

## Not verified

Real phone or GPU speed; Safari and Firefox; windows other than 1440 x 900 and 390 x 844. The film's total length was seen on a software-rendered
Chromium (about 1 minute), not on a device.
