# Deployment runbook (23 Oct 2026)

The owner approved a production deployment on the free `*.vercel.app` address with indexing off and no DNS change
(23 Oct 2026). DNS, search indexing, live payments and e-mail to applicants still each need explicit approval.
Current status and blockers: `PRODUCTION_READINESS.md`.

## 1. Before the first deploy

| Check | Command / place | Pass condition |
| --- | --- | --- |
| Dependencies match the lockfile | `npm ci` | exits 0 (on the Mac, run once after pulling: it installs Next.js 16.4.2) |
| Lint | `npm run lint` | 0 errors |
| Types | `npm run typecheck` | exits 0 |
| Unit + server tests | `npm test` | all pass (43 node tests + trustee crypto script) |
| Production build | `npm run build` | exits 0 (all routes incl. `/admin/*` and the Proxy) |
| Browser smoke | `npm run build && npm run test:e2e` | 18/18 pass; `output/e2e/results.json` |
| Database tests (website schema) | `bash supabase/tests/run.sh` (as a non-root user, Postgres 16 binaries) | 176 passed, 0 failed |
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
| `NEXT_PUBLIC_LOCAL_MEDIA` | Serve stills from `public/media` | Leave empty on Vercel: the PNGs are git-ignored, so stills load from the CDN copy |

### Database bootstrap (new project `tgwadczrfbljnepoaqtb`)

1. SQL editor → run `supabase/combined/bsah_website_schema.sql` once (all eight migrations; additive and idempotent).
2. Authentication → Add user (owner e-mail) → then
   `update public.profiles set role = 'executive_admin' where id = (select id from auth.users where email = '<owner e-mail>');`
3. Authentication → URL configuration: Site URL = production address; redirect URL `<address>/auth/confirm`.
4. Check: Storage shows `website-assets`, `user-uploads`, `private-documents`; `/admin` sign-in works.

## 3. Staging (preview) deploy

1. Deploy the release commit to a protected preview URL with `NEXT_PUBLIC_ALLOW_INDEXING` empty.
2. Confirm response headers on `/`: `content-security-policy`, `strict-transport-security`, `x-frame-options: DENY`.
3. Open the browser console on `/`, `/anatomy`, `/statue`, `/fleet`, `/parents`, `/schools/mou`, `/verify`: no CSP
   "Refused to…" messages, 3D scenes load, hero video plays.
4. Submit one synthetic lead per gate (name "QA Synthetic", `@example.test` address). Confirm each reaches the
   database and the webhook once; then delete the synthetic rows as an admin.
5. Check `/robots.txt` disallows everything on the preview.

## 4. Production

1. Owner approval recorded (who, when, which commit).
2. Point DNS for `blackstallion.academy` to the host; wait for TLS.
3. Set `NEXT_PUBLIC_ALLOW_INDEXING=1`, redeploy, submit `https://blackstallion.academy/sitemap.xml` to search consoles.
4. Re-run step 3 checks on the production URL.

## 5. Rollback

- Hosting: promote the previous deployment (instant on Vercel). Keep the last known-good deployment pinned.
- Code: revert the release commit; never force-push.
- Database: the website-intake migration is additive; see `docs/DATABASE_RECONCILIATION.md` → Rollback.
- Local working tree before 23 Oct changes: `_session_snapshots/2026-10-23-pre-session/` (patch + archive).

## 6. Still missing before a production launch (tracked in `PRODUCTION_READINESS.md`)

Live database (schema applied to the new project), live e-mail proof, monitoring (Sentry,
uptime), consent-aware analytics, backup/restore drill with recorded RTO/RPO, legal sign-off on privacy notice and
minors' data (B06), licensed media and models (B04), real hub/fleet/credential data (B05).
