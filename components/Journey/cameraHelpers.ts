import * as THREE from "three";

/*
---------------------------------------------------
Vector Helpers
---------------------------------------------------
*/

export function clone(v: THREE.Vector3) {
  return v.clone();
}

export function addHeight(position: THREE.Vector3, height: number) {
  return new THREE.Vector3(position.x, position.y + height, position.z);
}

export function midpoint(a: THREE.Vector3, b: THREE.Vector3) {
  return new THREE.Vector3(
    (a.x + b.x) * 0.5,
    (a.y + b.y) * 0.5,
    (a.z + b.z) * 0.5
  );
}

export function direction(from: THREE.Vector3, to: THREE.Vector3) {
  return new THREE.Vector3().subVectors(to, from).normalize();
}

export function distance(a: THREE.Vector3, b: THREE.Vector3) {
  return a.distanceTo(b);
}

/*
---------------------------------------------------
Easing
---------------------------------------------------
*/

export function easeInOut(t: number) {
  return t * t * (3 - 2 * t);
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

// Eases internally — use for one-shot lerps where "t" is a raw 0-1 progress.
export function lerpVector(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  return a.clone().lerp(b, easeInOut(t));
}

// Plain (non-eased) lerp — use when "t" has ALREADY been eased upstream
// (e.g. inside a per-frame flight loop), so you don't double-ease.
export function lerpVectorLinear(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  return a.clone().lerp(b, clamp(t, 0, 1));
}

/*
---------------------------------------------------
Bezier Helpers
---------------------------------------------------
*/

export function createBezier(
  start: THREE.Vector3,
  end: THREE.Vector3,
  lift: number
) {
  const c1 = start.clone();
  c1.y += lift;

  const c2 = end.clone();
  c2.y += lift;

  return new THREE.CubicBezierCurve3(start, c1, c2, end);
}

/*
---------------------------------------------------
Arc-Length Table (constant-speed movement)

A cubic Bezier's parameter "t" does NOT move at constant speed — points
bunch up on curved sections and spread out on straight ones. Sampling
the curve directly by time would make the camera visibly speed up and
slow down for no reason.

buildArcLengthTable() walks the curve once and records cumulative
distance at N samples. tForArcLength() then converts "how far along the
path, 0-1" into the correct curve "t" to sample at — so equal steps in
time really do move the camera equal distances in space.
---------------------------------------------------
*/

export interface ArcLengthTable {
  distances: number[]; // cumulative length at each sample, distances[0] === 0
  totalLength: number;
  samples: number;
}

export function buildArcLengthTable(
  curve: THREE.CubicBezierCurve3,
  samples = 200
): ArcLengthTable {
  const distances: number[] = [0];
  let prev = curve.getPoint(0);
  let total = 0;

  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const pt = curve.getPoint(t);
    total += pt.distanceTo(prev);
    distances.push(total);
    prev = pt;
  }

  return { distances, totalLength: total, samples };
}

// u: normalized arc-length fraction (0-1) -> returns curve "t" (0-1)
export function tForArcLength(table: ArcLengthTable, u: number): number {
  const targetLength = clamp(u, 0, 1) * table.totalLength;

  // Binary search for the bracketing samples, then interpolate within
  // that segment for a smooth (not stair-stepped) result.
  let low = 0;
  let high = table.samples;

  while (low < high) {
    const mid = (low + high) >> 1;
    if (table.distances[mid] < targetLength) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  if (low === 0) return 0;

  const upperDist = table.distances[low];
  const lowerDist = table.distances[low - 1];
  const segmentLength = upperDist - lowerDist || 1e-6;
  const segmentT = (targetLength - lowerDist) / segmentLength;

  return clamp((low - 1 + segmentT) / table.samples, 0, 1);
}

/*
---------------------------------------------------
Banking (camera roll on turns)
---------------------------------------------------
*/

// Estimates how sharply the path is turning at "t" in the horizontal
// plane and converts that into a clamped roll angle, in radians.
// strength controls sensitivity; maxBankDeg is a hard clamp.
export function getBankAngle(
  curve: THREE.CubicBezierCurve3,
  t: number,
  maxBankDeg: number,
  strength = 0.15,
  sampleDelta = 0.02
): number {
  const t0 = clamp(t - sampleDelta, 0, 1);
  const t1 = clamp(t + sampleDelta, 0, 1);

  if (t0 === t1) return 0;

  const tangent0 = curve.getTangent(t0);
  const tangent1 = curve.getTangent(t1);

  const heading0 = Math.atan2(tangent0.x, tangent0.z);
  const heading1 = Math.atan2(tangent1.x, tangent1.z);

  let delta = heading1 - heading0;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;

  const turnRate = delta / (t1 - t0);
  const maxBankRad = THREE.MathUtils.degToRad(maxBankDeg);

  return clamp(-turnRate * strength, -maxBankRad, maxBankRad);
}

/*
---------------------------------------------------
Look-At Quaternion (with optional roll/banking baked in)
---------------------------------------------------
*/

const _lookMatrix = new THREE.Matrix4();

export function computeLookAtQuaternion(
  position: THREE.Vector3,
  target: THREE.Vector3,
  bankAngle = 0,
  up = new THREE.Vector3(0, 1, 0)
): THREE.Quaternion {
  _lookMatrix.lookAt(position, target, up);
  const q = new THREE.Quaternion().setFromRotationMatrix(_lookMatrix);

  if (bankAngle !== 0) {
    const forward = new THREE.Vector3().subVectors(target, position).normalize();
    const rollQ = new THREE.Quaternion().setFromAxisAngle(forward, bankAngle);
    q.premultiply(rollQ);
  }

  return q;
}