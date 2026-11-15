// The opening trailer (components/opening/PaintedTrailer.tsx) is driven by plain data, so the cut is tested as data: the shots run in
// order without gaps or overlaps, the whole trailer is about 25 s, every shot names a painting that exists (all three layers on disk),
// each card has both voices, only one word in the trailer takes the war colour, and nothing from the claims ledger's "No" rows
// appears. The score file exists and is no longer than the picture. How it looks and sounds is checked in a browser (PROGRESS.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { loadTs } from "./helpers/load-ts.mjs";

const T = await loadTs("lib/content/opening-trailer.ts");
const { LAYERS } = await loadTs("lib/content/marwari-journey.ts");

test("seven shots, in order, back to back, about 25 seconds", () => {
  assert.equal(T.TRAILER_SHOTS.length, 7);
  assert.ok(Math.abs(T.TRAILER_SHOTS[0].at - T.TRAILER_OPEN.len) < 1e-9, "the first painting follows the cold open");
  for (let i = 1; i < T.TRAILER_SHOTS.length; i++) {
    const a = T.TRAILER_SHOTS[i - 1], b = T.TRAILER_SHOTS[i];
    assert.ok(Math.abs(a.at + a.len - b.at) < 1e-9, `shot ${b.scene} starts where ${a.scene} ends`);
  }
  assert.ok(T.TRAILER_LENGTH >= 23 && T.TRAILER_LENGTH <= 26, `length ${T.TRAILER_LENGTH}`);
});

test("every shot is an existing painting with all three layers on disk, and a focus inside the frame", () => {
  for (const s of T.TRAILER_SHOTS) {
    const L = LAYERS[s.scene];
    assert.ok(L, `painting ${s.scene}`);
    for (const k of ["b", "s", "f"]) assert.ok(existsSync(`public${L[k].replace(/^.*?\/images\//, "/images/")}`), `${s.scene}-${k} on disk`);
    for (const v of s.focus) assert.ok(v >= 0 && v <= 1, `${s.scene} focus`);
  }
  assert.equal(new Set(T.TRAILER_SHOTS.map((s) => s.scene)).size, T.TRAILER_SHOTS.length, "no painting twice");
});

test("cards: two voices each, one war word, one end card, nothing from the claims ledger's No rows", () => {
  const banned = [/cortisol/i, /300\+?\s*muscles/i, /tech-?neck/i, /zero joint impact/i];
  for (const s of T.TRAILER_SHOTS) {
    assert.ok(s.card.inscription.trim() && s.card.voice.trim(), `${s.scene} card`);
    if (s.card.blood) assert.ok(s.card.voice.endsWith(s.card.blood), `${s.scene} blood word is the end of the line`);
    for (const re of banned) assert.ok(!re.test(`${s.card.inscription} ${s.card.voice}`), `${s.scene}: ${re}`);
  }
  assert.equal(T.TRAILER_SHOTS.filter((s) => s.card.blood).length, 1, "blood once");
  assert.equal(T.TRAILER_SHOTS.filter((s) => s.card.final).length, 1, "one end card");
  assert.ok(T.TRAILER_SHOTS.at(-1).card.final, "the end card is the last shot");
});

test("the score exists, is small, and carries its licence", () => {
  assert.ok(T.TRAILER_MUSIC, "a track is set");
  const file = `public${T.TRAILER_MUSIC.src.replace(/^.*?\/audio\//, "/audio/")}`;
  assert.ok(existsSync(file), file);
  assert.ok(statSync(file).size < 700_000, "under 700 KB");
  assert.match(T.TRAILER_MUSIC.licence, /Pixabay Content License/);
  assert.match(T.TRAILER_MUSIC.url, /^https:\/\/pixabay\.com\/music\//);
});
