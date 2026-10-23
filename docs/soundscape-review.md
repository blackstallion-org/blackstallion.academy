# Interaction soundscape — 19 October 2026

Implemented a restrained site-wide sound layer using all seven supplied recordings and two original synthetic UI foley accents. Kept the existing nav control and appearance. New visitors remain silent until opting in. Returning opted-in visitors need a fresh gesture. No background loop, hover, focus or per-character typing noise.

## Implementation

- `lib/audio/engine.ts`: lazy cached media, quiet per-effect caps, single voice, shared/per-effect cooldowns, no queue, persisted opt-in, fresh-gesture unlock, mute/reset, cleanup and silent playback rejection. A playing unmuted video takes priority.
- `components/site/Soundscape.tsx`: one delegated click listener across routes, working with keyboard-generated activation clicks, named journey cues and explicit horse controls; ignores ordinary forms, disabled controls, external/download links and opt-out controls. Stops audio on visibility/pagehide and removes listeners/media on cleanup.
- `app/layout.tsx`: mounts the singleton layer.
- `components/site/SoundToggle.tsx`: same visible button; updated accessible label, opt-out from foley, no automatic ambient loop.
- `components/sections/fleet/FleetScenes.tsx`: quiet snort for breed filters; rare neigh for opening a dossier.
- `components/sections/home/ImageCubeGallery.tsx`: recorded horse call for photograph buttons.
- `components/sections/home/Hero.tsx`: existing explicit video controls excluded from interaction foley.
- `components/sections/command/Terminal.tsx`: removed the old per-keystroke click.
- `public/audio/interactions/`: seven optimized MP3 derivatives, two original WAV accents, source/trim manifest. All original user files preserved. New media totals 246,133 bytes; no package installed.

Full source-to-placement mapping and mix specifications: `public/audio/README.md`. All supplied source files are referenced there. No additional third-party recordings downloaded; the two small extra UI cues are synthesized, not represented as real leather/tack recordings.

## Validation actually run

- `npm run typecheck`: passed.
- Focused ESLint on engine, Soundscape, SoundToggle, layout and four changed consumer TSX files: passed.
- `npm run build`: passed, 49 static pages generated.
- Scoped `git diff --check`: passed.
- `node scripts/test-soundscape.cjs`: passed. Covers default silence/no media, saved-consent gesture gate and listener cleanup, all nine effects/files, lazy media, volume caps, rapid-click/shared equine cooldown, no overlapping voice, immediate mute/reset, hidden-tab suppression, audible-video priority, rejected playback and teardown. Uses mocked media to verify lifecycle; does not claim real browser audibility from unit tests.
- ffprobe: all nine derivatives decode as expected, 44.1 kHz mono, 160ms–3.2s. Details in manifest.
- IAB browser: no audio elements before enabling; enabling produced recorded snort with readyState 4, advancing currentTime and paused=false, with no media error. Sound OFF paused/reset it; changing corridors while OFF produced no active audio. Sound ON plus corridor interaction produced the tack cue; rapid follow-up kept one active voice. Legend link produced chariot playback with readyState 4 and advancing currentTime; navigation completed to /legend with the ON preference preserved. Final mute showed zero active audio; left the test browser OFF. Checked browser error log was empty.

The local dev server stalled while testing after a production build; restarted only this project's dev server on port 3000 and resumed checks. No unrelated processes stopped. A pre-existing hot-refresh warning about changing the HorizontalChapter effect dependency list appeared in the server log from the preceding typography task; it was not present as an error in the final browser check.

## Limits

Real media playback state was verified; a headphone/listening balance review, physical iOS/Android and Safari/Firefox checks were not performed. Hidden-tab/video-priority assertions were unit-tested rather than driven through a real browser visibility transition or audible video. No full automated accessibility audit, network transfer benchmark or field performance measurement. No live forms submitted in this task. No commit or production deployment.
