import Link from "next/link";
import { Crest } from "@/components/brand/Crest";
import { Wordmark } from "@/components/brand/Wordmark";
import { acts, corridors, entity, legalNav, reels, type Act } from "@/lib/content/site";

const pad = (n: number) => String(n).padStart(2, "0");

/** Footer: reel index by act, the three corridors, and the entity notice. */
export function Footer() {
  return (
    <footer className="no-print relative border-t border-brass/15 bg-night">
      <div className="gutter grid gap-12 py-20 lg:grid-cols-[1.2fr_2fr]">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-5">
            <Crest simple className="h-16 w-16" />
            <Wordmark className="text-base" />
          </div>
          <p className="max-w-sm text-sand">
            <em>{entity.motto}.</em> {entity.mottoEn}.
          </p>
          <ul className="flex flex-col gap-3">
            {corridors.map((c) => (
              <li key={c.id} className="flex flex-col">
                <span className="label text-dust">{c.title}</span>
                <a href={`mailto:${c.email}`} className="t-ui text-bone hover:text-gold">
                  {c.email}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="All reels" className="grid gap-10 sm:grid-cols-3">
          {(Object.keys(acts) as Act[]).map((act) => (
            <div key={act}>
              <p className="label text-brass">
                Act {acts[act].numeral} · {acts[act].name}
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {reels
                  .filter((r) => r.act === act)
                  .map((r) => (
                    <li key={r.href}>
                      <Link href={r.href} className="t-ui flex gap-3 text-sm text-sand hover:text-gold">
                        <span className="font-mono text-xs text-dust">{pad(r.n)}</span>
                        {r.title}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="gutter flex flex-col gap-4 border-t border-brass/10 py-8 md:flex-row md:items-end md:justify-between">
        <p className="t-ui max-w-3xl text-xs leading-relaxed text-dust">
          {entity.parent} · Operating arm: {entity.operator} (BSAH) · Sanctioned by the {entity.council} ({entity.councilShort}) ·{" "}
          {entity.city}. Imagery on this site is AI-generated placeholder art until the commissioned shoot.
        </p>
        <div className="flex gap-6">
          {legalNav.map((l) => (
            <Link key={l.href} href={l.href} className="label text-dust hover:text-gold">
              {l.label}
            </Link>
          ))}
          <span className="label text-dust">© 2026</span>
        </div>
      </div>
    </footer>
  );
}
