import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The official BSAH crest (supplied artwork: horse head on shield, crossed lances, laurels, motto ring).
 * Raster, transparent background. `.crest-ink` deepens the gold to bronze on ivory so it holds contrast.
 * Use `size="sm"` in the nav and `size="lg"` for the footer and seals.
 */
export function CrestMark({ size = "sm", className, decorative = false }: { size?: "sm" | "lg"; className?: string; decorative?: boolean }) {
  const src = size === "sm" ? "/brand/bsah-crest-160.webp" : "/brand/bsah-crest.webp";
  const px = size === "sm" ? 160 : 768;
  return (
    <Image
      src={src}
      width={px}
      height={px}
      alt={decorative ? "" : "Crest of The Black Stallion Academy of Horsemanship"}
      className={cn("crest-ink select-none", className)}
      draggable={false}
      unoptimized
    />
  );
}
