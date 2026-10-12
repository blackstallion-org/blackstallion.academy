# Cinematic redesign · testing checklist and results (12 Oct 2026)

Environment: production build (`next build` + `next start`), Chromium 140 via Playwright, Lighthouse 12.8.2 (mobile preset, simulated throttling). The Higgsfield CDN and nothing else was unreachable from the test sandbox, so stills were replaced by stand-in frames from the hero poster during screenshots; the hero film used the real cropped encode.

## Build gates
- [x] `npm run lint` — pass
- [x] `npm run typecheck` — pass
- [x] `npm run build` — pass, 45 pages generated
- No test suite exists in `package.json`; none was run.

## Per page (1440 × 900 and 390 × 844)
| Check | Home | Curriculum | Hubs | Hub detail | Verify |
| --- | --- | --- | --- | --- | --- |
| Opening fills 100svh, no gaps | ✓ (letterbox removed) | ✓ | ✓ | ✓ | ✓ |
| Signature move plays once, no loop | ✓ masks part | ✓ aperture on scroll | ✓ rotation (pausable) | ✓ card peel on scroll | ✓ resolve |
| Text minimal and legible over imagery | ✓ | ✓ ring kept above title | ✓ after mobile pass | ✓ | ✓ |
| Content below preserved | ✓ doctrine reordered | ✓ | ✓ | ✓ facts moved into card 2 | ✓ form moved into opening |
| Reduced motion (static fallback, no pin) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Keyboard order and visible focus | ✓ | ✓ | ✓ list links select hub | ✓ focus brings card 2 up | ✓ input first after nav |
| No console errors | ✓ | ✓ | ✓ | ✓ | ✓ |
| Nav readable over the opening | ✓ tone sampled under the bar | ✓ | ✓ | ✓ | ✓ |

Not applicable: WebGL-off testing (no WebGL is used; the verify effect is Canvas 2D and falls back to the photograph if a 2D context is unavailable).

## Lighthouse (mobile), measured, new build vs the build before this change
| Route | Perf (new) | Perf (before) | A11y | SEO | CLS |
| --- | --- | --- | --- | --- | --- |
| `/` | 73 | 70 | 100 | 100 | 0 |
| `/curriculum` | 81 | 76 | 97 → fixed* | 100 | 0 |
| `/schools` | 76 | 78 | 100 | 100 | 0 |
| `/schools/zone-01a…` | 80 / 85 (two runs) | 85 | 100 | 100 | 0 |
| `/verify` | 75 / 84 (two runs) | 81 | 96 → fixed* | 100 | 0 |

Run-to-run spread is about ±5 points. Performance is at or near the old figures but **below the 85 target** on most routes. The limiter is LCP render delay (3.7–4.9 s under simulated mobile CPU): the first-visit loader and hydration-driven text reveals that predate this work. Bytes are understated because CDN images could not load in the sandbox.

\* Both accessibility failures were pre-existing and are fixed in this change: the "Never shown" list on `/verify` now uses the caption colour (contrast ≥ 4.5:1), and the rank progress bar on `/curriculum` has `role="img"` so its label is allowed.

## Still to do on a real device
- [ ] Check the four new stills (Marwari ears, anatomy, uniform, crop) once fetched locally.
- [ ] Watch the home masks part over the real film on a phone (Safari) and confirm the 1280 encode is chosen ≤ 900 px.
- [ ] Re-run Lighthouse against the deployed site with real images.
