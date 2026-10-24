"""Regenerates the placeholder audio in public/audio (numpy + ffmpeg). Run: python3 docs/qa/make_audio.py"""
import numpy as np, wave, subprocess, os
sr = 44100
out = os.path.join(os.path.dirname(__file__), "..", "..", "public", "audio")
rng = np.random.default_rng(7)

def save(name, x):
    d = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    w = wave.open(os.path.join(out, name), "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(d.tobytes()); w.close()

def lowpass(sig, cut):
    a = np.exp(-2 * np.pi * cut / sr); y = np.zeros_like(sig); acc = 0.0
    for i, v in enumerate(sig):
        acc = a * acc + (1 - a) * v; y[i] = acc
    return y

# ambient: 40 s seamless 432/216/108 Hz drone
T = 40; t = np.arange(T * sr) / sr
lfo = lambda r, p=0: 0.5 + 0.5 * np.sin(2 * np.pi * t / T * r + p)
x = (0.35 * np.sin(2*np.pi*108*t) + 0.22 * np.sin(2*np.pi*216*t) * lfo(2) + 0.10 * np.sin(2*np.pi*432*t) * lfo(3, 1)
     + 0.06 * np.sin(2*np.pi*324*t) * lfo(1, 2) + 0.08 * np.sin(2*np.pi*216.5*t) * lfo(4, 0.5)) * (0.75 + 0.25 * lfo(1))
save("drone.wav", x / np.abs(x).max() * 0.5)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(out, "drone.wav"), "-b:a", "128k", os.path.join(out, "bsah_ambient_432hz_drone.mp3")], check=True)
os.remove(os.path.join(out, "drone.wav"))

# breath: two low-passed noise exhales with nostril flutter, 2.6 s
n = int(2.6 * sr); t2 = np.arange(n) / sr
b = lowpass(lowpass(rng.standard_normal(n), 900), 700)
env = np.exp(-((t2 - 0.55) / 0.28) ** 2) + 0.8 * np.exp(-((t2 - 1.55) / 0.42) ** 2)
y = b * env * (1 + 0.35 * np.sin(2*np.pi*23*t2) * np.exp(-((t2 - 0.55) / 0.2) ** 2))
save("bsah_stallion_breath.wav", y / np.abs(y).max() * 0.8)

# keystroke: 60 ms click
n = int(0.06 * sr); t3 = np.arange(n) / sr
c = rng.standard_normal(n) * np.exp(-t3/0.004) + 0.6*np.sin(2*np.pi*1800*t3)*np.exp(-t3/0.012) + 0.3*np.sin(2*np.pi*240*t3)*np.exp(-t3/0.02)
save("bsah_keystroke.wav", c / np.abs(c).max() * 0.7)
