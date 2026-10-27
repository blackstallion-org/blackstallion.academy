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
- [x] **Session 11 Oct 2026 · Chairman's directives (4 PDFs) applied across the site.**
  - **Reel 05 · the 13-Pillar Sovereign Ledger** (Directive 04 §1): `lib/content/curriculum.ts` rewritten — 13 pillars (9 foundations + 4 BSAH tactical disciplines) with skill / trait / sub-copy, three phases (Foundation, Crucible, Sovereign Command); ranks updated to the Section-8 milestones and insignia (Lancer now carries pillars 10–13). New `components/sections/curriculum/CodexVault.tsx` (Option A "Codex Vault": staggered copper-rimmed tiles, one-at-a-time expansion with gold rim ignition, aria-expanded buttons, reduced-motion fallback) replaces the old 12-pillar grid.
  - **45-minute military session protocol + campus schedule** (Master Refinement §9): class segments 0-10/10-25/25-35/35-45; batches now Dawn Patrol / Twilight Batch / Sunset Command / Weekend Circuit with focus column; pricing Core ₹8,500 + GST, Sovereign Elite ₹12,500 + GST, onboarding kit ₹5,000 + GST (parents receipt recalculated).
  - **Reel 02 telemetry** (Directive 04 §2): every hotspot carries a mono HUD metric; ears and neck copy per the directive (180° acoustic swivel, cervical biomechanical lever).
  - **Reel 13 terminal** (Directive 04 §3 + Refinement §10): boot line "v2.4 | LATENCY: 12ms | STPCI ENCRYPTED NODE … BSAH National Registry"; four preset chips (CapEx & revenue share, Insurance & safety record, STPCI accreditation, Curriculum & class timings) with the directive answers; faculty answer adds 61st Cavalry JCOs/NCOs + RJ/PB/HR/TS federations.
  - **Contact gates** (Directive 04 §4): Gate 01 Enrol a Cadet (zone + tier selects, kit note), Gate 02 Partner Your Campus (acreage + capacity, "Request campus blueprint"), Gate 03 Board Audit (date + slot, "Confirm board audit"); `?gate=partners` maps to schools.
  - **Zero-CapEx flip** (Directive 04 + Pan-India): BSAH funds/builds/operates, school earns 25–30% quarterly — schools model, simulator (annual-share dial replaces payback clock, "Your capital ₹0"), MOU clause 2, home teasers, command answers.
  - **Pan-India regional architecture**: all named schools (DPS, Oakridge, HPS) removed site-wide; hubs renamed to Zone 01A/01B/01C codenames (slugs changed, fleet/records/academy/tournaments updated); standings by zone codename; new `PanIndiaNetwork` section on /schools with the six-zone Sovereign Hub Network and the benchmark copy.
  - **Reel 01 origins** (Refinement §3): mythological opening replaced with "Eight hundred years in one bloodline" + the three theories of origin (directive copy); home story frame updated.
  - **The Traditional Lore of the Bards** (Refinement §4): omens/dance chapters rebuilt as a lore ledger — Kala, hair whorls, Nukra, Nachni — each pairing Traditional Lore with a BSAH Neutrality Insight; the black-horse vow kept; chapters renumbered (10 chapters now).
  - **Sovereign Crucible** (Directive 1, Variant B): new section on /why — desert endurance, the three crises (focus / agility / agency, in frost), the stallion answer, the closing triplet.
  - **Studbook colour registry** (Refinement §5): six official coats with hexes on /fleet.
  - **Uniform spec** (Refinement §7): tailor's-docket section on /cadets.
  - **Palette** (Refinement §1): tokens aligned to the directive — night #0F0E0D (obsidian), umber #1A1A18 (deep charcoal), gold #D4AF37 (burnished), new `copper` #B87333; all hardcoded night/gold RGBs swept.
  - Verified: lint, typecheck and `next build` pass (build run in the cloud sandbox; the local VM has no npm egress for the linux SWC binary); all touched routes screenshotted at 390/1440 and the new sections reviewed.
  - **Deferred (needs assets/decisions):** the interactive 3D WebGL stallion hero (no GLB model yet — tracked below), the audio engine (432 Hz drone, stallion breath, keystroke cues: files don't exist; no dead toggle shipped), cryptographic passport logging (marketing copy only in terminal answers).
- [x] **Session 11 Oct 2026 (later) · Honesty pass.**
  - Terminal is now labelled DEMO MODE; removed "LATENCY 12ms / ENCRYPTED NODE / National Registry" boot lines and the unevidenced "zero major injuries", "14,800 hours", "₹10 lakh insurance", "fully sanctioned" and "cryptographically logged" claims (command.ts, home.ts, academy.ts, command and safety pages). Insurance, injury records and STPCI sanction read "being confirmed" until documented.
  - Lead form no longer promises a reply: confirmation says the form is a preview and nothing was saved (stamp reads PREVIEW). Terminal fallback likewise.
  - Demo cadets renamed to callsigns (Cadet Alpha/Bravo/Charlie), sample EFI numbers marked SAMPLE, "Seal verified" replaced with "Sample record · demo data" on /verify.
  - Hero: mouse-only cursor drift on the photograph (springed, 26/16 px), absent under reduced motion and on touch.
  - Checked: eslint and `tsc --noEmit` pass. `next build` could not run on the Mac (no linux-arm64 SWC binary); not screenshotted.
  - **Codex Vault phase tabs** (A + B hybrid): All / I Foundation / II Crucible / III Sovereign Command filter the 13 tiles; ARIA tabs with arrow/Home/End keys; pillar names 4 and 6 aligned to the client table. Lint and tsc pass; not screenshotted, no build run.
  - **Blender stand-in horse:** `public/models/marwari-proxy.glb` (45k tris, 0.85 MB) built headlessly with Blender 5.0.1 from `docs/reference/3d/build_marwari.py` (+ `.blend`, preview PNG). Stylised proxy only (arched neck, inward-curving lyre ears, obsidian coat); NOT hero-grade and not wired into the site (no three.js dependency yet). Replace with a commissioned or licensed Marwari GLB at `public/models/marwari.glb`.
- [ ] **Run `sh scripts/fetch-media.sh` on the Mac**, set `NEXT_PUBLIC_LOCAL_MEDIA=1`, then re-screenshot every page at 390/1440 and tune focal points and hotspot positions against the real stills (science overlay already registered).
- [ ] **Client answers** (Blueprint Part 10): minimum age and the Chairman's letter still open. (Funding model and school names settled by the 11 Oct directives: BSAH funds at zero CapEx; zone codenames, no named schools.)
- [ ] **3D stallion** (optional): GLB in `public/models/marwari.glb` + `components/three/StallionViewer.tsx`, falls back to the specimen plate.
- [ ] **Supabase**: 11 tables + `leads`, RLS, seed from `lib/content/*`, wire `LeadForm`, `/verify`, standings, Command AI.
- [ ] **Payments** (`/pay`, Razorpay) and the parent app.
- [ ] **Commissioned photography** replaces every placeholder one-for-one.

## Notes for the next session

- Run `npm install` on the Mac if dependencies changed (none were added this session).
- Images in the cloud build sandbox render as graded gradients (the CDN is blocked there); judge final visuals on the Mac after fetching media.

## Session 11 Oct 2026 (later) · Imagery, pricing, hubs, haptics, backend foundation
- Legend reel no longer uses mythological/banner-risk imagery (legendOcean/legendExodus removed from media.ts and fetch-media.sh); uses legendBlack and bgFort.
- Single pricing source: `lib/content/pricing.ts` (core, elite, kit, GST); used by academy, parents, gates, schools, command.
- Hubs carry a lifecycle `status` (all three are `prospect`); hub pages show status and mark timings as proposed samples.
- Compare slider: optional haptics toggle (off by default, hidden under reduced motion or without vibration support).
- Backend foundation (NOT applied anywhere, no Supabase project): `supabase/migrations/*` (schema, RLS, rank/passport/lead functions, seed of 13 pillars, 6 zones, 3 prospect hubs) and `supabase/tests/run.sh` (throwaway Postgres 16; 101 checks passed on 11 Oct 2026). Open decisions: `docs/reference/backend-open-decisions.md`.
- Still unverified: `next build` (no SWC binary in the Mac VM), screenshots at 390/1440, reduced-motion and keyboard-focus review.

## Session 11 Oct 2026 (neutrality pass 2)
- Regenerated legendCavalry, legendChetak, legendBahadur with Higgsfield (nano_banana_pro request; banner-free, no elephants, no miniatures). NOT yet visually reviewed by me (CDN blocked in my sandbox) — please check them in the Higgsfield gallery before launch; fetch-media.sh and media.ts point at the new files.
- Removed Kannauj, Rathore-conquest, Haldighati/Pratap, Mughal and Agra Fort framing from Legend, home story strip and the journal post; replaced with Marwar-horsemen / ballad-tradition wording (Directive §2–3). Route map labels now "River plains · The Thar · Marwar".
- Still open: three-dimensional stallion (asset to come), named Hyderabad schools (HPS, Oakridge, DPS, Gitanjali) kept as codenames until written partner consent exists, Crucible Variant A/B choice, audio cue assets.

## Session 11 Oct 2026 (audio engine)
- Added opt-in sound engine: `lib/audio/engine.ts`, `components/site/SoundToggle.tsx` (nav, default OFF, remembered when storage allows), `components/film/BreathCue.tsx` (Reel 01, Reel 04, Act III divider), keystroke sound in the Command Terminal. Missing files fail silently.
- Audio files are NOT present (Higgsfield cannot generate music or sound effects). Needed: bsah_ambient_432hz_drone.mp3, bsah_stallion_breath.wav, bsah_keystroke.wav in public/audio; licence to be confirmed (see public/audio/README.md).
- Directive Doc 04 terminal answers NOT adopted verbatim: "25–30% returned", "14,800 hours, zero major injuries", "₹10 Lakh insurance per cadet", "fully sanctioned by STPCI / cryptographically logged" have no evidence on file (claims ledger). Terminal shows "being confirmed" until evidence and owners are supplied.
- Pan-India benchmark copy keeps heritage schools unnamed (Directive names HPS, Doon, Mayo; naming real institutions needs their consent).
- [x] **Session 11 Oct 2026 (evening) · QA, palette, images, admissions, audit log.** Unmerged branches, one per task:
  - `claude/pr-1-sound-engine`: opt-in sound engine (default off; the three audio files are owner-supplied, see `public/audio/README.md`). Carries all earlier directive work.
  - `claude/pr-2-qa-fixes-images-palette`: full build + 390/1440 screenshots, keyboard focus and reduced-motion audit (`docs/qa/`); fixes; the three regenerated legend images; Marwari Studbook palette tokens.
  - `claude/pr-3-admissions`: placeholder `/admissions` page from existing content, flagged draft.
  - `claude/pr-4-audit-log-migration`: `20261011000400_audit_log_coverage.sql` + tests (120 checks pass on disposable Postgres 16).
  - Blocked on owner: GitHub push credentials, sound files, 3D stallion GLB, client answers, claim evidence (25-30% share, ticker numbers marked sample).
- [x] **Strict palette pass (11 Oct 2026, `claude/pr-5-strict-palette`).** Removed the cursor-following gold lamp and gold dust (`Atmosphere`, `GoldDust` deleted), Hero dust-wall screen layer, fleet radial glow, glow shadows and sepia/hue grades. Tokens in `app/globals.css` now resolve to the six studbook colours (#0F0E0D, #2A1D15, #593822, #FFFFFF, #D9D5CD, #8C8882); old names kept as aliases. Parchment documents are flat Ceremonial White. Lint, typecheck and build pass; 20 routes x 2 viewports scanned for warm-hue pixels.
- [x] **Session 12 Oct 2026 · Warm equestrian palette (visual refinement only).** Branch `claude/warm-equestrian-palette`. No routes, copy, data, forms or logic changed.
  - Replaced the black-dominant theme with a light, warm editorial identity: ~70% ivory/parchment/chestnut/caramel/leather (reference 2) and ~30% charcoal + antique gold (reference 1). Blueprint 3.1 and `CLAUDE.md` updated with the new token table.
  - `app/globals.css`: role tokens (night, umber, ember, bone, sand, dust, brass, gold, line, blood, frost, parchment) now carry light values; new `.tone-dark` / `.tone-light` scopes swap them, so any section becomes a dark scene with one class. Fixed brand colours added (ivory, parch, offwhite, sandline, chestnut, caramel, leather, charcoal, antique). `shade-*` gradients, `cinematic-vignette`, photo grades (`--grade-*`, used by `FilmImage`), plate/parchment shadows and the crest tint all follow the scope. New `surface-leather` (reference 1 texture) and `surface-paper`. Grain is now a fine brown paper grain; site vignette is a faint leather edge.
  - Deliberate dark scenes: home hero film (fades into ivory), both intermissions, Seal verifier, finale, every end card, footer, menu, loader, command terminal, specimen plate, passport, CCTV wall, fixtures board, phones, journal next-story card, Matrix HUD when active.
  - ~60 hard-coded copper/sand/dust/white colours in SVG diagrams moved to tokens (`var(--color-…)` / `color-mix`), so diagrams read on both tones. Seal metal, QR, passport cover, parents rail and contact gates re-coloured to antique gold / leather.
  - Contrast: every text token pair checked ≥ 4.5:1 on canvas, surface and raised panel in both tones.
  - Verified: lint, typecheck, build pass. Every route screenshotted at 1440 and 390, plus reduced motion, menu, loader, solid nav and keyboard focus. Caveat: the Higgsfield CDN and hero mp4s were unreachable from the review sandbox, so photographs were checked against stand-in frames from the hero poster; re-check with real media.

- [x] **Session 23 Oct 2026 · Completion Master Directive.** Lint 0 errors; Next.js 16.4.2 security patch; consent,
  attribution, idempotency and rate limits on every enquiry; server-side `/verify` with real statuses; CSP and security
  headers; error boundaries; 3D failure resilience; sitemap/robots; payment core (not connected); website-intake
  migration (tested, not applied); CI workflow; 29 unit + 147 SQL + 12 E2E checks passing. Details and blockers:
  `docs/IMPLEMENTATION_PROGRESS.md` (now the canonical progress file).

- [x] **Session 23–24 Oct 2026 · Mobile performance pass** (branch `perf/mobile-lighthouse`). Results, visible changes
  and open options: `docs/PERF_NOTES.md`; summary in `docs/IMPLEMENTATION_PROGRESS.md`.

## Session 24 Oct 2026 · Effects integration (React Bits / 21st.dev pieces, on-brand)
Branch `session/2026-10-24-fx-integration`. New shared primitives in `components/motion/fx/` (all TS, tokens only, reduced-motion safe, no new dependencies — gsap/motion/three were already installed):
- `FilmNoise` (React Bits Noise) — home act cards + Legend ch. VIII (1950s) as worn archive film.
- `EmberTrail` + `glow-cursor-gl.ts` (React Bits GlowCursor) — mouse-only ember trail on the dark home act cards.
- `BrassBorder` (React Bits StarBorder) — travelling point of light on the home finale's primary CTA; finale pills/glass/hex replaced with square tokenised buttons.
- `SealRing` (React Bits CircularText) — turning seal legend around the crest in the footer (decorative).
- `VelocityMarquee` (React Bits ScrollVelocity) — virtues marquee inside the new peg run.
- `MorphGallery` (21st.dev Morph Gallery, controlled) — noise dissolve between peg-run stages; cross-fade fallback.
- `MaskedWord` (React Bits MaskedHeading) — "REVIVAL" cut out of the herd photograph, Legend ch. IX.
- `ExpandingFrame` (React Bits ScrollExpand) — Schools §2b "Room to ride".
- `AsciiRipple` (own build in place of React Bits Pro ASCII Ripple; no licence) — Why §1b.
- `CurtainChapters` (GSAP "Animated Sections", scroll-driven, no wheel hijack) — Parents §1b morning session (times SAMPLE).
- `DepthRibbon` (own CSS-3D build in place of React Bits Pro Depth Ribbon) — About §2a.
- Tournaments §3: `PegRun` replaces the static course diagram (adapted from the uploaded "Art of the Peg" prototype; its unsourced "18 ms window" dropped).
- Anatomy §1b: `DualBody` 3D rider+horse section ported from the uploaded "One conversation. Two bodies." prototype to three r186 (no CDN, report modals/GLB upload/audio removed).
- Not adopted: Spline (off-brand demo scene, new deps), framer-motion (motion already installed), React Bits Pro registry, the Apple image-sequence demo (`HorseSequence` already covers it).
- 8 new Higgsfield stills (Blueprint 8.3), CDN-only until `sh scripts/fetch-media.sh` is run on the Mac (now also writes WebP); then switch `cdnOnly` → `m` in media.ts and commit the WebPs.
- Blueprint Part 4: S63–S69 added. Verified in the cloud sandbox: lint (0 errors), typecheck, `next build`; 390/1440 + reduced-motion screenshots of every touched section; keyboard focus on peg tabs and finale CTAs. Unit tests pass except the media test, which fails only in the sandbox because `public/images/*` were not copied there. Photos rendered as gradients in the sandbox (CDN blocked); judge the real stills on the Mac.

- [x] **Session 24 Oct 2026 · Effects review** (same branch, on top of the effects commit). Independent code review +
  browser audit of every new section (320–1920 px, reduced motion, keyboard). Fixed: unreadable finale e-mails; copy
  hidden from screen readers in the expanding frame and the curtain day; SAMPLE on every curtain-day time (now on the
  published 06:15 Dawn Patrol); ember trail and peg-run gallery no longer do WebGL work while offscreen or idle (and
  release their contexts); marquee pauses offscreen; lazy masked-word still; reduced-motion gaps in the brass border and
  ember trail; tab-panel focus and play-button semantics; three anatomy notes corrected; grain, brass border, ASCII
  panel and expanding frame set up only near the viewport (effects now cost nothing measurable in mobile Lighthouse).
  Verified: lint 0 errors, typecheck, 79/79 unit tests, build, 18/18 browser smoke. Details:
  `docs/IMPLEMENTATION_PROGRESS.md` (F17).
- [x] **Session 24 Oct 2026 · Rigged Marwari stallion (Blender) for the hero and the anatomy plate.**
  Built from the owner-supplied Tripo sculpt in Blender 5.2, headless: welded, decimated, coat repainted Kala black,
  42-bone rig weighted via a voxel proxy, head straightened, eight clips (Idle_Breathing, Head_Turn, Ear_Rotate, Blink,
  Weight_Shift, Walk, Trot, Tail_Sway; legs by planar IK, hooves planted). Exports: `marwari-hero.glb` (77k tris, 619 KB)
  and `marwari-anatomy.glb` (214k tris, 1.07 MB), Draco + WebP. `StallionStage` rewritten on three.js (gaze, tilt with
  permission, touch drag, breathing, time-of-day light, dolly to `/cadets#passport`, reduced-motion still, poster
  fallback); old `stallion-gl.ts` removed; shown only at `/?stallion=preview` until approved. `Anatomy3DHorse`: new model,
  five bone-anchored hotspots with region glow, camera focus, keyboard-focusable markers, Stand/Walk/Trot; 2D plate kept.
  Verified: typecheck, build, touched files lint-clean (47 lint errors are all in untracked `public/anatomy/vendor`),
  390/1440 screenshots, reduced motion. Open: Tripo licence plan to confirm; not photorealistic (see report).
  Report: `docs/reference/3d/marwari/README.md`.
- [x] **Session 24 Oct 2026 (later) · Marwari 3D production pass** (branch `feature/marwari-3d-production`, rollback tag
  `checkpoint/pre-marwari-production`). Hybrid retopology (Quadriflow quad body; ears as detail pieces; tail and mane as
  hair cards), Cycles bakes (2048 colour/normal/ORM), 46-bone rig with mane bones, eye domes, ten clips (adds
  Attention_Response, Mane_Sway), hero 1.03 MB / mobile 0.65 MB / anatomy 1.2 MB. Hero: layered gaze over clips, mobile
  model, dynamic resolution, attention on pointer entry; plate: hotspot labels per brief, Full Screen, ears → attention,
  hooves → walk. Fixed a route-cache bug (stale dolly state on return from /cadets). Verified: 79/79 tests, typecheck,
  lint 0 errors, build, axe (hero clean), keyboard, reduced motion, no-WebGL, denied motion permission (stubbed),
  7-cycle mount test. Not done: hand retopo of head/ears, KTX2, Safari/real devices, Lighthouse.
  Report: `docs/MARWARI_3D_PRODUCTION_REPORT.md`.
- [x] **Session 25 Oct 2026 · Marwari realism, physics and cinematic world** (branch `feature/marwari-film-world`, behind
  `/?stallion=preview`). The approved horse is untouched; added a gait library authored in Blender from stride data
  (Walk, Trot, Canter L/R, Gallop L/R, Sprint L/R, Stop, Alert), a speed-driven locomotion controller with hoof-contact
  sensing, terrain following with look-ahead and a penetration correction, spring-damper tail and mane, three procedural
  places (Rajasthan desert, Marwar village street, the academy: illustrative, labelled so), three story chapters in the
  home hero with veil transitions, chapter navigation and skip, adaptive quality and a phone geometry LOD, camera
  avoidance, synthesized hoofbeats on the site sound toggle, coat/eye/hoof/muzzle materials. Measured: 60 fps desktop
  and phone profile on an M2, GPU 5-11 ms desktop and 4-5 ms phone profile; foot slip about 14 % of ground speed (RMS)
  inside the stance window, hoof sink under 3.3 cm before correction. Verified: typecheck, build, lint 0 errors in changed
  code, 84/84 tests, axe 0 violations, keyboard, reduced motion, no-WebGL, 390/1440 captures. Not done: nostril flare,
  normal micro-bump, foot-lock IK, real phone / Safari / Firefox, listening test of the hoofbeats.
  Report: `docs/MARWARI_FILM_WORLD_REPORT.md`.
- [x] **Session 25 Oct 2026 (later) · Runtime foot-lock** (branch `feature/marwari-film-world`, commit `8d27874` and the
  reach fix after it). Hooves anchored at ground contact and held through stance; gait landings now match stance speed
  (`RETRACT` 1.0). Ground slip with the lock on 4–9 % of speed at trot, canter, gallop and sprint (off: 11–12 %); walk
  is unstable (4 % in one run, 28–31 % in two) because the front-left late stance is out of reach. Sprint and some gallop
  stances never touch the ground in their authored stance. Needs gait re-authoring; see report §3b.
- [x] **Session 25 Oct 2026 (latest) · Gait re-authoring** (`tools/blender/03_animation/stage11_gaits.py`). The reach
  offset per gait is now searched (`auto_bias`) instead of hand-set, and the walk is a shorter, quicker stride (1.152 m at
  1.25 Hz, was 1.44 m at 1.04 Hz; same 1.44 m/s) because the rig cannot reach the old one. Hero, mobile and anatomy GLBs,
  `marwari-gaits.json` and the hero source .blend re-exported. Browser, lock on / off, ground slip: walk 3–4 % (one run in
  three at 18 %) / 14 %, trot 3–4 / 10–11, canter 5–6 / 12, gallop 7–8 / 11, sprint 9 / 12. Walk front-left no longer
  released (all stances held). Mid-stance hover over 2 cm: sprint front 20 → 11 % of frames, sprint hind 37 → 28 %, gallop
  front 21 → 10 %. Still open: 3–5 sprint and 0–4 gallop stances per run never touch the ground; trot to sprint strides
  still beyond the rig's reach; the new walk should be looked at by eye; no phone or clean performance re-measure. A
  sole pre-compensation variant (`GAIT_PRECOMP=1`) was tried and rejected. Lint, typecheck and 84/84 tests pass;
  two lint warnings fixed in `scenery/campus.ts`. See report §3b.
- [x] **Session 25 Oct 2026 (latest) · Stances that never touched the ground** (`footlock.ts`, `locomotion.ts`; no new
  assets). The misses were mostly terrain and bank, not gait data: with the lock off, 0 of 124 gallop and 136 sprint stances
  missed on straight desert but 52 of 125 and 69 of 137 missed in the campus turn (body rolled 17°), and the sideways-only lock
  could not move a hoof vertically. The lock now seats a held hoof on the surface under it (sole on the terrain), never lets a
  toe into the surface, and anchors as soon as the stance begins. Misses: 0 at every gait on desert, village and campus. Mid-stance
  sole over 2 cm up: sprint 25 % → 1.7 % (desert), 50 % → 21 % (campus turn). Ground slip, lock on: walk 0.4, trot 2.3–2.7,
  canter 3.0–3.2, gallop 4.5, sprint 6.1–6.4 % (lock off 10–14 %). Open: banked turns still leave 21 % of campus sprint frames over
  2 cm and the lock lets go in about a third of their mid-stance frames; the walk's swing peaks at 10 m/s in the clip; no phone
  or build re-run; one frame looked at by eye. Lint 0 warnings, typecheck, 84/84 tests. See report §3c.
- [x] **Session 25 Oct 2026 (latest) · Walk swing speed** (`stage11_gaits.py`; hero, mobile, anatomy GLBs and
  `marwari-gaits.json` re-exported; hero and anatomy source .blend updated). The 3-4 m/s I quoted for a real walk is the
  *average* swing speed (stride 1.15 m / swing 0.36 s = 3.2 m/s); a smooth swing cannot peak below 1.5 x that, 4.8 m/s. The clip
  peaked at 10 m/s because the pastern and hoof unfolded into the landing; Walk now has `foldScale` 0.2 and lift 12 / 10 cm.
  Browser, walk swing: peak 10.0 -> 5.7 m/s, median 4.2 -> 3.9, toe height 35 -> 11 cm. Walk ground slip with the lock 0.6-0.9 %
  (0.4-0.5 before), 0 stances miss, hover 0. Other gaits' clips identical (their swing peaks 12.7 / 17 / 27 m/s, not changed).
  New generator switches: `GAIT_ONLY`, `GAIT_OVERRIDE`, `GAIT_DEBUG`. Not done: phone, build re-run, any by-eye review beyond one
  frame. See report §3d.
- [x] **Session 25 Oct 2026 (latest) · Trot and canter swings** (`stage11_gaits.py` `foldScale` 0.2 for Trot and Canter, lifts
  unchanged; hero, mobile, anatomy GLBs, `marwari-gaits.json` and both source .blends re-exported; walk, gallop, sprint clips
  identical). Browser swing peak: trot 12.8 -> 9.3 m/s (floor 8.1), canter 17 -> 12.0 (floor 10-11); toe height 55 -> 22 cm and
  74 -> 31 cm. Ground slip with the lock, desert: trot 2.6-3.5 %, canter 3.0-3.7 % (unchanged within run-to-run spread); 0 stances
  miss. Found: the seated lock shortens the sensed flight phase (trot 15 % in the clip, 10-11 % with the lock; canter 16 -> 14-16,
  sprint 37-39 -> 32-34); releasing the seating with the stance did not help and made the campus turn worse, so it was reverted.
  Gallop and sprint swings still peak at 25 and 29 m/s with toes 90 cm up (not touched). No phone or build re-run. See report §3e.
- [x] **Session 26 Oct 2026 · Banked turns** (`footlock.ts`, `locomotion.ts`; no new assets). The campus film does corner hard at
  trot and canter (yaw 1.47 rad/s at 3.4 m/s, roll 16°; 1.0 rad/s at 5.2 m/s), so this is on screen. Causes: the safety fade judged the
  first 30 ms of every stance (hoof still coming down), the shoulder/hip abduction limit (13°) ran out in hairpins, and the roll lifts
  the outside feet 4 cm. Fixes: residual not judged for the first 60 ms or on a push-up alone, give-up residual 2 -> 6 cm, abduction
  26° shoulder / 23° hip, body drops 0.15 m x sin(bank), seating ramp 15 ms. Campus path, committed -> now: canter corners unlocked
  52.6 -> 0 %, sole over 4 cm 7.6 -> 0 %, slip 5.2 -> 4.4 %; trot corners unlocked 48.8 -> 0 %, over 4 cm 9.4 -> 0 %, slip 5.6 -> 4.4 %, but
  23 % of trot-corner stances stay 2-3 cm up (45 of 196 never within 4 cm). Gallop and sprint in forced turns: unlocked 27-39 -> 0 %,
  right-turn gallop misses 16 -> 0. Straight runs unchanged. Open: right turns slip more than left (7.6 vs 4.7 % gallop; the rig's right
  hind rests 16 cm ahead of the left), trot-corner float, no phone or build re-run, one frame looked at. See report §3f.
- [x] **Session 26 Oct 2026 (later) · Left-right symmetry** (`stage11_gaits.py`; hero, mobile, anatomy GLBs, `marwari-gaits.json`,
  hero source .blend re-exported; all moving clips changed). Each limb pair's stance is centred on the mean of its two rest
  positions (`STANCE_FET`, `GAIT_SYM=0` for the old way) and one reach offset is searched for both sides (worse side first); per-leg
  reach error is now in the gaits json. Forced turns, ground slip before -> now: right-turn gallop 7.6 -> 4.1 %, sprint 9.8 -> 4.1 %
  (6.1 % at 60 fps, was 11.0); left 4.7 / 5.4 -> 5.6 / 4.8 %; straight desert trot 2.5-2.8 -> 0.8-1.1 %, canter 2.7-2.8 -> 2.0-2.1 %,
  sprint 6.3-6.5 -> 5.0-5.2 %; all stances held; campus trot corners 4.4 -> 3.0 %. Left-turn gallop hover rose (3.6 -> 7.0 % over
  2 cm). Not fixed: lateral foot asymmetry (left hind x +0.23, right -0.09; planar IK cannot move it), lead-dependent fore-pair
  difference. Anatomy page, phone and build not checked. See report §3g.
- [x] **Session 27 Oct 2026 · Hover in hard turns, and a correction** (`footlock.ts`, `locomotion.ts`; no new assets).
  **Correction to the "Banked turns" entry above:** the campus film does not corner hard. Director-run from the gate its worst yaw is
  0.61 rad/s (canter, roll 10.8°) and the trot never passes 0.11; the 1.0-1.5 rad/s corners came from QA runs started off the path.
  Changes: pastern limit 26° -> 40° (the pastern sat at its limit through every banked stance and a gallop hind's late stance) and
  maximum yaw rate 1.5 -> 1.1 rad/s (a 25°-abducted forefoot has a tenth less vertical reach). Forced circles, sole over 2 cm up:
  left gallop 7.0 -> 1.3 %, left sprint 4.4 -> 1.0 %, right canter 7.7 -> 0 %; trot hairpin 21-24 -> 5 % (misses 12 -> 0); straight runs
  and ladder unchanged; every stance held. **Found, not touched:** on the film's own beats the lock fails during gait changes and lead
  changes (gait purity 0.8-0.93 gates it down): desert walk -> trot slip 100 % of speed for a second, trot -> canter 21 %, canter ->
  gallop 10 % with 38 % of stances unlocked; campus trot -> canter 13 %. Between changes slip is 1-5 %. Phone, build, anatomy page not
  checked. See report §3h.
- [x] **Session 27 Oct 2026 (later) · Gait and lead changes** (`footlock.ts` only; no new assets). The lock's weight was multiplied
  by `smoothstep(0.6, 0.85, gaitPurity)`, so every foot, planted ones included, was cut loose during a blend. Removed the gate.
  Film beats, four starting phases, windows around the changes, before -> now: desert slip 0.74 -> 0.34 m/s, mid-stance frames
  unlocked 13.3 -> 0.0 %; campus 0.52 -> 0.20 m/s, 11.3 -> 0.5 %; at 1/60 s 0.74 -> 0.39 and 0.62 -> 0.44. Per second (desert):
  walk -> trot 26 -> 12 %, trot -> canter 17 -> 8 %, canter -> gallop 11 -> 3 %. Steady gaits unchanged. Tried and dropped: a
  per-foot vote gate (worse, 500 mm frames), planting from the pose (worse), a slower release (one 411 mm jump). Open: a start from
  standing slips 21 % of 0.6 m/s for a second; lock frame-to-frame displacement max 119 vs 89 mm; no frame looked at by eye in a
  blend; phone, build, anatomy page not checked. See report §3i.
- [x] **Session 27 Oct 2026 (later still) · Start from standing** (`footlock.ts` only; no new assets). The lock only ran above 0.4 m/s,
  and the walk takes about a second to get there, so planted feet skated at up to the body's speed. The lock now starts once the walk
  holds 0.4 of the pose (about 0.3 m/s) while the horse is not slowing, and stops under 0.4 m/s and falling as before (a latch). Swept
  0.02-0.9: from the first moment it nearly stops the skating (0.04 m/s) but a hind foot floats 3-5 cm (7 % of mid-stance frames over
  2 cm); 0.4 halves the skating with the float where it was. Four phases, 1/120 s, planted-foot speed rms / max: desert stand -> walk
  0.23 / 2.0 -> 0.13 / 1.1 m/s (sensor slip 0.10 -> 0.01), campus stand -> trot 0.27 -> 0.21; hover 1.9 -> 2.0 % over 2 cm, none over
  4 cm; whole film beats unchanged (desert 0.29 -> 0.28, campus 0.24 -> 0.24). **Own error corrected:** my QA runs carried state
  (acceleration, exertion, stop cooldown) from one run to the next, which gave a false campus regression; runs now start clean and
  repeat. **Found, not fixed:** the stop (below 0.4 m/s the lock lets go of all four feet in 50 ms, mid-stance ones included): planted
  feet up to 7.7 m/s in the worst phase, 12 % of mid-stance frames unlocked; same as before this pass. Also open: one 3.8 m/s frame
  at the campus walk -> trot change; skating remains for the first 0.3 s. One frame at 1440 and 390 checked by eye; phone, build,
  anatomy page not checked. See report §3j.
- [x] **Session 27 Oct 2026 (end of day) · The stop** (`footlock.ts` only; no new assets). Two causes. (1) Under 0.4 m/s the lock let
  go of every planted foot in 50 ms, up to 12 cm from where the pose wanted it (7.7 m/s). Now such a foot's anchor slides to the pose's
  toe at 1 m/s (`STOP_SLIDE_MPS`), then lets go. (2) Found while measuring: a foot that had begun to let go and whose stance window
  reopened at a gait change was pulled 13-20 cm back to its old anchor (the 411-435 mm jump of the earlier passes); it now takes a new
  anchor. Four phases, committed -> now, planted-foot speed rms / max: stop from 1.5 m/s 0.67 / 5.9 -> 0.34 / 1.0 m/s (unlocked 5.8 ->
  0 %); film end beat (campus, 5.2 m/s stop) 1.34 / 37.5 -> 0.59 / 9.0 (unlocked 8.8 -> 2.3 %, largest lock jump 360 -> 127 mm, 1/120 s);
  from 5.2 m/s the largest jump 435 -> 106 mm. Starts, desert and campus beats unchanged; `npm test` 84/84. Tried and removed: a lift-off
  release scaled to the anchor's distance (worse at canter: 604 mm jumps). **Not fixed:** flicks while slowing through the gaits (toe
  over 5 m/s: 69 and 88 frames from 3.4 and 5.2 m/s; a third are the clip's own swing, a third lift-offs from a far anchor); a foot may
  glide up to 1 m/s for ~80 ms after standstill; the 5.2 m/s planted maximum reads higher (6.6 -> 15.8, a reclassified flick, not
  checked frame by frame). Stills only; phone, build, anatomy page not checked. See report §3k.
- [x] **Session 27 Oct 2026 (night) · Lift-offs while slowing** (`footlock.ts` only; no new assets). Logged every release in the stops:
  while the horse slows through a walk or slow trot the anchor is 40-60 cm from the clip's toe at the lift-off (not 10-25 cm), and the
  50 ms release flicks the toe 8-13 m/s (my reading: the stride phase advances across a changing stride-length blend; not isolated).
  While slowing by more than 0.3 m/s2 a lift-off now lasts 1.5 x distance / (1 + 2 x body speed), 50 ms to 0.3 s; a foot letting go
  when its stance reopens re-anchors once its toe is within 3 cm of the clip's. Four phases, committed -> now: lock-driven frames over
  5 m/s 25 -> 4 (3.4 m/s stop) and 30 -> 5 (5.2 m/s stop) at 1/120 s; film end beat 32 -> 9, ground rms 1.82 -> 1.69; largest lock jump
  106 -> 94 mm (5.2 m/s stop). Other beats and starts identical to the printed figures; `npm test` 84/84. Softer caps (0.5-1 + 1 x v)
  and applying it to every lift-off were tried and rejected (jumps of 260-396 mm at canter, 328 mm in the desert's walk -> trot).
  **Not fixed:** the over-5 m/s frames that remain are the clip's own toe in the gait blends (62 of 115 in the end beat), so ground
  maxima barely moved, and one frame each rose (9.0 -> 11.4 m/s planted, 19.3 -> 21.2 ground at 1/60 s); the root is in the
  stride-phase advance in `locomotion.ts` (**corrected in the next entry: it is not**). Stills only; village, steeper stops, phone,
  build, anatomy page not checked. See report §3l.
- [x] **Session 27 Oct 2026 (night, later) · The anchor distance: not the stride length, the clips' footfall timing** (`locomotion.ts`
  only; no new assets). Tested the stride-length-blend hypothesis with the lock off: advancing the phase by the dominant clip's own stride
  length changes nothing (stances with a changing dominant clip: 478 -> 488 mm of clip-toe drift; the arithmetic says the weighted slips
  cancel). The cause is that walk and trot are authored half a cycle apart for the hind legs, so at the shared phase one has a foot in
  stance where the other has it in swing and the cross-fade puts the foot halfway (67 cm apart at phase 0.45). Each gait clip now plays at
  the stride phase plus an offset (walk 0, trot and faster 0.52; `GAIT_PHASE_OFFSET`, derived from the clips' toe paths; 0.49-0.57 work,
  0.60 and above do not). Four phases, previous commit -> now: stop from 3.4 m/s planted-foot speed 0.54 / 8.6 -> 0.30 / 1.0 m/s, frames
  over 5 m/s 50 -> 0, unlocked 3.4 -> 0 %; from 5.2 m/s 0.68 / 15.8 -> 0.41 / 6.0, unlocked 3.7 -> 0; film end beat ground rms 1.69 -> 1.46,
  frames over 5 m/s 115 -> 93; campus beat slip 0.24 -> 0.18, stand -> trot 0.17 -> 0.02 (the 3.8 m/s frame is gone); steady gaits and a
  lead change unchanged. Aligning trot with canter (best 0.25) was tried and dropped: the cost is flat and the results jump from one offset
  to the next (desert speed-up slip 0.29 -> 0.61 m/s at the geometric best). **Worse by a little:** desert beat at 1/60 s (slip 0.32 ->
  0.35), end beat ground max at 1/120 s (18.8 -> 21.5 m/s), the 5.2 m/s stop's largest lock jump at 1/60 s (144 -> 171 mm). **Not done:**
  trot <-> canter, canter <-> gallop alignment (the canter -> trot part of the 5.2 m/s stop still has 43 frames over 5 m/s). Stills only;
  village, phone, build, anatomy page not checked. See report §3m.
- [x] **Session 28 Oct 2026 · Trot-canter and canter-gallop alignment, with twelve phases and both leads** (`locomotion.ts` only; no new
  assets). Method: stance-weighted foot-position cost at 80 phase samples, then twelve starting phases, the lead forced, four transitions
  as speed-ups and slow-downs, and a keep rule fixed beforehand. **Trot -> canter is not kept (reversed in the next entry: the campus
  "regression" was four-phase luck):** each lead at its own optimum (right
  +0.245, left +0.745) improves both directions (frames over 5 m/s 92 -> 33 and 96 -> 40 right, 79 -> 33 and 93 -> 38 left), but the
  campus beat gets worse at the lead change (slip 0.18 -> 0.31 m/s, a 14.1 m/s frame mid lead change); a common offset helps one lead and
  hurts the other (the trot is symmetric under half a cycle plus a left-right swap, the canters are not). **Canter -> gallop is kept:** one
  offset for both leads, gallop and sprint 0.52 -> 0.4225, canter and trot unchanged at 0.52; passes the rule on both leads and both
  directions (slow-down slip 0.35 -> 0.22 right, 0.37 -> 0.26 left; frames over 5 m/s 26 -> 21 and 34 -> 21; speed-up 61 -> 42 and 48 -> 21).
  The film's own gain is small: stop from 10 m/s frames over 5 m/s 128 -> 122, desert canter -> gallop jump 72 -> 61 mm (128 -> 95 at 1/60 s),
  sprint -> gallop jump 87 -> 99 mm at 1/60 s; stops from 1.5-5.2 m/s, end beat, campus beats, starts, lead changes unchanged. **Corrections
  to §3m:** the trot -> canter cost is not flat (13 cm under the median; the erratic results were four-phase noise); my first left-lead
  baseline had the left canter half a cycle off the committed one and was redone. **Not done:** aligning trot with canter for both leads
  (needs a lead-change blend of clips half a cycle apart, or re-authored clips). Stills only; village, phone, build, anatomy page not
  checked. See report §3n.
- [x] **Session 28 Oct 2026 (later) · Trot-canter alignment for both leads, kept** (`locomotion.ts` only; no new assets). Asked to change
  how a lead change blends canters half a cycle apart; found it is not needed. Flipping the lead at 20-24 phases of the stride shows the
  committed lead change already throws a foot at 8-15 m/s at 2-3 of 20 phases (my earlier 12-phase check missed them), the aligned canters
  are no worse at the present rate 3 (worst frame 15.2 -> 12.5 m/s, frames over 5 m/s 8.3 -> 6.0, jump 121 -> 116 mm; slip +10-12 %), and
  both faster and slower blends are worse. The campus "regression" of the previous entry was four-phase luck (twelve phases: slip 0.37 ->
  0.39, ground rms 1.45 -> 1.19, worst frame 15.2 -> 14.9 m/s). Kept: canter 0.765 right / 0.265 left (half a cycle apart), gallop and
  sprint 0.6675 / 0.1675 (so canter -> gallop stays aligned for each lead). Twelve phases, previous commit -> now: trot <-> canter frames
  over 5 m/s 92 -> 33 and 96 -> 40 right, 79 -> 33 and 93 -> 38 left; stop from 5.2 m/s planted-foot max 14.6 -> 7.1 m/s, frames over
  5 m/s 115 -> 62; desert beat 167 -> 122 and jump 139 -> 92 mm; campus beat ground rms 1.59 -> 1.26, frames 229 -> 138; end beat planted
  max 13.8 -> 7.9 m/s; steady gaits and starts unchanged. **Cost:** a lead change at gallop speed becomes much worse (frames over 5 m/s per
  change 2 -> 33), so the lead is no longer changed above 5.5 m/s (`LEAD_CHANGE_MAX_MPS`; the film has no lead change at gallop; a gallop
  turn keeps the previous lead). Also worse by a little: lock-driven frames in the 5.2 and 10 m/s stops (13 -> 18, 8 -> 18), the end beat's
  1/60 s planted max (10.2 -> 11.8), the desert sprint -> gallop jump (+10 %). **Not done:** a phase-gated lead change (the committed one
  has narrow bad phases). Stills only; village, phone, build, anatomy page not checked. See report §3o.
- [x] **Session 28 Oct 2026 (later) · The stallion film on the home page for everyone** (`components/hero/stallion-flags.ts`,
  `components/sections/home/StallionHero.tsx`). Asked why the desert, village and field with the horse are not on the home page. Cause: the
  whole stallion section was gated behind `?stallion=preview` / `NEXT_PUBLIC_STALLION_MODEL`, neither set, so plain `/` showed only the
  opening film and the doctrine. Now on by default; `?stallion=off` hides it for a visit (and no longer fetches the model: the hydration
  pass reads the server snapshot, so the preload checks the URL). Checked on the dev server at 1440 and 390: stage, desert, village and
  academy render with the horse, no console errors, no overflow at 390, nav clear; reduced motion gives the still hero (no chapters, by
  design). **Cost:** every `/` visit now downloads the hero model (1.2 MB, 0.8 MB phones) plus Draco. **Not done:** production build not
  re-run (dev server shares `.next`); faint chapter label over the pale village wall at 1440 (fixed in the next entry); the 2.5D environment
  brief still needs its three reference images. See report §3p.
- [x] **Session 28 Oct 2026 (later) · Chapter label readable on the pale scenes** (`components/sections/home/StallionHero.tsx` only). The
  desert, village and academy chapter label, "Skip the film" and the chapter buttons sat on the canvas with nothing holding them. Now a
  charcoal fade from the top and the bottom of the pinned frame while a chapter shows (off on the dark stage), ivory/sand type with a soft
  shadow, stronger button fills. Contrast at 1440 (brightest 3 % of the label vs median background): label 5.46 desert / 5.29 village /
  12.96 academy; line alone 5.0 / 4.68 / 11.95; "Skip the film" 8.44 / 6.22 / 11.85 (the first version with a gold number measured 2.97-3.15
  and was dropped). Re-checked all three chapters at 1440 and 390: no console errors, no overflow. **Not done:** chapter buttons' contrast
  not measured; production build not re-run. See report §3q.
- [x] **Session 28 Oct 2026 (later) · Owner's five fixes: scroll sticking, hero under the nav, curriculum bond, one curtain per page**
  (home + legend, curriculum, schools, cadets, science, safety, fleet). (1) The anatomy exhibit's OrbitControls took every wheel event
  over the canvas (wheel = zoom, `preventDefault`) and a vertical swipe on a phone (touch-action none), so the page stopped under the
  cursor; `enableZoom = false` and `touch-action: pan-y` in `public/anatomy/dual-body.html` (untracked file from another session, edit left
  uncommitted). Checked with real wheel events over the canvas: the page moves, no stall in the next 12 steps. Not reproduced before the
  change, read from the code. (2) Hero photographs on science, safety, parents and circuit now start below the fixed nav (`top-16 md:top-20`,
  charcoal behind), so the bar no longer covers the rider's helmet. Legend, schools, cadets, fleet heroes (3D/video/parallax) not changed.
  (3) /curriculum: the static dapple-grey photo that replaced the horse-and-hand sculpt is removed and the committed `BondHero` 3D is back
  (the static version is saved in the session scratchpad, not in git). It now fits: the canvas starts under the nav, the sculpt is scaled
  by height as well as width (`HEAD_SPAN`), the cut neck and sleeve fade out, the copy moves to the clear upper right on wide screens and
  under the stage on phones. The fit lives in `components/3d/HorseHandBond.tsx`, which also carries another session's uncommitted shader
  motion, so that file is left uncommitted. (4) One full-screen scroll curtain (the /parents "morning" scene) per page from
  `lib/content/curtains.ts` via `components/sections/shared/PageCurtain.tsx`, four existing photos and plain captions each (no figures, no
  health claims); caption fade strengthened in `CurtainChapters.tsx`. Removed: home `ImageCubeGallery` (section only; the component file stays),
  curriculum `CurriculumPhaseReel` and the batch photo band (component file stays). Kept: every link-bearing image section (schools arena
  reel, cadets drill reel, legend gallop video and closing band, fleet galleries) and each page's hero. Checked at 1440 and 390: curtains
  render on all eight pages, no page errors, no horizontal overflow, reduced motion gives four stacked frames. **Not done:** the anatomy
  exhibit's realistic Marwari and cadet (needs a modern-three port of the exhibit, offered as its own session); production build not re-run;
  `/schools` logs two `ERR_INVALID_URL` console errors from an image placeholder `data:` URL that predate this work.
- [x] **Session 28 Oct 2026 (later) · Pixel-horse loader off the main thread, horseman logo, stock photos out** (1) The loader's pixel horse
  now runs in a worker on an OffscreenCanvas (`public/animations/pixel-horse.worker.js`, driven by `components/motion/PixelHorse.tsx`), so
  its frame rate no longer depends on the page hydrating; browsers without OffscreenCanvas fall back to the main-thread engine. The engine's
  old rule "a frame over 120 ms counts as 16 ms" (which stalled then jumped the legs) is now a 100 ms cap on the real time. The gait follows
  the load: a calm canter that eases to a gallop over 1.5 s, then a longer finishing run once the page is ready. Checked: the worker starts,
  draws, reports the cycle and the overlay leaves; not measured on a throttled CPU or network. (2) The supplied horseman-with-lance drawing
  is the BSAH mark: `components/brand/CrestMark.tsx` paints it as a mask in the current text colour (nav on ivory and charcoal, footer,
  sign-in, seals; `public/brand/bsah-horseman*.webp`), plus `app/icon.png`, `app/apple-icon.png` and a new `app/opengraph-image.png`
  (system Didot, not the site fonts). The nav mark is 48 px. The council crest badge (`Crest`) is unchanged. (3) The two Pexels photos in
  the home first-ride panels are replaced by AI stills (`legend-today`, `legend-chetak`); the unused `ImageCubeGallery` still lists the same
  two stock files. **Not done:** realism of the home "Instrument" 3D plate (mane cards, coat): not reproduced here, the plate did not
  render in the headless browser; proposed as its own session.

## Session 24 Oct 2026 · Implementation brief (CLAUDE_IMPLEMENTATION_PROMPT.md), uncommitted on `session/2026-10-24-fx-integration`
- Anatomy: one light "One conversation. Two bodies." exhibit (`public/anatomy/dual-body.html` in a same-origin iframe via `components/sections/anatomy/DualBody.tsx`) on `/anatomy` and the homepage (Matrix → SomaticMap). The old dark three.js port (`dual-body/engine.ts`, `loft.ts`, `lib/content/anatomy-dualbody.ts`) and unused vendor loaders were removed. Developer tools, header and Google Fonts are gone; self-hosted fonts in `public/anatomy/fonts/`; seated cadet visible by default; idle motion, Walk/Trot/Canter, Play/Pause; pauses off screen; non-WebGL fallback.
- Homepage horse sequence restored before the Instrument; frame drawn for any entry point; chapters no longer overlap. Equipment only on `/equipment`.
- Curriculum bond hero: light, full width, horse from the left edge, sleeve to the right edge, copy below; shader-driven breathing, muzzle and hand drift (`components/3d/HorseHandBond.tsx`).
- Ledger: one photograph, four selectable ranks (tabs), the selected rank's pillars listed. Fleet: clear full-width Marwari photograph with approved copy. Citadel: solid editorial column, unwashed 3D stage, pins clipped to the stage and de-overlapped, phones stack in flow. Sovereign Council: light portrait grid with placeholder captions (`public/images/council/SOURCES.md`). Contact: editorial corridor selector (radios, URL kept in sync). Information desk: single prompt surface, no auto-question. Nav: solid surface, staff sign-in icon → `/admin/login`; login restyled ("Welcome to the academy").
- SiteParallax now waits until React has hydrated a section before writing styles (fixed intermittent hydration warnings on /fleet and /contact).
- Verified in the cloud sandbox: typecheck, eslint on every edited file (0 errors), `npm test` 79/79, `git diff --check`; interaction tests and 1440×900 / 390×844 screenshots of every listed route (images and videos not copied to the sandbox show as gradients).

## Session 25 Oct 2026 · Three Codrops repos, used for real (uncommitted on `session/2026-10-24-fx-integration`)
Owner's brief: stop approximating the uploaded repos; use their techniques on the site, each in a different place, and put the Predator effect on the Marwari horse. Licences and what was and was not taken: `docs/THIRD_PARTY.md`.
- **`/legend` · The museum** (`components/sections/legend/museum/MarwariMuseum.tsx`, engine in `lib/museum/*`, scene in `components/3d/museum/*`): a scroll-driven 3D corridor hung with six Marwari-story plates (Arvista's engine idea, none of its art): sticky stage in a tall track, GSAP timeline scrubbed by Lenis, camera waypoints with lens shift, quality tiers, procedural + CC0 textures, canvas mounted only near the viewport. Chapter navigation, skip link, keyboard focus handover, "The six plates" catalogue (`PlatesCatalogue`) always in the page. Reduced motion or no WebGL: a short note plus the catalogue.
- **`/legend` · The last exhibit** (`LastExhibit`, `components/3d/cloak/*`): the Marwari model under a TSL "cloak" that dissolves the coat to glass and back (Predator's technique, new shader). Hover, press-and-hold and pin; poster fallback.
- **`/fleet` · Light the stallion** (`components/sections/fleet/LightTheStable.tsx`, `components/3d/relight/*`): the Codrops relighting technique (MIT) on three studbook portraits; the pointer is a lantern. Fixed a texture-upload overrun (depth texture resized without being released).
- **Not neural:** the three depth maps are classical luminance bas-reliefs (`scripts/make-relief-depth.py`) because Hugging Face is unreachable from the sandbox; replace `public/images/relight/*-depth.webp` with Depth Anything V2 Small output for measured depth.
- **Open:** the exhibit is verified with a stand-in model only; test with `public/models/marwari-hero.glb` on the Mac. Museum plates are placeholder illustrations and say so.

## Session 26 Oct 2026 · Marwari cinematic realism, Layer 0 audit (audit only; branch `feature/marwari-film-world`, baseline `223ce67`)
Owner's directive: take the Marwari to film-grade realism, but audit first and ask before asset replacement, re-rigging, a new render path or new tooling. **No product file, asset or config was changed.** Added: `docs/MARWARI_CINEMATIC_AUDIT.md` (audit, requirements matrix, ranked blockers, gated plan), `docs/qa/marwari-cinematic/` (60+ baseline frames and evidence JSON) and `tools/qa-marwari/` (the harness, so before/after use identical cameras and pinned assets).
- **Verdict:** a competent real-time character, not cinematic. Identity reads (lyre ears, arch, black Kala); coat (2048 px brown-leaning bake, 1.6 mm texels everywhere, no fur detail), mane and tail (stair-stepped alpha ribbons, sheet tail), head (no nostril, lips, lids; eye domes), lighting (no AO, no post, hero has no shadow) and procedural sets keep it below the bar.
- **New findings:** the black stallion reads chestnut / mahogany at 03:00, 06:00, 09:00 and 18:00 in the hero (light follows the visitor's clock); the eye domes sit about 2.3 cm above the sculpted sockets in the bind pose; each place re-entry leaks 3 textures, each `/` ↔ `/cadets` round trip adds about 0.7 MB heap and 19 listeners, and the stage's WebGL context is not released on unmount.
- **Measured (M2, production server; not a phone):** hero 62 fps, desert 61, village 61, academy 55 at retina (adaptive tier engaged under load 26); synchronous render cost 3 / 5 / 8 to 11 / 16 to 18 ms; phone profile 55 to 61 fps at 2 to 5 ms; GLB 1.03 MB (mobile 0.62 MB) on the wire, horse ready 2.0 s localhost, 29.5 s on Slow 4G (it starts loading only after hydration, about 9 s); GPU memory about 133 to 194 MB desktop (estimate). Gaits re-verified on the current clips: footfall order, suspension (trot 10 %, canter 15 %, gallop 28 %), slip 0.5 to 6.1 % with the lock (10 to 15 % without).
- **Checks:** typecheck pass; lint 34 errors, all in vendored `public/anatomy/vendor/*.js`; `npm test` 84 / 84; `npm run build` pass; existing e2e smoke 16 passed, 2 failed (`verify` unknown code, staff-console redirect; not horse routes, not investigated). Not run: phone, Safari, Firefox, axe, Lighthouse.
- **Conflict to settle:** the `Realistic Marwari horse 3D model` session is editing `footlock.ts` / `locomotion.ts` and re-exporting the GLBs in the same checkout; proposed split in the audit §1.2.
- **Waiting on the owner:** Gate A go-ahead (code-only: coat / light grade, eye re-seat, hair shading, micro-detail, optional five-shot camera, disposal fixes, place polish), Gate B choices (post stack, head / coat / hair asset pass, pre-rendered plates, deleting about 43 MB of unreferenced legacy GLBs). Nothing pushed, merged or deployed.

## Session 27 Oct 2026 · Marwari cinematic realism, Gate A applied (A1 to A7; uncommitted, not pushed; branch `feature/marwari-film-world`)
Owner approved Gate A (code only, reversible; no GLB, rig, post stack, new dependency or tooling; `footlock.ts` and `locomotion.ts` untouched). Full report with before / after frames: `docs/MARWARI_CINEMATIC_AUDIT.md` §11; captures in `docs/qa/marwari-cinematic/after/A1`..`A7`; harness in `tools/qa-marwari/`.
- **A1 black stays black:** new `components/3d/marwari-coat.ts` (neutral, luminance-capped coat albedo, warmth carried by the specular, rim and sheen), `studio.ts` (a studio environment built from emissive panels, replaces the room environment), `contact.ts` (hoof contact blobs and a ground patch), `daylight()` stops rebalanced. Mean warm bias (R minus B over a fixed body box, hero crop) at 06:00 14.6 to 4.7, at 18:00 4.7 to 2.5, at noon 4.8 to 2.0.
- **A2 eyes:** `marwari-eye.ts` re-seats each dome into its painted socket at load (guarded by the known positions, so a fixed re-export is left alone) and paints iris, pupil and limbal ring in the shader.
- **A3 hair:** `marwari-hair.ts`: alpha to coverage, strand shaping, Kajiya-Kay highlight, flutter; tail and mane streaming gains in `life.ts`.
- **A4 coat micro-detail:** hair-scale bump and anisotropy along the flow (`aFlow` attribute from the skin weights), region roughness, calmer pastern creases.
- **A5 camera:** `components/hero/reveal.ts` plus a "Play the reveal" button in `StallionStage` (hidden under reduced motion; any key, touch, wheel or scroll hands the camera back in 1.2 s): reveal from darkness, eye, ears, anatomy pass, full stallion, with captions. Mobile hero fit (muzzle no longer cut at 390 px, ears clear of the header at 768 px). Academy camera keeps out of avenue trunks, crowns and lamp posts.
- **A6 lifecycle:** the PMREM render target is disposed, not just its texture (the "+3 textures per place re-entry" is gone: 15 / 18 / 18 across repeated entries); `releaseRenderer()` frees the WebGL context when the canvas has left the page (stage and anatomy plate); the hero preloads its GLB and the Draco decoder as soon as it knows it will show the stallion; production builds request the GLBs as `?v=<content hash>` and serve only that URL `immutable` (`next.config.mjs`, additive); `FilmEngine.setPreset("auto" | "high" | "medium" | "low")`, `?quality=` on the home page.
- **A7 academy:** lighter, warmer gravel; avenue trees every 28 m instead of 14 and a little smaller; hedges replaced by a timber post-and-rail paddock fence; sun-bleached patches in the grass. Desert and village were not changed.
- **Checks:** lint 0 errors in the files touched (34 remain in vendored `public/anatomy/vendor/*.js`, unchanged), typecheck, `npm test` 84 / 84, `npm run build`, e2e smoke 17 passed / 1 failed (staff-console redirect; baseline 16 / 2), reduced motion (still frame, no reveal button), keyboard focus on the new button (2 px outline, first stop in the stage).
- **Measured (M2, not a phone; baseline commit and working tree as two dev servers, alternating, load 9 to 12):** no frame-cost change: 62.5 fps capped on both sides; sync render 3 to 4 ms hero, 6 desert, 7 village, 9 to 10 academy at 2x; GPU about +0.5 ms in the hero; draw calls +4 to +5; academy triangles -12 %. Textures stable per place; WebGL contexts over ten round trips 3 to 5 (was 3 to 15); heap +0.2 MB a trip (was +0.7); model request starts 6.0 s on Slow 4G (was 9.1 s), horse ready 26.8 s (was 29.5 s). The baseline's "academy 16 to 18 ms" was taken at load 26; quiet it is 9 to 10 ms. Details and the method: audit §11.3 to §11.5.
- **Not done / not verified:** desert and village polish; a phone, Safari or Firefox; whether `releaseRenderer()` itself fires in the round-trip test (contexts stopped accumulating, the cause is not isolated); the e2e run used a wrapper because no cached Playwright matched the installed Chromium.
- **For the owner:** the `next.config.mjs` change is the one flagged item (a content hash in the model URLs and an `immutable` header on that URL only; dev unchanged). Nothing committed or pushed.
- [x] **Session 28 Oct 2026 · Anatomy exhibit: the real Marwari and a cadet (owner request: "a more realistic model… and also the cadet").** Branch `feature/marwari-film-world`; nothing pushed.
  - **What changed.** `public/anatomy/dual-body.html` no longer builds a procedural cartoon on three r128. It is a module page (`public/anatomy/exhibit.js`, import map to vendored three r186 + the site's Marwari loader/coat/eye/hair helpers, `scripts/build-anatomy-vendor.mjs`). The horse is the hero's black Marwari (`public/models/anatomy-exhibit.glb`, 1.7 MB: same rig, all 18 clips); Walk, Trot and Canter play its own clips (0.7 x real speed, with the stride scrubber and the 5 stride dots). Idle uses Idle_Breathing, Blink, Ear_Rotate, Tail_Sway, Mane_Sway. The `bsah-anatomy-visibility` / `bsah-anatomy-height` contract, `enableZoom = false`, `touch-action: pan-y`, pause off screen, the WebGL fallback and `?nowebgl` are kept.
  - **Cadet** (`public/models/cadet-rider.glb`, 75 KB): built procedurally in Blender (`tools/blender/06_exhibit/build_cadet.py`) on its own 5-bone rig, in the horse's rest space, seated on the saddle: hard hat with peak and chin strap, black jacket with brass buttons, white stock, white breeches, tall boots in stirrups, gloves on the reins. Proportions of a 1.65 m rider (sitting height about 0.88 m, thigh 0.41, shin 0.40; heel under hip, ear-shoulder-hip-heel plumb). It rides four skinned vertices of the coat under the saddle, so it follows the real deformation of the back; the spine keeps a lagged share of the seat's tilt (0.55 / 0.34 / 0.2 / 0.12 for spine, chest, neck, head). **Chosen over a downloaded or AI-generated figure** because there is none in the repo, nothing downloaded has a known licence, and a generated mesh would need a rig and a seated pose anyway. **It is a stylised, uniformed figure, not photorealistic**: the face is simple (eyes, nose, lips, ears under the hat).
  - **Bone and Muscle come from the same rig and coat** (`build_skeleton.py`, `build_muscles.py`; all of it re-runs with `sh tools/blender/06_exhibit/build_all.sh`). Skeleton: 80 objects, 42,046 polys (skull, jaw, teeth, 7 cervical, 18 thoracic, 6 lumbar, sacrum, 14 caudal, 18 ribs a side, sternum, scapula, humerus, radius/ulna, carpus, cannon with splints, sesamoids, pasterns, coffin bones, pelvis, femur, patella, tibia, hock). Joints come from the armature; section sizes are measured on the coat by ray casts and every vertex is pulled inside the coat; skin weights are copied from the nearest coat vertex (same side only). **The bones are anatomically shaped but stylised, not a scanned skeleton.** Muscles: 30 named muscles plus a deep fascia layer (24,045 polys), each carved out of the coat's own surface (faces within a spindle around a path placed from the rig joints, inset along the normals, deeper at the border so the fascia shows as a seam). They carry the coat's skin weights, so they deform exactly like the coat. **They are a surface muscle map, not volumetric muscles**; their borders are stepped at mesh resolution (about 1 cm), and muscle origins and insertions are placed by eye against anatomy references, not measured from a specimen.
  - **Measured against the coat** (`validate_motion.py`: evaluated skinned meshes against the evaluated coat, 6 frames per clip). Rest pose: bones 92 of 40,550 vertices outside, worst 1.6 cm; muscles 310 of 27,808 outside, worst 2.8 cm. Walk / Trot / Canter: bone vertices outside 0.36 % / 1.37 % / 2.21 %, **worst 16.1 / 18.5 / 21.7 cm**; muscle vertices outside 1.15 % / 1.60 % / 1.93 %, worst 3.0 cm. The large bone figures are a few hundred vertices at the hip (femoral head, ischium) and single points on the humerus and ribs, where the rig's own skinning folds the coat in the gallop-like gaits; the ghost coat is 10 to 34 % opaque in those views, so they show as a short spike at the hip in the canter. Not fixed.
  - **Tack** (saddle with flaps, girth, bridle, bit, stirrups on leathers, reins): built in Blender and fitted to the coat; the saddle is rigid on the seat frame, the girth and bridle are skinned. The reins run through an anchor outside the neck. They look like a general-purpose saddle and a plain bridle, not a specific make.
  - **Right column redesigned (owner, same day):** three system rows (Brain / Heart / Spine, mapped to the three connections), a segmented View control (Align / Bone / Muscle / Coat), a Walk / Trot / Canter segmented control with a play button, the stride scrubber and a switch for the rider. Sliding pills, springs and press/hover feedback use the site's `motion` library (vanilla build, `public/anatomy/vendor/motion.js`); nothing animates under reduced motion. Choosing a system fades in an obsidian spotlight behind the horse and the golden alignment lines; the readout under the stage ("Pelvic kinematics: 3D core realignment") shows the seat's lift in mm and tilt in degrees **measured from the model each frame**.
  - **Copy follows the claims ledger, not the pasted brief.** The brief's "40 % cortisol", "300+ muscles", "permanently reverses tech-neck" and "zero impact" are "No" rows of Blueprint Part 9 and are not on the page. Used instead: "about a hundred" pelvic moves a minute at the walk (ledger: supported), "lower stress hormones in children (one trial: Pendry, Smith & Roeter, 2014)", "steady, moderate effort" for the heart and lungs (no BPM figure).
  - **Checks:** `npm run lint` 0 errors (20 warnings, none in these files; vendored files ignored in `eslint.config.mjs`), `npm run typecheck` clean. Headless Chromium (Playwright, software GL), 1440 and 390: every view mode, the three gaits, rider on and off, 0 console errors, no horizontal overflow; captures in `docs/qa/anatomy-exhibit/`. Real wheel events over the canvas inside `/anatomy` scrolled the page by 500 px for 5 ticks (the exhibit takes no wheel). Reduced motion: two stage captures 1.5 s apart are byte-identical (standing pose, hair flutter off); a gait chosen by hand still plays.
  - **Not done / not verified:** no frame-rate measurement (headless software GL is not a number worth quoting) and no phone, Safari or Firefox; `npm run build` not run (the dev server was using `.next`); load time is about 6 s in dev (1.7 MB model plus 2.3 MB of unminified three modules). **The first model on the home page (the dark Instrument stallion with hotspots) was not touched:** the brief's five-node matrix (ears, neck, saddle spine, flank, fetlock) and the Crisis / Cure slider need ledger-safe copy and are not built. `components/sections/anatomy/DualBody.tsx` (the iframe wrapper) is another session's uncommitted work and is unchanged by this commit.
- [x] **Accounts for students, parents, teachers and schools (28 Oct 2026, owner's request: "anyone can create an account when I press admin login … connected to Supabase").** Branch `feature/marwari-film-world`; nothing pushed, **not applied to any Supabase project**. Full note and the brief I held it to: `docs/ACCOUNTS.md`.
  - `/admin/login` now has "Sign in" and "Create an account" (`?mode=create`): pick student, parent, teacher or school, then only that kind's questions (`lib/accounts/kinds.ts`, shared by the form and the server action), consent with a link to the privacy notice, a honeypot, 5 sign-ups an hour per connection, generic errors, the staff password rule. Sign-in sends staff to `/admin` and members to the new `/account` (their details, honest next steps per kind, and the coarse progress of enquiries made with their confirmed e-mail). `/admin/accounts` (new "Accounts" tab) shows counts per kind, "awaiting review", a kind/status filter, what each person gave, and approve / hold / reactivate, each audited.
  - **Database** (`supabase/migrations/20261028000900_member_accounts.sql`): `member_accounts` + the sign-up trigger extended; every self-service account stays `profiles.role = 'cadet'` (nobody can promote themselves), students and parents are active, teachers and schools wait for review, members cannot edit kind or status (column grants), review goes through `review_member_account()` (staff only, audited), `my_enquiries()` needs a confirmed e-mail. **Checks:** 38 new SQL tests, 214 in the suite, 0 failed on a throwaway Postgres 18; 13 new unit tests, 97 in `npm test`, 0 failed; `npm run lint` 0 errors, `npm run typecheck` clean; headless Chromium at 1440 and 390: both views, every role's fields, keyboard focus ring on the role cards, no horizontal overflow, validation message from the server, `/account` signed out goes to the login page (captures in `docs/qa/accounts/`).
  - **Not verified:** nothing was run against a live Supabase: the project in `.env.local` (`bsah-academy`) is INACTIVE (paused) and the readiness notes name a different shared one; I changed neither. `/account` and `/admin/accounts` behind a sign-in were not seen with real data. To switch on: apply the migration, keep "Confirm e-mail" on, allow `/auth/confirm` in the redirect list, sign up once, then check both pages. `app/admin/login/page.tsx` also carries another session's uncommitted crest redesign (the two edits touch the same lines), committed with it.
