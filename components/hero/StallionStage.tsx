"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { groundPatch } from "@/components/3d/contact";
import { addLights, createGaze, createTimer, daylight, disposeObject, loadMarwari, releaseRenderer, type Marwari } from "@/components/3d/marwari";
import { createStudioEnv } from "@/components/3d/studio";
import { heroModelUrl, PASSPORT_HREF } from "./stallion-flags";
import { RevealDirector, type Pose } from "./reveal";
import type { FilmEngine } from "@/components/stallion-film/engine";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/content/asset";

type Status = "loading" | "ready" | "failed";

type Props = {
  className?: string;
  /** Called with the outcome so the hero can keep its photograph when WebGL is unavailable. */
  onStatus?: (s: Status) => void;
  /** Turns on the cinematic engine (desert, village, campus) that shares this canvas, scene and horse; loaded lazily. Omit for the plain hero. */
  filmConfig?: { mobile: boolean; onChapter: (chapter: number) => void };
  /** Receives the live engine (or null when the stage tears down) so the page can drive it from scroll. */
  onFilm?: (film: FilmEngine | null) => void;
  /** When false the canvas ignores clicks (the film owns the screen). */
  clickEnabled?: boolean;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * The hero centrepiece: the rigged Marwari stallion (three.js, skinned, Draco).
 * Cursor gaze on fine pointers, device tilt on phones (permission asked on iOS), touch-drag otherwise,
 * ribcage breathing, tail, ear and blink clips, an occasional weight shift, light that follows the local
 * time of day, and a click that dollies the camera to the head and opens the Sovereign Passport.
 * Reduced motion: one still frame, no gaze, and the click goes straight to the passport.
 */
export function StallionStage({ className, onStatus, filmConfig, onFilm, clickEnabled = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [needsMotionPermission, setNeedsMotionPermission] = useState(false);
  const target = useRef({ yaw: 0, pitch: 0 });
  const dolly = useRef<{ start: number } | null>(null);
  const navigated = useRef(false);
  const reduced = useRef(false);
  const tiltRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
  const wake = useRef<() => void>(() => {});
  const revealApi = useRef<{ start: () => void } | null>(null);
  const revealStopAt = useRef(0);
  const [reveal, setReveal] = useState({ on: false, label: "" });
  const [canReveal, setCanReveal] = useState(false);

  // The parent re-renders on every film chapter; a changing callback identity must not restart the stage.
  const onStatusRef = useRef(onStatus);
  useEffect(() => {
    onStatusRef.current = onStatus;
  });
  const report = useCallback((s: Status) => {
    setStatus(s);
    onStatusRef.current?.(s);
  }, []);

  const enterPassport = useCallback(() => {
    if (!clickEnabled) return;
    if (dolly.current || navigated.current) return; // no double transitions
    if (performance.now() - revealStopAt.current < 700) return; // the tap that stopped the reveal is not a click on the passport
    if (reduced.current || status !== "ready") {
      navigated.current = true;
      router.push(PASSPORT_HREF);
      return;
    }
    dolly.current = { start: performance.now() };
    wake.current();
  }, [router, status, clickEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The route cache can keep this component's state while its effects are torn down and re-run (coming back from
    // /cadets): start every run from a clean slate so the click works again and the camera is not left mid-dolly.
    dolly.current = null;
    navigated.current = false;
    target.current = { yaw: 0, pitch: 0 };
    queueMicrotask(() => setStatus("loading"));
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      queueMicrotask(() => report("failed"));
      return;
    }
    // pixel ratio adapts to the device: it steps down when frames run long and back up when there is headroom
    const maxDpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let dpr = Math.min(maxDpr, window.matchMedia("(pointer: coarse)").matches ? 1.25 : 1.5);
    renderer.setPixelRatio(dpr);
    let frames = 0;
    let frameSum = 0;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const env = createStudioEnv(renderer);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.72;
    const applyLight = addLights(scene);
    const hour = () => new Date().getHours() + new Date().getMinutes() / 60;
    const startLight = daylight(hour());
    applyLight(startLight);
    renderer.toneMappingExposure = startLight.exposure;
    scene.add(groundPatch());
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
    let film: FilmEngine | null = null;
    let filmAttached = false;
    let horseCtx: { m: Marwari; mixer: THREE.AnimationMixer } | null = null;
    const tryAttachFilm = () => {
      if (!film || !horseCtx || filmAttached) return;
      filmAttached = true;
      film.attach({ renderer, scene, camera, horse: horseCtx.m, mixer: horseCtx.mixer, heroLights: applyLight.lights, heroShadow: scene.getObjectByName("contact-shadow") ?? null }).then(() => request());
    };
    const heroFov = () => (camera.aspect < 0.9 ? 40 : 30);

    let alive = true;
    let raf = 0;
    let visible = true;
    let ready = false;
    let mixer: THREE.AnimationMixer | null = null;
    let gaze: ReturnType<typeof createGaze> | null = null;
    let attention: THREE.AnimationAction | null = null;
    let nextAttention = 0;
    let nextBlink = 2;
    let nextShift = 14;
    let blink: THREE.AnimationAction | null = null;
    let shift: THREE.AnimationAction | null = null;
    let lastLight = 0;
    const g = { yaw: 0, pitch: 0 };
    const clock = createTimer();
    const t0 = performance.now();
    const eye = new THREE.Vector3();
    const viewDir = new THREE.Vector3(2.45, 0.45, 2.8).normalize();
    const look = new THREE.Vector3();
    const dir = new RevealDirector();
    const dflt: Pose = { pos: eye, look, fov: 30 };
    const zeroGaze = { yaw: 0, pitch: 0 };
    let revealOn = false;
    let revealLabel = "";
    const boneAt = (name: string, out: THREE.Vector3) => {
      const b = horseCtx?.m.bones[name];
      return b ? b.getWorldPosition(out) : out.set(0, 1.2, 0.6);
    };
    revealApi.current = {
      start: () => {
        if (reduced.current || !ready || dolly.current || navigated.current || film?.active || dir.active) return;
        dir.begin({ pos: camera.position.clone(), look: look.clone(), fov: camera.fov });
        wake.current();
      },
    };
    // any input hands the camera back
    const stopReveal = () => {
      if (dir.state !== "running") return;
      dir.cancel();
      revealStopAt.current = performance.now();
    };

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = camera.aspect < 0.9 ? 40 : 30; // narrow screens: a wider lens so the whole horse fits
      camera.updateProjectionMatrix();
    };

    const frame = (now: number) => {
      raf = 0;
      if (!alive || !ready) return;
      const dt = Math.min(clock.delta(), 0.05);
      const t = (now - t0) / 1000;
      const filmOn = !!film?.active;
      if (!reduced.current && mixer) {
        gaze?.undo();
        film?.undo();
        film?.beforeMixer(dt, camera.aspect);
        mixer.update(dt);
        film?.afterMixer(dt);
        if (t > nextBlink && blink) {
          blink.reset().play();
          nextBlink = t + 2.5 + Math.random() * 4.5;
        }
        if (t > nextShift && shift && (!film || film.allowIdleEvents())) {
          shift.reset().play();
          nextShift = t + 18 + Math.random() * 14;
        }
      }
      // follow the target softly; a slow idle drift when nothing is steering. In the film the director owns the gaze.
      const fg = filmOn ? film!.gaze(camera) : null;
      const steer = dir.active ? zeroGaze : target.current; // the reveal holds the head still for its close-ups
      const idle = reduced.current || filmOn || dir.active ? 0 : Math.sin(t * 0.3) * 0.08;
      g.yaw += ((fg ? fg.yaw : steer.yaw) + idle - g.yaw) * 0.05;
      g.pitch += ((fg ? fg.pitch : steer.pitch) - g.pitch) * 0.05;
      gaze?.apply(g.yaw, g.pitch);
      if (now - lastLight > 60_000) {
        const d = daylight(hour());
        applyLight(d);
        if (!filmOn) renderer.toneMappingExposure = d.exposure; // the film sets its own exposure and restores this one when it ends
        lastLight = now;
      }
      // camera: three-quarter view from the horse's left front; narrow screens step back
      // distance is fitted to the canvas: the whole horse (about 2.2 m tall with margin, 1.9 m across at this angle) always fits
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      // across: 1.9 m at this angle, with the muzzle and the tail leaving a margin of their own on a narrow screen (it was cropping the muzzle at 390 px)
      // tall: the film's header labels sit over the top of a portrait canvas, so the ears must stay clear of them (they met at 768 px)
      const narrow = camera.aspect < 0.9;
      const dist = Math.max((narrow ? 3.25 : 2.75) / 2 / tanHalf, (narrow ? 2.15 : 1.9) / 2 / (tanHalf * camera.aspect));
      look.set(0, narrow && camera.aspect > 0.6 ? 1.17 : 1.05, 0.15); // a portrait tablet has room: the horse sits lower, clear of the header labels
      eye.copy(look).addScaledVector(viewDir, dist);
      if (dolly.current) {
        const k = ease(clamp((now - dolly.current.start) / 1300, 0, 1));
        eye.lerp(new THREE.Vector3(0.85, 1.95, 2.35), k);
        look.lerp(new THREE.Vector3(0, 1.82, 1.1), k);
        if (k >= 1 && !navigated.current) {
          navigated.current = true;
          router.push(PASSPORT_HREF);
        }
      }
      const pose = filmOn ? film!.stepCamera(dt) : null;
      let rv: ReturnType<typeof dir.update> = null;
      if (filmOn && dir.active) {
        dir.reset();
        applyLight.level(1);
      } else if (dir.active) {
        dflt.fov = heroFov();
        rv = dir.update(dt, dflt, boneAt);
        applyLight.level(rv ? rv.light : 1, rv ? rv.rim : 1);
      }
      const on = !!rv, label = rv?.label ?? "";
      if (on !== revealOn || label !== revealLabel) {
        revealOn = on;
        revealLabel = label;
        setReveal({ on, label });
      }
      if (pose) {
        camera.position.copy(pose.pos);
        camera.lookAt(pose.look);
        if (Math.abs(camera.fov - pose.fov) > 0.01) {
          camera.fov = pose.fov;
          camera.updateProjectionMatrix();
        }
      } else if (rv) {
        camera.position.copy(rv.pose.pos);
        camera.lookAt(rv.pose.look);
        if (Math.abs(camera.fov - rv.pose.fov) > 0.01) {
          camera.fov = rv.pose.fov;
          camera.updateProjectionMatrix();
        }
      } else {
        if (camera.fov !== heroFov()) {
          camera.fov = heroFov();
          camera.updateProjectionMatrix();
        }
        camera.position.copy(eye);
        camera.lookAt(look);
      }
      try {
        renderer.render(scene, camera);
      } catch {
        report("failed");
        return;
      }
      // dynamic resolution: average over 45 frames; above 26 ms drop the pixel ratio, under 15 ms (with room) raise it
      frames += 1;
      frameSum += dt;
      if (frames >= 45) {
        const avg = (frameSum / frames) * 1000;
        const next = avg > 26 ? Math.max(0.75, dpr - 0.25) : avg < 15 ? Math.min(maxDpr, dpr + 0.25) : dpr;
        if (next !== dpr) {
          dpr = next;
          renderer.setPixelRatio(dpr);
          resize();
        }
        frames = 0;
        frameSum = 0;
      }
      if (!reduced.current && visible) raf = requestAnimationFrame(frame);
    };
    const request = () => {
      if (!raf && alive && ready && (visible || dolly.current)) raf = requestAnimationFrame(frame);
    };
    wake.current = request;
    if (!reduced.current && filmConfig) {
      import("@/components/stallion-film/engine").then(({ FilmEngine }) => {
        if (!alive) return;
        film = new FilmEngine({ mobile: filmConfig.mobile });
        film.onChapter = filmConfig.onChapter;
        onFilm?.(film);
        tryAttachFilm();
      });
    }

    const { promise, dispose: disposeLoader } = loadMarwari(heroModelUrl());
    promise
      .then((m) => {
        if (!alive) return disposeObject(m.root);
        scene.add(m.root, m.contacts.group);
        mixer = new THREE.AnimationMixer(m.root);
        const loop = (name: string, weight = 1) => {
          const clip = m.clips.get(name);
          if (clip) mixer!.clipAction(clip).setEffectiveWeight(weight).play();
        };
        loop("Idle_Breathing");
        loop("Tail_Sway", 0.8);
        loop("Ear_Rotate", 0.7);
        loop("Mane_Sway", 0.8);
        const once = (name: string) => {
          const clip = m.clips.get(name);
          if (!clip) return null;
          const a = mixer!.clipAction(clip);
          a.setLoop(THREE.LoopOnce, 1);
          return a;
        };
        blink = once("Blink");
        attention = once("Attention_Response");
        shift = once("Weight_Shift");
        mixer.update(0);
        gaze = createGaze(m);
        horseCtx = { m, mixer };
        tryAttachFilm();
        ready = true;
        resize();
        report("ready");
        request();
      })
      .catch(() => alive && report("failed"))
      .finally(disposeLoader);

    // a visitor arriving at the horse draws a brief attentive response (ears forward, a small head lift)
    const onEnter = () => {
      const t = (performance.now() - t0) / 1000;
      if (!reduced.current && attention && t > nextAttention) {
        attention.reset().play();
        nextAttention = t + 14;
      }
    };
    canvas.addEventListener("pointerenter", onEnter);
    // pointer gaze (fine pointers): the horse turns its head a few degrees toward the cursor
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.55;
      const cy = rect.top + rect.height * 0.3;
      target.current.yaw = clamp((e.clientX - cx) / window.innerWidth, -0.5, 0.5) * 1.1;
      target.current.pitch = clamp((e.clientY - cy) / window.innerHeight, -0.5, 0.5) * 0.5;
    };
    // touch drag on the canvas, a fallback when tilt is unavailable or declined
    const onTouch = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || e.buttons === 0) return;
      const rect = canvas.getBoundingClientRect();
      target.current.yaw = clamp((e.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5) * 1.1;
      target.current.pitch = clamp((e.clientY - rect.top) / rect.height - 0.4, -0.5, 0.5) * 0.5;
    };
    // device tilt
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      target.current.yaw = clamp(e.gamma / 45, -1, 1) * 0.5;
      target.current.pitch = clamp((e.beta - 45) / 45, -1, 1) * 0.22;
    };
    tiltRef.current = onTilt;
    const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse && DOE && !reduced.current) {
      if (typeof DOE.requestPermission === "function") queueMicrotask(() => setNeedsMotionPermission(true));
      else window.addEventListener("deviceorientation", onTilt);
    }

    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting && document.visibilityState === "visible";
      // Back from /cadets the cached page is shown again with its old state: forget the finished dolly so the camera
      // returns to the wide shot and the next click navigates again.
      if (en.isIntersecting && navigated.current) {
        dolly.current = null;
        navigated.current = false;
      }
      if (visible) {
        clock.delta(); // no jump after a pause
        request();
      }
    });
    io.observe(canvas);
    const onVis = () => {
      visible = document.visibilityState === "visible";
      if (visible) {
        clock.delta();
        request();
      }
    };
    const onResize = () => {
      resize();
      request();
    };
    const onLost = (e: Event) => {
      e.preventDefault();
      report("failed");
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    for (const ev of ["pointerdown", "wheel", "touchstart", "keydown", "scroll"]) window.addEventListener(ev, stopReveal, { passive: true });
    queueMicrotask(() => setCanReveal(!reduced.current));
    canvas.addEventListener("pointermove", onTouch, { passive: true });
    canvas.addEventListener("webglcontextlost", onLost);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      mixer?.stopAllAction();
      window.removeEventListener("pointermove", onMove);
      for (const ev of ["pointerdown", "wheel", "touchstart", "keydown", "scroll"]) window.removeEventListener(ev, stopReveal);
      revealApi.current = null;
      canvas.removeEventListener("pointermove", onTouch);
      canvas.removeEventListener("pointerenter", onEnter);
      canvas.removeEventListener("webglcontextlost", onLost);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("deviceorientation", onTilt);
      document.removeEventListener("visibilitychange", onVis);
      wake.current = () => {};
      if (film) {
        film.dispose();
        onFilm?.(null);
      }
      disposeObject(scene);
      env.dispose();
      releaseRenderer(renderer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, router]);

  const askMotion = async () => {
    const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent;
    try {
      const res = await DOE?.requestPermission?.();
      if (res === "granted" && tiltRef.current) window.addEventListener("deviceorientation", tiltRef.current);
    } catch {
      /* declined: touch-drag remains */
    }
    setNeedsMotionPermission(false);
  };

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="A black Marwari stallion with inward-curving ears, breathing slowly and turning its head to follow you."
        onClick={enterPassport}
        className={cn(
          "h-full w-full touch-pan-y transition-opacity duration-[1400ms] focus-visible:outline-none",
          clickEnabled ? "cursor-pointer" : "cursor-default",
          status === "ready" ? "opacity-100" : "opacity-0",
        )}
      />
      {status === "loading" && (
        <p className="label pointer-events-none absolute bottom-[18%] right-[12%] text-dust" aria-live="polite">
          Saddling the stallion…
        </p>
      )}
      {status !== "failed" && clickEnabled && (
        <div className="absolute bottom-[8%] right-4 flex flex-col items-end gap-2 sm:right-[6%]">
          {reveal.label && (
            <p className="label pointer-events-none text-right text-brass" aria-live="polite">
              {reveal.label}
            </p>
          )}
          {status === "ready" && canReveal && (
            <button
              type="button"
              onClick={() => revealApi.current?.start()}
              aria-pressed={reveal.on}
              className="label min-h-11 border border-line bg-night/70 px-3 py-2 text-dust hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {reveal.on ? "Any key or touch to stop" : "Play the reveal"}
            </button>
          )}
          <button type="button" onClick={enterPassport} className="label min-h-11 border border-line bg-night/70 px-3 py-2 text-sand hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
            Open the Sovereign Passport →
          </button>
          {needsMotionPermission && (
            <button type="button" onClick={askMotion} className="label min-h-11 border border-line bg-night/70 px-3 py-2 text-dust hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
              Enable tilt
            </button>
          )}
        </div>
      )}
    </div>
  );
}
