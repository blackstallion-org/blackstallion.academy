# Backend: what is built, what is tested, what the business must decide

Status: SQL migrations only. **Nothing has been applied to any real database.** There is no Supabase project connected, and the website still does not store leads (the form says so).

## Tested (on a throwaway Postgres 16 with a Supabase stand-in; `supabase/tests/run.sh`)
101 checks pass: anonymous users cannot read cadets, leads, profiles, credentials or audit; lead intake validates server-side; guardians see only their linked child; instructors only assigned cadets; school partners no cadet data; role escalation blocked and audited; rank decisions must be the next rank, carry evidence, and are append-only; passport codes are shown once and stored hashed; verification returns minimal output (valid / expired / revoked / unknown); hub commercial statuses need contract evidence; claims cannot go live without evidence.

## Not tested
Real Supabase (Auth, PostgREST, `auth.uid()` from real JWTs, Realtime), performance with real data volumes, backups, rate limiting, the website calling any of this.

## Decisions needed from the academy (defaults assumed in the SQL)
1. Who may approve ranks and issue credentials. Assumed: operations or executive_admin only; instructors have no write path to ranks yet (a "propose" step is not built).
2. Rank criteria text and `criteria_version`. Placeholder `draft-0` only.
3. The 17 sub-zones. Only the 6 zones and the three Zone-01 target corridors (as prospects) are seeded.
4. Privacy notice text and version. Needs legal review before any real child data is stored (minors, parental consent, retention).
5. Lead routing, who is notified, and response promises. Nothing is promised on the site.
6. School-partner reporting. Partners currently see only their own hub row; aggregates are not built.
7. Credential lifetime and what a QR verification page may reveal (currently: status, rank, credential type, issue date).
8. Claim owners and evidence for each public claim.
