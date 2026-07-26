// components/World/Transition/CloudMaterial.ts
import * as THREE from "three";

/*
Billboarding technique: rather than trying to strip rotation out of
instanceMatrix, we transform ONLY the instance's center point to view space,
then offset the quad's corners directly in view space (mvPosition.xy +=
position.xy * size). Since view space is already camera-aligned by
definition, this makes every card face the camera exactly, regardless of
whatever rotation happens to be baked into instanceMatrix — the standard,
reliable way to billboard instances without a per-frame CPU pass.

Cloud shape comes from a cheap hash-based value-noise fbm (3 octaves) in the
fragment shader — no textures, no texture memory, no loading. This is the
"procedural shader clouds" approach from the acceptable-implementations list,
combined with "billboard cloud sprites" for placement (CloudField, file 3).
*/

const VERTEX_SHADER = /* glsl */ `
  attribute float aScale;
  attribute float aPhase;
  attribute float aFade;

  uniform float uSize;

  varying vec2 vUv;
  varying float vPhase;
  varying float vFade;

  void main() {
    vUv = uv;
    vPhase = aPhase;
    vFade = aFade;

    #ifdef USE_INSTANCING
      vec4 instanceCenter = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    #else
      vec4 instanceCenter = vec4(0.0, 0.0, 0.0, 1.0);
    #endif

    vec4 mvPosition = modelViewMatrix * instanceCenter;
    mvPosition.xy += position.xy * uSize * aScale;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uDensity;
  uniform float uDrift;
  uniform vec3 uColorLit;
  uniform vec3 uColorShadow;

  varying vec2 vUv;
  varying float vPhase;
  varying float vFade;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  // 3 octaves is enough to read as "cloud" rather than "circle" without
  // costing much — this runs per-fragment across every card, every frame.
  float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 3; i++) {
      sum += valueNoise(p) * amp;
      p *= 2.02;
      amp *= 0.5;
    }
    return sum;
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float dist = length(centered) * 2.0; // 0 at center, 1 at edge

    float radial = 1.0 - smoothstep(0.35, 1.0, dist);

    // Drift the noise sample over time (unique per-card via vPhase) so the
    // cloud silhouette itself slowly billows instead of sitting static.
    vec2 driftedUv = vUv * 3.0 + vec2(uTime * uDrift * 0.05, vPhase);
    float mask = fbm(driftedUv + vPhase);
    radial *= smoothstep(0.15, 0.75, mask);

    float alpha = radial * vFade * uDensity;
    if (alpha < 0.01) discard;

    // Cheap top-lit look: brighter near the card's top, greyer toward the
    // bottom. Sells "sunlit cloud tops" without any real lighting math.
    vec3 color = mix(uColorShadow, uColorLit, smoothstep(0.2, 0.9, vUv.y));

    gl_FragColor = vec4(color, alpha);
  }
`;

export class CloudMaterial extends THREE.ShaderMaterial {
  constructor(size = 40) {
    super({
      uniforms: {
        uTime: { value: 0 },
        uDensity: { value: 0 },
        uDrift: { value: 0.6 },
        uColorLit: { value: new THREE.Color("#f4f8ff") },
        uColorShadow: { value: new THREE.Color("#aab6c8") },
        uSize: { value: size },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false, // translucent cards never occlude each other in the depth buffer...
      depthTest: true, //   ...but DO still get correctly hidden behind solid scene geometry
      blending: THREE.NormalBlending, // physical "fog mass" accumulation, not an additive glow
      side: THREE.DoubleSide,
    });
  }

  // Called once per frame from CloudTransition (file 4) — keeps callers from
  // poking at .uniforms.x.value directly everywhere.
  update(time: number, density: number) {
    this.uniforms.uTime.value = time;
    this.uniforms.uDensity.value = density;
  }

  setDrift(drift: number) {
    this.uniforms.uDrift.value = drift;
  }
}

export default CloudMaterial;