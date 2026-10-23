# Deployment runbook (24 Oct 2026)

Current state: protected Vercel **previews** only; no production deployment, indexing off, no DNS change. Production
promotion, DNS, search indexing, live payments and e-mail to applicants each need the owner's explicit approval.
Status and blockers: `PRODUCTION_READINESS.md`. Variables: `docs/ENVIRONMENT_VARIABLES.md`.

## 1. Release checklist (all must pass on the release commit)

| Check | Command / place | Pass condition |
| --- | --- | --- |
| Dependencies | `npm ci` | exits 0 (on the Mac run it once after pulling) |
| Lint | `npm run lint` | 0 errors |
| Types | `npm run typecheck` | exits 0 |
| Unit + server tests | `npm test` | trustee script + 79 node tests pass |
| Production build | `npm run build` | exits 0 |
| Browser smoke | `npm run build && npm run test:e2e` | 18/18; results in `output/e2e/` |
| Database (website schema) | `bash supabase/tests/run.sh` (non-root, Postgres 16) | 176 passed |
| Database (live replica) | `bash supabase/live/tests/run.sh` | 179 passed |
| Dependency audit | `npm audit --omit=dev --audit-level=high` | 0 high/critical |
| CI | GitHub Actions `ci` (jobs `verify`, `database`, `e2e`) | green |

## 2. Preview (every pushed branch)

1. Push the branch; Vercel builds a protected preview (Vercel Authentication). CI runs in parallel.
2. Headers on `/`: CSP, HSTS, `x-frame-options: DENY`, `x-robots-tag: noindex`; `/robots.txt` = `Disallow: /`.
3. Browse `/`, `/legend`, `/lore`, `/anatomy`, `/statue`, `/fleet`, `/parents`, `/schools/mou`, `/verify`: no failed
   requests or console errors (DevTools), stills and films load, 3D stages appear.
4. One synthetic enquiry (name "QA Synthetic"): Vercel → Logs shows `lead.received` with
   `channels: ["database","formspree"]` and `email.sent`; the row appears in `/admin`. Record it and ask the owner
   before deleting it (live data).
5. `/verify/<unknown code>` → "No sealed record matches this code"; a sample code → labelled SAMPLE.
6. `/admin` signed out → redirect to `/admin/login`; signed in as `SUPER_ADMIN` → enquiries, detail, MOU, QR, audit,
   documents and media pages load (checklist in `docs/ADMIN_CONSOLE.md`).

## 3. Production release (after approval)

1. Record the approval (who, when, which commit).
2. Open a pull request from the release branch into `main`; wait for CI; merge (no force-push). Vercel deploys
   production to `blackstallion-academy.vercel.app`.
3. Smoke test production with the §2 steps 2–6 (production is public: use one synthetic enquiry only).
4. Set the GitHub Actions variable `UPTIME_URL=https://blackstallion-academy.vercel.app` (uptime checks start) and,
   optionally, `ERROR_ALERT_EMAIL` in Vercel.
5. Separate approvals, in this order when wanted:
   a. **Custom domain:** Vercel → Domains → add `blackstallion.academy` (+ `www`), then the DNS records Vercel shows at
      the registrar; wait for TLS. Add `https://www.blackstallion.academy/**` to the Supabase redirect allow-list
      (`https://blackstallion.academy/**` is already there) and update `UPTIME_URL`.
   b. **Resend domain:** verify `blackstallion.academy` in Resend (DNS records), then `RESEND_FROM`, optional
      `RESEND_CONFIRMATIONS=1` and a receipt test.
   c. **Indexing:** `NEXT_PUBLIC_ALLOW_INDEXING=1` on Production only, redeploy, submit `/sitemap.xml`.

## 4. Database changes

Only `supabase/live/migrations/` (see `docs/DATABASE_ARCHITECTURE.md` §6). Pending: `20261023001200_anon_privacy_
hardening.sql` — pre-flight and verification queries in `supabase/live/HARDENING_NOTES.md`; apply in the Supabase SQL
editor after approval; rollback file next to it.

## 5. Rollback

- **Site:** Vercel → Deployments → last good production deployment → *Promote to Production* (instant).
- **Code:** revert the release commit on `main` (new commit; never force-push), let it redeploy.
- **Database:** each live migration has a rollback in `supabase/live/rollback/` (owner approval; roll back 001200
  before 001000).
- **Local:** git tag `checkpoint/pre-final-2026-10-23` and `_session_snapshots/` on the Mac.

## 6. Branch protection

`main` should accept changes only through pull requests with the `ci` checks green (GitHub → Settings → Branches →
rule for `main`: require a pull request, require status checks `verify`, `database`, `e2e`, block force pushes and
deletion). Status: see `PRODUCTION_READINESS.md`.
