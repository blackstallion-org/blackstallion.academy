/**
 * The 17 AP-10K animal keypoints that the RTMPose model predicts (mmpose "ap10k" order). They are generic quadruped
 * landmarks: eyes, nose, neck, root of tail, and for each leg a shoulder/hip, elbow/knee and paw. They are NOT the
 * anatomical hoof/fetlock/hock points a veterinary gait study would use, so every angle derived from them is approximate.
 */
export const KEYPOINTS = [
  "left_eye", "right_eye", "nose", "neck", "tail_root",
  "left_shoulder", "left_elbow", "left_front_paw",
  "right_shoulder", "right_elbow", "right_front_paw",
  "left_hip", "left_knee", "left_hind_paw",
  "right_hip", "right_knee", "right_hind_paw",
] as const;
export type KeypointName = (typeof KEYPOINTS)[number];
export const KP_COUNT = KEYPOINTS.length;

export const KP: Record<KeypointName, number> = Object.fromEntries(KEYPOINTS.map((n, i) => [n, i])) as Record<KeypointName, number>;

/** Skeleton edges as index pairs, grouped for drawing. */
export const EDGES: readonly { a: number; b: number; group: "head" | "spine" | "fore" | "hind" }[] = [
  { a: KP.left_eye, b: KP.right_eye, group: "head" },
  { a: KP.left_eye, b: KP.nose, group: "head" },
  { a: KP.right_eye, b: KP.nose, group: "head" },
  { a: KP.nose, b: KP.neck, group: "head" },
  { a: KP.neck, b: KP.tail_root, group: "spine" },
  { a: KP.neck, b: KP.left_shoulder, group: "fore" },
  { a: KP.left_shoulder, b: KP.left_elbow, group: "fore" },
  { a: KP.left_elbow, b: KP.left_front_paw, group: "fore" },
  { a: KP.neck, b: KP.right_shoulder, group: "fore" },
  { a: KP.right_shoulder, b: KP.right_elbow, group: "fore" },
  { a: KP.right_elbow, b: KP.right_front_paw, group: "fore" },
  { a: KP.tail_root, b: KP.left_hip, group: "hind" },
  { a: KP.left_hip, b: KP.left_knee, group: "hind" },
  { a: KP.left_knee, b: KP.left_hind_paw, group: "hind" },
  { a: KP.tail_root, b: KP.right_hip, group: "hind" },
  { a: KP.right_hip, b: KP.right_knee, group: "hind" },
  { a: KP.right_knee, b: KP.right_hind_paw, group: "hind" },
];

/** Minimum model score for a keypoint to count as "visible" (mmpose's own visualisation threshold). */
export const VISIBLE_SCORE = 0.3;

/** Joint angles shown to the person: the angle at the middle point of three keypoints, in degrees (180 = straight leg). */
export const ANGLES = [
  { id: "elbow_l", label: "Elbow L", a: KP.left_shoulder, b: KP.left_elbow, c: KP.left_front_paw },
  { id: "elbow_r", label: "Elbow R", a: KP.right_shoulder, b: KP.right_elbow, c: KP.right_front_paw },
  { id: "stifle_l", label: "Knee L (hind)", a: KP.left_hip, b: KP.left_knee, c: KP.left_hind_paw },
  { id: "stifle_r", label: "Knee R (hind)", a: KP.right_hip, b: KP.right_knee, c: KP.right_hind_paw },
  { id: "neck", label: "Head-neck-croup", a: KP.nose, b: KP.neck, c: KP.tail_root },
] as const;
export type AngleId = (typeof ANGLES)[number]["id"];
