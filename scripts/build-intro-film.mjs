// Builds the home page's opening film (16 Nov 2026, owner's brief) from three generated clips and the owner's score.
//   node scripts/build-intro-film.mjs [source-dir]      (default ~/Downloads; needs ffmpeg 6+ on PATH)
// Writes public/video/intro-film.mp4 (1920x1080), intro-film-mobile.mp4 (1280x720) and intro-film-poster.webp.
// The sources are not committed. Re-running reproduces the same cut.
//
// The edit, in film order (Marwar -> Rajput horsemen -> British-era Jodhpur -> the Jodhpur Lancers -> the royal stables -> the black stallion):
//   A  Historical_map_animation_of_Marwar      ink map, horsemen and forts, British-era Jodhpur, ink-bleed to a black horse
//   B  Historical_animation_of_cavalry          the black horse in ink, court alliance, banner, the Lancers' charge, campaign map
//   C  Creating_historical_parchment            parchment opens on the court and its Marwari horses, ink to the map, the lone stallion
// Each clip is cut into beats, and every beat gets its own speed: gallops and the rider's sweep play at real speed (slowed hooves
// look wrong); the map, the court and the stallion carry the stretch. Slowed beats are motion-interpolated (minterpolate, MCI),
// never frame-repeated. The score is "Sovereign of the Marwar" (90 BPM, beat 0.667 s): its first entrance (3.5-4.0 s) lands as
// the map rises into horsemen; the full percussion (20.02 s) lands on the rider sweeping across the frame; the stallion settles
// on the bar at 33.36 s as the music fades out (owner's choice: the first 37.5 s of the track, faded).
//
// Every clip carries the generator's sparkle mark at x 0.887-0.925, y 0.78-0.87 of the frame (bottom right). Owner's choice: crop
// past it, a 16:9 window 87 % of the frame wide anchored to the left edge (x 0-0.87), centred vertically: about 1.15x zoom.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const SRC = process.argv[2] ?? join(homedir(), "Downloads");
const OUT = "public/video";
const FPS = 24;
const LENGTH = 37.5;
/** dissolve between clips, in frames */
const XFADE = 15;
const SCORE = join(SRC, "Sovereign_of_the_Marwar.mp3");

const CLIPS = [
  {
    id: "A", file: "Historical_map_animation_of_Marwar_0ca5352a.mp4", grade: "eq=saturation=1.08",
    // [source from, source to, output frames]
    beats: [
      [0, 2.5, 80], //    the map draws itself in the quiet (x0.75)
      [2.5, 5.5, 85], //  the map rises into Rajput horsemen on the entrance (x0.85)
      [5.5, 6.5, 24], //  a rider's silhouette wipes the frame (real speed)
      [6.5, 8.5, 62], //  British-era Jodhpur: the clock tower, the carriage (x0.77)
      [8.5, 10.03, 37], // ink tendrils gather into a black horse (real speed)
    ],
  },
  {
    id: "B", file: "Historical_animation_of_cavalry_…_cdbccbd1_1080p.mp4", grade: "eq=brightness=0.02:saturation=0.96",
    beats: [
      [0, 1.75, 59], //   the black horse in ink blooms into the courtyard (x0.71)
      [1.75, 3.0, 43], // the officer and the Maharaja (x0.7)
      [3.0, 3.75, 21], // the banner sweeps across (x0.86)
      [3.75, 7.25, 84], // the Jodhpur Lancers' charge (real speed)
      [7.25, 8.0, 18], // a lancer sweeps past the lens, on the percussion at 20.02 s (real speed)
      [8.0, 10.0, 65], // the campaign map (x0.74)
    ],
  },
  {
    id: "C", file: "Creating_historical_parchment_an…_785e6d37.mp4", grade: "eq=saturation=0.97",
    beats: [
      [0, 1.75, 56], //    parchment tears open on the court (x0.75)
      [1.75, 5.75, 128], // the royal stables: the Maharaja and his Marwari horses (x0.75)
      [5.75, 7.5, 69], //  ink returns them to the map; the stallion forms (x0.61)
      [7.5, 10.03, 99], // the lone black stallion, settled on the bar at 33.36 s (x0.61)
    ],
  },
];

/** intermediates: near-lossless H.264 (lossless FFV1 at 1080p needs about 2 GB of scratch space for this film) */
const MEZZANINE = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "10", "-pix_fmt", "yuv420p"];
const run = (args) => {
  try {
    execFileSync("ffmpeg", ["-hide_banner", "-v", "error", "-y", ...args], { stdio: ["ignore", "inherit", "pipe"], encoding: "utf8" });
  } catch (e) {
    throw new Error(`ffmpeg failed: ${e.stderr || e.message}`);
  }
};
const probe = (file, entries) =>
  execFileSync("ffprobe", ["-v", "error", "-show_entries", entries, "-of", "default=nw=1:nk=1", file]).toString().trim().split("\n");

// ---------------------------------------------------------------- the arithmetic
const total = CLIPS.reduce((n, c) => n + c.beats.reduce((m, b) => m + b[2], 0), 0) - XFADE * (CLIPS.length - 1);
if (total !== LENGTH * FPS) throw new Error(`the cut is ${total} frames, not ${LENGTH * FPS}`);
const sweep = CLIPS[0].beats.reduce((m, b) => m + b[2], 0) - XFADE + CLIPS[1].beats.slice(0, 4).reduce((m, b) => m + b[2], 0);
console.log(`cut: ${total} frames = ${total / FPS} s; the rider's sweep at ${(sweep / FPS).toFixed(2)} s`);

const tmp = mkdtempSync(join(tmpdir(), "bsah-intro-"));
try {
  // ---------------------------------------------------------------- 1. beats: crop past the mark, grade, retime, upscale
  const clipFiles = CLIPS.map((clip) => {
    const src = join(SRC, clip.file);
    if (!existsSync(src)) throw new Error(`missing ${src}`);
    const [w, h] = probe(src, "stream=width,height").map(Number);
    const cw = Math.round((w * 0.87) / 2) * 2;
    const ch = Math.round((cw * 9) / 16 / 2) * 2;
    const crop = `crop=${cw}:${ch}:0:${Math.round((h - ch) / 2)}`;
    const parts = clip.beats.map(([from, to, frames], i) => {
      const speed = ((to - from) * FPS) / frames;
      const part = join(tmp, `${clip.id}${i}.mkv`);
      // slowed: stretch the timestamps, then let motion-compensated interpolation make the new frames (scene-cut detection off,
      // so an ink transition is interpolated rather than held); real speed: the frames as they are
      const retime = Math.abs(speed - 1) < 0.04
        ? "setpts=PTS-STARTPTS"
        : `setpts=(PTS-STARTPTS)/${speed.toFixed(5)},minterpolate=fps=${FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none`;
      // half a second of run-off so the interpolator never runs dry at the tail (a held frame), tpad as a last resort; -frames:v trims
      run([
        "-ss", String(from), "-t", String(to - from + 0.5), "-i", src,
        "-vf", `${crop},${clip.grade},${retime},tpad=stop_mode=clone:stop=4,scale=1920:1080:flags=lanczos,unsharp=5:5:0.35`,
        "-frames:v", String(frames), "-an", ...MEZZANINE, part,
      ]);
      const got = Number(execFileSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", part]).toString().trim());
      if (got !== frames) throw new Error(`${clip.id}${i}: ${got} frames, wanted ${frames}`);
      console.log(`${clip.id}${i}  ${from}-${to} s  x${speed.toFixed(2)}  ${frames} frames`);
      return part;
    });
    const list = join(tmp, `${clip.id}.txt`);
    writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n"));
    const out = join(tmp, `${clip.id}.mkv`);
    run(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", out]);
    return { out, frames: clip.beats.reduce((m, b) => m + b[2], 0) };
  });

  // ---------------------------------------------------------------- 2. one film: dissolves, grain, a light vignette
  const film = join(tmp, "film.mkv");
  const [a, b, c] = clipFiles;
  const off1 = (a.frames - XFADE) / FPS;
  const off2 = (a.frames + b.frames - 2 * XFADE) / FPS;
  const d = XFADE / FPS;
  run([
    "-i", a.out, "-i", b.out, "-i", c.out,
    "-filter_complex",
    `[0][1]xfade=transition=fade:duration=${d}:offset=${off1}[ab];[ab][2]xfade=transition=fade:duration=${d}:offset=${off2},` +
      `tpad=stop_mode=clone:stop=3,vignette=angle=0.28,noise=alls=2:allf=t,format=yuv420p[v]`,
    "-map", "[v]", "-frames:v", String(total), ...MEZZANINE, film,
  ]);

  // ---------------------------------------------------------------- 3. the score: the first 37.5 s, faded, loudness-normalised
  if (!existsSync(SCORE)) throw new Error(`missing ${SCORE}`);
  const shape = `atrim=0:${LENGTH},asetpts=PTS-STARTPTS,afade=t=out:st=${LENGTH - 4}:d=4:curve=exp`;
  // loudnorm prints its measurement on stderr
  const log = spawnSync("ffmpeg", ["-hide_banner", "-i", SCORE, "-af", `${shape},loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json`, "-f", "null", "-"], { encoding: "utf8" }).stderr;
  const m = JSON.parse(log.slice(log.lastIndexOf("{"), log.lastIndexOf("}") + 1));
  const score = join(tmp, "score.wav");
  run([
    "-i", SCORE, "-af",
    `${shape},loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000,atrim=0:${LENGTH}`,
    "-ac", "2", "-c:a", "pcm_s16le", score,
  ]);

  // ---------------------------------------------------------------- 4. the web files
  // two-pass at a fixed bitrate: the grain makes constant-quality files balloon (CRF 21 came out at 36 MB)
  const encode = (file, size, kbps, level) => {
    const common = [
      "-i", film, "-i", score, "-map", "0:v", "-map", "1:a",
      ...(size ? ["-vf", `scale=${size}:flags=lanczos`] : []),
      "-c:v", "libx264", "-preset", "slow", "-b:v", `${kbps}k`, "-maxrate", `${Math.round(kbps * 1.6)}k`, "-bufsize", `${kbps * 3}k`,
      "-profile:v", "high", "-level", level, "-pix_fmt", "yuv420p", "-g", "48", "-passlogfile", join(tmp, file),
    ];
    run([...common, "-pass", "1", "-an", "-frames:v", String(total), "-f", "null", "-"]);
    run([...common, "-pass", "2", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", "-frames:v", String(total), join(OUT, file)]);
  };
  encode("intro-film.mp4", null, 4000, "4.1");
  encode("intro-film-mobile.mp4", "1280:720", 1800, "4.0");
  // INTRO_KEEP=<dir> keeps the graded master and the score for inspection
  if (process.env.INTRO_KEEP) {
    execFileSync("cp", [film, score, process.env.INTRO_KEEP]);
  }
  const still = join(tmp, "poster.png");
  run(["-i", film, "-frames:v", "1", "-vf", "scale=1280:720:flags=lanczos", still]);
  await sharp(still).webp({ quality: 78, effort: 6 }).toFile(join(OUT, "intro-film-poster.webp"));

  for (const f of ["intro-film.mp4", "intro-film-mobile.mp4", "intro-film-poster.webp"]) {
    console.log(`${f}  ${(statSync(join(OUT, f)).size / 1048576).toFixed(2)} MB`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
