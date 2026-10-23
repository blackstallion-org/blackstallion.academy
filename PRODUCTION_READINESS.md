# BSAH website — production readiness (23 October 2026, evening)

Written for the "Full Autonomous Production Setup" directive (Layers 01–06). Every statement is backed by an observed
result or an explicit status. **Nothing below claims a live result that was not observed.** No credential appears in
this file, in git or in any log; they live only in the git-ignored `.env.local` on the Mac and in the Vercel project's
sensitive environment variables.

Status words: **LIVE** (observed working against the real service) · **TESTED** (automated tests pass against local
stand-ins) · **CODED** (written, not exercised) · **OWNER** (needs an owner action or approval) · **DEFERRED**.

## 1. Verdict

| Surface | Status | Evidence |
| --- | --- | --- |
| Public website on a Vercel **preview** | **LIVE (preview, protected, noindex)** | Preview built from the session branch; pages, headers, forms, `/verify` and e-mail checked on it (section 4) |
| Enquiries (all gates) | **LIVE** | Synthetic MOU and parent enquiries reached Supabase, Formspree and Resend; MOU PDF stored privately |
| Database (Supabase `tgwadczrfbljnepoaqtb`) | **LIVE** | Website layer + security fixes applied with approval; rolled-back live checks passed |
| E-mail (Resend) | **LIVE, limited** | Staff notifications delivered. Sender domain not verified, so only the account owner's address can receive mail |
| Formspree | **LIVE** | Server log shows `channels: ["database","formspree"]` for both test enquiries |
| Staff console `/admin` | **CODED + partly LIVE** | Guard, noindex and the reset form's generic answer verified. Sign-in not exercised (owner's password). Reset links will not work until the Auth URL settings are changed (OWNER, section 6) |
| Production (`blackstallion-academy.vercel.app`) | **Not deployed** | Waiting for launch approval. One accidental API production deployment was cancelled before it built |
| Payments | **DEFERRED** by instruction | No live payment path exists |
| Mobile apps, standalone Command Center | Out of scope | Not touched |

**Stage: preview-verified. Ready for production promotion once the owner approves (section 7).**

## 2. Where everything is

| Item | Value |
| --- | --- |
| GitHub | `blackstallion-org/blackstallion.academy` (**public**, owner decision). Branch `session/2026-10-23-production-integration` pushed; `main` is still the original boilerplate commit |
| CI | `.github/workflows/ci.yml`: `verify` (lint, types, unit tests, build, `npm audit`) and `database` (website-schema tests + live-replica tests on Postgres 16). Runs on every push |
| Vercel | Team `blackstallion`, project `blackstallion-academy`, Next.js, Node 22.x, Git-connected, production branch `main`, Vercel Authentication on previews |
| Vercel variables (sensitive, production + preview) | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL`, `FORMSPREE_ENDPOINT`, `RATE_LIMIT_SALT`, `TRUSTEE_SESSION_SECRET` |
| Deliberately unset | `NEXT_PUBLIC_ALLOW_INDEXING` (search engines stay out), `NEXT_PUBLIC_SITE_URL` (auth links use the request origin), `RESEND_FROM` / `RESEND_CONFIRMATIONS` (until the domain is verified), Turnstile keys (no account), payment keys, `NEXT_PUBLIC_LOCAL_MEDIA` |
| Supabase | Project `tgwadczrfbljnepoaqtb`. It already runs the **operations schema** (users with roles PARENT … SUPER_ADMIN, cadets, hubs, MOU requests, QR leads). The website is an additive layer on top: `supabase/live/` (see its README). **Never apply `supabase/migrations/` or `supabase/combined/` to this project** |

## 3. Database changes applied to the live project (owner-approved)

| Migration | What it adds | Tests |
| --- | --- | --- |
| `supabase/live/migrations/20261023001000_website_layer.sql` | `onboarding_leads`, append-only `audit_events`, `generated_documents`, `media_assets`; `submit_lead_v2` (consent, idempotency, best-effort mirror into `mou_requests` / `executive_appointments` / `qr_lead_captures`), `consume_rate_limit`, `verify_passport` (minimal disclosure, honours `site_settings.verify_public`); three buckets with nine storage policies. Website staff = `SUPER_ADMIN` | 75/75 on a replica of the live schema (`bash supabase/live/tests/run.sh`) |
| `supabase/live/migrations/20261023001100_security_fixes.sql` | F1: users can no longer change their own role, hub or active flag (trigger `users_guard_privileges`). F2: sign-up can no longer choose a role through user metadata; new accounts default to `PARENT` | Same suite; live sign-up injection check returned `PARENT` |
| Rollback | `supabase/live/rollback/20261023001000_website_layer_rollback.sql` (drops only the layer's objects) | Tested on the replica |

Live verification (wrapped in a transaction that was rolled back, output in
`docs/evidence/2026-10-23-live-supabase-check.md`): RLS on all four tables; anonymous submit stored and mirrored;
duplicate detected; anonymous read denied; rate limit allows then blocks; no-consent refused; a parent account reads
nothing, cannot promote itself and cannot write private files; a super admin reads and updates leads, uploads and records
documents; a real passport code verifies (rank and issue date only); unknown codes answer "unknown".

## 4. Live checks on the preview deployment

| Check | Result |
| --- | --- |
| Headers | CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, `x-robots-tag: noindex`; `robots.txt` = `Disallow: /` |
| `/admin` | Redirects to sign-in; sign-in and reset pages are `noindex`, `private, no-store` |
| MOU enquiry (`/schools/mou`, synthetic "QA Synthetic School (live test)") | "Received" shown; `onboarding_leads` row with consent and UTM; `mou_requests` mirror (PENDING); MOU PDF in `private-documents` with a `generated_documents` row; audit rows; Formspree accepted; Resend notification delivered |
| Parent enquiry with QR attribution (`/parents?qr=qa-live-test`) | "Received"; lead stored with `qr` attribution; mirrored into `qr_lead_captures` (source `website-qr`); Formspree accepted; Resend sent |
| `/verify` | Sample code → record labelled "SAMPLE RECORD · DEMO DATA"; unknown code → "No sealed record matches this code" (answer from the live registry) |
| Password reset form | Unknown address → the same generic answer as a real one (no account discovery) |
| Images | **Defect found and fixed in this pass:** stills pointed at PNG masters that are not in git, so they were blank on Vercel. Stills now load their shipped WebP copies; `tests/media.test.mjs` guards it. Confirmed on the next preview (commit `03e8d2b`): `/`, `/legend`, `/fleet`, `/verify` load with no failed requests and no broken images |

Synthetic test rows are still in the live tables (two leads, one MOU request, one QR capture, one document row and its
PDF). Deleting them needs the owner's approval (section 7).

## 5. Quality evidence

| Check | Result |
| --- | --- |
| `npm run lint` | 0 errors, 8 pre-existing warnings |
| `npm run typecheck` | pass |
| `npm test` | trustee crypto script + **46/46** node tests (adds the media-path guard) |
| `bash supabase/tests/run.sh` | 176/176 (website schema, kept for a fresh project) |
| `bash supabase/live/tests/run.sh` | 75/75 (replica of the live operations schema + website layer + fixes + rollback) |
| `npm run build` | pass |
| GitHub Actions | runs #1–#4 green on the pushed branch (`verify` + `database` jobs) |

Lighthouse 12 against a local production build (indicative only: no CDN, lab throttling, some media absent locally):

| Page | Mobile perf | Desktop perf | Accessibility | Best practices | SEO |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 37 (TBT 3.8 s) | 78 | 94 → **97** after the fix below | 96 | 69* |
| `/parents` | 63 | 95 | 96 | 96 | 69* |
| `/schools/mou` | 68 | 97 | 96 | 96 | 69* |
| `/verify` | 67 | 93 | 96 | 96 | 69* |
| `/admin/login` | 68 | 98 | 100 | 93–96 | 69* |

\* SEO is capped only by "page is blocked from indexing", which is deliberate until launch.

Fixed in this pass: editorial headline lines no longer carry an `aria-label` on a plain `<span>` (axe
`aria-prohibited-attr`, 14 instances on the home page); reel numbers on 24 labels now match the reel list (they were
one behind since `/statue` became reel 03; `/verify` showed "REEL 11" while its end card said reel 12).

Open quality items (not changed, design decisions for the owner):

- Mobile performance on `/` is held back by JavaScript (GSAP, Lenis, 3D, WebGL): 3.8 s total blocking time in the lab.
  Options: lazy-mount the 3D/WebGL scenes below the fold, defer the loader, trim GSAP plugins per route.
- Lighthouse flags the scroll "text reveal" words that sit at 35 % opacity before they are scrolled into view (colour
  contrast). Screen readers get the full text; sighted users see full contrast once revealed. Raising the resting
  opacity would change the effect, so it is left as designed.
- About 140 MB of media in `public/` is unreferenced (`docs/MEDIA_INVENTORY.md`); removing it would speed up builds.

## 6. Security notes

- Secrets only in Vercel (sensitive) and `.env.local`; nothing in git, CI or logs. Logs record event names and statuses only.
- The public repository contains no secrets; `.env.example` holds placeholders only.
- Supabase Auth URL configuration is still the default: Site URL `http://localhost:3000`, no redirect URLs. Password
  reset links would therefore point at localhost. Changing it is an owner decision because other apps on this project
  may rely on the Site URL.
- Other operations-schema findings (not changed; not part of the website): CCTV stream URLs readable by anyone, achievements
  public, open anonymous inserts on some tables, hub revenue figures public. Fixes are ready to draft on request.
- No bot challenge (Turnstile) yet: forms rely on the honeypot, consent, idempotency and per-IP rate limits.
- The Resend API key and Supabase secret key were pasted into a chat earlier; rotate them (owner approval, section 7).
- A temporary fine-grained GitHub token was used for the pushes; its local copies are deleted. Delete the token itself
  in GitHub → Settings → Developer settings → Fine-grained tokens ("claude-bsah-push-2026-10-23").

## 7. Owner approvals still required

1. **Production promotion** to `blackstallion-academy.vercel.app` (merge the session branch into `main`, which Vercel
   deploys to production). Indexing stays off unless approved separately.
2. **Supabase Auth URL configuration**: Site URL and redirect URLs (`https://blackstallion-academy.vercel.app/**`,
   `https://blackstallion-academy-*-blackstallion.vercel.app/**`, later `https://blackstallion.academy/**`).
3. **First staff account**: the owner signs in (or sets `users.role = 'SUPER_ADMIN'` for their own user) and tests `/admin`.
4. **Delete the synthetic QA rows** listed in section 4.
5. **DNS** for `blackstallion.academy` and **Resend domain verification**, then `RESEND_FROM` and applicant receipts.
6. **Search indexing** (`NEXT_PUBLIC_ALLOW_INDEXING=1`) after launch.
7. **Key rotation** for the pasted Resend and Supabase secret keys (affects other services using them).
8. Optional: fixes for the operations-schema findings in section 6; Turnstile; error tracking and uptime monitoring;
   Supabase backups (the free plan has no point-in-time recovery).
