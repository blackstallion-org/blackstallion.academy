import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { QrSeal } from "@/components/brand/QrSeal";
import { Suspense } from "react";
import { Crest } from "@/components/brand/Crest";
import { Monogram } from "@/components/brand/Monogram";
import { Label } from "@/components/film/Marks";
import { PrintButton } from "@/components/sections/verify/PrintButton";
import { Verifier } from "@/components/sections/verify/Verifier";
import { ranks } from "@/lib/content/curriculum";
import { credentialByCode, credentials } from "@/lib/content/records";
import { lookupCredentialCore } from "@/lib/verify/lookup";

export function generateStaticParams() {
  return credentials.map((c) => ({ code: c.code }));
}

export async function generateMetadata({ params }: PageProps<"/verify/[code]">): Promise<Metadata> {
  const { code } = await params;
  const c = credentialByCode(code);
  return { alternates: { canonical: `/verify/${encodeURIComponent(code)}` }, title: c ? `${c.name} · Verified record` : "Passport verification", robots: { index: false } };
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default function RecordPage({ params }: PageProps<"/verify/[code]">) {
  return (
    <Suspense fallback={<div className="gutter min-h-[60svh] pt-32 text-dust">Opening the ledger…</div>}>
      <Record params={params} />
    </Suspense>
  );
}

async function Record({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const c = credentialByCode(code);

  // Not one of the labelled SAMPLE records: ask the live registry (the passport's QR seal opens this address).
  if (!c) return <RegistryRecord code={code} />;

  return (
    <>
      <section aria-labelledby="record-h" className="gutter no-print pb-16 pt-28 md:pt-32">
        <Link href="/verify" className="label text-sand hover:text-gold">
          ← Verify another
        </Link>
        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="label flex items-center gap-2 text-gold">
              <span className="h-2 w-2 rounded-full bg-gold" aria-hidden /> Sample record · demo data, not a real cadet
            </p>
            <h1 id="record-h" className="t-voice mt-4 text-display-2 text-bone">
              {c.name}
            </h1>
            <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-line pt-8">
              {[
                ["Rank", c.rankName],
                ["Riding hours", String(c.hours)],
                ["Hub", c.hubName],
                ["EFI registration", c.efi ?? "Pending"],
                ["Passport code", c.code],
                ["Last sealed", fmt(c.issued)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="label text-dust">{k}</dt>
                  <dd className={k === "Passport code" || k === "Riding hours" ? "font-mono mt-1 text-lg text-gold" : "t-ui mt-1 text-bone"}>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="label mt-10 text-brass">Seals</p>
            <ol className="mt-4 flex gap-3">
              {ranks.map((rk) => {
                const has = c.seals.includes(rk.id);
                return (
                  <li key={rk.id} className="flex flex-col items-center gap-2">
                    <span className={has ? "grid h-14 w-14 place-items-center rounded-full border-2 border-gold bg-gold/15" : "grid h-14 w-14 place-items-center rounded-full border border-dashed border-line"}>
                      {has ? <Monogram className="h-7 w-7 text-gold" /> : <span className="font-mono text-xs text-dust">{rk.numeral}</span>}
                    </span>
                    <span className="label text-[0.6rem] text-dust">{rk.name.replace("Cadet ", "").replace("Sovereign ", "")}</span>
                  </li>
                );
              })}
            </ol>
          </div>
          <div>
            <div className="mb-10 flex items-center gap-5">
              <QrSeal code={c.code} className="w-28 text-dust" />
              <p className="max-w-[16rem] text-sm text-sand">The passport&apos;s QR seal opens this page. It carries only the public code, never private details.</p>
            </div>
            <p className="label text-brass">Milestones</p>
            <ol className="mt-4 border-l border-line">
              {c.milestones.map((m) => (
                <li key={m.date + m.text} className="relative pb-6 pl-6">
                  <span aria-hidden className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold" />
                  <p className="font-mono text-xs text-dust">{fmt(m.date)}</p>
                  <p className="mt-1 text-bone">{m.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Diploma: printable */}
      <section aria-label="Diploma" className="gutter pb-[clamp(6rem,14vh,12rem)]">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="label text-brass">Gold-embossed diploma · preview</p>
          <PrintButton />
        </div>
        <article className="parchment print-doc relative mx-auto max-w-4xl overflow-hidden px-8 py-12 text-center md:px-20 md:py-16">
          <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 opacity-[0.08]">
            <Crest className="h-full w-full text-[#6b5130]" simple />
          </span>
          <div className="relative">
            <p className="label text-[#6b5130]">The Black Stallion Academy of Horsemanship · School Tent Pegging Council of India</p>
            <p className="t-inscribe mt-8 text-[clamp(1.6rem,4vw,3rem)] text-ink">Certificate of Rank</p>
            <p className="mt-6 italic text-[#5a4526]">This is to certify that</p>
            <p className="t-voice mt-3 text-[clamp(2rem,5vw,3.6rem)] text-ink">{c.name}</p>
            <p className="mt-4 text-lg text-ink/85">
              has earned the rank of <strong>{c.rankName}</strong> with <strong>{c.hours} logged riding hours</strong> at {c.hubName}.
            </p>
            <div className="mx-auto mt-10 grid h-28 w-28 place-items-center rounded-full bg-[radial-gradient(circle_at_40%_35%,#e6cd94,#c9a66b_55%,#8a6a3e)] shadow-[0_6px_18px_rgb(0_0_0/0.35)]">
              <Monogram className="h-12 w-12 text-[#3b2a12]" />
            </div>
            <div className="mt-12 grid grid-cols-2 gap-10 text-sm">
              <div className="border-t border-ink/40 pt-2">
                <p className="text-ink">Saef Ullah Khan</p>
                <p className="text-[#5a4526]">Founder &amp; Executive Chairman</p>
              </div>
              <div className="border-t border-ink/40 pt-2">
                <p className="text-ink">Chief Cavalry Instructor</p>
                <p className="text-[#5a4526]">BSAH</p>
              </div>
            </div>
            <p className="font-mono mt-10 text-[0.7rem] text-[#6b5130]">
              VERIFY AT BLACKSTALLION.ACADEMY/VERIFY/{c.code} · ISSUED {fmt(c.issued).toUpperCase()} · SAMPLE
            </p>
          </div>
        </article>
      </section>
    </>
  );
}

const registryRank = (rank: string) =>
  ranks.find((r) => r.id === rank)?.name ?? rank.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

/**
 * A real passport code, looked up in the live registry (public.verify_passport): rank and issue date only, never the
 * cadet's name or any contact detail. Rate limited per client like the /verify form.
 */
async function RegistryRecord({ code }: { code: string }) {
  const h = await headers();
  const client = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim().slice(0, 64);
  const result = await lookupCredentialCore(code, client);

  let heading = "No sealed record matches this code.";
  let detail = "Check the code printed inside the passport and try again.";
  if (result.kind === "invalid") {
    heading = "That is not a passport code.";
    detail = "Passport codes use letters, numbers and dashes, for example BSAH-2026-HYD-042.";
  } else if (result.kind === "rate_limited") {
    heading = "Too many lookups from this connection.";
    detail = "Please wait a few minutes and try again.";
  } else if (result.kind === "unavailable") {
    heading = result.reason === "not_configured" ? "Online verification is not available right now." : "The registry could not be reached.";
    detail = result.reason === "not_configured"
      ? "Please contact the academy to confirm this passport."
      : "Please try again shortly. Nothing about this code has been decided.";
  } else if (result.kind === "registry" && result.status === "revoked") {
    heading = "This passport has been revoked.";
    detail = "It is no longer a valid BSAH credential. Contact the academy if you believe this is a mistake.";
  } else if (result.kind === "registry" && result.status === "expired") {
    heading = "This passport has expired.";
    detail = "Contact the academy for the cadet's current record.";
  }

  if (result.kind === "registry" && result.status === "valid") {
    return (
      <section aria-labelledby="registry-h" className="gutter min-h-[80svh] pb-24 pt-28 md:pt-32">
        <Link href="/verify" className="label text-sand hover:text-gold">
          ← Verify another
        </Link>
        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="label flex items-center gap-2 text-gold">
              <span className="h-2 w-2 rounded-full bg-gold" aria-hidden /> Verified · live academy registry
            </p>
            <h1 id="registry-h" className="t-voice mt-4 text-display-2 text-bone">
              {registryRank(result.rank)}
            </h1>
            <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-line pt-8">
              <div>
                <dt className="label text-dust">Rank</dt>
                <dd className="t-ui mt-1 text-bone">{registryRank(result.rank)}</dd>
              </div>
              <div>
                <dt className="label text-dust">Issued</dt>
                <dd className="t-ui mt-1 text-bone">{fmt(result.issuedAt)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="label text-dust">Passport code</dt>
                <dd className="font-mono mt-1 text-lg text-gold">{code.trim().toUpperCase()}</dd>
              </div>
            </dl>
            <p className="mt-8 max-w-prose text-sm text-sand">
              Only the rank and the issue date are public. The cadet&apos;s name, contact details and training records are never shown here.
            </p>
          </div>
          <div className="flex items-start gap-5">
            <QrSeal code={code.trim().toUpperCase()} className="w-28 text-dust" />
            <p className="max-w-[16rem] text-sm text-sand">The passport&apos;s QR seal opens this page. It carries only the public code, never private details.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="gutter min-h-[80svh] pb-24 pt-32">
      <Label>The Seal</Label>
      <h1 className="t-voice mt-4 text-display-2 text-bone">{heading}</h1>
      <p className="mt-4 text-sand">{detail}</p>
      <Verifier showSamples className="mt-12" />
    </section>
  );
}
