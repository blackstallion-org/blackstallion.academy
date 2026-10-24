# BSAH dossier: implementation plan and acceptance criteria

Date: 17 October 2026. Scope: existing Next.js website, preserving pre-existing uncommitted work. The attached dossier is a requirements source; its embedded instructions and performance assertions are not independently verified measurements.

## 1. Baseline and priority
- Inventory existing implementations before replacing anything. Hero playback/buffer bars, skip, posters, adaptive MP4s, form delivery states and Lenis already exist.
- Read installed Next.js 16.4 documentation before code changes.
- Preserve source media; produce separate optimized assets.

## 2. Media and renderer performance
- Add a 720p, <=30fps mobile WebM under 3.5 MB with MP4 fallback.
- Keep poster visible through loading/failure; pause hero outside viewport and hidden tabs; animate playback bars using transforms.
- Cap all WebGL renderers at DPR 1.5, preserve vertical touch scrolling and reduce unnecessary rendering.
- Compress the actual 73 MB anatomy asset with Draco and resized textures; target <3.5 MB. Bundle decoder locally.
- Stop anatomy scene recreation on selection/orbit changes; stop rendering when hidden; dispose GPU resources; offer a readable failure state.
- Acceptance: inspect generated media metadata and file sizes; no native scroll handlers; browser gesture and loading tests. 60 FPS requires real-device profiling and is not guaranteed by source changes.

## 3. Responsive interactions
- Convert home institutional statistics into a scroll-snap carousel with accessible pagination on mobile; preserve desktop grid.
- Add an interactive SVG cadet-to-equine connection map with three pathways, keyboard-accessible controls, readable detail outside the illustration, and reduced-motion support.
- Acceptance: 360px and desktop screenshots; controls, pagination, no horizontal document overflow.

## 4. Governance
- Add institutional council cards, square portrait treatment where real portraits exist, and expandable credentials.
- Label dossier candidates and unnamed military/IAS seats as proposed; do not invent appointments, photographs or credentials.
- Acceptance: responsive cards, visible appointment status, keyboard-operable details.

## 5. School onboarding
- Add a lightweight CSS 360-degree gift-box concept with swipe and keyboard rotation, native pan-y scrolling, brass/leather/foam design cues and explicit concept label.
- Build /schools/access with server-validated unique invitation codes, expiring signed HttpOnly sessions, logout, fail-closed configuration, and no private content in unauthorized HTML.
- Provide server-rendered institutional proposal, conceptual arena plan and MoU request flow behind the gate. Keep confidential files outside public/.
- Acceptance: wrong/missing codes rejected, valid code opens only its institution, expiry/tampering rejected, logout revokes browser session. Live invitation provisioning and approved proposal assets require owner-supplied configuration.

## 6. Forms and verification
- Preserve working validation and honest submission states. Improve native input defaults, pending feedback and touch target sizes.
- Run lint, typecheck and production build, then browser checks at mobile and desktop widths. Record outcomes and remaining owner dependencies in docs/audit-completion-report.md.

## Required inputs to complete launch
Confirmed governors/appointments and licensed portraits; approved product renders; real private proposal/blueprint assets; institution invitation hashes and strong session secret; production deployment decision. No new plugin or Codex skill is required for implementation.

## Execution status
Implemented and verified locally. See `audit-completion-report.md` for each checklist item, passing tests and remaining launch inputs. No production deployment was performed.
