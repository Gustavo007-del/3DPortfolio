"use client";

import { CameraControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const START = {
  position: [43.373, 21.589, 23.460] as const,
  target: [-4.088, 5.949, -1.996] as const,
};
// Distance from camera to target — this is what gets locked
const LOCKED_DISTANCE = new THREE.Vector3(...START.position).distanceTo(
  new THREE.Vector3(...START.target)
);
export default function CameraController() {
  const controls = useRef<CameraControls>(null);

  useEffect(() => {
    if (controls.current) {
      controls.current.minDistance = LOCKED_DISTANCE;
      controls.current.maxDistance = LOCKED_DISTANCE;

      // Belt-and-suspenders: also kill wheel/pinch dolly input directly
      controls.current.mouseButtons.wheel = 0; // ACTION.NONE
      controls.current.touches.two = 0;        // ACTION.NONE
    }

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