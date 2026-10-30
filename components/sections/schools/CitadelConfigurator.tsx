"use client";

import React, { useActionState, useEffect, useState, useRef } from "react";
import { submitLead } from "@/app/actions";
import { clearLeadKey, LeadFormExtras } from "@/components/sections/shared/LeadFormExtras";
import { useDialogFocus } from "@/lib/motion/use-dialog-focus";
import { HUB_DATA } from "./citadel/citadelData";

/**
 * "Run the numbers": the tuition-return simulator and the draft-MOU request for school boards.
 * The 3D campus hero, the tier cards and the "seven implementation layers" notes that used to sit above it are gone (28 Oct 2026):
 * the campus is shown, once, by `CampusExperience` further down the page.
 */
export function CitadelConfigurator() {
  const [currentHub, setCurrentHub] = useState<"standard" | "signature" | "royal">("standard");
  const [cadets, setCadets] = useState(140);
  const [tuition, setTuition] = useState(36000);
  const [share, setShare] = useState(27.5);
  const [mouModalOpen, setMouModalOpen] = useState(false);
  const [mouState, mouAction, mouPending] = useActionState(submitLead, null);
  useEffect(() => { if (mouState?.ok) clearLeadKey("mou"); }, [mouState]);
  const scopeRef = useRef<HTMLDivElement>(null);
  useDialogFocus(mouModalOpen, scopeRef);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMouModalOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);

  const handleSelectHub = (hubKey: "standard" | "signature" | "royal") => {
    setCurrentHub(hubKey);
    const data = HUB_DATA[hubKey];
    setCadets(data.defaultCadets);
    setShare(data.defaultShare);
  };

  const hubInfo = HUB_DATA[currentHub];

  // Financial calculations
  const grossLakhs = (cadets * tuition) / 100000;
  const schoolAnnualLakhs = grossLakhs * (share / 100);
  const schoolFiveYrLakhs = schoolAnnualLakhs * 5;

  return (
    <div ref={scopeRef} className="relative w-full bg-night text-bone font-sans overflow-x-hidden ">
      {/* ===================================================================== */}
      {/* SECTION 4: INTERACTIVE SCHOOL BOARD ROI & TUITION RETURN CALCULATOR   */}
      {/* ===================================================================== */}
      <section id="simulator" className="scroll-mt-20 py-16 sm:py-24 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto">
        <div id="roi-section" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Sliders */}
          <div className="lg:col-span-7 bg-ember border border-line p-6 sm:p-8">
            <div className="text-[11px] font-semibold tracking-[0.2em] text-gold uppercase mb-2">
              FINANCIAL SIMULATOR · SCHOOL BOARD TREASURY
            </div>
            <h2 className="mb-4 text-bone"><span className="t-inscribe block text-3xl">Run the numbers</span><span className="t-voice block text-3xl text-gold">tuition and return.</span></h2>
            <p className="text-xs text-dust mb-6">
              Simulate your institution’s annual tuition share and 5-year endowment accumulation under the zero-CapEx BSAH Citadel model.
            </p>

            {/* Hub Selector Pills */}
            <div className="mb-6">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-bone mb-2">
                Selected Campus Hub Configuration
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['standard', 'signature', 'royal'] as const).map((hKey) => {
                  const isMatch = currentHub === hKey;
                  const label =
                    hKey === 'standard' ? 'Standard (4 Stables)' : hKey === 'signature' ? 'Signature (8 Stables)' : 'Royal (12 Stables)';
                  return (
                    <button
                      key={hKey}
                      type="button"
                      onClick={() => handleSelectHub(hKey)}
                      className={`py-2.5 px-3 text-xs font-semibold rounded border transition cursor-pointer ${
                        isMatch
                          ? 'border-leather bg-leather text-ivory'
                          : 'border-line bg-night text-bone hover:border-gold'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slider 1: Cadets */}
            <div className="mb-6">
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-bone">
                  Enrolled Equestrian Cadets
                </label>
                <span className="font-display text-xl text-gold">{cadets} Cadets</span>
              </div>
              <input
                type="range"
                aria-label="Expected cadet cohort"
                min={80}
                max={450}
                step={10}
                value={cadets}
                onChange={(e) => setCadets(Number(e.target.value))}
                className="w-full accent-gold"
              />
              <div className="flex justify-between text-[10px] text-dust mt-1">
                <span>80 Cadets (Standard Min)</span>
                <span>250 Cadets (Signature)</span>
                <span>450 Cadets (Royal Estate)</span>
              </div>
            </div>

            {/* Slider 2: Tuition */}
            <div className="mb-6">
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-bone">
                  Annual Programme Fee per Cadet (₹)
                </label>
                <span className="font-display text-xl text-gold">
                  ₹{tuition.toLocaleString('en-IN')} / yr
                </span>
              </div>
              <input
                type="range"
                aria-label="Annual programme fee per cadet"
                min={24000}
                max={72000}
                step={2000}
                value={tuition}
                onChange={(e) => setTuition(Number(e.target.value))}
                className="w-full accent-gold"
              />
              <div className="flex justify-between text-[10px] text-dust mt-1">
                <span>₹24,000 (₹2,000/mo)</span>
                <span>₹48,000 (₹4,000/mo)</span>
                <span>₹72,000 (Championship)</span>
              </div>
            </div>

            {/* Slider 3: Share % */}
            <div className="mb-2">
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-bone">
                  School Board Tuition Return Tier
                </label>
                <span className="font-display text-xl text-gold">{share.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                aria-label="School board tuition return tier"
                min={25}
                max={30}
                step={0.5}
                value={share}
                onChange={(e) => setShare(Number(e.target.value))}
                className="w-full accent-gold"
              />
              <div className="flex justify-between text-[10px] text-dust mt-1">
                <span>25.0% (Standard MOU)</span>
                <span>27.5% (Signature MOU)</span>
                <span>30.0% (Royal Regional Host)</span>
              </div>
            </div>
          </div>

          {/* Output Card */}
          <div className="lg:col-span-5 tone-dark bg-night text-bone p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-line pb-4 mb-6">
                <div>
                  <div className="text-[10px] tracking-[0.2em] text-brass uppercase">PROJECTED SCHOOL RETURN</div>
                  <div className="t-voice text-xl text-bone">{hubInfo.name} · {hubInfo.landLabel.replace('SITE - ', '')}</div>
                </div>
                <span className="px-2.5 py-1 border border-line text-brass text-[10px] font-semibold tracking-widest uppercase">
                  ZERO CAPEX
                </span>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-dust">
                    Annual Net Return to School Board
                  </div>
                  <div className="font-display text-4xl sm:text-5xl text-gold mt-1">
                    ₹{schoolAnnualLakhs.toFixed(2)} L
                  </div>
                  <div className="text-[11px] text-dust mt-1">
                    Direct recurring revenue with zero operational overhead
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-line">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-dust">5-Year School Endowment</div>
                    <div className="font-display text-2xl text-bone mt-0.5">
                      ₹{schoolFiveYrLakhs.toFixed(2)} L
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-dust">BSAH Funded CapEx</div>
                    <div className="font-display text-2xl text-brass mt-0.5">{hubInfo.price}</div>
                  </div>
                </div>

                <div className="border border-line p-4 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-dust">Gross Annual Programme Tuition:</span>
                    <span className="font-semibold text-bone">₹{grossLakhs.toFixed(2)} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dust">School Board Capital Outlay:</span>
                    <span className="font-semibold text-gold">₹0 (100% BSAH Funded)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dust">Grooms, Horses, Vet & Coaches:</span>
                    <span className="font-semibold text-bone">Included by BSAH</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-line flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setMouModalOpen(true)}
                className="flex-1 py-3 px-4 bg-ivory hover:bg-parch text-charcoal text-[11px] font-semibold tracking-[0.18em] uppercase transition text-center cursor-pointer"
              >
                Generate Draft MOU with These Figures →
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 pt-6 border-t border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-dust">
          <p>
            <strong className="text-bone uppercase tracking-wider">Architectural Notice:</strong> The generated visual is a design concept, not a verified architectural plan. Hub dimensions, prices, capacities and commercial terms should be checked against approved BSAH specifications before publication.
          </p>
          <a
            href="#citadel-hero"
            className="text-gold font-semibold uppercase tracking-widest hover:underline shrink-0"
          >
            Back to 3D Campus ↑
          </a>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* MODAL 1: REQUEST A DRAFT MOU FORM                                     */}
      {/* ===================================================================== */}
      {mouModalOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="citadel-mou-title" className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-sm p-4">
          <div className="bg-ember border border-brass max-w-lg w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setMouModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-umber hover:bg-leather hover:text-ivory flex items-center justify-center text-sm font-bold transition cursor-pointer"
              aria-label="Close MOU Modal"
            >
              ✕
            </button>
            <div className="text-[10px] font-semibold tracking-[0.16em] text-gold uppercase mb-1">
              Campus partnership
            </div>
            <h3 id="citadel-mou-title" className="font-serif text-2xl sm:text-3xl text-bone mb-2">Request a draft MOU</h3>
            <p className="text-xs text-dust mb-5">
              Share your school details and we will prepare a partnership brief for your review.
            </p>

            <form
              key={mouState ? `${mouState.status}:${JSON.stringify(mouState.values)}` : "fresh"}
              action={mouAction}
              aria-busy={mouPending}
              onSubmit={(event) => { if (mouPending) event.preventDefault(); }}
              className="space-y-4 text-xs"
            >
              <input type="hidden" name="gate" value="mou" />
              <input type="hidden" name="message" value={`Hub ${currentHub}; ${cadets} cadets; campus assessment enquiry`} />
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
              <div>
                <label htmlFor="citadel-mou-organisation" className="block font-semibold uppercase tracking-wider text-bone mb-1">
                  Institution / School Name *
                </label>
                <input id="citadel-mou-organisation" name="organisation" defaultValue={mouState?.values?.organisation ?? ""} aria-invalid={Boolean(mouState?.errors?.organisation)}
                  type="text"
                  required
                  placeholder="e.g., The Doon Heritage International School"
                  className="w-full px-3 py-2.5 bg-night border border-line rounded focus:outline-none focus:border-gold"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="citadel-mou-hub" className="block font-semibold uppercase tracking-wider text-bone mb-1">
                    Preferred Hub Model
                  </label>
                  <select id="citadel-mou-hub" name="hub"
                    value={currentHub}
                    onChange={(e) => handleSelectHub(e.target.value as typeof currentHub)}
                    className="w-full px-3 py-2.5 bg-night border border-line rounded focus:outline-none focus:border-gold"
                  >
                    <option value="standard">Standard Hub (0.5 Acre · 4 Stables)</option>
                    <option value="signature">Signature Hub (1.0 Acre · 8 Stables)</option>
                    <option value="royal">Royal Pavilion (1.5+ Acres · 12 Stables)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="citadel-mou-cohort" className="block font-semibold uppercase tracking-wider text-bone mb-1">
                    Estimated Cadet Cohort
                  </label>
                  <input id="citadel-mou-cohort"
                    type="text"
                    readOnly
                    value={`${cadets} Cadets (Est. ₹${schoolAnnualLakhs.toFixed(2)} L/yr Return)`}
                    className="w-full px-3 py-2.5 bg-umber/60 border border-line rounded text-sand"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="citadel-mou-name" className="block font-semibold uppercase tracking-wider text-bone mb-1">
                  Your name *
                  </label>
                  <input id="citadel-mou-name" name="name" defaultValue={mouState?.values?.name ?? ""} aria-invalid={Boolean(mouState?.errors?.name)}
                    type="text"
                    required
                  placeholder="Full name"
                    className="w-full px-3 py-2.5 bg-night border border-line rounded focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label htmlFor="citadel-mou-email" className="block font-semibold uppercase tracking-wider text-bone mb-1">
                    Official Email *
                  </label>
                  <input id="citadel-mou-email" name="email" defaultValue={mouState?.values?.email ?? ""} aria-invalid={Boolean(mouState?.errors?.email)}
                    type="email"
                    required
                    placeholder="trustee@school.edu.in"
                    className="w-full px-3 py-2.5 bg-night border border-line rounded focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <LeadFormExtras gate="mou" error={mouState?.errors?.consent} className="text-sand" />
              {mouState && (
                <div role={mouState.ok ? "status" : "alert"} className="p-3 rounded border border-gold text-bone font-medium">
                  <p>{mouState.message}</p>
                  {mouState.errors && <ul className="mt-2">{Object.values(mouState.errors).map((error) => <li key={error}>{error}</li>)}</ul>}
                  {!mouState.ok && <a href="mailto:boards@blackstallion.academy" className="mt-2 inline-block underline">Email the board office</a>}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMouModalOpen(false)}
                  className="px-4 py-2.5 border border-line text-sand uppercase tracking-wider text-[10px] font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mouPending || mouState?.status === "sent"}
                  className="px-6 py-2.5 bg-leather hover:bg-charcoal text-ivory uppercase tracking-widest text-[10px] font-semibold rounded shadow cursor-pointer"
                >
                  {mouPending ? "Sending request…" : mouState?.status === "sent" ? "Request received" : "Request MOU →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: EXPANDED ARCHITECTURAL SITE PLAN & LAYER DRAWER              */}
      {/* ===================================================================== */}
    </div>
  );
}
