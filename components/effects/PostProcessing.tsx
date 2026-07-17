"use client";

import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export default function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.1}
        luminanceThreshold={0.1}
        luminanceSmoothing={0.9}
        // mipmapBlur
      />
      {/* <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.001, 0.001]}
      /> */}
    </EffectComposer>
  );
}