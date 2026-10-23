const seats = [
  { name: "Senior institutional stewardship", role: "Honorary Patron & Senior Governor", initials: "SG", detail: "Proposed senior stewardship seat. The appointment, approved biography, consent and portrait await confirmation." },
  { name: "Civic leadership", role: "Institutional Governance & Civic Leadership", initials: "CL", detail: "Proposed civic governance seat. The appointment, approved biography, consent and portrait await confirmation." },
  { name: "Retired Major General / Brigadier", role: "Cavalry Drills & Military Safety", initials: "MC", detail: "Proposed military seat: a retired 61st Cavalry or Remount Veterinary Corps officer. The individual and service credentials have not yet been confirmed." },
  { name: "Retired Senior IAS Officer", role: "Education Policy & School Alignment", initials: "EA", detail: "Proposed education seat: a former Education Secretary. The individual, credentials and appointment have not yet been confirmed." },
];

export function SovereignCouncil() {
  return <section aria-labelledby="council-h" className="tone-dark gutter bg-night py-20">
    <p className="label text-brass">Institutional governance</p>
    <h2 id="council-h" className="t-voice mt-4 text-[clamp(2rem,5vw,4.5rem)] leading-tight text-bone">The Sovereign Council</h2>
    <p className="mt-5 max-w-2xl text-sand">Proposed advisory structure. The following seats and nominees are under consideration; no appointment or endorsement is represented as confirmed.</p>
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{seats.map((seat) => <article key={seat.name} className="council-card border border-line bg-night p-4 transition-colors hover:border-gold focus-within:border-gold">
      <div className="grid aspect-square w-full place-items-center rounded bg-umber/40" aria-hidden><span className="t-voice text-5xl text-brass">{seat.initials}</span></div>
      <p className="label mt-5 text-brass">Proposed · unconfirmed</p><h3 className="t-voice mt-3 text-xl text-bone">{seat.name}</h3><p className="mt-2 text-sm text-sand">{seat.role}</p>
      <details className="mt-4 border-t border-line pt-3"><summary className="cursor-pointer py-2 text-sm text-gold">Role & appointment status</summary><p className="mt-3 text-sm leading-relaxed text-sand">{seat.detail}</p></details>
    </article>)}</div>
  </section>;
}
