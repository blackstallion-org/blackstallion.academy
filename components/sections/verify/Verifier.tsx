"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState, useTransition, type FormEvent } from "react";
import { lookupCredential } from "@/app/verify/actions";
import { Arrow } from "@/components/film/Marks";
import { SealStamp } from "@/components/motion/SealStamp";
import { credentials } from "@/lib/content/records";
import type { LookupResult } from "@/lib/verify/lookup";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

type Props = { showSamples?: boolean; className?: string };

/**
 * S10 seal verifier. The lookup runs on the server (app/verify/actions.ts): SAMPLE codes return the labelled demo
 * record; any other code is checked against the live registry when it is connected, with valid / revoked / expired /
 * not-found answers and minimal disclosure. The brass seal stamps only for a valid record or a labelled sample.
 */
export function Verifier({ showSamples = false, className }: Props) {
  const id = useId();
  const [code, setCode] = useState("BSAH-2026-HYD-042");
  const [lookup, setLookup] = useState<LookupResult | undefined>(undefined);
  const [stamped, setStamped] = useState(false);
  const [pending, startLookup] = useTransition();
  const result = lookup?.kind === "sample" ? lookup.record : lookup ? null : undefined;

  const verify = (e?: FormEvent, value = code) => {
    e?.preventDefault();
    setStamped(false);
    setLookup(undefined);
    startLookup(async () => {
      try {
        setLookup(await lookupCredential(value));
      } catch {
        setLookup({ kind: "unavailable", reason: "error" });
      }
    });
  };

  return (
    <div className={cn("grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start", className)}>
      <form onSubmit={verify} className="flex flex-col gap-4" aria-describedby={`${id}-hint`}>
        <label htmlFor={`${id}-code`} className="label text-brass">
          Passport code
        </label>
        <div className="flex items-end gap-3 border-b border-line focus-within:border-gold">
          <input
            id={`${id}-code`}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            spellCheck={false}
            autoComplete="off"
            className="font-mono w-full bg-transparent py-3 text-[clamp(1.1rem,2.4vw,1.8rem)] tracking-[0.06em] text-bone focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold focus-visible:outline-offset-8 placeholder:text-dust"
            placeholder="BSAH-2026-HYD-042"
          />
          <button type="submit" disabled={pending} aria-disabled={pending} className="label mb-2 shrink-0 bg-gold px-5 py-3 text-night hover:bg-bone disabled:opacity-60">
            {pending ? "Checking…" : "Verify"}
          </button>
        </div>
        <p id={`${id}-hint`} className="t-ui text-sm text-dust">
          The code is printed inside the cadet&rsquo;s Sovereign Passport.
        </p>
        {showSamples && (
          <p className="t-ui flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-dust">
            Try:
            {credentials.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setCode(c.code);
                  verify(undefined, c.code);
                }}
                className="font-mono text-xs text-gold underline decoration-brass/40 underline-offset-4 hover:text-bone"
              >
                {c.code}
              </button>
            ))}
          </p>
        )}
      </form>

      <div aria-live="polite" className="relative min-h-[18rem]">
        <AnimatePresence mode="wait">
          {result === null && lookup && lookup.kind !== "sample" && (
            <motion.div key={`r-${lookup.kind}-${"status" in lookup ? lookup.status : ""}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
              {lookup.kind === "registry" && lookup.status === "valid" ? (
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <SealStamp label="VERIFIED" trigger="manual" play className="h-28 w-28 shrink-0" />
                  <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4">
                    <div><dt className="label text-dust">Status</dt><dd className="t-voice text-xl text-gold">Valid</dd></div>
                    <div><dt className="label text-dust">Rank at issue</dt><dd className="t-ui text-sand capitalize">{lookup.rank.replace(/_/g, " ")}</dd></div>
                    <div><dt className="label text-dust">Credential</dt><dd className="t-ui text-sand">{lookup.credentialType}</dd></div>
                    <div><dt className="label text-dust">Issued</dt><dd className="font-mono text-sm text-sand">{lookup.issuedAt.slice(0, 10)}</dd></div>
                    <p className="t-ui col-span-2 border-t border-line pt-3 text-sm text-dust">Checked against the BSAH registry. Names and records are shared only with the cadet&rsquo;s permission.</p>
                  </dl>
                </div>
              ) : (
                <p className="t-story text-sand" role="status">
                  {lookup.kind === "registry" && lookup.status === "revoked" && "This credential has been revoked. It is no longer valid."}
                  {lookup.kind === "registry" && lookup.status === "expired" && "This credential has expired. Ask the cadet for a current passport code."}
                  {lookup.kind === "registry" && lookup.status === "unknown" && "No sealed record matches this code. Check the passport and try again."}
                  {lookup.kind === "unavailable" && lookup.reason === "not_configured" && "The live registry is not connected yet, so only the sample codes below can be checked. No real cadet records are published on this site."}
                  {lookup.kind === "unavailable" && lookup.reason === "error" && "The registry could not be reached. Nothing was verified; please try again later."}
                  {lookup.kind === "invalid" && "Enter the passport code exactly as printed (letters, numbers and dashes)."}
                  {lookup.kind === "rate_limited" && "Too many lookups from this connection. Please wait a few minutes."}
                </p>
              )}
            </motion.div>
          )}
          {result && (
            <motion.div key={result.code} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <SealStamp label="VERIFIED" trigger="manual" play onStamped={() => setStamped(true)} className="h-28 w-28 shrink-0" />
              <motion.dl
                className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4"
                initial={{ opacity: 0, y: 16 }}
                animate={stamped ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                transition={{ duration: 0.7, ease: ease.citadel }}
              >
                <div className="col-span-2">
                  <dt className="label text-dust">Cadet</dt>
                  <dd className="t-voice text-3xl text-bone">{result.name}</dd>
                </div>
                <div>
                  <dt className="label text-dust">Rank</dt>
                  <dd className="t-voice text-xl text-gold">{result.rankName}</dd>
                </div>
                <div>
                  <dt className="label text-dust">Riding hours</dt>
                  <dd className="font-mono text-xl text-gold">{result.hours}</dd>
                </div>
                <div>
                  <dt className="label text-dust">Hub</dt>
                  <dd className="t-ui text-sand">{result.hubName}</dd>
                </div>
                <div>
                  <dt className="label text-dust">EFI</dt>
                  <dd className="font-mono text-sm text-sand">{result.efi ?? "Pending"}</dd>
                </div>
                <p className="label col-span-2 border-t border-line pt-3 text-dust">Sample record · demo data, not a real cadet</p>
                <div className="col-span-2 pt-2">
                  <Link href={`/verify/${result.code}`} className="label inline-flex items-center gap-3 text-gold hover:text-bone">
                    Open the full record <Arrow />
                  </Link>
                </div>
              </motion.dl>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
