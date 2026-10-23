"use client";

import { MaskedLineKineticStage } from "@/components/sections/shared/MaskedLineKineticStage";

export function MandateKineticStage() {
  return (
    <MaskedLineKineticStage
      id="mandate-kinetic-stage"
      label="REEL 14 · THE SOVEREIGN CREED"
      headline="To command the warhorse, one must first conquer oneself. Eight centuries of composure, discipline, and sovereign character."
      caption="The foundational doctrine of BSAH: self-mastery precedes equine mastery. Every cadet's progress is measured across three sequenced vectors of leadership."
      boxes={[
        {
          id: "box1",
          label: "DOMINUS SUI",
          metric: "-360° INNER DISCIPLINE",
          description:
            "Unflinching internal equilibrium. Emotional stillness in the face of pressure, noise, and sudden arena obstacles.",
        },
        {
          id: "box2",
          label: "DOMINUS EQUI",
          metric: "ELASTIC HARMONY",
          description:
            "Yielding rein communication. Guiding a 500-kg charger through lateral revaal gaits with ten grams of pressure.",
        },
        {
          id: "box3",
          label: "SOVEREIGN CHARACTER",
          metric: "360° ETHICAL COMPASS",
          description:
            "A standard of conduct that endures off the field: integrity in leadership, stewardship of life, and lifelong loyalty.",
        },
      ]}
      tone="dark"
    />
  );
}
