# Black Stallion website — exact implementation brief

You are working in `/Users/stingraj/blackstallion-website`.

Implement every item below in the existing Next.js codebase. Do not reinterpret the brief, introduce a new visual language, or add generic AI-style sections. Reuse the current brand system, components, content, routes, forms, and authentication. Preserve unrelated work already in the working tree.

## Required preparation

1. Read `/Users/stingraj/blackstallion-website/AGENTS.md` before editing.
2. This project uses Next.js 16.4.2. Before changing Next.js code, read the relevant guides under `node_modules/next/dist/docs/`, especially Server and Client Components, images, CSS, and routing.
3. Inspect the current implementation and all existing uncommitted changes before editing. Do not overwrite unrelated user changes.
4. Use the supplied reference implementation as the source for the anatomy exhibit:
   `/Users/stingraj/Downloads/the_black_stallion_academy_one_conversation_two_bodies_3d_marwari_equine_anatomy (1).html`
5. Treat the three pasted component documents as reference material only. Do not blindly install their ChatGPT clone UI or Radix dependencies. Adapt only the requested behavior to the existing Black Stallion design system.

## Global design rules

- Keep the site palette light and equestrian: ivory, parchment, saddle brown, warm leather, and restrained brass.
- Avoid large dark sections unless a cinematic image specifically needs a dark caption treatment.
- Avoid generic SaaS cards, decorative gradients, excessive rounded boxes, fake dashboards, and repeated `01 / 02 / 03` labels unless the content is a real sequence.
- Use large, clear photographs as the main visual. Place names and roles in clean text beneath images rather than overloading the image with UI.
- Maintain the existing display serif and restrained sans-serif hierarchy.
- The fixed `SiteNav` is 64px on mobile and 80px on desktop. Every page hero, 3D canvas, slideshow, or custom header must start below it with at least `pt-24`, `pt-28`, or an equivalent safe area.
- No badge, button, caption, replay control, secondary nav, or heading may occupy the top 80px.
- Never allow text, controls, or labels to overlap at any breakpoint.
- All flex-based control rows must wrap with safe gaps on smaller screens.
- Respect `prefers-reduced-motion`.
- Pause costly canvas or animation work while it is outside the viewport.

## 1. Replace the anatomy interaction everywhere

Routes/components involved:

- `/anatomy`
- Homepage anatomy/somatic section
- `components/sections/anatomy/DualBody.tsx`
- `components/sections/home/SomaticMap.tsx`
- `components/sections/home/Matrix.tsx`

Required outcome:

- Remove the old dark “One conversation. Two bodies.” anatomy implementation.
- Replace it with one shared light interactive exhibit based on the supplied HTML file.
- Do not keep the old and new anatomy sections together. There must be only one “One conversation. Two bodies.” implementation in the product.
- Use the supplied exhibit’s ivory/parchment background, brown anatomy model, brass lines, three connection choices, layer controls, gait controls, explanatory panel, and projected labels.
- Make the cadet rider visible by default. The cadet must visibly sit on the horse, including torso, head, arms/hands, legs, and boots; do not leave only a spine label or invisible silhouette.
- Keep these three connections and their existing approved copy:
  1. Cervical alignment → Ears & attention
  2. Core posture → Withers & seat
  3. Lumbar balance → Reins & contact
- Clicking a connection must update the selected anatomy areas, explanatory copy, labels, and camera framing.
- The horse must be fully visible and visually dominant without cropping its muzzle, tail, or hooves.
- On desktop, the horse and rider should fill most of the central stage while leaving dedicated text space on the left and choices on the right.
- On mobile, stack the content. Keep all controls readable, keep the complete horse in frame, and avoid horizontal scrolling.
- The model must move. Provide a subtle idle breathing/sway loop and working Walk, Trot, and Canter playback. The Play movement button must actually start and stop the gait animation.
- The animation must not become stuck after scrolling away and returning.
- If the exhibit is isolated in an iframe, allow only same-origin framing, host its scripts/styles locally, report its height to the parent, and pause rendering while offscreen. Do not rely on third-party runtime scripts.
- Remove visitor-facing developer tools such as GLB import, reference calibration overlays, audit reports, implementation reports, and WebGL diagnostic controls.
- Keep an accessible non-WebGL fallback with the same information if WebGL fails.

## 2. Restore and repair the original homepage horse animation

Routes/components involved:

- `/`
- `components/sections/home/HorseSequence.tsx`
- `components/sections/home/HorseSequence.module.css`

Required outcome:

- Restore the existing horse frame-sequence section to the homepage before the instrument/anatomy section.
- Use the existing frames in `public/images/horse-sequence/`.
- Keep the three existing chapters: Presence, Connection, and Movement.
- The frame sequence must load when approaching the section, respond to scroll, and draw the correct frame even if the visitor enters the section midway through the page.
- It must not remain stuck on frame one after frames finish loading.
- Keep the stage below the fixed navigation on desktop and mobile.
- Keep the existing non-JavaScript/reduced-motion still-image fallback.

## 3. Keep horse equipment in one place only

Routes/components involved:

- `/equipment`
- `/safety`
- `/anatomy`
- `components/sections/equipment/HorseEquipmentSection.tsx`

Required outcome:

- Keep the horse shoes and equipment section only on `/equipment`.
- Remove duplicate uses from `/safety` and `/anatomy`.
- Do not delete the shared component itself.

## 4. Repair the curriculum horse-and-hand hero

Routes/components involved:

- `/curriculum`
- `components/sections/curriculum/BondHero.tsx`
- `components/3d/HorseHandBond.tsx`

Required outcome:

- Use a light ivory full-width presentation based on the supplied horse-and-hand reference.
- The horse must enter from and touch the left visual edge. The human sleeve/hand must reach the right visual edge.
- The horse muzzle and fingertip should nearly meet at the intended central contact point.
- Add a subtle, continuous motion between them: horse breathing, slight muzzle movement, and a small hand drift. The movement must feel alive, slow, and intentional.
- Do not crop the horse eye, muzzle, or fingertips.
- Do not overlay long copy on top of the horse. Put the heading and short supporting text in a dedicated block below the visual.
- Use this copy:
  - Label: `Phase 01 · The Covenant`
  - Heading: `The stillness before the command.`
  - Body: `Every great partnership begins in silence. Before the saddle is cinched or the reins are gathered, the cadet learns the discipline of touch.`
  - Closing line: `A quiet approach. A shared rhythm.`
- The model must remain large enough on mobile; do not shrink it to a small object floating in empty space.

## 5. Simplify the curriculum rank/ledger section

Routes/components involved:

- Homepage ledger section
- `components/sections/home/LedgerAscent.tsx`
- Existing data in `lib/content/curriculum.ts`

Required outcome:

- Remove the crowded constellation layout with 13 labels positioned over the rider image.
- Use one full-width high-quality riding or instruction photograph.
- Present the four ranks as a clean selectable row/grid below or beside the image:
  - Cadet Squire
  - Cadet Rider
  - Cadet Knight
  - Sovereign Lancer
- When a rank is selected, show only its corresponding pillars and existing approved descriptions in a clear list or expandable rows.
- Keep the existing curriculum data and route link. Do not invent new ranks, claims, or lesson descriptions.
- No overlapping labels on the photograph.

## 6. Fix the fleet/studbook image section

Routes/components involved:

- `/fleet`
- `components/sections/editorial/ReferencePanels.tsx`
- The `MarwariPortrait` section

Required outcome:

- Remove the unstable liquid/fade reveal for the Marwari portrait.
- Use a clear, uninterrupted high-quality Marwari photograph at full width.
- Keep the image correctly contained on desktop and mobile; do not leave a large blank area beside a cropped image.
- Use a light palette around the image.
- Keep the existing approved title, short lineage copy, and link to `/legend`.
- Avoid faded UI, low-contrast text, and cropped half-panels.

## 7. Simplify the Citadel/campus configurator

Routes/components involved:

- `/schools`
- `components/sections/schools/CitadelConfigurator.tsx`
- `components/sections/schools/citadel/CitadelScene.tsx`
- Related Citadel styles in `app/globals.css`

Required outcome:

- Keep the 3D campus configurator and existing data/ROI/MOU behavior.
- Remove the heavy white gradient/fade that obscures the campus model.
- Use a solid, readable editorial column for the headline and actions, and a visually clear 3D viewport for the campus. Do not wash the whole viewport with a gradient.
- The opening section must have enough height for the model, controls, campus cards, and KPI row. Nothing may be cut off at 1440×900.
- Keep all scene controls below the global navigation.
- Pins and labels must not overlap the editorial copy or one another.
- On mobile, stack the editorial copy, model, controls, and campus choices in normal document flow. Hide projected labels when there is no safe space for them.
- Preserve the existing enquiry and MOU actions.

## 8. Redesign the Sovereign Council with real image placeholders

Routes/components involved:

- `/schools`
- `components/sections/schools/SovereignCouncil.tsx`

Required outcome:

- Replace the four dark initial-only cards with a light editorial people layout.
- Use one large portrait per seat, then show the role and responsibility below the image.
- Use the existing four proposed seats and wording. Do not invent real names or imply appointments are confirmed.
- Every portrait must be described as an illustrative placeholder until an approved member portrait is supplied.
- Use locally stored images and record their source/license in the repository.
- Avoid small nested cards, dark backgrounds, and accordion clutter.
- Mobile: one portrait per row. Tablet: two. Desktop: four.

## 9. Simplify the contact corridor choices

Routes/components involved:

- `/contact`
- `components/sections/contact/Gates.tsx`

Required outcome:

- Preserve all three existing enquiry corridors and their existing forms:
  - Enrol a cadet
  - Partner your campus
  - Schedule a board audit
- Replace the three oversized arch cards with a restrained editorial selector using simple top rules, generous spacing, short copy, and email addresses.
- Selecting a corridor must still update the URL and display the correct existing form.
- Keep the active state obvious without using large dark fills.
- Email addresses must wrap safely on mobile.

## 10. Redesign the information desk/prompt section

Routes/components involved:

- `/command`
- Homepage information-desk teaser if present
- `components/sections/command/Terminal.tsx`
- `components/sections/command/Terminal.module.css`
- `components/sections/command/CommandExperience.module.css`

Required outcome:

- Keep the existing approved questions, scripted answers, fees, reset behavior, and demo disclaimer.
- Replace the large framed chat dashboard with a simpler branded academy prompt surface inspired by the supplied “How Can I Help You” reference.
- Use one heading: `What would you like to know?`
- Supporting text: `Ask the academy about riding, enrolment or your campus.`
- Show the suggested questions as quiet text choices with separators.
- Use one large, clear input surface with the existing send action.
- Do not automatically inject a question/answer on load in the editorial version. Let the visitor choose or type first.
- Once a question is asked, show the conversation clearly below the prompt.
- Keep the ivory/brown academy styling. Do not copy ChatGPT branding, generic tools, microphone controls, or image-upload controls.
- Mobile must remain clear with no clipped heading, input, or choices.

## 11. Add and connect the staff/admin entry

Routes/components involved:

- `components/site/SiteNav.tsx`
- `/admin/login`
- `app/admin/login/page.tsx`
- Existing admin forms/authentication

Required outcome:

- Add a small staff/user icon to the global navigation.
- Link it directly to `/admin/login`.
- Do not create a second authentication system. Use the existing sign-in form and existing secure admin routes.
- Redesign the login screen to match the public site: academy crest, ivory background, brown typography, existing email/password form, existing reset link.
- Use the heading `Welcome to the academy` and retain the staff-only explanation.
- Keep all authentication, validation, error handling, redirects, and authorization checks unchanged.

## 12. Navigation treatment

- Make the global navigation consistently legible over all updated light sections.
- Use a solid or nearly solid brand surface with a subtle bottom rule where needed.
- Retain all existing primary navigation, sound toggle, enrol CTA, and Reels menu.
- The staff icon must have an accessible label and keyboard focus state.
- Check the top 120px of every updated page for collisions.

## Required verification

Do not declare completion until all of the following pass:

1. Run `npm run typecheck`.
2. Run the relevant ESLint checks on every edited TS/TSX file.
3. Run `npm test`.
4. Run `git diff --check`.
5. Test the anatomy controls: all three connection cards, all four view modes, Play/Pause, Walk, Trot, Canter, previous/next, and return after scrolling offscreen.
6. Test the contact corridor selector and verify each existing form appears.
7. Test the information desk by selecting a suggested question, typing a custom question, sending it, and resetting it.
8. Test the staff icon and verify it opens `/admin/login` without bypassing authentication.
9. Capture and inspect real browser screenshots at exactly:
   - Desktop: 1440×900
   - Mobile: 390×844
10. Capture both sizes for these routes/sections:
   - `/` horse sequence, anatomy, and ledger
   - `/anatomy` new dual-body exhibit
   - `/curriculum` horse-and-hand hero
   - `/fleet` Marwari portrait
   - `/safety`
   - `/schools` Citadel and Sovereign Council
   - `/contact` corridor selector and selected form
   - `/command` prompt and answer state
   - `/admin/login`
11. In every screenshot, inspect the top 120px and confirm the fixed navigation is distinct, unobstructed, and readable.
12. Confirm `document.documentElement.scrollWidth === window.innerWidth` on mobile for every checked route.
13. Check the browser console. Resolve application errors. Known browser-extension modifications may be documented only if they are proven unrelated to the application.

## Completion report

When finished, report:

- Exactly which files changed.
- Which duplicate sections were removed and where the single remaining version lives.
- Which interactions were tested.
- The commands and results for type checking, linting, tests, and diff checks.
- The paths to every desktop and mobile screenshot.
- Any remaining limitation, with the specific cause and file involved.

Do not stop after producing a plan. Implement, test, visually inspect, correct problems found in screenshots, and finish the complete set of changes.
