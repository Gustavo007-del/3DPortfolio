"use client";
import { useEffect } from "react";
import { useControls, button, folder } from "leva";
import { useWorldState } from "./WorldState";

export default function WorldDebug() {
  const { phase, cameraOwner, progressRef, targetProgressRef, goToSpace, goToIsland } = useWorldState();

  const [, set] = useControls("World", () => ({
    readout: folder({
      phase: { value: phase, editable: false },
      cameraOwner: { value: cameraOwner, editable: false },
      progress: { value: 0, editable: false },
      targetProgress: { value: 0, editable: false },
      inputDelta: { value: 0, editable: false },
      transitioning: { value: false, editable: false },
    }),
    actions: folder({
      "Go To Space": button(() => goToSpace()),
      "Go To Island": button(() => goToIsland()),
    }),
  }));

  // phase/cameraOwner already re-render on change — push straight through.
  useEffect(() => {
    set({ phase, cameraOwner, transitioning: phase === "TRANSITION_TO_ISLAND" || phase === "TRANSITION_TO_SPACE" });
  }, [phase, cameraOwner, set]);

  // progress/targetProgress live in refs (per-frame, no re-render) — poll instead.
  useEffect(() => {
    const id = setInterval(() => {
      const p = progressRef.current;
      const t = targetProgressRef.current;
      set({ progress: Number(p.toFixed(3)), targetProgress: Number(t.toFixed(3)), inputDelta: Number((t - p).toFixed(3)) });
    }, 100);
    return () => clearInterval(id);
  }, [progressRef, targetProgressRef, set]);

  return null;
}