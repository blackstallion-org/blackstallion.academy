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
| R02 | Full academy name beside the crest, desktop + mobile | `components/brand/Wordmark.tsx`, `components/site/SiteNav.tsx` | `scratch/claude-run/shots/p1nav2/*-top.jpg` (1440 + 390): no collision; staff sign-in moved into the menu on phones | ☑ |
| R07 | Logos ~25 % larger (nav 52/60 px in 64/80 px bars; footer seals 72/80 px), full name in footer | `SiteNav.tsx`, `Footer.tsx`, `app/globals.css` | `p1nav/*-footer.jpg` | ☑ |
| R05 | Sideways scattered-letter text only on `/legend` | 11 pages' `page.tsx` (HorizontalChapter removed) | `grep HorizontalChapter` → only `app/legend/page.tsx` | ☑ |
| Audio · music | One licensed track for the whole visit, gesture-gated, truthful toggle, ducking, survives navigation | `lib/audio/mixer.ts`, `engine.ts`, `Soundscape.tsx`, `SoundToggle.tsx`, `public/audio/LICENSES.md` | `scratch/claude-run/pw/sound.mjs` log: waiting→playing on first click; playhead 2.4 s→5.7 s across a client nav to /legend (not restarted); off/on; reduced-motion visitor starts OFF | ☑ (substitute: requested YouTube song has no licence; "Windswept", K. MacLeod, CC BY 4.0) |
| Audio · horses | Seven-sound palette (3 new CC0), idle call every ~15–24 s only while music plays and nothing else sounds | `engine.ts` (HORSE_PALETTE, IDLE_CALLS), `Soundscape.tsx`, `public/audio/interactions/{breath,walk,saddle}.mp3` | Freesound pages fetched: CC0 (`audio-sources/freesound-ledger.json`) | ☑ code; idle-call pacing not yet heard on real speakers |
| R08 | Remove "Bronze and Time"; restore the earlier photo | `app/page.tsx` | History: d95e67e inserted it into an empty slot; no photo was replaced there. Candidates removed from home earlier: photo cube gallery (e082784, removed at owner's request), Matrix rider plate (2e7d854, now on /anatomy) | ☑ removed · ✗ restore blocked: owner to name the photo |
| Home order | Opening zoom → who we are → hero film → desert horse → rest | `components/sections/home/Hero.tsx` | `shots/p3/home-desktop-sheet.jpg` frames 0–9 | ☑ |
| R09 | Palette moodboard → horse photograph + brief story | `HorseFirst.tsx`, `lib/content/home.ts` (`horseFirst`), new still `homeHorseman` | `shots/p3/home-desktop-24.jpg` | ☑ |
| R10 | Standings icons and density | `HomeConvert.tsx` (peg lanes, duplicate numbers removed, "sample fixture") | `shots/p3/home-desktop-31.jpg` | ☑ |
| R13 | "The arena is open" large and bold | `HomeClose.tsx` (finale headline + scrim); `/contact` title already poster-size | `shots/p3/home-desktop-37.jpg` | ☑ (re-check after scrim) |
| R26 | Crisis/cure imagery: the "portal" is the `/why` title film (no horse) | `components/sections/why/WhyScenes.tsx`, new still `whyThreshold` | to capture in Phase 11 | ◐ |
| R31 | Loader horse: stable fill from site imagery, steady cadence | `public/opening/loader-marwari.webp` (15 Muybridge-style silhouettes from the supplied GIF, one fixed Marwari-coat fill; the old fill was cut-up Roku packaging), `RunningHorse.tsx`, `lib/opening/*` | `scratch/claude-run/gif/new-frames2.jpg`; tests pass | ☑ |
| Images | New distinct stills (Higgsfield gpt_image_2_5, high, 2K; 15 × 2.75 credits) | `lib/content/media.ts` (new keys + `legendEars`, `bgStable`, `tournCrowd` repointed; old files moved to `_to_delete/retired-media-2026-11-02/`) | review sheets `shots/stills-review-stills{1,2}.jpg` | ☑ |
| R30 | Journal: one unique cover per article | `lib/content/journal.ts` (journalStream, journalEarTouch, journalWhorl, journalLane, journalDance, journalRein) | to capture | ◐ |
| R04 | Credible ear photography for the ear story | `legendEars` → new still (three-quarter head, tips touching); journal no longer reuses it | `shots/stills-review-stills1.jpg` | ☑ |
| R06 | Remove the glass/pedestal horse and its copy | `app/legend/page.tsx` (LastExhibit removed), `lib/content/legend.ts` (chapter XI removed) | `grep LastExhibit app` → none | ☑ |
| R12 | Ear video → interactive 3D ear study on the canonical horse | `components/sections/anatomy/EarStudy.tsx` (marwari-hero.glb; Ear_L/Ear_R turn on their own long axis, the axis of the model's Ear_Rotate clip; four listening poses as a radio group + pointer as a sound source; tip curl eased by −0.3 rad after comparing 0/±0.35); `AnatomyScenes.tsx` EarDial; "180°"/"±90°" claims removed there, in legend beats and the journal | `shots/ear/tips-sheet3.jpg`, `shots/ear/probe.jpg` | ◐ works; the model's ears are solid tubes with no inner opening, so they still read slightly horn-like: geometry fix belongs to Phase 10 |
| R14 | Revival timeline with an icon per date, click/tap/keyboard, verified dates | `components/sections/legend/RevivalTimeline.tsx` (tablist, roving tabindex, arrows/Home/End), `lib/content/legend.ts` (milestones with titles and icons; sources line) | `pw/timeline.mjs`: click, tap, ArrowRight, End, wrap, Home all correct at 1440 and 390; 0 label overlaps; `shots/legend-timeline-{desktop,mobile}.jpg`. Dates checked against Wikipedia "Marwari horse" and FEI (2020): 1995, 1999, 2009, "not at risk" (FAO 2007, DAD-IS 2020); Umaid Singh dated only "first half of the 20th century", endurance wins undated, so labelled "1900s" and "2000s" | ☑ |
