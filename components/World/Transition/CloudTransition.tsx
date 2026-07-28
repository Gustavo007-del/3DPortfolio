// components/World/Transition/CloudTransition.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import CloudVeil from "@/components/World/Transition/CloudVeil";
import { useWorldState } from "@/components/World/WorldState";
import { ISLAND_ENDPOINT, SPACE_ENDPOINT, SPACE_ZOOM_ENDPOINT, easeInOutCubic, getIslandArrivalT } from "@/components/World/WorldTimeline";
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

const ORIGIN = new THREE.Vector3(0, 0, 0); // matches SPACE_ENDPOINT.lookAt
const ISLAND_POS = new THREE.Vector3(...ISLAND_ENDPOINT.position);
const ISLAND_LOOKAT = new THREE.Vector3(...ISLAND_ENDPOINT.lookAt);
const SPACE_ZOOM_POS = new THREE.Vector3(...SPACE_ZOOM_ENDPOINT.position);

const MAX_FOG_DENSITY = 0.045; // tune to taste — higher = the world gets swallowed faster
const FOG_COLOR = new THREE.Color("#c7d3e8");
const SKY_ENTRY_HEIGHT = 260; // how high above Island's resting camera the descent starts — tune to taste
const ISLAND_SKY_ENTRY = new THREE.Vector3(
  ISLAND_ENDPOINT.position[0],
  ISLAND_ENDPOINT.position[1] + SKY_ENTRY_HEIGHT,
  ISLAND_ENDPOINT.position[2]
);
const SPACE_POS = new THREE.Vector3(...SPACE_ENDPOINT.position); // needed below, was missing
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
    console.log("[snapshot]", enteringToIsland ? "toIsland" : "toSpace", startPos.toArray(), "progress:", snapshotProgress);

    if (enteringToIsland) {
      setSession({
  direction: "toIsland",
  snapshotProgress,
  start: ISLAND_SKY_ENTRY.clone(),   // was: startPos (actual Space camera position)
  end: ISLAND_POS.clone(),
  startLookAt: ISLAND_LOOKAT.clone(), // was: ORIGIN.clone()
  endLookAt: ISLAND_LOOKAT.clone(),
  startFov: ISLAND_ENDPOINT.fov,      // was: captured startFov
  endFov: ISLAND_ENDPOINT.fov,
});
    } else {
      setSession({
  direction: "toSpace",
  snapshotProgress,
  start: startPos.clone(),        // unchanged — real Island camera position, valid since it could be anywhere from free orbit
  end: SPACE_POS.clone(),          // was: SPACE_ZOOM_POS.clone()
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

  const toIslandActive = phase === "TRANSITION_TO_ISLAND";
  const toSpaceActive = phase === "TRANSITION_TO_SPACE" && !!session;
  insideCloudsRef.current = toIslandActive || toSpaceActive;

  let density = 0;

  if (toIslandActive) {
    // Deliberately independent of `session`/`corridor` React state — those
    // only exist a render cycle after `phase` flips (via the useEffect
    // above), which was causing Island to be visible for a frame or two
    // before the veil existed. Density here comes straight from progress +
    // config, so it's correct on the very first frame of the transition.
    const localT = getIslandArrivalT(progress, config.islandArrivalSpan);
    density = computeCloudDensity(localT, assetsReady, config);
  } else if (toSpaceActive && session && corridor) {
    const denom = Math.max(1e-4, session.snapshotProgress);
    const raw = (session.snapshotProgress - progress) / denom;
    const corridorU = THREE.MathUtils.clamp(raw, 0, 1);

    density = computeSessionDensity(corridorU, assetsReady, config);

    corridorRef.current = sampleCloudCorridor(
      corridor, easeInOutCubic(corridorU),
      session.startLookAt, session.endLookAt,
      session.startFov, session.endFov, config.maxBankDeg
    );
  }

  densityRef.current = density;
  if (scene.fog instanceof THREE.FogExp2) scene.fog.density = density * MAX_FOG_DENSITY;
  if (density >= config.loadThreshold) fireLoadTriggersOnce();
}); 
 
return (
  <>
    {/* Always mounted (not conditional on phase/session) so it never has to
        "catch up" after a phase flip — internal density check handles its
        own visibility every frame. This is the other half of the flash fix. */}
    <CloudVeil />
    {session && corridor && phase === "TRANSITION_TO_SPACE" ? (
      <CloudField start={session.start} end={session.end} />
    ) : null}
  </>
);
}