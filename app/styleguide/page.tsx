import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Crest } from "@/components/brand/Crest";
import { Monogram } from "@/components/brand/Monogram";
import { Wordmark } from "@/components/brand/Wordmark";
import { GoldDust } from "@/components/motion/GoldDust";
import { SplitLines } from "@/components/motion/SplitLines";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { Footer } from "@/components/ui/Footer";
import { Nav } from "@/components/ui/Nav";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stat } from "@/components/ui/Stat";
import { ReducedMotionPreview } from "./_components/Demo";
import { MotionDemos } from "./_components/MotionDemos";
import { contrast, motionTokens, sections, swatches } from "./_data";

export const metadata: Metadata = {
  title: "Styleguide",
  description:
    "BSAH design system: tokens, type, brand marks, components and motion.",
  robots: { index: false, follow: false },
};

function Section({
  id,
  index,
  title,
  lede,
  children,
}: {
  id: string;
  index: string;
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-28 border-t border-brass/15 pt-14 first:border-t-0 first:pt-0 sm:pt-20 sm:first:pt-0"
    >
      <SectionHeading
        id={`${id}-title`}
        index={index}
        title={title}
        lede={lede}
        size="3"
        className="mb-10"
      />
      {children}
    </section>
  );
}

const forcedStates = ["Default", "Hover", "Focus", "Disabled"] as const;

/** Static previews of interactive states (the real ones come from :hover and :focus-visible). */
const forcedClass = {
  primary: {
    Hover: "border-parchment-gold bg-brass/[0.1] shadow-brass-strong",
    Focus: "outline outline-1 outline-offset-[3px] outline-brass",
  },
  quiet: {
    Hover: "border-brass/60 text-parchment-gold",
    Focus: "outline outline-1 outline-offset-[3px] outline-brass",
  },
  ghost: {
    Hover: "text-parchment-gold underline",
    Focus: "outline outline-1 outline-offset-[3px] outline-brass",
  },
} as const;

export default function StyleguidePage() {
  return (
    <>
      <Nav />
      <main id="main" className="pb-24">
        {/* Header: the page's one orchestrated moment */}
        <header className="relative overflow-hidden border-b border-brass/15 pb-16 pt-36 sm:pb-24 sm:pt-44">
          <GoldDust density={0.5} />
          <div
            className="cinematic-vignette pointer-events-none absolute inset-0"
            aria-hidden
          />
          <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8">
            <SplitLines
              as="h1"
              trigger="mount"
              delay={0.15}
              lines={["The BSAH", "Design System"]}
              className="font-display text-display-1 tracking-display"
            />
            <p className="mt-8 max-w-[52ch] font-editorial text-lede italic text-muted">
              Royal heritage museum, military citadel, sports-science lab. Every
              token, mark and moving part the site is built from.
            </p>
            <p className="mt-6 max-w-[62ch] text-sm leading-relaxed text-muted">
              Brand marks and imagery are placeholders until the final assets
              arrive. Rules for using all of this live in{" "}
              <code className="font-mono text-brass">CLAUDE.md</code>.
            </p>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1320px] gap-12 px-5 pt-12 sm:px-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
          {/* Index */}
          <nav
            aria-label="Styleguide sections"
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <ol className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-1">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <Link
                    href={`#${s.id}`}
                    className="group flex items-baseline gap-3 text-sm text-muted hover:text-parchment-gold"
                  >
                    <span className="font-mono text-xs text-brass/70">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex min-w-0 flex-col gap-20">
            {/* 01 Colour */}
            <Section
              id="colour"
              index="01"
              title="Colour"
              lede="Obsidian and carbon carry the page; brass is a hairline, never a flood."
            >
              <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                {swatches.map((s) => {
                  const onObsidian = contrast(s.hex, "#0A0B0E");
                  const textSafe = onObsidian >= 4.5;
                  return (
                    <li key={s.token} className="bsah-card overflow-hidden">
                      <div
                        className={`h-16 border-b border-brass/15 sm:h-24 ${s.className}`}
                      />
                      <div className="flex flex-col gap-2 p-4 sm:p-5">
                        <p className="text-sm font-medium text-ink">
                          {s.token}
                        </p>
                        <p className="font-mono text-xs text-brass">{s.hex}</p>
                        <p className="text-xs leading-relaxed text-muted">
                          {s.role}
                        </p>
                        {s.token !== "obsidian" && (
                          <p className="mt-1 font-mono text-[0.7rem] text-muted">
                            {onObsidian.toFixed(1)}:1 on obsidian{" "}
                            <span
                              className={
                                textSafe ? "text-ink" : "text-thar-sand"
                              }
                            >
                              {textSafe ? "text OK" : "not for text"}
                            </span>
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Section>

            {/* 02 Typography */}
            <Section
              id="type"
              index="02"
              title="Typography"
              lede="Four voices, each with one job."
            >
              <div className="flex flex-col gap-6">
                <Card variant="quiet" className="overflow-hidden">
                  <p className="mb-6 text-xs text-muted">
                    Display, Cinzel. Titles of six words or fewer.
                  </p>
                  <p className="font-display text-display-1 tracking-display">
                    Forged
                  </p>
                  <p className="mt-4 font-display text-display-2 tracking-display">
                    In the Thar
                  </p>
                  <p className="mt-4 font-display text-display-3 tracking-display">
                    The Sovereign Ledger
                  </p>
                </Card>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card variant="quiet">
                    <p className="mb-6 text-xs text-muted">
                      Editorial, Cormorant Garamond. Story, quotes, the creed.
                    </p>
                    <p className="font-editorial text-lede text-ink">
                      In the deserts of Marwar the Rathores bred a horse that
                      could live on a cup of water and never leave its rider on
                      the field.
                    </p>
                    <blockquote className="mt-6 border-l border-brass/50 pl-5 font-editorial text-2xl italic leading-snug text-parchment-gold">
                      I do not ride to conquer the horse; I command to master
                      myself.
                    </blockquote>
                  </Card>
                  <Card variant="quiet">
                    <p className="mb-6 text-xs text-muted">
                      UI and body, Inter. Reading, forms, navigation.
                    </p>
                    <p className="text-lg leading-relaxed text-ink">
                      Every session is graded in three parts: riding, ground
                      work and stable duty. Parents see the scores and a
                      10-second clip the same evening.
                    </p>
                    <p className="mt-4 text-sm text-muted">
                      Labels and captions sit at 14 px in muted grey.
                    </p>
                  </Card>
                </div>
                <Card variant="plate">
                  <p className="mb-6 text-xs text-muted">
                    Telemetry, JetBrains Mono. Every number, price, code and
                    time.
                  </p>
                  <dl className="grid gap-x-10 gap-y-5 font-mono sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted">Passport code</dt>
                      <dd className="text-xl text-ink">BSAH-2026-HYD-042</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Monthly tuition</dt>
                      <dd className="text-xl text-parchment-gold">₹9,440</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Microchip ISO</dt>
                      <dd className="text-xl text-ink">356 098 100 482 117</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Session scores</dt>
                      <dd className="text-xl text-ink">R 9 / G 8 / S 10</dd>
                    </div>
                  </dl>
                </Card>
              </div>
            </Section>

            {/* 03 Brand marks */}
            <Section
              id="marks"
              index="03"
              title="Brand marks"
              lede="Placeholders until the vector logo arrives. The ears are the idea."
            >
              <div className="grid gap-6 md:grid-cols-2">
                <Card
                  variant="quiet"
                  className="flex flex-col items-center gap-8 py-12"
                >
                  <Crest className="h-44 w-44" />
                  <div className="flex items-end gap-6">
                    <Crest className="h-16 w-16" simple />
                    <Crest className="h-10 w-10" simple />
                    <Crest className="h-6 w-6" simple />
                  </div>
                  <p className="text-center text-xs text-muted">
                    Crest: full, then the simple version at 64, 40 and 24 px
                  </p>
                </Card>
                <div className="flex flex-col gap-6">
                  <Card
                    variant="quiet"
                    className="flex flex-col items-center gap-8"
                  >
                    <div className="flex items-end gap-6">
                      <Monogram className="h-16 w-16" title="Monogram" />
                      <Monogram className="h-10 w-10" />
                      <Monogram className="h-6 w-6" />
                      <Monogram className="h-4 w-4" />
                    </div>
                    <p className="text-center text-xs text-muted">
                      Monogram: two lyre ears and a blaze, 64 to 16 px
                    </p>
                  </Card>
                  <Card
                    variant="quiet"
                    className="flex flex-col items-center gap-8"
                  >
                    <Wordmark className="text-2xl" />
                    <Wordmark layout="inline" />
                    <p className="text-center text-xs text-muted">
                      Wordmark: stacked and inline
                    </p>
                  </Card>
                  <div className="flex items-center justify-center gap-6 rounded-plate bg-obsidian p-6 ring-1 ring-brass/15">
                    <Monogram className="h-10 w-10" />
                    <span className="text-xs text-muted">On obsidian</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* 04 Buttons */}
            <Section
              id="buttons"
              index="04"
              title="Buttons"
              lede={"Brass hairlines, sharp corners, a 200\u00a0ms highlight."}
            >
              <div className="flex flex-col gap-10">
                {(["primary", "quiet", "ghost"] as const).map((variant) => (
                  <div key={variant}>
                    <p className="mb-4 text-sm text-ink">
                      {variant === "primary"
                        ? "Primary"
                        : variant === "quiet"
                          ? "Quiet"
                          : "Ghost"}
                      <span className="ml-3 text-muted">
                        {variant === "primary"
                          ? "the main call to action"
                          : variant === "quiet"
                            ? "secondary actions"
                            : "tertiary, inside dense UI"}
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      {forcedStates.map((state) => (
                        <div
                          key={state}
                          className="flex flex-col items-start gap-2"
                        >
                          <Button
                            variant={variant}
                            disabled={state === "Disabled"}
                            className={
                              state === "Hover" || state === "Focus"
                                ? forcedClass[variant][state]
                                : undefined
                            }
                          >
                            Enrol a cadet
                          </Button>
                          <span className="font-mono text-[0.7rem] text-muted">
                            {state}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <p className="mb-4 text-sm text-ink">Large</p>
                  <div className="flex flex-wrap gap-4">
                    <Button size="lg">Enter the 3D Citadel</Button>
                    <Button size="lg" variant="quiet">
                      Find your campus
                    </Button>
                  </div>
                </div>
              </div>
            </Section>

            {/* 05 Cards */}
            <Section
              id="cards"
              index="05"
              title="Cards"
              lede="Carbon plates with a brass hairline. Plates get engraved corners."
            >
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <Card>
                  <p className="text-xs text-muted">Default</p>
                  <h3 className="mt-3 font-display text-xl tracking-display">
                    Cadet Rider
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    Independent canter, obstacle navigation and vagal-tone
                    control.
                  </p>
                </Card>
                <Card variant="plate">
                  <p className="text-xs text-muted">
                    Plate, for registry entries
                  </p>
                  <h3 className="mt-3 font-display text-xl tracking-display">
                    Chetak
                  </h3>
                  <dl className="mt-4 grid grid-cols-2 gap-3 font-mono text-sm">
                    <div>
                      <dt className="text-xs text-muted">Breed</dt>
                      <dd>Marwari</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Height</dt>
                      <dd>15.2 hh</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-muted">Microchip</dt>
                      <dd className="text-brass">356 098 100 482 117</dd>
                    </div>
                  </dl>
                </Card>
                <Card variant="quiet" interactive as="article">
                  <p className="text-xs text-muted">Quiet and interactive</p>
                  <h3 className="mt-3 font-display text-xl tracking-display">
                    Royal Pavilion
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    Hover: the hairline brightens. Use when the whole card is a
                    link.
                  </p>
                </Card>
              </div>
            </Section>

            {/* 06 Headings and dividers */}
            <Section id="headings" index="06" title="Headings and dividers">
              <div className="flex flex-col gap-12">
                <Card variant="quiet">
                  <SectionHeading
                    index="04"
                    title="Three Conditions"
                    lede="A Marwari left the field only in victory, in death, or carrying its wounded rider."
                  />
                  <p className="mt-6 text-xs text-muted">
                    Numbers only when sections are a real sequence (chapters,
                    ranks, steps).
                  </p>
                </Card>
                <div className="flex flex-col gap-10">
                  <div>
                    <p className="mb-4 text-xs text-muted">Line</p>
                    <Divider />
                  </div>
                  <div>
                    <p className="mb-4 text-xs text-muted">
                      Lance, between major sections
                    </p>
                    <Divider variant="lance" />
                  </div>
                  <div>
                    <p className="mb-4 text-xs text-muted">
                      Seal, between minor sections
                    </p>
                    <Divider variant="seal" />
                  </div>
                </div>
              </div>
            </Section>

            {/* 07 Stats */}
            <Section
              id="stats"
              index="07"
              title="Stats"
              lede="One number in parchment gold per screen: the one that matters."
            >
              <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
                <Stat value={21} label="Marwari and Kathiawari stallions" />
                <Stat
                  value={9440}
                  prefix="₹"
                  label="Monthly tuition, GST included"
                  emphasis
                />
                <Stat value={4} label="Cadet ranks, Squire to Lancer" />
                <Stat value={25} suffix="%" label="School revenue share" />
              </div>
            </Section>

            {/* 08 Motion */}
            <Section
              id="motion"
              index="08"
              title="Motion"
              lede="Weighted, never bouncy. One orchestrated moment per view."
            >
              <dl className="mb-10 grid gap-4 sm:hidden">
                {motionTokens.map((t) => (
                  <div key={t.token} className="border-b border-brass/10 pb-3">
                    <dt className="font-mono text-sm text-brass">{t.token}</dt>
                    <dd className="mt-1 flex justify-between gap-4 text-sm">
                      <span className="font-mono text-ink">{t.value}</span>
                      <span className="text-right text-muted">{t.use}</span>
                    </dd>
                  </div>
                ))}
              </dl>
              <table className="mb-10 hidden w-full border-collapse text-left text-sm sm:table">
                <thead>
                  <tr className="border-b border-brass/25 text-xs text-muted">
                    <th className="py-3 pr-6 font-normal">Token</th>
                    <th className="py-3 pr-6 font-normal">Value</th>
                    <th className="py-3 font-normal">Use</th>
                  </tr>
                </thead>
                <tbody>
                  {motionTokens.map((t) => (
                    <tr key={t.token} className="border-b border-brass/10">
                      <td className="py-3 pr-6 font-mono text-brass">
                        {t.token}
                      </td>
                      <td className="py-3 pr-6 font-mono text-ink">
                        {t.value}
                      </td>
                      <td className="py-3 text-muted">{t.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ReducedMotionPreview>
                <MotionDemos />
              </ReducedMotionPreview>
            </Section>

            {/* 09 Ambient */}
            <Section
              id="ambient"
              index="09"
              title="Ambient"
              lede="Gold dust, vignette and grain set the light. They never carry content."
            >
              <div className="relative h-80 overflow-hidden rounded-plate border border-brass/20 bg-obsidian">
                <GoldDust density={1.2} />
                <div
                  className="cinematic-vignette pointer-events-none absolute inset-0"
                  aria-hidden
                />
                <div className="relative grid h-full place-items-center p-8 text-center">
                  <div>
                    <p className="font-display text-display-3 tracking-display">
                      Gold dust
                    </p>
                    <p className="mt-3 max-w-[46ch] text-sm text-muted">
                      Canvas, capped at 60 motes on phones and 120 on desktop.
                      Pauses off-screen and in hidden tabs. One still frame
                      under reduced motion.
                    </p>
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
