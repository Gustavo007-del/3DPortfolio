// components/World/Transition/CloudField.tsx
"use client";
import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { tForArcLength } from "@/components/Journey/cameraHelpers";
import { useTransitionManager, buildCloudCorridor, CloudCorridor } from "@/components/World/Transition/TransitionManager";
import { CloudMaterial } from "@/components/World/Transition/CloudMaterial";

// Base quad size in world units, before each instance's own aScale
// multiplies it. Independent of cloudThickness on purpose — thickness
// controls how far cards spread from the flight path, this controls how
// big any single card is.
const BASE_CARD_SIZE = 20;

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

type TubeData = {
  basePositions: Float32Array; // xyz per instance
  aScale: Float32Array;
  aPhase: Float32Array;
  aFade: Float32Array;
};

// Scatters `count` cards along the corridor's arc length, offset radially
// into a "tube" of the given thickness around the centerline. Pure/CPU-side
// — only re-run when the corridor shape, count, or thickness actually
// change (see the useMemo below), never per frame.
function buildTube(corridor: CloudCorridor, count: number, thickness: number): TubeData {
  const basePositions = new Float32Array(count * 3);
  const aScale = new Float32Array(count);
  const aPhase = new Float32Array(count);
  const aFade = new Float32Array(count);

  const worldUp = new THREE.Vector3(0, 1, 0);
  const altUp = new THREE.Vector3(1, 0, 0);

  for (let i = 0; i < count; i++) {
    // Spread across the whole arc with a little per-card jitter so cards
    // don't line up in visibly regular rings.
    const u = THREE.MathUtils.clamp((i + Math.random() * 0.6) / count, 0, 1);
    const t = tForArcLength(corridor.table, u);
    const point = corridor.curve.getPoint(t);
    const tangent = corridor.curve.getTangent(t).normalize();

    const reference = Math.abs(tangent.dot(worldUp)) > 0.95 ? altUp : worldUp;
    const right = new THREE.Vector3().crossVectors(tangent, reference).normalize();
    const realUp = new THREE.Vector3().crossVectors(right, tangent).normalize();

    const theta = Math.random() * Math.PI * 2;
    const radius = Math.random() * thickness;
    const offset = right
      .clone()
      .multiplyScalar(Math.cos(theta) * radius)
      .add(realUp.clone().multiplyScalar(Math.sin(theta) * radius));

    const finalPos = point.clone().add(offset);
    basePositions[i * 3] = finalPos.x;
    basePositions[i * 3 + 1] = finalPos.y;
    basePositions[i * 3 + 2] = finalPos.z;

    aScale[i] = 0.6 + Math.random() * 0.8;
    aPhase[i] = Math.random() * Math.PI * 2;

    // Fade cards near the exact centerline toward 0 — otherwise a
    // full-opacity card can spawn right at the camera's near plane and
    // read as a flat white flash instead of mist.
    const centerFalloff = smoothstep(0, thickness * 0.2, radius);
    aFade[i] = (0.5 + Math.random() * 0.5) * centerFalloff;
  }

  return { basePositions, aScale, aPhase, aFade };
}

type CloudFieldProps = {
  // Must be STABLE Vector3 references from the caller (CloudTransition) —
  // a new object identity every render rebuilds the whole tube needlessly.
  start: THREE.Vector3;
  end: THREE.Vector3;
};

export default function CloudField({ start, end }: CloudFieldProps) {
  const { config, densityRef, insideCloudsRef } = useTransitionManager();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const clockRef = useRef(0);

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const material = useMemo(() => new CloudMaterial(BASE_CARD_SIZE), []);

  const corridor = useMemo(
    () => buildCloudCorridor(start, end, config.cloudLayerHeight),
    [start, end, config.cloudLayerHeight]
  );

  const tube = useMemo(
    () => buildTube(corridor, config.cloudCardCount, config.cloudThickness),
    [corridor, config.cloudCardCount, config.cloudThickness]
  );

  // (Re)populate per-instance attributes + base transforms whenever the tube
  // is rebuilt — far less often than every frame.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    geometry.setAttribute("aScale", new THREE.InstancedBufferAttribute(tube.aScale, 1));
    geometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(tube.aPhase, 1));
    geometry.setAttribute("aFade", new THREE.InstancedBufferAttribute(tube.aFade, 1));

    const m = new THREE.Matrix4();
    for (let i = 0; i < config.cloudCardCount; i++) {
      m.makeTranslation(tube.basePositions[i * 3], tube.basePositions[i * 3 + 1], tube.basePositions[i * 3 + 2]);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [tube, geometry, config.cloudCardCount]);

  useFrame((_, delta) => {
    clockRef.current += delta;

    const density = densityRef.current;
    const active = insideCloudsRef.current || density > 0.001;

    if (meshRef.current) meshRef.current.visible = active;
    material.setDrift(config.cloudDrift);
    material.update(clockRef.current, density);

    // Skip the per-instance bob loop entirely outside the transition window
    // — this is the "costs nothing during steady-state Space/Island dwell"
    // half of the LOD strategy (the other half is `visible` above).
    if (!active || !meshRef.current) return;

    const mesh = meshRef.current;
    const m = new THREE.Matrix4();
    for (let i = 0; i < config.cloudCardCount; i++) {
      const phase = tube.aPhase[i];
      const bobY = Math.sin(clockRef.current * 0.4 + phase) * 1.2;
      const bobX = Math.cos(clockRef.current * 0.3 + phase) * 0.8;
      m.makeTranslation(
        tube.basePositions[i * 3] + bobX,
        tube.basePositions[i * 3 + 1] + bobY,
        tube.basePositions[i * 3 + 2]
      );
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, config.cloudCardCount]}
      // Custom vertex shader offsets cards in view-space for billboarding,
      // which isn't reflected in the CPU-computed bounding volume — disable
      // frustum culling to avoid cards popping out at screen edges.
      frustumCulled={false}
    />
  );
}