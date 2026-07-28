// components/World/Transition/CloudVeilMaterial.ts
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
  uniform float uTime;
  uniform float uDensity;
  uniform vec3 uColorLit;
  uniform vec3 uColorShadow;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

  float valueNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float sum = 0.0, amp = 0.5;
    for (int i = 0; i < 5; i++) { sum += valueNoise(p) * amp; p *= 2.02; amp *= 0.5; }
    return sum;
  }

  void main() {
    vec2 p = vUv * 4.0 + vec2(uTime * 0.03, uTime * 0.015);
    float mask = fbm(p);

    // As density rises, both the overall coverage AND the noise threshold
    // shift, so it reads as "cloud thickening/parting" rather than a flat
    // screen tint fading in and out.
    float alpha = smoothstep(0.55 - uDensity * 0.5, 0.95 - uDensity * 0.5, mask + uDensity * 0.5);
    alpha *= uDensity;

    vec3 color = mix(uColorShadow, uColorLit, fbm(p * 1.7 + 5.0));
    gl_FragColor = vec4(color, alpha);
  }
`;

export class CloudVeilMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uTime: { value: 0 },
        uDensity: { value: 0 },
        uColorLit: { value: new THREE.Color("#f4f8ff") },
        uColorShadow: { value: new THREE.Color("#aab6c8") },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: false, // always drawn on top — see renderOrder on the mesh
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
    });
  }

  update(time: number, density: number) {
    this.uniforms.uTime.value = time;
    this.uniforms.uDensity.value = density;
  }
}

export default CloudVeilMaterial;