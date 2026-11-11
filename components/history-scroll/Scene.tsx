import { existsSync } from "node:fs";
import { join } from "node:path";
import type { CSSProperties } from "react";
import { asset } from "@/lib/content/asset";
import { historyAsset } from "@/lib/content/history/assets";
import { RELIEFS } from "@/lib/content/history/reliefs";
import { SUBJECT_MOTION } from "@/lib/content/history/motion";
import { RIGS } from "@/lib/content/history/rigs";
import { Puppet } from "./puppet/Puppet";
import { Atmosphere } from "./Atmosphere";
import type { Scene } from "@/lib/content/history/types";
import { HistoryArt } from "./HistoryArt";
import { ReliefMount } from "./ReliefMount";

const vars = (s: Scene["subject"]): CSSProperties =>
  ({
    "--dx": s.d.x ?? "auto",
    "--dr": s.d.r ?? "auto",
    "--db": s.d.b,
    "--dw": s.d.w,
    ...(s.m ? { "--mx": s.m.x ?? "auto", "--mr": s.m.r ?? "auto", "--mb": s.m.b, "--mw": s.m.w } : {}),
  }) as CSSProperties;

/** A plate relief needs its accepted plate and the depth map made from it; until both exist the flat plate stands alone. */
function plateFor(scene: Scene) {
  if (!scene.relief || RELIEFS[scene.relief].kind !== "plate") return undefined;
  const b = historyAsset(scene.layers.B);
  if (!b.ready) return undefined;
  const depth = b.path.replace(/\.webp$/, "-depth.webp");
  if (!existsSync(join(process.cwd(), "public", depth))) return undefined;
  const [fx, fy] = (b.focal ?? "50% 50%").split(" ").map((v) => parseFloat(v) / 100);
  return { src: asset(b.path), depth: asset(depth), width: b.width, height: b.height, focal: [fx, fy] as [number, number] };
}

/** The painted layers of one scene: background plate, optional relief, separate subject, foreground across the join. */
export function SceneArt({ scene, priority }: { scene: Scene; priority?: boolean }) {
  const plate = plateFor(scene);
  const map = scene.relief && RELIEFS[scene.relief].kind === "map";
  const m = SUBJECT_MOTION[scene.id];
  return (
    <div className="hs-art">
      <div className="hs-art-clip">
        <div className="hs-layer hs-layer-b" data-hs-layer="B">
          <HistoryArt id={scene.layers.B} sizes="100vw" priority={priority} />
          {plate && scene.relief && <ReliefMount id={scene.relief} plate={plate} />}
        </div>
        <div className="hs-tint" data-hs-tint aria-hidden />
        {map && scene.relief && <ReliefMount id={scene.relief} />}
        <div
          className="hs-layer hs-layer-s"
          data-hs-layer="S"
          data-hs-gait={m?.gait}
          data-hs-dir={m?.dir}
          data-hs-travel={m?.travel}
          style={vars(scene.subject)}
        >
          <div className="hs-gait">
            <HistoryArt id={scene.layers.S} sizes="(min-width: 1024px) 42vw, 88vw" priority={priority} />
            {RIGS[scene.id] && <Puppet rig={RIGS[scene.id]} />}
          </div>
        </div>
        <Atmosphere dir={m?.dir} />
      </div>
      <div className="hs-layer hs-layer-f" data-hs-layer="F">
        <HistoryArt id={scene.layers.F} sizes="100vw" decorative />
        <Puppet sway={0.006} />
      </div>
    </div>
  );
}

type ReadingProps = {
  scene: Scene;
  heading: "h2" | "h3";
  next?: { href: string; label: string };
};

/** The narrative, its qualification and its sources, server-rendered on a solid reading surface. */
export function SceneReading({ scene, heading: H, next }: ReadingProps) {
  const hid = `${scene.anchor}-h`;
  return (
    <div className="hs-reading">
      <p className="hs-label">
        {scene.label}
        {scene.interpretation && <span className="text-[var(--hs-malachite)]"> · Artistic interpretation</span>}
      </p>
      <H id={hid} className={`${H === "h2" ? "hs-h2" : "hs-h3"} mt-3`}>
        {scene.title}
      </H>
      <div className="mt-5">
        {scene.body.map((p, i) => (
          <p key={i} className="hs-body">
            {p}
          </p>
        ))}
      </div>
      {scene.qualification && <p className="hs-qual">{scene.qualification}</p>}
      <details className="hs-sources">
        <summary>Sources and notes</summary>
        <ul>
          {scene.sources.map((s) => (
            <li key={s.label}>
              {s.label}
              {s.detail && <span>: {s.detail}</span>}
            </li>
          ))}
        </ul>
      </details>
      {next && (
        <p className="mt-5">
          <a className="hs-link font-[family-name:var(--font-sans)] text-[0.86rem]" href={next.href}>
            {next.label}
          </a>
        </p>
      )}
    </div>
  );
}
