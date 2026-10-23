"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface TorchHorseStageProps {
  className?: string;
}

export function TorchHorseStage({ className = "" }: TorchHorseStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Pointer tracking ref for smooth animation loop
  const pointerRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ y: -0.4, targetY: -0.4 });

  // Handle pointer move
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Normalised [-1, 1]
    const normX = (clientX / rect.width) * 2 - 1;
    const normY = -((clientY / rect.height) * 2 - 1);

    pointerRef.current.targetX = normX;
    pointerRef.current.targetY = normY;

    if (isDraggingRef.current) {
      const deltaX = clientX - dragStartRef.current.x;
      rotationRef.current.targetY += deltaX * 0.007;
      dragStartRef.current = { x: clientX, y: clientY };
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    isDraggingRef.current = true;
    const rect = containerRef.current.getBoundingClientRect();
    dragStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animId = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let modelGroup: THREE.Group | null = null;

    // 1. Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0b09); // Elegant deep charcoal bronze background

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 4.2);

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
    } catch {
      return;
    }

    // 2. Chiaroscuro Studio Lighting (Removing black horse effect, showcasing bronze & stone sculpture)
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 1.25);
    scene.add(ambientLight);

    // Warm golden key light
    const keyLight = new THREE.DirectionalLight(0xffecd0, 2.8);
    keyLight.position.set(3.5, 4.2, 3.4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0008;
    scene.add(keyLight);

    // Soft cool fill light to maintain deep sculptural contrast
    const fillLight = new THREE.DirectionalLight(0xd4c3ad, 1.4);
    fillLight.position.set(-3.4, 2.4, 2.6);
    scene.add(fillLight);

    // Sharp ivory rim light chiseling crown, rider shoulders, and horse contours
    const rimLight = new THREE.DirectionalLight(0xfff7e8, 3.2);
    rimLight.position.set(-2.8, 4.6, -3.2);
    scene.add(rimLight);

    // Rear rim fill for 360 degree orbit
    const rearRimLight = new THREE.DirectionalLight(0xffe2b8, 1.8);
    rearRimLight.position.set(2.4, 3.6, -3.4);
    scene.add(rearRimLight);

    // Warm golden bounce light illuminating base and muscular undercarriage
    const bounceLight = new THREE.PointLight(0xc5a059, 1.8, 8);
    bounceLight.position.set(0, -1.2, 1.8);
    scene.add(bounceLight);

    // 3. Load the Old 3D Model: Classical Equestrian Statue (/models/rossbandiger-1/statue.glb)
    modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
    loader.setDRACOLoader(draco);
    const modelUrl = "/models/statue-mobile.glb";

    loader.load(
      modelUrl,
      (gltf) => {
        const root = gltf.scene;

        // Auto-fit & center the statue model cleanly
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 2.85 / maxDim;

        root.scale.setScalar(targetScale);
        root.position.x = -center.x * targetScale;
        root.position.y = -center.y * targetScale + 0.18; // slightly elevated above bottom text
        root.position.z = -center.z * targetScale;

        // Optimize materials for classical chiaroscuro bronze/patina finish
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (mesh.material) {
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              materials.forEach((mat) => {
                const stdMat = mat as THREE.MeshStandardMaterial;
                if ("roughness" in stdMat) {
                  stdMat.roughness = Math.min(Math.max(stdMat.roughness ?? 0.45, 0.36), 0.62);
                  stdMat.metalness = Math.min(Math.max(stdMat.metalness ?? 0.35, 0.24), 0.52);
                  stdMat.envMapIntensity = 1.3;
                  stdMat.needsUpdate = true;
                }
              });
            }
          }
        });

        modelGroup?.add(root);
        setIsLoaded(true);
      },
      (xhr) => {
        if (xhr.total > 0) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          setLoadingProgress(pct);
        }
      },
      (error) => {
        console.warn(`Failed to load ${modelUrl}, trying fallback /models/rossbandiger.glb:`, error);
        // Fallback to /models/rossbandiger.glb if needed
        loader.load("/models/rossbandiger.glb", (fallbackGltf) => {
          const fallbackRoot = fallbackGltf.scene;
          const box = new THREE.Box3().setFromObject(fallbackRoot);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const targetScale = 2.85 / Math.max(size.x, size.y, size.z);

          fallbackRoot.scale.setScalar(targetScale);
          fallbackRoot.position.x = -center.x * targetScale;
          fallbackRoot.position.y = -center.y * targetScale + 0.18;
          fallbackRoot.position.z = -center.z * targetScale;

          modelGroup?.add(fallbackRoot);
          setIsLoaded(true);
        });
      }
    );

    // 4. Resize observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 5. Animation loop
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth pointer interpolation
      pointerRef.current.x += (pointerRef.current.targetX - pointerRef.current.x) * 0.08;
      pointerRef.current.y += (pointerRef.current.targetY - pointerRef.current.y) * 0.08;

      // Smooth model rotation
      rotationRef.current.y += (rotationRef.current.targetY - rotationRef.current.y) * 0.08;

      // Slow majestic turntable rotation when user is not actively dragging
      if (!isDraggingRef.current && modelGroup) {
        rotationRef.current.targetY += 0.0018;
      }

      if (modelGroup) {
        modelGroup.rotation.y = rotationRef.current.y;
        // Subtle tilt based on pointer position for interactive depth
        modelGroup.rotation.x = pointerRef.current.y * 0.06;
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      draco.dispose();
      if (renderer) {
        renderer.dispose();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: "pan-y" }}
      className={`relative w-full h-full bg-[#0a0908] cursor-grab active:cursor-grabbing select-none overflow-hidden ${className}`}
    >
      {/* Subtle Atmospheric Radial Warmth behind the statue */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,rgba(197,160,89,0.12)_0%,rgba(20,18,15,0.6)_60%,#0a0908_100%)]"
      />


      {/* Real-Time Three.js WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full block transition-opacity duration-1000 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Interactive Inspection Badge (Positioned safely below SiteNav) */}
      <div className="absolute right-6 md:right-10 top-24 sm:top-28 z-20 hidden md:flex items-center gap-2.5 pointer-events-none">
        <span className="inline-block h-2 w-2 rounded-full bg-gold shadow-[0_0_12px_#c5a059] animate-pulse" />
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-gold/90 bg-black/75 px-3.5 py-1.5 rounded-full border border-gold/30 backdrop-blur-md shadow-lg">
          3D Equestrian Statue · Drag to Rotate 360°
        </span>
      </div>
    </div>
  );
}
