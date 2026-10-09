# Build progress

Single source of truth: `docs/BLUEPRINT.md`. Each session ends with lint, typecheck and build passing.

- [x] **Session 0: repo setup.** Docs converted to `docs/`; Next.js 16.4, React 19.3, Tailwind 4; `CLAUDE.md`.
- [x] **Design system v1** and the one-page "film" (superseded).
- [x] **Session 9 Oct 2026 · Blueprint + multi-page build.**
  - `docs/BLUEPRINT.md`: first principles (six truths), the reel grammar, design system, 62 layout archetypes, full copy for every page, Higgsfield prompts, claims ledger, client conflicts, master prompt.
  - New type system (Kalnia / Newsreader / Mona Sans / Martian Mono), self-hosted from Fontsource tarballs; Bodoni/Barlow/JetBrains removed.
  - 43 new Higgsfield stills (86 credits) + the 14 from the first set, keyed in `lib/content/media.ts`; `scripts/fetch-media.sh` regenerated.
  - Home rebuilt as the 15-section trailer (Hook → Proof → Convert, two intermissions).
  - Pages: `/legend` (11 chapters from the Marwari documentary research), `/anatomy`, `/science`, `/why`, `/curriculum`, `/fleet`, `/cadets`, `/parents`, `/safety`, `/schools` (+ 3 hub pages, `/schools/mou`), `/verify` (+ 3 records with printable diploma), `/tournaments` (+ 3 events), `/command`, `/journal` (+ 6 articles), `/contact`, `/about`, 404. Redirects from the PDF routes.
  - Forms: `LeadForm` + server action (`app/actions.ts`, zod), brass-seal confirmation. Not persisted until Supabase.
  - Project skill `.claude/skills/bsah-film-direction`.
- [x] **QA pass (same day).** Every route screenshotted at 390 and 1440 (plus 768/1024 text-clipping audit, reduced motion, keyboard focus). Fixed:
  - Clipped headlines: `/anatomy` title rebuilt as a catalogue page (full-width title, plate sized to share the screen, label card), breed-standard heading stacked; `/legend` "Victory." on phones.
  - Overlaps: legend chapter rail is ticks-only (name on hover/focus) and hides outside chapters; parents rail moved under the copy; route map copy flows below the map on phones; Shield columns on home and `/safety` no longer wrap or misalign; `/safety` number wall fits four up; home Ledger constellation stays inside the frame.
  - Science title overlay registered to the real `science-rider.png` (rider's spine at x≈54.6) and kept clear of the headline; hidden on phones.
  - Snap scrollers keep the gutter (roll of honour, milestone reels); revival year labels centred on their points; podium cup pinned to the scene as a detail plate; fixtures status no longer wraps; `/command` types an opening question; terminal input has a visible focus state.
  - Blood used once on `/legend` (the vow); "Death." is now dust, Marwar on the route map gold.
- [ ] **Run `sh scripts/fetch-media.sh` on the Mac**, set `NEXT_PUBLIC_LOCAL_MEDIA=1`, then re-screenshot every page at 390/1440 and tune focal points and hotspot positions against the real stills (science overlay already registered).
- [ ] **Client answers** (Blueprint Part 10): who funds the arena, revenue-share base, payback model, confirmed partner schools, minimum age, Chairman's letter.
- [ ] **3D stallion** (optional): GLB in `public/models/marwari.glb` + `components/three/StallionViewer.tsx`, falls back to the specimen plate.
- [ ] **Supabase**: 11 tables + `leads`, RLS, seed from `lib/content/*`, wire `LeadForm`, `/verify`, standings, Command AI.
- [ ] **Payments** (`/pay`, Razorpay) and the parent app.
- [ ] **Commissioned photography** replaces every placeholder one-for-one.

## Notes for the next session

- Run `npm install` on the Mac if dependencies changed (none were added this session).
- Images in the cloud build sandbox render as graded gradients (the CDN is blocked there); judge final visuals on the Mac after fetching media.
