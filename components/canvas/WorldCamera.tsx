"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CameraControls } from "@react-three/drei";
import { useWorldState } from "@/components/World/WorldState";
import {
  getWorldCameraState,
  smoothProgress,
  getIdleCloudDrift,
  ISLAND_ENDPOINT,
  SPACE_ENDPOINT,
  SPACE_ZOOM_ENDPOINT,
  ENTER_ISLAND_THRESHOLD,
  getIslandArrivalT,
} from "@/components/World//WorldTimeline";
import { useJourney } from "@/components/Journey/JourneyProvider";
import { useTransitionManager } from "@/components/World/Transition/TransitionManager";
import { computeLookAtQuaternion } from "@/components/Journey/cameraHelpers";

const ARRIVED_EPSILON = 0.001;
const SCROLL_DIRECTION_EPSILON = 0.0001;

// Distance (CameraControls.distance) beyond which continued outward wheel scroll
// while in ISLAND triggers exit back to SPACE. Tune against Island's real scale.
const ISLAND_EXIT_DISTANCE = 40;

// Drag-to-orbit tuning (SPACE phase only — mirrors the old OrbitControls feel
// from app/animate/page.tsx: autoRotate + drag override + polar clamp).
const DRAG_SENSITIVITY = 0.005;
const AUTO_ROTATE_SPEED = 0.05; // rad/sec, only while idle
const POLAR_CLAMP = 0.15; // keeps camera from flipping over Sun's poles

export default function WorldCamera() {
  const { phase, cameraOwner, setPhase, setCameraOwner, progressRef, targetProgressRef } = useWorldState();
  const { corridorRef, insideCloudsRef, assetsReady ,config } = useTransitionManager();
  const controls = useThree((s) => s.controls) as CameraControls | null;
  const gl = useThree((s) => s.gl);
  const hasSyncedIslandEntry = useRef(false);
const { started, isTransitioning } = useJourney();

  // Base spherical (angles only) from SPACE_ENDPOINT — drag/auto-rotate offsets
  // apply to these angles, then get combined with each endpoint's own radius,
  // so the wide and zoomed-in Space positions always rotate together.
  const baseSpherical = useRef(
    new THREE.Spherical().setFromVector3(new THREE.Vector3(...SPACE_ENDPOINT.position))
  );
  const zoomRadius = useRef(new THREE.Vector3(...SPACE_ZOOM_ENDPOINT.position).length());
  const dragTheta = useRef(0);
  const dragPhi = useRef(0);
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Local "how long have we been holding, awaiting assetsReady" clock — reset
  // to 0 the instant we're not holding, so the idle drift always eases in
  // from zero each time rather than resuming mid-wave from a stale value.
  const holdElapsedRef = useRef(0);

  // The one sanctioned World<->Journey coupling point: read Journey's `started`
  // flag only (never chapter data), flip camera ownership accordingly.
  useEffect(() => {
    setCameraOwner(started ? "journey" : "world");
  }, [started, setCameraOwner]);

  // Manual CameraControls only active in ISLAND, and only while World owns the camera.
  useEffect(() => {
    if (!controls) return;
    controls.enabled = phase === "ISLAND" && started && !isTransitioning;
}, [controls, phase, started, isTransitioning]);

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

  // Manual drag-orbit for SPACE — CameraControls is disabled here so this never
  // fights it; both simply never run at the same time (see effect above).
  useEffect(() => {
    const el = gl.domElement;
    function onPointerDown(e: PointerEvent) {
      if (phaseRef.current !== "SPACE") return;
      isDragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }
    function onPointerMove(e: PointerEvent) {
      if (!isDragging.current || phaseRef.current !== "SPACE") return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      dragTheta.current -= dx * DRAG_SENSITIVITY;
      dragPhi.current = Math.max(
        POLAR_CLAMP - baseSpherical.current.phi,
        Math.min(Math.PI - POLAR_CLAMP - baseSpherical.current.phi, dragPhi.current - dy * DRAG_SENSITIVITY)
      );
    }
    function onPointerUp() {
      isDragging.current = false;
    }
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [gl]);

  useFrame((state, delta) => {
    if (cameraOwner === "journey") return; // JourneyCamera's own useFrame owns the camera entirely.

    if (phase === "ISLAND") {
      // Until "Begin Journey" is selected, Island is a reversible stop on
      // the world scroll rather than a terminal state.
      if (!started && targetProgressRef.current + SCROLL_DIRECTION_EPSILON < progressRef.current) {
        setPhase("TRANSITION_TO_SPACE");
        return;
      }

      if (!controls) return;
      const dist = controls.distance;
      const scrollingOut = targetProgressRef.current < progressRef.current;
      if (dist >= ISLAND_EXIT_DISTANCE && scrollingOut) setPhase("TRANSITION_TO_SPACE");
      return;
    }

    // Keep the world crossing reversible while the landing screen is active.
    // Journey mode deliberately bypasses this: it owns the camera and locks
    // world scrolling after the user explicitly starts it.
    if (!started) {
      if (
        phase === "TRANSITION_TO_ISLAND" &&
        targetProgressRef.current + SCROLL_DIRECTION_EPSILON < progressRef.current
      ) {
        setPhase("TRANSITION_TO_SPACE");
        return;
      }
      if (
        phase === "TRANSITION_TO_SPACE" &&
        targetProgressRef.current > progressRef.current + SCROLL_DIRECTION_EPSILON
      ) {
        setPhase("TRANSITION_TO_ISLAND");
        return;
      }
    }

    // Idle auto-rotate, matching the old OrbitControls autoRotate feel — pauses
    // the moment the user drags, resumes the moment they release. Only visually
    // relevant pre-cloud (the corridor branch below ignores rotatedSpacePos).
    if (phase === "SPACE" && !isDragging.current) dragTheta.current += AUTO_ROTATE_SPEED * delta;

    const theta = baseSpherical.current.theta + dragTheta.current;
    const phi = baseSpherical.current.phi + dragPhi.current;
    const rotatedSpacePos = new THREE.Vector3().setFromSpherical(
      new THREE.Spherical(baseSpherical.current.radius, phi, theta)
    );
    const rotatedZoomPos = new THREE.Vector3().setFromSpherical(
      new THREE.Spherical(zoomRadius.current, phi, theta)
    );

    progressRef.current = smoothProgress(progressRef.current, targetProgressRef.current, delta);
    const p = progressRef.current;

    if (insideCloudsRef.current && phase === "TRANSITION_TO_ISLAND") {
      // Entering Island: camera holds perfectly still at Island's resting
      // endpoint for the ENTIRE crossing. No corridor flight, no zoom in/out —
      // only cloud density (driven by CloudTransition) animates, so scrolling
      // back and forth never moves the destination scene, it only reveals or
      // hides it behind cloud cover.
      state.camera.position.set(...ISLAND_ENDPOINT.position);
      state.camera.lookAt(...ISLAND_ENDPOINT.lookAt);
      if ("fov" in state.camera) {
        (state.camera as any).fov = ISLAND_ENDPOINT.fov;
        (state.camera as any).updateProjectionMatrix();
      }
    } else if (insideCloudsRef.current) {
      // Leaving Island (TRANSITION_TO_SPACE) — unchanged corridor flight.
      const { position, lookAt, fov, bank } = corridorRef.current;

      const holding = !assetsReady;
      holdElapsedRef.current = holding ? holdElapsedRef.current + delta : 0;
      const drift = holding ? getIdleCloudDrift(holdElapsedRef.current) : ([0, 0, 0] as [number, number, number]);

      const finalPos = new THREE.Vector3(position[0] + drift[0], position[1] + drift[1], position[2] + drift[2]);
      const lookAtVec = new THREE.Vector3(lookAt[0], lookAt[1], lookAt[2]);

      state.camera.position.copy(finalPos);
      if (Math.abs(bank) > 0.0005) {
        state.camera.quaternion.copy(computeLookAtQuaternion(finalPos, lookAtVec, bank));
      } else {
        state.camera.lookAt(lookAtVec);
      }
      if ("fov" in state.camera) {
        (state.camera as any).fov = fov;
        (state.camera as any).updateProjectionMatrix();
      }
    } else {
      // Unchanged: plain SPACE-phase zoom/rotate, exactly as before.
      const { position, lookAt, fov } = getWorldCameraState(
        p,
        [rotatedSpacePos.x, rotatedSpacePos.y, rotatedSpacePos.z],
        [rotatedZoomPos.x, rotatedZoomPos.y, rotatedZoomPos.z]
      );
      state.camera.position.set(...position);
      state.camera.lookAt(...lookAt);
      if ("fov" in state.camera) {
        (state.camera as any).fov = fov;
        (state.camera as any).updateProjectionMatrix();
      }
    }

    if (phase === "SPACE" && p >= ENTER_ISLAND_THRESHOLD) setPhase("TRANSITION_TO_ISLAND");
if (phase === "TRANSITION_TO_ISLAND") {
  const arrivalT = getIslandArrivalT(p, config.islandArrivalSpan);
  if (arrivalT >= 1 - ARRIVED_EPSILON && assetsReady) setPhase("ISLAND");
}
if (phase === "TRANSITION_TO_SPACE" && p <= ARRIVED_EPSILON) setPhase("SPACE");
  });

  return null;
}
