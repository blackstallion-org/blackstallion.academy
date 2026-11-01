# Site refinement · implementation log (Claude, started 2 Nov 2026)

Resumable record for the brief in [CLAUDE_PROMPT.md](./CLAUDE_PROMPT.md). Branch: `feature/marwari-film-world`.
Dev server: `npx next dev -p 3100` on the Mac (started by the local job runner in `scratch/claude-run/`, gitignored).
Headless proof: Playwright 1.58 (`scratch/claude-run/pw/shoot.mjs`) → `scratch/claude-run/shots/<pass>/<route>-{desktop,mobile}.jpg`
at 1440×900 and 390×844. Builds/lint/typecheck run through the same runner (logs in `scratch/claude-run/logs/`).

## Audit findings that shape the plan

- `/` order today: HeroFilm → StallionHero (3D desert film) → doctrine ("We do not teach children to ride") → StoryStrip → FirstRide → **BronzeAndTime** (R08) → Instrument → HorizontalChapter → … → **Atelier** (R09 palette) → …
- R08 "Bronze and Time" was **added new** in d95e67e (28 Oct) between the first-ride panels and the anatomy plate; `git log -S BronzeAndTime -- app/page.tsx` and the diff show it replaced nothing in `app/page.tsx`. No photograph was removed by that commit (only `docs/qa/bronze/*.jpg` captures were added). The user's "earlier photo" therefore cannot be identified from history → see Phase 3 decision.
- Sideways scattered-letter text = `components/motion/HorizontalChapter.tsx` (GSAP SplitText, pinned). Call sites: `/` (home), `/legend`, `/parents`, `/why`, `/anatomy`, `/curriculum`, `/lore`, `/cadets`, `/fleet`, `/tournaments`, `/schools`, `/equipment`.
- Audio: `lib/audio/engine.ts` (single-voice effects, no music), `components/site/Soundscape.tsx` (route journeys), `SoundToggle` in nav. Seven equine clips already exist in `public/audio/interactions/` (gallop, neigh, snort, desert-chase, herd, chariot, horse-call; sources in `manifest.json`), plus synthetic leather/tack. No background music exists.
- Requested song `youtu.be/iqw0IY1qJG8` = "A Melody from the Open Range | Peaceful Cowboy Music for Relaxation" by the YouTube channel *Music of the Valley* (oEmbed, 2 Nov 2026). Channel about-page carries **no licence or reuse permission** (checked 2 Nov 2026). Only lawful route would be a *visible* official YouTube player, which the brief rules out as background audio → substitute a licensed track (Phase 2) and record the substitution.
- Science rider/horse = `public/anatomy/dual-body.html` + `exhibit.js` (iframe, vanilla three.js) and `components/stride/*` (StrideExperience) — two separate scenes with the same `cadet-rider.glb` mannequin.
- Legend: `LastExhibit.tsx` = glass horse (R06); `EarsZoom` in `LegendScenes.tsx` = ear video (R12); revival timeline in `LegendScenes.tsx`/`lib/content/legend.ts` (R14).
- Fleet glass cloak = `components/sections/fleet/StallionPortalHero.tsx` + `FleetCovenantScene/Canvas` + `components/3d/cloak`.
- Command robot = Spline scene in `components/sections/command/CommandHero.tsx` (`@splinetool/react-spline`).

## Phases

| # | Phase | Requirements (R-ids) | Done when |
| --- | --- | --- | --- |
| 0 | Environment + baseline | — | Dev server on :3100, Playwright captures of every route at both sizes (`shots/baseline`). |
| 1 | Sitewide chrome | R02, R07, R05 | Full academy name in nav (desktop + mobile, no crowding), logos +25 % within 64/80 px header, footer marks larger; HorizontalChapter only on `/legend`. |
| 2 | Soundscape | audio, horse sounds | Licensed music loop persists across routes (layout-level), gesture-gated, truthful nav toggle, ducking; 7-sound horse palette with licence ledger; occasional call cue; Fleet ambience API. |
| 3 | Home | R08, R09, R10, R26 | Order: opening zoom → who we are → hero film → desert horse; BronzeAndTime removed; palette section replaced; standings/crisis audited. |
| 4 | Legend | R04, R06, R12, R14 | Glass exhibit gone; ear video replaced by interactive 3D ear study; icon timeline with click-to-open stories, verified dates, keyboard + touch. |
| 5 | Bond + contact + curriculum | R01, R13, R18, R31 | Full Marwari head + hand approach; "The arena is open" headline; archery caption; running-horse cadence fixed. |
| 6 | Fleet worlds | R32 | Cloak removed; three selectable worlds with ambience; no audio duplication / GL leaks. |
| 7 | Science / stride / anatomy | R11, R15, R16 | One rider + one horse shared; overlays simplified; optional bone/muscle/coat reveal; duplicates consolidated. |
| 8 | Statue, Command, Verify | R03, R20–R23 | Statue detail refined; cowboy guide replaces robot with real Q&A; stamp motif + impression tied to real state. |
| 9 | Schools, Tournaments, Equipment, Cadets, Journal | R17, R19, R24–R30 | Planned/proposed labels; Indian imagery; minimal sealed card; trophy overlay gone; tack cards gone; Field Studies calmed; unique journal covers. |
| 10 | Canonical 3D horse + rider | brief §3 | Contact sheets vs references, defect fixes, manifest. (Long-running; honest status recorded.) |
| 11 | Proof | brief §4–5 | Screenshots of every changed route at both sizes, lint/typecheck/build, reduced motion, PROGRESS.md updated. |

Dependencies: 1 → everything (shared chrome); 2 → 6 (ambience API); 10 → 4/5/6/7 for the final horse asset (pages ship with the current rigged `marwari-hero.glb` family meanwhile, labelled as such here, not as finished photoreal work).

## Requirement → file → proof checklist

(Updated after each pass. Status: ☐ not started · ◐ in progress · ☑ done with proof · ✗ blocked, fallback noted.)

| R | Requirement | Files | Proof | Status |
| --- | --- | --- | --- | --- |
