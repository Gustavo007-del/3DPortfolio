"use client";

import { MeshReflectorMaterial } from "@react-three/drei";

export default function WaterPlane() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 2.3, 0]}
      receiveShadow
    >
      <planeGeometry args={[900, 900]} />

      <MeshReflectorMaterial
  mirror={0.5}
  resolution={2048}
  blur={[300, 100]}
  mixBlur={1}
  mixStrength={1.5}      // was 80 — this was completely drowning the reflection
  roughness={0.6}         // was 0.08 — too glossy/plastic, gave it that glowing look
  depthScale={0.5}
  minDepthThreshold={0.4}
  maxDepthThreshold={1.2}
  color="#050505"          // near-black base, let reflections + env do the color work
  metalness={0.4}
/>
    </mesh>
  );
}