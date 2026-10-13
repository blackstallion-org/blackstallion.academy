"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { Headline } from "@/components/film/Headline";
import { Arrow, Label } from "@/components/film/Marks";
import { mediaSrc } from "@/lib/content/media";
import { cn } from "@/lib/utils";

/* ================= Vertex Shader ================= */
const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* ================= 4D Simplex Noise Transition Fragment Shader ================= */
const FRAGMENT_SHADER = `
  uniform float time;
  uniform float progress;
  uniform float width;
  uniform float scaleX;
  uniform float scaleY;
  uniform sampler2D texture1;
  uniform sampler2D texture2;
  uniform sampler2D displacement;
  uniform vec4 resolution;
  varying vec2 vUv;

  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  vec4 fade(vec4 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

  float cnoise(vec4 P){
    vec4 Pi0 = floor(P);
    vec4 Pi1 = Pi0 + 1.0;
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec4 Pf0 = fract(P);
    vec4 Pf1 = Pf0 - 1.0;
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = vec4(Pi0.zzzz);
    vec4 iz1 = vec4(Pi1.zzzz);
    vec4 iw0 = vec4(Pi0.wwww);
    vec4 iw1 = vec4(Pi1.wwww);

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 ixy00 = permute(ixy0 + iw0);
    vec4 ixy01 = permute(ixy0 + iw1);
    vec4 ixy10 = permute(ixy1 + iw0);
    vec4 ixy11 = permute(ixy1 + iw1);

    vec4 gx00 = ixy00 / 7.0; vec4 gy00 = floor(gx00) / 7.0; vec4 gz00 = floor(gy00) / 6.0;
    gx00 = fract(gx00) - 0.5; gy00 = fract(gy00) - 0.5; gz00 = fract(gz00) - 0.5;
    vec4 gw00 = vec4(0.75) - abs(gx00) - abs(gy00) - abs(gz00);
    vec4 sw00 = step(gw00, vec4(0.0));
    gx00 -= sw00 * (step(0.0, gx00) - 0.5);
    gy00 -= sw00 * (step(0.0, gy00) - 0.5);

    vec4 gx01 = ixy01 / 7.0; vec4 gy01 = floor(gx01) / 7.0; vec4 gz01 = floor(gy01) / 6.0;
    gx01 = fract(gx01) - 0.5; gy01 = fract(gy01) - 0.5; gz01 = fract(gz01) - 0.5;
    vec4 gw01 = vec4(0.75) - abs(gx01) - abs(gy01) - abs(gz01);
    vec4 sw01 = step(gw01, vec4(0.0));
    gx01 -= sw01 * (step(0.0, gx01) - 0.5);
    gy01 -= sw01 * (step(0.0, gy01) - 0.5);

    vec4 gx10 = ixy10 / 7.0; vec4 gy10 = floor(gx10) / 7.0; vec4 gz10 = floor(gy10) / 6.0;
    gx10 = fract(gx10) - 0.5; gy10 = fract(gy10) - 0.5; gz10 = fract(gz10) - 0.5;
    vec4 gw10 = vec4(0.75) - abs(gx10) - abs(gy10) - abs(gz00);
    vec4 sw10 = step(gw10, vec4(0.0));
    gx10 -= sw10 * (step(0.0, gx10) - 0.5);
    gy10 -= sw10 * (step(0.0, gy10) - 0.5);

    vec4 gx11 = ixy11 / 7.0; vec4 gy11 = floor(gx11) / 7.0; vec4 gz11 = floor(gy11) / 6.0;
    gx11 = fract(gx11) - 0.5; gy11 = fract(gy11) - 0.5; gz11 = fract(gz11) - 0.5;
    vec4 gw11 = vec4(0.75) - abs(gx11) - abs(gy11) - abs(gz11);
    vec4 sw11 = step(gw11, vec4(0.0));
    gx11 -= sw11 * (step(0.0, gx11) - 0.5);
    gy11 -= sw11 * (step(0.0, gy11) - 0.5);

    vec4 g0000 = vec4(gx00.x,gy00.x,gz00.x,gw00.x);
    vec4 g1000 = vec4(gx00.y,gy00.y,gz00.y,gw00.y);
    vec4 g0100 = vec4(gx00.z,gy00.z,gz00.z,gw00.z);
    vec4 g1100 = vec4(gx00.w,gy00.w,gz00.w,gw00.w);
    vec4 g0010 = vec4(gx10.x,gy10.x,gz10.x,gw10.x);
    vec4 g1010 = vec4(gx10.y,gy10.y,gz10.y,gw10.y);
    vec4 g0110 = vec4(gx10.z,gy10.z,gz10.z,gw10.z);
    vec4 g1110 = vec4(gx10.w,gy10.w,gz10.w,gw10.w);
    vec4 g0001 = vec4(gx01.x,gy01.x,gz01.x,gw01.x);
    vec4 g1001 = vec4(gx01.y,gy01.y,gz01.y,gw01.y);
    vec4 g0101 = vec4(gx01.z,gy01.z,gz01.z,gw01.z);
    vec4 g1101 = vec4(gx01.w,gy01.w,gz01.w,gw01.w);
    vec4 g0011 = vec4(gx11.x,gy11.x,gz11.x,gw11.x);
    vec4 g1011 = vec4(gx11.y,gy11.y,gz11.y,gw11.y);
    vec4 g0111 = vec4(gx11.z,gy11.z,gz11.z,gw11.z);
    vec4 g1111 = vec4(gx11.w,gy11.w,gz11.w,gw11.w);

    vec4 norm00 = taylorInvSqrt(vec4(dot(g0000, g0000), dot(g0100, g0100), dot(g1000, g1000), dot(g1100, g1100)));
    g0000 *= norm00.x; g0100 *= norm00.y; g1000 *= norm00.z; g1100 *= norm00.w;
    vec4 norm01 = taylorInvSqrt(vec4(dot(g0001, g0001), dot(g0101, g0101), dot(g1001, g1001), dot(g1101, g1101)));
    g0001 *= norm01.x; g0101 *= norm01.y; g1001 *= norm01.z; g1101 *= norm01.w;
    vec4 norm10 = taylorInvSqrt(vec4(dot(g0010, g0010), dot(g0110, g0110), dot(g1010, g1010), dot(g1110, g1110)));
    g0010 *= norm10.x; g0110 *= norm10.y; g1010 *= norm10.z; g1110 *= norm10.w;
    vec4 norm11 = taylorInvSqrt(vec4(dot(g0011, g0011), dot(g0111, g0111), dot(g1011, g1011), dot(g1111, g1111)));
    g0011 *= norm11.x; g0111 *= norm11.y; g1011 *= norm11.z; g1111 *= norm11.w;

    float n0000 = dot(g0000, Pf0);
    float n1000 = dot(g1000, vec4(Pf1.x, Pf0.yzw));
    float n0100 = dot(g0100, vec4(Pf0.x, Pf1.y, Pf0.zw));
    float n1100 = dot(g1100, vec4(Pf1.xy, Pf0.zw));
    float n0010 = dot(g0010, vec4(Pf0.xy, Pf1.z, Pf0.w));
    float n1010 = dot(g1010, vec4(Pf1.x, Pf0.y, Pf1.z, Pf0.w));
    float n0110 = dot(g0110, vec4(Pf0.x, Pf1.yz, Pf0.w));
    float n1110 = dot(g1110, vec4(Pf1.xyz, Pf0.w));
    float n0001 = dot(g0001, vec4(Pf0.xyz, Pf1.w));
    float n1001 = dot(g1001, vec4(Pf1.x, Pf0.yz, Pf1.w));
    float n0101 = dot(g0101, vec4(Pf0.x, Pf1.y, Pf0.z, Pf1.w));
    float n1101 = dot(g1101, vec4(Pf1.xy, Pf0.z, Pf1.w));
    float n0011 = dot(g0011, vec4(Pf0.xy, Pf1.zw));
    float n1011 = dot(g1011, vec4(Pf1.x, Pf0.y, Pf1.zw));
    float n0111 = dot(g0111, vec4(Pf0.x, Pf1.yzw));
    float n1111 = dot(g1111, Pf1);

    vec4 fade_xyzw = fade(Pf0);
    vec4 n_0w = mix(vec4(n0000, n1000, n0100, n1100), vec4(n0001, n1001, n0101, n1101), fade_xyzw.w);
    vec4 n_1w = mix(vec4(n0010, n1010, n0110, n1110), vec4(n0011, n1011, n0111, n1111), fade_xyzw.w);
    vec4 n_zw = mix(n_0w, n_1w, fade_xyzw.z);
    vec2 n_yzw = mix(n_zw.xy, n_zw.zw, fade_xyzw.y);
    float n_xyzw = mix(n_yzw.x, n_yzw.y, fade_xyzw.x);
    return 2.2 * n_xyzw;
  }

  float parabola(float x, float k) {
    return pow(4.0 * x * (1.0 - x), k);
  }

  void main() {
    vec2 newUV = (vUv - vec2(0.5)) * resolution.zw + vec2(0.5);
    vec4 color1 = texture2D(texture1, newUV);
    vec4 color2 = texture2D(texture2, newUV);
    float noise = 0.5 * (cnoise(vec4(newUV.x * 40.0 + 0.0, newUV.y * 40.0, time * 0.2, 0.0)) + 1.0);
    float w = 0.5 * parabola(progress, 1.0);
    float mask = smoothstep(1.0 - w, 1.0, vUv.x + mix(-w / 2.0, 1.0 - w / 2.0, progress));
    float final = smoothstep(1.0, 1.0 + 0.01, mask + noise * 0.2);
    gl_FragColor = mix(color1, color2, final);
  }
`;

function createProceduralNoise(): THREE.DataTexture {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size * 4; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export interface DoorItem {
  who: string;
  title: string;
  tagline: string;
  image: string;
  href: string;
  cta: string;
}

/**
 * §6 Three Doors · Full-Screen WebGL Liquid Noise Stage with Minimal Overlay.
 * Rebuilt per user directive: full-screen immersive canvas stage, minimal text info,
 * and high-end photographic imagery.
 */
export function Doors() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const threeState = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    material: THREE.ShaderMaterial | null;
    textures: THREE.Texture[];
    rafId: number | null;
    time: number;
    current: number;
    isRunning: boolean;
    aspect: number;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    material: null,
    textures: [],
    rafId: null,
    time: 0,
    current: 0,
    isRunning: false,
    aspect: 1,
  });

  const doorItems: DoorItem[] = useMemo(
    () => [
      {
        who: "Parents",
        title: "The Guardian",
        tagline: "Watch your cadet's journey from the rail. 24/7 stall-cams, gate alerts, and verified session reels.",
        image: mediaSrc("parentsRail") || "/media/parents-rail.png",
        href: "/parents",
        cta: "For parents",
      },
      {
        who: "Cadets",
        title: "The Hall of Valour",
        tagline: "A sealed leather passport, your own Marwari stallion, and the national circuit.",
        image: mediaSrc("cadetZayd") || "/media/cadet-zayd.png",
        href: "/cadets",
        cta: "For cadets",
      },
      {
        who: "Schools",
        title: "The Zero-CapEx Engine",
        tagline: "Turnkey campus riding arena funded, built, and operated by BSAH with zero school expenditure.",
        image: mediaSrc("schoolArenaNight") || mediaSrc("schoolAerial") || "/media/school-arena-night.png",
        href: "/schools",
        cta: "For schools",
      },
    ],
    []
  );

  const currentDoor = doorItems[activeIdx];
  const imageUrls = useMemo(() => doorItems.map((d) => d.image), [doorItems]);

  // Transition to a specific target door index
  const goToDoor = useCallback(
    (targetIndex: number) => {
      const s = threeState.current;
      if (s.isRunning || s.textures.length < 2 || !s.material || targetIndex === s.current) return;
      s.isRunning = true;
      setIsTransitioning(true);

      const nextTexture = s.textures[targetIndex];
      s.material.uniforms.texture2.value = nextTexture;

      const startTime = performance.now();
      const duration = 1300; // 1.3s fluid easeOut

      const animateProgress = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - t, 3);

        if (s.material) {
          s.material.uniforms.progress.value = eased;
        }

        if (t < 1) {
          requestAnimationFrame(animateProgress);
        } else {
          s.current = targetIndex;
          if (s.material) {
            s.material.uniforms.texture1.value = nextTexture;
            s.material.uniforms.progress.value = 0;
          }
          s.isRunning = false;
          setActiveIdx(targetIndex);
          setIsTransitioning(false);
        }
      };

      requestAnimationFrame(animateProgress);
    },
    []
  );

  const nextDoor = useCallback(() => {
    const nextIdx = (activeIdx + 1) % doorItems.length;
    goToDoor(nextIdx);
  }, [activeIdx, doorItems.length, goToDoor]);

  const prevDoor = useCallback(() => {
    const prevIdx = (activeIdx - 1 + doorItems.length) % doorItems.length;
    goToDoor(prevIdx);
  }, [activeIdx, doorItems.length, goToDoor]);

  // Three.js lifecycle setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container || imageUrls.length === 0) return;

    let isMounted = true;
    const s = threeState.current;

    const width = container.offsetWidth || 1200;
    const height = container.offsetHeight || 750;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.001, 1000);
    camera.position.z = 2;

    const dist = camera.position.z;
    camera.fov = 2 * (180 / Math.PI) * Math.atan(1 / (2 * dist));
    camera.updateProjectionMatrix();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 1);
      container.innerHTML = "";
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.warn("⚠️ [Doors] WebGLRenderer creation skipped:", err);
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    const textures: THREE.Texture[] = new Array(imageUrls.length);
    let loadedCount = 0;

    const onAllLoaded = () => {
      if (!isMounted) return;

      const img0 = textures[0].image as HTMLImageElement | undefined;
      const imageAspect = img0 && img0.width && img0.height ? img0.height / img0.width : 0.5625;
      s.aspect = imageAspect;

      let a1 = 1;
      let a2 = 1;
      if (height / width > imageAspect) {
        a1 = (width / height) * imageAspect;
        a2 = 1;
      } else {
        a1 = 1;
        a2 = height / width / imageAspect;
      }

      const noiseTex = createProceduralNoise();

      const material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: {
          time: { value: 0 },
          progress: { value: 0 },
          width: { value: 0.5 },
          scaleX: { value: 40 },
          scaleY: { value: 40 },
          texture1: { value: textures[0] },
          texture2: { value: textures[1] },
          displacement: { value: noiseTex },
          resolution: { value: new THREE.Vector4(width, height, a1, a2) },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
      });

      const geometry = new THREE.PlaneGeometry(1, 1, 2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      s.renderer = renderer;
      s.scene = scene;
      s.camera = camera;
      s.material = material;
      s.textures = textures;
      s.current = 0;
      s.time = 0;

      setIsLoaded(true);

      const renderLoop = () => {
        if (!isMounted) return;
        s.time += 0.03;
        if (s.material) {
          s.material.uniforms.time.value = s.time;
        }
        if (s.renderer && s.scene && s.camera) {
          s.renderer.render(s.scene, s.camera);
        }
        s.rafId = requestAnimationFrame(renderLoop);
      };
      renderLoop();
    };

    imageUrls.forEach((url, idx) => {
      loader.load(
        url,
        (tex) => {
          if (!isMounted) return;
          tex.generateMipmaps = false;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          textures[idx] = tex;
          loadedCount++;
          if (loadedCount === imageUrls.length) {
            onAllLoaded();
          }
        },
        undefined,
        () => {
          if (!isMounted) return;
          const canvas = document.createElement("canvas");
          canvas.width = 16;
          canvas.height = 9;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = idx === 0 ? "#1e1610" : idx === 1 ? "#12141a" : "#141c14";
            ctx.fillRect(0, 0, 16, 9);
          }
          const fallbackTex = new THREE.CanvasTexture(canvas);
          fallbackTex.generateMipmaps = false;
          fallbackTex.minFilter = THREE.LinearFilter;
          fallbackTex.magFilter = THREE.LinearFilter;
          textures[idx] = fallbackTex;
          loadedCount++;
          if (loadedCount === imageUrls.length) {
            onAllLoaded();
          }
        }
      );
    });

    const handleResize = () => {
      if (!container || !s.renderer || !s.camera || !s.material) return;
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      if (w === 0 || h === 0) return;

      s.renderer.setSize(w, h);
      s.camera.aspect = w / h;

      const imgAspect = s.aspect || 0.5625;
      let a1 = 1;
      let a2 = 1;
      if (h / w > imgAspect) {
        a1 = (w / h) * imgAspect;
        a2 = 1;
      } else {
        a1 = 1;
        a2 = h / w / imgAspect;
      }

      s.material.uniforms.resolution.value.set(w, h, a1, a2);
      const d = s.camera.position.z;
      s.camera.fov = 2 * (180 / Math.PI) * Math.atan(1 / (2 * d));
      s.camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      if (s.rafId) cancelAnimationFrame(s.rafId);
      if (s.renderer) s.renderer.dispose();
      s.textures.forEach((t) => t.dispose());
      s.textures = [];
      s.material = null;
      s.scene = null;
      s.camera = null;
      s.renderer = null;
    };
  }, [imageUrls]);

  return (
    <section aria-labelledby="doors-h" className="relative w-full bg-black py-12 md:py-20 overflow-hidden text-white">
      {/* Top Header & Minimal Selector Tabs */}
      <div className="gutter mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Label>Three doors</Label>
          <Headline id="doors-h" className="mt-2" inscription="Through the" voice="gate." />
        </div>

        {/* Minimal Door Selector Tabs */}
        <div className="flex items-center gap-2 sm:gap-3" role="tablist" aria-label="The Three Doors">
          {doorItems.map((d, i) => {
            const isSelected = activeIdx === i;
            return (
              <button
                key={d.who}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => goToDoor(i)}
                disabled={isTransitioning}
                className={cn(
                  "px-4 py-2 rounded-full font-mono text-xs uppercase tracking-widest transition-all",
                  isSelected
                    ? "bg-gold text-black font-semibold shadow-[0_0_24px_rgba(212,175,55,0.45)]"
                    : "bg-white/5 border border-white/10 text-sand/80 hover:text-white hover:border-white/20"
                )}
              >
                0{i + 1} · {d.who}
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-Screen Immersive WebGL Stage */}
      <div className="gutter">
        <div
          id="slider"
          onClick={nextDoor}
          title="Click stage to cycle next door image with WebGL transition"
          className="relative w-full h-[70vh] min-h-[560px] max-h-[820px] rounded-3xl overflow-hidden bg-[#0c0c0c] cursor-pointer border border-gold/25 shadow-[0_20px_60px_rgba(0,0,0,0.8)] select-none isolate"
        >
          {/* WebGL Canvas */}
          <div ref={containerRef} className="absolute inset-0 h-full w-full z-[1]" />

          {/* Deep Cinematic Gradients for Pristine Typography Contrast */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/90 via-black/35 to-black/30"
          />

          {/* Top Subtle Brand Stamp */}
          <div className="pointer-events-none absolute top-6 left-6 sm:top-8 sm:left-8 z-[3] flex items-center gap-3">
            <span className="font-mono text-[0.65rem] tracking-[0.25em] uppercase text-gold/80">
              BSAH ADMISSIONS GATEWAY
            </span>
            <span className="h-1 w-1 rounded-full bg-gold/50" />
            <span className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-sand/60">
              FRAME 0{activeIdx + 1} / 0{doorItems.length}
            </span>
          </div>

          {/* Minimal Cinematic Content Overlay (Bottom-Left) */}
          <div className="pointer-events-none absolute bottom-6 left-6 sm:bottom-10 sm:left-10 z-[3] max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-gold block mb-2">
              DOOR 0{activeIdx + 1} · {currentDoor.who.toUpperCase()}
            </span>

            <h3 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#FAF7F0] font-normal leading-[1.05] tracking-tight m-0 drop-shadow-md">
              {currentDoor.title}
            </h3>

            <p className="font-serif text-sm sm:text-base text-sand/90 leading-relaxed max-w-xl mt-3 mb-6 drop-shadow">
              {currentDoor.tagline}
            </p>

            <div className="pointer-events-auto inline-block">
              <Link
                href={currentDoor.href}
                onClick={(e) => e.stopPropagation()}
                className="group inline-flex items-center gap-3 rounded-full border border-gold bg-gold/25 px-6 py-2.5 font-mono text-xs uppercase tracking-widest text-bone backdrop-blur-md transition-all hover:bg-gold hover:text-black hover:border-gold hover:shadow-[0_0_24px_rgba(212,175,55,0.4)]"
              >
                <span>{currentDoor.cta}</span>
                <Arrow className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Minimal Stage Controls (Bottom-Right) */}
          <div className="pointer-events-none absolute bottom-6 right-6 sm:bottom-10 sm:right-10 z-[3] flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-gold/30 bg-black/60 px-3.5 py-1.5 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-ping" />
              <span className="font-mono text-[0.62rem] tracking-wider uppercase text-sand/80">
                Click canvas to cycle
              </span>
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevDoor();
                }}
                disabled={isTransitioning}
                aria-label="Previous door"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-black/70 text-sand hover:bg-gold hover:text-black hover:border-gold transition-colors disabled:opacity-40"
              >
                ←
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextDoor();
                }}
                disabled={isTransitioning}
                aria-label="Next door"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-black/70 text-sand hover:bg-gold hover:text-black hover:border-gold transition-colors disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>

          {/* Loading Indicator */}
          {!isLoaded && (
            <div className="absolute inset-0 grid place-items-center bg-[#0c0c0c] z-[10]">
              <div className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
                <span className="font-mono text-xs tracking-widest uppercase text-sand/60">
                  Initializing Liquid Canvas...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
