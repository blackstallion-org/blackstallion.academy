# Prompt: owner's visual pass, 14 Nov 2026

Paste everything below the line into a new Claude Code session on `blackstallion-org/blackstallion.academy`.
The owner's reference photos (taken of `localhost:3000`) are in `docs/prompts/2026-11-14-visual-pass/`, numbered in the
order of the tasks below. Look at each one before you start that task.

---

You are working on the BSAH website (Next.js 16, see `CLAUDE.md`, `AGENTS.md` and `docs/BLUEPRINT.md`). Invoke the project
skill `bsah-film-direction` before touching UI. Work on a new branch from the latest `main`, open a draft PR when done.

The owner wants an **editorial** look everywhere: real photographs of real Marwari horses and Indian cadets in the BSAH
uniform, clean light pages with generous white space, no novelty effects. Five changes:

## 1. `/why`: replace the ASCII picture with a plain horse photograph
Reference: `01-why-ascii-child.webp`. Section "The same child, on a screen / Rendered in characters", component
`components/sections/why/AsciiChild.tsx` (mounted in `app/why/page.tsx`), effect `components/motion/fx/AsciiRipple.tsx`.
- Remove the ASCII rendering and the pointer-ripple effect entirely. If `AsciiRipple` is then unused anywhere, delete it.
- In its place show one good, plain photograph of a horse: a Marwari, calm, well lit, on a clean background, framed like an
  editorial plate (no overlay text on the picture, no filter, no animation beyond the site's usual `Reveal` fade).
  Use an existing still from `lib/content/media.ts` if one fits (check `bgStable`, `anatomyProfile`, `bondField` and the
  `curr*` keys); otherwise generate one on Higgsfield (`gpt_image_2_6`, the PHOTO suffix from Blueprint Part 8) and add
  it to `media.ts` and `scripts/fetch-media.sh`.
- Rewrite the copy so it no longer describes characters, ripples or a pointer. Keep the section's argument (a child on a
  screen versus a child beside a horse) in the site's voice. Remove the caption "Moving the pointer sends ripples...".

## 2. `/curriculum` hero: give the hand room
Reference: `02-curriculum-bond-hero.webp`. Component `components/sections/curriculum/BondHero.tsx` (model
`public/models/touch-bay-horse.glb`, the real bay Marwari head the owner likes).
- The cadet's hand currently almost touches the muzzle. Leave a clear gap between fingertips and nose, as if the hand is
  being offered and the horse has not yet taken it: roughly one hand-width of empty space at 1440 px, scaled down on
  phones. Do this by moving or reframing the hand/horse in the stage, not by shrinking the horse.
- Keep the horse head, bridle and the hand's sleeve fully in frame at 1440 and 390 px.

## 3. Dark / light switch in the nav
The owner says the dark (or white) button "was removed". `components/site/ThemeToggle.tsx` exists and `SiteNav.tsx`
renders `<ThemeToggle />`, but it does not appear in the owner's screenshots (only account, Sound, Enrol a cadet, Reels).
- Find out why it is not visible at desktop width on `main` (hidden class, stale local build, CSS, or a later commit) and
  make it visible on every page at 1440 and 390 px, between the account icon and Sound, with a visible focus ring.
- Check that switching really flips the whole site (`.tone-dark` / `data-theme`) and is remembered across reloads.

## 4. `/schools`: replace the campus images with editorial ones
References: `03-schools-campus-cards.webp` and `04-schools-under-floodlights.webp`.
Sections: "Campus, in six views" in `components/sections/schools/SchoolScenes.tsx` (keys `schoolAerial`,
`schoolArenaNight`, `tournCrowd`, `bgStable`, `bgPavilion`, `currFormation`) and the four-frame curtain in
`lib/content/curtains.ts` → `schools` (`schoolAerial`, `schoolArenaNight`, `bgPavilion`, `tournPodium`).
- The current aerial and "Under floodlights" stills read as a foreign military academy (European riders, khaki army
  uniforms, northern sky). Replace them with images that show an **Indian school campus** with a BSAH arena: cadets aged
  10–16 in the BSAH uniform (Blueprint Part 8 uniform line), helmets on, Marwari horses, Indian architecture and light.
- Keep one consistent editorial format across all six cards and the four curtain frames: same aspect ratio per row,
  same grade, no text on the image, captions below.
- Generate the replacements on Higgsfield (`gpt_image_2_6` or `cinematic_studio_2_5`, 2K). Check the balance first with
  `mcp__Higgsfield__balance`; the owner's floor is **15 credits**, so stop and report if the batch would go below it.
  Review every result before using it; reject anything with non-Indian uniforms, cropped horses or warped hands.
- Add new keys to `lib/content/media.ts` (do not overwrite keys other pages still use) and to `scripts/fetch-media.sh`.

## 5. `/contact` gate scene: use the real horse head and give the hand room
Reference: `05-contact-gate-horse.webp`. Component `components/sections/contact/GateBondScene.tsx`
("Before the gate closes, the bond begins."), currently `public/models/touch-black-horse.glb`, which reads as a bronze statue.
- Replace it with the same real horse head the curriculum hero uses (`touch-bay-horse.glb`), or a real photograph of a
  Marwari head if the model cannot sit well on this layout. It must look like a living horse, not a statue.
- Apply the same hand spacing as task 2: fingertips clearly short of the muzzle.
- Check that `lib/content/covenant.ts` (which also references both models) still looks right afterwards.

## Rules (from `CLAUDE.md` / `AGENTS.md`)
- Nothing in the top 80 px under the fixed nav; inspect the top 120 px of every screenshot.
- Role colour tokens only, no hard-coded hexes for UI. Reduced motion: no new motion.
- Wrap every media path in `asset()`; after adding or removing files run `node scripts/media-manifest.mjs`.
- `.vercelignore` excludes `docs/*`; do not make page code import anything from `docs/` except the existing history ledger.

## Done means
1. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `node scripts/e2e-smoke.mjs` all pass.
2. Playwright screenshots of `/why`, `/curriculum`, `/schools` and `/contact` at 1440×900 and 390×844, light and dark,
   reviewed; compare each against the owner's reference photo for that task.
3. `PROGRESS.md` updated; draft PR opened with before/after notes per task.
