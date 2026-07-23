"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import gsap from "gsap";

import CameraController from "@/components/CameraController";
import CameraInspector from "@/components/CameraInspector";
import LightController from "@/components/Island/LightController";
import FillLightController from "@/components/Island/OppositeLightController";
import GradientSkyController from "@/components/Island/GradientSkyController";
import SceneAtmosphereController from "@/components/Island/SceneAtmosphereController";
import WaterPlaneController from "@/components/Island/WaterPlaneController";
import MountainController from "@/components/Island/MountainController";

import ScrollCameraRig from "@/components/Portfolio/ScrollCameraRig";
import { useScrollProgress } from "@/components/Portfolio/useScrollProgress";
import ExplorerOverlay from "@/components/Portfolio/ExplorerOverlay";
import ExpeditionRoute from "@/components/Portfolio/ExpeditionRoute";
import CompassRose from "@/components/Portfolio/CompassRose";
import { SECTIONS } from "@/lib/portfolioData";

const Leva = dynamic(() => import("leva").then((mod) => mod.Leva), {
  ssr: false,
});

function Mountain({
  onRocksReady,
}: {
  onRocksReady: (rocks: THREE.Mesh[]) => void;
}) {
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

type Mode = "story" | "explore";

export default function Page() {
  const [rockMeshes, setRockMeshes] = useState<THREE.Mesh[]>([]);
  const [showLeva, setShowLeva] = useState(false);
  const [mode, setMode] = useState<Mode>("story");

  const { progress, progressRef } = useScrollProgress();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "m" && e.ctrlKey) setShowLeva((v) => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Explore mode takes over the wheel for orbit/zoom, so lock page scroll
  // while it's active. Story mode restores native scroll.
  useEffect(() => {
  const html = document.documentElement;
  const body = document.body;

  if (mode === "explore") {
    // Hide scrollbar and prevent scrolling
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    // Optional: always start explore mode from the top
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  } else {
    // Restore normal scrolling
    html.style.overflow = "";
    body.style.overflow = "";
  }

  return () => {
    html.style.overflow = "";
    body.style.overflow = "";
  };
}, [mode]);
  

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "story" ? "explore" : "story"));
  }, []);

  return (
    <>
      {/* Fixed 3D layer — stays put; content around it changes with scroll progress */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <Canvas
          camera={{ position: [11.873, 10.369, 2.485], fov: 45, far: 6000 }}
          shadows
          gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
          // r3f defaults to touch-action:none (needed for drag-to-orbit).
          // In story mode there's no orbit control mounted, so allow native
          // vertical touch/trackpad scroll through the canvas.
          style={{
            touchAction: mode === "story" ? "pan-y" : "none",
            pointerEvents: "auto",
          }}        >
          <GradientSkyController />
          <SceneAtmosphereController />

          <LightController />
          <FillLightController />

          <Mountain onRocksReady={setRockMeshes} />
          <MountainController meshes={rockMeshes} />
          {/* <WaterPlaneController /> */}

          {/* Only ONE camera driver mounted at a time — they must never run together */}
          {mode === "story" && <ScrollCameraRig progressRef={progressRef} />}
          {mode === "explore" && <CameraController />}
        </Canvas>
      </div>

      {/* Fixed HTML overlay layer */}
      <div style={{ position: "fixed", inset: 0, zIndex: 10, pointerEvents: "none" }}>
        {mode === "story" && (
          <>
            <ExplorerOverlay progress={progress} />
            <ExpeditionRoute progress={progress} />
            <CompassRose progress={progress} />
          </>
        )}

        {mode === "explore" && <CameraInspector />}

        <button
          onClick={toggleMode}
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 30,
            pointerEvents: "auto",
            padding: "10px 18px",
            fontFamily: "monospace",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            background: "rgba(44,28,16,0.8)",
            color: "#f3e3c3",
            border: "1px solid #c98a2e",
            borderRadius: 20,
            cursor: "pointer",
          }}
        >
          {mode === "story" ? "Free Explore" : "Back to Story"}
        </button>
      </div>

      <Leva collapsed={false} oneLineLabels={false} hidden={!showLeva} />

      {/* Real scroll height — one screen per section, drives useScrollProgress */}
      <div style={{ height: `${SECTIONS.length * 100}vh`, position: "relative", zIndex: -1 }} />
    </>
  );
}