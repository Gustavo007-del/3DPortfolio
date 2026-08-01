// components/planets/JupiterMaterial.ts
import * as THREE from "three";

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float uTime;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

  float valueNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  // Domain-warped fbm: feeding noise back into its own input coordinates
  // is what produces the "swirling, sheared" look real turbulence has,
  // instead of plain layered noise which just looks blobby.
  float fbm(vec2 p) {
    float sum = 0.0, amp = 0.5;
    for (int i = 0; i < 5; i++) {
      sum += valueNoise(p) * amp;
      p *= 2.02;
      amp *= 0.5;
    }
    return sum;
  }

  void main() {
    // Stretch UVs so noise reads as horizontal BANDS (Jupiter's real look)
    // rather than isotropic blobs — narrow in y, wide in x.
    vec2 bandUv = vec2(vUv.x * 3.0, vUv.y * 14.0);

    // Domain warp: offset the sampling coordinate by another fbm field,
    // scaled and time-drifted, so bands shear and swirl instead of sitting
    // static.
    vec2 warp = vec2(
      fbm(bandUv * 0.6 + vec2(uTime * 0.015, 0.0)),
      fbm(bandUv * 0.6 + vec2(5.2, uTime * 0.01))
    );
    float turbulence = fbm(bandUv + warp * 1.8);

    // Band coloring: alternate warm tan / darker rust stripes based on
    // vUv.y banding, modulated by turbulence for organic variation.
    float bandPhase = sin(vUv.y * 40.0 + turbulence * 3.0);
    vec3 colorLight = vec3(0.85, 0.72, 0.55);
    vec3 colorDark = vec3(0.62, 0.46, 0.32);
    vec3 base = mix(colorDark, colorLight, smoothstep(-0.3, 0.5, bandPhase));
    base = mix(base, base * 1.15, turbulence);

    // Great Red Spot: an elliptical turbulent storm baked into the shader
    // instead of a separate flat sphere mesh — reads as part of the
    // atmosphere, not a decal stuck on top.
    vec2 spotUv = (vUv - vec2(0.68, 0.42)) * vec2(1.0, 1.0 / 0.35);
    spotUv.x *= 2.2;
    float spotDist = length(spotUv);
    float spotSwirl = fbm(spotUv * 3.0 + vec2(uTime * 0.05, 0.0));
    float spotMask = smoothstep(1.0, 0.3, spotDist + spotSwirl * 0.25);
    vec3 spotColor = vec3(0.72, 0.32, 0.22);
    base = mix(base, spotColor, spotMask * 0.85);

    // Cheap terminator shading using the fragment's view-space normal.
    float shade = 0.55 + 0.45 * max(vNormal.z, 0.0);

    gl_FragColor = vec4(base * shade, 1.0);
  }
`;

export class JupiterMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: { uTime: { value: 0 } },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });
  }
  update(time: number) {
    this.uniforms.uTime.value = time;
  }
}

export default JupiterMaterial;