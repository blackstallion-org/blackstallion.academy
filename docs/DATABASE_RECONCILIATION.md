# Database reconciliation: two schema trees, one decision (B01)

Prepared 23 October 2026. Nothing here has been applied to any live database. The Supabase project `bsah-academy`
(ap-south-1) is **paused** (status INACTIVE; `list_migrations` times out), so its real contents are unknown (B02).

## The two trees

| | Root `supabase/` (website schema) | `bsah-platform/supabase/` (platform schema) |
| --- | --- | --- |
| Purpose | What the public website calls today | Full ecosystem: portal, admin, apps, commerce |
| Migrations | 7 (6 original + `20261023000700_website_intake.sql`) | 13 (`20261011000000` … `20261011012000`) |
| Tables | 15 + `app_private.rate_limits` | about 40 (see map) |
| Tests | 3 SQL files, **147 checks, 147 pass** on a throwaway Postgres 16 (`supabase/tests/run.sh`, run 23 Oct) | 24 pgTAP files; need the full Supabase stack (Docker); **not run this session** |
| Docs | Comments in migrations | `docs/DATA_MODEL.md` (2,000 lines), ADRs, access matrix |
| Anonymous lead intake | `submit_lead` (v1) and `submit_lead_v2` (consent, attribution, idempotency) | none: no anon lead RPC (leads arrive through server code) |
| Credential verify | `verify_passport(p_code)`: valid / revoked / expired / unknown, minimal output | `verify_passport(code, ip_hash, token)` with `verify_lookups` log and `bump_rate_limit` |
| Payments | none | `fee_schedule`, `payments`, `subscriptions`, `refunds`, `invoices`, `webhook_events`, `ingest_razorpay_event`, GST in paise |
| Consent / DPDP | consent timestamp on leads only | `notice_versions`, `consents`, `data_requests`, `export_guardian_data`, `anonymise_guardian`, retention sweep |

Both trees define `profiles`, `school_hubs`, `cadets` and `cadet_guardians` with **different columns and enums**.
Applying both to one project would fail or, worse, half-succeed. They must never be applied together.

## Table map (root → platform)

| Root table | Platform equivalent | Compatibility |
| --- | --- | --- |
| `profiles` (role enum: cadet, parent_guardian, instructor, school_partner, operations, executive_admin) | `profiles` (`app_role` enum, auth hook claims, MFA check) | Different enums; role mapping needed |
| `regional_zones` | none (zones are labels on hubs) | Root-only |
| `school_hubs` | `school_hubs` + `school_hub_commercials` + `hub_tiers` | Platform splits commercial data out; better privacy |
| `cadets`, `cadet_guardians` | `cadets`, `cadet_guardians` | Similar intent, different columns |
| `instructor_assignments`, `hub_members` | `instructors`, profile hub link | Remodelled |
| `curriculum_pillars` | none | Root-only (13-pillar ledger) |
| `training_sessions`, `session_pillar_logs` | `daily_sessions` | Remodelled |
| `cadet_rank_history` | `rank_milestones` | Similar |
| `passport_credentials` (hashed codes) | passport code on `cadets` + `verify_lookups` | Different approach |
| `onboarding_leads` (+ v2 columns) | `leads`, `mou_requests` | Field mapping straightforward |
| `approved_claims` | `site_metrics` / `CLAIMS_REGISTER.md` | Different approach |
| `audit_events` | `audit_log` | Similar, append-only in both |
| (none) | fleet, vet logs, tournaments, results, standings, replays, commerce, email outbox, command AI KB/logs, consents, notices, admissions applications, milestone reels, spotlights, data requests, storage delete queue, site settings | Platform-only |

## Recommendation (owner decision required)

**Option A: platform schema is canonical (recommended for the ecosystem).** It is the only design that covers
payments, consent/DPDP, fleet, tournaments and the apps. To keep the website working, port three website functions
into a new platform migration: `submit_lead_v2` (writing to `public.leads`), `consume_rate_limit`, and a
`verify_passport` wrapper with the website's signature. Then run the platform pgTAP suite in Docker and the
website's server-action tests against it. Estimated 2–3 engineering days.

**Option B: root schema now, platform later.** Fastest path for a public-site beta: it is tested and matches the code
today. Cost: a data migration later, and payments/consent tables still have to come from somewhere. Only sensible if
the website gets its own Supabase project and the platform gets another.

Either way, the website code is already tolerant: `app/actions.ts` calls `submit_lead_v2` and falls back to
`submit_lead` when v2 is absent; `/verify` calls `verify_passport` and reports "registry not connected" when no
database is configured.

## Steps to go live (all need explicit approval)

1. Owner chooses A or B (B01) and approves restoring the paused project (B02). Take a backup/snapshot first.
2. Apply the chosen migrations to a **separate development project** first; run the matching test suite.
3. Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `RATE_LIMIT_SALT` (32+ random characters) in the hosting
   environment. Never put a service-role key in the website.
4. Submit one synthetic lead through the live form; read it back as an `operations` user; confirm the
   `lead.submitted` audit row. Record the evidence in `docs/IMPLEMENTATION_PROGRESS.md`.
5. Record backup frequency, point-in-time recovery setting and a tested restore (RTO/RPO) before launch.

## Rollback

The website-intake migration is additive (new nullable columns, a new table and two new functions). To roll it back
on a development database: drop `public.submit_lead_v2`, `public.consume_rate_limit`, `app_private.rate_limits`, the
two indexes, the two constraints and the four columns. The original `submit_lead` is untouched throughout.
