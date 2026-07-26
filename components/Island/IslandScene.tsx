"use client";

import * as THREE from "three";
import { useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import gsap from "gsap";
import Mist from "@/components/fire/Mist";
import GradientSkyController from "./GradientSkyController";
import SceneAtmosphereController from "./SceneAtmosphereController";
import LightController from "./LightController";
import FillLightController from "./OppositeLightController";
import MountainController from "./MountainController";
import WaterPlaneController from "./WaterPlaneController";
import FireflyController from "@/components/fire/FireflyController";
import CloudLayer from "@/components/fire/CloudLayer";
import MistController from "@/components/fire/MistController";
import BirdDebug from "@/components/birds/BirdDebug";
import { ParticleController } from "@/components/Environment/ParticleEngine/ParticleController";


function Mountain({
  onRocksReady,
}: {
  onRocksReady: (rocks: THREE.Mesh[]) => void;
}) {
  // Copy the entire Mountain component from your current
  // app/island/page.tsx here without modifications.
  const { scene } = useGLTF("/models/mountain.glb");

  useEffect(() => {
    const rocks: THREE.Mesh[] = [];

    const isMountainCubeName = (name: string) => {
      const match = name.match(/^Cube(\d+)$/);
      if (!match) return false;
      const n = parseInt(match[1], 10);
      return n >= 47 && n <= 112;
    };

    const isInMountainCollection = (obj: THREE.Object3D) => {
      let current: THREE.Object3D | null = obj;
      while (current) {
        if (current.name === "mountain.001") return true;
        current = current.parent;
      }
      return false;
    };

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      child.castShadow = true;
      child.receiveShadow = true;

      if (child.name === "water") {
        child.visible = false;
      }

      if (isMountainCubeName(child.name) || isInMountainCollection(child)) {
        rocks.push(child);
      }
    });

    onRocksReady(rocks);

    }, [scene, onRocksReady]);
 return <primitive object={scene} />;
}

export default function IslandScene({ active = true }: { active?: boolean }) {
  const [rocks, setRocks] = useState<THREE.Mesh[]>([]);

  return (
    <>
      <GradientSkyController />

      <SceneAtmosphereController active={active} />      {/* <CloudLayer /> */}


      <LightController />

      <FillLightController />

      <Mountain onRocksReady={setRocks} />

      <MountainController meshes={rocks} />

      <WaterPlaneController />
      <MistController />
      {/* <FireflyController />     */}
       <BirdDebug />
      <ParticleController debugEnabled={process.env.NODE_ENV==="development"} />

</>
  );
}