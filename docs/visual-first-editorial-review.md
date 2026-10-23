# Visual-first editorial review

The review covered the public site routes and shared visual systems. The redesign keeps the existing copy, controls, and animation systems; it moves explanatory material to clear reading bands beneath the visual it explains.

## Findings and applied treatment

| Area | Readability issue found | Editorial treatment applied |
| --- | --- | --- |
| Home | Long captions and data competed with film frames, the horse sequence, the matrix, the ledger, and the closing image. | Kept poster headlines on the stages; placed chapter descriptions, matrix evidence, ledger explanation, and closing details below each visual. |
| Legend | History, route copy, and the Three Reasons copy sat over changing desert photography. | Kept the large narrative words on imagery and moved the route key, history, and explanatory passages into parchment reading sections. |
| Curriculum | Discipline names and supporting copy were low-contrast over busy riding photography. | Converted the discipline sequence into image-first panels with numbered titles and full descriptions underneath. |
| Fleet | The active horse dossier and gallery metadata obscured the portal and photography. | Moved the active dossier and gallery traits below the stage; selection, modal inspection, and camera controls remain in place. |
| Schools | Welcome copy and configuration explanation obscured the 3D geographic and pavilion scenes. | Separated the 3D stages from their headings and notes, keeping controls clear and the detail in a reading band. |
| Anatomy and science | Technical labels, measurements, and interpretation competed with the horse study. | Retained the interactive plate, hotspots, axes, and wave animation; placed descriptive and evidence content below the image/canvas. |
| Contact, journal, and articles | Photo captions and form prompts shared limited visual space with images. | Put imagery above solid copy and retained the existing forms, validation, journal navigation, and article content. |
| Shared film components | Reels, WebGL transitions, slideshows, and end cards repeated small caption overlays. | Kept navigation, progress, autoplay, swipe, and shader controls; made titles the only material over imagery and moved supporting captions below. |

## Route coverage

Reviewed and updated through shared components where applicable: `/`, `/legend`, `/anatomy`, `/statue`, `/lithos`, `/science`, `/why`, `/curriculum`, `/fleet`, `/cadets`, `/parents`, `/safety`, `/equipment`, `/schools`, `/schools/[slug]`, `/schools/access`, `/schools/mou`, `/verify`, `/verify/[code]`, `/tournaments`, `/tournaments/[slug]`, `/journal`, `/journal/[slug]`, `/about`, `/lore`, `/command`, `/contact`, and `/privacy`.

## System rules now in use

- Visual stages carry a headline only; dense copy lives on an adjacent solid surface.
- Supporting text uses a readable editorial measure, increased line height, and responsive type sizing.
- Interactive canvases, 3D models, video, and animated scenes retain clear space for controls and subjects.
- Existing BSAH ivory, parchment, chestnut, charcoal, and antique-gold tokens remain the visual foundation.
- The first-visit and internal-route loader is a compact, fast-running realistic Marwari sprite. The first-visit treatment is skipped for reduced-motion preferences and repeat visits in a session.

## Verification

- `npm run typecheck` passed.
- `npm run build` passed after the editorial changes.
- The public routes above, including one representative page for each dynamic route, returned HTTP 200 locally.
- Desktop and mobile visual checks were made for the curriculum discipline panels, contact layout, and the site loader. The loader horse measures as a small centered mark rather than a hero-scale image.

The audit did not submit a form, modify private access data, or benchmark physical devices. Those flows and performance characteristics retain their existing behavior and need production-device testing before launch.
