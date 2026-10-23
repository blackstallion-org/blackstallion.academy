# BSAH website blueprint

> The single source of truth for **blackstallion.academy**. It is written as a production prompt for Claude Code: read it top to bottom before touching a route, then build the page from its section in Part 6. Copy in this file is final unless marked **SAMPLE** (illustrative data that must be replaced with real records before launch).
>
> Supersedes the one-page "film" direction in older notes. The home page is now a 15-section trailer; every section opens a page of its own.

Contents

1. First principles
2. The story pattern that connects everything
3. Design system
4. Layout vocabulary (no two sections look alike)
5. Sitemap, navigation and reel order
6. Page specs: every page → section → sub-section, with copy
7. Data models
8. Media manifest and Higgsfield prompts
9. Claims ledger (what we can stand behind)
10. Conflicts and open questions for the client
11. Skills, tools and workflow
12. Build order and definition of done
13. Master prompt (copy-paste)

---

## 1. First principles

### 1.1 Why the site exists

One job: **make a parent trust BSAH with their child, and make a school board want an arena on its campus.** Everything that does not move one of those two people is cut.

### 1.2 Who arrives, and what they need to believe

| Visitor | Arrives asking | Must leave believing | Primary page | Action |
| --- | --- | --- | --- | --- |
| Parent | "Is this safe, and what will my child become?" | The horse builds composure and posture that screens erode; my child is safe; progress is visible. | `/parents` | Enrol a cadet |
| School board / principal | "What do we gain, what does it cost, what's the risk?" | A turnkey, prestigious programme that pays back; BSAH runs everything. | `/schools` | Request a draft MOU / board audit |
| Cadet | "What do I get to do?" | Ranks, a named stallion, a national circuit, a passport. | `/cadets` | Show a parent |
| Verifier (university, school, federation) | "Is this record real?" | Every hour and rank is sealed and checkable. | `/verify` | Verify a passport code |

### 1.3 Six truths we stand behind (and double down on)

These are the load-bearing beliefs. Every section must express at least one, and no copy may contradict them.

1. **A horse cannot be fooled.** A 500 kg animal answers calm, clear intent and ignores status, marks and volume. Character is tested, not lectured.
2. **Posture is character made visible.** Sitting a moving horse demands an upright, stacked spine and a quiet core, stride after stride.
3. **Lineage gives discipline a reason.** The Marwari is an indigenous warhorse with an 800-year story: bred by the Rathores, nearly lost, revived. Every cadet rides one.
4. **Progress is proof, not promise.** Ranks, hours and milestones live in a ledger anyone can verify.
5. **Safety before speed.** Ex-cavalry faculty, daily veterinary care and insurance come before any lance is lowered.
6. **The campus becomes the citadel.** The school hosts it; BSAH builds and runs it; the school shares the revenue and the prestige.

### 1.4 Our edge (the strength we build every page around)

No one else combines **(a)** a living national heritage animal with a true war-and-revival story, **(b)** a rank system with a public, verifiable ledger, and **(c)** delivery inside the school gate. The site's signature is the **story → proof chain**: every emotional claim is followed, within one scroll, by evidence (a number, a page, a verifiable code, a source).

### 1.5 What we cut (and why)

- **Unverified health numbers** (for example "40% cortisol drop", "300+ muscles", "permanently reverses tech-neck") are not published as facts. See Part 9.
- **Gamified noise** (pre-loader overture, 432 Hz binaural audio, ticker on every page) is reduced to one quiet command ticker on the home page and an opt-in sound toggle later.
- **The "Hall of Famous Horses" with Bucephalus and Marengo** is cut from the home page: they are not Marwaris and dilute truth 3. Indian war horses (Chetak, Bahadur, Arbudh) carry the story on `/legend`.
- **Payments (`/pay`) and the parent app** are out of scope for the marketing site; their entry points link to `/parents` and `/contact` until Razorpay and Supabase land.

---

## 2. The story pattern that connects everything

### 2.1 Three acts → three zones → fifteen reels

The site is one film in three acts. The home page is the **trailer**; every other page is a **reel** of the film.

| Act | Home zone | Feeling | Reels (pages) |
| --- | --- | --- | --- |
| I · The Legend | A · Hook | Awe | 01 `/legend`, 02 `/anatomy` |
| II · The Citadel | B · Proof | Trust | 03 `/science`, 04 `/why`, 05 `/curriculum`, 06 `/fleet`, 07 `/cadets`, 08 `/parents`, 09 `/safety` |
| III · The Ledger | C · Convert | Decision | 10 `/schools`, 11 `/verify`, 12 `/tournaments`, 13 `/command`, 14 `/journal`, 15 `/contact` |

`/about` is the **credits** (behind the camera), linked from the footer.

### 2.2 The reel grammar (the one pattern every page follows)

Every page has the same three-part grammar, so a visitor always knows where they are, even though no two sections look alike:

1. **Title card.** Reel number (`REEL 05 / 15`), act name, a two-voice headline (INSCRIPTION + war voice), one line of documentary text. Each page's title card uses a different opening move (Part 4, family T).
2. **Scenes.** Three to six sections, each built from a different layout archetype (Part 4), each with exactly one signature moment.
3. **End card.** "Next reel" hand-off: full-width, the next page's title in inscription type over its key image, with a thin progress bar showing reel N of 15. This is what stitches the site into one story.

### 2.3 Two-voice headlines

Every headline has two lines in two voices of the same family (Kalnia):

- **Inscription** (line 1): capitals, hairline weight, extra-wide. Calm, monumental, carved. `bone`.
- **War voice** (line 2): lowercase, heavy, normal width. The line that lands. `gold` (or `blood` once per site for the war beat on `/legend`).

Example: `WE DO NOT TEACH` / **children to ride.**

### 2.4 Continuity devices

- **Reel counter** in the nav (`05 / 15`) and the end card progress bar.
- **Lance rule**: the section divider, a hairline with a lance tip and a horseshoe seal.
- **Dust**: every title card has drifting gold dust; dust thins as the acts move from Legend (heavy) to Ledger (clear, precise).
- **Brass seal** appears only where something is *proven* (verify, ranks, MOU). It is never decoration.
- **The ears**: the lyre-ear monogram is the loader, favicon and the cursor focus ring motif.

---

## 3. Design system

### 3.1 Colour (tokens in `app/globals.css`; revised 12 Oct 2026 · warm equestrian editorial)

The site is now light by default: ~70% warm editorial (ivory, parchment, chestnut, caramel, leather, from reference 2) and ~30% dark luxury accents (charcoal, antique gold, from reference 1). Token names are semantic roles; their values swap inside a `.tone-dark` scope, so components never hard-code a palette.

| Token (role) | Light (default) | `.tone-dark` | Use |
| --- | --- | --- | --- |
| night (canvas) | #F3EDE2 ivory | #171513 charcoal | Page and section background |
| umber (surface) | #E8DECE parchment | #1F1B17 | Editorial bands, quiet surfaces |
| ember (raised) | #FAF7F0 off-white | #2A221C leather | `.plate`, drawers, cards of record |
| bone (headline ink) | #30251E deep brown | #F3EDE2 | Headlines, primary text |
| sand (body ink) | #4D3C30 | #DDD0BC | Body copy |
| dust (caption) | #6F5B4B | #A8957F | Captions, secondary |
| brass (labels, rules) | #7B5636 bronze | #B88A62 caramel | Labels, hairlines, small accents |
| gold (the one word) | #78472F chestnut | #C9A66B antique gold | The one word or number that matters; solid CTA fill |
| line (hairline) | chestnut 24% | antique gold 28% | Borders |
| blood | #A8301C | #DC6448 | The war beat, once per page at most |
| frost | #4A6279 | #9FB3C8 | **Only** the digital-crisis side |

Fixed brand colours (never swapped): ivory #F3EDE2 · parch #E8DECE · offwhite #FAF7F0 · sandline #D4C3AD · chestnut #78472F · caramel #B88A62 · leather #493126 · charcoal #171513 · antique #C9A66B.

Where `.tone-dark` is used (the deliberate 30%): the home hero film, both intermissions, the Seal verifier, the finale, every end card, the footer, the menu, the loader, the command terminal, the specimen plate, the passport scene, the stable CCTV wall, the fixtures board, phones, and the journal "next story" card. Everything else is ivory.

Rules: gold (chestnut on ivory, antique gold on charcoal) is a highlight, never a large fill except the one solid CTA. No glassmorphism, neon, rounded SaaS cards or emoji icons. Text on photographs is held by `shade-*` gradients, which fade to ivory in the light scope and to charcoal in `.tone-dark`. Photo grades (`--grade-*`) are lighter on ivory and keep the darker film grade inside dark scenes. All text pairs meet WCAG AA (4.5:1) on their surfaces.

### 3.2 Type (replaces Bodoni / Barlow / JetBrains)

Chosen to avoid the faces AI-generated sites default to (Cinzel, Cormorant, Playfair, Inter, Space Grotesk).

| Role | Family | Settings | Class |
| --- | --- | --- | --- |
| Inscription (headline line 1) | **Kalnia** | wght 200, wdth 125, uppercase, tracking 0.02em | `.t-inscribe` |
| War voice (headline line 2) | **Kalnia** | wght 600, wdth 100, lowercase, tracking -0.01em | `.t-voice` |
| Story / body | **Newsreader** | 17–19 px, wght 380; italic = documentary voice | default body, `.t-story` |
| Labels, nav, buttons | **Mona Sans** | wght 600, wdth 75, uppercase, tracking 0.22em, 11–13 px | `.label` |
| UI text (forms, tables) | **Mona Sans** | wght 450, wdth 100 | `.t-ui` |
| Numbers, codes, chips | **Martian Mono** | wght 400, wdth 87.5, tabular | `font-mono` |

Scale: `text-poster` clamp(3.25rem, 11vw, 13rem); `text-display-1` clamp(2.75rem, 8vw, 9rem); `text-display-2` clamp(2rem, 5vw, 5rem); `text-display-3` clamp(1.4rem, 2.4vw, 2.5rem); lede clamp(1.15rem, 1rem + 0.5vw, 1.5rem).

### 3.3 Grid and spacing

12 columns, 16 px gutters on mobile, 24 px at md, 32 px at xl; outer margin `max(16px, 4vw)`. Sections are full-bleed; text columns never exceed 62ch. Vertical rhythm: sections start at `clamp(6rem, 14vh, 12rem)`.

### 3.4 Motion

Slow, weighted, filmic. Tokens in `lib/motion/tokens.ts`. House curve `[0.16, 1, 0.3, 1]`; film curve `[0.7, 0, 0.2, 1]`.

- One **signature moment** per section (listed per section in Part 6). Everything else is a plain fade-up.
- Scroll-linked work uses `useScroll` + `useTransform`; every input range passes through `r()` (`components/film/range.ts`).
- Lenis smooth scroll site-wide; off for reduced motion.
- **Reduced motion:** no zoom, parallax, pinning or horizontal scroll; pinned scenes unpin into stacked frames; text fades only.
- Performance budget: LCP < 2.5 s on 4G, CLS < 0.05, JS < 200 kB per route (excluding the optional 3D chunk).

### 3.5 Texture and glyphs

Film grain overlay (body `.grain`), radial vignette on every photo, gold dust canvas on title cards. Custom SVG glyphs only: lance, horseshoe seal, lyre ears, hoofprint, stable lantern, shield. No stock icon sets.

### 3.6 Imagery rules

- One graded look: warm sepia and antique gold, black-brown shadows, single warm key light upper-left, dust in the air, film grain. The only cold image is the "digital crisis" frame.
- History is shown two ways: **cinematic reconstruction** (photographic) and **Rajput miniature plates** (painterly, gold leaf). Never mix both in one frame.
- Cadets are 10–16 years old and always wear the BSAH uniform and a helmet when mounted.
- Never use the Amigos images or the film clip in `blackstallion images/`.

---

## 4. Layout vocabulary (no two sections look alike)

Each section is built from one archetype. **Rule:** an archetype may appear once per page and at most twice across the site (title cards excepted). The assignment matrix in Part 6 enforces this.

### Family T — Title cards (one per page, each different)

| Code | Name | Opening move |
| --- | --- | --- |
| T1 | Dust emergence | Image fades up out of a dust layer; headline wipes in by line (home) |
| T2 | Iris | Black screen, a circular iris opens on the image as you scroll (legend) |
| T3 | Specimen plate | Image on black with museum caption and catalogue number (anatomy) |
| T4 | Line drawing | SVG line art draws itself, then the photo fades in behind (science) |
| T5 | Split cold/warm | Screen split into a cold half and a warm half that collide (why) |
| T6 | Ledger page | Paper-and-leather image with ruled lines drawing across (curriculum) |
| T7 | Lantern corridor | Image with a lantern glow that brightens on scroll (fleet) |
| T8 | Portrait | Tall portrait right, title left, vertical name credit (cadets) |
| T9 | Rail view | Image framed by a wooden-rail foreground bar (parents) |
| T10 | Still life | Object still life with numbered labels (safety) |
| T11 | Aerial zoom | Aerial image slowly scales in (schools) |
| T12 | Seal | Brass seal stamps over the title (verify) |
| T13 | Charge | Image with horizontal speed-blur streaks (tournaments) |
| T14 | Terminal boot | Typed boot sequence (command) |
| T15 | Masthead | Newspaper-style masthead with date line (journal) |
| T16 | Gate | Two gate halves part to reveal the page (contact) |
| T17 | Monogram | Large lyre-ear monogram drawn in brass (about) |

### Family S — Scene layouts

| Code | Name | Description | Used on |
| --- | --- | --- | --- |
| S01 | Pinned headline scrub | Headline swaps lines as you scroll a pinned frame; stat plates on the floor | Home §1 |
| S02 | Horizontal film strip | Pinned section; frames slide sideways with sprocket holes | Home §2, Cadets §5 |
| S03 | Specimen hotspots | Photo with pulsing hotspots; panel opens per hotspot | Home §3, Anatomy §1 |
| S04 | System console | Vertical tabs, diagram centre, readout right | Home §4, Science §1 |
| S05 | Before/after slider | Drag divider between two aligned images, metric pairs below | Home §5, Why §2 |
| S06 | Triptych doors | Three tall image panels; focused one widens | Home §6 |
| S07 | Constellation ascent | 12 nodes over 4 rank rows; nodes light per rank | Home §7 |
| S08 | Studbook hover list | Giant names; hovering reveals portrait and registry plate | Home §8 |
| S09 | Blueprint configurator | Architectural line plan redraws per tier | Home §9, Schools §2 |
| S10 | Seal verifier | Code input; brass seal stamps; credential reveals | Home §10, Verify §1 |
| S11 | Race lanes | Standings as horses racing along lanes | Home §11, Tournaments §1 |
| S12 | Shield columns | Three columns split by lance rules, giant numerals | Home §12, Safety §1 |
| S13 | Terminal | Monospace console with typed Q&A and suggestion chips | Home §13, Command |
| S14 | Editorial index | One large cover and a column of headlines | Home §14, Journal |
| S15 | Credits roll | End-credits typography with three CTAs | Home §15 |
| S16 | Chapter rail long-read | Sticky chapter index, long-form text with plates | Legend |
| S17 | Route map | Animated SVG route across a map | Legend ch. II |
| S18 | Annotated callouts | Image with numbered leader lines | Legend ch. III |
| S19 | Scrub zoom | Pinned image zooms into a detail while text changes | Legend ch. IV |
| S20 | Almanac grid | Tiles with glyphs, like an old almanac | Legend ch. V |
| S21 | Three words | Three giant words revealed in sequence | Legend ch. VI |
| S22 | Portrait reel | Horizontal row of tall portraits with stories | Legend ch. VII |
| S23 | Descent | Lines fall down the page; image desaturates | Legend ch. IX |
| S24 | Ascent timeline | Rising line chart of milestones | Legend ch. X |
| S25 | Scale balance | SVG balance: 10 g vs 500 kg | Anatomy §2 |
| S26 | Dial | Rotating dial with degree readout | Anatomy §3 |
| S27 | Spec sheet | Apple-style technical spec rows | Anatomy §4 |
| S28 | Pulse line | A waveform animating at a rhythm | Science §2 |
| S29 | Comparison ledger | Two-column ruled comparison | Science §3 |
| S30 | Footnote ledger | Claims with sources and status tags | Science §4 |
| S31 | Phone glass | Phone frame with scrolling notifications | Why §1 |
| S32 | Quote monolith | One sentence; words light on scroll | Why §3, About §1 |
| S33 | Hoofprint checklist | Checklist with hoofprint bullets | Why §4 |
| S34 | Staircase | Four rising steps | Curriculum §1 |
| S35 | Pillar grid + detail | 12 numbered pillars, detail pane | Curriculum §2 |
| S36 | Clock ring | Circular timeline of the 45-minute class | Curriculum §3 |
| S37 | Timetable board | Batch timetable with images | Curriculum §4 |
| S38 | Three stamps | Three assessment stamps | Curriculum §5 |
| S39 | Discipline panels | Four tall full-bleed image panels | Curriculum §6 |
| S40 | Registry + drawer | Filterable list, side drawer with pedigree | Fleet §1 |
| S41 | CCTV grid | Four feeds with timestamps and REC dot | Fleet §2 |
| S42 | Care log | Mono log lines | Fleet §3 |
| S43 | Staggered portraits | Offset portraits with captions | Cadets §1 |
| S44 | Passport object | Leather passport that opens on scroll | Cadets §2 |
| S45 | Day clock | Vertical 06:00→18:00 timeline | Cadets §3 |
| S46 | Creed card | Letterpress lines revealing | Cadets §4 |
| S47 | Pinned phone | Phone frame whose screen changes per step | Parents §1 |
| S48 | Hoofprint path | Five steps along a path | Parents §2 |
| S49 | Receipt | Fee breakdown as a receipt | Parents §3 |
| S50 | Standing orders | Accordion FAQ | Parents §4 |
| S51 | Orders of the day | Protocol checklist in mono | Safety §2 |
| S52 | Number wall | Giant numerals with captions | Safety §3 |
| S53 | Flow diagram | Three-node flow with drawn connectors | Schools §1 |
| S54 | Instrument panel | Sliders with a dial output | Schools §3 |
| S55 | Map pins | Map with hub pins | Schools §4 |
| S56 | Seal row | Accreditation seals | Schools §5 |
| S57 | Chain | Three linked links (issue → seal → verify) | Verify §2 |
| S58 | Departure board | Flip-board fixtures | Tournaments §2 |
| S59 | Course diagram | 100 m lane diagram with annotations | Tournaments §3 |
| S60 | Three gates | Three arches; choosing one opens its form | Contact §1 |
| S61 | Letter | Chairman's letter on parchment | About §2 |
| S62 | Org tree | Entity hierarchy | About §3 |
| S63 | Peg run | Four stages of one run; stills dissolve through noise (MorphGallery), rider mark travels the 100 m lane; virtues marquee coda | Tournaments §3 (replaces S59) |
| S64 | Dual body | 3D Marwari + cadet; pick a rider↔horse connection, view Coat/Bone/Muscle/Posture, walk/trot/canter | Anatomy §1b |
| S65 | Masked word | A giant word cut out of a photograph that drifts behind the letters | Legend ch. IX |
| S66 | Expanding frame | Small framed photo opens to full bleed on scroll; promise lands on it | Schools §2b |
| S67 | ASCII ripple | Photo re-set as characters; the pointer ripples it (frost, crisis side) | Why §1b |
| S68 | Curtain day | Pinned chapters that slide over one another; titles rise letter by letter | Parents §1b |
| S69 | Depth ribbon | Frames winding past in 3D depth as you scroll | About §2a |

Treatments (not archetypes; may repeat): **FilmNoise** (projected-film grain/dust/scratches: home act cards, Legend ch. VIII), **EmberTrail** (mouse-only ember trail: home act cards only), **BrassBorder** (travelling point of light on the one primary CTA: home finale), **SealRing** (turning seal legend around the crest: footer), **VelocityMarquee** (inside S63). All live in `components/motion/fx/` and honour reduced motion.

---

## 5. Sitemap, navigation and reel order

```
/                         Trailer (home, 15 sections)
├── /legend               01 The Marwari
├── /anatomy              02 The Instrument
├── /science              03 The Matrix
├── /why                  04 Crisis & Cure
├── /curriculum           05 The Ledger
├── /fleet                06 The Studbook
├── /cadets               07 The Hall of Valour
├── /parents              08 The Guardian
├── /safety               09 The Shield
├── /schools              10 The Citadel
│   ├── /schools/[slug]   Hub landing (flyer QR target): dps-hyderabad, oakridge-gachibowli, hyderabad-public-school
│   └── /schools/mou      Draft MOU generator
├── /verify               11 The Seal
│   └── /verify/[code]    Credential + printable diploma
├── /tournaments          12 The Circuit
│   └── /tournaments/[slug]  governors-cup-2026, hyderabad-interschool-2026, junior-lancers-2027
├── /command              13 Command AI
├── /journal              14 The Chronicle
│   └── /journal/[slug]   six stories (Part 6, R14)
├── /contact              15 The Gate
└── /about                Credits
```

**Primary nav (desktop):** Legend · Academy ▾ (Science, Why riding, Curriculum, Fleet, Cadets, Safety) · Parents · Schools · Circuit · Verify — CTA "Enrol a cadet". **Menu (all sizes):** a full-screen overlay listing all 15 reels in three act columns, each with its reel number. **Footer:** three corridors, entity notice, legal links, reel index.

Old routes in the client PDFs map as: `/admissions` → `/parents`, `/hubs` → `/schools`, `/hub/[schoolSlug]` → `/schools/[slug]`, `/mou-request` → `/schools/mou`, `/command-ai` → `/command`. Add redirects in `next.config.mjs`.

---
## 6. Page specs

Format for every section: **archetype · signature moment · image key(s)**, then copy. Labels are set in `.label`; headlines are written `INSCRIPTION / war voice`. Mobile notes only where behaviour differs from "stack and fade".

### R00 · Home `/` — The Trailer

Fifteen sections in three zones, separated by two intermission cards. Each section is a teaser with one CTA to its reel. Content: `lib/content/home.ts`.

#### Zone A — Hook

**§1 Hero** · T1 + S01 · headline swaps on scroll while the photograph pushes in and a dust wall drifts across · `heroDust` (+ `heroLoop` video when present)

- Badge: GOVERNED BY THE SCHOOL TENT PEGGING COUNCIL OF INDIA
- Frame A: `WE DO NOT TEACH / children to ride.`
- Frame B: `WE FORGE THEM / to lead.`
- Sub: The interscholastic equestrian leadership academy and national tent pegging circuit for India's schools. Indigenous Marwari stallions, ex-cavalry instructors and a ledger of every hour, on your child's own campus.
- CTAs: **Watch the legend** → `/legend` · **Find your campus** → `/schools#hubs`
- Stat plates: `12` pillars of character, drilled in the saddle · `25–30%` of tuition back to partner schools · `24/7` stall-cam for every parent
- Command ticker (SAMPLE): BSAH NATIONAL COMMAND · HOURS LOGGED 1,480 · CANTER TRANSITIONS PASSED 342 · ACTIVE STALLIONS 21 · HUBS LIVE 3
- Mobile: no pin, both frames stacked; image crops to the horse (focal 62% 45%).

**§2 Marwari story** · S02 · frames slide sideways on sprocket film while a frame counter ticks · `legendOcean`, `legendExodus`, `legendCavalry`, `legendRevival`, `legendEars`

- Label: REEL 01 · THE LEGEND
- Headline: `EIGHT HUNDRED YEARS / in one bloodline.`
- Frame 1 · Born of the ocean: The old stories tell of a seven-headed white horse rising from the churning sea. Every horse, the bards say, descends from him.
- Frame 2 · Marwar, 1193: Driven from Kannauj, the Rathores rode into the Thar. Their horses learned to live on a cup of water.
- Frame 3 · The vow: A Marwari left the battlefield three ways: in victory, in death, or carrying its wounded rider home.
- Frame 4 · Nearly lost: After 1947 the royal stables emptied. Horses were sold, castrated, shot. A few people refused to let the line end.
- Closing frame: Their ears curl inward until the tips touch. That is how you know the blood is pure. → **Read the full legend**

**§3 The instrument (3D model)** · S03 · hotspots pulse at a resting heart rate; a leader line draws to the open panel · `anatomyProfile` (GLB viewer replaces the photo when `public/models/marwari.glb` exists)

- Label: REEL 02 · THE INSTRUMENT
- Headline: `FIVE HUNDRED KILOGRAMS / that read you first.`
- Body: Every part of the Marwari teaches the rider something. Choose a point on the plate.
- Hotspots:
  - **Ears · 180° of attention.** They swivel to track your breathing. Tense up and they flick back. *Trains composure.*
  - **Neck · The crest.** A level neck asks for a level rider: chin up, shoulders stacked. *Trains carriage.*
  - **Saddle · The moving floor.** At a walk the horse moves your pelvis in three dimensions, close to the pattern of human walking. *Trains core and balance.*
  - **Reins · Ten grams.** A few grams of pressure turns half a tonne. Shouting does nothing. *Trains precise communication.*
  - **Hoof · Desert feet.** Hard, upright hooves bred to lift clean out of sand. *Trains rhythm and timing.*
- CTA: **Explore the instrument** → `/anatomy`

**Intermission I** · lance rule full width · `ACT II · THE CITADEL` — Now, the proof.

#### Zone B — Proof

**§4 Matrix** · S04 · the rider diagram lights the chosen system's regions · no photo (SVG rider + horse line art)

- Label: REEL 03 · THE MATRIX
- Headline: `WHAT TWENTY MINUTES / does to a child.`
- Tabs and readouts:
  - **Brain.** Steering a living animal means reading, deciding and correcting every second, with calm hands and clear intent. — *Supported: in a randomised trial, children in a 12-week horse programme had lower stress-hormone levels than a wait-list group (Pendry et al., 2014).*
  - **Spine.** To stay balanced the rider stacks head over shoulders over hips. Slouch, and the horse feels it. — *Supported: riding-posture biomechanics.*
  - **Muscle.** Deep core, back and inner-thigh muscles work the whole session to absorb the stride. — *Supported: hippotherapy research.*
  - **Heart.** Trot and canter raise the heart rate into a training zone without the pounding of court sports. — *Emerging: BSAH is collecting session heart-rate data.*
- CTA: **See the evidence** → `/science`

**§5 Crisis & cure** · S05 · drag divider; metric pairs swap colour from frost to gold as the divider passes · `whyCrisis`, `whyCure`

- Label: REEL 04 · CRISIS & CURE
- Headline: `DIGITAL FRAGILITY / is a choice.`
- Body: Screens fold a child's spine and scatter attention. A horse asks for the opposite: presence, poise and a quiet mind.
- Handle: DRAG TO COMPARE
- Pairs: Tech-neck slouch → Regal carriage · The endless scroll → Stoic composure · Alone behind glass → A living partner · App badges → A sealed passport
- CTA: **Why riding** → `/why`

**§6 Three doors (tri-audience)** · S06 · the focused door widens and its image brightens; others dim · `parentsRail`, `cadetZayd`, `schoolAerial`

- Label: CHOOSE YOUR DOOR
- Headline: `THREE WAYS / through the gate.`
- **Parents · The Guardian.** Watch your child's stallion on a 24/7 stall-cam · An alert the second their passport is scanned at the gate · A 10-second milestone reel after every session → **For parents**
- **Cadets · The Hall of Valour.** A leather Sovereign Passport, sealed in brass · Your own Marwari, for years · The STPCI national circuit → **For cadets**
- **Schools · The CapEx Engine.** A turnkey arena, designed, built and run by BSAH · 25–30% of tuition back to the school · Ex-cavalry faculty, no burden on your staff → **For schools**

**§7 Ledger** · S07 · choosing a rank draws lines between its three pillars like a constellation · no photo

- Label: REEL 05 · THE LEDGER
- Headline: `FOUR RANKS. / Twelve pillars.`
- Body: Every mounted drill maps to a trait a leader needs. Climb from Squire to Lancer and the ledger records each step.
- Ranks: I Cadet Squire — ground care and trot · II Cadet Rider — independent canter · III Cadet Knight — cavalry drills · IV Sovereign Lancer — national competition
- Pillars by rank: Squire 1–3 (Grooming & feeding, Posture, Breath & calm) · Rider 4–6 (Terrain transitions, Obstacle jumping, De-escalation) · Knight 7–9 (Cavalry drills, Unspoken trust, Setback recovery) · Lancer 10–12 (Lance precision, Composure at speed, Sovereign governance)
- CTA: **Open the curriculum** → `/curriculum`

**§8 Fleet preview** · S08 · hovering a name reveals its portrait behind the type and a registry plate slides in · `fleetChetak`, `fleetVeer`, `legendBlack`, `legendGrey`, `fleetKesar`, `fleetArbudh`

- Label: REEL 06 · THE STUDBOOK
- Headline: `TWENTY-ONE STALLIONS. / Every one has a name.`
- Names: Chetak IX · Veer · Zilzal · Tofan · Kesar · Arbudh · *and fifteen more*
- Plate fields: breed · microchip · coat · height · status dot (Rest / Arena / Night feed)
- CTA: **Open the studbook** → `/fleet`

**Intermission II** · `ACT III · THE LEDGER` — Now, the decision.

#### Zone C — Convert

**§9 Schools teaser** · S09 (compact) · the plan redraws stable blocks when the tier changes · `bgPavilion` (faint, behind the drawing)

- Label: REEL 10 · FOR SCHOOL BOARDS
- Headline: `YOUR CAMPUS / becomes a citadel.`
- Body: You fund the arena. We design, build and run it, and return 25–30% of tuition to the school.
- Tiers: Standard Hub · ₹8.20 L · 4 stables · 0.5 acre · 100–150 cadets — Signature · ₹15 L · 8 stables · 1 acre · 200–300 cadets — Royal Pavilion · ₹25 L+ · 12 stables · 1.5+ acres · 300+ cadets
- CTA: **Enter the school portal** → `/schools`

**§10 Verifier** · S10 · on submit a brass seal stamps with a dull thud and the record fades up beneath it · `bgPassport`

- Label: REEL 11 · THE SEAL
- Headline: `EVERY HOUR / sealed in brass.`
- Body: Admissions officers and federations can check a cadet's rank, hours and EFI registration in seconds.
- Input: placeholder `BSAH-2026-HYD-042` · button **Verify**
- Result (SAMPLE): Zayd Saif Khan · Cadet Knight · 48 riding hours · DPS Hyderabad Campus Hub · EFI-JR-99823 · Seal verified
- CTA: **Open the full record** → `/verify/BSAH-2026-HYD-042`

**§11 Standings** · S11 · horses gallop along the lanes to their points when the section enters · `bgCharge` (strip)

- Label: REEL 12 · THE CIRCUIT
- Headline: `LANCES DOWN. / Schools at war.`
- Lanes (SAMPLE, from client docs): DPS Hyderabad Campus Hub 1,420 pts · 12 gold · Oakridge International Hub 1,280 pts · 9 gold · The Hyderabad Public School 1,150 pts · 7 gold
- Countdown (SAMPLE): Sovereign Governor's Cup · 14 Nov 2026 · Hyderabad
- CTA: **The full circuit** → `/tournaments`

**§12 Safety shield** · S12 · numerals count up as lance rules draw between the columns · no photo

- Label: REEL 09 · THE SHIELD
- Headline: `SAFETY / before speed.`
- Columns: **Ex-cavalry** — Instructors from Indian Army RVC and NCC cavalry units. · **Daily** — Hoof, feed and hydration checks for every stallion, every day. · **₹10 L** — Group accident insurance for every active cadet.
- CTA: **How we keep cadets safe** → `/safety`

**§13 Command AI** · S13 · question types itself, answer streams in character by character · no photo

- Label: REEL 13 · COMMAND AI
- Headline: `ASK THE / command terminal.`
- Exchange: `> What is the safety record for Cadet Lancer drills?` → BSAH requires certified helmets and vests and an ex-cavalry spotter on every mounted drill. No major injuries logged across 1,480 horsemanship hours. *(SAMPLE)*
- Chips: Payback for 150 cadets · Insurance cover · Who are the instructors?
- CTA: **Open the terminal** → `/command`

**§14 The Chronicle (blog)** · S14 · the cover image swaps as you hover each headline · `journalReins` + post covers

- Label: REEL 14 · THE CHRONICLE
- Headline: `STORIES / from the stable.`
- Featured: The horse that would not leave the field. List: Why the ears curl · Omens of the stable · From royalty to cart horse, and back
- CTA: **Read the Chronicle** → `/journal`

**§15 Finale** · S15 · credits roll upward; the three CTAs stop at the centre and hold · `duneSilhouette`

- Headline: `THE ARENA IS OPEN. / Your cadet's legacy begins today.`
- CTAs: **Enrol a cadet** → `/contact?gate=parents` · **Partner your campus** → `/contact?gate=schools` · **Schedule a board audit** → `/contact?gate=audit`
- Credits: A production of Vicarius Infinitum Holdings Pvt Ltd · Operated by The Black Stallion Academy of Horsemanship Pvt Ltd · Sanctioned by the School Tent Pegging Council of India
- Corridors: boards@ · parents@ · partners@blackstallion.academy
- Motto: *Dominus Sui, Dominus Equi.* Master of oneself, master of the horse.

---

### R01 · The Marwari `/legend` (Act I)

Long-read in eleven chapters with a sticky chapter rail (S16). Written fresh from the documentary research in Part 9; stories marked *legend* are folklore as told in Marwar. Content: `lib/content/legend.ts`.

**Title card** · T2 iris · `duneSilhouette`

- REEL 01 / 15 · ACT I · THE LEGEND
- `THE LAND / of death.`
- Marwar is often translated as "the land of death". It gave India a horse that would not die easily, and would not leave the field.

**Ch. I · Born of the ocean** · quote + miniature plate + three theories · `legendOcean`

- `BEFORE HISTORY, / a horse king.`
- Hindu scripture tells of the churning of the cosmic ocean, when gods and demons pulled a great serpent around a mountain until the sea gave up its treasures. Among them rose Uchchaihshravas: a white horse with seven heads, so radiant the gods made him king of horses. Every horse in India, the old stories say, descends from him: the hill ponies of Manipur, the Spiti and Zanskari of the high passes, the Kathiawari of Gujarat, and the Marwari of the Thar.
- Sub-section · **Three theories of where it really began**
  - *The shipwreck* (legend): The *Ain-i-Akbari*, a sixteenth-century chronicle, tells of an Arab ship wrecked off Kutch, its seven horses swimming ashore to found a line.
  - *The steppe* (some influence): Turkoman and Mongol horses arrived with invading armies and mixed with local mares.
  - *The native* (most accepted): The Marwari shows little Arabian influence. At heart it is a horse of India.

**Ch. II · Marwar, 1193** · S17 route map (Kannauj → the Thar → Marwar) · `legendExodus`

- `DRIVEN INTO / the desert.`
- In 1193 the Rathore clan lost Kannauj and rode west into the Thar, to the dry plains of Marwar. Little grew there. Water came by the cupful. The horses that lived were the ones that could march for days, through heat by day and cold by night, on scraps of fodder, and still carry a rider into a fight. The horses survived, and so did the Rathores. In time the clan grew strong again, and the desert had given it a horse.

**Ch. III · Bred by law** · S18 annotated callouts · `legendSand`

- `BRED BY / law.`
- From the twelfth century the Rathores bred their horses strictly, keeping only the finest stallions. What they chose for is still in the breed.
- Callouts: 1 *Upright shoulder* — lifts the hoof clean out of soft sand · 2 *Slim, hard legs* — built for distance, not the sprint · 3 *Fine, silky coat* — sheds desert heat · 4 *Endurance* — not the fastest horse alive, one of the hardest to tire · 5 *The homing sense* — lost in the desert, the saying goes, trust your horse to find the way home · 6 *The revaal* — a smooth natural ambling gait, easy on a rider over long distances

**Ch. IV · The ears** · S19 scrub zoom into the ear tips · `legendEars`

- `THE TIPS / touch.`
- Beat 1: A Marwari's ears curve inward until the tips meet, like the arms of a lyre.
- Beat 2: They can turn through 180 degrees, and the horse's hearing is famously sharp.
- Beat 3: When the blood is mixed, the curve is the first thing to go. Breeders read the ears as a seal of purity.
- Beat 4: That curve is our monogram.

**Ch. V · Omens** · S20 almanac grid · `legendGrey`, `legendBlack`

- `READ THE / horse.`
- Old Marwar read a horse's colour and the whorls of its coat as a forecast. Breeders still listen.
- Tiles: **Grey** — favoured above all; the most prized colour · **Piebald & skewbald** — close behind the greys · **Blaze & four socks** — a white blaze and four white socks bring luck · **Devman** — a long whorl down the neck: good fortune · **Anusudhal** — a whorl beneath the eye: unwelcome to a rider · **Black** — the colour of night and death, long thought unlucky · **White** — pure white is not registered as Marwari; some call it Nukra, a type of its own
- The vow (blood accent, the site's one blood beat): `THEY CALLED THE BLACK HORSE AN OMEN. / We call it a vow.` — The Black Stallion carries the colour the bards feared, as a promise: we will not leave the field.

**Ch. VI · Three reasons** · S21 three words · `legendCavalry`

- In the late sixteenth century the Rajputs of Marwar fielded a cavalry of more than fifty thousand. The Rathores held one belief about their horses: a Marwari leaves the battlefield in only three ways.
- Words: `VICTORY.` / `DEATH.` / `OR CARRYING ITS RIDER HOME.`
- The bards tell of horses charging war elephants, rearing to shield a fallen rider, and leaping walls no horse should clear.

**Ch. VII · Roll of honour** · S22 portrait reel · `legendChetak`, `legendBahadur`, `fleetArbudh`

- `THE ROLL / of honour.`
- **Chetak · Haldighati, 1576.** Maharana Pratap's blue-grey stallion reared against a war elephant so his rider could strike. A blade on the elephant's tusk tore his leg. He would not leave until Pratap turned him, then carried his king across a stream and away from the field before he fell. A memorial stands near Haldighati.
- **Bahadur · Agra Fort, 1644** (legend). After Amar Singh Rathore struck down Salabat Khan inside the fort, the story goes, his horse carried him onto the ramparts and leapt from the wall. The horse did not survive the fall.
- **Arbudh.** Remembered as the war horse of Veer Durgadas Rathore, the general who kept Marwar's infant heir from the Mughals.
- **And the rest.** Kesar Kalmi, Udal and many more whose names survive only in ballads.
- Closing: Their courage kept kings and generals alive to fight again. India's history might have turned differently without them.

**Ch. VIII · Born to dance** · interlude, image right with a single paragraph · `legendNachni`

- `BORN TO / dance.`
- Beyond war, the Marwari is a horse of celebration. Some lines carry a strain called *nachni*, "born to dance", and with a skilled handler they step and rise to music at weddings and festivals. Many believe the true nachni line has almost faded. Glimpses remain.

**Ch. IX · The fall** · S23 descent; lines drop in as the image drains to grey · `legendFall`

- `FROM ROYALTY / to the cart.`
- For centuries only royal and Rajput warrior families could own these horses. A Marwari, it was said, stood above a prince.
- The British preferred their Thoroughbreds. Through the colonial years the Marwari went to fewer battles and was bred with less care; by the 1930s the stock was thinning.
- Marwar's lancers still rode for Sir Pratap Singh in the First World War, near the end of the age of cavalry.
- Then came independence. The princes gave up their states and, in the land reforms that followed, their estates.
- The stables had nowhere to go. Thousands of horses were sold as pack animals, castrated or shot. To many, the horse had become a symbol of the old order.
- Crossed with other breeds, the pure line began to disappear.

**Ch. X · The revival** · S24 ascent timeline + vignette · `legendRevival`

- `THE LINE / that refused to end.`
- Timeline: *Early 20th century* — Maharaja Umaid Singh of Jodhpur steps in to save the breed; his grandson, Maharaja Gaj Singh II, carries the work on. · *1995* — British horsewoman Francesca Kelly founds Marwari Bloodlines; a breed society forms in India. · *1999* — Kelly and Raghuvendra Singh Dundlod lead the founding of the Indigenous Horse Society of India. · *2000s* — endurance wins at the national games persuade the Equestrian Federation of India to sanction shows for indigenous horses. · *2009* — official registration begins; registered Marwaris are cold-branded. · *Today* — the breed is no longer at risk, working in endurance, tent pegging, weddings and festivals.
- Vignette · **The stallion that stayed** (as told in Marwar): When Maharaja Gaj Singh II visited the thikana of Badgaon to choose a colt sired by its famous stallion Vangalia, he asked to see the sire himself. The thakur, afraid of losing his best horse, led Vangalia out. The Maharaja admired him and left him where he stood: the stallion served the breed best where the mares of south Marwar could reach him. He chose a colt and rode home.

**Ch. XI · Every cadet rides one** · closing frame · `legendToday`

- `EVERY CADET / rides one.`
- The Marwari survived the desert, the wars and the years when India almost forgot it. At BSAH it does what it was bred for: it carries the next generation, and asks them to be worthy of the ride.
- Sources note: Breed history from the Marwari horse literature and breed societies (Part 9). Folklore is labelled as legend.

**End card** → REEL 02 · The Instrument

---

### R02 · The Instrument `/anatomy` (Act I)

Content: `lib/content/anatomy.ts`.

**Title card** · T3 specimen plate · `anatomyProfile`

- PLATE 02 · MARWARI STALLION · 15.2 HH · DARK BAY
- `THE / instrument.`
- Five hundred kilograms of muscle and nerve that notices your breathing before you do.

**§1 The plate** · S03 full · hotspot panels with four layers (Equine · Rider · Builds · From the legend)

| Point | Equine | Rider | Builds | From the legend |
| --- | --- | --- | --- | --- |
| Ears | Lyre-shaped ears turn through 180° and track sound independently. | Your breathing and tension are audible to the horse; calm breath settles it. | Emotional self-governance | Riders trusted the ears to point toward danger in the dark. |
| Neck | A strong ligament along the crest carries the head. | A level, soft neck asks for a level rider: head stacked over spine. | Carriage and presence | Stablemen judged a horse's readiness by how it carried its neck. |
| Saddle | The back carries the stride straight into the rider's seat. | At a walk, about a hundred rhythmic three-dimensional movements a minute reach the pelvis, close to human walking. | Core strength and balance | Rajput riders trained bareback to build a seat that never moved. |
| Flank | Sensitive skin and muscle answer the lightest leg pressure. | Steering with the legs needs inner-thigh strength and quiet control. | Precision without force | A rider with a lance in one hand steers with the legs alone. |
| Reins | A mouth that answers a few grams of contact. | Hands, seat and legs must agree; both sides of the body coordinate. | Clear, calm communication | Ten grams turn half a tonne. |
| Hoof | The fetlock flexes like a spring; desert hooves are hard and upright. | Heels down, ankles soft: the rider absorbs the stride through the leg. | Rhythm and timing | Marwar's horses crossed soft sand on bare hooves. |

**§2 Ten grams** · S25 scale balance · the beam levels as you scroll

- `TEN GRAMS / against half a tonne.`
- The lightest touch on the rein can turn a 500 kg stallion. Pull hard and the horse braces against you. Children learn fast that force fails and clarity works.

**§3 180 degrees** · S26 dial · drag (or arrow keys) to turn the ear; readout in Martian Mono

- `ONE HUNDRED AND EIGHTY / degrees of attention.`
- Each ear turns on its own. One can follow the instructor's voice while the other listens to the rider's breathing.

**§4 Breed standard** · S27 spec sheet

- `BREED / standard.`
- Origin: Marwar, Rajasthan, India · Height: stallions average about 150 cm (14.3 hands) · Ears: medium, curving inward until the tips touch; rotate 180° · Gait: natural ambling gait called the revaal · Colours: all colours; bay most common, grey most prized · Temperament: brave, loyal, alert · Registry: Marwari Horse Society, government-authorised registration since 2009 · Status: not at risk

**End card** → REEL 03 · The Matrix

---
### R03 · The Matrix `/science` (Act II)

Content: `lib/content/science.ts`.

**Title card** · T4 line drawing (rider + horse SVG draws itself, then `scienceRider` fades in)

- REEL 03 / 15 · ACT II · THE CITADEL
- `WHAT THE SADDLE / does to a child.`
- Four systems, one twenty-minute session. Here is what we can show, and how sure we are.

**§1 Four systems** · S04 full console; each tab shows three points and an evidence tag

- **Brain & nerves:** Reading a moving animal at speed means constant small decisions. · Slow breathing settles the horse, so the rider is rewarded for self-control. · Hands and legs give different signals at once, coordinating both sides of the body. — *Supported* (Pendry et al., 2014) / *Emerging* (bilateral coordination)
- **Spine & posture:** Balance on a horse needs head, shoulders and hips on one axis. · The walk moves the pelvis the way human walking does, without feet striking a hard floor. · The inner-ear balance system works every stride. — *Supported* (hippotherapy gait research)
- **Muscles:** Deep spinal stabilisers and the abdominal wall work continuously. · Inner thighs and glutes hold the seat. · Grip and fine hand control steer. — *Supported* (rider biomechanics)
- **Heart & lungs:** Trot and canter raise the heart rate into a training zone. · Breath must stay slow and deep or the horse gets anxious. · Low impact on knees and ankles: the horse takes the ground. — *Emerging*

**§2 A hundred a minute** · S28 pulse line; the waveform beats at ~100 per minute

- `A HUNDRED STEPS / a minute.`
- At a walk, a horse's back moves the rider's pelvis forward, sideways and up and down about a hundred times a minute: the same pattern the body makes when it walks. Therapists have used it for decades.
- Readout: `≈100 movements / min` · Source: American Hippotherapy Association

**§3 Twenty minutes vs forty** · S29 comparison ledger; rows rule in one by one

- `TWENTY MINUTES / in the saddle.`
- Columns: 20-min BSAH session · 40-min court sport (basketball, volleyball, table tennis)
- Stress: calm is required for the horse to cooperate · adrenaline spikes; calm isn't required
- Posture: upright, stacked spine for the whole session · repeated forward hunching and twisting
- Core: deep stabilisers work continuously · major limb muscles; deep core less engaged
- Joints: low impact; the horse absorbs the ground · repeated hard landings on court surfaces
- Empathy: a living partner to read and care for · fast reflexes, no partner to read
- Note: This compares what each activity demands, not measured outcomes. BSAH is collecting session data to measure outcomes.

**§4 What we can stand behind** · S30 footnote ledger (the honesty section; see Part 9 for the full list)

- `WHAT WE CAN / stand behind.`
- Rows: claim · status (Supported / Emerging / Not yet published) · source

**End card** → REEL 04 · Crisis & Cure

---

### R04 · Crisis & Cure `/why` (Act II)

Content: `lib/content/why.ts`.

**Title card** · T5 split cold/warm · `whyCrisis` (left, frost) + `whyCure` (right, gold)

- `DIGITAL FRAGILITY / is a choice.`
- Character is forged in the arena.

**§1 The glass** · S31 phone frame with notifications scrolling past

- `THE GLASS / that folds a child.`
- Hours bent over a screen round the shoulders, push the head forward and train attention to jump every few seconds. None of it asks a child to be calm, brave or present.
- Notifications: 12 new messages · You've been on for 3 hrs · Streak lost · 4 new videos · Battery 9% · Are you still watching?

**§2 Crisis to cure** · S05 full-screen slider + metric table

- `DRAG FROM / crisis to cure.`
- Table: Physical — Tech-neck slouch → Regal spinal posture · Focus — Dopamine burnout → Stoic composure · Connection — Screen isolation → Equine bond · Credentials — A generic app log → An EFI/STPCI-verified passport

**§3 The sanctuary of unpowered truth** · S32 quote monolith; words light up as you scroll

- A horse does not care about your title, your marks or your family name. It cannot be bought or flattered. It answers only the truth of how you feel.
- To command the horse, the cadet must first command themselves. *Dominus Sui, Dominus Equi.*

**§4 What we train for** · S33 hoofprint checklist

- `WHAT WE / train for.`
- Standing tall without being told · Breathing slowly when something goes wrong · Getting back on after a fall · Caring for an animal before themselves · Speaking clearly and quietly · Showing up at six because a horse is waiting

**End card** → REEL 05 · The Ledger

---

### R05 · The Ledger `/curriculum` (Act II)

Content: `lib/content/curriculum.ts`.

**Title card** · T6 ledger page · `currLedger`

- `AN ATHLETIC CURRICULUM / that builds character.`
- Every mounted drill maps to a trait a leader needs in a boardroom, a negotiation or a crisis.

**§1 Four ranks** · S34 staircase; each step rises as it enters

- I **Cadet Squire** — Ground care, grooming, leading, mounting, walk and trot. Pillars 1–3.
- II **Cadet Rider** — Independent canter, terrain transitions, first jumps, settling a spooked horse. Pillars 4–6.
- III **Cadet Knight** — Formation riding, riding without reins, recovering after a fall. Pillars 7–9.
- IV **Sovereign Lancer** — Tent pegging at speed, composure at the gallop, the STPCI national circuit. Pillars 10–12.

**§2 Twelve pillars** · S35 grid + detail pane (pillar, drill, trait, leadership translation, somatic note)

| # | Pillar | Drill | Trait | Leadership translation | In the body |
| --- | --- | --- | --- | --- | --- |
| 1 | Grooming & feeding | Hands-on stall care, hoof picking, feed prep | Radical humility & duty | Serving the team before oneself | Calm, non-verbal empathy |
| 2 | Posture | Cervical stacking, core holds | Regal carriage & poise | Presence in any room | An upright, stacked spine |
| 3 | Breath & calm | Breath synced to the stride | Emotional self-governance | Composure in a crisis | Slower breathing and heart rate |
| 4 | Terrain transitions | Walk-to-trot, trot-to-canter | Adaptive agility | Balance when conditions shift | Balance and spatial sense |
| 5 | Obstacle jumping | Timing and forward seat | Calculated risk | Deciding under pressure | Cardio, low joint impact |
| 6 | De-escalation | Settling a spooked horse without force | Diplomatic command | Resolving conflict with calm intent | Staying calm under adrenaline |
| 7 | Cavalry drills | Synchronised formation riding | Collective coordination | Executing as one team | Rhythm and spatial awareness |
| 8 | Unspoken trust | Riding without reins, seat cues only | Deep mutual trust | Leading by delegation | Coordination of both sides |
| 9 | Setback recovery | Remounting after a fall, supervised | Resilience | Recovering from failure without drama | Confidence after fear |
| 10 | Lance precision | Piercing 6 cm pegs at speed | Focal precision | Focus amid distraction | Hand-eye timing |
| 11 | Composure at speed | Steady breath at the gallop | High-pressure serenity | Calm in high-stakes moments | Breath control under load |
| 12 | Sovereign governance | Quiet command of a 500 kg stallion | Unforced authority | Leading with integrity and clarity | Whole-body poise |

**§3 The 45-minute class** · S36 clock ring; segments fill as you scroll

- 00–15 · Ground stable care: hoof inspection, tack check, grooming, feeding check, settling the heart rate
- 15–20 · Mounted breath alignment
- 20–30 · Trot and canter posture drills
- 30–40 · Lance, archery or barrel runs
- 40–45 · Cool-down and debrief; grades enter the ledger

**§4 Batches** · S37 timetable board · `currBatch` (SAMPLE timings; confirm per hub)

- Dawn · 06:00–06:45 · Mon Wed Fri · Juniors 8–11
- After school · 16:00–16:45 · Tue Thu · Intermediates 12–14
- Weekend · 07:00–07:45 · Sat Sun · All ranks
- Lancer squad · Sat 15:00–17:00 · Competition training · Knights and Lancers
- Small batches of eight cadets per instructor (SAMPLE)

**§5 Graded three ways** · S38 three stamps

- Every session is graded on **Riding**, **Ground** and **Stable**. Grades enter the ledger the same day and appear in the parent app.

**§6 The disciplines** · S39 four tall panels · `currTentpeg`, `currBarrel`, `currArchery`, `currFormation`

- **Tent pegging** — lance and sword at the gallop: speed, focus, hand-eye timing
- **Barrel racing** — tight turns at speed: seat control and acceleration
- **Mounted archery** — reins released at the canter to draw and loose
- **Mounted target** — low-recoil pellet targets for junior leagues: breath and nerve

**End card** → REEL 06 · The Studbook

---

### R06 · The Studbook `/fleet` (Act II)

Content: `lib/content/fleet.ts`.

**Title card** · T7 lantern corridor · `bgStable`

- `TWENTY-ONE STALLIONS. / Every one has a name.`
- Indigenous Marwari and Kathiawari horses, microchipped, vet-checked daily and on camera around the clock.

**§1 The registry** · S40 filterable list (All / Marwari / Kathiawari; status) + drawer with portrait, pedigree, vitals, quote

Profiles (SAMPLE, from the client's fleet schema):

| Name | Breed | Microchip | Hub | Character | Quote | Specialty | Age · Height · Coat | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chetak IX | Purebred Marwari | 356 098 112 004 912 | DPS Hyderabad | The Calm Sovereign | A fortress of composure. Chetak grounds anxious first-time cadets. | Breath calibration & beginner canter | 7 · 15.2 hh · dark bay, white blaze | Rest |
| Veer | Kathiawari cavalry line | 356 098 112 004 988 | Oakridge, Gachibowli | The High-Velocity Lancer | Relentless focus under momentum. Veer answers ten grams of rein. | Tent pegging & lance precision | 6 · 15.0 hh · chestnut gold | Arena session |
| Zilzal | Purebred Marwari | 356 098 112 005 011 | The Hyderabad Public School | The Stoic Leader | Commanding presence, unshakable patience. Notices a rider's nerves instantly. | Formation drills & vaulting | 8 · 15.3 hh · jet black | Rest |
| Tofan | Purebred Marwari | 356 098 112 004 991 | DPS Hyderabad | The Sensitive One | High sensitivity. Demands absolute rider composure. | Advanced lancer speed targets | 9 · 15.1 hh · dappled grey | Night feed |
| Kesar | Marwari | 356 098 112 005 027 | Oakridge, Gachibowli | The Showman | Steps lightly and loves an audience. | Mounted archery | 8 · 14.3 hh · skewbald | Rest |
| Arbudh | Marwari | 356 098 112 005 034 | The Hyderabad Public School | The Endurance Horse | Never the fastest. Never the first to tire. | Distance & terrain transitions | 10 · 15.0 hh · light bay, four socks | Arena session |

Microchip note: ISO 11784/11785, 15 digits, read at the stall door.

**§2 On camera all night** · S41 CCTV grid with live timestamps · `fleetStallcam` (four crops)

- `ON CAMERA / all night.`
- Every stall has a camera. Parents can watch their child's assigned stallion rest, eat and sleep from the app.
- Feeds: CAM 01 · Chetak IX · Stall 3 · REST — CAM 02 · Veer · Arena · SESSION — CAM 03 · Zilzal · Stall 7 · REST — CAM 04 · Tofan · Stall 1 · NIGHT FEED

**§3 The stable log** · S42 care log (SAMPLE)

- 05:30 Water check · all stalls · OK — 06:00 Feed · oats, lucerne, salt · logged — 06:20 Hoof inspection · 21/21 · Tofan front-left stone bruise, rested — 09:00 Vet round — 14:00 Hydration log — 15:30 Tack check before sessions — 18:30 Cool-down & rugs — 21:00 Night feed

**End card** → REEL 07 · The Hall of Valour

---

### R07 · The Hall of Valour `/cadets` (Act II)

Content: `lib/content/cadets.ts`.

**Title card** · T8 portrait · `cadetZayd`

- `THE HALL / of valour.`
- Cadets earn their place: hour by hour, rank by rank, sealed in brass.

**§1 Spotlights** · S43 staggered portraits · `cadetZayd`, `cadetAnanya`, `cadetRohan` (SAMPLE, names from client docs)

- **Zayd Saif Khan** · Cadet Knight · DPS Hyderabad Campus Hub · 48 riding hours · National STPCI qualifier
- **Ananya Reddy** · Cadet Knight · Oakridge International Hub · 36 riding hours · Mounted archery champion
- **Rohan Verma** · Cadet Rider · The Hyderabad Public School Hub · 24 riding hours · Perfect canter score

**§2 The Sovereign Passport** · S44 leather passport opens page by page on scroll

- `THE SOVEREIGN / passport.`
- Handcrafted leather, stamped with a heavy brass seal at every rank. It goes wherever the cadet rides, and its code opens a public record.
- Pages: cover · identity (name, hub, code) · rank seals (Squire ✓ Rider ✓ Knight ✓ Lancer —) · hours (48)

**§3 A cadet's day** · S45 day clock

- 06:00 Stoic daily spark — a 30-second audio brief on courage, in the app
- 07:30 School
- 15:45 Passport scanned at the stable gate; a parent is alerted
- 16:00 Ground care: grooming, hooves, tack
- 16:15 Mounted session
- 16:45 Log and debrief; the ledger updates
- 17:00 Ten-second milestone reel sent home
- 21:00 Lights out. The stallion's night feed, on camera

**§4 The creed** · S46 creed card (from `docs/reference/legal/cadet-creed.md`, verbatim)

1. I do not ride to conquer the horse; I command to master myself.
2. My posture reflects my internal state: unshakable, calm and erect.
3. A 500-kilogram living partner feels my heart before I speak; therefore, my composure shall be absolute.
4. Excuses vanish in the arena. Fall nine times, mount the tenth without hesitation or fear.
5. Leadership is not vocal volume; it is unforced authority, non-verbal empathy and quiet integrity.
6. I wear the Sovereign Passport with pride, serving my team, my academy and my nation.

**§5 Ten seconds that prove it** · S02 film strip (second and last use) · `cadetRohan`, `currTentpeg`, `currArchery`, `currFormation`

- First canter · Rohan, 13 — First peg carried · Zayd, 15 — Archery at the canter · Ananya, 14 — Riding without reins · Knight squad

**End card** → REEL 08 · The Guardian

---

### R08 · The Guardian `/parents` (Act II)

Content: `lib/content/parents.ts`.

**Title card** · T9 rail view · `parentsRail`

- `THE GUARDIAN / sees every stride.`
- You can't be in the arena every day. You can see everything that happens there.

**§1 In your pocket** · S47 pinned phone; the screen changes with each step

- Stall-cam — Watch Chetak IX at night feed, live.
- Gate alert — Ananya checked in at 15:52 · DPS Hub.
- Milestone reel — Today: first canter without stirrups · 0:10.
- Passport — Cadet Rider · 24 hrs · next seal at 30 hrs.

**§2 Admissions in five steps** · S48 hoofprint path

1. **Enquire** — fill the form, or scan the flyer at your school.
2. **Visit the hub** — meet the instructor and the stallions.
3. **Assessment ride** — twenty minutes to place your child in the right batch.
4. **Onboarding** — passport stamped, uniform sized, welcome box.
5. **First session** — passport scanned at the gate; you get the first alert.

**§3 Fees, plainly** · S49 receipt

- Onboarding (one-time) · ₹2,000 — handcrafted Sovereign Passport, brass seal stamping, uniform badges, welcome box
- Monthly tuition · ₹8,000 + 18% GST (₹1,440) = **₹9,440 / month**, by UPI Autopay on the 1st
- Riding safety kit (optional) · ₹3,000 — certified helmet, riding gloves, protective chaps
- First month with kit · ₹14,440

**§4 Standing orders (FAQ)** · S50

- *What age can my child start?* From 8, in the Junior batch. Everyone starts at Cadet Squire, on the ground. (SAMPLE: confirm minimum age)
- *Does my child need riding experience?* No. Experience moves a cadet faster, never past the rules.
- *Is it safe?* Safety is the first promise. See the Shield.
- *Will it clash with school?* Sessions run on your child's own campus, before or after school hours.
- *What if my child falls?* Falls are part of riding. Cadets wear certified helmets and vests, learn how to fall before they canter, and are covered by ₹10 lakh group accident insurance.
- *Can I watch?* From the rail during sessions, and any time on the stall-cam.
- *How do I pay?* Monthly UPI Autopay on the 1st. Onboarding and the kit are paid once.
- *Can we pause?* Yes, with 30 days' notice. (SAMPLE)

**§5 CTA** · `ENROL / a cadet.` → `/contact?gate=parents`

**End card** → REEL 09 · The Shield

---

### R09 · The Shield `/safety` (Act II)

Content: `lib/content/safety.ts`.

**Title card** · T10 still life with numbered labels · `safetyKit`

- `SAFETY / before speed.`
- No lance is lowered until the basics are second nature.

**§1 The three shields** · S12 full

- **Ex-military instructors** — Sourced from Indian Army RVC and NCC cavalry units.
- **Veterinary & livestock care** — On-campus equine vet protocols; strict hydration and feeding logs.
- **Comprehensive insurance** — ₹10 lakh group accident cover for every active cadet.

**§2 Orders of the day** · S51 numbered protocol in mono

01 Helmet on before the stable door · 02 Vests for jumping and lance work · 03 A spotter on every mounted drill · 04 The fall is taught before the canter · 05 Horses are checked before cadets: hooves, temperature, tack · 06 Heat protocol: sessions move to cooler hours; water every session · 07 Every stallion gets rest days · 08 Incidents are logged the same day and reported to parents

**§3 The record** · S52 number wall (SAMPLE)

- 1,480 horsemanship hours logged · 0 major injuries · 21 stallions vet-checked daily · ₹10 L cover per cadet

**§4 The people in the arena** · portrait pair · `safetyInstructor`, `safetyVet`

- Chief Cavalry Instructor — ex-Army RVC (SAMPLE) · Equine veterinarian — daily rounds · Stable master — feed, water and rest logs

**End card** → REEL 10 · The Citadel

---
### R10 · The Citadel `/schools` (Act III)

Content: `lib/content/schools.ts`. Audience: principals, trustees, chairmen. Tone: precise, numerate, calm.

**Title card** · T11 aerial zoom · `schoolAerial`

- `YOUR CAMPUS / becomes a citadel.`
- A turnkey equestrian hub, designed, built and run by BSAH, that returns a share of every rupee of tuition to your school.

**§1 The model** · S53 flow; connectors draw from node to node

- `YOU BUILD. / We run. You share.`
- 1 **The school funds the arena** — construction is a campus asset that stays yours.
- 2 **BSAH designs, builds and operates** — horses, faculty, vets, insurance, admissions and billing are ours.
- 3 **The school earns 25–30%** — of gross tuition, every month, as enrolment grows.

**§2 Three tiers** · S09 full blueprint configurator · `bgPavilion`

| Tier | Footprint | Cadets | Capital (school) |
| --- | --- | --- | --- |
| Standard Hub | 4 stables, sand arena, fencing, tack room · 0.5 acre | 100–150 | ₹8.20 L |
| Signature Hub | 8 stables, full arena, AC lounge, floodlights · 1 acre | 200–300 | ₹15.00 L |
| Royal Pavilion | 12 stables, cavalry arena, VIP deck · 1.5+ acres · STPCI host venue | 300+ | ₹25.00 L+ |

**§3 Return simulator** · S54 instrument panel: cadet slider (100–500), share (25% / 30%), tier → annual tuition, school share per year, payback months

- Formula: annual tuition = cadets × ₹8,000 × 12 (before GST) · school share = tuition × share · payback (months) = capital ÷ (school share ÷ 12)
- Default: 150 cadets · 25% · Standard → ₹1.44 Cr tuition · ₹36 L to the school per year · payback ≈ 2.7 months at full enrolment
- Footnote: Estimate at ₹8,000 monthly tuition per cadet before GST, at full enrolment. Enrolment ramps up over the first terms; final terms are set in the MOU.
- Gate: **Unlock the full model & draft MOU** → `/schools/mou`

**§4 Hubs** · S55 map pins (Hyderabad) · id `hubs`

- DPS Hyderabad Campus Hub → `/schools/dps-hyderabad`
- Oakridge International Hub, Gachibowli → `/schools/oakridge-gachibowli`
- The Hyderabad Public School Hub, Begumpet → `/schools/hyderabad-public-school`
- Next (SAMPLE): Bengaluru · Pune · Delhi NCR, 2027

**§5 What a hub brings the school** · S56 seal row

- STPCI tournament hosting rights · EFI junior pathway · Press and national coverage · Royal Pavilion hubs host the Governor's Cup

**§6 CTA** · **Request a draft MOU** → `/schools/mou` · **Schedule a board audit** → `/contact?gate=audit`

**End card** → REEL 11 · The Seal

#### `/schools/[slug]` — Hub landing (flyer QR target)

Template sections: hero (school name + image) → "At this hub" plate (tier, stallions, cadets, instructor, batch timings) → stallions stabled here (from fleet by hub) → parent enquiry form (parent name, child's name, class, phone, preferred batch) with success state → back to `/schools`.

| Slug | Name | Tier | Stallions | Image | Notes (SAMPLE) |
| --- | --- | --- | --- | --- | --- |
| dps-hyderabad | DPS Hyderabad Campus Hub | Signature | 8 | `schoolAerial` | Circuit leader, Governor's Cup host 2026 |
| oakridge-gachibowli | Oakridge International Hub, Gachibowli | Standard | 4 | `schoolArenaNight` | Floodlit evening batches |
| hyderabad-public-school | The Hyderabad Public School Hub, Begumpet | Royal Pavilion | 12 | `bgPavilion` | Heritage pavilion, Junior Lancers host |

#### `/schools/mou` — Draft MOU generator

Form (school name, city, trustee name, designation, email, phone, available land in acres, tier, expected cadets) on the left; a live parchment draft on the right that fills as you type; **Print / save as PDF** uses print CSS. Draft text: parties (school and BSAH Pvt Ltd), scope (design, build supervision, operation), school obligations (fund construction, provide land and access), BSAH obligations (horses, faculty, vet care, insurance, admissions, billing), revenue share (25–30% of gross tuition, monthly), term (5 years, SAMPLE), governance (STPCI rules), signatures. Banner: *Draft for discussion. Not a binding document.*

---

### R11 · The Seal `/verify` (Act III)

Content: `lib/content/verify.ts`.

**Title card** · T12 seal stamps over the title · `bgPassport`

- `EVERY HOUR / sealed in brass.`
- A public record of every cadet's rank and hours. Nothing private, nothing editable.

**§1 Verify a passport** · S10 full; sample codes listed under the field

- Try: BSAH-2026-HYD-042 · BSAH-2026-HYD-017 · BSAH-2026-HYD-088

**§2 How a record is made** · S57 chain

- **Issued** — every session is logged by the instructor the same day.
- **Sealed** — the chief instructor applies each rank seal; the record locks.
- **Verified** — anyone with the code sees the record.

**§3 What a verifier sees** · two ruled columns

- Shown: name · rank · riding hours · hub · EFI registration · milestones
- Never shown: contact details · address · medical notes · payments

#### `/verify/[code]` — The record

Credential card (name, rank, hours, hub, EFI ID, issued date, seals 1–4) → milestones → **diploma preview** (parchment, STPCI watermark, gold seal, signatures "Saef Ullah Khan, Founder & Executive Chairman" and "Chief Cavalry Instructor", verification URL) with **Print diploma**. Unknown code: "No sealed record matches this code." with a retry field.

Sample records (SAMPLE): BSAH-2026-HYD-042 Zayd Saif Khan · Cadet Knight · 48 h · DPS Hyderabad Campus Hub · EFI-JR-99823 — BSAH-2026-HYD-017 Ananya Reddy · Cadet Knight · 36 h · Oakridge International Hub · EFI-JR-99741 — BSAH-2026-HYD-088 Rohan Verma · Cadet Rider · 24 h · The Hyderabad Public School Hub · EFI pending.

---

### R12 · The Circuit `/tournaments` (Act III)

Content: `lib/content/tournaments.ts`.

**Title card** · T13 charge with speed streaks · `bgCharge`

- `LANCES DOWN. / Schools at war.`
- The STPCI interscholastic circuit: tent pegging, barrel racing and mounted archery between India's schools.

**§1 Standings 2026–27** · S11 full lanes (SAMPLE, client docs)

| Pos | Hub | Points | Gold | Governor's Cup |
| --- | --- | --- | --- | --- |
| 01 | DPS Hyderabad Campus Hub | 1,420 | 12 | Qualified for national finals |
| 02 | Oakridge International Hub | 1,280 | 9 | Semi-finals qualified |
| 03 | The Hyderabad Public School | 1,150 | 7 | Regional contender |

**§2 Fixtures** · S58 departure board (letters flip in)

- 14 NOV 2026 · Sovereign Governor's Cup · DPS Hyderabad Campus Hub · National qualifier · ENTRIES OPEN
- 12 DEC 2026 · Hyderabad Interschool Tent Pegging · Oakridge International · League round · ENTRIES OPEN
- 23 JAN 2027 · Junior Lancers Invitational · The Hyderabad Public School · Under-14 · SOON

**§3 The art of the peg** · S59 course diagram

- `THE ART OF / the peg.`
- Tent pegging is an old cavalry skill. Riders galloped at an enemy camp and lifted its wooden tent pegs on the point of a lance, bringing the tents down on the sleepers. Today it is a sport of nerve and timing.
- Annotations: 100 m run-up · gallop about 35 km/h · 9-foot lance · peg about 6 cm wide · carry the peg past the line for full points

**§4 Hall of champions** · podium steps · `tournPodium`, `tournCup`

- 2025–26 (SAMPLE): Governor's Cup — DPS Hyderabad · Mounted archery — Ananya Reddy · Best young rider — Rohan Verma

**End card** → REEL 13 · Command AI

#### `/tournaments/[slug]`

Template: hero (image, name, date) → plate (venue, format, age groups, entries status) → events list → day schedule (timeline) → how schools enter (via STPCI) → back to the circuit.

| Slug | Name | Date | Venue | Format | Image |
| --- | --- | --- | --- | --- | --- |
| governors-cup-2026 | Sovereign Governor's Cup | 14 Nov 2026 | DPS Hyderabad Campus Hub | National qualifier: tent pegging (individual & team), barrel racing | `tournCrowd` |
| hyderabad-interschool-2026 | Hyderabad Interschool Tent Pegging | 12 Dec 2026 | Oakridge International Hub | League round: tent pegging, mounted target | `schoolArenaNight` |
| junior-lancers-2027 | Junior Lancers Invitational | 23 Jan 2027 | The Hyderabad Public School | Under-14: walk-trot tent pegging, mounted archery demo | `tournCup` |

---

### R13 · Command AI `/command` (Act III)

Content: `lib/content/command.ts`. A full-screen terminal (S13) with a dossier side panel. Scripted answers today (keyword match over a knowledge base: fees, tiers, ROI, insurance, safety, faculty, curriculum, horses, tournaments, verification, admissions); unmatched questions get "Logged for the Office of the Chairman. A person will reply within one working day." Label the terminal *Preview: scripted answers. Live AI follows with Supabase.*

**Title card** · T14 boot sequence: `SOVEREIGN COMMAND TERMINAL v2.4 · SYSTEM INITIALISED · ASK ABOUT ROI, INSURANCE, SAFETY OR CURRICULUM`

---

### R14 · The Chronicle `/journal` (Act III)

Content: `lib/content/journal.ts` (full article text lives there).

**Title card** · T15 masthead: THE CHRONICLE · Stories from the stable · Hyderabad · Vol. I

Index: featured story full-bleed, then an editorial list with category, reading time and dek. Article template: cover, title (two voices), dek, byline "The Chronicle", reading time, long-form body in Newsreader with a drop cap, pull quote, sidenote sources, previous/next.

| Slug | Title | Category | Dek | Cover |
| --- | --- | --- | --- | --- |
| the-horse-that-would-not-leave-the-field | The horse that would not leave the field | Legend | Victory, death, or the wounded rider: the vow behind the Marwari, and the stallion who kept it at Haldighati. | `legendChetak` |
| why-the-ears-curl | Why the ears curl | Legend | The lyre-shaped ears that turn 180 degrees, and why breeders read them as a seal of purity. | `legendEars` |
| omens-of-the-stable | Omens of the stable | Legend | Greys, blazes, devman whorls and the black horse: how Marwar read a horse's future in its coat. | `legendGrey` |
| from-royalty-to-cart-horse-and-back | From royalty to cart horse, and back | Legend | How the Marwari nearly vanished after 1947, and the people who brought it back. | `legendRevival` |
| the-dancing-horses-of-marwar | The dancing horses of Marwar | Legend | Nachni, the revaal, and the wedding processions where the warhorse becomes a dancer. | `legendNachni` |
| ten-grams-of-rein | Ten grams of rein | Academy | What a child learns when shouting does nothing and the lightest touch turns half a tonne. | `journalReins` |

---

### R15 · The Gate `/contact` (Act III)

Content: `lib/content/contact.ts`. `?gate=parents|schools|audit|partners` preselects a gate.

**Title card** · T16 gate halves part · `contactGate`

- `THE ARENA / is open.`
- Three corridors. Choose yours.

**§1 Three gates** · S60

- **School boards** — Book a campus feasibility audit and a 15-minute executive briefing. boards@blackstallion.academy. Fields: name, designation, school, city, email, phone, available land, message.
- **Parents** — Enrolment, uniform sizing and Sovereign Passport support. parents@blackstallion.academy. Fields: parent name, child's name, class, school/hub, phone, email, message.
- **Regional partners** — PT teachers, sports heads and regional partners. partners@blackstallion.academy. Fields: name, organisation, city, email, phone, message.
- Submit → server action validates (zod) and returns a sealed confirmation ("Received. Sealed for the Office of the Chairman."). Persistence lands with Supabase (`leads` table).

**§2 Coordinates** · plate: Headquarters Hyderabad, Telangana, India · Office of the Executive Chairman · Mon–Sat 09:00–18:00 IST (SAMPLE)

---

### Credits · `/about` — The Mandate

Content: `lib/content/about.ts`.

**Title card** · T17 monogram drawn in brass

- `DOMINUS SUI, / dominus equi.`
- Master of oneself, master of the horse.

**§1 The Chairman's letter** · S61 (DRAFT, for the Chairman's approval)

> We did not set out to build a riding school. We set out to answer a question every parent asks quietly: how do I raise a child who stands tall when no one is watching? Our answer is five hundred kilograms of honesty. A Marwari stallion cannot be flattered, bribed or rushed. It asks a child to be calm, clear and brave, and it asks every single day. We bring that horse, and the men who served in India's cavalry, inside the school gate, and we write down every hour so the progress is never a promise. That is the mandate. — Saef Ullah Khan, Founder & Executive Chairman

**§2 Six truths** · S32 (second and last use) · the six truths from Part 1.3, one per line, each lighting on scroll

**§3 The house** · S62 org tree

- Vicarius Infinitum Holdings Pvt Ltd (parent)
  - The Black Stallion Academy of Horsemanship Pvt Ltd — operating arm · interscholastic leadership and cavalry sport · **Active**
  - The Black Stallion Order — private member society for equestrian connoisseurs · **Invitation only, in development**
  - Stallion Black Coffee — micro-lot coffee for focus and endurance · **Coming soon**
- School Tent Pegging Council of India (STPCI) — governs the interscholastic circuit

---
## 7. Data models

All content is typed in `lib/content/*.ts` today and maps 1:1 to the Supabase tables in `docs/reference/architecture-guide.md` later. Keep field names identical so the swap is a data-source change, not a rewrite.

```ts
type Act = "legend" | "citadel" | "ledger";
type Reel = { n: number; slug: string; href: string; act: Act; title: string; inscription: string; voice: string; image: MediaKey };

type Stallion = { id: string; name: string; breed: string; chip: string; hub: HubSlug; character: string; quote: string;
  specialty: string; age: number; hands: string; coat: string; status: "rest" | "arena" | "feed"; image: MediaKey;
  pedigree: { sire: string; dam: string; grandsire: string; granddam: string } };              // equine_fleet

type Hub = { slug: HubSlug; name: string; area: string; tier: TierId; stallions: number; cadets: number; image: MediaKey;
  batches: { name: string; time: string; days: string }[]; note: string };                    // school_hubs

type Tier = { id: "standard" | "signature" | "royal"; name: string; stables: number; acres: string; cadets: [number, number | null];
  capexLakh: number; includes: string[] };

type Credential = { code: string; name: string; rank: RankId; hours: number; hub: HubSlug; efi: string | null;
  issued: string; seals: RankId[]; milestones: { date: string; text: string }[] };            // cadets + ranks_and_milestones

type Standing = { pos: number; hub: string; points: number; gold: number; cup: string };      // stpci_league_standings
type Tournament = { slug: string; name: string; date: string; venue: string; format: string; ages: string;
  status: "open" | "soon" | "closed"; events: string[]; schedule: { time: string; item: string }[]; image: MediaKey };
type Post = { slug: string; title: [string, string]; category: "Legend" | "Academy" | "Circuit"; dek: string;
  minutes: number; cover: MediaKey; body: Block[] };                                          // CMS later
type Lead = { gate: "parents" | "schools" | "audit" | "partners" | "hub"; fields: Record<string, string> };   // leads (new table)
```

Supabase additions needed (not in the 11-table schema): `leads` (all forms), `posts` (optional CMS). Existing `mou_proposals` takes `/schools/mou` submissions.

---

## 8. Media manifest and Higgsfield prompts

Model: **Cinema Studio Image 2.5** (`cinematic_studio_2_5`), 2K, 2 credits each. Files land in `public/media/<file>`; the manifest in `lib/content/media.ts` maps each key to its local path, CDN fallback and alt text. `FilmImage` shows a graded gradient until a file loads, so a missing file never breaks a frame. Every prompt below is followed by one of two style suffixes.

**PHOTO suffix:** Cinematic film still, 35mm anamorphic lens, low-key chiaroscuro, single warm key light from upper left, deep black-brown shadows, warm sepia and antique gold grade, fine dust in the air, heavy film grain, shallow depth of field, photorealistic, no text, no logos, no watermark.

**PLATE suffix:** An 18th-century Rajput miniature painting of the Marwar school, flat perspective, mineral pigments, burnished gold leaf, fine brushwork, aged paper, dark margins, archival museum photograph of the painting, no text.

**Uniform (any cadet):** fitted black riding jacket with brass buttons and thin brass piping, white breeches, tall black boots, black velvet riding helmet with chin strap.

### 8.1 Existing placeholders (generated 9 Oct 2026)

heroDust · rearing · gallop · eye · riderLance · duneSilhouette · bgFort · bgArena · bgStable · bgPavilion · bgPassport · bgCharge · dustPlume · dustWall · heroLoop (video). See `public/media/PLACEHOLDERS.md`.

### 8.3 Session 24 Oct 2026 (8 stills, PHOTO suffix + uniform line, 2K)

| Key | File | Ratio | Prompt (abridged) |
| --- | --- | --- | --- |
| pegApproach | peg-approach.png | 16:9 | Side-on tracking shot, cadet galloping a dark bay Marwari down a tent-pegging lane, lance upright, peg far ahead |
| pegAlign | peg-align.png | 16:9 | Three-quarter front, cadet at full gallop lowering the lance toward an angled peg |
| pegLift | peg-lift.png | 16:9 | Ground-level close: lance tip lifting a wooden peg out of packed sand, burst of sand |
| pegCarry | peg-carry.png | 16:9 | Cadet galloping past a white line marker, peg carried high on the lance |
| dayTack | day-tack.png | 3:4 | Girl cadet tightening a girth in a stable at dawn, light through slats |
| dayWalk | day-walk.png | 3:4 | Four cadets leading horses in single file to the arena, early morning |
| dayBrief | day-brief.png | 3:4 | Former cavalry instructor briefing cadets beside their horses at dusk |
| dayGroom | day-groom.png | 3:4 | Young cadet brushing a black Marwari in a lantern-lit stable |

These are CDN-only until `scripts/fetch-media.sh` is run on the Mac (it now also writes WebP copies); then swap `cdnOnly(...)` for `m(...)` in `lib/content/media.ts` and commit the WebPs.

### 8.2 New set (43 stills)

| Key | File | Ratio | Suffix | Prompt |
| --- | --- | --- | --- | --- |
| legendOcean | legend-ocean.png | 3:4 | PLATE | Uchchaihshravas, a radiant white seven-headed celestial horse rising from a churning cosmic ocean of milk, gods and demons pulling a great serpent coiled around a mountain in the background |
| legendExodus | legend-exodus.png | 21:9 | PHOTO | A long column of 12th-century Rajput Rathore warriors on horseback crossing the Thar desert at dusk, saffron banners, camels and families in the caravan, an enormous dust cloud lit gold by the low sun |
| legendSand | legend-sand.png | 16:9 | PHOTO | Low-angle close shot of a Marwari horse's slender legs and hard hooves lifting out of deep soft desert sand mid-stride, sand spraying, upright shoulder, golden backlight |
| legendEars | legend-ears.png | 3:4 | PHOTO | Extreme close-up of a Marwari horse's lyre-shaped ears curving inward until the tips touch, backlit by warm gold rim light against black, fine hairs glowing |
| legendGrey | legend-grey.png | 3:4 | PHOTO | Portrait of a dappled grey Marwari stallion with inward-curving ears and an ornate Rajasthani silver bridle, dark sandstone fort wall behind, lantern light |
| legendBlack | legend-black.png | 3:4 | PHOTO | Portrait of a jet black Marwari stallion in near darkness, only a thin gold rim light tracing the inward-curving ears, neck and eye |
| legendCavalry | legend-cavalry.png | 21:9 | PHOTO | 16th-century Rajput cavalry charge across a dusty plain, riders in quilted armour with lances and curved swords on Marwari horses with curled ears, war elephants in the haze behind |
| legendChetak | legend-chetak.png | 3:4 | PLATE | A blue-grey Marwari warhorse, one foreleg wounded, leaping a narrow stream while carrying a wounded Rajput king in armour away from battle, soldiers and a war elephant behind |
| legendBahadur | legend-bahadur.png | 3:4 | PHOTO | Night, a Marwari horse with a Rajput rider leaping from the high red sandstone battlements of a Mughal fort, torches on the walls, guards looking up, moonlight and smoke |
| legendNachni | legend-nachni.png | 16:9 | PHOTO | A Marwari horse rising in a dancing step at a night wedding procession in Rajasthan, decorated with mirror-work and tassels, a handler in a red turban, brass lanterns and marigolds |
| legendFall | legend-fall.png | 16:9 | PHOTO (monochrome) | 1950s India, black-and-white documentary photograph, a thin Marwari horse with curled ears harnessed to a wooden cart loaded with sacks on a dusty village road, faded, scratched |
| legendRevival | legend-revival.png | 21:9 | PHOTO | A herd of Marwari horses of mixed colours galloping across Rajasthan scrubland at golden hour, inward-curving ears, long shadows, dust rising |
| legendToday | legend-today.png | 16:9 | PHOTO | A 13-year-old Indian cadet in uniform gently touching the curled ear of a bay Marwari stallion in a stable doorway at dawn, warm side light |
| anatomyProfile | anatomy-profile.png | 16:9 | PHOTO (clean) | Studio photograph of a dark bay Marwari stallion standing square in full side profile facing right, the whole horse from ear tips to hooves in frame with space around it, inward-curving ears visible, plain black background, gold rim light outlining the silhouette, museum specimen lighting |
| scienceRider | science-rider.png | 16:9 | PHOTO | Side view of an upright young rider at sitting trot on a Marwari horse in an arena at dusk, perfectly stacked spine, shoulders back, chin level |
| whyCrisis | why-crisis.png | 16:9 | PHOTO (cold) | A 12-year-old Indian boy hunched over a glowing smartphone on a bed in a dark room at night, cold blue screen light on his face, rounded spine, side view |
| whyCure | why-cure.png | 16:9 | PHOTO | Side view of a 12-year-old Indian boy in cadet uniform sitting tall on a Marwari horse at golden hour, upright spine, chin level, same framing as a portrait study |
| currLedger | curr-ledger.png | 16:9 | PHOTO | An open leather-bound ledger with handwritten columns, three embossed brass seals and a wax stamp, a brass dip pen, on a dark walnut desk, lamp light |
| currGroundcare | curr-groundcare.png | 3:4 | PHOTO | A teenage cadet in uniform with sleeves rolled picking a horse's hoof in a stable in the morning, light beams through wooden slats |
| currFormation | curr-formation.png | 16:9 | PHOTO | Six young cadets in uniform riding in a precise line across a sand arena at dusk, an instructor's silhouette in the foreground |
| currArchery | curr-archery.png | 3:4 | PHOTO | A teenage girl cadet in uniform drawing a recurve bow while cantering on a grey Marwari horse, dust, focused |
| currBarrel | curr-barrel.png | 3:4 | PHOTO | A young rider and Marwari horse turning tightly around a barrel, sand spraying, horse leaning low |
| currTentpeg | curr-tentpeg.png | 3:4 | PHOTO | Close action shot of a lance tip piercing a small wooden peg in the ground at full gallop, hooves and dust, motion blur |
| currBatch | curr-batch.png | 21:9 | PHOTO | Group portrait of twelve Indian cadets aged 10 to 16 in uniform standing in a line beside their Marwari horses in an arena at dusk, instructor at the end |
| fleetChetak | fleet-chetak.png | 3:4 | PHOTO | Portrait of a dark bay Marwari stallion with a white blaze and inward-curving ears against black, gold rim light |
| fleetVeer | fleet-veer.png | 3:4 | PHOTO | Portrait of a chestnut-gold Kathiawari stallion with lyre-shaped ears against black, gold rim light |
| fleetKesar | fleet-kesar.png | 3:4 | PHOTO | Portrait of a skewbald (brown and white) Marwari stallion with inward-curving ears against black, gold rim light |
| fleetArbudh | fleet-arbudh.png | 3:4 | PHOTO | Portrait of a light bay Marwari stallion with four white socks and inward-curving ears against black, gold rim light |
| fleetStallcam | fleet-stallcam.png | 16:9 | PHOTO (night-vision) | High overhead security-camera view of a horse resting in a clean straw stall at night, monochrome green night-vision tint, wide-angle distortion |
| cadetZayd | cadet-zayd.png | 3:4 | PHOTO | Portrait of a 15-year-old Indian boy cadet in uniform holding a tall tent-pegging lance upright beside a horse at dusk, calm proud expression |
| cadetAnanya | cadet-ananya.png | 3:4 | PHOTO | Portrait of a 14-year-old Indian girl cadet in uniform with a braid holding a recurve bow, arena behind |
| cadetRohan | cadet-rohan.png | 3:4 | PHOTO | A 13-year-old Indian boy cadet cantering a bay Marwari horse, upright, dust, side view |
| parentsRail | parents-rail.png | 16:9 | PHOTO | A mother and father at a wooden arena rail at dusk watching their child ride, seen from behind |
| safetyKit | safety-kit.png | 16:9 | PHOTO | Still life of a black velvet riding helmet, leather gloves, a protective vest and chaps on a dark wooden bench, lamp light |
| safetyInstructor | safety-instructor.png | 16:9 | PHOTO | A grey-moustached former Indian Army cavalry instructor in a khaki shirt adjusting the chin strap of a young cadet's helmet in an arena |
| safetyVet | safety-vet.png | 3:4 | PHOTO | A veterinarian in a dark apron examining a Marwari horse's hoof in a stable, lamp light |
| schoolAerial | school-aerial.png | 21:9 | PHOTO | Aerial drone view at dusk of a large Indian school campus with red-brick buildings, a new sand riding arena with white fencing and a row of stables beside the playing fields, warm lights |
| schoolArenaNight | school-arena-night.png | 16:9 | PHOTO | A school riding arena at night under floodlights, cadets riding, modern stables with breeze-block walls, dust in the light beams |
| tournCup | tourn-cup.png | 3:4 | PHOTO | A tall antique silver and brass trophy cup engraved with crossed lances on dark velvet beside gold medals with ribbons |
| tournCrowd | tourn-crowd.png | 21:9 | PHOTO | A tent pegging tournament at a school ground, spectators in stands with flags, a rider at full gallop with lance lowered toward a peg, dust, late afternoon |
| tournPodium | tourn-podium.png | 16:9 | PHOTO | Three teenage cadets in uniform on a podium receiving medals at an equestrian tournament, horses behind, golden light |
| journalReins | journal-reins.png | 16:9 | PHOTO | Extreme close-up of a young rider's gloved hands holding leather reins lightly, the horse's mane in soft focus |
| contactGate | contact-gate.png | 16:9 | PHOTO | A massive studded wooden gate of a Rajput fort at night, iron spikes, lanterns on either side, dust in the lamplight |

All images are AI placeholders and must be replaced with commissioned photography (Part 11.4) before launch.

---

## 9. Claims ledger (what we can stand behind)

| Claim | Status | Use on site | Source / note |
| --- | --- | --- | --- |
| Rathores expelled from Kannauj in 1193; selective breeding from the 12th century | Supported | Yes | Marwari horse literature (e.g. Wikipedia "Marwari horse", breed society histories) |
| Ears curve inward, tips touch, rotate 180° | Supported | Yes | Same |
| More than 50,000 Marwar cavalry under Akbar's suzerainty (late 16th c.) | Supported | Yes | Same (the source video says "Mongol empire"; it was the Mughal period) |
| Leaves the field only in victory, death or carrying its rider | Supported as belief | Yes, as belief | Same |
| Colour and whorl folklore (grey prized, black unlucky, devman, white not registered) | Supported | Yes | Same |
| Chetak at Haldighati, 1576 | Legend with a historical core | Yes, framed as told | Memorial near Haldighati |
| Bahadur's leap at Agra Fort | Legend | Yes, labelled legend; do not claim the rider escaped | Folklore |
| Marwar lancers under Sir Pratap Singh in WWI | Supported | Yes | Breed literature; do not claim Marwaris at Haifa or "last battle in 1917" |
| Post-1947 decline: horses sold, castrated, shot | Supported | Yes | Same |
| Marwari Bloodlines 1995; Indigenous Horse Society of India 1999 | Supported | Yes | Same (the source video says 1990; corrected) |
| Registration from 2009; breed not at risk today | Supported | Yes | Same |
| "Only 5,000 Marwaris remain" | Outdated | No | "A few thousand purebreds" was the 2001 figure; no current census |
| Horse's walk moves the rider's pelvis ~100 times a minute, like human gait | Supported | Yes, as "about a hundred" | American Hippotherapy Association; hippotherapy literature |
| Horse programmes lower children's stress hormones | Supported (one RCT) | Yes, with citation | Pendry, Smith & Roeter, *Human-Animal Interaction Bulletin*, 2014 (12-week programme, grades 5–8) |
| "40% cortisol reduction" | Not supported | No | No source found |
| "300+ muscles activated" | Not supported | No | Use "deep core, back and inner-thigh muscles" |
| "Permanently reverses tech-neck" | Overclaim | No | Use "trains an upright, stacked posture" |
| "Zero joint impact" | Overclaim | No | Use "low impact on knees and ankles" |
| "110 pelvic impulses per minute" | Approximate | Use "about a hundred" | See above |
| Tent pegging originated in the 3rd century BC in north-west India | Unverified | No | Use "an old cavalry skill" |
| 1,480 hours, 342 canter transitions, 0 major injuries | SAMPLE | Only with SAMPLE flag until real | Client to supply live figures |

---

## 10. Conflicts and open questions for the client

1. **Who funds the arena?** The Technical Directive says "100% BSAH-funded, zero CapEx"; the Master System Blueprint (7 Oct, final) says the school funds construction and receives 25–30%. **The site follows the Blueprint.** Confirm.
2. **Revenue share base.** The client's tier table computes the share on ₹9,440 (GST-inclusive). GST is not revenue, so the simulator uses ₹8,000. Confirm.
3. **Payback.** The directive quotes 6–8 months; the formula gives ~2.7 months for 150 cadets on a Standard Hub at full enrolment. Either enrolment ramp or costs are missing from the model. The simulator shows the formula and a ramp-up footnote until confirmed.
4. **Real schools.** DPS Hyderabad, Oakridge and HPS are used as written in the client docs. Confirm signed partnerships before launch, or the names must be replaced.
5. **Minimum age, batch size, pause policy, office hours** are SAMPLE.
6. **The black horse.** Marwar folklore calls a black horse unlucky; the brand is the Black Stallion. The site turns this into the vow ("We call it a vow"). Confirm the Chairman is comfortable.
7. **Chairman's letter** on `/about` is a draft in his voice; needs approval.
8. **Faculty names and photographs** are not provided; the site shows roles only.

---

## 11. Skills, tools and workflow

### 11.1 Claude Code setup (already in the repo)

- **Plugins** (`.claude/settings.json`): `frontend-design` (production-grade UI guidance, avoids generic AI styling) and `supabase` (schema, RLS, types, when the backend lands).
- **MCP servers** (`.mcp.json`): **Playwright** (screenshot every page at 390 and 1440 px; test reduced motion with `emulateMedia`), **Context7** (current Next.js 16 / motion / Tailwind 4 docs; read `node_modules/next/dist/docs/` first per `AGENTS.md`), **Figma** (optional, for design hand-off).
- **Project skill**: `.claude/skills/bsah-film-direction/SKILL.md` encodes Parts 2–4 (palette, type voices, reel grammar, archetype rules, motion and image rules) so every session builds in the same language. Invoke it before building or editing any page.
- **Higgsfield MCP** (connected in Cowork): image generation with the prompts in Part 8. Use `generate_image_batch` (≤12 per call), `jobs_wait`, then one `show_generation_by_ids`. Preflight with `get_cost`.

### 11.2 Getting images into the repo

Higgsfield's CDN is not reachable from the build sandbox. Run `sh scripts/fetch-media.sh` on the Mac to download everything into `public/media/`, then set `NEXT_PUBLIC_LOCAL_MEDIA=1` in `.env.local` so `next/image` optimises the local files (AVIF/WebP, responsive sizes). Until then the browser loads the CDN copies directly.

### 11.3 Optional 3D

`components/three/StallionViewer.tsx` loads `public/models/marwari.glb` (rigged, < 4 MB, Draco) when present; otherwise `/anatomy` and home §3 use the specimen photo. Lighting per `docs/reference/3d/threejs-lighting-and-viewport-spec.md`.

### 11.4 Before launch

Commission a two-day shoot (the Blueprint's student-media plan): 60 fps slow-motion hoof strikes, macro reins, buckles, lyre ears, cadets in uniform at each hub, the passport and seal. Replace every key in Part 8 one-for-one; filenames stay the same.

---

## 12. Build order and definition of done

1. Foundations: tokens, fonts, `SiteNav` + menu, `Footer`, `EndCard`, `TitleCard`, `FilmImage`, content modules, media manifest, redirects.
2. Home (15 sections).
3. Act I pages: `/legend`, `/anatomy`.
4. Act II pages: `/science`, `/why`, `/curriculum`, `/fleet`, `/cadets`, `/parents`, `/safety`.
5. Act III pages: `/schools` (+ hubs, MOU), `/verify` (+ record), `/tournaments` (+ events), `/command`, `/journal` (+ posts), `/contact`, `/about`.
6. QA loop until every item below passes.

**Done means:**

1. `npm run lint`, `npm run typecheck`, `npm run build` pass.
2. Every route screenshotted at 390 and 1440 px and reviewed; no horizontal scroll at 390.
3. Reduced motion: no pinning, zoom, parallax or horizontal travel; content complete.
4. Every interactive element reachable by keyboard with a visible focus ring; sliders and dials have arrow-key support and ARIA values.
5. No archetype used more than its allowance (Part 4); every section has exactly one signature moment.
6. All SAMPLE data flagged in code; no claim from the "No" rows of Part 9 appears anywhere.
7. `PROGRESS.md` updated.

---

## 13. Master prompt (copy-paste into Claude Code)

```text
You are building blackstallion.academy for The Black Stallion Academy of Horsemanship.
Read docs/BLUEPRINT.md fully, then AGENTS.md and the Next.js 16 docs in node_modules/next/dist/docs/.
Invoke the project skill bsah-film-direction before writing UI.

Goal: make a parent trust BSAH with their child and make a school board want a hub. Every section
expresses one of the six truths (Blueprint 1.3) and follows emotion with proof within one scroll.

Build the route named below exactly as specified in Blueprint Part 6: its title card archetype, its
sections in order with the listed archetype, signature moment, copy and image keys, and its end card.
Content goes in lib/content/<page>.ts, components in components/sections/<page>/, shared primitives in
components/{film,ui,motion,brand}. Server Components by default; "use client" only where motion or
state needs it. No new dependencies without asking. Typography: Kalnia inscription + war voice,
Newsreader story, Mona Sans labels, Martian Mono numbers. Colour tokens only. No cards or boxes on
photographs; gradients hold the text. Reduced motion must degrade to stacked frames with fades.

Never publish claims marked "No" in Blueprint Part 9. Flag SAMPLE data in code comments.

When done: lint, typecheck, build; screenshot the route at 390 and 1440 with Playwright and fix what
looks generic, crowded or repetitive; check keyboard focus and reduced motion; update PROGRESS.md.

Route to build: <route>
```

