// components/Island/PostProcessingController.tsx
"use client";

import { EffectComposer, DepthOfField } from "@react-three/postprocessing";
import { useControls } from "leva";

export default function PostProcessingController() {
  const { focusDistance, focalLength, bokehScale } = useControls("Post FX Blur", {
    focusDistance: { value: 0.02, min: 0, max: 0.1, step: 0.001 },
    focalLength: { value: 0.05, min: 0, max: 1, step: 0.01 },
    bokehScale: { value: 3, min: 0, max: 10, step: 0.5 },
  });

  return (
    <EffectComposer>
      <DepthOfField
        focusDistance={focusDistance}
        focalLength={focalLength}
        bokehScale={bokehScale}
      />
    </EffectComposer>
  );
}