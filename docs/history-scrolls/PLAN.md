# History scrolls: plan

Four illustrated pages in the manner of the Indian miniature, read by scrolling down. Owner brief (9 Nov 2026), built to
the GPT implementation prompt. GPT's original companion files were not in the repository, so this folder recreates them;
the prompt's routes, scene ids, art direction and acceptance gates are the source of truth.

| Route | Format | Content |
|---|---|---|
| `/history/india` | anthology | IN00 opening + IN01–IN07 |
| `/history/world` | anthology | WO00 opening + WO01–WO07 |
| `/story/rani-lakshmibai` | personal story | JH01–JH08, four chapters of two scenes |
| `/story/alexander-bucephalus` | personal story | AL01–AL08, four chapters of two scenes |

`/story/pratap-chetak` is unchanged apart from one added link.

## Files

- Content: `lib/content/history/` (`types.ts`, one file per page, `reliefs.ts`, `assets.ts`).
- Components: `components/history-scroll/` (server: `HistoryPages.tsx`, `Scene.tsx`, `HistoryArt.tsx`; client:
  `HistoryScrollRoot.tsx`, `ReliefMount.tsx`, `reliefs/ReliefCanvas.tsx`; styles `history-scroll.css`).
- Routes: `app/history/{india,world}/page.tsx`, `app/story/{rani-lakshmibai,alexander-bucephalus}/page.tsx`.
- Ledger and data: `ASSET_LEDGER.json` (100 masters), `STORY_DATA.json` and `STORYBOARDS.md` (generated), `SOURCES.md`.
- Scripts: `scripts/history-ledger.mjs` (prompts → ledger), `scripts/history-ingest.py` (PNG → WebP + ledger),
  `scripts/history-relief-depth.py` (plate → depth map), `scripts/history-export.mjs` (data → docs),
  `scripts/history-screens.mjs` (screenshots + layout checks).

## Rules the build keeps

- Narrative, headings, qualifications and sources are server-rendered HTML on solid reading surfaces. No text in images.
- Layer stack per scene: ivory + SH01 grain, B, optional relief, S, F (crosses the join), reading surface, controls.
- Parallax: B −2 → +2 %, S −0.5 → +0.5 %, F +3 → −3 % of each layer's height, `ease: none`, scrubbed, one
  `gsap.context` per page reverted on unmount. The site's root Lenis drives scroll; no second instance.
- Anthology: natural flow, alternating reading side on desktop, no pinning. Personal: 160svh sections with a 100svh
  sticky stage on desktop only; "Read the story" switches to static flow; every scene links to the next scene or chapter.
- Phones: art in flow (4:3), then the reading surface. The subject is repositioned, the landscape is not over-cropped.
- Nav clearance: title padding `clamp(5.5rem, 9vh, 7.5rem)`; no controls in the top 80px; anchors use `scroll-margin-top`.
- Reduced motion: normal flow, no sticky, no parallax, no relief.
- Art: only `accepted` ledger entries with a review and an existing file render; everything else is a labelled
  `DEV PLACEHOLDER · <id>` at the master's proportions. Pratap paintings are never substituted.
- Reliefs: at most one WebGL scene, mounted near the viewport, paused when the tab is hidden, DPR ≤ 1.5, render on
  demand, disposed on unmount; on missing WebGL or context loss the flat painting stays.
