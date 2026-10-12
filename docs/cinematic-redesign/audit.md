# Cinematic redesign · audit (12 Oct 2026)

Brief: five existing pages get distinct full-screen openings with one signature animation each. Routes, data and business logic stay as they are.

## Route mapping (real routes, no new ones)

| Brief page | Route | Opening before | Data source |
| --- | --- | --- | --- |
| 1 Home | `/` | Full-frame video, no copy over it | `lib/content/home.ts`, `public/video/hero-main.mp4` |
| 2 Curriculum | `/curriculum` | Ledger photo + ruled lines (T6) | `lib/content/curriculum.ts`, `lib/content/site.ts` (reel 5) |
| 3 Hubs | `/schools` | Aerial campus zoom (T11) | `hubs` in `lib/content/schools.ts` |
| 4 Individual hub | `/schools/[slug]` (3 static params) | One photo + headline | `hubBySlug`, `tierById`, `fleet` |
| 5 Verify | `/verify` | Passport photo + seal stamp (T12) | `credentialByCode` in `lib/content/records.ts` (sample records; Supabase later) |

`/schools/mou` and `/verify/[code]` are untouched.

## Architecture found

- Next.js 16.4 App Router, React 19.3, Tailwind 4, TypeScript strict. Server components by default.
- Motion: `motion` 14 (`motion/react`), Lenis. Existing primitives: `PinnedScene` (sticky frame + scroll progress, reduced-motion fallback), `r()` (clamped scroll ranges), `FilmImage` (graded still with placeholder), `Headline` (two-voice), `useReducedMotion` (hydration-safe).
- No GSAP, no Three.js in `package.json` (R3F mentioned in CLAUDE.md is not installed). Project rule: no new dependencies without asking.
- Fonts: Kalnia / Newsreader / Mona Sans / Martian Mono, self-hosted. Project rule forbids Cinzel, Cormorant and Inter.
- Palette: since 12 Oct the site is warm ivory by default, with dark scenes via `.tone-dark` (Blueprint 3.1). Decision with the owner: the five openings are dark scenes; content below stays ivory.
- Media convention: stills are keyed in `lib/content/media.ts` (CDN URL + local `public/media/<file>`), fetched to the Mac by `scripts/fetch-media.sh`. Video lives in `public/video/`.

## Decisions taken from the audit

1. **No GSAP / Three.js.** Everything the brief asks for is clip-path, transform, sticky positioning and one 2D canvas; `motion` + `PinnedScene` already do this and keep the bundle unchanged.
2. **Brand fonts unchanged.** The brief's Cormorant/Cinzel/Inter suggestion conflicts with CLAUDE.md; the brief allows existing licensed fonts.
3. **Brand colours.** The brief's obsidian/brass hexes map onto the existing dark-scope tokens (charcoal `#171513`, antique gold `#C9A66B`, caramel `#B88A62`); no second palette was introduced.
4. **Asset folders.** Existing conventions win over the brief's suggested `public/images/cinematic`: stills in `media.ts` (prefixed `cinematic-…`), video in `public/video/home-hero-cropped-*`.
5. **Hub data** is a static content module, not a database query; the hubs opening reads it directly, nothing is hard-coded.

## Risks found

- The hero film is letterboxed inside its frames (156 px black bars in a 1920×1076 file), so `object-fit: cover` could never fill the screen. Fixed by cropping to the 1920×768 picture (see asset manifest).
- The Higgsfield CDN is blocked from the build sandbox: new stills could not be viewed by the implementer. They were reviewed by the owner in the Higgsfield gallery; screenshots in QA use stand-in frames.
- `PinnedScene` under reduced motion threw "Target ref is defined but not hydrated" (pre-existing, every pinned scene). Fixed by attaching the ref in the fallback.
