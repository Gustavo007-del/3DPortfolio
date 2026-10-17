// components/Island/boat-ride/boatRideConfig.ts
//
// All tunables for the "Ride a Boat" third-person mode (PLAN.md §6.2).
// Units are metres and seconds. Boats are ≈3.2–4.3 m long; the island is
// ≈25 × 61 m. Nothing here allocates or mutates — safe to import anywhere.

export const RIDE = {
  /** Boats' rest height — hull sits in the water (waterline ≈ 2.19–2.30). */
  waterY: 2.21,
  /** Clamp dt to avoid tunnelling on frame drops (PLAN §12). */
  maxStep: 1 / 20,
  /** Soft sea boundary — outside this radius an inward push bleeds speed. */
  bounds: { cx: 0, cz: 0, radius: 95 },
  /** Land-mask grid: 200 × 200 m at 1 m cells, built from the GLB (§7.1). */
  mask: { cell: 1.0, half: 100 },
  boats: {
    row: {
      maxFwd: 9, maxRev: 3, accel: 4.5, revAccel: 2.5, brakeDecel: 9,
      drag: 0.55, maxTurn: 1.25, grip: 3.0, lean: 0.10, pitch: 0.05,
      // Bow = local −Z, verified from hull geometry (scripts/probe-boats.mjs):
      // the −Z end is consistently pointier on all 9 boats (row 0.62 vs 0.88 m,
      // sail 0.77 vs 1.10 m width at the tips).
      bowLocalMinusZ: true,
      hull: { halfLen: 1.7, halfWid: 0.6 },
    },
    sail: {
      maxFwd: 12, maxRev: 3.5, accel: 3.5, revAccel: 2.0, brakeDecel: 8,
      drag: 0.45, maxTurn: 0.95, grip: 2.5, lean: 0.14, pitch: 0.06,
      bowLocalMinusZ: true, // verified, see row
      hull: { halfLen: 2.0, halfWid: 0.9 },
    },
  } as const,
  input: { throttleRise: 0.35, throttleFall: 0.25, steerRise: 3.5, steerFall: 6, reverseDelay: 0.35 },
  camera: {
    dist: 9, height: 3.6, lookAhead: 5, lookHeight: 1.2,
    posLambda: 3.5, lookLambda: 6,
    fovBase: 58, fovBoost: 10, fovLambda: 3,
    enterSec: 1.4, exitSec: 1.2,
    /**
     * Enter/exit flights arc OVER the island (quadratic Bézier control point
     * lifted by this many metres above the higher endpoint) instead of
     * cutting straight through the fort/rock mass.
     */
    arcLift: 16,
    /** Reduced-motion: short transitions, no FOV boost, no shake (§9.4). */
    reducedEnterSec: 0.4, reducedExitSec: 0.4,
  },
  /** Camera must never dip below the waterline + 1 m. */
  minCamY: 2.21 + 1,
} as const;

export type BoatKind = keyof typeof RIDE.boats;

export function boatKindOf(nodeName: string): BoatKind {
  return nodeName.startsWith("Boat_Row") ? "row" : "sail";
}

/** True when the user prefers reduced motion (call at use time, not module load). */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
