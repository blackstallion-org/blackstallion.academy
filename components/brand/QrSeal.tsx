import { encodeQr, qrPath } from "@/lib/qr";
import { cn } from "@/lib/utils";

const ORIGIN = "https://blackstallion.academy";

/**
 * The Passport QR seal: a real, scannable QR code that resolves to the public verification page for
 * a passport code. It encodes only the public code (never names or private records).
 */
export function QrSeal({ code, label = "Scan to verify", className, tone = "dark" }: { code: string; label?: string; className?: string; tone?: "dark" | "light" }) {
  const url = `${ORIGIN}/verify/${encodeURIComponent(code)}`;
  const { d, size } = qrPath(encodeQr(url));
  const fg = tone === "dark" ? "#0F0E0D" : "#EDE3D1";
  const bg = tone === "dark" ? "#EDE3D1" : "#0F0E0D";
  return (
    <figure className={cn("inline-flex flex-col items-center gap-2", className)}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full" role="img" aria-label={`QR code linking to ${url}`} shapeRendering="crispEdges">
        <rect width={size} height={size} fill={bg} />
        <path d={d} fill={fg} />
      </svg>
      <figcaption className="font-mono text-[0.6rem] tracking-[0.12em] text-current">
        {label} · {code}
      </figcaption>
    </figure>
  );
}
