import type { Scene, WebGLRenderer, Camera } from "three";

/**
 * Shared set-up for the three WebGL scenes on /schools (the India relief map, the campus hub and the Hyderabad
 * diorama). Types only from three.js: this file is imported by code that must not pull the library into the page's
 * first bundle.
 */

/**
 * Compiles every shader program the scene will use, without blocking the page (KHR_parallel_shader_compile, in most
 * desktop and recent mobile browsers), then resolves. Without it, the first frame compiles them all in one long
 * freeze, which is the blank, stuck panel on a cold GPU cache. Never rejects: whatever is missing is compiled by the
 * first frame, as before.
 *
 * Objects that start hidden (the larger campus tiers) are shown for the length of the compile, so their programs are
 * ready before they are ever revealed. Nothing is drawn during that time, so the visitor never sees them.
 */
export async function warmUp(renderer: WebGLRenderer, scene: Scene, camera: Camera): Promise<void> {
  const hidden: { visible: boolean }[] = [];
  scene.traverse((object) => {
    if (!object.visible) {
      hidden.push(object);
      object.visible = true;
    }
  });
  try {
    await renderer.compileAsync(scene, camera);
  } catch {
    // The first frame will compile what is missing.
  } finally {
    for (const object of hidden) object.visible = false;
  }
}

type Marker = { x: number; y: number; visible: boolean };

/**
 * True when two lists of projected markers would be drawn in the same place, to within a pixel. The scenes project
 * their labels every 80 ms; handing React a new array each time re-rendered the whole section about twelve times a
 * second even when nothing moved.
 */
export function sameMarkers(previous: Marker[] | null, next: Marker[]): boolean {
  if (!previous || previous.length !== next.length) return false;
  return next.every((marker, i) => marker.visible === previous[i].visible && Math.abs(marker.x - previous[i].x) < 0.75 && Math.abs(marker.y - previous[i].y) < 0.75);
}

/**
 * Calls `onResize` whenever the element's box changes size. A window `resize` event is not enough: the box also
 * changes when fonts load, a sibling grows or the layout changes breakpoint, which left canvases at the wrong size.
 * Returns a function that stops watching.
 */
export function watchSize(element: Element, onResize: () => void): () => void {
  if (typeof ResizeObserver === "undefined") {
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }
  const observer = new ResizeObserver(() => onResize());
  observer.observe(element);
  return () => observer.disconnect();
}
