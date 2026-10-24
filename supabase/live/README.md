# Live Supabase project (tgwadczrfbljnepoaqtb): operations schema + website layer

The live project already ran an **operations schema** (users with roles PARENT / INSTRUCTOR / GROOM / SCHOOL_ADMIN /
SUPER_ADMIN, cadets, hubs, fleet, sessions, payments, QR captures, MOU requests, executive appointments) before the
website was connected. The website-only tree in `../migrations/` must **not** be applied there: it defines its own
`cadets`, `school_hubs` and `training_sessions` and would collide.

| Path | What it is | Applied to live |
| --- | --- | --- |
| `baseline/20261023_live_snapshot.sql` | Read-only snapshot of the operations schema (from pg_catalog, 23 Oct 2026). Tests only | never (already there) |
| `migrations/20261023001000_website_layer.sql` | Additive website layer: `onboarding_leads`, `submit_lead_v2`, `consume_rate_limit`, `verify_passport`, `audit_events`, `generated_documents`, `media_assets`, buckets `website-assets` / `user-uploads` / `private-documents` + policies, mirrors into `mou_requests` / `executive_appointments` / `qr_lead_captures` | 23 Oct 2026, owner-approved |
| `migrations/20261023001100_security_fixes.sql` | F1 guard: only SUPER_ADMIN changes role/hub/email/id. F2: sign-up role comes from app metadata only | 23 Oct 2026, owner-approved |
| `migrations/20261023001200_anon_privacy_hardening.sql` | Anon privacy hardening: anon reads only safe columns of `equine_fleet` / `school_hubs` and nothing of `achievements` / `session_skills`; NOT VALID checks and a per-client rate limit on direct inserts into `mou_requests` / `executive_appointments` / `qr_lead_captures`. Impact, pre-flight and verification: `HARDENING_NOTES.md` | not applied (prepared 23 Oct 2026) |
| `rollback/20261023001000_website_layer_rollback.sql` | Removes only what the website layer added | not applied |
| `rollback/20261023001200_anon_privacy_hardening_rollback.sql` | Restores anon's previous grants; drops the hardening triggers, functions, salt and checks. Run before the layer rollback | not applied |
| `tests/run.sh` | Replica test: stub → snapshot → evidence → layer ×2 → tests → fixes ×2 → tests → hardening evidence → hardening ×2 → tests → hardening rollback ×2 → tests → hardening again → layer rollback → tests → hardening-after-layer-rollback tests (179 checks) | – |

Website staff = `public.users.role = 'SUPER_ADMIN'` (`lib/auth/admin.ts` reads `users` first, `profiles` second).
New roles are provisioned by setting `raw_app_meta_data.role` (dashboard or service role), never from sign-up data.
Evidence of the live check: `docs/evidence/2026-10-23-live-supabase-check.md`.
