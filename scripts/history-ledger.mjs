#!/usr/bin/env node
/**
 * Builds docs/history-scrolls/ASSET_LEDGER.json: the 100 master images of the history scrolls with their Higgsfield
 * prompts. Re-running keeps each existing entry's status, review, version, path dimensions and job id; only prompts and
 * alt text are refreshed. Usage: node scripts/history-ledger.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const OUT = "docs/history-scrolls/ASSET_LEDGER.json";

const STYLE =
  "Indian miniature painting in the Rajput and Mughal manner, fine ink contours, opaque watercolour gouache surfaces, layered elevated perspective, painted textile patterns, restrained gold highlights, palette of indigo, malachite green, vermilion, gold and ivory on aged paper.";
const STYLE_ANCIENT =
  "Persian and Mughal manuscript miniature painting, fine ink contours, opaque watercolour gouache surfaces, layered elevated perspective, restrained gold highlights, palette of lapis, malachite green, vermilion, gold and ivory on aged paper.";

const B = (d) => `Background plate: ${d}. Wide landscape, the lower fifth calm and simple so a foreground can overlap it, no people unless described. No text, no lettering, no border, no frame.`;
const S = (d, horse = true) =>
  `A single cutout subject on a fully transparent background: ${d}.${horse ? " The complete horse is visible: head, all four legs and hooves, full tail." : ""} Nothing cropped. No ground, no shadow, no background, no text.`;
const F = (d) => `Foreground strip on a fully transparent background: ${d}, running across the full width along the bottom, irregular upper edge, transparent above. No people, no animals, no text, no border.`;

const SPEC = {
  B: { width: 2400, height: 1350, alpha: false, gen: { resolution: "2k", aspect_ratio: "16:9", background: "opaque" } },
  S: { width: 1168, height: 880, alpha: true, gen: { resolution: "1k", aspect_ratio: "4:3", background: "transparent" } },
  F: { width: 1344, height: 576, alpha: true, gen: { resolution: "1k", aspect_ratio: "21:9", background: "transparent" } },
  opening: { width: 2400, height: 1350, alpha: false, gen: { resolution: "2k", aspect_ratio: "16:9", background: "opaque" } },
};

/** [id, group, style, background, subject, subjectHasHorse, foreground, subjectAlt, backgroundAlt] */
const SCENES = [
  ["JH01", "lakshmibai", STYLE, "the fort of Jhansi with its stone ramparts and bastions crowning a single rocky granite hill above a walled town of flat-roofed houses, a tank of water at the foot, the open Bundelkhand plain with scattered trees, deep indigo evening sky with stylised cloud bands", "a mid-nineteenth-century Maratha queen of Jhansi riding a bay horse at a calm walk, side view facing left, she wears a fitted riding garment in vermilion and ivory with a sash and a sheathed sword, head covered with a turban-like wrap, calm and upright, painted tack with tassels", true, "a low band of rounded granite boulders, thorny babul shrubs and tufts of grass in ochre, malachite green and umber", "Rani Lakshmibai rides a bay horse at a walk, in vermilion and ivory, a sword at her side", "Jhansi fort on its rocky hill above the town, at dusk"],
  ["JH02", "lakshmibai", STYLE, "the riverside court at Bithur on the Ganges in the 1830s, a walled garden courtyard with a pavilion, a dusty riding ground beside it, bathing ghats and the broad river beyond, warm morning light", "a girl of about twelve in a simple ivory and saffron riding dress with a sash riding a grey pony at a collected canter, side view facing right, holding a wooden practice sword raised", true, "a low garden hedge of clipped shrubs, marigolds and a stone edging", "A girl of about twelve canters a grey pony, a practice sword raised", "A riverside court and riding ground at Bithur on the Ganges"],
  ["JH03", "lakshmibai", STYLE, "the interior of a Maratha palace hall at Jhansi in the 1850s shown in cutaway, painted arches, carpets, a low cushioned seat of state, latticed windows looking out to the fort", "Rani Lakshmibai seated upright on a low cushion, dressed in an ivory sari with a vermilion border, holding a folded letter, a small boy of about five standing beside her", false, "the edge of a patterned carpet with a row of brass lamps and bolsters", "Rani Lakshmibai seated with a letter, her adopted son beside her", "A painted palace hall at Jhansi"],
  ["JH04", "lakshmibai", STYLE, "the ramparts and a gateway of Jhansi fort in daylight, masons repairing a stone bastion, a bronze cannon on its wooden carriage on the wall, the town below", "Rani Lakshmibai on a grey horse standing still, three-quarter view, one hand raised as she gives instructions, quilted riding coat and turban", true, "a pile of cut building stone, cannonballs stacked in a pyramid and coils of rope", "Rani Lakshmibai on a grey horse, giving instructions", "Masons repair the walls of Jhansi fort; a cannon on the rampart"],
  ["JH05", "lakshmibai", STYLE, "Jhansi fort on its hill seen from far across the plain, the walls wreathed in stylised grey smoke from distant guns, siege tents shown very small in the distance, overcast ochre sky, nothing graphic", "three defenders on a short section of crenellated stone rampart, Indian soldiers in white and saffron aiming matchlocks over the parapet beside a cannon, side view, no blood", false, "stylised curling grey and ochre smoke clouds", "Defenders on the rampart of Jhansi fort", "Jhansi fort under siege, seen from far across the plain"],
  ["JH06", "lakshmibai", STYLE, "Jhansi fort at night seen from below, a tall stone wall and bastion against a deep indigo sky with stars and a crescent moon, a few torches on the wall, the dark plain", "Rani Lakshmibai galloping on a dark bay horse at night, side view facing right, a boy of about eight seated behind her holding on, a shawl wrapped around them both, mane flying", true, "dark thorny scrub and rocks in indigo shadow with a few fireflies", "Rani Lakshmibai gallops into the night, her son seated behind her", "The walls of Jhansi fort at night under a crescent moon"],
  ["JH07", "lakshmibai", STYLE, "the great sandstone fort of Gwalior on its long flat-topped cliff above the plain at dusk, gardens and a river in the middle distance, a road winding toward it", "Rani Lakshmibai in a quilted riding coat and turban, sword sheathed, riding a grey horse at a steady trot, side view facing left", true, "a line of tall grasses and a small roadside shrine stone with a marigold garland", "Rani Lakshmibai rides a grey horse toward Gwalior", "Gwalior fort on its cliff at dusk"],
  ["JH08", "lakshmibai", STYLE, "a quiet memorial garden in Gwalior at sunset, a stone platform with a small domed chhatri, flowering trees and birds", "a bronze equestrian statue of a queen on a rearing horse with a sword raised, standing on a stone plinth, painted as a statue in miniature style", true, "a bed of marigolds and tulsi plants with a small clay oil lamp", "A bronze statue of Rani Lakshmibai on horseback", "A memorial garden in Gwalior at sunset"],

  ["AL01", "alexander", STYLE_ANCIENT, "a horse fair on a plain in ancient Macedonia, painted tents and wooden enclosures, onlookers far off, mountains behind", "a large black horse with a white star on its forehead rearing wildly in side view, a Thessalian horse dealer in a short tunic and broad hat pulling at the lead rope, startled", true, "trampled grass, a wooden fence rail and a fallen water jar", "A black horse rears as a horse dealer pulls at the rope", "A horse fair on a plain in ancient Macedonia"],
  ["AL02", "alexander", STYLE_ANCIENT, "an open grassy plain in ancient Macedonia under a low gold sun disc, distant blue-green hills, a few stylised cypress trees, a small tented enclosure far off, pale lapis and ivory sky", "a young Macedonian youth in a short ivory chiton and a vermilion cloak holding the bridle of a large powerful black horse with a white star on its forehead, turning the horse's head toward the sun, the horse calm and attentive", true, "flowering meadow grasses, poppies and small shrubs with stylised leaves in malachite, vermilion and gold", "Young Alexander turns Bucephalus to face the sun", "A Macedonian plain under a low gold sun"],
  ["AL03", "alexander", STYLE_ANCIENT, "the stable yard of an ancient Macedonian palace in morning light, a colonnade, a stone water trough, a plane tree, hills beyond", "a young man of about sixteen in a short tunic grooming a black horse with a white star with a cloth, the horse standing calmly with its head lowered towards him, side view", true, "straw, a wooden bucket, a basket of barley and a brush", "Alexander grooms Bucephalus in the stable yard", "A palace stable yard in Macedon"],
  ["AL04", "alexander", STYLE_ANCIENT, "a painted landscape seen from high above: the narrow strait of the Hellespont with small ships crossing, the coast of Asia Minor, fields and roads leading inland, lapis sea", "a young king in a bronze cuirass and helmet with a white crest riding a black horse with a white star at a walk, side view facing right, a long spear held upright", true, "waves breaking on rocks and the painted prow of a beached ancient ship", "Alexander in armour rides Bucephalus", "The Hellespont strait with ships crossing to Asia"],
  ["AL05", "alexander", STYLE_ANCIENT, "the high snow-covered passes of the Hindu Kush, steep mountains in blue and white with a winding path, a long column of tiny figures and pack animals in the far distance", "two Central Asian herders in felt caps and long coats leading a calm black horse with a white star, one holding out the bridle in a gesture of return, side view", true, "snow-dusted rocks and juniper shrubs", "Two herders return Bucephalus", "Snowy passes of the Hindu Kush"],
  ["AL06", "alexander", STYLE_ANCIENT, "the wide Hydaspes river in monsoon flood under a dark storm sky with diagonal rain, a wooded island, war elephants and tents shown very small on the far bank, nothing graphic", "a tall bearded Indian king in a turban seated upright in a howdah on a large armoured war elephant, side view facing left, dignified, the complete elephant visible with all four legs, trunk and tail", false, "reeds and rushes at the river's edge, rain-swept", "King Porus on his war elephant", "The Hydaspes river in flood under a storm"],
  ["AL07", "alexander", STYLE_ANCIENT, "the bank of the Hydaspes at dusk after the storm, purple and gold sky, calm water, a few campfires far away", "a young king kneeling beside an old black horse with a white star lying peacefully on its side, his hand on the horse's neck, quiet grief, no wounds", true, "river reeds and lotus leaves in shadow", "Alexander kneels beside Bucephalus", "The river bank at dusk"],
  ["AL08", "alexander", STYLE_ANCIENT, "a new city being laid out on a river bank in Punjab, mud-brick walls and a colonnade under construction, workers with tools, green plain and distant hills", "a painted stone statue of a standing black horse with a white star on a carved plinth", true, "building blocks, a marble column drum and flowering grasses", "A statue of Bucephalus on a plinth", "A new city rising on the river bank"],

  ["IN01", "india", STYLE, "the Thar desert near Jodhpur: golden dunes, khejri trees, a sandstone fort on a rocky ridge in the far distance, a pale sky", "a Rathore horseman in a saffron turban and white angarkha riding a black Marwari horse whose inward-curving ear tips touch, side view facing left, calm walk, embroidered saddle cloth", true, "ripple-marked sand, desert grasses, a khejri sapling and a clay water pot", "A Rathore horseman on a black Marwari, its ear tips touching", "Dunes of the Thar with a fort on a distant ridge"],
  ["IN02", "india", STYLE, "the courtyard of a royal stable in Rajasthan, arched stalls along a wall with horses looking out, a neem tree and a well", "an elderly horse doctor in white with a turban examining the foreleg of a calm chestnut horse, a young apprentice beside him holding an open palm-leaf manuscript, side view", true, "brass bowls of herbs, a stone mortar and bundles of fodder", "A horse doctor examines a chestnut horse; an apprentice holds a manuscript", "A royal stable courtyard in Rajasthan"],
  ["IN03", "india", STYLE, "the steep Sahyadri ridges of the Western Ghats in monsoon green, a hill fort with walls following the cliff edge on a summit, waterfalls, a narrow ghat road climbing", "a Maratha light cavalryman in a white tunic and saffron turban with a lance riding a small sure-footed bay horse up a slope, side view facing right", true, "wet black basalt rocks, ferns and flowering karvi shrubs", "A Maratha horseman climbs a ghat road on a bay horse", "Hill forts on the ridges of the Sahyadri"],
  ["IN04", "india", STYLE, "a vast Deccan plain at dawn, a winding dusty road disappearing north, a river ford, distant flat-topped hills", "two Maratha horsemen riding side by side at a brisk canter with light kit and saddle rolls, side view facing right, both horses complete", true, "roadside dust, acacia shrubs and a stone milestone", "Two Maratha horsemen at a canter", "A Deccan road at dawn running north"],
  ["IN05", "india", STYLE, "the stables of a Sikh royal court at Lahore in the 1830s, an arcaded courtyard of red sandstone and marble, fountains and a garden pavilion", "a magnificent grey horse in jewelled trappings of gold and embroidered velvet led by a groom in a white turban and kurta, side view facing left", true, "a marble fountain edge with roses and cypress saplings", "A grey horse in jewelled trappings led by a groom", "The royal stables at Lahore"],
  ["IN06", "india", STYLE, "an open green polo ground in Imphal ringed by trees and low wooden pavilions, blue hills of Manipur behind", "a Manipuri polo player in traditional dress with a white turban and leg guards riding a small sturdy pony at a gallop, mallet raised, side view facing right", true, "grass tufts, a bamboo boundary rail and a polo ball", "A Manipuri player gallops a pony, mallet raised", "The polo ground at Imphal"],
  ["IN07", "india", STYLE, "the coastal plain below Mount Carmel and the town of Haifa in 1918, the Kishon river and marshy ground, the bay beyond, no fighting visible", "an Indian cavalryman of the Jodhpur Lancers in a khaki tunic and tall turban riding a bay horse at a gallop with lance lowered, side view facing left", true, "marsh reeds and wild flowers along a riverbank", "A Jodhpur Lancer gallops with lance lowered", "Haifa and the Kishon river below Mount Carmel"],

  ["WO01", "world", STYLE_ANCIENT, "the countryside of ancient Attica with olive groves, a farmhouse and a training ground, the Acropolis faint in the distance", "a bearded Athenian man in a himation calmly leading a nervous bay horse by the bridle and stroking its neck, side view facing right", true, "olive saplings, rocks and wild thyme", "Xenophon calms a nervous bay horse", "Olive groves of Attica"],
  ["WO02", "world", STYLE_ANCIENT, "a high mountain pass in the Pamirs, snow peaks, a valley path, a caravanserai far off", "a caravan horse loaded with bales of silk led by a Central Asian merchant in a long robe and fur hat, side view facing left", true, "rocky scree, alpine flowers and a cairn of stones", "A merchant leads a horse loaded with silk", "A mountain pass of the Pamirs"],
  ["WO03", "world", STYLE_ANCIENT, "a relay station on the Mongolian steppe: round felt tents, a corral of horses, endless grassland and distant hills under a wide sky", "a Mongol messenger in a deel robe and fur-trimmed hat galloping on a stocky dun Mongolian horse, side view facing right, a small tablet hanging from his belt", true, "steppe feather grass and a wooden hitching post", "A Mongol messenger gallops on a dun horse", "A relay station on the steppe"],
  ["WO04", "world", STYLE_ANCIENT, "a Bedouin encampment in the Arabian desert at evening, long black goat-hair tents, palms and dunes", "a grey Arabian mare with a dished face standing calmly while a Bedouin girl in a dark robe offers her water from a bowl, side view", true, "the edge of a woven rug, a brass coffee pot and sand", "A Bedouin girl offers water to a grey mare", "A Bedouin camp in the desert at evening"],
  ["WO05", "world", STYLE_ANCIENT, "the open Eurasian steppe in autumn, golden grass, low hills and a river", "a steppe mounted archer in a felt cap and belted coat riding a chestnut horse at a gallop, drawing a short recurve bow and shooting backwards over the horse's tail, side view facing right", true, "feather grass and thistles", "A mounted archer shoots backwards at the gallop", "The steppe in autumn"],
  ["WO06", "world", STYLE_ANCIENT, "a high Alpine pass in 1800, snowy peaks and a rocky road, troops shown very small far away", "a small grey Arab stallion with a French officer's saddle and a dark blue saddle cloth, standing alert and riderless, side view facing left", true, "snow-covered rocks and pine branches", "A small grey Arab stallion in a French officer's saddle", "A snowy pass in the Alps"],
  ["WO07", "world", STYLE_ANCIENT, "a First World War army veterinary hospital behind the lines in France: rows of canvas tents and timber horse lines, a muddy field, a barn, grey sky", "a veterinary orderly in a khaki uniform bandaging the foreleg of a patient bay draught horse standing quietly, side view", true, "duckboards, a bucket, a hurricane lantern and mud", "An orderly bandages a bay horse's foreleg", "A veterinary hospital behind the lines"],
];

const OPENINGS = [
  ["IN00", "india", STYLE, "a vast panoramic landscape seen from above, from the dunes of the Thar with a sandstone fort on the left, through green hills and rivers in the middle, to distant blue mountains on the right, small groups of riders and horses travelling along winding roads, deep indigo sky with a gold sun, calm uncluttered upper third", "A painted panorama of India, from desert to mountains, with riders on the roads"],
  ["WO00", "world", STYLE_ANCIENT, "a vast panoramic landscape seen from above, from Greek islands and temples on the left, across deserts with caravans and tents, through high snow mountains, to grassy steppe with herds of horses on the right, lapis sky with a gold sun, calm uncluttered upper third", "A painted panorama of the world, from Greek islands to the steppe"],
];

const SHARED = [
  ["SH01", "Seamless tileable texture of handmade aged wasli paper used for Indian miniature paintings: warm ivory with faint fibres, subtle mottled burnishing and light foxing, even lighting, flat, no folds, no objects, no text.", false, "1:1"],
  ["SH02", "Indian miniature painting border strip on a fully transparent background: a continuous floral scroll of gold vines and small vermilion and malachite flowers between two thin gold rules, perfectly horizontal, no text.", true, "21:9"],
  ["SH03", "Indian miniature painting ornament on a fully transparent background: a single symmetrical gold and lapis rosette with lotus petals, centred, no text.", true, "1:1"],
  ["SH04", "Indian miniature painting element on a fully transparent background: a horizontal band of stylised curling ivory and pale gold clouds with fine ink outlines, no text.", true, "21:9"],
  ["SH05", "Indian miniature painting element on a fully transparent background: a loose scatter of tiny gold dust motes and small painted petals, sparse, no text.", true, "1:1"],
  ["SH06", "Indian miniature painting element on a fully transparent background: a horizontal band of stylised water ripples and small waves drawn in fine indigo and ivory lines, no text.", true, "21:9"],
  ["SH07", "Indian miniature painting element on a fully transparent background: a loose flock of seven small birds in flight, painted in ink with touches of gold, no text.", true, "21:9"],
  ["SH08", "Indian miniature painting element on a fully transparent background: the scalloped hanging edge of an embroidered textile canopy in vermilion and gold with tassels, perfectly horizontal along the top, no text.", true, "21:9"],
];

const prior = existsSync(OUT) ? Object.fromEntries(JSON.parse(readFileSync(OUT, "utf8")).assets.map((a) => [a.id, a])) : {};

const entry = (id, role, group, prompt, alt, spec) => {
  const p = prior[id] ?? {};
  return {
    id,
    role,
    path: p.path ?? `/images/history/${group}/${id.toLowerCase()}.webp`,
    width: p.width ?? spec.width,
    height: p.height ?? spec.height,
    alpha: spec.alpha,
    alt,
    focal: p.focal ?? (role === "B" || role === "opening" ? "50% 60%" : undefined),
    version: p.version ?? 1,
    status: p.status ?? "pending",
    prompt,
    generation: { model: "gpt_image_2_6", quality: "medium", ...spec.gen, ...(p.generation?.job_id ? { job_id: p.generation.job_id } : {}) },
    ...(p.review ? { review: p.review } : {}),
  };
};

const assets = [];
for (const [id, group, style, prompt, alt] of OPENINGS) assets.push(entry(id, "opening", group, `${style} Opening plate: ${prompt}. No text, no lettering, no border, no frame.`, alt, SPEC.opening));
for (const [id, group, style, b, s, horse, f, sAlt, bAlt] of SCENES) {
  assets.push(entry(`${id}-B`, "B", group, `${style} ${B(b)}`, bAlt, SPEC.B));
  assets.push(entry(`${id}-S`, "S", group, `${style} ${S(s, horse)}`, sAlt, SPEC.S));
  assets.push(entry(`${id}-F`, "F", group, `${style} ${F(f)}`, "", SPEC.F));
}
for (const [id, prompt, alpha, aspect] of SHARED) {
  const [w, h] = aspect === "1:1" ? [1024, 1024] : [1344, 576];
  assets.push(entry(id, "shared", "shared", prompt, "", { width: w, height: h, alpha, gen: { resolution: "1k", aspect_ratio: aspect, background: alpha ? "transparent" : "opaque" } }));
}

if (assets.length !== 100) throw new Error(`Expected 100 masters, built ${assets.length}`);
writeFileSync(OUT, `${JSON.stringify({ note: "100 master images. Only status 'accepted' with an existing file and a review renders as art; everything else shows a labelled development placeholder.", assets }, null, 2)}\n`);
console.log(`Wrote ${assets.length} masters to ${OUT}`);
