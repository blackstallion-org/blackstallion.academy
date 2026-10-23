"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-level error boundary. Keeps the site chrome (nav, footer) and offers a retry; never shows error details,
 * which in production are a generic message plus a digest that matches the server log.
 */
export default function RouteError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error ? String((error as Error & { digest?: string }).digest ?? "") : "";
  useEffect(() => {
    console.error("[bsah] route error", digest || error);
  }, [error, digest]);

  return (
    <section className="gutter flex min-h-[80svh] flex-col justify-center pt-28" role="alert" aria-labelledby="route-error-h">
      <p className="label text-brass">Projector fault</p>
      <h1 id="route-error-h" className="mt-4 text-display-1">
        <span className="t-inscribe block text-[0.5em]">This reel</span>
        <span className="t-voice block text-gold">slipped the gate.</span>
      </h1>
      <p className="t-story mt-6 max-w-xl text-sand">
        Something went wrong while showing this page. Nothing you entered has been sent. Try again, or continue from the
        opening reel.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <button type="button" onClick={() => retry()} className="label bg-gold px-6 py-4 text-night hover:bg-bone">
          Try again
        </button>
        <Link href="/" className="label border border-line px-6 py-4 text-bone hover:border-gold hover:text-gold">
          Back to the opening reel
        </Link>
      </div>
      {digest && <p className="font-mono mt-8 text-xs text-dust">Reference {digest}</p>}
    </section>
  );
}
