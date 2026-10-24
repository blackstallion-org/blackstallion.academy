# blackstallion.academy

Website for The Black Stallion Academy of Horsemanship (BSAH). Next.js 16 · React 19 · Tailwind CSS 4 · Motion · Lenis.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint && npm run typecheck && npm run build
```

## Folder map

| Path | What lives there |
| --- | --- |
| `app/` | Routes (one folder per page), `layout.tsx`, `actions.ts` (lead-form server action), self-hosted fonts in `app/fonts/` |
| `components/film/` | Reel grammar: Headline, PinnedScene, FilmImage, EndCard, Intermission |
| `components/motion/` | Smooth scroll, loader, count-up, dust, seal stamp |
| `components/sections/<page>/` | The scenes for each page |
| `components/site/` | Nav and footer |
| `components/brand/` | Crest, monogram, wordmark |
| `lib/content/` | All copy and data, typed (one file per area) |
| `public/` | `brand/` SVGs and `media/` (local images, optional) |
| `scripts/fetch-media.sh` | Downloads the placeholder stills into `public/media` |
| `docs/BLUEPRINT.md` | Source of truth for design, copy and layout |
| `docs/reference/` | Client specs (PRDs, brand, legal, 3D), not shipped |

## Images

By default images load from the Higgsfield CDN, so the site works on Vercel with no extra step. To self-host them: `sh scripts/fetch-media.sh`, set `NEXT_PUBLIC_LOCAL_MEDIA=1`, restart.

## Deploy (Vercel)

Import the repo (or run `npx vercel`). Framework preset: Next.js. No environment variables are required yet.
