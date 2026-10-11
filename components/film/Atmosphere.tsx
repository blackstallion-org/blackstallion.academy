/**
 * Site-wide atmosphere: a plain black vignette only. No cursor lamp, no dust, no coloured light.
 * Grain lives on <body> (.grain).
 */
export function Atmosphere() {
  return (
    <div aria-hidden className="no-print pointer-events-none fixed inset-0 z-[55]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 90% at 50% 45%, transparent 55%, rgb(15 14 13 / 0.6) 85%, rgb(15 14 13 / 0.9) 100%)",
        }}
      />
    </div>
  );
}
