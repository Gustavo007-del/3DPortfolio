"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWind } from "./WindContext";
type Cloud = {
  position: THREE.Vector3;
  scale: number;
  speed: number;
};

export default function CloudLayer() {
  const group = useRef<THREE.Group>(null!);

  const clouds = useMemo<Cloud[]>(() => {
    const list: Cloud[] = [];

    for (let i = 0; i < 18; i++) {
      list.push({
        position: new THREE.Vector3(
          THREE.MathUtils.randFloatSpread(260),
          THREE.MathUtils.randFloat(45, 65),
          THREE.MathUtils.randFloatSpread(260)
        ),
        scale: THREE.MathUtils.randFloat(8, 18),
        speed: THREE.MathUtils.randFloat(0.02, 0.08),
      });
    }

    return list;
  }, []);
   const wind=useWind();
  useFrame((_, delta) => {
    group.current.children.forEach((child, i) => {
      child.position.x +=clouds[i].speed*delta*12*(1+wind.strength);

      if (child.position.x > 140) {
        child.position.x = -140;
      }

      child.rotation.z += 0.002 * delta;
    });
  });

  return (
    <group ref={group}>
      {clouds.map((cloud, index) => (
        <group
          key={index}
          position={cloud.position}
          scale={cloud.scale}
        >
          <mesh>
            <sphereGeometry args={[1.2, 12, 12]} />
            <meshStandardMaterial
              color="#f6f6f6"
              transparent
              opacity={0.22}
              depthWrite={false}
            />
          </mesh>

          <mesh position={[1.4, 0.2, 0]}>
            <sphereGeometry args={[1.1, 12, 12]} />
            <meshStandardMaterial
              color="#f6f6f6"
              transparent
              opacity={0.22}
              depthWrite={false}
            />
          </mesh>

          <mesh position={[-1.3, 0.1, 0]}>
            <sphereGeometry args={[1.0, 12, 12]} />
            <meshStandardMaterial
              color="#f6f6f6"
              transparent
              opacity={0.22}
              depthWrite={false}
            />
          </mesh>

          <mesh position={[0, 0.35, 0]}>
            <sphereGeometry args={[1.35, 12, 12]} />
            <meshStandardMaterial
              color="#f6f6f6"
              transparent
              opacity={0.22}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}