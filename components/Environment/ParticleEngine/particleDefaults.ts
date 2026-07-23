// components/Environment/ParticleEngine/particleDefaults.ts

import { ParticleConfig, ParticleKind, EmitterShape, SpawnMode, NoiseKind, RenderShape } from "./particleTypes";

function baseConfig(overrides:Partial<ParticleConfig>):ParticleConfig {
  const defaults:ParticleConfig={
    kind:ParticleKind.Dust,count:200,lifetime:6,lifetimeVariation:2,loop:true,
    emitter:{shape:EmitterShape.Sphere,center:[0,0,0],radius:10,spawnMode:SpawnMode.Continuous,spawnRate:20},
    forces:{gravity:0,drag:0.1,windInfluence:0.3,noiseKind:NoiseKind.Simplex,noiseScale:0.5,noiseStrength:0.2,maxSpeed:2},
    visual:{size:0.15,sizeVariation:0.3,color:[1,1,1],colorVariation:0.1,opacity:0.8,glowIntensity:0.5,softness:0.6,blink:false,blinkSpeed:1,blinkSpeedVariation:0.2,uvAnimate:false,fadeInDuration:0.5,fadeOutDuration:0.5,cameraFadeDistance:40,rotationSpeed:0,stretch:0,requiresSort:false,renderShape:RenderShape.Glow,additiveBlend:true},
    lod:{nearDistance:15,mediumDistance:35,farDistance:60,mediumCountScale:0.6,farCountScale:0.25},
  };
  return {...defaults,...overrides,
    emitter:{...defaults.emitter,...overrides.emitter},
    forces:{...defaults.forces,...overrides.forces},
    visual:{...defaults.visual,...overrides.visual},
    lod:{...defaults.lod,...overrides.lod},
  };
}

export const FireflyDefaults:ParticleConfig=baseConfig({
  kind:ParticleKind.Firefly,count:300,lifetime:8,lifetimeVariation:3,
  emitter:{shape:EmitterShape.Sphere,center:[0,4,0],radius:20,spawnMode:SpawnMode.Continuous,spawnRate:15},
  forces:{gravity:0,drag:0.4,windInfluence:0.15,noiseKind:NoiseKind.Curl,noiseScale:0.35,noiseStrength:0.6,maxSpeed:1.2},
  visual:{size:0.12,sizeVariation:0.4,color:[1,0.85,0.4],colorVariation:0.15,opacity:1,glowIntensity:1.4,softness:0.8,blink:true,blinkSpeed:2.2,blinkSpeedVariation:0.6,uvAnimate:false,fadeInDuration:1,fadeOutDuration:1,cameraFadeDistance:35,rotationSpeed:0,stretch:0,requiresSort:false,renderShape:RenderShape.Glow,additiveBlend:true},
});

export const SnowDefaults:ParticleConfig=baseConfig({
  kind:ParticleKind.Snow,count:1000,lifetime:14,lifetimeVariation:4,
  emitter:{shape:EmitterShape.Box,center:[0,15,0],size:[60,2,60],spawnMode:SpawnMode.Continuous,spawnRate:60},
  forces:{gravity:-0.35,drag:0.15,windInfluence:0.5,noiseKind:NoiseKind.Perlin,noiseScale:0.2,noiseStrength:0.3,maxSpeed:1.5},
  visual:{size:0.08,sizeVariation:0.5,color:[1,1,1],colorVariation:0.02,opacity:0.9,glowIntensity:0.1,softness:0.5,blink:false,blinkSpeed:1,blinkSpeedVariation:0,uvAnimate:false,fadeInDuration:0.8,fadeOutDuration:1.2,cameraFadeDistance:45,rotationSpeed:0.4,stretch:0,requiresSort:false,renderShape:RenderShape.Flake,additiveBlend:false},
});

export const LeafDefaults:ParticleConfig=baseConfig({
  kind:ParticleKind.Leaf,count:150,lifetime:10,lifetimeVariation:3,
  emitter:{shape:EmitterShape.Box,center:[0,10,0],size:[40,3,40],spawnMode:SpawnMode.Continuous,spawnRate:8},
  forces:{gravity:-0.25,drag:0.5,windInfluence:0.9,noiseKind:NoiseKind.Curl,noiseScale:0.3,noiseStrength:0.5,maxSpeed:2},
  visual:{size:0.25,sizeVariation:0.4,color:[0.6,0.4,0.15],colorVariation:0.25,opacity:0.95,glowIntensity:0,softness:0.3,blink:false,blinkSpeed:1,blinkSpeedVariation:0,uvAnimate:false,fadeInDuration:0.4,fadeOutDuration:0.8,cameraFadeDistance:40,rotationSpeed:1.5,stretch:0.3,requiresSort:false,renderShape:RenderShape.Leaf,additiveBlend:false},
});

export const DustDefaults:ParticleConfig=baseConfig({
  kind:ParticleKind.Dust,count:400,lifetime:9,lifetimeVariation:3,
  emitter:{shape:EmitterShape.Cylinder,center:[0,1,0],radius:15,height:4,spawnMode:SpawnMode.Continuous,spawnRate:25},
  forces:{gravity:-0.02,drag:0.3,windInfluence:0.4,noiseKind:NoiseKind.Simplex,noiseScale:0.6,noiseStrength:0.15,maxSpeed:0.8},
  visual:{size:0.06,sizeVariation:0.5,color:[0.8,0.75,0.6],colorVariation:0.2,opacity:0.4,glowIntensity:0.05,softness:0.9,blink:false,blinkSpeed:1,blinkSpeedVariation:0,uvAnimate:false,fadeInDuration:0.6,fadeOutDuration:0.6,cameraFadeDistance:30,rotationSpeed:0,stretch:0,requiresSort:false,renderShape:RenderShape.Glow,additiveBlend:true},
});

export const MistDefaults:ParticleConfig=baseConfig({
  kind:ParticleKind.Mist,count:120,lifetime:16,lifetimeVariation:5,
  emitter:{shape:EmitterShape.Box,center:[0,0.5,0],size:[50,1,50],spawnMode:SpawnMode.Continuous,spawnRate:6},
  forces:{gravity:0.03,drag:0.6,windInfluence:0.6,noiseKind:NoiseKind.Curl,noiseScale:0.15,noiseStrength:0.2,maxSpeed:0.5},
  visual:{size:4,sizeVariation:0.5,color:[0.85,0.9,0.95],colorVariation:0.05,opacity:0.18,glowIntensity:0,softness:1,blink:false,blinkSpeed:1,blinkSpeedVariation:0,uvAnimate:true,fadeInDuration:3,fadeOutDuration:4,cameraFadeDistance:25,rotationSpeed:0.05,stretch:0,requiresSort:true,renderShape:RenderShape.Glow,additiveBlend:false},
});

export const SmokeDefaults:ParticleConfig=baseConfig({
  kind:ParticleKind.Smoke,count:100,lifetime:7,lifetimeVariation:2,
  emitter:{shape:EmitterShape.Sphere,center:[0,0,0],radius:1.5,spawnMode:SpawnMode.Continuous,spawnRate:10},
  forces:{gravity:0.5,drag:0.35,windInfluence:0.5,noiseKind:NoiseKind.Curl,noiseScale:0.4,noiseStrength:0.5,maxSpeed:1.8},
  visual:{size:1.2,sizeVariation:0.6,color:[0.5,0.5,0.55],colorVariation:0.1,opacity:0.35,glowIntensity:0,softness:0.9,blink:false,blinkSpeed:1,blinkSpeedVariation:0,uvAnimate:true,fadeInDuration:0.3,fadeOutDuration:2,cameraFadeDistance:30,rotationSpeed:0.2,stretch:0,requiresSort:true,renderShape:RenderShape.Glow,additiveBlend:false},
});

export const AshDefaults:ParticleConfig=baseConfig({
  kind:ParticleKind.Ash,count:250,lifetime:9,lifetimeVariation:3,
  emitter:{shape:EmitterShape.Sphere,center:[0,2,0],radius:3,spawnMode:SpawnMode.Continuous,spawnRate:18},
  forces:{gravity:-0.08,drag:0.4,windInfluence:0.7,noiseKind:NoiseKind.Curl,noiseScale:0.35,noiseStrength:0.4,maxSpeed:1.4},
  visual:{size:0.05,sizeVariation:0.4,color:[0.3,0.28,0.26],colorVariation:0.15,opacity:0.6,glowIntensity:0.15,softness:0.6,blink:false,blinkSpeed:1,blinkSpeedVariation:0,uvAnimate:false,fadeInDuration:0.3,fadeOutDuration:1,cameraFadeDistance:30,rotationSpeed:0.6,stretch:0,requiresSort:false,renderShape:RenderShape.Flake,additiveBlend:false},
});

export const EmberDefaults:ParticleConfig=baseConfig({
  kind:ParticleKind.Ember,count:180,lifetime:4,lifetimeVariation:1.5,
  emitter:{shape:EmitterShape.Cylinder,center:[0,0.5,0],radius:1,height:1,spawnMode:SpawnMode.Continuous,spawnRate:30},
  forces:{gravity:0.6,drag:0.3,windInfluence:0.4,noiseKind:NoiseKind.Perlin,noiseScale:0.5,noiseStrength:0.5,maxSpeed:2.5},
  visual:{size:0.06,sizeVariation:0.4,color:[1,0.4,0.1],colorVariation:0.2,opacity:1,glowIntensity:2,softness:0.7,blink:true,blinkSpeed:6,blinkSpeedVariation:2,uvAnimate:false,fadeInDuration:0.1,fadeOutDuration:0.6,cameraFadeDistance:35,rotationSpeed:0,stretch:0.4,requiresSort:false,renderShape:RenderShape.Glow,additiveBlend:true},
});

export const MagicDefaults:ParticleConfig=baseConfig({
  kind:ParticleKind.Magic,count:150,lifetime:5,lifetimeVariation:2,
  emitter:{shape:EmitterShape.Sphere,center:[0,1,0],radius:2,spawnMode:SpawnMode.Continuous,spawnRate:20},
  forces:{gravity:-0.1,drag:0.5,windInfluence:0.1,noiseKind:NoiseKind.Curl,noiseScale:0.6,noiseStrength:0.8,maxSpeed:1.6},
  visual:{size:0.1,sizeVariation:0.5,color:[0.6,0.3,1],colorVariation:0.3,opacity:1,glowIntensity:1.8,softness:0.85,blink:true,blinkSpeed:3,blinkSpeedVariation:1,uvAnimate:false,fadeInDuration:0.4,fadeOutDuration:0.8,cameraFadeDistance:35,rotationSpeed:0,stretch:0,requiresSort:false,renderShape:RenderShape.Glow,additiveBlend:true},
});

export const RainDefaults:ParticleConfig=baseConfig({
  kind:ParticleKind.Rain,count:2000,lifetime:2,lifetimeVariation:0.3,
  emitter:{shape:EmitterShape.Box,center:[0,20,0],size:[70,1,70],spawnMode:SpawnMode.Continuous,spawnRate:400},
  forces:{gravity:-9,drag:0.05,windInfluence:0.3,noiseKind:NoiseKind.None,noiseScale:0,noiseStrength:0,maxSpeed:14},
  visual:{size:0.04,sizeVariation:0.2,color:[0.7,0.8,0.9],colorVariation:0.05,opacity:0.5,glowIntensity:0,softness:0.3,blink:false,blinkSpeed:1,blinkSpeedVariation:0,uvAnimate:false,fadeInDuration:0.05,fadeOutDuration:0.1,cameraFadeDistance:40,rotationSpeed:0,stretch:1.2,requiresSort:false,renderShape:RenderShape.Glow,additiveBlend:true},
});

export const ParticleDefaultsMap:Record<ParticleKind,ParticleConfig>={
  [ParticleKind.Firefly]:FireflyDefaults,
  [ParticleKind.Snow]:SnowDefaults,
  [ParticleKind.Leaf]:LeafDefaults,
  [ParticleKind.Dust]:DustDefaults,
  [ParticleKind.Mist]:MistDefaults,
  [ParticleKind.Smoke]:SmokeDefaults,
  [ParticleKind.Ash]:AshDefaults,
  [ParticleKind.Ember]:EmberDefaults,
  [ParticleKind.Magic]:MagicDefaults,
  [ParticleKind.Rain]:RainDefaults,
};

export function getDefaultConfig(kind:ParticleKind):ParticleConfig {
  return ParticleDefaultsMap[kind];
}

export function cloneConfig(config:ParticleConfig):ParticleConfig {
  return {
    ...config,
    emitter:{...config.emitter},
    forces:{...config.forces,attractors:config.forces.attractors?config.forces.attractors.map(a=>({...a})):undefined},
    visual:{...config.visual},
    lod:{...config.lod},
  };
}