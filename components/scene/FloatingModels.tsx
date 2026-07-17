"use client";

import { useRef } from "react";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";
import CarModel from "../cars/CarModel";
import ShibaModel from "../shiba/ShibaModel";

function FloatingOrbit({ children, radius, speed, yOffset, startAngle = 0 }: {
  children: React.ReactNode;
  radius: number;
  speed: number;
  yOffset: number;
  startAngle?: number;
}) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const angle = state.clock.elapsedTime * speed + startAngle;
    groupRef.current.position.x = Math.cos(angle) * radius;
    groupRef.current.position.z = Math.sin(angle) * radius;
    groupRef.current.position.y = yOffset + Math.sin(state.clock.elapsedTime * 0.5 + startAngle) * 1.5;
    groupRef.current.rotation.y = -angle + Math.PI;
  });

  return <group ref={groupRef}>{children}</group>;
}

export default function FloatingModels() {
  return (
    <>
      {/* <FloatingOrbit radius={14} speed={0.15} yOffset={2} startAngle={0}>
        <group scale={0.8}>
          <CarModel />
        </group>
      </FloatingOrbit> */}

      <FloatingOrbit radius={18} speed={-0.1} yOffset={-3} startAngle={Math.PI / 2}>
        <group scale={0.6}>
          <ShibaModel />
        </group>
      </FloatingOrbit>
    </>
  );
}