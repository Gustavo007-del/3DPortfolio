// components/fire/MistMaterial.ts
"use client";

import * as THREE from "three";

/* ------------------------------------------------------------------
   VERTEX SHADER (unchanged)
------------------------------------------------------------------- */
const vertexShader = /* glsl */ `
  precision highp float;

  attribute vec3 aOffset;
  attribute float aSeed;
  attribute vec2 aNoiseOffset;
  attribute float aScale;
  attribute float aRotation;
  attribute float aTilt;
  attribute float aOpacityRand;
  attribute float aDensityRand;
  attribute float aSpeedRand;

  uniform float uTime;
  uniform float uSpeed;
  uniform vec2 uWindVector;
  uniform float uWindStrength;

  varying vec2 vUv;
  varying float vSeed;
  varying vec2 vNoiseOffset;
  varying float vOpacityRand;
  varying float vDensityRand;
  varying float vSpeedRand;
  varying float vWorldY;
  varying float vDistToCamera;

  void main() {
    vUv = uv;
    vSeed = aSeed;
    vNoiseOffset = aNoiseOffset;
    vOpacityRand = aOpacityRand;
    vDensityRand = aDensityRand;
    vSpeedRand = aSpeedRand;

    float t = uTime * uSpeed * (0.35 + aSpeedRand * 0.9);

    vec2 drift = uWindVector * uWindStrength * t * 0.12;
    vec3 anchor = aOffset + vec3(drift.x, 0.0, drift.y);

    vec3 camForward=normalize(cameraPosition-anchor);

vec3 worldUp=vec3(0.0,1.0,0.0);

vec3 camRight=normalize(cross(worldUp,camForward));

vec3 camUp=normalize(cross(camForward,camRight));

    float c = cos(aRotation);
    float s = sin(aRotation);
    vec2 local = position.xy;
    vec2 rotated = vec2(
      local.x * c - local.y * s,
      local.x * s + local.y * c
    );
    float ct=cos(aTilt);

float st=sin(aTilt);

vec2 tilted=vec2(
rotated.x,
rotated.y*ct+rotated.x*st
);

    vec3 worldPos=
anchor+
camRight*tilted.x*aScale+
camUp*tilted.y*aScale;

    vWorldY = worldPos.y;

    vec4 mvPosition = viewMatrix * vec4(worldPos, 1.0);
    vDistToCamera = -mvPosition.z;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

/* ------------------------------------------------------------------
   FRAGMENT SHADER
   Fixes the "perfect circle" regression:
   - uSoftness lowered + clamped to a sane max so density keeps real
     shape instead of flattening to a disc.
   - Edge mask is now perturbed by low-frequency noise (uEdgeNoise) so
     each patch's silhouette is irregular/wispy, not a clean circle.
   - fwidth-based analytic AA kept (this part was correct — it's what
     killed the shimmer/grain) but no longer the only thing visible.
------------------------------------------------------------------- */
const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  varying float vSeed;
  varying vec2 vNoiseOffset;
  varying float vOpacityRand;
  varying float vDensityRand;
  varying float vSpeedRand;
  varying float vWorldY;
  varying float vDistToCamera;

  uniform float uTime;
  uniform float uSpeed;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uDensity;
  uniform vec2 uWindVector;
  uniform float uWindStrength;
  uniform float uHeightFadeStart;
  uniform float uHeightFadeEnd;
  uniform float uFalloffRadius;
  uniform float uDitherStrength;
  uniform float uNearFade;
  uniform float uFarFade;
  uniform float uSoftness;
  uniform float uEdgeNoise;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  // Back to 4 octaves — 3 was too featureless once softness dropped
  // back down, patches looked flat/empty in the middle.
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * valueNoise(p);
      p *= 2.0;
      amplitude *= 0.48;
    }
    return value;
  }

  float warpedFbm(vec2 p) {
    vec2 q = vec2(
      fbm(p + vec2(0.0, 0.0)),
      fbm(p + vec2(5.2, 1.3))
    );
    vec2 r = vec2(
      fbm(p + 3.0 * q + vec2(1.7, 9.2)),
      fbm(p + 3.0 * q + vec2(8.3, 2.8))
    );
    return fbm(p + 3.0 * r);
  }

  void main() {
    vec2 centered = vUv - 0.5;

    // --- per-instance noise field (seed + explicit noise offset) ---
    vec2 seedOffset = vec2(vSeed * 37.13, vSeed * 91.71) + vNoiseOffset;

    float t = uTime * uSpeed * (0.35 + vSpeedRand * 0.9);
    vec2 windFlow = uWindVector * uWindStrength * t * 0.06;

    // --- irregular silhouette: perturb the radial distance itself
    // with a slow, low-frequency noise sample so the edge is wobbly
    // instead of a perfect circle. Angle-based sampling means the
    // perturbation is stable around the circumference (no seams).
    float angle=atan(centered.y,centered.x);

float radius=length(centered);

vec2 edgeNoiseUv=
vec2(
cos(angle),
sin(angle)
)*4.0+
seedOffset*2.0;

float n1=fbm(edgeNoiseUv);

float n2=fbm(edgeNoiseUv*2.0+13.7);

float n3=fbm(edgeNoiseUv*4.0-5.3);

float edgeShape=
n1*0.6+
n2*0.3+
n3*0.1;

edgeShape=(edgeShape-.5)*2.0;

float radial=
radius*2.0+
edgeShape*uEdgeNoise*0.55;

    float edgeAA = max(fwidth(radial), 0.0008);
    float edgeStart = 1.0 - uFalloffRadius;
    float edgeMask=
1.0-
smoothstep(
edgeStart-0.08-edgeAA,
edgeStart+0.12+edgeAA,
radial
);
    if (edgeMask <= 0.001) discard;

    vec2 noiseUv = (vUv + seedOffset) * (1.1 + vDensityRand * 0.8) + windFlow;

    float raw = warpedFbm(noiseUv + t * 0.04);

    // --- analytic AA + user-controlled softness on the density curve ---
    // uSoftness is clamped so it can never fully flatten the noise
    // shape into a solid disc (that was the "circle" bug).
    float safeSoftness = clamp(uSoftness, 0.02, 0.32);
    float raweAA = max(fwidth(raw), 0.015);
    float halfBand = max(safeSoftness, raweAA);
    float density = smoothstep(0.5 - halfBand, 0.5 + halfBand, raw);
    density = clamp(density * uDensity * (0.55 + vDensityRand * 0.9), 0.0, 1.0);

    float heightFade = 1.0 - smoothstep(uHeightFadeStart, uHeightFadeEnd, vWorldY);
    heightFade = clamp(heightFade, 0.0, 1.0);

    float nearFade = smoothstep(uNearFade * 0.4, uNearFade, vDistToCamera);
    float farFade = 1.0 - smoothstep(uFarFade * 0.7, uFarFade, vDistToCamera);

    float softEdge = pow(edgeMask, 2.6);

    float alpha = density * softEdge * heightFade * nearFade * farFade;
    alpha *= uOpacity * vOpacityRand;

    float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * uDitherStrength;
    alpha = clamp(alpha + dither, 0.0, 1.0);

    if (alpha <= 0.004) discard;

    gl_FragColor = vec4(uColor, alpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export interface MistMaterialParams {
  color?: THREE.ColorRepresentation;
  opacity?: number;
  density?: number;
  speed?: number;
  windStrength?: number;
  heightFadeStart?: number;
  heightFadeEnd?: number;
  falloffRadius?: number;
  ditherStrength?: number;
  nearFade?: number;
  farFade?: number;
  softness?: number;
  edgeNoise?: number;
}

export class MistMaterial extends THREE.ShaderMaterial {
  constructor(params: MistMaterialParams = {}) {
    super({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      toneMapped: true,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: params.speed ?? 1.0 },
        uColor: { value: new THREE.Color(params.color ?? "#dfe6ea") },
        uOpacity: { value: params.opacity ?? 0.35 },
        uDensity: { value: params.density ?? 1.0 },
        uWindVector: { value: new THREE.Vector2(1, 0) },
        uWindStrength: { value: params.windStrength ?? 1.0 },
        uHeightFadeStart: { value: params.heightFadeStart ?? 0.0 },
        uHeightFadeEnd: { value: params.heightFadeEnd ?? 8.0 },
        uFalloffRadius: { value: params.falloffRadius ?? 0.45 },
        uDitherStrength: { value: params.ditherStrength ?? 0.01 },
        uNearFade: { value: params.nearFade ?? 1.2 },
        uFarFade: { value: params.farFade ?? 260.0 },
        // Clamped in-shader to [0.02, 0.32] — this default sits well
        // inside that range so noise shape is always visible.
        uSoftness: { value: params.softness ?? 0.16 },
        // How much the circular edge wobbles away from a perfect
        // circle. 0 = perfect disc (old bug), ~0.15-0.3 = wispy edge.
        uEdgeNoise: { value: params.edgeNoise ?? 0.18 },
      },
    });
  }
}

export default MistMaterial;