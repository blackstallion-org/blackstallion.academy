# Final content release gate

Audit date 4 November 2026. Companion files: PRELAUNCH-FACT-CHECK.md (50 findings with sources), HORSE-ANATOMY-VERIFICATION.md, EQUIPMENT-VERIFICATION.md, HISTORY-VERIFICATION.md.

## Recommendation: CONDITIONAL PASS, do not publish as "factually verified" yet

The text corrections that could be made from fetched sources are done. The site is **not** declared factually verified, because one critical institutional claim and several expert-review items remain open.

## What was done

- Read the content files (legend, anatomy, science, stride, peg, bronze, covenant, fleet, journal, curriculum, records, mou, museum, india-map, command excerpts), the equipment and safety components, and grepped the app for institutional and numeric claims.
- Fetched and compared 15 sources (list in PRELAUNCH-FACT-CHECK.md). Most are tertiary (Wikipedia). The ITPF rulebook is primary for tent pegging.
- Fixed 27 text items in 22 files: shipwreck legend, Kala vow wording, "albino", colour registry label and Nukra, breed colours and height, weights ("500 kg" to "several hundred kilograms"), the 10 g / 500 kg scale graphic, ears "audible", flank definition, peg size and lance length and lane length and speed and scoring and origin wording, "50° desert hoof angle", hand/drop-forged, saddle claim, the 20-minute vs 45-minute comparison, "dopamine burnout", the Chetak-at-Haldighati statement, and "most accepted" origin wording.
- No change to design, layout, animation, 3D models, auth, database or forms.

## Validation results

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | Pass, no errors |
| ESLint on content, sections and /why | 1 error (`components/sections/safety/KitStage.tsx:68`, React hook mutation rule; file not touched by this audit), 8 warnings in files not touched here |
| `node --test tests/*.test.mjs` | 272 of 276 pass. The 4 failures are asset-path and media-manifest tests about `/images/academy-uniforms/*` and the committed manifest; unrelated to these text edits |
| Affected routes (/, /legend, /fleet, /tournaments, /story/pratap-chetak, /equipment, /why, /anatomy, /curriculum, /safety, /stride, a journal post) | All return 200 in the browser and contain the corrected text; no "Projector fault" |
| Journal post `/journal/ten-grams-of-rein` | Source is corrected, but the running dev server still served the old cached page ("half a tonne"). Restart the dev server or rebuild, then re-check; production builds regenerate it |
| Anatomy hotspots, desktop | Saddle spine, flank and fetlock markers aligned on the 3D plate. Ears and neck not re-checked |
| Mobile interaction | Not tested in this audit |
| Image loading | Spot-checked only on the pages viewed |

## Open items

### Release blocker (owner evidence required)

1. **STPCI (School Tent Pegging Council of India).** Presented as the governing, sanctioning and accrediting body on the home page badge, footer, tournaments, verify page, schools, MOU and the passport. No independent record of this body was found in the ITPF rules, Wikipedia or a general web search. The Command terminal already says recognition is "being confirmed". Provide registration or recognition documents, or reword every public use to "planned" or "proposed". Until then the claim is UNVERIFIED and a misleading institutional claim risk (critical).

### High, owner or legal

2. EFI registration and "EFI junior pathway": EFI is real; BSAH's relationship to it is not shown.
3. "Ex-cavalry instructors recruited from RVC, 61st Cavalry, NCC" on safety and schools pages is stated more strongly than the Command and map pages ("no agreement signed").
4. The draft MOU promises group accident insurance while public pages say terms "are being confirmed".
5. Equipment product specifications (tread width, ply, rings, saddle) must match the real kit.

### Medium

6. Brand line "Ten grams" (hotspot title, article, Veer quote) has no source; the numeric graphic and the legend line were fixed.
7. Screen-use causal claims on /why and the Crucible have no source.
8. Anecdotes with named real people or ballads (Badgaon/Vangalia, Kesar Kalmi, Udal, Nachni, "general's horse") are labelled but UNVERIFIED.
9. Coat names (Bhanwar/Telia Kumat, Surang, Kagra, Ablak) not found in fetched sources.
10. Pendry et al.: co-authors, volume and pages not confirmed; the programme was horse handling, care and riding, not riding alone.
11. Origin and 50,000-cavalry statements rest on Wikipedia only.

### HUMAN EXPERT REVIEW REQUIRED

12. Equine veterinarian or anatomist: skeleton and muscle layers, ear carriage and curl, limb and joint ranges in walk and trot, fetlock and hoof statements.
13. Farrier and saddler: hoof balance wording, kit fit-check wording.
14. Riding-safety instructor: helmet, vest, whip, spotter and "learn to fall" statements.
15. Rajasthani cultural historian: Pratap, Rathore and Nachni passages.
16. 3D artist: golden patch artefacts on the coat in the plate lighting; the open "fix those eyes" request (`components/3d/marwari-eye.ts`).

### Out of scope here

Financial figures (capex, revenue share, fees), the parents page captions, video and audio, admin and registration copy.

## Release rule

Do not describe the site as "factually verified" until items 1 to 5 are resolved or reworded and the expert reviews in 12 to 15 are done. Then re-run this audit's table for the changed rows.
