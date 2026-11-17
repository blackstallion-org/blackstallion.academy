import React from "react";
import { Composition } from "remotion";
import { Film } from "./Film";
import { FPS, H, W } from "./lib/stage";

export const Root: React.FC = () => (
  <Composition id="Lineage" component={Film} durationInFrames={1800} fps={FPS} width={W} height={H} />
);
