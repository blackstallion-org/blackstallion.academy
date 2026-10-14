import os
import re

# We will create an accurate, comprehensive script to analyze each page and its sections.

audit_data = [
    # 1. Homepage (/)
    {
        "page": "/",
        "file": "app/page.tsx",
        "sections": [
            {
                "name": "§1 Opening Film & Academy Doctrine (Hero)",
                "comp": "Hero (HeroVideoSection + HeroContentSection)",
                "path": "components/sections/home/Hero.tsx",
                "visual": "Full-frame looping Marwari stallion video (100svh) with sound/play controls + doctrine text, crest, statistics, and live ticker",
                "anim": "Yes (Framer Motion whileInView fade/slide, CSS animate-marquee ticker, video autoplay)",
                "status": "Working",
                "top": True,
                "candidate": "No",
                "notes": "TOP/HERO SECTION. High priority, institutional opening. Do not overwrite without explicit approval."
            },
            {
                "name": "§2 The Legend Reel · 800 Years of the Marwari (StoryStrip)",
                "comp": "StoryStrip",
                "path": "components/sections/home/StoryStrip.tsx",
                "visual": "Cinematic forward-zoom drift reel across 3 historical photographs (legendSand, bgFort, legendCavalry)",
                "anim": "Yes (GSAP timeline with 4.2x forward scale, drift, opacity crossfade, 2s pause, scrub bar)",
                "status": "Working / Completed & Locked",
                "top": False,
                "candidate": "No (LOCKED)",
                "notes": "Protected in COMPLETED_SECTIONS.md. Reusable base for other reels."
            },
            {
                "name": "§3 The Instrument (Rider Diagram & Tactile Metrics)",
                "comp": "Instrument",
                "path": "components/sections/home/Instrument.tsx",
                "visual": "Technical anatomical crosshair diagram of cadet & stallion, biomechanical breakdown cards",
                "anim": "Yes (Framer Motion scroll-linked progress & SVG cursor/indicator tracking)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Low Priority)",
                "notes": "Complex technical diagram with SVG line drawing."
            },
            {
                "name": "§3.5 Act I Intermission: The Citadel",
                "comp": "Intermission (act='citadel')",
                "path": "components/film/Intermission.tsx",
                "visual": "Parchment break plate with quote: 'Now, the proof.'",
                "anim": "Yes (Framer Motion subtle fade/scale on scroll)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared structural intermission element across acts."
            },
            {
                "name": "§4 The Matrix (Comparative Discipline Matrix)",
                "comp": "Matrix",
                "path": "components/sections/home/Matrix.tsx",
                "visual": "Interactive comparison matrix table evaluating traditional equestrian vs BSAH sovereign curriculum",
                "anim": "Yes (Framer Motion column reveal and interactive toggle highlight)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Dense tabular editorial content."
            },
            {
                "name": "§5 Crisis & Cure (National Deficit vs BSAH Solution)",
                "comp": "CrisisCure",
                "path": "components/sections/home/CrisisCure.tsx",
                "visual": "Split editorial confrontation comparing Indian school sports deficit against cadet equestrian infrastructure",
                "anim": "Yes (Framer Motion whileInView staggered reveal)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Strong editorial contrast; potential candidate for split-mask or reveal."
            },
            {
                "name": "§6 Three Doors · Through the Gate (Doors)",
                "comp": "Doors",
                "path": "components/sections/home/Doors.tsx",
                "visual": "Full-screen interactive Three.js 4D simplex noise stage with door selector (Parents, Cadets, Schools)",
                "anim": "Yes (Three.js WebGL shader transition + GSAP text sync)",
                "status": "Working / Completed & Locked",
                "top": False,
                "candidate": "No (LOCKED)",
                "notes": "Protected in COMPLETED_SECTIONS.md."
            },
            {
                "name": "§7 The Ledger Ascent (LedgerAscent)",
                "comp": "LedgerAscent",
                "path": "components/sections/home/LedgerAscent.tsx",
                "visual": "Ascending vertical timeline tracking hours, ranks, EFI certification and verified ledger milestones",
                "anim": "Yes (Framer Motion useScroll-driven path draw and step highlights)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Low)",
                "notes": "Scroll-linked SVG milestone track."
            },
            {
                "name": "§8 The Studbook Registry (Studbook)",
                "comp": "Studbook",
                "path": "components/sections/home/Studbook.tsx",
                "visual": "Pedigree database index cards showing stallion names, bloodlines, height in hands, and ear morphology",
                "anim": "Yes (Framer Motion hover cards + filter tab transitions)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Catalog cards with horse imagery."
            },
            {
                "name": "§8.5 Act II Intermission: The Ledger",
                "comp": "Intermission (act='ledger')",
                "path": "components/film/Intermission.tsx",
                "visual": "Parchment break plate with quote: 'Now, the decision.'",
                "anim": "Yes (Framer Motion fade/scale)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared structural intermission element."
            },
            {
                "name": "§9 Schools Teaser: Zero CapEx Model (SchoolsTeaser)",
                "comp": "SchoolsTeaser",
                "path": "components/sections/home/SchoolsTeaser.tsx",
                "visual": "Financial model summary, 0-CapEx institution infrastructure setup preview with link to /schools",
                "anim": "Yes (Framer Motion whileInView fade-up)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Low)",
                "notes": "Commercial institutional summary."
            },
            {
                "name": "§10 Passport Verifier Preview (HomeVerifier)",
                "comp": "HomeVerifier",
                "path": "components/sections/home/HomeConvert.tsx",
                "visual": "Interactive demo code input validating cadet cryptographic passport credentials",
                "anim": "Yes (Interactive input state change + stamp reveal)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Interactive security utility form."
            },
            {
                "name": "§11 National Circuit Standings (HomeStandings)",
                "comp": "HomeStandings",
                "path": "components/sections/home/HomeConvert.tsx",
                "visual": "Live tournament leaderboard preview ranking institutional squads across national pegs",
                "anim": "Yes (CSS ticker / hover lane highlight)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Low)",
                "notes": "Data-heavy leaderboard."
            },
            {
                "name": "§12 The Sovereign Shield (HomeShield)",
                "comp": "HomeShield",
                "path": "components/sections/home/HomeConvert.tsx",
                "visual": "Four pillars of institutional safety: veterinary, insurance, ex-cavalry protocols, helmet tech",
                "anim": "Yes (Framer Motion whileInView staggered grid)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Structured feature grid with icon badges."
            },
            {
                "name": "§13 Command AI Protocol (HomeCommand)",
                "comp": "HomeCommand",
                "path": "components/sections/home/HomeClose.tsx",
                "visual": "Dark terminal preview showing simulated real-time telemetry from stable monitors",
                "anim": "Yes (Terminal typing effect / blinking cursor)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (High)",
                "notes": "Excellent candidate for tech/AI or console-related motion."
            },
            {
                "name": "§14 The Chronicle Preview (HomeChronicle)",
                "comp": "HomeChronicle",
                "path": "components/sections/home/HomeClose.tsx",
                "visual": "Editorial dispatches teaser featuring field photography from national tournament circuit",
                "anim": "Yes (Hover card image zoom + slide)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Image-rich editorial grid."
            },
            {
                "name": "§15 The Gate / Final Call (Finale)",
                "comp": "Finale",
                "path": "components/sections/home/HomeClose.tsx",
                "visual": "Solemn closing callout with academy motto, dual CTAs (Enrol Cadet / School Partnership)",
                "anim": "Yes (Framer Motion entrance fade)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Conversion gateway before footer."
            }
        ]
    },
    # 2. About (/about)
    {
        "page": "/about",
        "file": "app/about/page.tsx",
        "sections": [
            {
                "name": "T17 Monogram & Crest Masthead",
                "comp": "Inline <section> with LoaderMark + Headline",
                "path": "app/about/page.tsx",
                "visual": "Hand-drawn brass monogram SVG, institutional headline 'The institution is the instrument.'",
                "anim": "Yes (SVG stroke dashoffset draw animation on mount)",
                "status": "Working",
                "top": True,
                "candidate": "Yes (Medium)",
                "notes": "TOP/HERO SECTION. Has SVG path animation."
            },
            {
                "name": "§1 S61 Founder's Letter",
                "comp": "Inline <section> with Reveal",
                "path": "app/about/page.tsx",
                "visual": "Editorial open letter signed by the council and founder",
                "anim": "Yes (Framer Motion scroll reveal on paragraphs)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Pure typography and signed testament."
            },
            {
                "name": "§2 S32 Six Truths (Monolith)",
                "comp": "Monolith",
                "path": "components/sections/why/WhyScenes.tsx (shared)",
                "visual": "Dark editorial monumental typography reciting the 6 unbendable truths of BSAH",
                "anim": "Yes (Framer Motion staggered sentence reveals)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared component with /why."
            },
            {
                "name": "§3 S62 Organizational Tree & Council",
                "comp": "Inline <section> with Reveal + Cta",
                "path": "app/about/page.tsx",
                "visual": "Hierarchical breakdown of governance, stewards, cavalry corps, veterinary board",
                "anim": "Yes (Framer Motion staggered entrance)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Low)",
                "notes": "Organizational tree."
            }
        ]
    },
    # 3. Anatomy (/anatomy)
    {
        "page": "/anatomy",
        "file": "app/anatomy/page.tsx",
        "sections": [
            {
                "name": "S01 Anatomy Title & Morphological Masthead",
                "comp": "AnatomyTitle",
                "path": "components/sections/anatomy/AnatomyScenes.tsx",
                "visual": "Dark dramatic typographic hero: 'The Marwari' · 'The Living Instrument'",
                "anim": "Yes (Framer Motion fade-up on headlines)",
                "status": "Working",
                "top": True,
                "candidate": "Yes (High)",
                "notes": "TOP/HERO SECTION. Dramatic headline over dark backdrop."
            },
            {
                "name": "§1 S03 Interactive Specimen Plate (Four Layers)",
                "comp": "SpecimenPlate",
                "path": "components/sections/anatomy/SpecimenPlate.tsx",
                "visual": "Multi-layer scientific dissection of the stallion: Skeleton, Musculature, Sensory, Armour with layer toggles",
                "anim": "Yes (Framer Motion cross-layer fade and coordinate reticle animation)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (High)",
                "notes": "Exceptional interactive candidate for image layer reveal/mask."
            },
            {
                "name": "§2 S25 Scale Balance (Biometric Comparison)",
                "comp": "ScaleBalance",
                "path": "components/sections/anatomy/AnatomyScenes.tsx",
                "visual": "Visual scale comparing bone density, heart volume, endurance capacity of Marwari vs Thoroughbred",
                "anim": "Yes (Animated balance beam pivot with motion)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Interactive balance visualization."
            },
            {
                "name": "§3 S26 The Lyre Ears Dial",
                "comp": "EarDial",
                "path": "components/sections/anatomy/AnatomyScenes.tsx",
                "visual": "360-degree rotational acoustic arc showcasing inward-curving lyre ear mobility",
                "anim": "Yes (Interactive rotational dial control with Framer Motion)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (High)",
                "notes": "Strong candidate for rotary/acoustic audio-visual motion."
            },
            {
                "name": "§4 S27 Biological Specification Ledger",
                "comp": "Inline <section> with Reveal",
                "path": "app/anatomy/page.tsx",
                "visual": "Tabular scientific ledger of biometric parameters (wither height, cannon bone circumference)",
                "anim": "Yes (Framer Motion Reveal)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Structured tabular data."
            },
            {
                "name": "Closing End Card",
                "comp": "EndCard",
                "path": "components/film/EndCard.tsx (shared)",
                "visual": "Next corridor invitation: '/fleet' (The Studbook)",
                "anim": "Yes (Hover state transition)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared route navigation end card."
            }
        ]
    },
    # 4. Cadets (/cadets)
    {
        "page": "/cadets",
        "file": "app/cadets/page.tsx",
        "sections": [
            {
                "name": "C01 The Hall of Valour Masthead",
                "comp": "CadetsTitle",
                "path": "components/sections/cadets/CadetScenes.tsx",
                "visual": "Atmospheric editorial header introducing the cadet corps doctrine",
                "anim": "Yes (Framer Motion Headline)",
                "status": "Working",
                "top": True,
                "candidate": "Yes (Medium)",
                "notes": "TOP/HERO SECTION."
            },
            {
                "name": "§1 Cadet Spotlights & Formations",
                "comp": "Spotlights",
                "path": "components/sections/cadets/CadetScenes.tsx",
                "visual": "Featured cadet profiles, age cohorts (Junior/Senior squadrons)",
                "anim": "Yes (Framer Motion card reveals)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Card grid with photography."
            },
            {
                "name": "§2 Cadet Drill & Cavalry Maneuvers Showcase",
                "comp": "CadetDrillShowcase",
                "path": "components/sections/cadets/CadetScenes.tsx",
                "visual": "Three.js WebGL noise-driven slideshow of live cavalry drill photography",
                "anim": "Yes (Three.js simplex noise shader + auto-cycle)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Already has complex Three.js noise transition."
            },
            {
                "name": "§3 The Sovereign Cadet Passport Object",
                "comp": "PassportObject",
                "path": "components/sections/cadets/CadetScenes.tsx",
                "visual": "3D tactile representation of the leather-bound biometric riding passport",
                "anim": "Yes (Framer Motion tilt / perspective hover effect)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (High)",
                "notes": "Tactile skeuomorphic physical object."
            },
            {
                "name": "§4 The Dress Code & Uniform Specification",
                "comp": "UniformSpec",
                "path": "components/sections/cadets/CadetScenes.tsx",
                "visual": "Tunic, breeches, boots, crest badges, and safety gear callouts",
                "anim": "Yes (Framer Motion scroll reveal)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Apparel & uniform specification."
            },
            {
                "name": "§5 Day Clock (24-Hour Training Cycle)",
                "comp": "DayClock",
                "path": "components/sections/cadets/CadetScenes.tsx",
                "visual": "Interactive 24-hour radial clock showing dawn stables, afternoon drill, evening theory",
                "anim": "Yes (Rotational angle tracking with time-segment highlights)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Interactive clock interface."
            },
            {
                "name": "§6 The Cadet Creed & Sworn Code",
                "comp": "CreedCard",
                "path": "components/sections/cadets/CadetScenes.tsx",
                "visual": "Calligraphic oath card inscribed in brass and gold foil styling",
                "anim": "Yes (Framer Motion whileInView opacity ramp)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Static calligraphic creed."
            },
            {
                "name": "§7 Milestone Reels Archive",
                "comp": "MilestoneReels",
                "path": "components/sections/cadets/CadetScenes.tsx",
                "visual": "10-second milestone clip reels demonstrating cadet progress from mount to gallop",
                "anim": "Yes (Video thumbnail hover triggers + modal player)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (High)",
                "notes": "Video-heavy media gallery."
            },
            {
                "name": "Closing End Card",
                "comp": "EndCard",
                "path": "components/film/EndCard.tsx (shared)",
                "visual": "Next corridor invitation: '/curriculum' (The Codex)",
                "anim": "Yes (Hover transition)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared route navigation end card."
            }
        ]
    },
    # 5. Command (/command)
    {
        "page": "/command",
        "file": "app/command/page.tsx",
        "sections": [
            {
                "name": "Command AI Boot & Real-Time Terminal",
                "comp": "CommandBoot + Terminal in <section>",
                "path": "components/sections/command/CommandBoot.tsx & Terminal.tsx",
                "visual": "Retro-tactical CRT monospace console with simulated command line, live feed telemetry, stable stats",
                "anim": "Yes (Typewriter text streams, blinking prompt, interactive command interpreter)",
                "status": "Working",
                "top": True,
                "candidate": "Yes (High)",
                "notes": "TOP/HERO SECTION. Authentic retro tech / command console."
            },
            {
                "name": "Closing End Card",
                "comp": "EndCard",
                "path": "components/film/EndCard.tsx (shared)",
                "visual": "Next corridor invitation: '/safety' (The Shield)",
                "anim": "Yes (Hover transition)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared route navigation end card."
            }
        ]
    },
    # 6. Contact (/contact)
    {
        "page": "/contact",
        "file": "app/contact/page.tsx",
        "sections": [
            {
                "name": "G01 The Gates of the Citadel (Masthead)",
                "comp": "GateTitle",
                "path": "components/sections/contact/Gates.tsx",
                "visual": "Editorial title: 'The Gate' · 'Four corridors inward.'",
                "anim": "Yes (Framer Motion Headline)",
                "status": "Working",
                "top": True,
                "candidate": "No",
                "notes": "TOP/HERO SECTION."
            },
            {
                "name": "§1 The Four Direct Contact Corridors",
                "comp": "Gates",
                "path": "components/sections/contact/Gates.tsx",
                "visual": "Interactive cards for Parents, Schools, Media, General Enquiries with email, phone, hours",
                "anim": "Yes (Framer Motion hover elevation + active card expand)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Low)",
                "notes": "Contact utility cards."
            },
            {
                "name": "§2 Geographic Coordinates & Stables Location",
                "comp": "Inline <section>",
                "path": "app/contact/page.tsx",
                "visual": "Lat/long coordinates, map reference, visitor arrival protocols",
                "anim": "No meaningful animation (Static layout)",
                "status": "Static",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Good candidate for map reveal or coordinate telemetry animation."
            }
        ]
    },
    # 7. Curriculum (/curriculum)
    {
        "page": "/curriculum",
        "file": "app/curriculum/page.tsx",
        "sections": [
            {
                "name": "CU01 The Curriculum Codex Masthead",
                "comp": "CurriculumTitle",
                "path": "components/sections/curriculum/CurriculumScenes.tsx",
                "visual": "Title: 'The Codex' · 'Twelve modules. Six terms.'",
                "anim": "Yes (Framer Motion Headline)",
                "status": "Working",
                "top": True,
                "candidate": "No",
                "notes": "TOP/HERO SECTION."
            },
            {
                "name": "§1 The Rank Staircase (Novice to Squadron Leader)",
                "comp": "Staircase",
                "path": "components/sections/curriculum/CurriculumScenes.tsx",
                "visual": "Stepped hierarchy of rider ranks, required logged hours, and badge elevations",
                "anim": "Yes (Framer Motion scroll-linked stair lighting)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Low)",
                "notes": "Stepped progress ladder."
            },
            {
                "name": "§2 The Codex Vault (Interactive Module Browser)",
                "comp": "CodexVault",
                "path": "components/sections/curriculum/CodexVault.tsx",
                "visual": "Searchable module library covering Equitation, Horse Management, Cavalry Tactics, Horsemastership",
                "anim": "Yes (Module accordion drawer expansion + filter transitions)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Searchable syllabus archive."
            },
            {
                "name": "§3 Clock Ring (Weekly Training Rhythm)",
                "comp": "ClockRing",
                "path": "components/sections/curriculum/CurriculumScenes.tsx",
                "visual": "Radial 7-day cyclical training schedule",
                "anim": "Yes (Circular SVG arc rotation)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Radial timetable."
            },
            {
                "name": "§4 S37 Timetable Board & Arena Roster",
                "comp": "Inline <section> with FilmImage",
                "path": "app/curriculum/page.tsx",
                "visual": "Editorial board detailing riding slot allocation across school terms",
                "anim": "Yes (Framer Motion Reveal)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Low)",
                "notes": "Editorial schedule table."
            },
            {
                "name": "§5 Three Official Seal Stamps",
                "comp": "ThreeStamps",
                "path": "components/sections/curriculum/CurriculumScenes.tsx",
                "visual": "Wax seal stamps: EFI, STPCI, National Tent Pegging Federation",
                "anim": "Yes (Stamp stamp-down animation with spring physics)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Has tactile stamp physics."
            },
            {
                "name": "§6 Sovereign Discipline Action Gallery",
                "comp": "DisciplineActionGallery",
                "path": "components/sections/curriculum/CurriculumScenes.tsx",
                "visual": "Cinematic forward-zoom drift reel across 4 sovereign disciplines (tent pegging, barrel racing, archery, formation)",
                "anim": "Yes (GSAP 4.2x forward zoom drift reel)",
                "status": "Working / Completed & Locked",
                "top": False,
                "candidate": "No (LOCKED)",
                "notes": "Protected in COMPLETED_SECTIONS.md."
            },
            {
                "name": "§7 Discipline Panels (Technical Deep Dive)",
                "comp": "DisciplinePanels",
                "path": "components/sections/curriculum/CurriculumScenes.tsx",
                "visual": "Detailed breakdowns of peg dimensions, lance specs, ground angles, timing gates",
                "anim": "Yes (Framer Motion panel slide-in)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Low)",
                "notes": "Technical rules & diagrams."
            },
            {
                "name": "Closing End Card",
                "comp": "EndCard",
                "path": "components/film/EndCard.tsx (shared)",
                "visual": "Next corridor invitation: '/tournaments' (The Circuit)",
                "anim": "Yes (Hover transition)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared route navigation end card."
            }
        ]
    },
    # 8. Fleet (/fleet)
    {
        "page": "/fleet",
        "file": "app/fleet/page.tsx",
        "sections": [
            {
                "name": "FL01 Stallion Portal 3D Stage (Hero)",
                "comp": "StallionPortalHero",
                "path": "components/sections/fleet/StallionPortalHero.tsx",
                "visual": "Interactive 3D WebGL portal stage showcasing indigenous stallion anatomy and studbook records",
                "anim": "Yes (Interactive WebGL render + smooth cursor rotation)",
                "status": "Working",
                "top": True,
                "candidate": "No",
                "notes": "TOP/HERO SECTION. High-performance custom WebGL hero."
            },
            {
                "name": "§1 Studbook Registry Index",
                "comp": "Registry",
                "path": "components/sections/fleet/FleetScenes.tsx",
                "visual": "Complete register of all academy stallions, registration numbers, sire, dam, station",
                "anim": "Yes (Framer Motion filter & sort transitions)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Low)",
                "notes": "Dense record list."
            },
            {
                "name": "§2 Sovereign Stallion Showcase Gallery",
                "comp": "StallionGallery",
                "path": "components/sections/fleet/FleetScenes.tsx",
                "visual": "Cinematic forward-zoom drift reel across 4 stallions (Chetak, Veer, Kesar, Arbudh)",
                "anim": "Yes (GSAP 4.2x forward zoom drift reel)",
                "status": "Working / Completed & Locked",
                "top": False,
                "candidate": "No (LOCKED)",
                "notes": "Protected in COMPLETED_SECTIONS.md."
            },
            {
                "name": "§3 Coat Registry (The Five Traditional Colours)",
                "comp": "CoatRegistry",
                "path": "components/sections/fleet/FleetScenes.tsx",
                "visual": "Swatches and mythological notes on Kumud, Sanjaf, Nukra, Shyam-Karna coats",
                "anim": "Yes (Framer Motion palette hover expand)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Rich colour palette swatches."
            },
            {
                "name": "§4 CCTV Wall & 24/7 Stall-Cam Feeds",
                "comp": "CctvGrid",
                "path": "components/sections/fleet/FleetScenes.tsx",
                "visual": "Live-simulated security matrix displaying thermal and night-vision stable feeds",
                "anim": "Yes (Blinking camera rec dot, timecode ticker, scanline shader)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (High)",
                "notes": "Night-vision surveillance aesthetic."
            },
            {
                "name": "§5 Veterinary & Care Log",
                "comp": "CareLog",
                "path": "components/sections/fleet/FleetScenes.tsx",
                "visual": "Daily rations, farrier schedules, turnout hours, veterinary certificates",
                "anim": "Yes (Framer Motion timeline scroll)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Care logs."
            },
            {
                "name": "Closing End Card",
                "comp": "EndCard",
                "path": "components/film/EndCard.tsx (shared)",
                "visual": "Next corridor invitation: '/cadets' (The Hall of Valour)",
                "anim": "Yes (Hover transition)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared route navigation end card."
            }
        ]
    },
    # 9. Journal (/journal)
    {
        "page": "/journal",
        "file": "app/journal/page.tsx",
        "sections": [
            {
                "name": "J01 Field Sphere 3D Hero",
                "comp": "FieldSphereHero",
                "path": "components/sections/journal/FieldSphereHero.tsx",
                "visual": "Interactive 3D field sphere environment with atmospheric dust particles and chronicle title",
                "anim": "Yes (Three.js WebGL particle field and mouse parallax)",
                "status": "Working",
                "top": True,
                "candidate": "No",
                "notes": "TOP/HERO SECTION. Custom Three.js particle sphere hero."
            },
            {
                "name": "T15 The Chronicle Masthead",
                "comp": "Inline <header> with ReelMark",
                "path": "app/journal/page.tsx",
                "visual": "Editorial masthead with date, issue number, archive filter tags",
                "anim": "No meaningful animation (Static layout)",
                "status": "Static",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Editorial issue header."
            },
            {
                "name": "Featured Field Dispatch",
                "comp": "Inline <section> with FilmImage",
                "path": "app/journal/page.tsx",
                "visual": "Large lead editorial story with hero photography from the Jodhpur tent pegging trials",
                "anim": "Yes (Hover image zoom)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (High)",
                "notes": "Heroic editorial layout."
            },
            {
                "name": "Field Dispatch Motion Reel",
                "comp": "Inline <section>",
                "path": "app/journal/page.tsx",
                "visual": "Horizontal scrolling photo reel of field dispatches",
                "anim": "Yes (Horizontal flex overflow scroll)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Photo strip."
            },
            {
                "name": "Editorial Articles List",
                "comp": "Inline <section> with Reveal + FilmImage",
                "path": "app/journal/page.tsx",
                "visual": "Alternating bilateral layout of 6 dispatches, dates, authors, excerpts",
                "anim": "Yes (Framer Motion Reveal scroll-in)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Low)",
                "notes": "Standard editorial article list."
            },
            {
                "name": "Closing End Card",
                "comp": "EndCard",
                "path": "components/film/EndCard.tsx (shared)",
                "visual": "Next corridor invitation: '/legend' (800 Years)",
                "anim": "Yes (Hover transition)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared route navigation end card."
            }
        ]
    },
    # 10. Journal Article (/journal/[slug])
    {
        "page": "/journal/[slug]",
        "file": "app/journal/[slug]/page.tsx",
        "sections": [
            {
                "name": "Dispatch Header & Hero Photography",
                "comp": "Inline <header> with FilmImage",
                "path": "app/journal/[slug]/page.tsx",
                "visual": "Full-bleed article header, title, author credentials, date, reading time",
                "anim": "No meaningful animation (Static layout)",
                "status": "Static",
                "top": True,
                "candidate": "Yes (High)",
                "notes": "TOP/HERO SECTION. Static header ripe for cinematic image reveal."
            },
            {
                "name": "Dispatch Longform Body & Typography",
                "comp": "Inline <article>",
                "path": "app/journal/[slug]/page.tsx",
                "visual": "Rich editorial typography, drop caps, pull quotes, inline figures",
                "anim": "No meaningful animation (Static layout)",
                "status": "Static",
                "top": False,
                "candidate": "No",
                "notes": "Longform reading text."
            },
            {
                "name": "Related Dispatches & Return Navigation",
                "comp": "Inline <section> with FilmImage",
                "path": "app/journal/[slug]/page.tsx",
                "visual": "Two card suggestions and link back to /journal",
                "anim": "Yes (Hover card lift)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Article footer navigation."
            }
        ]
    },
    # 11. Legend (/legend)
    {
        "page": "/legend",
        "file": "app/legend/page.tsx",
        "sections": [
            {
                "name": "L01 Legend Title & Sovereign Masthead",
                "comp": "LegendTitle",
                "path": "components/sections/legend/LegendScenes.tsx",
                "visual": "Grand cinematic title: 'The Legend' · 'Eight centuries in the saddle.'",
                "anim": "Yes (Framer Motion Headline)",
                "status": "Working",
                "top": True,
                "candidate": "No",
                "notes": "TOP/HERO SECTION."
            },
            {
                "name": "Chapter Rail (Sticky Navigation)",
                "comp": "ChapterRail",
                "path": "components/sections/legend/LegendScenes.tsx",
                "visual": "Sticky roman numeral chapter index along the edge",
                "anim": "Yes (Active chapter highlight on scroll)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "In-page scroll navigation."
            },
            {
                "name": "Chapter I · One Bloodline (Origin Theories)",
                "comp": "Inline <section> with BreathCue + Reveal",
                "path": "app/legend/page.tsx",
                "visual": "Origin theories: Arabian shipwreck, native desert horse, divine provenance",
                "anim": "Yes (Breath cue pulsating breath circle + Framer Motion reveal)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Narrative storytelling."
            },
            {
                "name": "Chapter II · Marwar, 1193 (Historical Route Map)",
                "comp": "RouteMap",
                "path": "components/sections/legend/LegendScenes.tsx",
                "visual": "Annotated cartographic map tracing cavalry migrations across Rajasthan deserts",
                "anim": "Yes (Animated SVG path line draw on scroll)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (High)",
                "notes": "Dynamic SVG map."
            },
            {
                "name": "Chapter III · Bred by Law (Royal Decree)",
                "comp": "Inline <section> with FilmImage + Reveal",
                "path": "app/legend/page.tsx",
                "visual": "Historical decrees from Rathore chieftains governing breeding purity",
                "anim": "Yes (Framer Motion Reveal)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Low)",
                "notes": "Historical decree document."
            },
            {
                "name": "Chapter IV · The Ears (Scrub Zoom)",
                "comp": "EarsZoom",
                "path": "components/sections/legend/LegendScenes.tsx",
                "visual": "Extreme macro photographic zoom into the lyre-shaped ear tips",
                "anim": "Yes (Scroll-driven scale and focal zoom)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Already has scroll-driven macro scrub zoom."
            },
            {
                "name": "Chapter V · The Traditional Lore (Bardic Link)",
                "comp": "Inline <section>",
                "path": "app/legend/page.tsx",
                "visual": "Handoff to /lore (The Bardic Canon)",
                "anim": "No meaningful animation (Static layout)",
                "status": "Static",
                "top": False,
                "candidate": "Yes (Low)",
                "notes": "Editorial handoff."
            },
            {
                "name": "Chapter VI · Three Reasons",
                "comp": "ThreeWords",
                "path": "components/sections/legend/LegendScenes.tsx",
                "visual": "Three core military tenets: Loyalty, Endurance, Intuition",
                "anim": "Yes (Framer Motion staggered text reveals)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Typographic triptych."
            },
            {
                "name": "Chapter VII · Roll of Honour (Battlefield Annals)",
                "comp": "Inline <section> with FilmImage",
                "path": "app/legend/page.tsx",
                "visual": "Famous warhorses in Indian history (Chetak at Haldighati, etc.)",
                "anim": "Yes (Framer Motion scroll reveal)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Battle records."
            },
            {
                "name": "Chapter VIII · The Fall (Colonial Suppression)",
                "comp": "Descent",
                "path": "components/sections/legend/LegendScenes.tsx",
                "visual": "Dark historical decline of indigenous cavalry during British colonial rule",
                "anim": "Yes (Framer Motion downward drift & dimming contrast)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Somber atmospheric transition."
            },
            {
                "name": "Chapter IX · The Revival (Modern Renaissance)",
                "comp": "Inline <section> with Ascent",
                "path": "app/legend/page.tsx",
                "visual": "Ascent timeline tracking resurgence from 1990 to present day",
                "anim": "Yes (Vertical timeline illumination)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Low)",
                "notes": "Revival timeline."
            },
            {
                "name": "Chapter XI · Every Cadet Rides One",
                "comp": "Inline <section> with FilmImage + Reveal",
                "path": "app/legend/page.tsx",
                "visual": "Full-width closing photograph of cadet and stallion on Thar sands",
                "anim": "Yes (Framer Motion Reveal)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (High)",
                "notes": "Heroic photograph."
            },
            {
                "name": "Closing End Card",
                "comp": "EndCard",
                "path": "components/film/EndCard.tsx (shared)",
                "visual": "Next corridor invitation: '/science' (The Biology)",
                "anim": "Yes (Hover transition)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared route navigation end card."
            }
        ]
    },
    # 12. Lithos (/lithos)
    {
        "page": "/lithos",
        "file": "app/lithos/page.tsx",
        "sections": [
            {
                "name": "Lithos Dual-Layer Spotlight Hero",
                "comp": "LithosHero",
                "path": "components/sections/lithos/LithosHero.tsx",
                "visual": "Dark-themed geology hero with interactive cursor-following spotlight revealing mineral crystals over sediment rock",
                "anim": "Yes (Canvas radial gradient mask + RAF lerp tracking + keyframe zoom & blur entrance)",
                "status": "Working / Verified",
                "top": True,
                "candidate": "No (LOCKED)",
                "notes": "TOP/HERO SECTION. Standalone demonstration page requested and verified."
            }
        ]
    },
    # 13. Lore (/lore)
    {
        "page": "/lore",
        "file": "app/lore/page.tsx",
        "sections": [
            {
                "name": "The Sovereign Arsenal Horizontal Gallery Hero",
                "comp": "GridScrollSection",
                "path": "components/sections/home/GridScrollSection.tsx",
                "visual": "Horizontal scroll pinned gallery displaying living warhorse bloodlines and equipment",
                "anim": "Yes (GSAP ScrollTrigger horizontal sliding track)",
                "status": "Working",
                "top": True,
                "candidate": "No",
                "notes": "TOP/HERO SECTION. Already powered by GSAP horizontal scroll."
            },
            {
                "name": "Bardic Verse & Oral Canon",
                "comp": "Inline <section> with Reveal",
                "path": "app/lore/page.tsx",
                "visual": "Translations of ancient Rajasthani ballads and oral verse celebrating Marwari endurance",
                "anim": "Yes (Framer Motion Reveal)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Poetic verse."
            },
            {
                "name": "The Six Canonical Tales of Valour",
                "comp": "Inline <section> with FilmImage + Reveal",
                "path": "app/lore/page.tsx",
                "visual": "Grid of six legendary equine folklore tales with authentic illustrations",
                "anim": "Yes (Framer Motion staggered Reveal)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Folklore grid."
            },
            {
                "name": "The Living Sovereign Oath",
                "comp": "Inline <section> with Headline + Reveal",
                "path": "app/lore/page.tsx",
                "visual": "Solemn closing oath binding cadets to the ancient tradition",
                "anim": "Yes (Framer Motion Headline)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Solemn oath."
            }
        ]
    },
    # 14. Parents (/parents)
    {
        "page": "/parents",
        "file": "app/parents/page.tsx",
        "sections": [
            {
                "name": "P01 The Guardian Masthead",
                "comp": "ParentsTitle",
                "path": "components/sections/parents/ParentScenes.tsx",
                "visual": "Editorial title: 'The Guardian' · 'What every parent receives.'",
                "anim": "Yes (Framer Motion Headline)",
                "status": "Working",
                "top": True,
                "candidate": "No",
                "notes": "TOP/HERO SECTION."
            },
            {
                "name": "§1 Pinned Phone (Parent App Interface)",
                "comp": "PinnedPhone",
                "path": "components/sections/parents/ParentScenes.tsx",
                "visual": "Skeuomorphic smartphone frame showcasing real-time gate notifications and stall-cam feeds",
                "anim": "Yes (Framer Motion sticky scroll pinned presentation)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (High)",
                "notes": "Mobile app UI mockup."
            },
            {
                "name": "§2 Guardian Vantage Gallery",
                "comp": "ParentVantageGallery",
                "path": "components/sections/parents/ParentScenes.tsx",
                "visual": "Cinematic forward-zoom drift reel across 5 parent observation windows (rail, stall-cam, passport, etc.)",
                "anim": "Yes (GSAP 4.2x forward zoom drift reel)",
                "status": "Working / Completed & Locked",
                "top": False,
                "candidate": "No (LOCKED)",
                "notes": "Protected in COMPLETED_SECTIONS.md."
            },
            {
                "name": "§3 Hoof Path (Logistics & Transport)",
                "comp": "HoofPath",
                "path": "components/sections/parents/ParentScenes.tsx",
                "visual": "Step-by-step route and logistics for cadet drop-off, gear checks, and stable access",
                "anim": "Yes (Animated SVG hoof print line draw)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Animated hoof trail."
            },
            {
                "name": "§4 The Transparent Ledger Receipt",
                "comp": "Receipt",
                "path": "components/sections/parents/ParentScenes.tsx",
                "visual": "Itemized cost and value breakdown of insurance, coaching, equipment, tournament fees",
                "anim": "Yes (Framer Motion print slip entrance)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Itemized paper receipt."
            },
            {
                "name": "§5 Standing Orders for Guardians",
                "comp": "StandingOrders",
                "path": "components/sections/parents/ParentScenes.tsx",
                "visual": "Code of conduct for parents at trials, tournaments, and stables",
                "anim": "Yes (Framer Motion Reveal)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Rules & guidelines."
            },
            {
                "name": "§6 Enrollment Action CTA",
                "comp": "Inline <section> with Headline + Cta",
                "path": "app/parents/page.tsx",
                "visual": "Final registration callout for cadet enrolment",
                "anim": "Yes (Framer Motion Headline)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Call to action."
            },
            {
                "name": "Closing End Card",
                "comp": "EndCard",
                "path": "components/film/EndCard.tsx (shared)",
                "visual": "Next corridor invitation: '/schools' (The Engine)",
                "anim": "Yes (Hover transition)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared route navigation end card."
            }
        ]
    },
    # 15. Privacy (/privacy)
    {
        "page": "/privacy",
        "file": "app/privacy/page.tsx",
        "sections": [
            {
                "name": "Sovereign Privacy Policy & Cryptographic Data Covenant",
                "comp": "Inline <section>",
                "path": "app/privacy/page.tsx",
                "visual": "Comprehensive formal legal text explaining zero-tracking, biometric vaulting, and data retention",
                "anim": "No meaningful animation (Static layout)",
                "status": "Static",
                "top": True,
                "candidate": "No",
                "notes": "TOP/HERO SECTION. Pure legal document."
            }
        ]
    },
    # 16. Safety (/safety)
    {
        "page": "/safety",
        "file": "app/safety/page.tsx",
        "sections": [
            {
                "name": "SF01 The Sovereign Shield Masthead",
                "comp": "SafetyTitle",
                "path": "components/sections/safety/SafetyScenes.tsx",
                "visual": "Title: 'The Shield' · 'Safety is a function of discipline.'",
                "anim": "Yes (Framer Motion Headline)",
                "status": "Working",
                "top": True,
                "candidate": "No",
                "notes": "TOP/HERO SECTION."
            },
            {
                "name": "§1 The Four Shield Columns",
                "comp": "ShieldColumns",
                "path": "components/sections/safety/SafetyScenes.tsx",
                "visual": "Detailed specifications for Helmet safety, Air vest deployment, Veterinary supervision, Track condition",
                "anim": "Yes (Framer Motion column hover elevate)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Structured technical columns."
            },
            {
                "name": "§2 Orders of the Day (Arena Protocols)",
                "comp": "OrdersOfTheDay",
                "path": "components/sections/safety/SafetyScenes.tsx",
                "visual": "Ex-cavalry military safety orders posted before mounting",
                "anim": "Yes (Framer Motion list reveal)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Military protocol list."
            },
            {
                "name": "§3 Incident Statistics & Number Wall",
                "comp": "NumberWall",
                "path": "components/sections/safety/SafetyScenes.tsx",
                "visual": "Zero catastrophic injury records, 100% helmet compliance rate, veterinary check frequency",
                "anim": "Yes (Framer Motion CountUp numbers)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Animated numerical stat counters."
            },
            {
                "name": "§4 Key Safety Personnel & Veterinary Corps",
                "comp": "People",
                "path": "components/sections/safety/SafetyScenes.tsx",
                "visual": "Profiles of chief safety officers, veterinary surgeons, ex-cavalry instructors",
                "anim": "Yes (Framer Motion card reveals)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Low)",
                "notes": "Personnel cards."
            },
            {
                "name": "Closing End Card",
                "comp": "EndCard",
                "path": "components/film/EndCard.tsx (shared)",
                "visual": "Next corridor invitation: '/anatomy' (The Instrument)",
                "anim": "Yes (Hover transition)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared route navigation end card."
            }
        ]
    },
    # 17. Schools (/schools)
    {
        "page": "/schools",
        "file": "app/schools/page.tsx",
        "sections": [
            {
                "name": "SC01 The Zero-CapEx Engine Masthead",
                "comp": "SchoolsTitle",
                "path": "components/sections/schools/SchoolScenes.tsx",
                "visual": "Title: 'The Engine' · 'Zero-CapEx equestrian infrastructure for India's schools.'",
                "anim": "Yes (Framer Motion Headline)",
                "status": "Working",
                "top": True,
                "candidate": "No",
                "notes": "TOP/HERO SECTION."
            },
            {
                "name": "§1 The Partnership Model Flow",
                "comp": "ModelFlow",
                "path": "components/sections/schools/SchoolScenes.tsx",
                "visual": "5-step turnkey onboarding: Land audit, Arena build, Horse dispatch, Instructor posting, Tournament circuit",
                "anim": "Yes (Interactive step progression with Framer Motion)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Interactive flow diagram."
            },
            {
                "name": "§2 Arena Configurator & Financial Simulator",
                "comp": "ConfiguratorAndSimulator",
                "path": "components/sections/schools/SchoolScenes.tsx",
                "visual": "Interactive cost and revenue calculator for school principals and trustees",
                "anim": "Yes (Live interactive sliders and calculating charts)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Low)",
                "notes": "Interactive financial tool."
            },
            {
                "name": "§3 School Arena Showcase",
                "comp": "SchoolArenaShowcase",
                "path": "components/sections/schools/SchoolScenes.tsx",
                "visual": "Three.js WebGL noise-driven slideshow of live school campus arena builds",
                "anim": "Yes (Three.js simplex noise shader + auto-cycle)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Already has complex Three.js noise transition."
            },
            {
                "name": "§4 Regional Hub Map",
                "comp": "HubMap",
                "path": "components/sections/schools/SchoolScenes.tsx",
                "visual": "Interactive territorial map showing Northern, Western, Central hubs",
                "anim": "Yes (Interactive SVG hub tooltips + pulse beacons)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (High)",
                "notes": "Interactive geography/map."
            },
            {
                "name": "§5 Pan-India Network Directory",
                "comp": "PanIndiaNetwork",
                "path": "components/sections/schools/SchoolScenes.tsx",
                "visual": "Partner school listings, cadet enrolment counts, circuit host privileges",
                "anim": "Yes (Framer Motion grid reveal)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Directory grid."
            },
            {
                "name": "§6 S56 Seal Row",
                "comp": "Inline <section> with Label + Headline + Reveal",
                "path": "app/schools/page.tsx",
                "visual": "Formal badges of EFI affiliation and STPCI accreditation",
                "anim": "Yes (Framer Motion Reveal)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Badge strip."
            },
            {
                "name": "§7 Institutional Partnership Callout",
                "comp": "Inline <section> with Headline + Cta",
                "path": "app/schools/page.tsx",
                "visual": "Final CTA offering automated MOU generation or leadership consultation",
                "anim": "Yes (Framer Motion Headline)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Conversion CTA."
            },
            {
                "name": "Closing End Card",
                "comp": "EndCard",
                "path": "components/film/EndCard.tsx (shared)",
                "visual": "Next corridor invitation: '/why' (The Sovereign Truth)",
                "anim": "Yes (Hover transition)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared route navigation end card."
            }
        ]
    },
    # 18. School Hub (/schools/[slug])
    {
        "page": "/schools/[slug]",
        "file": "app/schools/[slug]/page.tsx",
        "sections": [
            {
                "name": "School Campus Hub Hero",
                "comp": "Inline <section> with FilmImage + Headline",
                "path": "app/schools/[slug]/page.tsx",
                "visual": "Campus photograph, school name, regional hub, founded year, EFI accreditation",
                "anim": "No meaningful animation (Static layout)",
                "status": "Static",
                "top": True,
                "candidate": "Yes (High)",
                "notes": "TOP/HERO SECTION. Static header ripe for cinematic image reveal."
            },
            {
                "name": "Campus Facilities & Arena Capacity",
                "comp": "Inline <section>",
                "path": "app/schools/[slug]/page.tsx",
                "visual": "Dimensions of jumping arena, tent pegging track, stables count, farrier bay",
                "anim": "No meaningful animation (Static layout)",
                "status": "Static",
                "top": False,
                "candidate": "No",
                "notes": "Facility specs."
            },
            {
                "name": "Cadet Squadrons & Horse Roster",
                "comp": "Inline <section> with FilmImage",
                "path": "app/schools/[slug]/page.tsx",
                "visual": "Active enrolled cadets, assigned stallions, upcoming fixtures",
                "anim": "No meaningful animation (Static layout)",
                "status": "Static",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Roster cards."
            },
            {
                "name": "Institutional Enrolment & Lead Form",
                "comp": "Inline <section> with LeadForm",
                "path": "components/sections/shared/LeadForm.tsx",
                "visual": "Interactive application form for parents or visiting schools",
                "anim": "Yes (Form field focus & validation states)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Lead capture form."
            }
        ]
    },
    # 19. MOU Generator (/schools/mou)
    {
        "page": "/schools/mou",
        "file": "app/schools/mou/page.tsx",
        "sections": [
            {
                "name": "Automated Legal MOU Draft Generator",
                "comp": "MouGenerator in <section>",
                "path": "components/sections/schools/MouGenerator.tsx",
                "visual": "Interactive legal document generator: live form filling clauses, generating printable 6-page MOU draft",
                "anim": "Yes (Form step transitions + PDF printable preview)",
                "status": "Working",
                "top": True,
                "candidate": "No",
                "notes": "TOP/HERO SECTION. Highly functional legal utility interface."
            }
        ]
    },
    # 20. Science (/science)
    {
        "page": "/science",
        "file": "app/science/page.tsx",
        "sections": [
            {
                "name": "S01 The Biology & Biometrics Masthead",
                "comp": "ScienceTitle",
                "path": "components/sections/science/ScienceScenes.tsx",
                "visual": "Title: 'The Science' · 'Evolutionary biometrics of the Marwari.'",
                "anim": "Yes (Framer Motion Headline)",
                "status": "Working",
                "top": True,
                "candidate": "No",
                "notes": "TOP/HERO SECTION."
            },
            {
                "name": "§1 Biological Systems Console",
                "comp": "SystemsConsole",
                "path": "components/sections/science/ScienceScenes.tsx",
                "visual": "Interactive anatomical telemetry console tracking Respiratory, Cardiovascular, Skeletal adaptation",
                "anim": "Yes (Framer Motion system tab switcher + telemetry bars)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (High)",
                "notes": "Scientific technical telemetry console."
            },
            {
                "name": "§2 Desert Heat Tolerance Pulse Line",
                "comp": "PulseLine",
                "path": "components/sections/science/ScienceScenes.tsx",
                "visual": "Cardiac waveform chart comparing thermoregulation under 48°C desert heat",
                "anim": "Yes (Animated SVG pulse waveform stroke)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "ECG/pulse graph."
            },
            {
                "name": "§3 Cross-Breed Comparison Ledger",
                "comp": "ComparisonLedger",
                "path": "components/sections/science/ScienceScenes.tsx",
                "visual": "Head-to-head empirical metrics: Marwari vs Thoroughbred vs Warmblood",
                "anim": "Yes (Interactive metric bar comparisons)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Comparative bar chart."
            },
            {
                "name": "§4 S30 Footnote Claims Ledger",
                "comp": "Inline <section> with Reveal",
                "path": "app/science/page.tsx",
                "visual": "Audit table sourcing every medical and scientific claim made on the site",
                "anim": "Yes (Framer Motion Reveal on rows)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Rigorous academic footnotes ledger."
            },
            {
                "name": "Closing End Card",
                "comp": "EndCard",
                "path": "components/film/EndCard.tsx (shared)",
                "visual": "Next corridor invitation: '/lore' (The Bardic Canon)",
                "anim": "Yes (Hover transition)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared route navigation end card."
            }
        ]
    },
    # 21. Tournaments (/tournaments)
    {
        "page": "/tournaments",
        "file": "app/tournaments/page.tsx",
        "sections": [
            {
                "name": "TR01 The National Circuit Masthead",
                "comp": "CircuitTitle",
                "path": "components/sections/tournaments/TournamentScenes.tsx",
                "visual": "Title: 'The Circuit' · 'National Tent Pegging and Tactical Horsemanship.'",
                "anim": "Yes (Framer Motion Headline)",
                "status": "Working",
                "top": True,
                "candidate": "No",
                "notes": "TOP/HERO SECTION."
            },
            {
                "name": "§1 National Standings & Squad Lanes",
                "comp": "StandingsLanes",
                "path": "components/sections/tournaments/TournamentScenes.tsx",
                "visual": "Live division leaderboard showing institutional squad points, gold pegs, time penalties",
                "anim": "Yes (Hover lane highlight + rank change indicators)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Low)",
                "notes": "Leaderboard table."
            },
            {
                "name": "§2 Annual Fixtures Board",
                "comp": "FixtureBoard",
                "path": "components/sections/tournaments/TournamentScenes.tsx",
                "visual": "Calendar of upcoming national trials: Jodhpur, Jaipur, Delhi, Pune, Chandigarh",
                "anim": "Yes (Interactive month filter tabs)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Calendar fixtures board."
            },
            {
                "name": "§3 Tactical Course Diagram",
                "comp": "CourseDiagram",
                "path": "components/sections/tournaments/TournamentScenes.tsx",
                "visual": "Architectural top-down blueprint of the 100m sprint lane, peg boxes, and lance recovery zone",
                "anim": "Yes (Animated SVG sprint line and measurement callouts)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (High)",
                "notes": "Top-down athletic track blueprint."
            },
            {
                "name": "§4 Circuit Action Archive Gallery",
                "comp": "TournamentActionGallery",
                "path": "components/sections/tournaments/TournamentScenes.tsx",
                "visual": "Cinematic forward-zoom drift reel across 4 competition scenes (charge, crowd, podium, trophy)",
                "anim": "Yes (GSAP 4.2x forward zoom drift reel)",
                "status": "Working / Completed & Locked",
                "top": False,
                "candidate": "No (LOCKED)",
                "notes": "Protected in COMPLETED_SECTIONS.md."
            },
            {
                "name": "§5 The Champion's Podium & Trophy Spec",
                "comp": "Podium",
                "path": "components/sections/tournaments/TournamentScenes.tsx",
                "visual": "Engraved brass trophy presentation, past winning cadet academies",
                "anim": "Yes (Framer Motion trophy pedestal elevation)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Trophy showcase."
            },
            {
                "name": "Closing End Card",
                "comp": "EndCard",
                "path": "components/film/EndCard.tsx (shared)",
                "visual": "Next corridor invitation: '/verify' (The Seal)",
                "anim": "Yes (Hover transition)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared route navigation end card."
            }
        ]
    },
    # 22. Tournament Event (/tournaments/[slug])
    {
        "page": "/tournaments/[slug]",
        "file": "app/tournaments/[slug]/page.tsx",
        "sections": [
            {
                "name": "Event Hero & Arena Photography",
                "comp": "Inline <section> with FilmImage",
                "path": "app/tournaments/[slug]/page.tsx",
                "visual": "Full-bleed tournament photograph, event title, date, venue location",
                "anim": "No meaningful animation (Static layout)",
                "status": "Static",
                "top": True,
                "candidate": "Yes (High)",
                "notes": "TOP/HERO SECTION. Static header ripe for cinematic reveal."
            },
            {
                "name": "Event Overview & Key Parameters",
                "comp": "Inline <section>",
                "path": "app/tournaments/[slug]/page.tsx",
                "visual": "Format, age limits, spectator admissions, prize purse",
                "anim": "No meaningful animation (Static layout)",
                "status": "Static",
                "top": False,
                "candidate": "No",
                "notes": "Event overview."
            },
            {
                "name": "Events Schedule & Official Rulebook",
                "comp": "Inline <section> with Label + Cta",
                "path": "app/tournaments/[slug]/page.tsx",
                "visual": "Detailed division order, lance specifications, disqualification thresholds",
                "anim": "No meaningful animation (Static layout)",
                "status": "Static",
                "top": False,
                "candidate": "No",
                "notes": "Rulebook copy."
            }
        ]
    },
    # 23. Verify (/verify)
    {
        "page": "/verify",
        "file": "app/verify/page.tsx",
        "sections": [
            {
                "name": "VR01 The Seal Masthead",
                "comp": "VerifyTitle",
                "path": "components/sections/verify/VerifyScenes.tsx",
                "visual": "Title: 'The Seal' · 'Every hour logged. Cryptographically immutable.'",
                "anim": "Yes (Framer Motion Headline)",
                "status": "Working",
                "top": True,
                "candidate": "No",
                "notes": "TOP/HERO SECTION."
            },
            {
                "name": "§1 Interactive Passport Verifier Form",
                "comp": "Inline <section> with Verifier",
                "path": "components/sections/verify/Verifier.tsx",
                "visual": "Secure passport code input box with sample cadet chips and validation output",
                "anim": "Yes (Interactive code verification, loading spinner, status badge)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Interactive verification tool."
            },
            {
                "name": "§2 Cryptographic Audit Chain",
                "comp": "Chain",
                "path": "components/sections/verify/VerifyScenes.tsx",
                "visual": "Visual demonstration of the SHA-256 Merkle root hashing each logged hour",
                "anim": "Yes (Framer Motion block link connectors with animated highlight pulses)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (High)",
                "notes": "Cryptographic blockchain/audit chain visualization."
            },
            {
                "name": "§3 Privacy Matrix (What a Verifier Sees vs Never Sees)",
                "comp": "Inline <section>",
                "path": "app/verify/page.tsx",
                "visual": "Split ledger showing public verification fields vs vaulted student private data",
                "anim": "No meaningful animation (Static layout)",
                "status": "Static",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Editorial privacy ledger."
            },
            {
                "name": "Closing End Card",
                "comp": "EndCard",
                "path": "components/film/EndCard.tsx (shared)",
                "visual": "Next corridor invitation: '/contact' (The Gate)",
                "anim": "Yes (Hover transition)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared route navigation end card."
            }
        ]
    },
    # 24. Verify Cadet Record (/verify/[code])
    {
        "page": "/verify/[code]",
        "file": "app/verify/[code]/page.tsx",
        "sections": [
            {
                "name": "Verified Cadet Record & Credentials",
                "comp": "Inline <section> with QrSeal + Monogram",
                "path": "app/verify/[code]/page.tsx",
                "visual": "Official cadet certificate with QR seal, verified riding hours, rank, EFI status, last sealed date",
                "anim": "Yes (QR seal verification stamp-in animation)",
                "status": "Working",
                "top": True,
                "candidate": "No",
                "notes": "TOP/HERO SECTION. Official verification record."
            },
            {
                "name": "Printable Academy Diploma",
                "comp": "Inline <section> with PrintButton + Crest",
                "path": "app/verify/[code]/page.tsx",
                "visual": "Parchment certificate formatted for physical framing and print output",
                "anim": "Yes (Print button action)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Printable credential certificate."
            }
        ]
    },
    # 25. Why (/why)
    {
        "page": "/why",
        "file": "app/why/page.tsx",
        "sections": [
            {
                "name": "W01 The Sovereign Truth Masthead",
                "comp": "WhyTitle",
                "path": "components/sections/why/WhyScenes.tsx",
                "visual": "Title: 'The Sovereign Truth' · 'Why horses in an age of algorithms.'",
                "anim": "Yes (Framer Motion Headline)",
                "status": "Working",
                "top": True,
                "candidate": "Yes (High)",
                "notes": "TOP/HERO SECTION. High impact existential question."
            },
            {
                "name": "§1 The Glass (Screen Time vs Saddle Time)",
                "comp": "Glass",
                "path": "components/sections/why/WhyScenes.tsx",
                "visual": "Shattered black glass screen graphic contrasting digital paralysis with living physical reality",
                "anim": "Yes (Framer Motion split fracture animation)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (High)",
                "notes": "Strong candidate for tactile or glass shattering/reveal effect."
            },
            {
                "name": "§1.5 Breath Cue (The Physiological Heartbeat)",
                "comp": "BreathCue",
                "path": "components/film/BreathCue.tsx (shared)",
                "visual": "Rhythmic breathing indicator synchronizing viewer respiration to equine heart rate",
                "anim": "Yes (CSS keyframe gentle breath scale expansion)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Calming physiological breath pacer."
            },
            {
                "name": "§2 The Sovereign Crucible",
                "comp": "SovereignCrucible",
                "path": "components/sections/why/WhyScenes.tsx",
                "visual": "Philosophical treatise on developing unshakeable courage under genuine physical stakes",
                "anim": "Yes (Framer Motion scroll reveal)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Philosophical manifesto."
            },
            {
                "name": "§3 Big Slider (AI Age vs Equine Mastery)",
                "comp": "BigSlider",
                "path": "components/sections/why/WhyScenes.tsx",
                "visual": "Interactive drag comparison slider contrasting synthetic algorithmic dopamine with deep time horsemanship",
                "anim": "Yes (Interactive before/after drag slider with touch/mouse scrub)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (High)",
                "notes": "Interactive comparison slider."
            },
            {
                "name": "§4 The Sanctuary of Unpowered Truth (Monolith)",
                "comp": "Monolith",
                "path": "components/sections/why/WhyScenes.tsx (shared)",
                "visual": "Monumental typography setting down the sanctuary principles",
                "anim": "Yes (Framer Motion staggered sentence reveals)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared component with /about."
            },
            {
                "name": "§5 What Horses Train in Humans (TrainList)",
                "comp": "TrainList",
                "path": "components/sections/why/WhyScenes.tsx",
                "visual": "Grid of psychological traits forged in the saddle: Non-verbal command, nervous system calm, moral weight",
                "anim": "Yes (Framer Motion card hover lifts)",
                "status": "Working",
                "top": False,
                "candidate": "Yes (Medium)",
                "notes": "Psychological trait cards."
            },
            {
                "name": "Closing End Card",
                "comp": "EndCard",
                "path": "components/film/EndCard.tsx (shared)",
                "visual": "Next corridor invitation: '/about' (The Institution)",
                "anim": "Yes (Hover transition)",
                "status": "Working",
                "top": False,
                "candidate": "No",
                "notes": "Shared route navigation end card."
            }
        ]
    }
]

# Calculate exact metrics
total_routes = len(audit_data)
all_sections = []
shared_comps = set()
unique_comps = set()

animated_sections = 0
static_sections = 0

working_anims = 0
partial_broken = 0

for page in audit_data:
    for sec in page["sections"]:
        all_sections.append(sec)
        comp_file = sec["path"]
        if "(shared)" in comp_file:
            shared_comps.add(comp_file)
        unique_comps.add(comp_file.split(" ")[0])
        
        if sec["anim"].startswith("Yes"):
            animated_sections += 1
            if "Working" in sec["status"]:
                working_anims += 1
            else:
                partial_broken += 1
        else:
            static_sections += 1

print(f"Total Routes / Pages: {total_routes}")
print(f"Total Page-Section Pairings: {len(all_sections)}")
print(f"Total Unique Component Files: {len(unique_comps)}")
print(f"Sections With Animations: {animated_sections}")
print(f"Sections With No Meaningful Animation (Static): {static_sections}")
print(f"Animations Complete & Working: {working_anims}")
print(f"Animations Partial / Broken / Unverified: {partial_broken}")
