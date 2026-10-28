"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { pass, uv, float, Fn } from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";

/**
 * Post-processing from the cloak demo: a TSL bloom pass and a procedural vignette on a `RenderPipeline`.
 * Mounted only on the high tier; without it R3F's own render loop draws the scene.
 */
export function CloakEffects({ strength = 0.4, radius = 0.7, threshold = 0.67 }: { strength?: number; radius?: number; threshold?: number }) {
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl) as unknown as THREE.WebGPURenderer;

  const pipeline = useMemo(() => {
    const scenePass = pass(scene, camera);
    const sceneColor = scenePass.getTextureNode("output");
    const bloomPass = bloom(sceneColor, strength, radius, threshold);
    const vignette = Fn(() => {
      const dist = uv().sub(0.5).length();
      return float(1.0).sub(dist.mul(1.35)).clamp(0.55, 1.0);
    });
    const next = new THREE.RenderPipeline(gl);
    next.outputNode = sceneColor.add(bloomPass).mul(vignette());
    return next;
  }, [scene, camera, gl, strength, radius, threshold]);

  useEffect(() => () => pipeline.dispose?.(), [pipeline]);

  useFrame(() => {
    pipeline.render();
  }, 1);

  return null;
}
