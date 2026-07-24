// components/Audio/AudioZone.tsx

"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { AudioZoneProps } from "./audioTypes";
import { useAudioContext } from "./AudioProvider";

export default function AudioZone({ position, radius, sound, bus = "Environment", fadeMs = 800, innerVolume = 1, falloff = 0.6 }: AudioZoneProps) {
  const { play, stop, ready } = useAudioContext();
  const inside = useRef(false);
  const frameSkip = useRef(0);
  const pos = useRef(new THREE.Vector3(...position));
  const camPos = useRef(new THREE.Vector3());

  useEffect(() => () => { if (inside.current) stop(sound, 200); }, [sound, stop]);

  useFrame(({ camera }) => {
    if (!ready) return;
    frameSkip.current++;
    if (frameSkip.current % 4 !== 0) return;

    camPos.current.copy(camera.position);
    const dist = camPos.current.distanceTo(pos.current);
    const isInside = dist <= radius;

    if (isInside && !inside.current) {
      inside.current = true;
      play(sound, { bus, position, volume: innerVolume, fadeMs, loop: true });
    } else if (!isInside && inside.current && dist > radius * (1 + falloff)) {
      inside.current = false;
      stop(sound, fadeMs);
    }
  });

  return null;
}