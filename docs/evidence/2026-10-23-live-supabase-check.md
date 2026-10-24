# Live Supabase check — project tgwadczrfbljnepoaqtb, 23 Oct 2026

Applied with the owner's approval (chat, 23 Oct 2026): `supabase/live/migrations/20261023001000_website_layer.sql`
(dashboard prompt answered "Run and enable RLS", which also enabled RLS on `app_private.rate_limits`) and
`supabase/live/migrations/20261023001100_security_fixes.sql`.

Verification script: one `DO` block that ends by raising its report, so every write it made was rolled back
(no test rows remain). Output, verbatim apart from line wrapping:

```
users: admin=t parent=t
objects: tables with RLS=4 rpcs=3 new_buckets=3 old_buckets=4 storage_policies=9 guard_trigger=1 signup_uses_app_meta=true
anon submit: {"mirror": "mou_requests", "status": "stored"} | again: {"status": "duplicate"} | anon read: denied | rate: true/false | no-consent: refused
parent: reads leads=0 self-promote: blocked private upload: denied
admin: sees test lead=1 status update=1 mirrored mou_request=1 private upload: ok doc row: ok audit rows=3
verify real cadet: {"rank": "squire", "status": "valid", "issued_at": "2026-10-06", "credential_type": "passport"} | unknown: {"status": "unknown"}
signup with SUPER_ADMIN metadata -> PARENT
```

Before the fixes, the replica tests (`supabase/live/tests/05_baseline_evidence.sql`) reproduced both critical holes:
a parent promoting themself to SUPER_ADMIN, and sign-up metadata granting SUPER_ADMIN.
