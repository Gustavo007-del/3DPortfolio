// components/SceneAtmosphereController.tsx
"use client";

import { useControls } from "leva";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { useWorldState } from "@/components/World/WorldState";

export default function SceneAtmosphereController({ active = true }: { active?: boolean }) {
  const { gl } = useThree();

  // Fog here is only for the STEADY Island view. During TRANSITION_TO_ISLAND /
  // TRANSITION_TO_SPACE, CloudTransition.tsx owns scene.fog exclusively (it
  // animates a FogExp2 for density). If this component's <fog> mounted during
  // a transition too, it would silently overwrite CloudTransition's FogExp2
  // with a plain linear THREE.Fog, breaking the `instanceof THREE.FogExp2`
  // check CloudTransition relies on — which is exactly why fog looked static
  // and flat instead of animating during the crossing.
  const { phase } = useWorldState();
  const fogOn = phase === "ISLAND";

  const { ambientIntensity, ambientColor } = useControls("Ambient", {
    ambientIntensity: { value: 0.5, min: 0, max: 1, step: 0.01 },
    ambientColor: "#ffd9a0",
  });

  const { fogColor, fogNear, fogFar } = useControls("Fog", {
    fogColor: "#4e2f0e",
    fogNear: { value: 210, min: 0, max: 1000, step: 10 },
    fogFar: { value: 790, min: 100, max: 3000, step: 10 },
  });

  const { exposure } = useControls("Exposure", {
    exposure: { value: 1.1, min: 0, max: 3, step: 0.05 },
  });

  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [exposure, gl]);

  return (
    <>
      <ambientLight intensity={ambientIntensity} color={ambientColor} />
      {fogOn && <fog attach="fog" args={[fogColor, fogNear, fogFar]} />}
    </>
  );
}