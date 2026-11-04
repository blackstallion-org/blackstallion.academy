# Registration and admissions: setup (owner steps)

Everything below needs an account or a decision that only the owner has. **Step 1 was done on 4 Nov 2026** (applied and checked
from this workspace, see `docs/REGISTRATION_TEST_RESULTS.md`); steps 2 to 6 are still open.

## 1. Apply the database migration (live project `tgwadczrfbljnepoaqtb`)

It changes two existing objects by widening only (the `users` role check gains `ADMISSIONS`; the sign-up trigger accepts it from app
metadata) and adds new tables, functions, a private bucket and policies. Tested on the live-schema replica (337 checks, see
`docs/REGISTRATION_TEST_RESULTS.md`); rollback in `supabase/live/rollback/20261104001400_registration_admissions_rollback.sql`.

1. Back up first (Free plan has no backups): Dashboard → Database → Backups, or `pg_dump` with the database password.
2. Supabase Dashboard → SQL Editor → paste `supabase/live/migrations/20261104001400_registration_admissions.sql` → Run. It is safe to run twice.
3. Check: `select count(*) from public.programs;` returns 1 (the Foundation programme, fee 0).
4. Security Advisor (Dashboard → Advisors) should show no new errors for the new tables.

Alternatively give this workspace access (a scoped Supabase personal access token for this project, set as `SUPABASE_ACCESS_TOKEN`)
and the migration can be applied and checked from here.

## 2. Server secrets (Vercel → Project → Settings → Environment Variables; never `NEXT_PUBLIC_`)

| Variable | Needed for | Where it comes from |
| --- | --- | --- |
| `SUPABASE_SECRET_KEY` (already listed in docs/ENVIRONMENT_VARIABLES.md) | payment ingestion, notification log, staff role metadata | Supabase → Settings → API keys (secret key) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | creating enrolment-fee orders | Razorpay Dashboard → Account & Settings → API keys (test keys first) |
| `RAZORPAY_WEBHOOK_SECRET` | verifying webhooks | the secret you type when creating the webhook (step 3) |
| `RESEND_API_KEY`, `RESEND_FROM` (existing) | transactional e-mails | Resend; the sending domain must be verified for mail to reach applicants |
| `NEXT_PUBLIC_SITE_URL` (existing) | links in e-mails and the cadet QR code | e.g. `https://blackstallion.academy` |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (existing, optional) | bot check on sign-up | Cloudflare |

Without the Razorpay variables the payment button is replaced by "the academy will contact you about the fee"; without Resend the
e-mails are recorded as `skipped`. No payment is ever simulated.

## 3. Razorpay webhook

Razorpay Dashboard → Webhooks → Add: URL `https://<site>/api/payments/razorpay`, secret = `RAZORPAY_WEBHOOK_SECRET`, events
`payment.captured`, `order.paid`, `payment.failed`, `refund.processed`. Test with test keys: approve a cadet application with a non-zero
fee, pay with a Razorpay test card, and check that the application shows "Paid" and the invoice number.

## 4. Fees, GST and invoices (business decisions)

- Set the real enrolment fee: `update public.programs set enrolment_fee_paise = <paise> where code = 'foundation';` (as SUPER_ADMIN or SQL
  Editor). Add programmes the same way.
- GST: the default rate is 18 % per programme. A GST-compliant tax invoice also needs the academy's legal name, GSTIN, address and
  HSN/SAC code; record them before going live (see `docs/BUSINESS_LEGAL_REVIEW.md`). Today the invoice number is issued on payment and
  shown to the parent; a PDF tax invoice is not generated yet.

## 5. Accounts and roles

- Admissions staff: create the user, then set Auth → Users → user → `app_metadata` `{"role":"ADMISSIONS"}` before they sign up, or
  as SUPER_ADMIN `update public.users set role = 'ADMISSIONS' where email = '...';` (audited by the existing guard).
- Supabase → Authentication → URL Configuration: add the live site address to the redirect allow-list so confirmation and reset links work.
- Supabase → Authentication → Multi-Factor: enable TOTP and require it for staff accounts (see the security notes).

## 6. Privacy and legal review before launch

India's Digital Personal Data Protection Act 2023 and its Rules require verifiable parental consent for processing a child's data,
purpose limitation, notice, retention limits and grievance handling. The forms record consent with a version and time; the notice
text (`/privacy`), the retention period, and the grievance officer must be confirmed by counsel before applications open.
