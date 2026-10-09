# Build progress

Plan: *BSAH Website — Design Brief & Build Plan* (Claude Docs). Sessions run in order; each ends with build, lint and typecheck passing.

- [x] **Session 0: repo setup.** Docs converted to `docs/`; upgraded to Next.js 16.4, React 19.3, Tailwind 4; dependencies installed; folders created; `CLAUDE.md` written.
- [x] **Design system.** Tokens, fonts, motion tokens, core components, placeholder brand marks, `/styleguide`.
- [x] **Direction reset: "The Marwari" one-page film.** 9 pinned chapters, Bodoni Moda / Barlow Condensed, grain, vignette, dust, cursor lamp, chapter rail.
- [x] **Placeholder imagery (Higgsfield).** 14 stills + 10 s loop generated (about 43 credits). Run `sh scripts/fetch-media.sh` on the Mac to pull them into public/media.
- [ ] **After the images land:** tune Crucible reticle positions, image focal points and text contrast per chapter; re-screenshot 390/1440.
- [ ] **3D stallion** (Sting Master Directive): GLB with idle micro-movements, gaze tracking, hotspots, eye-glide into the passport.
- [ ] **Supabase foundation.** 11 tables + schema fixes, RLS, seed data, generated types.
- [ ] **Session 3:** `/hub/[schoolSlug]` and `/verify`
- [ ] **Session 4:** Home
- [ ] **Session 5:** `/legend`
- [ ] **Session 6:** `/curriculum`, `/fleet`, `/about`
- [ ] **Session 7:** `/hubs`, `/mou-request`, `/contact`
- [ ] **Session 8:** Login and `/pay`
- [ ] **Session 9:** `/tournaments`, `/command-ai`
- [ ] **Session 10:** `/admin`
- [ ] **Session 11:** Polish and launch

## Notes for the next session

- Run `npm install` on the Mac after pulling these changes (the lockfile now targets Next 16.4).
- Components still to build when their pages arrive: `ScrollScene`, `AudioToggle`, `CommandTicker`, `ScrambleText`, `PostureSlider`, `Diploma`.
