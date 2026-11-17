# Audio sources and licences

Checked 2 November 2026. Each Freesound page was fetched and shows "Creative Commons 0" with a link to
http://creativecommons.org/publicdomain/zero/1.0/ (raw record: `docs/claude-site-brief-2026-11-02/audio-sources/freesound-ledger.json`).
CC0 needs no attribution; authors are credited here anyway. All files below were trimmed, faded and loudness-normalised with ffmpeg
(effects about −20 LUFS, beds about −25 LUFS, music −21.5 LUFS); nothing was time-stretched or re-composed.

## Music (sitewide, loops for the whole visit)

| File | Work | Licence | Credit shown |
| --- | --- | --- | --- |
| `music/open-range.mp3` | "A Melody from the Open Range | Peaceful Cowboy Music for Relaxation", channel *Music of the Valley* | **Not verified.** Supplied by the owner on 3 Nov 2026; neither the video nor the channel publishes a licence or reuse terms | Title and channel in the site footer and on the nav Sound control |

The supplied recording is 61 min 40 s (65 MB). The site plays all of it (loudnorm to about -21.5 LUFS, 2 s fade in, 6 s fade out,
64 kbps stereo, 29.6 MB), streamed by range requests (`preload="metadata"`) and looped. Nothing was time-stretched or re-composed.
The original is kept outside the repo.
Before a public launch the owner should obtain written permission or a licence file from the channel; until then this is a placeholder
in the same sense as the Higgsfield imagery. The previous track, "Windswept" (Kevin MacLeod, CC BY 4.0), was removed on 3 Nov 2026.

## Opening film (home page, first visit of a session): "The Lineage" since 17 Nov 2026

The first-visit intro is "The Lineage" (`public/video/the-lineage*.mp4`, one minute): its music and horse sounds are in the
"Intro film soundtrack" table below. It replaced the 37.5 s film described next, whose files were removed the same day; the
owner's score "Sovereign of the Marwar" (88.8 s master) is no longer used or credited on the site.

### Former opening film score (16 Nov 2026, replaced 17 Nov 2026)

Since 16 Nov 2026 the opening film (`public/video/intro-film*.mp4`) carries "Sovereign of the Marwar", an original score the
owner supplied for the site (88.8 s master, kept out of the web build). The film uses its first 37.5 s, faded out over the last
4 s and loudness-normalised to about -16 LUFS, muxed into the video files (scripts/build-intro-film.mjs). Credited in the footer.
The previous opening trailer's track ("Epic Indian Orchestral Fusion", vjgalaxy, Pixabay Content License) was removed with the
trailer the same day.

A third Pixabay-licensed candidate was downloaded and not used: "Indian - Epic Indian" (HitsLab, 540948). "India Epic Cinematic
Music" (414595) became the Marwar Journey film's soundtrack (below).

## Home hero film (`video/hero-rider-lesson*.mp4`, the film under the doctrine screen)

The owner's edit ("From the beginning of 12 century… the Marwars… known for their… courage and bravery"), committed on 15 Nov 2026 with no
source page, licence file or credit for its picture or its soundtrack. **Not verified**: the owner should confirm the right to
publish the footage and the music (and any credit the providers require) before a public launch. No credit or watermark appears in
the film (frames checked every 1.5 s), so cutting its end card removed no attribution.

16 Nov 2026 (owner): the film's own end card ("BLACK STALLION" on smoke, 58.04 to 61.0 s) and its black tail (to 63.30 s) were cut.
Both files now end on the last frame of the white-horse close-up (frame 1390, 57.958 s): the desktop picture is stream-copied
(no re-encode), the phone cut is re-encoded with x264 from the desktop file (960×480, CRF 23); the sound is faded out over the last
1.4 s (AAC 128/96 kb/s). The removed card carried only the academy's name, which the site now sets as a title over the held frame
(`components/sections/home/HeroFilm.tsx`). Originals are in git history.

## Marwar Journey film soundtrack (`video/marwar-journey*.mp4`, home page and /worlds)

| Part | Source | Licence |
| --- | --- | --- |
| Music | "India Epic Cinematic Music" by u_hlhpc1qr1p, https://pixabay.com/music/india-india-epic-cinematic-music-414595/ (downloaded 15 Nov 2026), 0:03 to 0:33 | Pixabay Content License: free for commercial use, no attribution required |
| Gallop bed, neigh | `ambience/cavalry-gallop.mp3`, `interactions/neigh.mp3` (see the tables below) | as listed below |

Mixed with ffmpeg on 15 Nov 2026 (music loudnorm to -18 LUFS, 0.6 s fade in, 2 s fade out; gallop bed at 32 % for 0 to 19.6 s; neigh
at 22.9 s; limiter), AAC 160 kb/s, about -16.6 LUFS, remuxed onto both cuts (picture not re-encoded). It replaces the earlier bed built
on "Open Range", whose licence is unverified.

17 Nov 2026: the film's picture was replaced (desert, palace, BSAH gate; `video/marwar-journey-v2*.mp4`). The same mix was carried over,
trimmed to 28.83 s with a 1.5 s fade out; no new audio source.

## Intro film soundtrack (`video/the-lineage*.mp4`, /film)

| Part | Source | Licence |
| --- | --- | --- |
| Music | "Desert Rajasthan Folk Music" by alex-morgan, https://pixabay.com/music/folk-desert-rajasthan-folk-music-583283/ (downloaded 17 Nov 2026), 0:00 to 1:00 | Pixabay Content License: free for commercial use, no attribution required |
| Horse sounds | `interactions/walk.mp3`, `ambience/cavalry-gallop.mp3`, `interactions/horse-call.mp3`, `interactions/snort.mp3` | as listed below |

Mixed with ffmpeg on 17 Nov 2026 (`video/scripts/mix-audio.sh`: score loudnorm, 4.5 s fade out; walk at 4.7 s; gallop at 16.3 s and
24.3 s; horse call at 16.9 s; snorts at 31.6 s and 50.2 s; limiter), about -14.6 LUFS. The 61 s score excerpt is kept in `video/audio/`.

## Horse palette (seven sounds, `interactions/`)

| File | Role | Source | Licence |
| --- | --- | --- | --- |
| `neigh.mp3` | call | Mixkit "Scared horse neighing" (supplied by the owner, 19 Oct 2026) | Mixkit free licence (as supplied; see README) |
| `horse-call.mp3` | call | "081739_horse" (freesound_community, supplied by the owner) | Pixabay content licence (as supplied) |
| `snort.mp3` | breath | Mixkit "Horse stallion snore" (supplied by the owner), trimmed to one 0.9 s snort on 14 Nov 2026; it also plays for every breath cue | Mixkit free licence (as supplied) |
| ~~`breath.mp3`~~ | retired 14 Nov 2026 | "Horse Breathing.wav", metaepitome (its four bursts read as a cough) | CC0 1.0 |
| `gallop.mp3` | hoofbeats | "horses galloping sound effect 359255" (pwlpl, supplied by the owner) | Pixabay content licence (as supplied) |
| `walk.mp3` | hoofbeats | "Horse Clip Clopping Downhill (stereo)", swiftoid, https://freesound.org/people/swiftoid/sounds/182504/ | CC0 1.0 |
| `saddle.mp3` | interaction | "R12-63-Sitting Down on Horse Saddle.wav", craigsmith, https://freesound.org/people/craigsmith/sounds/481831/ | CC0 1.0 |
| `snorting-short.mp3` | background (every 60 s) | "Horse Snorting.mp3", supplied by the owner on 14 Nov 2026 (11.3 s) | **Not verified.** Supplied file, no source page or licence given; the owner should confirm the source and licence before a public launch. Loudness-normalised to about -18 LUFS with short fades; otherwise untouched |
| `snorting-long.mp3` | background (every 60 s) | "horse sound snorting.mp3", supplied by the owner on 14 Nov 2026 (31.8 s) | **Not verified.** As above |

`leather.wav`, `tack.wav` (synthetic UI accents) and `../bsah_keystroke.wav` are original, generated locally.
Retired on 2 Nov 2026 and no longer requested by the site: `chariot.mp3`, `herd.mp3`, `desert-chase.mp3`, `../bsah_ambient_432hz_drone.mp3`.

## Location ambience (`ambience/`, the Fleet worlds)

| File | Built from | Licence |
| --- | --- | --- |
| `cavalry-bed.mp3` | "Looping Gentle Wind Ambience on an Open Desert Plain", dhallcomposer, https://freesound.org/people/dhallcomposer/sounds/697217/ + "War Drum Loop", PearceWilsonKing, https://freesound.org/people/PearceWilsonKing/sounds/274223/ (low-passed, distant) | CC0 1.0 |
| `cavalry-gallop.mp3` | "R14-05-Horses Gallop By.wav", craigsmith, https://freesound.org/people/craigsmith/sounds/479742/ (low-passed, distant) | CC0 1.0 |
| `village-bed.mp3` | "Raigarh Village Early Afternoon" (India), kalhan, https://freesound.org/people/kalhan/sounds/553079/ (100–155 s) | CC0 1.0 |
| `village-herders.mp3` | "Goat Herders whistling, dogs barking", Anzbot, https://freesound.org/people/Anzbot/sounds/562181/ | CC0 1.0 |
| `field-bed.mp3` | "Horse outside eating breathing stomping quiet", TRP, https://freesound.org/people/TRP/sounds/574094/ (5–60 s) | CC0 1.0 |
| `field-crowd.mp3` | "072510_distant_cheer.wav", moxobna, https://freesound.org/people/moxobna/sounds/102108/ | CC0 1.0 |

## Four Worlds soundtrack (6 Nov 2026)

`music/four-worlds.mp3` is the track the owner supplied for the `/worlds` film (original file name `1793984615100_copy_3AAA2FC6-A982-417A-8272-F4FDEE8A00D4.mp3`, 149 s, 226 kbps). Re-encoded for the web: loudness normalised to -18 LUFS, short fade at both ends, 128 kbps, 2.4 MB. It plays on the music bus in place of the open-range recording while `/worlds` is open (`setMusicSource` in `lib/audio/mixer.ts`). The origin and licence of the recording have not been independently verified: the owner should confirm the right to publish it.
