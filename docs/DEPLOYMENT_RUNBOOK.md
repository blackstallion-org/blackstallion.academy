# Deployment runbook (23 Oct 2026)

Current state: the site runs on a protected Vercel **preview** (indexing off, no DNS change). The later "Full
Autonomous Production Setup" directive asks for approval before the public launch, so promotion to production
(`blackstallion-academy.vercel.app`), DNS, search indexing, live payments and e-mail to applicants each still need the
owner's explicit approval.
Current status and blockers: `PRODUCTION_READINESS.md`.

## 1. Before the first deploy

| Check | Command / place | Pass condition |
| --- | --- | --- |
| Dependencies match the lockfile | `npm ci` | exits 0 (on the Mac, run once after pulling: it installs Next.js 16.4.2) |
| Lint | `npm run lint` | 0 errors |
| Types | `npm run typecheck` | exits 0 |
| Unit + server tests | `npm test` | all pass (46 node tests + trustee crypto script) |
| Production build | `npm run build` | exits 0 (all routes incl. `/admin/*` and the Proxy) |
| Browser smoke | `npm run build && npm run test:e2e` | 18/18 pass; `output/e2e/results.json` |
| Database tests (website schema) | `bash supabase/tests/run.sh` (as a non-root user, Postgres 16 binaries) | 176 passed, 0 failed |
| Database tests (live project replica) | `bash supabase/live/tests/run.sh` | 75 passed, 0 failed |
| Dependency audit | `npm audit --omit=dev --audit-level=high` | 0 high/critical |
| CI | GitHub Actions `ci` workflow (`.github/workflows/ci.yml`) | green on the release commit |

## 2. Environment variables (hosting dashboard; never in git)

| Variable | Needed for | Notes |
| --- | --- | --- |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Lead storage, rate limits, `/verify`, staff sign-in | New-format publishable key (sent only as `apikey`) |
| `SUPABASE_SECRET_KEY` | Writing generated MOU PDFs to the private bucket | Server only; never `NEXT_PUBLIC_`. Mark **sensitive** |
| `NEXT_PUBLIC_SITE_URL` | Links in auth e-mails | Optional; falls back to the request origin |
| `FORMSPREE_ENDPOINT` | Inbox/backup copy of every validated enquiry | `https://formspree.io/f/<id>` |
| `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL` | Staff notification per enquiry | Until the domain is verified only the Resend account owner can receive mail |
| `RESEND_FROM`, `RESEND_CONFIRMATIONS` | Branded sender, applicant receipts | Leave empty until `blackstallion.academy` is verified in Resend |
| `RATE_LIMIT_SALT` | Rate limiting | 32+ random characters |
| `LEAD_WEBHOOK_URL`, `LEAD_WEBHOOK_SECRET` | Optional CRM hook | Receiver must de-duplicate on the `idempotency-key` header |
| `TRUSTEE_SESSION_SECRET`, `TRUSTEE_INVITATIONS_JSON` | `/schools/access` | Only SHA-256 hashes of invitation codes |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Anti-bot | Both or neither |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `robots.txt` | `1` on approved production only; empty everywhere else |
| `NEXT_PUBLIC_LOCAL_MEDIA` | Serve the PNG masters from `public/media` | Leave empty on Vercel: the PNGs are git-ignored, so deployments load the shipped WebP copies |

### Database (live project `tgwadczrfbljnepoaqtb`)

The project already runs the operations schema, so the website is an additive layer (`supabase/live/README.md`).
**Do not apply `supabase/migrations/` or `supabase/combined/` to it.**

1. Applied on 23 Oct 2026 with the owner's approval: `supabase/live/migrations/20261023001000_website_layer.sql`, then
   `20261023001100_security_fixes.sql`. Both are idempotent; rollback: `supabase/live/rollback/`.
2. Website staff are operations users with `role = 'SUPER_ADMIN'`.
3. Authentication → URL configuration (owner approval): Site URL = production address; redirect URLs
   `https://blackstallion-academy.vercel.app/**`, `https://blackstallion-academy-*-blackstallion.vercel.app/**`.
4. Check: Storage shows `website-assets`, `user-uploads`, `private-documents`; `/admin` sign-in works.

## 3. Staging (preview) deploy

1. Deploy the release commit to a protected preview URL with `NEXT_PUBLIC_ALLOW_INDEXING` empty.
2. Confirm response headers on `/`: `content-security-policy`, `strict-transport-security`, `x-frame-options: DENY`.
3. Open the browser console on `/`, `/anatomy`, `/statue`, `/fleet`, `/parents`, `/schools/mou`, `/verify`: no CSP
   "Refused to…" messages, 3D scenes load, hero video plays.
4. Submit one synthetic lead per gate (name "QA Synthetic"). Confirm each reaches the database, Formspree and Resend
   once: Vercel → Logs shows `lead.received` with its `channels`. Delete the synthetic rows afterwards (owner approval).
5. Check `/robots.txt` disallows everything on the preview.

## 4. Production

1. Owner approval recorded (who, when, which commit).
2. Merge the release branch into `main` (Vercel's production branch); production deploys to
   `blackstallion-academy.vercel.app`. Re-run the step 3 checks there.
3. Custom domain (separate approval): point DNS for `blackstallion.academy` to Vercel; wait for TLS.
4. Indexing (separate approval): set `NEXT_PUBLIC_ALLOW_INDEXING=1`, redeploy, submit `/sitemap.xml` to search consoles.

## 5. Rollback

- Hosting: promote the previous deployment (instant on Vercel). Keep the last known-good deployment pinned.
- Code: revert the release commit; never force-push.
- Database: the live website layer is additive; `supabase/live/rollback/20261023001000_website_layer_rollback.sql` removes only its objects (owner approval).
- Local working tree before 23 Oct changes: `_session_snapshots/2026-10-23-pre-session/` (patch + archive).

## 6. Still missing before a production launch (tracked in `PRODUCTION_READINESS.md`)

Owner approvals (production promotion, Auth URLs, DNS, Resend domain, key rotation), monitoring (Sentry,
uptime), consent-aware analytics, backup/restore drill with recorded RTO/RPO, legal sign-off on privacy notice and
minors' data (B06), licensed media and models (B04), real hub/fleet/credential data (B05).
