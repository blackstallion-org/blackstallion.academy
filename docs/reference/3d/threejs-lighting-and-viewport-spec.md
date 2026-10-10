# Three.js Lighting & Viewport Spec

> Source: `instructions/03_3D_Models/threejs_lighting_and_viewport_spec.docx` (converted to Markdown for Claude Code; the original file is unchanged).

```text
===================================================================

THREE.JS 3D VIEWPORT & LIGHTING SPECIFICATIONS — STALLION ENGINE

===================================================================

1. Scene Environment & Background

- Canvas Background: Transparent, floating over #0A0B0E with a soft radial dark vignette gradient behind the model.

- Renderer Settings: WebGLRenderer with toneMapping = THREE.ACESFilmicToneMapping and pixelRatio capped at 2 for performance.

2. Three-Point Lighting Setup

- Key Light (Warm Gold Directional):

* Color: #C5A059 | Intensity: 2.5

* Position: Vector3(5, 8, 5) — Angled top-left to accentuate the 180° inward lyre ears and neck crest.

- Fill Light (Deep Ambient Carbon):

* Color: #12141A | Intensity: 0.8

* Position: Vector3(-5, -2, -5) — Maintains deep, cinematic shadows in the flank and belly.

- Rim Light (Contour Edge Highlight):

* Color: #E6CA65 | Intensity: 3.0

* Position: Vector3(0, 5, -8) — Separates the stallion silhouette crisply from the dark canvas background.

3. Interactivity & Camera Motion

- Orbit Controls: Enabled with enableDamping = true, dampingFactor = 0.05.

- Auto-Rotation: Subtle idle rotation at 0.002 radians per frame when idle.

- Camera Constraints: Restrict polar angle (maxPolarAngle = Math.PI / 2) to prevent camera from dipping below ground plane.
```
