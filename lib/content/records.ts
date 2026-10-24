import type { RankId } from "./curriculum";
import type { HubSlug } from "./fleet";

/**
 * Sealed records, standings and tournaments. All SAMPLE, from the client docs (Blueprint R11, R12).
 * Field names match the Supabase tables (cadets, ranks_and_milestones, stpci_league_standings).
 */

export type Credential = {
  code: string;
  name: string;
  rank: RankId;
  rankName: string;
  hours: number;
  hub: HubSlug;
  hubName: string;
  efi: string | null;
  issued: string;
  seals: RankId[];
  milestones: { date: string; text: string }[];
};

export const credentials: Credential[] = [
  {
    code: "BSAH-2026-HYD-042", name: "Cadet Alpha", rank: "knight", rankName: "Cadet Knight", hours: 48,
    hub: "zone-01a-financial-district", hubName: "Zone 01A · Financial District Hub", efi: "SAMPLE-EFI-0001", issued: "2026-09-28",
    seals: ["squire", "rider", "knight"],
    milestones: [
      { date: "2026-03-14", text: "Seal I · Cadet Squire" },
      { date: "2026-05-30", text: "First independent canter" },
      { date: "2026-06-21", text: "Seal II · Cadet Rider" },
      { date: "2026-08-09", text: "First peg carried at the gallop" },
      { date: "2026-09-28", text: "Seal III · Cadet Knight · National STPCI qualifier" },
    ],
  },
  {
    code: "BSAH-2026-HYD-017", name: "Cadet Bravo", rank: "knight", rankName: "Cadet Knight", hours: 36,
    hub: "zone-01c-gachibowli", hubName: "Zone 01C · Gachibowli Academic Axis", efi: "SAMPLE-EFI-0002", issued: "2026-09-12",
    seals: ["squire", "rider", "knight"],
    milestones: [
      { date: "2026-04-02", text: "Seal I · Cadet Squire" },
      { date: "2026-06-10", text: "Seal II · Cadet Rider" },
      { date: "2026-08-23", text: "Mounted archery champion, league round 2" },
      { date: "2026-09-12", text: "Seal III · Cadet Knight" },
    ],
  },
  {
    code: "BSAH-2026-HYD-088", name: "Cadet Charlie", rank: "rider", rankName: "Cadet Rider", hours: 24,
    hub: "zone-01b-begumpet", hubName: "Zone 01B · Begumpet Heritage Belt", efi: null, issued: "2026-09-05",
    seals: ["squire", "rider"],
    milestones: [
      { date: "2026-06-01", text: "Seal I · Cadet Squire" },
      { date: "2026-08-15", text: "Perfect canter score" },
      { date: "2026-09-05", text: "Seal II · Cadet Rider" },
    ],
  },
];

export const credentialByCode = (code: string) =>
  credentials.find((c) => c.code.toLowerCase() === decodeURIComponent(code).trim().toLowerCase());

/** Circuit standings by zone codename (Pan-India Directive: no school names under live hub statuses). */
export const standings = [
  { pos: 1, hub: "01 · Financial District Hub", short: "Zone 01A", points: 1420, gold: 12, cup: "Qualified for national finals" },
  { pos: 2, hub: "02 · Golf Course Road Belt", short: "Zone 02A", points: 1280, gold: 9, cup: "Semi-finals qualified" },
  { pos: 3, hub: "03 · BKC & South Mumbai Circuit", short: "Zone 03A", points: 1150, gold: 7, cup: "Regional contender" },
];

export type Tournament = {
  slug: string;
  name: string;
  date: string;
  dateLabel: string;
  venue: string;
  format: string;
  ages: string;
  status: "open" | "soon";
  events: string[];
  schedule: { time: string; item: string }[];
  image: "tournCrowd" | "schoolArenaNight" | "tournCup";
};

export const tournaments: Tournament[] = [
  {
    slug: "governors-cup-2026", name: "Sovereign Governor's Cup", date: "2026-11-14", dateLabel: "14 NOV 2026",
    venue: "Zone 01A Arena · Financial District", format: "National qualifier", ages: "Under-14 · Under-18", status: "open", image: "tournCrowd",
    events: ["Tent pegging, individual", "Tent pegging, team of four", "Barrel racing", "Mounted archery exhibition"],
    schedule: [
      { time: "07:00", item: "Vet inspection and horse draw" },
      { time: "08:30", item: "Opening parade of hubs" },
      { time: "09:00", item: "Tent pegging, individual rounds" },
      { time: "12:30", item: "Barrel racing" },
      { time: "15:00", item: "Team tent pegging final" },
      { time: "17:00", item: "Governor's Cup presentation" },
    ],
  },
  {
    slug: "hyderabad-interschool-2026", name: "Hyderabad Interschool Tent Pegging", date: "2026-12-12", dateLabel: "12 DEC 2026",
    venue: "Zone 01C Arena · Gachibowli", format: "League round", ages: "Under-16", status: "open", image: "schoolArenaNight",
    events: ["Tent pegging, lance", "Mounted target (pellet)", "Ring tilting"],
    schedule: [
      { time: "15:30", item: "Vet inspection" },
      { time: "16:30", item: "Lance rounds under lights" },
      { time: "18:30", item: "Mounted target" },
      { time: "19:30", item: "Results and league table" },
    ],
  },
  {
    slug: "junior-lancers-2027", name: "Junior Lancers Invitational", date: "2027-01-23", dateLabel: "23 JAN 2027",
    venue: "Zone 01B Pavilion · Begumpet", format: "Invitational", ages: "Under-14", status: "soon", image: "tournCup",
    events: ["Walk-trot tent pegging", "Pole bending", "Mounted archery demonstration"],
    schedule: [
      { time: "08:00", item: "Horse draw and warm-up" },
      { time: "09:00", item: "Walk-trot tent pegging" },
      { time: "11:00", item: "Pole bending" },
      { time: "12:30", item: "Presentation in the pavilion" },
    ],
  },
];

export const tournamentBySlug = (slug: string) => tournaments.find((t) => t.slug === slug);

export const champions = [
  { title: "Governor's Cup 2025–26", who: "Zone 01A · Financial District Hub" },
  { title: "Mounted archery", who: "Cadet Bravo · Zone 01C" },
  { title: "Best young rider", who: "Cadet Charlie · Zone 01B" },
];
