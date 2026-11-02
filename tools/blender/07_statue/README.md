# The cadet-and-Marwari bronze

`public/models/statue-cadet-marwari.glb` (2 Nov 2026, R20/R03) is the statue on `/statue` (StatueCanvas) and in the `/verify` title
(TorchHorseStage). It replaced `horse-statue-monument.glb` (the cadet's face, hands and reins were distorted at close range) on
/statue and the classical Rossbändiger horse-tamer on /verify, which had nothing to do with the academy.

| Step | What | Where |
| --- | --- | --- |
| 1 | Studio reference: a bronze of a young Indian cadet beside a rearing Marwari (lyre ears touching), reins as flat straps from bit to hand, a calm face, five-fingered hands, a rocky base on a stepped plinth | Higgsfield `gpt_image_2_5`, job `6d57715a-384c-430b-a612-454bc506ef21`; local copy `tools/blender/source/statue/statue-reference-2026-11-02.png` |
| 2 | Image to 3D, textured with PBR maps, 600 k faces | Higgsfield `hunyuan3d_v3_image_to_3d`, job `366c21de-fde0-422d-a933-5d278460eb79` (19 credits); local copy `tools/blender/source/statue/hunyuan-statue-2026-11-02.glb` (52 MB) |
| 3 | Join, decimate to 320 k triangles, textures to 2048 px, check renders, Draco + WebP export (1.6 MB) | `tools/blender/07_statue/prepare_statue.py` |

Rebuild: `blender -b -P tools/blender/07_statue/prepare_statue.py -- tools/blender/source/statue/hunyuan-statue-2026-11-02.glb public/models/statue-cadet-marwari.glb <renders> 320000 2048`

Rights: the reference and the model were generated for the academy on its Higgsfield account. The source files are kept locally
(`.git/info/exclude`), like the horse's source blends.
