# Marwari realism production workflow

Prepared 2 November 2026. This is an execution specification for the next implementation pass. Numerical quality budgets below are proposed production targets unless explicitly identified as values already in the repository. They are not measured results or biological constants.

## 1. The result we are building

One living black Marwari stallion: an identifiable head and inward-curving ears, a coherent athletic body, short black coat with subtle directional sheen, full rooted mane and tail, quiet life at rest, and weight-bearing locomotion. The same horse appears in different compositions without changing its texture, proportions or identity.

The desert is inspired by Rajasthan's Thar near Jaisalmer/Khuri: sandy flats, smooth dune crests, sparse local scrub, pale dry air, sand-colored bounce light and hoof-driven dust. Geography is grounded in the [Rajasthan Forest Department description](https://whc.unesco.org/en/tentativelists/5448/); the precise landscape composition is art direction.

Default identity: keep the existing black horse's markings. Use the owner's photos to improve anatomy and material response, not to add a different blaze or socks in each section. Keep tack as removable attachments. A bronze/statue presentation can deliberately use another material preset while retaining the same underlying horse where appropriate.

## 2. Current implementation: what to preserve and inspect

This map was checked in source. Old production reports are historical evidence; repeat their tests on the current checkout rather than inheriting old pass claims, approval gates or assumptions about other active sessions.

| System | Current files | Implication |
| --- | --- | --- |
| Shared horse loader and setup | `components/3d/marwari.ts`, `marwari-paths.ts` | Existing shared foundation; do not create a competing loader per page |
| Surface appearance | `marwari-coat.ts`, `marwari-hair.ts`, `marwari-eye.ts` in `components/3d/` | The hair already has strand-like shading and dynamic flow. If flat sheets remain, fix groom geometry/atlas, not only shader constants |
| Master candidates | `tools/blender/source/marwari_hero_source.blend`, `marwari_anatomy_source.blend`; `docs/reference/3d/marwari/marwari_rigged_source.blend` | Inspect provenance and which includes the latest rig before selecting one canonical source |
| Desktop/mobile/anatomy exports | `public/models/marwari-hero.glb`, `marwari-hero-mobile.glb`, `marwari-anatomy.glb` | Derive all variants from the same versioned master |
| Existing texture sources | `tools/blender/textures/marwari_base_graded_2048.png`, `marwari_normal_2048.png`, `marwari_orm_2048.png`, `marwari_hair_1024.png` | Inspect color-only and roughness-only views. A file called “graded” may already contain artistic color compensation |
| Home stage and worlds | `components/hero/StallionStage.tsx`, `components/sections/home/StallionHero.tsx`, `components/stallion-film/engine.ts` | Keep stage lifecycle, chapter controls, quality tiers and fallbacks |
| Locomotion | `components/stallion-film/locomotion.ts`, `footlock.ts`, `life.ts`, `public/models/marwari-gaits.json` | Preserve phase-aware motion and contacts; remeasure all offsets after gait edits |
| Environment | `components/stallion-film/{terrain,sky,textures,effects}.ts`, `scenery/desert.ts` | Match rendered terrain and the ground sampler used by hooves |
| Blender pipeline | `tools/blender/01_prepare/`, `02_rig/`, `03_animation/`, `04_export/`, `05_validate_render/`, `06_exhibit/` | Inspect actual scripts before running; old stage scripts can overwrite later work |
| Science and anatomy exhibit | `app/science/page.tsx`, `components/sections/anatomy/DualBody.tsx`, `public/anatomy/exhibit.js`, `public/models/anatomy-exhibit.glb` | Science mounts the same-origin exhibit and the stride experience. The exhibit is another derived export of the shared horse |
| Generated viewer helpers | `scripts/build-anatomy-vendor.mjs`, `public/anatomy/vendor/marwari/` | Regenerate these from shared TypeScript; do not independently edit generated copies |
| Anatomy plate | `components/sections/anatomy/{SpecimenPlate,Anatomy3DHorse}.tsx` | Current source enables the living model in both compact and full plate modes; old reports saying `/anatomy` is only 2D are stale |
| Stride study | `components/stride/`, `components/stallion-film/` | Follow the actual loader chain and preserve scientific study controls |
| Other shared presentations | `components/sections/home/BronzeAndTime.tsx`, `components/sections/legend/LastExhibit.tsx` | Test material/reveal adapters against the refreshed master |
| Sound | `lib/audio/engine.ts`, `components/site/Soundscape.tsx`, `components/stallion-film/hoofsound.ts` | Current equine effect cooldown is 12 seconds; there is no recurring 15-second call in Soundscape |
| Existing verification | `tools/qa-marwari/`, `tools/qa-stride/`, `scripts/test-soundscape.cjs`, anatomy browser checks | Reuse and extend these rather than establishing another disconnected QA system |

Material names `Marwari_Coat`, `Marwari_Hair`, `Marwari_Eye` and bone names such as `Hoof_F_L`, `Hoof_F_R`, `Hoof_B_L`, `Hoof_B_R` are runtime contracts. Preserve them or migrate every consumer and diagnostic together. Runtime model space is metres, +Y up, +Z forward. Verify Blender-to-glTF conversion; do not rotate a working rig twice.

The loader's introductory clip list/`ClipName` type is shorter than the locomotion system's actual clip vocabulary. Inventory the GLBs and all callers; do not conclude that canter and gallop are missing from that introductory list alone.

## 3. Baseline and reference lock

1. Read `AGENTS.md`, `CLAUDE.md`, relevant `docs/BLUEPRINT.md` sections, the project film-direction skill and installed Next.js guides before implementation.
2. Record branch, commit, existing dirty paths, installed Blender/Three.js versions, model and texture hashes. Preserve unrelated edits.
3. Inventory each visible horse use and its true source asset, renderer, material setup and animation controller. Distinguish living horse, educational layers, statues and separate horse-hand compositions.
4. Open all 15 local references using `REFERENCES.md`. Make a small identity sheet: selected profile, front, three-quarter, ear curve, markings, mane side/length, tail length and dark coat range.
5. Capture a fresh baseline with matching cameras: full left/right profile, front, rear, three-quarter, head, eye, muzzle, ears, mane roots, shoulder, flank, rump, tail, hoof contact. Disable anatomical glow for the neutral surface test, then test it separately.
6. Record short clips of idle, walk, trot, both canter leads, both gallop leads, acceleration, slowing and turns. Include 1× playback, 0.25× playback and a frame-stepped stride.
7. Freeze camera, light, exposure, time of day, animation phase and random seed for comparisons. Keep raw captures; postprocessing must not conceal defects.

**Gate:** Claude can identify which defect comes from shape, skinning, texture, hair, lighting, timing, contact or environment. A screenshot observation is not automatically a proven root cause.

## 4. Reshape: large forms before surface detail

Work in a new version of the selected Blender source, preserving the original and existing rig where viable. Create a high-detail sculpt and animation mesh relationship that can be reproduced.

| Area | Reshape and verify | Reject |
| --- | --- | --- |
| Whole horse | Match the chosen individual's balance of head, neck, trunk and legs in front/side/rear views; separate ribcage and pelvis volumes | A generic heavy draft body, tiny head or impossibly thin limbs added for drama |
| Head | Long, lean head; gently convex profile where the selected references support it; defined jaw and cheek plane; transition into throatlatch | Flat wedge, exaggerated dish, oversized round human-like eyes |
| Ears | Two distinct pinnae with inward-curving tips, thickness at the base, thin rims, inner concavity and a visible gap appropriate to pose | Fused heart, closed tubes, rigid horns, identical mirrored rotation |
| Eye | Seat the globe inside lids; model upper/lower lid rims, corners and a restrained tear line; dark brown iris under a reflective cornea | Floating marble, permanently bright white sclera, blinking by visibly crushing the whole eyeball |
| Muzzle | Actual nostril opening and alar rim, soft muzzle volume, lip seam and chin; finer hair/whiskers in close-up | Painted hole without depth, carved trench lips or uniform plastic surface |
| Neck/chest | Credible crest, throatlatch and lower neck; integrate shoulder and pectoral masses; allow neck length and posture to change with gait | Puffed tube neck or detached shoulder bulge |
| Back/barrel | Defined withers, ribcage, abdominal tuck, loin connection and croup; smooth transitions with restrained asymmetry | Random lumpy muscles or a rigid horizontal plank through every stride |
| Legs | Correct shoulder/elbow/carpus/fetlock chain and hip/stifle/hock/fetlock chain; visible tendons and realistic hoof proportions | Treating the hock as a backwards human knee, rubber shins, limb length changes |
| Hooves | Hoof wall, coronet, heel and sole contact plane; permit breakover at the toe | Featureless cones, identical flat blocks, shadows substituting for contact |

Breed research supports the characteristic long, lean convex face and oval nostrils, but individual reference matching still controls the sculpt. [ICAR breed study](https://epubs.icar.org.in/index.php/IJAnS/article/view/37561)

Use matched perspective reference cameras rather than distorting the mesh until it matches several incompatible lenses. Only introduce micro-wrinkles, fine veins and hair breakup after full-body clay renders read correctly. Preserve plausible body condition; muscle detail should appear through changing light and movement, not deep grooves everywhere.

**Gate:** six full-body clay views and head close-ups pass against the chosen reference set. No material adjustment is accepted as a fix for a failed silhouette.

## 5. Topology, skinning and deformation

Retopologize only the areas that need it. Put controllable edge flow around eyelids, lips, nostrils, shoulder, hip and bending joints. Preserve volume during extension and compression. Reproject sculpt detail with cage checks around ears, eyelids and opposite limbs.

Before final texture baking, test extreme but plausible poses: full forelimb reach, forelimb fold, hindlimb propulsion, hindlimb recovery, neck lowering, head turn, ear swivel, blink and tail lift. Inspect under the belly and behind shoulders. Use corrective shapes or helper bones where ordinary weights collapse a joint. Bake procedural constraints to supported clips for export; Blender-only modifiers are not proof of browser deformation.

Rebuild UVs only if necessary. Favor uninterrupted visible shoulder, flank, neck and face; place seams away from primary close-ups. Keep sufficient padding at every exported mip level. Rebind anatomy hotspots, rider/tack attachment points, eye centers and regional material masks after any shape or rest-pose change. The current shaders include bind-position-based regions; those can drift when the horse is reshaped.

**Gate:** deformation and attachment tests pass on the exported GLB in the browser, not only in Blender. Clip names, bone names and both lead variants are present.

## 6. Coat: black hair with depth

The desired coat is dark, fine-haired and subtly reflective. It should remain recognizably black under neutral, warm and cool lighting while naturally reflecting its surroundings. A black horse can show warm highlights; do not force every lit pixel to neutral grey.

Build editable layers: base pigmentation → broad regional variation → hair-flow direction/whorls → fine normal breakup → roughness regions → local dust/sweat masks. Keep lighting and highlights out of base color. Large cloudy patterns in U09/U10 should not become stronger to simulate detail.

| Map/material | Authoring instruction | Browser handling |
| --- | --- | --- |
| Base color | Near-black charcoal pigmentation; very restrained warm variation where references support it; preserve one marking layout | Color data with appropriate sRGB annotation; no baked sun rim or deep baked shadow |
| Normal | High-to-low anatomical detail plus fine short-hair direction; use small physical scale, not large pebble noise | Non-color data; verify tangent convention and green-channel direction with a known-light test |
| Roughness | Variation by shoulder, flank, neck, muzzle, hair and dust; do not derive it blindly by inverting the photograph | Non-color data; inspect under the same calibrated environment |
| Occlusion | Restrained crevice/contact contribution, separated from pigment | Check UV channel and packing; avoid multiplying strong AO into both texture and shader |
| Metalness | Skin, hair and hoof are dielectric | Zero for the living horse; bronze preset is a separate deliberate presentation |
| Hair flow | Map direction over neck, shoulder, barrel, forehead and whorls | Direction data anchored to UV/rest surface; must not swim as bones move |
| Eyes and muzzle | Wet cornea/tear line; softly varied muzzle roughness, lip seam and sparse whiskers | Separate regional response; do not make the whole head wet |

Suggested starting roughness intervals, **art-tuning values rather than measured horse properties**: coat 0.35–0.55, dusty lower legs 0.55–0.8, moist muzzle details 0.25–0.45, cornea 0.03–0.12. Judge the combined normal, lighting and roughness response, not these numbers alone. Start with restrained sheen and no heavy whole-body clearcoat. Inspect whether existing coat grading is compensating for an old texture before layering a new grade on top.

Author high resolution offline if needed; export 2K maps first and spend additional texels only where browser close-ups demonstrate a need. Separate a close-up head atlas if that is more efficient than making the whole body 8K. A 4K RGBA8 texture is about 64 MiB before mipmaps; three such uncompressed maps with full mips are about 256 MiB. File compression alone does not imply low GPU memory. KTX2 is an optional measured pipeline improvement, not an assumed installed decoder.

Color-space and material feature details must be checked against installed Three.js. [Texture documentation](https://threejs.org/docs/pages/Texture.html), [physical material documentation](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)

**Gate:** neutral side/front/head renders show coat detail without metallic glare, crushed black voids, brown repainting, stretched UVs or visible seams. Repeat in desert daylight and studio light using the same maps.

## 7. Mane, forelock and tail

The owner's screenshots show broad flat strips and cut-off ends. The current shader already attempts to break up strands. Treat remaining sheet-like silhouettes as a likely groom/geometry/atlas issue to investigate.

1. Author rooted guide curves: forelock separate from crest mane; mane emerges along the neck crest; tail has a fleshy dock with hair growing around it. Avoid a sheet pasted to the rump.
2. Build large clumps first, then medium clumps and sparse flyaways. Use varied length, width, curvature, depth and overlapping orientation. Keep a solid-looking interior volume while softening the outline.
3. Derive browser-friendly cards or small geometry clumps from the groom. Curve and taper them; avoid broad rectangular tips and a single parallel curtain. Use a consistent root-to-tip atlas convention.
4. Author fine strands in alpha, color and tangent direction. Test alpha threshold, coverage, mipmaps, texture compression and depth behavior on light and dark backgrounds. Hair must not sparkle, vanish, show white fringes or cast rectangular card shadows.
5. Let the skeleton provide broad motion and a damped secondary system provide lag. Roots move least; tips lag and overshoot. Airflow depends on horse velocity relative to wind, not world wind alone.
6. Add clump-specific response without random vibration. Check contact against neck, shoulders, rump and legs; constrain/bake collision where necessary. A fast tail should retain curvature and volume rather than become one straight board.
7. Warm the simulation to a settled state before looping. For baked loops match pose and velocity at the seam. Do not reset procedural hair at every stride.

Keep the same grooming design and atlas across sections. Mobile reduces layers/flyaways and simulation cost, not the horse's haircut.

**Gate:** front, side, rear and three-quarter views at 1× and 2× DPR show believable volume. Idle, gallop and turn videos show delayed follow-through without intersection or edge shimmer.

## 8. Movement: a detailed running breakdown

The breed's appearance comes from Marwari references; locomotion must follow equine mechanics. Do not invent a special Marwari gallop. A breed-associated ambling gait is not interchangeable with canter or gallop and is outside this pass unless separately referenced.

Use LF/RF for left/right forelimb and LH/RH for left/right hindlimb, from the **horse's** viewpoint. Repository equivalents are FL/FR and HL/HR.

| Gait | Footfall order | Animation requirement |
| --- | --- | --- |
| Walk | LH → LF → RH → RF, repeating | Four beats; no flight phase; body advances over supporting limbs |
| Trot | LF+RH → RF+LH | Diagonal pairs; a working trot can have suspension; do not convert it into same-side pacing |
| Right-lead canter | LH → RH+LF → RF → suspension | Three-beat pattern, with the right forelimb the last fore contact |
| Left-lead canter | RH → LH+RF → LF → suspension | Opposite lead, anatomically mirrored rather than just reversing video |
| Right-lead transverse gallop | LH → RH → LF → RF → suspension | Four separated beats, unequal phase spacing, leading/trailing asymmetry |
| Left-lead transverse gallop | RH → LH → RF → LF → suspension | Mirror limb roles while preserving direction of travel |

The gallop sequence and gathered suspension are supported by [Bertram and Gutmann](https://pmc.ncbi.nlm.nih.gov/articles/PMC2696142/). Use [Muybridge's sequence](https://www.metmuseum.org/art/collection/search/266441) and [UC Davis videos](https://vorl.vetmed.ucdavis.edu/equine-gait-analysis) for visual cross-checks. These are general horse references, not a Marwari motion-capture recording.

### Right-lead gallop, frame by frame

| Phase | Legs and load | Body, head and hair | Ground response |
| --- | --- | --- | --- |
| Recovery approaching contact | Hindlimbs recover underneath the body; the trailing LH prepares to land | Body follows its flight trajectory; neck/head balance the movement | No new footprint or hoof sound before contact |
| LH touchdown and support | LH contacts first after flight; joints accept load, then extend through support | Pelvis advances; avoid a rigid straight hind chain | Small impact puff and local compression at the actual hoof |
| RH touchdown/support | Leading RH follows; its pose/timing differs from LH | Hindquarters contribute forward impulse; do not push with both hind feet as a synchronized rabbit jump | Separate RH event, position and print |
| LF touchdown/support | Trailing forelimb reaches and accepts load as hind support changes | Shoulder/scapular motion and chest translation absorb load; neck is not a fixed ornament | LF contact with fetlock yield; no floating contact shadow |
| RF touchdown/support | Leading forelimb reaches farther in its role and is the final fore support | Torso passes over the support; neck/head motion follows reference, not an exaggerated sine wave | RF event; toe breakover near the end of support |
| Last forelimb liftoff and gathered flight | All feet leave the ground; limbs recover beneath the body | Modest equine back motion, body pitch/heave, hair and tail trailing the previous impulse | No hoof impacts during flight; old dust continues to drift |
| Return to next LH contact | Recovered limbs prepare for the next cycle without a pose snap | Continuous body and secondary-motion velocities | The next impact begins the next stride |

Foot contacts can overlap; the table describes event order, not four mutually exclusive support frames. Do not impose equal quarter-cycle steps. Avoid a cheetah-like exaggerated spinal fold or treating maximum leg extension as the sole flight pose. The leading and trailing limbs are not identical time-shifted pendulums. [Transverse gallop kinematics study](https://www.sciencedirect.com/science/article/pii/S0737080687800084)

### Timing and travel

Current authored values in `public/models/marwari-gaits.json`:

| Clip | Speed (m/s) | Period (s) | Stride length (m) |
| --- | --- | --- | --- |
| Walk | 1.44 | 0.80 | 1.152 |
| Trot | 3.33 | 0.75 | 2.498 |
| Canter_R / Canter_L | 4.83 | 0.60 | 2.898 |
| Gallop_R / Gallop_L | 10.0 | 0.42 | 4.2 |

These are existing rig-specific authoring choices, not certified Marwari measurements. At present, right-gallop touchdown phases are LH 0.00, RH 0.14, LF 0.30, RF 0.46. Refit from footage and the reshaped rig if needed; do not preserve unsuitable timing just because it exists.

Maintain `speed = strideLength / period`. For in-place clips, the controller supplies translation; do not also bake a second forward travel into the root. Study a stride in 24–48 sampled poses at a fixed duration; sample count is not playback speed. Match foot-contact timing before tuning stylish body motion.

During stance the hoof should remain substantially stationary relative to firm ground while the body passes it. During swing it follows a recover-and-reach arc with plausible knee/hock folding. Evaluate hoof sole height and orientation, not only a bone origin. Fetlock yield, toe breakover and small substrate movement matter. Track footage demonstrates that slip and sink depend on surface; do not force a perfectly locked hoof through deep sand or accept uncontrolled skating. [Surface study](https://pubmed.ncbi.nlm.nih.gov/23742040/)

### Transitions, turns and life

- Crossfade using contact-compatible phases; regenerate the locomotor's offsets when clips change. Confirm both acceleration and deceleration from multiple entry phases. An aesthetically smooth body can still conceal incompatible foot support.
- Preserve current protection against instant high-speed lead swaps. If adding a lead-change action, author and test it rather than flipping the skeleton or swapping legs mid-contact.
- Match turn radius to speed. Body banking, neck look, foot placement and tail lag agree with the path. Avoid fast yaw about a stationary root.
- Keep a sand-braking/turning action separate from the ordinary gallop loop. U15 is useful art reference, but does not prove the exact action or timing.
- Idle: small breathing volume, irregular blink, gentle independent ear attention, occasional weight shift and quiet tail motion. Use additive channels that do not overwrite the active gait's neck and pelvis motion.
- Running: modest nostril/exertion response, stabilized gaze, less large idle head turning. No synchronized constant ear wobble or exaggerated breathing bulge on every stride.
- Derive sound, dust and footprints from actual contact events. Do not fire all three from an unrelated repeating clock.

**Gate:** review 1×, slow motion, a hoof-only view and fixed-camera stride strips. Verify lead order, credible weight, loop position/velocity continuity, hoof-ground alignment, no limb intersections and no footfall events during suspension.

## 9. Rajasthan environment and ground integration

Use R11–R13 in the atlas before adjusting scenery. In the provided screenshots, large angular dune silhouettes, repeated grass clumps and simplified vegetation compete with a realistic horse.

Build terrain at three scales: broad dune masses and sandy plains, mid-scale wind-shaped ridges, then fine ripple/grain shading. Increasing microtexture cannot repair a polygonal skyline. Smooth the silhouette with suitable geometry/LOD and normals; ensure near/far terrain joins do not form seams or duplicate surfaces.

Place vegetation in irregular patches with large empty intervals. Use restrained dry grasses and thorny scrub; add a few locally appropriate tree forms only where the chosen composition calls for them. Avoid identical evenly spaced tufts or low-poly green disks. Vary scale, orientation and density coherently, rather than adding arbitrary noise everywhere.

Use beige/ochre sand, pale sky, a consistent sun direction, sand bounce and subtle distance haze. Keep the black horse legible with natural reflection contrast and contact shadows. A warm environment can reflect warmth without repainting the horse's pigment. Fix exposure and tone mapping while comparing materials; do not use a different white balance to disguise each section's inconsistency.

Dust starts at hoof impact/push-off, has an initial direction from hoof motion and loose sand, then settles and drifts with wind. Use fast coarse particles near the foot and a softer delayed fine cloud. Keep ordinary running dust modest. Reserve a large plume for a separately authored turn/brake with suitable ground mechanics. No constant smoke emitter under the belly.

Footprints follow the correct hoof and heading and stay in world space. Tail, mane, grasses and dust share the wind direction, with different response times. The rendered sand and the collision/height sampler must agree; large visible displacement that hooves cannot sense causes floating or burial.

**Gate:** inspect a wide establishing view, side tracking view, rear tracking view and ground close-up. The environment reads as the selected Rajasthan references before relying on a caption to identify it.

## 10. One master, multiple presentations

Select one canonical source, then publish a manifest containing master revision, source hash, units, rig/clip contract, material names, texture hashes, variant derivation and export versions. A proposed canonical filename such as `tools/blender/source/marwari_master.blend` is a new artifact, not something already present.

Use one geometry/rig identity and one texture/groom source. Desktop, mobile, anatomy and exhibit exports can differ in resolution, LOD or educational attachments; they must be traceable to that same master. Low resolution means a derived atlas, not a separately painted horse.

| Placement | Adaptation | Remains shared |
| --- | --- | --- |
| Home hero and Rajasthan run | Camera, environment, path, gait, light and quality | Anatomy, markings, coat maps, groom identity, rig and clips |
| Home Instrument + `/anatomy` | Calm pose, close-up cameras, hotspot anchors, reversible region emphasis | Living outer horse and skin response |
| `/science`: DualBody exhibit + stride study | Rider/tack, educational layers, slow motion and gait controls | Master horse, gait definitions, shared material setup |
| `/legend` and home reveal | Presentation-specific reveal/cloak/bronze transition where already designed | Underlying approved horse identity; living endpoint returns to canonical material |

Find any additional living-horse uses before calling integration complete. Separate heritage sculptures and hand-contact compositions may have semantic geometry requirements; migrate their horse portion only with compatible reattachment/retargeting. Do not replace a whole artwork with a bare running horse.

Share loaded geometry and textures within a renderer where practical, but clone skinned skeletons correctly for independent animation. One `Object3D` cannot be parented into several scenes at once. Per-instance highlights/uniforms must not leak between viewers. Reference-count cached resources or otherwise define ownership so unmounting one section cannot dispose another's textures.

Separate canvases and the science iframe have separate renderers/GPU allocations. A shared URL/cache does not guarantee one GPU copy. Pause offscreen render loops and limit simultaneous active horse canvases. Regenerate the iframe helpers with `scripts/build-anatomy-vendor.mjs` after shared material changes and rebuild `anatomy-exhibit.glb` when its source horse changes. Verify the full dependency chain rather than merely replacing `marwari-hero.glb`.

**Gate:** a matching-camera comparison across home, anatomy, science and legend shows the same head, ear curl, markings, hair length and coat identity. Hotspots and educational layers remain aligned after reshaping.

## 11. Horse sound every 15 seconds

Implement one global recurring **horse-vocalization** scheduler in the existing audio architecture, not a timer per horse section. The requested cadence is a nominal 15 seconds of eligible foreground time. Begin after the existing sound preference allows it and the browser has been unlocked by a visitor gesture. Respect an explicitly saved mute.

Rotate suitable existing horse-call, snort and quiet vocal/breath recordings if they are actually appropriate on listening; do not mislabel a snort as continuous breathing. Occasional whinnies plus softer sounds will feel more alive than the same loud neigh every tick. Keep recordings natural and levels consistent. Existing `.mp3` assets must be listened to before choosing them.

Rules:

1. First scheduled vocalization becomes due 15 seconds after eligible playback starts; retain existing deliberate interaction behavior unless it conflicts with the cadence.
2. Use one owner in the site-level sound system. Route changes and multiple horse viewers must not multiply or reset the scheduler.
3. Coordinate interaction-triggered horse vocalizations with this same global 15-second minimum vocalization gap. Update the present 12-second equine rule deliberately and inspect existing tests. Hoofbeats have a separate contact-based rhythm and must not inherit this gap.
4. At a scheduled opportunity, skip/defer if a vocalization is playing or an unmuted film owns the sound stage. Do not stack queued sounds. Preserve existing controls and optional sound preference.
5. Mute, hidden tab and pagehide stop vocal playback and scheduling. On return, start a fresh 15-second eligible interval; never play a backlog. Reduced-motion preference alone does not imply a changed audio preference.
6. Treat `play()` rejection as a failed playback attempt; handle it quietly and avoid rapid retries. The current `playEffect()` boolean means an attempt, not confirmed audible playback; improve the API if scheduling needs a successful-start signal.
7. Sand hoofbeats stay synchronized with actual contacts, lower and duller than hard-ground impacts, with small sample variation. Ensure existing synth footsteps and a prerecorded gallop track do not both play the same action.
8. For the iframe, retain the parent sound preference as authority; do not create another timer inside it. Any cross-window coordination must validate origin and source.

Browser autoplay restrictions remain applicable; a timer alone cannot start audible media reliably. [MDN autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)

**Gate:** verify at least 60 seconds with sound on, plus muted, no gesture, route change, hidden/visible, active video and simultaneous-viewer cases. Log actual playback starts and foot-contact timestamps. No overlaps, duplicated timers, surprise sound while muted or catch-up burst.

## 12. The repeatable refinement loop

For each pass, use [ITERATION_LOG.md](ITERATION_LOG.md). Name passes by issue (`shape-01`, `groom-02`, `gallop-contact-03`) and keep baseline and candidate exports separate until the gate passes.

1. **Observe:** choose the worst visible defect and attach a reference ID plus a frame/crop showing it.
2. **Hypothesize:** identify one likely cause, such as card width, shoulder weights, over-strong roughness variation or phase mismatch.
3. **Change:** make one coherent intervention; record files/assets/settings. Avoid changing lighting, mesh and texture simultaneously when diagnosing one of them.
4. **Export:** generate a candidate from the master, record hashes, inspect warnings and verify clip/material contracts.
5. **Render:** use the same camera, light, phase, viewport and quality tier as baseline, then test one alternate light/angle to avoid overfitting.
6. **Inspect:** look at the actual images and motion, not filenames or automated scores. Review the responsible close-up and the whole animal.
7. **Measure:** rerun the relevant gait/contact, resource or performance check. Keep screenshots and motion evidence attached to the result.
8. **Decide:** retain a demonstrated improvement; revert a regression. If the gate fails, continue that stage.

After two attempts that do not improve a defect, change the diagnosis or tool level: return from shader tuning to texture authoring, from procedural flutter to groom geometry, or from foot-lock patches to the baked gait/rig. This is a strategy-change trigger, not permission to declare success. If a required sculpting capability or licensed source is unavailable, document the specific remaining asset work and proceed with independent improvements; do not conceal the limitation in flattering lighting.

Score anatomy, coat, head, groom, movement, contact and environment from 0 to 3: 0 broken, 1 obvious synthetic defect, 2 credible at the intended distance, 3 strong close-up/motion match. Scores organize judgment and do not establish photorealism. A 3 in coat cannot compensate for a 0 in contact. For release require every applicable gate to pass, every category at least 2 at its intended view, and no unresolved hard failure.

Hard failures: wrong footfall order, fused ears, joint collapse, floating eye, rectangular mane/tail silhouette, obvious foot skating on firm ground, loop snap, model identity changes between pages, muted sound playing, crashes or obstructed navigation.

## 13. Final acceptance and performance

Use the existing `tools/qa-marwari/README.md` harness. It has fixed cameras, pinned assets, animation strips, load-time checks and lifecycle tests. Its browser paths may be stale: discover available installed browsers rather than blindly relying on old absolute cache locations. Extend asset pinning to the exhibit and any external textures if they are not covered already.

Required visible-page captures for every changed route: **desktop 1440×900 and mobile 390×844**. Include the full page UI, not only a cropped canvas. Inspect the **top 120 pixels**: `SiteNav` must remain clear. Its height is 64 px mobile/80 px desktop; provide the repository's hero safe-zone padding (`pt-24`/`pt-28` or the documented clamp), put secondary controls below the navigation, and protect wrapping bars with gaps. Hotspots, headings, captions and sound controls must not collide.

Required motion evidence: idle, walk, trot, both canter/gallop leads, acceleration, slowing, turns and loop seams. Test a 30-second stable run, several speed transitions and at least ten route/environment round trips. Include real-time and quarter-speed recordings. Screenshot-only validation cannot certify running motion.

Verify reduced-motion still/replay behavior, no-WebGL/poster fallback, model-load failure, mobile portrait framing, keyboard access, touch controls and offscreen suspension. Keep ears and hooves inside the normal full-horse framing; reserve crops for deliberate close-ups.

Proposed runtime targets after profiling: roughly 60 fps on the agreed desktop and at least 30 fps on a representative real phone. Record device, browser, renderer, DPR, scene, model hash, frame-time p50/p95, draw calls, triangles, transfer bytes, memory estimate and cold/warm readiness. Desktop mobile emulation is a layout test, not phone GPU evidence; SwiftShader is not device performance. If no real phone is available, report that gap.

Optimize from measurements: pause offscreen scenes, adjust DPR, LOD, hair overdraw, shadow resolution and texture dimensions. Preserve the approved silhouette and contact quality. Do not hide the horse, replace it with unrelated stock media or eliminate the science study to obtain an attractive frame rate. An optional offline-rendered film may be derived from the same master, but cannot silently replace required interactive views.

Run repository-required lint, typecheck and production build plus relevant existing sound, anatomy and gait checks for changed behavior. Add meaningful tests for new global sound timing and resource ownership where needed. Report failures accurately, including unrelated pre-existing ones; do not rewrite unrelated features to claim a clean build.

Final implementation delivery must include the versioned source asset, derived exports, texture/groom sources, reproducible export steps, manifest, changed-file summary, matching before/after images, movement recordings, measured verification results and precise remaining limitations. “Perfect” is the aspiration; the completion claim must describe what the evidence actually demonstrates.
