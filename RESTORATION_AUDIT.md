# BSAH — Pre-Refinement Restoration Audit & Forensic Manifest
**Status**: Investigation Complete · Gate 1 Approval Required  
**Author**: Antigravity Recovery Engineer & Production Deployment Auditor  
**Date**: October 21, 2026  
**Target Repository**: `/Users/stingraj/blackstallion-website`  
**Live Production URL**: [https://blackstallion-website.vercel.app](https://blackstallion-website.vercel.app)  

---

## 1. Executive Summary & Forensic Rollback Mission

The objective of this mission is to restore the BSAH website to the exact state of the most recent successful Vercel production deployment that existed immediately prior to the unwanted **14-phase "Master UI Refinement & Motion Implementation"** task.

### Key Forensic Findings
1. **Target Production Deployment Identified**:
   - **Deployment ID**: `dpl_AMtcLNzmhUtYuao7378M441gDdjK`
   - **Deployment URL**: `https://blackstallion-website-5q7pzdkuz-stingraj.vercel.app`
   - **Production Aliases**: `https://blackstallion-website.vercel.app`, `https://blackstallion-website-stingraj.vercel.app`
   - **Build Completed Timestamp**: `Tue Oct 20 2026 00:17:48 GMT+0530`
   - **Status**: Ready (Hobby team `stingrajtech-2929`)
   - **Deployment Integrity**: No Vercel deployments have been triggered since Oct 20 00:18 IST. The live production website currently runs this exact baseline.
2. **Unwanted Refinement Session Timing**:
   - Began in conversation transcript at **Line 1969 / Step 1971** on **Wed Oct 21 00:56:04 IST** (over 24 hours after production deployment).
   - Generated report `# BSAH Master UI Refinement & Motion Implementation Report` at Step 2202 (Oct 21 02:20:25 IST).
   - Subsequent rogue experiments (steps 2203–2945) injected Osmo parallax, Three.js shaders (`ScrollDistortionImage`), bezier curtain reveals (`LiquidCurtainReveal`), full-viewport observer stages (`ObserverStoryStage`), burning paper overlays (`ParchmentBurnOverlay`), and Thar odyssey parallax (`TharOdysseyParallax`, `/odyssey`).
3. **Current Local Working State**:
   - Git HEAD: `293042e` ("before minimal cleanup", Oct 14 14:02 IST).
   - Working tree contains legitimate pre-deployment enhancements (committed/uncommitted between Oct 14–20 that shipped in deployment `5q7pzdkuz`) mixed with uncommitted Category A refinement artifacts.
   - External timestamped backup was created before any inspection or modification.

---

## 2. Phase 1 — State Preservation & External Backup

An external backup was created outside the project tree:
- **Backup Location**: `/Users/stingraj/bsah-recovery-backup-20261021-1315/`
- **Recorded Git Diagnostic Records**:
  - `git_status.txt` & `git_status_short.txt`
  - `git_log_20.txt` & `git_reflog_30.txt`
  - `git_remote.txt`
  - `git_diff_stat.txt` & `git_diff_cached_stat.txt`
  - `full_working_tree.patch` (uncommitted patch against HEAD)
- **Snapshot Archive**:
  - `tree_snapshot/source_and_configs.tar.gz` (30MB tarball containing all application sources, components, libraries, styles, and configurations, strictly excluding regenerable `node_modules`, `.next`, and heavy binary assets).
- **Zero Destructive Actions**: No `git reset --hard`, `git clean -fd`, or force pushes were executed.

---

## 3. Phase 2 — Verified Vercel Production Baseline

```
Project:        blackstallion-website
Deployment ID:  dpl_AMtcLNzmhUtYuao7378M441gDdjK
Unique Host:    blackstallion-website-5q7pzdkuz-stingraj.vercel.app
Target:         production
Created At:     2026-10-19T18:47:48.620Z (Tue Oct 20 2026 00:17:48 GMT+0530)
Aliases:        https://blackstallion-website.vercel.app
                https://blackstallion-website-stingraj.vercel.app
Status:         ● Ready
Build Time:     40s
Preceding:      dpl_Gi8JGqKiDJPDG6kDJ1i7ZDvGPvBH (Mon Oct 19 23:29:00 IST)
```

**Verification Details**:
- Live route inspection confirmed the presence of `CitadelConfigurator` on `/schools`, the 4-card cavalry grid on `/equipment`, the sealed code verifier on `/verify`, and the 12-section layout on `/curriculum`.
- The live build does **NOT** contain `/odyssey`, `ScrollDistortionImage`, `ObserverStoryStage`, or Osmo parallax layering.

---

## 4. Phase 3 & 4 — Forensic Audit of the Last Agent Session

Auditing transcript `/Users/stingraj/.gemini/antigravity-ide/brain/4bfe634b-b679-4fd2-98b7-3b995881d6c0/.system_generated/logs/transcript.jsonl`:
- **Line 1969 (Step 1971)**: Agent started the 14-phase refinement task in response to a prompt requesting universal parallax and minimal branding.
- **Lines 1970–2200**: Agent modified `editorial.css` (step 2063), `SiteParallax.tsx` (step 2067), `SiteNav.tsx` (step 2071), `Loader.tsx` (step 2077), and created `scripts/verify-bsah-master.mjs` (step 2087).
- **Lines 2201–2645**: Agent created `ScrollDistortionImage.tsx`, `LiquidCurtainReveal.tsx`, `ObserverStoryStage.tsx`, `ParchmentBurnOverlay.tsx`, `TharOdysseyParallax.tsx`, `scripts/verify-story-animations.mjs`, and `app/odyssey/page.tsx`.
- **Line 2629**: An intermediate agent partially reverted several tracked files back to commit `293042e` (`app/legend/page.tsx`, `app/page.tsx`, `app/journal/page.tsx`, `app/lore/page.tsx`, `HorseEquipmentSection.tsx`, `VerifyScenes.tsx`, `app/verify/page.tsx`, `SiteNav.tsx`, `Loader.tsx`, `HomeConvert.tsx`).
- **Lines 2766–2945**: A subsequent session modified `app/editorial.css` (.bond-visual sizing) and repeatedly modified `components/3d/HorseHandBond.tsx` (steps 2770, 2915, 2930, 2945) trying to perform mesh slicing and screen edge fitting.

---

## 5. Restoration Manifest Table

| File | Deployed Baseline (`5q7pzdkuz`) | Current State | Unwanted Refinement Changes | Proposed Action | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `components/motion/SiteParallax.tsx` | Standard smooth GSAP parallax without Osmo multi-depth scraping | Injected with Osmo `[data-parallax-layers]` scrubbed hooks and universal selector loops | Scrubbed Osmo layer logic injected at step 2067 | **Restore selectively** to pre-refinement 97-line baseline (captured at step 2053) | **Category A** |
| `app/editorial.css` | 71 lines of typography, layout spacing, and editorial styling | Appended with Osmo `.parallax`, `.parallax__layers`, `.parallax__layer-img`, and altered `.bond-visual` | Osmo parallax classes (step 2063) and expanded bond visual rules (step 2766) | **Restore selectively** to pre-refinement 71-line baseline (captured at step 2050) | **Category A** |
| `components/3d/HorseHandBond.tsx` | 149 lines of balanced 3D horse-and-hand touch composition | 358 lines with mesh splitting, custom bounding box recalculation, and edge-touch offsets | Experimental mesh partitioning and repositioning from steps 2770 & 2915-2945 | **Restore selectively** to pre-refinement 149-line baseline (captured at steps 2743-2745) | **Category A** |
| `components/motion/ScrollDistortionImage.tsx` | Does not exist in baseline | Created in working directory (untracked) | WebGL shader velocity distortion experiment created at step 2233 | **Delete file** | **Category A** |
| `components/motion/LiquidCurtainReveal.tsx` | Does not exist in baseline | Created in working directory (untracked) | Organic bezier overlay experiment created at step 2235 | **Delete file** | **Category A** |
| `components/sections/shared/ObserverStoryStage.tsx` | Does not exist in baseline | Created in working directory (untracked) | Counter-translating narrative experiment created at step 2237 | **Delete file** | **Category A** |
| `components/motion/ParchmentBurnOverlay.tsx` | Does not exist in baseline | Created in working directory (untracked) | fBm noise burning paper shader created at step 2239 | **Delete file** | **Category A** |
| `components/sections/legend/TharOdysseyParallax.tsx` | Does not exist in baseline | Created in working directory (untracked) | Multi-plane landscape experiment created at step 2241 | **Delete file** | **Category A** |
| `app/odyssey/page.tsx` | Does not exist in baseline | Created in working directory (untracked) | Spinoff test route created at step 2643 | **Delete file** | **Category A** |
| `scripts/verify-bsah-master.mjs` | Does not exist in baseline | Created in working directory (untracked) | 14-phase refinement Playwright test script created at step 2087 | **Delete file** | **Category A** |
| `scripts/verify-story-animations.mjs` | Does not exist in baseline | Created in working directory (untracked) | Story animations Playwright test script created at step 2310 | **Delete file** | **Category A** |
| `scratch/capture_curriculum_final.js` & refinement scratch PNGs | Temporary scratch files | 100+ scratch test outputs in `scratch/` | Refinement screenshots and test scripts | **Delete refinement scratch artifacts** | **Category A** |
| `components/site/SiteNav.tsx` | Fixed header `z-[60]`, `h-16`/`h-20`, reel counter, mobile menu | Identical to baseline commit `293042e` | 0 diff against HEAD; step 2071 edits were already undone in step 2629 | **Preserve as-is** | **Category B** |
| `components/motion/Loader.tsx` | 103 lines, ear animation, session storage gate, reduced motion support | Identical to baseline commit `293042e` | 0 diff against HEAD; step 2077 edits were already undone in step 2629 | **Preserve as-is** | **Category B** |
| `components/sections/curriculum/BondHero.tsx` | 92 lines, Three.js Canvas container for HorseHandBond | Untracked on disk; created Oct 19 before refinement | Legit pre-existing component referenced by deployed `CurriculumScenes.tsx` | **Preserve file** | **Category B** |
| `components/sections/curriculum/CurriculumScenes.tsx` | 288 lines, incorporates `CurriculumTitle` with `BondHero`, `Staircase`, `CurriculumPhaseReel`, `CodexVault` | Tracked with pre-deployment enhancements | Shipped in deployment `5q7pzdkuz` | **Preserve as-is** | **Category B** |
| `components/sections/statue/CinematicStatueScroll.tsx` | 656 lines, monument 3D scroll experience | Untracked on disk; created Oct 19 | Only viewed in refinement session, never modified | **Preserve file** | **Category B** |
| `components/sections/equipment/HorseEquipmentSection.tsx` | 4-card sovereign armoury grid | Identical to baseline commit `293042e` | 0 diff against HEAD; restored in step 2629 | **Preserve as-is** | **Category B** |
| `components/sections/schools/CitadelConfigurator.tsx` | 486 lines, school partnership tier configurator | Untracked on disk; created Oct 19 | Shipped in deployment `5q7pzdkuz`; only viewed in refinement session | **Preserve file** | **Category B** |
| `components/sections/schools/SovereignCouncil.tsx` | 316 lines, sovereign council scene | Untracked on disk; created Oct 19 | Shipped in deployment `5q7pzdkuz`; only viewed in refinement session | **Preserve file** | **Category B** |
| `components/sections/schools/India3DMap.tsx` | 3D interactive India map for schools hub | Untracked on disk; created Oct 19 | Shipped in deployment `5q7pzdkuz` | **Preserve file** | **Category B** |
| `components/sections/verify/VerifyScenes.tsx` | Brass seal verification flow & timeline | Identical to baseline commit `293042e` | 0 diff against HEAD; restored in step 2629 | **Preserve as-is** | **Category B** |
| `app/verify/page.tsx` | Sealed verification landing page | Identical to baseline commit `293042e` | 0 diff against HEAD; restored in step 2629 | **Preserve as-is** | **Category B** |
| `app/page.tsx`, `app/legend/page.tsx`, `app/journal/page.tsx`, `app/lore/page.tsx` | Baseline route pages | Identical to baseline commit `293042e` | 0 diff against HEAD; temporary experiment imports were removed in step 2629 | **Preserve as-is** | **Category B** |
| `app/globals.css` | Complete design system tokens, fonts (Cinzel, Cormorant, Playfair, Inter), tone scopes | Has 878 additions against commit `293042e` from Oct 14–19 pre-deployment work | Zero modifications made during 14-phase refinement session | **Preserve as-is** | **Category B** |
| `next.config.mjs` | Config with image formats, CloudFront CDN remote patterns, redirects | Matches deployed configuration | Shipped in deployment `5q7pzdkuz` | **Preserve as-is** | **Category B** |
| `package.json` & `package-lock.json` | Includes `@react-three/drei` and `@react-three/fiber` | Matches deployed configuration | Needed by 3D baseline scenes (`India3DMap`, `HorseHandBond`, `CinematicStatueScroll`) | **Preserve as-is** | **Category B** |
| `app/actions.ts` | Server action with Zod schemas for parents, schools, and MOU forms | Matches deployed configuration | Pre-deployment production functionality | **Preserve as-is** | **Category B** |

---

## 6. Categorization Summary

### Category A: Confirmed Unwanted Refinements & Experiments (To be reversed/deleted upon approval)
1. `components/motion/SiteParallax.tsx`: Revert injected Osmo layer scrubbing to 97-line baseline.
2. `app/editorial.css`: Revert injected Osmo classes and modified bond sizing to 71-line baseline.
3. `components/3d/HorseHandBond.tsx`: Revert mesh splitting and positioning to 149-line baseline.
4. `components/motion/ScrollDistortionImage.tsx`: Delete file.
5. `components/motion/LiquidCurtainReveal.tsx`: Delete file.
6. `components/sections/shared/ObserverStoryStage.tsx`: Delete file.
7. `components/motion/ParchmentBurnOverlay.tsx`: Delete file.
8. `components/sections/legend/TharOdysseyParallax.tsx`: Delete file.
9. `app/odyssey/page.tsx`: Delete file.
10. `scripts/verify-bsah-master.mjs`: Delete file.
11. `scripts/verify-story-animations.mjs`: Delete file.
12. Scratch refinement artifacts (`scratch/capture_curriculum_final.js`, `scratch/master_verification/`, `scratch/story_animations_verification/`).

### Category B: Confirmed Legitimate Pre-Existing Baseline Work (MUST BE PRESERVED)
- Fixed Navigation & Brand Header (`components/site/SiteNav.tsx`)
- Official First-Visit Monogram Loader (`components/motion/Loader.tsx`)
- Schools Citadel Configurator & Sovereign Council (`CitadelConfigurator.tsx`, `SovereignCouncil.tsx`, `India3DMap.tsx`)
- Equipment Sovereign Armoury Grid (`components/sections/equipment/HorseEquipmentSection.tsx`)
- Sealed Credential Verifier (`components/sections/verify/VerifyScenes.tsx`, `app/verify/page.tsx`)
- Monument Scroll Scene (`components/sections/statue/CinematicStatueScroll.tsx`)
- Curriculum Scene Structure (`components/sections/curriculum/CurriculumScenes.tsx`, `BondHero.tsx`)
- Design System Styling & Tokens (`app/globals.css`)
- Production App Configuration & Server Actions (`next.config.mjs`, `package.json`, `app/actions.ts`)

### Category C: Uncertain Ownership or Timing (Flagged for Review)
- **None**. Every file modification has been cross-referenced against the Vercel production deployment `5q7pzdkuz` (Oct 20 00:17 IST) and the transcript log timeline (Oct 21 00:56–11:30 IST). Ownership and timing are 100% verified.

---

## 7. Next Steps (Pending Approval of Gate 1)

Upon receiving your approval:
1. **Gate 2 Execution**:
   - Surgically restore the three modified files (`SiteParallax.tsx`, `editorial.css`, `HorseHandBond.tsx`) to their exact pre-refinement baseline.
   - Delete the 8 unwanted experiment and test files.
   - Run type checking: `npx tsc --noEmit`.
   - Run production build: `npm run build`.
   - Execute Playwright cross-viewport visual verification (Desktop 1440×900, Mobile 390×844) comparing the local build against the live baseline.
2. **Gate 3 Final Verification**:
   - Generate `BSAH_RESTORATION_REPORT.md`.
   - Present final git diff and visual comparison screenshots for your sign-off before committing or pushing anything.
