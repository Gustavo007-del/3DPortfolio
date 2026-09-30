// components/Island/fortEntities.ts
//
// Interactive-entity registry for the mountain.glb scene (PLAN.md §5),
// adapted to the *verified* GLB:
//  - No Cloth_* materials exist — flag/banner cloth is the shared BarbV2_Cape.
//  - No water plane and no camera node are exported.
//  - Names arrive post-sanitization from GLTFLoader (Cube.001 → Cube001).
//
// Multi-primitive GLTF meshes load as a Group (named after the node) whose
// children are Meshes, one per material — so rules inspect child materials.

import * as THREE from "three";
import { BOAT_ORBIT } from "./fortMotionConfig";

export type Category =
  | "barbarian" | "rock" | "boatRow" | "boatSail" | "shipwreck" | "plank"
  | "flag" | "banner" | "fire" | "tree" | "shore" | "fortTower" | "fortWall";

export interface NodeState {
  obj: THREE.Object3D;
  restPosition: THREE.Vector3;
  restQuaternion: THREE.Quaternion;
  restScale: THREE.Vector3;
  /** origin.y − box.min.y: how far the origin sits above the node's base. */
  baseOffsetY: number;
}

export interface FireMaterialRef {
  mesh: THREE.Mesh;
  /** Cloned per fire so each flame flickers independently (PLAN §6.4). */
  material: THREE.MeshStandardMaterial;
  /** Emissive intensity authored in the GLB (KHR_materials_emissive_strength). */
  authoredIntensity: number;
}

export interface FortEntity {
  id: string;
  category: Category;
  /** Primary node — drives the entity's bounding sphere. */
  root: NodeState;
  /** Every node moved by the controller (tree entities have 4). */
  nodes: NodeState[];
  /** Tree cluster base pivot (world); null for single-node entities. */
  clusterPivot: THREE.Vector3 | null;
  /** Rest world-space bounding sphere of the root node. */
  center: THREE.Vector3;
  boundingRadius: number;
  /** Scale about the base instead of the origin (rocks pivot at center). */
  pivotAtBase: boolean;
  /** Per-entity hash-derived phase so idle motions never sync. */
  phase: number;
  /** Flag/banner cloth child (material BarbV2_Cape), if any. */
  clothChild: {
    obj: THREE.Mesh;
    restQuaternion: THREE.Quaternion;
  } | null;
  /** Cloned fire materials, if a fire entity. */
  fireMaterials: FireMaterialRef[];
  /**
   * Boats only: polar coords of the rest pose around the island centre
   * (x = r·sinθ, z = r·cosθ). radius is the cruising radius — the rest
   * radius gently clamped into BOAT_ORBIT's range so an oddly-authored
   * mooring can't ground a boat; the controller drifts radius0 → radius.
   */
  orbit: {
    radius0: number;
    radius: number;
    angle: number;
  } | null;
}

/** Material names of a node's child meshes (or its own, if it is a Mesh). */
export function nodeMaterialNames(node: THREE.Object3D): string[] {
  const names: string[] = [];
  const collect = (o: THREE.Object3D) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        if (m && m.name && !names.includes(m.name)) names.push(m.name);
      }
    }
  };
  collect(node);
  node.children.forEach(collect);
  return names;
}

const hashPhase = (name: string): number => {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // 0..2π
  return ((h >>> 0) / 4294967295) * Math.PI * 2;
};

interface Rule {
  category: Category;
  test: (name: string, mats: string[]) => boolean;
}

// Order matters: first match wins. Cubes resolve by material, not name.
const RULES: Rule[] = [
  { category: "shipwreck", test: (n) => n === "Shipwreck" },
  { category: "plank", test: (n) => /^Wreck_Plank_\d+$/.test(n) },
  { category: "boatRow", test: (n) => /^Boat_Row_\d+$/.test(n) },
  { category: "boatSail", test: (n) => /^Boat_Sail_\d+$/.test(n) },
  { category: "barbarian", test: (n) => /^Barbarian_/.test(n) },
  { category: "flag", test: (n) => /^Flag_\d+$/.test(n) },
  { category: "banner", test: (n) => /^Banner_\d+$/.test(n) },
  { category: "fire", test: (n) => /^(Torch|Brazier|Campfire)_\d+$/.test(n) },
  { category: "shore", test: (n) => /^(Bush|Grass|Reed|Driftwood)_\d+$/.test(n) },
  { category: "tree", test: (n) => /^Cylinder\d*$/.test(n) },
  { category: "rock", test: (n) => /^Icosphere\d*$/.test(n) },
  { category: "fortTower", test: (_n, mats) => mats.includes("Material.003") },
  { category: "fortWall", test: (_n, mats) => mats.includes("Material.004") },
];

/** Backdrop cubes (Material.006) — excluded from raycast and magnification. */
export function isBackdropNode(node: THREE.Object3D): boolean {
  if (/^Plane001$/.test(node.name)) return true; // legacy; not in current GLB
  return nodeMaterialNames(node).includes("Material.006");
}

const TREE_RE = /^Cylinder(\d*)$/;
const FIRE_MAT_RE = /^Fire_/;
const CLOTH_MAT = "BarbV2_Cape";

function captureNodeState(obj: THREE.Object3D): NodeState {
  const restPosition = new THREE.Vector3();
  const restQuaternion = new THREE.Quaternion();
  const restScale = new THREE.Vector3();
  obj.matrixWorld.decompose(restPosition, restQuaternion, restScale);

  // The GLB is flat — every node is a direct child of the scene root, so
  // local == world. Compute base offset from the node's own world box.
  const box = new THREE.Box3().setFromObject(obj);
  const baseOffsetY = Number.isFinite(box.min.y)
    ? Math.max(0, restPosition.y - box.min.y)
    : 0;

  return { obj, restPosition, restQuaternion, restScale, baseOffsetY };
}

function findClothChild(entity: Category, root: THREE.Object3D) {
  if (entity !== "flag" && entity !== "banner") return null;
  for (const child of root.children) {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      if (mats.some((m: THREE.Material | undefined) => m?.name === CLOTH_MAT)) {
        return { obj: mesh, restQuaternion: mesh.quaternion.clone() };
      }
    }
  }
  return null;
}

function cloneFireMaterials(root: THREE.Object3D): FireMaterialRef[] {
  const refs: FireMaterialRef[] = [];
  for (const child of root.children) {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) continue;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const idx = mats.findIndex((m: THREE.Material | undefined) => FIRE_MAT_RE.test(m?.name ?? ""));
    if (idx < 0) continue;
    const original = mats[idx] as THREE.MeshStandardMaterial;
    const clone = original.clone();
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.slice(0, idx).concat([clone], mesh.material.slice(idx + 1))
      : clone;
    refs.push({
      mesh,
      material: clone,
      authoredIntensity: clone.emissiveIntensity,
    });
  }
  return refs;
}

/**
 * Register every interactive entity found in the loaded scene.
 * Trees arrive as 4 sibling nodes (1 trunk + 3 foliage layers) whose
 * sanitized indices are consecutive — cluster them in fours per PLAN §5.
 * Callers must run `scene.updateMatrixWorld(true)` first.
 */
export function buildFortEntities(scene: THREE.Object3D): FortEntity[] {
  const entities: FortEntity[] = [];
  const treeNodes: THREE.Object3D[] = [];

  scene.traverse((obj) => {
    // Only direct scene children — the GLB is flat (verified).
    if (obj.parent !== scene) return;
    if (isBackdropNode(obj)) return;

    const mats = nodeMaterialNames(obj);
    const rule = RULES.find((r) => r.test(obj.name, mats));
    if (!rule) return;

    if (rule.category === "tree") {
      treeNodes.push(obj);
    } else {
      entities.push(createEntity(obj, obj.name, rule.category, null));
    }
  });

  // Group trees in fours (indices are consecutive in the GLB node order).
  for (let i = 0; i + TREE_QUAD <= treeNodes.length; i += TREE_QUAD) {
    const group = treeNodes.slice(i, i + TREE_QUAD);
    entities.push(createEntity(group[0], `tree_${i / TREE_QUAD}`, "tree", group));
  }

  return entities;
}

const TREE_QUAD = 4;

function createEntity(
  rootObj: THREE.Object3D,
  id: string,
  category: Category,
  group: THREE.Object3D[] | null
): FortEntity {
  const rootState = captureNodeState(rootObj);

  // Lens/target bounds cover the WHOLE entity (tree clusters: trunk + all
  // foliage layers), not just the root node.
  const box = new THREE.Box3();
  if (group) {
    box.makeEmpty();
    for (const n of group) box.expandByObject(n);
  } else {
    box.setFromObject(rootObj);
  }
  const sphere = box.getBoundingSphere(new THREE.Sphere());

  // Tree cluster: rotate every node about the trunk's base point.
  let clusterPivot: THREE.Vector3 | null = null;
  let nodes: NodeState[];
  if (group) {
    nodes = group.map(captureNodeState);
    clusterPivot = new THREE.Vector3(
      rootState.restPosition.x,
      rootState.restPosition.y - rootState.baseOffsetY,
      rootState.restPosition.z
    );
  } else {
    nodes = [rootState];
  }

  // Boats orbit the island centre (0,0) — polar coords of the rest pose.
  let orbit: FortEntity["orbit"] = null;
  if (category === "boatRow" || category === "boatSail") {
    const dx = rootState.restPosition.x;
    const dz = rootState.restPosition.z;
    const radius0 = Math.max(1e-3, Math.hypot(dx, dz));
    orbit = {
      radius0,
      radius: THREE.MathUtils.clamp(
        radius0,
        BOAT_ORBIT.radiusMin,
        BOAT_ORBIT.radiusMax
      ),
      angle: Math.atan2(dx, dz),
    };
  }

  return {
    id,
    category,
    root: rootState,
    nodes,
    clusterPivot,
    center: sphere.center.clone(),
    boundingRadius: sphere.radius,
    pivotAtBase: category !== "rock",
    phase: hashPhase(id),
    clothChild: findClothChild(category, rootObj),
    fireMaterials:
      category === "fire" ? cloneFireMaterials(rootObj) : [],
    orbit,
  };
}

/** Shipwreck hotspot nodes: the wreck plus its three drifting planks. */
export function isWreckHotspot(category: Category): boolean {
  return category === "shipwreck" || category === "plank";
}

export { TREE_RE };
