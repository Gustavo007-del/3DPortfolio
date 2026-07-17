"use client";

import { Sky } from "@react-three/drei";
import { useControls } from "leva";

export default function SkyController() {
  const { sunX, sunY, sunZ, turbidity, rayleigh, mieCoefficient, mieDirectionalG } =
    useControls("Sky", {
      sunX: { value: 8.0, min: -100, max: 100, step: 0.5 },
      sunY: { value: 3.0, min: -20, max: 100, step: 0.5 },
      sunZ: { value: -5.0, min: -100, max: 100, step: 0.5 },
      turbidity: { value: 5.9, min: 0, max: 20, step: 0.1 },
      rayleigh: { value: 10.0, min: 0, max: 10, step: 0.1 },
      mieCoefficient: { value: 0.2, min: 0, max: 0.2, step: 0.001 },
      mieDirectionalG: { value: 0.9, min: 0, max: 1, step: 0.01 },
    });

  return (
    <Sky
      distance={450000}
      sunPosition={[sunX, sunY, sunZ]}
      turbidity={turbidity}
      rayleigh={rayleigh}
      mieCoefficient={mieCoefficient}
      mieDirectionalG={mieDirectionalG}
       
    />
  );
}