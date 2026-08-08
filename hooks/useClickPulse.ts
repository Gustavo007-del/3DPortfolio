// hooks/useClickPulse.ts
"use client";
import { useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Generic spring-like pulse: call trigger() on click, and apply the
// returned scale multiplier to whatever mesh/group you want to react.
export function useClickPulse(strength = 0.35, decay = 4) {
  const pulseRef = useRef(0);

  const trigger = useCallback(() => {
    pulseRef.current = strength;
  }, [strength]);

  useFrame((_, delta) => {
    if (pulseRef.current > 0) {
      pulseRef.current = Math.max(0, pulseRef.current - decay * delta);
    }
  });

  // 1 + a decaying bump — multiply a mesh's base scale by this.
  const getScale = () => 1 + pulseRef.current;

  return { trigger, getScale, pulseRef };
}