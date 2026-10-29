import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "lenis/dist/lenis.css";
import "./globals.css";
import "./editorial.css";
import { Atmosphere } from "@/components/film/Atmosphere";
import { Loader } from "@/components/motion/Loader";
import { OpeningFilm } from "@/components/motion/OpeningFilm";
import { loaderBootScript } from "@/lib/opening/boot";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { SiteParallax } from "@/components/motion/SiteParallax";
import { Footer } from "@/components/site/Footer";
import { SiteNav } from "@/components/site/SiteNav";
import { Soundscape } from "@/components/site/Soundscape";
import { fontVariables } from "@/lib/fonts";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://blackstallion.academy"),
  title: {
    default: "The Black Stallion Academy of Horsemanship",
    template: "%s · Black Stallion Academy",
  },
  description:
    "The interscholastic equestrian leadership academy and national tent pegging circuit for India's schools. Indigenous Marwari stallions, ex-cavalry instructors, a verifiable ledger of every hour.",
  alternates: { canonical: "/" },
  twitter: { card: "summary_large_image" },
  openGraph: {
    siteName: "Black Stallion Academy",
    locale: "en_IN",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F3EDE2",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Decides before first paint whether the first-visit loader shows. */}
        <script dangerouslySetInnerHTML={{ __html: loaderBootScript }} />
      </head>
      <body className="grain bg-night text-bone">
        <MotionProvider>
          <SmoothScroll>
            <a
              href="#main"
              className="label sr-only z-[110] bg-umber px-4 py-3 text-bone focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
            >
              Skip to content
            </a>
            <Loader />
            <OpeningFilm />
            <SiteNav />
            <Soundscape />
            <Atmosphere />
            <main id="main">{children}</main>
            <Suspense fallback={null}><SiteParallax /></Suspense>
            <Footer />
          </SmoothScroll>
        </MotionProvider>
        {/* Cookieless Vercel Web Analytics, off unless NEXT_PUBLIC_VERCEL_ANALYTICS=1 (and Analytics is enabled for the
            project in Vercel). Same-origin script and endpoint, so the CSP needs no change. Owner/legal decision. */}
        {process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === "1" && <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />}
      </body>
    </html>
  );
}
