---
name: bsah-film-direction
description: Art direction and build rules for blackstallion.academy (BSAH). Use before building, editing or reviewing any page, section or component of the BSAH website, or when generating imagery for it.
---

# BSAH film direction

The site is one film in fifteen reels. The home page is the trailer. Every decision below serves one job: make a parent trust BSAH with their child and make a school board want an arena. Full spec: `docs/BLUEPRINT.md`.

## Before you write code

1. Find the route in `docs/BLUEPRINT.md` Part 6. Build exactly its sections, in order, with the listed archetype, signature moment, copy and image keys.
2. Check Part 4 (layout vocabulary): an archetype may appear once per page and at most twice across the site. Title cards (family T) are unique per page.
3. Check Part 9 (claims ledger). Never publish a "No" claim. Mark sample data SAMPLE.

## The reel grammar (every page)

- **Title card** with `ReelMark` (`REEL 05 / 15 · Act II · The Citadel`) and a two-voice `Headline`.
- **Scenes**: 3–6 sections, each a different archetype, each with exactly one signature moment. Everything else is a plain `Reveal`.
- **End card**: `<EndCard current={n} />` hands off to the next reel.

## Voice and type

- Headlines: `<Headline inscription="WIDE CAPS LINE" voice="heavy lowercase line." />`. Inscription = calm, carved (Kalnia 200, wdth 125). Voice = the line that lands (Kalnia 600), gold by default; blood only for the war beat.
- Body in Newsreader; labels in Mona Sans condensed caps (`.label`); numbers, codes and microchips in Martian Mono (`font-mono`).
- Copy: short, declarative, concrete. One idea per section. No eyebrow labels on every block, no exclamation marks, no "unlock", "elevate", "seamless".

## Colour and surfaces

- Canvas `night`, text `bone`/`sand`, accents `brass`, the one important word `gold`. `frost` only for the digital-crisis side.
- Text sits on photographs, held by `shade-b` / `shade-l` / `shade-r` gradients. No rounded SaaS cards, no glassmorphism, no neon, no emoji icons. The only surfaces: `.plate` (terminal, drawer, plan) and `.parchment` (letter, MOU, diploma, receipt, creed).

## Motion

- Slow and weighted (`ease.citadel`). Scroll-linked ranges always go through `r()`.
- Pinned scenes use `PinnedScene` with a `reducedFallback` that stacks the frames.
- Reduced motion: no pinning, zoom, parallax, horizontal travel or looping. Text fades only.

## Imagery

- `FilmImage name="key"` from `lib/content/media.ts`; set `grade` (`film` default, `deep` for backgrounds behind text, `cold` for the crisis, `mono` for the 1950s, `none` for miniature paintings and the studio plate).
- New stills: Higgsfield `cinematic_studio_2_5`, 2K, with the PHOTO or PLATE suffix and the cadet uniform line from Blueprint Part 8. Max 4 concurrent jobs on the current plan. Add the key to `media.ts` and the line to `scripts/fetch-media.sh`.
- Cadets are 10–16, always in the BSAH uniform, helmet on when mounted.

## Accessibility

- Every interactive element is a real button or link with a visible focus ring. Sliders and dials: `role="slider"`, ARIA values, arrow keys. Tabs: roving tabindex with arrow keys. Drawers and menus: Escape closes, focus returns.
- Decorative SVG and image layers get `aria-hidden`.

## Done means

Lint, typecheck and build pass; the route is screenshotted at 390 and 1440 px and reviewed for anything generic, crowded or repetitive; reduced motion and keyboard focus checked; `PROGRESS.md` updated.
