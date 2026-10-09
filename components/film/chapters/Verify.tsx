"use client";

import { AnimatePresence, motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { useState } from "react";
import { Chapter } from "../Chapter";
import { FilmImage } from "../FilmImage";
import { MaskLine, ProgressFade } from "../MaskLine";
import { SealStamp } from "@/components/motion/SealStamp";
import { sampleCredential } from "@/lib/content/film";
import { r } from "../range";

const film = [0.7, 0, 0.2, 1] as const;

function formatCode(raw: string) {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 14);
  const parts = [s.slice(0, 4), s.slice(4, 8), s.slice(8, 11), s.slice(11, 14)].filter(Boolean);
  return parts.join("-");
}

/**
 * Chapter VI. The camera glides into the stallion's eye and comes out on the passport.
 * Signature moment: the brass seal lands on a verified record.
 */
export function Verify() {
  return (
    <Chapter id="verify" label="Chapter VI: Verify a Sovereign Passport" length={2.6}>
      {(p) => <VerifyFrame p={p} />}
    </Chapter>
  );
}

function VerifyFrame({ p }: { p: MotionValue<number> }) {
  const reduced = useReducedMotion();
  const eyeScale = useTransform(p, r(0, 0.3), [1.05, 7]);
  const eyeOpacity = useTransform(p, r(0.18, 0.3), [1, 0]);
  const passScale = useTransform(p, r(0.2, 1), [1.25, 1]);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<"idle" | "ok" | "none">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(code === sampleCredential.code ? "ok" : "none");
  };

  return (
    <div className="relative h-full w-full bg-night">
      <FilmImage name="bgPassport" scale={reduced ? 1 : passScale} position="60% 50%" />
      <div className="absolute inset-0 bg-gradient-to-r from-night/95 via-night/70 to-night/25" />
      {!reduced && <FilmImage name="eye" scale={eyeScale} opacity={eyeOpacity} position="68% 50%" />}

      <div className="relative flex h-full flex-col justify-center gap-10 px-5 pt-16 sm:px-10 lg:pl-[8vw] lg:pr-28">
        <div>
          <ProgressFade progress={p} range={[0.28, 0.34]}>
            <p className="label mb-6 text-gold">
              Chapter VI <span className="mx-3 text-sand/50">/</span> The Sovereign Ledger
            </p>
          </ProgressFade>
          <h2 className="font-display text-display-2 tracking-display opsz-display">
            <MaskLine progress={p} range={[0.3, 0.4]}>Every hour in the saddle,</MaskLine>
            <MaskLine progress={p} range={[0.33, 0.43]} className="italic text-sand">
              sealed in brass.
            </MaskLine>
          </h2>
        </div>

        <ProgressFade progress={p} range={[0.38, 0.48]} className="grid max-w-[1100px] items-center gap-10 lg:grid-cols-[minmax(0,460px)_1fr]">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label htmlFor="passport-code" className="label text-sand/80">
              Passport code
            </label>
            <div className="flex items-stretch gap-3 border-b border-gold/60 pb-2 focus-within:border-gold">
              <input
                id="passport-code"
                value={code}
                onChange={(e) => {
                  setCode(formatCode(e.target.value));
                  setResult("idle");
                }}
                placeholder="BSAH-2026-HYD-042"
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent font-mono text-xl tracking-wider text-bone outline-none placeholder:text-sand/30 sm:text-2xl"
              />
              <button type="submit" className="label shrink-0 px-2 text-gold transition-colors hover:text-bone">
                Verify
              </button>
            </div>
            <p className="text-sm text-dust">
              Admissions officers can confirm a cadet&apos;s rank, riding hours and EFI registration. Try{" "}
              <button type="button" onClick={() => setCode(sampleCredential.code)} className="font-mono text-brass underline decoration-brass/40 underline-offset-4">
                {sampleCredential.code}
              </button>
              .
            </p>
          </form>

          <div className="min-h-[260px]" aria-live="polite">
            <AnimatePresence mode="wait">
              {result === "ok" && (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                  animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.1, ease: film }}
                  className="relative border-y border-gold/40 py-8 pr-36 sm:pr-44"
                >
                  <p className="label text-[0.66rem] text-brass">Verified record · demo</p>
                  <p className="mt-3 font-display text-display-3 text-bone">{sampleCredential.name}</p>
                  <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3">
                    {[
                      ["Rank", sampleCredential.rank],
                      ["Hub", sampleCredential.hub],
                      ["Riding hours", String(sampleCredential.hours)],
                      ["EFI", sampleCredential.efi],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="label text-[0.62rem] text-sand/60">{k}</dt>
                        <dd className="font-mono text-sm text-bone">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <SealStamp trigger="manual" play label="VERIFIED" className="h-28 w-28 sm:h-36 sm:w-36" />
                  </div>
                </motion.div>
              )}
              {result === "none" && (
                <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="italic text-sand">
                  No record for that code. Check the code inside the cadet&apos;s passport cover.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </ProgressFade>
      </div>
    </div>
  );
}
