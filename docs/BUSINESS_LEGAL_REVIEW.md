# Business and legal verification packet (24 Oct 2026)

**Status: prepared for the owner's decision. Nothing in this packet was changed on the site, no business term was
invented, and no legal approval is claimed.** It lists what the site says today, where it says it, where the
statements disagree with each other or with the facts checked on 24 Oct, and the decision each one needs. It is not a
legal opinion; "counsel" means the company's lawyer. File references are to the repository at commit `8d70c9e`.

How to read the tables: **Blocker** = should be settled before the site is made public or indexed (the site is
currently `noindex` and its Vercel previews are access-protected, so nothing below is public yet).

## 0. Decisions needed, in order of importance

| # | Decision | Blocker | Section |
| --- | --- | --- | --- |
| D1 | Which tuition figure is the commercial basis for the school return: ₹8,500 + GST per month (parent price list), or ₹24,000–₹72,000 per year (school simulator)? Today the two differ by up to 2.8×. | Yes | 1 |
| D2 | Who funds the arena, and may the site say "zero CapEx" and "zero operational overhead"? The repository's own Blueprint records two source documents that disagree. | Yes | 2 |
| D3 | Is the academy actually "sanctioned" by STPCI today? The footer says so on every page; the information desk says recognition is "being confirmed". | Yes | 3 |
| D4 | Does group accident insurance exist, and does BSAH commit to it in the MOU? The MOU says yes; the public pages say "being confirmed". | Yes | 4 |
| D5 | The privacy notice says the data is stored in the Mumbai region. It is stored in **Seoul**. Keep the project in Seoul and correct the notice, or move it? | Yes | 5 |
| D6 | Approve the privacy notice (retention period, grievance officer) and decide how parental consent for children is verified. | Yes | 5 |
| D7 | Who reviews the health, safety and veterinary statements, and in what form is the sign-off kept? | Yes | 6 |
| D8 | Are the AI-generated images acceptable at launch? The Blueprint itself says they must be replaced before launch. Confirm licences for images, 3D models, video and audio. | Yes | 7 |
| D9 | Terms, refund and safeguarding pages and the company's registration details are not on the site. | Before payments | 8 |
| D10 | Are the three listed tournaments and the "hubs" real, dated and open for registration? | Yes | 9 |
| D11 | Hosting plans: Vercel Hobby is not licensed for commercial use; the Supabase Free plan has no backups. Approve Vercel Pro and Supabase Pro (exact prices in section 10). | Yes | 10 |
| D12 | Do CERT-In's six-hour incident reporting and 180-day log retention (Directions of 28 April 2022) apply to BSAH, and how will logs be kept if they do? Vercel's runtime logs are short-lived on the Hobby plan and held outside India. | Yes | 5 |

## 1. Fees and the school return

**What the site shows**

| Figure | Where | Value |
| --- | --- | --- |
| Parent fees, per month, before 18 % GST | `lib/content/pricing.ts` (header: "supplied by the Chairman's directive"); shown on `/parents`, `/contact`, the information desk | Core ₹8,500 (₹10,030 with GST) · Elite ₹12,500 (₹14,750) · one-time kit ₹5,000 (₹5,900) |
| School simulator on `/schools` ("Annual Programme Fee per Cadet") | `components/sections/schools/CitadelConfigurator.tsx` lines 28–30, 1050–1098 | ₹24,000–₹72,000 **per year** (₹2,000–₹6,000 per month), default **₹36,000** (₹3,000 per month); cadets 80–450 (default 140); share 25–30 % (default 27.5 %) |
| Revenue-share base in the Blueprint | `docs/BLUEPRINT.md` Part 10, question 2 | ₹8,000 per month; the client's tier table uses ₹9,440 (GST-inclusive) |
| Second simulator (not mounted on any page) | `ConfiguratorAndSimulator` in `SchoolScenes.tsx`, `lib/content/schools.ts` `simulate()` | ₹8,500 per month, 25–30 % |

**Why it matters.** For the same 140 cadets at 27.5 %, the school return shown on `/schools` is **₹13.86 L per year**
(5-year "endowment" ₹69.30 L). At the parent price list (₹8,500 × 12 = ₹1,02,000 per cadet) the same school would see
**₹39.27 L per year** (₹46.34 L if GST-inclusive fees were the base). The simulator's output is also copied into the
enquiry text ("… cadets (Est. ₹X L/yr Return)", line 1251), so an estimate reaches the sales team as if it were a quote.

**Other money statements to settle**

- *When is the share paid?* The site says "settled quarterly" (`schools.ts` 52, `home.ts` 83, `command.ts` 19); the draft
  MOU says "each month" (`lib/content/mou.ts` 27).
- *What is "gross tuition"?* Before or after GST, refunds, payment-gateway fees and discounts? The MOU does not say.
- *Payback.* The Blueprint (Part 10, question 3) records that the client's "6–8 months" does not match the formula
  (about 2.7 months at full enrolment). No payback period is published now (searched 24 Oct), which is the safe state.
- *Indicative capital* in the MOU and tier cards (₹8.20 L / ₹15.00 L / ₹25.00 L+) is BSAH's figure; the page itself says
  commercial terms "should be checked against approved BSAH specifications before publication" (line 1175).
- `pricing.ts` says to mark fees "pending business confirmation" if terms change. No such marking is shown today.

**Decision D1.** Choose the basis. Technically either is a one-line change (`tuition` default and slider range in the
configurator, or reading `price.core`); I have not changed it because it is a commercial term. Until decided, the
simulator carries its own disclaimer, but the figure is still shown in large type.

## 2. "Zero CapEx" and "zero overhead"

**Where the claim appears.** Home "Zero-CapEx Engine … with zero school expenditure" (`Doors.tsx` 34–35); contact
"Zero CapEx Infrastructure" (`Gates.tsx` 64); `/schools` headline "Zero CapEx. We build. You earn." and "at zero capital
expenditure" (`SchoolScenes.tsx` 32, 51, 211, 253); simulator badge "ZERO CAPEX", "School Board Capital Outlay: ₹0
(100% BSAH Funded)" and "Direct recurring revenue with zero operational overhead" (`CitadelConfigurator.tsx`
995, 1113, 1126, 1150); MOU clause 2.

**The conflict, in the repository's own words** (`docs/BLUEPRINT.md` Part 10, question 1): the Technical Directive says
"100 % BSAH-funded, zero CapEx"; the Master System Blueprint (7 Oct, marked final) says the school funds construction
and receives 25–30 %. The Blueprint recorded that the site followed the second; the code now follows the first
(`schools.ts` header: "Directive 04 (Zero-CapEx model)"). The Blueprint text is out of date and must be reconciled
either way.

**Narrower points**

- "Zero operational overhead" and "zero school expenditure" are broader than the MOU: clause 2 has the school provide
  **land, access and utilities** and "promote the programme". Utilities are an operating cost. The simulator note
  "The school carries no construction capital" (`SchoolScenes.tsx` 191) is the narrower, defensible form.
- "Net return" (`Annual Net Return to School Board`) and "5-Year School Endowment" describe a gross revenue share as net
  income and an "endowment". Counsel should say whether either is acceptable wording.
- The MOU is a draft with the banner "Draft for discussion · not a binding document" and a "(sample term)" five-year
  term (clause 5): good, keep.

**Decision D2.** (a) Which party funds construction; (b) approved wording, e.g. "no construction capital from the
school" instead of "zero overhead". I will apply whichever wording you approve.

## 3. Recognition, sanction and affiliation statements

| Statement | Where | Conflict |
| --- | --- | --- |
| "Sanctioned by the School Tent Pegging Council of India (STPCI)" | every page footer, `Footer.tsx` 150 | The information desk (`command.ts` 31–36) says: "Official recognition, registration terms and Governor's Cup eligibility are being confirmed … passport logging is planned, not yet live." |
| "STPCI-sanctioned national competition" | `schools.ts` 126 | same |
| "EFI junior pathway — Cadets registered with the federation" (present tense) | `schools.ts` 57 | the verify page shows "EFI registration" only for labelled SAMPLE codes |
| "Instructors from Indian Army RVC and NCC cavalry units" | `home.ts` 114 | the information desk says these are "recruitment sources, not confirmed affiliations; no individual is named until appointed" |
| Hall of champions, standings, hubs "live" | `records.ts`, ticker | labelled "sample" on the page (good) |

**Relationship disclosure.** The project's entity chain lists STPCI beneath BSAH (parent → operator → "governing
council"). If STPCI is owned or controlled within the same group, "sanctioned by" reads as an independent approval and
counsel should say whether the relationship needs to be stated next to it.

**Decision D3.** Provide the STPCI sanction letter (and EFI documents) or approve softer wording ("governed under the
rules of STPCI"). No real school is named anywhere in the code (searched for DPS, Oakridge, Hyderabad Public School,
HPS: none), which answers Blueprint question 4 for the code; the Blueprint text still lists them.

## 4. Safety, insurance and operational promises

- **Insurance.** `mou.ts` 26 and `schools.ts` 51 commit BSAH to "group accident insurance for every active cadet" and to
  provide "insurance". `home.ts` 116, `academy.ts` 85–105 and `command.ts` say "Accident-insurance terms are being
  confirmed and will be published". Both cannot be live. **D4:** confirm the policy (insurer, cover, who is insured,
  third-party liability for the school) or reword the MOU clause as "to be agreed".
- **Promises that must be true on day one:** certified helmets for every mounted minute, impact vests, an ex-cavalry
  supervisor on every mounted drill, daily veterinary checks, a spotter on every drill, "learn how to fall before they
  canter". They read as standard operating procedure; each needs a written procedure and an owner.
- **Waivers and parent consent** for riding (assumption-of-risk, medical, emergency contact) are not on the site; the
  enquiry form collects none, which is correct for an enquiry. They will be needed at enrolment.
- **Injury and hours statistics** are SAMPLE figures (for example 1,480 hours, 342 canter transitions, 0 major injuries):
  correctly labelled; replace with real figures or keep the label.

## 5. Children's data, consent and the privacy notice (`app/privacy/page.tsx`)

**Finding (verified 24 Oct): the notice is wrong about where data is stored.** Line 38: "Supabase, hosted in the Mumbai
region." The Supabase dashboard (Project Settings → General) shows the project region as **Northeast Asia (Seoul)**.
The project is shared with other BSAH applications, so moving it means a new project and a migration, not a setting.
Options: (a) keep Seoul and correct the sentence (cross-border storage is then disclosed; counsel to confirm the
position under Rule 15 of the DPDP Rules); (b) migrate to a Mumbai project before launch (cost, downtime and
re-pointing of the other applications). I have not edited the notice; the correct sentence is one line either way.

**Other draft markers in the notice** (banner at line 69): retention "12 months (proposed period, to be confirmed)";
"Grievance officer (to be appointed): privacy@blackstallion.academy" — the person must be named and the mailbox must
exist before launch (the mail domain is outside this repository); version string `2026-10-draft`.

**Incident reporting and logs (D12).** The CERT-In Directions of 28 April 2022 apply to service providers, intermediaries,
data centres, body corporate and government organisations. They ask for listed cyber incidents (data breach or leak,
unauthorised access to IT systems, website defacement and others) to be reported to CERT-In within six hours of noticing
them, and for system logs to be kept for 180 days within India (secondary summary, section 11). Whether BSAH is in scope
and what that means for a site hosted on Vercel and Supabase (Seoul) is for counsel. The technical side is ready:
`docs/DEPLOYMENT_RUNBOOK.md` section 9 has the first-15-minutes procedure and a blank contact list; what is missing is
the decision, the named incident lead and, if the directions apply, a log destination in India.

**Children.** The enquiry consent is a self-declaration ("I am their parent, guardian or an authorised school
representative", `LeadFormExtras.tsx` 115) and the notice says the child's name and age may be provided. The DPDP Rules
2025 were notified on 14 Nov 2025; rules 3 and 5–16 (including Rule 10, verifiable parental consent) take effect 18
months after publication, about **14 May 2027**, while the notice and consent infrastructure should be designed for it
now (sources: section 11; counsel to confirm dates and applicability). Practical points for counsel:

- Today the site holds no child's record beyond what a parent types into the enquiry form.
- `/verify/<code>` would show a minor's name, rank, hours and hub to anyone holding the code once real records are
  connected. At present it shows only labelled SAMPLE codes and says "the registry is not connected". Before real
  records go live the page needs guardian opt-in and a decision on what a public lookup may reveal.
- Photographs or video of children (the site uses AI placeholders now) will need parental image consent.
- Service providers named nowhere in the notice but used: Supabase (database, Seoul), Vercel (hosting; the server functions run in Seoul, `icn1`, since `vercel.json` was added on 24 Oct, and were in the USA before; static files come from a worldwide CDN),
  Resend (e-mail), Formspree (form relay), Cloudflare Turnstile (optional, not enabled). The notice only says "hosting,
  e-mail" providers.
- **The image provider's hosts.** Eight stills, 21 journal images and eight videos (and, through its image resizer, the
  eight new stills) are fetched by the visitor's browser directly from the provider's content-delivery hosts
  (`d8j0ntlcm91z4.cloudfront.net`, `d2ol7oe51mr4n9.cloudfront.net`, `images.higgs.ai`). Like any CDN they see the
  visitor's IP address and browser details; what the provider keeps is not known to this review. The notice names none of
  them. Self-hosting the media (`scripts/fetch-media.sh`) removes this recipient from the visitor's page view.
- Cookies: the notice says there are no advertising or tracking cookies. Optional Vercel Web Analytics is controlled by
  `NEXT_PUBLIC_VERCEL_ANALYTICS` (off today); if enabled or Turnstile is added, re-check that sentence.

## 6. Health, safety and veterinary claims

The claims ledger (`docs/BLUEPRINT.md` Part 9; `lib/content/science.ts`) already excludes the unsupported statements,
and a search of the code on 24 Oct found none of the excluded phrases ("40 % cortisol", "300+ muscles", "permanently
reverses tech-neck", "zero joint impact") in published content. What remains needs a qualified reader, not a
developer:

- Statements about children's stress hormones (one randomized trial cited), pelvic movement of about a hundred
  impulses per minute (hippotherapy literature), posture and "trains an upright, stacked posture".
- The anatomy "matrix" (brain, spine, muscle, heart) and any developmental benefit it implies.
- Operational veterinary claims: daily rounds by an equine veterinarian, daily hoof, feed and hydration checks.
- Animal-welfare standards for the horses (workload, retirement) if the site is to state any.

**Decision D7.** Name the reviewer (equine veterinarian, paediatric or sports-medicine physician) and keep the signed
review with the ledger. I have recorded no approval.

## 7. Content rights and licences

- **AI imagery.** Every photograph on the site is AI-generated Higgsfield placeholder art. The Blueprint (Part 8) says
  they "must be replaced with commissioned photography (Part 11.4) before launch". The Higgsfield account is on a paid
  plan; commercial-use terms for its outputs were **not** verified in this review (check the plan's licence). Eight
  stills, 21 journal images and eight videos are still loaded from Higgsfield's CDN rather than the site (the eight
  stills since 24 Oct through the provider's image resizer as small WebP files instead of 7.5 MB PNGs; the other 60
  stills ship with the site); self-hosting removes a third-party dependency but does not change the licence position. Consider an "AI-generated illustration" credit where a child
  or a real place is depicted.
- **3D models and video.** Provenance of the horse and statue models (`public/models`), the rigged Marwari stallion
  (a separate session's work) and stock-style video files (for example `public/images/cinematic-images/6153468-uhd_…mp4`,
  not referenced by any page) is not documented; keep purchase or licence records, or delete unreferenced files.
- **Fonts** (Noto Serif Display, Newsreader, Plus Jakarta Sans, Martian Mono) are open-licence fonts self-hosted;
  Kalnia and Mona Sans files remain but are unused.
- **Audio** (`public/audio`) provenance is not documented.
- The Amigos images and the clip in `blackstallion images/` must not be used (project rule); a search of `app/`,
  `components/` and `lib/` found no reference.

## 8. Pages and details that are missing

The footer's legal row has About, Lore, Journal, Information desk and Privacy. There is **no** terms of use, refund and
cancellation policy, safeguarding (child-protection) policy, accessibility statement, or company registration block
(CIN, GST number, registered office). Payment gateways normally require terms and a refund policy before live keys are
issued, and parents paying monthly fees will expect them. No live payment is active (no Razorpay keys are set on
Vercel). **D9:** supply texts or approve drafts; I will add pages and footer links.

## 9. Events, hubs and partners

`lib/content/records.ts` lists three fixtures with dates and "open"/"soon" status: Sovereign Governor's Cup
(14 Nov 2026, "Zone 01A Arena · Financial District"), Hyderabad Interschool Tent Pegging (12 Dec 2026), Junior Lancers
Invitational (23 Jan 2027). The detail pages call the schedule a sample. The hubs and zones are described as candidate
or planned (`schools.ts`: "No claims of signed contracts with named schools"), yet the Governor's Cup is three weeks
away and shown as "open". **D10:** confirm the events and venues exist and registration is genuinely open, or set the
status to "proposed".

## 10. Hosting terms and exact costs (verified 24 Oct from the vendors' own pages)

| Service | Today | What launch needs | Price | Why |
| --- | --- | --- | --- | --- |
| Vercel | Hobby (free) | Pro | **$20 per user per month** (developer seat; viewer seats free), excluding taxes | Hobby "restricts users to non-commercial, personal use only" (Vercel plans documentation, updated 14 Sep 2026). A company website is commercial use. |
| Supabase | Free | Pro | **from $25 per month** per organisation (includes a $10 compute credit; each project's compute is billed on top; 8 GB disk per project, 7 days of daily backups). Point-in-time recovery is an extra **about $100 per month** for 7 days of retention and needs at least Small compute (about $15 per month). | Free has **no backups** (confirmed on the project's Backups page) and "free projects are paused after 1 week of inactivity" (Supabase pricing): a quiet week would take the lead form offline. |
| Resend, Formspree | free tiers | none now | $0 | Revisit if volume grows. |
| Cloudflare Turnstile (spam protection) | not enabled | optional | $0 | Needs a Cloudflare account and two keys; ask before enabling. |

The Supabase project also serves other BSAH applications, so the plan decision is the owner's. Nothing was purchased.

## 11. What was verified and what was not

Verified on 24 Oct with evidence: the quoted wording and line numbers above (code search); the Supabase region and the
absence of backups (project dashboard); Vercel and Supabase prices and terms (vendors' pages, fetched the same day);
the DPDP Rules notification and commencement dates (secondary summary, see sources); that no real school names,
excluded claims or Amigos images appear in published code.

Not verified (needs documents or people): the STPCI and EFI relationship and letters, insurance policies, licence terms
for AI images, 3D models, video and audio, the existence of the privacy mailbox, whether the events are real, and every
health statement. No statement in this packet should be read as legal advice.

Sources: [Vercel Hobby plan](https://vercel.com/docs/plans/hobby) · [Supabase pricing](https://supabase.com/pricing.md) ·
[DPDP Rules 2025 summary, SCC Online](https://www.scconline.com/blog/post/2025/12/26/digital-personal-data-protection-rules-2025-key-highlights/) ·
[Supabase: Database Backups, PITR pricing, Project Pausing, Billing](https://supabase.com/docs/guides/platform/backups) ·
[CERT-In Directions 2022, Mondaq summary](https://www.mondaq.com/india/it-and-internet/1270332/6-hours-to-report-cyber-incidents-to-cert-in).
