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
