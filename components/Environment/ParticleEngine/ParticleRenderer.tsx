// components/Environment/ParticleEngine/ParticleRenderer.tsx

"use client";

import * as THREE from "three";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { getSharedQuadGeometry, ParticleMaterial, ParticleMaterialOptions } from "./ParticleMaterial";
import { ParticleAttributeSchema } from "./particleTypes";

export interface ParticleRendererProps {
  count:number;
  materialOptions:ParticleMaterialOptions;
  boundsCenter:[number,number,number];
  boundsRadius:number;
  requiresSort?:boolean;
  visible?:boolean;
}

export interface ParticleRendererHandle {
  attributes:ParticleAttributeSchema;
  markDirty:(names:(keyof ParticleAttributeSchema)[])=>void;
  material:ParticleMaterial;
  getMesh:()=>THREE.Mesh|null;
  setInstancePositions:(positions:Float32Array,velocities:Float32Array)=>void;
}

const ATTR_ITEM_SIZE:Record<keyof ParticleAttributeSchema,number>={
  aSize:1,aSeed:1,aAge:1,aLifetime:1,aVelocity:3,aBlinkSpeed:1,aBlinkOffset:1,
  aRotation:1,aOpacity:1,aColorVariation:1,aType:1,
};

function allocateAttributes(count:number):ParticleAttributeSchema {
  return {
    aSize:new Float32Array(count),
    aSeed:new Float32Array(count),
    aAge:new Float32Array(count),
    aLifetime:new Float32Array(count),
    aVelocity:new Float32Array(count*3),
    aBlinkSpeed:new Float32Array(count),
    aBlinkOffset:new Float32Array(count),
    aRotation:new Float32Array(count),
    aOpacity:new Float32Array(count),
    aColorVariation:new Float32Array(count),
    aType:new Float32Array(count),
  };
}

export const ParticleRenderer=forwardRef<ParticleRendererHandle,ParticleRendererProps>(function ParticleRenderer(props,ref){
  const {count,materialOptions,boundsCenter,boundsRadius,visible=true}=props;
  const meshRef=useRef<THREE.Mesh>(null);
  const positionsRef=useRef<Float32Array>(new Float32Array(count*3));

  const geometry=useMemo(()=>{
    const base=getSharedQuadGeometry();
    const geo=new THREE.InstancedBufferGeometry();
    geo.index=base.index;
    geo.attributes.position=base.attributes.position;
    geo.attributes.uv=base.attributes.uv;
    geo.instanceCount=count;
    geo.boundingSphere=new THREE.Sphere(new THREE.Vector3(...boundsCenter),boundsRadius);
    return geo;
  },[count,boundsCenter,boundsRadius]);

  const attributes=useMemo(()=>allocateAttributes(count),[count]);

  useMemo(()=>{
    (Object.keys(attributes) as (keyof ParticleAttributeSchema)[]).forEach(key=>{
      const arr=attributes[key];
      const itemSize=ATTR_ITEM_SIZE[key];
      geometry.setAttribute(key,new THREE.InstancedBufferAttribute(arr,itemSize));
    });
    geometry.setAttribute("aInstancePosition",new THREE.InstancedBufferAttribute(positionsRef.current,3));
  },[geometry,attributes]);

  // blending is decided entirely by ParticleMaterial from materialOptions.additiveBlend — no override here
  const material=useMemo(()=>new ParticleMaterial(materialOptions),[materialOptions]);

  const markDirty=(names:(keyof ParticleAttributeSchema)[])=>{
    names.forEach(name=>{
      const attr=geometry.getAttribute(name) as THREE.InstancedBufferAttribute|undefined;
      if(attr) attr.needsUpdate=true;
    });
  };

  useImperativeHandle(ref,()=>({
    attributes,
    markDirty,
    material,
    getMesh:()=>meshRef.current,
    setInstancePositions:(positions:Float32Array,velocities:Float32Array)=>{
      positionsRef.current.set(positions);
      const posAttr=geometry.getAttribute("aInstancePosition") as THREE.InstancedBufferAttribute;
      posAttr.needsUpdate=true;
      const velAttr=geometry.getAttribute("aVelocity") as THREE.InstancedBufferAttribute;
      velAttr.array.set(velocities);
      velAttr.needsUpdate=true;
    },
  }),[attributes,geometry,material]);

  useFrame((state)=>{
    material.setTime(state.clock.elapsedTime);
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} visible={visible} frustumCulled={false} />
  );
});