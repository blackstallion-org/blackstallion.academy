# BSAH implementation checklist (Master Implementation Command) — final audit, 11 Oct 2026

How it was verified: production build (`npm run build` → `next start`) tested with Playwright/Chromium in the cloud sandbox.
Test scripts are in `docs/qa/`: `run.py` (content audit, 23 routes), `interact.py` (31 behaviour tests), `resp.py`
(390/768/1440 layout, console errors, keyboard focus, reduced motion), `audio.py` (sound engine).
Final run: lint 0 errors · typecheck 0 errors · build OK · content 28/28 · behaviour 31/31 · 0 horizontal overflow on 69 route×width combinations · 125 tab stops all with a visible focus ring.

Statuses: **CV** completed & verified this session · **AV** already implemented & verified · **PC** partially completed · **BL** blocked · **NI** not implemented.

| # | Item | Status | Changed this session? | Where | Proof | Remaining |
|---|---|---|---|---|---|---|
| 1.1 | Core palette #0F0E0D / #1A1A18 / #B87333 / #D4AF37; coat colours kept separate | CV | yes | `app/globals.css` | visual check of home/curriculum screenshots; resp.py | — |
| 1.2 | Supplied crest as logo (nav, footer, favicon, apple icon, OG image) | CV | yes | `components/brand/CrestMark.tsx`, `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico`, `app/opengraph-image.png` | build emits icon/OG routes; nav renders crest | Artwork text says "DOMINUS EQU" (motto is *Equi*) — **BL: owner to supply corrected artwork** |
| 1.3 | SOUND ON/OFF top-right, OFF by default | CV | no (verified) | `components/site/SoundToggle.tsx`, `lib/audio/engine.ts` | interact.py L19: false→true→false, 0 errors | — |
| 1.4 | Navigation reliable on desktop/tablet/mobile | AV | no | `components/site/SiteNav.tsx` | resp.py: 23 routes × 3 widths, all 200, 0 overflow | — |
| 2.1 | Hero 3D stallion engine: gaze, tilt (+iOS permission), touch fallback, breathing, time-of-day light, blob shadow | PC | yes | `components/hero/stallion-gl.ts`, `components/hero/StallionStage.tsx` | interact.py: model loads, gaze pixel delta 1.9, idle animation, no page errors (`?stallion=preview`) | Off by default; only a stand-in proxy model exists. **Skipped by owner** |
| 2.2 | Click → camera dolly → Sovereign Passport, no double transition | CV | yes | same | interact.py: navigates to `/cadets#passport`, 1 navigation for 3 clicks | — |
| 2.3 | WebGL failure / reduced-motion fallbacks | CV | yes | same, `components/sections/home/Hero.tsx` | `--disable-3d-apis` → canvas hidden, no button; reduced motion → static hero | — |
| 2.4 | Commissioned Marwari model | BL | — | — | — | Owner: GLB file + `NEXT_PUBLIC_STALLION_MODEL` (skipped by owner) |
| 3.1 | Neutral historical imagery (no sectarian/partisan flags) | CV | yes | `lib/content/media.ts` | all 55 stills viewed in a contact sheet; tournament crowd image with coloured flags regenerated; none remaining show flags, banners or religious emblems | Placeholder AI art until the commissioned shoot |
| 3.2 | Conquest framing removed | CV | yes | `lib/content/legend.ts`, `site.ts`, `home.ts`, `TournamentScenes.tsx` | run.py forbidden-phrase scan ("Schools at war" etc.) = 0 hits | — |
| 3.3 | Sovereign Crucible (Variant B) | AV | no | `lib/content/science.ts`, `/why` | run.py L5 | — |
| 4 | Reel 01: no Uchchaihshravas, title + subtitle, three theories with evidential status, origins not settled | CV | yes (subtitle, wording) | `lib/content/legend.ts`, `app/legend/page.tsx` | run.py L6 (4 checks) | — |
| 5 | Traditional Lore of the Bards as a standalone reel; folklore vs BSAH interpretation labelled; no temperament claims | CV | yes | `app/lore/page.tsx`, `lib/content/legend.ts` | run.py L7 (5 checks); `/lore` 200 at all widths | — |
| 5.1 | Kala / Nukra imagery | CV | yes | `lib/content/media.ts` (`kalaPortrait`, `nukraPortrait`) | images viewed | Saif Patel photo not used (third-party, watermarked) — owner licence needed if wanted |
| 6 | Studbook registry, 6 entries with hex / dual-tone | CV | yes (hex labels) | `components/sections/fleet/FleetScenes.tsx` | run.py L8 (16 strings) | — |
| 7.1 | Crisis & Cure drag slider (mouse, touch, keyboard), haptics opt-in, breath cue | CV | yes (breath cue) | `components/sections/home/CrisisCure.tsx`, `shared/CompareSlider.tsx` | interact.py: keyboard 50→40; concepts present | — |
| 7.2 | Brain & Spine HUD, gold alignment grid, exact label | CV | yes | `components/sections/home/Matrix.tsx`, `RiderDiagram.tsx` | interact.py L9 spine/brain | — |
| 7.3 | 180° Radar / The Balancer hotspots | CV | yes | `lib/content/anatomy.ts` | interact.py L10 | — |
| 8 | Reel 02 ears/neck exact metric + trait; all touchpoints interactive | CV | yes | `lib/content/anatomy.ts`, `SpecimenPlate.tsx` | interact.py: 6 touchpoints, exact strings | — |
| 9 | Cadet uniform spec | AV | no | `lib/content/academy.ts` | run.py L11 | — |
| 10 | Four ranks interactive (core focus + artifacts, not persisted) | CV | yes | `components/sections/curriculum/CurriculumScenes.tsx` | interact.py L12 | — |
| 11 | 13-pillar ledger, each expands with skill, trait, sub-copy | CV | yes (spelling) | `lib/content/curriculum.ts`, `CodexVault.tsx` | interact.py: 13/13 expand, 0 missing | — |
| 12 | 17 zone codes + demographics; codenames in standings; no named/unverified partners | CV | yes (hub wording) | `lib/content/schools.ts` | interact.py L14, run.py forbidden scan | — |
| 13 | Batch schedule (12-hour) and pricing consistent with GST | CV | yes | `lib/content/curriculum.ts`, `schools.ts`, `academy.ts`, `command.ts` | run.py L15 (17 strings) | Prices labelled "subject to confirmation" |
| 14 | 45-minute protocol; faculty as recruitment targets | CV | yes | `lib/content/curriculum.ts`, `command.ts` | run.py L16, interact.py faculty | — |
| 15 | Command terminal: 4 chips submit exact queries; honest boot; unverified claims withheld | CV | yes | `components/sections/command/Terminal.tsx`, `lib/content/command.ts` | interact.py: 4/4 chips; forbidden scan (12 ms, ENCRYPTED, ₹10 lakh, 14,800 h) = 0 | — |
| 16.1 | Gates `?gate=parents|schools|audit`: headers, fields, buttons, URL sync | CV | yes | `components/sections/contact/Gates.tsx` | interact.py: 3 direct URLs; run.py L18 (31 strings) | — |
| 16.2 | Validation (required, email, phone, future date), values kept on error, privacy note | CV | yes | `app/actions.ts`, `components/sections/shared/LeadForm.tsx` | interact.py: 6 invalid on empty, email/phone/date errors, values kept | — |
| 16.3 | Truthful submission (no fake success) | CV | yes | `app/actions.ts` | unset webhook → "NOT sent"; local test receiver → 1 POST with bearer secret, seal shown | — |
| 16.4 | Lead storage backend (Supabase) | PC | yes | Supabase project `bsah-academy` (Mumbai); `app/actions.ts` calls `public.submit_lead` RPC; `.env.example` | As the anonymous role: submit_lead stored a row (privacy version 2026-10-draft, audit event written), anon cannot read leads (42501), invalid name rejected. 122/122 database tests pass locally | End-to-end from the website not proven: neither the sandbox nor the Mac can reach supabase.co (egress allowlist). Set `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` in Vercel to switch it on, then submit one form to confirm |
| 17 | Audio: ambient drone, breath cues, terminal keystrokes, OFF by default | CV | yes (files) | `public/audio/*`, `lib/audio/engine.ts`, `docs/qa/make_audio.py` | audio.py: ambient plays (t=2.4 s) and pauses; 5 throttled key sounds for 10 chars; breath fires on /legend; all files 200/206 | Files are synthesised placeholders (no licence needed); replace with recordings if wanted |
| 18.1 | QR seal, real and scannable, public code only | CV | yes | `lib/qr.ts`, `components/brand/QrSeal.tsx` | OpenCV decodes the rendered QR to `https://blackstallion.academy/verify/BSAH-2026-HYD-042` | — |
| 18.2 | Live cadet registry / QR into real records | PC | yes (database) | migrations 0100–0600 applied; `verify_passport()` RPC live | migrations listed in Supabase; advisors: 0 errors | No sign-in, admin screens or cadets yet; the website still reads sample records |
| 19.1 | Keyboard focus visible | CV | no (verified) | `app/globals.css` | resp.py: 125 tab stops, 0 invisible | — |
| 19.2 | Reduced motion: no pinning/parallax; hydration-safe | CV | yes | `lib/motion/reduced.ts` (used in 13 components) | resp.py: 0 sticky elements, 0 errors on 7 routes under reduced motion | — |
| 19.3 | Hydration: trig-computed SVG attributes | CV | yes | `lib/round.ts` (SealStamp, Curriculum, Schools, Anatomy, Science, RiderDiagram) | the /verify mismatch reported by `next dev` is gone | — |
| 19.4 | `/about` React #418 in production build | PC | partly | `/about` | not reproducible in `next dev`; still logged by the production build | Likely the scroll-linked word opacity in `Monolith`; cosmetic, page renders and works |
| 20.1 | Title, description, canonical, Open Graph, Twitter card, icons | CV | yes | `app/layout.tsx`, `app/lore/page.tsx`, `app/opengraph-image.*` | build output lists icon/OG routes | — |
| 20.3 | Privacy notice | PC | yes | `app/privacy/page.tsx`, linked from every form and the footer | `/privacy` 200 in build | Draft: needs counsel review; retention period and grievance officer are placeholders |
| 20.2 | Deployment | NI | — | — | — | Owner asked not to deploy; GitHub push also blocked (no credentials on the Mac) |

## Count

39 items: **CV 30 · AV 3 · PC 2 (3D engine without a real model; /about hydration warning) · BL 3 (3D model — skipped by owner; lead backend; live registry) · NI 1 (deployment, by instruction)**. Owner action also needed on the crest artwork typo (row 1.2).
