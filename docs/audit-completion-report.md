# BSAH audit implementation feedback

17 October 2026. Changes implemented in the local Next.js repository; not published to the production website. Existing uncommitted changes were preserved. Scope comes from the supplied four-page dossier; claimed original FPS/lag was not treated as a verified benchmark.

## Changes against the dossier

| Item | Result | Implementation and remaining input |
| --- | --- | --- |
| Hero progress and skip | Complete | Existing playback/buffer bars retained, changed to transform-based fills. Skip Intro integrates with Lenis and reaches doctrine immediately. |
| Posters and adaptive media | Complete | Existing posters and adaptive MP4s retained; added 720p/30fps VP9 WebM at 3,016,634 bytes (3.02 MB). The supplied film's 2.7-second black leader is skipped. Hero pauses outside the viewport and in hidden tabs. |
| WebGL DPR | Complete | All discovered renderer caps, including the fleet effect and React Three Fiber statue, are capped at 1.5. |
| Horse asset compression | Complete | Original preserved. Draco plus geometry simplification and 1024px WebP textures: 76.34 MB to 2.54 MB, approximately 97% smaller. Local Draco decoder and license bundled. Statue also reduced from 33.25 MB to 3.02 MB. |
| Mobile touch | Complete for tested anatomy viewer | Native vertical pan preserved, canceled gestures cleared. Browser-emulated touch swipe moves the page through the viewer. Global canvas rule and statue wrappers preserve pan-y. |
| Anatomy lifecycle and lighting | Complete | Scene no longer rebuilds on hotspot or orbit changes; near-viewport loading; no draw calls while hidden/offscreen; GPU resource cleanup; reduced-motion orbit behavior; warm key/fill/rim studio lights, procedural environment reflections, baked contact shadow, error text and 2D alternative. Initial overview and reset framing corrected. Desktop point controls and panel layout repaired. |
| Mobile institutional statistics | Complete | Native scroll-snap carousel with IntersectionObserver pagination and 44px pagination controls; desktop grid retained. |
| Somatic connections | Complete | Interactive SVG cervical/core/lumbar connections to ears/withers/rein contact, pulse pathways and readable detail outside the image. Keyboard-operable controls and reduced-motion support. This is instructional riding copy, not a medical treatment claim. |
| Sovereign council | Structure complete; appointments pending | Four responsive institutional cards with square placeholders and expandable status. Dossier names shown as proposed, not confirmed appointments. No invented portraits or credentials. Requires approved biographies, licensed portraits and appointment confirmation. |
| Trojan showcase | Concept complete; final product pending | Lightweight CSS 360-degree box rotation, native pan-y pointer gestures, keyboard-accessible slider, brass seal/leather/copper cues and contents explanation. Clearly labeled concept; no supplied physical product model or photography. |
| Trustee gateway | Implemented; production provisioning pending | `/schools/access`, per-institution hashed invitations, expiring signed HttpOnly sessions, authorization before rendering private proposal, sign-out and fail-closed configuration. Includes discussion proposal, plan/spatial-view concept and MoU enquiry. Real invitations, secret, approved documents, final 3D engineering assets and hosting edge rate limits remain launch inputs. |
| Scroll pipeline | Existing solution retained | Lenis already installed. No raw native scroll event listeners found in app/components/lib. Existing Motion/GSAP observers retained; broad permanent will-change layers avoided. |
| Forms | Complete for shared lead forms | Existing native tel/email types, server validation and honest delivery states retained. Added automatic autocomplete defaults, email input mode, aria-busy and visible sending spinner. Phone keyboard preserves international + input rather than digits-only restrictions. |

## Verification performed

- Final production build passed; route list includes the protected access page. Browser checks were repeated against the production server, with the same passing results.
- TypeScript passed.
- ESLint passed with no errors; four pre-existing unused-variable/import warnings remain in CadetScenes, HomeClose, TorchHorseStage and VerifyScenes.
- Security test passed: valid/invalid codes, signed token tampering, expired session, expired invitation, removed invitation and unavailable configuration.
- Chromium mobile browser checks at 360px and 390px; desktop checks at 1440px. No script errors in the tested flows.
- Home and schools document widths fit the mobile viewport. Skip positions doctrine at the top; carousel pagination updates; somatic detail changes; council disclosures open; box rotates through slider.
- Unauthorized access does not include proposal content. Wrong codes show an error, valid codes reveal the matching institution, and sign-out returns to the locked form. Production test cookie was HttpOnly and SameSite=Strict with the scoped path; Secure is enabled in production.
- Anatomy model requested once before and after orbit/reset controls. At simulated device DPR 3, drawing buffer / CSS width = 1.5. Vertical touch swipe scrolls the page. No document overflow or script errors.
- Screenshots and machine-readable observations are in `scratch/audit/`.
- Media metadata verified: mobile WebM is 1284×720, 30 fps, 3.02 MB. Existing desktop MP4 is approximately 8.1 MB; existing mobile MP4 approximately 3.15 MB.

## Practical limits and next launch inputs

These checks establish functional and asset improvements, not a measured 60 FPS guarantee. Physical iOS/Android profiling under mobile network and CPU/GPU constraints is still needed. Other pre-existing page animations and media were not exhaustively benchmarked.

The supplied video is landscape footage with embedded titles; portrait object-cover cropping remains part of the existing presentation. A separately edited portrait master would improve its composition.

The council and product viewer are honest pending-approval presentations. The private arena drawing is an illustrative plan with a spatial view, not a surveyed 3D engineering deliverable. MoU submission requests a discussion; it does not reserve an appointment. Production form delivery was not exercised with real contact data.

Set up real trustee credentials and approved private assets using `docs/trustee-access-setup.md`, confirm biographies/product material, run real-device performance tests, and then publish through the normal deployment process. No additional Codex skills or plugins were required, and no new application dependency was added; media optimization used a temporary CLI from the npm cache.
