# BSAH Digital Portal PRD (blackstallion.academy)

> Source: `instructions/BSAH_Combined_Documents.pdf (pages 7-18)` (converted to Markdown for Claude Code; the original file is unchanged).

```text
M A S T E R T EC H N I CA L & C O N T E N T A R C H I T EC T U R E S P EC I F I CAT I O N


    BSAH DIGITAL PORTAL (blackstallion.academy)
    Product Requirement Document (PRD), Architectural Walkthrough & Technical Specification

    Parent Entity: Vicarius Infinitum Holdings Operating Entity: BSAH Pvt Ltd                     Purpose: Full-Stack Developer Execution




   DOCUMENT PURPOSE: Definitive Master Product Requirement Document (PRD), Architectural Walkthrough, Content
   Blueprint, and Full-Stack Technical Specification for Direct Developer Execution.



  SECTION 1: BRAND VISION, EXECUTIVE THEME & SYSTEM ARCHITECTURE

1.1 Aesthetic & Atmospheric Guidelines
The BSAH Web Portal is designed as a digital fusion of a royal heritage museum, a military command citadel, and a high-tech
sports engineering dashboard. It conveys executive authority, ancient nobility, and scientific rigor.

  • Primary Palette: Royal Obsidian (#0A0B0E), Deep Carbon (#12141A).
  • Accent Palette: Brushed Brass (#C5A059), Parchment Gold (#E6CA65), Crimson Command (#8B0000).
  • Typography: Headers set in serif typefaces (Cinzel / Cormorant Garamond); technical specs and data tables set in clean
    sans-serif/monospaced fonts (Inter / JetBrains Mono).
  • Ambient Audio Engine (Optional Toggle): An optional binaural focus frequency (432Hz) layered with subtle ambient
    soundscapes (gentle leather flex, soft turf trotting) activated via an executive brass audio button.


                                                      BSAH DIGITAL ARCHITECTURE
  [FRONTEND LAYER]
  ├── 3D Web Portal (Next.js 14, Three.js, React Three Fiber, Tailwind CSS)
  └── Mobile App (Flutter / React Native - iOS & Android Cross-Platform)

  [API & APPLICATION LAYER]
  ├── API Gateway (Node.js / FastAPI / Go) + GraphQL / REST Endpoints
  ├── Authentication (JWT + OAuth 2.0 + RBAC: Parent, Instructor, SchoolAdmin, SuperAdmin)
  └── Real-Time Engine (Socket.io for Push Notifications & Live Session Status)

  [MEDIA & STREAMING PIPELINE]
  ├── CCTV Streaming Server (RTSP-to-WebRTC / HLS Gateway via MediaMTX or AWS Kinesis)
  └── Video Processing Service (AWS S3 + CloudFront CDN + FFmpeg 10-Sec Transcoder)

  [DATA LAYER]
  ├── Primary Database (PostgreSQL / Supabase with Relational Integrity)
  ├── Cache & Queue (Redis + Celery/BullMQ for Video Processing Jobs)
  └── Analytics Engine (PostHog / Mixpanel + QR Lead Capture Tracking)



  SECTION 2: COMPLETE WEBSITE PAGE & INTERACTIVE WALKTHROUGH

2.1 Hero Section & The First 5 Seconds (The Hook)
  • Background Visual: Cinematic, ultra-dark 4K video loop playing silently: a Marwari stallion galloping in high-speed slow
    motion, its ears curved inward, ridden by a cadet in full uniform executing a lance strike.
  • Ambient Audio Controller: "Enable Sovereign Audio" button (adds subtle focus frequency + ambient equine sounds).
  • Primary Headline:

       "WE DO NOT TEACH CHILDREN TO RIDE. WE FORGE THEM TO LEAD."



Vicarius Infinitum Holdings — BSAH Master Digital PRD                                                                              Page 1 of 12
  • Sub-Headline:

       The Interscholastic Equestrian Leadership Academy & National Tent Pegging Circuit for India’s Premier Schools.

  • Primary Calls-to-Action:
     ◦ [ENTER THE 3D CITADEL] (Launches interactive horse model engine)
      ◦ [SCAN SCHOOL FLYER / FIND YOUR CAMPUS] (Triggers school lead portal)

2.2 The "Neuro-Equine Crucible" (Interactive 3D Anatomy, Muscle, Neural & Character Mapper)
A photorealistic 3D Marwari Stallion & Cadet Model floats in dark space. Hovering over or clicking any anatomical region splits
the viewport into a 4-Layer X-Ray Analysis System:


                                  INTERACTIVE ANATOMY & NEURAL MAPPER LAYERS
  [EQUINE ANATOMY] ──► Withers, Hock Joint, Nuchal Ligament, Sensitive Flank
  [RIDER BIOMECHANICS] ──► Core Multifidus, Adductor Magnus, Vestibular Inner Ear
  [NEUROSCIENCE] ──► Vagal Tone Regulation, Oxytocin Surge, Left-Right Brain Sync
  [STOIC TRAIT] ──► Emotional Command, Unshakable Balance, Diplomatic Tact



Hotspot Interactive Specifications:

  • Marwari Inward Ears (Equine Psychology & Vagal Tone):
     ◦ Equine Science: 180-degree rotation monitoring rider anxiety and heartbeat.
      ◦ Rider Biomechanics: Vagus nerve activation forces parasympathetic calm under pressure.
      ◦ Neurological Impact: Suppresses cortisol by 40%, elevating oxytocin and calm focus.
      ◦ Character Trait Forged: Emotional Self-Governance & Stoic Composure.

  • Saddle & Stirrups (Pelvic Core & Spine Alignment):
     ◦ Equine Science: Demonstrates weight distribution across stallion back muscles.
      ◦ Rider Biomechanics: Dynamic 3D activation of rider's deep core (multifidus), pelvis, and lower spine.
      ◦ Health Impact: Completely corrects forward-head posture ("Tech-Neck") from mobile screen addiction.
      ◦ Character Trait Forged: Physical Poise & Unshakable Alignment.

  • Reins & Lance (Tactical Precision & Command):
     ◦ Equine Science: 10 grams of rein pressure communicates intent to a 500kg stallion.
      ◦ Rider Biomechanics: Forces bi-lateral brain hemisphere coordination (hand precision + leg pressure + spatial timing).
      ◦ Character Trait Forged: Clear Communication, Diplomacy & Instant Decision Making.

2.3 Crisis vs. The Cure Comparison Engine

 Modern Digital Childhood (The Crisis)                             The BSAH Cadet Transformation (The Cure)

 "Tech-Neck" & Slouched Spine from 6+ hours of screen scrolling.   Royal Posture & Core Stability built on a 500kg moving horse.

 Short Attention Spans & dopamine-seeking fragility.               Stoic Composure & Focus under ex-military cavalry instruction.

 Virtual Friends & Isolation behind glass screens.                 Living Equine Bond with an assigned Marwari stallion.

 Generic School Sports lost in standard application files.         National Competition Credentials (EFI & STPCI) for Ivy League
                                                                   admissions.


2.4 The Sovereign Ledger & Character Skill Tree (/curriculum)
  • Interactive Character Development Skill Tree: Renders physical ground activities as a game-style skill tree. Parents click
    on activities like Grooming & Feeding, Jump Navigation, or Handling a Stubborn Horse to see real-world life traits unlocked
    (Reliability, Bravery, Diplomacy, Resilience).
  • The 4 Cadet Titles & Ranks:
     ◦ Cadet Squire: Initial handling, balance, walk-trot transitions, equine anatomy.


Vicarius Infinitum Holdings — BSAH Master Digital PRD                                                                      Page 2 of 12
      ◦ Cadet Rider: Independent canter, obstacle navigation, vagal-tone control.
      ◦ Cadet Knight: Advanced dressage, vaulting, formational cavalry maneuvers.
      ◦ Sovereign Lancer: Target piercing at speed, STPCI national circuit competing.

  • 3-Part Session Assessment Framework: Every single riding session evaluates Riding Class, Ground Class, and Stable
    Class.
  • Honor System Showcase: Displays 3D rotating renderings of the Handcrafted Leather Sovereign Passport, the Heavy
    Brass Certification Seal, and the embroidered Uniform Badges of Honor.

2.5 Campus Hub Architectural Configurator & ROI Engine (/hubs)
Allows school chairmen and principals to visually build and preview their campus equestrian facility:


                                    3-TIER CAMPUS ARCHITECTURAL CONFIGURATOR

  [TIER 1: STANDARD HUB] ──► ₹8.20L CapEx | Professional Arena, Fencing, Stables, Tack Room
  [TIER 2: SIGNATURE] ──► ₹15.00L CapEx | Adds Concrete Breeze Blocks, Dusk Lighting
  [TIER 3: ROYAL PAVILION]─► ₹25.00L+ CapEx | Full Heritage Stone Pavilion & AC Lounge



  • Dynamic School ROI Calculator: School chairmen input student headcount to calculate CapEx Payback Timeline (6 to 8
    months) and projected monthly passive income at ₹8,000/month tuition (25%–30% school share).

2.6 Public Passport & Credential Verifier (/verify)
  • Purpose: Ivy League and global university admissions officers require proof of athletic and leadership claims.
  • Functionality: Anyone can visit blackstallion.academy/verify and enter a cadet’s unique Passport Code (e.g.,
    BSAH-2026-HYD-042).
  • Output: High-resolution, watermarked digital certificate displaying verified rank (Cadet Knight), total riding hours, 10-
    second milestone video logs, heavy brass stamp timestamps, and official Equestrian Federation of India (EFI) registration
    ID.

2.7 Equine Heritage & Bloodline Vault (/fleet)
  • Visual Style: Styled like a royal studbook registry.
  • Content: 3D profile cards of the 21 indigenous Marwari and Kathiawadi stallions.
  • Interactive Elements: ISO Microchip Verification (15-digit code), Pedigree & Lineage Tree, and Real-Time Vitals
    Dashboard (age, height in hands, temperament, assigned hub, 24/7 Stall-Cam status).

2.8 Sovereign Command AI Terminal (/command-ai)
Dark, brushed-brass executive command terminal with gold monospaced typography allowing School Principals, Chairmen, or
Parents to type complex queries and receive structured responses on ROI payback models, biomechanics, insurance, or
MOUs.

2.9 Interscholastic Tournament & League Engine (/tournaments)
  • Live Leaderboard: Real-time inter-school standings under the School Tent Pegging Council of India (STPCI).
  • Tournament Calendar: Schedule for The Sovereign Governor's Cup and the Junior National Equestrian Championship
    (JNEC).
  • Match Replays: Highlight reels of lance strikes, vaulting routines, and dressage points scored by school cadets.

2.10 About Us: "The Sovereign Mandate" (/about)
Details corporate lineage under parent entity Vicarius Infinitum Holdings Private Limited, Stoic command philosophy under ex-
military Indian Army RVC and NCC cavalry instructors, and indigenous breed revival (Marwari and Kathiawadi horses).




Vicarius Infinitum Holdings — BSAH Master Digital PRD                                                                  Page 3 of 12
2.11 Contact Us: "Executive Citadel Access" (/contact)
Splits inquiries into 3 Dedicated Executive Corridors:

  • Corridor 1: School Board & Chairmen Fast-Track: Direct appointment booking for Campus Feasibility Audits & 15-min
    Executive Pitches.
  • Corridor 2: Cadet Enrollment & Parent Helpdesk: Onboarding inquiries, uniform sizing, and Sovereign Passport tracking
    support.
  • Corridor 3: Regional Sports Directors & Network Partners: Private channel for PT Teachers, Sports Heads, and
    Agency Partners (Option B terms: ₹10,000 upfront MOU bonus + ₹150/month per active cadet).

2.12 The Sovereign Treasury & Direct Payment Gateway Engine (/pay)
Integrated payment gateway engine (Razorpay / Cashfree / Stripe India) to process onboarding fees, safety gear, and direct
monthly tuition payments cleanly when schools prefer not to handle ERP collections.


                                              DIRECT FEE PAYMENT BREAKDOWN

  1. MANDATORY ONE-TIME ONBOARDING FEE ──► ₹2,000
  • Covers Leather Passport, Brass Seal Stamping, Uniform Badges & Welcome Box.

  2. MONTHLY TUITION FEE ──► ₹8,000 + 18% GST (Total ₹9,440/month)
  • Full equestrian instruction, stallion access, stall-cam app, server video logs.

  3. OPTIONAL RIDING SAFETY KIT ──► ₹3,000
  • Certified Helmet, Riding Gloves, Protective Boots/Chaps (or buy outside).



  • UPI Autopay & e-NACH Mandates: Automated monthly tuition billing on the 1st of every month.
  • Automated GST Tax Invoices: Auto-generates downloadable GST-compliant Tax Invoices upon payment completion.
  • Dispatch Trigger: Onboarding fee completion triggers task dispatch for the handcrafted wooden Sovereign Welcome Box.

2.13 Institutional MOU Generator Portal (/mou-request)
Allows visiting school principals or trustees to select campus parameters, generate a customized draft MOU PDF, and request
an executive signing meeting.


  SECTION 3: DAILY RETENTION HOOKS & ENGAGEMENT ENGINES
  • 24/7 Favorite Horse Stall-Cam Hub: Dedicated WebRTC/HLS CCTV stream from stables allowing cadets and parents to
    check in on their assigned stallion resting, feeding, or grooming.
  • The Daily Stoic Cadet Mindset: Daily 30-second audio quote on discipline and courage recorded over ambient horse
    arena sounds.
  • The Sovereign Leaderboard Ticker: Real-time updating banner displaying milestone achievements across all campus
    hubs (e.g., "Cadet Zayd earned Cadet Knight Rank at DPS Hub").




Vicarius Infinitum Holdings — BSAH Master Digital PRD                                                             Page 4 of 12
  SECTION 4: COMPLETE TECHNICAL DEVELOPER SPECIFICATIONS (PRD)

4.1 Recommended Tech Stack & Infrastructure

 Component                 Primary Technology                     Selection Justification

 3D Web Portal             Next.js 14 (App Router) + Three.js /   SSR for SEO + WebGL 3D rendering performance for interactive
                           React Three Fiber                      stallion models.

 Mobile Application        Flutter (Dart)                         Single codebase, native 60FPS UI performance, robust camera &
                                                                  WebRTC video player plugins.

 Backend API               Node.js (NestJS / Express)             Modular TypeScript architecture with native async I/O for
                                                                  concurrent media requests.

 Primary Database          PostgreSQL (Supabase / AWS RDS)        Relational integrity required for Hub → Horse → Cadet →
                                                                  Session mapping.

 CCTV Streaming            MediaMTX (RTSP to WebRTC/HLS) /        Ultra-low latency IP camera streaming from IP cameras in stables
 Gateway                   Go2RTC                                 directly to mobile apps.

 Storage & CDN             AWS S3 + Amazon CloudFront             Fast, low-cost video snippet delivery with signed secure URLs for
                                                                  parent privacy.

 Cache & Queue             Redis + BullMQ                         Handles asynchronous video encoding, push notifications, and
                                                                  high-frequency QR scan analytics.

 Payment Gateway           Razorpay / Cashfree Payments SDK       Native support for Indian UPI Autopay, e-NACH mandates, and
                                                                  automated GST billing.




Vicarius Infinitum Holdings — BSAH Master Digital PRD                                                                     Page 5 of 12
4.2 Three.js / WebGL Code Implementation Snippet & Hotspot Data Schema

   // Developer Implementation Pattern for Mesh Hotspot Interaction
   import React, { useState } from 'react';
   import { Canvas } from '@react-three/fiber';
   import { OrbitControls, useGLTF } from '@react-three/drei';

   interface AnatomyHotspot {
     id: string;
     meshName: string;
     cameraTarget: [number, number, number];
     title: string;
     equineFact: string;
     riderBiomechanics: string;
     neuralImpact: string;
     characterTrait: string;
   }

   export const HOTSPOT_DATA: Record<string, AnatomyHotspot> = {
     ears: {
        id: "ears",
        meshName: "Stallion_Ears_Mesh",
        cameraTarget: [0, 1.8, 1.2],
        title: "180° Acoustic Sensitivity & Vagal Sync",
        equineFact: "Marwari ears rotate independently to monitor rider heart rate and anxiety.",
        riderBiomechanics: "Vagus nerve activation forces parasympathetic calm.",
        neuralImpact: "Lowers cortisol, balances autonomic nervous system.",
        characterTrait: "Emotional Self-Governance & Calm Command"
     },
     spine: {
        id: "spine",
        meshName: "Saddle_Spine_Mesh",
        cameraTarget: [0, 1.2, 0.5],
        title: "Dynamic Core & Postural Realignment",
        equineFact: "3D pelvic motion transfers 110 impulse adjustments per minute.",
        riderBiomechanics: "Deep multifidus and pelvis engagement corrects 'tech-neck'.",
        neuralImpact: "Stimulates vestibular system and spatial intelligence.",
        characterTrait: "Physical Poise & Unshakable Balance"
     }
   };

   export function HorseModelViewer({ modelUrl }: { modelUrl: string }) {
     const { scene } = useGLTF(modelUrl);
     return (
        <Canvas camera={{ position: [0, 1.5, 4], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <primitive object={scene} scale={1.2} position={[0, -1, 0]} />
          <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 2} />
        </Canvas>
     );
   }



4.3 API Route Specifications & Payload Contracts
API 1: Public QR Lead Capture (POST /api/v1/leads/capture)




Vicarius Infinitum Holdings — BSAH Master Digital PRD                                               Page 6 of 12
   // REQUEST PAYLOAD
   {
     "hubSlug": "dps-vijayawada",
     "parentName": "Rajesh Kumar",
     "parentPhone": "+919876543210",
     "studentGrade": "Grade 7",
     "source": "flyer_q3_campaign"
   }

   // RESPONSE (201 Created)
   {
     "status": "success",
     "message": "Interest registered successfully",
     "data": {
       "leadId": "8f3b2a1c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
       "hubName": "DPS Vijayawada Campus Hub",
       "activeEnquiriesCount": 42
     }
   }


API 2: Instructor Session & Video Submission (POST /api/v1/sessions/submit)

   // FORM DATA PARAMETERS
   cadetId: "c1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f"
   ridingScore: 9
   groundScore: 8
   stableScore: 10
   notes: "Excellent posture balance during trot transitions. Reins command firm."
   videoFile: [10_sec_milestone_clip.mp4]

   // RESPONSE (200 OK)
   {
     "status": "success",
     "data": {
       "sessionId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
       "videoS3Url": "https://cdn.blackstallion.academy/video-logs/c1d2e3f4/sess_9921.mp4",
       "rankUpdated": false,
       "currentRank": "CADET_RIDER"
     }
   }


API 3: Get Stall-Cam Live Stream Token (GET /api/v1/horses/:horseId/stall-cam)

   // RESPONSE (200 OK)
   {
     "status": "success",
     "data": {
       "horseName": "Stallion Chetak",
       "streamType": "WEBRTC",
       "webrtcUrl": "wss://stream.blackstallion.academy/webrtc/live/stall_03",
       "fallbackHlsUrl": "https://stream.blackstallion.academy/hls/stall_03/index.m3u8",
       "expiresAt": "2026-09-26T04:00:00Z"
     }
   }


API 4: Create Onboarding Payment Order (POST /api/v1/payments/create-order)




Vicarius Infinitum Holdings — BSAH Master Digital PRD                                         Page 7 of 12
   // REQUEST PAYLOAD
   {
     "cadetId": "c1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
     "includeSafetyKit": true,
     "enableTuitionAutopay": true,
     "parentGstin": "36AAAAA0000A1Z5"
   }

   // RESPONSE (200 OK)
   {
     "status": "success",
     "data": {
       "orderId": "order_Nz1234567890",
       "currency": "INR",
       "onboardingAmount": 2000,
       "safetyKitAmount": 3000,
       "monthlyTuitionAmount": 9440,
       "totalImmediateAmount": 14440,
       "razorpayKeyId": "rzp_live_xxxxxxxxxxxx",
       "subscriptionId": "sub_Nz9876543210"
     }
   }


API 5: Public Credential Verification (GET /api/v1/verify/:passportCode)

   // RESPONSE (200 OK)
   {
     "status": "verified",
     "cadet": {
       "fullName": "Zayd Saif Khan",
       "schoolHub": "DPS Hyderabad Campus Hub",
       "rank": "CADET_KNIGHT",
       "passportCode": "BSAH-2026-HYD-042",
       "efiRegistrationId": "EFI-JR-99823",
       "totalRidingHours": 48,
       "milestoneVideos": [
         {
           "title": "Independent Canter & Reining Milestone",
           "date": "2026-09-15",
           "videoUrl": "https://cdn.blackstallion.academy/signed-logs/milestone_42.mp4"
         }
       ]
     }
   }




Vicarius Infinitum Holdings — BSAH Master Digital PRD                                     Page 8 of 12
4.4 Complete PostgreSQL Relational Database Schema




Vicarius Infinitum Holdings — BSAH Master Digital PRD   Page 9 of 12
   -- 1. SCHOOL HUBS
   CREATE TABLE school_hubs (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       school_name VARCHAR(255) NOT NULL,
       slug VARCHAR(100) UNIQUE NOT NULL,
       architectural_tier VARCHAR(50) DEFAULT 'TIER_1_STANDARD',
       address TEXT,
       contact_email VARCHAR(255),
       revenue_share_percentage NUMERIC(5,2) DEFAULT 25.00,
       created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW()
   );

   -- 2. EQUINE FLEET (HORSES)
   CREATE TABLE equine_fleet (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       hub_id UUID REFERENCES school_hubs(id) ON DELETE SET NULL,
       name VARCHAR(100) NOT NULL,
       breed VARCHAR(100) DEFAULT 'Marwari',
       microchip_iso_id VARCHAR(100) UNIQUE NOT NULL,
       stall_cctv_rtsp_url TEXT NOT NULL,
       is_active BOOLEAN DEFAULT TRUE,
       created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW()
   );

   -- 3. USERS (PARENTS, INSTRUCTORS, ADMINS)
   CREATE TABLE users (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       full_name VARCHAR(255) NOT NULL,
       email VARCHAR(255) UNIQUE NOT NULL,
       phone_number VARCHAR(20) UNIQUE NOT NULL,
       role VARCHAR(50) NOT NULL, -- 'PARENT', 'INSTRUCTOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN'
       password_hash TEXT NOT NULL,
       created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW()
   );

   -- 4. CADETS (STUDENTS)
   CREATE TABLE cadets (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
       hub_id UUID REFERENCES school_hubs(id),
       assigned_horse_id UUID REFERENCES equine_fleet(id),
       first_name VARCHAR(100) NOT NULL,
       last_name VARCHAR(100) NOT NULL,
       passport_code VARCHAR(100) UNIQUE NOT NULL,
       current_rank VARCHAR(50) DEFAULT 'CADET_SQUIRE',
       onboarding_fee_paid BOOLEAN DEFAULT FALSE,
       created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW()
   );

   -- 5. TRAINING SESSIONS & 3-PART ASSESSMENTS
   CREATE TABLE training_sessions (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       cadet_id UUID REFERENCES cadets(id) ON DELETE CASCADE,
       instructor_id UUID REFERENCES users(id),
       horse_id UUID REFERENCES equine_fleet(id),
       session_date DATE NOT NULL DEFAULT CURRENT_DATE,
       riding_score INT CHECK (riding_score BETWEEN 1 AND 10),
       ground_score INT CHECK (ground_score BETWEEN 1 AND 10),
       stable_score INT CHECK (stable_score BETWEEN 1 AND 10),
       instructor_notes TEXT,
       video_log_s3_url TEXT,
       brass_stamp_verified BOOLEAN DEFAULT TRUE,
       created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW()
   );




Vicarius Infinitum Holdings — BSAH Master Digital PRD                                        Page 10 of 12
   -- 6. QR FLYER LEAD CAPTURE ENGINE
   CREATE TABLE qr_lead_captures (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       hub_slug VARCHAR(100) NOT NULL,
       parent_name VARCHAR(255),
       parent_phone VARCHAR(20),
       student_grade VARCHAR(50),
       device_info TEXT,
       ip_address VARCHAR(45),
       converted_to_enrollment BOOLEAN DEFAULT FALSE,
       created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW()
   );

   -- 7. PAYMENT TRANSACTIONS & SUBSCRIPTIONS
   CREATE TABLE payment_records (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       cadet_id UUID REFERENCES cadets(id) ON DELETE CASCADE,
       parent_id UUID REFERENCES users(id),
       gateway_order_id VARCHAR(100) UNIQUE NOT NULL,
       gateway_payment_id VARCHAR(100) UNIQUE,
       gateway_subscription_id VARCHAR(100),
       amount_paid NUMERIC(10,2) NOT NULL,
       gst_amount NUMERIC(10,2) NOT NULL,
       payment_type VARCHAR(50) NOT NULL, -- 'ONBOARDING', 'SAFETY_KIT', 'MONTHLY_TUITION'
       status VARCHAR(50) DEFAULT 'PENDING',
       pdf_invoice_s3_url TEXT,
       created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW()
   );

   -- 8. EXECUTIVE APPOINTMENT BOOKINGS
   CREATE TABLE executive_appointments (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       school_name VARCHAR(255) NOT NULL,
       representative_name VARCHAR(255) NOT NULL,
       designation VARCHAR(100) NOT NULL,
       phone_number VARCHAR(20) NOT NULL,
       email VARCHAR(255) NOT NULL,
       campus_land_area_sqft INT,
       preferred_date DATE NOT NULL,
       preferred_time_slot VARCHAR(50) NOT NULL,
       status VARCHAR(50) DEFAULT 'SCHEDULED',
       created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW()
   );



4.5 4-Sprint Execution Roadmap & Developer Checklist

 Sprint                      Focus Area                     Key Deliverables

 Sprint 1                    Backend Core, Database &       Provision PostgreSQL schema (Tables 1-8), Node.js API server, JWT
 (Days 1 – 10)               Auth                           authentication, RBAC rules. S3 video upload pipeline & Redis
                                                            processing queue.

 Sprint 2                    3D Web Portal & Flyer QR       Develop Next.js 14 frontend, integrate Three.js GLTF horse viewer with
 (Days 11 – 20)              Engine                         3D hotspots. Build /hub/[schoolSlug] flyer landing pages & lead
                                                            tracking.

 Sprint 3                    Mobile App & Instructor        Build Flutter app, Passport QR scanner, 3-Part grading interface.
 (Days 21 – 30)              Modules                        Implement 10-second auto-stop camera recording & background S3
                                                            upload.

 Sprint 4                    Parent App, 24/7 Stall-Cam &   Implement WebRTC/HLS live CCTV stream player for stable cams.
 (Days 31 – 40)              Payment Gateway                Integrate Razorpay API for UPI Autopay & public /verify engine.
                                                            Deploy to production.




Vicarius Infinitum Holdings — BSAH Master Digital PRD                                                                   Page 11 of 12
   4.6 Direct Developer Mandate Script for Turnkey Handoff
   "Attention Lead Developer & Engineering Team,

   Please find attached the complete Master Technical & Content Architecture Specification (PRD) for The Black Stallion Academy of
   Horsemanship (BSAH) digital ecosystem.

   Immediate Action Plan:
     • Tech Stack Confirmation: We are building the Web Portal in Next.js 14 + Three.js / React Three Fiber, the Mobile App in
       Flutter, and the Backend API in Node.js (TypeScript) + PostgreSQL.
     • Sprint 1 Kickoff: Provision the PostgreSQL database schema (Tables 1 through 8) and configure our AWS S3 bucket pipeline
       for video uploads.
     • Critical Priority Targets:
         ◦ Flyer QR Engine: Activate the school-specific landing pages (/hub/[schoolSlug]) to capture pre-enrollment interest
           during school board pitches.
         ◦ 3D Neuro-Equine Crucible: Build the GLTF 3D Marwari horse viewer with interactive mesh hotspots.
         ◦ 10-Second Camera Loop: Restrict the instructor app camera strictly to a 10-second auto-stop recording loop.
         ◦ Stall-Cam Gateway: Configure MediaMTX for low-latency RTSP-to-WebRTC streaming.

   Confirm receipt of this document and provide repository initialization links once Sprint 1 structure is live.

   Executive Leadership | BSAH Pvt Ltd"




Vicarius Infinitum Holdings — BSAH Master Digital PRD                                                                     Page 12 of 12
```
