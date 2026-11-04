# Horse anatomy verification

Audit date 4 November 2026. Scope: the anatomy hotspots (`lib/content/anatomy.ts`), the home "Specimen plate 02" 3D Marwari (`components/sections/anatomy/Anatomy3DHorse.tsx`, `public/models/marwari-*.glb`), the ear study on /anatomy, and the stride lab (`lib/content/stride.ts`).

**What was and was not done.** Text claims were checked against the fetched sources listed in PRELAUNCH-FACT-CHECK.md (S1, S2, S3, S7, S8, S11). The 3D model was inspected only through screenshots in a desktop browser (1440x900) on the running local site. **No side-by-side comparison with photographs or veterinary reference plates was carried out, and no measurement of the mesh was taken.** Everything about model geometry below is therefore an observation, not a certification. **HUMAN EXPERT REVIEW REQUIRED** (equine veterinarian or anatomist, plus a 3D artist with Marwari references) before the model is described as anatomically accurate.

## Text and label findings

| Item | Finding | Status |
|---|---|---|
| Ears: lyre shape, tips meeting | Confirmed for Marwari (S1, S2, S3). Shared with the Kathiawari (S1, S3). | VERIFIED |
| Ears: 180° rotation | True of horses generally (S11 Horse anatomy), also stated for the Marwari (S1, S2). Site copy presents it as a Marwari trait; it is not unique. Independent movement of each ear is standard but not shown in the fetched pages. | VERIFIED, not breed-specific |
| Neck / "cervical crest" / counterweight | Cervical vertebrae are correct. "Counterweight for turns" is a plausible biomechanics statement, not source-checked. | EXPERT |
| "Saddle spine / thoracic axis" | The saddle rests over the thoracic spine. Correct terminology. The seat movement figure (about 100/min) matches S7/S8. | VERIFIED (terminology EXPERT) |
| "Flank" | The leg aid is applied to the barrel just behind the girth; the flank lies behind the ribs. Text now names both. | FIXED |
| Fetlock and hoof | Fetlock = metacarpo/metatarsophalangeal joint (S11). "Flexes like a spring" is standard but not found in S11. "Hard, upright hooves bred for sand" is not sourced. | EXPERT / UNVERIFIED |
| Walk | Four beats, LH-LF-RH-RF, two or three feet on the ground (S11 Horse gait). Stride lab text matches. | VERIFIED |
| Stride lab honesty note | Page states the walk is authored, not captured, and every curve is illustrative. Good practice. | QUALIFIED |
| Hand units | 14.3 hh = 14 hands 3 inches = 59 in (S11 Hand). Fleet heights 14.3 to 15.3 are valid notation. | VERIFIED |
| Weight | S1: average male 365 kg. S11: 360–540 kg for an average horse. The site's "500 kg" was reduced to "several hundred kilograms". | FIXED |

## 3D model and hotspot observations (screenshots, desktop)

| Item | Observation | Status |
|---|---|---|
| Hotspot "Saddle spine" | Marker sits on the mid-back over the saddle region in the 3D plate. Aligned. | OK (desktop) |
| Hotspot "Flank" | Marker sits on the lower barrel behind the girth line, a little low for the flank but within the region the text describes. | OK, minor |
| Hotspot "Fetlock & hoof" (Walk pose) | Marker sits on the fetlock of a foreleg. Aligned. | OK (desktop) |
| Hotspots "Ears", "Neck" | Not re-inspected after this audit's edits. | NOT CHECKED |
| Mobile layout of hotspots | Not tested in this audit. | NOT CHECKED |
| Colouring | The plate model is black with a white blaze and white socks that read as stockings; the ear-study model is black with a white blaze. Several golden or cream patches appear on the coat (back, barrel) under the plate lighting; they look like lighting or material artefacts, not anatomy. | EXPERT (3D artist) |
| Ears | Ears are tall and narrow. The inward curve with touching tips is not clearly visible from the viewpoints captured. | EXPERT |
| Eyes | A separate request ("fix those eyes") is open. The Marwari eye shader is in `components/3d/marwari-eye.ts`. Not changed in this audit. | OPEN |
| Gait animation (walk, trot) | Walk and trot clips play. Limb sequence and joint ranges were not analysed. | EXPERT |
| Limbs, joints, spine, pelvis, hooves, tendons, muscle layout | Not assessed beyond a visual glance at the screenshots. No extra limbs or missing joints were noticed. | EXPERT |
| Skeleton (`marwari-anatomy.glb`, `anatomy-exhibit.glb`) | Contains bone, tendon, muscle and "Marwari_*" materials. Not reviewed. | EXPERT |

## Recommended specialist work

1. Equine vet or anatomist: review the skeletal and muscle layers, hoof/pastern angles and fetlock range in the gait clips against a reference such as a veterinary anatomy atlas.
2. Breed specialist: compare head, ear carriage, neck set and croup with Marwari photographs from a breed registry.
3. 3D artist: remove the golden patch artefacts and re-check the eye domes.
