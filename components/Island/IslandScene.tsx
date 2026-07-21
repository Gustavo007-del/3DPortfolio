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
import Fireflies from "@/components/fire/Fireflies";
import CloudLayer from "@/components/fire/CloudLayer";
import MistController from "@/components/fire/MistController";
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

    rocks.sort(
      (a, b) =>
        a.getWorldPosition(new THREE.Vector3()).x -
        b.getWorldPosition(new THREE.Vector3()).x
    );

    rocks.forEach((rock, index) => {
      const originalPos = rock.position.clone();
      const originalRot = rock.rotation.clone();

      const lift = THREE.MathUtils.randFloat(1.5, 3.5);
      const rotX = THREE.MathUtils.degToRad(THREE.MathUtils.randFloatSpread(14));
      const rotZ = THREE.MathUtils.degToRad(THREE.MathUtils.randFloatSpread(14));

      const delay = index * 0.015 + Math.sin(index * 0.55) * 0.08 + Math.random() * 0.05;

      const tl = gsap.timeline({ delay });

      tl.to(rock.position, { y: originalPos.y - lift * 0.25, duration: 0.12, ease: "power1.in" }, 0);
      tl.to(rock.rotation, { x: originalRot.x + rotX, z: originalRot.z + rotZ, duration: 0.18, ease: "power1.out" }, 0);
      tl.to(rock.position, { y: originalPos.y + lift, duration: 0.35, ease: "power3.out" }, ">");
      tl.to(rock.rotation, { x: originalRot.x, z: originalRot.z, duration: 0.35, ease: "power2.out" }, "<");
      tl.to(rock.position, { y: originalPos.y, duration: 0.45, ease: "elastic.out(1, 0.55)" }, ">");
    });
  }, [scene, onRocksReady]);
 return <primitive object={scene} />;
}

export default function IslandScene() {
  const [rocks, setRocks] = useState<THREE.Mesh[]>([]);

  return (
    <>
      <GradientSkyController />

      <SceneAtmosphereController />
      {/* <CloudLayer /> */}


      <LightController />

      <FillLightController />

      <Mountain onRocksReady={setRocks} />

      <MountainController meshes={rocks} />

      <WaterPlaneController />
      <MistController />
      <Fireflies count={250} radius={220} height={35}/>
    </>
  );
}