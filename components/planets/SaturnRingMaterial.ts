// components/planets/SaturnRingMaterial.ts
import * as THREE from "three";

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uInner;
  uniform float uOuter;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    // vUv.x runs 0..1 across ring width for THREE.RingGeometry.
    float r = mix(uInner, uOuter, vUv.x);

    // Stacked bands: several hashed frequency bands summed for an
    // irregular, non-uniform ring pattern like Saturn's real banding,
    // instead of one flat color.
    float bands = hash(floor(r * 40.0)) * 0.5
                + hash(floor(r * 13.0) + 50.0) * 0.3
                + hash(floor(r * 71.0) + 90.0) * 0.2;

    vec3 base = vec3(0.78, 0.71, 0.58);
    vec3 color = base * (0.6 + bands * 0.6);

    // Fade edges so the ring doesn't have a hard cutoff.
    float edgeFade = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
    float alpha = (0.35 + bands * 0.4) * edgeFade;

    gl_FragColor = vec4(color, alpha);
  }
`;

export class SaturnRingMaterial extends THREE.ShaderMaterial {
  constructor(inner: number, outer: number) {
    super({
      uniforms: { uInner: { value: inner }, uOuter: { value: outer } },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }
}