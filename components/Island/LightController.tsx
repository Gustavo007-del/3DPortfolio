"use client";

import * as THREE from "three";
import { useRef, useState, useCallback, useEffect } from "react";
import { useControls } from "leva";
import { TransformControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import LightDebugHelper from "./LightDebugHelper";

export default function LightController() {
  const { scene } = useThree();

  const lightRef = useRef<THREE.DirectionalLight | null>(null);
  const targetRef = useRef<THREE.Object3D | null>(null);
  const arrowRef = useRef<THREE.ArrowHelper | null>(null);

  const [lightObject, setLightObject] = useState<THREE.DirectionalLight | null>(null);
  const setLightRef = useCallback((node: THREE.DirectionalLight | null) => {
    lightRef.current = node;
    setLightObject(node);
  }, []);

  // B: target is now a real, gizmo-draggable object (not just position props)
  const [targetObject, setTargetObject] = useState<THREE.Object3D | null>(null);
  const setTargetRef = useCallback((node: THREE.Object3D | null) => {
    targetRef.current = node;
    setTargetObject(node);
  }, []);

  // A: widened ranges so the light can actually be pulled far away
  const [{ posX, posY, posZ, intensity, color }, setLightControls] = useControls(
    "Directional Light",
    () => ({
      posX: { value: 1552, min: -3000, max: 3000, step: 1 },
      posY: { value: 1091, min: -3000, max: 3000, step: 1 },
      posZ: { value: 108, min: -3000, max: 3000, step: 1 },
      intensity: { value: 4.7, min: 0, max: 10, step: 0.1 },
      color: "#ffb865",
    })
  );

  const [{ targetX, targetY, targetZ }, setTargetControls] = useControls(
    "Light Target",
    () => ({
      targetX: { value: 386.9, min: -3000, max: 3000, step: 0.1 },
      targetY: { value: -0.3, min: -3000, max: 3000, step: 0.1 },
      targetZ: { value: -14.7, min: -3000, max: 3000, step: 0.1 },
    })
  );

  // Bias tuning note: `bias` operates in normalized shadow-map depth
  // space, so its effective strength scales with near/far. `normalBias`
  // offsets along the surface normal in world units instead, so it stays
  // predictable even as near/far change. Try normalBias first for acne;
  // fall back to bias only if you still see peter-panning.
  const { left, right, top, bottom, near, far, bias, normalBias } = useControls("Key Shadow Camera", {
    left: { value: -630, min: -1500, max: 0, step: 10 },
    right: { value: 790, min: 0, max: 1500, step: 10 },
    top: { value: 730, min: 0, max: 1500, step: 10 },
    bottom: { value: -870, min: -1500, max: 0, step: 10 },
    near: { value: 0.1, min: 0.1, max: 100, step: 0.1 },
    far: { value: 2290, min: 100, max: 3000, step: 10 },
    bias: { value: -0.0005, min: -0.05, max: 0.05, step: 0.0005 },
    normalBias: { value: 0, min: 0, max: 20, step: 0.1 },
  });

  const { showGizmo, showTargetGizmo, showDirectionArrow } = useControls("Key Light Debug", {
    showGizmo: false,
    showTargetGizmo: false,
    showDirectionArrow: false,
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

  // Dragging the LIGHT gizmo writes position back into Leva
  const handleLightGizmoChange = useCallback(() => {
    if (!lightRef.current) return;
    const { x, y, z } = lightRef.current.position;
    setLightControls({
      posX: Math.round(x * 100) / 100,
      posY: Math.round(y * 100) / 100,
      posZ: Math.round(z * 100) / 100,
    });
  }, [setLightControls]);

  // Dragging the TARGET gizmo writes target position back into Leva
  const handleTargetGizmoChange = useCallback(() => {
    if (!targetRef.current) return;
    const { x, y, z } = targetRef.current.position;
    setTargetControls({
      targetX: Math.round(x * 100) / 100,
      targetY: Math.round(y * 100) / 100,
      targetZ: Math.round(z * 100) / 100,
    });
  }, [setTargetControls]);

  // C: visible arrow from light position -> target, so "where light comes
  // from" is obvious at a glance instead of having to infer it from the
  // shadow-camera box.
  useEffect(() => {
    if (!showDirectionArrow) return;

    const from = new THREE.Vector3(posX, posY, posZ);
    const to = new THREE.Vector3(targetX, targetY, targetZ);
    const dir = new THREE.Vector3().subVectors(to, from);
    const length = dir.length() || 1;
    dir.normalize();

    const arrow = new THREE.ArrowHelper(dir, from, length, 0xff3b30, length * 0.08, length * 0.04);
    arrowRef.current = arrow;
    scene.add(arrow);

    return () => {
      scene.remove(arrow);
      arrow.dispose();
      arrowRef.current = null;
    };
  }, [posX, posY, posZ, targetX, targetY, targetZ, showDirectionArrow, scene]);

  return (
    <>
      <directionalLight
        ref={setLightRef}
        position={[posX, posY, posZ]}
        intensity={intensity}
        color={color}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={bias}
        shadow-normalBias={normalBias}
        target={targetObject || undefined}
      />
      <object3D ref={setTargetRef} position={[targetX, targetY, targetZ]} />

      {showGizmo && lightObject && (
        <TransformControls object={lightObject} mode="translate" onObjectChange={handleLightGizmoChange} />
      )}

      {showTargetGizmo && targetObject && (
        <TransformControls object={targetObject} mode="translate" onObjectChange={handleTargetGizmoChange} />
      )}

      <LightDebugHelper light={lightObject} label="Key Light Debug" />
    </>
  );
}