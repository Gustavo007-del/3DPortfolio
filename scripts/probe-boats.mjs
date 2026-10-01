// Temporary probe: reads the GLB JSON + binary chunks directly (no three.js)
// and prints per-boat hull shape signals to decide bowLocalMinusZ (PLAN §6.1).
// Run: node scripts/probe-boats.mjs
import { readFileSync } from "node:fs";

const buf = readFileSync(new URL("../public/models/mountain.glb", import.meta.url));
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));
// binary chunk follows the JSON chunk (8-byte header + jsonLen, 4-byte aligned)
const binOffset = 20 + jsonLen + 8;
const bin = buf.subarray(binOffset);

const { nodes = [], meshes = [], accessors = [], bufferViews = [], materials = [] } = json;

function readPositions(accIdx) {
  const a = accessors[accIdx];
  if (a.type !== "VEC3" || a.componentType !== 5126) return null;
  const bv = bufferViews[a.bufferView];
  const start = (bv.byteOffset ?? 0) + (a.byteOffset ?? 0);
  const stride = bv.byteStride ?? 12;
  const out = new Float32Array(a.count * 3);
  for (let i = 0; i < a.count; i++) {
    out[i * 3] = bin.readFloatLE(start + i * stride);
    out[i * 3 + 1] = bin.readFloatLE(start + i * stride + 4);
    out[i * 3 + 2] = bin.readFloatLE(start + i * stride + 8);
  }
  return out;
}

const sanitize = (n) => (n ?? "").replace(/[.\[\]:/]/g, "").replace(/\s+/g, "_");

function analyze(name) {
  const node = nodes.find((n) => sanitize(n.name) === name);
  if (!node || node.mesh == null) return;
  const mesh = meshes[node.mesh];
  const matNames = materials.map((m) => m.name);

  // Merge all primitives so we can split hull (BarbV2_Wood) from sail (BarbV2_Cape).
  const buckets = new Map();
  for (const p of mesh.primitives ?? []) {
    const arr = readPositions(p.attributes.POSITION);
    if (!arr) continue;
    const verts = [];
    for (let i = 0; i < arr.length; i += 3) verts.push([arr[i], arr[i + 1], arr[i + 2]]);
    const mname = matNames[p.material ?? 0] ?? "?";
    if (!buckets.has(mname)) buckets.set(mname, []);
    buckets.get(mname).push(...verts);
  }
  return { node, buckets };
}

function profile(verts, label) {
  if (!verts || verts.length === 0) return;
  let minZ = Infinity, maxZ = -Infinity, minX = Infinity, maxX = -Infinity;
  for (const [x, , z] of verts) {
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }
  const ez = maxZ - minZ;
  const band = Math.min(0.18, 2.0 / Math.max(ez, 1e-3)) * ez; // 18% of length, max 2m
  const widthAt = (z0, z1) => {
    const sel = verts.filter(([x, , z]) => z >= z0 && z <= z1);
    if (sel.length === 0) return { w: 0, n: 0 };
    let mn = Infinity, mx = -Infinity;
    for (const [x] of sel) { if (x < mn) mn = x; if (x > mx) mx = x; }
    return { w: mx - mn, n: sel.length };
  };
  const plus = widthAt(maxZ - band, maxZ);   // near +Z end
  const minus = widthAt(minZ, minZ + band);  // near -Z end
  console.log(
    `   ${label}: z∈[${minZ.toFixed(2)},${maxZ.toFixed(2)}] ` +
      `+Z width=${plus.w.toFixed(2)} (n=${plus.n})  ` +
      `-Z width=${minus.w.toFixed(2)} (n=${minus.n})  ` +
      `=> ${plus.w < minus.w ? "pointier +Z" : "pointier -Z"}`
  );
}

const boats = nodes.map((n) => sanitize(n.name)).filter((n) => /^Boat_(Row|Sail)_\d+$/.test(n));
for (const b of boats) {
  const r = analyze(b);
  if (!r) { console.log(b, "SKIP"); continue; }
  console.log(`${b}  t=[${(r.node.translation ?? [0, 0, 0]).map((v) => +v.toFixed(2))}] rot=[${(r.node.rotation ?? [0, 0, 0, 1]).map((v) => +v.toFixed(3))}] scale=[${(r.node.scale ?? [1, 1, 1]).map((v) => +v.toFixed(3))}]`);
  for (const [mname, verts] of r.buckets) profile(verts, mname);
}
