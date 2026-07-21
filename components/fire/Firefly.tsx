// components/Environment/Fireflies/Firefly.tsx
import { Vector3 } from 'three';
import { createNoise3D } from 'simplex-noise';

const noise3D = createNoise3D();

export interface FireflyData {
  position: Vector3; velocity: Vector3; homePosition: Vector3;
  size: number; blinkSpeed: number; blinkOffset: number; brightness: number;
  wanderRadius: number; height: number; seed: number;
  noiseOffset: Vector3; scatterAmount: number; state: 0 | 1 | 2;
  pauseTimer: number; nextPause: number;
}

export function createFirefly(center: Vector3, radius: number, heightMin: number, heightMax: number): FireflyData {
  const angle = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * radius;
  const home = new Vector3(center.x + Math.cos(angle) * r, center.y + heightMin + Math.random() * (heightMax - heightMin), center.z + Math.sin(angle) * r);
  return {
    position: home.clone(), velocity: new Vector3(), homePosition: home,
    size: 0.08 + Math.random() * 0.14, blinkSpeed: 0.8 + Math.random() * 2.2, blinkOffset: Math.random() * Math.PI * 2,
    brightness: 0.6 + Math.random() * 0.4, wanderRadius: 0.8 + Math.random() * 2.5, height: heightMax - heightMin,
    seed: Math.random() * 1000, noiseOffset: new Vector3(Math.random() * 100, Math.random() * 100, Math.random() * 100),
    scatterAmount: 0, state: 0, pauseTimer: 0, nextPause: 3 + Math.random() * 6,
  };
}

const NOISE_SCALE = 0.15, NOISE_SPEED = 0.06;

export function updateFirefly(f: FireflyData, time: number, dt: number, wind: Vector3, camPos: Vector3, tmp: Vector3, tmp2: Vector3) {
  f.pauseTimer += dt;
  if (f.pauseTimer > f.nextPause) {
    f.state = f.state === 0 ? 1 : 0;
    f.pauseTimer = 0;
    f.nextPause = f.state === 1 ? 1 + Math.random() * 2 : 3 + Math.random() * 6;
  }
  const moveScale = f.state === 1 ? 0.15 : 1;
  const nx = noise3D(f.noiseOffset.x + time * NOISE_SPEED, f.noiseOffset.y, f.noiseOffset.z);
  const ny = noise3D(f.noiseOffset.y + time * NOISE_SPEED, f.noiseOffset.z, f.noiseOffset.x);
  const nz = noise3D(f.noiseOffset.z + time * NOISE_SPEED, f.noiseOffset.x, f.noiseOffset.y);
  tmp.set(nx, ny * 0.5, nz).multiplyScalar(f.wanderRadius * moveScale);
  tmp.add(f.homePosition);
  tmp2.copy(f.position).sub(camPos);
  const distToCam = tmp2.length();
  if (distToCam < 2) {
    const scatterStrength = (1 - distToCam / 2) * 1.5;
    tmp2.normalize().multiplyScalar(scatterStrength);
    tmp.add(tmp2);
    f.scatterAmount = Math.min(1, f.scatterAmount + dt * 4);
  } else {
    f.scatterAmount = Math.max(0, f.scatterAmount - dt * 1.2);
  }
  f.velocity.lerp(tmp.sub(f.position), Math.min(1, dt * (f.state === 1 ? 0.8 : 1.6)));
  f.position.addScaledVector(f.velocity, dt);
  f.position.addScaledVector(wind, dt * 0.4 * f.size);
}