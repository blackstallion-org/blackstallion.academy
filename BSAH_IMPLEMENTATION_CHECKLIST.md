# BSAH implementation checklist (Master Implementation Command, 11 Oct 2026)

Evidence: Playwright runs against a production build (`next start`), scripts in docs/qa (interact.py, run.py, resp.py).
Statuses: CV = completed & verified · AV = already implemented & verified · PC = partially completed · BL = blocked · NI = not implemented.

| Layer | Item | Status | Evidence / note |
|---|---|---|---|
| 1 | Core palette tokens #0F0E0D/#1A1A18/#B87333/#D4AF37, coat colours separate | CV | app/globals.css |
| 1 | Supplied crest as logo (nav, footer, favicon, apple icon, OG image) | CV | components/brand/CrestMark.tsx, app/icon.png, app/opengraph-image.png. Crest text reads "DOMINUS EQU" (motto is "Equi") — needs corrected artwork |
| 1 | Sound toggle top-right, default OFF | CV | L19 test false→true→false |
| 1 | Navigation works on mobile, no overflow | AV | 0 horizontal overflow on 23 routes × 390/768/1440 |
| 2 | 3D stallion engine (WebGL2, gaze, tilt+permission, touch, breathing, time-of-day light, blob shadow, click dolly → Passport, fallbacks) | PC | components/hero/*. Tests pass with `?stallion=preview`. Off by default: only a stand-in proxy model exists. Owner skipped the model this session |
| 2 | Real Marwari model | BL | Owner: supply GLB, set NEXT_PUBLIC_STALLION_MODEL |
| 3 | Neutral imagery | PC | tournCrowd regenerated (coloured flags removed); bgCharge, currFormation, legendNachni checked; 3 legend images regenerated earlier; remaining ~45 stills not individually re-audited |
| 3 | Reel 12 "Schools at war" → "Zones on the circuit" | CV | |
| 3 | Sovereign Crucible Variant B on /why | AV | |
| 4 | Reel 01 title + subtitle, no Uchchaihshravas, three theories with status | CV | Native theory softened (ancestry not settled) |
| 5 | Standalone folklore reel /lore (Kala, whorls, Nukra, Nachni), lore vs BSAH interpretation labelled | CV | app/lore/page.tsx; whorl/temperament claim softened |
| 5 | Images for lore | CV | Original Higgsfield portraits (Kala B/W, Nukra). The supplied Saif Patel photo was NOT used (third-party copyright, watermark) |
| 6 | Studbook registry: 6 entries with hex/dual-tone | CV | /fleet |
| 7 | Crisis & Cure slider (drag/touch/keyboard, haptics opt-in, breath cue) | CV | keyboard 50→40; breath cue needs audio file |
| 7 | Brain & Spine HUD, gold alignment grid, exact label | CV | |
| 8 | Ears/Neck exact metrics + traits; 6 touchpoints interactive | CV | |
| 9 | Uniform spec | AV | /cadets |
| 10 | Four ranks interactive with core focus + artifacts, not persisted | CV | |
| 11 | 13 pillars, each expands with skill/trait/sub-copy | CV | 13/13 |
| 12 | 17 zone codes + demographics, codenames in standings, no named schools | CV | hub notes reworded as proposed |
| 13 | Schedule (12-hour), pricing consistent, GST | CV | |
| 14 | 45-minute protocol; faculty as recruitment targets | CV | |
| 15 | Terminal: 4 chips submit exact queries; no fake latency/encryption; unverified claims withheld | CV | 4/4 |
| 16 | Gates ?gate=parents/schools/audit exact headers/fields/buttons, validation, values kept, URL sync | CV | |
| 16 | Truthful submission (webhook boundary LEAD_WEBHOOK_URL) | CV | not configured → "NOT sent"; configured → delivered + sealed |
| 16 | Production backend | BL | Owner: set LEAD_WEBHOOK_URL (+ LEAD_WEBHOOK_SECRET) |
| 17 | Audio engine, cues, throttling | PC | code done; BL on the three audio files |
| 18 | QR seal (real, scannable) on verify + passport | CV | decodes to /verify/BSAH-2026-HYD-042 |
| 18 | Live cadet registry | BL | Supabase not provisioned |
| 19 | Keyboard focus visible | CV | 125 tab stops, 0 without visible focus |
| 19 | Reduced motion | PC | no sticky/pinning; React #418 hydration warnings on 4–5 routes under reduced motion are PRE-EXISTING (same on base build) |
| 20 | Canonical, OG, Twitter, icons | CV | |
| 20 | Live Vercel deployment | NI | not deployed; no credentials |
