// PLAN.md §8 verification — parses the GLB container's JSON chunk directly
// (no WebGL needed) and prints the facts the interaction code relies on.
// Run: node scripts/inspect-glb.mjs
import { readFileSync } from "node:fs";

const buf = readFileSync(new URL("../public/models/mountain.glb", import.meta.url));

// GLB header: magic(4) version(4) length(4), then chunk: length(4) type(4) data...
if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error("Not a GLB file");
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));

const { nodes = [], meshes = [], materials = [], scenes = [], animations = [] } = json;

console.log("== top-level ==");
console.log("nodes:", nodes.length, "| meshes:", meshes.length, "| materials:", materials.length);
console.log("animations:", animations.length);
console.log("scene roots:", scenes[0]?.nodes.length, "flat:", scenes[0]?.nodes.length === nodes.length);

const topNames = new Set(scenes[0]?.nodes ?? []);
const childNodes = nodes.reduce((acc, n) => acc + (n.children?.length ?? 0), 0);
console.log("total child links:", childNodes);

console.log("\n== materials ==");
for (const m of materials) console.log(" -", m.name);

// Categorize top-level nodes by the sanitized-name rules from PLAN §5
const rules = [
  ["Boat_Row", /^Boat_Row_\d+$/],
  ["Boat_Sail", /^Boat_Sail_\d+$/],
  ["Shipwreck", /^Shipwreck$/],
  ["Wreck_Plank", /^Wreck_Plank_\d+$/],
  ["Barbarian", /^Barbarian_/],
  ["Icosphere(rock)", /^Icosphere\d*$/],
  ["Cube", /^Cube\d*$/],
  ["Flag", /^Flag_\d+$/],
  ["Banner", /^Banner_\d+$/],
  ["Torch", /^Torch_\d+$/],
  ["Brazier", /^Brazier_\d+$/],
  ["Campfire", /^Campfire_\d+$/],
  ["Cylinder(tree)", /^Cylinder\d*$/],
  ["Shore", /^(Bush|Grass|Reed|Driftwood)_\d+$/],
  ["Plane(ground)", /^Plane$/],
  ["Plane001(water)", /^Plane\.?001$/],
  ["Camera", /^Camera$/],
];

console.log("\n== node categories (sanitized names as GLTFLoader would produce) ==");
const sanitize = (n) => n.replace(/[.\[\]:/]/g, "").replace(/\s+/g, "_");
const counts = {};
const unmatched = [];
for (const n of nodes) {
  if (!topNames.has(nodes.indexOf(n))) continue;
  const name = sanitize(n.name ?? "");
  const hit = rules.find(([, re]) => re.test(name));
  if (hit) counts[hit[0]] = (counts[hit[0]] ?? 0) + 1;
  else unmatched.push(n.name);
}
for (const [label] of rules) console.log(` ${label}: ${counts[label] ?? 0}`);
console.log(" unmatched top-level:", unmatched.length ? unmatched : "none");

// Non-unit scales
const nonUnit = nodes.filter((n) => n.scale && n.scale.some((v) => Math.abs(v - 1) > 1e-4)).length;
console.log("\nnon-unit-scale nodes:", nonUnit);

// Mesh -> material usage (for the Material.003/.004/.006 cube split and Fire_* share)
const matByIndex = materials.map((m) => m.name);
const meshMats = meshes.map((m) =>
  (m.primitives ?? []).map((p) => matByIndex[p.material ?? 0])
);
const cubeSplit = {};
let fireMeshes = 0;
for (const mats of meshMats) {
  for (const name of mats) {
    if (name === "Material.003" || name === "Material.004" || name === "Material.006")
      cubeSplit[name] = (cubeSplit[name] ?? 0) + 1;
    if (name?.startsWith("Fire_")) fireMeshes++;
  }
}
console.log("\n== material usage across meshes (per-primitive) ==");
console.log(" cube materials (mesh-level, nodes may reuse):", cubeSplit);
console.log(" meshes using Fire_* materials:", fireMeshes);

// Which nodes does the old code's `water` / Cube47-112 logic actually hit?
const oldWater = nodes.filter((n) => sanitize(n.name ?? "") === "water").map((n) => n.name);
const oldCubes = nodes
  .filter((n) => {
    const m = sanitize(n.name ?? "").match(/^Cube(\d+)$/);
    return m && +m[1] >= 47 && +m[1] <= 112;
  }).length;
console.log("\nold-code checks: nodes named 'water':", oldWater.length ? oldWater : "none",
  "| Cube47..112 range:", oldCubes);

// Spot checks from PLAN §5
const spot = ["Flag_01", "Banner_01", "Shipwreck", "Wreck_Plank_01", "Plane001", "Plane", "Camera"];
console.log("\n== spot checks ==");
for (const s of spot) {
  const n = nodes.find((n) => sanitize(n.name ?? "") === s);
  console.log(` ${s}:`, n
    ? `mesh=${n.mesh ?? "-"} scale=[${(n.scale ?? [1,1,1]).map((v) => +v.toFixed(3))}] t=[${(n.translation ?? [0,0,0]).map((v) => +v.toFixed(2))}]`
    : "NOT FOUND");
}
const clothNames = materials.filter((m) => m.name.startsWith("Cloth_")).map((m) => m.name);
console.log("\nCloth_* materials:", clothNames.length, clothNames.slice(0, 4), "...");

// Flag / banner / shipwreck primitive materials (what replaces Cloth_<NodeName>?)
console.log("\n== primitive materials per key node ==");
for (const key of ["Flag_01", "Flag_02", "Banner_01", "Shipwreck", "Boat_Sail_01", "Torch_01", "Wreck_Plank_01", "Cylinder", "Plane"]) {
  const n = nodes.find((n) => sanitize(n.name ?? "") === key);
  if (n == null || n.mesh == null) { console.log(` ${key}: -`); continue; }
  console.log(` ${key}:`, meshMats[n.mesh].join(",") || "(no material)"
    + ` | children:${nodes.indexOf(n)}`);
}

// Which meshes do mountains use (Material.006), and how many nodes
const mountainMeshIdx = new Set(meshes.map((m, i) => meshMats[i].includes("Material.006") ? i : -1).filter((i) => i >= 0));
const mountainNodes = nodes.filter((n) => n.mesh != null && mountainMeshIdx.has(n.mesh));
console.log("\nnodes on meshes containing Material.006:", mountainNodes.length);
