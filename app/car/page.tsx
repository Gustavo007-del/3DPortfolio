"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import CarModel from "@/components/cars/CarModel";

export default function CarPage() {
  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{
          position: [5, 3, 8],
          fov: 50,
        }}
      >
        {/* Lights */}
        <ambientLight intensity={1} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={2}
          castShadow
        />


        {/* Car */}
        <CarModel />

        {/* Ground Shadow */}
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.5}
          scale={10}
          blur={2}
        />

        <Environment preset="city" />
        <OrbitControls />
      </Canvas>
    </div>
  );
}