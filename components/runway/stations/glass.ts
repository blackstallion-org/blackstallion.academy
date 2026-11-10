import * as THREE from "three";
import type { Station, StationCtx } from "../engine";
import { canvasTexture } from "../canvas-text";

/** Frosted glass slabs across the runway, each etched with a line; the horse and the camera pass through them. */
export function glassStation(range: [number, number], lines: string[]) {
  return (ctx: StationCtx): Station => {
    const group = new THREE.Group();
    const z0 = -(range[0] + (range[1] - range[0]) * 0.3) * ctx.length;
    const glass = ctx.mobile
      ? new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.16, envMap: ctx.env, side: THREE.DoubleSide, depthWrite: false })
      : new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.32, metalness: 0, transmission: 1, thickness: 0.4, ior: 1.4, envMap: ctx.env, envMapIntensity: 0.8, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
    const slabs: THREE.Group[] = [];
    lines.forEach((text, i) => {
      const g = new THREE.Group();
      const side = i % 2 === 0 ? -1 : 1;
      g.position.set(side * 1.3, 1.9, z0 - i * 5.2);
      g.rotation.y = side * 0.18;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.4, 0.06), glass);
      g.add(slab);
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(slab.geometry), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, toneMapped: false }));
      g.add(edge);
      const { tex } = canvasTexture(1024, 720, (c, w, h) => {
        c.fillStyle = "rgba(255,255,255,0.92)";
        c.font = `600 34px ${ctx.fonts.mono}`;
        c.fillText(`0${i + 1} / 0${lines.length}`, 60, 90);
        c.font = `800 92px ${ctx.fonts.sans}`;
        const words = text.toUpperCase().split(" ");
        let line = "";
        let y = h * 0.5;
        words.forEach((wd) => {
          const t = line ? `${line} ${wd}` : wd;
          if (c.measureText(t).width > w - 120) {
            c.fillText(line, 60, y);
            y += 100;
            line = wd;
          } else line = t;
        });
        c.fillText(line, 60, y);
      });
      const etch = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
      etch.position.z = 0.04;
      g.add(etch);
      group.add(g);
      slabs.push(g);
    });
    return {
      id: "glass",
      range,
      build: () => group,
      update: (local, c) => {
        // Once the horse is through, the glass leaves the frame so it never stands between the camera and the finale.
        group.visible = local < 1.35;
        slabs.forEach((s, i) => {
          s.position.y = 1.9 + Math.sin(c.time * 0.8 + i) * 0.05;
          s.rotation.y = (i % 2 === 0 ? -1 : 1) * (0.18 + Math.max(0, Math.min(local, 1)) * 0.25);
        });
      },
    };
  };
}
