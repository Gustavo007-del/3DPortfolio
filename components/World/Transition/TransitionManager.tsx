// components/World/Transition/TransitionManager.tsx
"use client";
import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  ReactNode,
  MutableRefObject,
} from "react";
import * as THREE from "three";
import { useControls } from "leva";
import {
  createBezier,
  buildArcLengthTable,
  tForArcLength,
  lerpVectorLinear,
  getBankAngle,
  clamp,
  ArcLengthTable,
} from "@/components/Journey/cameraHelpers";

/*
---------------------------------------------------
Config
---------------------------------------------------
All the "everything adjustable from Leva" knobs live here, in one place,
rather than scattered across CloudField/CloudTransition. Both of those files
just read whatever this provider hands them — they never own tuning values
themselves.
*/

export type TransitionConfig = {
  cloudEntryProgress: number; // worldProgress where the corridor/cloud window begins
  cloudExitProgress: number; // worldProgress where it ends (must be > entry)
  cloudLayerHeight: number; // bezier "lift" — how high the flight path arcs through the cloud volume
  cloudThickness: number; // radial spread of cloud cards around the corridor
  cloudDensityMax: number; // ceiling density (0-1) reached at full immersion
  cloudCardCount: number; // InstancedMesh instance count
  cloudDrift: number; // per-instance noise animation speed
  maxBankDeg: number; // camera roll clamp while flying the corridor
  loadThreshold: number; // local cloud progress (0-1) at which asset loading is triggered
};

export const DEFAULT_TRANSITION_CONFIG: TransitionConfig = {
  cloudEntryProgress: 0.20,
  cloudExitProgress: 1.0,
  cloudLayerHeight: 55,
  cloudThickness: 45,
  cloudDensityMax: 1,
  cloudCardCount: 220,
  cloudDrift: 0.6,
  maxBankDeg: 6,
  loadThreshold: 0.35,
};

/*
---------------------------------------------------
Pure math — density curve & corridor sampling
---------------------------------------------------
Kept as plain functions (no hooks) so they're testable in isolation and so
CloudTransition's useFrame can call them directly without any React
indirection. This is where "physical travel, not a fade" actually lives:
density is a function of how far along the corridor you are, and position
comes from sampling a real 3D curve, not lerping two points.
*/

// Maps raw worldProgress into a local 0-1 fraction of the cloud window.
// Returns 0 before entry, 1 at/after exit.
export function remapCloudProgress(progress: number, config: TransitionConfig): number {
  const { cloudEntryProgress, cloudExitProgress } = config;
  if (cloudExitProgress <= cloudEntryProgress) return 0;
  return clamp((progress - cloudEntryProgress) / (cloudExitProgress - cloudEntryProgress), 0, 1);
}

function smoothstep(t: number) {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
}

// The density curve is deliberately NOT symmetric around a timer — it rises
// on the way in, then its ability to fall on the way out is gated by
// assetsReady. This is the concrete mechanism behind "never show loading":
// if the player scrolls faster than assets can load, density simply holds
// at max instead of thinning early and exposing a half-built scene.
export function computeCloudDensity(localT: number, assetsReady: boolean, config: TransitionConfig): number {
  const RISE_END = 0.4; // fraction of the window where density reaches max on the way in
  const FALL_START = 0.75; // fraction where it's allowed to start clearing on the way out

  let raw: number;
  if (localT <= RISE_END) {
    raw = smoothstep(localT / RISE_END);
  } else if (localT < FALL_START) {
    raw = 1;
  } else {
    raw = 1 - smoothstep((localT - FALL_START) / (1 - FALL_START));
  }

  // Exit clamp: while assets aren't ready, floor density at max regardless
  // of how far past FALL_START localT has drifted. The moment assetsReady
  // flips true, this stops clamping on the very next frame — no snap, the
  // curve just resumes from wherever it already was.
  if (localT >= FALL_START && !assetsReady) raw = 1;

  return raw * config.cloudDensityMax;
}

export type CorridorState = {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
  bank: number; // radians — camera roll, apply via computeLookAtQuaternion if desired
};

export type CloudCorridor = {
  curve: THREE.CubicBezierCurve3;
  table: ArcLengthTable;
};

// Builds the flight-path curve once per Space<->Island crossing (cheap to
// rebuild on rotation changes since it's just two vectors + a lift height —
// but callers should still memoize this against their start/end inputs
// rather than calling it fresh every frame).
export function buildCloudCorridor(start: THREE.Vector3, end: THREE.Vector3, lift: number): CloudCorridor {
  const curve = createBezier(start, end, lift);
  const table = buildArcLengthTable(curve);
  return { curve, table };
}

// Samples the corridor at arc-length fraction `u` (constant-speed, per
// buildArcLengthTable's whole purpose) and blends lookAt/fov linearly across
// the same u — u should already be eased upstream (see localT shaping in
// CloudTransition), so this stays a plain lerp to avoid double-easing.
export function sampleCloudCorridor(
  corridor: CloudCorridor,
  u: number,
  startLookAt: THREE.Vector3,
  endLookAt: THREE.Vector3,
  startFov: number,
  endFov: number,
  maxBankDeg: number
): CorridorState {
  const t = tForArcLength(corridor.table, u);
  const position = corridor.curve.getPoint(t);
  const lookAt = lerpVectorLinear(startLookAt, endLookAt, u);
  const fov = startFov + (endFov - startFov) * u;
  const bank = getBankAngle(corridor.curve, t, maxBankDeg);

  return {
    position: [position.x, position.y, position.z],
    lookAt: [lookAt.x, lookAt.y, lookAt.z],
    fov,
    bank,
  };
}

/*
---------------------------------------------------
Context
---------------------------------------------------
*/

type TransitionManagerContextType = {
  config: TransitionConfig;
  densityRef: MutableRefObject<number>;
  corridorRef: MutableRefObject<CorridorState>;
  insideCloudsRef: MutableRefObject<boolean>;
  assetsReady: boolean;
  registerLoadTrigger: (fn: () => void | Promise<void>) => () => void;
  fireLoadTriggersOnce: () => void;
};

const TransitionManagerContext = createContext<TransitionManagerContextType | null>(null);

const DEFAULT_CORRIDOR_STATE: CorridorState = {
  position: [0, 0, 0],
  lookAt: [0, 0, 0],
  fov: 50,
  bank: 0,
};

export function TransitionManagerProvider({ children }: { children: ReactNode }) {
  const leva = useControls("Cloud Transition", {
    cloudEntryProgress: { value: DEFAULT_TRANSITION_CONFIG.cloudEntryProgress, min: 0, max: 1, step: 0.01 },
    cloudExitProgress: { value: DEFAULT_TRANSITION_CONFIG.cloudExitProgress, min: 0, max: 1, step: 0.01 },
    cloudLayerHeight: { value: DEFAULT_TRANSITION_CONFIG.cloudLayerHeight, min: 0, max: 200, step: 1 },
    cloudThickness: { value: DEFAULT_TRANSITION_CONFIG.cloudThickness, min: 0, max: 150, step: 1 },
    cloudDensityMax: { value: DEFAULT_TRANSITION_CONFIG.cloudDensityMax, min: 0, max: 1, step: 0.01 },
    cloudCardCount: { value: DEFAULT_TRANSITION_CONFIG.cloudCardCount, min: 20, max: 600, step: 10 },
    cloudDrift: { value: DEFAULT_TRANSITION_CONFIG.cloudDrift, min: 0, max: 3, step: 0.05 },
    maxBankDeg: { value: DEFAULT_TRANSITION_CONFIG.maxBankDeg, min: 0, max: 25, step: 1 },
    loadThreshold: { value: DEFAULT_TRANSITION_CONFIG.loadThreshold, min: 0, max: 1, step: 0.01 },
  });

  const config: TransitionConfig = leva;

  // Refs, not state — these get written every frame from CloudTransition's
  // useFrame once file 4 wires it up. Using state here would re-render the
  // whole provider subtree 60x/sec for no reason.
  const densityRef = useRef(0);
  const corridorRef = useRef<CorridorState>(DEFAULT_CORRIDOR_STATE);
  const insideCloudsRef = useRef(false);

  const [assetsReady, setAssetsReady] = useState(false);
  const triggers = useRef<Set<() => void | Promise<void>>>(new Set());
  const hasFired = useRef(false);

  const registerLoadTrigger = useCallback((fn: () => void | Promise<void>) => {
    triggers.current.add(fn);
    return () => triggers.current.delete(fn);
  }, []);

  // Called once, when density first crosses loadThreshold. Fans out to every
  // registered trigger (Island shader compile, particle init, audio bus
  // warmup, etc.) and waits for all of them before flipping assetsReady.
  //
  // Fails open on purpose: if any trigger throws or rejects, we still mark
  // assetsReady true (after logging) rather than trapping the player inside
  // maximum-density clouds forever. A slightly early reveal is a much
  // smaller problem than a stuck transition.
  const fireLoadTriggersOnce = useCallback(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const pending = Array.from(triggers.current).map((fn) => {
      try {
        return Promise.resolve(fn());
      } catch (err) {
        console.error("[TransitionManager] load trigger threw synchronously", err);
        return Promise.resolve();
      }
    });

    Promise.all(pending)
      .catch((err) => {
        console.error("[TransitionManager] one or more load triggers rejected", err);
      })
      .finally(() => setAssetsReady(true));
  }, []);

  return (
    <TransitionManagerContext.Provider
      value={{
        config,
        densityRef,
        corridorRef,
        insideCloudsRef,
        assetsReady,
        registerLoadTrigger,
        fireLoadTriggersOnce,
      }}
    >
      {children}
    </TransitionManagerContext.Provider>
  );
}

export function useTransitionManager() {
  const ctx = useContext(TransitionManagerContext);
  if (!ctx) throw new Error("useTransitionManager must be inside TransitionManagerProvider");
  return ctx;
}