import Link from "next/link";
import { Crest } from "@/components/brand/Crest";
import { Wordmark } from "@/components/brand/Wordmark";
import { Divider } from "@/components/ui/Divider";
import { footerNav, legalNav } from "@/lib/content/nav";

/** Site footer: the motto, the three entities, and the legal line. */
export function Footer() {
  return (
    <footer className="relative border-t border-brass/20 bg-carbon">
      <div className="mx-auto max-w-[1320px] px-5 pb-10 pt-16 sm:px-8 sm:pt-20">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_2fr] lg:gap-20">
          <div className="flex flex-col items-start gap-6">
            <Crest className="h-24 w-24" simple />
            <Wordmark className="text-xl" />
            <div>
              <p className="font-display text-sm tracking-[0.2em] text-brass">Dominus Sui, Dominus Equi</p>
              <p className="mt-1 font-editorial text-lg italic text-muted">Master of oneself, master of the horse.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {footerNav.map((group) => (
              <div key={group.title}>
                <h2 className="mb-5 text-sm font-medium text-ink">{group.title}</h2>
                <ul className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm text-muted transition-colors duration-200 ease-in-out hover:text-parchment-gold"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Divider variant="lance" className="my-12" />

        <div className="flex flex-col gap-6 text-xs leading-relaxed text-muted md:flex-row md:items-end md:justify-between">
          <p className="max-w-[62ch]">
            The Black Stallion Academy of Horsemanship Pvt Ltd is a Vicarius Infinitum Holdings company. Interscholastic
            competition is governed by the School Tent Pegging Council of India (STPCI).
          </p>
          <div className="flex items-center gap-6">
            {legalNav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-parchment-gold">
                {item.label}
              </Link>
            ))}
            <span className="font-mono">© 2026 BSAH</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
