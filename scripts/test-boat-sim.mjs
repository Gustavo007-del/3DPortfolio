// PLAN.md §13 — unit tests for the pure boatSim step.
// Run: node scripts/test-boat-sim.mjs   (Node ≥ 22.7 strips types natively)
// Exits non-zero on any failure.

import { stepBoat, createBoatSim } from "../components/Island/boat-ride/boatSim.ts";
import { RIDE } from "../components/Island/boat-ride/boatRideConfig.ts";

const P = RIDE.boats.row; // params: maxFwd 9, brakeDecel 9, revAccel 2.5, maxTurn 1.25, drag 0.55
const CFG = RIDE.input;

let failures = 0;
function check(name, ok, detail = "") {
  if (ok) {
    console.log(`  PASS ${name}`);
  } else {
    failures++;
    console.error(`  FAIL ${name} ${detail}`);
  }
}

function run(sim, { throttle = 0, brake = 0, steer = 0 }, seconds, dt) {
  const steps = Math.round(seconds / dt);
  const inp = { throttle, brake, steer };
  for (let i = 0; i < steps; i++) stepBoat(sim, P, inp, CFG, dt);
  return sim;
}

console.log("boatSim §13 tests");

// 1) Throttle from rest reaches ≥ 90% maxFwd within ~6 s, never exceeds it.
{
  const sim = createBoatSim();
  let maxSeen = 0;
  const dt = 1 / 60;
  const inp = { throttle: 1, brake: 0, steer: 0 };
  for (let i = 0; i < 6 * 60; i++) {
    stepBoat(sim, P, inp, CFG, dt);
    maxSeen = Math.max(maxSeen, sim.speed);
  }
  check(
    "accelerates to ≥90% maxFwd in 6 s",
    sim.speed >= 0.9 * P.maxFwd,
    `(got ${sim.speed.toFixed(2)} / ${P.maxFwd})`
  );
  check("never exceeds maxFwd", maxSeen <= P.maxFwd + 1e-6, `(max ${maxSeen.toFixed(3)})`);
}

// 2) Releasing everything: speed decays to 0 and stays 0.
{
  const sim = createBoatSim();
  run(sim, { throttle: 1 }, 6, 1 / 60);
  run(sim, { throttle: 0 }, 15, 1 / 60);
  const after = sim.speed;
  run(sim, { throttle: 0 }, 2, 1 / 60);
  check("coasts to a stop", Math.abs(after) < 0.02, `(got ${after})`);
  check("stays stopped", Math.abs(sim.speed) < 1e-9, `(got ${sim.speed})`);
}

// 3) Brake from maxFwd stops in ≈ maxFwd/brakeDecel (±drag slack);
//    held > reverseDelay at rest goes into reverse, capped at maxRev.
{
  const sim = createBoatSim();
  sim.speed = P.maxFwd;
  sim.vx = Math.sin(sim.heading) * P.maxFwd;
  sim.vz = Math.cos(sim.heading) * P.maxFwd;
  const dt = 1 / 60;
  const nominal = P.maxFwd / P.brakeDecel; // 1.0 s
  let t = 0;
  while (sim.speed > 0.25 && t < 5) {
    stepBoat(sim, P, { throttle: 0, brake: 1, steer: 0 }, CFG, dt);
    t += dt;
  }
  check(
    `brake stops in ~${nominal.toFixed(2)}s (±drag)`,
    t >= nominal * 0.5 && t <= nominal * 1.5,
    `(took ${t.toFixed(2)}s)`
  );
  // Keep holding brake at rest → reverse after reverseDelay.
  for (let i = 0; i < Math.ceil(2.5 / dt); i++) {
    stepBoat(sim, P, { throttle: 0, brake: 1, steer: 0 }, CFG, dt);
  }
  // Reverse engages (fast under revAccel) and never exceeds maxRev —
  // water drag shaves the last ~1% so allow a hair of slack on the far side.
  check(
    "reverse engages and is capped at maxRev",
    sim.speed <= -P.maxRev + 0.1 && sim.speed >= -P.maxRev - 1e-6,
    `(got ${sim.speed.toFixed(3)}, maxRev ${P.maxRev})`
  );
}

// 4) steer > 0 decreases heading; turns faster at speed; reverse inverts.
{
  const slow = createBoatSim(0, 0, 0, 0);
  const fast = createBoatSim(0, 0, 0, 6);
  const dt = 1 / 60;
  for (let i = 0; i < 60 * 2; i++) {
    stepBoat(slow, P, { throttle: 0, brake: 0, steer: 1 }, CFG, dt);
    stepBoat(fast, P, { throttle: 0, brake: 0, steer: 1 }, CFG, dt);
  }
  check("steer > 0 decreases heading", slow.heading < 0, `(got ${slow.heading})`);
  check(
    "turns faster at speed than at rest",
    fast.heading < slow.heading - 1e-3,
    `(fast ${fast.heading.toFixed(3)}, slow ${slow.heading.toFixed(3)})`
  );

  const rev = createBoatSim(0, 0, 0, -2);
  const fwd = createBoatSim(0, 0, 0, 6);
  for (let i = 0; i < 60; i++) {
    stepBoat(rev, P, { throttle: 0, brake: 0, steer: 1 }, CFG, dt);
    stepBoat(fwd, P, { throttle: 0, brake: 0, steer: 1 }, CFG, dt);
  }
  check(
    "steering inverts while reversing",
    rev.heading > 0 && fwd.heading < 0,
    `(rev ${rev.heading.toFixed(3)}, fwd ${fwd.heading.toFixed(3)})`
  );
}

// 5) Determinism: same inputs at dt 1/30 vs 1/120 end close together.
{
  const a = createBoatSim(10, -8, 0.7, 0);
  const b = createBoatSim(10, -8, 0.7, 0);
  const schedule = (sim, dt) => {
    const seconds = 10;
    const steps = Math.round(seconds / dt);
    for (let i = 0; i < steps; i++) {
      const t = (i * dt) / seconds;
      stepBoat(
        sim, P,
        { throttle: t < 0.8 ? 1 : 0, brake: 0, steer: t > 0.5 ? 1 : -0.5 },
        CFG, dt
      );
    }
  };
  schedule(a, 1 / 30);
  schedule(b, 1 / 120);
  const dx = Math.abs(a.x - b.x);
  const dz = Math.abs(a.z - b.z);
  const dh = Math.abs(a.heading - b.heading);
  // Euler-heading error over a 10 s aggressive manoeuvre scales with dt;
  // tolerances are loose enough for that but catch real regressions
  // (e.g. a lost dt division lands orders of magnitude outside these).
  check(
    "1/30 vs 1/120 converge",
    dx < 0.75 && dz < 0.75 && dh < 0.08,
    `(dx ${dx.toFixed(4)}, dz ${dz.toFixed(4)}, dh ${dh.toFixed(5)})`
  );
}

if (failures > 0) {
  console.error(`\n${failures} test(s) FAILED`);
  process.exit(1);
}
console.log("\nAll boatSim tests passed");
