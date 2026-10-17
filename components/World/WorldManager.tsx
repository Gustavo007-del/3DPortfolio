"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import dynamic from "next/dynamic";
import { Canvas, useThree, invalidate } from "@react-three/fiber";
import { WorldProvider, useWorldState } from "./WorldState";
import WorldInput from "@/components/canvas/WorldInput";
import WorldCamera from "@/components/canvas/WorldCamera";
import LODGroup from "@/components/each-frame/WorldLOD";
import IslandScene from "@/components/Island/IslandScene";
import ShipwreckHotspot from "@/components/Island/ShipwreckHotspot";
import AudioZones from "@/components/Island/AudioZones";
import { AudioProvider } from "@/components/Audio/AudioProvider";
import AudioController from "@/components/Audio/AudioController";
import AudioButton from "@/components/Audio/AudioButton";
import AudioDebug from "@/components/Audio/AudioDebug";
import JourneyCamera from "@/components/Journey/JourneyCamera";
import JourneyUI from "@/components/Journey/JourneyUI";
import { JourneyProvider } from "@/components/Journey/JourneyProvider";
import ChapterPanel from "@/components/Journey/ChapterPanel";
import { WindProvider } from "@/components/fire/WindContext";
import SolarSystem from "@/components/scene/SolarSystem";
import { TransitionManagerProvider } from "@/components/World/Transition/TransitionManager";
import CloudTransition from "@/components/World/Transition/CloudTransition";
import LoadingTracker from "@/components/scene/LoadingTracker";
import SpaceOverlay from "@/components/scene/SpaceOverlay";
import ResumeButton from "@/components/Buttons/ResumeButton";
import RoamCamera from "@/components/World/RoamCamera";
import RoamButton from "@/components/Buttons/RoamButton";
import BoatRideHUD from "@/components/Island/boat-ride/BoatRideHUD";
import { useRide } from "@/components/Island/boat-ride/boatRideStore";

const Leva = dynamic(() => import("leva").then((m) => m.Leva), { ssr: false });
const WorldDebug = dynamic(() => import("@/components/systems/WorldDebug"), { ssr: false });

function SpaceLayer() {
  const { phase } = useWorldState();
  const active = phase === "SPACE" || phase === "TRANSITION_TO_SPACE";
  return (
    <LODGroup group="space">
      <SolarSystem active={active} />
    </LODGroup>
  );
}

function JourneyOverlay() {
  const { phase } = useWorldState();
  if (phase !== "ISLAND") return null;
  return (
    <>
      <JourneyUI />
      <ChapterPanel />
      {/* DOM side of the shipwreck interaction (PLAN §6.2) — must stay
          outside the Canvas */}
      <ShipwreckHotspot />
    </>
  );
}

function IslandLayer() {
  const { phase } = useWorldState();
  const ride = useRide();
  const active = phase === "ISLAND" || phase === "TRANSITION_TO_ISLAND";
  return (
    <LODGroup group="island">
      <IslandScene active={active} />
      <AudioZones />
      {/* One camera owner at a time (PLAN §2.1): while a ride runs, the
          chase camera owns the camera — drei CameraControls.update() writes
          every frame regardless of `enabled`, so JourneyCamera must fully
          unmount or it snaps the view back to the island. */}
      {active && ride.phase === "idle" && <JourneyCamera />}
    </LODGroup>
  );
}

/**
 * GPU prewarm. Runs once, right after the scene mounts (the loading screen is still
 * covering the canvas at this point).
 *
 * Why this exists: three.js compiles shader programs and uploads geometry/textures the
 * FIRST time something is actually rendered. Island materials were first rendered at the
 * Space -> Island swap, and their program key depends on the visible lights and the fog
 * type, which change at that exact moment — so everything compiled mid-scroll (hitch),
 * and again when the linear fog attached on arrival. The old gl.compile() trigger ran
 * while the Island group was still hidden, i.e. with the wrong light set.
 *
 * Here we render the scene once in each real configuration:
 *   1. Island only + FogExp2   (cloud transition)
 *   2. Island only + linear Fog (steady island)
 *   3. Space only  + FogExp2   (space / return trip)
 * with frustum culling off so every mesh is uploaded to the GPU.
 */
function WorldPrewarm() {
  const { gl, scene, camera } = useThree();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      // let first-mount effects (GLB registration, materials) settle
      await new Promise((r) => setTimeout(r, 400));

      const space = scene.getObjectByName("lod-space");
      const island = scene.getObjectByName("lod-island");
      if (!space || !island) return;

      const prev = { space: space.visible, island: island.visible, fog: scene.fog };

      const culled: THREE.Object3D[] = [];
      scene.traverse((o) => {
        if (o.frustumCulled) {
          culled.push(o);
          o.frustumCulled = false;
        }
      });

      const passes: { space: boolean; island: boolean; fog: THREE.Fog | THREE.FogExp2 | null }[] = [
        { space: false, island: true, fog: new THREE.FogExp2(0xc7d3e8, 0.001) },
        { space: false, island: true, fog: new THREE.Fog("#4e2f0e", 210, 790) },
        { space: true, island: false, fog: prev.fog ?? new THREE.FogExp2(0xc7d3e8, 0) },
      ];

      try {
        for (const p of passes) {
          space.visible = p.space;
          island.visible = p.island;
          scene.fog = p.fog;
          try {
            await gl.compileAsync(scene, camera); // parallel shader compile, non-blocking
          } catch {}
          gl.render(scene, camera); // uploads geometry/textures + shadow/reflection programs
        }
      } finally {
        space.visible = prev.space;
        island.visible = prev.island;
        scene.fog = prev.fog;
        for (const o of culled) o.frustumCulled = true;
        gl.setRenderTarget(null);
        invalidate();
      }
    };

    void run();
  }, [gl, scene, camera]);

  return null;
}

interface WorldManagerProps {
  onProgress?: (progress: number) => void;
  onLoaded?: () => void;
  /**
   * Controls the Canvas render loop. While false (e.g. during the loading
   * screen), the Canvas uses frameloop="demand" so assets still load and
   * the scene graph still builds, but nothing animates/re-renders every
   * frame. Flip to true once loading is fully complete.
   */
  active?: boolean;
}

export default function WorldManager({
  onProgress,
  onLoaded,
  active = true,
}: WorldManagerProps) {
  const ride = useRide();
  return (
    <WorldProvider>
      <TransitionManagerProvider>
        <JourneyProvider>
          <AudioProvider>
            <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050510" }}>
              <Canvas
                shadows
                dpr={[1, 1.5]} // cap pixel ratio: 2x/3x screens multiply shadow + reflector + postFX cost
                frameloop={active ? "always" : "demand"}
                camera={{ position: [0, 6, 22], fov: 50, far: 6000 }}
                gl={{
                  toneMapping: THREE.ACESFilmicToneMapping,
                  toneMappingExposure: 1.1,
                  powerPreference: "high-performance",
                }}
              >
                <WindProvider>
                  <WorldCamera />
                  {/* RoamCamera's controls also call update() every frame —
                      unmount while riding so the chase camera is the only
                      writer (PLAN §2.1). */}
                  {ride.phase === "idle" && <RoamCamera />}
                  <CloudTransition />
                  <SpaceLayer />
                  <IslandLayer />
                  <WorldPrewarm />
                  {onLoaded && <LoadingTracker onProgress={onProgress} onLoaded={onLoaded} />}
                </WindProvider>
              </Canvas>

              <WorldInput />
              <ResumeButton />
              <RoamButton />
              <JourneyOverlay />
              <BoatRideHUD />
              <AudioButton />
              <AudioController />
              <SpaceOverlay />
              <Leva hidden />
              {/* Polls Leva 10x/sec — dev only */}
              {process.env.NODE_ENV === "development" && <WorldDebug />}
              <AudioDebug />
            </div>
          </AudioProvider>
        </JourneyProvider>
      </TransitionManagerProvider>
    </WorldProvider>
  );
}
