# Registration and admissions: security (4 Nov 2026)

## Controls in place (each tested; see REGISTRATION_TEST_RESULTS.md)

| Threat | Control |
| --- | --- |
| Self-promotion through a form | Sign-up role comes only from server-set app metadata (F2); everyone else is PARENT. Submitting or being approved grants nothing; only a SUPER_ADMIN activates a role, limited to INSTRUCTOR/GROOM for staff and SCHOOL_ADMIN for schools, never SUPER_ADMIN or ADMISSIONS. |
| Editing someone else's application (IDOR) | RLS on every table: applicant rows by `auth.uid()`, reviewers by role function; ids in URLs only find rows the caller may see. |
| Changing status, decision, fee or payment state | Column grants exclude them; only the workflow functions write them, each checking the caller and the allowed transition. |
| Duplicate submissions | Partial unique indexes: one open application per child (cadet) and one per person per kind; submit only from draft/info_required. |
| Unverified contact | Submit requires a confirmed e-mail address (Supabase Auth confirmation). |
| Minors' accounts and data | Minors never log in; children are guardian-owned records. Guardian consent (versioned, timed) is recorded per cadet application. E-mails never contain a child's name, date of birth, medical notes or documents. |
| Malicious uploads | Private bucket; path `<uid>/<application>/<file>` enforced by storage and table policies; PDF/JPEG/PNG/WebP only, 10 MB, first bytes must match the type (no renamed executables, no SVG); file names sanitised; reviewers open files through 5-minute signed links. |
| Faked payments | Only `ingest_payment_event` (service role) marks paid, after the webhook's HMAC is verified over the raw body; the amount must equal the server-created order; each Razorpay event id is applied once; a late failure never undoes a payment; the browser callback marks nothing. |
| Injection / malformed input | Zod on every action, database CHECK constraints and enums; queries through the Supabase client (parameterised); filters stripped of PostgREST metacharacters. |
| Open redirect after sign-in | `safeNext` accepts only a same-site path. |
| Abuse | Rate limit `application` (40 per 10 minutes per client) on every applicant action, the existing sign-up and login limits, honeypot fields; Turnstile when keys exist. |
| Secrets | The secret key is used only in server code (`lib/supabase/admin.ts`, no `NEXT_PUBLIC_`); Razorpay keys likewise; logs carry no addresses, names or message content. |
| Audit | Every application step: `application_events` (append-only) and `audit_events` (append-only, no personal values); role activation and payment outcomes are audited. |

## Open items (need the owner)

1. **Admin MFA.** Supabase TOTP must be enabled and required for SUPER_ADMIN and ADMISSIONS accounts (Dashboard → Authentication).
   The console does not yet refuse an AAL1 session; enforcing `aal2` in `requireStaff`/`requireAdmissions` is a small follow-up
   once the staff have enrolled a factor (enforcing it first would lock them out).
2. **Turnstile keys** are not provisioned; sign-up relies on rate limits and the honeypot meanwhile.
3. **Privacy review (DPDP Act 2023 and Rules)** before applications open: parental-consent wording, retention period, grievance officer,
   cross-border processing (Supabase Seoul region, Resend, Razorpay). See REGISTRATION_SETUP.md §6.
4. **Free Supabase plan has no backups**: take one before applying the migration, and plan a paid tier before real applications.
5. **ADMISSIONS sees medical notes** a guardian enters; that is intended (safety), but limit the role to the people who need it.
6. **Phone OTP / SMS / WhatsApp** are not implemented: no approved provider.
7. The separate operations apps (`bsah-platform/`) were not changed or re-audited here.

## Not claimed

No production readiness is claimed for this system: it has not run against the live database (the migration is not applied there),
no real payment, e-mail or upload has gone through it, and the authenticated pages were not exercised with a signed-in account.
