import * as THREE from "three";

export const ISLAND_TOUR_SECONDS = 18;
export const ISLAND_TOUR_END = new THREE.Vector3(0, 85, 135);
export const ISLAND_TOUR_FOCUS = new THREE.Vector3(0, 9, 0);

// The route changes shape: close coastal sweep, broad orbit, overhead reveal,
// then a long pullback. Heights stay above the island's tall structures.
export function createIslandTourCurve(start: THREE.Vector3) {
  return new THREE.CatmullRomCurve3([
    start.clone(),
    new THREE.Vector3(-12, 42, -30),
    new THREE.Vector3(14, 29, -47),
    new THREE.Vector3(48, 31, -8),
    new THREE.Vector3(32, 39, 38),
    new THREE.Vector3(-10, 48, 52),
    new THREE.Vector3(-44, 57, 23),
    new THREE.Vector3(-45, 64, -24),
    new THREE.Vector3(10, 69, -52),
    new THREE.Vector3(42, 75, -18),
    new THREE.Vector3(5, 112, 3),
    new THREE.Vector3(25, 83, 66),
    ISLAND_TOUR_END.clone(),
  ], false, "centripetal");
}

export function getIslandTourFocus(t: number, startTarget: THREE.Vector3) {
  const shots: [number, THREE.Vector3][] = [
    [0, startTarget],
    [0.18, new THREE.Vector3(12, 7, -20)],
    [0.38, new THREE.Vector3(0, 10, 0)],
    [0.58, new THREE.Vector3(-18, 14, 12)],
    [0.78, new THREE.Vector3(0, 6, 0)],
    [1, ISLAND_TOUR_FOCUS],
  ];
  const end = shots.findIndex(([at]) => at >= t);
  if (end <= 0) return shots[0][1].clone();
  const [fromT, from] = shots[end - 1];
  const [toT, to] = shots[end];
  const local = (t - fromT) / (toT - fromT);
  const smooth = local * local * (3 - 2 * local);
  return from.clone().lerp(to, smooth);
}

export function getIslandTourFov(t: number, startFov: number) {
  const shots = [[0, startFov], [0.2, 38], [0.48, 46], [0.68, 42], [0.82, 56], [1, 50]];
  const end = shots.findIndex(([at]) => at >= t);
  if (end <= 0) return shots[0][1];
  const [fromT, from] = shots[end - 1];
  const [toT, to] = shots[end];
  const local = (t - fromT) / (toT - fromT);
  const smooth = local * local * (3 - 2 * local);
  return from + (to - from) * smooth;
}
