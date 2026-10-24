const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bsah-sound-'));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), 'lib/audio/engine.ts', '--outDir', directory, '--module', 'commonjs', '--target', 'es2020', '--lib', 'es2020,dom', '--skipLibCheck']);
const filename = path.join(directory, 'engine.js');
let now = 100000;
const originalNow = Date.now;
Date.now = () => now;
const media = [];
const handlers = new Map();
const storage = new Map();
let videos = [];
global.window = {
  localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  addEventListener: (key, handler) => { const entries = handlers.get(key) ?? new Set(); entries.add(handler); handlers.set(key, entries); },
  removeEventListener: (key, handler) => handlers.get(key)?.delete(handler),
};
global.document = { hidden: false, querySelectorAll: () => videos, body: { appendChild: node => { node.appended = true; } } };
global.Audio = class {
  constructor() { this.paused = true; this.ended = false; this.dataset = {}; this.currentTime = 0; this.plays = 0; media.push(this); }
  setAttribute() {}
  removeAttribute(name) { delete this[name]; }
  load() {}
  remove() { this.removed = true; }
  play() { this.plays++; this.paused = false; this.ended = false; return this.fail ? Promise.reject(Error('autoplay blocked')) : Promise.resolve(); }
  pause() { this.paused = true; }
};
const fresh = () => { delete require.cache[require.resolve(filename)]; return require(filename); };
const finish = () => media.forEach(player => { player.ended = true; player.paused = true; });
(async () => {
  let engine = fresh();
  assert.equal(engine.soundEnabled(), false);
  assert.equal(engine.playEffect('gallop'), false);
  assert.equal(media.length, 0, 'silent mode creates/fetches no media');
  engine.setSound(true);
  assert.equal(storage.get('bsah-sound'), 'on');
  assert.equal(media.length, 1);
  assert.equal(media[0].dataset.bsahEffect, 'snort');
  assert.equal(media[0].preload, 'none');
  assert.equal(engine.playEffect('gallop'), false, 'rapid clicks cannot layer effects');
  now += 13000;
  assert.equal(engine.playEffect('gallop'), false, 'a playing voice blocks another cue');
  finish();
  for (const name of ['gallop', 'neigh', 'snort', 'chase', 'herd', 'chariot', 'horseCall', 'leather', 'tack']) {
    now += 13000;
    assert.equal(engine.playEffect(name, 1), true, name);
    const player = media.find(item => item.dataset.bsahEffect === name);
    assert.ok(player.volume > 0 && player.volume <= .18, 'caller cannot override quiet maximum');
    assert.equal(fs.existsSync(path.join('public', engine.SOUND_FILES[name])), true);
    finish();
  }
  now += 13000;
  assert.equal(engine.playEffect('gallop'), true);
  finish();
  now += 1000;
  assert.equal(engine.playEffect('herd'), false, 'equine cooldown applies across different files');
  engine.setSound(false);
  assert.ok(media.every(player => player.paused && player.currentTime === 0), 'mute immediately stops and resets every voice');
  assert.equal(engine.playEffect('tack'), false);
  engine.disposeSoundscape();
  assert.ok(media.every(player => player.removed));

  storage.set('bsah-sound', 'on');
  engine = fresh();
  assert.equal(engine.soundEnabled(), true);
  assert.equal(engine.playEffect('tack'), false, 'saved consent does not autoplay');
  const cleanup = engine.resumeSoundOnGesture();
  assert.equal(handlers.get('pointerdown').size, 1);
  [...handlers.get('pointerdown')].forEach(handler => handler());
  assert.equal(handlers.get('keydown').size, 0, 'both unlock listeners removed after one gesture');
  now += 13000;
  assert.equal(engine.playEffect('tack'), true);
  finish();
  document.hidden = true;
  now += 13000;
  assert.equal(engine.playEffect('gallop'), false, 'background tabs stay silent');
  document.hidden = false;
  videos = [{ paused: false, muted: false, volume: 1 }];
  assert.equal(engine.playEffect('gallop'), false, 'audible video owns the mix');
  videos = [];
  assert.equal(engine.playEffect('gallop'), true);
  finish();
  media[media.length - 1].fail = true;
  now += 13000;
  assert.equal(engine.playEffect('gallop'), true);
  await Promise.resolve();
  assert.equal(media[media.length - 1].paused, true, 'blocked playback fails quietly');
  cleanup();
  engine.disposeSoundscape();
  console.log('PASS: default silence, saved-consent gesture gate, all nine effects, lazy media, volume caps, cooldowns, single voice, immediate mute, hidden tab, video priority, rejection and cleanup.');
})().finally(() => { Date.now = originalNow; fs.rmSync(directory, { recursive: true, force: true }); });
