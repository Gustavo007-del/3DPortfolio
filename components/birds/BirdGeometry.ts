// components/Environment/Birds/BirdGeometry.ts
import { BufferGeometry, BufferAttribute, DoubleSide } from 'three';
import { SpeciesProfile } from './birdTypes';

// Low-poly faceted bird built as non-indexed triangles so each face keeps a
// flat normal (computeVertexNormals on non-indexed geometry = per-face
// shading, which is what gives the stylized low-poly look, not a smooth blob).
// aWingSide: -1 left wing / +1 right wing / 0 body-tail-head (unaffected by flap).
// aWingSpan: 0 at wing root (pinned, barely moves) -> 1 at wing tip (full flap arc).
// BirdMaterial's vertex shader reads both to animate the flap procedurally.

function pushTri(pos: number[], side: number[], span: number[], a: number[], b: number[], c: number[], s: number) {
  pos.push(...a, ...b, ...c);
  side.push(s, s, s);
  span.push(0, 0, 0);
}

export function createBirdGeometry(profile: SpeciesProfile): BufferGeometry {
  const L = profile.bodyLength, W = profile.wingSpan, T = profile.tailLength;
  const bw = L * 0.18, bh = L * 0.16, bhB = L * 0.10;

  const pos: number[] = [], side: number[] = [], span: number[] = [];

  // -- Body: octahedron-ish hull (nose <-> mid cross <-> tail), 8 faceted tris --
  const nose = [0, bh * 0.2, L * 0.55], tail = [0, 0, -L * 0.55];
  const top = [0, bh, L * 0.05], bot = [0, -bhB, L * 0.05], left = [-bw, 0, L * 0.05], right = [bw, 0, L * 0.05];
  pushTri(pos, side, span, nose, top, right, 0);
  pushTri(pos, side, span, nose, right, bot, 0);
  pushTri(pos, side, span, nose, bot, left, 0);
  pushTri(pos, side, span, nose, left, top, 0);
  pushTri(pos, side, span, tail, right, top, 0);
  pushTri(pos, side, span, tail, bot, right, 0);
  pushTri(pos, side, span, tail, left, bot, 0);
  pushTri(pos, side, span, tail, top, left, 0);

  // -- Head: small beak pyramid capping the nose --
  const beakTip = [0, bh * 0.1, L * 0.72];
  const hTop = [0, bh * 0.5, L * 0.5], hL = [-bw * 0.4, bh * 0.05, L * 0.45], hR = [bw * 0.4, bh * 0.05, L * 0.45];
  pushTri(pos, side, span, beakTip, hTop, hR, 0);
  pushTri(pos, side, span, beakTip, hR, hL, 0);
  pushTri(pos, side, span, beakTip, hL, hTop, 0);

  // -- Tail: flat fanned fin trailing off the back --
  const tailL = [-T * 0.5, 0.01, -L * 0.55 - T], tailR = [T * 0.5, 0.01, -L * 0.55 - T];
  pushTri(pos, side, span, tail, tailL, tailR, 0);

  // -- Wings: tapered swept quad per side, 2 tris each, span 0(root)->1(tip) --
  for (const s of [-1, 1]) {
    const rootF = [s * bw * 0.9, -bh * 0.05, L * 0.15];
    const rootB = [s * bw * 0.9, -bh * 0.05, -L * 0.05];
    const tipF = [s * (bw + W), bh * 0.1, L * 0.05];
    const tipB = [s * (bw + W), bh * 0.1, -L * 0.15];
    const start = pos.length / 3;
    if (s > 0) {
      pos.push(...rootF, ...rootB, ...tipB, ...rootF, ...tipB, ...tipF);
    } else {
      pos.push(...rootB, ...rootF, ...tipF, ...rootB, ...tipF, ...tipB);
    }
    side.push(s, s, s, s, s, s);
    span.push(0, 0, 1, 0, 1, 1);
    void start;
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('aWingSide', new BufferAttribute(new Float32Array(side), 1));
  geo.setAttribute('aWingSpan', new BufferAttribute(new Float32Array(span), 1));
  geo.computeVertexNormals();
  return geo;
}

export const BIRD_MATERIAL_SIDE = DoubleSide; // wings are single-sheet thin faces, need both-sided shading