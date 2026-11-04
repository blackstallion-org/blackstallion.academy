"use client";

import { useMemo, useRef, type MutableRefObject } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { CampusModule } from "@/lib/content/campus";
import { PALETTE } from "./campus-materials";
import { cn } from "@/lib/utils";

export type Highlight = { hover: number; dim: number };

type Box = { p: [number, number, number]; s: [number, number, number] };

/**
 * Where a pointer may land on a building. Invisible boxes, one per solid part, instead of the building's own thousand
 * triangles. Open air over an arena is not a hit: a ray aimed at a stable block behind the arena must reach the block, so
 * the arena answers to its sand and, where it has one, its roof or entablature, never to the whole volume.
 */
export function hitBoxes(m: CampusModule): Box[] {
  const { x, z, w, d } = m.rect;
  if (m.kind !== "arena") return [{ p: [x, m.height / 2, z], s: [w, m.height, d] }];
  const a = m.arena!;
  const boxes: Box[] = [{ p: [x, 0.8, z], s: [a.w + 0.6, 1.6, a.d + 0.6] }];
  if (a.roof === "canopy") boxes.push({ p: [x, 7.4, z], s: [a.w + 3, 1.7, a.d + 3.4] });
  if (a.roof === "colonnade") {
    const cz = a.d / 2 + 1.8;
    for (const sgn of [-1, 1]) boxes.push({ p: [x, 6.1, z + sgn * cz], s: [a.w + 1.4, 1.2, 1.3] });
  }
  return boxes;
}

type Props = {
  module: CampusModule;
  amount: MutableRefObject<Highlight>;
  hovered: boolean;
  selected: boolean;
  interactive: boolean;
  showMarker: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

/**
 * One building's interaction: an invisible hit volume (hover and click), a gold footprint outline and wash that fade with the
 * highlight, and a small numbered pin (a real button, so the keyboard reaches it) with the building's name on hover.
 */
export function CampusHotspot({ module: m, amount, hovered, selected, interactive, showMarker, onHover, onSelect }: Props) {
  const get = useThree((s) => s.get);
  const boxes = useMemo(() => hitBoxes(m), [m]);
  const lineRef = useRef<THREE.LineLoop>(null);
  const fillRef = useRef<THREE.Mesh>(null);
  const corners = useMemo(() => {
    const hw = m.rect.w / 2 + 0.9;
    const hd = m.rect.d / 2 + 0.9;
    return { hw, hd, points: new Float32Array([-hw, 0, -hd, hw, 0, -hd, hw, 0, hd, -hw, 0, hd]) };
  }, [m.rect.w, m.rect.d]);

  useFrame(() => {
    const h = amount.current.hover;
    const line = lineRef.current;
    const fill = fillRef.current;
    if (line) (line.material as THREE.LineBasicMaterial).opacity = h * 0.9;
    if (fill) (fill.material as THREE.MeshBasicMaterial).opacity = h * 0.22;
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive) return;
    e.stopPropagation();
    onHover(m.id);
    get().gl.domElement.style.cursor = "pointer";
  };
  const out = () => {
    onHover(null);
    get().gl.domElement.style.cursor = "";
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive) return;
    e.stopPropagation();
    onSelect(m.id);
  };

  return (
    <group>
      <mesh ref={fillRef} position={[m.rect.x, 0.05, m.rect.z]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[corners.hw * 2, corners.hd * 2]} />
        <meshBasicMaterial color={PALETTE.gold} transparent opacity={0} depthWrite={false} polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
      </mesh>
      <lineLoop ref={lineRef} position={[m.rect.x, 0.07, m.rect.z]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[corners.points, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={PALETTE.gold} transparent opacity={0} depthWrite={false} />
      </lineLoop>
      {boxes.map((b, i) => (
        <mesh key={i} position={b.p} onPointerOver={over} onPointerOut={out} onClick={click}>
          <boxGeometry args={b.s} />
          <meshBasicMaterial visible={false} />
        </mesh>
      ))}
      {showMarker && (
        <Html position={[m.rect.x, m.height + 1.5, m.rect.z]} center zIndexRange={[18, 0]} style={{ pointerEvents: "none" }}>
          <button
            type="button"
            onClick={() => onSelect(m.id)}
            onPointerEnter={() => onHover(m.id)}
            onPointerLeave={() => onHover(null)}
            onFocus={() => onHover(m.id)}
            onBlur={() => onHover(null)}
            aria-label={`${m.name}, ${m.key}`}
            aria-pressed={selected}
            className={cn(
              "pointer-events-auto relative grid h-[22px] w-[22px] cursor-pointer before:absolute before:-inset-[11px] before:content-[''] place-items-center rounded-full border font-mono text-[0.62rem] leading-none transition-colors duration-200 outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold",
              selected ? "border-gold bg-gold text-ember" : hovered ? "border-gold bg-ember text-bone" : "border-[color:var(--color-line)] bg-ember/90 text-sand",
            )}
          >
            {m.key}
            <span
              aria-hidden
              className={cn(
                "label pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap border border-[color:var(--color-line)] bg-ember/95 px-2 py-1 text-[0.58rem] text-bone transition-opacity duration-200",
                hovered || selected ? "opacity-100" : "opacity-0",
              )}
            >
              {m.name}
            </span>
          </button>
        </Html>
      )}
    </group>
  );
}
