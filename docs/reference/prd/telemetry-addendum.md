# Mobile Visual Telemetry Addendum (Phase 1)

> Source: `instructions/BSAH_Combined_Documents.pdf (pages 4-6)` (converted to Markdown for Claude Code; the original file is unchanged).

```text
TO:                         Prashant & Mobile App Development                      DATE:                  September 30, 2026
                              Team

  FROM:                       Saef Ullah Khan, Founder & Executive                   TARGET BUILDS:         main_sovereign &
                              Chairman                                                                      main_fieldops

  PARENT ENTITY:              Vicarius Infinitum Holdings Private                    ECOSYSTEM:             SBSA Mobile Platform
                              Limited

  OPERATING SUB:              The Black Stallion Academy of Horsemanship Private Limited (BSAH)

  SUBJECT:                    Technical Addendum — Client-Side "Sovereign" Visual Telemetry Engine (Phase 1)


 SECTION 1: ADDENDUM OVERVIEW & HARDWARE CONSTRAINTS
This document serves as an immediate technical addendum to the SBSA Mobile Ecosystem PRD. It specifies four high-
impact visual telemetry and UI enhancements to be compiled directly into Phase 1 builds (main_sovereign.dart and
main_fieldops.dart).

  COST ARCHITECTURE                                                           EXECUTION ENVIRONMENT

  ₹0 additional API or backend cloud processing fees. All ML                  100% Client-Side / Edge AI execution via Google MediaPipe
  transforms execute natively on host device hardware.                        PoseLandmarker (bundled asset task file) running on local
                                                                              GPUs/NPUs.


 SECTION 2: TECHNICAL SPECIFICATIONS FOR PHASE 1 ADDITIONS
  1. Golden Skeleton Canvas Overlay                                                          lib/core/telemetry/golden_skeleton.dart

  Framework: Open-source Google MediaPipe PoseLandmarker (33-point topology) via local task bundle
  (pose_landmarker_lite.task).
  Visual Rendering:
        • Custom Painter widget rendering a 33-point skeletal vector overlay across the 10-second compressed MP4 clip.
        • Color Palette: Glowing Brushed Metallic Gold (#C5A059) with 1.5px line width and glowing joint nodes (#D4AF37) at
        key articulation joints (Ears, Shoulders, Hips, Knees, Heels).
  Performance Target: Offline video file analysis during local 10s clip rendering at ≥ 30 FPS on standard iPads / Android tablets.



  2. Automated Posture Index Score Engine                                                lib/core/telemetry/posture_calculator.dart

  Algorithm: On-device mathematical vector geometry executed using MediaPipe landmark coordinates:

    Posture Index (%) = 100 - [ (|180° - θ_spine| × 0.6) + (|180° - θ_neck| × 0.4) ]
    where θ_spine = ∠(Shoulder, Hip, Heel) and θ_neck = ∠(Ear, Shoulder, Hip) vectors.
  UI Output:
        • Renders a sleek golden badge on Parent Portal below player: "Posture Alignment: 94% — Sovereign Standard"
        • Side-by-Side Slider: Day 1 baseline skeleton vs. Current session skeleton overlay slider ("Tech-Neck Elimination" proof).
THE BLACK STALLION ACADEMY OF HORSEMANSHIP PVT. LTD.                    CONFIDENTIAL • TECHNICAL ADDENDUM                    PAGE 1 OF 2




 SECTION 2: TECHNICAL SPECIFICATIONS (CONTINUED)



   3. Dynamic Gold Waveform Engine                                                    lib/core/widgets/stoic_waveform.dart

   Component: Animated audio frequency visualizer integrated into the 06:00 AM Stoic Daily Spark screen.
   Execution:
        • Reads local 30-second MP3 audio stream amplitude data.
        • Renders 32 vertical metallic gold bars (#C5A059) pulsing dynamically in real-time to the audio frequency.
   UI Feel: Tactical, executive briefing aesthetic rather than a basic consumer audio player.



   4. 3D Brass Stamp & Haptic Sealing Animation                                           lib/core/widgets/haptic_seal.dart

   Execution: Triggered when the instructor hits "Publish to Ledger" or logs a weekly skill mark.
   Animation Specs:
        • A 0.8-second 3D scale-down and rotation animation of the BSAH Marwari Brass Seal.
        • Synchronized heavy device haptic feedback (HapticFeedback.heavyImpact()) upon contact with digital passport
        page.
        • Audio Cue: Subtle metallic press sound effect (seal_press.wav).



  SECTION 3: DEVELOPER ACTION ITEMS FOR SPRINT 1 & 2
   PUBSPEC CONFIG         Asset Dependency Setup: Add vision_ai_pose or native MediaPipe task bundle asset to
                          pubspec.yaml at path assets/models/pose_landmarker_lite.task. Ensure local model
                          bundling is enabled for offline execution.



   PIPELINE CORE       Local Processing Pipeline: Intercept the raw 10-second video recording buffer inside lib/core/camera,
                       run local frame-by-frame pose analysis, and generate the structured JSON coordinates array for the gold
                       canvas overlay.



   DB SCHEMA        Database Integration: Store the calculated Posture Index Score directly in the existing riding_rating
                    column or as a lightweight JSON attribute inside groom_daily_logs / session_logs without requiring
                    database schema migration.


  PUBSPEC.YAML — LOCAL ASSET BUNDLE INTEGRATION
  flutter:
    assets:
      - assets/models/pose_landmarker_lite.task
      - assets/audio/seal_press.wav
      - assets/audio/stoic_spark_daily.mp3


Saef Ullah Khan                                                                                             A U T H E N T I C AT E D

Founder & Executive Chairman                                                                         EDGE TELEMETRY LOCK
                                                                                                          PHASE 1 DIRECTIVE
Vicarius Infinitum Holdings Private Limited
THE BLACK STALLION ACADEMY OF HORSEMANSHIP PVT. LTD.   CONFIDENTIAL • TECHNICAL ADDENDUM   PAGE 2 OF 2
```
