"use client";

import * as THREE from "three";
import { useRef, useState, useCallback, useEffect } from "react";
import { useControls } from "leva";
import LightDebugHelper from "./LightDebugHelper";

export default function OppositeLightController() {
  const lightRef = useRef<THREE.DirectionalLight | null>(null);
  const targetRef = useRef<THREE.Object3D>(null!);

  const [lightObject, setLightObject] = useState<THREE.DirectionalLight | null>(null);
  const setLightRef = useCallback((node: THREE.DirectionalLight | null) => {
    lightRef.current = node;
    setLightObject(node);
  }, []);

  const { posX, posY, posZ, intensity, color, castShadow } = useControls(
    "Opposite Light",
    {
      posX: { value: -425, min: -800, max: 800, step: 1 },
      posY: { value: 215, min: 0, max: 800, step: 1 },
      posZ: { value: -172, min: -800, max: 800, step: 1 },
      intensity: { value: 4.7, min: 0, max: 10, step: 0.1 },
      color: "#ffb865",
      castShadow: false,
    }
  );

  const { targetX, targetY, targetZ } = useControls("Opposite Light Target", {
    targetX: { value: -424, min: -800, max: 800, step: 0.1 },
    targetY: { value: 14.5, min: -100, max: 400, step: 0.1 },
    targetZ: { value: -20.87, min: -800, max: 800, step: 0.1 },
  });

  const { left, right, top, bottom, near, far } = useControls("Fill Shadow Camera", {
    left: { value: -380, min: -1500, max: 0, step: 10 },
    right: { value: 600, min: 0, max: 1500, step: 10 },
    top: { value: 600, min: 0, max: 1500, step: 10 },
    bottom: { value: -600, min: -1500, max: 0, step: 10 },
    near: { value: 1.0, min: 0.1, max: 100, step: 0.1 },
    far: { value: 1500, min: 100, max: 3000, step: 10 },
  });

  useEffect(() => {
    if (lightRef.current) {
      const cam = lightRef.current.shadow.camera as THREE.OrthographicCamera;
      cam.left = left;
      cam.right = right;
      cam.top = top;
      cam.bottom = bottom;
      cam.near = near;
      cam.far = far;
      cam.updateProjectionMatrix();
    }
  }, [left, right, top, bottom, near, far]);

  return (
    <>
      <directionalLight
        ref={setLightRef}
        position={[posX, posY, posZ]}
        intensity={intensity}
        color={color}
        castShadow={castShadow}
        shadow-mapSize={[4096, 4096]}
        target={targetRef.current || undefined}
      />
      <object3D ref={targetRef} position={[targetX, targetY, targetZ]} />

      <LightDebugHelper light={lightObject} label="Fill Light Debug" />
    </>
  );
}