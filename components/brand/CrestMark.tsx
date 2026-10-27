import { cn } from "@/lib/utils";

/**
 * The BSAH mark: the horseman with the lance and pennant (supplied artwork, 28 Oct 2026). It replaces the earlier horse-head crest in the
 * nav, footer, seals and the sign-in page. The drawing is stored as an alpha mask (ink = opaque), and the box paints it in the current text
 * colour, so one file serves the ivory nav, the charcoal nav and the gold seals. Use `size="sm"` in the nav and `size="lg"` for the
 * footer and seals; the box is square and the drawing sits inside it at its own proportions (84 : 100).
 */
export function CrestMark({ size = "sm", className, decorative = false }: { size?: "sm" | "lg"; className?: string; decorative?: boolean }) {
  const src = size === "sm" ? "/brand/bsah-horseman-sm.webp" : "/brand/bsah-horseman.webp";
  const mask = `url(${src})`;
  return (
    <span
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : "The Black Stallion Academy of Horsemanship: a horseman with a lance"}
      className={cn("inline-block select-none bg-current", className)}
      style={{
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
