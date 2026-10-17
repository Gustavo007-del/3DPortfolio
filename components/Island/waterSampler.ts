// components/Island/waterSampler.ts
//
// CPU mirror of the Gerstner wave field in WaterPlaneController. The water
// plane geometry is displaced in its LOCAL space before the mesh is rotated
// -90° about X, so a plane-local (x, y, dz) maps to world (x, dz, -y) via
// R_x(-90°): local +z → world +y (heave), local +y → world -z.
//
// Must stay in sync with WAVE_LAYERS + wave controls in WaterPlaneController.

export interface WaveLayer {
  dirX: number;
  dirY: number;
  k: number;
  amplitude: number;
  steepness: number;
  speed: number;
}

export const WAVE_LAYERS: readonly WaveLayer[] = [
  { dirX: 1.0, dirY: 0.25, wavelength: 140, amplitude: 0.55, steepness: 0.55, speed: 0.9 },
  { dirX: 0.55, dirY: -0.85, wavelength: 65, amplitude: 0.28, steepness: 0.45, speed: 1.35 },
  { dirX: -0.4, dirY: 0.9, wavelength: 32, amplitude: 0.13, steepness: 0.35, speed: 1.9 },
  { dirX: 0.15, dirY: -0.55, wavelength: 16, amplitude: 0.06, steepness: 0.25, speed: 2.6 },
].map((w) => {
  const len = Math.hypot(w.dirX, w.dirY) || 1;
  return {
    ...w,
    dirX: w.dirX / len,
    dirY: w.dirY / len,
    k: (2 * Math.PI) / w.wavelength,
  };
});

/** Defaults mirroring WaterPlaneController's leva defaults. */
export const WATER_DEFAULTS = {
  posY: 2.3,
  waveEnabled: true,
  waveHeightScale: 0.2,
  waveChoppiness: 0.9,
  waveSpeedScale: 0.78,
} as const;

/** Widened, writable shape used by setWaterConfig. */
export type WaterConfig = {
  posY: number;
  waveEnabled: boolean;
  waveHeightScale: number;
  waveChoppiness: number;
  waveSpeedScale: number;
};

/** Mutable sampling state — update via setWaterConfig when leva values change. */
const config: {
  baseline: number;
  enabled: boolean;
  height: number;
  chop: number;
  speed: number;
} = {
  baseline: WATER_DEFAULTS.posY,
  enabled: WATER_DEFAULTS.waveEnabled,
  height: WATER_DEFAULTS.waveHeightScale,
  chop: WATER_DEFAULTS.waveChoppiness,
  speed: WATER_DEFAULTS.waveSpeedScale,
};

export function setWaterConfig(next: Partial<WaterConfig>) {
  if (next.posY !== undefined) config.baseline = next.posY;
  if (next.waveEnabled !== undefined) config.enabled = next.waveEnabled;
  if (next.waveHeightScale !== undefined) config.height = next.waveHeightScale;
  if (next.waveChoppiness !== undefined) config.chop = next.waveChoppiness;
  if (next.waveSpeedScale !== undefined) config.speed = next.waveSpeedScale;
}

/**
 * Water surface height at a world (x, z) for elapsed time `t` (seconds).
 * Returns the flat baseline when waves are disabled. Zero allocation.
 */
export function sampleWaterHeight(x: number, z: number, t: number): number {
  if (!config.enabled || config.height === 0) return config.baseline;

  // world (x, z) → plane-local (x, y): mesh rotation -90° about X gives
  // local y = -world z.
  const ly = -z;
  const time = t * config.speed;

  let height = 0;
  for (let i = 0; i < WAVE_LAYERS.length; i++) {
    const w = WAVE_LAYERS[i];
    const amp = w.amplitude * config.height;
    height += amp * Math.sin(w.k * (w.dirX * x + w.dirY * ly) + w.speed * time);
  }
  return config.baseline + height;
}

/** Scratch result object reused by sampleWaterSurface — NOT stable across calls. */
export interface WaterSample {
  height: number;
  /** height − baseline: wave-only displacement (rest-pose-relative heave). */
  waveHeight: number;
  /** dh/dx in world space */
  slopeX: number;
  /** dh/dz in world space */
  slopeZ: number;
}

const scratch: WaterSample = { height: 0, waveHeight: 0, slopeX: 0, slopeZ: 0 };

/**
 * Height + surface slope at world (x, z) via central differences on
 * sampleWaterHeight. `eps` in world metres. Returns the shared scratch
 * object — copy values out before the next call.
 */
export function sampleWaterSurface(x: number, z: number, t: number, eps = 1.2): WaterSample {
  const h = sampleWaterHeight(x, z, t);
  const hx = sampleWaterHeight(x + eps, z, t);
  const hz = sampleWaterHeight(x, z + eps, t);
  scratch.height = h;
  scratch.waveHeight = h - config.baseline;
  scratch.slopeX = (hx - h) / eps;
  scratch.slopeZ = (hz - h) / eps;
  return scratch;
}
