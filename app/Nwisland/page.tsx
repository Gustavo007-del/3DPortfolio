"use client";

import * as THREE from "three";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";

import IslandScene from "@/components/Island/IslandScene";
import JourneyCamera from "@/components/Journey/JourneyCamera";
import JourneyUI from "@/components/Journey/JourneyUI";
import { JourneyProvider } from "@/components/Journey/JourneyProvider";
import CameraDebug from "@/components/Journey/CameraDebug";
import ChapterPanel from "@/components/Journey/ChapterPanel";
import { WindProvider } from "@/components/fire/WindContext";
const Leva = dynamic(
  () => import("leva").then((m) => m.Leva),
  {
    ssr: false,
  }
);

export default function Page() {
  return (
    <JourneyProvider>
      <div className="relative w-screen h-screen overflow-hidden">
        <Canvas
          shadows
          camera={{
            position: [11.873, 10.369, 2.485],
            fov: 45,
            far: 6000,
          }}
          gl={{
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
        >
          <WindProvider>
          <IslandScene />
          <JourneyCamera />
          </WindProvider>
        </Canvas>
        <JourneyUI />

        <Leva hidden />
          <ChapterPanel />
          {/* <CameraDebug /> */}

      </div>
    </JourneyProvider>
  );
}