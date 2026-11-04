# The eight supplied models (4 Nov 2026)

The owner supplied eight generated image-to-3D models (single static meshes, about 1.9 M triangles and 52 to 68 MB each, 512 px PBR
textures), recreations of pictures already on the site. `prepare_supplied.py` welds, decimates and Draco-compresses each to a web size.
Sources are kept locally in `tools/blender/source/supplied-2026-11-04/` (git-excluded). The owner's source files are used as they are:
nothing is re-sculpted or re-textured.

| File in `public/models/` | Source | Triangles | Where it is shown |
| --- | --- | --- | --- |
| `touch-black-horse.glb` | black horse 3d model (a black Marwari's head, a cadet's hand reaching to its muzzle) | 220 k | `/fleet` covenant frame I · Stillness |
| `touch-bay-horse.glb` | horse 3d model (a bay head with a white blaze, a hand) | 200 k | `/fleet` covenant frame III · The touch |
| `stpci-medal.glb` | bronze medal 3d model (the council's medal) | 220 k | `/tournaments`, beside the council line |
| `bsah-emblem.glb` | horse head emblem 3d model (the crest in relief) | 260 k | `/about`, where the brass monogram stood |
| `sealed-envelope.glb` | sealed envelope 3d model (burgundy, gold wax seal with the emblem) | 240 k | `/about`, above the Chairman's letter |
| `cadet-statue.glb` | horse and rider statue 3d model (cadet and rearing Marwari on a plinth) | 300 k | `/statue` and `/lithos` (`STATUE_MODEL_URL`) |
| `cadet-and-marwari.glb` | horse with rider 3d model (the same pair, no plinth) | 300 k | `/verify` title (`TorchHorseStage`) |
| `riding-tack.glb`, `riding-tack-low.glb` | horse tack 3d model (saddle, bridle, helmet, boots, stirrups, gloves, crop) | 300 k, 100 k for phones | `/equipment` and the home panel (`RidingGearStage`) |

The two "touch", the medal, the emblem and the envelope are shown by `components/3d/ModelPlate.tsx`, which keeps the picture each one
replaces as its fallback (no WebGL, a failed download). The previous models (`statue-cadet-marwari.glb`, `riding-gear-high.glb`,
`riding-gear-low.glb`) are untouched; pointing the constants back at them restores the earlier pieces.

Rights: generated image-to-3D files supplied by the owner. Confirm the academy holds the rights to the council's medal and the
emblem as they appear in them.
