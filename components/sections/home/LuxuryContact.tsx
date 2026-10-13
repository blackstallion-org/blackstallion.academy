"use client";

import { useState } from "react";
import Image from "next/image";
import { GSAPScrollReveal } from "@/components/cinematic/GSAPScrollReveal";
import { Label } from "@/components/film/Marks";

/**
 * §14.8 Luxury Contact Corridor — Direct from Gemini Reference Image (Screen 4)
 * "Get in touch."
 * Allows parents, school principals, and regional partners to direct inquiries to their specific corridor.
 */
export function LuxuryContact() {
  const [corridor, setCorridor] = useState("parents");
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    campus: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section
      id="contact-corridor"
      aria-label="Direct Inquiry Corridors"
      className="relative bg-[#08090B] py-20 lg:py-32 border-b border-brass/20 overflow-hidden"
    >
      <div className="gutter grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        {/* Left: Corridor Information & Crest */}
        <div className="space-y-8">
          <GSAPScrollReveal variant="fade-up">
            <Label>Direct Corridors</Label>
          </GSAPScrollReveal>

          <GSAPScrollReveal variant="fade-up" delay={0.1}>
            <h2 className="t-voice text-[clamp(2.8rem,5.5vw,5rem)] text-bone leading-[0.95]">
              Get in touch.
            </h2>
          </GSAPScrollReveal>

          <GSAPScrollReveal variant="fade-up" delay={0.2}>
            <p className="text-sand text-lg font-serif leading-relaxed max-w-md">
              Have questions? We would love to hear from you. Book a campus visit, schedule a board audit, or learn more about our interscholastic programs.
            </p>
          </GSAPScrollReveal>

          {/* Institutional Contact Links */}
          <GSAPScrollReveal variant="fade-up" delay={0.3} className="space-y-4 pt-4 border-t border-brass/15">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-gold uppercase tracking-[0.16em] w-28">
                PARENTS:
              </span>
              <a
                href="mailto:parents@blackstallion.academy"
                className="font-mono text-sm text-sand hover:text-gold transition-colors"
              >
                parents@blackstallion.academy
              </a>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-gold uppercase tracking-[0.16em] w-28">
                BOARDS:
              </span>
              <a
                href="mailto:boards@blackstallion.academy"
                className="font-mono text-sm text-sand hover:text-gold transition-colors"
              >
                boards@blackstallion.academy
              </a>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-gold uppercase tracking-[0.16em] w-28">
                PARTNERS:
              </span>
              <a
                href="mailto:partners@blackstallion.academy"
                className="font-mono text-sm text-sand hover:text-gold transition-colors"
              >
                partners@blackstallion.academy
              </a>
            </div>
          </GSAPScrollReveal>

          <GSAPScrollReveal variant="fade-up" delay={0.4} className="pt-4 flex items-center gap-3">
            <Image
              src="/brand/crest.svg"
              alt="BSAH Crest"
              width={36}
              height={36}
              className="h-9 w-9 text-gold"
            />
            <div className="flex flex-col">
              <span className="font-mono text-[0.68rem] tracking-[0.2em] uppercase text-bone">
                DOMINUS SUI, DOMINUS EQUI
              </span>
              <span className="text-[0.65rem] text-dust tracking-[0.12em] uppercase">
                National Secretariat · Hyderabad, Telangana
              </span>
            </div>
          </GSAPScrollReveal>
        </div>

        {/* Right: Luxury Editorial Contact Form */}
        <GSAPScrollReveal
          variant="fade-up"
          delay={0.2}
          className="rounded-3xl border border-brass/25 bg-gradient-to-b from-[#121318] to-[#08090B] p-8 lg:p-12 shadow-2xl backdrop-blur-md"
        >
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold border border-gold/40 text-2xl">
                ✓
              </div>
              <h3 className="t-voice text-3xl text-bone">Dispatched to Command</h3>
              <p className="text-sand font-serif max-w-sm mx-auto">
                Your transmission has been logged in the academy registry. An admissions officer or board liaison will contact you within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="font-mono text-xs uppercase tracking-[0.16em] text-gold underline pt-4"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Corridor Selector */}
              <div>
                <label className="label block mb-3 text-xs">Select your gateway</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "parents", label: "Parents" },
                    { id: "schools", label: "Schools" },
                    { id: "audit", label: "Board Audit" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCorridor(tab.id)}
                      className={`font-mono text-[0.68rem] uppercase tracking-[0.14em] py-2.5 px-2 rounded-xl border transition-all ${
                        corridor === tab.id
                          ? "bg-gold text-night font-bold border-gold shadow-[0_0_12px_rgba(197,160,89,0.3)]"
                          : "border-brass/25 bg-night/50 text-sand hover:border-gold/50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="label block mb-2 text-xs">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Major General R. S. Rathore / Ananya Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-brass/20 bg-night/80 px-4 py-3 text-sm text-bone placeholder-dust/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label block mb-2 text-xs">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-brass/20 bg-night/80 px-4 py-3 text-sm text-bone placeholder-dust/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
                <div>
                  <label className="label block mb-2 text-xs">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-brass/20 bg-night/80 px-4 py-3 text-sm text-bone placeholder-dust/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="label block mb-2 text-xs">Inquiry / Campus Details</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us about your child's age or your school campus requirements..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-xl border border-brass/20 bg-night/80 px-4 py-3 text-sm text-bone placeholder-dust/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold resize-none"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="group w-full flex items-center justify-center gap-3 rounded-xl bg-gold py-4 font-mono text-[0.75rem] uppercase tracking-[0.18em] text-night font-bold transition-all hover:bg-bone hover:shadow-[0_0_24px_rgba(197,160,89,0.4)]"
              >
                Send message to command
                <svg
                  aria-hidden
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </form>
          )}
        </GSAPScrollReveal>
      </div>
    </section>
  );
}
