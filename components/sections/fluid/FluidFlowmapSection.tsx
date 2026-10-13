"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Renderer, Flowmap, Geometry, Texture, Program, Mesh, Vec2, Vec4 } from "ogl";
import { mediaSrc, type MediaKey } from "@/lib/content/media";
import { cn } from "@/lib/utils";

interface FlowmapPreset {
  id: string;
  name: string;
  subtitle: string;
  mediaKey: MediaKey;
  tag: string;
  doctrine: string;
}

const PRESETS: FlowmapPreset[] = [
  {
    id: "warhorse",
    name: "The Sovereign Stallion",
    subtitle: "Jet black coat · Rim-lit in liquid gold",
    mediaKey: "legendBlack",
    tag: "STUDBOOK · SPECIMEN 01",
    doctrine: "Unshakable composure in the presence of chaos.",
  },
  {
    id: "gallop",
    name: "The Desert Charge",
    subtitle: "Three lancers through molten dust",
    mediaKey: "bgCharge",
    tag: "TACTICAL · DRILL 02",
    doctrine: "Iron bone and momentum across the sands of Marwar.",
  },
  {
    id: "seal",
    name: "The Sovereign Seal",
    subtitle: "Hand-tooled leather & oxidized brass",
    mediaKey: "bgPassport",
    tag: "CHARTER · PROTOCOL 03",
    doctrine: "Every hour sealed in brass, authenticated for eternity.",
  },
];

const VERTEX_SHADER = `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0, 1);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  precision highp int;
  uniform sampler2D tWater;
  uniform sampler2D tFlow;
  uniform float uTime;
  varying vec2 vUv;
  uniform vec4 res;

  void main() {
    // Flowmap velocity sample
    vec3 flow = texture2D(tFlow, vUv).rgb;

    // Aspect ratio compensated UV coordinates
    vec2 myUV = (vUv - vec2(0.5)) * res.zw + vec2(0.5);

    // Triple RGB chromatic aberration offsets (Codrops Demo 2)
    vec2 myUV1 = myUV - flow.xy * (0.15 * 0.72);
    vec2 myUV2 = myUV - flow.xy * (0.125 * 0.72);
    vec2 myUV3 = myUV - flow.xy * (0.10 * 0.72);

    vec3 tex1 = texture2D(tWater, myUV1).rgb;
    vec3 tex2 = texture2D(tWater, myUV2).rgb;
    vec3 tex3 = texture2D(tWater, myUV3).rgb;

    // Reconstruct chromatic image
    vec3 color = vec3(tex1.r, tex2.g, tex3.b);

    // Subtle gold rim illumination along high fluid velocity ridges
    float flowLen = length(flow.xy);
    vec3 goldLight = vec3(0.83, 0.68, 0.21) * smoothstep(0.05, 0.5, flowLen) * 0.35;

    gl_FragColor = vec4(color + goldLight, 1.0);
  }
`;

export function FluidFlowmapSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [velocityMagnitude, setVelocityMagnitude] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const activePreset = PRESETS[activeIdx];

  // References for OGL objects
  const stateRef = useRef<{
    renderer: Renderer | null;
    flowmap: Flowmap | null;
    program: Program | null;
    texture: Texture | null;
    mesh: Mesh | null;
    rafId: number | null;
    aspect: number;
    mouse: Vec2;
    velocity: Vec2;
    lastMouse: Vec2;
    lastTime: number;
    resVec: Vec4 | null;
    needsUpdate: boolean;
  }>({
    renderer: null,
    flowmap: null,
    program: null,
    texture: null,
    mesh: null,
    rafId: null,
    aspect: 1,
    mouse: new Vec2(-1),
    velocity: new Vec2(),
    lastMouse: new Vec2(),
    lastTime: 0,
    resVec: null,
    needsUpdate: false,
  });

  // Switch image texture
  const loadTextureImage = useCallback((url: string) => {
    const s = stateRef.current;
    if (!s.texture || !s.program) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (s.texture) {
        s.texture.image = img;
        setIsLoaded(true);
      }
    };
    img.src = url;
  }, []);

  // Update active image preset
  const selectPreset = (index: number) => {
    setActiveIdx(index);
    const preset = PRESETS[index];
    const src = mediaSrc(preset.mediaKey) || `/media/${preset.mediaKey}.png`;
    loadTextureImage(src);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const s = stateRef.current;
    const width = container.offsetWidth || 800;
    const height = container.offsetHeight || 600;

    // Initialize OGL Renderer
    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true,
      premultipliedAlpha: true,
    });
    const gl = renderer.gl;
    renderer.setSize(width, height);

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    // Initialize Flowmap
    const flowmap = new Flowmap(gl, {
      falloff: 0.32, // Stamp radius
      alpha: 0.45,   // Stamp opacity
      dissipation: 0.955, // Decay speed
    });

    // Full-screen Quad geometry
    const geometry = new Geometry(gl, {
      position: {
        size: 2,
        data: new Float32Array([-1, -1, 3, -1, -1, 3]),
      },
      uv: {
        size: 2,
        data: new Float32Array([0, 0, 2, 0, 0, 2]),
      },
    });

    // Base Texture
    const texture = new Texture(gl, {
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
    });

    const aspect = width / height;
    s.aspect = aspect;

    // Aspect ratio uniform compensation
    const imgAspect = 0.72; // default ratio
    let a1 = 1;
    let a2 = 1;
    if (height / width < imgAspect) {
      a1 = 1;
      a2 = (height / width) / imgAspect;
    } else {
      a1 = (width / height) * imgAspect;
      a2 = 1;
    }

    const resVec = new Vec4(width, height, a1, a2);
    s.resVec = resVec;

    const program = new Program(gl, {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        tWater: { value: texture },
        tFlow: flowmap.uniform,
        res: { value: resVec },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    s.renderer = renderer;
    s.flowmap = flowmap;
    s.program = program;
    s.texture = texture;
    s.mesh = mesh;

    // Load initial image
    const initialSrc =
      mediaSrc(PRESETS[0].mediaKey) || `/media/${PRESETS[0].mediaKey}.png`;
    loadTextureImage(initialSrc);

    // Resize handler
    const handleResize = () => {
      if (!container || !s.renderer || !s.program || !s.resVec) return;
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      if (w === 0 || h === 0) return;

      s.renderer.setSize(w, h);
      s.aspect = w / h;

      let r1 = 1;
      let r2 = 1;
      if (h / w < imgAspect) {
        r1 = 1;
        r2 = (h / w) / imgAspect;
      } else {
        r1 = (w / h) * imgAspect;
        r2 = 1;
      }

      s.resVec.set(w, h, r1, r2);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let isRunning = true;
    const animate = (time: number) => {
      if (!isRunning) return;

      if (!s.needsUpdate) {
        s.mouse.set(-1);
        s.velocity.set(0);
      }
      s.needsUpdate = false;

      flowmap.aspect = s.aspect;
      flowmap.mouse.copy(s.mouse);

      const velLen = s.velocity.len();
      flowmap.velocity.lerp(s.velocity, velLen > 0 ? 0.16 : 0.08);
      flowmap.update();

      program.uniforms.uTime.value = time * 0.001;
      renderer.render({ scene: mesh });

      s.rafId = requestAnimationFrame(animate);
    };

    s.rafId = requestAnimationFrame(animate);

    return () => {
      isRunning = false;
      window.removeEventListener("resize", handleResize);
      if (s.rafId) cancelAnimationFrame(s.rafId);
      s.renderer = null;
      s.flowmap = null;
      s.program = null;
      s.texture = null;
      s.mesh = null;
    };
  }, [loadTextureImage]);

  // Mouse & Touch Tracking with Creative 3D Perspective Tilt
  const handlePointerMove = (clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;

    const s = stateRef.current;
    const rect = container.getBoundingClientRect();

    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    const normX = Math.max(0, Math.min(1, relX / rect.width));
    const normY = Math.max(0, Math.min(1, relY / rect.height));

    // Update 3D Perspective Tilt (-10deg to +10deg)
    const tiltX = (normY - 0.5) * -14;
    const tiltY = (normX - 0.5) * 14;
    setTilt({ x: tiltX, y: tiltY });

    // Set OGL Flowmap mouse input (Y inverted)
    s.mouse.set(normX, 1.0 - normY);

    const now = performance.now();
    if (!s.lastTime) {
      s.lastTime = now;
      s.lastMouse.set(normX, normY);
    }

    const deltaX = normX - s.lastMouse.x;
    const deltaY = normY - s.lastMouse.y;
    s.lastMouse.set(normX, normY);

    const dt = Math.max(10, now - s.lastTime);
    s.lastTime = now;

    s.velocity.x = deltaX / (dt * 0.035);
    s.velocity.y = deltaY / (dt * 0.035);
    s.needsUpdate = true;

    setVelocityMagnitude(Math.min(100, Math.round(s.velocity.len() * 40)));
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    handlePointerMove(e.clientX, e.clientY);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches && e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onPointerLeave = () => {
    setTilt({ x: 0, y: 0 });
    setVelocityMagnitude(0);
  };

  return (
    <section
      aria-label="Interactive Mouse Flowmap Deformation Stage"
      className="relative py-[clamp(6rem,14vh,12rem)] bg-[#070707] text-bone border-y border-line/40 overflow-hidden"
    >
      {/* Background Ambience */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-radial from-gold/5 via-transparent to-transparent opacity-40"
      />

      <div className="gutter mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-gold mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-ping" />
            <span>Interactive WebGL Fluid Stage</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl text-bone uppercase tracking-tight leading-none">
            The Living Current
          </h2>
          <p className="mt-3 font-mono text-xs sm:text-sm text-sand/80 max-w-xl">
            Glide cursor or finger across the canvas. Real-time OGL mouse flowmap deformation with chromatic RGB dispersion.
          </p>
        </div>

        {/* Preset Selector Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-full border border-gold/30 bg-black/60 backdrop-blur-md">
          {PRESETS.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPreset(idx)}
              className={cn(
                "rounded-full px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all",
                activeIdx === idx
                  ? "bg-gold text-black font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                  : "text-sand hover:text-bone hover:bg-white/10"
              )}
            >
              0{idx + 1} {p.name.split(" ")[1] || p.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Perspective Interactive Canvas Stage */}
      <div className="gutter">
        <div
          className="relative w-full aspect-[4/3] sm:aspect-[16/9] lg:h-[620px] rounded-3xl overflow-hidden border border-gold/30 shadow-2xl bg-[#0e0c0a] cursor-crosshair group"
          style={{
            perspective: "1200px",
          }}
          onMouseMove={onMouseMove}
          onTouchMove={onTouchMove}
          onMouseLeave={onPointerLeave}
        >
          {/* WebGL Canvas Host Container */}
          <div ref={containerRef} className="absolute inset-0 h-full w-full" />

          {/* Vignette & Contrast Overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/35"
          />

          {/* Floating 3D Perspective Typography Layer */}
          <div
            className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 sm:p-10 lg:p-12 transition-transform duration-200 ease-out"
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(35px)`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Top Bar: Tag & Velocity Telemetry */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.65rem] sm:text-xs uppercase tracking-[0.25em] text-gold border border-gold/40 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md">
                {activePreset.tag}
              </span>

              <div className="flex items-center gap-2 font-mono text-[0.65rem] sm:text-xs uppercase tracking-wider text-sand/80 border border-white/15 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-gold/90 animate-pulse" />
                <span>Deformation: {velocityMagnitude}%</span>
              </div>
            </div>

            {/* Center Creative Perspective Doctrine */}
            <div className="my-auto max-w-2xl">
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-sand/75 mb-2 block">
                {activePreset.subtitle}
              </span>
              <h3 className="font-display text-3xl sm:text-5xl lg:text-6xl text-[#FAF7F0] uppercase leading-[0.95] drop-shadow-lg">
                {activePreset.name}
              </h3>
              <p className="mt-4 font-body text-sm sm:text-lg text-sand leading-relaxed max-w-lg drop-shadow-md">
                “{activePreset.doctrine}”
              </p>
            </div>

            {/* Bottom Bar: Interactive Instruction Prompt */}
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[0.65rem] tracking-widest uppercase text-sand/70">
                  Mode 0{activeIdx + 1} OF 03 · OGL Flowmap Fluid
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-2 rounded-full border border-gold/30 bg-black/70 px-4 py-1.5 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                <span className="font-mono text-[0.65rem] tracking-wider uppercase text-sand">
                  Drag / glide cursor to deform
                </span>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {!isLoaded && (
            <div className="absolute inset-0 grid place-items-center bg-[#0a0a0a]">
              <div className="flex flex-col items-center gap-3">
                <div className="h-7 w-7 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
                <span className="font-mono text-xs tracking-widest uppercase text-sand/60">
                  Initializing OGL Fluid Flowmap...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
