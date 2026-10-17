# plan.md — "Ride a Boat" Third‑Person Mode (Island Page)

**Audience:** the coding agent that has the full codebase (Next.js + React Three Fiber).
**Companion doc:** `GLB_SCENE_CONTEXT.md` (node names, pivots, scale rules, coordinates). Read it first; this plan reuses its conventions (sanitized node names, "capture rest transform, multiply don't overwrite", single owner of each transform).
**You decide** exact file paths and store library to match the existing code. File names below are proposals.

---

## 1. Goal

On the **island page** (same scene, same route, no navigation):

1. The user **clicks any boat** (`Boat_Row_*` or `Boat_Sail_*`).
2. The camera **switches from the current view to a third‑person chase camera** behind that boat with a smooth transition.
3. The user **drives the boat**:
   - **On‑screen steering wheel** (drag to rotate, springs back to center on release)
   - **On‑screen accelerator pedal** and **brake pedal** (press and hold)
   - **Keyboard:** `↑` accelerate, `↓` brake (then reverse if held), `←` / `→` steer. `W A S D` and `Space` (brake) as aliases.
4. An **Exit button** (and `Esc`) returns the camera to the **exact previous view** with a smooth transition and re‑enables all the normal controls.

Non‑goals: multiplayer, real fluid physics, a physics engine dependency, engine sound (optional stretch), rider character (optional stretch).

---

## 2. Hard constraints from the existing architecture

These are the failure modes this codebase has already hit. Design around them from the start.

1. **One owner of the camera at a time.** Previously an unconditionally mounted `JourneyCamera` kept overwriting the shared camera and broke Roam mode. While riding, **unmount** (do not merely `enabled={false}`) every other camera writer: `JourneyCamera`, `RoamCamera`, any `CameraControls` instance, transition/corridor cameras. Mount `BoatRideCamera` only while `phase !== "idle"`. Gate this in `WorldManager` (or wherever the phase→camera mapping already lives).
2. **`frameloop="demand"`.** Riding needs continuous frames. Either call `invalidate()` from inside the ride `useFrame` every frame, or switch the Canvas to `"always"` while riding and back on exit. Follow whichever pattern the codebase already uses for continuous effects (water, particles).
3. **Zero allocation in `useFrame`.** Preallocate all `Vector3` / `Quaternion` / `Euler` temporaries at module or `useRef` level. Input is stored in mutable module objects, **not React state**, so nothing re‑renders per frame.
4. **Scroll‑driven journey.** The site is scroll‑driven; arrow keys, `Space` and the mouse wheel scroll the page. While riding: freeze journey progress (ignore wheel/touch scroll, lock body scroll, and `preventDefault()` on handled keys) and restore on exit. Journey progress must be **identical** before and after a ride.
5. **Pointer lock / Roam.** If Roam (pointer‑lock free camera) is active when a boat is clicked, it can't be — pointer lock means no cursor. But if the user was in Roam and exits pointer lock to click, remember which camera system was active and restore exactly that on exit.
6. **Other features on the island page** (from `GLB_SCENE_CONTEXT.md` §6): while riding, **disable** the cursor magnification lens, shipwreck hover/click (no navigation to Projects), and boat click‑to‑ride on other boats. Other boats keep idling.

---

## 3. State machine

```
idle ──click boat──► entering ──(transition done)──► riding ──exit──► exiting ──(transition done)──► idle
                         │                                   │
                         └───── exit/force-exit ─────────────┘   (force-exit = instant restore, no tween)
```

`phase: "idle" | "entering" | "riding" | "exiting"`, `boatId: string | null` (sanitized node name, e.g. `Boat_Sail_04`).

| Phase | Input | Boat transform owner | Camera owner | Other UI |
|---|---|---|---|---|
| `idle` | normal | idle‑bob controller | existing camera system | lens + shipwreck active |
| `entering` | ignored | ride controller (starts from current pose) | `BoatRideCamera` (tween in) | HUD fades in, lens/shipwreck off |
| `riding` | full | ride controller | `BoatRideCamera` (chase) | HUD visible |
| `exiting` | ignored (inputs zeroed) | ride controller decelerates to a stop | `BoatRideCamera` (tween out) | HUD fades out |

**Force‑exit** (no tween) on: route change, leaving the island phase, component unmount, `visibilitychange` to hidden for > few seconds is *not* required, but **window `blur` must zero the inputs**.

State that changes rarely (`phase`, `boatId`) lives in the store (use the store the app already has; otherwise `npm i zustand`). **Per‑frame data** (boat sim state, input values) lives in plain mutable objects.

---

## 4. Files (proposed)

```
components/island/boat-ride/
  boatRideConfig.ts        // all tunables (below)
  boatRideStore.ts         // phase/boatId + startRide/exitRide/forceExit
  boatRideInput.ts         // keyboard + UI input merge (module-level mutable object)
  boatSim.ts               // pure physics step (no three.js objects) — unit-testable
  landMask.ts              // 2D grid of blocked cells built from the GLB + collision helpers
  BoatRideController.tsx   // in-Canvas: owns the ridden boat's transform, runs sim each frame
  BoatRideCamera.tsx       // in-Canvas: saves old pose, tween in, chase, tween out, restores
  BoatRideHUD.tsx          // DOM overlay: wheel, pedals, exit button, speed, key hints
  SteeringWheel.tsx        // DOM component
  Pedal.tsx                // DOM component (accelerator / brake)
```

**Update existing files** (agent locates them):
- The island scene component: make boats clickable, register boats, mount `BoatRideController` + `BoatRideCamera` (conditionally), pass the land‑mask build the loaded GLB.
- `WorldManager` (or equivalent): camera gating per §2.1.
- The idle boat‑motion controller: **skip** the ridden boat; after the ride, re‑seed its rest pose from the boat's final transform (boat **stays where it was left**, it does not teleport back).
- The hover‑lens controller: disabled while `phase !== "idle"`; ridden boat excluded; update that boat's `rest` transform after exit.
- Scroll/journey manager: freeze while riding (§2.4).
- The island page/layout: mount `<BoatRideHUD />` (only when `phase !== "idle"`).

---

## 5. Making boats clickable

Boats are Groups (multi‑primitive) — pointer hits land on child meshes. Walk up to the named node:

```ts
const BOAT_RE = /^Boat_(Row|Sail)_\d+$/;
export function findBoatRoot(obj: THREE.Object3D | null): THREE.Object3D | null {
  for (let o = obj; o; o = o.parent) if (BOAT_RE.test(o.name)) return o;
  return null;
}
```

- Hover over a boat while `phase === "idle"`: `cursor: pointer` and (optional) a small "Ride" label (drei `<Html>`) or a slight emissive/scale lift.
- Click: ignore if the pointer moved > ~5 px between down and up (camera drag). Call `e.stopPropagation()`, then `startRide(root.name)`.
- Touch: a tap on a boat starts the ride (no hover step).
- Boats sit at y = 2.21; the per‑boat starting poses are in Appendix A.

---

## 6. Boat handling model (arcade, no physics engine)

Units are metres and seconds (1 Blender unit = 1 three.js unit). Boats are ≈ 3.2–4.3 m long; island is ≈ 25 × 61 m.

### 6.1 Axes and heading

- Per `GLB_SCENE_CONTEXT.md`, the hull's long axis is local **±Z** in three.js (Blender local Y). **Which end is the bow is not recorded** — determine it once per mesh type (`Boat_Row`, `Boat_Sail` — instances share a mesh) by looking at them (sail boats: bow is away from the mast side usually; verify with a debug arrow) and store it in config: `bowLocalMinusZ: boolean` per type.
- Define `heading h` = the direction the bow points in world XZ: bow vector = `(sin h, cos h)`.
- Object yaw about +Y: `θ = h` if the bow is local **+Z**, `θ = h − π` if the bow is local **−Z**.
- Initial heading from the imported pose: `dir = bowLocalAxis.applyQuaternion(boat.quaternion)`; `h = atan2(dir.x, dir.z)`.
- `steer > 0` means **turn right** (starboard) ⇒ `heading` **decreases** (three.js is right‑handed, Y up; looking down +Z, +X is on your left).

### 6.2 Tunables — `boatRideConfig.ts`

```ts
export const RIDE = {
  waterY: 2.21,                   // boats' rest height (waterline ≈ 2.19)
  maxStep: 1 / 20,                // clamp dt to avoid tunnelling on frame drops
  bounds: { cx: 0, cz: 0, radius: 95 },   // soft sea boundary (tune to world)
  mask: { cell: 1.0, half: 100 },         // land-mask grid: 200 x 200 m at 1 m cells
  boats: {
    row:  { maxFwd: 9,  maxRev: 3,   accel: 4.5, revAccel: 2.5, brakeDecel: 9, drag: 0.55,
            maxTurn: 1.25, grip: 3.0, lean: 0.10, pitch: 0.05,
            bowLocalMinusZ: true /* VERIFY */, hull: { halfLen: 1.7, halfWid: 0.6 } },
    sail: { maxFwd: 12, maxRev: 3.5, accel: 3.5, revAccel: 2.0, brakeDecel: 8, drag: 0.45,
            maxTurn: 0.95, grip: 2.5, lean: 0.14, pitch: 0.06,
            bowLocalMinusZ: true /* VERIFY */, hull: { halfLen: 2.0, halfWid: 0.9 } },
  },
  input: { throttleRise: 0.35, throttleFall: 0.25, steerRise: 3.5, steerFall: 6, reverseDelay: 0.35 },
  camera: {
    dist: 9, height: 3.6, lookAhead: 5, lookHeight: 1.2,
    posLambda: 3.5, lookLambda: 6,
    fovBase: 58, fovBoost: 10, fovLambda: 3,
    enterSec: 1.4, exitSec: 1.2,            // reduced-motion: 0.4 / 0.4
  },
} as const;
```

`row` vs `sail` is decided from the node name (`Boat_Row_*` / `Boat_Sail_*`).

### 6.3 Pure simulation step — `boatSim.ts` (reference implementation)

```ts
export interface BoatSim {
  x: number; z: number; heading: number;
  speed: number;          // signed, along the bow
  vx: number; vz: number; // actual velocity (lags bow direction → slight drift)
  throttle: number; steer: number; brakeHold: number; yawRate: number;
}
export interface BoatParams {
  maxFwd: number; maxRev: number; accel: number; revAccel: number; brakeDecel: number;
  drag: number; maxTurn: number; grip: number;
}
export interface RideInputs { throttle: number; brake: number; steer: number } // 0..1, 0..1, -1..1

const approach = (a: number, b: number, d: number) => (Math.abs(b - a) <= d ? b : a + Math.sign(b - a) * d);

export function stepBoat(s: BoatSim, p: BoatParams, inp: RideInputs,
                         cfg: { throttleRise: number; throttleFall: number; steerRise: number; steerFall: number; reverseDelay: number },
                         dt: number) {
  // 1) smooth inputs (keys are binary; this gives them a natural ramp)
  s.throttle = approach(s.throttle, inp.throttle,
    (inp.throttle > s.throttle ? 1 / cfg.throttleRise : 1 / cfg.throttleFall) * dt);
  s.steer = approach(s.steer, inp.steer,
    (Math.abs(inp.steer) > Math.abs(s.steer) ? cfg.steerRise : cfg.steerFall) * dt);

  // 2) longitudinal speed
  let v = s.speed;
  if (s.throttle > 0.01) v += p.accel * s.throttle * (1 - Math.max(v, 0) / p.maxFwd) * dt;

  if (inp.brake > 0.01) {
    if (v > 0.25) { v = Math.max(0, v - p.brakeDecel * inp.brake * dt); s.brakeHold = 0; }
    else {
      s.brakeHold += dt;
      if (s.brakeHold > cfg.reverseDelay && s.throttle < 0.01) v = Math.max(-p.maxRev, v - p.revAccel * dt);
      else v = approach(v, 0, p.brakeDecel * dt);
    }
  } else s.brakeHold = 0;

  v -= v * p.drag * dt;                                   // water drag → coasting stops
  if (Math.abs(v) < 0.02 && s.throttle < 0.01 && inp.brake < 0.01) v = 0;

  // 3) turning (needs some way on, but can pivot a little from rest); inverted in reverse
  const way = 0.3 + 0.7 * Math.min(Math.abs(v) / 6, 1);
  const dir = v >= -0.1 ? 1 : -1;
  s.yawRate = -s.steer * p.maxTurn * way * dir;           // +steer = right = heading decreases
  s.heading += s.yawRate * dt;

  // 4) velocity follows the bow with some slip, then integrate
  const bx = Math.sin(s.heading), bz = Math.cos(s.heading);
  const k = 1 - Math.exp(-p.grip * dt);
  s.vx += (bx * v - s.vx) * k;
  s.vz += (bz * v - s.vz) * k;
  s.x += s.vx * dt; s.z += s.vz * dt;
  s.speed = v;
}
```

Collision / bounds are applied **after** `stepBoat` by `landMask.ts` (see §7).

### 6.4 Applying the sim to the boat object

Each frame in `BoatRideController` (clamp `dt = min(dt, RIDE.maxStep)`):

1. Read merged input (§8) → `stepBoat` → collision resolve.
2. Set `boat.position.set(x, waterY + heave, z)`.
3. Build orientation: `q = yaw(θ) * roll * pitch` where
   - **roll** = `−steer * lean * min(|speed|/maxFwd, 1)` (lean into turns) + small wave roll,
   - **pitch** = `−pitch * speed/maxFwd` (bow rises with speed) + small wave pitch,
   - roll axis = hull long axis (local Z), pitch axis = local X (verify visually).
4. Wave motion: **reuse the idle‑bob function** from the boat‑motion spec, or — better — sample the site's Gerstner wave function on the CPU at `(x, z, t)` for heave and derive roll/pitch from its slope (`getWaterHeight(x,z,t)` must mirror the shader; if only the shader has it, use the sinusoid fallback).
5. Never write `boat.scale`; leave the imported scale untouched.

### 6.5 Handover with the idle/lens controllers

- On `startRide`: mark the boat `ridden = true` in whatever registry the idle and lens controllers share. They skip it.
- On exit complete: write the final position/quaternion back into that boat's **rest transform**, clear `ridden`. The idle bob continues around the new rest pose.

---

## 7. Collision and bounds

Goal: the boat can't sail through the island, rocks, fort, shipwreck, or off into the void. No physics engine.

### 7.1 Land mask built from the GLB at load (recommended)

Instead of hand‑placing colliders, build a 2D occupancy grid once:

1. Collect **static blockers**: `Plane` (island ground), all `Icosphere*` rocks, the fort cubes (`Material.003` / `Material.004`), `Shipwreck`. **Exclude** `Plane001` (water), `Material.006` mountains, barbarians, boats, vegetation.
2. For each grid cell center `(x, z)` in `[-half, +half]²` at `cell` metres, cast a ray straight down from `y = +25` against the blockers (use `three-mesh-bvh` if already installed, otherwise plain `Raycaster` — 200×200 m at 1 m = 40k rays; chunk it across a few frames or use `cell: 2`).
3. Mark the cell **blocked** if the highest hit is above `waterY + 0.35`.
4. **Dilate** the blocked set by 1 cell so the hull doesn't visually clip.
5. Cache the result (optional: bake to JSON at build time).

Note the island ground `Plane` spans roughly x ∈ [−12.7, 12.0], z ∈ [−30.6, 30.5] (three coords) but slopes into the water, and rocks extend the footprint to x ∈ [−25, 16], z ∈ [−33.5, 31]. The mask discovers the true shoreline automatically.

### 7.2 Collision response (after `stepBoat`)

- Probe **5 points** in the boat frame: bow, stern, port, starboard, center (use `hull.halfLen/halfWid`).
- If any probe is blocked: revert to the previous position; try moving along **x only**, then **z only** to slide along the shore.
- Compute the surface normal from the mask gradient (central differences on neighbouring cells), then reflect: `v -= (1 + 0.2)(v·n)n`, `speed *= 0.6`, damp `vx, vz` accordingly. Trigger a tiny camera shake (skip under reduced motion).
- **Soft boundary:** outside `bounds.radius` apply an inward push proportional to overshoot and bleed speed; show no hard wall.

### 7.3 Other boats

Treat the 8 other boats as **circle colliders** (radius ≈ `hull.halfLen`) that are re‑read each frame from their current positions; on overlap, push the ridden boat out along the center‑to‑center line and reduce speed. (Optional: nudge the other boat slightly.)

---

## 8. Input

### 8.1 Merge rule

```
throttle = max(keyThrottle, uiThrottle)          // 0..1
brake    = max(keyBrake,    uiBrake)             // 0..1
steer    = |uiWheel| > 0.001 ? uiWheel : keySteer   // -1..1 (wheel wins while touched)
```

### 8.2 `boatRideInput.ts` (reference)

```ts
export const rideInput = {
  keyThrottle: 0, keyBrake: 0, keySteer: 0,   // written by keyboard
  uiThrottle: 0, uiBrake: 0, uiWheel: 0,      // written by on-screen controls
};

const down = new Set<string>();
const HANDLED = new Set(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","KeyW","KeyA","KeyS","KeyD","Space"]);

function recompute() {
  rideInput.keyThrottle = down.has("ArrowUp") || down.has("KeyW") ? 1 : 0;
  rideInput.keyBrake    = down.has("ArrowDown") || down.has("KeyS") || down.has("Space") ? 1 : 0;
  rideInput.keySteer    = (down.has("ArrowRight") || down.has("KeyD") ? 1 : 0)
                        - (down.has("ArrowLeft")  || down.has("KeyA") ? 1 : 0);
}
const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export function resetRideInput() {
  down.clear();
  rideInput.keyThrottle = rideInput.keyBrake = rideInput.keySteer = 0;
  rideInput.uiThrottle = rideInput.uiBrake = rideInput.uiWheel = 0;
}

/** Attach while phase !== "idle". Returns a detach function. */
export function attachRideKeyboard(onExit: () => void) {
  const kd = (e: KeyboardEvent) => {
    if (isTyping(e.target)) return;
    if (e.code === "Escape") { e.preventDefault(); onExit(); return; }
    if (HANDLED.has(e.code)) { e.preventDefault(); down.add(e.code); recompute(); }
  };
  const ku = (e: KeyboardEvent) => { if (HANDLED.has(e.code)) { down.delete(e.code); recompute(); } };
  const blur = () => resetRideInput();
  window.addEventListener("keydown", kd, { passive: false });
  window.addEventListener("keyup", ku);
  window.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", blur);
  return () => {
    window.removeEventListener("keydown", kd);
    window.removeEventListener("keyup", ku);
    window.removeEventListener("blur", blur);
    document.removeEventListener("visibilitychange", blur);
    resetRideInput();
  };
}

export function readRideInput(out: { throttle: number; brake: number; steer: number }) {
  out.throttle = Math.max(rideInput.keyThrottle, rideInput.uiThrottle);
  out.brake    = Math.max(rideInput.keyBrake, rideInput.uiBrake);
  out.steer    = Math.abs(rideInput.uiWheel) > 0.001 ? rideInput.uiWheel : rideInput.keySteer;
}
```

While `phase` is `entering` or `exiting`, feed the sim zeros (exiting: brake = 1 so the boat glides to a stop).

### 8.3 `SteeringWheel.tsx` (reference)

Requirements: drag to rotate by **angle around the wheel center**, clamp ±140° ⇒ `uiWheel ∈ [−1, 1]`, spring back to 0 on release, works with mouse, touch and pen, does not block simultaneous pedal presses (multi‑touch), `touch-action: none`.

```tsx
"use client";
import { useRef, PointerEvent } from "react";
import { rideInput } from "./boatRideInput";

const MAX_DEG = 140;
const norm = (d: number) => ((d + 540) % 360) - 180;

export function SteeringWheel({ size = 180 }: { size?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const st = useRef({ id: -1, start: 0, base: 0, rot: 0, raf: 0 });

  const apply = (deg: number) => {
    const r = Math.max(-MAX_DEG, Math.min(MAX_DEG, deg));
    st.current.rot = r;
    if (el.current) el.current.style.transform = `rotate(${r}deg)`;
    rideInput.uiWheel = r / MAX_DEG;
  };
  const angle = (e: PointerEvent) => {
    const b = el.current!.getBoundingClientRect();
    return (Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)) * 180) / Math.PI;
  };
  const spring = () => {
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05); last = t;
      const next = st.current.rot * Math.exp(-10 * dt);
      if (Math.abs(next) < 0.4) { apply(0); return; }
      apply(next);
      st.current.raf = requestAnimationFrame(tick);
    };
    st.current.raf = requestAnimationFrame(tick);
  };

  const down = (e: PointerEvent) => {
    cancelAnimationFrame(st.current.raf);
    st.current.id = e.pointerId;
    st.current.start = angle(e);
    st.current.base = st.current.rot;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (e.pointerId !== st.current.id) return;
    apply(st.current.base + norm(angle(e) - st.current.start));
  };
  const up = (e: PointerEvent) => {
    if (e.pointerId !== st.current.id) return;
    st.current.id = -1;
    spring();
  };

  return (
    <div
      ref={el}
      role="slider" aria-label="Steering wheel" aria-valuemin={-1} aria-valuemax={1}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      onContextMenu={(e) => e.preventDefault()}
      style={{ width: size, height: size, touchAction: "none", userSelect: "none", cursor: "grab" }}
    >
      {/* Draw with SVG: rim (circle stroke), 3 spokes, hub, a marker at 12 o'clock so rotation is visible */}
    </div>
  );
}
```

Design the SVG to match the site's look. The 12 o'clock marker is required so the rotation reads clearly.

### 8.4 `Pedal.tsx` (reference)

```tsx
"use client";
import { PointerEvent, useState } from "react";
import { rideInput } from "./boatRideInput";

export function Pedal({ kind, label }: { kind: "throttle" | "brake"; label: string }) {
  const [pressed, setPressed] = useState(false);   // local UI state only (one re-render per press, fine)
  const key = kind === "throttle" ? "uiThrottle" : "uiBrake";
  const set = (v: 0 | 1) => { rideInput[key] = v; setPressed(v === 1); };
  return (
    <button
      type="button" aria-label={label}
      onPointerDown={(e: PointerEvent) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); set(1); }}
      onPointerUp={() => set(0)} onPointerCancel={() => set(0)} onLostPointerCapture={() => set(0)}
      onContextMenu={(e) => e.preventDefault()}
      style={{ touchAction: "none", userSelect: "none",
               transform: pressed ? "translateY(4px) scale(0.98)" : "none" }}
    >
      {label}
    </button>
  );
}
```

Style: tall rounded pedal pads (≈ 72 × 110 px), accelerator visibly larger/accent color, brake in red‑ish; a pressed state; icons optional.

---

## 9. Camera — `BoatRideCamera.tsx`

### 9.1 Save / restore

On `startRide`, before anything moves, capture **a full snapshot of the current camera** (use `useThree().camera`):

- `position`, `quaternion`, `fov`, `near`, `far`, `zoom`
- if a `CameraControls` instance exists: its `getTarget()` and `getPosition()`
- which camera system was active (Journey / Roam / other) so it can be re‑enabled

Exit tweens back to that snapshot (fixed world pose), and only **after** the tween ends: restore FOV/near/far, call `controls.setLookAt(pos, target, false)` if applicable, **remount** the previous camera system, then set `phase = "idle"`. The previous system must start from exactly the saved pose so there's no visible pop.

### 9.2 Enter transition (`enterSec` ≈ 1.4 s)

Interpolate from the saved pose to the **live** chase pose (which keeps moving as the boat drifts):
`t = smootherstep(elapsed / enterSec)`; `pos = lerp(saved.pos, chase.pos, t)`; `quat = slerp(saved.quat, chase.quat, t)`; `fov = lerp(saved.fov, chaseFov, t)`. Input is ignored until `t = 1`, then `phase = "riding"`.

### 9.3 Chase step (per frame, zero allocation)

```ts
// state: camPos, camLook (Vector3, persistent). scratch: desired, desiredLook (Vector3)
const bx = Math.sin(sim.heading), bz = Math.cos(sim.heading);
desired.set(sim.x - bx * C.dist, RIDE.waterY + C.height, sim.z - bz * C.dist);
desiredLook.set(sim.x + bx * C.lookAhead, RIDE.waterY + C.lookHeight, sim.z + bz * C.lookAhead);

const kp = 1 - Math.exp(-C.posLambda * dt);          // frame-rate independent damping
const kl = 1 - Math.exp(-C.lookLambda * dt);
camPos.lerp(desired, kp);
camLook.lerp(desiredLook, kl);

camera.position.copy(camPos);
camera.lookAt(camLook);

const speed01 = Math.min(Math.abs(sim.speed) / params.maxFwd, 1);
camera.fov += (C.fovBase + C.fovBoost * speed01 - camera.fov) * (1 - Math.exp(-C.fovLambda * dt));
camera.updateProjectionMatrix();                      // only when fov changed meaningfully
```

The horizontal lag in `posLambda` produces the "camera swings around behind you in turns" feel. Keep the camera above the waterline (`y ≥ waterY + 1`). Optional stretch: drag to orbit around the boat with an auto‑recenter after 2 s idle.

### 9.4 Exit transition (`exitSec` ≈ 1.2 s)

`phase = "exiting"` → inputs forced to zero + full brake; tween from the **current camera pose** to the saved snapshot with the same easing; the boat keeps gliding to a stop meanwhile. Then §9.1 restore.

Reduced motion (`prefers-reduced-motion`): use 0.4 s transitions, no FOV boost, no camera shake.

---

## 10. HUD — `BoatRideHUD.tsx`

Mounted only when `phase !== "idle"`; fade in/out with the transition. Use a full‑screen container `position: fixed; inset: 0; pointer-events: none;` and give each control `pointer-events: auto`. Above the canvas, below any modal.

Layout (landscape first, scale down on small screens; respect `env(safe-area-inset-*)`):

- **Bottom‑left:** steering wheel (170–190 px; 140 px on small screens).
- **Bottom‑right:** brake pedal, then accelerator pedal to its right (car‑style order).
- **Top‑right:** **Exit** button (clear label, e.g. "✕ Exit boat"), always visible, keyboard‑focusable. Also bound to `Esc`.
- **Top‑left or bottom‑center:** speed readout (e.g. `sim.speed` in knots or m/s, updated via a ref + `requestAnimationFrame` text write, not React state) and the boat name.
- **Key hints** (desktop only, fade after ~6 s): `↑ accelerate · ↓ brake · ← → steer · Esc exit`.
- Hide or dim scroll hints, journey UI and other overlays while riding.

Accessibility: buttons have `aria-label`s; Exit is reachable by keyboard (`Tab`); announce "Riding <boat name>" to a polite live region; all animation respects reduced motion.

---

## 11. Setup and instructions (do in this order)

1. **Read** `GLB_SCENE_CONTEXT.md` and run its §8 verification snippet; confirm boat node names (`Boat_Row_02/03/05/07/09`, `Boat_Sail_01/04/06/08`) and that names have no dots.
2. **Dependencies:** none are required. Install only what is missing:
   - store: `npm i zustand` (skip if the app already has a store)
   - optional, for the land‑mask build speed: `npm i three-mesh-bvh`
3. **Config + pure logic:** create `boatRideConfig.ts`, `boatSim.ts`, `boatRideInput.ts`; add unit tests for `stepBoat` (§13).
4. **Bow direction:** add a temporary debug arrow on each boat type, decide `bowLocalMinusZ` for `row` and `sail`, remove the arrow.
5. **Land mask:** implement `landMask.ts`, build it after the GLB loads; add a dev overlay (toggle) that draws blocked cells so the shoreline can be checked visually.
6. **Store + click:** implement `boatRideStore.ts`, `findBoatRoot`, boat `onClick`/hover in the island scene.
7. **Controller:** `BoatRideController` — owns the ridden boat's transform, runs `stepBoat` + collisions, applies wave/lean (§6.4), handles the idle/lens handover (§6.5).
8. **Camera:** `BoatRideCamera` — snapshot/restore, enter/chase/exit; gate other cameras in `WorldManager` (§2.1) and manage `invalidate()` / frameloop (§2.2).
9. **HUD:** `SteeringWheel`, `Pedal`, `BoatRideHUD`; attach the keyboard listener only while riding; lock scroll (§2.4).
10. **Integrations:** disable lens + shipwreck interactions while riding; freeze journey progress; force‑exit hooks (route change, phase change, unmount).
11. **Tune** the values in `boatRideConfig.ts` by driving each boat type (feel: responsive but weighty, no jitter, easy to steer at low speed).
12. **Mobile pass:** two‑thumb play (wheel + pedal simultaneously), portrait and landscape, safe areas, performance.
13. **Run the acceptance checklist** (§14).

Client‑only rules: every file touching `window`, `document` or three objects is `"use client"`; no `window` access at module scope (SSR).

---

## 12. Edge cases to handle

- Click during a camera transition (journey/corridor): ignore boat clicks unless the island phase is fully active and idle.
- Rapid double click on a boat / Exit spam: state machine must ignore transitions that aren't valid from the current phase.
- Window blur or tab hidden while a key/pedal is held: inputs reset to zero.
- Touch: wheel and a pedal held simultaneously; a pointer that leaves the element (capture keeps it); `pointercancel`.
- Resize / orientation change during ride: HUD reflows; camera aspect updates normally.
- Low FPS: `dt` clamped to 1/20 s; damping uses `1 − exp(−λ·dt)` so behavior is frame‑rate independent.
- Boat ends up near land at exit: it stays there, but the idle bob must not push it into the shore (idle amplitudes are tiny; fine).
- Riding then scrolling with a trackpad or touch: journey stays frozen; nothing scrolls.
- Leaving the island page mid‑ride: `forceExit()` restores everything instantly, listeners removed.
- Boats are shared‑mesh instances — never mutate geometry or materials; only node transforms.

---

## 13. Tests

Unit (pure `boatSim.ts`):
- Holding throttle from rest reaches ≥ 90% of `maxFwd` within ~6 s and never exceeds `maxFwd`.
- Releasing everything: speed decays to 0 (drag) and stays 0.
- Brake from `maxFwd` stops in `≈ maxFwd / brakeDecel` seconds (± drag); brake held > `reverseDelay` at rest goes into reverse, capped at `maxRev`.
- `steer > 0` decreases `heading`; steering at rest turns slowly, at speed turns faster; reverse inverts.
- Determinism: same inputs with `dt = 1/30` vs `1/120` end within a small tolerance of each other.

Manual / E2E:
- Every acceptance item below on desktop (mouse + keyboard) and a touch device.

---

## 14. Acceptance checklist

- [ ] Clicking any of the 9 boats starts a ride; clicking a non‑boat does nothing new; drag‑clicks don't trigger.
- [ ] Camera transitions smoothly into a chase view behind the boat; no snapping, no double camera writers (verify by mounting order/logs during dev only).
- [ ] Wheel, accelerator and brake work with mouse and touch, simultaneously; wheel springs to center.
- [ ] Arrow keys (and WASD/Space) work; the page never scrolls while riding; Esc exits.
- [ ] Boat accelerates, coasts, brakes, reverses, and turns with a slight drift; leans into turns; rides on the waves.
- [ ] The boat can't enter the island, rocks, fort, shipwreck, or leave the sea bounds; collisions slide instead of sticking.
- [ ] Exit button and `Esc` tween back to the **exact** previous view, previous camera system resumes correctly, journey progress unchanged.
- [ ] After exit the ridden boat stays where it was left and resumes idle bobbing; hover lens works again; shipwreck hover/click works again.
- [ ] While riding: no lens magnification, no shipwreck hover/click, other boats still idle.
- [ ] Route change / unmount mid‑ride leaves no stuck listeners, no frozen scroll, no orphaned HUD.
- [ ] `frameloop` behaves (no stutter, no runaway invalidation after exit).
- [ ] No per‑frame allocations in the ride loop; steady 60 fps on a mid laptop; acceptable on mobile.
- [ ] Reduced‑motion users get short transitions and no camera shake/FOV boost.

---

## 15. Open decisions (defaults chosen — owner may override)

1. The boat **stays where it was left** after exit (default) vs. returns to its original spot.
2. Reverse via holding brake (default) vs. a separate reverse control.
3. Steering inverted while reversing (default: yes).
4. Wave motion: CPU‑mirror of the Gerstner function (preferred) vs. sinusoid fallback.
5. Optional stretches: wake/foam particles using the existing particle engine, a rider figure (clone a barbarian mesh seated in the boat), engine/water audio, orbit‑look while riding.
6. Speed units in the HUD (m/s vs knots).

---

## Appendix A — Boat starting poses (from the source scene)

Positions in **three.js** coordinates `(x, y, z)`; yaw is the Blender Z rotation in degrees (same sense as three's Y rotation). Rest poses also include ±2° roll/pitch and a uniform scale of 0.92–1.15. **Read the real values from the GLB nodes; this table is for sanity checks.**

| Node | Type | three (x, y, z) | Yaw° | Size (m, incl. scale) |
|---|---|---|---|---|
| `Boat_Row_02` | row | (24, 2.21, 46) | 184.3 | 1.23 × 3.45 × 0.72 |
| `Boat_Row_03` | row | (44, 2.21, 8) | 109.2 | 1.27 × 3.55 × 0.74 |
| `Boat_Row_05` | row | (18, 2.21, −46) | 221.6 | 1.37 × 3.85 × 0.81 |
| `Boat_Row_07` | row | (−36, 2.21, −6) | 167.0 | 1.14 × 3.18 × 0.67 |
| `Boat_Row_09` | row | (6, 2.21, 52) | 100.1 | 1.23 × 3.44 × 0.72 |
| `Boat_Sail_01` | sail | (36, 2.21, 30) | 167.6 | 2.43 × 4.25 × 3.85 |
| `Boat_Sail_04` | sail | (32, 2.21, −16) | 15.1 | 2.21 × 3.88 × 3.51 |
| `Boat_Sail_06` | sail | (−30, 2.21, −34) | 21.4 | 2.25 × 3.95 × 3.57 |
| `Boat_Sail_08` | sail | (−26, 2.21, 40) | 230.5 | 2.42 × 4.24 × 3.84 |

World reference (three coords): water level y = 2.19; island ground `Plane` x ∈ [−12.7, 12.0], z ∈ [−30.6, 30.5]; rock ring x ∈ [−25.4, 15.7], z ∈ [−33.5, 31.1]; fort z ∈ [−26.9, 4.1] (north of the causeway, toward −Z); shipwreck x ∈ [8.8, 15.2], z ∈ [11.1, 19.7]; boats roam x ∈ [−37, 46], z ∈ [−48, 53]. Distant backdrop (water plane ±504 m, mountains to ±550 m) is irrelevant to riding — exclude from collision.
