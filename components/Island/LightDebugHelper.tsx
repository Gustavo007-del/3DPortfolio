// components/Island/LightDebugHelper.tsx
"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useControls } from "leva";
import { useThree, useFrame } from "@react-three/fiber";

export default function LightDebugHelper({
  light,
  label,
}: {
  light: THREE.DirectionalLight | null;
  label: string;
}) {
  const { scene } = useThree();
  const helperRef = useRef<THREE.CameraHelper | null>(null);

  // `label` is the Leva folder name — give every light a different one.
  // Two lights both naming this folder "Debug" is exactly what merges
  // their toggles (and boxes) into a single shared control.
  const { showHelper } = useControls(label, {
    showHelper: false,
  });

  useEffect(() => {
    if (!light || !showHelper) return;

    const helper = new THREE.CameraHelper(light.shadow.camera);
    helperRef.current = helper;
    scene.add(helper);

    return () => {
      scene.remove(helper);
      helper.dispose();
      helperRef.current = null;
    };
  }, [light, showHelper, scene]);

  // CameraHelper doesn't auto-refresh when the camera it's watching
  // changes shape or orientation, so re-sync it every frame instead of
  // hand-tracking every bound as a dependency — this stays correct no
  // matter what moved it (gizmo drag, shadow bounds, target, anything).
  useFrame(() => {
    helperRef.current?.update();
  });

  return null;
}