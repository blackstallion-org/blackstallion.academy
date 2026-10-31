import { cn } from "@/lib/utils";

/**
 * The official BSAH logo: the crest with the shield, horse and motto (supplied artwork, 31 Oct 2026), shown exactly as supplied on its
 * dark leather ground. It replaces the earlier horseman mark everywhere (nav, sign-in, favicon, share image). The picture is square;
 * `size="sm"` serves a 192 px copy for the nav and `size="lg"` the 900 px original for large uses.
 */
export function CrestMark({ size = "sm", className, decorative = false }: { size?: "sm" | "lg"; className?: string; decorative?: boolean }) {
  const px = size === "sm" ? 192 : 900;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a fixed local file shown at 40 to 48 px; next/image would add nothing
    <img
      src={size === "sm" ? "/brand/bsah-logo-sm.webp" : "/brand/bsah-logo.webp"}
      width={px}
      height={px}
      alt={decorative ? "" : "The Black Stallion Academy of Horsemanship crest"}
      aria-hidden={decorative ? true : undefined}
      className={cn("inline-block select-none rounded-md object-contain", className)}
      draggable={false}
    />
  );
}
