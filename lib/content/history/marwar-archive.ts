/**
 * The Marwar archive: every genuine photograph and period painting on /history/marwar, with provenance.
 *
 * Single source of truth. `scripts/marwar-archive-manifest.mjs` writes
 * output/imagegen/marwar-story/british-archive/manifest.json and README.md from this file, so the page credits and the
 * archive manifest can never disagree. Masters (git-ignored) live in output/imagegen/marwar-story/british-archive/masters;
 * every master's SHA-1 below was matched against the Wikimedia Commons original on 16 November 2026.
 *
 * Pure data, no imports: node reads it directly (type stripping).
 */

export type ArchiveKind = "photograph" | "painting";

export type ArchiveItem = {
  /** File id: public/images/history/marwar/archive/<id>.webp */
  id: string;
  /** Plate number shown on the page (chronological). */
  plate: number;
  kind: ArchiveKind;
  /** Short display title. */
  title: string;
  /** Title exactly as catalogued by the holding institution. */
  catalogued: string;
  /** Display date. */
  date: string;
  /** Sort year. */
  year: number;
  dateNote?: string;
  creator: string;
  holder: string;
  reference: string;
  /** Wikimedia Commons file page (the verified source of the master). */
  source: string;
  /** The holding institution's own record, where one is linkable. */
  record?: string;
  licence: string;
  credit: string;
  /** Who is shown, only as the catalogue identifies them. */
  identification?: string;
  alt: string;
  width: number;
  height: number;
  master: string;
  sha1: string;
  chapter: string;
  /** False when the item is kept in the archive but not shown on the page (e.g. a near-duplicate frame). */
  show?: boolean;
  /** CSS object-position for crops. */
  focal?: string;
};

const BL = "British Library, Girdwood Collection";
const BL_LICENCE = "No known copyright restrictions (British Library, Flickr Commons)";
const ROL = "Agence Rol (press agency)";
const BNF = "Bibliothèque nationale de France, Estampes et photographie";
const PD_FR = "Public domain (PD-France)";

export const archive: ArchiveItem[] = [
  {
    id: "104",
    plate: 1,
    kind: "painting",
    title: "Maharaja Man Singh visits the Mahamandir",
    catalogued: "Maharaja Man Singh of Jodhpur Visits the Mahamandir",
    date: "1815",
    year: 1815,
    creator: "Attributed to Bulaki, Jodhpur court painter",
    holder: "Philadelphia Museum of Art",
    reference: "Accession number not given on the Commons record",
    source: "https://commons.wikimedia.org/wiki/File:Bulaki_(attr.)_Maharaja_Man_Singh_of_Jodhpur_Visits_the_Mahamandir%D1%8E_1815,_Philadelphia_Museum_of_Art.jpg",
    licence: "Public domain",
    credit: "Attr. Bulaki, 1815 · Philadelphia Museum of Art · public domain",
    identification: "Maharaja Man Singh of Jodhpur, in whose name the treaty of 1818 with the East India Company was concluded.",
    alt: "A Jodhpur court painting: a white temple at the centre of a walled garden, the maharaja and courtiers before a seated teacher, horsemen and elephants in procession at right.",
    width: 1500,
    height: 1087,
    master: "104-man-singh-mahamandir-bulaki-1815.jpg",
    sha1: "fdecf025806bbd8d26458bbd74febdae7481ce10",
    chapter: "arrival",
  },
  {
    id: "101",
    plate: 2,
    kind: "photograph",
    title: "Jaswant Singh II, Maharaja of Jodhpur",
    catalogued: "H.H. the Maharaja of Jodhpur, G.C.S.I.",
    date: "c. 1876–77",
    year: 1876,
    dateNote: "Woodburytype book plate printed from a Bourne & Shepherd photograph; the printed page is shown whole.",
    creator: "Bourne & Shepherd",
    holder: "Rijksmuseum, Amsterdam",
    reference: "RP-F-2001-7-1124-18",
    source: "https://commons.wikimedia.org/wiki/File:Portret_van_Jaswant_Singh_II_H.H._the_Maharaja_of_Jodhpur,_G.C.S.I._(titel_op_object),_RP-F-2001-7-1124-18.jpg",
    record: "http://hdl.handle.net/10934/RM0001.COLLECT.631444",
    licence: "CC0 1.0 (public domain dedication)",
    credit: "Bourne & Shepherd, c. 1876–77 · Rijksmuseum RP-F-2001-7-1124-18 · CC0",
    identification: "Jaswant Singh II, Maharaja of Jodhpur 1873–1895, as captioned on the plate.",
    alt: "A full-length studio portrait of the Maharaja of Jodhpur in a long white robe and jewelled turban, one hand on a sword, draped textiles behind him, on a ruled book page.",
    width: 1656,
    height: 2400,
    master: "101-jaswant-singh-ii-bourne-shepherd-c1877.jpg",
    sha1: "a982b901e0ff552c1efdfbb2aae71720c8c7625d",
    chapter: "crown",
  },
  {
    id: "102",
    plate: 3,
    kind: "photograph",
    title: "Mehrangarh Fort above Jodhpur",
    catalogued: "Mehrangarh Fort",
    date: "Published 1903",
    year: 1903,
    creator: "Kurt Boeck",
    holder: "Published in Boeck, Durch Indien ins verschlossene Land Nepal (1903)",
    reference: "Kurt boeck indien nepal 139",
    source: "https://commons.wikimedia.org/wiki/File:Kurt_boeck_indien_nepal_139.jpg",
    licence: "Public domain",
    credit: "Kurt Boeck, published 1903 · public domain",
    alt: "Mehrangarh Fort on its rock above the flat roofs of Jodhpur.",
    width: 2400,
    height: 1708,
    master: "102-mehrangarh-fort-boeck-1903.jpg",
    sha1: "adbff133ed7a469456ad5b9a030d1aad28a00733",
    chapter: "crown",
  },
  {
    id: "103",
    plate: 4,
    kind: "photograph",
    title: "The parade elephant of the Maharaja of Jodhpur",
    catalogued: "Parade elephant of the maharaj of Jodhpur",
    date: "Published 1903",
    year: 1903,
    creator: "Kurt Boeck",
    holder: "Published in Boeck, Durch Indien ins verschlossene Land Nepal (1903)",
    reference: "Kurt boeck indien nepal 145",
    source: "https://commons.wikimedia.org/wiki/File:Kurt_boeck_indien_nepal_145.jpg",
    licence: "Public domain",
    credit: "Kurt Boeck, published 1903 · public domain",
    alt: "A state elephant in an embroidered caparison with a canopied howdah and a mahout, standing on a dusty road.",
    width: 1920,
    height: 1456,
    master: "103-jodhpur-state-elephant-boeck-1903.jpg",
    sha1: "f9e858b16c3855187be3ac5cf49683314974ba5c",
    chapter: "crown",
  },
  {
    id: "007",
    plate: 5,
    kind: "photograph",
    title: "The Maharaja of Idar: Sir Pratap Singh",
    catalogued: "Hon. Maj. Gen. H.H. Maharaja of Idar A.D.C. to the king-emperor",
    date: "c. 1902–1911",
    year: 1902,
    dateNote: "Undated. A Rotary Photo postcard copied by the Bain News Service; the range is inferred from the title printed on the card.",
    creator: "Rotary Photographic Co. (postcard); Bain News Service (publisher)",
    holder: "Library of Congress, George Grantham Bain Collection",
    reference: "LCCN 2014686427",
    source: "https://commons.wikimedia.org/wiki/File:Hon._Maj._Gen._H.H._Maharaja_of_Idar_A.D.C._to_the_king-emperor_LCCN2014686427.jpg",
    record: "https://lccn.loc.gov/2014686427",
    licence: "Public domain (no known restrictions)",
    credit: "Bain News Service · Library of Congress, LCCN 2014686427 · public domain",
    identification: "Catalogued only as the Maharaja of Idar. From 1902 to 1911 that title belonged to Sir Pratap Singh of Jodhpur, an honorary major-general from 1902; the identification follows from the printed title.",
    alt: "A postcard portrait of the Maharaja of Idar in court dress: a white robe and long cloak, jewelled turban, orders and a sash across his chest, the printed title below.",
    width: 1748,
    height: 2400,
    master: "007-pratap-singh-bain-portrait-c1900.jpg",
    sha1: "d709f468350ea1a9f44f820c9d126b01810fde16",
    chapter: "commander",
    focal: "50% 22%",
  },
  {
    id: "001",
    plate: 6,
    kind: "photograph",
    title: "Officers of the Jodhpur Lancers",
    catalogued: "Officers of the Jodhpur Lancers [Linghem, France]",
    date: "28 July 1915",
    year: 1915,
    creator: "H. D. Girdwood",
    holder: BL,
    reference: "Photo 24/(157)",
    source: "https://commons.wikimedia.org/wiki/File:Officers_of_the_Jodhpur_Lancers_(Linghem,_France)._Photographer-_H._D._Girdwood._(13874581174).jpg",
    licence: BL_LICENCE,
    credit: "H. D. Girdwood, 1915 · British Library Photo 24/(157)",
    alt: "Officers of the Jodhpur Lancers seated and standing in rows beneath trees, a few British officers in peaked caps among them.",
    width: 2400,
    height: 1840,
    master: "001-jodhpur-lancers-officers-linghem-1915.jpg",
    sha1: "bb1c77a0230170c2e8fd94032429245da795572f",
    chapter: "lancers",
  },
  {
    id: "005",
    plate: 7,
    kind: "photograph",
    title: "Gen. Rimington, Sir Pratap Singh and the Raja of Ratlam riding",
    catalogued: "Gen. Rimington, Sir Partab Singh, & the Rajah of Rutlam riding in France [Linghem]",
    date: "28 July 1915",
    year: 1915,
    creator: "H. D. Girdwood",
    holder: BL,
    reference: "Photo 24/(153)",
    source: "https://commons.wikimedia.org/wiki/File:Gen._Remington,_Sir_Partab_Singh,_%26_the_Rajah_of_Rutlam_riding_in_France_(Linghem)._Photographer-_H._D._Girdwood._(13874204213).jpg",
    licence: BL_LICENCE,
    credit: "H. D. Girdwood, 1915 · British Library Photo 24/(153)",
    identification: "As catalogued: General Rimington, Sir Partab Singh and the Rajah of Rutlam.",
    alt: "Mounted officers ride across an open field towards the camera, more riders and a flag behind them.",
    width: 2400,
    height: 1840,
    master: "005-pratap-singh-remington-ratlam-linghem-1915.jpg",
    sha1: "f45bba2e0117e262bc24ee031b0e2e7011246132",
    chapter: "lancers",
  },
  {
    id: "002",
    plate: 8,
    kind: "photograph",
    title: "A troop coming into action dismounted",
    catalogued: "Troop of Jodhpur Lancers coming into action dismounted [Linghem, France]",
    date: "28 July 1915",
    year: 1915,
    creator: "H. D. Girdwood",
    holder: BL,
    reference: "Photo 24/(150)",
    source: "https://commons.wikimedia.org/wiki/File:Troop_of_Jodhpur_Lancers_coming_into_action_dismounted_(Linghem,_France)._Photographer-_H._D._Girdwood._(13874520714).jpg",
    licence: BL_LICENCE,
    credit: "H. D. Girdwood, 1915 · British Library Photo 24/(150)",
    alt: "A troop of lancers gathers behind a line of scrub on open heath, some men dismounting beside their horses.",
    width: 2400,
    height: 1824,
    master: "002-jodhpur-lancers-dismounted-linghem-1915-a.jpg",
    sha1: "19bf78c3ee61ef2f332ad5df37b83dabd3ca24c0",
    chapter: "lancers",
  },
  {
    id: "003",
    plate: 9,
    kind: "photograph",
    title: "A troop coming into action dismounted (second view)",
    catalogued: "Troop of Jodhpur Lancers coming into action dismounted [Linghem, France]",
    date: "28 July 1915",
    year: 1915,
    creator: "H. D. Girdwood",
    holder: BL,
    reference: "Photo 24/(151)",
    source: "https://commons.wikimedia.org/wiki/File:Troop_of_Jodhpur_Lancers_coming_into_action_dismounted_(Linghem,_France)._Photographer-_H._D._Girdwood._(13874536134).jpg",
    licence: BL_LICENCE,
    credit: "H. D. Girdwood, 1915 · British Library Photo 24/(151)",
    alt: "A second, almost identical exposure of the same troop behind the scrub.",
    show: false,
    width: 2400,
    height: 1838,
    master: "003-jodhpur-lancers-dismounted-linghem-1915-b.jpg",
    sha1: "239f4b18cffc4f5f715e83a467183946657971f1",
    chapter: "lancers",
  },
  {
    id: "004",
    plate: 10,
    kind: "photograph",
    title: "The firing line",
    catalogued: "Firing line of a troop of Jodhpur Lancers [Linghem, France]",
    date: "28 July 1915",
    year: 1915,
    creator: "H. D. Girdwood",
    holder: BL,
    reference: "Photo 24/(152)",
    source: "https://commons.wikimedia.org/wiki/File:Firing_line_of_a_troop_of_Jodhpur_Lancers_(Linghem,_France)._Photographer-_H._D._Girdwood._(13874539164).jpg",
    licence: BL_LICENCE,
    credit: "H. D. Girdwood, 1915 · British Library Photo 24/(152)",
    alt: "A lancer lies prone with his rifle at the edge of a wood; more of the firing line lies in the grass beyond.",
    width: 1860,
    height: 2400,
    master: "004-jodhpur-lancers-firing-line-linghem-1915.jpg",
    sha1: "72f68bc973f0585ffdf5aa1362072e44cbd231aa",
    chapter: "lancers",
  },
  {
    id: "008",
    plate: 11,
    kind: "photograph",
    title: "Sir Pratap Singh, his son and the Raja of Ratlam",
    catalogued: "Sir Pertab Singh et son fils et le radjah de Ratlam",
    date: "June 1916",
    year: 1916,
    creator: ROL,
    holder: BNF,
    reference: "Rol 47247 · ark:/12148/btv1b6946726g",
    source: "https://commons.wikimedia.org/wiki/File:Sir_Pertab_Singh_et_son_fils_et_le_radjah_de_Ratlam_-_btv1b6946726g.jpg",
    record: "https://gallica.bnf.fr/ark:/12148/btv1b6946726g",
    licence: PD_FR,
    credit: "Agence Rol, 1916 · BnF btv1b6946726g · public domain",
    identification: "As catalogued: Sir Pertab Singh, his son, and the Raja of Ratlam.",
    alt: "Three men in khaki service dress and turbans stand before a brick building; the older officer at centre wears medals and holds a cane.",
    width: 2400,
    height: 1932,
    master: "008-pratap-singh-son-ratlam-1916.jpg",
    sha1: "6526db60ca8a8b88bd4c67da63189413efb17b4c",
    chapter: "lancers",
  },
  {
    id: "006",
    plate: 12,
    kind: "photograph",
    title: "Indian lancers in Haifa",
    catalogued: "Indian lancers in Haifa 1918",
    date: "1918",
    year: 1918,
    dateNote: "The regiment is not named in the record.",
    creator: "Unknown official photographer",
    holder: "Imperial War Museum",
    reference: "IWM Q 12335",
    source: "https://commons.wikimedia.org/wiki/File:Indian_lancers_in_Haifa_1918.jpg",
    licence: "Public domain (expired Crown copyright)",
    credit: "© IWM Q 12335",
    alt: "A column of turbaned lancers with pennoned lances rides through a stone-built street in Haifa, townspeople watching.",
    width: 1300,
    height: 992,
    master: "006-indian-lancers-haifa-1918.jpg",
    sha1: "773cb0314bccfbb00cb4a731c33a272d55cb55ad",
    chapter: "lancers",
  },
  {
    id: "011",
    plate: 13,
    kind: "photograph",
    title: "The Prince of Wales passes under triumphal arches, Jodhpur",
    catalogued: "Jodhpur, le prince de Galles passe sous des arcs de triomphe",
    date: "November 1921",
    year: 1921,
    creator: ROL,
    holder: BNF,
    reference: "Rol 70882 · ark:/12148/btv1b53074279f",
    source: "https://commons.wikimedia.org/wiki/File:Jodhpur,_le_prince_de_Galles_passe_sous_des_arcs_de_triomphe_-_btv1b53074279f.jpg",
    record: "https://gallica.bnf.fr/ark:/12148/btv1b53074279f",
    licence: PD_FR,
    credit: "Agence Rol, 1921 · BnF btv1b53074279f · public domain",
    alt: "Horse-drawn carriages and mounted escorts pass beneath a decorated arch lettered 'God save our gracious Prince', onlookers on the buildings above.",
    width: 2400,
    height: 1744,
    master: "011-prince-wales-jodhpur-triumphal-arches-1921.jpg",
    sha1: "27ba66202039a571fb5ce552078766d9e5dcdf67",
    chapter: "crown",
  },
  {
    id: "009",
    plate: 14,
    kind: "photograph",
    title: "The Prince of Wales at Jodhpur; at centre, the regent, Sir Pratap Singh",
    catalogued: "Le prince de Galles aux Indes, [au centre, le maharajah régent de Jodhpur] sir Pertab Singh",
    date: "November 1921",
    year: 1921,
    creator: ROL,
    holder: BNF,
    reference: "Rol 70880 · ark:/12148/btv1b53074306k",
    source: "https://commons.wikimedia.org/wiki/File:Le_prince_de_Galles_aux_Indes_(au_centre,_le_maharajah_r%C3%A9gent_de_Jodhpur)_sir_Pertab_Singh_-_btv1b53074306k.jpg",
    record: "https://gallica.bnf.fr/ark:/12148/btv1b53074306k",
    licence: PD_FR,
    credit: "Agence Rol, 1921 · BnF btv1b53074306k · public domain",
    identification: "The catalogue identifies only the figure at centre: the regent of Jodhpur, Sir Pratap Singh.",
    alt: "Seven men stand on a lawn before a palace: British officers in sun helmets and Jodhpur nobles in brocade, an elderly Sir Pratap Singh at centre wearing a sash and medals.",
    width: 2400,
    height: 1744,
    master: "009-prince-wales-pratap-singh-jodhpur-1921.jpg",
    sha1: "f0116bdda9c24316e26c0ce45c8c6583e20d28fd",
    chapter: "commander",
  },
  {
    id: "010",
    plate: 15,
    kind: "photograph",
    title: "The Prince of Wales reviews the lancers at Jodhpur",
    catalogued: "Le prince de Galles passe en revue les lanciers à Jodhpur",
    date: "November 1921",
    year: 1921,
    creator: ROL,
    holder: BNF,
    reference: "Rol 70884 · ark:/12148/btv1b530742746",
    source: "https://commons.wikimedia.org/wiki/File:Le_prince_de_Galles_passe_en_revue_les_lanciers_%C3%A0_Jodhpur_-_btv1b530742746.jpg",
    record: "https://gallica.bnf.fr/ark:/12148/btv1b530742746",
    licence: PD_FR,
    credit: "Agence Rol, 1921 · BnF btv1b530742746 · public domain",
    alt: "Lancers with pennoned lances gallop past in review at Jodhpur, raising dust.",
    width: 2400,
    height: 1744,
    master: "010-prince-wales-reviews-jodhpur-lancers-1921.jpg",
    sha1: "e77f5bb6594e61f7b35a647ff101bf9180d694ea",
    chapter: "end",
  },
];

/** What the archive does not hold yet, said plainly on the page and in the manifest. */
export const archiveGaps = [
  "A licensed photograph of Maharaja Hanwant Singh, or of Jodhpur's accession (1947) and merger into Rajasthan (1949). The only image on Wikimedia Commons is 250 px wide and unsourced. Likely holders: Mehrangarh Museum Trust; Photo Division, Government of India.",
  "A genuine photograph of a Marwari horse taken before 1950.",
  "A high-resolution plate of Marwar from James Tod's Annals and Antiquities of Rajasthan (1829–32).",
];

/** Generated art on the page: never presented as a record. */
export const reconstructions = [
  { id: "scene-01", title: "A Rathore horseman before Mehrangarh", made: "Generated illustration in the Rajput miniature manner, 2026" },
  { id: "scene-02", title: "A Marwar court receives a Company officer", made: "Generated illustration in the Rajput miniature manner, 2026" },
  { id: "scene-03", title: "Lancers on the Haifa road", made: "Generated illustration in the Rajput miniature manner, 2026" },
  { id: "scene-04", title: "A Rajput officer on a palace terrace", made: "Generated illustration in the Rajput miniature manner, 2026. Not a portrait." },
  { id: "scene-05", title: "A Marwari stallion in a stable court", made: "Generated illustration in the Rajput miniature manner, 2026" },
];

export const archiveById = (id: string): ArchiveItem => {
  const item = archive.find((a) => a.id === id);
  if (!item) throw new Error(`Unknown Marwar archive id: ${id}`);
  return item;
};
