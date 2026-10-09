# BSAH website — instructions for Claude Code

@AGENTS.md

## Start here

1. Read **`docs/BLUEPRINT.md`** (the single source of truth: first principles, story pattern, design system, layout vocabulary, every page → section → copy, media manifest, claims ledger). Part 13 is the master prompt.
2. Invoke the project skill **`bsah-film-direction`** (`.claude/skills/bsah-film-direction/SKILL.md`) before building or editing UI.
3. Read the Next.js 16 docs in `node_modules/next/dist/docs/` for any API you touch (see AGENTS.md).

## Project

- **Entities:** Vicarius Infinitum Holdings Pvt Ltd (parent) → The Black Stallion Academy of Horsemanship Pvt Ltd (BSAH, operator) → School Tent Pegging Council of India (STPCI, governing council).
- **Domain:** blackstallion.academy
- **Stack:** Next.js 16 (App Router, `cacheComponents` + `partialPrefetching`), React 19, TypeScript strict, Tailwind CSS 4 (tokens in `app/globals.css`), `motion` (import from `motion/react`), Lenis, zod. React Three Fiber is installed for the optional 3D stallion. Supabase not set up yet.
- **Big idea:** "An 800-year lineage, handed to your child." Three acts: **Legend** (hook) → **Citadel** (proof) → **Ledger** (convert).

## Direction: a film in fifteen reels

- The home page `/` is the **trailer**: 15 sections in three zones (Hook / Proof / Convert), each teasing one page.
- Every other page is a **reel** (`lib/content/site.ts` → `reels`), with the same grammar: **title card** (unique opening move) → **scenes** (each a different layout archetype, one signature moment) → **end card** (`components/film/EndCard.tsx`, hands off to the next reel).
- Two-voice headlines via `components/film/Headline.tsx`: INSCRIPTION (Kalnia wide hairline caps) + war voice (Kalnia heavy lowercase, gold).
- Archetypes may appear once per page and at most twice across the site (Blueprint Part 4).

### Colour (tokens in `app/globals.css`)

night #0A0806 canvas · umber #16100B · ember #2A1D12 · bone #EDE3D1 headlines · sand #C8B08A body on images · dust #8A7660 captions · brass #C5A059 accents · gold #E6CA65 the one word that matters · blood #B13A24 the war beat (once per page max) · frost #9FB3C8 only for the "digital crisis".

No cards on photographs; gradients (`shade-b`, `shade-l`, `shade-r`) hold the text. The only surface is `.plate`; documents use `.parchment`.

### Type (self-hosted, `lib/fonts.ts`)

| Role | Font | Class |
| --- | --- | --- |
| Headline line 1 | Kalnia 200, wdth 125, caps | `.t-inscribe` |
| Headline line 2 | Kalnia 600, wdth 100 | `.t-voice` |
| Story / body | Newsreader (italic = documentary voice) | default, `.t-story` |
| Labels, nav, buttons | Mona Sans 600, wdth 75, caps, tracked | `.label` |
| UI text | Mona Sans 450 | `.t-ui` |
| Numbers, codes | Martian Mono | `font-mono` |

Never use Cinzel, Cormorant, Playfair, Inter, Bodoni or Space Grotesk.

### Motion

Slow, weighted. Tokens in `lib/motion/tokens.ts` (house curve `[0.16, 1, 0.3, 1]`). Every scroll-linked `useTransform` input range goes through `r()` from `components/film/range.ts`. Pinned scenes use `components/film/PinnedScene.tsx` and must pass a `reducedFallback`. Reduced motion: no pinning, zoom, parallax or horizontal travel; text fades only; Lenis off.

### Media

All imagery is Higgsfield placeholder art keyed in `lib/content/media.ts` (prompts in Blueprint Part 8). Run `sh scripts/fetch-media.sh` on the Mac to download into `public/media/`, then set `NEXT_PUBLIC_LOCAL_MEDIA=1` in `.env.local`. `FilmImage` grades every still (`grade` prop) and shows a gradient until the file loads. Never use the Amigos images or the clip in `blackstallion images/`.

### Claims

Never publish the "No" rows of the claims ledger (Blueprint Part 9): no "40% cortisol", "300+ muscles", "permanently reverses tech-neck", "zero joint impact". Flag sample data as SAMPLE in code and on the page.

## Code conventions

- Server Components by default; `"use client"` only for state, effects or motion. Never import non-component values from a `"use client"` file into a Server Component; shared data lives in `lib/content/`.
- Page sections live in `components/sections/<page>/`; shared primitives in `components/{film,site,motion,brand}`; forms use `components/sections/shared/LeadForm.tsx` + `app/actions.ts`.
- Content (copy, data) lives in `lib/content/`, not inside components.
- Don't add dependencies without asking. Secrets only in `.env.local`.
- Don't `git push`. Commit locally on a branch per session.

## Definition of done

1. `npm run lint`, `npm run typecheck` and `npm run build` all pass.
2. Every touched route screenshotted at 390 px and 1440 px (Playwright) and reviewed.
3. Reduced motion checked. 4. Keyboard focus visible on every interactive element. 5. `PROGRESS.md` updated.
