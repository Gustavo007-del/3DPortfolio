"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { CameraControls } from "@react-three/drei";
import { useWorldState } from "./WorldState";
import { getWorldCameraState, smoothProgress, ISLAND_ENDPOINT } from "./WorldTimeline";

// Progress point at which SPACE hands off toward ISLAND (LOD can start revealing
// Island before full arrival — avoids a hard pop at exactly p===1).
const ENTER_ISLAND_THRESHOLD = 0.85;
const ARRIVED_EPSILON = 0.001;

// Distance (CameraControls.distance) beyond which continued outward wheel scroll
// while in ISLAND triggers exit back to SPACE. Tune against Island's real scale.
const ISLAND_EXIT_DISTANCE = 40;

export default function WorldCamera() {
  const { phase, cameraOwner, setPhase, progressRef, targetProgressRef } = useWorldState();
  const controls = useThree((s) => s.controls) as CameraControls | null;
  const hasSyncedIslandEntry = useRef(false);

  // Manual CameraControls only active in ISLAND, and only while World owns the camera.
  useEffect(() => {
    if (!controls) return;
    controls.enabled = phase === "ISLAND" && cameraOwner === "world";
  }, [controls, phase, cameraOwner]);

  // One-time hard sync when CameraControls takes over, so it doesn't snap from
  // wherever World's manual writes last left the camera.
  useEffect(() => {
    if (phase === "ISLAND" && controls && !hasSyncedIslandEntry.current) {
      controls.setLookAt(
        ISLAND_ENDPOINT.position[0], ISLAND_ENDPOINT.position[1], ISLAND_ENDPOINT.position[2],
        ISLAND_ENDPOINT.lookAt[0], ISLAND_ENDPOINT.lookAt[1], ISLAND_ENDPOINT.lookAt[2],
        false
      );
      hasSyncedIslandEntry.current = true;
    }
    if (phase !== "ISLAND") hasSyncedIslandEntry.current = false;
  }, [phase, controls]);

  useFrame((state, delta) => {
    if (cameraOwner === "journey") return; // JourneyCamera's own useFrame owns the camera entirely.

    if (phase === "ISLAND") {
      if (!controls) return;
      const dist = controls.distance;
      const scrollingOut = targetProgressRef.current < progressRef.current;
      if (dist >= ISLAND_EXIT_DISTANCE && scrollingOut) setPhase("TRANSITION_TO_SPACE");
      return;
    }

    // SPACE, TRANSITION_TO_ISLAND, TRANSITION_TO_SPACE all drive the camera directly.
    progressRef.current = smoothProgress(progressRef.current, targetProgressRef.current, delta);
    const p = progressRef.current;
    const { position, lookAt, fov } = getWorldCameraState(p);
    state.camera.position.set(...position);
    state.camera.lookAt(...lookAt);
    if ("fov" in state.camera) {
      (state.camera as any).fov = fov;
      (state.camera as any).updateProjectionMatrix();
    }

    if (phase === "SPACE" && p >= ENTER_ISLAND_THRESHOLD) setPhase("TRANSITION_TO_ISLAND");
    if (phase === "TRANSITION_TO_ISLAND" && p >= 1 - ARRIVED_EPSILON) setPhase("ISLAND");
    if (phase === "TRANSITION_TO_SPACE" && p <= ARRIVED_EPSILON) setPhase("SPACE");
  });

  return null;
}