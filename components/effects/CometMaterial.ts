// components/effects/CometMaterial.ts
import * as THREE from "three";

const VERTEX_SHADER = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vAlpha = aAlpha;
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    // Soft radial falloff instead of a flat circle — same technique as the
    // star field sprites. This alone is most of the "looks like a real
    // glowing trail" difference vs. the old PointsMaterial dots.
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;
    float falloff = smoothstep(1.0, 0.0, d);
    falloff = pow(falloff, 1.6);

    gl_FragColor = vec4(vColor, falloff * vAlpha);
  }
`;

export class CometTrailMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }
}

export default CometTrailMaterial;