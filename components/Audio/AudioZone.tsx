// components/Audio/AudioZone.tsx

"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useAudio } from "./AudioProvider";
import { AudioHandle, Position, BusName } from "./audioTypes";
import { DEFAULT_FADE_TIME } from "./audioDefaults";
import * as THREE from "three";

interface AudioZoneProps {
  /** Sound to play inside the zone */
  sound: string;
  /** World position of the zone center */
  position: Position;
  /** Radius of the zone (distance from center where volume = 0 outside) */
  radius: number;
  /** Audio bus (default: Environment) */
  bus?: BusName;
  /** Max volume inside the zone (0-1) */
  volume?: number;
  /** Fade in duration when entering (seconds) */
  fadeIn?: number;
  /** Fade out duration when exiting (seconds) */
  fadeOut?: number;
  /** Whether to loop (default: true) */
  loop?: boolean;
  /** Optional debug id */
  id?: string;
}

/**
 * A 3D audio zone that plays a positional sound with smooth fade in/out
 * based on the listener's distance from the zone center.
 */
export function AudioZone({
  sound,
  position,
  radius,
  bus = "Environment",
  volume = 1,
  fadeIn = DEFAULT_FADE_TIME,
  fadeOut = DEFAULT_FADE_TIME,
  loop = true,
  id,
}: AudioZoneProps) {
  const { play, stopAll, isReady } = useAudio();
  const { camera } = useThree();

  const handleRef = useRef<AudioHandle | null>(null);
  const currentVolume = useRef(0);
  const targetVolume = useRef(0);
  const isInside = useRef(false);
  const mounted = useRef(true);

  // Play sound on mount
  useEffect(() => {
    if (!isReady) return;
    const handle = play(sound, {
      bus,
      loop,
      position,
      volume: 0, // start silent
      fadeIn: 0,
      refDistance: radius * 0.1,
      maxDistance: radius * 1.2,
      rolloff: 1,
    });
    if (handle) {
      handleRef.current = handle;
    }
    return () => {
      mounted.current = false;
      if (handleRef.current) {
        handleRef.current.stop(fadeOut);
        handleRef.current = null;
      }
    };
  }, [sound, position, bus, loop, radius, fadeOut, isReady]);

  // Update volume based on distance each frame
  useFrame(() => {
    if (!handleRef.current || !mounted.current) return;
    const dist = camera.position.distanceTo(
      new THREE.Vector3(position[0], position[1], position[2])
    );
    const inside = dist < radius;
    const t = inside ? 1 - dist / radius : 0;
    // Apply smooth easing for natural fade
    const rawTarget = inside ? t * t * (3 - 2 * t) : 0; // smoothstep
    targetVolume.current = rawTarget * volume;
    // Check if we crossed the threshold
    if (inside && !isInside.current) {
      // Entering: start at current, fade up to target
      isInside.current = true;
    } else if (!inside && isInside.current) {
      // Exiting: start at current, fade down
      isInside.current = false;
    }
    // Smoothly interpolate current volume toward target
    const speed = isInside.current ? 1 / fadeIn : 1 / fadeOut;
    const delta = 1 - Math.exp(-speed * 0.016);
    currentVolume.current += (targetVolume.current - currentVolume.current) * delta;
    // Clamp and apply
    const gain = handleRef.current.gain;
    if (gain) {
      gain.gain.value = Math.max(0, Math.min(1, currentVolume.current));
    }
  });

  // Debug visualization would go here if showZones is enabled (via Leva)
  // We'll let AudioDebug handle the visualization separately.

  return null;
}