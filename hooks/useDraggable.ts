// hooks/useDraggable.ts
"use client";
import { useRef, useCallback } from "react";
import { useThree, ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

const SPRING_BACK_SPEED = 4;

export function useDraggable() {
  const { camera, size } = useThree();
  const offsetRef = useRef(new THREE.Vector3());
  const isDragging = useRef(false);
  const dragPlane = useRef(new THREE.Plane());
  const orbitalPosAtStart = useRef(new THREE.Vector3()); // object's non-dragged (orbit) position when drag began
  const raycaster = useRef(new THREE.Raycaster());

  const applyOffset = useCallback((obj: THREE.Object3D, delta: number) => {
    if (!isDragging.current) {
      const t = 1 - Math.exp(-SPRING_BACK_SPEED * delta);
      offsetRef.current.lerp(new THREE.Vector3(0, 0, 0), t);
    }
    obj.position.add(offsetRef.current);
  }, []);

  function ndcFromEvent(e: ThreeEvent<PointerEvent>) {
    return new THREE.Vector2(
      (e.nativeEvent.offsetX / size.width) * 2 - 1,
      -(e.nativeEvent.offsetY / size.height) * 2 + 1
    );
  }

  function onPointerDown(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    (e.target as any)?.setPointerCapture?.(e.pointerId);
    isDragging.current = true;

    // Record the object's CURRENT rendered world position (orbit position +
    // whatever offset already existed, e.g. mid spring-back) as the
    // reference point — this is what "sticky" is measured against.
    const worldPos = new THREE.Vector3();
    (e.eventObject as THREE.Object3D).getWorldPosition(worldPos);
    orbitalPosAtStart.current.copy(worldPos).sub(offsetRef.current); // subtract out current offset to get the pure orbit position

    // Plane faces the camera, fixed at the object's depth — built ONCE here
    // and never recomputed during the drag. Recomputing it every
    // pointermove (from a live camera.getWorldDirection) was almost
    // certainly what caused the "jet": the plane itself shifting slightly
    // each frame compounds with intersection math and can send the
    // intersection point flying at glancing angles.
    const planeNormal = new THREE.Vector3();
    camera.getWorldDirection(planeNormal);
    dragPlane.current.setFromNormalAndCoplanarPoint(planeNormal, worldPos);

    raycaster.current.setFromCamera(ndcFromEvent(e), camera);
  }

  function onPointerMove(e: ThreeEvent<PointerEvent>) {
    if (!isDragging.current) return;
    e.stopPropagation();

    raycaster.current.setFromCamera(ndcFromEvent(e), camera);
    const hit = new THREE.Vector3();
    const didHit = raycaster.current.ray.intersectPlane(dragPlane.current, hit);
    if (!didHit) return; // ray parallel to plane this frame — just skip, keep last offset rather than jumping

    // True 1:1 sticky drag: offset = where the pointer now points on the
    // fixed plane, minus the object's original (pre-drag) orbit position.
    offsetRef.current.copy(hit).sub(orbitalPosAtStart.current);
  }

  function onPointerUp(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    isDragging.current = false;
  }

  return { applyOffset, onPointerDown, onPointerMove, onPointerUp, isDragging };
}