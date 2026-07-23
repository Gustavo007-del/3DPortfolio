// components/Environment/Birds/BirdMaterial.ts
import { MeshStandardMaterial, Color, WebGLProgramParametersWithUniforms  } from 'three';

// Built on MeshStandardMaterial (not a raw ShaderMaterial) via onBeforeCompile
// so birds get full PBR lighting, shadow casting AND receiving for free from
// three's built-in shadow pipeline (a raw ShaderMaterial would need its own
// customDepthMaterial + manual light math to cast/receive shadows correctly).
// We inject wing-flap vertex displacement into the compiled shader instead of
// hand-rolling lighting.

export interface BirdMaterialOptions { color: string; roughness?: number; metalness?: number; }

export class BirdMaterial extends MeshStandardMaterial {
  uniforms: { uTime: { value: number } };

  constructor(opts: BirdMaterialOptions) {
    super({ color: new Color(opts.color), roughness: opts.roughness ?? 0.85, metalness: opts.metalness ?? 0.05, side: 2 });
    this.uniforms = { uTime: { value: 0 } };
    this.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uTime = this.uniforms.uTime;
      shader.vertexShader = 'uniform float uTime;\nattribute float aWingSide;\nattribute float aWingSpan;\nattribute float aWingPhase;\nattribute float aWingSpeed;\nattribute float aWingAmp;\nattribute float aGlide;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
float flapAmp=aWingAmp*(1.-aGlide*0.85);
float flap=sin(uTime*aWingSpeed+aWingPhase)*flapAmp*aWingSpan;
transformed.y+=flap;
transformed.x*=1.-abs(flap)*0.15*aWingSpan;
`);
      (this as any)._shader = shader;
    };
  }

  setTime(t: number) { this.uniforms.uTime.value = t; }
}

export function createBirdMaterial(opts: BirdMaterialOptions): BirdMaterial {
  return new BirdMaterial(opts);
}

export const BIRD_INSTANCE_ATTRS = ['aWingPhase', 'aWingSpeed', 'aWingAmp', 'aGlide'] as const;