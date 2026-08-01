"use client";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const { phase, progressRef } = useWorldState();
  const { config, densityRef, corridorRef, insideCloudsRef, assetsReady, registerLoadTrigger, fireLoadTriggersOnce } =
    useTransitionManager();
  const { camera, scene, gl } = useThree();
  const prevPhaseRef = useRef(phase);
  const [session, setSession] = useState<CorridorSession | null>(null);
  const sessionRef = useRef<CorridorSession | null>(null);

  // The corridor is created once and retained for the whole visit. Progress
  // samples that exact path in either direction, so arriving at Space never
  // regenerates the cloud cards or restarts their animation.
  useEffect(() => {
    const previousPhase = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    const enteringTransition =
      (phase === "TRANSITION_TO_ISLAND" && previousPhase !== "TRANSITION_TO_ISLAND") ||
      (phase === "TRANSITION_TO_SPACE" && previousPhase !== "TRANSITION_TO_SPACE");
    if (!enteringTransition || sessionRef.current) return;

    const nextSession: CorridorSession = {
      start: SPACE_POS.clone(),
      end: ISLAND_POS.clone(),
      startLookAt: ORIGIN.clone(),
      endLookAt: ISLAND_LOOKAT.clone(),
      startFov: SPACE_ENDPOINT.fov,
      endFov: ISLAND_ENDPOINT.fov,
    };
    sessionRef.current = nextSession;
    setSession(nextSession);
  }, [phase]);

  const corridor: CloudCorridor | null = useMemo(() => {
    if (!session) return null;
    return buildCloudCorridor(session.start, session.end, config.cloudLayerHeight);
  }, [session, config.cloudLayerHeight]);

  useEffect(() => {
    if (!scene.fog) scene.fog = new THREE.FogExp2(FOG_COLOR.getHex(), 0);
    return () => {
      if (scene.fog instanceof THREE.FogExp2 && scene.fog.color.getHex() === FOG_COLOR.getHex()) scene.fog = null;
    };
  }, [scene]);

  useEffect(() => {
    return registerLoadTrigger(() => {
      gl.compile(scene, camera);
    });
  }, [registerLoadTrigger, gl, scene, camera]);

  useFrame(() => {
    const progress = progressRef.current;
    const enteringIsland = phase === "TRANSITION_TO_ISLAND";
    const leavingIsland = phase === "TRANSITION_TO_SPACE" && !!session;
    insideCloudsRef.current = enteringIsland || leavingIsland;

    // Base "wisps before the flight starts" density, entry side. Kept on its
    // own window (config.cloudEntryProgress/cloudExitProgress) independent of
    // the corridor flight window, so fog can start building before the
    // camera actually starts moving.
    let density = computeCloudDensity(remapCloudProgress(progress, config), assetsReady, config);

    if ((enteringIsland || leavingIsland) && session && corridor) {
      // Same function of raw progress drives BOTH directions — this is what
      // makes the corridor flight symmetric. arrivalT is 0 at/below
      // ENTER_ISLAND_THRESHOLD (Space-side) and 1 at full arrival
      // (Island-side), regardless of which transition phase is active.
      const arrivalT = getIslandArrivalT(progress, config.islandArrivalSpan);
      const corridorU = THREE.MathUtils.clamp(arrivalT, 0, 1);

      if (leavingIsland) {
        // Leaving uses the session density curve (max at Island-side,
        // clearing as corridorU falls back toward 0 near Space).
        density = computeSessionDensity(1 - corridorU, assetsReady, config);
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

    densityRef.current = density;
    if (scene.fog instanceof THREE.FogExp2) scene.fog.density = density * MAX_FOG_DENSITY;
    if (density >= config.loadThreshold) fireLoadTriggersOnce();
  });

  return (
    <>
      <CloudVeil />
      {session && corridor ? <CloudField start={session.start} end={session.end} /> : null}
    </>
  );
}