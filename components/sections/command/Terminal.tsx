"use client";

import { useInView } from "motion/react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowUp, BookOpen, RotateCcw, UserRound } from "lucide-react";
import { Crest } from "@/components/brand/Crest";
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
};

const BOOT: Line[] = [
  { who: "sys", text: "BSAH INFORMATION DESK · DEMO MODE" },
  { who: "sys", text: "Published answers only. Not connected to live records or live data." },
];

/**
 * S13 terminal. Questions type themselves out; answers stream in character by character.
 * Scripted knowledge today (lib/content/command.ts).
 */
export function Terminal({ chips, opening, tall = false, className, variant = "classic" }: Props) {
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

  if (variant === "editorial") return <div ref={ref} className={cn(styles.terminal, tall && styles.tall, className)} data-parallax-skip>
    <header className={styles.header}>
      <Crest simple className={styles.brandMark} />
      <div><strong>BSAH information</strong><span>Published answers / demo</span></div>
      <span className={styles.demo}>Demo mode</span>
      <button type="button" disabled={busy} onClick={() => { setLines(BOOT); setInput(""); }} aria-label="Start a new conversation" title="New conversation"><RotateCcw size={16} strokeWidth={1.3} /></button>
    </header>
    <div className={styles.welcome}>
      <p>Ask about fees, programmes, safety, campus partnerships or records.</p>
      <div className={styles.suggestions}>{chipList.slice(0, 3).map((question, index) => <button key={question} type="button" disabled={busy}
        onClick={() => { const entry = knowledge.find((item) => item.ask === question); void ask(entry?.query ?? question, entry); }}>
        <span className={styles.suggestionNumber}>0{index + 1}</span>{question}
      </button>)}</div>
      {chipList.length > 3 && <details className={styles.more}><summary>More questions</summary><div>{chipList.slice(3).map((question) => <button key={question} type="button" disabled={busy} onClick={() => {
        const entry = knowledge.find((item) => item.ask === question); void ask(entry?.query ?? question, entry);
      }}>{question}</button>)}</div></details>}
    </div>
    <div ref={scroller} tabIndex={0} className={styles.conversation} role="log" aria-label="Information desk conversation" aria-live="polite" aria-relevant="additions">
      {lines.filter((line) => line.who !== "sys").map((line, index) => <div key={index} className={cn(styles.message, line.who === "you" && styles.you)}>
        <span className={styles.avatar} aria-hidden>{line.who === "you" ? <UserRound size={21} strokeWidth={1.2} /> : <Crest simple className={styles.avatarMark} />}</span>
        <div className={styles.bubble}>{line.who === "ai" && <span className={styles.speaker}>Information desk</span>}
          {line.entryId === "fees" && <dl className={styles.fees}>{[["Core Cadets", `${priceLabel.core} / month`], ["Sovereign Elite", `${priceLabel.elite} / month`], ["One-time kit", priceLabel.kit]].map(([label, amount]) => <div key={label}><dt>{label}</dt><dd>{amount}</dd></div>)}</dl>}
          <p>{line.text}</p>
        </div>
      </div>)}
      {typing !== null && <div className={styles.message} aria-hidden><span className={styles.avatar}><Crest simple className={styles.avatarMark} /></span><div className={styles.bubble}><span className={styles.speaker}>Information desk</span><p>{typing}<span className={styles.cursor} /></p></div></div>}
      {busy && <span className="sr-only" role="status">Preparing a reply.</span>}
    </div>
    <form onSubmit={submit} className={styles.composer}>
      <BookOpen size={19} strokeWidth={1.1} aria-hidden />
      <label htmlFor={inputId} className="sr-only">Ask a question</label>
      <input id={inputId} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type a question…" autoComplete="off" maxLength={1000} />
      <button type="submit" disabled={busy || !input.trim()} aria-label="Send question"><ArrowUp size={21} strokeWidth={1.3} /></button>
    </form>
    <p className={styles.disclaimer}>Demo: published answers only. Not connected to live data. Questions are not saved.</p>
  </div>;

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
