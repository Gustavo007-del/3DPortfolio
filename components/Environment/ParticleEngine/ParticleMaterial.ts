// components/Environment/ParticleEngine/ParticleMaterial.ts

import * as THREE from "three";
import { ParticleMaterialUniforms } from "./particleTypes";

const vertexShader=`
attribute vec3 aInstancePosition;attribute vec3 aVelocity;attribute float aSize;attribute float aSeed;attribute float aAge;attribute float aLifetime;attribute float aBlinkSpeed;attribute float aBlinkOffset;attribute float aRotation;attribute float aOpacity;attribute float aColorVariation;attribute float aType;
uniform float uTime;uniform float uStretch;uniform float uCameraFadeDistance;
varying vec2 vUv;varying float vAge;varying float vLifetime;varying float vSeed;varying float vColorVariation;varying float vOpacity;varying float vBlinkSpeed;varying float vBlinkOffset;varying float vDepth;varying float vType;
void main(){
vUv=uv;vAge=aAge;vLifetime=aLifetime;vSeed=aSeed;vColorVariation=aColorVariation;vOpacity=aOpacity;vBlinkSpeed=aBlinkSpeed;vBlinkOffset=aBlinkOffset;vType=aType;
vec3 worldPos=aInstancePosition;
vec3 camRight=vec3(viewMatrix[0].x,viewMatrix[1].x,viewMatrix[2].x);
vec3 camUp=vec3(viewMatrix[0].y,viewMatrix[1].y,viewMatrix[2].y);
float c=cos(aRotation),s=sin(aRotation);
vec2 rotUv=vec2(position.x*c-position.y*s,position.x*s+position.y*c);
float speed=length(aVelocity);
vec3 stretchDir=speed>0.0001?normalize(aVelocity):vec3(0.,1.,0.);
float stretchAmt=1.+uStretch*min(speed*0.5,3.);
vec3 offset=(camRight*rotUv.x+camUp*rotUv.y)*aSize;
offset+=stretchDir*rotUv.y*aSize*(stretchAmt-1.)*sign(rotUv.y);
vec4 mvPosition=viewMatrix*vec4(worldPos,1.)+vec4(offset,0.);
vDepth=-mvPosition.z;
gl_Position=projectionMatrix*mvPosition;
}
`;

const fragmentShader=`
precision highp float;
uniform vec3 uColor;uniform float uGlowIntensity;uniform float uSoftness;uniform float uOpacity;uniform float uUvAnimate;uniform float uTime;uniform float uCameraFadeDistance;uniform float uFadeIn;uniform float uFadeOut;uniform float uBlinkEnabled;uniform vec2 uWindDirection;uniform float uWindStrength;uniform float uShape;
varying vec2 vUv;varying float vAge;varying float vLifetime;varying float vSeed;varying float vColorVariation;varying float vOpacity;varying float vBlinkSpeed;varying float vBlinkOffset;varying float vDepth;varying float vType;

float hash(float n){return fract(sin(n)*43758.5453123);}

void main(){
vec2 centered=vUv-0.5;
float alpha=0.;
float glow=1.;

if(uShape<0.5){
float dist=length(centered)*2.;
float uvNoise=uUvAnimate>0.5?sin((centered.x*6.+uTime*0.6+vSeed*6.283)+uWindDirection.x*uWindStrength*2.)*0.08:0.;
dist+=uvNoise;
float radial=1.-smoothstep(uSoftness*0.4,1.,dist);
glow=pow(radial,2.-uGlowIntensity*0.5)*(1.+uGlowIntensity);
alpha=radial;
}else if(uShape<1.5){
float lx=centered.x*2.2,ly=centered.y*2.0;
float width=(1.-abs(ly))*0.85;
float leafMask=1.-smoothstep(width*0.75,width,abs(lx));
leafMask*=smoothstep(1.05,0.9,abs(ly));
float vein=1.-smoothstep(0.,0.05,abs(lx));
alpha=clamp(leafMask,0.,1.);
glow=mix(1.,0.6,vein*leafMask);
}else{
float dist=length(centered)*2.;
float points=abs(sin(atan(centered.y,centered.x)*3.+vSeed*6.283));
float flake=1.-smoothstep(0.3+points*0.25,0.55+points*0.25,dist);
alpha=clamp(flake,0.,1.);
glow=1.;
}

float lifeRatio=vLifetime>0.0001?clamp(vAge/vLifetime,0.,1.):0.;
float fadeInT=uFadeIn>0.0001?smoothstep(0.,uFadeIn,vAge):1.;
float fadeOutStart=vLifetime-uFadeOut;
float fadeOutT=uFadeOut>0.0001?1.-smoothstep(fadeOutStart,vLifetime,vAge):1.;
float lifeFade=clamp(min(fadeInT,fadeOutT),0.,1.);
float blink=1.;
if(uBlinkEnabled>0.5){blink=0.5+0.5*sin(uTime*vBlinkSpeed*6.283+vBlinkOffset*6.283);blink=mix(0.35,1.,blink);}
float camFade=1.-smoothstep(uCameraFadeDistance*0.6,uCameraFadeDistance,vDepth);
vec3 colVar=uColor+vec3(hash(vSeed)-0.5,hash(vSeed*2.1)-0.5,hash(vSeed*3.7)-0.5)*vColorVariation;
float alphaFinal=alpha*uOpacity*vOpacity*lifeFade*blink*camFade;
if(alphaFinal<0.003)discard;
gl_FragColor=vec4(colVar*glow,alphaFinal);
}
`;

export interface ParticleMaterialOptions {
  color?:THREE.Color;
  glowIntensity?:number;
  softness?:number;
  opacity?:number;
  uvAnimate?:boolean;
  cameraFadeDistance?:number;
  fadeIn?:number;
  fadeOut?:number;
  blinkEnabled?:boolean;
  stretch?:number;
  additiveBlend?:boolean;
  renderShape?:string;
}

export class ParticleMaterial extends THREE.ShaderMaterial {
  constructor(opts:ParticleMaterialOptions={}) {
    const uniforms:ParticleMaterialUniforms={
      uTime:{value:0},
      uColor:{value:opts.color??new THREE.Color(1,1,1)},
      uGlowIntensity:{value:opts.glowIntensity??0.5},
      uSoftness:{value:opts.softness??0.6},
      uOpacity:{value:opts.opacity??1},
      uUvAnimate:{value:opts.uvAnimate?1:0},
      uCameraFadeDistance:{value:opts.cameraFadeDistance??40},
      uWindStrength:{value:0},
      uWindDirection:{value:new THREE.Vector2(1,0)},
      uStretch:{value:opts.stretch??0},
      uFadeIn:{value:opts.fadeIn??0.5},
      uFadeOut:{value:opts.fadeOut??0.5},
      uBlinkEnabled:{value:opts.blinkEnabled?1:0},
      uShape:{value:opts.renderShape==="leaf"?1:opts.renderShape==="flake"?2:0},
    };
    super({
      vertexShader,fragmentShader,uniforms,
      transparent:true,depthWrite:false,depthTest:true,
      blending:opts.additiveBlend===false?THREE.NormalBlending:THREE.AdditiveBlending,
      side:THREE.DoubleSide,
    });
  }

  setTime(t:number){ (this.uniforms.uTime as {value:number}).value=t; }
  setWind(strength:number,dirX:number,dirY:number){
    (this.uniforms.uWindStrength as {value:number}).value=strength;
    const v=(this.uniforms.uWindDirection as {value:THREE.Vector2}).value;
    v.set(dirX,dirY);
  }
  setCameraFadeDistance(d:number){ (this.uniforms.uCameraFadeDistance as {value:number}).value=d; }
}

export function createParticleGeometry():THREE.PlaneGeometry {
  const geo=new THREE.PlaneGeometry(1,1,1,1);
  return geo;
}

let _sharedQuad:THREE.PlaneGeometry|null=null;
export function getSharedQuadGeometry():THREE.PlaneGeometry {
  if(!_sharedQuad) _sharedQuad=createParticleGeometry();
  return _sharedQuad;
}