# Parent Portal, Skeletal AI & Live Streaming Spec

> Source: `instructions/04_Media_Content/parent_portal_and_telemetry_manifest.docx` (converted to Markdown for Claude Code; the original file is unchanged).

```text
===================================================================

PARENT PORTAL, SKELETAL AI & LIVE STREAMING SPECIFICATIONS

===================================================================

1. 24/7 Stall-Cam & Arena WebRTC Pipeline

- Secure Video Vaults: AWS S3 private buckets (`bsah-media-vault`) rendering short-lived signed URLs for authorized parents.

- Dual Camera Streams:

* Stream A: 24/7 HD Stall-Cam feed for assigned cadet steeds.

* Stream B: Live 60fps Arena Training Feed during scheduled session hours.

2. Skeletal AI Motion Telemetry (Google MediaPipe Pose)

- Non-Biometric Pose Processing: AI overlay detects spinal angle, stirrup balance, and lance strike trajectory without saving facial biometric scans.

- Daily Session Highlights: Automated generation of 10-second 60fps milestone clips delivered to the Parent Mobile App at 06:00 AM.
```
