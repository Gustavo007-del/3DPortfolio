// components/Environment/ParticleEngine/ParticleController.tsx

"use client";

import { useMemo } from "react";
import { useControls, folder } from "leva";
import { ParticleField } from "./ParticleField";
import { ParticleEngine, useParticleEngine } from "./ParticleEngine";
import { ParticleDebug } from "./ParticleDebug";
import { getDefaultConfig, cloneConfig } from "./particleDefaults";
import { ParticleKind, ControllerFieldEntry, ParticleConfig } from "./particleTypes";

function useLevaOverrides(entry:ControllerFieldEntry):ParticleConfig {
  const c=entry.config;
  const values=useControls(`Particles.${entry.label}`,{
    count:{value:c.count,min:0,max:10000,step:10},
    spawnRate:{value:c.emitter.spawnRate,min:0,max:200,step:1},
    lifetime:{value:c.lifetime,min:0.5,max:30,step:0.5},
    gravity:{value:c.forces.gravity,min:-2,max:2,step:0.01},
    drag:{value:c.forces.drag,min:0,max:2,step:0.01},
    windInfluence:{value:c.forces.windInfluence,min:0,max:2,step:0.01},
    noiseScale:{value:c.forces.noiseScale,min:0,max:2,step:0.01},
    noiseStrength:{value:c.forces.noiseStrength,min:0,max:2,step:0.01},
    maxSpeed:{value:c.forces.maxSpeed,min:0,max:10,step:0.1},
    size:{value:c.visual.size,min:0.01,max:6,step:0.01},
    opacity:{value:c.visual.opacity,min:0,max:1,step:0.01},
    glowIntensity:{value:c.visual.glowIntensity,min:0,max:3,step:0.01},
    color:{value:{r:c.visual.color[0]*255,g:c.visual.color[1]*255,b:c.visual.color[2]*255}},
    radius:{value:c.emitter.radius??10,min:0.5,max:80,step:0.5},
    fadeDistance:{value:c.visual.cameraFadeDistance,min:5,max:100,step:1},
    lodNear:{value:c.lod.nearDistance,min:1,max:60,step:1},
    lodFar:{value:c.lod.farDistance,min:5,max:120,step:1},
  },{collapsed:true});

  return useMemo<ParticleConfig>(()=>{
    const next=cloneConfig(c);
    next.count=values.count;
    next.lifetime=values.lifetime;
    next.emitter.spawnRate=values.spawnRate;
    next.emitter.radius=values.radius;
    next.forces.gravity=values.gravity;
    next.forces.drag=values.drag;
    next.forces.windInfluence=values.windInfluence;
    next.forces.noiseScale=values.noiseScale;
    next.forces.noiseStrength=values.noiseStrength;
    next.forces.maxSpeed=values.maxSpeed;
    next.visual.size=values.size;
    next.visual.opacity=values.opacity;
    next.visual.glowIntensity=values.glowIntensity;
    next.visual.color=[values.color.r/255,values.color.g/255,values.color.b/255];
    next.visual.cameraFadeDistance=values.fadeDistance;
    next.lod.nearDistance=values.lodNear;
    next.lod.farDistance=values.lodFar;
    return next;
  },[values,c]);
}

function ControlledField({entry}:{entry:ControllerFieldEntry}){
  const engine=useParticleEngine();
  const config=useLevaOverrides(entry);
   useControls(`Particles.${entry.label}`,{
    enabled:{value:engine.isFieldEnabled(entry.id),onChange:(v)=>engine.setFieldEnabled(entry.id,v)},
  },{collapsed:true},[entry.id]);
  return (
    <ParticleField
      id={entry.id}
      config={config}
      paused={engine.debug.pauseSimulation}
      frozen={engine.debug.freezeParticles}
    />
  );
}

function EngineDebugControls(){
  const engine=useParticleEngine();
  useControls("Particles.General",{
    pauseSimulation:{value:engine.debug.pauseSimulation,onChange:(v)=>engine.setDebug({pauseSimulation:v})},
    freezeParticles:{value:engine.debug.freezeParticles,onChange:(v)=>engine.setDebug({freezeParticles:v})},
    showEmitters:{value:engine.debug.showEmitters,onChange:(v)=>engine.setDebug({showEmitters:v})},
    showBounds:{value:engine.debug.showBounds,onChange:(v)=>engine.setDebug({showBounds:v})},
    showVelocity:{value:engine.debug.showVelocity,onChange:(v)=>engine.setDebug({showVelocity:v})},
    showIds:{value:engine.debug.showIds,onChange:(v)=>engine.setDebug({showIds:v})},
    showLOD:{value:engine.debug.showLOD,onChange:(v)=>engine.setDebug({showLOD:v})},
    showGPUStats:{value:engine.debug.showGPUStats,onChange:(v)=>engine.setDebug({showGPUStats:v})},
  },{collapsed:true});
  return null;
}

function buildIslandFields():ControllerFieldEntry[] {
  const forestFireflies=cloneConfig(getDefaultConfig(ParticleKind.Firefly));
  forestFireflies.emitter.center=[-14.11, 9.25, 27.84];
  forestFireflies.emitter.radius=12;

  const dockFireflies=cloneConfig(getDefaultConfig(ParticleKind.Firefly));
  dockFireflies.count=120;
  dockFireflies.emitter.center=[10,2,-6];
  dockFireflies.emitter.radius=6;

  const castleEmbers=cloneConfig(getDefaultConfig(ParticleKind.Ember));
  castleEmbers.emitter.center=[0,1,0];

  const bridgeLeaves=cloneConfig(getDefaultConfig(ParticleKind.Leaf));
  bridgeLeaves.emitter.center=[2,8,4];
  bridgeLeaves.emitter.size=[10,3,4];

  const mountainMist=cloneConfig(getDefaultConfig(ParticleKind.Mist));
  mountainMist.emitter.center=[-18,6,-10];
  mountainMist.emitter.size=[30,2,30];

  const seaMist=cloneConfig(getDefaultConfig(ParticleKind.Mist));
  seaMist.count=90;
  seaMist.emitter.center=[20,0.5,0];
  seaMist.emitter.size=[40,1,60];

  const snowArea=cloneConfig(getDefaultConfig(ParticleKind.Snow));
  snowArea.count=0;
  snowArea.emitter.center=[0,15,0];

  return [
    {id:"forest-fireflies",label:"Forest Fireflies",kind:ParticleKind.Firefly,config:forestFireflies},
    {id:"dock-fireflies",label:"Dock Fireflies",kind:ParticleKind.Firefly,config:dockFireflies},
    {id:"castle-embers",label:"Castle Embers",kind:ParticleKind.Ember,config:castleEmbers},
    {id:"bridge-leaves",label:"Bridge Leaves",kind:ParticleKind.Leaf,config:bridgeLeaves},
    {id:"mountain-mist",label:"Mountain Mist",kind:ParticleKind.Mist,config:mountainMist},
    {id:"sea-mist",label:"Sea Mist",kind:ParticleKind.Mist,config:seaMist},
    {id:"snow-area",label:"Snow Area",kind:ParticleKind.Snow,config:snowArea},
  ];
}

export interface ParticleControllerProps {
  fields?:ControllerFieldEntry[];
  debugEnabled?:boolean;
}

export function ParticleControllerInner({fields,debugEnabled=false}:ParticleControllerProps){
  const resolvedFields=useMemo(()=>fields??buildIslandFields(),[fields]);
  return (
    <>
      <EngineDebugControls />
      {resolvedFields.map(entry=>(<ControlledField key={entry.id} entry={entry} />))}
      {debugEnabled&&<ParticleDebug fields={resolvedFields} />}
    </>
  );
}

export function ParticleController(props:ParticleControllerProps){
  return (
    <ParticleEngine>
      <ParticleControllerInner {...props} />
    </ParticleEngine>
  );
}