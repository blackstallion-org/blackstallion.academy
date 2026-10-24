"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useInView } from "motion/react";
import { disposeThreeScene } from "@/lib/three-dispose";
import gsap from "gsap";

export interface HyderabadHub {
  id: "01A" | "01B" | "01C";
  slug: string;
  zoneLabel: string;
  shortName: string;
  fullName: string;
  hubType: string;
  stallions: number;
  demographic: string;
  specs: string;
  worldPos: [number, number, number];
  camPos: [number, number, number];
  camTarget: [number, number, number];
  cardOffset: [number, number];
  latLon: string;
}

export const HYDERABAD_HUBS: HyderabadHub[] = [
  {
    id: "01A",
    slug: "zone-01a-financial-district",
    zoneLabel: "ZONE 01A",
    shortName: "Narsingi",
    fullName: "Financial District & Narsingi Corridor",
    hubType: "Signature Hub",
    stallions: 8,
    demographic: "Premium IB & Cambridge International Hubs",
    specs: "Large central dressage & jumping arena · Neo-classical limestone academy facade · Landscaped equestrian grounds.",
    worldPos: [3.5, 0.35, 11.2],
    camPos: [14.0, 14.5, 25.0],
    camTarget: [2.5, 0.5, 9.5],
    cardOffset: [78, -68],
    latLon: "17.3912° N, 78.3568° E",
  },
  {
    id: "01C",
    slug: "zone-01c-gachibowli",
    zoneLabel: "ZONE 01C",
    shortName: "Gachibowli",
    fullName: "Gachibowli & Madhapur Academic Axis",
    hubType: "Standard Hub",
    stallions: 4,
    demographic: "Progressive K-12 & STEM Institutions",
    specs: "Compact modern equestrian facility · Rectangular riding arena · Contemporary cantilevered low-rise architecture.",
    worldPos: [-15.2, 0.35, 1.4],
    camPos: [-6.5, 13.5, 16.5],
    camTarget: [-13.5, 0.5, 0.5],
    cardOffset: [16, -124],
    latLon: "17.4401° N, 78.3489° E",
  },
  {
    id: "01B",
    slug: "zone-01b-begumpet",
    zoneLabel: "ZONE 01B",
    shortName: "Begumpet",
    fullName: "Begumpet & Jubilee Hills Heritage Belt",
    hubType: "Royal Pavilion",
    stallions: 12,
    demographic: "Legacy Private & Historical Day Schools",
    specs: "Heritage-inspired palatial structure · Classical stone colonnade · Twin belvedere turrets & 12-stallion royal paddock.",
    worldPos: [1.8, 0.55, -8.2],
    camPos: [13.5, 14.5, 5.5],
    camTarget: [1.5, 0.7, -7.2],
    cardOffset: [86, -86],
    latLon: "17.4447° N, 78.4664° E",
  },
];

function createWindowFacadeTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#DED5C6";
    ctx.fillRect(0, 0, 256, 256);

    for (let y = 0; y < 256; y += 32) {
      ctx.fillStyle = "rgba(130, 112, 94, 0.28)";
      ctx.fillRect(0, y, 256, 3);
    }

    for (let y = 8; y < 248; y += 20) {
      for (let x = 8; x < 248; x += 18) {
        const warmLit = Math.sin(x * 12.3 + y * 7.7) > 0.68;
        ctx.fillStyle = warmLit ? "#E5B879" : "#7D6E60";
        ctx.fillRect(x, y, 10, 12);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createDioramaTerrainTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext("2d");
  if (ctx) {
    const grad = ctx.createRadialGradient(512, 512, 60, 512, 512, 520);
    grad.addColorStop(0, "#DFD6C7");
    grad.addColorStop(0.65, "#E7DFD2");
    grad.addColorStop(1, "#F5F0E7");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.strokeStyle = "rgba(154, 138, 120, 0.22)";
    ctx.lineWidth = 1;
    for (let i = 140; i < 880; i += 28) {
      ctx.beginPath();
      ctx.moveTo(i, 180);
      ctx.lineTo(i + Math.sin(i) * 18, 840);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(180, i);
      ctx.lineTo(840, i + Math.cos(i) * 18);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(147, 103, 70, 0.16)";
    for (let r = 80; r <= 420; r += 45) {
      ctx.beginPath();
      ctx.ellipse(500, 500, r * 1.15, r * 0.88, -0.15, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.save();
    // The site's UI face (Plus Jakarta Sans) as resolved from the CSS token; canvas cannot read var() itself.
    const uiFont = (typeof document !== "undefined" && getComputedStyle(document.body).getPropertyValue("--font-sans").trim()) || "sans-serif";
    ctx.font = `500 28px ${uiFont}`;
    ctx.fillStyle = "rgba(72, 56, 45, 0.72)";
    ctx.textAlign = "center";
    ctx.fillText("H  Y  D  E  R  A  B  A  D", 470, 518);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

interface Hyderabad3DMapProps {
  activeHubId?: "01A" | "01B" | "01C";
  onSelectHub?: (hubId: "01A" | "01B" | "01C") => void;
  className?: string;
}

export function Hyderabad3DMap({
  activeHubId = "01A",
  onSelectHub,
  className = "",
}: Hyderabad3DMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nearViewport = useInView(containerRef, { once: true, margin: "250px" });
  const [selection, setSelection] = useState({ source: activeHubId, id: activeHubId });
  const selectedHub = selection.source === activeHubId ? selection.id : activeHubId;
  const selectedHubRef = useRef<"01A" | "01B" | "01C">(activeHubId);
  const [hoveredHub, setHoveredHub] = useState<string | null>(null);
  const [projectedMarkers, setProjectedMarkers] = useState<
    {
      id: "01A" | "01B" | "01C";
      x: number;
      y: number;
      visible: boolean;
      hub: HyderabadHub;
    }[]
  >([]);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(-1.2, 0.2, 1.2));
  const animFrameRef = useRef<number | null>(null);
  const routePulseMeshesRef = useRef<Record<string, { mesh: THREE.Mesh; mat: THREE.Material; curve: THREE.CatmullRomCurve3 }>>({});
  const routeTravelerRef = useRef<THREE.Mesh | null>(null);
  const hubGroupsRef = useRef<Record<string, THREE.Group>>({});
  const routeProgressRef = useRef(0);
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !nearViewport) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f0e7);
    scene.fog = new THREE.FogExp2(0xf5f0e7, 0.0115);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(36, width / Math.max(1, height), 0.1, 300);
    camera.position.set(3.2, 22.0, 31.5);
    camera.lookAt(cameraTargetRef.current);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch {
      return;
    }

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xf5efe6, 0.78);
    const hemiLight = new THREE.HemisphereLight(0xfff8ee, 0xc8b8a2, 0.48);
    const sunLight = new THREE.DirectionalLight(0xfff2dc, 1.28);
    sunLight.position.set(22, 34, 18);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 95;
    const d = 28;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0008;
    scene.add(ambientLight, hemiLight, sunLight);

    // 3. Materials
    const facadeTex = createWindowFacadeTexture();
    const plateauTex = createDioramaTerrainTexture();

    const mats = {
      limestone: new THREE.MeshStandardMaterial({ color: 0xede5d8, roughness: 0.78, metalness: 0.05 }),
      sandstone: new THREE.MeshStandardMaterial({ color: 0xdaccb8, roughness: 0.82, metalness: 0.06 }),
      darkStone: new THREE.MeshStandardMaterial({ color: 0x4a3b31, roughness: 0.7, metalness: 0.12 }),
      roofSlate: new THREE.MeshStandardMaterial({ color: 0x5a4d42, roughness: 0.68, metalness: 0.15 }),
      bronze: new THREE.MeshStandardMaterial({ color: 0x936746, roughness: 0.36, metalness: 0.62 }),
      warmGlow: new THREE.MeshBasicMaterial({ color: 0xf3c78b }),
      arenaSand: new THREE.MeshStandardMaterial({ color: 0xcbb596, roughness: 0.92, metalness: 0.02 }),
      turfLawn: new THREE.MeshStandardMaterial({ color: 0x5c6b48, roughness: 0.88, metalness: 0.02 }),
      foliageDark: new THREE.MeshStandardMaterial({ color: 0x465638, roughness: 0.86, metalness: 0.02 }),
      towerFacade: new THREE.MeshStandardMaterial({ map: facadeTex, roughness: 0.72, metalness: 0.08 }),
    };

    // 4. Base Plateau Platform & Water Surface
    const basePlatformGeo = new THREE.CylinderGeometry(36, 38, 0.65, 64);
    const basePlatformMat = new THREE.MeshStandardMaterial({
      map: plateauTex,
      roughness: 0.88,
      metalness: 0.03,
    });
    const basePlatform = new THREE.Mesh(basePlatformGeo, basePlatformMat);
    basePlatform.position.set(0, -0.32, 0);
    basePlatform.receiveShadow = true;
    scene.add(basePlatform);

    // Foreground Water Basin
    const waterShape = new THREE.Shape();
    waterShape.moveTo(-34, -4);
    waterShape.bezierCurveTo(-24, -2, -19, 3, -14, 8);
    waterShape.bezierCurveTo(-9, 13, -6, 19, -1, 29);
    waterShape.lineTo(-16, 32);
    waterShape.bezierCurveTo(-22, 22, -28, 12, -35, 4);
    waterShape.closePath();

    const waterGeo = new THREE.ShapeGeometry(waterShape, 32);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x395864,
      roughness: 0.24,
      metalness: 0.38,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = 0.03;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);

    // Cable-Stayed Suspension Bridge
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(-7.8, 0.05, 19.2);
    bridgeGroup.rotation.y = THREE.MathUtils.degToRad(28);
    scene.add(bridgeGroup);

    const deckGeo = new THREE.BoxGeometry(1.1, 0.14, 9.5);
    const deckMesh = new THREE.Mesh(deckGeo, mats.limestone);
    deckMesh.position.y = 0.72;
    deckMesh.castShadow = true;
    bridgeGroup.add(deckMesh);

    [-2.1, 2.1].forEach((zOff) => {
      const pylonGeo = new THREE.ConeGeometry(0.32, 3.2, 4);
      const pylon = new THREE.Mesh(pylonGeo, mats.limestone);
      pylon.position.set(0, 1.6, zOff);
      pylon.castShadow = true;
      bridgeGroup.add(pylon);

      const cablePts: THREE.Vector3[] = [];
      const topPt = new THREE.Vector3(0, 2.95, zOff);
      [-2.2, -1.5, -0.8, 0.8, 1.5, 2.2].forEach((cSpan) => {
        cablePts.push(topPt.clone(), new THREE.Vector3(0.38, 0.78, zOff + cSpan));
        cablePts.push(topPt.clone(), new THREE.Vector3(-0.38, 0.78, zOff + cSpan));
      });
      const cableGeo = new THREE.BufferGeometry().setFromPoints(cablePts);
      const cableLines = new THREE.LineSegments(
        cableGeo,
        new THREE.LineBasicMaterial({ color: 0xefe8dc, transparent: true, opacity: 0.75 })
      );
      bridgeGroup.add(cableLines);
    });

    // 5. Build 3 Academy Hub Models
    function createCompoundPlinth(w: number, d: number, h = 0.32): THREE.Group {
      const g = new THREE.Group();
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats.sandstone);
      plinth.position.y = h * 0.5;
      plinth.receiveShadow = true;
      plinth.castShadow = true;
      g.add(plinth);

      const turf = new THREE.Mesh(new THREE.BoxGeometry(w - 0.35, 0.06, d - 0.35), mats.turfLawn);
      turf.position.y = h + 0.03;
      turf.receiveShadow = true;
      g.add(turf);

      const pts = [
        new THREE.Vector3(-w * 0.52, h + 0.05, -d * 0.52),
        new THREE.Vector3(w * 0.52, h + 0.05, -d * 0.52),
        new THREE.Vector3(w * 0.52, h + 0.05, d * 0.52),
        new THREE.Vector3(-w * 0.52, h + 0.05, d * 0.52),
        new THREE.Vector3(-w * 0.52, h + 0.05, -d * 0.52),
      ];
      const curbCurve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.08);
      const curbGeo = new THREE.TubeGeometry(curbCurve, 48, 0.065, 6, true);
      const curbMat = new THREE.MeshBasicMaterial({ color: 0xe5b879, transparent: true, opacity: 0.85 });
      const curbMesh = new THREE.Mesh(curbGeo, curbMat);
      g.add(curbMesh);
      return g;
    }

    function createRidingArena(w: number, d: number, x: number, y: number, z: number): THREE.Group {
      const ag = new THREE.Group();
      ag.position.set(x, y, z);
      const sand = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), mats.arenaSand);
      sand.receiveShadow = true;
      ag.add(sand);

      const nRail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, 0.08), mats.limestone);
      nRail.position.set(0, 0.08, -d * 0.5);
      const sRail = nRail.clone();
      sRail.position.z = d * 0.5;
      const eRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, d), mats.limestone);
      eRail.position.set(w * 0.5, 0.08, 0);
      const wRail = eRail.clone();
      wRail.position.x = -w * 0.5;
      ag.add(nRail, sRail, eRail, wRail);

      [-w * 0.2, w * 0.18].forEach((jx, idx) => {
        const jump = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.06), mats.bronze);
        jump.position.set(jx, 0.09, (idx === 0 ? -0.2 : 0.25) * d);
        jump.rotation.y = 0.35;
        ag.add(jump);
      });
      return ag;
    }

    const hubsMap: Record<string, THREE.Group> = {};

    // 01A: Narsingi / Financial District
    const hub01A = createCompoundPlinth(7.8, 6.2, 0.34);
    hub01A.position.set(3.5, 0, 11.2);
    hub01A.rotation.y = THREE.MathUtils.degToRad(-24);
    const b01A = new THREE.Group();
    b01A.position.set(-1.35, 0.38, -0.35);
    const mainHall01A = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.55, 2.3), mats.limestone);
    mainHall01A.position.y = 0.78;
    mainHall01A.castShadow = true;
    mainHall01A.receiveShadow = true;
    b01A.add(mainHall01A);
    const cornice01A = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 2.5), mats.sandstone);
    cornice01A.position.y = 1.62;
    b01A.add(cornice01A);
    [-1.0, 0, 1.0].forEach((px) => {
      const winGlow = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.95, 2.34), mats.warmGlow);
      winGlow.position.set(px, 0.65, 0);
      b01A.add(winGlow);
    });
    [-1.45, -0.5, 0.5, 1.45].forEach((px) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.55, 2.42), mats.limestone);
      col.position.set(px, 0.78, 0);
      col.castShadow = true;
      b01A.add(col);
    });
    hub01A.add(b01A);
    hub01A.add(createRidingArena(3.4, 2.6, 1.65, 0.38, 0.65));
    scene.add(hub01A);
    hubsMap["01A"] = hub01A;

    // 01C: Gachibowli / Madhapur
    const hub01C = createCompoundPlinth(7.2, 5.6, 0.34);
    hub01C.position.set(-15.2, 0, 1.4);
    hub01C.rotation.y = THREE.MathUtils.degToRad(26);
    const b01C = new THREE.Group();
    b01C.position.set(-1.2, 0.38, -0.4);
    const lowerWing = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.75, 2.1), mats.darkStone);
    lowerWing.position.y = 0.38;
    lowerWing.castShadow = true;
    b01C.add(lowerWing);
    const glassStrip = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.48, 2.14), mats.warmGlow);
    glassStrip.position.y = 0.38;
    b01C.add(glassStrip);
    const midSlab = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.14, 2.55), mats.sandstone);
    midSlab.position.y = 0.78;
    midSlab.castShadow = true;
    b01C.add(midSlab);
    const upperPavilion = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.58, 1.6), mats.darkStone);
    upperPavilion.position.y = 1.12;
    upperPavilion.castShadow = true;
    b01C.add(upperPavilion);
    const topRoof = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.14, 2.05), mats.roofSlate);
    topRoof.position.y = 1.45;
    topRoof.castShadow = true;
    b01C.add(topRoof);
    hub01C.add(b01C);
    hub01C.add(createRidingArena(3.1, 2.4, 1.55, 0.38, 0.45));
    scene.add(hub01C);
    hubsMap["01C"] = hub01C;

    // 01B: Begumpet & Jubilee Hills
    const hub01B = createCompoundPlinth(8.6, 6.8, 0.52);
    hub01B.position.set(1.8, 0, -8.2);
    hub01B.rotation.y = THREE.MathUtils.degToRad(-18);
    const b01B = new THREE.Group();
    b01B.position.set(-1.1, 0.55, -0.35);
    const palaceBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.45, 2.5), mats.limestone);
    palaceBody.position.y = 0.72;
    palaceBody.castShadow = true;
    palaceBody.receiveShadow = true;
    b01B.add(palaceBody);
    [-1.35, -0.45, 0.45, 1.35].forEach((wx) => {
      const wBay = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.92, 2.54), mats.warmGlow);
      wBay.position.set(wx, 0.68, 0);
      b01B.add(wBay);
    });
    const centerTower = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.85, 1.85), mats.limestone);
    centerTower.position.set(0, 1.75, 0);
    centerTower.castShadow = true;
    b01B.add(centerTower);
    const pedimentRoof = new THREE.Mesh(new THREE.ConeGeometry(1.42, 0.65, 4), mats.roofSlate);
    pedimentRoof.position.set(0, 2.48, 0);
    pedimentRoof.rotation.y = Math.PI / 4;
    b01B.add(pedimentRoof);
    [-1.75, 1.75].forEach((tx) => {
      const turret = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.55, 0.95), mats.sandstone);
      turret.position.set(tx, 1.62, 0);
      turret.castShadow = true;
      b01B.add(turret);
      const tRoof = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.42, 4), mats.roofSlate);
      tRoof.position.set(tx, 2.08, 0);
      tRoof.rotation.y = Math.PI / 4;
      b01B.add(tRoof);
    });
    hub01B.add(b01B);
    hub01B.add(createRidingArena(3.6, 2.7, 1.95, 0.56, 0.75));
    scene.add(hub01B);
    hubsMap["01B"] = hub01B;
    hubGroupsRef.current = hubsMap;

    // 6. Outer Ring Road and Arterial Routes
    const orrPoints = [
      new THREE.Vector3(-29, 0.12, 8),
      new THREE.Vector3(-24, 0.14, -7),
      new THREE.Vector3(-14, 0.16, -17),
      new THREE.Vector3(0, 0.16, -21),
      new THREE.Vector3(14, 0.16, -17),
      new THREE.Vector3(23, 0.14, -6),
      new THREE.Vector3(22, 0.14, 7),
      new THREE.Vector3(12, 0.14, 17),
      new THREE.Vector3(-2, 0.14, 21),
      new THREE.Vector3(-12, 0.14, 15),
      new THREE.Vector3(-22, 0.12, 12),
      new THREE.Vector3(-29, 0.12, 8),
    ];
    const orrCurve = new THREE.CatmullRomCurve3(orrPoints, true);
    const orrRoadGeo = new THREE.TubeGeometry(orrCurve, 120, 0.34, 6, true);
    orrRoadGeo.scale(1, 0.18, 1);
    const orrRoadMat = new THREE.MeshStandardMaterial({ color: 0x8c7b6b, roughness: 0.75 });
    scene.add(new THREE.Mesh(orrRoadGeo, orrRoadMat));

    const orrGlowGeo = new THREE.TubeGeometry(orrCurve, 120, 0.09, 6, true);
    const orrGlowMat = new THREE.MeshBasicMaterial({ color: 0xe5b879, transparent: true, opacity: 0.75 });
    scene.add(new THREE.Mesh(orrGlowGeo, orrGlowMat));

    const hubRouteSpecs: Record<string, THREE.Vector3[]> = {
      "01A": [
        new THREE.Vector3(-11.5, 0.15, 4.5),
        new THREE.Vector3(-5.0, 0.15, 6.2),
        new THREE.Vector3(-0.8, 0.15, 9.8),
        new THREE.Vector3(3.5, 0.18, 11.2),
        new THREE.Vector3(10.5, 0.15, 13.5),
      ],
      "01C": [
        new THREE.Vector3(-23.0, 0.15, 7.5),
        new THREE.Vector3(-18.5, 0.15, 4.2),
        new THREE.Vector3(-15.2, 0.18, 1.4),
        new THREE.Vector3(-9.5, 0.15, -3.5),
        new THREE.Vector3(-2.0, 0.15, -7.2),
      ],
      "01B": [
        new THREE.Vector3(-9.5, 0.15, -3.5),
        new THREE.Vector3(-3.5, 0.16, -6.5),
        new THREE.Vector3(1.8, 0.22, -8.2),
        new THREE.Vector3(8.5, 0.16, -4.5),
        new THREE.Vector3(11.5, 0.15, 4.5),
      ],
    };

    const routePulseMeshes: Record<string, { mesh: THREE.Mesh; mat: THREE.Material; curve: THREE.CatmullRomCurve3 }> = {};
    Object.keys(hubRouteSpecs).forEach((hKey) => {
      const c = new THREE.CatmullRomCurve3(hubRouteSpecs[hKey]);
      const bedGeo = new THREE.TubeGeometry(c, 48, 0.28, 6, false);
      bedGeo.scale(1, 0.18, 1);
      scene.add(new THREE.Mesh(bedGeo, orrRoadMat));

      const pulseGeo = new THREE.TubeGeometry(c, 48, 0.11, 6, false);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: 0xf3c78b,
        transparent: true,
        opacity: hKey === "01A" ? 0.95 : 0.42,
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      pulseMesh.position.y = 0.04;
      scene.add(pulseMesh);
      routePulseMeshes[hKey] = { mesh: pulseMesh, mat: pulseMat, curve: c };
    });
    routePulseMeshesRef.current = routePulseMeshes;

    const travelerGeo = new THREE.SphereGeometry(0.24, 12, 12);
    const travelerMat = new THREE.MeshBasicMaterial({ color: 0xfff3d6 });
    const routeTraveler = new THREE.Mesh(travelerGeo, travelerMat);
    scene.add(routeTraveler);
    routeTravelerRef.current = routeTraveler;

    // 7. Instanced City Blocks & Trees
    let seed = 4219;
    function sRand() {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    }

    function isInsideExclusion(x: number, z: number): boolean {
      if (Math.hypot(x - 3.5, z - 11.2) < 5.6) return true;
      if (Math.hypot(x - -15.2, z - 1.4) < 5.2) return true;
      if (Math.hypot(x - 1.8, z - -8.2) < 6.0) return true;
      if (Math.hypot((x + 1.5) * 0.85, (z - 1.2) * 1.15) < 6.2) return true;
      if (x < -5.5 && z > 8.5 && x + z * 0.7 < 4.5) return true;
      return false;
    }

    const towerCount = 60;
    const towerGeo = new THREE.BoxGeometry(0.95, 1.0, 0.95);
    towerGeo.translate(0, 0.5, 0);
    const towersInstanced = new THREE.InstancedMesh(towerGeo, mats.towerFacade, towerCount);
    towersInstanced.castShadow = true;
    towersInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const towerClusters = [
      [11.5, 7.5], [13.2, 4.0], [9.5, 10.5],
      [-10.5, -1.5], [-18.8, -3.2], [-11.5, 5.2],
      [-4.5, -11.5], [7.8, -9.5], [11.0, -3.5],
    ];

    let tIdx = 0;
    for (let i = 0; i < 180 && tIdx < towerCount; i++) {
      const c = towerClusters[i % towerClusters.length];
      const tx = c[0] + (sRand() - 0.5) * 6.5;
      const tz = c[1] + (sRand() - 0.5) * 6.5;
      if (isInsideExclusion(tx, tz)) continue;
      const h = 1.4 + sRand() * 2.2;
      const w = 0.75 + sRand() * 0.55;
      dummy.position.set(tx, 0.02, tz);
      dummy.scale.set(w, h, w);
      dummy.rotation.y = (sRand() - 0.5) * 0.6;
      dummy.updateMatrix();
      towersInstanced.setMatrixAt(tIdx++, dummy.matrix);
    }
    scene.add(towersInstanced);

    const lowRiseCount = 340;
    const lowRiseGeo = new THREE.BoxGeometry(0.75, 1.0, 0.65);
    lowRiseGeo.translate(0, 0.5, 0);
    const lowRiseInstanced = new THREE.InstancedMesh(lowRiseGeo, mats.limestone, lowRiseCount);
    lowRiseInstanced.castShadow = true;

    let lIdx = 0;
    for (let i = 0; i < 750 && lIdx < lowRiseCount; i++) {
      const angle = sRand() * Math.PI * 2;
      const rad = 5.5 + Math.pow(sRand(), 0.75) * 21.0;
      const lx = Math.cos(angle) * rad * 1.15;
      const lz = Math.sin(angle) * rad * 0.92;
      if (isInsideExclusion(lx, lz)) continue;
      dummy.position.set(lx, 0.01, lz);
      dummy.scale.set(0.55 + sRand() * 0.85, 0.24 + sRand() * 0.55, 0.55 + sRand() * 0.85);
      dummy.rotation.y = (sRand() - 0.5) * 0.5;
      dummy.updateMatrix();
      lowRiseInstanced.setMatrixAt(lIdx++, dummy.matrix);
    }
    scene.add(lowRiseInstanced);

    const treeCount = 260;
    const crownGeo = new THREE.DodecahedronGeometry(0.36, 1);
    crownGeo.translate(0, 0.42, 0);
    const treesInstanced = new THREE.InstancedMesh(crownGeo, mats.foliageDark, treeCount);
    treesInstanced.castShadow = true;

    let trIdx = 0;
    const hubCenters = [[3.5, 11.2, 4.3], [-15.2, 1.4, 3.9], [1.8, -8.2, 4.7]];
    hubCenters.forEach(([hx, hz, hRad]) => {
      for (let k = 0; k < 36 && trIdx < treeCount; k++) {
        const a = (k / 36) * Math.PI * 2 + (sRand() - 0.5) * 0.15;
        const r = hRad * (0.72 + sRand() * 0.42);
        dummy.position.set(hx + Math.cos(a) * r, 0.18, hz + Math.sin(a) * r * 0.82);
        const sc = 0.65 + sRand() * 0.75;
        dummy.scale.set(sc, sc * 1.1, sc);
        dummy.updateMatrix();
        treesInstanced.setMatrixAt(trIdx++, dummy.matrix);
      }
    });

    while (trIdx < treeCount) {
      const angle = sRand() * Math.PI * 2;
      const rad = 6.0 + sRand() * 19.0;
      const tx = Math.cos(angle) * rad;
      const tz = Math.sin(angle) * rad * 0.88;
      if (Math.hypot(tx + 1.5, tz - 1.2) < 5.5) continue;
      const sc = 0.55 + sRand() * 0.8;
      dummy.position.set(tx, 0.02, tz);
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      treesInstanced.setMatrixAt(trIdx++, dummy.matrix);
    }
    scene.add(treesInstanced);

    // 8. Interaction Event Listeners
    const canvasEl = renderer.domElement;
    const handleDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = (e.clientX - prevPointerRef.current.x) * 0.0065;
      const dy = (e.clientY - prevPointerRef.current.y) * 0.0065;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };

      const offset = camera.position.clone().sub(cameraTargetRef.current);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta -= dx;
      spherical.phi = Math.max(0.32, Math.min(1.28, spherical.phi - dy));
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
      const nextDist = Math.max(12, Math.min(50, dist + e.deltaY * 0.025));
      offset.setLength(nextDist);
      camera.position.copy(cameraTargetRef.current).add(offset);
      camera.lookAt(cameraTargetRef.current);
    };

    canvasEl.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    canvasEl.addEventListener("wheel", handleWheel, { passive: false });

    // 9. Projection & Animation Loop
    let visible = false;
    let lastProjection = 0;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(container);
    const projVec = new THREE.Vector3();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      if (!visible || document.hidden) return;

      // Route pulse traveler
      routeProgressRef.current = (routeProgressRef.current + 0.0045) % 1.0;
      const activeKey = selectedHubRef.current;
      const rObj = routePulseMeshesRef.current[activeKey];
      if (rObj && routeTravelerRef.current) {
        const pt = rObj.curve.getPointAt(routeProgressRef.current);
        routeTravelerRef.current.position.copy(pt).add(new THREE.Vector3(0, 0.08, 0));
      }

      // Update projected 2D screen positions for DOM cards
      if (containerRef.current && cameraRef.current && performance.now() - lastProjection > 80) {
        lastProjection = performance.now();
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;
        const cam = cameraRef.current;

        const nextMarkers = HYDERABAD_HUBS.map((hub) => {
          const worldPos = new THREE.Vector3(hub.worldPos[0], hub.worldPos[1] + 1.85, hub.worldPos[2]);
          projVec.copy(worldPos).project(cam);
          const isVisible = projVec.z < 1.0;
          const sx = (projVec.x * 0.5 + 0.5) * cw;
          const sy = (-projVec.y * 0.5 + 0.5) * ch;
          return {
            id: hub.id,
            x: sx,
            y: sy,
            visible: isVisible,
            hub,
          };
        });
        setProjectedMarkers(nextMarkers);
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = Math.max(1, containerRef.current.clientHeight);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
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

  // Sync activeHubId changes without re-mounting
  useEffect(() => {
    selectedHubRef.current = selectedHub;
  }, [selectedHub]);

  // Focus a specific hub with smooth camera animation
  const focusHub = useCallback(
    (hubId: "01A" | "01B" | "01C", animateCamera = true) => {
      setSelection({ source: activeHubId, id: hubId });
      const hub = HYDERABAD_HUBS.find((h) => h.id === hubId);
      if (!hub || !cameraRef.current) return;

      if (onSelectHub) {
        onSelectHub(hubId);
      }

      // Highlight active route pulse & hub scale
      Object.keys(routePulseMeshesRef.current).forEach((k) => {
        const rObj = routePulseMeshesRef.current[k];
        gsap.to(rObj.mat, { opacity: k === hubId ? 0.98 : 0.35, duration: 0.45 });
      });

      Object.keys(hubGroupsRef.current).forEach((k) => {
        const grp = hubGroupsRef.current[k];
        const targetScale = k === hubId ? 1.05 : 1.0;
        gsap.to(grp.scale, { x: targetScale, y: targetScale, z: targetScale, duration: 0.5, ease: "power3.out" });
      });

      if (animateCamera) {
        gsap.killTweensOf(cameraRef.current.position);
        gsap.killTweensOf(cameraTargetRef.current);

        gsap.to(cameraRef.current.position, {
          x: hub.camPos[0],
          y: hub.camPos[1],
          z: hub.camPos[2],
          duration: 1.35,
          ease: "power3.inOut",
          onUpdate: () => {
            if (cameraRef.current) cameraRef.current.lookAt(cameraTargetRef.current);
          },
        });

        gsap.to(cameraTargetRef.current, {
          x: hub.camTarget[0],
          y: hub.camTarget[1],
          z: hub.camTarget[2],
          duration: 1.35,
          ease: "power3.inOut",
        });
      }
    },
    [activeHubId, onSelectHub]
  );

  const resetOverview = useCallback(() => {
    if (!cameraRef.current) return;
    gsap.killTweensOf(cameraRef.current.position);
    gsap.killTweensOf(cameraTargetRef.current);

    gsap.to(cameraRef.current.position, {
      x: 3.2,
      y: 22.0,
      z: 31.5,
      duration: 1.4,
      ease: "power3.inOut",
      onUpdate: () => {
        if (cameraRef.current) cameraRef.current.lookAt(cameraTargetRef.current);
      },
    });

    gsap.to(cameraTargetRef.current, {
      x: -1.2,
      y: 0.2,
      z: 1.2,
      duration: 1.4,
      ease: "power3.inOut",
    });

    Object.keys(hubGroupsRef.current).forEach((k) => {
      gsap.to(hubGroupsRef.current[k].scale, { x: 1, y: 1, z: 1, duration: 0.5 });
    });
  }, []);

  return (
    <div className={`relative w-full h-full overflow-hidden select-none bg-[#F5F0E7] ${className}`}>
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Atmospheric Cloud Mist & Soft Ivory Vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(to right, rgba(245,240,231,0.5) 0%, transparent 12%, transparent 88%, rgba(245,240,231,0.5) 100%), linear-gradient(to bottom, rgba(245,240,231,0.85) 0%, transparent 15%, transparent 85%, rgba(245,240,231,0.95) 100%)",
        }}
      />

      {/* Top Road Callout */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <span className="text-[10px] tracking-[0.28em] uppercase text-[#6E5D52] font-mono px-3.5 py-1 rounded-full bg-[#F5F0E7]/85 backdrop-blur-sm border border-[#DCD3C6] shadow-sm">
          OUTER RING ROAD · HYDERABAD DIORAMA
        </span>
      </div>

      {/* Floating 3D-Projected DOM Markers for 01A, 01B, 01C */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {projectedMarkers.map((m) => {
          if (!m.visible) return null;
          const isSelected = selectedHub === m.id;
          const isHovered = hoveredHub === m.id;
          const [offX, offY] = m.hub.cardOffset;

          return (
            <div
              key={m.id}
              className="absolute pointer-events-auto transition-transform duration-150"
              style={{
                left: `${m.x}px`,
                top: `${m.y}px`,
                transform: "translate3d(0, 0, 0)",
              }}
            >
              {/* Pin */}
              <div
                data-hub-pin={m.id}
                className="cursor-pointer -translate-x-1/2 -translate-y-full flex flex-col items-center group"
                onClick={() => focusHub(m.id)}
                onMouseEnter={() => setHoveredHub(m.id)}
                onMouseLeave={() => setHoveredHub(null)}
              >
                <div
                  className={`w-10 h-10 rounded-t-full rounded-bl-full -rotate-45 border flex items-center justify-center transition-all duration-300 ${
                    isSelected || isHovered
                      ? "bg-[#231A15] border-[#E5B98B] scale-110 shadow-lg shadow-black/40"
                      : "bg-[#3D2E25] border-[#C89B6E]/70 shadow-md"
                  }`}
                >
                  <svg viewBox="0 0 64 64" className="w-5 h-5 fill-current text-[#F5F0E7] rotate-45">
                    <path d="M44.5 14.2c-1.8-3.6-5.2-6.2-9.2-6.8l-2.8-3.4-1.2 3.8c-4.5.4-8.8 2.8-11.6 6.6-2.4 3.2-3.6 7.2-3.8 11.4-.2 3.2.5 6.4 1.6 9.4l-4.2 7.2c-.8 1.4-.4 3.2.9 4.1l2.8 1.9c1.1.7 2.6.5 3.5-.5l3.9-4.1c1.8.8 3.8 1.2 5.8 1.1v11.1h16.5c-.6-5.8-1.9-11.5-3.9-16.8 2.4-2.8 3.9-6.4 4.1-10.2.3-5.2-1-10.4-2.4-14.8z" />
                  </svg>
                </div>
                <div className="w-[1.5px] h-2 bg-gradient-to-b from-[#936746] to-transparent" />
                <div className="w-6 h-2 rounded-full bg-[#C89B6E]/50 blur-[1px]" />
              </div>

              {/* Floating Ivory Card */}
              <div
                data-hub-card={m.id}
                className={`absolute pointer-events-auto cursor-pointer p-3 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 w-44 ${
                  isSelected || isHovered
                    ? "bg-[#F5F0E7]/95 border-[#936746] shadow-[#2C211B]/20 scale-105"
                    : "bg-[#F5F0E7]/85 border-[#DCD3C6] shadow-black/10 hover:border-[#936746]"
                }`}
                style={{ left: `${offX}px`, top: `${offY}px` }}
                onClick={() => focusHub(m.id)}
                onMouseEnter={() => setHoveredHub(m.id)}
                onMouseLeave={() => setHoveredHub(null)}
              >
                <div className="text-[9px] font-mono tracking-[0.16em] uppercase text-[#6E5D52] font-semibold">
                  {m.hub.zoneLabel}
                </div>
                <div className="font-serif text-base font-bold text-[#2C211B] leading-tight mt-0.5">
                  {m.hub.shortName}
                </div>
                <div className="text-[11px] text-[#4A3B31] leading-snug mt-1 font-medium">
                  {m.hub.hubType}
                </div>
                <div className="text-[10px] text-[#6E5D52] leading-snug">
                  {m.hub.stallions} Stallions
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Controls: Reset Overview, Telemetry & Replay Route */}
      <div className="absolute bottom-4 left-4 right-4 z-25 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F0E7]/90 backdrop-blur-md border border-[#DCD3C6] font-mono text-[10px] text-[#6E5D52] shadow-sm">
          <span className="text-[#2C211B] font-semibold">ZONE 01 · HYDERABAD</span>
          <span>·</span>
          <span>DEM 542m</span>
          <span>·</span>
          <span className="text-[#936746]">Proposed Concept Model</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={resetOverview}
            className="px-3.5 py-1.5 rounded-full bg-[#F5F0E7]/90 hover:bg-[#2C211B] text-[#2C211B] hover:text-[#F5F0E7] border border-[#DCD3C6] text-[10px] font-mono uppercase tracking-[0.15em] font-medium shadow-sm transition-all cursor-pointer"
          >
            Reset View
          </button>
          <button
            type="button"
            onClick={() => focusHub(selectedHub, true)}
            className="px-3.5 py-1.5 rounded-full bg-[#936746] hover:bg-[#7D5538] text-white text-[10px] font-mono uppercase tracking-[0.15em] font-medium shadow-md transition-all cursor-pointer"
          >
            Replay Route
          </button>
        </div>
      </div>
    </div>
  );
}
