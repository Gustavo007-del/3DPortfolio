// components/Island/boat-ride/BoatRideController.tsx
//
// In-Canvas owner of the ridden boat (PLAN.md §4/§6):
//  - makes boats clickable (hover cursor + drag-safe tap, §5) while idle,
//  - runs stepBoat + collision + soft bounds every frame while a ride is
//    active (§6.3/§7), writing the boat's transform directly,
//  - hands over from/to the idle writer via setRiddenBoat/reseedBoatPose
//    (§6.5), freezes journey input through attachRideKeyboard (§8.2),
//  - force-exits on unmount / leaving the island phase (§3, §12).
//
// Per-frame data lives in mutable refs/objects — zero allocation in the
// frame loop.

"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RIDE, boatKindOf } from "./boatRideConfig";
import { stepBoat, createBoatSim, type BoatSim, type RideInputs } from "./boatSim";
import { attachRideKeyboard, readRideInput, rideInput } from "./boatRideInput";
import {
  getRidePhase,
  getRideState,
  startRide,
  requestRideExit,
  forceExitRide,
  setRideCamera,
  ridePose,
  useRide,
} from "./boatRideStore";
import {
  getLandMask,
  maskBlocked,
  resolveBoatCollision,
  applySoftBounds,
} from "./landMask";
import { setRiddenBoat, reseedBoatPose } from "../FortEffectsController";
import { BOAT_ORBIT } from "../fortMotionConfig";
import { sampleWaterSurface } from "../waterSampler";
import { useIsActive } from "@/components/each-frame/WorldLOD";
import { useWorldStateOptional } from "@/components/World/WorldState";
import { useJourneyOptional } from "@/components/Journey/JourneyProvider";

const BOAT_RE = /^Boat_(Row|Sail)_\d+$/;
const DRAG_SLOP_PX = 5;
const HOVER_RAYCAST_MS = 80;
const TAU = Math.PI * 2;

// One invisible hit-proxy per boat (PLAN §5): the authored hulls are thin and
// several hundred px small at journey distance, so raycasts missed clicks that
// looked dead-on. A snug inflated box per root makes every boat reliably
// clickable. Shared geometry/material; proxies survive HMR via the name check.
let hitGeo: THREE.BoxGeometry | null = null;
let hitMat: THREE.MeshBasicMaterial | null = null;

function ensureBoatHitProxies(boats: THREE.Object3D[]) {
  if (!hitGeo || !hitMat) {
    hitGeo = new THREE.BoxGeometry(1, 1, 1);
    hitMat = new THREE.MeshBasicMaterial({ visible: false });
  }
  const box = new THREE.Box3();
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  const invQ = new THREE.Quaternion();
  const worldM = new THREE.Matrix4();
  const rootInv = new THREE.Matrix4();
  const localM = new THREE.Matrix4();
  for (const b of boats) {
    const proxyName = `${b.name}__hitProxy`;
    if (b.children.some((c) => c.name === proxyName)) continue;
    box.setFromObject(b);
    if (box.isEmpty() || !Number.isFinite(box.min.x)) continue;
    box.getCenter(center);
    box.getSize(size);
    // Inflate for distant/quick clicks (screen-space slop at 100 m ≈ 1 m).
    size.x = Math.max(size.x, 2) + 1.4;
    size.z = Math.max(size.z, 3) + 1.6;
    size.y += 0.8;
    b.getWorldQuaternion(invQ).invert();
    worldM.compose(center, invQ, size);
    rootInv.copy(b.matrixWorld).invert();
    const proxy = new THREE.Mesh(hitGeo, hitMat);
    proxy.name = proxyName;
    localM.multiplyMatrices(rootInv, worldM).decompose(
      proxy.position,
      proxy.quaternion,
      proxy.scale
    );
    b.add(proxy);
  }
}

/** Walk up from a hit child mesh to the named boat root (PLAN §5). */
export function findBoatRoot(obj: THREE.Object3D | null): THREE.Object3D | null {
  for (let o = obj; o; o = o.parent) if (BOAT_RE.test(o.name)) return o;
  return null;
}

export default function BoatRideController() {
  const lodActive = useIsActive();
  const world = useWorldStateOptional();
  const journey = useJourneyOptional();
  const { camera, gl, scene } = useThree();
  const ride = useRide();

  // Latest context for DOM listeners (listeners stay mounted, read refs).
  const ctxRef = useRef({ lodActive, world, journey });
  ctxRef.current = { lodActive, world, journey };

  const simRef = useRef<BoatSim | null>(null);
  const boatObjRef = useRef<THREE.Object3D | null>(null);
  const boatsRef = useRef<THREE.Object3D[] | null>(null);
  const pointerRef = useRef({
    x: 0, y: 0, inside: false,
    down: false, downX: 0, downY: 0,
    lastRaycast: 0,
  });
  /** Boat's authored rest height — captured at click so riding never lifts
   *  boats whose hull naturally sits below the global waterline (some rest
   *  at y≈1.92, not 2.21). */
  const restYRef = useRef<number>(RIDE.waterY);
  const raycasterRef = useRef(new THREE.Raycaster());
  const ndcRef = useRef(new THREE.Vector2());
  const inputScratch = useRef<RideInputs>({ throttle: 0, brake: 0, steer: 0 }).current;
  const scratch = useRef({
    yawQuat: new THREE.Quaternion(),
    rollQuat: new THREE.Quaternion(),
    euler: new THREE.Euler(0, 0, 0, "XYZ"),
    dir: new THREE.Vector3(),
    ndc: new THREE.Vector2(),
  }).current;

  // Register the live camera for force-exit restores; dev handle (§8).
  useEffect(() => {
    setRideCamera(camera);
    if (process.env.NODE_ENV !== "production") {
      (globalThis as { __rideDebug?: unknown }).__rideDebug = {
        getRideState,
        ridePose,
        getLandMask,
        // Collision verification aids (PLAN §8) — lets tests drive
        // resolveBoatCollision against the live mask without a full ride.
        maskBlocked,
        resolveBoatCollision,
        createBoatSim,
        stepBoat,
        RIDE,
        rideInput,
        getCtk: () => ({
          lodActive: ctxRef.current.lodActive,
          worldPhase: ctxRef.current.world ? ctxRef.current.world.phase : null,
          journeyTrans: ctxRef.current.journey ? ctxRef.current.journey.isTransitioning : null,
          journeyStarted: ctxRef.current.journey ? ctxRef.current.journey.started : null,
          pointerLock: !!document.pointerLockElement,
        }),
      };
    }
    return () => {
      setRideCamera(null);
      // Route change / island scene unmount mid-ride → instant restore (§12).
      if (getRidePhase() !== "idle") forceExitRide();
      gl.domElement.style.cursor = "";
    };
  }, [camera, gl]);

  // Keyboard (Esc/arrows/WASD) only while a ride is running (§8.2).
  useEffect(() => {
    if (ride.phase === "idle") return;
    return attachRideKeyboard(() => requestRideExit());
  }, [ride.phase]);

  // Leaving the island phase mid-ride force-exits (§3).
  const worldPhase = world?.phase;
  useEffect(() => {
    if (
      ride.phase !== "idle" &&
      worldPhase !== undefined &&
      worldPhase !== "ISLAND"
    ) {
      forceExitRide();
    }
  }, [ride.phase, worldPhase]);

  // Lens/hover cursor must not stick around once the ride owns the cursor.
  useEffect(() => {
    if (ride.phase !== "idle") gl.domElement.style.cursor = "";
  }, [ride.phase, gl]);

  // ---- Boat picking: hover cursor + drag-safe click (PLAN §5) ----
  useEffect(() => {
    const el = gl.domElement;
    const p = pointerRef.current;

    const raycastBoat = (clientX: number, clientY: number): THREE.Object3D | null => {
      const boats = boatsRef.current;
      if (!boats || boats.length === 0) return null;
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      ndcRef.current.set((clientX / w) * 2 - 1, -(clientY / h) * 2 + 1);
      raycasterRef.current.setFromCamera(ndcRef.current, camera);
      const hits = raycasterRef.current.intersectObjects(boats, true);
      return hits.length > 0 ? findBoatRoot(hits[0].object) : null;
    };

    const onMove = (e: PointerEvent) => {
      p.x = e.clientX;
      p.y = e.clientY;
      p.inside = true;
      if (getRidePhase() !== "idle") return;
      const now = performance.now();
      if (now - p.lastRaycast < HOVER_RAYCAST_MS) return;
      p.lastRaycast = now;
      el.style.cursor = raycastBoat(e.clientX, e.clientY) ? "pointer" : "";
    };
    const onLeave = () => {
      p.inside = false;
      el.style.cursor = "";
    };
    const onDown = (e: PointerEvent) => {
      p.down = true;
      p.downX = e.clientX;
      p.downY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      const was = p.down;
      p.down = false;
      if (!was) return;
      if (
        Math.abs(e.clientX - p.downX) + Math.abs(e.clientY - p.downY) >
        DRAG_SLOP_PX
      ) {
        return; // camera drag, not a click
      }
      tryStartRide(e.clientX, e.clientY);
    };

    function tryStartRide(clientX: number, clientY: number) {
      const ctx = ctxRef.current;
      if (getRidePhase() !== "idle") return;
      if (document.pointerLockElement) return;
      if (ctx.lodActive === false) return;
      if (ctx.world && ctx.world.phase !== "ISLAND") return;
      // The old `journey.isTransitioning` guard is intentionally gone: that
      // flag leaks true whenever JourneyCamera unmounts mid-transition (space
      // scroll, previous ride), permanently killing every click until reload.
      // Interrupting a chapter fly is safe — JourneyCamera's remount effect
      // re-runs the fly to the current stop once the ride exits.

      const root = raycastBoat(clientX, clientY);
      if (!root) return;

      // Init the sim from the boat's live pose; keep the orbit's tangential
      // speed so a clicked boat doesn't visibly stall (§3 entering).
      const name = root.name;
      const kind = boatKindOf(name);
      const params = RIDE.boats[kind];
      restYRef.current = root.position.y;
      scratch.dir.set(0, 0, -1).applyQuaternion(root.quaternion);
      const heading = Math.atan2(scratch.dir.x, scratch.dir.z);
      const r = Math.hypot(root.position.x, root.position.z);
      const drift = BOAT_ORBIT.angularSpeed * r;
      const sim = createBoatSim(root.position.x, root.position.z, heading, drift);

      const wasRoaming = ctx.world?.roaming ?? false;
      const ok = startRide({
        boatId: name,
        camera,
        wasRoaming,
        onFinish: () => {
          // Put the hull back at its authored rest height BEFORE reseed bakes
          // the pose — otherwise reseed decomposes the forced waterline y and
          // the boat stays lifted forever.
          if (boatObjRef.current) {
            boatObjRef.current.position.y = restYRef.current;
            boatObjRef.current.updateMatrixWorld(true);
          }
          reseedBoatPose(name);
          setRiddenBoat(null);
          simRef.current = null;
          boatObjRef.current = null;
        },
      });
      if (!ok) return;

      simRef.current = sim;
      boatObjRef.current = root;
      ridePose.shake = 0;
      setRiddenBoat(name); // idle writer skips this boat from now on (§6.5)
      if (wasRoaming) ctx.world?.setRoaming(false); // restore path §2.5
      el.style.cursor = "";
    }

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.style.cursor = "";
    };
  }, [gl, camera]);

  // ---- Per-frame: simulate + write the ridden boat's transform (§6.4) ----
  useFrame((state, delta) => {
    // Boat list is available once the GLB mounts; keep collecting while empty.
    if (!boatsRef.current || boatsRef.current.length === 0) {
      const list: THREE.Object3D[] = [];
      scene.traverse((o) => {
        if (BOAT_RE.test(o.name)) list.push(o);
      });
      ensureBoatHitProxies(list);
      boatsRef.current = list;
    }

    const phase = getRidePhase();
    if (phase === "idle") return;
    const sim = simRef.current;
    const boatId = getRideState().boatId;
    const obj = boatObjRef.current;
    if (!sim || !obj || !boatId) return;

    const kind = boatKindOf(boatId);
    const params = RIDE.boats[kind];
    const dt = Math.min(delta, RIDE.maxStep);

    // Input by phase (§8.2 note): entering = zeros; exiting = brake that
    // glides to a stop WITHOUT triggering reverse (brakeHold gate).
    const inp = inputScratch;
    if (phase === "entering") {
      inp.throttle = 0;
      inp.brake = 0;
      inp.steer = 0;
    } else if (phase === "exiting") {
      inp.throttle = 0;
      inp.brake = sim.speed > 0.3 ? 1 : 0;
      inp.steer = 0;
    } else {
      readRideInput(inp);
    }

    const prevX = sim.x;
    const prevZ = sim.z;
    stepBoat(sim, params, inp, RIDE.input, dt);
    const hitShore = resolveBoatCollision(sim, params.hull, getLandMask(), prevX, prevZ);
    if (hitShore) ridePose.shake = Math.max(ridePose.shake, 0.14); // §7.2
    applySoftBounds(sim, RIDE.bounds);
    collideOtherBoats(sim, params.hull, boatId, boatsRef.current);

    // ---- Compose orientation and write (the only transform writes here) ----
    const t = state.clock.elapsedTime;
    const surf = sampleWaterSurface(sim.x, sim.z, t);
    const heave = THREE.MathUtils.clamp(surf.waveHeight * 0.9, -0.12, 0.12);

    const fx = Math.sin(sim.heading);
    const fz = Math.cos(sim.heading);
    const rx = -fz;
    const rz = fx;
    const foreSlope = surf.slopeX * fx + surf.slopeZ * fz;
    const crossSlope = surf.slopeX * rx + surf.slopeZ * rz;

    const speed01 = THREE.MathUtils.clamp(sim.speed / params.maxFwd, -1, 1);
    const leanRoll =
      -sim.steer * params.lean * Math.min(Math.abs(sim.speed) / params.maxFwd, 1);
    const roll = leanRoll - Math.atan(crossSlope);
    const pitch = Math.atan(foreSlope) + params.pitch * speed01;

    const yaw = params.bowLocalMinusZ ? sim.heading - Math.PI : sim.heading;
    scratch.yawQuat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
    scratch.euler.set(pitch, 0, roll);
    scratch.rollQuat.setFromEuler(scratch.euler);
    obj.position.set(sim.x, restYRef.current + heave, sim.z);
    obj.quaternion.copy(scratch.yawQuat).multiply(scratch.rollQuat);

    ridePose.x = sim.x;
    ridePose.z = sim.z;
    ridePose.heading = sim.heading;
    ridePose.speed = sim.speed;
  });

  return null;
}

/** Other boats are circle colliders re-read live from the scene (§7.3). */
function collideOtherBoats(
  sim: BoatSim,
  hull: { halfLen: number },
  selfId: string,
  boats: THREE.Object3D[] | null
) {
  if (!boats) return;
  const selfR = hull.halfLen;
  for (const b of boats) {
    if (b.name === selfId) continue;
    const other = RIDE.boats[boatKindOf(b.name)].hull.halfLen;
    const r = selfR + other;
    const dx = sim.x - b.position.x;
    const dz = sim.z - b.position.z;
    const d2 = dx * dx + dz * dz;
    if (d2 >= r * r || d2 < 1e-8) continue;
    const d = Math.sqrt(d2);
    const push = r - d;
    sim.x += (dx / d) * push;
    sim.z += (dz / d) * push;
    sim.vx *= 0.92;
    sim.vz *= 0.92;
    sim.speed *= 0.92;
  }
}
