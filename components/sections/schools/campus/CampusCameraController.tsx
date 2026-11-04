"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { campusModuleById, type CampusTier } from "@/lib/content/campus";
import {
  MAX_POLAR,
  MIN_POLAR,
  focusPose,
  isClipping,
  lerpPose,
  overviewPose,
  poseToPosition,
  topPose,
  turn,
  zoomLimits,
  clamp,
  type Pose,
} from "@/lib/content/campus-camera";

export type CameraView = "overview" | "top" | "focus" | "free";

export type CameraApi = {
  flyTo: (pose: Pose, duration?: number) => Promise<void>;
  overview: (duration?: number) => Promise<void>;
  top: (duration?: number) => Promise<void>;
  focus: (id: string, duration?: number) => Promise<void>;
  zoomBy: (factor: number) => Promise<void>;
  orbitBy: (radians: number) => Promise<void>;
  /** Pose the camera would take for `tier` at the current stage shape: used to start travelling during a change of tier. */
  poseFor: (tier: CampusTier) => Pose;
};

type Props = {
  tier: CampusTier;
  reduced: boolean;
  apiRef: MutableRefObject<CameraApi | null>;
  onView: (v: CameraView) => void;
};

type Controls = {
  target: THREE.Vector3;
  update: () => boolean;
  addEventListener: (type: string, fn: () => void) => void;
  removeEventListener: (type: string, fn: () => void) => void;
  minDistance: number;
  maxDistance: number;
};

/**
 * The camera: drei OrbitControls for the visitor's hand (drag to orbit; the wheel and a vertical swipe are left to the page,
 * so zoom is by the buttons and keys), GSAP for every flight (overview, top-down, focus, zoom steps). A camera that would end
 * up inside a building or under the terrain is put back where it last was. With reduced motion every move is instant.
 */
export function CampusCameraController({ tier, reduced, apiRef, onView }: Props) {
  const { camera, size, invalidate } = useThree();
  const get = useThree((s) => s.get);
  const controls = useRef<Controls | null>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const settle = useRef<(() => void) | null>(null);
  const view = useRef<CameraView>("overview");
  const last = useRef<THREE.Vector3>(new THREE.Vector3());
  const aspect = size.width / Math.max(1, size.height);
  const live = useRef({ tier, aspect, reduced });
  useEffect(() => {
    live.current = { tier, aspect, reduced };
  });

  const setView = (v: CameraView) => {
    if (view.current === v) return;
    view.current = v;
    onView(v);
  };

  const readPose = (): Pose => {
    const c = controls.current!;
    const off = camera.position.clone().sub(c.target);
    const radius = off.length();
    return { az: Math.atan2(off.x, off.z), polar: Math.acos(clamp(off.y / radius, -1, 1)), radius, target: [c.target.x, c.target.y, c.target.z] };
  };

  const applyPose = (p: Pose) => {
    const c = controls.current;
    if (!c) return;
    const polar = clamp(p.polar, MIN_POLAR, MAX_POLAR);
    const pos = poseToPosition({ ...p, polar });
    camera.position.set(pos[0], pos[1], pos[2]);
    c.target.set(p.target[0], p.target[1], p.target[2]);
    c.update();
    invalidate();
  };

  /** Stops a flight in progress and settles its promise (GSAP does not call onInterrupt for a plain kill). */
  const stop = () => {
    tween.current?.kill();
    tween.current = null;
    settle.current?.();
    settle.current = null;
  };

  const fly = (pose: Pose, duration = 1.2): Promise<void> => {
    stop();
    if (!controls.current) return Promise.resolve();
    const from = readPose();
    const to: Pose = { ...pose, az: from.az + turn(from.az, pose.az) };
    if (live.current.reduced || duration <= 0) {
      applyPose(to);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const o = { t: 0 };
      settle.current = resolve;
      tween.current = gsap.to(o, {
        t: 1,
        duration,
        ease: "power3.inOut",
        onUpdate: () => applyPose(lerpPose(from, to, o.t)),
        onComplete: () => {
          settle.current = null;
          resolve();
        },
      });
    });
  };

  const limitsFor = () => zoomLimits(live.current.tier, live.current.aspect);

  useEffect(() => {
    apiRef.current = {
      flyTo: (p, d) => fly(p, d),
      overview: (d) => {
        setView("overview");
        return fly(overviewPose(live.current.tier, live.current.aspect), d);
      },
      top: (d) => {
        setView("top");
        return fly(topPose(live.current.tier, live.current.aspect), d);
      },
      focus: (id, d) => {
        const m = campusModuleById(live.current.tier, id);
        if (!m) return Promise.resolve();
        setView("focus");
        return fly(focusPose(live.current.tier, m, live.current.aspect), d);
      },
      zoomBy: (f) => {
        const p = readPose();
        const { min, max } = limitsFor();
        setView("free");
        return fly({ ...p, radius: clamp(p.radius * f, min, max) }, 0.45);
      },
      orbitBy: (r) => {
        const p = readPose();
        setView("free");
        return fly({ ...p, az: p.az + r }, 0.55);
      },
      poseFor: (t) => overviewPose(t, live.current.aspect),
    };
    return () => {
      apiRef.current = null;
      stop();
    };
    // fly/readPose/applyPose read refs and stable three objects; they are intentionally not dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiRef]);

  // Limits and the framing follow the tier and the stage's shape. A resize while looking at the overview or the plan re-fits it.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const { min, max } = zoomLimits(tier, aspect);
    c.minDistance = min;
    c.maxDistance = max;
    if (tween.current?.isActive()) return;
    if (view.current === "overview") applyPose(overviewPose(tier, aspect));
    else if (view.current === "top") applyPose(topPose(tier, aspect));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, aspect]);

  // Wire the controls once they exist: stop a flight when the visitor takes over, keep the camera outside the architecture,
  // and give the vertical swipe back to the page.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const canvas = get().gl.domElement;
    const guard = () => {
      const p = camera.position;
      if (isClipping([p.x, p.y, p.z], live.current.tier)) {
        camera.position.copy(last.current);
        invalidate();
      } else last.current.copy(p);
    };
    const start = () => {
      stop();
      setView("free");
      canvas.style.cursor = "grabbing";
    };
    const end = () => {
      canvas.style.cursor = "";
    };
    // OrbitControls sets touch-action: none when it connects; the stage must not trap a vertical swipe.
    const touch = () => {
      canvas.style.touchAction = "pan-y";
    };
    touch();
    const frame = requestAnimationFrame(touch);
    last.current.copy(camera.position);
    c.addEventListener("change", guard);
    c.addEventListener("start", start);
    c.addEventListener("end", end);
    return () => {
      cancelAnimationFrame(frame);
      c.removeEventListener("change", guard);
      c.removeEventListener("start", start);
      c.removeEventListener("end", end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [get, camera]);

  const start = overviewPose(tier, aspect);
  return (
    <OrbitControls
      ref={(c) => {
        controls.current = c as unknown as Controls | null;
      }}
      makeDefault
      enablePan={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.09}
      rotateSpeed={0.55}
      minPolarAngle={MIN_POLAR}
      maxPolarAngle={MAX_POLAR}
      target={start.target}
    />
  );
}
