# The cadet rider: source and provenance

`public/models/cadet-rider.glb` (2 Nov 2026) is a realistic rider that replaced the procedural mannequin built by
`tools/blender/06_exhibit/build_cadet.py`. The same file is ridden by the dual-body study (`/science`, `public/anatomy/exhibit.js`)
and the stride laboratory (`/stride`, `lib/stride/rig.ts`); neither page needed a code change.

| Step | What | Where |
| --- | --- | --- |
| 1 | Studio reference: a 19-year-old Indian cadet in academy turnout (black helmet, black hunt jacket with brass buttons, white stock, white breeches, tall black boots, black gloves), front view, relaxed A-pose, plain grey ground | Higgsfield `gpt_image_2_5`, high, 2K, job `59249520-3f73-4eb1-b062-43aa61f4f544` (2.75 credits). Local copy: `rider-reference-2026-11-02.png` |
| 2 | Image to 3D: textured, PBR, auto-rigged (24-bone humanoid), A-pose, 1.72 m, ~52 k triangles, symmetry on, ultra mode | Higgsfield `meshy_v7_image_to_3d`, job `e3271ce0-b26b-4304-9f5e-fe454f431d50` (50 credits). Local copy: `meshy-rider-2026-11-02.glb` |
| 3 | Seat: hips over the saddle's seat, ball of each foot on the stirrup tread, knees by two-bone geometry pushed clear of the flank, hands over the withers with the palms facing, head a little down; pose baked | `tools/blender/06_exhibit/build_rider_real.py` (tunable through `RIDER_TUNE`, a JSON of the `T` keys) |
| 4 | Texture: the generated atlas packs hundreds of islands edge to edge (white breeches beside black wool), which bled white flecks onto the jacket through mipmaps; a new UV layout with gaps, colour and roughness baked onto it with a 12 px margin; the generated normal and metallic maps are dropped | `rebake()` in the same script (Cycles, CPU) |
| 5 | Re-skin to the pages' five vertical bones (`R_Pelvis`, `R_Spine`, `R_Chest`, `R_Neck`, `R_Head`) and place the anchors the pages track (`RAnchor_*`) on the new body; the procedural stirrup irons and leathers are kept | same script |
| 6 | Export: Draco, WebP 2048 colour and roughness, single-sided body | `tools/blender/06_exhibit/export_rider.py` |

Rebuild (Blender 5.2): `sh tools/blender/06_exhibit/build_all.sh <work>` up to `cadet.blend`, then
`blender -b <work>/cadet.blend -P tools/blender/06_exhibit/build_rider_real.py -- tools/blender/source/rider/meshy-rider-2026-11-02.glb <work>/pose.json <work>/rider.blend`
and `blender -b <work>/rider.blend -P tools/blender/06_exhibit/export_rider.py -- public/models/cadet-rider.glb 2048`.

Rights: both the reference still and the 3D model were generated for the academy on its Higgsfield account; no third-party photograph
or scan was used. The two source files are kept locally (listed in `.git/info/exclude`, like the horse's source blends).

Known limits: the arms and legs are baked into the seat, so the elbows do not open and close with the stride (the reins still run
live from the hands to the bit); the fingers are not curled round the reins (the generated rig has no finger bones).
