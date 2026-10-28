/**
 * The liquid-bronze background: a full-screen plane that rides on the camera. Slow layered sine waves, bent by the scroll,
 * with a satin crest; the palette moves from molten bronze (top of the track) to deep sapphire (bottom). The fragment
 * shader is the reference page's, line for line; only the comments were shortened.
 */
export const WAVE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const WAVE_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uScroll;

  // 3D noise (hash based); kept from the original although the final field only uses sines.
  float hash(float n) { return fract(sin(n) * 43758.5453123); }
  float noise(in vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
    float n = p.x + p.y*57.0 + 113.0*p.z;
    return mix(mix(mix(hash(n+  0.0), hash(n+  1.0), f.x),
                   mix(hash(n+ 57.0), hash(n+ 58.0), f.x), f.y),
               mix(mix(hash(n+113.0), hash(n+114.0), f.x),
                   mix(hash(n+170.0), hash(n+171.0), f.x), f.y), f.z);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
    float aspect = uResolution.x / uResolution.y;

    float time = uTime * 0.08; // extremely slow, calm breathing speed
    float scroll = uScroll;

    // 1. constant wave parameters, so scrolling never compresses or speeds the waves
    float angle1 = 0.6;
    float angle2 = -0.7;
    float angle3 = 1.2;

    float freq1 = 2.4;
    float freq2 = 3.2;
    float freq3 = 4.0;

    // 2. coordinate distortion: smooth rounded arcs; the scroll shifts the phase and so bends the lines
    vec2 warpedUv = uv;
    float scrollDeform = scroll * 5.0;

    warpedUv.x += sin(uv.y * 2.5 + time * 0.2 + scrollDeform) * 0.35;
    warpedUv.y += cos(uv.x * 2.5 - time * 0.15 - scrollDeform * 0.8) * 0.35;

    warpedUv.x += sin(uv.y * 1.2 - time * 0.1 - scrollDeform * 1.5) * 0.25;
    warpedUv.y += cos(uv.x * 1.2 + time * 0.18 + scrollDeform * 1.2) * 0.25;

    vec2 scrollDrift = vec2(scroll * 0.04, -scroll * 0.02);
    vec2 mouseShift = vec2(uMouse.x * aspect * 0.05, uMouse.y * 0.05);
    warpedUv += scrollDrift + mouseShift;

    // 3. layered waves
    vec2 dir1 = vec2(cos(angle1), sin(angle1));
    vec2 dir2 = vec2(cos(angle2), sin(angle2));
    vec2 dir3 = vec2(cos(angle3), sin(angle3));

    float w1 = sin(dot(warpedUv, dir1) * freq1 + time * 1.0);
    float w2 = cos(dot(warpedUv, dir2) * freq2 - time * 1.4 + w1 * 0.4);
    float w3 = sin(dot(warpedUv, dir3) * freq3 + time * 1.8 + w2 * 0.5);

    float waveField = w1 * 0.50 + w2 * 0.35 + w3 * 0.15;

    // 4. crisp metallic lustre
    float wideSheen = pow(max(0.0, 1.0 - abs(waveField - 0.1)), 2.5);
    float crispSpecular = pow(max(0.0, 1.0 - abs(waveField - 0.15)), 8.0);
    float crest = wideSheen * 0.5 + crispSpecular * 0.9;

    // 5. scroll-driven palette: molten bronze at the top of the track, deep sapphire at the bottom
    vec3 c0_shadow = vec3(0.0010, 0.0006, 0.0004);
    vec3 c0_wave1  = vec3(0.085, 0.040, 0.015);
    vec3 c0_wave2  = vec3(0.050, 0.022, 0.008);
    vec3 c0_crest  = vec3(0.45, 0.30, 0.18);

    vec3 c1_shadow = vec3(0.0004, 0.0006, 0.0012);
    vec3 c1_wave1  = vec3(0.015, 0.035, 0.065);
    vec3 c1_wave2  = vec3(0.008, 0.020, 0.045);
    vec3 c1_crest  = vec3(0.18, 0.35, 0.55);

    float t = smoothstep(0.0, 1.0, scroll);
    vec3 colShadow = mix(c0_shadow, c1_shadow, t);
    vec3 colWave1  = mix(c0_wave1, c1_wave1, t);
    vec3 colWave2  = mix(c0_wave2, c1_wave2, t);
    vec3 colCrest  = mix(c0_crest, c1_crest, t);

    // 6. composition
    vec3 color = colShadow;
    color = mix(color, colWave2, smoothstep(-0.6, 0.2, waveField));
    color = mix(color, colWave1, smoothstep(0.0, 0.8, waveField));
    color += colCrest * crest * 1.4;

    float vignette = 1.0 - dot(uv, uv) * 0.12;
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;
