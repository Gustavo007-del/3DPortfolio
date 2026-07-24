"use client";
import { createContext, useContext, ReactNode } from "react";
import { useWorldState } from "./WorldState";

export type LODGroupName = "space" | "island";

const ActiveContext = createContext(true);

// Lets any nested component (Mist, Birds, Fireflies, etc.) cheaply check whether
// its parent LODGroup is currently active, to early-return inside its own useFrame.
// Opt-in only — nothing breaks if a component never calls this.
export function useIsActive() {
  return useContext(ActiveContext);
}

function isGroupActive(group: LODGroupName, phase: ReturnType<typeof useWorldState>["phase"]) {
  if (group === "space") return phase === "SPACE" || phase === "TRANSITION_TO_SPACE";
  return phase === "ISLAND" || phase === "TRANSITION_TO_ISLAND";
}

// Wraps a subtree, toggles `visible` (never destroys/unmounts), and broadcasts
// activation state down via context for opt-in useFrame short-circuiting.
export default function LODGroup({ group, children }: { group: LODGroupName; children: ReactNode }) {
  const { phase } = useWorldState();
  const active = isGroupActive(group, phase);

  return (
    <group visible={active}>
      <ActiveContext.Provider value={active}>{children}</ActiveContext.Provider>
    </group>
  );
}