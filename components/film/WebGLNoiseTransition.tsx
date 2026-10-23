"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { mediaSrc, type MediaKey } from "@/lib/content/media";
import { cn } from "@/lib/utils";

/* ================= 4D Simplex Noise Transition Shaders ================= */
const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

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
  uniform int effectType;
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
    vec4 gw10 = vec4(0.75) - abs(gx10) - abs(gy10) - abs(gz10);
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

    if (effectType == 1) {
      // Codrops Demo 4: Diagonal Slice & Chromatic Dispersion
      float diagonal = (vUv.x + vUv.y) * 0.5;
      float sliceW = 0.35 * parabola(progress, 1.0);
      float sliceMask = smoothstep(diagonal - sliceW, diagonal + sliceW, progress * 1.5 - 0.25);
      
      float rgbShift = sin(progress * 3.14159265) * 0.025;
      vec4 c1R = texture2D(texture1, newUV + vec2(rgbShift, 0.0));
      vec4 c1G = texture2D(texture1, newUV);
      vec4 c1B = texture2D(texture1, newUV - vec2(rgbShift, 0.0));
      vec4 c1 = vec4(c1R.r, c1G.g, c1B.b, 1.0);
      
      vec4 c2R = texture2D(texture2, newUV - vec2(rgbShift, 0.0));
      vec4 c2G = texture2D(texture2, newUV);
      vec4 c2B = texture2D(texture2, newUV + vec2(rgbShift, 0.0));
      vec4 c2 = vec4(c2R.r, c2G.g, c2B.b, 1.0);
      
      gl_FragColor = mix(c1, c2, clamp(sliceMask, 0.0, 1.0));
    } else if (effectType == 2) {
      // Codrops Demo 5: Radial Ripple Distortion Wave
      vec2 center = vec2(0.5);
      float dist = length(vUv - center);
      float ripple = sin(dist * 35.0 - progress * 18.0) * 0.04 * (1.0 - progress) * progress;
      vec2 distortedUV = newUV + normalize(vUv - center + 0.0001) * ripple;
      
      float ripShift = sin(progress * 3.14159265) * 0.015;
      vec4 rCol1 = texture2D(texture1, distortedUV + vec2(ripShift, 0.0));
      vec4 rCol2 = texture2D(texture2, distortedUV - vec2(ripShift, 0.0));
      
      float circleMask = smoothstep(progress - 0.2, progress + 0.2, dist);
      gl_FragColor = mix(rCol2, rCol1, circleMask);
    } else if (effectType == 3) {
      // Codrops Demo 3: Zoom Warp & Lens Surge
      float p = progress;
      float zoom1 = 1.0 + p * 0.25;
      float zoom2 = 1.0 + (1.0 - p) * 0.25;
      vec2 warpUV1 = (newUV - 0.5) / zoom1 + 0.5;
      vec2 warpUV2 = (newUV - 0.5) / zoom2 + 0.5;
      
      float warpNoise = 0.5 * (cnoise(vec4(newUV.x * 20.0, newUV.y * 20.0, time * 0.4, 0.0)) + 1.0);
      float warpShift = sin(p * 3.14159265) * 0.02;
      vec4 wCol1 = texture2D(texture1, warpUV1 + vec2(warpShift * warpNoise, 0.0));
      vec4 wCol2 = texture2D(texture2, warpUV2 - vec2(warpShift * warpNoise, 0.0));
      gl_FragColor = mix(wCol1, wCol2, smoothstep(0.0, 1.0, p));
    } else {
      // Codrops Demo 1: Simplex Noise Wave Dissolve
      float noise = 0.5 * (cnoise(vec4(newUV.x * 40.0, newUV.y * 40.0, time * 0.2, 0.0)) + 1.0);
      float w = 0.5 * parabola(progress, 1.0);
      float mask = smoothstep(1.0 - w, 1.0, vUv.x + mix(-w / 2.0, 1.0 - w / 2.0, progress));
      float final = smoothstep(1.0, 1.0 + 0.01, mask + noise * 0.2);
      gl_FragColor = mix(color1, color2, final);
    }
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

export interface WebGLNoiseSlide {
  image: MediaKey | string;
  title?: string;
  subtitle?: string;
  tag?: string;
  badge?: string;
  caption?: string;
  meta?: string;
}

export type TransitionEffectMode = "wave" | "slice" | "ripple" | "warp";

export interface WebGLNoiseTransitionProps {
  slides: WebGLNoiseSlide[];
  aspectRatio?: string; // e.g. "aspect-[16/10]", "aspect-[4/3]", "aspect-[3/4]", "aspect-[16/9]"
  fullScreen?: boolean;
  className?: string;
  stageClassName?: string;
  autoplayInterval?: number; // ms, e.g. 5000 (0 or undefined to disable)
  showControls?: boolean;
  showDots?: boolean;
  showTabs?: boolean;
  showEffectToggle?: boolean;
  initialEffect?: TransitionEffectMode;
  onSlideChange?: (index: number) => void;
  initialIndex?: number;
}

/**
 * Reusable WebGL 4D Simplex Noise Wave Dissolve Transition Component.
 * Implements smooth Three.js GLSL wave transitions with parabolic mask deformation
 * and aspect-ratio compensation for cinematic image cycling.
 */
export function WebGLNoiseTransition({
  slides,
  aspectRatio = "aspect-[16/10]",
  fullScreen = false,
  className,
  stageClassName,
  autoplayInterval,
  showControls = true,
  showDots = true,
  showTabs = false,
  showEffectToggle = false,
  initialEffect = "wave",
  onSlideChange,
  initialIndex = 0,
}: WebGLNoiseTransitionProps) {
  const uniqueId = useId();
  const [activeIdx, setActiveIdx] = useState(initialIndex);
  const [effect, setEffect] = useState<TransitionEffectMode>(initialEffect);
  const effectRef = useRef(effect);
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
    current: initialIndex,
    isRunning: false,
    aspect: 1,
  });

  const resolvedUrls = useMemo(() => {
    return slides.map((s) => {
      if (typeof s.image === "string") {
        if (s.image.startsWith("/") || s.image.startsWith("http")) return s.image;
        const resolved = mediaSrc(s.image as MediaKey);
        return resolved || `/media/${s.image}.png`;
      }
      return `/media/${String(s.image)}.png`;
    });
  }, [slides]);

  // Transition to target slide index using 4D Simplex noise wave shader
  const goToSlide = useCallback(
    (targetIndex: number) => {
      const s = threeState.current;
      if (s.isRunning || targetIndex === s.current) return;
      if (!s.material || s.textures.length < 2) {
        s.current = targetIndex;
        setActiveIdx(targetIndex);
        onSlideChange?.(targetIndex);
        return;
      }
      s.isRunning = true;
      setIsTransitioning(true);

      const nextTexture = s.textures[targetIndex];
      s.material.uniforms.texture2.value = nextTexture;

      const startTime = performance.now();
      const duration = 1350; // 1.35s fluid easeOut

      const animateProgress = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - t, 3); // cubic easeOut

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
          onSlideChange?.(targetIndex);
        }
      };

      requestAnimationFrame(animateProgress);
    },
    [onSlideChange]
  );

  const nextSlide = useCallback(() => {
    const nextIdx = (activeIdx + 1) % slides.length;
    goToSlide(nextIdx);
  }, [activeIdx, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    const prevIdx = (activeIdx - 1 + slides.length) % slides.length;
    goToSlide(prevIdx);
  }, [activeIdx, slides.length, goToSlide]);

  const cycleEffect = useCallback(() => {
    setEffect((prev) => {
      const order: TransitionEffectMode[] = ["slice", "ripple", "warp", "wave"];
      const nextIdx = (order.indexOf(prev) + 1) % order.length;
      return order[nextIdx];
    });
  }, []);

  const effectLabels: Record<TransitionEffectMode, string> = {
    slice: "Diagonal Slice",
    ripple: "Radial Ripple",
    warp: "Zoom Warp",
    wave: "Simplex Wave",
  };

  useEffect(() => {
    effectRef.current = effect;
    if (threeState.current.material) {
      const effectInt =
        effect === "slice" ? 1 :
        effect === "ripple" ? 2 :
        effect === "warp" ? 3 : 0;
      threeState.current.material.uniforms.effectType.value = effectInt;
    }
  }, [effect]);

  // Autoplay support
  useEffect(() => {
    if (!autoplayInterval || autoplayInterval <= 0 || slides.length < 2) return;
    const interval = setInterval(() => {
      if (!threeState.current.isRunning) {
        nextSlide();
      }
    }, autoplayInterval);
    return () => clearInterval(interval);
  }, [autoplayInterval, nextSlide, slides.length]);

  // Three.js Scene Setup & Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container || resolvedUrls.length === 0) return;

    let isMounted = true;
    const s = threeState.current;

    const width = container.offsetWidth || 800;
    const height = container.offsetHeight || 500;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.001, 1000);
    camera.position.z = 2;

    const dist = camera.position.z;
    camera.fov = 2 * (180 / Math.PI) * Math.atan(1 / (2 * dist));
    camera.updateProjectionMatrix();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) {
      console.warn("WebGL context creation failed:", e);
      return;
    }
    s.renderer = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    const textures: THREE.Texture[] = new Array(resolvedUrls.length);
    let loadedCount = 0;

    const onAllLoaded = () => {
      if (!isMounted) return;

      const img0 = textures[0].image as HTMLImageElement | undefined;
      const imageAspect = img0 && img0.width && img0.height ? img0.height / img0.width : 0.625;
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

      const initialTexture = textures[initialIndex] || textures[0];
      const secondTexture = textures[(initialIndex + 1) % textures.length] || textures[0];

      const material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: {
          time: { value: 0 },
          progress: { value: 0 },
          width: { value: 0.5 },
          scaleX: { value: 40.0 },
          scaleY: { value: 40.0 },
          texture1: { value: initialTexture },
          texture2: { value: secondTexture },
          displacement: { value: noiseTex },
          resolution: { value: new THREE.Vector4(width, height, a1, a2) },
          effectType: {
            value:
              effectRef.current === "slice" ? 1 :
              effectRef.current === "ripple" ? 2 :
              effectRef.current === "warp" ? 3 : 0,
          },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
      });

      const geometry = new THREE.PlaneGeometry(1, 1, 2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      s.scene = scene;
      s.camera = camera;
      s.renderer = renderer;
      s.material = material;
      s.textures = textures;

      setIsLoaded(true);

      const render = () => {
        if (!isMounted) return;
        s.time += 0.025;
        if (s.material) {
          s.material.uniforms.time.value = s.time;
        }
        renderer.render(scene, camera);
        s.rafId = requestAnimationFrame(render);
      };
      s.rafId = requestAnimationFrame(render);
    };

    resolvedUrls.forEach((url, i) => {
      loader.load(
        url,
        (tex) => {
          tex.minFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          textures[i] = tex;
          loadedCount++;
          if (loadedCount === resolvedUrls.length) onAllLoaded();
        },
        undefined,
        () => {
          // Fallback procedural texture on image fetch error
          const canvas = document.createElement("canvas");
          canvas.width = 512;
          canvas.height = 320;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#12110e";
            ctx.fillRect(0, 0, 512, 320);
            ctx.fillStyle = "#c5a059";
            ctx.font = "20px monospace";
            ctx.fillText(`BSAH ARCHIVE [${i + 1}]`, 40, 160);
          }
          const fallbackTex = new THREE.CanvasTexture(canvas);
          fallbackTex.minFilter = THREE.LinearFilter;
          fallbackTex.generateMipmaps = false;
          textures[i] = fallbackTex;
          loadedCount++;
          if (loadedCount === resolvedUrls.length) onAllLoaded();
        }
      );
    });

    // Resize handling with aspect compensation
    const resizeObserver = new ResizeObserver((entries) => {
      if (!isMounted) return;
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w <= 0 || h <= 0) continue;

        renderer.setSize(w, h);
        camera.aspect = w / h;
        const d = camera.position.z;
        camera.fov = 2 * (180 / Math.PI) * Math.atan(1 / (2 * d));
        camera.updateProjectionMatrix();

        if (s.material) {
          const imgAspect = s.aspect || 0.625;
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
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      if (s.rafId) cancelAnimationFrame(s.rafId);
      s.textures.forEach((t) => t?.dispose());
      scene.clear();
      if (renderer) {
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [resolvedUrls, initialIndex]);

  const activeSlide = slides[activeIdx] || slides[0];

  return (
    <div
      className={cn(
        fullScreen
          ? "relative w-full bg-night select-none"
          : "relative flex flex-col",
        className
      )}
    >
      {/* Tab Pills if enabled */}
      {showTabs && slides.length > 1 && (
        <div
          className={cn(
            "flex flex-wrap gap-2",
            fullScreen
              ? "absolute top-24 left-6 sm:left-12 right-6 sm:right-12 z-30 max-w-5xl"
              : "mb-4"
          )}
          role="tablist"
        >
          {slides.map((s, idx) => (
            <button
              key={`${uniqueId}-tab-${idx}`}
              type="button"
              role="tab"
              aria-selected={activeIdx === idx}
              disabled={isTransitioning}
              onClick={() => goToSlide(idx)}
              className={cn(
                "group flex items-center gap-2 border px-3.5 py-1.5 text-xs font-mono transition-all backdrop-blur-md cursor-pointer",
                activeIdx === idx
                  ? "border-gold bg-gold/20 text-gold shadow-[0_0_20px_rgba(197,160,89,0.2)]"
                  : "border-line/70 bg-night/70 text-sand hover:border-gold/50 hover:text-bone"
              )}
            >
              <span className={cn("text-[0.65rem]", activeIdx === idx ? "text-gold" : "text-dust")}>
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="font-sans font-medium">{s.title || `Frame ${idx + 1}`}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main WebGL Stage Container */}
      <div
        className={cn(
          fullScreen
            ? "relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-night"
            : cn("relative w-full overflow-hidden border border-line/70 bg-night", aspectRatio),
          stageClassName
        )}
      >
        {/* WebGL Canvas Target */}
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />

        {/* Fallback & Initial Image */}
        {!isLoaded && resolvedUrls[activeIdx] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedUrls[activeIdx] || resolvedUrls[0]}
            alt={activeSlide?.title || "BSAH Visual"}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Minimal light bottom gradient (max 25% opacity) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"
        />

        {/* Top Badges / Index Metadata - tucked into widget-hud */}
        <div
          className={cn(
            "widget-hud pointer-events-none absolute inset-x-0 flex items-center justify-between text-xs font-mono z-20",
            fullScreen ? "top-36 sm:top-36 left-6 sm:left-12 right-6 sm:right-12" : "top-0 p-5"
          )}
        >
          <div className="flex items-center gap-3">
            {activeSlide?.badge ? (
              <span className="border border-gold/40 bg-night/85 px-3 py-1.5 uppercase tracking-widest text-gold shadow-sm backdrop-blur-md">
                {activeSlide.badge}
              </span>
            ) : (
              <span className="text-[0.65rem] tracking-[0.2em] text-sand/80">
                BSAH WEBGL OPTIC // NOISE WAVE DISSOLVE
              </span>
            )}

            {showEffectToggle && (
              <button
                type="button"
                onClick={cycleEffect}
                title="Click to cycle WebGL transition effects from list"
                className="pointer-events-auto group flex items-center gap-1.5 border border-gold/30 bg-night/85 px-2.5 py-1.5 text-[0.68rem] tracking-wider text-sand backdrop-blur-md hover:border-gold hover:text-gold active:scale-95 transition-all cursor-pointer"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-gold/70 group-hover:bg-gold" />
                <span>FX: {effectLabels[effect]}</span>
                <span className="text-dust text-[0.6rem]">↻</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-full border border-line/60 bg-night/85 px-3 py-1.5 text-gold backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
            <span>
              {String(activeIdx + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Subtle Wave Dissolve Activity Indicator */}
        {isTransitioning && (
          <div className="pointer-events-none absolute bottom-0 left-0 h-[3px] w-full bg-gold/30 z-30">
            <div className="h-full w-full animate-pulse bg-gold shadow-[0_0_12px_rgba(212,175,55,0.8)]" />
          </div>
        )}

        {/* Fullscreen Controls & Pagination Dots */}
        {fullScreen && (showControls || showDots) && slides.length > 1 && (
          <div className="absolute bottom-8 right-6 sm:right-12 z-20 flex items-center gap-4">
            {/* Pagination Indicators */}
            {showDots && (
              <div className="flex items-center gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={`${uniqueId}-dot-${idx}`}
                    type="button"
                    aria-label={`Go to slide ${idx + 1}`}
                    disabled={isTransitioning}
                    onClick={() => goToSlide(idx)}
                    className={cn(
                      "h-1.5 transition-all duration-300 cursor-pointer",
                      activeIdx === idx
                        ? "w-8 bg-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                        : "w-2 bg-line/80 hover:bg-gold/60"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Prev / Next Arrows */}
            {showControls && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous slide"
                  disabled={isTransitioning}
                  onClick={prevSlide}
                  className={cn(
                    "group flex h-10 w-10 items-center justify-center border border-line/80 bg-night/80 text-sand backdrop-blur-md transition-all hover:border-gold hover:text-gold active:scale-95 cursor-pointer",
                    isTransitioning && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Next slide"
                  disabled={isTransitioning}
                  onClick={nextSlide}
                  className={cn(
                    "group flex h-10 w-10 items-center justify-center border border-line/80 bg-night/80 text-sand backdrop-blur-md transition-all hover:border-gold hover:text-gold active:scale-95 cursor-pointer",
                    isTransitioning && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="editorial-details" aria-live="polite">
        {activeSlide?.tag && <p className="label text-brass">{activeSlide.tag}</p>}
        {activeSlide?.title && <h3 className="t-voice text-3xl sm:text-4xl text-bone">{activeSlide.title}</h3>}
        {activeSlide?.subtitle && <p className="text-sand">{activeSlide.subtitle}</p>}
        {activeSlide?.caption && <p className="text-dust">{activeSlide.caption}</p>}
      </div>

      {/* Non-fullscreen Controls & Dots */}
      {!fullScreen && (showControls || showDots) && slides.length > 1 && (
        <div className="mt-4 flex items-center justify-between gap-4">
          {/* Pagination Indicators */}
          {showDots && (
            <div className="flex items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={`${uniqueId}-dot-${idx}`}
                  type="button"
                  aria-label={`Go to slide ${idx + 1}`}
                  disabled={isTransitioning}
                  onClick={() => goToSlide(idx)}
                  className={cn(
                    "h-1.5 transition-all duration-300",
                    activeIdx === idx
                      ? "w-8 bg-gold"
                      : "w-2 bg-line/80 hover:bg-gold/60"
                  )}
                />
              ))}
            </div>
          )}

          {/* Prev / Next Arrows */}
          {showControls && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous slide"
                disabled={isTransitioning}
                onClick={prevSlide}
                className={cn(
                  "group flex h-9 w-9 items-center justify-center border border-line bg-night text-sand transition-all hover:border-gold hover:text-gold active:scale-95",
                  isTransitioning && "opacity-50 cursor-not-allowed"
                )}
              >
                <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Next slide"
                disabled={isTransitioning}
                onClick={nextSlide}
                className={cn(
                  "group flex h-9 w-9 items-center justify-center border border-line bg-night text-sand transition-all hover:border-gold hover:text-gold active:scale-95",
                  isTransitioning && "opacity-50 cursor-not-allowed"
                )}
              >
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
