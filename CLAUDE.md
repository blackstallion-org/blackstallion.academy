# BSAH website — instructions for Claude Code

@AGENTS.md

## Project

- **Entities:** Vicarius Infinitum Holdings Pvt Ltd (parent) → The Black Stallion Academy of Horsemanship Pvt Ltd (BSAH, operator) → School Tent Pegging Council of India (STPCI, governing council).
- **Domain:** blackstallion.academy
- **Stack:** Next.js 16 (App Router, `cacheComponents` on), React 19, TypeScript strict, Tailwind CSS 4 (tokens in `app/globals.css`), `motion` (import from `motion/react`), Lenis, React Three Fiber (3D stallion later), Supabase (not set up yet).
- **Specs:** start at `docs/INDEX.md`. Read the doc for a route before building it. The design brief is `docs/design-brief.md`.
- **Big idea:** "An 800-year lineage, handed to your child." The site runs in three acts: **Legend** (Marwari heritage) → **Citadel** (discipline, faculty, ranks) → **Ledger** (passport, seal, verifiable proof).

## Direction: "The Marwari" (film-poster site)

The home page (`app/page.tsx`) is ONE long cinematic scroll told in chapters, each pinned and scroll-scrubbed (`components/film/Chapter.tsx`): Prologue, I Legend, II Crucible, III Ranks, IV Fleet, V Campus, VI Ledger (verify), VII Circuit (tournaments), VIII Gate (contact + end credits). Separate routes come later and reuse these chapters. A fixed chapter rail (`ChapterRail`) tracks progress.

Reference mood: a dark sepia horse emerging from a huge cloud of dust, warm gold haze, black vignette, heavy film grain, full-bleed. Copy lives in `lib/content/film.ts`.

### Colour

| Token | Hex | Use |
| --- | --- | --- |
| night | #0A0806 | Canvas. Black-brown, never #000 |
| umber / ember | #16100B / #2A1D12 | Rare surfaces, warm shadows in gradients |
| bone | #EDE3D1 | Headlines, primary text |
| sand | #C8B08A | Body text on images |
| dust | #8A7660 | Captions |
| brass | #C5A059 | Accent only: hairlines, labels, active |
| gold | #E6CA65 | The one number or word that matters; glints |
| blood | #B13A24 | The war beat, large type only |

No flat cards or boxes on the film page. Text sits directly on photographs, held by gradients.

### Type

| Role | Font | Class |
| --- | --- | --- |
| Headlines and story | Bodoni Moda (didone, opsz 6–96) | `font-display text-poster opsz-display` (10–14vw), `text-display-1/2/3`; body inherits Bodoni at text size |
| Labels, nav, buttons | Barlow Condensed, uppercase, tracked | `.label` |
| Numbers, codes | JetBrains Mono | `font-mono` |

Italic Bodoni is the "second voice" of every headline (second line, sand or gold).

### Motion

Slow, weighted, film-like. Tokens in `lib/motion/tokens.ts`; film curve `[0.7, 0, 0.2, 1]`. Every scroll-linked `useTransform` input range goes through `r()` from `components/film/range.ts` (native scroll animations reject offsets outside 0–1). Each chapter has exactly one signature moment (see the comment at the top of each chapter file). Reduced motion: no zoom/parallax/letterbox; text fades only; Lenis off.

### Media

`public/media/*` are Higgsfield placeholders (fetch with `sh scripts/fetch-media.sh`; list in `public/media/PLACEHOLDERS.md`). `FilmImage` shows a graded gradient until a file loads, so missing files never break a frame. Never use the Amigos images or the film clip in `blackstallion images/`.

### Skills and tools for this repo

Project settings enable the `frontend-design` and `supabase` plugins (`.claude/settings.json`) and the Playwright, Context7 and Figma MCP servers (`.mcp.json`). Use Playwright to screenshot every chapter at 390 and 1440 px before calling a visual change done.

## Code conventions

- Server Components by default; add `"use client"` only to components that need state, effects or motion.
- Components live in `components/{ui,motion,brand,sections,three}`; each accepts `className` and merges it with `cn()` from `lib/utils.ts`.
- Content (nav, copy, hotspot data) lives in `lib/content/`, not inside components.
- Don't add dependencies without asking.
- Secrets only in `.env.local`, server-side. Never commit them.
- Don't `git push`. Commit locally on a branch per session.

## Definition of done

1. `npm run lint`, `npm run typecheck` and `npm run build` all pass.
2. Screenshots at 390 px and 1440 px reviewed (Playwright).
3. Reduced-motion checked.
4. Keyboard focus visible on every interactive element.
5. `PROGRESS.md` updated.
