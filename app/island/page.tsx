"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import dynamic from "next/dynamic";

import CameraController from "@/components/CameraController";
import CameraInspector from "@/components/CameraInspector";
import LightController from "@/components/Island/LightController";
import FillLightController from "@/components/Island/OppositeLightController";
import GradientSkyController from "@/components/Island/GradientSkyController";
import SceneAtmosphereController from "@/components/Island/SceneAtmosphereController";
import WaterPlaneController from "@/components/Island/WaterPlaneController";
import MountainController from "@/components/Island/MountainController";
import CameraDebugPanel from "@/components/Island/CameraDebugPanel";

const Leva = dynamic(() => import("leva").then((mod) => mod.Leva), {
  ssr: false,
});

import { useEffect, useState } from "react";
import gsap from "gsap";

function Mountain({
  onRocksReady,
}: {
  onRocksReady: (rocks: THREE.Mesh[]) => void;
}) {
  const { scene } = useGLTF("/models/mountain.glb");

  useEffect(() => {
    const rocks: THREE.Mesh[] = [];

    // Cube.047 -> Cube.112 (numeric range check, not just a string prefix)
    const isMountainCubeName = (name: string) => {
      const match = name.match(/^Cube(\d+)$/);
      if (!match) return false;
      const n = parseInt(match[1], 10);
      return n >= 47 && n <= 112;
    };

    // Belt-and-suspenders: also treat it as a mountain mesh if it lives
    // inside a "mountain.001" collection/group, in case naming ever drifts.
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

    // Hand the rock meshes up so MountainController can darken them
    // independently of the island's own lighting.
    onRocksReady(rocks);

    // Animate from LEFT → RIGHT
    rocks.sort((a, b) => a.getWorldPosition(new THREE.Vector3()).x - b.getWorldPosition(new THREE.Vector3()).x);

    rocks.forEach((rock, index) => {
      const originalPos = rock.position.clone();
      const originalRot = rock.rotation.clone();

      // Every rock gets its own values
      const lift = THREE.MathUtils.randFloat(1.5, 3.5);
      const rotX = THREE.MathUtils.degToRad(
        THREE.MathUtils.randFloatSpread(14)
      );
      const rotZ = THREE.MathUtils.degToRad(
        THREE.MathUtils.randFloatSpread(14)
      );

      const delay =
        index * 0.015 +
        Math.sin(index * 0.55) * 0.08 +
        Math.random() * 0.05;

      const tl = gsap.timeline({ delay });

      // Small dip first
      tl.to(
        rock.position,
        {
          y: originalPos.y - lift * 0.25,
          duration: 0.12,
          ease: "power1.in",
        },
        0
      );

      // Small tilt
      tl.to(
        rock.rotation,
        {
          x: originalRot.x + rotX,
          z: originalRot.z + rotZ,
          duration: 0.18,
          ease: "power1.out",
        },
        0
      );

      // Rise with overshoot
      tl.to(
        rock.position,
        {
          y: originalPos.y + lift,
          duration: 0.35,
          ease: "power3.out",
        },
        ">"
      );

      // Rotate back while rising
      tl.to(
        rock.rotation,
        {
          x: originalRot.x,
          z: originalRot.z,
          duration: 0.35,
          ease: "power2.out",
        },
        "<"
      );

      // Settle back
      tl.to(
        rock.position,
        {
          y: originalPos.y,
          duration: 0.45,
          ease: "elastic.out(1, 0.55)",
        },
        ">"
      );
    });
  }, [scene, onRocksReady]);

  return <primitive object={scene} />;
}

export default function Page() {
  const [rockMeshes, setRockMeshes] = useState<THREE.Mesh[]>([]);
  const [showLeva, setShowLeva] = useState(false);

useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === "m" && e.ctrlKey) setShowLeva((v) => !v);
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, []);

  return (
    <>
      <Canvas
        camera={{
          position: [11.873, 10.369, 2.485],
          fov: 45,
          far: 6000,
        }}
        shadows
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        <GradientSkyController />
        <SceneAtmosphereController />

        <LightController />
        <FillLightController />

        <Mountain onRocksReady={setRockMeshes} />
        <MountainController meshes={rockMeshes} />
        <WaterPlaneController />

        <CameraController />
      </Canvas>

      <CameraInspector />
      <CameraDebugPanel />

    <Leva collapsed={false} oneLineLabels={false} hidden={!showLeva} />    </>
  );
}