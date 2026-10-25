import type { GaitTable } from "@/components/stallion-film/locomotion";

/**
 * The measured gait table of the rigged Marwari (stride length and frequency, which feet are on the ground and when).
 * Authored and measured in Blender (tools/blender/03_animation/stage11_gaits.py); copied here from marwari-gaits.json so it ships
 * inside the bundle: a .json under /models is not a file type the media bucket serves. `contacts[limb] = [start, duration]` as a
 * fraction of the gait cycle; `v` is the ground speed (m/s) at which the clip plays at its authored rate (v = stride length x frequency).
 */
export const GAIT_TABLE: GaitTable = {
  Walk: { v: 1.44, T: 1, strideLength: 1.44, strideFrequency: 1, lead: null, airborneFraction: 0, contacts: { FL: [0.25, 0.66], FR: [0.75, 0.66], HL: [0, 0.66], HR: [0.5, 0.66] } },
  Trot: { v: 3.33, T: 0.75, strideLength: 2.498, strideFrequency: 1.333, lead: null, airborneFraction: 0.24, contacts: { FL: [0, 0.38], FR: [0.5, 0.38], HL: [0.5, 0.38], HR: [0, 0.38] } },
  Canter_R: { v: 4.83, T: 0.6, strideLength: 2.898, strideFrequency: 1.667, lead: "R", airborneFraction: 0.22, contacts: { FL: [0.29, 0.28], FR: [0.5, 0.28], HL: [0, 0.33], HR: [0.29, 0.33] } },
  Canter_L: { v: 4.83, T: 0.6, strideLength: 2.898, strideFrequency: 1.667, lead: "L", airborneFraction: 0.22, contacts: { FL: [0.5, 0.28], FR: [0.29, 0.28], HL: [0.29, 0.33], HR: [0, 0.33] } },
  Gallop_R: { v: 10, T: 0.42, strideLength: 4.2, strideFrequency: 2.381, lead: "R", airborneFraction: 0.35, contacts: { FL: [0.3, 0.19], FR: [0.46, 0.19], HL: [0, 0.22], HR: [0.14, 0.22] } },
  Gallop_L: { v: 10, T: 0.42, strideLength: 4.2, strideFrequency: 2.381, lead: "L", airborneFraction: 0.35, contacts: { FL: [0.46, 0.19], FR: [0.3, 0.19], HL: [0.14, 0.22], HR: [0, 0.22] } },
  Sprint_R: { v: 12, T: 0.383, strideLength: 4.596, strideFrequency: 2.611, lead: "R", airborneFraction: 0.389, contacts: { FL: [0.29, 0.17], FR: [0.44, 0.17], HL: [0, 0.2], HR: [0.13, 0.2] } },
  Sprint_L: { v: 12, T: 0.383, strideLength: 4.596, strideFrequency: 2.611, lead: "L", airborneFraction: 0.389, contacts: { FL: [0.44, 0.17], FR: [0.29, 0.17], HL: [0.13, 0.2], HR: [0, 0.2] } },
};

/** The foot slip the authored clips already have against a planted ground (m/s, RMS over the stance), from the same measurement. */
export const AUTHORED_SLIP_RMS: Record<string, number> = {
  Walk: 0.19,
  Trot: 0.381,
  Canter_R: 0.498,
  Canter_L: 0.503,
  Gallop_R: 0.798,
  Gallop_L: 0.867,
  Sprint_R: 1.207,
  Sprint_L: 1.074,
};
