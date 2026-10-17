// components/Island/boat-ride/boatRideStore.ts
//
// Ride state machine store (PLAN.md §3): phase + boatId live here, rare
// changes only. Per-frame data (sim state, input) lives elsewhere in plain
// mutable objects.
//
// Deliberately dependency-free: a tiny pub/sub consumed through
// useSyncExternalStore — works across both mount sites (WorldManager and
// app/Nwisland) without a provider, and the R3F side reads it with
// getRidePhase() (no React in the frame loop).

"use client";

import * as THREE from "three";
import { useSyncExternalStore } from "react";

export type RidePhase = "idle" | "entering" | "riding" | "exiting";

/** Full camera snapshot captured on startRide before anything moves (§9.1). */
export interface CameraSnapshot {
  px: number; py: number; pz: number;
  qx: number; qy: number; qz: number; qw: number;
  fov: number; near: number; far: number; zoom: number;
}

export interface RideState {
  phase: RidePhase;
  /** Sanitized node name, e.g. `Boat_Sail_04`. */
  boatId: string | null;
  /** Roam was active at click time (restored best-effort on finish, §2.5). */
  wasRoaming: boolean;
  snapshot: CameraSnapshot | null;
}

let state: RideState = {
  phase: "idle",
  boatId: null,
  wasRoaming: false,
  snapshot: null,
};

const listeners = new Set<() => void>();

function set(partial: Partial<RideState>) {
  state = { ...state, ...partial };
  for (const l of listeners) l();
}

export function subscribeRide(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function getRideState(): RideState {
  return state;
}

export function getRidePhase(): RidePhase {
  return state.phase;
}

/** True while any ride transition/ride is in progress. */
export function isRideActive(): boolean {
  return state.phase !== "idle";
}

/** React subscription hook (DOM + R3F components). */
export function useRide(): RideState {
  return useSyncExternalStore(subscribeRide, getRideState, getRideState);
}

// ---------------------------------------------------------------------------
// Per-frame ride pose — written by BoatRideController every frame, read by
// BoatRideCamera for the chase rig. Plain object, zero allocation.
// ---------------------------------------------------------------------------
export const ridePose = {
  x: 0,
  z: 0,
  heading: 0,
  speed: 0,
  /** Collision shake amount — set by the controller, decayed by the camera. */
  shake: 0,
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

let finishHandler: (() => void) | null = null;
let rideCamera: THREE.Camera | null = null;

/** Called by BoatRideController on mount so force-exit can restore pose. */
export function setRideCamera(cam: THREE.Camera | null) {
  rideCamera = cam;
}

function captureSnapshot(camera: THREE.Camera): CameraSnapshot {
  const q = camera.quaternion;
  const persp = camera as THREE.PerspectiveCamera;
  return {
    px: camera.position.x,
    py: camera.position.y,
    pz: camera.position.z,
    qx: q.x, qy: q.y, qz: q.z, qw: q.w,
    fov: typeof persp.fov === "number" ? persp.fov : 50,
    near: persp.near ?? 0.1,
    far: persp.far ?? 6000,
    zoom: typeof persp.zoom === "number" ? persp.zoom : 1,
  };
}

/** Instantly write a snapshot back onto a camera (exact restore, §9.1). */
export function applySnapshot(camera: THREE.Camera | null, snap: CameraSnapshot | null) {
  if (!camera || !snap) return;
  camera.position.set(snap.px, snap.py, snap.pz);
  camera.quaternion.set(snap.qx, snap.qy, snap.qz, snap.qw);
  const persp = camera as THREE.PerspectiveCamera;
  if (typeof persp.fov === "number") {
    persp.fov = snap.fov;
    persp.zoom = snap.zoom;
  }
  persp.near = snap.near;
  persp.far = snap.far;
  if (typeof persp.updateProjectionMatrix === "function") {
    persp.updateProjectionMatrix();
  }
}

export interface StartRideOptions {
  boatId: string;
  camera: THREE.Camera;
  wasRoaming?: boolean;
  /** Synchronous cleanup run exactly once when the ride fully finishes. */
  onFinish?: () => void;
}

/**
 * idle → entering. Captures the camera snapshot before anything moves.
 * Returns false when a ride is already active (rapid double click, §12).
 */
export function startRide(opts: StartRideOptions): boolean {
  if (state.phase !== "idle") return false;
  finishHandler = opts.onFinish ?? null;
  rideCamera = opts.camera;
  set({
    phase: "entering",
    boatId: opts.boatId,
    wasRoaming: opts.wasRoaming ?? false,
    snapshot: captureSnapshot(opts.camera),
  });
  return true;
}

/** entering/riding → exiting (Exit button, Esc). Ignored otherwise. */
export function requestRideExit() {
  if (state.phase === "riding" || state.phase === "entering") {
    set({ phase: "exiting" });
  }
}

/** Camera-only transition entering → riding (called by BoatRideCamera). */
export function markRiding() {
  if (state.phase === "entering") set({ phase: "riding" });
}

/**
 * exiting → idle. Called by BoatRideCamera once the exit tween completes:
 * runs the finish handler (reseed idle rest pose, clear ridden flag) BEFORE
 * notifying, so no frame ever writes a stale transform (§6.5).
 */
export function finishRide() {
  if (state.phase === "idle") return;
  const h = finishHandler;
  finishHandler = null;
  h?.();
  set({ phase: "idle", boatId: null, wasRoaming: false, snapshot: null });
}

/**
 * Instant restore with no tween — route change, leaving the island phase,
 * component unmount (§3 force-exit).
 */
export function forceExitRide(): boolean {
  if (state.phase === "idle") return false;
  applySnapshot(rideCamera, state.snapshot);
  finishRide();
  return true;
}
