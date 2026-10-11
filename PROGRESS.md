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
