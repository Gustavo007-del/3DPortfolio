// components/Portfolio/ScrollCameraRig.tsx
"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA_WAYPOINTS } from "@/lib/portfolioData";

// ⚠️ IMPORTANT: this drives camera.position + lookAt every frame.
// If you already have a <CameraController /> also writing to the camera
// each frame, they'll fight each other. Comment out <CameraController />
// while testing this, or merge the two — whichever you prefer.
export default function ScrollCameraRig({
  progressRef,
}: {
  progressRef: MutableRefObject<number>;
}) {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(...CAMERA_WAYPOINTS[0].lookAt));
  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const waypoints = CAMERA_WAYPOINTS;
    const p = THREE.MathUtils.clamp(progressRef.current, 0, 1) * (waypoints.length - 1);
    const i = Math.floor(p);
    const local = p - i;
    const a = waypoints[i];
    const b = waypoints[Math.min(i + 1, waypoints.length - 1)];

    targetPos.current.set(
      THREE.MathUtils.lerp(a.position[0], b.position[0], local),
      THREE.MathUtils.lerp(a.position[1], b.position[1], local),
      THREE.MathUtils.lerp(a.position[2], b.position[2], local)
    );
    targetLookAt.current.set(
      THREE.MathUtils.lerp(a.lookAt[0], b.lookAt[0], local),
      THREE.MathUtils.lerp(a.lookAt[1], b.lookAt[1], local),
      THREE.MathUtils.lerp(a.lookAt[2], b.lookAt[2], local)
    );

    // damp = smooth trailing follow, so scroll doesn't feel jumpy/linear
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetPos.current.x, 3, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetPos.current.y, 3, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetPos.current.z, 3, delta);

    currentLookAt.current.x = THREE.MathUtils.damp(currentLookAt.current.x, targetLookAt.current.x, 3, delta);
    currentLookAt.current.y = THREE.MathUtils.damp(currentLookAt.current.y, targetLookAt.current.y, 3, delta);
    currentLookAt.current.z = THREE.MathUtils.damp(currentLookAt.current.z, targetLookAt.current.z, 3, delta);

    camera.lookAt(currentLookAt.current);
  });

  return null;
}