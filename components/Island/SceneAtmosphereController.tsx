// components/SceneAtmosphereController.tsx
"use client";

import { useControls } from "leva";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

export default function SceneAtmosphereController() {
  const { gl } = useThree();

  const { ambientIntensity, ambientColor } = useControls("Ambient", {
    ambientIntensity: { value: 0.5, min: 0, max: 1, step: 0.01 },
    ambientColor: "#ffd9a0",
  });

  const { fogColor, fogNear, fogFar } = useControls("Fog", {
    fogColor: "#e8a865",
    fogNear: { value: 200, min: 0, max: 1000, step: 10 },
    fogFar: { value: 1200, min: 100, max: 3000, step: 10 },
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
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
    </>
  );
}