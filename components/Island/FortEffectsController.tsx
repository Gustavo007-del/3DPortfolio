// components/Island/FortEffectsController.tsx
//
// ONE component, ONE useFrame, ONE writer for every animated node's transform
// (PLAN.md §6.4: all layers compose through a single controller:
// final = rest ∘ idle ∘ hover). Per frame, per entity:
//
//   scale    = restScale * lensScale                    (multiplicative)
//   rotation = restQuat ∘ idleQuat                      (local compose)
//   position = restPos + waterHeave − baseLift(s−1) − clusterSwayLift
//
// Zero per-frame allocations; all math on preallocated scratch objects.
// The scene object is pushed in from the GLB mount via `registerFortScene`
// (module-level registry, so nothing re-renders when it arrives).

"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  buildFortEntities,
  isBackdropNode,
  type FortEntity,
  type FireMaterialRef,
  type Category,
} from "./fortEntities";
import {
  BOAT_MOTION,
  BOAT_ORBIT,
  WRECK_MOTION,
  PLANK_MOTION,
  SWAY,
  FIRE_FLICKER,
  LENS,
  LENS_MAX_SCALE,
} from "./fortMotionConfig";
import { sampleWaterSurface } from "./waterSampler";
import { useIsActive } from "@/components/each-frame/WorldLOD";
import { useWorldStateOptional } from "@/components/World/WorldState";
import { isRideActive } from "./boat-ride/boatRideStore";
import { scheduleLandMaskBuild } from "./boat-ride/landMask";

export interface WreckPointerPayload {
  /** Raycast hit wreck/plank geometry under the cursor. */
  hovered: boolean;
  /** Projected mast-top anchor (CSS px within the canvas). */
  anchorX: number;
  anchorY: number;
  anchorVisible: boolean;
}

// ---------------------------------------------------------------------------
// Module-level scene registry: the GLB mount calls registerFortScene(scene),
// the controller consumes it. Avoids context plumbing and keeps this file
// render-free.
// ---------------------------------------------------------------------------
type WreckListener = (payload: WreckPointerPayload) => void;

const registry: {
  scene: THREE.Object3D | null;
  camera: THREE.Camera | null;
  entities: FortEntity[];
  /** Lens scale slot per entity: [scale, atRest] — mirrored from the comp ref. */
  motion: Float32Array;
  /** Parallel to the orbit-bearing slice of `entities`. */
  orbits: OrbitState[];
  fires: FireMaterialRef[];
  wreckRoot: THREE.Object3D | null;
  wreckAnchor: THREE.Vector3 | null;
  raycastTargets: THREE.Object3D[];
  listeners: Set<WreckListener>;
} = {
  scene: null,
  camera: null,
  entities: [],
  motion: new Float32Array(0),
  orbits: [],
  fires: [],
  wreckRoot: null,
  wreckAnchor: null,
  raycastTargets: [],
  listeners: new Set(),
};

const HOVER_CATS: ReadonlySet<Category> = new Set<Category>(["shipwreck", "plank"]);

/** Categories with always-on idle motion — never eligible for the parked skip. */
const CONTINUOUS_IDLE: ReadonlySet<Category> = new Set<Category>([
  "boatRow",
  "boatSail",
  "shipwreck",
  "plank",
  "tree",
  "shore",
]);

/**
 * Per-boat orbit state (parallel to the boats slice of the entity list):
 * current angle (radians) and current radius (metres). Radius eases from the
 * authored mooring radius toward the cruising radius over ~minutes.
 */
interface OrbitState {
  angle: number;
  radius: number;
}

/**
 * Yaw (radians) of a boat whose polar angle is `angle` (position at
 * (sinθ·r, cosθ·r)) while drifting with polar direction `dir` (+1 = CCW).
 * Derived from the velocity bearing so heading always matches travel.
 */
function orbitYawAt(angle: number, dir: number): number {
  return Math.atan2(Math.cos(angle) * dir, -Math.sin(angle) * dir);
}

const UP_AXIS = new THREE.Vector3(0, 1, 0);

/** Live canvas pointer state, shared with the throttled emit below. */
const lastPointer = { x: 0, y: 0, inside: false };

/** GPU resources of the hover proxies, freed when the scene is released. */
let activeProxyDisposables: Array<{ dispose(): void }> = [];

/**
 * The boat currently owned by the ride controller (PLAN §6.5): the idle
 * writer skips it entirely — no bob, no orbit advance, no lens scale — until
 * the ride finishes and the pose is reseeded.
 */
let riddenBoat: string | null = null;

export function setRiddenBoat(name: string | null) {
  if (name && riddenBoat !== name) {
    // Snap any in-flight lens magnification back to rest so the boat can't
    // freeze at a scaled size while the ride owns its transform.
    const ei = registry.entities.findIndex((e) => e.root.obj.name === name);
    if (ei >= 0 && registry.motion.length === registry.entities.length * 2) {
      const e = registry.entities[ei];
      for (const ns of e.nodes) ns.obj.scale.copy(ns.restScale);
      registry.motion[ei * 2] = 1;
      registry.motion[ei * 2 + 1] = 1;
    }
  }
  riddenBoat = name;
}

/**
 * On ride exit, re-capture the ridden boat's rest transforms (and orbit
 * state) from its final pose — the boat stays where it was left and the
 * idle bob + slow orbit resume around the new spot (PLAN §6.5, §15.1).
 */
export function reseedBoatPose(name: string) {
  const ei = registry.entities.findIndex((e) => e.root.obj.name === name);
  if (ei < 0) return;
  const e = registry.entities[ei];
  const obj = e.root.obj;
  obj.updateMatrixWorld(true);

  for (const ns of e.nodes) {
    ns.obj.matrixWorld.decompose(ns.restPosition, ns.restQuaternion, ns.restScale);
    const box = new THREE.Box3().setFromObject(ns.obj);
    if (Number.isFinite(box.min.y)) {
      ns.baseOffsetY = Math.max(0, ns.restPosition.y - box.min.y);
    }
  }

  // Lens bounds follow the new pose.
  const box = new THREE.Box3().setFromObject(obj);
  if (!box.isEmpty() && Number.isFinite(box.min.x)) {
    box.getCenter(e.center);
    const size = new THREE.Vector3();
    box.getSize(size);
    e.boundingRadius = 0.5 * size.length();
  }

  // Orbit resumes from the left-behind position (clamped so it can't cut
  // through the island over the following minutes).
  if (e.orbit) {
    const dx = obj.position.x;
    const dz = obj.position.z;
    const r0 = Math.max(1e-3, Math.hypot(dx, dz));
    e.orbit.radius0 = r0;
    e.orbit.radius = THREE.MathUtils.clamp(
      r0,
      BOAT_ORBIT.radiusMin,
      BOAT_ORBIT.radiusMax
    );
    e.orbit.angle = Math.atan2(dx, dz);
    let oi = 0;
    for (let i = 0; i < ei; i++) if (registry.entities[i].orbit) oi++;
    const os = registry.orbits[oi];
    if (os) {
      os.angle = e.orbit.angle;
      os.radius = r0;
    }
  }
  if (registry.motion.length === registry.entities.length * 2) {
    registry.motion[ei * 2] = 1;
    registry.motion[ei * 2 + 1] = 1;
  }
}

/** Called once by the GLB mount (Mountain) after the scene loads. */
export function registerFortScene(scene: THREE.Object3D) {
  if (registry.scene === scene) return;
  releaseFortScene();
  scene.updateMatrixWorld(true);

  const entities = buildFortEntities(scene);

  // Collision grid for the boat-ride mode (PLAN §7.1) — chunked build.
  scheduleLandMaskBuild(scene);

  // Backdrop (mountains, ground, water) must never intercept rays (PLAN §6.3).
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    let n: THREE.Object3D | null = obj;
    while (n) {
      if (n.parent === scene && isBackdropNode(n)) {
        mesh.raycast = () => {};
        break;
      }
      n = n.parent;
    }
  });

  const fires: FireMaterialRef[] = [];
  let wreckRoot: THREE.Object3D | null = null;
  let wreckMaxY = -Infinity;
  const raycastTargets: THREE.Object3D[] = [];
  for (const e of entities) {
    for (const f of e.fireMaterials) fires.push(f);
    if (HOVER_CATS.has(e.category)) raycastTargets.push(e.root.obj);
    if (e.category === "shipwreck") {
      wreckRoot = e.root.obj;
      const box = new THREE.Box3().setFromObject(e.root.obj);
      if (Number.isFinite(box.max.y)) wreckMaxY = box.max.y;
    }
  }

  // Invisible solid proxies for hover/tap (PLAN §6.2): the authored wreck
  // meshes are sparse open shells, so exact-triangle raycasts miss even at
  // their own screen centre. A snug Box3-fit box per root gives a stable
  // target. Computed in world space, then converted into the root's local
  // space (handles rotated/scaled roots — 371 non-unit nodes in this GLB).
  {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ visible: false });
    activeProxyDisposables.push(geo, mat);
    const box = new THREE.Box3();
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    const invQuat = new THREE.Quaternion();
    const worldM = new THREE.Matrix4();
    const rootInv = new THREE.Matrix4();
    const localM = new THREE.Matrix4();
    for (const e of entities) {
      if (!HOVER_CATS.has(e.category)) continue;
      box.setFromObject(e.root.obj);
      if (box.isEmpty() || !Number.isFinite(box.min.x)) continue;
      box.getCenter(center);
      box.getSize(size);
      e.root.obj.getWorldQuaternion(invQuat).invert();
      worldM.compose(center, invQuat, size);
      rootInv.copy(e.root.obj.matrixWorld).invert();
      const proxy = new THREE.Mesh(geo, mat);
      proxy.name = `${e.root.obj.name}__hoverProxy`;
      localM.multiplyMatrices(rootInv, worldM).decompose(
        proxy.position,
        proxy.quaternion,
        proxy.scale
      );
      e.root.obj.add(proxy);
      raycastTargets.push(proxy);
    }
  }

  registry.scene = scene;
  registry.entities = entities;
  registry.fires = fires;
  registry.wreckRoot = wreckRoot;
  registry.raycastTargets = raycastTargets;
  registry.wreckAnchor =
    wreckRoot && Number.isFinite(wreckMaxY)
      ? new THREE.Vector3(wreckRoot.position.x, wreckMaxY + 1.0, wreckRoot.position.z)
      : null;

  // Dev-only introspection handle (PLAN §8 verification aid).
  if (process.env.NODE_ENV !== "production") {
    (globalThis as { __fortDebug?: unknown }).__fortDebug = registry;
  }
}

/** Called on unmount / scene swap so nothing keeps transforming a dead scene. */
export function releaseFortScene() {
  for (const r of activeProxyDisposables) r.dispose();
  activeProxyDisposables = [];
  riddenBoat = null;
  registry.scene = null;
  registry.camera = null;
  registry.entities = [];
  registry.motion = new Float32Array(0);
  registry.orbits = [];
  registry.fires = [];
  registry.wreckRoot = null;
  registry.wreckAnchor = null;
  registry.raycastTargets = [];
}

/** Subscribe to throttled shipwreck pointer state (used by the info bar). */
export function addWreckPointerListener(fn: WreckListener): () => void {
  registry.listeners.add(fn);
  return () => registry.listeners.delete(fn);
}

// ---------------------------------------------------------------------------

const SCALE_EPS = 1e-3;
const TAU = Math.PI * 2;

export default function FortEffectsController({
  active,
}: {
  /** Overrides the "island phase active" gate when provided. */
  active?: boolean;
}) {
  const lodActive = useIsActive();
  const world = useOptionalWorldState();
  const { gl, camera, size } = useThree();

  const entitiesRef = useRef<FortEntity[]>([]);
  const motionRef = useRef<Float32Array>(new Float32Array(0));
  const orbitsRef = useRef<OrbitState[]>([]);
  const dynamicActiveRef = useRef<boolean | null>(null);
  const pointerRef = useRef({ x: -1e5, y: -1e5, inside: false });
  const lensRadiusRef = useRef(LENS.radiusPx);
  const touchRef = useRef(false);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const emitAccRef = useRef(0);

  // Preallocated scratch (single set, reused every frame).
  const scratch = useRef({
    deltaQuat: new THREE.Quaternion(),
    euler: new THREE.Euler(0, 0, 0, "XYZ"),
    viewPos: new THREE.Vector4(),
    ndc: new THREE.Vector2(),
    clusterTmp: new THREE.Vector3(),
    yawQuat: new THREE.Quaternion(),
  }).current;

  // Adopt registry contents as soon as they exist (registration happens in a
  // sibling's effect, after this component's first render). Poll on the first
  // frames only — zero cost once entities are found.
  useEffect(() => {
    let raf = 0;
    const adopt = () => {
      if (registry.entities.length > 0 && entitiesRef.current !== registry.entities) {
        entitiesRef.current = registry.entities;
        motionRef.current = new Float32Array(registry.entities.length * 2).fill(1);
        orbitsRef.current = registry.entities
          .filter((e) => e.orbit)
          .map((e) => ({
            angle: e.orbit!.angle,
            radius: e.orbit!.radius0,
          }));
        // Mirror into the registry so reseedBoatPose can reach them.
        registry.motion = motionRef.current;
        registry.orbits = orbitsRef.current;
      }
      if (entitiesRef.current.length === 0) raf = requestAnimationFrame(adopt);
    };
    raf = requestAnimationFrame(adopt);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (active !== undefined) {
      dynamicActiveRef.current = active;
      return () => {
        dynamicActiveRef.current = null;
      };
    }
  }, [active]);

  useEffect(() => {
    raycasterRef.current = new THREE.Raycaster();
    return () => {
      raycasterRef.current = null;
    };
  }, []);

  // Pointer tracking on the canvas element.
  useEffect(() => {
    const el = gl.domElement;
    const onMove = (e: PointerEvent) => {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      pointerRef.current.inside = true;
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;
      lastPointer.inside = true;
    };
    const onLeave = () => {
      pointerRef.current.inside = false;
      lastPointer.inside = false;
    };
    const applyLensRadius = () => {
      const touch =
        window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
      touchRef.current = touch;
      lensRadiusRef.current = LENS.radiusPx * (touch ? LENS.touchRadiusScale : 1);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    applyLensRadius();
    window.addEventListener("resize", applyLensRadius);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", applyLensRadius);
    };
  }, [gl]);

  useFrame((state, delta) => {
    if (!registry.scene) return;
    // Always track the live camera (cheap) — even while hidden, so dev
    // introspection / ride tooling can project positions.
    registry.camera = state.camera;
    if (document.hidden) return;

    // active prop > LOD/phase gate. No WorldProvider at all (Nwisland page)
    // counts as enabled — that page has a single always-on world.
    const enabled =
      dynamicActiveRef.current ?? (lodActive && (!world || world.phase === "ISLAND"));
    if (!enabled) return; // LODGroup already hides the subtree; nothing to write

    const entities = entitiesRef.current;
    const motion = motionRef.current;
    const orbits = orbitsRef.current;
    if (entities.length === 0 || motion.length !== entities.length * 2) return;

    const pointer = pointerRef.current;
    const riding = isRideActive();
    const lensOn =
      pointer.inside && !touchRef.current && !document.pointerLockElement && !riding;
    const t = state.clock.elapsedTime;
    const radius = lensRadiusRef.current;
    const rSq = radius * radius;
    const cam = camera;
    const width = size.width;
    const height = size.height;
    const { deltaQuat, euler, viewPos, clusterTmp, yawQuat } = scratch;
    let orbitIdx = 0;

    for (let ei = 0; ei < entities.length; ei++) {
      const e = entities[ei];
      const mi = ei * 2;

      // The ridden boat is owned by BoatRideController — advance its orbit
      // index (to keep arrays aligned) but skip every write.
      const ridden = riddenBoat !== null && e.root.obj.name === riddenBoat;

      // Advance orbit state first so lens projection and water sampling use
      // the boat's live position, not its authored mooring spot.
      let orbiting = false;
      let orbitX = 0;
      let orbitZ = 0;
      let orbitYaw = 0;
      if (e.orbit && orbitIdx < orbits.length) {
        const os = orbits[orbitIdx++];
        if (!ridden) {
          os.angle += BOAT_ORBIT.angularSpeed * delta;
          os.radius +=
            (e.orbit.radius - os.radius) *
            (1 - Math.exp(-BOAT_ORBIT.radiusLerpSpeed * delta));
          orbitX = Math.sin(os.angle) * os.radius;
          orbitZ = Math.cos(os.angle) * os.radius;
          orbitYaw = orbitYawAt(os.angle, 1);
          orbiting = true;
        }
      }
      if (ridden) continue;

      // ---- Lens target from projected center (PLAN §6.3) ----
      let target = 1;
      const kMax = LENS_MAX_SCALE[e.category];
      if (lensOn && kMax > 1) {
        const c = e.center;
        viewPos
          .set(
            orbiting ? orbitX : c.x,
            c.y,
            orbiting ? orbitZ : c.z,
            1
          )
          .applyMatrix4(cam.matrixWorldInverse);
        const viewZ = viewPos.z;
        if (viewZ < -0.1) {
          viewPos.applyMatrix4(cam.projectionMatrix);
          const w = viewPos.w;
          if (w > 1e-6) {
            const ndcX = viewPos.x / w;
            const ndcY = viewPos.y / w;
            if (ndcX > -1.2 && ndcX < 1.2 && ndcY > -1.2 && ndcY < 1.2) {
              const sx = (ndcX * 0.5 + 0.5) * width;
              const sy = (-ndcY * 0.5 + 0.5) * height;
              const dx = sx - pointer.x;
              const dy = sy - pointer.y;
              const dSq = dx * dx + dy * dy;
              if (dSq < rSq) {
                const f = 1 - Math.sqrt(dSq) / radius;
                target = 1 + (kMax - 1) * (f * f * (3 - 2 * f)); // smoothstep
              }
            }
          }
        }
      }

      // ---- Damped lens scale ----
      let s = motion[mi];
      const atRest = motion[mi + 1] === 1;
      const cat = e.category;
      // Lens-only categories can park when untouched; continuous-idle ones
      // (waves/sway) must keep animating even while the lens sits at rest.
      if (atRest && target === 1 && !CONTINUOUS_IDLE.has(cat)) {
        // parked — skip everything
      } else {
        if (Math.abs(target - s) > SCALE_EPS) {
          s += (target - s) * (1 - Math.exp(-LENS.lambda * delta));
        } else if (target === 1) {
          s = 1;
        }
        motion[mi] = s;
        motion[mi + 1] = Math.abs(s - 1) < SCALE_EPS && target === 1 ? 1 : 0;

        // ---- Idle motion (always composed under the lens scale) ----
        let heave = 0;
        let idle = false;
        const dq = deltaQuat;
        dq.identity();

        if (cat === "boatRow" || cat === "boatSail" || cat === "shipwreck") {
          const spec = cat === "shipwreck" ? WRECK_MOTION : BOAT_MOTION[cat];
          const ph = e.phase;
          const jitter = 1 + 0.18 * Math.sin(ph * 3.7);
          const surf = sampleWaterSurface(
            orbiting ? orbitX : e.center.x,
            orbiting ? orbitZ : e.center.z,
            t
          );
          const slopeMag = Math.min(
            1,
            Math.hypot(surf.slopeX, surf.slopeZ) * 40
          );
          // Heave = wave displacement relative to the boat's rest pose
          // (rest pose already sits at the waterline), smoothed toward the
          // surface so parameter changes never pop.
          heave = THREE.MathUtils.clamp(surf.waveHeight * 0.9, -0.12, 0.12);
          const rollAmp = cat === "shipwreck" ? spec.rollAmp * 0.5 : spec.rollAmp;
          const roll =
            Math.sin((t / (spec.rollPeriod * jitter)) * TAU + ph) *
            rollAmp *
            (0.5 + 0.5 * slopeMag);
          const pitch =
            Math.sin((t / (spec.pitchPeriod * jitter)) * TAU + ph * 1.9) *
            spec.pitchAmp *
            (0.5 + 0.5 * slopeMag);
          euler.set(pitch, 0, roll);
          dq.setFromEuler(euler);
          idle = true;

          // Flag cloth flutter (flags on sailing boats share the cloth mat).
          if (e.clothChild) {
            const cloth = e.clothChild;
            const flutter =
              Math.sin((t / SWAY.flagClothPeriod) * TAU + ph * 2.3) *
              SWAY.flagClothAmp;
            cloth.obj.quaternion.copy(cloth.restQuaternion);
            euler.set(0, flutter, 0);
            cloth.obj.quaternion.multiply(deltaQuat.setFromEuler(euler));
          }
        } else if (cat === "plank") {
          const ph = e.phase;
          heave =
            Math.sin((t / PLANK_MOTION.period) * TAU + ph) * PLANK_MOTION.heaveAmp;
          const yaw =
            Math.sin((t / (PLANK_MOTION.period * 1.35)) * TAU + ph * 2.1) *
            PLANK_MOTION.yawAmp;
          euler.set(0, yaw, 0);
          dq.setFromEuler(euler);
          idle = true;
        } else if (cat === "tree" || cat === "shore") {
          const isTree = cat === "tree";
          const amp = isTree ? SWAY.treeAmp : SWAY.shoreAmp;
          const period = isTree ? SWAY.treePeriod : SWAY.shorePeriod;
          const rest = e.root.restPosition;
          // Phase travels across the terrain so gusts sweep vegetation.
          const spatial = rest.x * 0.35 + rest.z * 0.21;
          const swayZ = Math.sin((t / period) * TAU + spatial + e.phase * 0.35) * amp;
          const swayX =
            Math.sin((t / (period * 1.7)) * TAU + spatial * 1.3) * amp * 0.4;
          euler.set(swayX, 0, swayZ);
          dq.setFromEuler(euler);
          idle = true;
        }

        if (Math.abs(dq.w) < 1 - 1e-9) idle = true;
        if (!idle && s === 1) continue;

        // ---- Compose and write (the ONLY transform writes) ----
        const lift = e.pivotAtBase ? -(s - 1) * e.root.baseOffsetY : 0;
        const dqActive = Math.abs(dq.w) < 1 - 1e-9;
        const hasLift = Math.abs(lift) > 0 || heave !== 0;

        if (!dqActive && !hasLift && !orbiting) {
          // Pure scaling about the node origin.
          const ns = e.root;
          ns.obj.scale.set(
            ns.restScale.x * s,
            ns.restScale.y * s,
            ns.restScale.z * s
          );
          continue;
        }

        for (let ni = 0; ni < e.nodes.length; ni++) {
          const ns = e.nodes[ni];
          const o = ns.obj;
          o.scale.set(ns.restScale.x * s, ns.restScale.y * s, ns.restScale.z * s);

          if (e.clusterPivot && dqActive) {
            // Rotate about the trunk base: reposition + rotate.
            clusterTmp.copy(ns.restPosition).sub(e.clusterPivot);
            clusterTmp.applyQuaternion(dq);
            o.position.copy(e.clusterPivot).add(clusterTmp);
            o.position.y += heave;
            o.quaternion.copy(ns.restQuaternion).multiply(dq);
          } else {
            o.position.set(
              orbiting ? orbitX : ns.restPosition.x,
              ns.restPosition.y + heave + lift,
              orbiting ? orbitZ : ns.restPosition.z
            );
            if (orbiting) {
              // Face the direction of travel; idle roll/pitch compose locally.
              yawQuat.setFromAxisAngle(UP_AXIS, orbitYaw);
              o.quaternion.copy(yawQuat);
            } else {
              o.quaternion.copy(ns.restQuaternion);
            }
            if (dqActive) o.quaternion.multiply(dq);
          }
        }
      }
    }

    // ---- Fire flicker (material-only, no transforms) ----
    const fires = registry.fires;
    for (let i = 0; i < fires.length; i++) {
      const f = fires[i];
      const ph = i * 2.399963; // golden-angle spread
      const flick =
        Math.sin(t * 13.7 + ph) * 0.6 + Math.sin(t * 7.3 + ph * 1.7) * 0.4;
      f.material.emissiveIntensity =
        f.authoredIntensity * (1 + FIRE_FLICKER.fraction * flick);
    }

    // ---- Throttled shipwreck pointer raycast (~12.5 Hz, ≤80 ms latency;
    // trivial cost now that targets are 12-triangle proxy boxes) ----
    emitAccRef.current += delta;
    if (emitAccRef.current >= 0.08 && registry.listeners.size > 0) {
      emitAccRef.current = 0;
      emitWreckPointer(state, cam, width, height, raycasterRef.current);
    }
  });

  return null;
}

function emitWreckPointer(
  _state: Parameters<Parameters<typeof useFrame>[0]>[0],
  cam: THREE.Camera,
  w: number,
  h: number,
  raycaster: THREE.Raycaster | null
) {
  const payload: WreckPointerPayload = {
    hovered: false,
    anchorX: 0,
    anchorY: 0,
    anchorVisible: false,
  };
  const pointer = lastPointer;
  if (
    raycaster &&
    pointer.inside &&
    !document.pointerLockElement &&
    !isRideActive() &&
    registry.raycastTargets.length > 0
  ) {
    scratchNdc.set(
      (pointer.x / w) * 2 - 1,
      -(pointer.y / h) * 2 + 1
    );
    raycaster.setFromCamera(scratchNdc, cam);
    payload.hovered =
      raycaster.intersectObjects(registry.raycastTargets, true).length > 0;
  }
  const anchor = registry.wreckAnchor;
  if (anchor) {
    scratchAnchor.copy(anchor).project(cam);
    payload.anchorVisible =
      scratchAnchor.z < 1 &&
      scratchAnchor.x > -1.1 && scratchAnchor.x < 1.1 &&
      scratchAnchor.y > -1.1 && scratchAnchor.y < 1.1;
    payload.anchorX = (scratchAnchor.x * 0.5 + 0.5) * w;
    payload.anchorY = (-scratchAnchor.y * 0.5 + 0.5) * h;
  }
  for (const fn of registry.listeners) fn(payload);
}

// Module-level scratch for the throttled emit (not frame-critical).
const scratchNdc = new THREE.Vector2();
const scratchAnchor = new THREE.Vector3();
const tapRaycaster = new THREE.Raycaster();

export interface WreckTapResult {
  hit: boolean;
  anchorX: number;
  anchorY: number;
  anchorVisible: boolean;
}

/**
 * Synchronous raycast at a client point — used by touch taps, which never
 * produce pointermove (and so never trigger the throttled hover raycast).
 */
export function raycastWreckAt(clientX: number, clientY: number): WreckTapResult {
  const result: WreckTapResult = {
    hit: false,
    anchorX: 0,
    anchorY: 0,
    anchorVisible: false,
  };
  const cam = registry.camera;
  const canvas = typeof document !== "undefined" ? document.querySelector("canvas") : null;
  if (!cam || !canvas || registry.raycastTargets.length === 0) return result;

  const w = canvas.clientWidth || 1;
  const h = canvas.clientHeight || 1;
  scratchNdc.set((clientX / w) * 2 - 1, -(clientY / h) * 2 + 1);
  tapRaycaster.setFromCamera(scratchNdc, cam);
  result.hit = raycaster_intersects(tapRaycaster);

  const anchor = registry.wreckAnchor;
  if (anchor) {
    scratchAnchor.copy(anchor).project(cam);
    result.anchorVisible =
      scratchAnchor.z < 1 &&
      scratchAnchor.x > -1.1 && scratchAnchor.x < 1.1 &&
      scratchAnchor.y > -1.1 && scratchAnchor.y < 1.1;
    result.anchorX = (scratchAnchor.x * 0.5 + 0.5) * w;
    result.anchorY = (-scratchAnchor.y * 0.5 + 0.5) * h;
  }
  return result;
}

function raycaster_intersects(raycaster: THREE.Raycaster): boolean {
  return raycaster.intersectObjects(registry.raycastTargets, true).length > 0;
}

/** Tolerates a missing WorldProvider (Nwisland mounts IslandScene directly). */
function useOptionalWorldState() {
  return useWorldStateOptional();
}
