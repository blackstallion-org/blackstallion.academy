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
        <p className={styles.eyebrow}>Information desk</p>
        <div className={styles.workspace}>
          <Terminal variant="editorial" titleAs="h1" titleId="cmd-h" chips={knowledge.map((entry) => entry.ask)} />
        </div>
      </div>
    </section>
  );
}

/** Homepage presentation follows the supplied split-screen information reference. */
export function CommandTeaser() {
  return <section id="home-command" aria-labelledby="command-h" className={styles.teaser} data-parallax-skip>
    <div className={styles.teaserBackground} aria-hidden><Image src="/media/gallop.webp" alt="" fill sizes="100vw" style={{ objectPosition: "30% 22%" }} /></div>
    <div className={styles.teaserIntro}>
      <p className={styles.eyebrow}>Reel 14 / Information desk</p>
      <h2 id="command-h">{command.inscription}<br /><span>{command.voice}</span></h2>
      <p>For principals and trustees: returns, insurance, safety and curriculum, answered on the spot.</p>
      <Link href="/command">Find an answer <ArrowRight size={20} strokeWidth={1} /></Link>
      <div className={styles.folio}><span>13</span><p>Discipline<br />Character<br />Leadership</p></div>
    </div>
    <Terminal variant="editorial" titleAs="h3" chips={command.chips} className={styles.teaserTerminal} />
  </section>;
}
