// components/Environment/ParticleEngine/ParticleEmitter.tsx

import * as THREE from "three";
import { EmitterConfig, EmitterShape } from "./particleTypes";
import { RNG, sphereRandomPoint, boxRandomPoint, cylinderRandomPoint, lineRandomPoint, splineRandomPoint, Vec3Out } from "./particleMath";

export type EmitFn=(rng:RNG,out:Vec3Out)=>Vec3Out;

export function createEmitterFn(config:EmitterConfig):EmitFn {
  const [cx,cy,cz]=config.center;
  switch(config.shape){
    case EmitterShape.Sphere:{
      const radius=config.radius??5;
      return (rng,out)=>{
        sphereRandomPoint(rng,radius,out);
        out.x+=cx;out.y+=cy;out.z+=cz;
        return out;
      };
    }
    case EmitterShape.Box:{
      const [sx,sy,sz]=config.size??[10,10,10];
      return (rng,out)=>{
        boxRandomPoint(rng,sx,sy,sz,out);
        out.x+=cx;out.y+=cy;out.z+=cz;
        return out;
      };
    }
    case EmitterShape.Cylinder:{
      const radius=config.radius??5;
      const height=config.height??5;
      return (rng,out)=>{
        cylinderRandomPoint(rng,radius,height,out);
        out.x+=cx;out.y+=cy;out.z+=cz;
        return out;
      };
    }
    case EmitterShape.Line:{
      const points=config.points??[[cx,cy,cz],[cx,cy,cz]];
      const [a,b]=points;
      return (rng,out)=>lineRandomPoint(rng,a[0],a[1],a[2],b[0],b[1],b[2],out);
    }
    case EmitterShape.Spline:{
      const points=config.points??[[cx,cy,cz]];
      return (rng,out)=>splineRandomPoint(rng,points,out);
    }
    case EmitterShape.MeshSurface:{
      const sampler=config.surface?createMeshSurfaceSampler(config.surface):null;
      return (rng,out)=>{
        if(sampler){ sampler(rng,out); return out; }
        out.x=cx;out.y=cy;out.z=cz;
        return out;
      };
    }
    default:{
      return (_rng,out)=>{ out.x=cx;out.y=cy;out.z=cz; return out; };
    }
  }
}

function createMeshSurfaceSampler(geometry:THREE.BufferGeometry):(rng:RNG,out:Vec3Out)=>void {
  const posAttr=geometry.getAttribute("position") as THREE.BufferAttribute;
  const index=geometry.getIndex();
  const triCount=index?index.count/3:posAttr.count/3;
  const va=new THREE.Vector3(),vb=new THREE.Vector3(),vc=new THREE.Vector3();
  return (rng,out)=>{
    const tri=Math.floor(rng()*triCount);
    let ia:number,ib:number,ic:number;
    if(index){ ia=index.getX(tri*3);ib=index.getX(tri*3+1);ic=index.getX(tri*3+2); }
    else{ ia=tri*3;ib=tri*3+1;ic=tri*3+2; }
    va.fromBufferAttribute(posAttr,ia);
    vb.fromBufferAttribute(posAttr,ib);
    vc.fromBufferAttribute(posAttr,ic);
    let u=rng(),v=rng();
    if(u+v>1){ u=1-u;v=1-v; }
    out.x=va.x+(vb.x-va.x)*u+(vc.x-va.x)*v;
    out.y=va.y+(vb.y-va.y)*u+(vc.y-va.y)*v;
    out.z=va.z+(vb.z-va.z)*u+(vc.z-va.z)*v;
  };
}

export function createEmitterVelocityFn(config:EmitterConfig,baseSpeed:number):EmitFn {
  const [cx,cy,cz]=config.center;
  if(config.shape===EmitterShape.Sphere){
    return (rng,out)=>{
      const dx=out.x-cx,dy=out.y-cy,dz=out.z-cz;
      const len=Math.sqrt(dx*dx+dy*dy+dz*dz)||1;
      out.x=(dx/len)*baseSpeed;out.y=(dy/len)*baseSpeed;out.z=(dz/len)*baseSpeed;
      return out;
    };
  }
  return (rng,out)=>{
    out.x=(rng()-0.5)*baseSpeed;out.y=rng()*baseSpeed;out.z=(rng()-0.5)*baseSpeed;
    return out;
  };
}