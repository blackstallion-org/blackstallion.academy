import type { Ref } from "react";
import type { Painting } from "@/lib/museum/artwork-types";
import styles from "./overlay.module.css";

/** Splits a description into its opening line (set as an italic lead) and the remaining text. */
export function splitDescription(description: string | undefined): { lead?: string; body?: string } {
  if (!description) return {};
  const [lead, ...rest] = description.split("\n");
  const body = rest.join("\n").trim();
  return { lead: lead.trim(), body: body || undefined };
}

/**
 * The exhibition label for the plate in focus: number, title, text, chapter and basis, and navigation, set as an
 * ivory label card (a parchment document, like a museum wall label) beside the plate. Visibility
 * is driven by the scroll timeline (GSAP autoAlpha), which also removes the
 * card from the tab order while hidden.
 */
export function PaintingInformation({
  ref,
  painting,
  number,
  total,
  previousLabel,
  continueLabel,
  onPrevious,
  onContinue,
}: {
  ref?: Ref<HTMLElement>;
  painting: Painting;
  number: number;
  total: number;
  previousLabel: string;
  continueLabel: string;
  /** `keyboard` is true when activated from the keyboard or assistive technology rather than a pointer. */
  onPrevious: (keyboard: boolean) => void;
  onContinue: (keyboard: boolean) => void;
}) {
  const { lead, body } = splitDescription(painting.description);
  const facts = painting.facts;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <aside ref={ref} className={styles.panel} aria-labelledby={`panel-${painting.id}`}>
      <p className={styles.panelIndex}>
        <span>
          {pad(number)} / {pad(total)}
        </span>
        <span className={styles.panelRule} aria-hidden="true" />
        <span className={styles.diamond} aria-hidden="true" />
      </p>
      {/* Focusable from script only (not a tab stop): keyboard navigation between paintings lands here. */}
      <h2 id={`panel-${painting.id}`} className={styles.panelTitle} tabIndex={-1}>
        {painting.title}
      </h2>
      {lead && <p className={styles.panelLead}>{lead}</p>}
      {body && <p className={styles.panelBody}>{body}</p>}
      <div className={styles.panelDivider} aria-hidden="true">
        <span className={styles.diamond} />
      </div>
      <dl className={styles.panelFacts}>
        {facts.map(([term, value]) => (
          <div key={term} className={styles.panelFact}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.panelActions}>
        {/* A click with detail 0 came from the keyboard (or assistive technology), not a pointer. */}
        <button type="button" className={styles.panelBack} onClick={(event) => onPrevious(event.detail === 0)}>
          <span aria-hidden="true">←</span> {previousLabel}
        </button>
        <button type="button" className={styles.panelNext} onClick={(event) => onContinue(event.detail === 0)}>
          {continueLabel} <span aria-hidden="true">→</span>
        </button>
      </div>
    </aside>
  );
}
