import fs from "fs";
import path from "path";

// Import all content modules
import * as site from "../lib/content/site";
import * as academy from "../lib/content/academy";
import * as pricing from "../lib/content/pricing";
import * as anatomy from "../lib/content/anatomy";
import * as command from "../lib/content/command";
import * as curriculum from "../lib/content/curriculum";
import * as fleet from "../lib/content/fleet";
import * as home from "../lib/content/home";
import * as journal from "../lib/content/journal";
import * as legend from "../lib/content/legend";
import * as records from "../lib/content/records";
import * as schools from "../lib/content/schools";
import * as science from "../lib/content/science";

// Filter out colors and color palettes
function sanitize(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  } else if (obj !== null && typeof obj === "object") {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      // Exclude color properties
      if (
        k.toLowerCase().includes("color") ||
        k.toLowerCase().includes("palette") ||
        k === "hex" ||
        k === "statusColor"
      ) {
        continue;
      }
      res[k] = sanitize(v);
    }
    return res;
  }
  return obj;
}

const pageList = [
  { id: 1, route: "/", title: "R00 · The Trailer (Cinematic Homepage)", type: "Core Page" },
  { id: 2, route: "/legend", title: "Reel 01 · The Marwari", type: "Core Page" },
  { id: 3, route: "/anatomy", title: "Reel 02 · The Instrument", type: "Core Page" },
  { id: 4, route: "/science", title: "Reel 03 · The Matrix", type: "Core Page" },
  { id: 5, route: "/why", title: "Reel 04 · Crisis & Cure", type: "Core Page" },
  { id: 6, route: "/curriculum", title: "Reel 05 · The Ledger", type: "Core Page" },
  { id: 7, route: "/fleet", title: "Reel 06 · The Studbook", type: "Core Page" },
  { id: 8, route: "/cadets", title: "Reel 07 · The Hall of Valour", type: "Core Page" },
  { id: 9, route: "/parents", title: "Reel 08 · The Guardian", type: "Core Page" },
  { id: 10, route: "/safety", title: "Reel 09 · The Shield", type: "Core Page" },
  { id: 11, route: "/schools", title: "Reel 10 · The Citadel", type: "Core Page" },
  { id: 12, route: "/verify", title: "Reel 11 · The Seal", type: "Core Page" },
  { id: 13, route: "/tournaments", title: "Reel 12 · The Circuit", type: "Core Page" },
  { id: 14, route: "/command", title: "Reel 13 · Command AI", type: "Core Page" },
  { id: 15, route: "/journal", title: "Reel 14 · The Chronicle", type: "Core Page" },
  { id: 16, route: "/contact", title: "Reel 15 · The Gate", type: "Core Page" },
  { id: 17, route: "/about", title: "The Mandate", type: "Secondary Page" },
  { id: 18, route: "/lore", title: "The Traditional Lore of the Bards", type: "Secondary Page" },
  { id: 19, route: "/schools/mou", title: "Draft Memorandum of Understanding", type: "Secondary Page" },
  { id: 20, route: "/privacy", title: "Privacy Notice", type: "Secondary Page" },
  { id: 21, route: "/schools/[slug]", title: "Campus Hub Portal (Zone 01A, 01B, 01C)", type: "Dynamic Route" },
  { id: 22, route: "/tournaments/[slug]", title: "Tournament Dossier (3 Fixtures)", type: "Dynamic Route" },
  { id: 23, route: "/verify/[code]", title: "Cadet Credential & Diploma Verifier", type: "Dynamic Route" },
  { id: 24, route: "/journal/[slug]", title: "Chronicle Story Detail (6 Articles)", type: "Dynamic Route" },
  { id: 25, route: "/not-found", title: "Custom 404 / Reel Cut Fallback", type: "Special Route" },
];

const exportData = {
  metadata: {
    title: "The Black Stallion Academy of Horsemanship (BSAH) Complete Data Export",
    generated_at: new Date().toISOString(),
    total_pages_count: pageList.length,
    pages_index: pageList,
    color_policy: "All color styling, themes, and palettes omitted per user instructions"
  },
  institution: sanitize({
    entity: site.entity,
    acts: site.acts,
    reels: site.reels,
    corridors: site.corridors,
    navigation: {
      primaryNav: site.primaryNav,
      legalNav: site.legalNav,
      navCta: site.navCta,
    },
    house: academy.house,
    letter: academy.letter,
    truths: academy.truths,
  }),
  pricing_and_fees: sanitize({
    gst_rate: pricing.GST_RATE,
    prices: pricing.price,
    price_labels: pricing.priceLabel,
    fees_breakdown: academy.fees,
  }),
  homepage_data: sanitize({
    hero: home.hero,
    story: home.story,
    instrument: home.instrument,
    matrix: home.matrix,
    crisis: home.crisis,
    doors: home.doors,
    ledger: home.ledger,
    studbook: home.studbook,
    schoolsTeaser: home.schoolsTeaser,
    verifier: home.verifier,
    circuit: home.circuit,
    shield: home.shield,
    command: home.command,
    chronicle: home.chronicle,
    finale: home.finale,
  }),
  legend_and_history: sanitize({
    title: legend.title,
    chapters: legend.chapters,
    ocean_one_bloodline: legend.ocean,
    marwar_desert_origin: legend.marwar,
    bred_by_law: legend.bred,
    the_ears: legend.ears,
    traditional_lore: legend.lore,
    three_reasons: legend.reasons,
    roll_of_honour: legend.honour,
    honour_close: legend.honourClose,
    the_fall: legend.fall,
    the_revival: legend.revival,
    today_bsah: legend.today,
  }),
  anatomy_and_specimen: sanitize({
    hotspots: anatomy.hotspots,
    layerNames: anatomy.layerNames,
    breedStandard: anatomy.breedStandard,
  }),
  science_and_crucible: sanitize({
    systems: science.systems,
    comparison: science.comparison,
    claims: science.claims,
    why_crisis_and_cure: science.why,
    sovereign_crucible: science.crucible,
  }),
  curriculum_and_training: sanitize({
    ranks: curriculum.ranks,
    phases: curriculum.phases,
    thirteen_pillars: curriculum.pillars,
    military_session_protocol_45_min: curriculum.classSegments,
    campus_batch_schedule: curriculum.batches,
    three_way_assessment: curriculum.assessment,
    disciplines: curriculum.disciplines,
  }),
  fleet_and_livestock: sanitize({
    fleet_total_count: fleet.FLEET_TOTAL,
    status_labels: fleet.statusLabel,
    active_stallions: fleet.fleet,
    coat_registry: fleet.coatRegistry,
    cctv_feeds: fleet.feeds,
    daily_care_log: fleet.careLog,
  }),
  cadets_and_valour: sanitize({
    spotlights: academy.spotlights,
    passport_description: academy.passport,
    daily_schedule: academy.day,
    creed_six_articles: academy.creed,
    cadet_uniform_spec: academy.uniform,
    reels: academy.reels,
  }),
  parents_and_guardian: sanitize({
    phone_features: academy.phoneSteps,
    admissions_steps: academy.admissions,
    faq: academy.faq,
  }),
  safety_and_shield: sanitize({
    kit_labels: academy.kitLabels,
    three_shields: academy.shields,
    standing_orders_of_the_day: academy.orders,
    performance_records: academy.record,
    faculty_leadership: academy.people,
  }),
  schools_and_citadel: sanitize({
    tiers: schools.tiers,
    tuition_basis: schools.TUITION_PER_MONTH,
    partnership_model: schools.model,
    seals: schools.seals,
    pan_india_regional_network: schools.network,
    benchmark: schools.benchmark,
    hubs: schools.hubs,
  }),
  tournaments_and_circuit: sanitize({
    league_standings: records.standings,
    tournaments_list: records.tournaments,
    champions_roll: records.champions,
  }),
  credentials_and_verification: sanitize({
    sample_credentials: records.credentials,
  }),
  command_ai_knowledge_base: sanitize({
    knowledge_entries: command.knowledge,
    fallback_response: command.fallback,
  }),
  journal_chronicle_articles: sanitize({
    posts: journal.posts,
  }),
};

const outputPath = path.resolve(__dirname, "../all_website_data.json");
fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), "utf-8");
console.log(`Successfully written to ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
