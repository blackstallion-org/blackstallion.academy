# Sign-in methods: Google, e-mail and phone code (4 Nov 2026)

One sign-in page (`/admin/login`, short address `/login`) now offers three ways in. Members and staff use the same page;
what a person can do still depends only on their role in the database, never on the method they used.

| Method | Start | Return | Landing |
| --- | --- | --- | --- |
| Google | `signInWithGoogle` (`app/auth/actions.ts`) | `/auth/confirm?via=google` | by role (below) |
| E-mail and password | `createAccount` (`app/account/actions.ts`), `signIn` (`app/admin/actions.ts`) | confirmation link `/auth/confirm?via=signup` | by role |
| Phone code | `sendPhoneCode`, `verifyPhoneCode` | none (the code is typed on the page) | by role |

Landing rule, shared by all three (`lib/auth/destination.ts`): staff roles to `/admin`, `ADMISSIONS` to `/admin/applications`,
a member with a `member_accounts` row to `/account` (or a safe `?next=`), an operations profile only (every sign-up on the live
project) to `/sovereign`, no profile at all: signed out again with a message. Roles are read from the database under RLS.

## 1. What was verified, and how

Evidence is split by where it was observed. Nothing below claims more than the column says.

| Check | Where | Result |
| --- | --- | --- |
| Providers switched on (Google, E-mail, Phone; SMS provider `twilio`; sign-ups open; e-mail confirmation on; phone confirmation on) | live project, public `/auth/v1/settings`, read-only | confirmed |
| **Google consent screen opens** | live project, GET of the authorize redirect, nothing entered | **FAILS: `Error 400: redirect_uri_mismatch`** (see §3, item 1) |
| **Phone sign-up of a new number** | live project, one request with a fictional number | **FAILS: HTTP 500**, `null value in column "email" of relation "users"`; nothing was stored and no text was sent (see §2) |
| SMS delivery through Twilio | live | **not testable** until the failure above is fixed, and it needs a real number (§3, item 3) |
| Phone sign-up, code, wrong code, session | local replica (Supabase Auth in Docker + the live schema), test numbers | works after the migration; fails with the live error before it (the failure reproduced exactly) |
| E-mail registration, confirmation link, second use of the link, sign-in, unconfirmed sign-in, wrong password, logout | local replica, driven through the real pages in a browser | works |
| Staff sign-in still reaches `/admin`; a parent is refused at `/admin`; signed-out visitors are redirected from every protected route | local replica, real pages | works |
| Google button | local replica | leaves for `accounts.google.com` with the project's client id (dummy id locally, so Google refuses it there) |
| Google return, cancelled consent, stale code, no profile | unit tests with a fake Supabase client | works |
| Layout at 390 and 1440 px | production build, browser | no horizontal scroll, header clear of the content |
| Replica database suite (`supabase/live/tests/run.sh`) | throwaway Postgres | 363 passed, 0 failed (new files 72, 73, 74) |
| Unit tests | `node --test tests/auth-methods.test.mjs` | 24 passed; the six auth-related files together 91 passed |

**Not verified:** a real Google sign-in (needs a person and Google credentials), a real text message, how a Google sign-in
whose e-mail already has a password account is linked (Supabase links on a verified e-mail; this is its documented behaviour,
not observed here), real SMS code expiry (the local test numbers did not expire within 75 s), reduced-motion behaviour (no
animation was added), the hosted project's rate-limit and OTP-expiry settings (not readable without dashboard access).

## 2. The phone sign-up bug on the live project, and the fix that waits for approval

`public.users.email` is `NOT NULL` and `UNIQUE`; the trigger `public.handle_new_user()` inserts `new.email`; a person who signs in
with a text message has no e-mail. So the first phone sign-in fails and creates nothing. Observed live (HTTP 500) and
reproduced on the replica with the same error text.

`supabase/live/migrations/20261104001500_phone_and_oauth_signup.sql` replaces that one function and nothing else:
a phone-only user gets the reserved address `phone-<digits>@phone.invalid` (cannot receive mail), `phone_number` is filled only
when no other row holds it (it is `UNIQUE`), the name also reads the provider's `name` claim, and the role still comes from
app metadata only (F2). Rollback: `supabase/live/rollback/20261104001500_phone_and_oauth_signup_rollback.sql`.
Tests: `supabase/live/tests/72` to `74` (evidence before, behaviour after, rollback).

**Not applied to the live project** (shared with the operations apps; approval needed, like 001100 and 001400).
Until it is applied, Google and e-mail work and phone sign-up of new numbers does not. An existing user who already has a
confirmed phone number is not affected.

## 3. Manual configuration still required before deployment

1. **Google Cloud Console → Credentials → the OAuth client used in Supabase → Authorized redirect URIs**: add
   `https://tgwadczrfbljnepoaqtb.supabase.co/auth/v1/callback`. Today Google answers `redirect_uri_mismatch`. Also check the consent
   screen is published (not "Testing" with a short test-user list) and lists the production domain.
2. **Supabase → Authentication → URL Configuration → Redirect URLs** must contain `https://blackstallion.academy/**`,
   `https://blackstallion-academy.vercel.app/**` and the live address `https://project-t9r95.vercel.app/**` (this last one is still
   missing, readiness item B4). The sign-in return and every e-mail link go to `/auth/confirm` on those hosts. Set
   `NEXT_PUBLIC_SITE_URL` to the production origin so links never use a preview host.
3. **SMS (Supabase → Authentication → Sign In / Providers → Phone)**: the Twilio account SID, auth token and a Messaging Service
   SID (or sender) must be real; for Indian numbers the sender must be registered for DLT (TRAI rules) or texts to +91 are
   blocked. Allow only the countries you serve in the Twilio geo permissions (the form accepts any valid `+` number, so this is
   the cap on SMS fraud cost). Check the SMS OTP expiry setting (read it in the dashboard; this report could not): it has to be long enough to type a code, and
   "Confirm phone" must stay on. Use Supabase "test phone numbers" for staff testing instead of paying for texts.
4. **Apply the phone sign-up migration** (§2) after approval, then request a code to your own number and enter it. That is the
   end-to-end SMS test this report could not do.
5. **Send a real e-mail**: Supabase's built-in mailer is rate-limited and meant for testing; configure custom SMTP (Resend is
   already in use for staff notices) and verify the sending domain, or confirmation and reset e-mails will be throttled or land in spam.
6. Decide the open product questions in §4.

## 4. Decisions for the owner (not made here)

- **Phone-only accounts cannot submit an application.** `application_submit` requires a confirmed e-mail, and there is no "add your
  e-mail" screen. Either add one (`auth.updateUser({ email })`, then confirm) or accept that phone is for sign-in only and e-mail
  is needed to apply. The dashboard banner for such a person also says "we sent you a link", which is wrong for them.
- **Google or phone for staff.** A staff member who signs in with Google using the same verified e-mail reaches the same account and
  the same role (by design). A phone number added to a staff account would allow SMS-only sign-in, which is weaker than a password
  (SIM swap). Staff still have no second factor (security finding S16).
- **Phone accounts without a name.** They are called "New User" and the dashboard greets "New". A "tell us your name" step would fix it.
- **Duplicates.** A phone user and an e-mail user who are the same person are two accounts (Supabase links Google to an e-mail account,
  not a phone number to one). A number already stored on another operations row is not copied to the new row.

## 5. Security notes on the implementation

- No browser Supabase client was added (security audit F-07 relies on that): Google uses PKCE on the server, the code verifier lives
  in the HttpOnly session cookie, and the callback exchanges the code.
- Open redirects: `?next=` always passes `safeNext`; the Google return and the confirmation link ignore any `next` the person could not
  have reached by role.
- Texts cost money and can be abused to message strangers: 5 code requests per visitor and 3 per number per 15 minutes, 10 code checks
  per visitor and per number per 15 minutes (database limiter plus an in-process fallback), a hidden honeypot field, and a six-digit
  code that Supabase also rate-limits. Numbers are hashed before they reach the limiter and are never logged.
- Errors never echo Supabase's message (it can contain the number or e-mail) and never say whether an account exists. The one exception
  is "confirm your e-mail first", which Supabase returns only after the password was right.
- `public.users` policies, grants, the F1 guard and role rules are unchanged; the replica suite shows the policy fingerprint is identical
  before and after the migration.

## 6. How to repeat the local tests

Throwaway only; nothing touches the live project.

```bash
supabase init   # in an empty folder; set ports away from any other local stack, enable email + phone confirmations,
                # [auth.sms.test_otp] 919876543210 = "123456", dummy [auth.sms.twilio] and [auth.external.google]
supabase start -x studio,imgproxy,realtime,storage-api,edge-runtime,logflare,vector,postgres-meta,supavisor
psql <db url> -f supabase/live/baseline/20261023_live_snapshot.sql   # then 001000 and 001100, then 001500
SUPABASE_URL=… SUPABASE_PUBLISHABLE_KEY=… NEXT_PUBLIC_SITE_URL=http://localhost:3200 npm run build && npx next start -p 3200
PG_BIN=/opt/homebrew/opt/postgresql@18/bin supabase/live/tests/run.sh   # replica suite
node --test tests/auth-methods.test.mjs
```
