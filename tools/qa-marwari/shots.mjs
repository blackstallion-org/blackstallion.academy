// Fixed camera presets in the horse's frame: a = camera [forward, left, up] m, b = look-at [forward, left, up] m, fov degrees.
// Used for matched before/after captures. Horse faces +forward, its left flank is +left. Origin = model root on the ground.
export const CAMS = {
  side:        { a: [0.3, 5.4, 1.15],  b: [0.25, 0, 1.0],  fov: 30, label: "1 Full-body side (left)" },
  threeQuarter:{ a: [3.9, 3.7, 1.55],  b: [0.2, 0, 1.0],   fov: 30, label: "2 Three-quarter (front left)" },
  front:       { a: [5.2, 0, 1.9],     b: [0.4, 0, 1.25],  fov: 26, label: "3 Front, ears" },
  earsClose:   { a: [2.3, 0.35, 2.15], b: [1.1, 0, 2.0],   fov: 20, label: "3b Ears close-up" },
  headEyeMuzzle:{ a: [2.15, 1.55, 1.95], b: [1.2, 0.04, 1.85], fov: 18, label: "4 Eye and muzzle (head 3/4)" },
  eyeExtreme:  { a: [1.6, 0.85, 1.97], b: [1.17, 0.11, 1.9], fov: 10, label: "4b Eye extreme close-up" },
  maneNeck:    { a: [0.75, 2.5, 1.95], b: [0.7, 0, 1.7],  fov: 24, label: "5 Mane and neck" },
  hoofGround:  { a: [1.7, 1.5, 0.45],  b: [0.68, 0, 0.12], fov: 24, label: "6 Hoof and ground contact" },
  rear:        { a: [-5.3, 0, 1.5],    b: [-0.1, 0, 1.1],  fov: 30, label: "Rear" },
  shoulder:    { a: [0.5, 2.6, 1.5],   b: [0.35, 0, 1.35], fov: 22, label: "Shoulder coat" },
  barrel:      { a: [0.1, 2.4, 1.2],   b: [0.0, 0, 1.15],  fov: 22, label: "Barrel coat" },
  hindquarter: { a: [-1.7, 2.3, 1.4],  b: [-0.35, 0, 1.2], fov: 24, label: "Hindquarter coat" },
  tail:        { a: [-2.6, 1.6, 1.3],  b: [-0.7, 0, 0.9],  fov: 24, label: "Tail" },
};

// Bone-anchored close-ups: [boneName, [forward, left, up]] offsets in the horse frame (metres). They follow the head, so the same
// framing can be reproduced after the model changes.
export const BONE_CAMS = {
  eye:    { cam: ["Eye_L", [0.50, 0.50, 0.08]],  look: ["Eye_L", [0, 0, -0.005]], fov: 10, label: "4 Eye close-up (bone-anchored)" },
  muzzle: { cam: ["Head", [1.05, 0.55, -0.28]],  look: ["Head", [0.26, 0.0, -0.27]], fov: 13, label: "4 Muzzle and nostril close-up" },
  ears:   { cam: ["Head", [1.25, 0.35, 0.35]],   look: ["Head", [0.05, 0.0, 0.2]],  fov: 17, label: "3 Ears close-up (bone-anchored)" },
};
