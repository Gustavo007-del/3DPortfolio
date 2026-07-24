"use client";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { WorldProvider } from "./WorldState";
import { JourneyProvider } from "@/components/Journey/JourneyProvider";
import { AudioProvider } from "@/components/Audio/AudioProvider";
import { WindProvider } from "@/components/fire/WindContext";

// Placeholder mesh — confirms Canvas/provider stack boots.
// Removed in step 8 once IslandScene/SolarSystem are wired through WorldLOD.
function BootTestMesh() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#888" />
    </mesh>
  );
}

export default function WorldManager() {
  return (
    <WorldProvider>
      <JourneyProvider>
        <AudioProvider>
          <div className="relative w-screen h-screen overflow-hidden">
            <Canvas
              shadows
              camera={{ position: [0, 6, 22], fov: 50, far: 6000 }}
              gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
            >
              <WindProvider>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <BootTestMesh />
              </WindProvider>
            </Canvas>
          </div>
        </AudioProvider>
      </JourneyProvider>
    </WorldProvider>
  );
}