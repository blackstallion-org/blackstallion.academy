const seats = [
  { name: "Senior institutional stewardship", role: "Honorary Patron & Senior Governor", initials: "SG", detail: "Proposed senior stewardship seat. The appointment, approved biography, consent and portrait await confirmation." },
  { name: "Civic leadership", role: "Institutional Governance & Civic Leadership", initials: "CL", detail: "Proposed civic governance seat. The appointment, approved biography, consent and portrait await confirmation." },
  { name: "Retired Major General / Brigadier", role: "Cavalry Drills & Military Safety", initials: "MC", detail: "Proposed military seat: a retired 61st Cavalry or Remount Veterinary Corps officer. The individual and service credentials have not yet been confirmed." },
  { name: "Retired Senior IAS Officer", role: "Education Policy & School Alignment", initials: "EA", detail: "Proposed education seat: a former Education Secretary. The individual, credentials and appointment have not yet been confirmed." },
];

/**
 * The Sovereign Council: one large portrait per proposed seat, role and responsibility beneath it.
 * Until each seat is confirmed it shows a neutral default profile silhouette, not a stock face (owner, 10 Nov 2026), so no
 * likeness is mistaken for a member. No name, appointment or endorsement is represented as confirmed.
 */
export function SovereignCouncil() {
  return (
    <section aria-labelledby="council-h" className="gutter relative bg-night py-[clamp(6rem,14vh,10rem)]" data-parallax-skip>
      <p className="label text-brass">Institutional governance</p>
      <h2 id="council-h" className="t-voice mt-4 text-[clamp(2.5rem,5.5vw,5rem)] leading-[1.02] text-bone">The Sovereign Council</h2>
      <p className="t-story mt-6 max-w-2xl text-sand">
        Proposed advisory structure. The following seats and nominees are under consideration; no appointment or endorsement is represented as confirmed.
      </p>
      <ul className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
        {seats.map((seat) => (
          <li key={seat.name}>
            <figure>
              <div className="relative aspect-[4/5] overflow-hidden bg-umber">
                <svg viewBox="0 0 160 200" className="h-full w-full" role="img" aria-label={`Default profile picture for the proposed ${seat.name.toLowerCase()} seat; member not yet confirmed`}>
                  <rect width="160" height="200" fill="var(--color-umber)" />
                  <circle cx="80" cy="78" r="34" fill="var(--color-dust)" fillOpacity="0.55" />
                  <path d="M18 200c4-44 31-70 62-70s58 26 62 70z" fill="var(--color-dust)" fillOpacity="0.55" />
                </svg>
              </div>
              <figcaption className="t-ui mt-3 text-xs text-dust">Portrait to follow · seat unconfirmed</figcaption>
            </figure>
            <h3 className="t-voice mt-5 text-[1.6rem] leading-snug text-bone">{seat.name}</h3>
            <p className="label mt-3 text-brass">{seat.role}</p>
            <p className="t-story mt-3 text-sm leading-relaxed text-sand">{seat.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
