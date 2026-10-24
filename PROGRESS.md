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
