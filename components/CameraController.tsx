"use client";

import { CameraControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const START = {
  position: [42.467, 19.469, 13.612] as const,
  target: [-0.954, 5.248, -10.579] as const,
};

export default function CameraController() {
  const controls = useRef<CameraControls>(null);

  useEffect(() => {
    controls.current?.setLookAt(
      START.position[0],
      START.position[1],
      START.position[2],
      START.target[0],
      START.target[1],
      START.target[2],
      false
    );
  }, []);

  useFrame(({ camera }) => {
    const target = controls.current?.getTarget(new THREE.Vector3());

    (window as any).__cameraDebug = {
      px: camera.position.x.toFixed(3),
      py: camera.position.y.toFixed(3),
      pz: camera.position.z.toFixed(3),
      tx: target?.x.toFixed(3),
      ty: target?.y.toFixed(3),
      tz: target?.z.toFixed(3),
      controls: controls.current,
    };
  });

  return (
    <CameraControls
      ref={controls}
      makeDefault
      smoothTime={0.4}
    />
  );
}