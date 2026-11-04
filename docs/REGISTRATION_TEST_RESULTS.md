# Registration and admissions: test results (4 Nov 2026)

All runs on this machine, this date.

| Gate | Command | Result |
| --- | --- | --- |
| Database (live-schema replica) | `PG_BIN=/opt/homebrew/opt/postgresql@18/bin bash supabase/live/tests/run.sh` | **337 passed, 0 failed** (227 existing + 110 new: migration applied twice, `70_registration_tests.sql`, rollback refusal, rollback twice, `71_registration_rollback_tests.sql`; the older layer-rollback checks still pass after it) |
| Unit tests | `npm test` | 272 passed, 4 failed. The 4 failures are the media-manifest and asset-guard checks (uniform and Pratap story images of other sessions' unfinished work); they failed before this work and touch no registration file. `tests/registration.test.mjs`: 14/14 |
| Typecheck | `npm run typecheck` | pass |
| Lint | `npm run lint` | 0 errors (20 warnings, none in the new files) |
| Build | `npm run build` | pass (exit 0); the new routes build as per-request pages |

## What the database tests prove (on the replica)

Roles: ADMISSIONS only from app metadata; a role typed into sign-up is ignored; applicants cannot promote themselves.
Programmes: public read, SUPER_ADMIN-only prices. Children: guardian-only, no cadet link from the guardian, invisible to other parents
and to anonymous visitors. Applications: drafts only; applicants cannot set status or payment state; another parent cannot apply for
your child; one open application per child and per person; a child only on a cadet application. Documents: own folder only, allowed
types only, not after submission; private bucket; reviewers read. Submit: needs confirmed e-mail, consent, required documents, the
child inside the programme's ages; records consent. Review: only ADMISSIONS/SUPER_ADMIN, only allowed moves, a note when asking for
information, decisions final; the applicant sees only visible history; history and audit append-only. Payments: only the server can
ingest; wrong amounts refused; replays and late failures harmless; the parent sees their own payment only. Enrolment: only after
payment; creates the operations cadet and passport under the guardian; once only. Staff: CV required; approval grants nothing;
only SUPER_ADMIN activates, never to SUPER_ADMIN or a mismatched role. Rollback: refuses while ADMISSIONS accounts exist, removes
everything it added, keeps enrolled cadets.

## Browser checks (dev server, Chromium)

- `/register` at 1440 and 390 px: renders in the site's design, no horizontal scroll, nav clear, focusable cards.
- Signed-out visits to `/enroll`, `/sovereign`, `/careers/apply` redirect to sign-in with `?next=` set; `/login?next=/enroll` keeps it;
  `/admin/applications` redirects to sign-in.

## Live project (tgwadczrfbljnepoaqtb), 4 Nov 2026

Applied through the Management API in one transaction, after checking that the prerequisites existed (website layer, F2 sign-up
trigger, `consume_rate_limit`, operations columns) and recording the definitions it replaces (`handle_new_user`, `users_role_check`).

- All 8 new tables have RLS on, with policies. The Foundation programme exists with a fee of 0. The private bucket `application-documents`
  has a 10 MB limit and owner-only storage policies. The role check includes ADMISSIONS. The new columns are on `payment_records` and
  `consent_records`. Only `service_role` (and `postgres`) can execute `ingest_payment_event`. User roles are unchanged.
- The Security Advisor shows no errors. The only new warnings are the five `application_*` functions being callable by signed-in
  users, which is intended: each checks the caller. Every other warning was there before.
- Anonymous visitors using the publishable key can read active programmes and nothing else:
  - reads of applications, children, documents, enrolments, payment events and the notification log are refused (42501);
  - inserting an application and changing a fee are refused;
  - the RPCs `ingest_payment_event` and `application_review` are refused;
  - an upload to the bucket is refused by RLS, and a bucket listing returns nothing.

## Not tested (say so plainly)

- Signed-in flows against the live database (no test account was used); the database checks above are anonymous only.
- The signed-in pages (enrolment form, status, dashboard, console review) with a real account; real uploads to Storage.
- A real Razorpay order, checkout or webhook (no keys); a real e-mail (Resend domain not verified).
- Screen-reader pass; Safari and Firefox; real devices.
