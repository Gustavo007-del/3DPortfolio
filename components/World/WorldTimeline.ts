export type CameraEndpoint = {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
};

// SolarSystem camera, from app/animate/page.tsx
export const SPACE_ENDPOINT: CameraEndpoint = {
  position: [0, 6, 22],
  lookAt: [0, 0, 0],
  fov: 50,
};

// Island camera, from app/page.tsx Canvas props.
// lookAt is a PLACEHOLDER — swap in real DEFAULT_CAMERA.lookAt from lib/camera.ts.
export const ISLAND_ENDPOINT: CameraEndpoint = {
  position: [11.873, 10.369, 2.485],
  lookAt: [-32.038,
    98.698,
    -30.378,],
  fov: 45,
};

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

// Smooth acceleration/deceleration so the SPACE<->ISLAND blend doesn't feel linear/robotic.
export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// progress: 0 = fully SPACE, 1 = fully ISLAND
export function getWorldCameraState(progress: number): CameraEndpoint {
  const t = easeInOutCubic(Math.min(1, Math.max(0, progress)));
  return {
    position: lerpVec3(SPACE_ENDPOINT.position, ISLAND_ENDPOINT.position, t),
    lookAt: lerpVec3(SPACE_ENDPOINT.lookAt, ISLAND_ENDPOINT.lookAt, t),
    fov: lerp(SPACE_ENDPOINT.fov, ISLAND_ENDPOINT.fov, t),
  };
}

// Smoothing rate for progressRef chasing targetProgressRef, applied per-frame in WorldCamera.
// Higher = snappier, lower = heavier/more cinematic drift.
export const PROGRESS_SMOOTH_SPEED = 3.5;

export function smoothProgress(current: number, target: number, delta: number, speed = PROGRESS_SMOOTH_SPEED) {
  const t = 1 - Math.exp(-speed * delta);
  return lerp(current, target, t);
}