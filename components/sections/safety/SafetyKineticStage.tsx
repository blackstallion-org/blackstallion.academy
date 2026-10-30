"use client";

import { MaskedLineKineticStage } from "@/components/sections/shared/MaskedLineKineticStage";

export function SafetyKineticStage() {
  return (
    <MaskedLineKineticStage
      id="safety-kinetic-stage"
      label="REEL 10B · CAVALRY SHIELD DOCTRINE"
      headline="Safety is never the absence of challenge. It is the presence of absolute composure in the saddle."
      /*
       * Plain wording, and nothing that is not already approved copy (Blueprint Part 9 and R09; the same lines are in
       * "Orders of the day" on this page): "trains an upright, stacked posture" is the ledger's wording; the rest are
       * orders 01-07. No figures and no equipment beyond the helmets and vests those orders name. The earlier
       * engineering-sounding text (45 km/h, 45 kN, "break-away springs", "80 px") was not in the blueprint or the ledger.
       */
      caption="Three rules sit under every session: the basics before speed, the fall before the canter, the horse before the cadet."
      boxes={[
        {
          id: "box1",
          label: "The seat",
          metric: "The basics before speed",
          description:
            "Sitting a moving horse trains an upright, stacked posture, stride after stride. The basics become second nature before any lance is lowered.",
        },
        {
          id: "box2",
          label: "The fall",
          metric: "Taught before the canter",
          description:
            "Helmets go on before the stable door. Vests are worn for jumping and lance work, and a spotter is with every mounted drill.",
        },
        {
          id: "box3",
          label: "The horse",
          metric: "Checked before the cadet",
          description:
            "Hooves, temperature and tack are checked first. In the heat, sessions move to cooler hours, with water every session, and every stallion gets rest days.",
        },
      ]}
      tone="dark"
    />
  );
}
