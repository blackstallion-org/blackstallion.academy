import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Terminal } from "./Terminal";
import { knowledge } from "@/lib/content/command";
import { command } from "@/lib/content/home";
import styles from "./CommandExperience.module.css";

export function CommandExperience() {
  return (
    <section aria-labelledby="cmd-h" className={styles.page} data-parallax-skip>
      <div className={styles.main}>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>Information desk</p>
          <h1 id="cmd-h">Questions,<br />answered.</h1>
          <p>Find clear, published information about enrolment, programmes, campus partnerships and records.</p>
        </header>
        <div className={styles.workspace}>
          <Terminal variant="editorial" opening="What does it cost a parent?" chips={knowledge.map((entry) => entry.ask)} />
        </div>
      </div>
    </section>
  );
}

/** Homepage presentation follows the supplied split-screen information reference. */
export function CommandTeaser() {
  return <section id="home-command" aria-labelledby="command-h" className={styles.teaser} data-parallax-skip>
    <div className={styles.teaserBackground} aria-hidden><Image src="/images/admissions/academy-gate-backdrop.webp" alt="" fill sizes="100vw" /></div>
    <div className={styles.teaserIntro}>
      <p className={styles.eyebrow}>Reel 13 / Information desk</p>
      <h2 id="command-h">{command.inscription}<br /><span>{command.voice}</span></h2>
      <p>For principals and trustees: returns, insurance, safety and curriculum, answered on the spot.</p>
      <Link href="/command">Find an answer <ArrowRight size={20} strokeWidth={1} /></Link>
      <div className={styles.folio}><span>13</span><p>Discipline<br />Character<br />Leadership</p></div>
    </div>
    <Terminal variant="editorial" opening={command.question} chips={command.chips} className={styles.teaserTerminal} />
  </section>;
}
