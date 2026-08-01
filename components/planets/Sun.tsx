// components/planets/Sun.tsx
"use client";

import { forwardRef } from "react";
import { Mesh } from "three";
import { useTexture } from "@react-three/drei";
import Atmosphere from "@/components/planets/Atmosphere";

const Sun = forwardRef<Mesh>((_, ref) => {
  const texture = useTexture("/textures/sun.png");

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial map={texture} emissive="#ff6600" emissiveIntensity={4} toneMapped={false} />
      </mesh>
      <Atmosphere radius={2} color="#ffaa44" intensity={1.4} scale={1.25} />
      <Atmosphere radius={2} color="#ff5500" intensity={0.7} scale={1.6} />
    </group>
  );
});

Sun.displayName = "Sun";
export default Sun;