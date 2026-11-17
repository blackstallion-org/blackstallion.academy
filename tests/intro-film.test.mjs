// The opening film (components/opening/IntroFilm.tsx, lib/content/intro-film.ts; since 17 Nov 2026 "The Lineage", built in video/): the files
// exist, both cuts run 60 s (read from the MP4's own movie header, so no ffprobe is needed), the moov box comes first
// (faststart: playback starts before the download ends), the files stay within their weight budgets, and the painted trailer it
// replaced is gone everywhere. How the film looks and sounds is checked in a browser (PROGRESS.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadTs } from "./helpers/load-ts.mjs";

const { introFilm, illustratedFilm } = await loadTs("lib/content/intro-film.ts");
const local = (src) => join("public", src.replace(/^.*?\/video\//, "video/"));

/** Duration in seconds from the mvhd box, and whether moov precedes mdat. */
function mp4(file) {
  const buf = readFileSync(file);
  const moov = buf.indexOf("moov"), mdat = buf.indexOf("mdat");
  const at = buf.indexOf("mvhd");
  assert.ok(at > 0, `${file}: no movie header`);
  const version = buf[at + 4];
  const scale = version === 1 ? buf.readUInt32BE(at + 24) : buf.readUInt32BE(at + 16);
  const length = version === 1 ? Number(buf.readBigUInt64BE(at + 28)) : buf.readUInt32BE(at + 20);
  return { seconds: length / scale, faststart: moov > 0 && moov < mdat };
}

test("both cuts and the poster are on disk, for the opening film and the illustrated film on /about", () => {
  for (const src of [introFilm.desktop, introFilm.mobile, introFilm.poster, illustratedFilm.desktop, illustratedFilm.mobile, illustratedFilm.poster]) assert.ok(existsSync(local(src)), `${local(src)} is missing`);
});

test("the film runs 60 s, and the content file says the same", () => {
  assert.ok(introFilm.length >= 59.5 && introFilm.length <= 60.5, `length ${introFilm.length}`);
  for (const src of [introFilm.desktop, introFilm.mobile]) {
    const { seconds, faststart } = mp4(local(src));
    assert.ok(seconds >= 59.8 && seconds <= 60.2, `${src}: ${seconds.toFixed(2)} s`);
    assert.ok(Math.abs(seconds - introFilm.length) < 0.25, `${src}: ${seconds.toFixed(2)} s against ${introFilm.length}`);
    assert.ok(faststart, `${src}: the movie header must come before the media (faststart)`);
  }
});

test("the illustrated film on /about runs 37-38 s, and its content entry says the same", () => {
  assert.ok(illustratedFilm.length >= 37 && illustratedFilm.length <= 38, `length ${illustratedFilm.length}`);
  for (const src of [illustratedFilm.desktop, illustratedFilm.mobile]) {
    const { seconds, faststart } = mp4(local(src));
    assert.ok(seconds >= 37.3 && seconds <= 37.8, `${src}: ${seconds.toFixed(2)} s`);
    assert.ok(faststart, `${src}: faststart`);
  }
  assert.match(readFileSync("app/about/page.tsx", "utf8"), /<IllustratedFilm \/>/);
});

test("weight budgets: desktop 22 MB, phones 10 MB, poster 150 KB", () => {
  for (const f of [illustratedFilm]) {
    const kb = (src) => statSync(local(src)).size / 1048576;
    assert.ok(kb(f.desktop) <= 22 && kb(f.mobile) <= 10 && statSync(local(f.poster)).size <= 150 * 1024, "illustrated film over budget");
  }
  const mb = (src) => statSync(local(src)).size / 1048576;
  assert.ok(mb(introFilm.desktop) <= 22, `desktop ${mb(introFilm.desktop).toFixed(1)} MB`);
  assert.ok(mb(introFilm.mobile) <= 10, `mobile ${mb(introFilm.mobile).toFixed(1)} MB`);
  assert.ok(statSync(local(introFilm.poster)).size <= 150 * 1024, "poster over 150 KB");
});

test("the painted trailer it replaced is gone, and the raw score is not served", () => {
  assert.ok(!existsSync("components/opening/PaintedTrailer.tsx"));
  assert.ok(!existsSync("lib/content/opening-trailer.ts"));
  assert.ok(!existsSync("public/audio/music/opening-trailer.mp3"));
  assert.ok(!existsSync("public/video/Sovereign_of_the_Marwar.mp3"), "the 88 s master stays out of the web build");
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
  for (const file of ["app", "components", "lib"].flatMap(walk).filter((f) => /\.(tsx?|css)$/.test(f))) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /opening-trailer|TRAILER_(MUSIC|SHOTS)|from "\.\/PaintedTrailer"/, file);
  }
});

test("the intro mounts the film", () => {
  const src = readFileSync("components/opening/OpeningIntro.tsx", "utf8");
  assert.match(src, /<IntroFilm /);
});
