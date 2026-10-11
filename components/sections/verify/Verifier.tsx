"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState, type FormEvent } from "react";
import { Arrow } from "@/components/film/Marks";
import { SealStamp } from "@/components/motion/SealStamp";
import { credentialByCode, credentials, type Credential } from "@/lib/content/records";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

type Props = { showSamples?: boolean; className?: string };

/**
 * S10 seal verifier. Looks the code up (sample records today, Supabase later),
 * stamps the brass seal, then lets the record rise beneath it.
 */
export function Verifier({ showSamples = false, className }: Props) {
  const id = useId();
  const [code, setCode] = useState("BSAH-2026-HYD-042");
  const [result, setResult] = useState<Credential | null | undefined>(undefined);
  const [stamped, setStamped] = useState(false);

  const verify = (e?: FormEvent, value = code) => {
    e?.preventDefault();
    setStamped(false);
    setResult(undefined);
    window.setTimeout(() => setResult(credentialByCode(value) ?? null), 60);
  };

  return (
    <div className={cn("grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start", className)}>
      <form onSubmit={verify} className="flex flex-col gap-4" aria-describedby={`${id}-hint`}>
        <label htmlFor={`${id}-code`} className="label text-dust">
          Passport code
        </label>
        <div className="flex items-end gap-3 border-b border-brass focus-within:border-gold">
          <input
            id={`${id}-code`}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            spellCheck={false}
            autoComplete="off"
            className="font-mono w-full bg-transparent py-3 text-[clamp(1.1rem,2.4vw,1.8rem)] tracking-[0.06em] text-bone focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold focus-visible:outline-offset-8 placeholder:text-dust"
            placeholder="BSAH-2026-HYD-042"
          />
          <button type="submit" className="label mb-2 shrink-0 bg-gold px-5 py-3 text-night hover:bg-bone">
            Verify
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
          {result === null && (
            <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="t-story text-sand">
              No sealed record matches this code. Check the passport and try again.
            </motion.p>
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
                <p className="label col-span-2 border-t border-brass pt-3 text-dust">Sample record · demo data, not a real cadet</p>
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
