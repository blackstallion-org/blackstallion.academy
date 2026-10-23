# Minimal Editorial Cleanup Plan

**Goal**: Transform the Black Stallion Academy website into a clean, minimal, editorial presentation matching the reference aesthetic. Images are the hero; text is quiet, compressed, and light; decorative widgets, heavy vignettes, and distracting motion effects are removed or reduced.

---

## Global Elements & Design System

| Element | Current Implementation | Action | Rationale / Resolution |
| :--- | :--- | :--- | :--- |
| **Film Grain** | Animated SVG turbulence overlay (`.grain::after`) | **REMOVE** | Shuts off grain across the entire viewport to keep photography sharp. |
| **Vignette Utility** | `.cinematic-vignette` radial gradient (up to 96% black) | **REMOVE** | Eliminates muddy dark perimeter frames around media. |
| **Shading Utility** | `.shade-b`, `.shade-l`, `.shade-r` (up to 50% opacity) | **REDUCE** | Cap maximum gradient opacity to 25% (`--shade-max: 0.25;`), preserving text contrast without darkening images. |
| **Photo Color Grading** | `--grade-film`, `--grade-deep`, `--grade-cold` CSS filters | **REMOVE** | Set filters to neutral `none` so photos retain their authentic natural tones. |
| **Image Fade-in** | `FilmImage` 1400ms ease duration | **REDUCE** | Replaced with snappy, clean fade under 250ms (`duration-200`). |
| **Image Parallax / Zoom** | Scroll-scrubbed scale (1.0 to 1.7x), GSAP 4.2x zoom | **REMOVE** | Disable image scaling and scrubbed zoom so photos stay crisp and unwarped. |
| **Decorative Clutter** | Floating badges, HUD frames, pin chips, corner marks | **REDUCE** | Wrapped in `.widget-hud` / `.widget-clutter` (`display: none;`) so they can be toggled back on if needed. |
| **Long Text Passages** | Multi-paragraph descriptions | **REDUCE** | Wrapped in accessible `<ExpandableText>` (1–2 lines by default + quiet "Read more" toggle). |

---

## Page-by-Page Audit & Action Plan

### 1. `/` (Homepage — The Trailer)
- **Hero & Reel Strips**:
  - Parallax zoom on hero stills: **REMOVE** (scale fixed to 1).
  - Heavy bottom gradient over stallion: **REDUCE** (capped at 25%).
  - StoryStrip zoom-forward effect: **REMOVE** (clean slide transition, under 250ms).
- **Matrix, Doors, Studbook, Verifier**:
  - Stat chips and corner marks: **REDUCE** (wrapped in `.widget-clutter`).
  - Text cards: **KEEP** functionality, lighten typography.

### 2. `/legend` (The Marwari History)
- **Title (`LegendTitle` / `IrisFrame`)**:
  - Iris circular mask and scale zoom: **REMOVE** (hero photo `duneSilhouette` displays full-bleed and sharp).
  - Heavy shadow overlays: **REDUCE** to subtle light bottom gradient.
- **Section II (`RouteMap`)**:
  - SVG route lines over map photo: **KEEP** essential map path; **REMOVE** heavy image dimming.
- **Section III (`Bred by Law`)**:
  - Floating numbered pins (1–6) over `legendSand`: **REDUCE** (hidden via `.widget-hud`).
- **Section IV (`EarsZoom`)**:
  - Scroll-scrubbed 1.7x zoom on ears: **REMOVE** (scale set to 1.0; photo remains static and sharp).
- **Section VII (`Roll of Honour`)**:
  - Image cards: **KEEP** full photography, clean border, subtle typography.
- **Section VIII (`Descent` / `Ascent`)**:
  - Timeline SVG and milestones: **KEEP** historical data, remove dark overlay on `legendFall`.
- **Section XI (`Every Cadet Rides One`)**:
  - Full-width hero photo: **KEEP** large full-bleed; **REDUCE** text overlay.

### 3. `/fleet` (The Studbook & Fleet)
- **Hero (`StallionPortalHero`)**:
  - Dual dark radial/linear vignette (`from-black/60 to-[#0F0E0D]/90`): **REMOVE**.
  - Interior canvas gradient (`rgba(23,21,19,0.75)`): **REMOVE**.
  - Background stallion video: **KEEP** sharp and clear.
  - Telemetry badges: **REDUCE** (hide with `.widget-hud`).
- **`StallionGallery` (Reel)**:
  - GSAP zoom: **REMOVE**; keep crisp transitions.
- **`Registry` & `CoatRegistry`**:
  - Interactive table, filters, microchip numbers: **KEEP** (editorial minimalism).
- **`CctvGrid`**:
  - Stall-cam feeds: **KEEP** clean without CRT blur or heavy overlays.

### 4. `/anatomy` (The Instrument)
- **Title (`AnatomyTitle`)**:
  - Full-width profile of Marwari stallion: **KEEP** clean and sharp.
  - Backdrop blur panel: **REDUCE** to clean, minimal catalogue tag.
- **Section I (`SpecimenPlate`)**:
  - Plate rulings and SVG leader line: **KEEP** core interactive points; **REMOVE** dark tint layer.
- **Section II (`ScaleBalance`)**:
  - Reins vs Stallion balance: **KEEP** minimal line diagram.
- **Section III (`EarDial`)**:
  - Interactive 360-degree ear compass: **KEEP** clean.
- **Section IIIb (`HorseEquipmentSection`)**:
  - 4-column swatch & hex layout: **KEEP** (already matches the reference aesthetic).
- **Section IV (`Breed Standard`)**:
  - Collapsible specification rows: **KEEP** clean typography.

### 5. `/cadets` (The Hall of Valour)
- **Title (`CadetsTitle`)**:
  - Heavy atmospheric vignette gradients (`from-black/85 via-transparent to-black/90` and radial vignette): **REMOVE**.
  - Flanking wordmark: **REDUCE** to lighter, refined editorial scale.
- **`CadetDrillShowcase` (`WebGLNoiseTransition`)**:
  - Dark gradient `from-black/95 via-black/35 to-black/60`: **REMOVE**.
  - Top HUD telemetry indicators: **REDUCE** (hidden via `.widget-hud`).
- **`Spotlights`**:
  - Cadet portraits: **KEEP** full aspect with quiet captioning.
- **`PassportObject` & `UniformSpec`**:
  - Interactive passport & uniform breakdown: **KEEP** functional, clean whitespace.

### 6. `/safety` (The Shield)
- **Title (`SafetyTitle`)**:
  - Heavy dark gradient (`from-black/80 via-black/20`): **REMOVE**.
  - Pin labels and chips on still life (`kitLabels`): **REDUCE** (hidden via `.widget-hud`).
- **`ShieldColumns` & `OrdersOfTheDay`**:
  - Clean three-column editorial layout: **KEEP**.
- **`HorseEquipmentSection`**:
  - 4-column tack & farrier layout: **KEEP**.

### 7. `/curriculum` (The Crucible)
- **Title (`CurriculumTitle` / `SpotlightRevealHero`)**:
  - Mouse-tracking spotlight/iris circle: **REMOVE** (displays the Lithos tree visual in full, unclipped clarity).
  - Headline: **KEEP** light serif editorial typography.
- **`Staircase` (Four Ranks)**:
  - Ranks progression tabs: **KEEP** minimal gold borders, remove muddy gradients.
- **Arena Roster & Timetable**:
  - Clean table layout: **KEEP**.

### 8. `/schools` (The Citadel Campus Network)
- **Title (`SchoolsTitle`)**:
  - Shadow overlays (`from-black via-black/40 to-black/60`): **REMOVE**.
  - Orbital telemetry HUD badges: **REDUCE** (hidden via `.widget-hud`).
  - Pan-India satellite flyover video: **KEEP** full screen, vivid and sharp.
- **`BlueprintPlan` & `CampusShowcase`**:
  - Campus photography and floorplans: **KEEP** unclouded.

### 9. `/lore` (The Traditional Lore of the Bards)
- **`GridScrollSection`**:
  - Muddy radial vignette (`from-transparent via-[#0d0c0a]/40 to-[#0d0c0a]/80`): **REMOVE**.
- **Folklore Plates (I–IV)**:
  - Large portraits (`kalaPortrait`, `legendGrey`, etc.): **KEEP** crisp and full-bleed.
  - Multi-paragraph folklore & institutional interpretation: **REDUCE** (wrapped in `<ExpandableText>`).

### 10. `/why` (The Sovereign Truth)
- **Title (`WhyTitle`)**:
  - Dual-layer 85% black linear vignette over illuminated doorway portal video: **REMOVE**.
  - Minimal headline: **KEEP** quiet and legible with max 25% bottom fade.

### 11. `/science` (The Biomechanics)
- **Title (`ScienceTitle`)**:
  - Mocap lines and telemetry labels ("AXIS 0.0°", "PELVIS ≈100/MIN", "STRIDE") drawn over the rider: **REDUCE** (hidden via `.widget-hud`).
  - Rider photograph: **KEEP** clean and unobstructed.
- **`RiderDiagram`**:
  - Interactive biomechanical systems: **KEEP** functional.

### 12. `/parents` (The Guardian)
- **Title (`ParentsTitle`)**:
  - Wooden rail sliding bar gradient and `shade-b`: **REDUCE** to clean photo.
  - Pinned phone app preview: **KEEP** clean mockup.

### 13. `/tournaments` (The Circuit)
- **Title (`CircuitTitle`)**:
  - Speed streaks raking across the charge photo: **REMOVE** (hidden via `.widget-hud`).
  - Photo `bgCharge`: **KEEP** pristine and full-bleed.
- **Standings & Race Lanes**:
  - Interactive tournament table: **KEEP** functional.

### 14. `/equipment` (Horse Shoes & Equipment)
- **4-Column Swatch & Hex Cards**:
  - **KEEP** exactly as built — already embodies the minimal reference mood.

---

## Restoration Reference Table

| Page | Element | What was removed / reduced | How to restore it |
| :--- | :--- | :--- | :--- |
| **Global** | Film Grain (`.grain::after`) | Removed continuous animated SVG noise texture overlay | Remove `display: none !important;` from `.grain::after` in `app/globals.css`. |
| **Global** | Vignette (`.cinematic-vignette`) | Removed radial gradient darkening photo edges up to 96% | Remove `display: none !important;` from `.cinematic-vignette` in `app/globals.css`. |
| **Global** | Shading Gradients (`--shade-max`) | Capped maximum overlay gradient opacity to 25% | Restore `--shade-max: 0.50;` in `app/globals.css`. |
| **Global** | Photo Grading Filters (`--grade-*`) | Removed artificial tint/saturate filters | Re-add `saturate(...) contrast(...)` in `app/globals.css`. |
| **Global** | `FilmImage` Fade Duration | Reduced fade duration from 1400ms to 200ms | Change `duration-200` back to `duration-[1400ms]` in `components/film/FilmImage.tsx`. |
| **Global** | Image Parallax / Scale | Constrained image scale to 1.0 (no distortion) | Pass `scale={scale}` prop back to `FilmImage` in specific scenes. |
| **`/`** | `StoryStrip` Zoom & Vignette | Removed 4.2x zoom-in and 85% dark vignette | Re-add GSAP zoom timeline and `from-black/85` in `StoryStrip.tsx`. |
| **`/`** | `Hero` Top Veil | Reduced veil gradient from 55% to 25% | Change `from-charcoal/25` to `from-charcoal/55` in `components/sections/home/Hero.tsx`. |
| **`/legend`** | `LegendTitle` (IrisFrame) | Removed scroll-scrubbed scale on `duneSilhouette` | Restore `scale={open ? 1 : scale}` in `LegendScenes.tsx`. |
| **`/legend`** | `EarsZoom` (EarsFrame) | Removed 1.7x scrub zoom distortion on ears | Restore `scale={scale}` and `y={y}` in `LegendScenes.tsx`. |
| **`/legend`** | Pin Number Badges | Hidden numbered pin tags on `legendSand` | Remove `.widget-hud` from pins in `app/legend/page.tsx`. |
| **`/fleet`** | `StallionPortalHero` | Removed heavy dual vignette (`from-black/60 to-[#0F0E0D]/90`) | Restore gradient class in `StallionPortalHero.tsx`. |
| **`/fleet`** | `StallionGallery` | Removed 4.2x zoom distortion from reel | Remove scale: 1 constraint in `CinematicStoryReel.tsx`. |
| **`/cadets`** | `CadetsTitle` | Removed heavy dark vignette (`from-black/85 to-black/90` + radial) | Restore vignette divs in `components/sections/cadets/CadetScenes.tsx`. |
| **`/cadets`** | `CadetDrillShowcase` | Removed 95% black overlay and hid top HUD frame | Remove `.widget-hud` and restore gradient in `WebGLNoiseTransition.tsx`. |
| **`/safety`** | `SafetyTitle` | Removed 80% black gradient and hid pin labels | Remove `.widget-hud` from `kitLabels` in `SafetyScenes.tsx`. |
| **`/curriculum`** | `CurriculumTitle` | Removed mouse-following iris spotlight mask and continuous zoom | Restore `maskStyle` and `hero-zoom` in `SpotlightRevealHero.tsx`. |
| **`/schools`** | `SchoolsTitle` | Removed black shadow overlays and hid telemetry badge | Remove `.widget-hud` from telemetry in `SchoolScenes.tsx`. |
| **`/why`** | `WhyTitle` | Removed 85% dual-layer linear vignette over doorway portal video | Restore dual-layer gradient in `WhyScenes.tsx`. |
| **`/science`** | `ScienceTitle` | Hid motion-capture line diagram over rider | Remove `.widget-hud` from SVG in `ScienceScenes.tsx`. |
| **`/parents`** | `ParentsTitle` | Hid wooden rail gradient bars over bottom photo frame | Remove `.widget-hud` from rail in `ParentScenes.tsx`. |
| **`/tournaments`**| `CircuitTitle` | Hid speed streak animations across charge photo | Remove `.widget-hud` from speed streaks in `TournamentScenes.tsx`. |
| **`/lore`** | `GridScrollSection` | Removed muddy radial vignette overlay | Restore radial gradient class in `GridScrollSection.tsx`. |
| **`/lore`** | Folklore Plate Descriptions | Collapsed long multi-paragraph folklore with `ExpandableText` | Remove `<ExpandableText>` in `app/lore/page.tsx`. |
| **`/journal`** | `FieldSphereHero` (`.fsh-vig`) | Removed atmospheric radial vignette | Remove `display: none !important;` from `.fsh-vig` in `app/globals.css`. |

