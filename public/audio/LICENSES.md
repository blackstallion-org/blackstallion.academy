# Audio sources and licences

Checked 2 November 2026. Each Freesound page was fetched and shows "Creative Commons 0" with a link to
http://creativecommons.org/publicdomain/zero/1.0/ (raw record: `docs/claude-site-brief-2026-11-02/audio-sources/freesound-ledger.json`).
CC0 needs no attribution; authors are credited here anyway. All files below were trimmed, faded and loudness-normalised with ffmpeg
(effects about −20 LUFS, beds about −25 LUFS, music −21.5 LUFS); nothing was time-stretched or re-composed.

## Music (sitewide, loops for the whole visit)

| File | Work | Licence | Credit required |
| --- | --- | --- | --- |
| `music/windswept.mp3` | "Windswept", Kevin MacLeod (incompetech.com), 2010, ISRC USUAN1100757 | Creative Commons: By Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/) | Yes, shown in the site footer and on the nav Sound control |

**Substitution.** The owner asked for https://youtu.be/iqw0IY1qJG8 ("A Melody from the Open Range | Peaceful Cowboy Music for
Relaxation", channel *Music of the Valley*, per YouTube oEmbed on 2 Nov 2026). Neither the video nor the channel publishes a licence or
reuse permission, and YouTube's terms allow playback only through its own visible player, so the audio was not downloaded or embedded.
"Windswept" (relaxed guitar and strings, written for scenic outdoor scenes) was chosen as the nearest licensed match. If the owner
obtains written permission or a licence file from the channel, replace `music/windswept.mp3` and the `MUSIC` record in `lib/audio/mixer.ts`.

## Horse palette (seven sounds, `interactions/`)

| File | Role | Source | Licence |
| --- | --- | --- | --- |
| `neigh.mp3` | call | Mixkit "Scared horse neighing" (supplied by the owner, 19 Oct 2026) | Mixkit free licence (as supplied; see README) |
| `horse-call.mp3` | call | "081739_horse" (freesound_community, supplied by the owner) | Pixabay content licence (as supplied) |
| `snort.mp3` | breath | Mixkit "Horse stallion snore" (supplied by the owner) | Mixkit free licence (as supplied) |
| `breath.mp3` | breath | "Horse Breathing.wav", metaepitome, https://freesound.org/people/metaepitome/sounds/275388/ | CC0 1.0 |
| `gallop.mp3` | hoofbeats | "horses galloping sound effect 359255" (pwlpl, supplied by the owner) | Pixabay content licence (as supplied) |
| `walk.mp3` | hoofbeats | "Horse Clip Clopping Downhill (stereo)", swiftoid, https://freesound.org/people/swiftoid/sounds/182504/ | CC0 1.0 |
| `saddle.mp3` | interaction | "R12-63-Sitting Down on Horse Saddle.wav", craigsmith, https://freesound.org/people/craigsmith/sounds/481831/ | CC0 1.0 |

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
