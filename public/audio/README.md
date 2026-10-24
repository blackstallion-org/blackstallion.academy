# BSAH audio

Sound effects are OFF for a new visitor. The existing nav Sound button controls the interaction layer. A remembered ON preference still requires a fresh pointer/keyboard gesture after a full load. No background drone loops, hover sounds, or typing sounds.

## User-supplied recordings

All seven files supplied on 19 October 2026 are used as short, normalized, faded, mono MP3 derivatives in `interactions/`. Original files in Downloads were not modified. `interactions/manifest.json` records source filenames, trim offsets and durations. Source names identify the files supplied by the user; they are not a claim that third-party recording licences were independently verified.

| Output | Supplied source | Placement |
| --- | --- | --- |
| gallop.mp3 | pwlpl-horses-galloping-sound-effect-359255.mp3 | Links entering Cadets |
| neigh.mp3 | mixkit-scared-horse-neighing-85.wav | Explicit studbook dossier Open controls; quiet, rare accent, not a success/error signal |
| snort.mp3 | mixkit-horse-stallion-snore-75.wav | Sound opt-in acknowledgement, breed filters and existing breath markers |
| desert-chase.mp3 | ElevenLabs_Fast_cinematic_horse_chase_in_open_desert_Multiple_horses_galloping_on_dry_dirt_road,_strong_layere.mp3 | Links entering Tournaments |
| herd.mp3 | ElevenLabs_A_herd_of_racing_horses_galloping_fast,_multiple_horses_neighing_and_whinnying_at_the_same_time,_dir.mp3 | Links entering Fleet |
| chariot.mp3 | freesound_community-horse-and-chariot-30-sec-73615.mp3 | Links entering Legend |
| horse-call.mp3 | freesound_community-081739_horse-88614.mp3 | Living archive photograph buttons |

Seven MP3s: 1.386–3.2 seconds, 96 kbps mono/44.1 kHz, loudness target −18 LUFS / −4 dBTP before low runtime gain, short fade in/out. Runtime per-cue volume caps are 0.08–0.16. No time stretching or invented recording content.

## Additional minimal foley

`interactions/leather.wav` (160ms) and `tack.wav` (220ms) are original locally synthesized UI accents, not field recordings. Leather is used for ordinary same-origin links; tack for ordinary non-form controls. No external download, new library or licence required. All nine new files total 246,133 bytes and are loaded only on demand.

## Mix rules

- One voice at a time, no queue or delayed sounds.
- At least 700ms between any two cues; 900ms per UI cue; 12 seconds between any equine cues.
- Existing breath requests are clamped to the new lower volume and equine cooldown.
- Turning Sound OFF stops and resets every active effect immediately.
- Hidden tab/pagehide stops playback. Deliberately unmuted, playing video suppresses effects.
- No ordinary form interactions, hover, focus or keystrokes make sounds. Missing/blocked media fails silently.
- Existing hero video has its own explicit mute/play controls and is excluded from UI foley.

## Retained legacy assets

`bsah_ambient_432hz_drone.mp3`, `bsah_stallion_breath.wav`, and `bsah_keystroke.wav` remain intact. Originally synthesized on 11 October 2026; source generation script: docs/qa/make_audio.py. The ambient file no longer loops. Existing `breath` calls now use the recorded snort. The legacy key effect remains available in the engine but terminal typing no longer calls it.
