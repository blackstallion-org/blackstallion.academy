export interface HubInfo {
  id: 'standard' | 'signature' | 'royal';
  name: string;
  price: string;
  capexNum: number;
  stablesCount: number;
  stablesLabel: string;
  landLabel: string;
  layoutSub: string;
  siteplanTitle: string;
  capacityLabel: string;
  defaultCadets: number;
  defaultShare: number;
  dimText: string;
  stablesSpec: string;
  tackSpec: string;
  cameraPos: {
    theta: number;
    phi: number;
    radius: number;
    targetX: number;
    targetY: number;
    targetZ: number;
  };
}

export interface FacilityInfo {
  title: string;
  desc: string;
  cam: {
    theta: number;
    phi: number;
    radius: number;
    targetX: number;
    targetY: number;
    targetZ: number;
  };
}

export const HUB_DATA: Record<string, HubInfo> = {
  standard: {
    id: 'standard',
    name: 'Standard Hub',
    price: '₹8.20 L',
    capexNum: 8.2,
    stablesCount: 4,
    stablesLabel: '4 STABLES',
    landLabel: 'SITE - 0.5 ACRE',
    layoutSub: 'STANDARD HUB LAYOUT',
    siteplanTitle: 'SITE PLAN - 0.5 ACRE (STANDARD HUB)',
    capacityLabel: '100–150',
    defaultCadets: 140,
    defaultShare: 25.0,
    dimText: '40m × 25m All-Weather Sand',
    stablesSpec: '4 Timber-Louvred Loose Boxes',
    tackSpec: 'East Tack Room & Grooming Bay',
    cameraPos: { theta: 0.62, phi: 1.06, radius: 42, targetX: -6.5, targetY: 0.5, targetZ: 1.2 }
  },
  signature: {
    id: 'signature',
    name: 'Signature Hub',
    price: '₹15.00 L',
    capexNum: 15.0,
    stablesCount: 8,
    stablesLabel: '8 STABLES',
    landLabel: 'SITE - 1.0 ACRE',
    layoutSub: 'SIGNATURE COVERED HUB',
    siteplanTitle: 'SITE PLAN - 1.0 ACRE (SIGNATURE HUB)',
    capacityLabel: '200–300',
    defaultCadets: 250,
    defaultShare: 27.5,
    dimText: '50m × 30m Covered Canopy Arena',
    stablesSpec: '8 Stables (South & North Wings)',
    tackSpec: 'Expanded Tack + VIP Viewing Deck',
    cameraPos: { theta: 0.48, phi: 1.08, radius: 46, targetX: -7.0, targetY: 1.0, targetZ: 0.5 }
  },
  royal: {
    id: 'royal',
    name: 'Royal Pavilion',
    price: '₹25.00 L+',
    capexNum: 25.0,
    stablesCount: 12,
    stablesLabel: '12 STABLES',
    landLabel: 'SITE - 1.5+ ACRES',
    layoutSub: 'ROYAL COLONNADE ESTATE',
    siteplanTitle: 'SITE PLAN - 1.5+ ACRES (ROYAL PAVILION)',
    capacityLabel: '300+',
    defaultCadets: 360,
    defaultShare: 30.0,
    dimText: '60m × 35m Colonnaded Championship Arena',
    stablesSpec: '12 Stables + Veterinary Isolation Suite',
    tackSpec: 'Two-Story Royal Viewing Pavilion & Gallery',
    cameraPos: { theta: 0.72, phi: 1.04, radius: 50, targetX: -7.5, targetY: 1.2, targetZ: -1.0 }
  }
};

export const FACILITY_INFO: Record<string, FacilityInfo> = {
  arena: {
    title: 'Championship Sand Arena',
    desc: 'Laser-graded silica sand & geotextile footing · Show-jumping course & dressage perimeter',
    cam: { theta: 0.55, phi: 1.02, radius: 28, targetX: -2.0, targetY: 0.5, targetZ: 0.0 }
  },
  stables: {
    title: 'Modular Timber & Travertine Stables',
    desc: 'Cross-ventilated 12ft × 12ft loose boxes · Warm linear LED soffits · Automated drinkers',
    cam: { theta: 0.25, phi: 1.18, radius: 22, targetX: -1.5, targetY: 1.0, targetZ: 10.5 }
  },
  tack: {
    title: 'Glazed Tack Room & Cadet Briefing Pavilion',
    desc: 'Climate-controlled saddle & bridle vault · Floor-to-ceiling bronze glazing · Shaded veranda',
    cam: { theta: 1.12, phi: 1.15, radius: 23, targetX: 12.5, targetY: 1.2, targetZ: 1.5 }
  },
  expansion: {
    title: 'Signature North Stable Wing & Arena Canopy',
    desc: '4 additional championship stalls + wide-span architectural steel & timber solar canopy',
    cam: { theta: 0.85, phi: 1.10, radius: 30, targetX: 0.0, targetY: 2.5, targetZ: -8.0 }
  },
  pavilion: {
    title: 'Royal Stone Colonnade & Viewing Gallery',
    desc: 'Classical vaulted travertine arches framing the arena + elevated school board hospitality gallery',
    cam: { theta: 0.65, phi: 1.12, radius: 32, targetX: 2.0, targetY: 2.8, targetZ: -12.0 }
  }
};

export const LIGHTING_PRESETS = [
  { name: 'Golden Hour', bg: 0xEFE6D5, sunColor: 0xFFD699, sunInt: 1.55, hemiInt: 0.72, exposure: 1.12 },
  { name: 'Dusk Citadel', bg: 0x241D18, sunColor: 0xFF9E5E, sunInt: 0.85, hemiInt: 0.35, exposure: 0.95 },
  { name: 'Studio Daylight', bg: 0xF7F3EB, sunColor: 0xFFFDF8, sunInt: 1.75, hemiInt: 0.92, exposure: 1.18 }
];

export const PIN_CONFIGS = [
  { id: 'pin-arena', labelKey: 'SAND ARENA', facility: 'arena', pos: [-0.8, 1.1, 0.2] as const, minHub: 'standard' },
  { id: 'pin-stables', labelKey: 'stables', facility: 'stables', pos: [-0.8, 2.7, 10.6] as const, minHub: 'standard' },
  { id: 'pin-tack', labelKey: 'TACK', facility: 'tack', pos: [13.2, 3.5, 1.2] as const, minHub: 'standard' },
  { id: 'pin-expansion', labelKey: '+4 STABLES & CANOPY', facility: 'expansion', pos: [-0.8, 5.2, -5.0] as const, minHub: 'signature' },
  { id: 'pin-pavilion', labelKey: 'ROYAL COLONNADE', facility: 'pavilion', pos: [4.5, 6.4, -14.8] as const, minHub: 'royal' }
];

export const HORSE_PATHS = [
  { rx: 6.8, rz: 4.2, speed: 0.55, phase: 0.0, cx: -0.8, cz: 0.2 },
  { rx: 6.8, rz: 4.2, speed: 0.55, phase: Math.PI, cx: -0.8, cz: 0.2 },
  { rx: 3.2, rz: 2.2, speed: -0.72, phase: 1.4, cx: -2.0, cz: 0.2 }
];
