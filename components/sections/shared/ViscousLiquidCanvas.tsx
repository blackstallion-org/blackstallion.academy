"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { Arrow } from "@/components/film/Marks";
import { mediaSrc, type MediaKey } from "@/lib/content/media";
import { useReducedMotion } from "@/lib/motion/reduced";

export interface ViscousSlide {
  image: string;
  title: string;
  subtitle?: string;
  label?: string;
  badge?: string;
  tag?: string;
  caption?: string;
  ctaText?: string;
  ctaHref?: string;
}

export interface ViscousLiquidCanvasProps {
  id?: string;
  label?: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  heightClass?: string;
  tone?: "dark" | "light";
  fullScreen?: boolean;
  slides?: ViscousSlide[];
  initialSlideIndex?: number;
  showTabs?: boolean;
  onSlideChange?: (index: number) => void;
  ctaText?: string;
  ctaHref?: string;
}

// ---------------------------------------------------------------------------
// GLSL Shaders for Navier-Stokes Fluid & Chromatic Viscous Refraction
// ---------------------------------------------------------------------------
const baseVert = /* glsl */ `
  uniform vec2 texelSize;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const capsuleChunk = /* glsl */ `
  uniform float aspectRatio;
  uniform vec2 pointA;
  uniform vec2 pointB;
  uniform float radius;
  float capsuleFalloff(vec2 uv) {
    vec2 p = uv, a = pointA, b = pointB;
    p.x *= aspectRatio; a.x *= aspectRatio; b.x *= aspectRatio;
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
    float d = length(pa - ba * h);
    return exp(-d * d / (radius * radius));
  }
`;

const velocitySplatFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uTarget;
  uniform vec2 color;
  uniform float amount;
  varying vec2 vUv;
  ${capsuleChunk}
  void main() {
    float f = capsuleFalloff(vUv);
    vec2 base = texture2D(uTarget, vUv).xy;
    gl_FragColor = vec4(base + color * f * amount, 0.0, 1.0);
  }
`;

const dyeSplatFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uTarget;
  uniform float amount;
  varying vec2 vUv;
  ${capsuleChunk}
  void main() {
    float f = capsuleFalloff(vUv);
    float base = texture2D(uTarget, vUv).x;
    gl_FragColor = vec4(min(base + f * amount, 1.0), 0.0, 0.0, 1.0);
  }
`;

const advectionFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform float dt;
  uniform float dissipation;
  uniform float velocityScale;
  varying vec2 vUv;
  void main() {
    vec2 coord = vUv - dt * velocityScale * texture2D(uVelocity, vUv).xy * texelSize;
    gl_FragColor = texture2D(uSource, coord) / (1.0 + dissipation * dt);
  }
`;

const displacementFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform sampler2D uDisplacement;
  uniform vec2 texelSize;
  uniform float dt;
  uniform sampler2D uDye;
  uniform float decay;
  uniform float drag;
  varying vec2 vUv;
  void main() {
    vec2 vel = texture2D(uVelocity, vUv).xy;
    vec2 disp = texture2D(uDisplacement, vUv).xy;
    disp = disp * decay - vel * dt * drag * 0.001;
    gl_FragColor = vec4(disp, 0.0, 1.0);
  }
`;

const divergenceFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uVelocity;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  void main() {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
  }
`;

const curlFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uVelocity;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  void main() {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
  }
`;

const vorticityFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  void main() {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 vel = texture2D(uVelocity, vUv).xy + force * dt;
    gl_FragColor = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
  }
`;

const clearFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float value;
  varying vec2 vUv;
  void main() {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`;

const pressureFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  void main() {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float div = texture2D(uDivergence, vUv).x;
    gl_FragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
  }
`;

const gradientSubtractFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  void main() {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 vel = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);
    gl_FragColor = vec4(vel, 0.0, 1.0);
  }
`;

const displayFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uMedia;
  uniform sampler2D uDisplacement;
  uniform sampler2D uDye;
  uniform float uScreenAspect;
  uniform float uMediaAspect;
  uniform float uRefraction;
  uniform float uChromatic;
  uniform float uSpecular;
  uniform float uShininess;
  uniform float uShading;
  uniform float uSurface;
  uniform float uRipple;
  uniform vec2 uSimTexel;
  uniform sampler2D uVelocity;
  uniform vec3 uHighlight;
  uniform vec3 uLightDir;
  varying vec2 vUv;

  vec2 coverUv(vec2 uv) {
    vec2 s = vec2(1.0);
    float r = uScreenAspect / uMediaAspect;
    if (r > 1.0) s.y = 1.0 / r; else s.x = r;
    return (uv - 0.5) * s + 0.5;
  }

  float surfaceHeight(vec2 uv) {
    float dye = texture2D(uDye, uv).x;
    float speed = length(texture2D(uVelocity, uv).xy);
    return dye * 0.6 + speed * uRipple * 0.004 * smoothstep(0.0, 0.3, dye);
  }

  vec3 spectralWeight(float t) {
    return max(1.0 - abs(t * 2.0 - vec3(0.0, 1.0, 2.0)), 0.0);
  }

  void main() {
    vec2 tx = vec2(uSimTexel.x, 0.0);
    vec2 ty = vec2(0.0, uSimTexel.y);
    vec2 grad = vec2(
      surfaceHeight(vUv + tx) - surfaceHeight(vUv - tx),
      surfaceHeight(vUv + ty) - surfaceHeight(vUv - ty)) * 0.5;

    vec3 n = normalize(vec3(-grad * uSurface * 6.0, 1.0));

    vec2 disp = texture2D(uDisplacement, vUv).xy;
    float dye = texture2D(uDye, vUv).x;
    float mask = smoothstep(0.01, 0.25, dye);

    vec2 baseUv = vUv + disp - n.xy * uRefraction * 0.05;

    vec2 spread = (n.xy * 0.035 + disp * 0.04) * uChromatic * mask;
    vec3 col = vec3(0.0);
    vec3 wsum = vec3(0.0);
    for (int i = 0; i < 6; i++) {
      float t = float(i) / 5.0;
      vec2 uv = baseUv + spread * (t - 0.5);
      vec3 w = spectralWeight(t);
      col += texture2D(uMedia, coverUv(uv)).rgb * w;
      wsum += w;
    }
    col /= wsum;

    vec3 L = normalize(uLightDir);
    vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));

    col *= max(1.0 + dot(n.xy, normalize(L.xy)) * uShading * mask, 0.0);

    float spec = pow(max(dot(n, H), 0.0), uShininess);
    col += uHighlight * spec * uSpecular * mask;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function ViscousLiquidCanvas({
  id = "viscous-liquid-canvas",
  label,
  title = "The Viscous Fluid Sovereign",
  subtitle = "Hover and drag across the plate to displace Navier-Stokes fluid tension and chromatic dispersion.",
  imageUrl = "/images/black-marwari-stallion.webp",
  heightClass = "h-[500px] sm:h-[620px] md:h-[720px]",
  tone = "dark",
  fullScreen = true,
  slides,
  initialSlideIndex = 0,
  showTabs = true,
  onSlideChange,
  ctaText,
  ctaHref,
}: ViscousLiquidCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);

  const [activeIdx, setActiveIdx] = useState(initialSlideIndex);
  const [isLoaded, setIsLoaded] = useState(false);
  const [nearViewport, setNearViewport] = useState(false);
  const reduced = useReducedMotion();
  const initialImageRef = useRef("");
  const typographyRef = useRef<gsap.core.Timeline | null>(null);

  // Determine current active slide / props
  const currentSlide = slides && slides.length > 0 ? slides[activeIdx] : null;
  const rawImage = currentSlide ? currentSlide.image : imageUrl;
  const activeImage = mediaSrc(rawImage as MediaKey) || rawImage;
  useEffect(() => { initialImageRef.current = activeImage; }, [activeImage]);
  const activeTitle = currentSlide ? currentSlide.title : title;
  const activeSubtitle = currentSlide ? currentSlide.subtitle : subtitle;
  const activeLabel = currentSlide ? (currentSlide.badge || currentSlide.tag || currentSlide.label || label) : label;
  const activeCtaText = currentSlide?.ctaText || ctaText;
  const activeCtaHref = currentSlide?.ctaHref || ctaHref;

  // External splat trigger reference
  const splatTriggerRef = useRef<(() => void) | null>(null);
  const loadTextureRef = useRef<((url: string) => void) | null>(null);

  // Sequential typography animation trigger
  const playTypographySequence = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (headlineRef.current) gsap.set(headlineRef.current, { opacity: 1, y: 0 });
      if (subRef.current) gsap.set(subRef.current, { opacity: 1, y: 0 });
      return;
    }

    const headline = headlineRef.current;
    const sub = subRef.current;

    typographyRef.current?.kill();
    const tl = gsap.timeline();
    typographyRef.current = tl;
    if (headline) {
      tl.fromTo(
        headline,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.4, ease: "power3.out", delay: 0.35 }
      );
    }
    if (sub) {
      tl.fromTo(
        sub,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" },
        "-=0.6"
      );
    }
  }, []);

  // Slide switcher handler
  const handleSelectSlide = (idx: number) => {
    setActiveIdx(idx);
    onSlideChange?.(idx);
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNearViewport(true); observer.disconnect(); }
    }, { rootMargin: "250px" });
    observer.observe(section);
    return () => { observer.disconnect(); typographyRef.current?.kill(); };
  }, []);

  // Delay GPU allocation until this plate is near the viewport.
  useEffect(() => {
    const container = mountRef.current;
    if (!container || !nearViewport || reduced) return;
    let disposed = false;

    gsap.registerPlugin(ScrollTrigger);

    const PARAMS = {
      interaction: {
        radius: 0.058,
        force: 1.35,
        followSpeed: 25,
      },
      animation: {
        imageDrag: 1.0,
        imageReturn: 1.15,
        liquidFade: 0.95,
        velocityFade: 1.25,
        curl: 11,
        pressure: 0.8,
      },
      material: {
        refraction: 2.62,
        chromatic: 0.72,
        specular: 1.6,
        shininess: 120,
        surface: 1.0,
        ripple: 2.67,
      },
      lighting: {
        lightAngle: 125,
        shading: 0.16,
      },
      colors: {
        highlight: "#ffffff",
      },
      performance: {
        simResolution: 256,
        pressureIterations: 18,
        dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      },
    };

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || (fullScreen ? window.innerHeight : 600);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance", alpha: true });
      renderer.setPixelRatio(PARAMS.performance.dpr);
      renderer.setSize(width, height);
      renderer.autoClear = false;
      container.appendChild(renderer.domElement);
    } catch {
      return;
    }

    const quadScene = new THREE.Scene();
    const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const triGeometry = new THREE.BufferGeometry();
    triGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)
    );
    const quad = new THREE.Mesh(triGeometry);
    quad.frustumCulled = false;
    quadScene.add(quad);

    function blit(material: THREE.Material, target: THREE.WebGLRenderTarget | null) {
      quad.material = material;
      renderer.setRenderTarget(target);
      renderer.render(quadScene, quadCamera);
    }

    const simTexel = new THREE.Vector2(1 / 256, 1 / 256);
    const simSize = new THREE.Vector2(256, 256);

    function makeMaterial(fragmentShader: string, uniforms: Record<string, THREE.IUniform>) {
      return new THREE.ShaderMaterial({
        vertexShader: baseVert,
        fragmentShader,
        uniforms: Object.assign({ texelSize: { value: simTexel } }, uniforms),
        depthTest: false,
        depthWrite: false,
      });
    }

    function capsuleUniforms() {
      return {
        uTarget: { value: null },
        aspectRatio: { value: width / height },
        pointA: { value: new THREE.Vector2() },
        pointB: { value: new THREE.Vector2() },
        radius: { value: PARAMS.interaction.radius },
      };
    }

    const velocitySplatMat = makeMaterial(
      velocitySplatFrag,
      Object.assign(capsuleUniforms(), {
        color: { value: new THREE.Vector2() },
        amount: { value: 1 },
      })
    );

    const dyeSplatMat = makeMaterial(
      dyeSplatFrag,
      Object.assign(capsuleUniforms(), { amount: { value: 1 } })
    );

    const advectionMat = makeMaterial(advectionFrag, {
      uVelocity: { value: null },
      uSource: { value: null },
      dt: { value: 0.016 },
      dissipation: { value: PARAMS.animation.liquidFade },
      velocityScale: { value: 0.35 },
    });

    const displacementMat = makeMaterial(displacementFrag, {
      uVelocity: { value: null },
      uDisplacement: { value: null },
      uDye: { value: null },
      dt: { value: 0.016 },
      decay: { value: 0.98 },
      drag: { value: PARAMS.animation.imageDrag },
    });

    const divergenceMat = makeMaterial(divergenceFrag, {
      uVelocity: { value: null },
    });

    const curlMat = makeMaterial(curlFrag, {
      uVelocity: { value: null },
    });

    const vorticityMat = makeMaterial(vorticityFrag, {
      uVelocity: { value: null },
      uCurl: { value: null },
      curl: { value: PARAMS.animation.curl },
      dt: { value: 0.016 },
    });

    const clearMat = makeMaterial(clearFrag, {
      uTexture: { value: null },
      value: { value: PARAMS.animation.pressure },
    });

    const pressureMat = makeMaterial(pressureFrag, {
      uPressure: { value: null },
      uDivergence: { value: null },
    });

    const gradientMat = makeMaterial(gradientSubtractFrag, {
      uPressure: { value: null },
      uVelocity: { value: null },
    });

    const lightDir = new THREE.Vector3();
    const a = THREE.MathUtils.degToRad(PARAMS.lighting.lightAngle);
    lightDir.set(Math.cos(a), Math.sin(a), 1.2).normalize();

    const displayMat = makeMaterial(displayFrag, {
      uMedia: { value: null },
      uDisplacement: { value: null },
      uDye: { value: null },
      uScreenAspect: { value: width / height },
      uMediaAspect: { value: 16 / 9 },
      uRefraction: { value: PARAMS.material.refraction },
      uChromatic: { value: PARAMS.material.chromatic },
      uSpecular: { value: PARAMS.material.specular },
      uShininess: { value: PARAMS.material.shininess },
      uShading: { value: PARAMS.lighting.shading },
      uSurface: { value: PARAMS.material.surface },
      uRipple: { value: PARAMS.material.ripple },
      uSimTexel: { value: simTexel },
      uVelocity: { value: null },
      uHighlight: { value: new THREE.Color(PARAMS.colors.highlight) },
      uLightDir: { value: lightDir },
    });

    // Render Targets
    function createTarget(w: number, h: number, filter: THREE.MagnificationTextureFilter) {
      return new THREE.WebGLRenderTarget(w, h, {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        minFilter: filter,
        magFilter: filter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        depthBuffer: false,
        stencilBuffer: false,
        generateMipmaps: false,
      });
    }

    function createDoubleTarget(w: number, h: number, filter: THREE.MagnificationTextureFilter) {
      let read = createTarget(w, h, filter);
      let write = createTarget(w, h, filter);
      return {
        get read() {
          return read;
        },
        get write() {
          return write;
        },
        swap() {
          const t = read;
          read = write;
          write = t;
        },
        dispose() {
          read.dispose();
          write.dispose();
        },
      };
    }

    const sim = {
      velocity: createDoubleTarget(simSize.x, simSize.y, THREE.LinearFilter),
      dye: createDoubleTarget(simSize.x, simSize.y, THREE.LinearFilter),
      displacement: createDoubleTarget(simSize.x, simSize.y, THREE.LinearFilter),
      pressure: createDoubleTarget(simSize.x, simSize.y, THREE.NearestFilter),
      divergence: createTarget(simSize.x, simSize.y, THREE.NearestFilter),
      curl: createTarget(simSize.x, simSize.y, THREE.NearestFilter),
    };

    function setCapsule(mat: THREE.ShaderMaterial, ax: number, ay: number, bx: number, by: number) {
      mat.uniforms.pointA.value.set(ax, ay);
      mat.uniforms.pointB.value.set(bx, by);
    }

    function splat(ax: number, ay: number, bx: number, by: number, vx: number, vy: number) {
      const dx = bx - ax;
      const dy = by - ay;
      const segment = Math.hypot(dx, dy);
      const amount = Math.min(segment / (PARAMS.interaction.radius * 1.8), 1.0);

      setCapsule(velocitySplatMat, ax, ay, bx, by);
      velocitySplatMat.uniforms.uTarget.value = sim.velocity.read.texture;
      velocitySplatMat.uniforms.color.value.set(vx, vy);
      velocitySplatMat.uniforms.amount.value = amount;
      blit(velocitySplatMat, sim.velocity.write);
      sim.velocity.swap();

      setCapsule(dyeSplatMat, ax, ay, bx, by);
      dyeSplatMat.uniforms.uTarget.value = sim.dye.read.texture;
      dyeSplatMat.uniforms.amount.value = amount;
      blit(dyeSplatMat, sim.dye.write);
      sim.dye.swap();
    }

    function triggerSplatWave() {
      for (let i = 0; i < 3; i++) {
        const x = 0.25 + Math.random() * 0.5;
        const y = 0.25 + Math.random() * 0.5;
        const a = Math.random() * Math.PI * 2;
        const len = 0.08;
        const bx = x + Math.cos(a) * len;
        const by = y + Math.sin(a) * len;
        splat(x, y, bx, by, Math.cos(a) * 380, Math.sin(a) * 380);
      }
    }

    splatTriggerRef.current = triggerSplatWave;

    function stepFluid(dt: number) {
      curlMat.uniforms.uVelocity.value = sim.velocity.read.texture;
      blit(curlMat, sim.curl);

      vorticityMat.uniforms.uVelocity.value = sim.velocity.read.texture;
      vorticityMat.uniforms.uCurl.value = sim.curl.texture;
      vorticityMat.uniforms.curl.value = PARAMS.animation.curl;
      vorticityMat.uniforms.dt.value = dt;
      blit(vorticityMat, sim.velocity.write);
      sim.velocity.swap();

      divergenceMat.uniforms.uVelocity.value = sim.velocity.read.texture;
      blit(divergenceMat, sim.divergence);

      clearMat.uniforms.uTexture.value = sim.pressure.read.texture;
      clearMat.uniforms.value.value = PARAMS.animation.pressure;
      blit(clearMat, sim.pressure.write);
      sim.pressure.swap();

      pressureMat.uniforms.uDivergence.value = sim.divergence.texture;
      for (let i = 0; i < PARAMS.performance.pressureIterations; i++) {
        pressureMat.uniforms.uPressure.value = sim.pressure.read.texture;
        blit(pressureMat, sim.pressure.write);
        sim.pressure.swap();
      }

      gradientMat.uniforms.uPressure.value = sim.pressure.read.texture;
      gradientMat.uniforms.uVelocity.value = sim.velocity.read.texture;
      blit(gradientMat, sim.velocity.write);
      sim.velocity.swap();

      displacementMat.uniforms.uVelocity.value = sim.velocity.read.texture;
      displacementMat.uniforms.uDisplacement.value = sim.displacement.read.texture;
      displacementMat.uniforms.uDye.value = sim.dye.read.texture;
      displacementMat.uniforms.dt.value = dt;
      displacementMat.uniforms.drag.value = PARAMS.animation.imageDrag;
      displacementMat.uniforms.decay.value = Math.exp(-PARAMS.animation.imageReturn * dt);
      blit(displacementMat, sim.displacement.write);
      sim.displacement.swap();

      advectionMat.uniforms.uVelocity.value = sim.velocity.read.texture;
      advectionMat.uniforms.uSource.value = sim.dye.read.texture;
      advectionMat.uniforms.dt.value = dt;
      advectionMat.uniforms.dissipation.value = PARAMS.animation.liquidFade;
      advectionMat.uniforms.velocityScale.value = 0.35;
      blit(advectionMat, sim.dye.write);
      sim.dye.swap();

      advectionMat.uniforms.uSource.value = sim.velocity.read.texture;
      advectionMat.uniforms.dissipation.value = PARAMS.animation.velocityFade;
      advectionMat.uniforms.velocityScale.value = 1.0;
      blit(advectionMat, sim.velocity.write);
      sim.velocity.swap();
    }

    // Pointer interaction
    const pointer = {
      tx: 0.5,
      ty: 0.5,
      x: 0.5,
      y: 0.5,
      px: 0.5,
      py: 0.5,
      inside: false,
      ready: false,
    };

    function onPointerMove(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.tx = (e.clientX - rect.left) / rect.width;
      pointer.ty = 1 - (e.clientY - rect.top) / rect.height;
      pointer.inside = true;
      if (!pointer.ready) {
        pointer.x = pointer.px = pointer.tx;
        pointer.y = pointer.py = pointer.ty;
        pointer.ready = true;
      }
    }

    function onPointerLeave() {
      pointer.inside = false;
      pointer.ready = false;
    }

    const dom = renderer.domElement;
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerleave", onPointerLeave);

    // Texture loading
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");

    let textureRequest = 0;
    let currentTexture: THREE.Texture | null = null;
    const loadTexture = (url: string) => {
      const request = ++textureRequest;
      textureLoader.load(url, (tex) => {
        if (disposed || request !== textureRequest) { tex.dispose(); return; }
        currentTexture?.dispose();
        currentTexture = tex;
        tex.wrapS = THREE.MirroredRepeatWrapping;
        tex.wrapT = THREE.MirroredRepeatWrapping;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
        displayMat.uniforms.uMedia.value = tex;
        displayMat.uniforms.uMediaAspect.value = tex.image.width / tex.image.height;
        setIsLoaded(true);
        triggerSplatWave();
        playTypographySequence();
      });
    };

    loadTextureRef.current = loadTexture;
    loadTexture(initialImageRef.current);

    // Resize handling
    function onResize() {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || (fullScreen ? window.innerHeight : 600);
      renderer.setSize(w, h);
      displayMat.uniforms.uScreenAspect.value = w / h;
      velocitySplatMat.uniforms.aspectRatio.value = w / h;
      dyeSplatMat.uniforms.aspectRatio.value = w / h;
    }
    window.addEventListener("resize", onResize);

    // Viewport ScrollTrigger entrance
    const triggerSection = sectionRef.current || container;
    const st = ScrollTrigger.create({
      trigger: triggerSection,
      start: "top 75%",
      once: true,
      onEnter: () => {
        triggerSplatWave();
        playTypographySequence();
      },
    });

    // Render loop
    const clock = new THREE.Clock();
    let animId = 0;
    let visible = false;
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    visibilityObserver.observe(container);

    function animate() {
      animId = requestAnimationFrame(animate);
      if (!visible || document.hidden) return;
      const dt = Math.min(Math.max(clock.getDelta(), 1 / 240), 1 / 30);

      // Pointer physics
      pointer.px = pointer.x;
      pointer.py = pointer.y;
      const k = 1 - Math.exp(-dt * PARAMS.interaction.followSpeed);
      pointer.x += (pointer.tx - pointer.x) * k;
      pointer.y += (pointer.ty - pointer.y) * k;

      if (pointer.inside && pointer.ready) {
        const dx = pointer.x - pointer.px;
        const dy = pointer.y - pointer.py;
        if (dx * dx + dy * dy >= 1e-10) {
          const f = PARAMS.interaction.force / dt;
          splat(pointer.px, pointer.py, pointer.x, pointer.y, dx * simSize.x * f, dy * simSize.y * f);
        }
      }

      stepFluid(dt);

      displayMat.uniforms.uDisplacement.value = sim.displacement.read.texture;
      displayMat.uniforms.uDye.value = sim.dye.read.texture;
      displayMat.uniforms.uVelocity.value = sim.velocity.read.texture;
      blit(displayMat, null);
    }

    animate();

    return () => {
      disposed = true;
      visibilityObserver.disconnect();
      loadTextureRef.current = null;
      splatTriggerRef.current = null;
      typographyRef.current?.kill();
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerleave", onPointerLeave);
      st.kill();
      sim.velocity.dispose();
      sim.dye.dispose();
      sim.displacement.dispose();
      sim.pressure.dispose();
      sim.divergence.dispose();
      sim.curl.dispose();
      currentTexture?.dispose();
      triGeometry.dispose();
      [velocitySplatMat, dyeSplatMat, advectionMat, displacementMat, divergenceMat, curlMat, vorticityMat, clearMat, pressureMat, gradientMat, displayMat].forEach((material) => material.dispose());
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [fullScreen, playTypographySequence, nearViewport, reduced]);

  // Handle slide change dynamically without rebuilding WebGL context
  useEffect(() => {
    if (loadTextureRef.current && activeImage) {
      loadTextureRef.current(activeImage);
    }
  }, [activeImage]);

  const isDark = tone === "dark";

  // Full-bleed 100vw x 100svh cinematic visual layout
  if (fullScreen) {
    return (
      <section
        id={id}
        ref={sectionRef}
        aria-label={activeTitle}
        className={`relative w-full h-[100svh] min-h-[640px] overflow-hidden select-none ${
          isDark ? "bg-[#0e0d0c] text-[#f3ede2]" : "bg-[#f3ede2] text-[#171513]"
        }`}
      >
        {/* Fullscreen Navier-Stokes WebGL Canvas */}
        <div
          ref={mountRef}
          aria-hidden
          className="absolute inset-0 h-full w-full cursor-crosshair touch-pan-y overflow-hidden z-[1]"
        />

        {/* Fallback & Poster Image before WebGL initializes */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage}
          alt={activeTitle}
          data-visual-ready={isLoaded}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover pointer-events-none z-0"
        />

        {/* Subtle Bottom Vignette Gradient for Impeccable Typography Legibility */}
        <div
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/35 to-black/20"
          aria-hidden="true"
        />

        {/* Top Bar / Slide Tabs (if slides provided) */}
        {slides && slides.length > 1 && showTabs && (
          <div className="absolute top-6 sm:top-8 left-0 right-0 z-20 gutter flex items-center justify-between gap-4 pointer-events-auto">
            {activeLabel && (
              <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[#c9a66b]/35 bg-black/60 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.22em] text-[#c9a66b] backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c9a66b] animate-ping" aria-hidden="true" />
                {activeLabel}
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1 max-w-full" role="tablist" aria-label="Visualizer Tabs">
              {slides.map((s, idx) => {
                const isSelected = activeIdx === idx;
                return (
                  <button
                    key={s.title + idx}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => handleSelectSlide(idx)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all duration-300 backdrop-blur-md ${
                      isSelected
                        ? "bg-[#c9a66b] text-[#0e0d0c] font-semibold shadow-lg shadow-[#c9a66b]/25 scale-105"
                        : "bg-black/50 border border-white/10 text-[#d4c3ad]/80 hover:text-white hover:border-[#c9a66b]/40"
                    }`}
                  >
                    0{idx + 1} · {s.tag || s.badge || s.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Editorial Content Stage at Bottom */}
        <div className="absolute bottom-8 sm:bottom-12 md:bottom-16 left-0 right-0 z-20 gutter pointer-events-auto">
          <div className="max-w-4xl">
            {activeLabel && (!slides || slides.length <= 1 || !showTabs) && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9a66b]/35 bg-black/60 px-4 py-1 text-xs font-mono uppercase tracking-[0.22em] text-[#c9a66b] backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c9a66b] animate-ping" aria-hidden="true" />
                {activeLabel}
              </div>
            )}

            <h2
              ref={headlineRef}
              className="font-playfair text-3xl sm:text-5xl md:text-6xl font-normal text-[#f3ede2] tracking-tight leading-[1.1]"
            >
              {activeTitle}
            </h2>

            {activeSubtitle && (
              <p
                ref={subRef}
                className="t-story mt-4 text-[#d4c3ad] text-base sm:text-lg max-w-2xl leading-relaxed"
              >
                {activeSubtitle}
              </p>
            )}

            {activeCtaText && activeCtaHref && (
              <div className="mt-6 flex items-center gap-4">
                <Link
                  href={activeCtaHref}
                  className="inline-flex items-center gap-2 rounded-full border border-[#c9a66b] bg-[#c9a66b]/15 px-6 py-2.5 text-xs font-mono uppercase tracking-widest text-[#c9a66b] hover:bg-[#c9a66b] hover:text-black transition-all"
                >
                  <span>{activeCtaText}</span>
                  <Arrow className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            )}
          </div>

          {/* Minimal Interactive HUD Hint */}
          <div className="pointer-events-none mt-8 flex items-center justify-between text-xs font-mono uppercase tracking-widest text-[#c9a66b]/70 border-t border-white/10 pt-4">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c9a66b] animate-pulse" />
              <span>NAVIER-STOKES FLUID TRANSITION</span>
            </span>
            <span className="hidden sm:inline text-[#d4c3ad]/60">
              SWEEP CURSOR / TOUCH TO DISPLACE
            </span>
          </div>
        </div>
      </section>
    );
  }

  // Framed layout fallback
  return (
    <section
      id={id}
      ref={sectionRef}
      aria-label="Viscous Liquid Simulation"
      className={`relative w-full overflow-hidden py-16 sm:py-24 ${
        isDark ? "bg-[#0e0d0c] text-[#f3ede2]" : "bg-[#f3ede2] text-[#171513]"
      }`}
    >
      <div className="gutter mx-auto w-full max-w-6xl">
        <div className="text-center mb-8 sm:mb-12">
          {activeLabel && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9a66b]/35 bg-black/40 px-4 py-1 text-xs font-mono uppercase tracking-[0.22em] text-[#c9a66b] backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c9a66b] animate-ping" aria-hidden="true" />
              {activeLabel}
            </div>
          )}

          {activeTitle && (
            <h2 ref={headlineRef} className="font-playfair text-3xl sm:text-5xl font-normal text-white tracking-tight">
              {activeTitle}
            </h2>
          )}

          {activeSubtitle && (
            <p ref={subRef} className="t-story mx-auto mt-4 max-w-2xl text-sm sm:text-base text-[#d4c3ad]/80 leading-relaxed">
              {activeSubtitle}
            </p>
          )}
        </div>

        <div className="relative mx-auto w-full overflow-hidden rounded-xl border border-[#c9a66b]/30 bg-[#171513] shadow-2xl shadow-black/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage}
            alt={activeTitle}
            className="absolute inset-0 h-full w-full object-cover pointer-events-none opacity-85 transition-opacity duration-700"
          />

          <div
            ref={mountRef}
            aria-hidden
            className={`relative w-full ${heightClass} cursor-crosshair touch-pan-y overflow-hidden z-10`}
          />

          <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono uppercase tracking-widest text-[#c9a66b] bg-black/60 backdrop-blur-sm px-4 py-2 rounded border border-[#c9a66b]/20">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#c9a66b] animate-pulse" />
              <span>SPECTRAL DISPERSION · 6 CHANNELS</span>
            </span>
            <span className="hidden sm:inline text-[#d4c3ad]/70">
              TOUCH & DRAG TO DISPLACE FLUID
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
