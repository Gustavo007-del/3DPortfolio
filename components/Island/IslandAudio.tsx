// components/Island/IslandAudio.tsx

"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useAudio } from "@/components/Audio/AudioProvider";
import { AudioZone } from "@/components/Audio/AudioZone";
import { useJourney } from "@/components/Journey/JourneyProvider";

const SOUNDS_TO_PRELOAD = [
  "ocean", "wind", "birds",
  "fire", "waterfall", "river", "castle", "dock", "bridge", "bell"
];

export default function IslandAudio() {
  const { camera, scene } = useThree();
  const { play, load, isReady, __setListener, __setParent } = useAudio();
  const { started } = useJourney();
  const ambientStarted = useRef(false);

  // Set up AudioListener
  useEffect(() => {
    if (!camera) return;
    let listener = camera.children.find(
      (child) => child instanceof THREE.AudioListener
    ) as THREE.AudioListener | undefined;
    if (!listener) {
      listener = new THREE.AudioListener();
      camera.add(listener);
      console.log("[IslandAudio] Created new AudioListener");
    }
    __setListener(listener);
    __setParent(scene);
    console.log("[IslandAudio] Listener and parent set");
    return () => {
      if (listener && camera) {
        camera.remove(listener);
      }
    };
  }, [camera, scene, __setListener, __setParent]);

  // Preload and start when journey begins
  useEffect(() => {
    if (!started || ambientStarted.current) return;

    const startAudio = async () => {
      ambientStarted.current = true;
      console.log("[IslandAudio] Preloading sounds...");
      await Promise.all(SOUNDS_TO_PRELOAD.map(id => load(id).catch(() => {})));
      console.log("[IslandAudio] All sounds preloaded (some may be procedural)");

      // Start ambience – context should already be running from the button click
      const ocean = play("ocean", { bus: "Ambient", loop: true, volume: 0.6, fadeIn: 3 });
      const wind = play("wind", { bus: "Ambient", loop: true, volume: 0.4, fadeIn: 4 });
      const birds = play("birds", { bus: "Ambient", loop: true, volume: 0.2, fadeIn: 5 });
      console.log("[IslandAudio] Ambience started:", { ocean: !!ocean, wind: !!wind, birds: !!birds });
    };

    startAudio().catch(console.error);
  }, [started, isReady, play, load]);

  return (
    <>
      <AudioZone sound="fire" position={[0, 0.5, 0]} radius={12} bus="Environment" volume={0.7} fadeIn={1} fadeOut={2} />
      <AudioZone sound="waterfall" position={[15, 2, 10]} radius={20} bus="Environment" volume={0.8} fadeIn={1.5} fadeOut={2} />
      <AudioZone sound="river" position={[-10, 0, 5]} radius={25} bus="Environment" volume={0.5} fadeIn={2} fadeOut={2} />
      <AudioZone sound="castle" position={[8, 2, -12]} radius={18} bus="Environment" volume={0.6} fadeIn={2} fadeOut={2} />
      <AudioZone sound="dock" position={[-12, 0, -8]} radius={15} bus="Environment" volume={0.5} fadeIn={1.5} fadeOut={2} />
      <AudioZone sound="bridge" position={[5, 1, 20]} radius={14} bus="Environment" volume={0.4} fadeIn={1.5} fadeOut={2} />
      <AudioZone sound="bell" position={[0, 4, -20]} radius={30} bus="Environment" volume={0.3} fadeIn={2} fadeOut={3} loop={false} />
    </>
  );
}