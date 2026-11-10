import * as THREE from "three";
import type { Station, StationCtx } from "../engine";
import { canvasTexture } from "../canvas-text";

/** A matte console beside the runway with brushed-metal knobs that turn as you scroll past. */
export function knobStation(range: [number, number], labels: string[]) {
  return (ctx: StationCtx): Station => {
    const group = new THREE.Group();
    const z0 = -(range[0] + (range[1] - range[0]) * 0.6) * ctx.length;
    group.position.set(-3.7, 0, z0);
    group.rotation.y = 0.3;
    group.scale.setScalar(1.35);

    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.25, 4.6),
      new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.55, metalness: 0.2, envMap: ctx.env, envMapIntensity: 0.6 }),
    );
    slab.position.y = 0.95;
    slab.rotation.z = -0.38;
    group.add(slab);

    const metal = new THREE.MeshStandardMaterial({ color: 0xd8d8da, roughness: 0.28, metalness: 1, envMap: ctx.env, envMapIntensity: 1.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.4, metalness: 0.6, envMap: ctx.env });
    const knobGeo = new THREE.CylinderGeometry(0.34, 0.38, 0.32, 48);
    const capGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.04, 48);
    const notchGeo = new THREE.BoxGeometry(0.05, 0.05, 0.22);
    const knobs: THREE.Group[] = [];
    labels.slice(0, 6).forEach((label, i) => {
      const k = new THREE.Group();
      const col = i % 2;
      const row = Math.floor(i / 2);
      k.position.set(-0.45 + col * 0.95, 0.24, -1.45 + row * 1.35);
      k.add(new THREE.Mesh(knobGeo, metal));
      const cap = new THREE.Mesh(capGeo, dark);
      cap.position.y = 0.17;
      k.add(cap);
      const notch = new THREE.Mesh(notchGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
      notch.position.set(0, 0.2, -0.14);
      k.add(notch);
      // The engraved label on the panel beside the knob.
      const { tex } = canvasTexture(256, 64, (g, w, h) => {
        g.fillStyle = "#f4f4f2";
        g.font = `600 30px ${ctx.fonts.mono}`;
        g.textAlign = "center";
        g.fillText(label, w / 2, h * 0.7);
      });
      const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
      tag.rotation.x = -Math.PI / 2;
      tag.position.set(0, 0.01 - 0.11, 0.52);
      k.add(tag);
      const holder = new THREE.Group();
      holder.position.copy(slab.position);
      holder.rotation.copy(slab.rotation);
      holder.add(k);
      group.add(holder);
      knobs.push(k);
    });

    return {
      id: "knobs",
      range,
      build: () => group,
      update: (local) => {
        knobs.forEach((k, i) => {
          k.rotation.y = -Math.PI * 0.75 + Math.min(Math.max(local * 1.3 - i * 0.06, 0), 1) * Math.PI * (0.9 + i * 0.12);
        });
      },
    };
  };
}
