// components/World/Transition/CloudTransition.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useWorldState } from "@/components/World/WorldState";
import { ISLAND_ENDPOINT, SPACE_ENDPOINT, SPACE_ZOOM_ENDPOINT, easeInOutCubic } from "@/components/World/WorldTimeline";
import {
  useTransitionManager,
  buildCloudCorridor,
  sampleCloudCorridor,
  remapCloudProgress,
  computeCloudDensity,
  CloudCorridor,
} from "@/components/World/Transition/TransitionManager";
import CloudField from "./CloudField";

const ORIGIN = new THREE.Vector3(0, 0, 0); // matches SPACE_ENDPOINT.lookAt
const ISLAND_POS = new THREE.Vector3(...ISLAND_ENDPOINT.position);
const ISLAND_LOOKAT = new THREE.Vector3(...ISLAND_ENDPOINT.lookAt);
const SPACE_ZOOM_POS = new THREE.Vector3(...SPACE_ZOOM_ENDPOINT.position);

const MAX_FOG_DENSITY = 0.045; // tune to taste — higher = the world gets swallowed faster
const FOG_COLOR = new THREE.Color("#c7d3e8");

type CorridorSession = {
  direction: "toIsland" | "toSpace";
  snapshotProgress: number; // worldProgress at the exact instant this session was captured
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

  // Snapshot corridor endpoints exactly once per phase transition — NOT on
  // a progress threshold. This is the fix for an asymmetry that isn't
  // obvious at first: TRANSITION_TO_ISLAND always begins at a fixed
  // worldProgress (ENTER_ISLAND_THRESHOLD, in WorldCamera), but
  // TRANSITION_TO_SPACE begins whenever the user zooms out on Island via
  // CameraControls distance — an arbitrary gesture, not a progress value.
  // Keying off `phase` (rather than progress) is the only way to correctly
  // capture direction and a valid "current position" for both cases.
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    const enteringToIsland = phase === "TRANSITION_TO_ISLAND" && prev !== "TRANSITION_TO_ISLAND";
    const enteringToSpace = phase === "TRANSITION_TO_SPACE" && prev !== "TRANSITION_TO_SPACE";
    if (!enteringToIsland && !enteringToSpace) return;

    const startPos = camera.position.clone();
    const startFov = "fov" in camera ? (camera as THREE.PerspectiveCamera).fov : SPACE_ENDPOINT.fov;
    const snapshotProgress = progressRef.current;

    if (enteringToIsland) {
      setSession({
        direction: "toIsland",
        snapshotProgress,
        start: startPos,
        end: ISLAND_POS.clone(),
        startLookAt: ORIGIN.clone(),
        endLookAt: ISLAND_LOOKAT.clone(),
        startFov,
        endFov: ISLAND_ENDPOINT.fov,
      });
    } else {
      setSession({
        direction: "toSpace",
        snapshotProgress,
        start: startPos,
        end: SPACE_ZOOM_POS.clone(),
        startLookAt: ISLAND_LOOKAT.clone(),
        endLookAt: ORIGIN.clone(),
        startFov,
        endFov: SPACE_ENDPOINT.fov,
      });
    }
  }, [phase, camera, progressRef]);

  // Rebuilt only when a new session is captured (rare — once per crossing),
  // not every frame. CloudField independently rebuilds an equivalent curve
  // from the same start/end/lift inputs for its own tube placement; this is
  // a deliberate, cheap duplication in exchange for keeping the two files
  // decoupled (see CloudField's contract: it takes start/end as props, not
  // a shared curve object).
  const corridor: CloudCorridor | null = useMemo(() => {
    if (!session) return null;
    return buildCloudCorridor(session.start, session.end, config.cloudLayerHeight);
  }, [session, config.cloudLayerHeight]);

  // Take ownership of scene.fog. Native fog is what sells "thin clouds
  // appear ahead" BEFORE a corridor even exists — density can start rising
  // from cloudEntryProgress while still in SPACE phase (pure foreshadowing,
  // no geometry needed), and it keeps backing up the volumetric CloudField
  // cards once those become active. If some other system starts setting
  // scene.fog later, this will silently fight it — flag if that happens.
  useEffect(() => {
    if (!scene.fog) scene.fog = new THREE.FogExp2(FOG_COLOR.getHex(), 0);
    return () => {
      if (scene.fog instanceof THREE.FogExp2 && scene.fog.color.getHex() === FOG_COLOR.getHex()) {
        scene.fog = null;
      }
    };
  }, [scene]);

  // Default load trigger: precompiles every material's GPU program while
  // Island is still invisible. This supersedes the standalone
  // IslandPrewarm.tsx from earlier — remove that file/import once this is
  // wired in, since it did the same job with a hardcoded progress check
  // instead of the proper density/loadThreshold gate below.
  useEffect(() => {
    return registerLoadTrigger(() => {
      gl.compile(scene, camera);
    });
  }, [registerLoadTrigger, gl, scene, camera]);

  useFrame(() => {
    const progress = progressRef.current;

    // Fog/visibility window — broad, and intentionally NOT tied to the
    // actual phase flip. This lets density start climbing while still in
    // SPACE (foreshadowing) well before the real position-jump begins.
    const localT = remapCloudProgress(progress, config);
    const density = computeCloudDensity(localT, assetsReady, config);
    densityRef.current = density;

    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.density = density * MAX_FOG_DENSITY;
    }

    if (density >= config.loadThreshold) fireLoadTriggersOnce();

    // Camera-control handoff — strictly phase-based. This is what
    // WorldCamera (next file) will check to decide whether to source the
    // camera transform from getWorldCameraState (unchanged) or from
    // corridorRef (new).
    const insideClouds = (phase === "TRANSITION_TO_ISLAND" || phase === "TRANSITION_TO_SPACE") && !!session;    
    insideCloudsRef.current = insideClouds;

    if (!insideClouds || !session || !corridor) return;

    // Re-base progress into corridor-local space so u=0 lands exactly on
    // the snapshot position (no pop) regardless of which raw worldProgress
    // value the snapshot happened to occur at.
    const denom =
      session.direction === "toIsland"
        ? Math.max(1e-4, 1 - session.snapshotProgress)
        : Math.max(1e-4, session.snapshotProgress);
    const raw =
      session.direction === "toIsland"
        ? (progress - session.snapshotProgress) / denom
        : (session.snapshotProgress - progress) / denom;
    const corridorU = THREE.MathUtils.clamp(raw, 0, 1);

    corridorRef.current = sampleCloudCorridor(
      corridor,
      easeInOutCubic(corridorU),
      session.startLookAt,
      session.endLookAt,
      session.startFov,
      session.endFov,
      config.maxBankDeg
    );
  });

  // Deliberately left mounted (just invisible, via CloudField's own density
  // gate) rather than unmounted between crossings — mirrors LODGroup's
  // existing "toggle visible, never destroy" philosophy elsewhere in this
  // codebase, and avoids re-allocating instance buffers every scroll
  // back-and-forth.
  return session && corridor ? <CloudField start={session.start} end={session.end} /> : null;
}