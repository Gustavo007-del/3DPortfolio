// components/Island/boat-ride/landMask.ts
//
// 2D occupancy grid built from the GLB at load (PLAN.md §7.1), plus the
// collision response that runs after stepBoat (§7.2) and the soft sea
// boundary (§7.2 last paragraph).
//
// Build strategy: instead of casting 40k rays against whole meshes, each
// blocker triangle is rasterized directly into the grid (its XZ footprint,
// barycentric y test against the waterline threshold). That is O(triangles ×
// cells-per-triangle) — milliseconds, dependency-free. The build is still
// chunked across frames to be safe. Cells are then dilated by 1 so the hull
// never visually clips the shore.

"use client";

import * as THREE from "three";
import { nodeMaterialNames } from "../fortEntities";
import { RIDE } from "./boatRideConfig";
import type { BoatSim, BoatParams } from "./boatSim";

export interface LandMask {
  cell: number;
  half: number;
  w: number;
  /** 0 = free, 1 = blocked (after 1-cell dilation). Row-major: iz * w + ix. */
  grid: Uint8Array;
  ready: boolean;
}

export interface Hull {
  halfLen: number;
  halfWid: number;
}

let mask: LandMask | null = null;
let owner: THREE.Object3D | null = null;
let building = false;

/** Null until the first build completes — collisions degrade to bounds-only. */
export function getLandMask(): LandMask | null {
  return mask && mask.ready ? mask : null;
}

const FORT_MATS = ["Material.003", "Material.004"];

function isBlockerRoot(node: THREE.Object3D): boolean {
  // PLAN §7.1: island ground, rocks, fort cubes, shipwreck. Excluded:
  // water/backdrop (Material.006), barbarians, boats, vegetation, planks.
  if (node.name === "Plane" || node.name === "Shipwreck") return true;
  if (/^Icosphere\d*$/.test(node.name)) return true;
  const mats = nodeMaterialNames(node);
  return FORT_MATS.some((m) => mats.includes(m));
}

interface TriSource {
  pos: THREE.BufferAttribute;
  index: THREE.BufferAttribute | null;
  m: THREE.Matrix4;
}

function collectSources(scene: THREE.Object3D): TriSource[] {
  const out: TriSource[] = [];
  const visit = (node: THREE.Object3D, blockedRoot: boolean) => {
    const isRoot = node.parent === scene || node === scene;
    const root = blockedRoot || (isRoot && isBlockerRoot(node));
    const mesh = node as THREE.Mesh;
    if (root && mesh.isMesh && mesh.geometry?.attributes?.position) {
      out.push({
        pos: mesh.geometry.attributes.position as THREE.BufferAttribute,
        index: mesh.geometry.index,
        m: mesh.matrixWorld.clone(),
      });
    }
    for (const c of node.children) visit(c, root);
  };
  for (const c of scene.children) visit(c, false);
  return out;
}

/**
 * Kick a chunked, cached build for this scene. Idempotent per scene —
 * called from registerFortScene once the GLB is mounted.
 */
export function scheduleLandMaskBuild(scene: THREE.Object3D) {
  if (owner === scene && (building || (mask && mask.ready))) return;

  owner = scene;
  building = true;
  mask = null;

  const cell = RIDE.mask.cell;
  const half = RIDE.mask.half;
  const w = Math.ceil((half * 2) / cell);
  const raw = new Uint8Array(w * w);
  const threshold = RIDE.waterY + 0.35;
  const sources = collectSources(scene);
  let si = 0; // source index
  let ti = 0; // triangle index within source

  const ax = new THREE.Vector3();
  const bx = new THREE.Vector3();
  const cx = new THREE.Vector3();

  const step = () => {
    if (owner !== scene) {
      building = false;
      return; // scene swapped mid-build — a newer build owns the cache
    }
    const t0 = performance.now();

    // Process triangles until the ~6 ms budget is spent.
    while (si < sources.length) {
      const s = sources[si];
      const count = s.index ? s.index.count : s.pos.count;
      const ig = s.index;

      while (ti < count) {
        const i0 = ig ? ig.getX(ti) : ti;
        const i1 = ig ? ig.getX(ti + 1) : ti + 1;
        const i2 = ig ? ig.getX(ti + 2) : ti + 2;
        ti += 3;

        ax.fromBufferAttribute(s.pos, i0).applyMatrix4(s.m);
        bx.fromBufferAttribute(s.pos, i1).applyMatrix4(s.m);
        cx.fromBufferAttribute(s.pos, i2).applyMatrix4(s.m);

        const maxY = Math.max(ax.y, bx.y, cx.y);
        if (maxY <= threshold) continue;

        // XZ rasterization. Thick triangles are centre-sampled; thin or
        // vertical ones (masts, planks, walls) get an exact overlap test so
        // they can't slip between cell centres.
        const x1 = ax.x, z1 = ax.z, y1 = ax.y;
        const x2 = bx.x, z2 = bx.z, y2 = bx.y;
        const x3 = cx.x, z3 = cx.z, y3 = cx.y;
        const denom = (z2 - z3) * (x1 - x3) + (x3 - x2) * (z1 - z3);
        const area2 = Math.abs((x2 - x1) * (z3 - z1) - (x3 - x1) * (z2 - z1));

        const minXi = Math.max(0, Math.floor((Math.min(x1, x2, x3) + half) / cell));
        const maxXi = Math.min(w - 1, Math.floor((Math.max(x1, x2, x3) + half) / cell));
        const minZi = Math.max(0, Math.floor((Math.min(z1, z2, z3) + half) / cell));
        const maxZi = Math.min(w - 1, Math.floor((Math.max(z1, z2, z3) + half) / cell));

        if (area2 > cell * cell && Math.abs(denom) > 1e-9) {
          // Thick triangle: barycentric centre-sampling (with y threshold).
          for (let iz = minZi; iz <= maxZi; iz++) {
            const pz = -half + (iz + 0.5) * cell;
            for (let ix = minXi; ix <= maxXi; ix++) {
              const px = -half + (ix + 0.5) * cell;
              const w1 = ((z2 - z3) * (px - x3) + (x3 - x2) * (pz - z3)) / denom;
              const w2 = ((z3 - z1) * (px - x3) + (x1 - x3) * (pz - z3)) / denom;
              const w3 = 1 - w1 - w2;
              if (w1 < 0 || w2 < 0 || w3 < 0) continue;
              const y = w1 * y1 + w2 * y2 + w3 * y3;
              if (y > threshold) raw[iz * w + ix] = 1;
            }
          }
        } else {
          // Thin / vertical / degenerate triangle: exact 2-D triangle-vs-cell
          // overlap on 5 axes (X, Z, three edge normals) — conservative by
          // design: any overlapping cell is marked. Handles zero-area
          // projections (perfectly vertical walls) too.
          const e1x = x2 - x1, e1z = z2 - z1;
          const e2x = x3 - x2, e2z = z3 - z2;
          const e3x = x1 - x3, e3z = z1 - z3;
          const aX = [1, 0, 0, 1, e1z, -e1x, e2z, -e2x, e3z, -e3x];
          const tMin = [0, 0, 0, 0, 0];
          const tMax = [0, 0, 0, 0, 0];
          for (let k = 0; k < 5; k++) {
            const nx = aX[k * 2], nz = aX[k * 2 + 1];
            const p1 = x1 * nx + z1 * nz;
            const p2 = x2 * nx + z2 * nz;
            const p3 = x3 * nx + z3 * nz;
            tMin[k] = Math.min(p1, p2, p3);
            tMax[k] = Math.max(p1, p2, p3);
          }
          const hc = cell * 0.5;
          for (let iz = minZi; iz <= maxZi; iz++) {
            const pz = -half + (iz + 0.5) * cell;
            for (let ix = minXi; ix <= maxXi; ix++) {
              const px = -half + (ix + 0.5) * cell;
              let hit = true;
              for (let k = 0; k < 5 && hit; k++) {
                const nx = aX[k * 2], nz = aX[k * 2 + 1];
                const c = px * nx + pz * nz;
                const r = hc * (Math.abs(nx) + Math.abs(nz));
                if (tMin[k] > c + r || c - r > tMax[k]) hit = false;
              }
              if (hit) raw[iz * w + ix] = 1;
            }
          }
        }

        if (performance.now() - t0 > 6) break; // yield to the frame
      }

      if (ti >= count) {
        si++;
        ti = 0;
      }
      if (performance.now() - t0 > 6) break;
    }

    if (si < sources.length) {
      requestAnimationFrame(step);
      return;
    }

    // Dilate by 1 cell (8-neighbourhood) so the hull can't visually clip.
    const grid = new Uint8Array(w * w);
    for (let iz = 0; iz < w; iz++) {
      for (let ix = 0; ix < w; ix++) {
        if (raw[iz * w + ix]) {
          for (let dz = -1; dz <= 1; dz++) {
            const nz = iz + dz;
            if (nz < 0 || nz >= w) continue;
            for (let dx = -1; dx <= 1; dx++) {
              const nx = ix + dx;
              if (nx < 0 || nx >= w) continue;
              grid[nz * w + nx] = 1;
            }
          }
        }
      }
    }

    mask = { cell, half, w, grid, ready: true };
    building = false;
  };

  requestAnimationFrame(step);
}

// ---------------------------------------------------------------------------
// Queries (zero allocation)
// ---------------------------------------------------------------------------

export function maskBlocked(mask: LandMask, x: number, z: number): boolean {
  const ix = Math.floor((x + mask.half) / mask.cell);
  const iz = Math.floor((z + mask.half) / mask.cell);
  if (ix < 0 || iz < 0 || ix >= mask.w || iz >= mask.w) return false;
  return mask.grid[iz * mask.w + ix] === 1;
}

/**
 * World position of the first blocked hull probe (centre, bow, stern,
 * starboard, port), or false. Zero allocation — runs every frame.
 */
function firstBlocked(
  mask: LandMask, x: number, z: number, heading: number, hull: Hull,
  out: { x: number; z: number }
): boolean {
  const fx = Math.sin(heading), fz = Math.cos(heading);
  const rx = -fz, rz = fx; // starboard = local +X (bow is local −Z)

  let px = x, pz = z;
  if (maskBlocked(mask, px, pz)) { out.x = px; out.z = pz; return true; }
  px = x + fx * hull.halfLen; pz = z + fz * hull.halfLen;
  if (maskBlocked(mask, px, pz)) { out.x = px; out.z = pz; return true; }
  px = x - fx * hull.halfLen; pz = z - fz * hull.halfLen;
  if (maskBlocked(mask, px, pz)) { out.x = px; out.z = pz; return true; }
  px = x + rx * hull.halfWid; pz = z + rz * hull.halfWid;
  if (maskBlocked(mask, px, pz)) { out.x = px; out.z = pz; return true; }
  px = x - rx * hull.halfWid; pz = z - rz * hull.halfWid;
  if (maskBlocked(mask, px, pz)) { out.x = px; out.z = pz; return true; }
  return false;
}

const hitScratch = { x: 0, z: 0 };
const prevScratch = { x: 0, z: 0 };

/**
 * Collision response after stepBoat (PLAN §7.2): slide along the shore
 * (x-only, then z-only, then full revert), reflect the velocity off the mask
 * gradient, bleed speed. Mutates sim; returns true when a hit occurred.
 */
export function resolveBoatCollision(
  sim: BoatSim,
  hull: Hull,
  m: LandMask | null,
  prevX: number,
  prevZ: number
): boolean {
  if (!m || !m.ready) return false;
  if (!firstBlocked(m, sim.x, sim.z, sim.heading, hull, hitScratch)) return false;

  // Surface normal from the mask gradient, pointing toward open water.
  const c = m.cell;
  let gx =
    (maskBlocked(m, hitScratch.x + c, hitScratch.z) ? 1 : 0) -
    (maskBlocked(m, hitScratch.x - c, hitScratch.z) ? 1 : 0);
  let gz =
    (maskBlocked(m, hitScratch.x, hitScratch.z + c) ? 1 : 0) -
    (maskBlocked(m, hitScratch.x, hitScratch.z - c) ? 1 : 0);
  let nxv = -gx, nzv = -gz;
  let len = Math.hypot(nxv, nzv);
  if (len < 1e-6) {
    // Uniformly surrounded (thick land) — push away from the island centre.
    nxv = sim.x; nzv = sim.z;
    len = Math.hypot(nxv, nzv) || 1;
  }
  nxv /= len; nzv /= len;

  // Slide: keep one axis of the attempted move, whichever stays clear.
  let nx = prevX, nz = prevZ;
  if (!firstBlocked(m, sim.x, prevZ, sim.heading, hull, prevScratch)) {
    nx = sim.x; nz = prevZ;
  } else if (!firstBlocked(m, prevX, sim.z, sim.heading, hull, prevScratch)) {
    nx = prevX; nz = sim.z;
  }

  // Escape: the slide can still land on a blocked pose (and if the previous
  // pose itself is blocked, the old code dead-locked the boat there forever —
  // it could turn but never translate). March toward open water until the
  // whole hull fits, so the boat always recovers.
  if (firstBlocked(m, nx, nz, sim.heading, hull, prevScratch)) {
    let placed = false;
    const maxD = hull.halfLen + c * 2;
    for (let d = c * 0.5; d <= maxD; d += c * 0.5) {
      const tx = nx + nxv * d, tz = nz + nzv * d;
      if (!firstBlocked(m, tx, tz, sim.heading, hull, prevScratch)) {
        nx = tx; nz = tz; placed = true; break;
      }
    }
    if (!placed) {
      // Gradient pointed into land (enclosed probe) — sweep8 directions.
      sweep: for (let d = c * 0.5; d <= maxD; d += c * 0.5) {
        for (let a = 0; a < 8; a++) {
          const ang = (a * Math.PI) / 4;
          const tx = nx + Math.cos(ang) * d, tz = nz + Math.sin(ang) * d;
          if (!firstBlocked(m, tx, tz, sim.heading, hull, prevScratch)) {
            nx = tx; nz = tz; placed = true; break sweep;
          }
        }
      }
    }
    if (!placed) {
      // Deeply embedded (or degenerate normal at the origin) — ray-march
      // radially outward until the hull fits; the mask always clears well
      // inside its half-extent.
      let rx = nx, rz = nz;
      let rl = Math.hypot(rx, rz);
      if (rl < 1e-6) { rx = 1; rz = 0; rl = 1; }
      rx /= rl; rz /= rl;
      for (let d = c; d <= m.half; d += c) {
        const tx = nx + rx * d, tz = nz + rz * d;
        if (!firstBlocked(m, tx, tz, sim.heading, hull, prevScratch)) {
          nx = tx; nz = tz; placed = true; break;
        }
      }
    }
    if (!placed) { nx = prevX; nz = prevZ; } // last resort (shouldn't happen)
  }
  sim.x = nx;
  sim.z = nz;

  // Reflect the normal component off the shore (v − 1.2(v·n)n), then damp
  // ONLY the normal part — the tangential (sliding) momentum survives, so the
  // boat keeps gliding along the coast instead of stopping dead on contact.
  const vn = sim.vx * nxv + sim.vz * nzv;
  if (vn < 0) {
    sim.vx -= 1.2 * vn * nxv;
    sim.vz -= 1.2 * vn * nzv;
  }
  const vn2 = sim.vx * nxv + sim.vz * nzv;
  if (vn2 > 0) {
    sim.vx -= vn2 * nxv * 0.5;
    sim.vz -= vn2 * nzv * 0.5;
  }

  // Scalar speed: hard bleed only when ramming head-on; light bleed when the
  // bow is roughly parallel to the shore so wall-hugging still steers away.
  const bx = Math.sin(sim.heading), bz = Math.cos(sim.heading);
  const bowN = bx * nxv + bz * nzv;
  sim.speed *= bowN < -0.3 ? 0.55 : 0.9;
  return true;
}

/** Soft sea boundary (PLAN §7.2): inward pull + radial velocity bleed. */
export function applySoftBounds(
  sim: BoatSim,
  bounds: { cx: number; cz: number; radius: number }
): boolean {
  const dx = sim.x - bounds.cx;
  const dz = sim.z - bounds.cz;
  const d = Math.hypot(dx, dz);
  if (d <= bounds.radius || d < 1e-6) return false;

  const over = d - bounds.radius;
  const scale = (bounds.radius + over * 0.5) / d; // ease half the overshoot back
  sim.x = bounds.cx + dx * scale;
  sim.z = bounds.cz + dz * scale;

  const rdx = dx / d, rdz = dz / d;
  const rn = sim.vx * rdx + sim.vz * rdz;
  if (rn > 0) {
    const bleed = Math.min(1, 0.3 + over * 0.05);
    sim.vx -= rdx * rn * bleed;
    sim.vz -= rdz * rn * bleed;
  }
  return true;
}
