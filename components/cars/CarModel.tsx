"use client";

import { useGLTF } from "@react-three/drei";

export default function CarModel() {
  const { scene } = useGLTF("/models/car.glb");

  return (
    <primitive
      object={scene}
      scale={1}
      position={[0, 0, 0]}
    />
  );
}

useGLTF.preload("/models/car.glb");