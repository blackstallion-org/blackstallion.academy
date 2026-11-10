import * as THREE from "three";
import type { Station, StationCtx } from "../engine";
import { canvasTexture } from "../canvas-text";

/** An arch of HUD rings over the runway and two screens beside it, reading the run as it happens (SAMPLE figures). */
export function hudStation(range: [number, number]) {
  return (ctx: StationCtx): Station => {
    const group = new THREE.Group();
    const z0 = -(range[0] + (range[1] - range[0]) * 0.6) * ctx.length;
    group.position.z = z0;

    const lineMat = (o: number) => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: o, side: THREE.DoubleSide, toneMapped: false });
    const rings: THREE.Mesh[] = [];
    [3.2, 3.55, 4.1].forEach((r, i) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + (i === 1 ? 0.12 : 0.025), 128, 1, 0, i === 1 ? Math.PI * 1.4 : Math.PI * 2), lineMat(i === 1 ? 0.85 : 0.5));
      ring.position.y = 1.4;
      group.add(ring);
      rings.push(ring);
    });
    // Tick marks around the outer ring.
    const ticks: number[] = [];
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      const r0 = 4.25;
      const r1 = i % 10 === 0 ? 4.6 : 4.4;
      ticks.push(Math.cos(a) * r0, Math.sin(a) * r0 + 1.4, 0, Math.cos(a) * r1, Math.sin(a) * r1 + 1.4, 0);
    }
    const tg = new THREE.BufferGeometry();
    tg.setAttribute("position", new THREE.Float32BufferAttribute(ticks, 3));
    const tickLines = new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, toneMapped: false }));
    group.add(tickLines);

    // Two screens: live readouts and a stride trace.
    const history: number[] = [];
    let frame = 0;
    const screen = (x: number, ry: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) => {
      const t = canvasTexture(640, 400, draw);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ map: t.tex, transparent: true, side: THREE.DoubleSide, toneMapped: false }));
      m.position.set(x, 2.3, 2.5);
      m.rotation.y = ry;
      group.add(m);
      return t;
    };
    const frameBox = (g: CanvasRenderingContext2D, w: number, h: number, title: string) => {
      g.fillStyle = "rgba(8,8,10,0.78)";
      g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(255,255,255,0.75)";
      g.lineWidth = 2;
      g.strokeRect(10, 10, w - 20, h - 20);
      g.fillStyle = "#fff";
      g.font = `600 20px ${ctx.fonts.mono}`;
      g.fillText(title, 28, 46);
      g.fillText("SAMPLE", w - 120, 46);
      g.fillRect(28, 60, w - 56, 2);
    };
    const read = screen(-3.3, 0.5, (g, w, h) => {
      frameBox(g, w, h, "GAIT / SPRINT");
      const pace = ctx.pace;
      const rows: [string, string][] = [
        ["SPEED", `${(52 + pace * 6 + Math.sin(ctx.time * 2) * 1.5).toFixed(1)} KM/H`],
        ["STRIDE", `${(2.3 * pace).toFixed(2)} HZ`],
        ["LEAD", "RIGHT"],
      ];
      rows.forEach(([k, v], i) => {
        g.font = `600 22px ${ctx.fonts.mono}`;
        g.fillStyle = "rgba(255,255,255,0.65)";
        g.fillText(k, 28, 130 + i * 92);
        g.font = `800 58px ${ctx.fonts.sans}`;
        g.fillStyle = "#fff";
        g.fillText(v, 210, 140 + i * 92);
      });
    });
    const trace = screen(3.3, -0.5, (g, w, h) => {
      frameBox(g, w, h, "STRIDE TRACE");
      g.strokeStyle = "#fff";
      g.lineWidth = 3;
      g.beginPath();
      history.forEach((v, i) => {
        const x = 28 + (i / 119) * (w - 56);
        const y = h * 0.62 - v * 110;
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      });
      g.stroke();
      g.strokeStyle = "rgba(255,255,255,0.25)";
      g.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.moveTo(28, 110 + i * 46);
        g.lineTo(w - 28, 110 + i * 46);
        g.stroke();
      }
    });

    return {
      id: "hud",
      range,
      build: () => group,
      update: (local, c, dt) => {
        rings[0].rotation.z += dt * 0.25 * c.pace;
        rings[1].rotation.z -= dt * 0.6 * c.pace;
        rings[2].rotation.z += dt * 0.1;
        tickLines.rotation.z = -local * 1.2;
        const near = local > -0.6 && local < 1.6;
        if (!near) return;
        history.push(Math.abs(Math.sin(c.time * 2.3 * Math.PI * c.pace)) * (0.8 + Math.random() * 0.2));
        if (history.length > 120) history.shift();
        if (frame++ % 4 === 0) {
          read.redraw();
          trace.redraw();
        }
      },
    };
  };
}
