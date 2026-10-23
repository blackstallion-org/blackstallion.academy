# Staff console (`/admin`): pages, queries, RLS and live checks

Status 24 Oct 2026: merged in commit `aa11096`. Built and verified locally only, using unit tests and a production
build rendered against a temporary Supabase stub with synthetic data. **Nothing here has run against the live project
yet** — it needs a signed-in `SUPER_ADMIN` on a deployment; the live checks are at the end of this file.

## How access works (every page and action)

1. `proxy.ts` (matcher `/admin`, `/admin/:path*`) refreshes the Supabase session cookie, sends signed-out visitors to
   `/admin/login`, and sets `x-robots-tag: noindex, nofollow` and `cache-control: private, no-store`.
2. Every page and every staff server action calls `requireStaff()` (`lib/auth/admin.ts`) first, on the server:
   `auth.getUser()` re-validates the session with Supabase Auth, then the role is read under RLS from `public.users`
   (live: `SUPER_ADMIN`), falling back to `public.profiles` (website-only schema). Anyone else is redirected to
   `/admin/login?e=forbidden`. A guard test fails if a new `app/admin/**/page.tsx` forgets the call.
3. All queries use the signed-in user's own client (publishable key plus session cookie), so **Row Level Security
   decides what comes back**. The console never uses the secret key.
4. Errors never reach the page as raw database text. The page shows a plain sentence, and the server logs
   `console.error(JSON.stringify({ event, code | status }))`: no message, details, hint or personal data
   (`lib/admin/server.ts → logAdminError`).

Rendering: `app/admin/layout.tsx` sets `export const instant = false`, so each console page renders whole, per request,
instead of streaming behind `<Suspense>`. Streamed content needs JavaScript to appear; rendered whole, the lists, the
GET filter forms and the status form all work without it. The same opt-out lets `/admin/leads/[id]` build, because the
root layout's `usePathname()` has no prerenderable value for an unknown id. The layout also sets `data-parallax-skip`,
so the site-wide scroll parallax (`components/motion/SiteParallax.tsx`) leaves console headings alone.

## Pages

Times are shown in India Standard Time (`Asia/Kolkata`). Date filters are whole IST days: `from=2026-10-23` means
`created_at >= 2026-10-22T18:30:00Z`, and `to=2026-10-23` means `created_at < 2026-10-23T18:30:00Z`. Lists show 50 rows
per page (`.range()`), with an exact count (`Prefer: count=exact`) and a stable order (`created_at desc, id desc`). A page
number past the end (PostgREST `PGRST103`) shows "past the end of the list" instead of an error. Invalid filter values
are dropped, and the page lists each one under "Filters adjusted". Filters are parsed with zod in `lib/admin/filters.ts`.

### `/admin` · Enquiries
- Query: `onboarding_leads?select=id,lead_type,gate,status,contact_name,email,phone,payload,attribution,assigned_to,created_at`
  with these filters:
  - `q` (search): `or=(contact_name.ilike.%t%,email.ilike.%t%,phone.ilike.%t%,payload->>organisation.ilike.%t%)`
  - `gate` and `status`: `eq` against fixed lists
  - `source=qr`: `attribution->>qr=not.is.null`
  - `source=utm`: an `or` group of `attribution->>utm_*.not.is.null`
  - `from` / `to`: `created_at=gte/lt` on the IST bounds above

  Assignee names come from `users?select=id,full_name&id=in.(…)`.
- Each row shows the form (gate), the received time (IST), the name (a link to the detail page), organisation, contact,
  a two-line message preview, a **QR badge with the code** when `attribution.qr` exists, UTM tags, the assignee, and
  the inline status form.
- RLS: `onboarding_leads_staff_read` (select, `app_private.is_website_staff()` = `SUPER_ADMIN`); `users.super_admin_all`
  for the names.

### `/admin/leads/[id]` · One enquiry
- The id must be a UUID; a malformed or unknown id calls `notFound()` (see "Known behaviour").
- Queries:
  - `onboarding_leads` for the whole row (`eq id`, `maybeSingle`).
  - `generated_documents?lead_reference=eq.<idempotency_key>` (newest 20), plus 5-minute signed URLs from
    `storage.from('private-documents').createSignedUrls(paths, 300)`.
  - `audit_events?entity_type=in.(onboarding_leads,onboarding_lead)&entity_id=eq.<id>` (newest 100), plus
    `audit_events?entity_type=eq.generated_documents&entity_id=in.(<document ids>)`, merged newest first.
  - Staff names for the assignee and the audit actors.
- It shows every payload field as text (objects as indented JSON text; nothing is rendered as HTML), attribution, the
  consent time, the privacy-notice version, the reference (idempotency key), the status form, **Assign to me**, the
  linked documents and the activity trail.
- RLS: `onboarding_leads_staff_read`, `generated_documents_staff_read`, the storage policy
  `"private-documents staff read"` (needed to sign URLs), `audit_events_staff_read`, and `users.super_admin_all`.
- Two entity names on purpose: `submit_lead_v2` audits intake as `entity_type = 'onboarding_lead'` (action
  `lead.submitted`), while the row trigger uses the table name `onboarding_leads` (`row.update`).

### `/admin/mou` · MOU requests (read-only)
- Query: `mou_requests` (all display columns; `order=created_at.desc.nullslast,id.desc`), with `q` (school name) as
  `school_name=ilike.%t%` and `status=eq.<PENDING|REVIEWING|SIGNED|REJECTED>`.
- Linking: the website mirror writes `Website MOU enquiry. Reference <ref>` into `notes`. **The live migration passes the
  enquiry's UUID** (`new_id::text` in `submit_lead_v2`), not the idempotency key. The console accepts both:
  - A UUID is looked up with `onboarding_leads?id=in.(…)`.
  - A key is looked up with `onboarding_leads?idempotency_key=in.(…)`.
  - The draft PDF is found with `generated_documents?lead_reference=in.(<keys of the matched enquiries>)` and gets a
    5-minute signed link.
  - Only validated UUIDs and keys ever reach an `in()` list.
- Status is shown, never edited: there is no update policy for the website.
- RLS: `super_admin_read_mou` (select when `current_role_name() = 'SUPER_ADMIN'`), plus the policies above for the links.

### `/admin/qr` · QR captures (read-only)
- Query: `qr_lead_captures?select=id,hub_slug,parent_name,parent_phone,student_grade,source,converted_to_enrollment,created_at`.
  - `hub` and `source` filters are exact (`eq`) values limited to the attribution character set.
  - `ip_address` and `device_info` are deliberately never selected.
- The per-hub summary is a second query, `select=hub_slug,source,converted_to_enrollment&limit=1000` (newest first, with
  the same source and date filters but not the hub filter), counted in JavaScript. The page says so: "Based on the latest
  N captures… reads at most 1,000 rows".
- RLS: `super_admin_read_leads`.

### `/admin/audit` · Audit log
- Query: `audit_events?select=id,actor_user_id,action,entity_type,entity_id,metadata,created_at`.
  - Record-type filter: "Enquiries" expands to both entity names; any other `[a-z_]` table name in the URL is matched
    exactly.
  - Action filter: `eq`; dates: IST bounds as above.
  - Actor names come from `users`. A null actor means no signed-in user (the website intake, or the server with the
    secret key) and is shown as "Website / system".
- Metadata holds column names and intake facts only. The trigger never copies values.
- RLS: `audit_events_staff_read` (select). The table is append-only: there are no write grants, and a trigger rejects
  update and delete.

### `/admin/documents`
- As before (100 newest, 5-minute signed links), with two changes. Links are now matched by storage path rather than
  array position. Each document links to its enquiry through
  `onboarding_leads?idempotency_key=in.(<lead_reference values>)`, or shows "no matching enquiry".

### `/admin/media`
- Unchanged apart from the new navigation, whole-page rendering, a logged load error, and a fix for horizontal overflow
  at 390 px (the native file input).

## Server actions (`app/admin/actions.ts`)

| Action | Order of work | What it may change |
| --- | --- | --- |
| `setLeadStatus(prev, form)` | `requireStaff()` → zod: UUID id + status from the fixed list → `update({ status }).eq('id', id).select('id')` | `status` only |
| `assignLeadToMe(prev, form)` | `requireStaff()` → zod: UUID id → `update({ assigned_to: user.id }).eq('id', id).select('id')` | `assigned_to` only, always the session's own user id (form fields are ignored) |

- `.select('id')` returns the rows actually updated. **Zero rows** (RLS hid the row, or it does not exist) is reported as
  "Nothing was saved", never as a success. Errors are logged as `admin.lead_status_failed` / `admin.lead_assign_failed`
  with the code only.
- On success: `revalidatePath('/admin', 'layout')`, because the list, the detail page and the audit log all change.
- Relies on the column grant `grant update (status, assigned_to) on onboarding_leads to authenticated`, the policy
  `onboarding_leads_staff_update`, and the triggers `onboarding_leads_updated` and `audit_onboarding_leads`. Every change
  is audited as `row.update` with `changed_columns`.

## Search sanitiser (PostgREST `.or()` injection)

The enquiry search is interpolated into an `.or()` filter string, so `lib/admin/filters.ts`:
- maps every character outside letters (including combining marks, so Indic names work), digits, spaces and
  `@ . + - _` to a space, collapses whitespace, and caps the term at 80 characters (counted by code point);
- escapes LIKE wildcards (`_` `%` `\`);
- has `leadSearchFilter()` throw if handed anything unsanitised.

Every other filter value is an enum, a strict regex match or a constant. Tests cover injection strings such as
`x),status.eq.new,id.not.is.null,(`. They also cover URL building against the real postgrest-js builder and the
action behaviour with a fake Supabase client (`tests/admin-console.test.mjs`).

## Known behaviour and limitations

- **Soft 404 on `/admin/leads/[id]`.** `notFound()` renders "Enquiry not found" with `noindex`, but Next answers HTTP
  200. A dynamic segment is resumed from its partial-prerender shell, so the status is already sent. `/journal/[slug]`
  and `/schools/[slug]` on the public site behave the same today. Without JavaScript that page is blank (Next's error
  shell). Returning a real 404 would need a Proxy check (Next's documented route).
- **No-JS confirmations.** Without JavaScript the status form still saves, and the re-rendered page shows the new
  value. The inline "Status saved" or error sentence appears only with JavaScript: Next 16.4 resumes the render without
  React's form state.
- **Phone search** matches the stored formatting: `98765 43210` finds `+91 98765 43210`, but `9876543210` does not.
- **Exact counts.** Exact counts on `audit_events` are fine at today's volume. Switch to `count: 'estimated'` if it
  grows into hundreds of thousands of rows.
- **Website-only schema.** On the website-only schema (`supabase/migrations/`), `mou_requests` and `qr_lead_captures`
  do not exist, so those two pages show "could not be loaded".
- **Not changed, out of scope:**
  - `deleteMedia` ignores storage and database failures silently.
  - A React hydration warning (#418) occurs on every page, including the public `/contact`, when the browser asks for
    reduced motion.
  - Without JavaScript, the intro overlay covers pages for 8 seconds.

## Verify live after deployment (signed in as a SUPER_ADMIN)

1. `/admin` lists enquiries, and the count matches `select count(*) from public.onboarding_leads`. Page 2 appears after 50.
2. Search by part of a name, e-mail, phone and organisation. Then search `a,b)`: the note "Some of the search text was
   left out" appears and nothing errors.
3. Filters: form, status, **QR** (rows with a QR badge only), **campaign (UTM)**, and a one-day date range. An enquiry
   received at 00:10 IST belongs to that day.
4. Open an enquiry and change its status: "Status saved" appears. In SQL, the newest `audit_events` row is `row.update`,
   entity `onboarding_leads`, with `{"changed_columns":["status","updated_at"]}` and your user id as actor.
5. **Assign to me**: `onboarding_leads.assigned_to` becomes your `auth.uid()`, the page says "You", and the audit row
   lists `assigned_to`.
6. On an MOU enquiry: the document appears, and "Download PDF" opens. After five minutes the same link must fail.
7. `/admin/mou`: rows mirrored from the website show "Website enquiry →" (to the right enquiry) and "MOU draft (PDF)"
   when a PDF was stored. Rows created by the operations team say "Not from the website form".
8. `/admin/qr`: rows and per-hub counts load; a hub link filters the list.
9. `/admin/audit`: `lead.submitted` rows ("Enquiry received · Website / system") and your status changes appear;
   the record-type and event filters work.
10. `/admin/documents`: each document links to its enquiry.
11. Sign in as a non-staff account (e.g. a PARENT). Every `/admin/*` page must redirect to `/admin/login?e=forbidden`.
    Optionally replay a status-change POST with that session: it must report "Nothing was saved" and change no row.
12. Signed out, `/admin/audit` must redirect to `/admin/login`.
13. Vercel logs show only `admin.*` events with a code or status, and no e-mails, names or messages.
14. With JavaScript disabled, `/admin` renders the list, and the filter form and the status change both work.
