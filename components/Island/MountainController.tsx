// components/Island/MountainController.tsx
"use client";

import * as THREE from "three";
import { useEffect, useMemo } from "react";
import { useControls } from "leva";

type MountainControllerProps = {
  meshes: THREE.Mesh[];
};

// Directional/ambient lights in the scene affect everything uniformly, so the
// only way to make the mountains look dimmer than the island *without*
// touching the island's lighting setup is to darken the mountain meshes'
// own material response (color + how much env/roughness lets light bounce).
export default function MountainController({ meshes }: MountainControllerProps) {
  const { darkness, tintColor, roughness, envMapIntensity } = useControls(
    "Mountain Shading",
    {
      darkness: { value: 1, min: 0, max: 1, step: 0.01 }, // 0 = untouched, 1 = full tint
      tintColor: "#696040",
      roughness: { value: 0.83, min: 0, max: 1, step: 0.01 },
      envMapIntensity: { value: 0.25, min: 0, max: 2, step: 0.01 },
    }
  );

  // Cache the ORIGINAL color per material so repeated Leva edits always
  // blend from the true source color instead of compounding toward black.
  const originalColors = useMemo(() => new Map<THREE.Material, THREE.Color>(), []);

  useEffect(() => {
    if (!meshes || meshes.length === 0) return;

    const tint = new THREE.Color(tintColor);

    meshes.forEach((mesh) => {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      mats.forEach((mat) => {
        if (!(mat instanceof THREE.MeshStandardMaterial)) return;

        if (!originalColors.has(mat)) {
          originalColors.set(mat, mat.color.clone());
        }

        const base = originalColors.get(mat)!;
        mat.color.copy(base).lerp(tint, darkness);
        mat.roughness = roughness;
        mat.envMapIntensity = envMapIntensity;
        mat.needsUpdate = true;
      });
    });
  }, [meshes, darkness, tintColor, roughness, envMapIntensity, originalColors]);

  return null;
}