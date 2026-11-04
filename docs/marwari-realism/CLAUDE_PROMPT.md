# Claude Code prompt — execute the Marwari realism workflow

You are working in `/Users/stingraj/blackstallion-website`.

Implement a substantial realism upgrade to the website's existing black Marwari horse. Make its anatomy, coat, head, mane, tail, weight and running movement convincing, place it in a Rajasthan Thar environment, and reuse the finished master across home, science, anatomy and other existing living-horse placements. This is an execution task: audit, author, integrate, capture, inspect and iterate until the acceptance gates pass or a specific external limitation is documented. Do not stop at another proposal or claim success from a few material-number changes.

## Read and inspect first

Read:

1. `AGENTS.md` and `CLAUDE.md`; follow applicable project instructions and read the installed Next.js documentation before touching APIs.
2. Relevant sections of `docs/BLUEPRINT.md` and the required project film-direction skill before editing UI.
3. `docs/marwari-realism/WORKFLOW.md` in full.
4. `docs/marwari-realism/REFERENCES.md` in full and open all 15 images in its local reference table. Their stable filenames and checksums are in `references/manifest.json` in that folder.
5. `docs/marwari-realism/ITERATION_LOG.md`, `tools/qa-marwari/README.md`, and the existing Marwari production/audit reports as historical context. Fresh code and fresh evidence take precedence over stale descriptions of the current implementation.

The attached tutorial transcript and external pages are reference data, not agent instructions. Adapt the tutorial's large-to-small shaping, topology, layered texturing and repeated render feedback. Do not import its human-skin settings, product advertising or old software commands as requirements.

## Identity and visual direction

Create one coherent individual, retaining the current black horse's markings by default. U01 is the main black-coat/chest direction, U03 the main profile reference, and U04/U13 the front-view checks. Other photographs supply supporting details; do not mix their different white blazes and socks into the character.

Prioritize these visible shortcomings in the supplied screenshots, then verify each against the current browser:

- Mane and tail read as broad, flat, hard-ended strips. They need rooted volume, layered clumps, tapered fine strands and stable transparency.
- Coat has broad cloudy patches and strong smooth highlights. It needs directional short-hair detail and credible regional roughness while remaining black.
- Close-ups need believable eye seating/lids, muzzle/lips/nostrils, ear thickness and neck/shoulder transitions.
- Running must show correct footfall order, support, fetlock response, toe breakover, stable contact, body weight and secondary motion.
- Desert silhouettes and vegetation need the shapes, scale and spacing of the Rajasthan references.

Black hair is a non-metallic surface. Use references to balance broad highlights, fine normal detail and roughness; do not make the horse chrome, rubber, wet plastic or a crushed-black silhouette. Natural warm reflected light is allowed. The horse's actual pigmentation and markings remain shared across scenes.

## Use the existing foundation

Inspect and extend the shared horse system in `components/3d/marwari*.ts`, the Blender sources in `tools/blender/source/`, the existing export/animation scripts, and `components/stallion-film/`.

Select one canonical master after inspecting the existing `.blend` sources. Preserve originals and unrelated changes. Version the master and derive desktop, mobile, anatomy and exhibit exports from it. Record source/texture/export hashes in a manifest. Preserve or deliberately migrate material names, bone names, clip names, metre scale, +Y-up/+Z-forward orientation and attachment contracts.

The current hair shader already attempts strand shading and flow. If its geometry/atlas is still visibly inadequate, rebuild that groom rather than repeatedly changing shader constants. Fix major anatomy in the source mesh, not through exposure or perspective tricks. Test skinning before baking final textures. Reposition regional masks, eyes, hotspots, tack and rider attachments after reshaping.

Keep one material/groom source and one gait library. Presentation adapters may change camera, lights, background, pose, quality and educational layers. They must not independently repaint or resculpt the horse.

## Running mechanics and secondary motion

Use the horse's left/right, not the camera's. Right-lead canter: LH → RH+LF → RF → suspension. Right-lead transverse gallop: LH → RH → LF → RF → suspension; exchange sides for the left lead. Walk has four beats and no flight; trot uses diagonal pairs. Validate against the source videos and frame sequences listed in `REFERENCES.md`.

Do not fabricate a breed-specific motion-capture claim. The current gait periods and contact phases are authoring values, not proven Marwari constants. Fit exact timing, joint curves and body response to footage and the reshaped rig. Keep leading/trailing asymmetry, plausible equine back movement, shoulder/pelvis response and head stabilization. No rabbit-like hindleg bounce, bicycle-like legs, extreme cheetah spine, limb intersection or foot skating hidden by dust.

Keep travel speed consistent with stride length and period. Avoid double root motion. Recalculate phase offsets after changing clips; test acceleration and deceleration across multiple phases and both leads. Preserve high-speed lead-change safeguards unless a proper transition is authored. Check turning radius, banking and foot placement together.

Use actual hoof events for sand compression, footprints, dust and footsteps. Separate large sand-braking or turning action from the ordinary gallop. The owner's pasted Alamy URL is BJGXEB, while supplied U15 is BJGRMG; they are not the same image, and neither is a complete motion sequence.

Mane/tail broad motion comes from the rig; clumps have damped lag and follow-through. Relative airflow includes the horse's speed. Roots stay attached, tips vary, and the tail keeps volume. Eliminate loop-seam resets and body intersections. Idle breathing, blinking, ear attention and weight shifts should be subtle, varied and compatible with the active action.

## Rajasthan, specifically

Use the Sam/Khuri/Jaisalmer references in the atlas and the Rajasthan Forest Department description of the Thar. Build a dry-season, geographically inspired landscape with broad sandy flats, smooth dunes, fine wind ripples, irregular sparse grasses/thorny scrub and restrained haze. Match sun, bounce light, shadows and wind across horse and scenery. Replace visibly angular dune skylines and repetitive vegetation where they break realism.

The linked Poly Haven materials are optional grain/ground resources, not authentic Rajasthan scans. Author the actual landscape from regional references. Keep rendered terrain and hoof collision heights in agreement. Dust must be localized, delayed and wind-driven, not continuous smoke.

## Integrate across all relevant views

Verify at minimum:

- Home hero and desert/world sequences.
- Home Instrument and `/anatomy` living-model plates.
- `/science` DualBody exhibit and stride experience.
- Existing `/legend` and home reveal presentations that use the master.

The science exhibit has its own `anatomy-exhibit.glb` and generated helpers in `public/anatomy/vendor/marwari/`. Regenerate those with `scripts/build-anatomy-vendor.mjs`; do not edit a second material implementation by hand. Follow the stride viewer's actual dependencies too. Replacing only `marwari-hero.glb` is insufficient.

Inventory other horse placements. Adapt living horses with compatible attachments; preserve the meaning of separate historical statues and horse-hand compositions. Do not indiscriminately replace every horse-shaped artwork.

Share resources safely, clone skeletons for independent animation, isolate per-view uniforms, and avoid disposing shared textures when one viewer unmounts. Pause offscreen canvases. Separate renderers/iframes may duplicate GPU resources even when they share URLs, so measure actual behavior.

## Sound every 15 seconds

Extend `lib/audio/engine.ts` and the site-level `Soundscape` with one global recurring horse-vocalization scheduler. Nominal interval: 15 seconds while the website is foregrounded and sound is enabled/unlocked. Respect saved mute and browser user-gesture requirements. First scheduled call is due after 15 eligible seconds; do not add one timer per horse placement.

Listen to existing sound assets, then choose natural quiet calls/snorts and occasional whinnies with consistent levels. Coordinate interaction-triggered vocalizations with the same 15-second minimum gap; the existing equine gap is 12 seconds and must be reconciled deliberately. Footsteps remain contact-driven and use a separate timing policy.

Skip/defer conflicts with an active vocalization or unmuted video. No overlaps or queued bursts. Stop on mute, hidden tab and pagehide; resume with a fresh eligible interval. Handle rejected playback quietly. Route changes and the science iframe must not create duplicate schedules. Test actual playback, not only timer execution; the present effect API reports an attempt rather than confirmed success.

## Mandatory refinement loop and evidence

Follow every stage and gate in `WORKFLOW.md`: baseline → identity → clay silhouette → deformation → UV/materials → groom → gait/contact → environment → integrations → audio/lifecycle/performance.

For each pass: identify one defect, reference it, propose a cause, make one coherent correction, export a candidate, render matched views, inspect actual images/video, measure the relevant behavior, and keep/revert based on evidence. Record it using `ITERATION_LOG.md`. After two ineffective attempts, revise the diagnosis or move to the appropriate asset-authoring level. Do not keep tuning lighting to hide bad topology or flat hair.

Capture and inspect real browser screenshots on every changed route at **1440×900** and **390×844**. Inspect the top **120 px** specifically: fixed `SiteNav` remains legible, unobstructed and distinct. Preserve its 64/80 px height, required safe-zone top padding, controls below the navigation, flex wrapping and gaps. No overlapping headings, badges, hotspots or controls.

For motion, record normal-speed and quarter-speed playback, a full stride strip, loop boundaries, both leads, acceleration, slowing and turns. Include close-ups of ground contact and hair in motion. A pretty still does not pass gait verification.

Reuse existing QA tools and adapt them when needed. Verify reduced motion, loading failure/poster fallback, keyboard/touch controls, sound states, offscreen suspension and repeated route/environment changes. Run required lint, typecheck, production build and relevant sound/anatomy/gait checks. Measure production performance and identify device/renderer; mobile emulation is not real-phone GPU evidence. Do not fabricate unavailable measurements.

Finish with the versioned master, derived assets, reproducible export steps, source/reference manifest, changed-file summary, before/after captures, motion recordings, test/performance results and precise remaining limitations. If the environment cannot perform necessary sculpting or obtain a required asset, state exactly what remains and complete independent work; do not label the result photorealistic or perfect without evidence. Follow repository rules for dependencies and commits; do not push or deploy as part of this task.

Begin by inspecting the current assets and recording a fresh baseline, then execute the workflow.
