// components/effects/PostProcessing.tsx
"use client";

import { EffectComposer, Bloom, GodRays } from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import { Mesh } from "three";

export default function PostProcessing({ sunRef }: { sunRef: React.RefObject<Mesh> }) {
  if (!sunRef.current) return null; // GodRays needs a real mesh to sample — skip until mounted

  return (
    <EffectComposer>
      <Bloom
        intensity={0.01}
        luminanceThreshold={0.01}
        luminanceSmoothing={0.09}
      />
      <GodRays
        sun={sunRef.current}
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