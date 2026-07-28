"use client";
import * as THREE from "three";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { WorldProvider, useWorldState } from "./WorldState";
import WorldInput from "@/components/canvas/WorldInput";
import WorldCamera from "@/components/canvas/WorldCamera";
import LODGroup from "@/components/each-frame/WorldLOD";
import IslandScene from "@/components/Island/IslandScene";
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
    </>
  );
}

function IslandLayer() {
  const { phase } = useWorldState();
  const active = phase === "ISLAND" || phase === "TRANSITION_TO_ISLAND";
  return (
    <LODGroup group="island">
      <IslandScene active={active} />
      <AudioZones />
      <JourneyCamera />
    </LODGroup>
  );
}

interface WorldManagerProps {
  onProgress?: (progress: number) => void;
  onLoaded?: () => void;
}

export default function WorldManager({ onProgress, onLoaded }: WorldManagerProps) {
  return (
    <WorldProvider>
      <TransitionManagerProvider>
        <JourneyProvider>
          <AudioProvider>
            <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050510" }}>
              <Canvas
                shadows
                camera={{ position: [0, 6, 22], fov: 50, far: 6000 }}
                gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
              >
                <WindProvider>
                  <WorldCamera />
                  <CloudTransition />
                  <SpaceLayer />
                  <IslandLayer />
                  {onLoaded && <LoadingTracker onProgress={onProgress} onLoaded={onLoaded} />}
                </WindProvider>
              </Canvas>

              <WorldInput />
              <JourneyOverlay />
              <AudioButton />
              <AudioController />
              <SpaceOverlay />
              <Leva hidden />
              <WorldDebug />
              <AudioDebug />
            </div>
          </AudioProvider>
        </JourneyProvider>
      </TransitionManagerProvider>
    </WorldProvider>
  );
}
