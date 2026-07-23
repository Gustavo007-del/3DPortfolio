// components/Environment/ParticleEngine/ParticleField.tsx

"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ParticleRenderer, ParticleRendererHandle } from "./ParticleRenderer";
import { createEmitterFn, createEmitterVelocityFn } from "./ParticleEmitter";
import { ParticleConfig, ParticleFieldProps, ForceFn } from "./particleTypes";
import { createRNG, randRange, randSpread, curlNoise3, simplex3, applyDrag, clampLength, attractorForce, vortexForce, lodScaleForDistance, Vec3Out, CurlOut } from "./particleMath";
import { useWind } from "@/hooks/useWind";
import { useParticleEngineSafe } from "./ParticleEngine";

const _scratchPos:Vec3Out={x:0,y:0,z:0};
const _scratchVel:Vec3Out={x:0,y:0,z:0};
const _scratchCurl:CurlOut={x:0,y:0,z:0};
const _scratchForce:Vec3Out={x:0,y:0,z:0};
const _scratchCamPos=new THREE.Vector3();

export function ParticleField(props:ParticleFieldProps){
  const {id,config,paused=false,frozen=false}=props;
  const rendererRef=useRef<ParticleRendererHandle>(null);
  const {camera}=useThree();
  const wind=useWind();
  const engine=useParticleEngineSafe();
  const enabled=engine?engine.isFieldEnabled(id):true;

  const rng=useMemo(()=>createRNG(id),[id]);
  const emitFn=useMemo(()=>createEmitterFn(config.emitter),[config.emitter]);
  const velFn=useMemo(()=>createEmitterVelocityFn(config.emitter,config.forces.maxSpeed*0.4),[config.emitter,config.forces.maxSpeed]);
  const extraForces=useRef<ForceFn[]>([]);

  const state=useMemo(()=>{
    const n=config.count;
    return {
      positions:new Float32Array(n*3),
      velocities:new Float32Array(n*3),
      ages:new Float32Array(n),
      lifetimes:new Float32Array(n),
      alive:new Uint8Array(n),
      spawnAccumulator:0,
      activeMax:n,
    };
  },[config.count]);

  // register this field's burst control with the engine so clicks / triggers elsewhere can fire it
  useEffect(()=>{
    if(!engine) return;
    engine.registerFieldControls(id,{
      burst:(count=30)=>{ state.spawnAccumulator+=count; },
    });
    return ()=>engine.unregisterFieldControls(id);
  },[engine,id,state]);

  useEffect(()=>{
    const handle=rendererRef.current;
    if(!handle) return;
    const {aSize,aSeed,aBlinkSpeed,aBlinkOffset,aColorVariation,aType}=handle.attributes;
    for(let i=0;i<config.count;i++){
      const seed=rng();
      aSize[i]=config.visual.size*(1+randSpread(rng,config.visual.sizeVariation));
      aSeed[i]=seed;
      aBlinkSpeed[i]=config.visual.blinkSpeed*(1+randSpread(rng,config.visual.blinkSpeedVariation));
      aBlinkOffset[i]=rng();
      aColorVariation[i]=config.visual.colorVariation;
      aType[i]=0;
      state.alive[i]=0;
      state.ages[i]=0;
      state.lifetimes[i]=config.lifetime*(1+randSpread(rng,config.lifetimeVariation/Math.max(config.lifetime,0.001)));
    }
    handle.markDirty(["aSize","aSeed","aBlinkSpeed","aBlinkOffset","aColorVariation","aType"]);
  },[config,state,rng]);

  function spawnParticle(i:number){
    emitFn(rng,_scratchPos);
    velFn(rng,_scratchVel);
    state.positions[i*3]=_scratchPos.x;
    state.positions[i*3+1]=_scratchPos.y;
    state.positions[i*3+2]=_scratchPos.z;
    state.velocities[i*3]=_scratchVel.x;
    state.velocities[i*3+1]=_scratchVel.y;
    state.velocities[i*3+2]=_scratchVel.z;
    state.ages[i]=0;
    state.alive[i]=1;
    state.lifetimes[i]=config.lifetime*(1+randSpread(rng,config.lifetimeVariation/Math.max(config.lifetime,0.001)));
  }

  useFrame((_,dtRaw)=>{
    if(paused) return;
    const handle=rendererRef.current;
    if(!handle) return;
    const dt=Math.min(dtRaw,0.05);
    const {aAge,aLifetime,aOpacity,aRotation}=handle.attributes;
    const time=_.clock.elapsedTime;

    _scratchCamPos.copy(camera.position);
    const dist=_scratchCamPos.distanceTo(new THREE.Vector3(config.emitter.center[0],config.emitter.center[1],config.emitter.center[2]));
    const lodScale=lodScaleForDistance(dist,config.lod.nearDistance,config.lod.mediumDistance,config.lod.farDistance,config.lod.mediumCountScale,config.lod.farCountScale);
    const activeLimit=Math.floor(config.count*Math.max(lodScale,0.0001));

    if(!frozen){
      if(config.loop&&enabled){
        state.spawnAccumulator+=config.emitter.spawnRate*dt;
        let toSpawn=Math.floor(state.spawnAccumulator);
        state.spawnAccumulator-=toSpawn;
        for(let i=0;i<config.count&&toSpawn>0;i++){
          if(i>=activeLimit) break;
          if(state.alive[i]===0){ spawnParticle(i); toSpawn--; }
        }
      }

      const windVec=wind.vector;
      for(let i=0;i<config.count;i++){
        if(state.alive[i]===0) continue;
        if(i>=activeLimit){ state.alive[i]=0; aAge[i]=0; continue; }
        const px=state.positions[i*3],py=state.positions[i*3+1],pz=state.positions[i*3+2];
        let vx=state.velocities[i*3],vy=state.velocities[i*3+1],vz=state.velocities[i*3+2];

        vy+=config.forces.gravity*dt;

        if(config.forces.noiseStrength>0){
          curlNoise3(px*config.forces.noiseScale,py*config.forces.noiseScale,pz*config.forces.noiseScale,time*0.15,_scratchCurl);
          vx+=_scratchCurl.x*config.forces.noiseStrength*dt;
          vy+=_scratchCurl.y*config.forces.noiseStrength*dt;
          vz+=_scratchCurl.z*config.forces.noiseStrength*dt;
        }

        if(config.forces.windInfluence>0){
          vx+=windVec[0]*config.forces.windInfluence*dt;
          vz+=windVec[1]*config.forces.windInfluence*dt;
        }

        for(let f=0;f<extraForces.current.length;f++){
          extraForces.current[f](i,px,py,pz,vx,vy,vz,dt,_scratchForce);
          vx+=_scratchForce.x*dt;vy+=_scratchForce.y*dt;vz+=_scratchForce.z*dt;
        }

        applyDrag(vx,vy,vz,config.forces.drag,dt,_scratchVel);
        vx=_scratchVel.x;vy=_scratchVel.y;vz=_scratchVel.z;
        clampLength(vx,vy,vz,config.forces.maxSpeed,_scratchVel);
        vx=_scratchVel.x;vy=_scratchVel.y;vz=_scratchVel.z;

        state.velocities[i*3]=vx;state.velocities[i*3+1]=vy;state.velocities[i*3+2]=vz;
        state.positions[i*3]=px+vx*dt;
        state.positions[i*3+1]=py+vy*dt;
        state.positions[i*3+2]=pz+vz*dt;

        state.ages[i]+=dt;
        aAge[i]=state.ages[i];
        aLifetime[i]=state.lifetimes[i];
        aOpacity[i]=state.alive[i];
        aRotation[i]+=config.visual.rotationSpeed*dt;

        if(state.ages[i]>=state.lifetimes[i]){
          state.alive[i]=0;
        }
      }
    }

    handle.setInstancePositions(state.positions,state.velocities);
    handle.markDirty(["aAge","aLifetime","aOpacity","aRotation"]);
    handle.material.setWind(config.forces.windInfluence>0?Math.hypot(wind.vector[0],wind.vector[1]):0,wind.vector[0],wind.vector[1]);
    handle.material.setCameraFadeDistance(config.visual.cameraFadeDistance);
  });

  const boundsRadius=useMemo(()=>{
    if(config.emitter.radius) return config.emitter.radius+config.forces.maxSpeed*config.lifetime;
    if(config.emitter.size) return Math.max(...config.emitter.size)+config.forces.maxSpeed*config.lifetime;
    return 20;
  },[config]);

  return (
    <ParticleRenderer
      ref={rendererRef}
      count={config.count}
      visible={enabled}
      boundsCenter={config.emitter.center}
      boundsRadius={boundsRadius}
      requiresSort={config.visual.requiresSort}
      materialOptions={{
        color:new THREE.Color(...config.visual.color),
        glowIntensity:config.visual.glowIntensity,
        softness:config.visual.softness,
        opacity:config.visual.opacity,
        uvAnimate:config.visual.uvAnimate,
        cameraFadeDistance:config.visual.cameraFadeDistance,
        fadeIn:config.visual.fadeInDuration,
        fadeOut:config.visual.fadeOutDuration,
        blinkEnabled:config.visual.blink,
        stretch:config.visual.stretch,
        additiveBlend:config.visual.additiveBlend,
        renderShape:config.visual.renderShape,
      }}
    />
  );
}