import { RelightScene } from "@/components/sections/shared/RelightScene";
import { relightHorses, relightScene } from "@/lib/content/relight";

/** Reel 06 · "Light the stallion": three studbook portraits under a stable lantern. */
export function LightTheStable() {
  return <RelightScene id="stable" copy={relightScene} items={relightHorses} preset="lantern" />;
}
