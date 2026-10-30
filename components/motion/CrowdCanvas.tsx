"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";

/**
 * A crowd of walking figures drawn on a canvas from one sprite sheet: each figure is cut out of the sheet, sent across the
 * stage at its own pace with a slight bob, and recycled when it leaves. Under reduced motion the crowd is drawn once and
 * stands still.
 *
 * Adapted from Skiper UI's Skiper39 (see the credit at the foot of this file); the sheet is Open Peeps.
 */
export function CrowdCanvas({ src, rows = 15, cols = 7, scale = 1, className }: { src: string; rows?: number; cols?: number; scale?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const randomRange = (min: number, max: number) => min + Math.random() * (max - min);
    const randomIndex = (array: unknown[]) => randomRange(0, array.length) | 0;
    const removeFromArray = <T,>(array: T[], i: number) => array.splice(i, 1)[0];
    const removeItemFromArray = <T,>(array: T[], item: T) => removeFromArray(array, array.indexOf(item));
    const removeRandomFromArray = <T,>(array: T[]) => removeFromArray(array, randomIndex(array));

    type Peep = {
      rect: number[];
      width: number;
      height: number;
      x: number;
      y: number;
      anchorY: number;
      scaleX: number;
      walk: gsap.core.Timeline | null;
    };

    const img = document.createElement("img");
    const stage = { width: 0, height: 0 };
    const allPeeps: Peep[] = [];
    const availablePeeps: Peep[] = [];
    const crowd: Peep[] = [];

    /** Puts a figure back at one edge, a little up or down the stage, facing the way it will travel. */
    const resetPeep = (peep: Peep) => {
      const toTheRight = Math.random() > 0.5;
      const offsetY = (100 - 250 * gsap.parseEase("power2.in")(Math.random())) * scale;
      const startY = stage.height - peep.height + offsetY;
      const startX = toTheRight ? -peep.width : stage.width + peep.width;
      peep.scaleX = toTheRight ? 1 : -1;
      peep.x = startX;
      peep.y = startY;
      peep.anchorY = startY;
      return { startY, endX: toTheRight ? stage.width : 0 };
    };

    const walkPeep = (peep: Peep) => {
      const { startY, endX } = resetPeep(peep);
      const xDuration = 10;
      const yDuration = 0.25;
      const tl = gsap.timeline();
      tl.timeScale(randomRange(0.5, 1.5));
      tl.to(peep, { duration: xDuration, x: endX, ease: "none" }, 0);
      tl.to(peep, { duration: yDuration, repeat: xDuration / yDuration, yoyo: true, y: startY - 10 * scale }, 0);
      return tl;
    };

    const addPeepToCrowd = () => {
      const peep = removeRandomFromArray(availablePeeps);
      peep.walk = walkPeep(peep).eventCallback("onComplete", () => {
        removeItemFromArray(crowd, peep);
        availablePeeps.push(peep);
        addPeepToCrowd();
      });
      crowd.push(peep);
      crowd.sort((a, b) => a.anchorY - b.anchorY);
      return peep;
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(devicePixelRatio, devicePixelRatio);
      for (const peep of crowd) {
        ctx.save();
        ctx.translate(peep.x, peep.y);
        ctx.scale(peep.scaleX, 1);
        ctx.drawImage(img, peep.rect[0], peep.rect[1], peep.rect[2], peep.rect[3], 0, 0, peep.width, peep.height);
        ctx.restore();
      }
      ctx.restore();
    };

    const resize = () => {
      stage.width = canvas.clientWidth;
      stage.height = canvas.clientHeight;
      canvas.width = stage.width * devicePixelRatio;
      canvas.height = stage.height * devicePixelRatio;
      for (const peep of crowd) peep.walk?.kill();
      crowd.length = 0;
      availablePeeps.length = 0;
      availablePeeps.push(...allPeeps);
      while (availablePeeps.length) {
        const peep = addPeepToCrowd();
        peep.walk?.progress(Math.random());
        if (still) peep.walk?.pause();
      }
      if (still) render();
    };

    const init = () => {
      const { naturalWidth: width, naturalHeight: height } = img;
      const rectWidth = width / rows;
      const rectHeight = height / cols;
      // The sheet is drawn at its natural size; `scale` sizes the figures to the band they walk in.
      const drawWidth = rectWidth * scale;
      const drawHeight = rectHeight * scale;
      for (let i = 0; i < rows * cols; i++) {
        const rect = [(i % rows) * rectWidth, ((i / rows) | 0) * rectHeight, rectWidth, rectHeight];
        allPeeps.push({ rect, width: drawWidth, height: drawHeight, x: 0, y: 0, anchorY: 0, scaleX: 1, walk: null });
      }
      resize();
      if (!still) gsap.ticker.add(render);
    };

    img.addEventListener("load", init, { once: true });
    img.src = src;
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      img.removeEventListener("load", init);
      gsap.ticker.remove(render);
      for (const peep of crowd) peep.walk?.kill();
    };
  }, [src, rows, cols, scale]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}

/**
 * Skiper 39 Canvas_Landing_004 — React + Canvas
 * Inspired by and adapted from https://codepen.io/zadvorsky/pen/xxwbBQV
 * illustration by https://www.openpeeps.com/
 * We respect the original creators. This is an inspired rebuild with our own taste and does not claim any ownership.
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 *
 * Author: @gurvinder-singh02 · https://gxuri.me · https://x.com/Gur__vi
 */
