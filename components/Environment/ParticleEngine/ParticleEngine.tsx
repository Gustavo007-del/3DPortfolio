// components/Environment/ParticleEngine/ParticleEngine.tsx

"use client";

import { createContext, useContext, useMemo, useRef, useState, ReactNode } from "react";
import { DebugFlags } from "./particleTypes";

export interface FieldControls { burst:(count?:number)=>void; }

export interface ParticleEngineContextValue {
  debug:DebugFlags;
  setDebug:(patch:Partial<DebugFlags>)=>void;
  globalWindMultiplier:number;
  setGlobalWindMultiplier:(v:number)=>void;
  fieldEnabled:Record<string,boolean>;
  setFieldEnabled:(id:string,enabled:boolean)=>void;
  isFieldEnabled:(id:string)=>boolean;
  registerFieldControls:(id:string,controls:FieldControls)=>void;
  unregisterFieldControls:(id:string)=>void;
  triggerBurst:(id:string,count?:number)=>void;
}

const defaultDebug:DebugFlags={
  showEmitters:false,showBounds:false,showVelocity:false,showIds:false,
  showLOD:false,showGPUStats:false,pauseSimulation:false,freezeParticles:false,
};

const ParticleEngineContext=createContext<ParticleEngineContextValue|null>(null);

export function useParticleEngine():ParticleEngineContextValue {
  const ctx=useContext(ParticleEngineContext);
  if(!ctx) throw new Error("useParticleEngine must be used within <ParticleEngine>");
  return ctx;
}

export function useParticleEngineSafe():ParticleEngineContextValue|null {
  return useContext(ParticleEngineContext);
}

export interface ParticleEngineProps { children:ReactNode; initialDebug?:Partial<DebugFlags>; }

export function ParticleEngine({children,initialDebug}:ParticleEngineProps){
  const [debug,setDebugState]=useState<DebugFlags>({...defaultDebug,...initialDebug});
  const [globalWindMultiplier,setGlobalWindMultiplier]=useState(1);
  const [fieldEnabled,setFieldEnabledState]=useState<Record<string,boolean>>({});
  const fieldControlsRef=useRef<Map<string,FieldControls>>(new Map());

  const setDebug=(patch:Partial<DebugFlags>)=>setDebugState(prev=>({...prev,...patch}));
  const setFieldEnabled=(id:string,enabled:boolean)=>setFieldEnabledState(prev=>({...prev,[id]:enabled}));
  const isFieldEnabled=(id:string)=>fieldEnabled[id]??true;
  const registerFieldControls=(id:string,controls:FieldControls)=>{ fieldControlsRef.current.set(id,controls); };
  const unregisterFieldControls=(id:string)=>{ fieldControlsRef.current.delete(id); };
  const triggerBurst=(id:string,count=30)=>{ fieldControlsRef.current.get(id)?.burst(count); };

  const value=useMemo<ParticleEngineContextValue>(()=>({
    debug,setDebug,globalWindMultiplier,setGlobalWindMultiplier,
    fieldEnabled,setFieldEnabled,isFieldEnabled,
    registerFieldControls,unregisterFieldControls,triggerBurst,
  }),[debug,globalWindMultiplier,fieldEnabled]);

  return <ParticleEngineContext.Provider value={value}>{children}</ParticleEngineContext.Provider>;
}