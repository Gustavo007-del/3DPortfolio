// components/Island/boat-ride/BoatRideCamera.tsx
//
// Third-person chase camera (PLAN.md §9). Mounted ONLY while a ride is
// active (BoatRideCameraGate in IslandScene) — while it is mounted, every
// other camera writer is unmounted by WorldManager/Nwisland (§2.1), so this
// is the single owner of the shared camera.
//
//  - entering: smootherstep lerp from the snapshot pose (captured in
//    startRide before anything moved) to the live chase pose (§9.2)
//  - riding: damped chase rig (frame-rate independent 1 − exp(−λ·dt), §9.3)
//  - exiting: same easing from the current pose back to the snapshot, then
//    an exact restore + finishRide (§9.4/§9.1)
// Reduced motion: short transitions, no FOV boost.

"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RIDE, boatKindOf, prefersReducedMotion } from "./boatRideConfig";
import {
  getRideState,
  markRiding,
  finishRide,
  applySnapshot,
  ridePose,
} from "./boatRideStore";

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export default function BoatRideCamera() {
  const { camera } = useThree();

  const st = useRef({
    enterT: 0,
    exitT: 0,
    exitCaptured: false,
    reduced: false,
    enterSec: RIDE.camera.enterSec as number,
    exitSec: RIDE.camera.exitSec as number,
    // exit tween start pose (captured on the first exiting frame)
    startX: 0, startY: 0, startZ: 0,
    startQuat: new THREE.Quaternion(),
    startFov: 50,
    // persistent chase damping state
    camPos: new THREE.Vector3(),
    camLook: new THREE.Vector3(),
    // scratch (preallocated)
    snapPos: new THREE.Vector3(),
    snapQuat: new THREE.Quaternion(),
    desired: new THREE.Vector3(),
    desiredLook: new THREE.Vector3(),
    ctrl: new THREE.Vector3(),
    m: new THREE.Matrix4(),
    chaseQuat: new THREE.Quaternion(),
    dir: new THREE.Vector3(),
  }).current;

  useEffect(() => {
    st.reduced = prefersReducedMotion();
    st.enterSec = st.reduced ? RIDE.camera.reducedEnterSec : RIDE.camera.enterSec;
    st.exitSec = st.reduced ? RIDE.camera.reducedExitSec : RIDE.camera.exitSec;
    // Seed the damping state from the current view (hot-reload safety).
    st.camPos.copy(camera.position);
    camera.getWorldDirection(st.dir);
    st.camLook.copy(camera.position).addScaledVector(st.dir, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  const setFov = (v: number) => {
    const persp = camera as THREE.PerspectiveCamera;
    if (typeof persp.fov !== "number") return;
    if (Math.abs(persp.fov - v) > 0.01) {
      persp.fov = v;
      persp.updateProjectionMatrix();
    }
  };

  useFrame((_state, delta) => {
    const { phase, snapshot: snap, boatId } = getRideState();
    if (!snap) return;
    const C = RIDE.camera;
    const dt = Math.min(delta, 0.25); // frame-drop safety (still real-time-y at low fps)

    st.snapPos.set(snap.px, snap.py, snap.pz);
    st.snapQuat.set(snap.qx, snap.qy, snap.qz, snap.qw);

    const bx = Math.sin(ridePose.heading);
    const bz = Math.cos(ridePose.heading);
    st.desired.set(
      ridePose.x - bx * C.dist,
      RIDE.waterY + C.height,
      ridePose.z - bz * C.dist
    );
    st.desiredLook.set(
      ridePose.x + bx * C.lookAhead,
      RIDE.waterY + C.lookHeight,
      ridePose.z + bz * C.lookAhead
    );
    if (st.desired.y < RIDE.minCamY) st.desired.y = RIDE.minCamY;

    const params = RIDE.boats[boatKindOf(boatId ?? "")];
    const speed01 = Math.min(Math.abs(ridePose.speed) / params.maxFwd, 1);
    const chaseFov = C.fovBase + (st.reduced ? 0 : C.fovBoost * speed01);    if (phase === "entering") {
      st.enterT = Math.min(1, st.enterT + dt / st.enterSec);
      const t = smootherstep(st.enterT);
      st.m.lookAt(st.desired, st.desiredLook, THREE.Object3D.DEFAULT_UP);
      st.chaseQuat.setFromRotationMatrix(st.m);
      // Quadratic Bézier arc lifted over the island (C.arcLift): the straight
      // line from the journey view to a far-side boat cut through the fort —
      // the camera ended up inside the island mid-flight.
      const u = 1 - t;
      st.ctrl.set(
        (st.snapPos.x + st.desired.x) / 2,
        Math.max(st.snapPos.y, st.desired.y) + C.arcLift,
        (st.snapPos.z + st.desired.z) / 2
      );
      camera.position.set(
        u * u * st.snapPos.x + 2 * u * t * st.ctrl.x + t * t * st.desired.x,
        u * u * st.snapPos.y + 2 * u * t * st.ctrl.y + t * t * st.desired.y,
        u * u * st.snapPos.z + 2 * u * t * st.ctrl.z + t * t * st.desired.z
      );
      camera.quaternion.slerpQuaternions(
        st.snapQuat,
        st.chaseQuat,
        t
      );
      setFov(snap.fov + (chaseFov - snap.fov) * t);
      if (st.enterT >= 1) {
        st.camPos.copy(st.desired);
        st.camLook.copy(st.desiredLook);
        markRiding(); // input starts being read by the controller
      }
      return;
    }

    if (phase === "riding") {
      const kp = 1 - Math.exp(-C.posLambda * dt);
      const kl = 1 - Math.exp(-C.lookLambda * dt);
      st.camPos.lerp(st.desired, kp);
      st.camLook.lerp(st.desiredLook, kl);
      if (st.camPos.y < RIDE.minCamY) st.camPos.y = RIDE.minCamY;
      camera.position.copy(st.camPos);
      camera.lookAt(st.camLook);
      // Tiny collision shake (§7.2) — skipped entirely under reduced motion.
      if (ridePose.shake > 0.0005 && !st.reduced) {
        camera.position.x += (Math.random() - 0.5) * ridePose.shake;
        camera.position.y += (Math.random() - 0.5) * ridePose.shake;
      }
      ridePose.shake *= Math.exp(-8 * dt);
      const targetFov = chaseFov;
      const persp = camera as THREE.PerspectiveCamera;
      if (typeof persp.fov === "number") {
        const next =
          persp.fov + (targetFov - persp.fov) * (1 - Math.exp(-C.fovLambda * dt));
        setFov(next);
      }
      return;
    }

    if (phase === "exiting") {
      if (!st.exitCaptured) {
        st.exitCaptured = true;
        st.exitT = 0;
        st.startX = camera.position.x;
        st.startY = camera.position.y;
        st.startZ = camera.position.z;
        st.startQuat.copy(camera.quaternion);
        const persp = camera as THREE.PerspectiveCamera;
        st.startFov = typeof persp.fov === "number" ? persp.fov : snap.fov;
      }
      st.exitT = Math.min(1, st.exitT + dt / st.exitSec);
      const t = smootherstep(st.exitT);
      // Same arc on the way back so the return flight clears the island too.
      const u = 1 - t;
      st.ctrl.set(
        (st.startX + st.snapPos.x) / 2,
        Math.max(st.startY, st.snapPos.y) + C.arcLift,
        (st.startZ + st.snapPos.z) / 2
      );
      camera.position.set(
        u * u * st.startX + 2 * u * t * st.ctrl.x + t * t * st.snapPos.x,
        u * u * st.startY + 2 * u * t * st.ctrl.y + t * t * st.snapPos.y,
        u * u * st.startZ + 2 * u * t * st.ctrl.z + t * t * st.snapPos.z
      );
      camera.quaternion.slerpQuaternions(
        st.startQuat,
        st.snapQuat,
        t
      );
      setFov(st.startFov + (snap.fov - st.startFov) * t);
      if (st.exitT >= 1) {
        // Exact restore (pose + fov/near/far/zoom) BEFORE the state flips to
        // idle, then finish: reseed the boat, remount the previous camera
        // system from exactly this pose (§9.1).
        applySnapshot(camera, snap);
        finishRide();
      }
    }
  });

  return null;
}
