# Three pieces the owner supplied (31 Oct 2026)

Three components pasted in by the owner, placed where they asked. Each is kept close to the code as supplied; only the words,
the colours and the reduced-motion behaviour were made the site's own.

| Piece | Where | Files |
| --- | --- | --- |
| **The robot** | `/command` ("The Command"), the full-screen opening scene: dark band, raking light, one heading and one line, robot on the right (moved from `/science` 31 Oct, owner's request) | `components/sections/command/CommandHero.tsx`, `components/ui/splite.tsx`, `components/ui/spotlight.tsx` |
| **The walking crowd** | `/tournaments`, the foot of the title scene; and the foot of the reels menu, above the word "Chapters", where the act zones (Hook / Proof / Convert) used to be (31 Oct) | `components/sections/tournaments/TournamentScenes.tsx` (`CircuitTitle`), `components/motion/CrowdCanvas.tsx`, `public/animations/crowd-peeps.png` |
| **The chart set** | `/admin` (and the SAMPLE preview at `/dev/admin-dashboard`), above the existing dashboard | `components/sections/admin/dashboard/EnquiryBento.tsx`, `components/ui/analytics-bento.tsx` |

## The robot (Spline)

_31 Oct 2026: now on `/command` (`CommandHero.tsx`); the notes below were written for its earlier place on `/science`._

- The scene is Spline's own, streamed at runtime from `prod.spline.design`; the animation is untouched. Only the wording changed
  ("Machines measure. / Horses teach.", setting up the page's own subject) and the robot was centred rather than set beside the text.
- **New dependency:** `@splinetool/react-spline` (with `@splinetool/runtime`, about a megabyte). It is `lazy`-loaded, so nothing is
  fetched until `/science` is opened.
- **CSP** (`next.config.mjs`): `prod.spline.design`, `assets.spline.design` and `cdn.spline.design` are allowed for `connect-src`
  and `img-src`; the runtime also pulls two WebAssembly files from unpkg, narrowed by path to `https://unpkg.com/@splinetool/`.
- If the CDN is unreachable the scene is simply absent: `SplineScene` has an error boundary, so the page and the headline stand.
- The scene is framed by Spline for a wide stage, so on a narrow screen the canvas is held at a minimum width and centred;
  otherwise the robot falls outside the view.
- **Not covered:** the robot itself cannot be made still for reduced motion (it is Spline's own idle animation inside their runtime).
  The raking light does respect it. If the owner wants the whole scene off on a phone, hide the wrapper under `md:`.

## The walking crowd (canvas + GSAP)

- `gsap` was already a dependency; nothing new was installed.
- The sprite sheet was downloaded from the CDN in the snippet and now lives in the repository (`public/animations/crowd-peeps.png`,
  3600 × 2268, 15 × 7 figures), so the page does not depend on someone else's CDN.
- `scale` was added to the component: the figures are drawn at about half size so whole people fit the band.
- **Reduced motion:** the crowd is drawn once and stands still (no GSAP ticker). Checked in a browser both ways.
- **Attribution:** Skiper UI's free version requires it; the credit block is kept verbatim at the foot of `CrowdCanvas.tsx`.
  The figures are Open Peeps.

## The chart set (staff dashboard)

- Wired to the **real enquiry snapshot**, not to the demo's invented sales figures: the 30-day trend, this window against the one
  before it, every form as a treemap over 7/30/90 days, and the week's shape as a radar. Counts and names only — no contact detail
  ever reaches it, exactly as before.
- The demo's shadcn surface names (`bg-card`, `text-muted-foreground`, …) are defined in `app/globals.css` as aliases of the role
  tokens, so the cards follow `.tone-dark` like everything else. The chart colours stay vivid on purpose.
- **Changed from the snippet:** a figure that fell used to render as a green rise — the arrow now turns over and drops the green.
  A jump off a near-empty window is shown as `>999%` rather than four digits of noise.
- SAMPLE data is labelled on the page, as the claims rule requires.
- It sits **above** the existing live dashboard; nothing there was removed.

## Rights, please confirm

The Spline scene, the Open Peeps sheet and the chart set were all supplied by the owner from third-party sources. The Skiper UI
and vasnev.art credits are in place. Confirm the academy is entitled to use the Spline scene in particular — it is streamed from
Spline's account CDN, not from this repository.

## Not verified

A real phone or GPU; Safari and Firefox; how the Spline scene behaves on a slow connection (the runtime is about a megabyte).

## CSP note (1 Nov 2026)

The robot's face is a video layer on the head material, delivered inside the scene file as a `data:video/mp4` URI. `media-src` in `next.config.mjs` therefore lists `data:`; without it the browser blocks the video and the robot shows no eyes.
