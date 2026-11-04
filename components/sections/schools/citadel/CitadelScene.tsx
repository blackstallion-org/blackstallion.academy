"use client";

import React, { useCallback, useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { HUB_DATA, LIGHTING_PRESETS, PIN_CONFIGS, HORSE_PATHS } from "./citadelData";
import { disposeThreeScene } from "@/lib/three-dispose";
import { detectQualityTier } from "@/lib/3d/device-tier";
import { sameMarkers, warmUp, watchSize } from "../scene-kit";

export interface CitadelSceneHandle {
  flyTo: (cam: { theta: number; phi: number; radius: number; targetX: number; targetY: number; targetZ: number }, duration?: number) => void;
  replayAssembly: (hub: 'standard' | 'signature' | 'royal') => void;
}

export interface CitadelSceneProps {
  currentHub: 'standard' | 'signature' | 'royal';
  lightingMode: number;
  layerVisibility: {
    ground: boolean;
    architecture: boolean;
    environment: boolean;
    lighting: boolean;
    interface: boolean;
  };
  onAzimuthChange?: (deg: number) => void;
  onPinsUpdate?: (pins: { id: string; x: number; y: number; visible: boolean }[]) => void;
  onSelectFacility?: (facility: string) => void;
  /** Called once, when the shaders are ready and the first frame has been drawn. */
  onReady?: () => void;
}

// Procedural Canvas Textures
function createSandTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(c);

  ctx.fillStyle = '#D5B88E';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(166, 131, 88, 0.22)';
  ctx.lineWidth = 2;
  for (let y = 0; y < 512; y += 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(145, 108, 68, 0.28)';
  ctx.lineWidth = 10;
  ctx.strokeRect(42, 42, 428, 428);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(256, 256, 150, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,245,225,0.18)' : 'rgba(130,95,58,0.16)';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createTravertineTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(c);

  ctx.fillStyle = '#E5DAC5';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(120, 102, 82, 0.25)';
  ctx.lineWidth = 2;
  const step = 64;
  for (let y = 0; y <= 512; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
    const offset = (y / step) % 2 === 0 ? 0 : 64;
    for (let x = offset; x <= 512; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + step);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function createCedarLouverTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(c);

  ctx.fillStyle = '#5B3621';
  ctx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 8) {
    ctx.fillStyle = x % 16 === 0 ? '#3E2314' : '#78482C';
    ctx.fillRect(x, 0, 5, 256);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export const CitadelScene = forwardRef<CitadelSceneHandle, CitadelSceneProps>(function CitadelScene(
  { currentHub, lightingMode, layerVisibility, onAzimuthChange, onPinsUpdate, onReady },
  ref
) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  const callbacks = useRef({ onAzimuthChange, onPinsUpdate, onReady });
  useEffect(() => { callbacks.current = { onAzimuthChange, onPinsUpdate, onReady }; }, [onAzimuthChange, onPinsUpdate, onReady]);

  // References to three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);

  const groundGroupRef = useRef<THREE.Group | null>(null);
  const archGroupRef = useRef<THREE.Group | null>(null);
  const signatureArchGroupRef = useRef<THREE.Group | null>(null);
  const royalArchGroupRef = useRef<THREE.Group | null>(null);
  const southStablesGroupRef = useRef<THREE.Group | null>(null);
  const tackPavilionRef = useRef<THREE.Group | null>(null);
  const envGroupRef = useRef<THREE.Group | null>(null);
  const lightGroupRef = useRef<THREE.Group | null>(null);

  const animatedHorsesRef = useRef<THREE.Group[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const camState = useRef({
    theta: HUB_DATA.standard.cameraPos.theta,
    phi: HUB_DATA.standard.cameraPos.phi,
    radius: HUB_DATA.standard.cameraPos.radius,
    targetX: HUB_DATA.standard.cameraPos.targetX,
    targetY: HUB_DATA.standard.cameraPos.targetY,
    targetZ: HUB_DATA.standard.cameraPos.targetZ,
  });

  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });

  const updateCamera = useCallback(() => {
    if (!cameraRef.current) return;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    const mobileOffset = isMobile ? 5.2 : 0.0;
    const tx = camState.current.targetX + mobileOffset;
    const ty = camState.current.targetY;
    const tz = camState.current.targetZ;

    // The poses were framed for a landscape stage. On a taller, narrower one (the right-hand column on a laptop, or a
    // phone) the camera backs off in proportion, so the campus is never cropped at the sides.
    // (The wide layout asks for more room: the right edge of its stage carries the menu cards.)
    const fit = Math.min(isMobile ? 2 : 2.6, Math.max(1, (isMobile ? 1.55 : 2.05) / (cameraRef.current.aspect || 1)));
    const radius = camState.current.radius * fit;
    const x = tx + radius * Math.sin(camState.current.phi) * Math.sin(camState.current.theta);
    const y = ty + radius * Math.cos(camState.current.phi);
    const z = tz + radius * Math.sin(camState.current.phi) * Math.cos(camState.current.theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(tx, ty, tz);

    if (callbacks.current.onAzimuthChange) {
      const deg = Math.round((camState.current.theta * 180) / Math.PI);
      callbacks.current.onAzimuthChange(deg);
    }
  }, []);

  function flyTo(camPose: { theta: number; phi: number; radius: number; targetX: number; targetY: number; targetZ: number }, duration = 1.35) {
    gsap.to(camState.current, {
      theta: camPose.theta,
      phi: camPose.phi,
      radius: camPose.radius,
      targetX: camPose.targetX,
      targetY: camPose.targetY,
      targetZ: camPose.targetZ,
      duration,
      ease: 'power3.inOut',
      onUpdate: updateCamera,
    });
  }

  function replayAssembly(hubKey: 'standard' | 'signature' | 'royal') {
    if (southStablesGroupRef.current) {
      gsap.fromTo(
        southStablesGroupRef.current.position,
        { y: -2.2 },
        { y: 0, duration: 0.85, ease: 'back.out(1.4)' }
      );
    }
    if (tackPavilionRef.current) {
      gsap.fromTo(
        tackPavilionRef.current.position,
        { y: -2.5 },
        { y: 0.05, duration: 0.95, delay: 0.08, ease: 'back.out(1.3)' }
      );
    }
    if ((hubKey === 'signature' || hubKey === 'royal') && signatureArchGroupRef.current) {
      gsap.fromTo(
        signatureArchGroupRef.current.position,
        { y: -4.0 },
        { y: 0, duration: 1.05, delay: 0.14, ease: 'power3.out' }
      );
    }
    if (hubKey === 'royal' && royalArchGroupRef.current) {
      gsap.fromTo(
        royalArchGroupRef.current.position,
        { y: -5.0 },
        { y: 0, duration: 1.15, delay: 0.22, ease: 'power3.out' }
      );
    }
    flyTo(HUB_DATA[hubKey].cameraPos, 1.35);
  }

  useImperativeHandle(ref, () => ({
    flyTo,
    replayAssembly,
  }));

  // Initial Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xEFE6D5);
    scene.fog = new THREE.FogExp2(0xEFE6D5, 0.0085);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.5, 300);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    // Phones and low-power laptops draw fewer pixels, skip anti-aliasing and use a smaller shadow map; the scene is identical.
    const lowTier = detectQualityTier() === 'low';
    try { renderer = new THREE.WebGLRenderer({ antialias: !lowTier, powerPreference: 'high-performance' }); }
    catch { const frame = requestAnimationFrame(() => setUnavailable(true)); return () => cancelAnimationFrame(frame); }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowTier ? 1.25 : 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);
    animatedHorsesRef.current = [];

    // Groups
    const groundGroup = new THREE.Group();
    const archGroup = new THREE.Group();
    const signatureArchGroup = new THREE.Group();
    const royalArchGroup = new THREE.Group();
    const envGroup = new THREE.Group();
    const lightGroup = new THREE.Group();

    archGroup.add(signatureArchGroup);
    archGroup.add(royalArchGroup);

    scene.add(groundGroup);
    scene.add(archGroup);
    scene.add(envGroup);
    scene.add(lightGroup);

    groundGroupRef.current = groundGroup;
    archGroupRef.current = archGroup;
    signatureArchGroupRef.current = signatureArchGroup;
    royalArchGroupRef.current = royalArchGroup;
    envGroupRef.current = envGroup;
    lightGroupRef.current = lightGroup;

    // Materials
    const sandTex = createSandTexture();
    const travertineTex = createTravertineTexture();
    const cedarTex = createCedarLouverTexture();

    const matPlinthBase = new THREE.MeshStandardMaterial({ color: 0x3A281D, roughness: 0.65, metalness: 0.1 });
    const matGrassTerrain = new THREE.MeshStandardMaterial({ color: 0x8F8A64, roughness: 0.92, metalness: 0.02 });
    const matHillTerrain = new THREE.MeshStandardMaterial({ color: 0x9E9576, roughness: 0.95 });
    const matSandArena = new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.88, bumpMap: sandTex, bumpScale: 0.04 });
    const matTravertine = new THREE.MeshStandardMaterial({ map: travertineTex, color: 0xEDE3D2, roughness: 0.65, metalness: 0.05 });
    const matDarkBronze = new THREE.MeshStandardMaterial({ color: 0x261E19, roughness: 0.35, metalness: 0.65 });
    const matCedar = new THREE.MeshStandardMaterial({ map: cedarTex, roughness: 0.55, metalness: 0.08 });
    const matWarmGlow = new THREE.MeshBasicMaterial({ color: 0xFFCF8B });
    const matGlass = new THREE.MeshStandardMaterial({ color: 0xFFF3DC, transparent: true, opacity: 0.42, roughness: 0.15, metalness: 0.3 });

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xFFF6E5, 0x7A654B, 0.72);
    hemiLightRef.current = hemiLight;
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xFFD699, 1.55);
    sunLight.position.set(38, 26, -28);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = lowTier ? 1024 : 2048;
    sunLight.shadow.mapSize.height = lowTier ? 1024 : 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 130;
    const d = 34;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLightRef.current = sunLight;
    lightGroup.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xF5E1C8, 0.45);
    fillLight.position.set(-30, 18, 25);
    lightGroup.add(fillLight);

    for (let i = 0; i < 4; i++) {
      const pl = new THREE.PointLight(0xFFB454, 0.9, 11, 2);
      pl.position.set(-7.5 + i * 4.5, 1.6, 10.6);
      lightGroup.add(pl);
    }
    const tackPointLight = new THREE.PointLight(0xFFBC66, 1.15, 14, 2);
    tackPointLight.position.set(13.2, 1.9, 1.2);
    lightGroup.add(tackPointLight);

    // Ground Construction
    const plinthMesh = new THREE.Mesh(new THREE.BoxGeometry(68, 1.4, 56), matPlinthBase);
    plinthMesh.position.set(2, -0.9, -2);
    plinthMesh.receiveShadow = true;
    groundGroup.add(plinthMesh);

    const turfMesh = new THREE.Mesh(new THREE.BoxGeometry(66.8, 0.5, 54.8), matGrassTerrain);
    turfMesh.position.set(2, -0.15, -2);
    turfMesh.receiveShadow = true;
    groundGroup.add(turfMesh);

    const southPromenade = new THREE.Mesh(new THREE.BoxGeometry(24, 0.16, 7.5), matTravertine);
    southPromenade.position.set(-0.8, 0.12, 10.6);
    southPromenade.receiveShadow = true;
    groundGroup.add(southPromenade);

    const eastPromenade = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.16, 15.5), matTravertine);
    eastPromenade.position.set(13.2, 0.12, 1.2);
    eastPromenade.receiveShadow = true;
    groundGroup.add(eastPromenade);

    const pathConnect = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.14, 3.0), matTravertine);
    pathConnect.position.set(9.8, 0.11, 8.8);
    pathConnect.receiveShadow = true;
    groundGroup.add(pathConnect);

    const arenaSandMesh = new THREE.Mesh(new THREE.BoxGeometry(20.0, 0.18, 13.5), matSandArena);
    arenaSandMesh.position.set(-0.8, 0.14, 0.2);
    arenaSandMesh.receiveShadow = true;
    groundGroup.add(arenaSandMesh);

    const hillPositions = [
      { x: -16, z: -22, sx: 22, sy: 3.6, sz: 12 },
      { x: 6, z: -24, sx: 26, sy: 4.5, sz: 14 },
      { x: 25, z: -20, sx: 18, sy: 3.2, sz: 12 }
    ];
    hillPositions.forEach(h => {
      const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), matHillTerrain);
      hill.scale.set(h.sx, h.sy, h.sz);
      hill.position.set(h.x, -0.8, h.z);
      hill.receiveShadow = true;
      groundGroup.add(hill);
    });

    // Fences
    const fenceGroup = new THREE.Group();
    const aw = 20.4, ad = 13.9;
    const ax = -0.8, az = 0.2;

    function addFenceSegment(x1: number, z1: number, x2: number, z2: number, postsCount: number) {
      const dx = (x2 - x1) / postsCount;
      const dz = (z2 - z1) / postsCount;
      const segLen = Math.hypot(x2 - x1, z2 - z1);
      const angle = Math.atan2(z2 - z1, x2 - x1);

      [0.42, 0.78].forEach(ry => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.06, 0.06), matCedar);
        rail.position.set((x1 + x2) / 2, ry, (z1 + z2) / 2);
        rail.rotation.y = -angle;
        rail.castShadow = true;
        fenceGroup.add(rail);
      });
      const curb = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.18, 0.16), matTravertine);
      curb.position.set((x1 + x2) / 2, 0.14, (z1 + z2) / 2);
      curb.rotation.y = -angle;
      curb.receiveShadow = true;
      fenceGroup.add(curb);

      for (let i = 0; i <= postsCount; i++) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.92, 0.12), matDarkBronze);
        post.position.set(x1 + dx * i, 0.48, z1 + dz * i);
        post.castShadow = true;
        fenceGroup.add(post);
      }
    }
    addFenceSegment(ax - aw / 2, az - ad / 2, ax + aw / 2, az - ad / 2, 16);
    addFenceSegment(ax - aw / 2, az + ad / 2, ax + aw / 2, az + ad / 2, 16);
    addFenceSegment(ax - aw / 2, az - ad / 2, ax - aw / 2, az + ad / 2, 11);
    addFenceSegment(ax + aw / 2, az - ad / 2, ax + aw / 2, az + ad / 2, 11);
    archGroup.add(fenceGroup);

    // Obstacles
    function createJump(x: number, z: number, rotY: number) {
      const jg = new THREE.Group();
      [-1.1, 1.1].forEach(px => {
        const std = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.05, 0.12), matTravertine);
        std.position.set(px, 0.55, 0);
        std.castShadow = true;
        jg.add(std);
      });
      [0.45, 0.78].forEach((py, idx) => {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8),
          idx === 0 ? matCedar : matTravertine
        );
        pole.rotation.z = Math.PI / 2;
        pole.position.set(0, py, 0);
        pole.castShadow = true;
        jg.add(pole);
      });
      jg.position.set(x, 0.15, z);
      jg.rotation.y = rotY;
      return jg;
    }
    archGroup.add(createJump(-4.5, -2.2, 0.25));
    archGroup.add(createJump(2.5, -1.8, -0.2));
    archGroup.add(createJump(-3.2, 2.6, -0.15));
    archGroup.add(createJump(3.8, 2.4, 0.3));

    // Stables
    function createStableModule(x: number, z: number, rotY: number) {
      const mod = new THREE.Group();
      const baseWall = new THREE.Mesh(new THREE.BoxGeometry(4.1, 1.1, 3.2), matTravertine);
      baseWall.position.set(0, 0.65, 0);
      baseWall.castShadow = true;
      baseWall.receiveShadow = true;
      mod.add(baseWall);

      const upperWall = new THREE.Mesh(new THREE.BoxGeometry(4.12, 1.15, 3.16), matCedar);
      upperWall.position.set(0, 1.75, 0);
      upperWall.castShadow = true;
      mod.add(upperWall);

      const glowBox = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.65, 2.6), matWarmGlow);
      glowBox.position.set(0, 1.1, -0.15);
      mod.add(glowBox);

      [-1.95, -0.65, 0.65, 1.95].forEach(px => {
        const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.3, 0.22), matDarkBronze);
        mullion.position.set(px, 1.25, -1.55);
        mullion.castShadow = true;
        mod.add(mullion);
      });

      const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(4.35, 0.22, 4.3), matTravertine);
      roofSlab.position.set(0, 2.42, -0.35);
      roofSlab.castShadow = true;
      roofSlab.receiveShadow = true;
      mod.add(roofSlab);

      const roofFascia = new THREE.Mesh(new THREE.BoxGeometry(4.38, 0.1, 4.34), matDarkBronze);
      roofFascia.position.set(0, 2.52, -0.35);
      mod.add(roofFascia);

      const skylight = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.22, 1.1), matDarkBronze);
      skylight.position.set(0, 2.65, -0.1);
      mod.add(skylight);

      mod.position.set(x, 0.1, z);
      mod.rotation.y = rotY;
      return mod;
    }

    const southStablesGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      southStablesGroup.add(createStableModule(-7.5 + i * 4.5, 10.6, 0));
    }
    archGroup.add(southStablesGroup);
    southStablesGroupRef.current = southStablesGroup;

    // Tack Room Pavilion
    const tackPavilion = new THREE.Group();
    const tackPlinth = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.3, 8.8), matTravertine);
    tackPlinth.position.set(0, 0.25, 0);
    tackPlinth.receiveShadow = true;
    tackPavilion.add(tackPlinth);

    const tackCore = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.4, 6.8), matWarmGlow);
    tackCore.position.set(0.2, 1.5, 0);
    tackPavilion.add(tackCore);

    const tackGlass = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.45, 7.2), matGlass);
    tackGlass.position.set(0.1, 1.5, 0);
    tackPavilion.add(tackGlass);

    [-2.7, 2.7].forEach(cx => {
      [-3.9, -1.3, 1.3, 3.9].forEach(cz => {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.65, 0.18), matDarkBronze);
        col.position.set(cx, 1.6, cz);
        col.castShadow = true;
        tackPavilion.add(col);
      });
    });

    const tackRoof = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.28, 9.2), matTravertine);
    tackRoof.position.set(0, 2.95, 0);
    tackRoof.castShadow = true;
    tackPavilion.add(tackRoof);

    const tackClerestory = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.65, 5.4), matCedar);
    tackClerestory.position.set(0.2, 3.35, 0);
    tackClerestory.castShadow = true;
    tackPavilion.add(tackClerestory);

    tackPavilion.position.set(13.2, 0.05, 1.2);
    archGroup.add(tackPavilion);
    tackPavilionRef.current = tackPavilion;

    // Signature Arch Group
    const northPromenade = new THREE.Mesh(new THREE.BoxGeometry(21, 0.16, 6.2), matTravertine);
    northPromenade.position.set(-0.8, 0.12, -9.8);
    northPromenade.receiveShadow = true;
    signatureArchGroup.add(northPromenade);

    for (let i = 0; i < 4; i++) {
      signatureArchGroup.add(createStableModule(-7.5 + i * 4.5, -10.2, Math.PI));
    }

    const canopyGroup = new THREE.Group();
    const archSpan = 15.2;
    const archLength = 21.0;
    for (let i = 0; i <= 6; i++) {
      const xPos = -ax - archLength / 2 + (i * archLength) / 6 - 1.5;
      [-archSpan / 2, archSpan / 2].forEach(zPos => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 4.8, 10), matDarkBronze);
        col.position.set(xPos, 2.4, az + zPos);
        col.castShadow = true;
        canopyGroup.add(col);
      });
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, archSpan + 1.4), matDarkBronze);
      rib.position.set(xPos, 4.95, az);
      rib.castShadow = true;
      canopyGroup.add(rib);
    }
    const matCanopyRoof = new THREE.MeshStandardMaterial({
      color: 0x8C583A,
      roughness: 0.45,
      metalness: 0.3,
      transparent: true,
      opacity: 0.58
    });
    const canopyDeck = new THREE.Mesh(new THREE.BoxGeometry(archLength + 0.8, 0.14, archSpan + 1.0), matCanopyRoof);
    canopyDeck.position.set(-0.8, 5.05, az);
    canopyDeck.castShadow = true;
    canopyGroup.add(canopyDeck);
    signatureArchGroup.add(canopyGroup);

    // Royal Arch Group
    const westPromenade = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.16, 18.0), matTravertine);
    westPromenade.position.set(-15.2, 0.12, 0.2);
    westPromenade.receiveShadow = true;
    royalArchGroup.add(westPromenade);

    for (let i = 0; i < 4; i++) {
      royalArchGroup.add(createStableModule(-15.5, -5.2 + i * 3.8, -Math.PI / 2));
    }

    const royalColonnade = new THREE.Group();
    const colBase = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.45, 5.6), matTravertine);
    colBase.position.set(4.5, 0.3, -14.8);
    colBase.receiveShadow = true;
    royalColonnade.add(colBase);

    for (let i = 0; i < 7; i++) {
      const px = -2.7 + i * 2.4;
      [-1.8, 1.8].forEach(pz => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 3.8, 14), matTravertine);
        pillar.position.set(4.5 + px, 2.2, -14.8 + pz);
        pillar.castShadow = true;
        royalColonnade.add(pillar);
      });
    }
    const royalUpper = new THREE.Mesh(new THREE.BoxGeometry(16.8, 2.1, 4.4), matTravertine);
    royalUpper.position.set(4.5, 4.9, -14.8);
    royalUpper.castShadow = true;
    royalColonnade.add(royalUpper);

    const royalGlass = new THREE.Mesh(new THREE.BoxGeometry(14.6, 1.4, 4.55), matWarmGlow);
    royalGlass.position.set(4.5, 4.9, -14.8);
    royalColonnade.add(royalGlass);

    const royalRoof = new THREE.Mesh(new THREE.BoxGeometry(17.6, 0.35, 5.4), matCedar);
    royalRoof.position.set(4.5, 6.1, -14.8);
    royalRoof.castShadow = true;
    royalColonnade.add(royalRoof);
    royalArchGroup.add(royalColonnade);

    // Background School Wings
    const bgSchoolGroup = new THREE.Group();
    const schoolMat = new THREE.MeshStandardMaterial({ color: 0xDFD5C5, roughness: 0.75 });
    const schoolWingA = new THREE.Mesh(new THREE.BoxGeometry(11, 2.6, 4.2), schoolMat);
    schoolWingA.position.set(14, 1.3, -19.5);
    schoolWingA.rotation.y = -0.18;
    schoolWingA.castShadow = true;
    bgSchoolGroup.add(schoolWingA);

    const schoolWingB = new THREE.Mesh(new THREE.BoxGeometry(8.5, 3.2, 4.0), schoolMat);
    schoolWingB.position.set(6.5, 1.6, -21.0);
    schoolWingB.rotation.y = 0.12;
    schoolWingB.castShadow = true;
    bgSchoolGroup.add(schoolWingB);
    archGroup.add(bgSchoolGroup);

    // Environment: Trees
    const matTrunk = new THREE.MeshStandardMaterial({ color: 0x4A3222, roughness: 0.9 });
    const foliageColors = [0x4E5B3C, 0x5E6B46, 0x6E7852, 0x3F4B30];

    function createTree(x: number, z: number, scale: number, isCypress: boolean) {
      const tg = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.2 * scale, 1.2 * scale, 7), matTrunk);
      trunk.position.y = 0.6 * scale;
      trunk.castShadow = true;
      tg.add(trunk);

      const fMat = new THREE.MeshStandardMaterial({
        color: foliageColors[Math.floor(Math.random() * foliageColors.length)],
        roughness: 0.85
      });

      if (isCypress) {
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.65 * scale, 3.4 * scale, 9), fMat);
        spire.position.y = 2.1 * scale;
        spire.castShadow = true;
        tg.add(spire);
      } else {
        const blobs = [
          { dx: 0, dy: 1.85, dz: 0, r: 1.15 },
          { dx: 0.55, dy: 1.55, dz: 0.35, r: 0.82 },
          { dx: -0.5, dy: 1.6, dz: -0.35, r: 0.85 },
          { dx: 0.2, dy: 2.2, dz: -0.3, r: 0.75 }
        ];
        blobs.forEach(b => {
          const cMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(b.r * scale, 1), fMat);
          cMesh.position.set(b.dx * scale, b.dy * scale, b.dz * scale);
          cMesh.castShadow = true;
          cMesh.receiveShadow = true;
          tg.add(cMesh);
        });
      }
      tg.position.set(x, 0.1, z);
      return tg;
    }

    const treeCoords = [
      [-12.5, -6.5, 1.05, false], [-12.5, -2.5, 0.9, true], [-12.5, 1.5, 1.1, false], [-12.5, 5.5, 0.95, true],
      [-9.5, -7.6, 1.0, false], [-5.2, -7.6, 0.85, true], [0.5, -7.6, 1.1, false], [5.8, -7.6, 0.9, true], [9.8, -7.2, 1.15, false],
      [10.2, 7.6, 1.1, false], [6.8, 12.2, 1.25, false], [-11.5, 11.2, 1.2, false], [-14.2, 8.8, 0.95, true],
      [17.8, -4.5, 1.2, false], [18.5, 2.5, 1.05, true], [17.5, 7.8, 1.3, false],
      [-18, -14, 1.4, false], [-11, -16, 1.3, false], [-3, -15, 1.25, true], [11, -15, 1.35, false], [20, -13, 1.4, false]
    ] as const;

    treeCoords.forEach(([x, z, s, cyp]) => {
      envGroup.add(createTree(x, z, s, cyp));
    });

    // Articulated Horses
    const matHorseCoat = new THREE.MeshStandardMaterial({ color: 0x3B2214, roughness: 0.45, metalness: 0.1 });
    const matRiderBreeches = new THREE.MeshStandardMaterial({ color: 0xF5EFE4, roughness: 0.6 });
    const matRiderCoat = new THREE.MeshStandardMaterial({ color: 0x1E1814, roughness: 0.5 });

    function createArticulatedHorse() {
      const hg = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.42, 0.34), matHorseCoat);
      body.position.set(0, 0.62, 0);
      body.castShadow = true;
      hg.add(body);

      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.48, 0.2), matHorseCoat);
      neck.position.set(0.42, 0.88, 0);
      neck.rotation.z = -0.45;
      neck.castShadow = true;
      hg.add(neck);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.17), matHorseCoat);
      head.position.set(0.58, 1.04, 0);
      head.rotation.z = 0.25;
      hg.add(head);

      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.1), matDarkBronze);
      tail.position.set(-0.52, 0.56, 0);
      tail.rotation.z = 0.35;
      hg.add(tail);

      const legs: THREE.Mesh[] = [];
      [
        [0.34, 0.12], [0.34, -0.12],
        [-0.34, 0.12], [-0.34, -0.12]
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.48, 0.09), matHorseCoat);
        leg.position.set(lx, 0.24, lz);
        leg.castShadow = true;
        hg.add(leg);
        legs.push(leg);
      });

      const riderTorso = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.38, 0.24), matRiderCoat);
      riderTorso.position.set(-0.04, 1.02, 0);
      hg.add(riderTorso);

      const riderHead = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), matRiderBreeches);
      riderHead.position.set(-0.04, 1.28, 0);
      hg.add(riderHead);

      hg.userData.legs = legs;
      return hg;
    }

    animatedHorsesRef.current = [];
    HORSE_PATHS.forEach(hp => {
      const hMesh = createArticulatedHorse();
      hMesh.userData.path = hp;
      envGroup.add(hMesh);
      animatedHorsesRef.current.push(hMesh);
    });

    updateCamera();

    // Event Handlers
    const handlePointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      prevMouse.current.x = e.clientX;
      prevMouse.current.y = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      prevMouse.current.x = e.clientX;
      prevMouse.current.y = e.clientY;

      camState.current.theta -= dx * 0.0055;
      camState.current.phi = Math.max(0.28, Math.min(1.42, camState.current.phi - dy * 0.0045));
      updateCamera();
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      camState.current.radius = Math.max(16, Math.min(72, camState.current.radius + e.deltaY * 0.025));
      updateCamera();
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      cameraRef.current.aspect = w / h;
      // On the wide layout the right edge of the stage carries the menu and the site plan, so the picture is shifted left
      // an eighth of its width to keep the campus clear of them.
      const shift = window.matchMedia('(min-width: 1024px)').matches ? Math.round(w * 0.12) : 0;
      if (shift) cameraRef.current.setViewOffset(w, h, shift, 0, w, h);
      else cameraRef.current.clearViewOffset();
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
      updateCamera();
    };
    // Watches the stage itself, not only the window: its width changes with the layout, and a canvas left at the
    // size it was first measured at is what cropped the campus.
    const stopWatching = watchSize(container, handleResize);

    // Render loop
    const clock = new THREE.Clock();
    let visible = false;
    let compiled = false;
    let disposed = false;
    let lastProjection = 0;
    let lastPins: { x: number; y: number; visible: boolean }[] | null = null;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(container);
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      if (!compiled || !visible || document.hidden) return;
      const elapsed = clock.getElapsedTime();

      animatedHorsesRef.current.forEach(hMesh => {
        const hp = hMesh.userData.path;
        const angle = elapsed * hp.speed + hp.phase;
        const x = hp.cx + Math.cos(angle) * hp.rx;
        const z = hp.cz + Math.sin(angle) * hp.rz;
        hMesh.position.set(x, 0.14 + Math.abs(Math.sin(elapsed * 7)) * 0.06, z);

        const tx = -Math.sin(angle) * hp.rx * hp.speed;
        const tz = Math.cos(angle) * hp.rz * hp.speed;
        hMesh.rotation.y = Math.atan2(-tz, tx);

        const legs = hMesh.userData.legs as THREE.Mesh[];
        if (legs && legs.length === 4) {
          const stride = Math.sin(elapsed * 10 + hp.phase) * 0.38;
          legs[0].rotation.z = stride;
          legs[3].rotation.z = stride;
          legs[1].rotation.z = -stride;
          legs[2].rotation.z = -stride;
        }
      });

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      // Project 3D Pins
      if (callbacks.current.onPinsUpdate && container && cameraRef.current && performance.now() - lastProjection > 80) {
        lastProjection = performance.now();
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const pins = PIN_CONFIGS.map(pc => {
          const v = new THREE.Vector3(pc.pos[0], pc.pos[1], pc.pos[2]);
          v.project(cameraRef.current!);
          const visible = v.z < 1;
          const px = (v.x * 0.5 + 0.5) * cw;
          const py = (-(v.y * 0.5) + 0.5) * ch;
          return { id: pc.id, x: px, y: py, visible };
        });
        // Only when a pin has moved: a new array every 80 ms re-rendered this whole section about twelve times a second.
        if (!sameMarkers(lastPins, pins)) {
          lastPins = pins;
          callbacks.current.onPinsUpdate(pins);
        }
      }
    };
    animate();

    // Compile every shader in the background, draw one frame, then tell the page the scene is ready.
    void warmUp(renderer, scene, camera).then(() => {
      if (disposed) return;
      compiled = true;
      renderer.render(scene, camera);
      callbacks.current.onReady?.();
    });

    return () => {
      disposed = true;
      stopWatching();
      observer.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      container.removeEventListener('wheel', handleWheel);
      if (rendererRef.current?.domElement && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      gsap.killTweensOf(camState.current);
      scene.traverse((object) => { gsap.killTweensOf(object.position); gsap.killTweensOf(object.scale); });
      disposeThreeScene(scene);
      animatedHorsesRef.current = [];
      renderer.dispose();
    };
  }, [updateCamera]);

  // Update Hub Model visibility
  useEffect(() => {
    const showSig = currentHub === 'signature' || currentHub === 'royal';
    const showRoy = currentHub === 'royal';
    if (signatureArchGroupRef.current) signatureArchGroupRef.current.visible = showSig;
    if (royalArchGroupRef.current) royalArchGroupRef.current.visible = showRoy;
  }, [currentHub]);

  // Update Lighting Mode
  useEffect(() => {
    const preset = LIGHTING_PRESETS[lightingMode % LIGHTING_PRESETS.length];
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(preset.bg);
      if (sceneRef.current.fog) sceneRef.current.fog.color = new THREE.Color(preset.bg);
    }
    if (sunLightRef.current) {
      sunLightRef.current.color = new THREE.Color(preset.sunColor);
      sunLightRef.current.intensity = preset.sunInt;
    }
    if (hemiLightRef.current) {
      hemiLightRef.current.intensity = preset.hemiInt;
    }
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = preset.exposure;
    }
  }, [lightingMode]);

  // Update Layer Visibility
  useEffect(() => {
    if (groundGroupRef.current) groundGroupRef.current.visible = layerVisibility.ground;
    if (archGroupRef.current) archGroupRef.current.visible = layerVisibility.architecture;
    if (envGroupRef.current) envGroupRef.current.visible = layerVisibility.environment;
    if (lightGroupRef.current) lightGroupRef.current.visible = layerVisibility.lighting;
  }, [layerVisibility]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing"
      style={{ touchAction: "pan-y" }}
      title="Drag to orbit 3D campus · Ctrl-scroll to zoom · Click pins to inspect"
    >{unavailable && <p role="status" className="absolute bottom-8 left-6 right-6 text-sm text-[#4A3E35]">The 3D campus is unavailable on this device. Explore the hub specifications and site plans below.</p>}</div>
  );
});
