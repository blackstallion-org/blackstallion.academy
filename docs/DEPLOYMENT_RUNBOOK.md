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
| Unit + server tests | `npm test` | trustee script + 84 node tests pass |
| Production build | `npm run build` | exits 0 |
| Browser smoke | `npm run build && npm run test:e2e` | 19/19; results in `output/e2e/` |
| Database (website schema) | `bash supabase/tests/run.sh` (non-root, Postgres 16) | 176 passed |
| Database (live replica) | `bash supabase/live/tests/run.sh` | 179 passed |
| Backup and restore rehearsal | `bash supabase/live/tests/backup_restore_rehearsal.sh` | 12 passed (section 8) |
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
7. `GET /api/health` → 200 `{"ok":true,"service":"bsah-web",…}`. `GET /api/health?deep=1` → 200 with `"db":"up"` and
   `dbMs` (the database round trip in milliseconds); 503 with `"db":"down"` when the database does not answer
   (previews are protected: open the address in the signed-in browser).

## 3. Production release (after approval)

1. Record the approval (who, when, which commit).
2. Open a pull request from the release branch into `main`; wait for CI; merge (no force-push). Vercel deploys
   production to `blackstallion-academy.vercel.app`. With the section 6 rule in place this is the only way in.
3. Smoke test production with the §2 steps 2–7 (production is public: use one synthetic enquiry only).
4. Set the GitHub Actions variable `UPTIME_URL=https://blackstallion-academy.vercel.app`, run the `uptime` workflow once
   by hand (Actions → uptime → Run workflow) and read its log: every path `200` and `database up`. Optionally set
   `ERROR_ALERT_EMAIL` in Vercel (section 7).
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
editor after approval; rollback file next to it. **Before any live change take a logical backup (section 8.3) and note
the row counts**: on the Free plan there is no other way back to the data.

## 5. Rollback

- **Site:** Vercel → Deployments → last good production deployment → *Promote to Production* (instant).
- **Code:** revert the release commit on `main` (new commit; never force-push), let it redeploy.
- **Database:** each live migration has a rollback in `supabase/live/rollback/` (owner approval; roll back 001200
  before 001000). Rollback files undo *our schema changes*; they cannot bring back deleted rows — that is what section 8
  is for.
- **Local:** git tag `checkpoint/pre-final-2026-10-23` and `_session_snapshots/` on the Mac.

## 6. Branch protection (prepared; not applied — the owner applies it)

State on 24 Oct 2026: `main` has **no protection**, so any push to it (including by a token) goes straight to
production once Vercel's production branch is `main`. The temporary token used for the build work has no
*Administration* permission, so only the repository owner can create the rule. Nothing in the code depends on it.

| Setting | Value | Why |
| --- | --- | --- |
| Require a pull request before merging | on; required approvals **0** (one-person repository), dismiss stale approvals on | every change to `main` is a visible PR with its CI result; raise approvals to 1 when a second maintainer exists |
| Require status checks to pass | `verify`, `database`, `e2e` | the three jobs of `.github/workflows/ci.yml`; the names must match exactly |
| Require branches to be up to date | on | the merged result is what CI tested |
| Require conversation resolution | on | open review comments block the merge |
| Block force pushes and deletions | on | history on `main` is permanent |
| Include administrators | on | the owner's own token, and any tool that uses it, also has to go through a pull request; in an emergency switch the rule off in Settings, fix, switch it back on |

**Apply it (owner, about two minutes):** GitHub → repository → Settings → Branches → *Add classic branch protection
rule* (or Settings → Rules → Rulesets → *New branch ruleset*, target `main`, same rules, empty bypass list), branch
name pattern `main`, then the settings above. Equivalent API call (needs a token with *Administration: write*, which
the owner may create for the purpose and delete afterwards):

```
PUT /repos/blackstallion-org/blackstallion.academy/branches/main/protection
{
  "required_status_checks": { "strict": true, "contexts": ["verify", "database", "e2e"] },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0, "dismiss_stale_reviews": true },
  "restrictions": null,
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

**Check it worked:** `GET /repos/blackstallion-org/blackstallion.academy/branches/main/protection` returns the rule; a
trial pull request shows the merge button disabled until `verify`, `database` and `e2e` are green; a direct
`git push origin main` is rejected.

Also worth switching on while in Settings → Code security (all free for a public repository): secret scanning with
push protection, Dependabot alerts and security updates. The GitHub account already e-mails Dependabot alerts and
failed workflow runs (checked 24 Oct).

## 7. Monitoring and alerts

| Signal | What watches it | Who is told | State on 24 Oct |
| --- | --- | --- | --- |
| Site answers (`/`, `/verify`, `/schools/mou`, `/robots.txt`, `/api/health`) | `.github/workflows/uptime.yml`, every 30 minutes from GitHub | GitHub e-mails a failed run (account setting "Actions: failed workflows only", on) | **armed at launch** — it does nothing until the Actions variable `UPTIME_URL` is set |
| Database answers | the same job calls `/api/health?deep=1`, which runs the read-only `verify_passport` lookup with a code that cannot exist; the job fails unless the body says `"db":"up"` | same | same |
| Free-plan project kept awake | the 48 deep checks a day count as database activity; Supabase pauses a Free project after a quiet week, and a paused project restores from the dashboard for 90 days | — | until `UPTIME_URL` is set nothing pings the database, so a week without visits would pause it |
| Server errors | `instrumentation.ts` → `lib/monitoring/report.ts`: one redacted `server.error` JSON line per error (Vercel → Logs) and, when `ERROR_ALERT_EMAIL` is set, an e-mail through Resend (one per route and error per 15 minutes per instance) | the addresses in `ERROR_ALERT_EMAIL` | code live; variable **unset**, so logs only |
| Failed deployments | Vercel → My Notifications → "Deployment Failures": e-mail and web | the Vercel account's e-mail | on (checked 24 Oct) |
| Failed CI | GitHub Actions on every push and pull request | the pusher, by e-mail | on |
| Spam and abuse | hidden `website` honeypot field, in-process rate limit, database rate limit (`consume_rate_limit`), server-side validation; Cloudflare Turnstile is coded (`lib/security/turnstile.ts`) and waits for keys | — | Turnstile **off** (needs a Cloudflare account; Turnstile itself is free) |

Limits to keep in mind: (1) Vercel keeps runtime logs only briefly on the Hobby plan, so a log line is not an incident
record — the e-mail alert and the `audit_events` table are the durable evidence; read the retention shown in Vercel →
Logs for the current plan. (2) GitHub pauses scheduled workflows after 60 days without repository activity; any push
restarts them. (3) A failed scheduled run is mailed to the person GitHub treats as the last editor of the schedule; if
no mail arrives for the first deliberate failure (run the workflow against a wrong `UPTIME_URL` once), add a second
path such as a free external uptime monitor. (4) Nothing pages a phone; the alerts are e-mail.

To turn on error e-mails: Vercel → Project → Settings → Environment Variables → `ERROR_ALERT_EMAIL` (Production and
Preview, comma-separated addresses) → redeploy. To turn on Turnstile: create the widget in the owner's Cloudflare
account, add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` (both or neither) and redeploy.

## 8. Backups and restore

### 8.1 What exists today

- The Supabase project is on the **Free plan: no automatic backups**. Supabase's own guidance for Free projects is to
  export regularly and keep the copies off-site. Deleting a project also deletes its backups.
- A database backup never contains the **files** in Storage (only their metadata rows). The three website buckets
  (`website-assets` public; `user-uploads` and `private-documents` private) need their own copy.
- The database is **shared with the other BSAH apps**: a backup of `public` covers their tables too, so it contains
  personal data (including children's). Treat every dump as confidential.
- Migration rollback files (`supabase/live/rollback/`) undo schema changes, not data loss.

### 8.2 Decision for the owner

| Option | What you get | Cost (Supabase documentation, 24 Oct 2026) |
| --- | --- | --- |
| A. **Pro plan** | daily backups kept 7 days, "Restore to a new project", no inactivity pausing | from US$25 per month per organisation |
| A+. Pro with **PITR** (7 days) | restore to any second, worst-case loss about 2 minutes (replaces the daily backups) | about US$100 per month more, and needs at least Small compute (about US$15 per month) |
| B. Free plan with **manual dumps** | an encrypted dump before every risky change and weekly | no cost; recovery depends on someone remembering, and on the dump being kept somewhere safe |

Recommendation: A before the first real enquiry from a parent; B only as a stop-gap until then. This needs the
owner's approval because it is a new paid subscription for a project shared with other apps.

### 8.3 Take a backup (works on the Free plan)

1. Dashboard → Connect → copy the **session pooler** connection string (it works over IPv4; the direct string is
   IPv6-only on the Free plan). Reset and use the database password from Database → Settings. Never put either in a
   chat, a file in Git or a workflow log.
2. Follow Supabase's guide (Backup and Restore using the CLI): three dumps — `supabase db dump --db-url "$URL" -f
   roles.sql --role-only`, `… -f schema.sql`, `… -f data.sql --use-copy --data-only`. The data dump carries
   `auth.users` and the other `auth` data.
3. Copy the files out of the three Storage buckets (Supabase's guide has a script; the few generated MOU PDFs can also
   be rebuilt from `mou_requests`).
4. Encrypt before the files leave your computer (for example `gpg --symmetric --cipher-algo AES256 file`), keep the key
   in the password manager and the encrypted copy on a drive or private cloud folder. **Never** commit a dump or upload
   it as a GitHub Actions artifact: artifacts and logs of a public repository can be read by anyone who can see it.
5. Keep the last four weekly dumps plus one taken before each live change; delete older ones (do not keep children's
   data longer than needed).
6. Write down the date, the row counts (`select count(*)` of `onboarding_leads`, `audit_events`, `generated_documents`)
   and where the copy is.

### 8.4 Restore into a new project (tested steps)

Why not just load the files: a new Supabase project gives every new table in `public` to the API roles by default
("default privileges"). A dump only lists the roles that *have* access, so a plain restore silently gives `anon` its
access back (Supabase documents this too, in the `db dump` reference). In the rehearsal a plain restore gave `anon` its
table privileges back on **8 tables** (every privilege on four website tables, including the right to read
`onboarding_leads`; `SELECT` on four more that the hardening closes) and brought back **none of the 9 storage rules**.
Row-level security still hid the rows, but the second wall was gone.

1. Create the new project (region as decided in `docs/BUSINESS_LEGAL_REVIEW.md`); note the new URL and keys. Enable the
   extensions the old project used (`select extname from pg_extension;` there) and Database Webhooks if it used them.
2. In the new project's SQL editor record the defaults (`select defaclrole::regrole, defaclnamespace::regnamespace,
   defaclobjtype, defaclacl from pg_default_acl;`) and **switch them off**:
   ```sql
   alter default privileges for role postgres in schema public revoke all on tables    from anon, authenticated, service_role;
   alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated, service_role;
   alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, service_role;
   ```
3. Restore as in Supabase's guide: `psql --single-transaction --variable ON_ERROR_STOP=1 --file roles.sql --file
   schema.sql --command 'SET session_replication_role = replica' --file data.sql --dbname "$NEW_URL"`. Passwords of
   custom login roles are not in a dump: set them again.
4. Run the three migration files again, in order: `20261023001000_website_layer.sql`, `…001100_security_fixes.sql`,
   `…001200_anon_privacy_hardening.sql` (only if it was applied before). They are written to be re-run (the test suite
   applies each twice). This recreates the Storage buckets and their 9 rules, which are not in a dump, and re-asserts
   the privacy grants; the last file aborts if the public can still read a protected column.
5. **Switch the defaults back on** with the same three statements using `grant all … to anon, authenticated,
   service_role`, matching what step 2 recorded.
6. Copy the Storage files back into the three buckets.
7. Verify (all in the SQL editor):
   ```sql
   select has_table_privilege('anon','public.onboarding_leads','select') as anon_reads_enquiries;       -- false
   select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' and not c.relrowsecurity;                                 -- no rows
   select count(*) from pg_policies where schemaname='storage' and tablename='objects'
      and (policyname like 'website-assets %' or policyname like 'user-uploads %' or policyname like 'private-documents %'); -- 9
   select id, public from storage.buckets where id in ('website-assets','user-uploads','private-documents');            -- 3 rows, only website-assets public
   ```
   then compare the row counts with the notes from 8.3, call `/api/health?deep=1` (`"db":"up"`), sign in at
   `/admin/login`, submit one synthetic enquiry and open one MOU PDF.
8. Point the site at the new project: update `SUPABASE_URL`, the publishable key and the secret key in Vercel
   (Production and Preview) and in `.env.local`, redeploy, update the Supabase Auth Site URL and redirect list, and
   re-check Resend/Formspree if their webhooks pointed at the old project.

### 8.5 What the rehearsal proves, and what it cannot

`supabase/live/tests/backup_restore_rehearsal.sh` runs in CI on every push. On a throwaway Postgres 16 it builds the
live replica, adds synthetic enquiries, dumps, restores into a second database that has Supabase's default
privileges, applies steps 2–5, and compares row counts, row-level-security flags, 64 policies, schema, table, sequence
and column privileges, default privileges and 16 functions with their grants (12 checks). A control database restored
the naive way must show the problem, so the extra steps stay proven. It does **not** exercise the real `auth` and
`storage` services, `roles.sql`, extensions, the Supabase CLI or the Storage files: Supabase's `auth` and `storage`
schemas are only stood in for. **Before launch run section 8.4 once into a scratch Supabase project** (a Free account
may hold two active projects) and delete it afterwards.

### 8.6 Recovery targets (honest figures)

| Setup | Most data you can lose | Time to be back |
| --- | --- | --- |
| Free plan, manual dumps (today: none exist) | everything since the last dump — today, everything | hours, by hand |
| Pro, daily backups | up to 24 hours | the project is unavailable while the dashboard restores it; longer for larger databases |
| Pro + PITR | about 2 minutes | as above |

## 9. Incident response

**Roles (owner fills in):** incident lead ______; deputy ______; legal counsel ______; Supabase / Vercel / GitHub /
Resend account owners ______. Keep the list in the password manager, not in Git.

**First 15 minutes (any incident):** (1) note the time and what was seen; (2) check `/api/health?deep=1` and the
Vercel, Supabase, GitHub and Resend status pages; (3) decide the class below; (4) tell the owner; (5) change nothing
else until the evidence is saved (screenshots, the `server.error` lines, `audit_events` rows around the time).

| Class | Signs | First action |
| --- | --- | --- |
| Site down or broken after a deploy | uptime e-mail, `5xx`, broken page | Vercel → Deployments → *Promote to Production* on the last good deployment (section 5), then fix forward in a pull request |
| Database unreachable | `/api/health?deep=1` → `db: down` | Supabase dashboard: paused (Resume project; 90 days), restoring, or an outage (status page); enquiries are not lost while it is down — forms report the failure, nothing is stored |
| Spam or abuse wave | many enquiries, rate-limit events | tighten limits, turn on Turnstile (section 7), delete junk only with the owner's approval |
| Leaked secret (key in a chat, log, commit, screenshot) | any | treat as compromised: rotate the key at the source, update Vercel and `.env.local`, redeploy, then revoke the old one; for a key in Git also check the push protection / secret scanning alerts |
| Suspected data exposure or unauthorised access | unexpected rows read or changed, strange staff sign-in, `audit_events` anomalies | contain (disable the account, rotate keys), preserve evidence, **stop and call the owner and counsel before telling anyone else** |

**Reporting duties (counsel to confirm; not legal advice):** the CERT-In Directions of 28 April 2022 ask service
providers, intermediaries, data centres, body corporate and government organisations to report listed cyber incidents
(for example data breach or leak, unauthorised access, website defacement) within **six hours** of noticing them, and to
keep system logs for 180 days within India. The Digital Personal Data Protection Rules, 2025 (notified 14 Nov 2025)
phase in over 18 months; the breach-intimation rule is expected to apply from about May 2027. Because this site collects
enquiries from parents of children, treat every suspected exposure as reportable until counsel says otherwise.

**After the incident:** write what happened, the timeline, what worked, what failed and the changes made (no secrets,
no personal data) in `docs/` under the date; update this runbook if a step was wrong.
