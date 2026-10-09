# BSAH Complete Architecture Guide (website, app, Supabase)

> Source: `BSAH_Complete_Architecture_Guide (1).pdf` (converted to Markdown for Claude Code; the original file is unchanged).

```text
BSAH / SBSA DIGITAL ECOSYSTEM
The Complete Website, Mobile App & Supabase Architecture Guide


Written for: Sting Raj — Full-stack developer & solo builder, RANAU Digital Growth Solutions

Client: Vicarius Infinitum Holdings Pvt Ltd / The Black Stallion Academy of Horsemanship (BSAH)

Source documents: Web Portal PRD, SBSA Mobile Ecosystem PRD, Phase 1 Telemetry Addendum, Web Elevation
Addendum, AI-Augmented Execution Guide



This is every piece of the system — website, app, and Supabase database — explained point by point, in
plain language, the way a senior engineer would walk a teammate through it on day one. No section is
skipped and no jargon is left unexplained.



CONTENTS
1. The Big Picture — What You're Actually Building
2. The Full System Map (All 4 Layers, Explained)
3. Supabase — The Heart of the Whole System (All 11 Tables, Field by Field)
4. Table Relationship Map — How Everything Connects
5. Website Architecture — All 13 Routes, Section by Section
6. Mobile App Architecture — The Flutter Monorepo (2 Apps, 1 Codebase)
7. The API Layer — Every Endpoint and What It Talks To
8. Real-Time & Media Pipeline — Stall-Cam, Video, Streaming
9. Authentication & Role-Based Access (Who Can See What)
10. Payments — How Money Moves Through the System
11. Your Build Order — Step-by-Step, As a Solo Developer
12. Plain-English Glossary — Every Term Used in This Doc
    1 THE BIG PICTURE — WHAT YOU'RE ACTUALLY
    BUILDING
Strip away all the branding (Sovereign, Citadel, Marwari gold, brass seals) and this is a standard, well-understood
pattern in modern software: one shared database, three different front doors.

•   One Supabase/PostgreSQL database — the single source of truth. Every screen in every app reads from and
    writes to this one place.

•   One public marketing + utility website (Next.js) — for parents, schools, and the general public. This is
    blackstallion.academy.

•   One Flutter codebase that compiles into two separate mobile apps — 'Sovereign' (parents/cadets) and
    'Field Ops' (staff/instructors/grooms). Same code folder, two different build targets, two different apps on the app
    stores.

•   One executive dashboard ('Sovereign Command Center') — a web view for the owner (Saef) to see everything
    happening across every school hub in real time.
So when you hear 'the app', remember it's really two apps built from one project. When you hear 'the website', that includes the
public marketing pages and the executive dashboard — both are the same Next.js project, just different routes with different
login permissions.



Why build order matters
Everything — website, both apps, dashboard — reads and writes to the same 11 Supabase tables. If you build the
website first without the database, you're building on sand: you'll build a page, then have to rebuild it once the real
table structure exists. That's why your own instinct (database first) is correct, and it's exactly how Section 11 of this
guide is ordered.



    2 THE FULL SYSTEM MAP (ALL 4 LAYERS,
    EXPLAINED)
A modern full-stack system is always described in layers — stuff the user sees, stuff that processes requests, stuff
that moves video/files around, and stuff that stores data. Here's what's in each layer for this project, and why each
piece was chosen.

    Layer               What's in it                                Plain-English job

    1. Frontend         Next.js 14 website (React + Three.js 3D)    The actual screens. Next.js renders the website on the
    (what users         + Flutter mobile app (2 build targets)      server first (good for Google search), then becomes
    see)                                                            interactive in the browser. Flutter builds one native-feeling
                                                                    app for both iPhone and Android from a single codebase.

    2. API & logic      Node.js backend (NestJS/Express) +          No app is ever allowed to touch the database directly
    (the                JWT login tokens + role rules (RBAC) +      without going through here (or through Supabase's built-in
    middleman)          Socket.io for live updates                  secure API, which does the same job automatically). This
                                                                    layer checks 'are you logged in, and are you allowed to do
                                                                    this?' before anything happens.

    3. Media &          AWS S3 (file storage) + CloudFront (fast    Video is heavy. This layer makes sure uploading a
    streaming           delivery) + MediaMTX (turns stable CCTV     10-second clip, compressing it, and streaming a live
    (video/photos)      into a watchable live stream) +             camera feed doesn't freeze the rest of the app.
                        Redis/BullMQ (a waiting line for heavy      Redis/BullMQ is literally a 'to-do list' for the server — jobs
                        jobs)                                       queue up and get processed one at a time in the
                                                                    background.
 Layer            What's in it                            Plain-English job

 4. Data          PostgreSQL via Supabase (11 tables) +   This is the permanent record of everything: every user,
 (permanent       Redis cache + analytics                 every horse, every session score, every payment. Section
 storage)         (PostHog/Mixpanel)                      3 breaks down every single table here.



Practical translation for a solo dev with Supabase + Vercel: You don't need to stand up a separate
Node.js server, Redis, or a hand-rolled JWT system on day one. Supabase already gives you Postgres,
auto-generated REST + GraphQL endpoints, built-in Auth (JWT), and Row Level Security (RLS) as your
permission layer. You can launch V1 on Supabase + Next.js API routes alone, and bolt on a dedicated
Node.js service later only if you need custom heavy logic (e.g. video transcoding orchestration) that
doesn't fit inside Supabase Edge Functions.
  3 SUPABASE — THE HEART OF THE SYSTEM (ALL 11
  TABLES)
Supabase is just managed PostgreSQL with extras bolted on: instant REST/GraphQL APIs generated from your
tables, built-in login (Auth), file storage (Storage), and per-row permission rules (Row Level Security / RLS) so a
parent can only ever see their own cadet's data. Below is every table from the PRDs, in the order they were
specified, with every column explained in plain English.


TABLE 1 — school_hubs
What it's for: One row per physical school campus that has a BSAH equestrian hub installed.

Explain-like-I'm-new: Think of this as the 'campus directory'. Every other table that cares about 'which physical location' points
back to a row in this table.

   Column                        Type                What it means in plain English

   id                            UUID                Unique ID for this hub. Auto-generated, never changes.

   school_name                   text                Full name of the school, e.g. 'DPS Vijayawada'.

   slug                          text                URL-safe short name, e.g. 'dps-vijayawada'. Used in links like
                                                     /hub/dps-vijayawada.

   architectural_tier            text                Which facility package the school bought: Standard, Signature, or Royal
                                                     Pavilion.

   address                       text                Physical location of the campus hub.

   contact_email                 text                School's contact email.

   revenue_share_percent         number              What % of tuition the school keeps (default 25%).
   age

   created_at                    timestamp           When this hub record was created.

Connects to: equine_fleet (each horse belongs to one hub); cadets (each cadet is enrolled at one hub); groom_daily_logs,
staff_attendance, system_anomalies (all tagged to a hub)



TABLE 2 — equine_fleet
What it's for: One row per horse (the actual animals used for training).
Explain-like-I'm-new: This is the 'horse registry'. Every horse has its own camera feed URL stored right here — that's how the
app knows which live video stream to open when a parent taps 'Watch my cadet's horse'.

   Column                        Type                What it means in plain English

   id                            UUID                Unique ID for this horse.

   hub_id                        UUID → schoo        Which campus this horse lives at.
                                 l_hubs.id

   name                          text                The horse's name, e.g. 'Chetak'.

   breed                         text                Breed, defaults to 'Marwari'.

   microchip_iso_id              text                The physical microchip number implanted in the horse — used for identity
                                                     verification.

   stall_cctv_rtsp_url           text                The camera feed address for this horse's stable, used by the live stall-cam
                                                     feature.

   is_active                     boolean             Whether this horse is currently in service.
   Column                        Type                What it means in plain English

   created_at                    timestamp           When this horse was added to the system.

Connects to: school_hubs (parent location); cadets (a cadet is assigned one horse); training_sessions (each session
involves one horse); groom_daily_logs (care logs per horse)



TABLE 3 — users
What it's for: Every human who can log in: parents, instructors, school admins, and the super admin (Saef).

Explain-like-I'm-new: This is the ONE login table for every human in the system — both apps and the website all check this
same table to log someone in. The 'role' column is doing all the heavy lifting: it's the switch that decides whether someone sees
the parent app screens or the staff app screens.

   Column                        Type                What it means in plain English

   id                            UUID                Unique ID for this person.

   full_name                     text                Their name.

   email                         text (unique)       Login email — can't be reused across accounts.

   phone_number                  text (unique)       Login phone number.

   role                          text                One of: PARENT, INSTRUCTOR, SCHOOL_ADMIN, SUPER_ADMIN.
                                                     This single column controls what they can see — see Section 9.

   password_hash                 text                Encrypted password. Never store plain-text passwords — Supabase Auth
                                                     handles this automatically for you.

   created_at                    timestamp           Account creation date.

Connects to: cadets (a parent-role user owns one or more cadets); training_sessions (an instructor-role user logs sessions);
payment_records, staff_attendance, groom_daily_logs (all reference a user)



TABLE 4 — cadets
What it's for: One row per enrolled student (the child doing the riding).
Explain-like-I'm-new: This is the most important table in the whole app — it's the record that ties a real child to a parent login,
a school, a horse, and a public verification code. Nearly every screen in the Sovereign app is really just 'show me data where
cadets.id = the logged-in parent's cadet'.

   Column                        Type                What it means in plain English

   id                            UUID                Unique ID for this cadet.

   parent_id                     UUID →              Which parent account owns/manages this cadet.
                                 users.id

   hub_id                        UUID → schoo        Which campus they're enrolled at.
                                 l_hubs.id

   assigned_horse_id             UUID → equin        Their personally assigned horse.
                                 e_fleet.id

   first_name /                  text                Cadet's name.
   last_name

   passport_code                 text (unique)       Their public ID code, e.g. BSAH-2026-HYD-042 — this is what gets typed
                                                     into the /verify page.

   current_rank                  text                Squire → Rider → Knight → Lancer. Starts at CADET_SQUIRE.

   onboarding_fee_paid           boolean             Whether the one-time ₹2,000 fee has cleared — gates full access.
   Column                       Type                What it means in plain English

   created_at                   timestamp           Enrollment date.

Connects to: users (parent); school_hubs, equine_fleet (location & horse); training_sessions (their session history);
payment_records (their billing history)



TABLE 5 — training_sessions
What it's for: One row per riding lesson — the actual graded activity, created by an instructor.

Explain-like-I'm-new: This is the 'report card' table. Every time an instructor scans a cadet's QR passport and submits scores,
a new row lands here. The cadet's rank (in the cadets table) gets manually or automatically bumped up once enough good
sessions pile up here.

   Column                       Type                What it means in plain English

   id                           UUID                Unique ID for this session.

   cadet_id                     UUID →              Which cadet this session is for.
                                cadets.id

   instructor_id                UUID →              Which instructor ran and graded it.
                                users.id

   horse_id                     UUID → equin        Which horse was used.
                                e_fleet.id

   session_date                 date                Date of the session, defaults to today.

   riding_score /               integer 1-10        The '3-part assessment': how they rode, how they handled ground work,
   ground_score /                                   how they handled stable duties.
   stable_score

   instructor_notes             text                Free-text comments from the instructor.

   video_log_s3_url             text                Link to the 10-second milestone video clip stored in AWS S3.

   brass_stamp_verified         boolean             Whether this session counts as officially certified.

   created_at                   timestamp           When the session was logged.

Connects to: cadets, users (instructor), equine_fleet (all referenced)



TABLE 6 — qr_lead_captures
What it's for: One row per person who scanned a school flyer QR code — marketing/sales lead tracking, before
they enroll.
Explain-like-I'm-new: This is pure marketing-funnel data. Every flyer QR code on campus posters points to /hub/[schoolSlug];
scanning it and filling the mini-form writes one row here. 'converted_to_enrollment' is the single number that proves the flyer
campaign actually worked.

   Column                       Type                What it means in plain English

   id                           UUID                Unique ID.

   hub_slug                     text                Which school's flyer was scanned (not a strict foreign key — stored as
                                                    plain text so leads work even before a hub row exists).

   parent_name /                text                Basic lead info captured from the form.
   parent_phone /
   student_grade

   device_info /                text                Technical fingerprint for analytics/fraud checks.
   ip_address
   Column                       Type                What it means in plain English

   converted_to_enrollme        boolean             Flips to TRUE once this lead becomes a real paying cadet — this is your
   nt                                               marketing ROI number.

   created_at                   timestamp           When the QR was scanned.

Connects to: No hard foreign key — intentionally loose so marketing can capture leads fast without needing a full account
first.



TABLE 7 — payment_records
What it's for: One row per payment transaction — onboarding fee, safety kit, or monthly tuition.

Explain-like-I'm-new: This is the money ledger. Nothing is ever deleted from here — it's a permanent audit trail of every rupee
that moved through the system, which is exactly what you need come GST filing time.

   Column                       Type                What it means in plain English

   id                           UUID                Unique ID.

   cadet_id / parent_id         UUID →              Who the payment is for and who paid.
                                cadets.id /
                                users.id

   gateway_order_id /           text                IDs returned by Razorpay/Cashfree — lets you reconcile with the payment
   gateway_payment_id /                             provider's dashboard.
   gateway_subscription_
   id

   amount_paid /                number              The actual money and the GST portion of it, kept separate for tax filing.
   gst_amount

   payment_type                 text                ONBOARDING, SAFETY_KIT, or MONTHLY_TUITION.

   status                       text                PENDING, SUCCESS, FAILED, etc.

   pdf_invoice_s3_url           text                Link to the auto-generated GST invoice PDF.

   created_at                   timestamp           Transaction date.

Connects to: cadets, users (parent)



TABLE 8 — executive_appointments
What it's for: One row per school principal/chairman who books a sales meeting through the website.
Explain-like-I'm-new: This is a simple CRM-style booking table for the 'school board & chairmen' side of the business —
completely separate from parent/cadet data, because the people filling this form aren't logged-in users yet.

   Column                       Type                What it means in plain English

   id                           UUID                Unique ID.

   school_name /                text                Who's booking and from which school.
   representative_name /
   designation

   phone_number / email         text                Contact info.

   campus_land_area_sqft        integer             Used to pre-qualify which facility tier (Standard/Signature/Royal) fits their
                                                    land.

   preferred_date /             date / text         Requested meeting slot.
   preferred_time_slot

   status                       text                SCHEDULED, COMPLETED, CANCELLED, etc.
   Column                       Type               What it means in plain English

   created_at                   timestamp          Booking date.

Connects to: No foreign keys — this is a B2B sales lead, independent of the cadet/parent world.



TABLE 9 — groom_daily_logs
What it's for: One row per care task completed by stable staff (feeding, watering, grooming, vet meds) — the
proof-of-work log.

Explain-like-I'm-new: This is the accountability backbone of the Field Ops app. Every alarm, every red/yellow/green dot on the
Executive dashboard's map, traces back to whether a row was created here on time.

   Column                       Type               What it means in plain English

   id                           UUID               Unique ID.

   hub_id / groom_id /          UUID →             Where, who, and which horse.
   horse_id                     school_hubs /
                                users /
                                equine_fleet

   log_type                     text               FEED_MORNING, WATER_MIDDAY, GROOMING_HOOF,
                                                   FEED_NIGHT, or VET_MED.

   proof_photo_s3_url           text               Photo proof — required, not optional.

   latitude / longitude         number             GPS location where the photo was taken, to prove the groom was actually
                                                   on-site.

   ai_verified                  boolean            Whether an AI vision check confirmed feed/water was actually visible in the
                                                   photo.

   scheduled_time /             timestamp          When it was supposed to happen vs. when it actually happened — this gap
   completed_time                                  drives the 'overdue' alerts.

Connects to: school_hubs, users (groom), equine_fleet (horse)



TABLE 10 — staff_attendance
What it's for: One row per clock-in/clock-out event for any staff member (geofenced + biometric).
Explain-like-I'm-new: A straightforward digital attendance register, except it can't be faked from the couch — GPS +
face-scan both have to check out before a row is written.

   Column                       Type               What it means in plain English

   id                           UUID               Unique ID.

   user_id / hub_id             UUID → users       Who clocked in and at which campus.
                                / school_hubs

   punch_in_time /              timestamp          Shift start/end.
   punch_out_time

   punch_in_latitude /          number             GPS at punch-in — must be within 50 metres of the hub.
   punch_in_longitude

   biometric_verified           boolean            Whether a face-scan confirmed it was really that staff member.

Connects to: users, school_hubs



TABLE 11 — system_anomalies
What it's for: One row per automatically-flagged problem — the 'something needs attention' table that feeds the
executive dashboard.

Explain-like-I'm-new: This table is usually written to automatically by a background rule (e.g. 'if groom_daily_logs has no row
15 minutes past scheduled_time, insert a row here'), not typed in by a human. It's what makes the dots on the executive
'God-Eye' map turn yellow or red.

   Column                        Type               What it means in plain English

   id                            UUID               Unique ID.

   hub_id                        UUID → schoo       Which campus the problem is at.
                                 l_hubs.id

   severity                      text               LOW, MEDIUM, HIGH, or CRITICAL.

   title / description           text               What went wrong, e.g. 'Feed window missed by 22 minutes'.

   resolved                      boolean            Whether someone has dealt with it.

   created_at                    timestamp          When the system detected it.

Connects to: school_hubs
 4 TABLE RELATIONSHIP MAP — HOW EVERYTHING
 CONNECTS
Below is the whole database as one connected tree. An arrow means 'this table points to that one' (a foreign key).
Read it top to bottom — each level depends on the level above it existing first, which is also the order you should
create these tables in Supabase.

school_hubs (campus)
  ■■■■ equine_fleet (horses, one per hub)
  ■■■■ cadets (students, one per hub)
  ■■■■ groom_daily_logs
  ■■■■ staff_attendance
  ■■■■ system_anomalies

users (every login: parent / instructor / school_admin / super_admin)
  ■■■■ cadets.parent_id (a parent owns cadets)
  ■■■■ training_sessions.instructor_id
  ■■■■ groom_daily_logs.groom_id
  ■■■■ staff_attendance.user_id
  ■■■■ payment_records.parent_id

cadets (students — depends on school_hubs + users + equine_fleet)
  ■■■■ training_sessions.cadet_id (their session history)
  ■■■■ payment_records.cadet_id (their billing history)

equine_fleet (horses — depends on school_hubs)
  ■■■■ cadets.assigned_horse_id
  ■■■■ training_sessions.horse_id
  ■■■■ groom_daily_logs.horse_id

qr_lead_captures (stand-alone — no foreign keys, just raw marketing data)
executive_appointments (stand-alone — B2B sales leads, no foreign keys)


Build order this implies: school_hubs and users have no dependencies, so they're created first (in
either order). Then equine_fleet (needs school_hubs). Then cadets (needs school_hubs + users +
equine_fleet). Then everything else (training_sessions, payment_records, groom_daily_logs,
staff_attendance, system_anomalies) can go in any order since they only depend on tables already
created. qr_lead_captures and executive_appointments have zero dependencies and can be created any
time.
  5 WEBSITE ARCHITECTURE — ALL 13 ROUTES,
  SECTION BY SECTION
The website is a single Next.js 14 project (App Router). Each bullet below is one route/page. 'Route' just means the
URL path — Next.js automatically turns each folder under /app into a live page.


   / (home)                               Hero + 3D Neuro-Equine Crucible
What happens here: Full-screen cinematic video hero with headline, then an interactive 3D horse model (Three.js / React
Three Fiber) where hovering over body parts (ears, spine, reins) shows layered facts: equine science, rider biomechanics,
neuroscience, character trait. Also includes the 'Crisis vs Cure' comparison table and the live institutional ticker banner.
Data it pulls from Supabase: None required for the static hero — the 3D hotspot content (HOTSPOT_DATA) can be
hardcoded in the frontend as it's marketing copy, not live data. The ticker banner can optionally pull a live count from
training_sessions.
API calls involved: None required for V1 (purely client-side 3D + static content).


   /curriculum                            The Sovereign Ledger & Skill Tree
What happens here: Shows the 4 cadet ranks (Squire → Rider → Knight → Lancer) as a game-style skill tree, explains the
3-part assessment framework, and showcases the physical passport/seal/badges.
Data it pulls from Supabase: Static content mostly — rank definitions don't need to live in Supabase unless you want them
editable without a code deploy (optional: a 'ranks' reference table).
API calls involved: None for V1.


   /hubs                                  Campus Configurator & ROI Calculator
What happens here: Lets a school principal pick a facility tier (Standard/Signature/Royal) and see CapEx + projected monthly
revenue share.
Data it pulls from Supabase: Optional: read from school_hubs if you want to show real example hubs; the ROI math itself can
run entirely client-side off hardcoded tier numbers.
API calls involved: None required — pure calculator logic in the browser.


   /hub/[schoolSlug]                      Individual School Flyer Landing Page
What happens here: The page a QR code on a physical flyer points to. Shows that specific school's branding and a short
lead-capture form (name, phone, grade).
Data it pulls from Supabase: Reads school_hubs (matched by slug) to show the right school name. Writes a new row to
qr_lead_captures on form submit.
API calls involved: POST /api/v1/leads/capture


   /verify/[code]                         Public Passport & Credential Verifier
What happens here: Anyone (e.g. an Ivy League admissions officer) types a passport code and sees a verified, watermarked
digital certificate: rank, riding hours, EFI registration ID, milestone videos. Also generates a downloadable PDF.
Data it pulls from Supabase: Reads cadets (by passport_code) joined with training_sessions for hours/rank and video URLs.
API calls involved: GET /api/v1/verify/:passportCode


   /fleet                                 Equine Heritage & Bloodline Vault
What happens here: Studbook-style gallery of all horses with microchip verification, pedigree, and live vitals (age, height,
temperament, which hub, stall-cam status).
Data it pulls from Supabase: Reads equine_fleet (joined with school_hubs for location).
API calls involved: Optional live status check against the stall-cam stream URL.
   /command-ai                            Sovereign Command AI Terminal
What happens here: A chat-style terminal where principals/parents can ask free-text questions about ROI, biomechanics,
insurance, or MOUs and get structured answers.
Data it pulls from Supabase: Pulls context from school_hubs / cadets as needed depending on the question; otherwise calls
an LLM API with the relevant PRD knowledge baked into the prompt.
API calls involved: A dedicated /api/v1/command-ai/ask endpoint that wraps an LLM call.


   /tournaments                           Interscholastic Tournament & League Engine
What happens here: Live leaderboard of inter-school standings (STPCI), a tournament calendar, and match replay highlight
reels.
Data it pulls from Supabase: Needs a 'tournament_results' or similar table if you want this live — not in the original 11 tables,
so flag this as scope to confirm with the client, or launch V1 with static/manually-updated content.
API calls involved: GET endpoint for standings once a tournament_results table exists.


   /about                                 The Sovereign Mandate
What happens here: Corporate story: parent entity, instructor pedigree, breed revival mission.
Data it pulls from Supabase: Fully static content — no database needed.
API calls involved: None.


   /contact                               Executive Citadel Access
What happens here: Three contact corridors: school board fast-track booking, cadet enrollment helpdesk, and regional
sports-director partner inquiries.
Data it pulls from Supabase: The 'school board fast-track' form writes to executive_appointments. The other two corridors
can be simple email-forwarding forms for V1.
API calls involved: POST to create an executive_appointments row.


   /pay                                   Sovereign Treasury & Payment Gateway
What happens here: Handles the ₹2,000 onboarding fee, ₹9,440/month tuition (with GST), and optional ₹3,000 safety kit, via
Razorpay/Cashfree, including UPI Autopay mandates and auto-generated GST invoices.
Data it pulls from Supabase: Reads cadets (to know who's paying) and writes to payment_records on success; also flips
cadets.onboarding_fee_paid.
API calls involved: POST /api/v1/payments/create-order, plus a webhook endpoint the payment gateway calls back on
success.


   /mou-request                           Institutional MOU Generator
What happens here: School trustees pick campus parameters and get a customised draft MOU PDF, plus a request to book a
signing meeting.
Data it pulls from Supabase: Can reuse executive_appointments for the meeting request; the PDF itself is generated client-
or server-side from a template with the chosen parameters filled in.
API calls involved: None mandatory — can be a pure PDF-generation function.


   /admin (Command Center)                Sovereign Command Center Dashboard
What happens here: Executive-only (SUPER_ADMIN role) view: national map of hub status (green/yellow/red), revenue
waterfall, and live anomaly alerts.
Data it pulls from Supabase: Reads system_anomalies, school_hubs, payment_records (aggregated), groom_daily_logs (for
status dots).
API calls involved: Protected by RBAC — only SUPER_ADMIN role can load this route. Realtime via Supabase Realtime or
Socket.io.
    6 MOBILE APP ARCHITECTURE — THE FLUTTER
    MONOREPO
'Monorepo' just means one single code folder that produces more than one final product. Here, one Flutter project
compiles into two completely separate apps that go on the App Store / Play Store as two different listings.
/sbsa_mobile_monorepo
  ■■■ /lib
      ■■■ /core     <- shared code: API calls, data models, login, local offline storage
      ■■■ /apps
      ■    ■■■ /sovereign <- parent/cadet-only screens
      ■    ■■■ /fieldops    <- instructor/groom/admin-only screens
      ■■■ main_sovereign.dart <- entry point that builds the Sovereign app
      ■■■ main_fieldops.dart    <- entry point that builds the Field Ops app


    SBSA SOVEREIGN (public app)                                BSAH FIELD OPS (internal app)

    Audience: parents & cadets                                 Audience: instructors, grooms, vet staff, school admins

    Look: dark obsidian + gold, luxury feel                    Look: rugged, high-contrast, huge touch targets for
                                                               outdoor/sunlight use

    Core screens: 24/7 stall-cam, daily audio drop, 10-sec     Core screens: scan passport QR → grade session,
    milestone reel, digital passport/rank, community events,   geofenced face-scan clock-in, timed feed/water proof capture
    payments                                                   with photo + GPS, 10-second auto-stop camera

    Distribution: public App Store + Google Play               Distribution: private/internal track — not public

    Tables it mainly touches: cadets, training_sessions,       Tables it mainly touches: groom_daily_logs,
    payment_records, equine_fleet (stall-cam url)              staff_attendance, training_sessions, system_anomalies



Key technical rules baked into the Field Ops app
•   10-second hard camera limit on every video recording (maxDuration: Duration(seconds: 10)) — keeps
    storage/bandwidth costs predictable and matches the 'milestone clip' format used everywhere.

•   Geofencing — staff clock-in GPS must be within 50 metres of the hub's stored coordinates, or the punch is
    rejected.

•   Offline-first queueing — Field Ops uses local storage (Hive/SQLite) so a groom in a low-signal stable can still
    submit a photo proof; it syncs to Supabase automatically once signal returns.

•   Non-dismissible alarms — feed/water reminders use a high-priority push notification channel that bypasses the
    phone's silent mode until a photo is submitted.

Key technical rules baked into the Sovereign app
•   WebRTC player for the 24/7 stall-cam — sub-second-latency live video, with an HLS fallback for slower
    connections.

•   MediaPipe on-device pose analysis (optional Phase 1 add-on) — runs entirely on the phone's own chip, costs
    nothing in server fees, and produces the 'posture score' badge without ever sending video to a server for that
    specific feature.
 7 THE API LAYER — EVERY ENDPOINT AND WHAT IT
 TALKS TO
An 'endpoint' is one specific door into your backend — a URL plus a method (GET to read, POST to create). With
Supabase you often don't need to hand-write most of these; Supabase auto-generates REST and GraphQL
endpoints directly from your tables, and you only write custom endpoints (as Next.js API routes or Supabase Edge
Functions) for logic that's more than a plain read/write — payments, verification, uploads.

  Endpoint                           Used by              What it does

  POST /api/v1/leads/capture         Website              Writes a new row to qr_lead_captures.
                                     /hub/[schoolSlug]

  POST /api/v1/sessions/submit       Field Ops app        Writes a new training_sessions row with scores + uploads the
                                                          10s video to S3, stores the URL.

  GET /api/v1/horses/:horseId/       Sovereign app        Returns a short-lived WebRTC/HLS stream token so the
  stall-cam                                               parent app can open the live camera for their cadet's horse.

  POST /api/v1/payments/create       Website /pay         Creates a Razorpay/Cashfree order, returns the amounts
  -order                                                  breakdown and a subscription ID for autopay.

  GET                                Website              Public (no login needed) lookup of a cadet's rank, hours, and
  /api/v1/verify/:passportCode       /verify/[code]       milestone videos by passport code.

  POST                               Field Ops app        Writes a groom_daily_logs row with GPS + photo proof, runs
  /api/v1/groom/task-submit                               the AI feed/water visual check.



Every other read (e.g. 'show me this cadet's rank', 'list this hub's horses') can go straight through
Supabase's auto-generated API with Row Level Security doing the permission-checking for you — you
don't need to write a custom endpoint for simple reads.
    8 REAL-TIME & MEDIA PIPELINE — STALL-CAM,
    VIDEO, STREAMING
The 10-second video clip journey (groom/instructor records → parent
watches)
•   1. Phone camera records, hard-capped at 10 seconds by app code.

•   2. App compresses to 720p H.264 MP4 locally before uploading (keeps data usage and S3 cost low).

•   3. Video uploads to AWS S3 (if offline, it queues locally via Hive and retries once signal returns).

•   4. The S3 URL gets saved into the relevant row (training_sessions.video_log_s3_url or a groom log).

•   5. CloudFront CDN serves the video back out fast, worldwide, using secure signed URLs so random people can't
    guess a link and watch someone else's cadet.


The 24/7 live stall-cam journey (always-on camera → parent watches live)
•   1. A physical IP camera in the stable streams over RTSP (a raw camera-streaming protocol, not browser-friendly
    on its own).

•   2. MediaMTX (or Go2RTC) sits in the middle and converts that RTSP feed into WebRTC (near-instant,
    sub-second delay) and HLS (a fallback format, a few seconds of delay but works on almost any device/network).

•   3. The app asks the backend for a stream token (GET /api/v1/horses/:horseId/stall-cam), which returns a
    short-lived WebRTC URL and an HLS fallback URL.

•   4. The app's video player connects directly to that stream URL.


Why Redis + BullMQ (or Supabase's own queue approach)
Video compression and AI checks (posture analysis, feed/water verification) are too slow to run while the user is
sitting there waiting. Instead, the upload is accepted instantly, a background job is queued, and the job processes a
few seconds later — the user never sees a frozen screen. On Supabase you can achieve the same effect with Edge
Functions triggered by a database webhook, without running your own Redis server, which is the simpler path for a
solo dev.
 9 AUTHENTICATION & ROLE-BASED ACCESS (WHO
 CAN SEE WHAT)
Every logged-in person is one row in the users table, and that row has a single 'role' column. That one column is the
switch for everything else — the frontend decides which screens to show, and the backend (via Row Level Security
policies in Supabase) decides which rows of data they're allowed to read or write, no matter what the frontend tries
to do.

  Role                  Sees                                                   Can write

  PARENT                Only their own cadet(s): rank, sessions, stall-cam,    Their own profile, payment initiation.
                        invoices.

  INSTRUCTOR            Cadets at their assigned hub(s).                       New training_sessions rows for cadets
                                                                               they coach.

  SCHOOL_ADMIN          Everything at their one hub — cadets, horses, staff,   Hub-level records only.
                        logs.

  SUPER_ADMIN           Every hub, nationwide — the full Command Center        Everything.
                        view.



In Supabase terms: Auth gives every logged-in request a JWT token with the user's ID baked in. Row
Level Security (RLS) policies on each table say things like 'a PARENT can only SELECT rows from
cadets where parent_id = the logged-in user's ID.' This is enforced by the database itself — even if
someone hacks the app's frontend code, the database still refuses to hand over data they're not allowed
to see.
    10 PAYMENTS — HOW MONEY MOVES THROUGH THE
    SYSTEM
    Fee                               Amount                               When

    One-time onboarding fee           ₹2,000                               At enrollment — unlocks passport, seal,
                                                                           uniform badges.

    Monthly tuition                   ₹8,000 + 18% GST = ₹9,440            Recurring, 1st of every month via UPI
                                                                           Autopay / e-NACH.

    Optional safety kit               ₹3,000                               Optional, at enrollment.


•   Step 1 — Order creation: Website calls POST /api/v1/payments/create-order with the cadet ID and options
    (safety kit yes/no, autopay yes/no). Backend computes the total and asks Razorpay/Cashfree for an order ID.

•   Step 2 — Checkout: User pays through the Razorpay/Cashfree hosted checkout widget — you never touch raw
    card numbers.

•   Step 3 — Webhook confirmation: The gateway calls your server back (a webhook) to confirm success or
    failure — this is the trustworthy source of truth, not the browser redirect.

•   Step 4 — Record + unlock: On confirmed success, a new payment_records row is written,
    cadets.onboarding_fee_paid flips to TRUE if relevant, and a GST invoice PDF is generated and stored.

•   Step 5 — Recurring billing: For monthly tuition, an e-NACH/UPI Autopay mandate is set up once; after that, the
    gateway auto-charges monthly and fires a webhook each time, which again writes a new payment_records row.
 11 YOUR BUILD ORDER — STEP BY STEP, AS A SOLO
 DEVELOPER
This follows your own instinct: Supabase first, then website, then app — because both the website and both mobile
apps are just different 'windows' looking into the same database. Build the windows before the walls exist and you'll
be redoing work.

 STEP 1 — Create the Supabase project
Create one Supabase project (your own Gmail, so you control it and can hand over access cleanly later). Note down
the project URL and the anon/service-role API keys — you'll need these in both the Next.js website and the Flutter
app.


 STEP 2 — Run all 11 CREATE TABLE scripts, in dependency order
Paste the SQL from Section 3/4 into the Supabase SQL editor in this order: school_hubs → users → equine_fleet →
cadets → training_sessions → qr_lead_captures → payment_records → executive_appointments →
groom_daily_logs → staff_attendance → system_anomalies.


 STEP 3 — Turn on Row Level Security and write policies
For every table, enable RLS, then write policies matching Section 9 (a PARENT can only see their own cadet's rows,
etc). Do this before writing any frontend code, so you're never tempted to fake security in the app instead of the
database.


 STEP 4 — Set up Supabase Auth
Turn on email/phone login. Supabase Auth creates its own internal auth.users table — link your public 'users' table
to it via a matching ID, and store the 'role' field in the public table (or as a custom claim on the Auth user).


 STEP 5 — Seed test data
Manually insert 1 test hub, 2 test horses, 3 test users (one of each role), 2 test cadets. This gives you real data to
build every screen against instead of guessing at empty states.


 STEP 6 — Build the website, page by page, in this priority order
1) /pay and /hub/[schoolSlug] first — these generate revenue and leads immediately. 2) / (home) and /verify/[code]
next — these are what you show the client as proof of progress. 3) /curriculum, /hubs, /fleet, /about, /contact,
/mou-request, /tournaments, /command-ai after — lower urgency, mostly static or simpler data pulls. 4) /admin
(Command Center) last, once enough real data exists in the other tables for the dashboard to actually show
something meaningful.


 STEP 7 — Build the Flutter monorepo — Field Ops target first
Field Ops has simpler, more mechanical screens (scan QR, submit score, take photo) and gives staff a working tool
fast. Build main_fieldops.dart screens against the live Supabase tables you already seeded.


 STEP 8 — Build the Sovereign (parent) app target
Once Field Ops is writing real training_sessions and groom_daily_logs data, the Sovereign app has real content to
display — ranks changing, videos appearing, stall-cam online.


 STEP 9 — Wire up payments and the media pipeline last
Razorpay/Cashfree integration and the S3 + CloudFront + MediaMTX streaming setup are the most operationally
fiddly pieces (webhooks, external accounts, DNS). Do these once the core CRUD flows are already solid, so you're
debugging one new layer at a time instead of everything at once.


 STEP 10 — Deploy and connect the Command Center
Deploy the Next.js site to Vercel, point blackstallion.academy's DNS at it, then build the /admin dashboard last — by
this point system_anomalies, payment_records, and groom_daily_logs all have real rows for it to aggregate.
12 PLAIN-ENGLISH GLOSSARY
Term                      Meaning

API                       A defined way for one piece of software to ask another for data or to make something happen —
                          like a waiter taking an order to the kitchen.

API Gateway               A single front door that all API requests pass through before reaching your real backend logic.

Auth / Authentication     Proving who you are (logging in).

Authorization / RBAC      Once you're logged in, deciding what you're allowed to do — Role-Based Access Control uses
                          your 'role' to decide.

AWS S3                    Amazon's cloud file storage — this is where every video and photo actually lives.

CDN (CloudFront)          A network of servers around the world that cache and deliver your files fast, close to wherever
                          the user physically is.

Edge Function             A small piece of backend code (on Supabase or similar) that runs close to the user, for quick
                          custom logic without running a full server.

Flutter / Dart            Google's toolkit for building one codebase that compiles into native iOS and Android apps. Dart
                          is the programming language it uses.

Foreign Key               A column in one table that points to the ID of a row in another table — this is how tables
                          'connect'.

GraphQL                   An alternative to REST where the app asks for exactly the fields it needs in one request, instead
                          of several separate calls.

HLS                       HTTP Live Streaming — a widely-compatible but slightly-delayed way to stream video, used as a
                          fallback to WebRTC.

JWT (JSON Web Token)      A signed, tamper-proof text string issued when you log in, proving your identity on every request
                          after that without logging in again each time.

Monorepo                  One code repository/folder that contains more than one final app or package.

Next.js                   A React framework that adds server-side rendering, routing, and API routes on top of plain
                          React — what the website is built with.

PostgreSQL ('Postgres')   The actual relational database engine Supabase runs on — a free, extremely robust,
                          industry-standard database.

React Three Fiber /       Libraries for rendering interactive 3D graphics (like the horse model) inside a normal webpage.
Three.js

Redis                     An extremely fast in-memory data store, often used as a temporary cache or as the 'waiting list'
                          for background jobs.

REST                      A standard pattern for APIs using URLs + HTTP methods (GET/POST/PUT/DELETE) — the
                          most common API style.

Row Level Security        Database-level rules that restrict which rows a given user is allowed to read or write — enforced
(RLS)                     even if the app's frontend is bypassed.

RTSP                      A raw video-streaming protocol used by IP cameras — not directly playable in a web browser,
                          which is why MediaMTX converts it.

Socket.io / Realtime      A way for the server to push updates to the app instantly (e.g. a new alert appearing) without the
                          app having to keep asking 'anything new?'.

Supabase                  A managed backend platform built on PostgreSQL that also gives you instant APIs,
                          authentication, file storage, and realtime updates out of the box.

UUID                      A long, random, guaranteed-unique ID (e.g. 8f3b2a1c-4d5e...) used instead of simple numbers
                          so IDs can never collide, even across different systems.
  Term                       Meaning

  Webhook                    A callback — one system automatically calling a URL on your server to tell you something
                             happened (e.g. 'this payment succeeded').

  WebRTC                     A browser/app technology for near-instant (sub-second) live video streaming — used for the
                             stall-cam.




Prepared for Sting Raj — RANAU Digital Growth Solutions. Based on the BSAH/SBSA master PRD documents (Web Portal PRD,
Mobile Ecosystem PRD, Phase 1 Telemetry Addendum, Web Elevation Addendum, and the AI-Augmented Execution Guide).
```
