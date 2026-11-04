"use client";

import { useInView } from "motion/react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowUp, RotateCcw } from "lucide-react";
import { answer, fallback, knowledge, type Entry } from "@/lib/content/command";
import { cn } from "@/lib/utils";
import { priceLabel } from "@/lib/content/pricing";
import styles from "./Terminal.module.css";

type Line = { who: "sys" | "you" | "ai"; text: string; entryId?: string };

type Props = {
  /** Questions offered as chips. Defaults to the first three. */
  chips?: string[];
  /** Question typed automatically when the terminal comes into view. */
  opening?: string;
  tall?: boolean;
  className?: string;
  variant?: "classic" | "editorial";
  /** Heading level and id for the desk's single heading ("What would you like to know?"). */
  titleAs?: "h1" | "h2" | "h3";
  titleId?: string;
};

const BOOT: Line[] = [
  { who: "sys", text: "BSAH INFORMATION DESK · DEMO MODE" },
  { who: "sys", text: "Published answers only. Not connected to live records or live data." },
];

/**
 * S13 terminal. Questions type themselves out; answers stream in character by character.
 * Scripted knowledge today (lib/content/command.ts).
 */
export function Terminal({ chips, opening, tall = false, className, variant = "editorial", titleAs = "h2", titleId }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const [lines, setLines] = useState<Line[]>(BOOT);
  const [typing, setTyping] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const asked = useRef(false);
  const request = useRef(0);
  const busyRef = useRef(false);
  const inputId = useId();
  const chipList = chips ?? knowledge.slice(0, 4).map((k) => k.ask);
  useEffect(() => () => { request.current += 1; busyRef.current = false; }, []);

  const ask = async (q: string, entry?: Entry) => {
    if (busyRef.current || !q.trim()) return;
    busyRef.current = true;
    const ticket = ++request.current;
    setBusy(true);
    setLines((l) => [...l, { who: "you", text: q }]);
    const hit = entry ?? answer(q);
    const full = hit?.answer ?? fallback;
    if (reduced) {
      setLines((l) => [...l, { who: "ai", text: full, entryId: hit?.id }]);
      setBusy(false);
      busyRef.current = false;
      return;
    }
    await new Promise((r) => setTimeout(r, 450));
    if (ticket !== request.current) return;
    for (let i = 0; i <= full.length; i += 3) {
      if (ticket !== request.current) return;
      setTyping(full.slice(0, i));
      await new Promise((r) => setTimeout(r, 14));
    }
    if (ticket !== request.current) return;
    setTyping(null);
    setLines((l) => [...l, { who: "ai", text: full, entryId: hit?.id }]);
    setBusy(false);
    busyRef.current = false;
  };

  useEffect(() => {
    if (variant === "classic" && inView && opening && !asked.current) {
      asked.current = true;
      void ask(opening);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, opening, variant]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [lines, typing, reduced]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = input;
    setInput("");
    void ask(q);
  };

  if (variant === "editorial") {
    const Title = titleAs;
    const conversation = lines.filter((line) => line.who !== "sys");
    const started = conversation.length > 0 || typing !== null;
    const pick = (question: string) => {
      const entry = knowledge.find((item) => item.ask === question);
      void ask(entry?.query ?? question, entry);
    };
    return (
      <div ref={ref} className={cn(styles.desk, className)} data-parallax-skip>
        <Title id={titleId} className={styles.deskTitle}>What would you like to know?</Title>
        <p className={styles.deskLead}>Ask the academy about riding, enrolment or your campus.</p>

        <form onSubmit={submit} className={styles.deskComposer}>
          <label htmlFor={inputId} className="sr-only">Ask a question</label>
          <input id={inputId} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask your question…" autoComplete="off" maxLength={1000} />
          <button type="submit" disabled={busy || !input.trim()} aria-label="Send question"><ArrowUp size={21} strokeWidth={1.3} /></button>
        </form>

        <ul className={styles.deskChoices} aria-label="Suggested questions">
          {chipList.map((question) => (
            <li key={question}>
              <button type="button" disabled={busy} onClick={() => pick(question)}>{question}</button>
            </li>
          ))}
        </ul>

        {started && (
          <div className={styles.deskThread}>
            <div className={styles.deskThreadHead}>
              <span>Conversation</span>
              <button type="button" disabled={busy} onClick={() => { request.current += 1; busyRef.current = false; setBusy(false); setTyping(null); setLines(BOOT); setInput(""); }}>
                <RotateCcw size={14} strokeWidth={1.4} aria-hidden /> Start again
              </button>
            </div>
            <div ref={scroller} tabIndex={0} className={styles.deskConversation} role="log" aria-label="Information desk conversation" aria-live="polite" aria-relevant="additions">
              {conversation.map((line, index) => (
                <div key={index} className={cn(styles.deskMessage, line.who === "you" && styles.deskYou)}>
                  <span className={styles.deskSpeaker}>{line.who === "you" ? "You asked" : "The academy"}</span>
                  {line.entryId === "fees" && (
                    <dl className={styles.fees}>
                      {[["Core Cadets", `${priceLabel.core} / month`], ["Sovereign Elite", `${priceLabel.elite} / month`], ["One-time kit", priceLabel.kit]].map(([label, amount]) => (
                        <div key={label}><dt>{label}</dt><dd>{amount}</dd></div>
                      ))}
                    </dl>
                  )}
                  <p>{line.text}</p>
                </div>
              ))}
              {typing !== null && (
                <div className={styles.deskMessage} aria-hidden>
                  <span className={styles.deskSpeaker}>The academy</span>
                  <p>{typing}<span className={styles.cursor} /></p>
                </div>
              )}
              {busy && <span className="sr-only" role="status">Preparing a reply.</span>}
            </div>
          </div>
        )}

        <p className={styles.deskDisclaimer}>Demo: published answers only. Not connected to live data. Questions are not saved.</p>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("tone-dark plate surface-leather flex min-w-0 flex-col shadow-[0_40px_100px_-30px_rgb(36_26_19/0.6)]", className)}>
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="font-mono text-[0.68rem] tracking-[0.14em] text-brass">BSAH · INFORMATION DESK</span>
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-line" />
          <span className="h-2 w-2 rounded-full bg-line" />
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

      <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-line px-4 py-3">
        {chipList.map((c) => (
          <button
            key={c}
            type="button"
            disabled={busy}
            onClick={() => {
              const e = knowledge.find((k) => k.ask === c);
              void ask(e?.query ?? c, e);
            }}
            className="label shrink-0 border border-line px-3 py-2 text-sand transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
          >
            {c}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex items-center gap-3 border-t border-line px-4 py-3 transition-colors focus-within:border-gold/60 focus-within:bg-ember/60">
        <span className="font-mono text-gold" aria-hidden>
          &gt;
        </span>
        <label htmlFor={inputId} className="sr-only">
          Ask a question
        </label>
        <input
          id={inputId}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
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
