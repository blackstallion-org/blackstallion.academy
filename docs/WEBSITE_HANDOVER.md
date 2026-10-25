# BSAH website — handover (24 Oct 2026)

For whoever runs, changes or builds on the website next (including the mobile-app team). Status and evidence:
`PRODUCTION_READINESS.md` (re-scored on 24 Oct: 82.5 %, production verdict "not yet"). Companion documents in
`docs/`: **`LAUNCH_INSTRUCTIONS.md`** (the steps and gates for going live, one approval at a time),
**`BUSINESS_LEGAL_REVIEW.md`** (twelve decisions for the owner and counsel), `DATABASE_ARCHITECTURE.md`,
`SECURITY_AUDIT.md`, `PERFORMANCE_REPORT.md`, `TEST_RESULTS.md`, `DEPLOYMENT_RUNBOOK.md`, `ENVIRONMENT_VARIABLES.md`,
`MOBILE_BACKEND_CONTRACTS.md`, `ADMIN_CONSOLE.md`, `PERF_NOTES.md`, and the design source of truth `BLUEPRINT.md`.

**Where things stand (24 Oct 2026, evening).** The integrated branch `session/2026-10-24-final-completion` was merged
into `main` (pull request #1, merge commit `b76131b`, 19:25 UTC) on the owner's approval, and Vercel's production
deployment is public at `https://project-t9r95.vercel.app`. CI is green on `main`, the database is up and search
indexing is off. Nothing is on the custom domain, no payment is live, and the launch changed no live data. Read
`PRODUCTION_READINESS.md` §5 for the owner-only items.

## 1. How the website is structured

- **Stack:** Next.js 16.4 App Router (Cache Components + Partial Prefetching, Turbopack), React 19.3, TypeScript strict,
  Tailwind CSS 4 (role tokens in `app/globals.css`), motion/react + GSAP (ScrollTrigger, SplitText) + Lenis, three.js /
  React Three Fiber / drei and ogl for 3D and WebGL, zod, pdf-lib, @supabase/ssr + supabase-js. No other runtime services.
- **Direction:** "a film in sixteen reels" — `/` is the trailer; every other page is a reel (title card → scenes → end
  card). Reel list and numbering: `lib/content/site.ts` (`reels`, `TOTAL_REELS`). Copy and data: `lib/content/`.
- **Routes:** `/` · Act I `/legend` `/lore` `/anatomy` `/statue` (`/lithos` = same experience, canonical `/statue`) ·
  Act II `/science` `/why` `/curriculum` `/fleet` `/cadets` `/parents` `/safety` `/equipment` · Act III `/schools`
  `/schools/[slug]` `/schools/mou` `/schools/access` `/verify` `/verify/[code]` `/tournaments` `/tournaments/[slug]`
  `/command` `/journal` `/journal/[slug]` `/contact` · `/about` `/privacy` · staff: `/admin…` · `/auth/confirm`.
- **Folders:** `app/` routes and server actions (`app/actions.ts` enquiries, `app/admin/actions.ts` staff,
  `app/verify/actions.ts`, `app/schools/mou/actions.ts`) · `components/{film,site,motion,brand,ui}` primitives ·
  `components/sections/<page>/` page sections · `lib/` logic (`leads`, `email`, `documents`, `storage`, `auth`,
  `supabase`, `security`, `verify`, `payments`, `monitoring`, `admin`, `motion`, `content`) · `supabase/` SQL ·
  `tests/` node tests · `scripts/` browser checks · `public/` media (WebP stills, videos, GLB models).
- **Performance architecture:** heavy client work starts when its section approaches the viewport
  (`lib/motion/near-viewport.ts`, `use-near-viewport.ts`); offscreen loops pause; stills ship as WebP
  (`lib/content/media.ts` → `mediaSrc`). Reduced motion is honoured everywhere (no zoom, parallax, auto-advance).
- **Effects** (24 Oct 2026): shared primitives in `components/motion/fx/` (film grain, ember trail, brass border, seal
  ring, velocity marquee, morph gallery, masked word, expanding frame, ASCII ripple, curtain chapters, depth ribbon) and
  two 3D/interactive scenes (`components/sections/tournaments/PegRun.tsx`, `components/sections/anatomy/DualBody.tsx`
  with its three.js engine in `dual-body/`). Rules they follow: role tokens only, decorative layers `aria-hidden`, a
  still or static layout under reduced motion, WebGL started only near the viewport and its context released on unmount.
- **Media that is not ours yet (third-party dependency).** Everything below is loaded from the image provider's CDN,
  not from this repository. The CSP names the three origins (`d8j0ntlcm91z4.cloudfront.net`,
  `d2ol7oe51mr4n9.cloudfront.net`, `images.higgs.ai`); there is no integrity check, and if the provider removes or renames
  a file the page shows its gradient placeholder.

  | What | Where it is used | How it is loaded | Size |
  | --- | --- | --- | --- |
  | Eight stills (peg-run stages, academy morning): `cdnOnly(...)` in `lib/content/media.ts` | `/tournaments`, `/parents`, `/about` ribbon | through the provider's resizer as WebP (`w=1920`, q 82) | 0.2 to 0.8 MB each (the PNG masters are 7.2 to 8.0 MB) |
  | 21 journal images (`_min.webp`) | `/journal` sphere (`FieldSphereHero`) | direct | 6.2 MB in all |
  | Six videos with no local copy | `/fleet` (4), `/legend` (1), `/curriculum` (1) | direct | 3.6 to 15.1 MB each |
  | Two videos with a local first choice | footer, `/why` | direct, only if the local file fails | 3.6 and 5.1 MB |
  | Two hero images | `LithosHero` (no route renders it today) | through the resizer | about 0.13 MB measured for one |

  The other 60 keys in `media.ts` ship as WebP files in `public/media/` (68 keys in all). **To finish the job:** run
  `sh scripts/fetch-media.sh` on the Mac in the project folder (the cloud workspace and the Mac's Linux VM cannot reach
  the CDN), commit the eight new WebPs, switch `cdnOnly(...)` to `m(...)` in `lib/content/media.ts` and update
  `tests/media.test.mjs`; then decide whether to self-host the journal images and the videos too. Self-hosting also
  settles the licence question (`BUSINESS_LEGAL_REVIEW.md` D8).

## 2. How the backend works

There is no separate server: the backend is Next.js server code on Vercel plus Supabase.
- **Server actions** validate every input with zod and never trust the browser.
- **Supabase** is reached with the publishable key (RLS applies) for anonymous work, with the signed-in user's
  session for staff work, and with the secret key only to write generated PDFs into the private bucket.
- **Third parties:** Resend (e-mail), Formspree (inbox/backup), optional webhook, optional Turnstile.

## 3. How enquiries are stored and delivered

`components/sections/shared/LeadForm.tsx` → `submitLead` in `app/actions.ts`:
1. Validate (zod per gate: parents, schools, partners, audit, mou, hub, generic), require consent, honeypot.
2. Rate limit (memory + `consume_rate_limit`), optional Turnstile.
3. **Supabase** `submit_lead_v2` → `onboarding_leads` (+ mirror into `mou_requests` / `executive_appointments` /
   `qr_lead_captures`). Duplicate idempotency key → "already received", nothing re-sent.
4. **Formspree** server-side forward of the validated fields.
5. Optional **webhook**.
6. **Resend** staff notification (and, when enabled, an applicant receipt).
7. Success is shown only if at least one durable channel accepted it; otherwise the visitor is told to contact the
   office directly. One log line per enquiry: `{"event":"lead.received","gate":…,"channels":[…]}`.
8. MOU enquiries also store the exact draft as a private PDF (`generated_documents` + `private-documents`).
QR codes: any page opened with `?qr=<code>` (or `?hub=`) carries the code into the enquiry's `attribution`; cadet
enquiries with a code are mirrored into `qr_lead_captures` (`source = website-qr`).

## 4. How staff use the admin panel

URL: `/admin` (sign-in at `/admin/login`). Staff = Supabase Auth users whose `public.users.role` is `SUPER_ADMIN`.
To add a staff member: Supabase → Authentication → Add user (their e-mail) → SQL editor:
`update public.users set role = 'SUPER_ADMIN' where id = (select id from auth.users where email = '<their e-mail>');`
Sections: Enquiries (search, filters, status, assign), enquiry detail (documents + audit trail), MOU requests, QR
captures, Audit log, Documents (5-minute signed PDF links), Media (validated uploads to `website-assets`).
Forgotten password: `/admin/reset` (links work on previews and on the addresses in the Auth redirect allow-list).
Details and the post-deploy checklist: `docs/ADMIN_CONSOLE.md`.

## 5. How notifications work

`lib/email/resend.ts` (REST, no SDK). Each send carries an idempotency key (`lead-notify/<reference>`), so retries never
duplicate. Until `blackstallion.academy` is verified in Resend, the sender is `onboarding@resend.dev`, which can only
deliver to the Resend account owner — that is why `LEAD_NOTIFY_EMAIL` is the owner's address and applicant receipts are
off. Server errors can also alert by e-mail (`ERROR_ALERT_EMAIL`, throttled).

## 6. How PDFs are generated

`lib/content/mou.ts` holds the MOU draft text (the same six paragraphs as the on-page draft; unsigned signature lines;
"draft only" footer). `lib/documents/mou-pdf.ts` renders an A4 PDF with pdf-lib. The trustee downloads it from
`/schools/mou`; when a MOU enquiry is stored, `lib/documents/store.ts` saves the same PDF to `private-documents` and
records it in `generated_documents`. No invented clauses, figures or signatures.

## 7. How storage permissions work

| Bucket | Read | Write | Limits |
| --- | --- | --- | --- |
| `website-assets` | public | staff (`SUPER_ADMIN`) | PNG/JPEG/WebP ≤ 4 MB, type sniffed from bytes |
| `user-uploads` | owner folder or staff | owner folder | images + PDF |
| `private-documents` | staff, via 5-minute signed URLs | staff / server (secret key) | PDF ≤ 20 MB |
| operations buckets (`session-videos`, `proof-photos`, `invoices`, `site-assets`) | unchanged | unchanged | owned by the operations apps |

## 8. How deployments work

GitHub `blackstallion-org/blackstallion.academy` → Vercel project `blackstallion-academy` (team `blackstallion`).
Any pushed branch builds a protected **preview**; `main` builds **production** (`blackstallion-academy.vercel.app`).
CI (`.github/workflows/ci.yml`) runs lint, types, unit tests, build, dependency audit, both database suites and the
browser smoke tests on every push and pull request. Release, smoke tests and rollback: `docs/DEPLOYMENT_RUNBOOK.md`;
the order of the launch steps and the gates: `docs/LAUNCH_INSTRUCTIONS.md`.

Facts that matter before launch: the Vercel team is on the **Hobby plan**, which is for non-commercial use (a commercial
site needs Pro, $20 per user per month, an owner decision). Deployment Protection is "Standard", which protects previews
only, so the merge of 24 Oct 2026 published the site on `project-t9r95.vercel.app` (the owner's choice); setting it to
"All Deployments" makes production private again (`LAUNCH_INSTRUCTIONS.md` §2.1). `vercel.json` pins the functions
to Seoul (`icn1`), next to the database. `main` has no branch protection yet (runbook §6). The release vehicle, pull
request #1, has been merged.

## 9. How to restore from a backup

Database: `docs/DATABASE_ARCHITECTURE.md` §7 (the project is on the Supabase Free plan, which keeps **no backups**; the
`pg_dump`/`pg_restore` routine and its extra steps are in the runbook §8.3 to §8.4 and were rehearsed locally, 12/12;
schema rebuild from `supabase/live/`; the private PDFs in storage need their own copy). Site: Vercel → Deployments → previous good deployment → Promote (instant). Code: revert the release
commit (never force-push). Local pre-session snapshots: `_session_snapshots/` and the git tag
`checkpoint/pre-final-2026-10-23`.

## 10. How to diagnose failures

| Symptom | Where to look | Typical cause |
| --- | --- | --- |
| Enquiry shows "could not be confirmed" | Vercel → Logs: `lead.db_rejected`, `lead.db_unreachable`, `formspree.rejected`, `email.rejected` | wrong/rotated key, Supabase paused, Formspree form disabled |
| Enquiry stored but no e-mail | Resend → Emails; log `email.rejected` (status) | domain not verified, recipient not the account owner |
| `/verify` says "not available" | Supabase `site_settings.verify_public`; env `SUPABASE_URL` | switched off by operations, or env missing |
| Staff cannot sign in | Supabase → Auth users; `public.users.role` | not `SUPER_ADMIN`, unconfirmed e-mail |
| Reset link opens localhost / fails | Supabase → Auth → URL configuration | address missing from the redirect allow-list |
| 500 error | Vercel → Logs: `server.error` (route, digest, redacted message); alert e-mail if configured | code or data error |
| Blank stills on a deployment | `tests/media.test.mjs`; request `/media/<name>.webp` | a key points at a git-ignored PNG master |
| A still or video stays a gradient although the file name is right | browser network tab for the CDN host; the media table in §1 | the image provider removed or renamed the file, its host is missing from the CSP (`next.config.mjs`), or the sandbox/network blocks it |
| Two `ERR_INVALID_URL` console errors on `/schools` | `components/sections/schools/CitadelConfigurator.tsx`, the `royal` entry | its embedded base64 thumbnail has a missing character; `CitadelHubImage` falls back to the plan drawing, so nothing looks broken; replace the thumbnail with the original image (known, minor) |
| A 3D or WebGL scene shows only its still | browser console (WebGL errors), `chrome://gpu` | no WebGL, too many live contexts, a CDN still without CORS (the peg-run gallery then cross-fades) |
| Slow page | `docs/PERFORMANCE_REPORT.md` method; Vercel Speed Insights if enabled | new eager client work, large media |

## 11. Mobile apps

The apps share this Supabase project. What exists today, what the website added, and what is only planned:
`docs/MOBILE_BACKEND_CONTRACTS.md`.
