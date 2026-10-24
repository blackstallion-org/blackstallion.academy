# Launch instructions (prepared 24 Oct 2026)

**Nothing in this file has been done.** It is the order of work for the day the owner decides to go live. Each of the
five steps in section 1 needs its own explicit "go" and can be undone on its own (section 5 says how). No secret value
appears here; no business term or legal approval is invented (open decisions are named D1–D12 and live in
`docs/BUSINESS_LEGAL_REVIEW.md`). Current state: protected Vercel previews only, no production deployment, `main` is
the original boilerplate and unprotected, indexing off, no DNS change.

## 1. Five separate approvals

| Step | What it does | Public effect | Undo |
| --- | --- | --- | --- |
| 1. Merge the release pull request into `main` | Vercel's production branch is `main` (checked 24 Oct: Settings → Environments → Production → Branch Tracking), so the merge creates the first production deployment at `blackstallion-academy.vercel.app` | **Public by default** — see 2.1; with the safeguard in 2.1 it stays private | revert the merge (new commit), or fix forward |
| 2. Add the custom domain and its DNS records | `blackstallion.academy` and `www` start serving the production deployment | none while production stays protected | remove the domain in Vercel and restore the old DNS records |
| 3. Verify the sending domain in Resend | branded sender and optional receipts | none (e-mail only) | remove the Resend records; unset `RESEND_FROM` |
| 4. Open production to the public | switch Vercel protection from "All Deployments" to "Standard Protection" | **the site becomes public** | switch it back (immediate) |
| 5. Allow search indexing | `NEXT_PUBLIC_ALLOW_INDEXING=1` on Production, redeploy, sitemap submitted | search engines may list the pages | unset, redeploy, request removal in the search console |

Keep them in this order. Steps 1–3 can be finished and tested while nobody else can see the site; step 4 is the real
launch; step 5 is last, a day or more after step 4, once the first enquiries have proved the pipeline.

## 2. Before step 1

### 2.1 Keep the first production deployment private (one setting)

Vercel's default "Standard Protection" protects previews and generated deployment addresses but **not production
domains** (Vercel documentation, "Deployment Protection", updated 15 Sep 2026), so the moment the merge deploys,
`blackstallion-academy.vercel.app` answers anyone. The page would be `noindex`, unlinked and unfinished, but public.
Avoid it: Vercel → Project → Settings → Deployment Protection → Vercel Authentication → change the scope to **All
Deployments** → Save. The same page says this scope is available on every plan and needs no paid add-on. The setting
is currently "Standard Protection". Because it is a security setting I have not changed it; it needs the owner's "go".

Side effects while it is on: only signed-in members of the Vercel team can open production (the owner can test it in
the browser); the GitHub `uptime` workflow cannot reach it, so leave `UPTIME_URL` unset until step 4; the custom
domain is protected too, so steps 2–3 can be finished before launch.

### 2.2 Gates

"Public" means "before step 4". Status is as of 24 Oct; the evidence is in the document named.

| # | Gate | Needed before | Who | Status | Where |
| --- | --- | --- | --- | --- | --- |
| G1 | Branch protection on `main` (pull request, checks `verify` `database` `e2e`, no force-push, administrators included) | step 1 | owner (two minutes in GitHub settings) | not applied; the build token has no Administration permission | runbook §6 |
| G2 | Release pull request is green on CI and its preview passes the runbook §2 checks | step 1 | assistant | the draft pull request in §10 is the vehicle; CI was green on the branch head at the last push (re-check after any later commit) | this file, §6 |
| G3 | Logical backup of the Supabase database and Storage files, row counts written down | step 1 and before any live database change | owner (needs the database password) | **none exists**; Free plan has no backups | runbook §8.3 |
| G4 | Owner's staff account exists (Auth → Add user, "Auto Confirm"), mapped to `SUPER_ADMIN`, sign-in tested at `/admin/login` on production | public | owner signs in personally; assistant maps the role | waiting for the account | `docs/ADMIN_CONSOLE.md` |
| G5 | Decision on the privacy hardening migration `20261023001200_anon_privacy_hardening` (changes what anonymous clients of the shared database can read) | public | owner | prepared, replica-tested, **not applied**; no other consumer seen in 24 h of API logs | `supabase/live/HARDENING_NOTES.md` |
| G6 | Five `@test.com` seed accounts restricted or removed | public | owner approves, assistant executes | all five exist; none ever signed in | `docs/SECURITY_AUDIT.md` S8 |
| G7 | Synthetic QA rows and the test PDF removed | public | owner approves a listed set | listed in the final approval request | `docs/TEST_RESULTS.md` |
| G8 | Resend and Supabase secret keys rotated (both were pasted in a chat) | public | owner creates the new keys and pastes them into Vercel; assistant verifies | not started | `docs/ENVIRONMENT_VARIABLES.md`, rotation procedure |
| G9 | Privacy notice corrected: storage region (Seoul, not Mumbai — D5), retention, grievance officer (D6); the `privacy@` mailbox exists | public | owner and counsel | notice still marked draft | `docs/BUSINESS_LEGAL_REVIEW.md` §5 |
| G10 | Business and legal decisions D1–D4, D7, D8, D10–D12 answered; D9 (terms, refunds, registration details) before any payment | public | owner and counsel | none answered | same file, §0 |
| G11 | Vercel **Pro** ($20 per user per month; Hobby is non-commercial only) | public | owner | on Hobby | same file, §10 |
| G12 | Supabase plan decision: Pro from $25 per month per organisation (daily backups, no pausing) or documented manual dumps; one restore rehearsal into a scratch project | public | owner | not decided | runbook §8.2, §8.5 |
| G13 | Eight stills self-hosted (currently loaded from the image provider's CDN) | public, recommended | owner runs `sh scripts/fetch-media.sh` on the Mac, or approves a terminal step; assistant converts and commits | not done: the sandbox cannot reach that CDN | `docs/PERF_NOTES.md` |
| G14 | Spam protection: Cloudflare Turnstile keys (free) | public, recommended | owner creates the widget and pastes two keys | coded, off | runbook §7 |
| G15 | Image, 3D and audio licences confirmed; AI placeholder imagery accepted or replaced (D8) | public | owner | not verified | `docs/BUSINESS_LEGAL_REVIEW.md` §7 |
| G16 | The person who can edit the domain's DNS is known, and every existing record is written down or screenshotted first (`sting@blackstallion.academy` receives mail, so the mail records must not change) | step 2 | owner | not checked | 4 below |

## 3. Step 1 — merge

1. Confirm 2.1 is done (scope = All Deployments) and G1–G3 are done.
2. Open the release pull request (`session/2026-10-24-final-completion` → `main`), wait for `verify`, `database`, `e2e`,
   read the Vercel preview comment, merge with a **merge commit** (keeps the history as written; never force-push).
3. Vercel builds Production. Check: Deployments shows "Production — Ready" for the merge commit; the build log has no
   warnings about missing variables (all eight project variables apply to Production: `SUPABASE_URL`,
   `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL`, `FORMSPREE_ENDPOINT`,
   `RATE_LIMIT_SALT`, `TRUSTEE_SESSION_SECRET`).
4. In the signed-in browser run runbook §2 steps 2–7 against `https://blackstallion-academy.vercel.app`, including one
   synthetic enquiry named "QA Synthetic Production" (confirm Supabase row, Formspree submission, Resend "Delivered",
   `/admin` row), sign in at `/admin/login` as the owner, and open `/api/health?deep=1` (`"db":"up"`).
5. Record the commit, the time and who approved.

## 4. Step 2 — custom domain (DNS)

Add only what Vercel shows; do not copy records from this file or another project (Vercel's own warning: use the values
displayed for your project). Do **not** move the nameservers to Vercel: that would require re-creating every mail
record, and mail for `blackstallion.academy` is in use. Adding a website record at the existing DNS provider does not
touch mail (Vercel documentation, "Adding & Configuring a Custom Domain", 16 Sep 2026).

1. Vercel → Settings → Domains → Add `blackstallion.academy`; accept the offer to add `www`. Choose which one redirects
   to the other (recommended: `www` redirects to the apex, so the canonical address in the sitemap and metadata,
   `https://blackstallion.academy`, is the real one).
2. At the DNS provider add the **A** record for the apex and the **CNAME** record for `www` exactly as the Domains page
   shows them. Remove only an older A, AAAA or CNAME record for the same host if the provider refuses to add the new one
   (conflicting records are the usual failure); change nothing else, above all not MX or TXT records.
3. Wait until the Domains page says "Valid Configuration" and the certificate is issued (minutes, sometimes longer while
   DNS propagates; the page has a Refresh button). Production is still protected, so a signed-in browser can now test
   `https://blackstallion.academy`.
4. Supabase redirect allow-list: `https://blackstallion.academy/**` is already there; add
   `https://www.blackstallion.academy/**` only if `www` is served without redirecting. Leave the Supabase **Site URL**
   (`http://localhost:3000`) alone: other applications use it, and the website's own reset link passes an explicit
   `redirectTo` (`app/admin/actions.ts`).
5. Vercel → Environment Variables → add `NEXT_PUBLIC_SITE_URL=https://blackstallion.academy` (Production) and redeploy,
   so reset e-mails always carry the canonical address.

## 5. Step 3 — sending domain (Resend)

Resend's documentation (Add and verify a domain) says to add the DKIM and SPF records it generates (`TXT` and `MX` or
`CNAME`, values must match exactly), recommends a **subdomain** such as `updates.blackstallion.academy` rather than the
root, and says verification often finishes within 15 minutes but DNS can take up to 72 hours; if it has not completed
after 72 hours use "Restart verification". The default return path is a `send` subdomain, so the records belong to
subdomains and should not replace anything on the root.

1. Resend → Domains → Add domain → the subdomain → copy each record Resend shows into DNS (same provider, same care as
   step 2: write down the existing records first and compare before saving).
2. When Resend shows "Verified", add the DMARC record Resend suggests (start with a monitoring policy).
3. Choose the sender **before** verifying. The From address must be on the verified domain, and a reply to an
   applicant receipt goes to that From address (receipts carry no Reply-To today; staff notifications do reply to the
   enquirer). A subdomain sender such as `office@updates.blackstallion.academy` has no mailbox, so replies to receipts
   would bounce. Either verify the root domain instead (Resend only recommends a subdomain; it does not require one) and
   use an address whose mailbox exists, or ask the assistant to add a Reply-To setting before receipts are switched on.
   Then set `RESEND_FROM="Black Stallion Academy <address on the verified domain>"` in Vercel, redeploy, send one test
   enquiry and confirm "Delivered".
4. Leave `RESEND_CONFIRMATIONS` unset until the privacy notice (G9) is signed off; `1` sends a receipt to the person who
   filled in the form.
5. `LEAD_NOTIFY_EMAIL` currently has to be the Resend account owner's address (Resend only delivers to it until a
   domain is verified); after verification add the staff addresses that should receive enquiries.

## 6. Step 4 — open to the public

Only when G4–G12 are done (G13–G14 strongly recommended).

1. Vercel is on Pro (G11). Vercel → Deployment Protection → Vercel Authentication → scope **Standard Protection** → Save.
2. Within five minutes: open `https://blackstallion.academy` in a private window (not signed in to Vercel) — it loads;
   `/robots.txt` still says `Disallow: /`; `/api/health?deep=1` says `"db":"up"`; submit one real-looking enquiry and watch
   it arrive everywhere (Supabase row, Formspree, Resend "Delivered", `/admin`).
3. GitHub → repository → Settings → Secrets and variables → Actions → Variables → `UPTIME_URL=https://blackstallion.academy`;
   run the `uptime` workflow once by hand and read its log (every path `200`, database up).
4. Optional now: `ERROR_ALERT_EMAIL` in Vercel, with an address the owner chooses (it receives server-error mails).
5. Watch Vercel → Logs and the `audit_events` table for the first hour.

## 7. Step 5 — indexing (a day or more later)

1. Vercel → `NEXT_PUBLIC_ALLOW_INDEXING=1` for **Production only** (it is read at build time, so redeploy).
2. Check `/robots.txt` now allows crawling and names `https://blackstallion.academy/sitemap.xml`, and that
   `/schools/access`, `/verify/`, `/admin`, `/auth/` stay disallowed.
3. Add the domain to Google Search Console and Bing Webmaster Tools (verification adds a DNS `TXT` record: it is a DNS
   change, so it needs its own approval), submit `/sitemap.xml`, and look at "Pages" after a few days.
4. Analytics (`NEXT_PUBLIC_VERCEL_ANALYTICS=1`) stays off until the owner decides and the privacy notice mentions it.

## 8. After launch

| When | Check |
| --- | --- |
| First hour | production deployment healthy; one enquiry end to end; no `server.error` lines; certificate valid; `www` redirects to the apex |
| First day | `uptime` workflow runs green (every 30 minutes); Supabase usage and Auth logs; Resend dashboard shows deliveries, no bounces |
| First week | read `audit_events`; review spam (honeypot and rate-limit hits); take the first scheduled backup (runbook §8.3); decide on the Turnstile, analytics and receipts switches |
| Every month | `npm audit`, Dependabot alerts, Supabase advisors (Security and Performance), rotate nothing unless a key leaked (rotation procedure in `docs/ENVIRONMENT_VARIABLES.md`) |

## 9. Undoing each step

| Step | Undo | Cannot be undone |
| --- | --- | --- |
| 1 merge | revert the merge commit through a pull request; while production is protected nobody outside the team has seen it | — |
| 2 domain | remove the domain in Vercel and put the old DNS records back (that is why they were written down) | DNS caches take time to follow |
| 3 Resend | remove the records at the DNS provider; unset `RESEND_FROM` and `RESEND_CONFIRMATIONS`, redeploy | e-mails already sent |
| 4 opening | scope back to All Deployments (immediate); or *Promote to Production* on an earlier deployment (Vercel → Deployments) once more than one exists | data real visitors entered; pages already fetched |
| 5 indexing | unset the variable, redeploy, use the search console's removal tool | copies already in search engines |

## 10. The draft release pull request

`session/2026-10-24-final-completion` → `main`, opened as a **draft** so it cannot be merged by accident. It carries no
secret and no vulnerability detail (the repository is public). Its description lists what changed, how it was tested
and links to this file. Marking it "ready for review" and merging it is step 1 and needs the owner's explicit approval.

Find it under the repository's *Pull requests* tab (filter: Draft). If it is not there, the compare page
`https://github.com/blackstallion-org/blackstallion.academy/compare/main...session/2026-10-24-final-completion` opens
the same change, and "Create draft pull request" recreates it with the description in this section.
