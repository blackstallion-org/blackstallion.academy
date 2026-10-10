# SBSA Mobile Ecosystem PRD

> Source: `instructions/BSAH_Combined_Documents.pdf (pages 19-25)` (converted to Markdown for Claude Code; the original file is unchanged).

```text
M A S T E R T EC H N I CA L S P EC I F I CAT I O N & P R D



    SBSA Mobile Ecosystem
    SBSA Sovereign (Public) & BSAH Field Ops (Internal)

    Parent Entity: Vicarius Infinitum Holdings Operating Sub: BSAH Pvt Ltd          Scope: Pan-India Deployment
                                                                                    Architecture




   DOCUMENT PURPOSE: Comprehensive System Walkthrough, Daily Retention Architecture, Operational Protocols,
   and Full-Stack Developer Directives for Pan-India Execution across all school hubs.



  SECTION 1: SYSTEM ARCHITECTURE & DUAL-APP STRATEGY
To preserve luxury brand prestige for parents and cadets while enforcing zero-excuse military discipline on the ground, the
mobile ecosystem is executed as Two Dedicated Target Applications compiled from a Single Shared Codebase
(Flutter Monorepo).



  APP 1: "SBSA SOVEREIGN"                                            APP 2: "BSAH FIELD OPS"
  Public Prestige & Retention App                                    Internal Utility Workhorse App

     • Target Audience: Parents & Cadets                               • Target Audience: Ex-Military Instructors, Grooms,
     • Visual Vibe: Royal Obsidian (#0A0B0E), Brushed                    Vet Staff, School Admins
       Brass (#C5A059), Gold Serif Typography                          • Visual Vibe: Rugged High-Contrast Utility,
     • Core Focus: Daily Retention Loops, 24/7 Stall-                    Massive Touch Targets, Multilingual Toggle
       Cam, 10-Sec Milestone Reel, Autopay                             • Core Focus: Geofenced Biometrics, Timed Feed/
     • Distribution: Public Apple App Store & Google                     Water Proofs, AI 10-Sec Video Recorder
       Play Store                                                      • Distribution: Internal Google Play Private Track /
                                                                         Enterprise Sideload APK




  SECTION 2: PUBLIC APP WALKTHROUGH — "SBSA SOVEREIGN"
Designed to turn horsemanship into a daily positive habit for cadets and deliver complete emotional reassurance to
parents, embedding 5 High-Retention Hooks:




Vicarius Infinitum Holdings — SBSA Technical PRD                                                                      Page 1 of 7
 Retention Hook                           Mechanism & Operational Purpose

 1. 24/7 Stall-Cam                        Sub-second WebRTC feed to assigned Marwari stallion stable camera.

 2. 06:00 AM Stoic Daily Spark            30-second audio drop & daily leadership streak counter increment.

 3. 10-Sec Milestone Reel & AI            HD video snippet with posture transformation slider ("tech-neck" elimination).
 Mirror

 4. Digital Sovereign Passport &          Gamified ranks (Squire → Rider → Knight → Lancer), brass seals, uniform badges.
 Deck

 5. Parent Community & BNI                RSVP hub for monthly weekend socials, breakfasts, and tent pegging tournaments.
 Network


2.1 The Cadet Experience: "The Sovereign Armory"

  USER JOURNEY: CADET MORNING & SESSION ROUTINE

  [06:00 AM]      Push Notification: "Cadet Zayd, your Daily Stoic Spark is live."
  [06:01 AM]      Listens to 30-sec audio quote on courage, emotional composure, and discipline.
  [06:02 AM]      Leadership Streak Counter increments (+1 Day).
  [04:00 PM]      Arrives at Arena; Instructor scans physical Leather Passport QR code.
  [05:00 PM]      App unlocks 10-sec HD Milestone Reel from today's session in the "Hall of Valour".



Key Features Breakdown:

  • 06:00 AM Stoic Daily Spark: Authoritative 30-second audio drop over ambient arena soundscapes focusing on
    emotional composure under pressure and discipline.
  • Digital Sovereign Passport & Badge Deck: Digital twin of the handcrafted physical leather passport showcasing
    metallic/embroidered badges, insert slides, and heavy brass certifications.
  • 10-Second HD Milestone Reel ("Hall of Valour"): Private media vault storing auto-recorded 10-second HD clips from
    every training session.
  • AI Posture Transformation Mirror: Side-by-side slider comparing Day 1 riding posture against current sessions to
    prove spinal realignment.

2.2 The Parent Experience: "The Guardian Portal"

  USER JOURNEY: PARENT MONITORING & EVENING RETENTION

  [04:05 PM]      Push Alert: "Cadet Zayd checked in at DPS Hub Arena - 04:05 PM."
  [05:15 PM]      Post-Session Alert: Milestone Video Ready + 3-Part Star Ratings (Riding, Ground, Stable).
  [08:30 PM]      Checks 24/7 Stall-Cam to watch assigned stallion resting in its stable box.



Key Features Breakdown:

  • 24/7 Favorite Horse Stall-Cam: Sub-second WebRTC video stream displaying real-time status overlays (e.g., "Stallion
   Chetak | Status: Rest / Night Feed Completed").
  • Instant Attendance Alerts: Triggered when physical leather passport is scanned by trainer at entry gate.
  • Treasury Management & Autopay: Direct GST tax invoices, automated UPI Autopay mandates (₹8,000 + GST/mo),
   safety kits (₹3,000), and replacement passports.



Vicarius Infinitum Holdings — SBSA Technical PRD                                                                            Page 2 of 7
  • Parent Community & BNI Network Hub: Event calendar to RSVP for weekend breakfast meets and networking
    socials.


  SECTION 3: FIELD APP WALKTHROUGH — "BSAH FIELD OPS"
Built for speed, rugged usability, and high-contrast visibility under harsh sunlight and low cellular coverage.

3.1 Ex-Military Instructor Workflow

   INSTRUCTOR 30-SECOND EVALUATION WORKFLOW:
    1. Taps "Scan Passport" & scans Cadet Leather Passport QR code.
    2. Sets 3-Part Star Sliders: Riding (1-10), Ground (1-10), Stable (1-10).
    3. Selects Learned Skill Chips (e.g., "Walk-Trot Transition", "Spine Realignment").
    4. Taps "Record Milestone" (Camera records strictly 10s & auto-stops).
    5. Reviews MediaPipe AI posture suggestion and hits "Publish to Ledger".


  • Auto-Stop 10-Second Camera Engine: Locked to max 10s with skeletal line overlays for framing.
  • AI Trainer Assistant: Integrated pose-estimation model auto-generates posture rating drafts.

3.2 Groom & Stable Staff Workflow (Proof Protocols)

  GROOM DAILY TIMED CARE SCHEDULE & PROOF PROTOCOLS

  [05:30 AM]      Geofenced Biometric Face-Scan Punch-In (≤ 50m radius from campus hub).
  [06:00 AM]      Loud Feed/Water Alarm rings continuously until photo proof is submitted.
  [08:00 AM]      Grooming & Hoof Inspection Photo Log per assigned stallion.
  [12:00 PM]      Midday Hydration & Feed Proof Capture.
  [04:00 PM]      Pre-Session Tack & Safety Equipment Inspection.
  [07:00 PM]      Night Feed, Vet Medication Log & Stable Lockout.



  • Non-Dismissible Alarms: FCM high-priority channel bypasses device silent mode until photo proof is taken.
  • AI Water/Feed Proof Validation: Vision model checks feed/water presence and blocks gallery uploads. Watermarked
    with Timestamp + GPS + Stallion Microchip ID.


  SECTION 4: EXECUTIVE OVERVIEW — "SOVEREIGN COMMAND CENTER"
Built exclusively for Saef Ullah Khan and the executive team at Vicarius Infinitum Holdings to aggregate real-time
telemetry across all national school hubs.




Vicarius Infinitum Holdings — SBSA Technical PRD                                                                     Page 3 of 7
  Key Executive Modules
     • National God-Eye Map: Real-time operational map across India. Status indicators: Green (Optimal Operations),
       Yellow (Pending Feed Proof / Capacity Alert), Red (Overdue Feed >15 mins / Vet Alert).
     • Automated Revenue Waterfall Engine: Real-time tracking of gross tuition collections auto-calculating:
        ◦ Direct GST Tax Remittances & School Ground Revenue Share (25%–30%).
        ◦ Local Hub Operational Expenses (Horse Feed, Vet Care, Trainer Salaries).
        ◦ Director Loan EMI Servicing (Phase 1: ₹8,626/mo; Phase 2: ₹64,923/mo).
        ◦ 10% Retained Sinking Reserve Fund.
        ◦ Net Operating Profit Split: 60% to Vicarius Infinitum Holdings & 40% to Mir Raza Ali Khan.

     • Automated Anomaly Push Matrix: Immediate push alerts if feed windows are missed by >15 mins, trainer
       ratings drop, or livestock health anomalies occur.




  SECTION 5: COMPLETE TECHNICAL DEVELOPER DIRECTIVES (PRD)

1. Flutter Monorepo Architecture

  /sbsa_mobile_monorepo
    ├── /lib
    │     ├── /core           <-- Shared API Services, Models, Auth, Local DB
    │     ├── /apps
    │     │     ├── /sovereign <-- Parent & Cadet Screens/Widgets (main_sovereign.dart)
    │     │     └── /fieldops <-- Instructor, Groom & Admin Screens/Widgets (main_fieldops.dart)
    │     ├── main_sovereign.dart
    │     └── main_fieldops.dart



2. Mobile Technical Specifications
  • Auto-Stop Camera (/lib/core/camera): Hard limit 10s (maxDuration: Duration(seconds: 10)), output compressed
    MP4 (720p, H.264) uploaded to AWS S3.
  • Geofenced Biometrics (/lib/core/geofence): Verifies staff location against school_hubs.latitude/longitude (≤
    50m radius).
  • Local Offline Storage (/lib/core/storage): Hive/SQLite caching for Field Ops. Photos/videos queue locally and sync
    when online.
  • Non-Dismissible Alarms (/lib/core/alarms): FCM high-priority channel (channel_id: groom_feed_alerts)
    bypassing silent mode.




Vicarius Infinitum Holdings — SBSA Technical PRD                                                               Page 4 of 7
3. Database Schema Extensions (PostgreSQL DDL)

  -- 9. GROOM & STAFF DAILY CARE LOGS
  CREATE TABLE groom_daily_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      hub_id UUID REFERENCES school_hubs(id) ON DELETE CASCADE,
      groom_id UUID REFERENCES users(id),
      horse_id UUID REFERENCES equine_fleet(id),
      log_type VARCHAR(50) NOT NULL, -- 'FEED_MORNING', 'WATER_MIDDAY', 'GROOMING_HOOF', 'FEED_NIGHT',
  'VET_MED'
      proof_photo_s3_url TEXT NOT NULL,
      latitude NUMERIC(10,8) NOT NULL,
      longitude NUMERIC(11,8) NOT NULL,
      ai_verified BOOLEAN DEFAULT TRUE,
      scheduled_time TIMESTAMP WITH TIMEZONE NOT NULL,
      completed_time TIMESTAMP WITH TIMEZONE DEFAULT NOW()
  );

  -- 10. STAFF ATTENDANCE (GEOFENCED & BIOMETRIC)
  CREATE TABLE staff_attendance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      hub_id UUID REFERENCES school_hubs(id),
      punch_in_time TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
      punch_out_time TIMESTAMP WITH TIMEZONE,
      punch_in_latitude NUMERIC(10,8) NOT NULL,
      punch_in_longitude NUMERIC(11,8) NOT NULL,
      biometric_verified BOOLEAN DEFAULT TRUE
  );

  -- 11. SYSTEM ANOMALY FLAGS (SOVEREIGN COMMAND)
  CREATE TABLE system_anomalies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      hub_id UUID REFERENCES school_hubs(id),
      severity VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
      title VARCHAR(255) NOT NULL,
      description TEXT,
      resolved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW()
  );



4. API Route Specification
POST /api/v1/groom/task-submit

Headers: Authorization: Bearer <JWT_TOKEN>, Content-Type: multipart/form-data




Vicarius Infinitum Holdings — SBSA Technical PRD                                                  Page 5 of 7
  // Multipart Form Data Parameters
  hubId: "h1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c"
  horseId: "e1f2a3b4-5c6d-7e8f-9a0b-1c2d3e4f5a6b"
  logType: "FEED_MORNING"
  latitude: 17.385044
  longitude: 78.486671
  proofPhoto: [morning_feed_photo.jpg] (Binary)

  // Response (200 OK)
  {
    "status": "success",
    "message": "Groom care log recorded and verified",
    "data": {
      "logId": "g9f8e7d6-c5b4-a3f2-e1d0-c9b8a7f6e5d4",
      "aiTroughCheck": "PASSED",
      "timestamp": "2026-09-26T06:05:12Z"
    }
  }



5. 4-Sprint Deployment Roadmap

 Sprint                      Focus Area                Key Deliverables

 Sprint 1                    Backend Core & Monorepo   Provision PostgreSQL tables 1 to 11. Initialize Flutter Monorepo targets
 (Days 1 – 10)               Setup                     (main_sovereign.dart & main_fieldops.dart). Build JWT Auth,
                                                       RBAC, and S3 video queue.

 Sprint 2                    Field Ops App & Groom     Multilingual Field Ops UI (HI, TE, EN). Geofenced face-scan
 (Days 11 – 20)              Proofs                    attendance, FCM high-priority alarms, 10s auto-stop camera, offline
                                                       Hive sync queue.

 Sprint 3                    Sovereign App & Parent    Royal Obsidian/Brass UI. 24/7 WebRTC stall-cam player, 10-sec
 (Days 21 – 30)              Hooks                     milestone reel feed, Razorpay UPI Autopay mandates.

 Sprint 4                    Sovereign Command & Go-   Executive Command Center web dashboard with God-Eye map,
 (Days 31 – 40)              Live                      automated revenue waterfall, Socket.io anomaly triggers, security audit,
                                                       and store submission.




Vicarius Infinitum Holdings — SBSA Technical PRD                                                                      Page 6 of 7
   6. Direct Developer Mandate Script for Turnkey Handoff
   "Attention Lead Developer & Engineering Team,

   Please find attached the complete Master Technical Specification & Product Requirement Document (PRD) for the SBSA
   Mobile Ecosystem.

   Execution Directives:
     • Codebase Structure: Initialize a single Flutter Monorepo configured with dual compilation targets
       (main_sovereign.dart and main_fieldops.dart).
     • Sprint 1 Kickoff: Provision PostgreSQL schema tables 1 through 11 and set up the AWS S3 video processing pipeline.
     • Core Priorities:
        ◦ 10-Second Auto-Stop Camera: Enforce a strict 10-second recording limit in the mobile camera controller.
         ◦ Groom Alarm & Proof System: Implement FCM high-priority alarm channels and offline Hive queueing for feed/
           water photo proofs.
         ◦ Stall-Cam Player: Integrate WebRTC video player via flutter_webrtc for sub-second live streaming.
         ◦ Sovereign Command Center: Build the executive dashboard with real-time Socket.io anomaly triggers.

   Please confirm receipt of this document and share your repository initialization links once Sprint 1 setup is complete.

   Executive Leadership | Vicarius Infinitum Holdings Private Limited"




Vicarius Infinitum Holdings — SBSA Technical PRD                                                                             Page 7 of 7
```
