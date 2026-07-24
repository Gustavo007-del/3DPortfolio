"use client";
import { createContext, useContext, useRef, useState, useCallback, ReactNode, MutableRefObject } from "react";

export type WorldPhase = "SPACE" | "TRANSITION_TO_ISLAND" | "ISLAND" | "TRANSITION_TO_SPACE";
export type CameraOwner = "world" | "journey";

export type WorldStateContextType = {
  phase: WorldPhase;
  cameraOwner: CameraOwner;
  progressRef: MutableRefObject<number>;
  targetProgressRef: MutableRefObject<number>;
  setPhase: (phase: WorldPhase) => void;
  setCameraOwner: (owner: CameraOwner) => void;
  addTargetProgress: (delta: number) => void;
  goToSpace: () => void;
  goToIsland: () => void;
};

const WorldStateContext = createContext<WorldStateContextType | null>(null);

export function WorldProvider({ children }: { children: ReactNode }) {
  const [phase, setPhaseState] = useState<WorldPhase>("SPACE");
  const [cameraOwner, setCameraOwnerState] = useState<CameraOwner>("world");
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);

  const setPhase = useCallback((next: WorldPhase) => setPhaseState(next), []);
  const setCameraOwner = useCallback((owner: CameraOwner) => setCameraOwnerState(owner), []);
  const addTargetProgress = useCallback((delta: number) => {
    targetProgressRef.current = Math.min(1, Math.max(0, targetProgressRef.current + delta));
  }, []);
  const goToSpace = useCallback(() => { targetProgressRef.current = 0; setPhaseState("TRANSITION_TO_SPACE"); }, []);
  const goToIsland = useCallback(() => { targetProgressRef.current = 1; setPhaseState("TRANSITION_TO_ISLAND"); }, []);

  return (
    <WorldStateContext.Provider value={{ phase, cameraOwner, progressRef, targetProgressRef, setPhase, setCameraOwner, addTargetProgress, goToSpace, goToIsland }}>
      {children}
    </WorldStateContext.Provider>
  );
}

export function useWorldState() {
  const ctx = useContext(WorldStateContext);
  if (!ctx) throw new Error("useWorldState must be inside WorldProvider");
  return ctx;
}