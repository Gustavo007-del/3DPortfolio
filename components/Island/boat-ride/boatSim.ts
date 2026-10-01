// components/Island/boat-ride/boatSim.ts
//
// Pure arcade boat physics (PLAN.md §6.3). No three.js, no DOM, no
// allocation inside stepBoat — unit-testable (scripts/test-boat-sim.mjs).
//
// Heading convention: h = direction the bow points in world XZ, bow vector =
// (sin h, cos h). The hull's long axis is local ±Z (bow is local −Z in this
// GLB — verified, see boatRideConfig). steer > 0 = turn right = h decreases.

export interface BoatSim {
  x: number;
  z: number;
  heading: number;
  /** Signed speed along the bow. */
  speed: number;
  /** Actual velocity (lags the bow → slight drift). */
  vx: number;
  vz: number;
  throttle: number;
  steer: number;
  brakeHold: number;
  yawRate: number;
}

export interface BoatParams {
  maxFwd: number;
  maxRev: number;
  accel: number;
  revAccel: number;
  brakeDecel: number;
  drag: number;
  maxTurn: number;
  grip: number;
}

export interface RideInputs {
  throttle: number; // 0..1
  brake: number; // 0..1
  steer: number; // -1..1
}

export interface InputResponse {
  throttleRise: number;
  throttleFall: number;
  steerRise: number;
  steerFall: number;
  reverseDelay: number;
}

const approach = (a: number, b: number, d: number) =>
  Math.abs(b - a) <= d ? b : a + Math.sign(b - a) * d;

export function stepBoat(
  s: BoatSim,
  p: BoatParams,
  inp: RideInputs,
  cfg: InputResponse,
  dt: number
) {
  // 1) smooth inputs (keys are binary; this gives them a natural ramp)
  s.throttle = approach(
    s.throttle,
    inp.throttle,
    (inp.throttle > s.throttle ? 1 / cfg.throttleRise : 1 / cfg.throttleFall) * dt
  );
  s.steer = approach(
    s.steer,
    inp.steer,
    (Math.abs(inp.steer) > Math.abs(s.steer) ? cfg.steerRise : cfg.steerFall) * dt
  );

  // 2) longitudinal speed
  let v = s.speed;
  if (s.throttle > 0.01)
    v += p.accel * s.throttle * (1 - Math.max(v, 0) / p.maxFwd) * dt;

  if (inp.brake > 0.01) {
    if (v > 0.25) {
      v = Math.max(0, v - p.brakeDecel * inp.brake * dt);
      s.brakeHold = 0;
    } else {
      s.brakeHold += dt;
      if (s.brakeHold > cfg.reverseDelay && s.throttle < 0.01)
        v = Math.max(-p.maxRev, v - p.revAccel * dt);
      else v = approach(v, 0, p.brakeDecel * dt);
    }
  } else s.brakeHold = 0;

  // Water drag — while coasting (§13 expects speed to decay to 0 after
  // release). Under throttle it is omitted so the accel term can actually
  // reach ≥90% of maxFwd (its own `1 − v/maxFwd` factor caps it there);
  // applying drag unconditionally would pin top speed near 48% of maxFwd.
  if (s.throttle <= 0.01) v -= v * p.drag * dt;
  if (Math.abs(v) < 0.02 && s.throttle < 0.01 && inp.brake < 0.01) v = 0;

  // 3) turning (needs some way on, but can pivot a little from rest);
  // inverted in reverse
  const way = 0.3 + 0.7 * Math.min(Math.abs(v) / 6, 1);
  const dir = v >= -0.1 ? 1 : -1;
  s.yawRate = -s.steer * p.maxTurn * way * dir; // +steer = right = h decreases
  s.heading += s.yawRate * dt;

  // 4) velocity follows the bow with some slip, then integrate
  const bx = Math.sin(s.heading);
  const bz = Math.cos(s.heading);
  const k = 1 - Math.exp(-p.grip * dt);
  s.vx += (bx * v - s.vx) * k;
  s.vz += (bz * v - s.vz) * k;
  s.x += s.vx * dt;
  s.z += s.vz * dt;
  s.speed = v;
}

export function createBoatSim(x = 0, z = 0, heading = 0, speed = 0): BoatSim {
  return {
    x, z, heading, speed,
    vx: Math.sin(heading) * speed,
    vz: Math.cos(heading) * speed,
    throttle: 0, steer: 0, brakeHold: 0, yawRate: 0,
  };
}
