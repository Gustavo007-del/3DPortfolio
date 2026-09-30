// components/Island/fortMotionConfig.ts
//
// Tunable per-category motion + lens parameters (PLAN.md §6.1, §6.3, §6.4).
// All scale factors are MULTIPLICATIVE on each node's imported rest scale —
// never absolute.

import type { Category } from "./fortEntities";

export interface BoatMotion {
  heaveAmp: number;    // metres
  heavePeriod: number; // seconds (before per-entity jitter)
  rollAmp: number;     // radians, about local long axis (three local Z)
  rollPeriod: number;
  pitchAmp: number;    // radians, about local X
  pitchPeriod: number;
}

export const BOAT_MOTION: Record<"boatRow" | "boatSail", BoatMotion> = {
  boatRow: {
    heaveAmp: 0.06, heavePeriod: 4.0,
    rollAmp: THREE_DEG(1.75), rollPeriod: 4.5,
    pitchAmp: THREE_DEG(1.25), pitchPeriod: 5.5,
  },
  boatSail: {
    heaveAmp: 0.085, heavePeriod: 4.5,
    rollAmp: THREE_DEG(2.5), rollPeriod: 5.5,
    pitchAmp: THREE_DEG(1.75), pitchPeriod: 6.5,
  },
};

function THREE_DEG(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Shipwreck stays a stable hover target (PLAN §6.1). */
export const WRECK_MOTION: BoatMotion = {
  heaveAmp: 0.02, heavePeriod: 6.0,
  rollAmp: THREE_DEG(0.3), rollPeriod: 8.0,
  pitchAmp: THREE_DEG(0.3), pitchPeriod: 9.0,
};

export const PLANK_MOTION = {
  heaveAmp: 0.02,
  yawAmp: THREE_DEG(3),
  period: 5.5,
};

/**
 * Slow orbital drift around the island (boats only):
 * each boat circles the fort at constant angular speed along its rest
 * radius/angle (computed at entity build time). restRadius is gently nudged
 * into [radiusMin, radiusMax] so an oddly-authored mooring can't ground a
 * boat on the island; when rest radii are already in range this is a no-op.
 */
export const BOAT_ORBIT = {
  /** Radians per second — 2π / 300 ≈ one lap every 5 minutes. */
  angularSpeed: (2 * Math.PI) / 300,
  radiusMin: 30,
  radiusMax: 90,
  /** Fraction of the remaining radius correction applied per second. */
  radiusLerpSpeed: 0.015,
};

/** Vegetation sway amplitudes (radians) about the base. */
export const SWAY = {
  shoreAmp: THREE_DEG(1.5),
  shorePeriod: 3.2,
  treeAmp: THREE_DEG(0.75),
  treePeriod: 4.5,
  flagClothAmp: THREE_DEG(6.5),
  flagClothPeriod: 2.4,
};

/** Fire emissive flicker: ±fraction around the material's authored intensity. */
export const FIRE_FLICKER = {
  fraction: 0.15,
  /** Hz-ish noise octaves; sampled via layered sines, no allocations. */
  period: 0.55,
};

// ---- Lens (screen-space magnification) — PLAN §6.3 ------------------------

export const LENS = {
  radiusPx: 140,
  /** Exponential smoothing rate for per-entity scale. */
  lambda: 12,
  /** Tiny scales snap back instantly below this; avoids per-frame writes. */
  epsilon: 0.001,
  /** Reduce radius on touch/small screens. */
  touchRadiusScale: 0.7,
  /** Optional depth weighting divisor (PLAN §6.3 "if it looks busy"). */
  depthFalloffMeters: 0, // 0 disables
};

export const LENS_MAX_SCALE: Record<Category, number> = {
  barbarian: 1.6,
  boatRow: 1.3,
  boatSail: 1.3,
  shipwreck: 1.2,
  plank: 1.2,
  flag: 1.35,
  banner: 1.35,
  fire: 1.35,
  shore: 1.4,
  tree: 1.25,
  rock: 1.15,
  fortTower: 1.05,
  fortWall: 1.05,
};
