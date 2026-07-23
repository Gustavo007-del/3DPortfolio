// components/Environment/ParticleEngine/particleTypes.ts

import * as THREE from "three";

export enum EmitterShape { Sphere="sphere", Box="box", Cylinder="cylinder", Line="line", Spline="spline", MeshSurface="meshSurface" }
export enum ParticleKind { Firefly="firefly", Snow="snow", Leaf="leaf", Dust="dust", Mist="mist", Smoke="smoke", Ash="ash", Ember="ember", Magic="magic", Rain="rain" }
export enum SpawnMode { Continuous="continuous", Burst="burst" }
export enum NoiseKind { None="none", Perlin="perlin", Simplex="simplex", Curl="curl" }
export enum LODLevel { Near="near", Medium="medium", Far="far", Culled="culled" }
export enum RenderShape { Glow="glow", Leaf="leaf", Flake="flake" }

export interface Vec2 { x:number; y:number }
export interface Vec3 { x:number; y:number; z:number }

export interface EmitterConfig {
  shape:EmitterShape;
  center:[number,number,number];
  radius?:number;
  size?:[number,number,number];
  height?:number;
  points?:[number,number,number][];
  surface?:THREE.BufferGeometry;
  spawnMode:SpawnMode;
  spawnRate:number;
  burstCount?:number;
  burstInterval?:number;
}

export interface ForceFieldConfig {
  gravity:number;
  drag:number;
  windInfluence:number;
  noiseKind:NoiseKind;
  noiseScale:number;
  noiseStrength:number;
  maxSpeed:number;
  attractors?:AttractorConfig[];
}

export interface AttractorConfig {
  position:[number,number,number];
  strength:number;
  radius:number;
  repel?:boolean;
  orbit?:boolean;
  vortexStrength?:number;
}

export interface VisualConfig {
  size:number;
  sizeVariation:number;
  color:[number,number,number];
  colorVariation:number;
  opacity:number;
  glowIntensity:number;
  softness:number;
  blink:boolean;
  blinkSpeed:number;
  blinkSpeedVariation:number;
  uvAnimate:boolean;
  fadeInDuration:number;
  fadeOutDuration:number;
  cameraFadeDistance:number;
  rotationSpeed:number;
  stretch:number;
  requiresSort:boolean;
  renderShape:RenderShape;
  additiveBlend:boolean;
}

export interface LODConfig {
  nearDistance:number;
  mediumDistance:number;
  farDistance:number;
  mediumCountScale:number;
  farCountScale:number;
}

export interface ParticleConfig {
  kind:ParticleKind;
  count:number;
  lifetime:number;
  lifetimeVariation:number;
  loop:boolean;
  emitter:EmitterConfig;
  forces:ForceFieldConfig;
  visual:VisualConfig;
  lod:LODConfig;
}

export interface ParticleFieldProps {
  id:string;
  config:ParticleConfig;
  windFactor?:number;
  paused?:boolean;
  frozen?:boolean;
}

export interface ParticleAttributeSchema {
  aSize:Float32Array;
  aSeed:Float32Array;
  aAge:Float32Array;
  aLifetime:Float32Array;
  aVelocity:Float32Array;
  aBlinkSpeed:Float32Array;
  aBlinkOffset:Float32Array;
  // aNoiseScale:Float32Array;
  aRotation:Float32Array;
  aOpacity:Float32Array;
  aColorVariation:Float32Array;
  aType:Float32Array;
  // aWindFactor:Float32Array;
  // aGravity:Float32Array;
  // aDrag:Float32Array;
}

export interface ParticleRuntimeState {
  positions:Float32Array;
  velocities:Float32Array;
  ages:Float32Array;
  lifetimes:Float32Array;
  alive:Uint8Array;
  seeds:Float32Array;
  activeCount:number;
  cursor:number;
}

export interface ForceSample { x:number; y:number; z:number }
export type ForceFn=(index:number,px:number,py:number,pz:number,vx:number,vy:number,vz:number,dt:number,out:ForceSample)=>void;

export interface ParticleMaterialUniforms {
  uTime:{value:number};
  uColor:{value:THREE.Color};
  uGlowIntensity:{value:number};
  uSoftness:{value:number};
  uOpacity:{value:number};
  uUvAnimate:{value:number};
  uCameraFadeDistance:{value:number};
  uWindStrength:{value:number};
  uWindDirection:{value:THREE.Vector2};
  uStretch:{value:number};
  [key:string]:{value:any};
}

export interface DebugFlags {
  showEmitters:boolean;
  showBounds:boolean;
  showVelocity:boolean;
  showIds:boolean;
  showLOD:boolean;
  showGPUStats:boolean;
  pauseSimulation:boolean;
  freezeParticles:boolean;
}

export interface ControllerFieldEntry {
  id:string;
  label:string;
  kind:ParticleKind;
  config:ParticleConfig;
}