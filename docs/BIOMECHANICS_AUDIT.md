# Biomechanics honesty audit: the Movement Laboratory

**Scope:** `/anatomy` → "Movement laboratory: horse and rider biomechanics" (also `/stride`). Component
`components/sections/stride/MovementLab.tsx`, content `lib/content/movement-lab.ts`. Audited 16 Nov 2026.

**Question asked of every figure:** is it calculated from the video, simulated, hard-coded, or unsupported?

## The finding in one paragraph

Exactly one quantity on the page is measured from the footage: the **stride period** of the side film (182 frames hold
six strides at 24 fps → 1.264 s a stride, 47.5 strides a minute), and with it the "% of the stride" clock. Every angle,
millimetre and degree on the old page was either a formula (`bio()`), a constant typed in from a retired 3D rig, or a
hard-coded caption. None was tracked from the film, and the film itself is a generated clip, not a recording of a real
horse. Those numbers are gone. What remains is labelled: measured (the period), published (the walk's footfall pattern and
the back's and rider's movement cycles, cited), or an educational simulation (the drawing over the film and the joint
diagrams, with no numbers).

## Verdicts

**Real:** measured from the film or derived from that measurement. **Illustrative:** a typical pattern or a drawing,
labelled as such. **Corrected:** kept, but its wording, anatomy, timing or position was wrong and is fixed. **Removed:**
fabricated precision, gone from the page.

| # | What the page showed | Where it came from (before) | Verdict | What the page shows now |
|---|---|---|---|---|
| 1 | "Four-beat walk · about 48 strides a minute" | Hard-coded header string | Corrected | "One stride every 1.26 s · about 47 a minute, measured from the side film", computed from `LAB_FILM.period` (60 / 1.264 = 47.5) |
| 2 | "Rider's seat: about 95 cycles a minute" | Hard-coded | Real (derived) | Tempo panel: "about 95", computed as 2 rises a stride (published) × the measured tempo |
| 3 | "NN% of the stride" (live) | `phaseOf()`: film time modulo the measured period | Real | Unchanged. Phase 0 = "left hind lands" is a stated convention; it is not detected in the film |
| 4 | "Frame N of 24" (live) | `STEPS = 24`, invented; the film has ≈30.3 frames a stride | Removed | Replaced by "Typical walk: N hooves down". "Back/Forward a frame" now steps one real film frame (1/24 s); before, it stepped 1/24 of a stride |
| 5 | "2 hooves down: LH LF" (live) | `LAB_STANCE`, hard-coded typical walk | Illustrative | "Typical walk: N hooves down · …"; the pattern was checked against the literature (row 23) |
| 6 | Elbow 102°–137° (readout, angle card, canvas badge "ELBOW xx°") | `bio()`: `102 + 35·(1 − cos((φ − 0.48)·2π))/2` | Removed | No degrees anywhere. The elbow arc and diagram remain as a captioned simulation, re-timed to the near fore's swing |
| 7 | Knee 108°–180° (readout, card, canvas badge "KNEE xx°") | `bio()`: `108 + 72·norm`. It put the carpus at its most flexed (108°) at 48 % of the stride, while the page's own footfall table has the left fore planted mid-stance then: a folded, weight-bearing carpus, which a walking horse does not do | Removed + Corrected | No degrees. Renamed **Carpus (knee)**. The diagram is straight while the hoof is down and folds only in the swing |
| 8 | Back pitch "+1.18°" (live) | `sin(φ·4π)·1.23`; the held value "+1.18" contradicts the formula at the held phase (it gives −0.31) | Removed | Not shown. The back's flexion–extension is described as two cycles a stride (Faber et al. 2000) |
| 9 | Seat lateral "+3.0 mm" (live) | `cos(…)·3`, i.e. ±3 mm, while the table claimed 15.7 mm | Removed | Not shown |
| 10 | "Range: 102° to 137°", "Range: 107° to 180°", "Carpal fold 107°–180°" | Hard-coded | Removed | Cards read "Folds in the swing" / "Straight under load"; bone labels "Humerus → radius", "Radius → cannon" |
| 11 | "Hold the 102° / 108° pose" | Hard-coded | Corrected | "Hold at half a stride" (phase 0.5) |
| 12 | Table: 3.2 / 3.1 mm, 14.0 / 15.7 mm, 8.9 / 12.5 mm, 2.46° / 2.39°, 1.66° / 1.64° | `LAB_TABLE`, typed in from the retired 3D rig | Removed | "What moves in each stride": qualitative rows from published studies, no measurements |
| 13 | Table "cycles a stride" 2, 1, 2, 2, 1 | `LAB_TABLE` | Corrected | Up and down 2, side to side 1, twist 1 (Faber et al. 2000); saddle tilt 2, with the rider's pelvis tilting the opposite way (Byström et al. 2010). The unsourced "forward and back" row is dropped |
| 14 | Part 01: "about 3.2 mm up and down … about 14 mm from side to side" | `LAB_PARTS` copy | Removed | Cycles a stride, cited |
| 15 | Part 03: "elbow opens from 102° to 137° and the knee from 107° to 180°" | `LAB_PARTS` copy | Removed | "While the hoof carries weight the carpus stays straight; it folds only once the hoof leaves the ground." |
| 16 | Part 05: "3.1 mm up and down, 15.7 mm side to side, 12.5 mm forward and back" | `LAB_PARTS` copy | Removed | "The saddle and rider follow the horse's movement in every direction" (Byström et al. 2010) |
| 17 | Part 06: "a planted hoof slips 0.2 cm at most" | `LAB_PARTS` copy | Removed | Landing order and support pattern, cited |
| 18 | Part 02: "The rider's pelvis answers a fraction of a beat later" | `LAB_PARTS` copy; no source | Corrected | "The rider's pelvis moves with the horse's in the same rhythm"; part 05 adds the published counter-tilt |
| 19 | Tempo "48 strides a minute · as filmed (the model is authored at 50)" | `LAB_TEMPO` | Corrected | "about 47 strides a minute · measured from the side film: one stride every 1.26 s" |
| 20 | "Hooves down at once: 2 to 3" | `LAB_TEMPO` | Illustrative (published) | Unchanged, sub-line "typical walk" |
| 21 | Planted hoof "0.2 cm at most (as authored 9.1 cm)", "3 cm/s at most (as authored 131 cm/s)" | `LAB_PLANTED`, from the retired rig | Removed | Replaced by the support pattern: three hooves just after each landing; two hooves as a lateral pair, then a diagonal pair |
| 22 | Landing order LH → LF → RH → RF at +0 / 25 / 50 / 75 % | Hard-coded `i * 25` | Illustrative (published) | Kept, headed "typical walk, about a quarter-stride apart" |
| 23 | Footfall bars (the scrubber) | `LAB_STANCE` | Illustrative (verified) | Kept, labelled "typical walk … timed to the side film's measured stride". Checked: lateral sequence; each hoof down 62 % of the stride (duty factor > 0.5); support runs 3, 2 (diagonal), 3, 2 (lateral), as the symmetrical walk should (Hildebrand 1965; Robilliard et al. 2007) |
| 24 | "Horse spine" (part name, panel heading); a gold "spine" drawn along the crest of the neck | `LAB_PARTS[0].name`; overlay bezier | Corrected | **Back (thoracolumbar spine)**. The gold line is called the **topline**; the copy says the neck's vertebrae run lower, in an S-curve, not along the crest |
| 25 | "Horse pelvis" | `LAB_PARTS` | Corrected | **Pelvis and croup (lumbosacral joint)** |
| 26 | "Shoulder"; "the shoulder, elbow and knee fold in turn" | `LAB_PARTS` | Corrected | **Shoulder and forelimb**; "the carpus (the horse's 'knee', which matches our wrist)"; notes the horse has no collarbone |
| 27 | Hindquarters copy | `LAB_PARTS` | Corrected | Adds the reciprocal apparatus (stifle and hock flex together) and "no moment of suspension"; LH at 0 % is stated as a convention |
| 28 | Landmarks on the film: "croup" (600, 427), withers (1087, 353), poll (1333, 200), elbow (1133, 627), rider heel (980, 620) | `LAB_LANDMARKS`, read off a grid | Corrected | Checked on frames at 0 s and 0.63 s: the old "croup" is the tail head (kept as `tailHead`); croup added at (690, 402); withers moved to just in front of the pommel (1066, 364); poll from the ear to behind it (1296, 214); elbow to the back of the forearm (1105, 636); heel from the stirrup to the boot heel (932, 628) |
| 29 | Part markers 01, 02, 06 | `LAB_PARTS[].at` | Corrected | 02 moved onto the hindquarters (630, 500); 06 from empty floor ahead of the horse (1330, 945) to the ground under the belly, where the hooves work (895, 955); 01 stays on the loin |
| 30 | Limb pendulums | `sin(φ·2π)` (hind) and `sin((φ − 0.48)·2π)` (fore), unrelated to the footfall table | Corrected (still a simulation) | Driven by the stance timing: each limb sweeps back while its hoof is down and swings forward in the air; the fore folds at the carpus in the swing |
| 31 | Topline bob, seat trace | Formulae, two cycles a stride | Illustrative | Kept: two rises a stride matches the published pattern; amplitudes are drawing values, not data |
| 32 | Hoof ripples under LH / RH / LF / RF | Fixed x positions | Illustrative | Kept on the side film only; spacing is schematic, not the hooves' tracked positions |
| 33 | Three-quarter view | The side film turned with CSS `rotateY(−18°)` | Removed | A real photograph (a cadet on a black horse), captioned as one |
| 34 | Behind / Front / Above views | The side film dimmed to 20 % under a canvas sketch with captions "(14.0 / 15.7 mm)", "(ELBOW 102° / KNEE 108°)" | Removed | Front and Above: looping footage. Behind: disabled, "Footage to follow". The overlay draws only on Side |
| 35 | Caveat "Illustrative: from the academy's stride model, not measured on this film" | `LAB_CAVEAT` | Corrected | States what is measured (the period), what is typical (footfall timing) and what is simulated (the drawing). A "Simulation · not tracked" tag sits on the side film |

## What would make the numbers real

Live joint angles, back pitch or seat displacement need tracking: markers or pose estimation on footage of a real horse,
filmed square-on at a known frame rate with a scale in shot, or IMUs on the saddle and rider (as in Byström et al.).
Until then the page shows none.

## Sources

1. Hildebrand M (1965). Symmetrical gaits of horses. *Science* 150:701–708. The walk as a symmetrical, lateral-sequence,
   four-beat gait.
2. Robilliard JJ, Pfau T, Wilson AM (2007). Gait characterisation and classification in horses. *J Exp Biol*
   210:187–197. doi:10.1242/jeb.02611. Footfall-pattern classification; the walk as a lateral-sequence gait with each
   foot on the ground for more than half the stride.
3. Faber M, Schamhardt H, van Weeren R, Johnston C, Roepstorff L, Barneveld A (2000). Basic three-dimensional kinematics
   of the vertebral column of horses walking on a treadmill. *Am J Vet Res* 61:399–406. doi:10.2460/ajvr.2000.61.399.
   "Flexion-extension was characterized by 2 periods of extension and flexion during 1 stride cycle, whereas lateral
   bending and axial rotation were characterized by 1 peak and 1 trough"; axial rotation largest at the pelvis.
4. Byström A, Rhodin M, von Peinen K, Weishaupt MA, Roepstorff L (2010). Kinematics of saddle and rider in high-level
   dressage horses performing collected walk on a treadmill. *Equine Vet J* 42:340–345.
   doi:10.1111/j.2042-3306.2010.00063.x. In the first half of each hind-limb stance the saddle rotated forward and the
   rider's pelvis rotated the opposite way; "the movements of the saddle and rider are clearly related to the movements
   of the horse, both within and outside the sagittal plane."
5. Back W, Clayton HM (eds) (2013). *Equine Locomotion*, 2nd ed. Saunders Elsevier. General reference for limb
   mechanics (carpus straight in stance, flexed in swing; the reciprocal apparatus).

The same sources are listed in the header comment of `lib/content/movement-lab.ts`.
