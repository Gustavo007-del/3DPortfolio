// components/effects/PostProcessing.tsx
"use client";

import { useEffect, useState } from "react";
import { EffectComposer, Bloom, GodRays } from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import { Mesh } from "three";

// Two fixes vs. the old version:
//  1. The old `if (!sunRef.current) return null` ran on the FIRST render, when the Sun
//     ref was still null — and nothing re-rendered it until the next phase change, so
//     god rays/bloom only "popped in" after the first transition (a hitch).
//     We now pick the ref up in an effect and store it in state.
//  2. SolarSystem now mounts this once and toggles `enabled`, instead of
//     mounting/unmounting the whole EffectComposer (and recompiling the god-ray
//     passes) every time you cross the Space/Island boundary.
export default function PostProcessing({
  sunRef,
  enabled = true,
}: {
  sunRef: React.RefObject<Mesh | null>;
  enabled?: boolean;
}) {
  const [sun, setSun] = useState<Mesh | null>(null);

  useEffect(() => {
    if (sunRef.current) setSun(sunRef.current);
  }, [sunRef]);

  if (!sun) return null; // GodRays needs a real mesh to sample

  return (
    <EffectComposer enabled={enabled} multisampling={4}>
      <Bloom
        intensity={0.01}
        luminanceThreshold={0.01}
        luminanceSmoothing={0.09}
      />
      <GodRays
        sun={sun}
        blendFunction={BlendFunction.SCREEN}
        samples={60}
        density={0.04}
        decay={0.9}
        weight={0.05}
        exposure={0.55}
        clampMax={1}
        kernelSize={KernelSize.SMALL}
        blur
      />
    </EffectComposer>
  );
}
