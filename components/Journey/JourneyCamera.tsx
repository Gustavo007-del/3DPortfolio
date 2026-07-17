"use client";

import { CameraControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useJourney } from "./JourneyProvider";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
export default function JourneyCamera() {
  const controls = useRef<CameraControls>(null);

  const {
  started,
  currentStop,
} = useJourney();

  useEffect(() => {
    if (!controls.current) return;

    if (!started) {
      controls.current.setLookAt(
        257.809,
 259.613,
 181.562,

       -32.038,
 98.698,
 -30.378,

        false
      );

      return;
    }

    controls.current.setLookAt(
      currentStop.camera.position[0],
      currentStop.camera.position[1],
      currentStop.camera.position[2],

      currentStop.camera.lookAt[0],
      currentStop.camera.lookAt[1],
      currentStop.camera.lookAt[2],

      true
    );

  }, [started, currentStop.camera]);
  useFrame(({ camera }) => {
  const target =
    controls.current?.getTarget(new THREE.Vector3());

  (window as any).__cameraDebug = {
    px: camera.position.x.toFixed(3),
    py: camera.position.y.toFixed(3),
    pz: camera.position.z.toFixed(3),

    tx: target?.x.toFixed(3),
    ty: target?.y.toFixed(3),
    tz: target?.z.toFixed(3),
  };
});
  return (
    <CameraControls
      ref={controls}
      makeDefault
      smoothTime={1.4}
    />
  );
}