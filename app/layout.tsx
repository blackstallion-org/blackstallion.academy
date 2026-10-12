import type { Metadata, Viewport } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
import { Atmosphere } from "@/components/film/Atmosphere";
import { Loader, loaderBootScript } from "@/components/motion/Loader";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Footer } from "@/components/site/Footer";
import { SiteNav } from "@/components/site/SiteNav";
import { fontVariables } from "@/lib/fonts";

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
            <SiteNav />
            <Atmosphere />
            <main id="main">{children}</main>
            <Footer />
          </SmoothScroll>
        </MotionProvider>
      </body>
    </html>
  );
}
