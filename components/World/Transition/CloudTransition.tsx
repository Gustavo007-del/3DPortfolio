"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import CloudVeil from "@/components/World/Transition/CloudVeil";
import { useWorldState } from "@/components/World/WorldState";
import {
  ISLAND_ENDPOINT,
  SPACE_ENDPOINT,
  SPACE_ZOOM_ENDPOINT,
  easeInOutCubic,
  getIslandArrivalT,
  smoothProgress,
  SCROLL_FOLLOW_SPEED,
} from "@/components/World/WorldTimeline";
import {
  useTransitionManager,
  buildCloudCorridor,
  sampleCloudCorridor,
  remapCloudProgress,
  computeCloudDensity,
  computeSessionDensity,
  CloudCorridor,
} from "@/components/World/Transition/TransitionManager";
import CloudField from "./CloudField";

const ORIGIN = new THREE.Vector3(0, 0, 0);
// Anchored to the ZOOM endpoint, not SPACE_ENDPOINT — by the time progress
// crosses ENTER_ISLAND_THRESHOLD, the Space-phase zoom has already carried
// the camera to SPACE_ZOOM_ENDPOINT (close to the Sun). Using the wide
// establishing-shot position here caused a large position snap right at the
// SPACE <-> transition boundary, in both directions (same shared corridor).
const SPACE_POS = new THREE.Vector3(...SPACE_ZOOM_ENDPOINT.position);
const ISLAND_POS = new THREE.Vector3(...ISLAND_ENDPOINT.position);
const ISLAND_LOOKAT = new THREE.Vector3(...ISLAND_ENDPOINT.lookAt);
const MAX_FOG_DENSITY = 0.045;
const FOG_COLOR = new THREE.Color("#c7d3e8");

type CorridorSession = {
  start: THREE.Vector3;
  end: THREE.Vector3;
  startLookAt: THREE.Vector3;
  endLookAt: THREE.Vector3;
  startFov: number;
  endFov: number;
};

export default function CloudTransition() {
  const { phase, cameraOwner, roaming, progressRef, targetProgressRef } = useWorldState();
  const { config, densityRef, corridorRef, insideCloudsRef, assetsReady, returnSceneIsIsland, setReturnSceneIsIsland, registerLoadTrigger, fireLoadTriggersOnce } =
    useTransitionManager();
  const { camera, scene, gl } = useThree();
  // Build the stable route before either crossing. Creating it in an effect
  // after the phase flip left one or two frames with no sampled camera path.
  const session = useMemo<CorridorSession>(() => ({
      start: SPACE_POS.clone(),
      end: ISLAND_POS.clone(),
      startLookAt: ORIGIN.clone(),
      endLookAt: ISLAND_LOOKAT.clone(),
      startFov: SPACE_ENDPOINT.fov,
      endFov: ISLAND_ENDPOINT.fov,
  }), []);

  const corridor: CloudCorridor = useMemo(() => {
    return buildCloudCorridor(session.start, session.end, config.cloudLayerHeight);
  }, [session, config.cloudLayerHeight]);
  const cloudFog = useMemo(() => new THREE.FogExp2(FOG_COLOR.getHex(), 0), []);

  useEffect(() => {
    if (!scene.fog) scene.fog = cloudFog;
    return () => {
      if (scene.fog === cloudFog) scene.fog = null;
    };
  }, [scene, cloudFog]);

  useEffect(() => {
    return registerLoadTrigger(async () => {
      await gl.compileAsync(scene, camera);
    });
  }, [registerLoadTrigger, gl, scene, camera]);

  useFrame((_, delta) => {
    // Island's steady linear fog owns the scene only while settled there.
    // Reattach this exact FogExp2 after its <fog> unmounts on the return trip.
    if (phase !== "ISLAND" && scene.fog !== cloudFog) scene.fog = cloudFog;
    // Sample clouds and camera from the same progress value in the same frame.
    // A negative priority runs this before WorldCamera without taking over rendering.
    if (cameraOwner === "world" && !roaming && phase !== "ISLAND") {
      progressRef.current = smoothProgress(
        progressRef.current, targetProgressRef.current, Math.min(delta, 0.05), SCROLL_FOLLOW_SPEED
      );
    }
    const progress = progressRef.current;
    const enteringIsland = phase === "TRANSITION_TO_ISLAND";
    const leavingIsland = phase === "TRANSITION_TO_SPACE";
    insideCloudsRef.current = enteringIsland || leavingIsland;

    // Base "wisps before the flight starts" density, entry side. Kept on its
    // own window (config.cloudEntryProgress/cloudExitProgress) independent of
    // the corridor flight window, so fog can start building before the
    // camera actually starts moving.
    let density = computeCloudDensity(remapCloudProgress(progress, config), assetsReady, config);

    if (enteringIsland || leavingIsland) {
      // Same function of raw progress drives BOTH directions — this is what
      // makes the corridor flight symmetric. arrivalT is 0 at/below
      // ENTER_ISLAND_THRESHOLD (Space-side) and 1 at full arrival
      // (Island-side), regardless of which transition phase is active.
      const arrivalT = getIslandArrivalT(progress, config.islandArrivalSpan);
      const corridorU = THREE.MathUtils.clamp(arrivalT, 0, 1);

      if (leavingIsland) {
        // Build opacity while leaving Island, then swap scene at full cover.
        density = computeSessionDensity(corridorU, assetsReady, config);
      }

      corridorRef.current = sampleCloudCorridor(
        corridor,
        easeInOutCubic(corridorU),
        session.startLookAt,
        session.endLookAt,
        session.startFov,
        session.endFov,
        config.maxBankDeg
      );
    }

    // An async compile can finish after the player reaches the far edge. Fade
    // the mask down over frames instead of exposing the scene in one white flash.
    const previousDensity = densityRef.current;
    densityRef.current = density < previousDensity
      ? Math.max(density, previousDensity - Math.min(delta, 0.05) * 1.8)
      : density;
    if (phase === "ISLAND" && !returnSceneIsIsland) setReturnSceneIsIsland(true);
    if (leavingIsland && returnSceneIsIsland && densityRef.current >= 0.95) {
      setReturnSceneIsIsland(false);
    }
    if (scene.fog === cloudFog) cloudFog.density = densityRef.current * MAX_FOG_DENSITY;
    if (densityRef.current >= config.loadThreshold) fireLoadTriggersOnce();
  }, -1);

  return (
    <>
      <CloudVeil />
      <CloudField start={session.start} end={session.end} />
    </>
  );
}
