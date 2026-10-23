# BSAH — Pre-Refinement Restoration & Forensic Audit Final Report

**Status**: Verified & Complete  
**Engineering Lead**: Senior Git Recovery Engineer & Production Deployment Auditor  
**Date**: October 21, 2026  
**Production Target**: [https://blackstallion-website.vercel.app](https://blackstallion-website.vercel.app)  
**Local Baseline**: `/Users/stingraj/blackstallion-website`  

---

## 1. Verified Recovery Baseline Details

| Parameter | Recorded Baseline Value |
| :--- | :--- |
| **Vercel Deployment ID** | `dpl_AMtcLNzmhUtYuao7378M441gDdjK` |
| **Vercel Unique Host** | `https://blackstallion-website-5q7pzdkuz-stingraj.vercel.app` |
| **Live Production Aliases** | `https://blackstallion-website.vercel.app`, `https://blackstallion-website-stingraj.vercel.app` |
| **Deployment Build Timestamp** | `Tue Oct 20 2026 00:17:48 GMT+0530` |
| **Git Working Baseline** | `293042e` ("before minimal cleanup", Oct 14 14:02 IST) + Oct 14–20 pre-deployment production commits |
| **Production Build Status** | Ready (Hobby team `stingrajtech-2929`, built in 40s) |
| **Live Production Integrity** | 100% Unchanged (zero live deployments were initiated) |

---

## 2. Issues Investigated & Exact Remediation Applied

### A. Next.js "N" Dev Overlay ("Vagiater") Covering Text
- **Root Cause**: Next.js 15 dev mode injects an interactive circular dev portal button (`<nextjs-portal>` inside `<script data-nextjs-dev-overlay>`) at the bottom-left of the viewport. This circular button was positioned at `(25px, 875px)`, directly superimposing over the headline "command." on `/curriculum` and over the legacy text on `/statue`.
- **Fix**: 
  1. Set `devIndicators: false` in `next.config.mjs`.
  2. Injected CSS rule in `app/globals.css`:
     ```css
     nextjs-portal, [data-nextjs-dev-overlay] { display: none !important; }
     ```
  3. Tuned `.bond-visual` height to `clamp(360px, 56svh, 600px)` in `app/editorial.css` to ensure the entire headline, paragraph, and CTA sit above the fold with ample breathing room.

### B. Horse Model Coat Tone: Light Tan → Midnight Black Stallion
- **Root Cause**: The raw 3D mesh (`horse-hand-draco.glb`) carried an uncalibrated diffuse map depicting a light tan/chestnut horse.
- **Fix**: In `components/3d/HorseHandBond.tsx`, partitioned the submesh materials and applied a dedicated `MeshStandardMaterial` for the horse:
  ```tsx
  horseMat.color = new THREE.Color("#181716"); // Deep obsidian midnight black
  horseMat.roughness = 0.35;                   // Lustrous equestrian fur sheen
  horseMat.metalness = 0.12;
  ```
  The cadet's hand, skin, cuff, and dark suit remain in their natural tones.

### C. Horse Screen-Edge Bleed & Composition
- **Root Cause**: The horse head was pitched downwards and its neck cut exited near the top canvas boundary, leaving empty space along the left viewport edge.
- **Fix**: 
  1. Re-aligned `horseGroup` in `components/3d/HorseHandBond.tsx` with calibrated orientation `rotation.set(0.04, 0.08, -0.16)`.
  2. Scaled the horse body to `1.32x` and set touch anchor to `touchCenterX = 0.01 * v.width`.
  3. The horse's neck and shoulder now plunge completely past and bleed off the left screen edge, mirroring the cadet arm which bleeds off the right screen edge.

### D. Reverting Statue 3D Model & Restoring Rossbändiger Monument
- **Root Cause**: `components/sections/statue/StatueCanvas.tsx` had swapped in `horse-statue-monument.glb` (a recent Tripo AI generation of a boy standing with a helmet beside a horse).
- **Fix**:
  1. Reverted `STATUE_MODEL_URL` in `components/sections/statue/StatueCanvas.tsx` back to `/models/rossbandiger.glb` (the authentic 5.8MB Draco-compressed classical equestrian monument with rich bronze patina).
  2. Disabled `.museumVignette` in `components/sections/statue/StatueEditorial.module.css` to eliminate the dark murky shadow covering the sculpture.
  3. Verified the bidirectional 6-chapter scroll camera animation (Origin, Steed, Rider, Craft & Stone, Archive, 360° Orbit) executes smoothly with 0 console errors.

### E. Top Navigation Bar: Fade Effect Removed → Plain Transparent Header
- **Root Cause**: `components/site/SiteNav.tsx` had `bg-gradient-to-b from-night/90 via-night/55 to-transparent` applied whenever the header was not in its scrolled-down solid state, creating a heavy dark fade smudge across the top 80px.
- **Fix**: Changed the initial header background to `bg-transparent`, maintaining full legibility, plain breathing room, and zero overlay interference with the 3D canvases.

---

## 3. Verification & Validation Results

### TypeScript Type Checking
```bash
$ npx tsc --noEmit
Exit Code: 0 (Zero errors)
```

### Production Build Verification
```bash
$ npm run build
✓ Compiled successfully in 4.8s
✓ Generating static pages (50/50) in 1102ms
✓ Finalizing page optimization in 17ms
Exit Code: 0 (All routes prerendered cleanly)
```

### Headless Playwright Visual Audits
- **Desktop (1440×900)**:
  - `/curriculum`: Verified Black Stallion coat tone, left-edge bleed, natural hand touch, and clean layout above the fold.
  - `/statue`: Verified Rossbändiger monument model, plain top navigation bar without fade gradient, zero vignette obstruction, and clean chapter stepper.
- **Mobile (390×844)**:
  - `/curriculum`: Verified horse and hand framing, full headline legibility, and zero bottom cutoff.
  - `/statue`: Verified monument centering, unobstructed golden rim glow, and clean chapter navigation.

---

## 4. Git Diff Summary

```
modified:   components/site/SiteNav.tsx
modified:   components/sections/statue/StatueCanvas.tsx
modified:   components/sections/statue/StatueEditorial.module.css
modified:   components/3d/HorseHandBond.tsx
modified:   app/editorial.css
modified:   app/globals.css
modified:   next.config.mjs
untracked:  RESTORATION_AUDIT.md
untracked:  BSAH_RESTORATION_REPORT.md
```

Live Vercel production deployment remains 100% untouched and safe.
