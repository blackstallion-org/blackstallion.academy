import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * A still of a 3D scene's opening view. It is on the page from the first paint, so a panel is never blank while the
 * three.js code downloads and the scene builds, and it fades away once the live scene has drawn its first frame. It is
 * also all a device without WebGL sees. Decorative: the section's text says everything the picture does.
 */
export function ScenePoster({
  src,
  ready = false,
  priority = false,
  sizes = "100vw",
  position = "50% 50%",
  className,
}: {
  src: string;
  /** The live scene has drawn its first frame. */
  ready?: boolean;
  /** Above the fold: fetch at once. */
  priority?: boolean;
  sizes?: string;
  /** CSS object-position. */
  position?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-[1] transition-opacity duration-700 ease-out motion-reduce:transition-none",
        ready ? "opacity-0" : "opacity-100",
        className,
      )}
    >
      <Image src={src} alt="" fill priority={priority} sizes={sizes} className="object-cover" style={{ objectPosition: position }} />
    </div>
  );
}
