import { DEFAULT_CAMERA } from "@/lib/camera";

export type CameraEndpoint = {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
};

// SolarSystem camera, from app/animate/page.tsx — the wide establishing view.
export const SPACE_ENDPOINT: CameraEndpoint = {
  position: [0, 14, 42],
  lookAt: [0, 0, 0],
  fov: 50,
};

// Same viewing direction as SPACE_ENDPOINT, just much closer to the Sun — this
// is what most of the scroll actually interpolates toward, so the dominant
// feel throughout is "zooming IN," not the camera pulling away from the Sun
// (which is what a direct lerp all the way to ISLAND_ENDPOINT would look like,
// since Island's real coordinates sit ~382 units out vs SPACE_ENDPOINT's ~23).
const SPACE_ZOOM_RADIUS_SCALE = 0.26;
const [sx, sy, sz] = SPACE_ENDPOINT.position;
export const SPACE_ZOOM_ENDPOINT: CameraEndpoint = {
  position: [sx * SPACE_ZOOM_RADIUS_SCALE, sy * SPACE_ZOOM_RADIUS_SCALE, sz * SPACE_ZOOM_RADIUS_SCALE],
  lookAt: [0, 0, 0],
  fov: SPACE_ENDPOINT.fov,
};

// Island resting camera. Sourced from lib/camera.ts DEFAULT_CAMERA (the real value
// JourneyCamera.resetCamera() snaps to on mount) — not the Canvas's initial camera
// prop, which is only a throwaway first-frame value overridden immediately.
export const ISLAND_ENDPOINT: CameraEndpoint = {
  position: [...DEFAULT_CAMERA.position],
  lookAt: [...DEFAULT_CAMERA.lookAt],
  fov: 45,
};

// Progress point where the zoom-in-on-the-Sun motion ends and the (fade-masked)
// jump toward Island's real coordinates begins. Shared by WorldCamera for its
// phase-transition triggers, so both files agree on where the seam sits.
//
// COUPLING NOTE (Cloud Transition system): TransitionManager's Leva-configurable
// `cloudEntryProgress` (default ~0.68) controls when cloud density starts rising
// — this needs to stay comfortably BELOW this threshold, or the corridor jump
// will begin before clouds are dense enough to mask it. Nothing enforces this
// automatically since one lives here as a constant and the other is a runtime
// Leva value; if the jump ever becomes visible again, check this pairing first.
export const ENTER_ISLAND_THRESHOLD = 0.45;

export const WORLD_FAR = 6000;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpVec3(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Two-segment piecewise curve:
//   [0, ENTER_ISLAND_THRESHOLD]  -> zoom IN from spacePosition toward spaceZoomPosition (close to Sun)
//   [ENTER_ISLAND_THRESHOLD, 1]  -> fade-masked jump from spaceZoomPosition to ISLAND_ENDPOINT
// spacePosition/spaceZoomPosition optionally override the two Space-side endpoints
// (used by WorldCamera's drag-to-orbit, which rotates both by the same angles).
//
// NOTE: the upper segment (p > ENTER_ISLAND_THRESHOLD) is now effectively dead
// code for actual camera positioning — WorldCamera sources position from the
// cloud corridor (CloudTransition's corridorRef) for the whole duration of
// TRANSITION_TO_ISLAND/TRANSITION_TO_SPACE instead. Left in place rather than
// removed: it's still correct for plain SPACE-phase positioning, and nothing
// else currently depends on the upper segment being deleted.
export function getWorldCameraState(
  progress: number,
  spacePosition: [number, number, number] = SPACE_ENDPOINT.position,
  spaceZoomPosition: [number, number, number] = SPACE_ZOOM_ENDPOINT.position
): CameraEndpoint {
  const p = Math.min(1, Math.max(0, progress));

  if (p <= ENTER_ISLAND_THRESHOLD) {
    const localT = easeInOutCubic(p / ENTER_ISLAND_THRESHOLD);
    return {
      position: lerpVec3(spacePosition, spaceZoomPosition, localT),
      lookAt: SPACE_ENDPOINT.lookAt,
      fov: SPACE_ENDPOINT.fov,
    };
  }

  const localT = easeInOutCubic((p - ENTER_ISLAND_THRESHOLD) / (1 - ENTER_ISLAND_THRESHOLD));
  return {
    position: lerpVec3(spaceZoomPosition, ISLAND_ENDPOINT.position, localT),
    lookAt: lerpVec3(SPACE_ENDPOINT.lookAt, ISLAND_ENDPOINT.lookAt, localT),
    fov: lerp(SPACE_ENDPOINT.fov, ISLAND_ENDPOINT.fov, localT),
  };
}
// Local 0..1 "how far through the approach to Island" — decoupled from raw
// worldProgress reaching a literal 1, so `islandArrivalSpan` (Leva, in
// TransitionManager's config) can control how MUCH scroll past
// ENTER_ISLAND_THRESHOLD is needed to fully arrive. Smaller span = arrives
// after less scrolling; span = 1 reproduces the old "must scroll all the
// way to progress===1" behavior.
export function getIslandArrivalT(progress: number, arrivalSpan: number): number {
  const clampedSpan = Math.min(1, Math.max(0.05, arrivalSpan));
  const span = Math.max(0.0001, (1 - ENTER_ISLAND_THRESHOLD) * clampedSpan);
  const raw = (progress - ENTER_ISLAND_THRESHOLD) / span;
  return Math.min(1, Math.max(0, raw));
}
export const PROGRESS_SMOOTH_SPEED = 3.5;

export function smoothProgress(current: number, target: number, delta: number, speed = PROGRESS_SMOOTH_SPEED) {
  const t = 1 - Math.exp(-speed * delta);
  return lerp(current, target, t);
}

// Small, slow drift offset used by WorldCamera while HOLDING inside the
// cloud corridor awaiting assetsReady. If the user scrolls fast enough to
// stall worldProgress right in the hold zone, corridorU also stalls — without
// this, the camera would visibly freeze mid-flight, undercutting "the player
// should never see loading" by replacing a pop with an equally obvious
// stationary hover. Subtle by design: enough to read as "still moving through
// thick cloud," not enough to fight the corridor's actual intended path.
export function getIdleCloudDrift(elapsed: number): [number, number, number] {
  return [
    Math.sin(elapsed * 0.15) * 0.6,
    Math.cos(elapsed * 0.11) * 0.4,
    Math.sin(elapsed * 0.09) * 0.5,
  ];
}