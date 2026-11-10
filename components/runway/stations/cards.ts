import * as THREE from "three";
import type { Station, StationCtx } from "../engine";
import { canvasTexture } from "../canvas-text";

const ease = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);

/** Fanned stacks of typographic cards on both sides of the runway; each stack opens as the horse arrives. */
export function cardStacks(range: [number, number], faces: [string, string, string][]) {
  return (ctx: StationCtx): Station => {
    const group = new THREE.Group();
    const stacks: { root: THREE.Group; cards: THREE.Mesh[] }[] = [];
    const z0 = -(range[0] + (range[1] - range[0]) * 0.55) * ctx.length;
    const geo = new THREE.PlaneGeometry(1.5, 2.1);
    const tones = [
      { bg: "#0b0b0c", ink: "#f4f4f2", rule: "#6b6b6b" },
      { bg: "#f4f4f2", ink: "#0b0b0c", rule: "#9a9a9a" },
      { bg: "#8d8d8f", ink: "#0b0b0c", rule: "#f4f4f2" },
    ];
    const layout = [
      { x: -3.7, z: 3 },
      { x: 3.6, z: -2 },
      { x: -3.8, z: -8 },
    ];
    layout.forEach((pos, si) => {
      const root = new THREE.Group();
      root.position.set(pos.x, 1.7, z0 + pos.z);
      root.rotation.y = pos.x < 0 ? 0.55 : -0.55;
      const cards: THREE.Mesh[] = [];
      for (let i = 0; i < 4; i++) {
        const [kicker, big, small] = faces[(si * 2 + i) % faces.length];
        const t = tones[(si + i) % tones.length];
        const { tex } = canvasTexture(512, 716, (g, w, h) => {
          g.fillStyle = t.bg;
          g.fillRect(0, 0, w, h);
          g.strokeStyle = t.rule;
          g.lineWidth = 3;
          g.strokeRect(18, 18, w - 36, h - 36);
          g.fillStyle = t.ink;
          g.font = `600 26px ${ctx.fonts.mono}`;
          g.fillText(`${kicker}`, 44, 76);
          g.fillText(`0${si * 4 + i + 1}`, w - 100, 76);
          g.fillRect(44, 100, w - 88, 3);
          let size = 150;
          g.font = `800 ${size}px ${ctx.fonts.sans}`;
          while (g.measureText(big).width > w - 88 && size > 40) g.font = `800 ${(size -= 6)}px ${ctx.fonts.sans}`;
          g.fillText(big, 44, h * 0.62);
          g.font = `600 24px ${ctx.fonts.mono}`;
          g.fillText(small, 44, h - 60);
        });
        const card = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false }));
        card.position.z = -i * 0.02;
        root.add(card);
        cards.push(card);
      }
      group.add(root);
      stacks.push({ root, cards });
    });

    return {
      id: "cards",
      range,
      build: () => group,
      update: (local, c) => {
        stacks.forEach((s, si) => {
          const open = ease(local * 1.6 - si * 0.25);
          s.cards.forEach((card, i) => {
            const k = i - 1.5;
            card.position.x = k * 0.55 * open;
            card.position.y = Math.abs(k) * -0.08 * open + Math.sin(c.time * 1.3 + i + si) * 0.03;
            card.rotation.z = -k * 0.14 * open;
            card.position.z = -i * 0.02 + k * 0.04 * open;
          });
        });
      },
    };
  };
}
