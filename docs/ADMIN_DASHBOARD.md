# Staff overview (`/admin`): the live dashboard

Status 29 Oct 2026. Built and checked locally with synthetic data (the development preview below) and unit tests against a stubbed
Supabase client. **Nothing here has run against the live project**: it needs a signed-in staff account on a deployment.

## What it is
`/admin` used to be the enquiries list. It is now an overview: four key figures, an area chart of enquiries over time, a live feed,
bars, columns, a gauge and tables, in a frame with a collapsible sidebar (a slide-in menu on a phone). The enquiries list moved to
`/admin/enquiries` (an old `/admin?status=new` link is redirected there with its filters, after the staff check).

Look: the site's own tokens and `.plate` surface (nothing hard-coded), numbers in Martian Mono, thin brass hairlines. The dark
theme is the site's `.tone-dark` scope on the console's plate, not a hand inversion. Motion: figures count up, lines draw
themselves, bars grow, cards rise in turn, new feed rows slide in and glow for a few seconds, the live dot breathes. Under
reduced motion none of that runs; the picture is simply there.

## Data and privacy
- `lib/admin/overview-server.ts → loadOverview(supabase)` reads as the signed-in staff member, so RLS decides what comes back (same
  as every console page). Eight reads in parallel, each standing alone: a table that is missing or refuses is named in
  `snapshot.unavailable` and that card says so; there is never an invented zero.
  - `onboarding_leads`: the last 90 days, newest first, capped at 1,500 rows (`id, created_at, gate, status, attribution,
    assigned_to`; `qr` and `utm` are reduced to booleans); the eight newest with `contact_name`; exact head counts (all, status
    `new`).
  - `member_accounts` status `pending`, `mou_requests` status `PENDING`/`REVIEWING`: exact head counts.
  - `audit_events`: twelve newest (the intake `lead.submitted` rows are dropped, the enquiry itself is in the feed).
  - `qr_lead_captures`: newest 1,000 summarised per hub (top six).
- **No e-mail address, phone number, message or payload ever leaves the server in a snapshot.** A test checks the selected columns
  and the serialised result.
- Everything else (the 7/30/90-day switch, previous-period deltas, breakdowns, sparklines) is computed in the browser from the
  snapshot by `lib/admin/overview.ts` (pure, tested), in IST days. If more than 1,500 enquiries fall in 90 days the page says so.
- "Export summary" downloads counts only (per day, form, status, source), never contact details.

## How "live" works
- First render: the server page calls `loadOverview`. After that the open page calls the server action
  `refreshOverview` (`app/admin/overview-actions.ts`) every **10 s** while the tab is visible: it re-checks the staff role first like
  every console action, then returns a fresh snapshot. A failed call keeps the old figures, shows "Reconnecting…" and backs off
  (20 s, 40 s, up to 60 s); a hidden tab pauses; coming back refreshes at once; never two calls at once.
- New rows are flagged for 4.5 s (the glow) and counted ("+2 new enquiries since you opened this page").
- **Not Supabase Realtime (push), on purpose, for now.** Push needs three things that cannot be verified while the project is
  paused: the tables added to the `supabase_realtime` publication (a migration), the Supabase origin and `wss:` in the CSP
  `connect-src` (`next.config.mjs`), and a browser-side Supabase client holding the staff session. The server-action poll needs
  none of them and keeps RLS in one place. Latency is up to ten seconds. If push is wanted later, `useLiveOverview` already takes
  any `refresh()`: a Realtime channel would only need to call "refresh now" when a row changes (the payload stays untrusted).

## Layout each person arranges
Thirteen widgets (`components/sections/admin/dashboard/widgets.tsx`). **Customise** shows move-earlier / move-later / remove on
every card (buttons, so it works by keyboard and by touch); **Add widget** opens a drawer (a side sheet on a desktop, a bottom
sheet on a phone) listing what is not on the dashboard, with a sketch, a tag and Select; **Restore the default layout** resets.
Saved per browser in `localStorage` (`bsah-admin-widgets`, `-range`, `-side`, `-theme`), never anywhere else; if storage is blocked
the choice lasts for the page load.

## Files
`app/admin/AdminShell.tsx` (frame, sidebar, drawer, theme; every console page is wrapped in it), `AdminNav.tsx` (the section list),
`page.tsx` (overview), `enquiries/page.tsx` (the moved list), `overview-actions.ts`;
`components/sections/admin/dashboard/` (`LiveDashboard`, `widgets`, `charts`, `use-live-overview`);
`lib/admin/overview.ts`, `overview-server.ts`, `sample.ts`; tests `tests/admin-overview.test.mjs`.
No new dependency (`lucide-react` and `motion` were already installed; the charts are plain SVG).

## Development preview (SAMPLE)
`npm run dev`, then `/dev/admin-dashboard` (the dashboard) and `/dev/admin-dashboard/list` (a list and a wide table inside the
frame). Invented SAMPLE data, a pretend new enquiry every six seconds, rendered on the server and refreshed by a server action
exactly like the real page, and labelled SAMPLE on screen. These routes answer **404 in production** and sit outside the `/admin`
guard because they hold no real data.

## Live checks (needs a staff account on a deployment)
1. Sign in; `/admin` shows real counts that match `/admin/enquiries` (total) and `/admin/accounts` (pending).
2. Submit a test enquiry from the website; within ten seconds it appears in the feed with the glow and the counters move.
3. Block the network for a minute: "Reconnecting…", the old figures stay, and it recovers by itself.
4. Sign out in another tab: the next refresh redirects to sign-in instead of showing data.
5. If `qr_lead_captures` or `mou_requests` is not in that project, the card says it could not be loaded and the rest still works.
