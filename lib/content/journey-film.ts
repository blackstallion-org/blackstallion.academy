import { asset } from "./asset";

/**
 * The Marwar Journey (15 Nov 2026): the owner's 30-second film, the second film on the home page. It replaces the real-time 3D
 * stallion film (desert → village → campus, components/stallion-film), which was removed with its renderer the same day.
 *
 * Master: public/video/copy_B784F36E-F622-4F74-9185-344B85122F89.MOV (1920 × 1080, 60 fps HEVC, silent audio track; kept out of
 * the web build). Web cuts, made with ffmpeg: H.264 at 30 fps, two-pass, faststart; desktop 1920 × 1080 at 3.4 Mb/s (13 MB),
 * phones 1280 × 720 at 1.4 Mb/s (5.8 MB). The first 0.5 s fades up from charcoal and the last 0.7 s fades down to it, so the loop
 * dips through the page colour instead of cutting from the burning gate back to the village.
 *
 * Soundtrack (15 Nov 2026, owner: "add a song"): "India Epic Cinematic Music" (u_hlhpc1qr1p, Pixabay Content License), 0:03–0:33,
 * loudnorm, faded in and out, with the site's cavalry gallop bed under the village and desert runs (0–19.6 s) and a neigh at the gate
 * (22.9 s); AAC 160 kb/s, about −16.6 LUFS, remuxed onto both cuts without re-encoding the picture. It replaced the unverified
 * "Open Range" cowboy bed. The film plays muted until the visitor turns its sound on. Licences: public/audio/LICENSES.md.
 */
export const journeyFilm = {
  id: "stallion",
  label: "The Marwar Journey",
  music: { title: "India Epic Cinematic Music", author: "u_hlhpc1qr1p", licence: "Pixabay Content License" },
  desktop: asset("/video/marwar-journey.mp4"),
  mobile: asset("/video/marwar-journey-mobile.mp4"),
  poster: asset("/video/marwar-journey-poster.jpg"),
  posterMobile: asset("/video/marwar-journey-poster-mobile.jpg"),
  posterAlt: "A black Marwari canters across the dunes of the Thar, sand lifting at its hooves.",
  inscription: "From the village",
  voice: "to the citadel gate.",
  /** Chapter starts in seconds (scene cuts in the master); the current one is named in the film's label. */
  chapters: [
    { n: "I", title: "The village", at: 0 },
    { n: "II", title: "The desert", at: 10.2 },
    { n: "III", title: "The palace", at: 19.6 },
    { n: "IV", title: "The gate", at: 23.2 },
  ],
} as const;
