/**
 * Site-wide atmosphere: a faint leather-brown edge, like light falling off a printed page.
 * No cursor lamp, no dust, no coloured light. Grain lives on <body> (.grain).
 */
export function Atmosphere() {
  return (
    <div aria-hidden className="no-print pointer-events-none fixed inset-0 z-[55]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 125% 95% at 50% 45%, transparent 62%, rgb(73 49 38 / 0.05) 86%, rgb(73 49 38 / 0.12) 100%)",
        }}
      />
    </div>
  );
}
