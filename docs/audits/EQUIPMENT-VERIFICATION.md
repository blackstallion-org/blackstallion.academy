# Equipment verification

Audit date 4 November 2026. Scope: `/equipment` (HorseEquipmentSection, EquipmentCrispHeader, MaterialsEditorial), `/safety` kit scroll (`SafetyKitScroll.tsx`, `KitStage.tsx`, `public/models/tack-parts.glb`), curriculum and parents tack mentions. Sources fetched for equipment were limited to S11 (Wikipedia: Stirrup, Hoof) and S4 (tent-pegging lance and sword). **No saddlery or farrier textbook was opened. Statements marked EXPERT need a farrier, saddler or qualified riding instructor.**

| Item | Name / spelling | Stated function and placement | Finding | Status |
|---|---|---|---|---|
| Riding helmet | correct | "certified helmet fastened before every mount" | Safe and standard. No standard is named (e.g. which certification). Recommend naming it. | OK, EXPERT |
| Bridle | correct | "snaffle bridle with a cavesson noseband; bit at the corner of the mouth" | Consistent with common practice; exact bit placement depends on fit. Not unsafe. | EXPERT |
| Saddle | correct | "centred over the back; girth keeps it from shifting" | Correct in principle. The /equipment copy adds "sits behind the shoulder, two fingers under the girth". Common guidance, not source-checked. | EXPERT |
| Cavalry saddle slide | "Cavalry Saddle" | "high cantle support for lance momentum… Marwari" | No source for a Marwari-specific design or lance-momentum function. Text reworded to "cavalry-style saddle with a raised cantle for rider support". Spec list (studded cantle, fur-lined seat, brass) is BSAH product copy. | FIXED / OWNER |
| Stirrup irons | correct | "carry the feet, heels down, toes forward; foot can be freed quickly" | Sound. S11: tread, branches, eye. "12 cm tread" and "shock-absorption pad" are product specs not found in S11. | OK / OWNER |
| Schooling whip | correct | "an aid, not a punishment; light tap behind the leg" | Appropriate framing. A safety instructor should confirm the whip is only used as described with children. | EXPERT |
| Gloves, boots | correct | grip; heel stops foot slipping through stirrup | Correct and safety-relevant. | OK |
| Halter and lead | "Stable Halters & Bridle" | morning turnout and inspection | Fine. "Cast-iron rings" unusual for halter hardware (usually steel or brass); owner to confirm. | OWNER |
| Horseshoe | "Forged Horseshoe" (was "Hand-Forged" / "Drop-forged") | hot-fitted; "balancing the 50-degree desert hoof angle" | Contradictory "hand-forged vs drop-forged" corrected. No source for a 50° desert hoof angle (S11 Hoof gives no angle); sentence replaced. Note the page also says tradition held Marwar horses "crossed soft sand with no iron shoes", which is labelled as legend. | FIXED / EXPERT |
| Tent-pegging lance and sword | "9-foot ash lance" | "9 ft lance" | ITPF 2019 Art. 144: lance 2.2–2.75 m (up to 9 ft); sword blade 81–90 cm. "Ash" is not in the rules. Fixed to "up to nine feet". | FIXED |
| Tent peg | "6 cm", "four-inch" | "target peg" | ITPF 2019 Art. 145: 30 cm × 2.5 cm, width 6/4/2.5 cm by stage, set at 60° with 17 cm showing. Fixed to "a few centimetres wide". | FIXED |
| Vests and impact-reduction gear | as in command copy | "impact-reduction vests for jumping and lance work" | Described as BSAH practice. No standard named. | OWNER |

## Label and image consistency

- The "Stirrup Iron & Pad" slide is titled "english-stirrup" in the asset path while the product copy speaks of cavalry kit. The type of stirrup shown should match the caption. Not verifiable without the image. OWNER.
- The /safety kit scroll names seven pieces (helmet, bridle, saddle, stirrups, whip, gloves, boots). The 3D model file `tack-parts.glb` has matching node names (helmet, bridle, saddle, stirrups, whip, gloves, boots) in the code. Whether each 3D piece looks like the real item was not reviewed. EXPERT.
- No unsafe or misleading instruction was found in the equipment or kit copy.

## Safety statements still needing a person

"A spotter on every mounted drill", "certified helmets and vests", "daily vet checks", "learn how to fall before they canter". These are programme commitments. They should be confirmed by BSAH operations and a qualified riding instructor before launch. HUMAN EXPERT REVIEW REQUIRED.
