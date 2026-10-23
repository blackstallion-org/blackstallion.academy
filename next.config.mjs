/**
 * Security headers (23 Oct 2026). The CSP is an allow-list of origins rather than a nonce policy: nonces would force
 * every page to render dynamically and undo static/partial prerendering, so inline scripts/styles stay allowed while
 * every external origin must be named here. Origins in use: Higgsfield CDN media (CloudFront, images.higgs.ai),
 * Google Fonts (referenced by app/globals.css and Matrix.tsx) and Cloudflare Turnstile (only when configured).
 * 'wasm-unsafe-eval' + blob: workers are required by the Draco decoder used for the 3D models.
 */
const isDev = process.env.NODE_ENV !== "production";
const SUPABASE_ORIGIN = (() => { try { return new URL(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").origin; } catch { return ""; } })();
// Higgsfield CDN media, plus the project's Supabase Storage for images uploaded through the staff console.
const MEDIA = ["https://d8j0ntlcm91z4.cloudfront.net", "https://d2ol7oe51mr4n9.cloudfront.net", "https://images.higgs.ai", SUPABASE_ORIGIN].filter(Boolean);
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: ${MEDIA.join(" ")}`,
  `media-src 'self' blob: ${MEDIA.join(" ")}`,
  `connect-src 'self' blob: data: ${MEDIA.join(" ")} https://challenges.cloudflare.com${isDev ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(self), gyroscope=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 16 defaults for new projects
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90, 95],
  },
  // Routes named in the client PDFs → the blueprint's routes (docs/BLUEPRINT.md Part 5)
  poweredByHeader: false,
  // Admin media uploads go through a server action; Vercel caps request bodies at about 4.5 MB.
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/admissions", destination: "/parents", permanent: true },
      { source: "/hubs", destination: "/schools", permanent: true },
      { source: "/hub/:slug", destination: "/schools/:slug", permanent: true },
      { source: "/mou-request", destination: "/schools/mou", permanent: true },
      { source: "/command-ai", destination: "/command", permanent: true },
      { source: "/pay", destination: "/parents#fees", permanent: false },
    ];
  },
};

export default nextConfig;
