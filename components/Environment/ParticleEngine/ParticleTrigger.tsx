// components/Environment/ParticleEngine/ParticleTrigger.tsx
"use client";
import { ReactNode } from "react";
import { useParticleEngine } from "./ParticleEngine";

export function ParticleTrigger({fieldId,burstCount=40,children}:{fieldId:string;burstCount?:number;children:ReactNode}){
  const engine=useParticleEngine();
  return (
    <group onClick={(e)=>{
      e.stopPropagation();
      engine.setFieldEnabled(fieldId,true);
      engine.triggerBurst(fieldId,burstCount);
    }}>
      {children}
    </group>
  );
}