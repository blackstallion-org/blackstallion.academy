# BSAH website — handover (24 Oct 2026)

For whoever runs, changes or builds on the website next (including the mobile-app team). Status and evidence:
`PRODUCTION_READINESS.md`. Companion documents in `docs/`: `DATABASE_ARCHITECTURE.md`, `SECURITY_AUDIT.md`,
`PERFORMANCE_REPORT.md`, `TEST_RESULTS.md`, `DEPLOYMENT_RUNBOOK.md`, `ENVIRONMENT_VARIABLES.md`,
`MOBILE_BACKEND_CONTRACTS.md`, `ADMIN_CONSOLE.md`, `PERF_NOTES.md`, and the design source of truth `BLUEPRINT.md`.

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
browser smoke tests on every push. Release, smoke tests and rollback: `docs/DEPLOYMENT_RUNBOOK.md`.

## 9. How to restore from a backup

Database: `docs/DATABASE_ARCHITECTURE.md` §7 (plan-dependent; `pg_dump`/`pg_restore` routine; schema rebuild from
`supabase/live/`). Site: Vercel → Deployments → previous good deployment → Promote (instant). Code: revert the release
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
| Slow page | `docs/PERFORMANCE_REPORT.md` method; Vercel Speed Insights if enabled | new eager client work, large media |

## 11. Mobile apps

The apps share this Supabase project. What exists today, what the website added, and what is only planned:
`docs/MOBILE_BACKEND_CONTRACTS.md`.
