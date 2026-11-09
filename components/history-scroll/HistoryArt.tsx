import Image from "next/image";
import { asset } from "@/lib/content/asset";
import { historyAsset } from "@/lib/content/history/assets";

type Props = {
  id: string;
  sizes: string;
  priority?: boolean;
  /** Decorative layers (foregrounds, ornaments) are hidden from assistive technology. */
  decorative?: boolean;
  className?: string;
};

/**
 * One master from the asset ledger. Accepted, reviewed art renders through next/image at its real dimensions; anything
 * else renders as a labelled development placeholder of the same proportions, so layouts never jump when art arrives.
 */
export function HistoryArt({ id, sizes, priority, decorative, className }: Props) {
  const a = historyAsset(id);
  const alt = decorative ? "" : a.alt;
  if (!a.ready) {
    return (
      <div
        className={`hs-ph ${className ?? ""}`}
        style={{ aspectRatio: `${a.width} / ${a.height}` }}
        role={decorative || !alt ? undefined : "img"}
        aria-label={decorative || !alt ? undefined : `${alt} (illustration in production)`}
        aria-hidden={decorative || undefined}
        data-hs-missing={a.id}
      >
        <span>DEV PLACEHOLDER · {a.id}</span>
      </div>
    );
  }
  return (
    <Image
      src={asset(a.path)}
      alt={alt}
      width={a.width}
      height={a.height}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      quality={90}
      className={className}
      style={a.focal ? { objectPosition: a.focal } : undefined}
      aria-hidden={decorative || undefined}
      draggable={false}
    />
  );
}
