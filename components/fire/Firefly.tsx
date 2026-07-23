// components/Environment/Fireflies/Firefly.tsx
import { Vector3 } from 'three';
import { createNoise3D } from 'simplex-noise';

const noise3D = createNoise3D();

export type Distribution = 'disc' | 'ring' | 'cluster';
export type MovementStyle = 'tight' | 'wide' | 'still';

export interface FireflyData {
  position: Vector3; velocity: Vector3; homePosition: Vector3;
  size: number; blinkSpeed: number; blinkOffset: number; brightness: number;
  wanderRadius: number; height: number; seed: number;
  noiseOffset: Vector3; scatterAmount: number; state: 0 | 1 | 2;
  pauseTimer: number; nextPause: number; movementStyle: MovementStyle;
}

function sampleRadius(radius: number, distribution: Distribution) {
  if (distribution === 'ring') return radius * (0.7 + Math.random() * 0.3);
  if (distribution === 'cluster') return radius * Math.pow(Math.random(), 3);
  return Math.sqrt(Math.random()) * radius; // disc — uniform-area default
}

const STYLE_WANDER_MULT: Record<MovementStyle, number> = { tight: 0.3, wide: 1, still: 0.08 };
const STYLE_PAUSE_BIAS: Record<MovementStyle, number> = { tight: 1, wide: 0.6, still: 2.5 };

export function createFirefly(center: Vector3, radius: number, heightMin: number, heightMax: number, distribution: Distribution = 'disc', movementStyle: MovementStyle = 'wide'): FireflyData {
  const angle = Math.random() * Math.PI * 2, r = sampleRadius(radius, distribution);
  const home = new Vector3(center.x + Math.cos(angle) * r, center.y + heightMin + Math.random() * (heightMax - heightMin), center.z + Math.sin(angle) * r);
  return {
    position: home.clone(), velocity: new Vector3(), homePosition: home,
    size: 0.08 + Math.random() * 0.14, blinkSpeed: 0.8 + Math.random() * 2.2, blinkOffset: Math.random() * Math.PI * 2,
    brightness: 0.6 + Math.random() * 0.4, wanderRadius: (0.8 + Math.random() * 2.5) * STYLE_WANDER_MULT[movementStyle], height: heightMax - heightMin,
    seed: Math.random() * 1000, noiseOffset: new Vector3(Math.random() * 100, Math.random() * 100, Math.random() * 100),
    scatterAmount: 0, state: 0, pauseTimer: 0, nextPause: (3 + Math.random() * 6) * STYLE_PAUSE_BIAS[movementStyle], movementStyle,
  };
}

const NOISE_SCALE = 0.15, NOISE_SPEED = 0.06;

export function updateFirefly(f: FireflyData, time: number, dt: number, wind: Vector3, camPos: Vector3, tmp: Vector3, tmp2: Vector3) {
  f.pauseTimer += dt;
  if (f.pauseTimer > f.nextPause) {
    f.state = f.state === 0 ? 1 : 0;
    f.pauseTimer = 0;
    const bias = STYLE_PAUSE_BIAS[f.movementStyle];
    f.nextPause = (f.state === 1 ? 1 + Math.random() * 2 : 3 + Math.random() * 6) * bias;
  }
  const moveScale = f.state === 1 ? 0.15 : 1;
  const nx = noise3D(f.noiseOffset.x + time * NOISE_SPEED, f.noiseOffset.y, f.noiseOffset.z);
  const ny = noise3D(f.noiseOffset.y + time * NOISE_SPEED, f.noiseOffset.z, f.noiseOffset.x);
  const nz = noise3D(f.noiseOffset.z + time * NOISE_SPEED, f.noiseOffset.x, f.noiseOffset.y);
  tmp.set(nx, ny * 0.5, nz).multiplyScalar(f.wanderRadius * moveScale);
  tmp.add(f.homePosition);
  tmp2.copy(f.position).sub(camPos);
  const distToCam = tmp2.length();
  if (distToCam < 2 && distToCam > 0.0001) {
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