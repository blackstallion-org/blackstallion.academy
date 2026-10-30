# Member accounts: student, parent, teacher, school (28 Oct 2026)

Anyone can create an account from **/admin/login → "Create an account"**, choosing who they are. Staff sign in on the same page.
A signed-in member lands on **/account**; a staff member lands on **/admin**, where the new **Accounts** section lists everyone
who signed up, counts them by kind, and lets staff approve or hold them. Nothing here is applied to a live Supabase project yet
(see "Switching it on").

## The brief I wrote for myself (and the bar it was held to)

> Build self-service accounts on the existing Supabase Auth, without weakening the existing authorisation model.
> 1. **Who:** student, parent, teacher, school. Pick the kind first, then ask only the questions that apply to it. Teachers and schools
>    must name their institution and city; a school must give a phone; a student gives an age band and is told that under-18s need a
>    parent or guardian.
> 2. **Security first.** Anyone on the internet can call Supabase Auth with the public key, so the database, not the form, decides what an
>    account may be: every self-service sign-up keeps the least-privilege `profiles.role = 'cadet'`; nobody can promote themselves; the
>    kind is validated against an enum; status comes from the kind (students and parents active, teachers and schools pending); members
>    cannot edit kind or status; staff review goes through one audited function. A malformed form can never block the auth account.
> 3. **No leaks.** Same answer whether or not an e-mail is registered; no e-mail in logs; a hidden honeypot field; five sign-ups per hour
>    per connection; password rule as for staff (12+ characters, letters and a number); explicit consent with a link to the privacy notice.
> 4. **Data for each member.** A dashboard per kind with honest next steps (no promises, nothing from the claims ledger's "No" rows), the
>    member's own details (editable), and the progress of enquiries made with their confirmed e-mail, as coarse words (received, in progress,
>    closed), never the internal status.
> 5. **Data for the owner.** `/admin/accounts`: counts per kind and "awaiting review", filter by kind and status, details each person gave,
>    approve / hold / reactivate, every change in the audit log.
> 6. **Prove it.** SQL tests on a throwaway Postgres for the trigger, RLS, column grants and the review function; unit tests for the form
>    rules and the create-account action with a fake Supabase client; browser checks of the forms at 390 and 1440 with the keyboard.

Held to that bar, what was built and checked is below; what is not done is listed after it.

## What exists

| Piece | Where |
| --- | --- |
| Tables, trigger, RLS, review function, "my enquiries" | `supabase/migrations/20261028000900_member_accounts.sql` |
| 38 SQL tests (214 in the whole suite, all pass on a throwaway Postgres 18) | `supabase/tests/50_member_accounts_tests.sql` (`LC_ALL=en_US.UTF-8 PG_BIN=/opt/homebrew/opt/postgresql@18/bin bash supabase/tests/run.sh`) |
| Kinds, fields, validation (shared by form and server action) | `lib/accounts/kinds.ts` |
| Sign-up action (rate limited, honeypot, generic errors), profile edit | `app/account/actions.ts` |
| Role picker and sign-up form, profile form | `app/account/forms.tsx` |
| Member dashboard | `app/account/page.tsx` (+ `layout.tsx`: noindex, per request) |
| Login page with "Sign in" and "Create an account" views | `app/admin/login/page.tsx` (`?mode=create`) |
| Sign-in routes staff to `/admin`, members to `/account` | `app/admin/actions.ts` (`signIn`), `proxy.ts` now also guards `/account` |
| Staff list, counts, approve / hold | `app/admin/accounts/` and an "Accounts" item in `app/admin/AdminNav.tsx` |
| 13 unit tests | `tests/member-accounts.test.mjs` (+ proxy test updated) |

How the roles line up with the schema that was already there: student = `cadet`, parent = `parent_guardian`, teacher = `instructor`,
school = `school_partner`. **A self-service account always stays `cadet`.** `member_accounts.kind` records what the person says they
are; only an `executive_admin` can later change `profiles.role` (audited), for example when a teacher is approved to see a batch.

## Switching it on (needs the owner)

1. The Supabase project in `.env.local` (`bsah-academy`, `hiqowfwptvsndrzayifm`) is **INACTIVE (paused)**; the readiness notes name a
   different, shared project. I did not unpause or change either. Apply `20261028000900_member_accounts.sql` to the website project once the
   earlier migrations are there (`supabase db push`, or the SQL editor). It is additive and re-runnable.
2. In Supabase Auth settings: keep "Confirm e-mail" on (members see their enquiries only with a confirmed address), and add
   `https://<site>/auth/confirm` to the redirect allow-list (the existing staff reset link already uses it).
3. Sign up once from `/admin/login?mode=create`, confirm the e-mail, sign in, and check `/account`; then sign in as staff and open
   `/admin/accounts`.

## Not done

- **Never exercised against a live Supabase** (paused). The browser checks covered the forms, validation messages, focus, overflow and the
  signed-out redirect; the pages behind a sign-in (`/account`, `/admin/accounts`) are typechecked, linted and covered by SQL and unit
  tests with fakes, not seen with real data.
- E-mail templates for the confirmation message are Supabase's defaults.
- No parent-to-child linking (the schema has `cadet_guardians`; a parent's children are free text for now), no teacher-to-batch assignment,
  no "delete my account" button (staff can delete in Supabase; the member row cascades).
- Approving a teacher or school sets `status` only; it does not change `profiles.role`.
