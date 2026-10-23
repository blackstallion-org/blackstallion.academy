"use client";

import { MaskedLineKineticStage } from "@/components/sections/shared/MaskedLineKineticStage";

export function SafetyKineticStage() {
  return (
    <MaskedLineKineticStage
      id="safety-kinetic-stage"
      label="REEL 10B · CAVALRY SHIELD DOCTRINE"
      headline="Safety is never the absence of challenge. It is the presence of absolute composure in the saddle."
      caption="Every cadet drill is buffered by three concentric protocols: centrifugal balance under speed, elastic turf dispersion upon sudden deceleration, and gyroscopic posture recovery."
      boxes={[
        {
          id: "box1",
          label: "CENTRIFUGAL EQUILIBRIUM",
          metric: "-360° CORONA SHIELD",
          description:
            "Active rein calibration stabilizing rider center-of-gravity during 45 km/h tent-pegging turns.",
        },
        {
          id: "box2",
          label: "ELASTIC IMPACT DEFLECTION",
          metric: "45 KN COMPOSITE BUFFER",
          description:
            "Multi-density arena turf and stirrup break-away springs absorbing downward shock upon dismount.",
        },
        {
          id: "box3",
          label: "GYROSCOPIC HORIZON VECTOR",
          metric: "+360° / 80 PX RECOVERY",
          description:
            "Independent pelvic alignment keeping the rider's spinal axis registered continuously over the horse's spine.",
        },
      ]}
      tone="dark"
    />
  );
}
