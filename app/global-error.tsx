"use client";

/**
 * Last-resort boundary for errors in the root layout itself. It renders its own document (global styles and fonts are
 * not available here), so it uses inline styles in the approved ivory / chestnut palette.
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ margin: 0, minHeight: "100svh", display: "grid", placeItems: "center", background: "#F3EDE2", color: "#30251E", fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <title>Something went wrong · Black Stallion Academy</title>
        <main role="alert" style={{ maxWidth: "36rem", padding: "2rem" }}>
          <p style={{ letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "0.75rem", color: "#7B5636" }}>Projector fault</p>
          <h1 style={{ fontSize: "2.25rem", margin: "0.75rem 0", color: "#78472F" }}>The film stopped.</h1>
          <p style={{ lineHeight: 1.6, color: "#4D3C30" }}>The site hit an unexpected error. Nothing you entered has been sent.</p>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
            <button type="button" onClick={() => retry()} style={{ background: "#78472F", color: "#F3EDE2", border: 0, padding: "0.9rem 1.4rem", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Try again
            </button>
            {/* A full reload is intended here: the root layout itself failed, so client navigation cannot be trusted. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ border: "1px solid #7B5636", color: "#30251E", padding: "0.9rem 1.4rem", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
