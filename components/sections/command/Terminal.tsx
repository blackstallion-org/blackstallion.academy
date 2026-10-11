"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { playEffect } from "@/lib/audio/engine";
import { answer, fallback, knowledge } from "@/lib/content/command";
import { cn } from "@/lib/utils";

type Line = { who: "sys" | "you" | "ai"; text: string };

type Props = {
  /** Questions offered as chips. Defaults to the first three. */
  chips?: string[];
  /** Question typed automatically when the terminal comes into view. */
  opening?: string;
  tall?: boolean;
  className?: string;
};

const BOOT: Line[] = [
  { who: "sys", text: "SOVEREIGN COMMAND TERMINAL · DEMO MODE" },
  { who: "sys", text: "Scripted answers from the academy's brief. Not connected to a live registry or live data." },
];

/**
 * S13 terminal. Questions type themselves out; answers stream in character by character.
 * Scripted knowledge today (lib/content/command.ts).
 */
export function Terminal({ chips, opening, tall = false, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const [lines, setLines] = useState<Line[]>(BOOT);
  const [typing, setTyping] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const asked = useRef(false);
  const chipList = chips ?? knowledge.slice(0, 4).map((k) => k.ask);

  const ask = async (q: string) => {
    if (busy || !q.trim()) return;
    setBusy(true);
    setLines((l) => [...l, { who: "you", text: q }]);
    const hit = answer(q);
    const full = hit?.answer ?? fallback;
    if (reduced) {
      setLines((l) => [...l, { who: "ai", text: full }]);
      setBusy(false);
      return;
    }
    await new Promise((r) => setTimeout(r, 450));
    for (let i = 0; i <= full.length; i += 3) {
      setTyping(full.slice(0, i));
      await new Promise((r) => setTimeout(r, 14));
    }
    setTyping(null);
    setLines((l) => [...l, { who: "ai", text: full }]);
    setBusy(false);
  };

  useEffect(() => {
    if (inView && opening && !asked.current) {
      asked.current = true;
      void ask(opening);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, opening]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [lines, typing, reduced]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = input;
    setInput("");
    void ask(q);
  };

  return (
    <div ref={ref} className={cn("plate flex min-w-0 flex-col shadow-[0_40px_120px_rgb(0_0_0/0.6)]", className)}>
      <div className="flex items-center justify-between border-b border-brass px-4 py-3">
        <span className="font-mono text-[0.68rem] tracking-[0.14em] text-dust">SOVEREIGN COMMAND · EXECUTIVE TERMINAL</span>
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-brass" />
          <span className="h-2 w-2 rounded-full bg-brass" />
          <span className="h-2 w-2 rounded-full bg-blood/70" />
        </span>
      </div>

      <div
        ref={scroller}
        className={cn("font-mono flex-1 overflow-y-auto px-4 py-5 text-[0.82rem] leading-relaxed md:px-6", tall ? "h-[52svh]" : "h-72")}
        aria-live="polite"
        role="log"
      >
        {lines.map((l, i) => (
          <p key={i} className={cn("mb-3", l.who === "sys" && "text-dust", l.who === "you" && "text-bone", l.who === "ai" && "text-gold")}>
            <span className="mr-2 select-none text-brass/70">{l.who === "you" ? ">" : l.who === "ai" ? "◆" : "·"}</span>
            {l.text}
          </p>
        ))}
        {typing !== null && (
          <p className="mb-3 text-gold">
            <span className="mr-2 select-none text-brass/70">◆</span>
            {typing}
            <span className="animate-blink ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-gold" aria-hidden />
          </p>
        )}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-brass px-4 py-3">
        {chipList.map((c) => (
          <button
            key={c}
            type="button"
            disabled={busy}
            onClick={() => void ask(c)}
            className="label shrink-0 border border-brass px-3 py-2 text-sand transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
          >
            {c}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex items-center gap-3 border-t border-brass px-4 py-3 transition-colors focus-within:border-gold/60 focus-within:bg-ember/60">
        <span className="font-mono text-gold" aria-hidden>
          &gt;
        </span>
        <label htmlFor="cmd-input" className="sr-only">
          Ask the command terminal
        </label>
        <input
          id="cmd-input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            playEffect("key", 0.18, 45);
          }}
          placeholder="Type a question…"
          className="font-mono flex-1 bg-transparent text-sm text-bone focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold focus-visible:outline-offset-8 placeholder:text-dust"
          autoComplete="off"
        />
        <button type="submit" disabled={busy} className="label text-gold hover:text-bone disabled:opacity-40">
          Send
        </button>
      </form>
    </div>
  );
}
