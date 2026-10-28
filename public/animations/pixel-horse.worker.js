/* The loader's pixel horse, drawn in a worker on an OffscreenCanvas. While the page hydrates, the main thread is busy for
   long stretches on a slow phone or a slow connection (script parsing, hydration, image decoding); the gallop used to stutter
   exactly then. Here the horse has its own thread, so its frame rate does not depend on the page. pixel-horse.js is the same
   engine the main thread used; the few things it asks of a page (window, document, matchMedia, the canvas rect) are stubbed.
   Messages in: init {canvas,w,h,dpr,cycleDuration}, resize {w,h,dpr}, settle, pause, resume, destroy. Out: cycle. */
self.window = self;
self.document = { hidden: false, addEventListener: function () {}, removeEventListener: function () {}, querySelector: function () { return null; } };
self.matchMedia = function () { return { matches: false }; };
if (!self.requestAnimationFrame) {
  self.requestAnimationFrame = function (cb) { return setTimeout(function () { cb(performance.now()); }, 16); };
  self.cancelAnimationFrame = function (id) { clearTimeout(id); };
}
importScripts("/animations/pixel-horse.js");

var horse = null;
var size = { w: 190, h: 124 };
var startedAt = 0;
var settling = false;
var timer = 0;

/* The gait follows the load. It starts as a calm canter, eases up to a gallop over the first 1.5 s, and when the page is ready
   it lengthens into a short finishing run until the cycle completes. Easing the multiplier (never jumping it) keeps the legs
   continuous at every speed change. */
function targetSpeed() {
  if (settling) return 1.3;
  var t = (performance.now() - startedAt) / 1000;
  return 0.85 + 0.15 * (1 - Math.exp(-t / 1.2));
}

self.onmessage = function (event) {
  var m = event.data;
  if (m.type === "init") {
    size = { w: m.w, h: m.h };
    self.devicePixelRatio = m.dpr;
    m.canvas.getBoundingClientRect = function () { return { width: size.w, height: size.h }; };
    horse = new self.PixelHorseAnimation({ canvas: m.canvas, cycleDuration: m.cycleDuration });
    horse.speedMultiplier = 0.85;
    startedAt = performance.now();
    horse.start();
    timer = setInterval(function () {
      if (horse) horse.speedMultiplier += (targetSpeed() - horse.speedMultiplier) * 0.12;
    }, 33);
  } else if (!horse) {
    return;
  } else if (m.type === "resize") {
    size = { w: m.w, h: m.h };
    self.devicePixelRatio = m.dpr;
    horse.resize();
  } else if (m.type === "settle") {
    settling = true;
    horse.onNextCycleComplete(function () { self.postMessage({ type: "cycle" }); });
  } else if (m.type === "pause") {
    horse.stop();
  } else if (m.type === "resume") {
    horse.start();
  } else if (m.type === "destroy") {
    clearInterval(timer);
    horse.destroy();
    horse = null;
    self.close();
  }
};
