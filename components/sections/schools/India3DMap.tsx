"use client";

import { asset } from "@/lib/content/asset";
import React, { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useInView } from "motion/react";
import { disposeThreeScene } from "@/lib/three-dispose";
import gsap from "gsap";
import { detectQualityTier } from "@/lib/3d/device-tier";
import { sameMarkers, warmUp, watchSize } from "./scene-kit";

// ============================================================================
// GEOGRAPHIC DATA & 6 BSAH REGIONAL CIRCUITS (SOVEREIGN PAN-INDIA NETWORK)
// ============================================================================
export interface RegionalCircuit {
  id: string;
  code: string;
  name: string;
  circuit: string;
  tagline: string;
  lat: number;
  lon: number;
  demElev: string;
  demographic: string;
}

export const REGIONAL_CIRCUITS: RegionalCircuit[] = [
  {
    id: "01",
    code: "01",
    name: "Telangana & Andhra Pradesh Circuit",
    circuit: "Hyderabad Hub Network",
    tagline: "3 Premier Academy Hubs (01A Narsingi, 01B Begumpet, 01C Gachibowli)",
    lat: 17.385,
    lon: 78.4867,
    demElev: "542m",
    demographic: "Candidate host venue for the Sovereign Governor's Cup · Turnkey ex-cavalry managed stabling",
  },
  {
    id: "02",
    code: "02",
    name: "National Capital Region (NCR) Circuit",
    circuit: "NCR Strategic Academic Network",
    tagline: "Gurugram, Greater Noida & Lutyens' Institutional Zone",
    lat: 28.5562,
    lon: 77.1,
    demElev: "216m",
    demographic: "Ultra-premium global & IB world campuses, sprawling multi-acre hubs",
  },
  {
    id: "03",
    code: "03",
    name: "Maharashtra & Western India Circuit",
    circuit: "Western India Academic Network",
    tagline: "South Mumbai/BKC, Pune West & Panchgani Tableland",
    lat: 18.82,
    lon: 73.32,
    demElev: "610m",
    demographic: "Elite metropolitan day schools, technical IB corridors & Western Ghats boarding sanctuaries",
  },
  {
    id: "04",
    code: "04",
    name: "Karnataka & Southern Metropolitan Circuit",
    circuit: "Southern Metropolitan Network",
    tagline: "Whitefield–Sarjapur, Yelahanka North & Nilgiris (Ooty)",
    lat: 12.9716,
    lon: 77.5946,
    demElev: "920m",
    demographic: "Tech corridors, sprawling acreage international academies & century-old Nilgiri boarding schools",
  },
  {
    id: "05",
    code: "05",
    name: "Northern Heritage & Boarding Circuit",
    circuit: "Northern Boarding Corridor",
    tagline: "Doon Valley, Ajmer/Jaipur & Shimla Foothills",
    lat: 29.45,
    lon: 76.85,
    demElev: "680m",
    demographic: "Historical Rajputana equestrian centers, Doon Valley legacy academies & Himalayan residential campuses",
  },
  {
    id: "06",
    code: "06",
    name: "Eastern & Central Regional Circuit",
    circuit: "Eastern & Central Academic Network",
    tagline: "Alipore/Kolkata & Central Malwa Plateau (Indore/Bhopal)",
    lat: 22.85,
    lon: 82.2,
    demElev: "390m",
    demographic: "Legacy Bengal renaissance institutions & sprawling residential Malwa plateau campuses",
  },
];

// India Sovereign Coastline and Land Boundary Polygon (Latitude, Longitude)
const INDIA_BOUNDARY_LATLON: [number, number][] = [
  [23.65, 68.15], [23.85, 68.85], [24.35, 69.5], [24.65, 71.05],
  [25.25, 70.6], [26.05, 70.15], [26.9, 69.55], [27.8, 70.45],
  [28.3, 71.65], [29.45, 72.85], [30.15, 73.85], [31.1, 74.45],
  [32.05, 74.75], [32.75, 74.15], [33.7, 73.75], [34.6, 73.85],
  [35.45, 73.8], [36.35, 74.4], [37.05, 74.85], [36.85, 75.85],
  [35.95, 76.6], [35.5, 77.8], [35.75, 78.9], [35.15, 79.85],
  [34.3, 79.4], [33.3, 79.1], [32.65, 79.25], [32.05, 78.65],
  [31.4, 79.1], [30.95, 79.95], [30.35, 80.95], [29.95, 80.4],
  [29.1, 80.15], [28.6, 81.1], [27.95, 82.1], [27.55, 83.4],
  [27.05, 84.65], [26.65, 85.95], [26.4, 87.35], [26.75, 88.1],
  [27.35, 88.05], [27.95, 88.55], [27.3, 88.9], [26.85, 89.1],
  [26.8, 90.45], [26.85, 91.65], [27.45, 91.65], [27.85, 92.55],
  [28.35, 93.45], [28.95, 94.45], [29.25, 95.35], [29.05, 96.35],
  [28.35, 97.35], [27.7, 97.1], [27.15, 96.25],
  [26.45, 95.15], [25.6, 94.75], [24.65, 94.35], [23.85, 93.4],
  [22.9, 93.05], [22.05, 92.65], [22.85, 92.2], [23.85, 91.85],
  [23.3, 91.15], [24.25, 91.75], [25.15, 92.25], [25.2, 90.85],
  [25.25, 89.85], [26.05, 89.75], [26.35, 88.85], [25.85, 88.1],
  [25.15, 88.45], [24.2, 88.65], [23.15, 88.85], [22.15, 89.05],
  [21.65, 88.15], [21.55, 87.15], [20.75, 86.95], [19.95, 86.15],
  [19.35, 85.05], [18.35, 84.15], [17.65, 83.3],
  [16.95, 82.25], [16.35, 81.75], [15.8, 80.85], [15.45, 80.15],
  [14.45, 80.15], [13.55, 80.3],
  [13.08, 80.28], [12.15, 79.9], [11.25, 79.85], [10.3, 79.85],
  [10.05, 79.25], [9.28, 79.3], [9.15, 78.65], [8.55, 78.15],
  [8.08, 77.55],
  [8.55, 76.88], [9.45, 76.32], [10.25, 76.12], [11.25, 75.77],
  [12.15, 75.15], [12.9, 74.82], [13.85, 74.62], [14.8, 74.12],
  [15.45, 73.8], [16.45, 73.35], [17.55, 73.15], [18.55, 72.9],
  [19.08, 72.82], [19.95, 72.72], [20.75, 72.85], [21.65, 72.65],
  [22.25, 72.3], [21.45, 71.95], [20.9, 71.1], [20.7, 70.35],
  [21.65, 69.6], [22.45, 69.05], [22.48, 69.85], [22.85, 70.35],
  [23.2, 69.65], [23.35, 68.55], [23.65, 68.15]
];

const SRI_LANKA_LATLON: [number, number][] = [
  [9.8, 80.2], [9.35, 80.6], [8.6, 81.2], [7.65, 81.75],
  [6.8, 81.82], [6.02, 80.75], [6.05, 80.15], [6.95, 79.85],
  [8.1, 79.75], [9.05, 79.9], [9.8, 80.2]
];

const INDIA_RIVERS_LATLON: [number, number][][] = [
  [[30.1, 78.9], [29.4, 78.1], [28.2, 78.8], [26.8, 80.1], [25.4, 81.8], [25.3, 83.0], [25.6, 85.1], [25.2, 87.6], [23.9, 88.8], [22.0, 89.1]],
  [[30.8, 78.4], [29.8, 77.3], [28.6, 77.2], [27.2, 78.0], [26.3, 79.6], [25.4, 81.8]],
  [[29.2, 95.1], [27.9, 95.4], [26.9, 94.2], [26.5, 92.8], [26.1, 91.7], [26.0, 90.0], [24.8, 89.7], [23.9, 89.8]],
  [[32.5, 79.3], [33.8, 77.6], [34.6, 76.2], [35.6, 74.6], [33.8, 72.3], [31.2, 70.9], [28.4, 69.7], [25.4, 68.3], [24.0, 67.5]],
  [[22.7, 81.7], [22.9, 79.9], [22.6, 77.8], [22.2, 76.0], [21.9, 74.2], [21.6, 72.6]],
  [[20.3, 81.6], [21.4, 82.8], [21.5, 83.9], [20.6, 84.8], [20.4, 85.9], [20.3, 86.7]],
  [[19.9, 73.5], [19.5, 75.5], [19.1, 77.3], [18.9, 78.8], [18.7, 79.9], [17.7, 80.9], [17.0, 81.7], [16.6, 82.2]],
  [[17.9, 73.7], [16.9, 74.6], [16.3, 76.1], [16.4, 77.8], [16.1, 78.9], [16.6, 80.1], [16.5, 80.6], [15.9, 81.1]],
  [[12.4, 75.5], [12.4, 76.7], [11.8, 77.8], [11.0, 78.7], [11.1, 79.8]]
];

const EARTH_RADIUS = 63.71;
const ORIGIN_LAT = 19.5;
const ORIGIN_LON = 78.6;

function latLonToWorld(lat: number, lon: number, altitude = 0): THREE.Vector3 {
  const dLat = THREE.MathUtils.degToRad(lat - ORIGIN_LAT);
  const dLon = THREE.MathUtils.degToRad(lon - ORIGIN_LON) * Math.cos(THREE.MathUtils.degToRad((lat + ORIGIN_LAT) * 0.5));
  const r = EARTH_RADIUS + altitude;
  const sinLat = Math.sin(dLat);
  const cosLat = Math.cos(dLat);
  const sinLon = Math.sin(dLon);
  const cosLon = Math.cos(dLon);

  const x = r * sinLon * cosLat;
  const z = -r * sinLat;
  const y = r * cosLat * cosLon - EARTH_RADIUS;
  return new THREE.Vector3(x, y, z);
}

function fbmNoise2D(x: number, y: number): number {
  const s1 = Math.sin(x * 1.7 + Math.cos(y * 1.9)) * Math.cos(y * 1.5 - Math.sin(x * 1.3));
  const s2 = Math.sin(x * 3.9 - y * 2.7) * Math.cos(x * 2.4 + y * 4.1) * 0.5;
  const s3 = Math.sin(x * 8.3 + y * 7.1) * Math.cos(x * 6.8 - y * 8.9) * 0.25;
  return (s1 + s2 + s3) * 0.5 + 0.5;
}

function pointInPolygon(lat: number, lon: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const yi = poly[i][0], xi = poly[i][1];
    const yj = poly[j][0], xj = poly[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / ((yj - yi) || 1e-7) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function evaluateSubcontinentLandMask(lat: number, lon: number): number {
  if (pointInPolygon(lat, lon, INDIA_BOUNDARY_LATLON)) return 1.0;
  if (pointInPolygon(lat, lon, SRI_LANKA_LATLON)) return 0.9;
  if (lat > 25.0 && lon >= 64.0 && lon <= 99.0) return 0.65;
  if (lat > 21.8 && lon >= 88.8 && lon <= 99.0) return 0.65;
  if (lat > 23.8 && lon >= 66.0 && lon <= 71.5) return 0.65;
  return 0.0;
}

function evaluateIndiaDEM(lat: number, lon: number): number {
  const land = evaluateSubcontinentLandMask(lat, lon);
  if (land <= 0.0) return 0.0;

  const ridgeNoise = fbmNoise2D(lat * 0.9, lon * 0.9);
  const fineNoise = fbmNoise2D(lat * 2.4, lon * 2.4);
  let elev = 0.035;

  const himCenterLat = 27.6 + 0.095 * Math.pow(lon - 86.5, 2) - 0.0018 * Math.pow(lon - 86.5, 3);
  if (lon >= 72.5 && lon <= 97.5) {
    const distHim = Math.abs(lat - himCenterLat);
    const himArc = Math.exp(-Math.pow(distHim / 1.45, 2));
    elev += himArc * (0.72 + 0.34 * ridgeNoise * fineNoise);
  }

  if (lat > himCenterLat + 0.5 && lon >= 74.0 && lon <= 98.0) {
    const tibetFactor = Math.min(1.0, (lat - himCenterLat) / 2.2);
    elev = Math.max(elev, 0.52 * tibetFactor + 0.14 * ridgeNoise);
  }

  const gangeticLat = himCenterLat - 2.3;
  if (lon >= 74.0 && lon <= 90.0 && Math.abs(lat - gangeticLat) < 1.9) {
    elev *= 0.42;
  }

  if (lat >= 8.3 && lat <= 21.2) {
    const ghatLon = 73.3 + (21.0 - lat) * 0.29;
    const dGhat = Math.abs(lon - ghatLon);
    if (dGhat < 1.3) {
      const ghatHeight = Math.exp(-Math.pow(dGhat / 0.52, 2)) * (0.28 + 0.12 * fineNoise);
      const nilgiriBoost = Math.exp(-Math.pow((lat - 10.9) / 1.1, 2)) * 0.14;
      elev += ghatHeight + nilgiriBoost;
    }
  }

  if (lat >= 11.5 && lat <= 21.5 && lon >= 73.8 && lon <= 80.8) {
    const westLim = 73.6 + (21.0 - lat) * 0.28;
    const eastLim = 80.5 - (17.0 - lat) * 0.18;
    if (lon > westLim && lon < eastLim) {
      const slope = 1.0 - (lon - westLim) / Math.max(1.0, eastLim - westLim) * 0.35;
      elev = Math.max(elev, (0.14 + 0.05 * ridgeNoise) * slope);
    }
  }

  if (lat >= 11.5 && lat <= 20.5) {
    const eGhatLon = 78.2 + (lat - 11.5) * 0.62;
    const dEGhat = Math.abs(lon - eGhatLon);
    const deltaGap = (lat > 15.8 && lat < 17.3) ? 0.25 : 1.0;
    if (dEGhat < 1.4) {
      elev += Math.exp(-Math.pow(dEGhat / 0.68, 2)) * 0.18 * deltaGap * ridgeNoise;
    }
  }

  if (lat >= 24.2 && lat <= 28.6) {
    const aravLon = 72.7 + (lat - 24.2) * 0.98;
    const dArav = Math.abs(lon - aravLon);
    if (dArav < 1.2) {
      elev += Math.exp(-Math.pow(dArav / 0.55, 2)) * 0.16 * fineNoise;
    }
  }

  if (lat >= 21.2 && lat <= 24.8 && lon >= 74.5 && lon <= 82.5) {
    const dVindhya = Math.abs(lat - 23.1);
    elev += Math.exp(-Math.pow(dVindhya / 1.1, 2)) * 0.15 * ridgeNoise;
  }

  if (lat >= 22.5 && lat <= 27.5 && lon >= 90.0 && lon <= 96.5) {
    elev += 0.22 * ridgeNoise;
  }

  return Math.min(1.0, elev);
}

/** The area the relief textures cover. */
const RELIEF_BOUNDS = { minLat: 4.0, maxLat: 38.0, minLon: 64.0, maxLon: 98.0 };

/**
 * The relief textures are the output of buildSubcontinentTextures() below, rendered once and saved as images
 * (scripts/bake-india-textures.mjs). Filling the 1024 x 1024 grids pixel by pixel took about a second on a laptop and
 * about four on a phone, all of it on the main thread, which is why this page used to freeze on arrival. They now
 * load like any other image (86 KB together). The function stays as the source of truth for the images and as the
 * fallback if they cannot be loaded.
 */
const RELIEF_COLOR_URL = asset("/images/schools/india-relief-color.webp");
const RELIEF_BUMP_URL = asset("/images/schools/india-relief-bump.webp");

function buildSubcontinentTextures() {
  const width = 1024;
  const height = 1024;
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext("2d");

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext("2d");

  if (!ctx || !bCtx) {
    return {
      colorTex: new THREE.Texture(),
      bumpTex: new THREE.Texture(),
      minLat: 4.0, maxLat: 38.0, minLon: 64.0, maxLon: 98.0
    };
  }

  const imgData = ctx.createImageData(width, height);
  const bumpData = bCtx.createImageData(width, height);
  const data = imgData.data;
  const bArr = bumpData.data;

  const minLat = 4.0, maxLat = 38.0;
  const minLon = 64.0, maxLon = 98.0;

  for (let py = 0; py < height; py++) {
    const v = 1.0 - py / (height - 1);
    const lat = minLat + v * (maxLat - minLat);
    for (let px = 0; px < width; px++) {
      const u = px / (width - 1);
      const lon = minLon + u * (maxLon - minLon);
      const idx = (py * width + px) * 4;

      const inIndia = pointInPolygon(lat, lon, INDIA_BOUNDARY_LATLON);
      const inSriLanka = !inIndia && pointInPolygon(lat, lon, SRI_LANKA_LATLON);
      const landMask = inIndia ? 1.0 : (inSriLanka ? 0.9 : evaluateSubcontinentLandMask(lat, lon));

      if (landMask <= 0.01) {
        // Ocean Bathymetry
        const coastApprox = Math.min(
          Math.abs(lon - 73.5) + Math.abs(lat - 15.0) * 0.4,
          Math.abs(lon - 82.0) + Math.abs(lat - 16.0) * 0.4
        );
        const shelf = Math.exp(-coastApprox * 0.45);
        const n = fbmNoise2D(lat * 1.6, lon * 1.6) * 8;
        data[idx] = Math.round(18 + shelf * 28 + n);
        data[idx + 1] = Math.round(42 + shelf * 46 + n);
        data[idx + 2] = Math.round(58 + shelf * 52 + n);
        data[idx + 3] = 255;

        bArr[idx] = bArr[idx + 1] = bArr[idx + 2] = 0;
        bArr[idx + 3] = 255;
      } else {
        // Land Biome & Relief
        const elev = evaluateIndiaDEM(lat, lon);
        const n1 = fbmNoise2D(lat * 3.1, lon * 3.1);
        const n2 = fbmNoise2D(lat * 7.5, lon * 7.5);

        let r = 118, g = 128, b = 92;

        const desertWeight = Math.exp(-(Math.pow((lat - 26.2) / 3.4, 2) + Math.pow((lon - 71.2) / 3.2, 2)));
        r = r * (1 - desertWeight) + 198 * desertWeight;
        g = g * (1 - desertWeight) + 178 * desertWeight;
        b = b * (1 - desertWeight) + 142 * desertWeight;

        const deccanWeight = Math.exp(-(Math.pow((lat - 17.2) / 4.2, 2) + Math.pow((lon - 77.5) / 2.8, 2))) * 0.72;
        r = r * (1 - deccanWeight) + 162 * deccanWeight;
        g = g * (1 - deccanWeight) + 144 * deccanWeight;
        b = b * (1 - deccanWeight) + 116 * deccanWeight;

        if (lat < 20 && lon < 76.2) {
          r = r * 0.45 + 74 * 0.55;
          g = g * 0.45 + 96 * 0.55;
          b = b * 0.45 + 68 * 0.55;
        }

        if (elev > 0.26) {
          const rockW = Math.min(1.0, (elev - 0.26) / 0.32);
          r = r * (1 - rockW) + 124 * rockW;
          g = g * (1 - rockW) + 112 * rockW;
          b = b * (1 - rockW) + 98 * rockW;
        }

        if (elev > 0.56) {
          const snowW = Math.min(1.0, (elev - 0.56) / 0.24);
          r = r * (1 - snowW) + 244 * snowW;
          g = g * (1 - snowW) + 240 * snowW;
          b = b * (1 - snowW) + 232 * snowW;
        }

        const detail = (n1 - 0.5) * 18 + (n2 - 0.5) * 10;
        r += detail; g += detail; b += detail;

        if (!inIndia) {
          const gray = (r * 0.35 + g * 0.45 + b * 0.2) * 0.92 + 24;
          r = r * 0.45 + gray * 0.55;
          g = g * 0.45 + (gray - 4) * 0.55;
          b = b * 0.45 + (gray - 12) * 0.55;
        }

        data[idx] = Math.max(0, Math.min(255, Math.round(r)));
        data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
        data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
        data[idx + 3] = 255;

        const bumpVal = Math.max(0, Math.min(255, Math.round(elev * 255)));
        bArr[idx] = bArr[idx + 1] = bArr[idx + 2] = bumpVal;
        bArr[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  bCtx.putImageData(bumpData, 0, 0);

  function toCanvas(lat: number, lon: number): [number, number] {
    return [
      ((lon - minLon) / (maxLon - minLon)) * width,
      (1.0 - (lat - minLat) / (maxLat - minLat)) * height,
    ];
  }

  // Draw Major Rivers
  ctx.save();
  ctx.strokeStyle = "rgba(75, 140, 168, 0.7)";
  ctx.lineWidth = 2.0;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  INDIA_RIVERS_LATLON.forEach((r) => {
    ctx.beginPath();
    r.forEach((pt, idx) => {
      const [cx, cy] = toCanvas(pt[0], pt[1]);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();
  });
  ctx.restore();

  // Draw Sovereign Border Outline
  ctx.save();
  ctx.beginPath();
  INDIA_BOUNDARY_LATLON.forEach((pt, idx) => {
    const [cx, cy] = toCanvas(pt[0], pt[1]);
    if (idx === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });
  ctx.closePath();
  ctx.strokeStyle = "rgba(229, 185, 139, 0.85)";
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.restore();

  const colorTex = new THREE.CanvasTexture(colorCanvas);
  colorTex.anisotropy = 4;
  const bumpTex = new THREE.CanvasTexture(bumpCanvas);

  return { colorTex, bumpTex, minLat, maxLat, minLon, maxLon };
}

interface India3DMapProps {
  activeCircuitId?: string;
  onSelectCircuit?: (circuit: RegionalCircuit) => void;
  className?: string;
  /** Called once, when the shaders are ready and the first frame has been drawn. */
  onReady?: () => void;
}

export function India3DMap({
  activeCircuitId = "01",
  onSelectCircuit,
  className = "",
  onReady,
}: India3DMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Builds a screen ahead of the panel, so the model is drawn by the time it is reached.
  const nearViewport = useInView(containerRef, { once: true, margin: "100% 0px" });
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  const [selection, setSelection] = useState({ source: activeCircuitId, id: activeCircuitId });
  const selectedCircuit = selection.source === activeCircuitId ? selection.id : activeCircuitId;
  const [activeStage, setActiveStage] = useState<"orbit" | "relief" | "circuits">("circuits");
  const [isFlyoverRunning, setIsFlyoverRunning] = useState<boolean>(false);
  const [projectedMarkers, setProjectedMarkers] = useState<
    { id: string; name: string; code: string; x: number; y: number; visible: boolean }[]
  >([]);

  // Refs for animation & Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.5, -1.5));
  const animFrameRef = useRef<number | null>(null);
  const circuitAnchorsRef = useRef<
    { id: string; surfacePos: THREE.Vector3; anchorPos: THREE.Vector3; circuit: RegionalCircuit }[]
  >([]);
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });

  // Main Three.js Initialization
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !nearViewport) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0d0b);
    scene.fog = new THREE.FogExp2(0x0f0d0b, 0.0035);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(36, width / Math.max(1, height), 0.1, 400);
    camera.position.set(1.5, 20.0, 16.5);
    camera.lookAt(cameraTargetRef.current);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      // Phones and low-power laptops draw fewer pixels and skip anti-aliasing; the scene is identical.
      const lowTier = detectQualityTier() === "low";
      renderer = new THREE.WebGLRenderer({
        antialias: !lowTier,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowTier ? 1.25 : 1.5));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch {
      return;
    }

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 0.72);
    const hemiLight = new THREE.HemisphereLight(0xfff0d8, 0x4a3b31, 0.55);
    const sunLight = new THREE.DirectionalLight(0xffecd0, 1.4);
    sunLight.position.set(24, 38, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 120;
    const d = 34;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(ambientLight, hemiLight, sunLight);

    // 3. Build Geometries
    const { minLat, maxLat, minLon, maxLon } = RELIEF_BOUNDS;
    const colorTex = new THREE.Texture();
    const bumpTex = new THREE.Texture();
    colorTex.anisotropy = 4;
    const imageLoader = new THREE.ImageLoader();
    const texturesLoaded = Promise.all([imageLoader.loadAsync(RELIEF_COLOR_URL), imageLoader.loadAsync(RELIEF_BUMP_URL)])
      .then(([color, bump]) => {
        colorTex.image = color;
        bumpTex.image = bump;
      })
      .catch(() => {
        const built = buildSubcontinentTextures();
        colorTex.image = built.colorTex.image;
        bumpTex.image = built.bumpTex.image;
      })
      .then(() => {
        colorTex.needsUpdate = true;
        bumpTex.needsUpdate = true;
      });

    // Curved Earth Sphere
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS - 0.08, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x142834,
      roughness: 0.75,
      metalness: 0.15,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(0, -EARTH_RADIUS, 0);
    earthMesh.receiveShadow = true;
    scene.add(earthMesh);

    // Ocean Specular Patch
    const oceanPatchGeo = new THREE.PlaneGeometry(42, 42, 48, 48);
    const oceanPos = oceanPatchGeo.attributes.position;
    for (let i = 0; i < oceanPos.count; i++) {
      const u = oceanPos.getX(i) / 42 + 0.5;
      const v = oceanPos.getY(i) / 42 + 0.5;
      const lat = minLat + v * (maxLat - minLat);
      const lon = minLon + u * (maxLon - minLon);
      const p = latLonToWorld(lat, lon, 0.0);
      oceanPos.setXYZ(i, p.x, p.y, p.z);
    }
    oceanPatchGeo.computeVertexNormals();
    const oceanPatchMat = new THREE.MeshStandardMaterial({
      color: 0x1a3d4f,
      roughness: 0.28,
      metalness: 0.35,
      transparent: true,
      opacity: 0.7,
    });
    const oceanMesh = new THREE.Mesh(oceanPatchGeo, oceanPatchMat);
    scene.add(oceanMesh);

    // DEM-Displaced 3D India Relief Mesh
    const segs = 128;
    const terrainGeo = new THREE.PlaneGeometry(1, 1, segs, segs);
    const posAttr = terrainGeo.attributes.position;
    const uvAttr = terrainGeo.attributes.uv;
    const ELEV_SCALE = 2.75;

    for (let i = 0; i < posAttr.count; i++) {
      const u = uvAttr.getX(i);
      const v = uvAttr.getY(i);
      const lat = minLat + v * (maxLat - minLat);
      const lon = minLon + u * (maxLon - minLon);
      const dem = evaluateIndiaDEM(lat, lon);
      const worldPt = latLonToWorld(lat, lon, dem * ELEV_SCALE);
      posAttr.setXYZ(i, worldPt.x, worldPt.y, worldPt.z);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      map: colorTex,
      bumpMap: bumpTex,
      bumpScale: 0.38,
      roughness: 0.8,
      metalness: 0.06,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.castShadow = true;
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // 3D Sovereign Boundary Outline Line
    const borderPts = INDIA_BOUNDARY_LATLON.map(([lat, lon]) => {
      const h = evaluateIndiaDEM(lat, lon) * ELEV_SCALE + 0.08;
      return latLonToWorld(lat, lon, h);
    });
    const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPts);
    const borderMat = new THREE.LineBasicMaterial({
      color: 0xe5b98b,
      transparent: true,
      opacity: 0.85,
    });
    scene.add(new THREE.Line(borderGeo, borderMat));

    // 3D Rivers
    INDIA_RIVERS_LATLON.forEach((river) => {
      const pts = river.map(([lat, lon]) => {
        const h = evaluateIndiaDEM(lat, lon) * ELEV_SCALE + 0.06;
        return latLonToWorld(lat, lon, h);
      });
      const curve = new THREE.CatmullRomCurve3(pts);
      const rGeo = new THREE.TubeGeometry(curve, 32, 0.045, 5, false);
      const rMat = new THREE.MeshBasicMaterial({
        color: 0x4b8ca8,
        transparent: true,
        opacity: 0.8,
      });
      scene.add(new THREE.Mesh(rGeo, rMat));
    });

    // 4. Six Regional Circuit Territory Anchors & Bronze Rings
    const anchors: {
      id: string;
      surfacePos: THREE.Vector3;
      anchorPos: THREE.Vector3;
      circuit: RegionalCircuit;
    }[] = [];

    REGIONAL_CIRCUITS.forEach((c) => {
      const h = evaluateIndiaDEM(c.lat, c.lon) * ELEV_SCALE + 0.08;
      const surfacePos = latLonToWorld(c.lat, c.lon, h);

      // Bronze circular territory ring
      const ringGeo = new THREE.RingGeometry(0.35, 1.45, 36);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: c.id === "01" ? 0xe5b98b : 0x936746,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: c.id === "01" ? 0.65 : 0.38,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(surfacePos);
      scene.add(ringMesh);

      // 3D Beacon Stem
      const pinStemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.95, 8);
      const pinStemMat = new THREE.MeshBasicMaterial({ color: 0xe5b98b });
      const pinStem = new THREE.Mesh(pinStemGeo, pinStemMat);
      pinStem.position.copy(surfacePos).add(new THREE.Vector3(0, 0.48, 0));
      scene.add(pinStem);

      anchors.push({
        id: c.id,
        surfacePos,
        anchorPos: surfacePos.clone().add(new THREE.Vector3(0, 1.0, 0)),
        circuit: c,
      });
    });
    circuitAnchorsRef.current = anchors;

    // Geodesic Network Arcs from Zone 01 (Hyderabad) to 02-06
    const hydAnchor = anchors.find((a) => a.id === "01");
    if (hydAnchor) {
      anchors.forEach((t) => {
        if (t.id === "01") return;
        const start = hydAnchor.surfacePos;
        const end = t.surfacePos;
        const mid = start.clone().lerp(end, 0.5);
        const dist = start.distanceTo(end);
        mid.y += dist * 0.22;

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const arcGeo = new THREE.TubeGeometry(curve, 32, 0.035, 6, false);
        const arcMat = new THREE.MeshBasicMaterial({
          color: 0xd8a472,
          transparent: true,
          opacity: 0.65,
        });
        scene.add(new THREE.Mesh(arcGeo, arcMat));
      });
    }

    // Pointer orbit and drag handlers
    const canvasEl = renderer.domElement;
    const handleDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = (e.clientX - prevPointerRef.current.x) * 0.0055;
      const dy = (e.clientY - prevPointerRef.current.y) * 0.0055;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };

      const offset = camera.position.clone().sub(cameraTargetRef.current);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta -= dx;
      spherical.phi = Math.max(0.35, Math.min(1.35, spherical.phi - dy));
      offset.setFromSpherical(spherical);
      camera.position.copy(cameraTargetRef.current).add(offset);
      camera.lookAt(cameraTargetRef.current);
    };
    const handleUp = () => {
      isDraggingRef.current = false;
    };
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const offset = camera.position.clone().sub(cameraTargetRef.current);
      const dist = offset.length();
      const nextDist = Math.max(14, Math.min(65, dist + e.deltaY * 0.025));
      offset.setLength(nextDist);
      camera.position.copy(cameraTargetRef.current).add(offset);
      camera.lookAt(cameraTargetRef.current);
    };

    canvasEl.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    canvasEl.addEventListener("wheel", handleWheel, { passive: false });

    // Render & Projection Loop
    let visible = false;
    let compiled = false;
    let disposed = false;
    let lastProjection = 0;
    let lastMarkers: { x: number; y: number; visible: boolean }[] | null = null;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(container);
    const projVec = new THREE.Vector3();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      if (!compiled || !visible || document.hidden) return;

      // Project 3D circuit anchors to 2D screen positions
      if (containerRef.current && cameraRef.current && performance.now() - lastProjection > 80) {
        lastProjection = performance.now();
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;
        const cam = cameraRef.current;

        const nextMarkers = circuitAnchorsRef.current.map((a) => {
          projVec.copy(a.anchorPos).project(cam);
          const isVisible = projVec.z < 1.0;
          const sx = (projVec.x * 0.5 + 0.5) * cw;
          const sy = (-projVec.y * 0.5 + 0.5) * ch;
          return {
            id: a.id,
            name: a.circuit.name,
            code: a.circuit.code,
            x: sx,
            y: sy,
            visible: isVisible,
          };
        });
        if (!sameMarkers(lastMarkers, nextMarkers)) {
          lastMarkers = nextMarkers;
          setProjectedMarkers(nextMarkers);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Compile every shader in the background and wait for the relief images, draw one frame, then tell the page the
    // scene is ready.
    void Promise.all([warmUp(renderer, scene, camera), texturesLoaded]).then(() => {
      if (disposed) return;
      compiled = true;
      renderer.render(scene, camera);
      onReadyRef.current?.();
    });

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = Math.max(1, containerRef.current.clientHeight);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
      if (compiled) rendererRef.current.render(scene, camera);
    };
    const stopWatching = watchSize(container, handleResize);

    return () => {
      disposed = true;
      stopWatching();
      canvasEl.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      canvasEl.removeEventListener("wheel", handleWheel);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      observer.disconnect();
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(cameraTargetRef.current);
      scene.traverse((object) => { gsap.killTweensOf(object.position); gsap.killTweensOf(object.scale); });
      disposeThreeScene(scene);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [nearViewport]);

  // Camera glide to target circuit
  const focusCircuit = useCallback((circuitId: string) => {
    setSelection({ source: activeCircuitId, id: circuitId });
    const targetAnchor = circuitAnchorsRef.current.find((a) => a.id === circuitId);
    if (!targetAnchor || !cameraRef.current) return;

    const p = targetAnchor.surfacePos;
    gsap.killTweensOf(cameraRef.current.position);
    gsap.killTweensOf(cameraTargetRef.current);

    gsap.to(cameraRef.current.position, {
      x: p.x + 2.5,
      y: p.y + 13.5,
      z: p.z + 11.5,
      duration: 1.4,
      ease: "power3.inOut",
      onUpdate: () => {
        if (cameraRef.current) cameraRef.current.lookAt(cameraTargetRef.current);
      },
    });
    gsap.to(cameraTargetRef.current, {
      x: p.x,
      y: p.y + 0.2,
      z: p.z,
      duration: 1.4,
      ease: "power3.inOut",
    });

    if (onSelectCircuit) {
      onSelectCircuit(targetAnchor.circuit);
    }
  }, [activeCircuitId, onSelectCircuit]);

  // Camera stages (Orbit / Relief / Circuits)
  const setCameraStage = useCallback((stage: "orbit" | "relief" | "circuits") => {
    setActiveStage(stage);
    if (!cameraRef.current) return;

    const presets = {
      orbit: { pos: [0, 42, 54], target: [0, -8, 0] },
      relief: { pos: [0, 31, 24], target: [0, 0.5, -2.5] },
      circuits: { pos: [1.5, 23, 18], target: [0, 0.5, -1.5] },
    };
    const p = presets[stage];

    gsap.killTweensOf(cameraRef.current.position);
    gsap.killTweensOf(cameraTargetRef.current);

    gsap.to(cameraRef.current.position, {
      x: p.pos[0],
      y: p.pos[1],
      z: p.pos[2],
      duration: 1.5,
      ease: "power3.inOut",
      onUpdate: () => {
        if (cameraRef.current) cameraRef.current.lookAt(cameraTargetRef.current);
      },
    });
    gsap.to(cameraTargetRef.current, {
      x: p.target[0],
      y: p.target[1],
      z: p.target[2],
      duration: 1.5,
      ease: "power3.inOut",
    });
  }, []);

  // Space-to-India Flyover Sequence
  const playFlyover = useCallback(() => {
    if (!cameraRef.current) return;
    setIsFlyoverRunning(true);

    const tl = gsap.timeline({
      onComplete: () => setIsFlyoverRunning(false),
    });

    // Step 1: Start at High Orbit
    setCameraStage("orbit");
    tl.to(cameraRef.current.position, {
      x: 0,
      y: 31,
      z: 24,
      duration: 2.2,
      ease: "power2.inOut",
      onUpdate: () => {
        if (cameraRef.current) cameraRef.current.lookAt(cameraTargetRef.current);
      },
    })
      .to(cameraTargetRef.current, { x: 0, y: 0.5, z: -2.5, duration: 2.2, ease: "power2.inOut" }, 0)
      // Step 2: Swoop into 6 Circuits Overview
      .to(cameraRef.current.position, {
        x: 1.5,
        y: 23,
        z: 18,
        duration: 2.0,
        ease: "power3.inOut",
        onUpdate: () => {
          if (cameraRef.current) cameraRef.current.lookAt(cameraTargetRef.current);
        },
      })
      .to(cameraTargetRef.current, { x: 0, y: 0.5, z: -1.5, duration: 2.0, ease: "power3.inOut" }, "-=2.0");
  }, [setCameraStage]);

  const activeCircuit = REGIONAL_CIRCUITS.find((c) => c.id === selectedCircuit) || REGIONAL_CIRCUITS[0];

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Atmospheric Vignette & Glow */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(15,13,11,0) 65%, rgba(15,13,11,0.4) 90%, #0f0d0b 100%), linear-gradient(to top, rgba(15,13,11,0.92) 0%, rgba(15,13,11,0.35) 24%, transparent 42%)",
        }}
      />

      {/* Top Controls Bar: Stage Selectors + Flyover */}
      <div className="absolute top-28 sm:top-32 left-4 sm:left-10 right-4 sm:right-10 z-25 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-1 p-1 rounded-full bg-black/75 backdrop-blur-md border border-gold/40 shadow-lg">
          <button
            type="button"
            onClick={() => setCameraStage("orbit")}
            className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.15em] transition-all ${
              activeStage === "orbit"
                ? "bg-gold text-black font-semibold shadow-sm"
                : "text-sand hover:text-white"
            }`}
          >
            01 · Earth Orbit
          </button>
          <button
            type="button"
            onClick={() => setCameraStage("relief")}
            className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.15em] transition-all ${
              activeStage === "relief"
                ? "bg-gold text-black font-semibold shadow-sm"
                : "text-sand hover:text-white"
            }`}
          >
            02 · India Relief
          </button>
          <button
            type="button"
            onClick={() => setCameraStage("circuits")}
            className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.15em] transition-all ${
              activeStage === "circuits"
                ? "bg-gold text-black font-semibold shadow-sm"
                : "text-sand hover:text-white"
            }`}
          >
            03 · 6 Sovereign Circuits
          </button>
        </div>

        <button
          type="button"
          onClick={playFlyover}
          disabled={isFlyoverRunning}
          className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/90 hover:bg-gold text-black text-[10px] font-mono uppercase tracking-[0.15em] font-semibold transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
          <span>{isFlyoverRunning ? "Tour In Progress..." : "Space → India Tour"}</span>
        </button>
      </div>

      {/* Left Vertical Zone Switcher (01 - 06) */}
      <div className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-25 flex flex-col items-center gap-2 bg-black/70 backdrop-blur-md p-2 rounded-full border border-gold/30">
        <span className="text-[9px] font-mono uppercase tracking-widest text-gold/75 mb-1">CIRCUITS</span>
        {REGIONAL_CIRCUITS.map((c) => {
          const isSelected = selectedCircuit === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => focusCircuit(c.id)}
              className={`w-7 h-7 rounded-full text-[11px] font-mono font-semibold flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-gold text-black shadow-md scale-110"
                  : "text-sand/80 hover:text-white hover:bg-white/10"
              }`}
              title={c.name}
            >
              {c.code}
            </button>
          );
        })}
      </div>

      {/* 3D-Projected DOM Pill Markers */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {projectedMarkers.map((m) => {
          if (!m.visible) return null;
          const isSelected = selectedCircuit === m.id;
          return (
            <div
              key={m.id}
              className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-full transition-all duration-200"
              style={{ left: `${m.x}px`, top: `${m.y}px` }}
            >
              <button
                type="button"
                onClick={() => focusCircuit(m.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg transition-transform hover:scale-105 cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-gold text-black border-gold shadow-gold/30 scale-105"
                    : "bg-black/80 text-bone border-gold/40 hover:border-gold"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full text-[9px] font-mono font-bold flex items-center justify-center ${
                    isSelected ? "bg-black text-gold" : "bg-gold text-black"
                  }`}
                >
                  {m.code}
                </span>
                <span className="text-left">
                  <span className="block text-[8px] font-mono uppercase tracking-wider text-dust leading-none">
                    ZONE {m.code}
                  </span>
                  <span className="block text-xs font-serif font-medium leading-tight">
                    {m.name.split(" ")[0]}
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Floating Circuit Metadata Card */}
      <div className="absolute bottom-6 right-4 sm:right-10 z-25 max-w-sm w-full p-4 rounded-xl bg-black/85 backdrop-blur-md border border-gold/40 text-bone shadow-2xl pointer-events-auto">
        <div className="flex items-center justify-between gap-2 border-b border-line/40 pb-2 mb-2">
          <span className="font-mono text-[10px] text-gold uppercase tracking-[0.2em] font-semibold">
            ZONE {activeCircuit.code} · {activeCircuit.circuit}
          </span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-gold/15 text-gold border border-gold/30">
            DEM {activeCircuit.demElev}
          </span>
        </div>
        <h4 className="font-serif text-lg font-semibold text-bone leading-snug">
          {activeCircuit.name}
        </h4>
        <p className="font-serif italic text-xs text-sand/90 mt-1 leading-relaxed">
          {activeCircuit.tagline}
        </p>
        <p className="font-sans text-[11px] text-dust mt-2 leading-relaxed">
          {activeCircuit.demographic}
        </p>
      </div>
    </div>
  );
}
