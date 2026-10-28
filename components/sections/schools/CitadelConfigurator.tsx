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
    <div ref={scopeRef} className="relative w-full bg-[#F4EFE4] text-[#1A1512] font-sans overflow-x-hidden selection:bg-[#6B3A24] selection:text-[#FAF7F0]">
      {/* ===================================================================== */}
      {/* SECTION 4: INTERACTIVE SCHOOL BOARD ROI & TUITION RETURN CALCULATOR   */}
      {/* ===================================================================== */}
      <section id="simulator" className="scroll-mt-20 py-16 sm:py-24 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto">
        <div id="roi-section" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Sliders */}
          <div className="lg:col-span-7 bg-[#FAF7F0] border border-[#D5C7B2] rounded-[4px] p-6 sm:p-8 shadow-sm">
            <div className="text-[11px] font-semibold tracking-[0.2em] text-[#6B3A24] uppercase mb-2">
              FINANCIAL SIMULATOR · SCHOOL BOARD TREASURY
            </div>
            <h2 className="font-serif text-3xl text-[#1A1512] mb-2">Run the Numbers: Tuition Return & ROI</h2>
            <p className="text-xs text-[#5C5046] mb-6">
              Simulate your institution’s annual tuition share and 5-year endowment accumulation under the zero-CapEx BSAH Citadel model.
            </p>

            {/* Hub Selector Pills */}
            <div className="mb-6">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#2B221C] mb-2">
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
                          ? 'border-[#6B3A24] bg-[#6B3A24] text-[#FAF7F0]'
                          : 'border-[#D5C7B2] bg-[#F4EFE4] text-[#1A1512] hover:border-[#6B3A24]'
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
                <label className="text-xs font-semibold uppercase tracking-wider text-[#2B221C]">
                  Enrolled Equestrian Cadets
                </label>
                <span className="font-serif text-xl font-bold text-[#6B3A24]">{cadets} Cadets</span>
              </div>
              <input
                type="range"
                aria-label="Expected cadet cohort"
                min={80}
                max={450}
                step={10}
                value={cadets}
                onChange={(e) => setCadets(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-[#5C5046] mt-1">
                <span>80 Cadets (Standard Min)</span>
                <span>250 Cadets (Signature)</span>
                <span>450 Cadets (Royal Estate)</span>
              </div>
            </div>

            {/* Slider 2: Tuition */}
            <div className="mb-6">
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#2B221C]">
                  Annual Programme Fee per Cadet (₹)
                </label>
                <span className="font-serif text-xl font-bold text-[#6B3A24]">
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
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-[#5C5046] mt-1">
                <span>₹24,000 (₹2,000/mo)</span>
                <span>₹48,000 (₹4,000/mo)</span>
                <span>₹72,000 (Championship)</span>
              </div>
            </div>

            {/* Slider 3: Share % */}
            <div className="mb-2">
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#2B221C]">
                  School Board Tuition Return Tier
                </label>
                <span className="font-serif text-xl font-bold text-[#6B3A24]">{share.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                aria-label="School board tuition return tier"
                min={25}
                max={30}
                step={0.5}
                value={share}
                onChange={(e) => setShare(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-[#5C5046] mt-1">
                <span>25.0% (Standard MOU)</span>
                <span>27.5% (Signature MOU)</span>
                <span>30.0% (Royal Regional Host)</span>
              </div>
            </div>
          </div>

          {/* Output Card */}
          <div className="lg:col-span-5 bg-[#1A1512] text-[#FAF7F0] rounded-[4px] p-6 sm:p-8 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#FAF7F0]/15 pb-4 mb-6">
                <div>
                  <div className="text-[10px] tracking-[0.2em] text-[#C49A6C] uppercase">PROJECTED SCHOOL RETURN</div>
                  <div className="font-serif text-xl text-[#FAF7F0]">{hubInfo.name} · {hubInfo.landLabel.replace('SITE - ', '')}</div>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#6B3A24] text-[10px] font-semibold tracking-widest uppercase">
                  ZERO CAPEX
                </span>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#B8A48A]">
                    Annual Net Return to School Board
                  </div>
                  <div className="font-serif text-4xl sm:text-5xl font-bold text-[#E5C396] mt-1">
                    ₹{schoolAnnualLakhs.toFixed(2)} L
                  </div>
                  <div className="text-[11px] text-[#B8A48A] mt-1">
                    Direct recurring revenue with zero operational overhead
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#FAF7F0]/15">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#B8A48A]">5-Year School Endowment</div>
                    <div className="font-serif text-2xl font-bold text-[#FAF7F0] mt-0.5">
                      ₹{schoolFiveYrLakhs.toFixed(2)} L
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#B8A48A]">BSAH Funded CapEx</div>
                    <div className="font-serif text-2xl font-bold text-[#C49A6C] mt-0.5">{hubInfo.price}</div>
                  </div>
                </div>

                <div className="bg-[#28201B] p-4 rounded border border-[#FAF7F0]/10 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#B8A48A]">Gross Annual Programme Tuition:</span>
                    <span className="font-semibold text-[#FAF7F0]">₹{grossLakhs.toFixed(2)} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#B8A48A]">School Board Capital Outlay:</span>
                    <span className="font-semibold text-[#7CE395]">₹0 (100% BSAH Funded)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#B8A48A]">Grooms, Horses, Vet & Coaches:</span>
                    <span className="font-semibold text-[#FAF7F0]">Included by BSAH</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#FAF7F0]/15 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setMouModalOpen(true)}
                className="flex-1 py-3 px-4 bg-[#6B3A24] hover:bg-[#8B5236] text-[#FAF7F0] text-[11px] font-semibold tracking-[0.18em] uppercase rounded-[2px] transition text-center cursor-pointer"
              >
                Generate Draft MOU with These Figures →
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 pt-6 border-t border-[#D5C7B2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-[#5C5046]">
          <p>
            <strong className="text-[#1A1512] uppercase tracking-wider">Architectural Notice:</strong> The generated visual is a design concept, not a verified architectural plan. Hub dimensions, prices, capacities and commercial terms should be checked against approved BSAH specifications before publication.
          </p>
          <a
            href="#citadel-hero"
            className="text-[#6B3A24] font-semibold uppercase tracking-widest hover:underline shrink-0"
          >
            Back to 3D Campus ↑
          </a>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* MODAL 1: REQUEST A DRAFT MOU FORM                                     */}
      {/* ===================================================================== */}
      {mouModalOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="citadel-mou-title" className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1512]/70 backdrop-blur-sm p-4">
          <div className="bg-[#FAF7F0] border border-[#C49A6C] rounded-[4px] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setMouModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#EAE0CC] hover:bg-[#6B3A24] hover:text-[#FAF7F0] flex items-center justify-center text-sm font-bold transition cursor-pointer"
              aria-label="Close MOU Modal"
            >
              ✕
            </button>
            <div className="text-[10px] font-semibold tracking-[0.16em] text-[#6B3A24] uppercase mb-1">
              Campus partnership
            </div>
            <h3 id="citadel-mou-title" className="font-serif text-2xl sm:text-3xl text-[#1A1512] mb-2">Request a draft MOU</h3>
            <p className="text-xs text-[#5C5046] mb-5">
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
                <label htmlFor="citadel-mou-organisation" className="block font-semibold uppercase tracking-wider text-[#2B221C] mb-1">
                  Institution / School Name *
                </label>
                <input id="citadel-mou-organisation" name="organisation" defaultValue={mouState?.values?.organisation ?? ""} aria-invalid={Boolean(mouState?.errors?.organisation)}
                  type="text"
                  required
                  placeholder="e.g., The Doon Heritage International School"
                  className="w-full px-3 py-2.5 bg-[#F4EFE4] border border-[#D5C7B2] rounded focus:outline-none focus:border-[#6B3A24]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="citadel-mou-hub" className="block font-semibold uppercase tracking-wider text-[#2B221C] mb-1">
                    Preferred Hub Model
                  </label>
                  <select id="citadel-mou-hub" name="hub"
                    value={currentHub}
                    onChange={(e) => handleSelectHub(e.target.value as typeof currentHub)}
                    className="w-full px-3 py-2.5 bg-[#F4EFE4] border border-[#D5C7B2] rounded focus:outline-none focus:border-[#6B3A24]"
                  >
                    <option value="standard">Standard Hub (0.5 Acre · 4 Stables)</option>
                    <option value="signature">Signature Hub (1.0 Acre · 8 Stables)</option>
                    <option value="royal">Royal Pavilion (1.5+ Acres · 12 Stables)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="citadel-mou-cohort" className="block font-semibold uppercase tracking-wider text-[#2B221C] mb-1">
                    Estimated Cadet Cohort
                  </label>
                  <input id="citadel-mou-cohort"
                    type="text"
                    readOnly
                    value={`${cadets} Cadets (Est. ₹${schoolAnnualLakhs.toFixed(2)} L/yr Return)`}
                    className="w-full px-3 py-2.5 bg-[#EAE0CC]/60 border border-[#D5C7B2] rounded text-[#4A3E35]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="citadel-mou-name" className="block font-semibold uppercase tracking-wider text-[#2B221C] mb-1">
                  Your name *
                  </label>
                  <input id="citadel-mou-name" name="name" defaultValue={mouState?.values?.name ?? ""} aria-invalid={Boolean(mouState?.errors?.name)}
                    type="text"
                    required
                  placeholder="Full name"
                    className="w-full px-3 py-2.5 bg-[#F4EFE4] border border-[#D5C7B2] rounded focus:outline-none focus:border-[#6B3A24]"
                  />
                </div>
                <div>
                  <label htmlFor="citadel-mou-email" className="block font-semibold uppercase tracking-wider text-[#2B221C] mb-1">
                    Official Email *
                  </label>
                  <input id="citadel-mou-email" name="email" defaultValue={mouState?.values?.email ?? ""} aria-invalid={Boolean(mouState?.errors?.email)}
                    type="email"
                    required
                    placeholder="trustee@school.edu.in"
                    className="w-full px-3 py-2.5 bg-[#F4EFE4] border border-[#D5C7B2] rounded focus:outline-none focus:border-[#6B3A24]"
                  />
                </div>
              </div>

              <LeadFormExtras gate="mou" error={mouState?.errors?.consent} className="text-[#4A3E35]" />
              {mouState && (
                <div role={mouState.ok ? "status" : "alert"} className="p-3 rounded bg-[#6B3A24]/15 border border-[#6B3A24] text-[#4E2918] font-medium">
                  <p>{mouState.message}</p>
                  {mouState.errors && <ul className="mt-2">{Object.values(mouState.errors).map((error) => <li key={error}>{error}</li>)}</ul>}
                  {!mouState.ok && <a href="mailto:boards@blackstallion.academy" className="mt-2 inline-block underline">Email the board office</a>}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMouModalOpen(false)}
                  className="px-4 py-2.5 border border-[#D5C7B2] text-[#4A3E35] uppercase tracking-wider text-[10px] font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mouPending || mouState?.status === "sent"}
                  className="px-6 py-2.5 bg-[#6B3A24] hover:bg-[#4E2918] text-[#FAF7F0] uppercase tracking-widest text-[10px] font-semibold rounded shadow cursor-pointer"
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
