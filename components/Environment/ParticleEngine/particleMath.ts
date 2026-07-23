// components/Environment/ParticleEngine/particleMath.ts

import { createNoise3D, createNoise4D } from "simplex-noise";
import seedrandom from "seedrandom";

export type RNG=()=>number;

export function createRNG(seed:string|number):RNG {
  const r=seedrandom(String(seed));
  return ()=>r();
}

export function randRange(rng:RNG,min:number,max:number):number { return min+(max-min)*rng(); }
export function randSpread(rng:RNG,spread:number):number { return (rng()-0.5)*2*spread; }
export function randSign(rng:RNG):number { return rng()<0.5?-1:1; }

const _n3=createNoise3D();
const _n4=createNoise4D();

export function simplex3(x:number,y:number,z:number):number { return _n3(x,y,z); }
export function simplex4(x:number,y:number,z:number,w:number):number { return _n4(x,y,z,w); }

const CURL_EPS=0.0009;
const CURL_INV=1/(2*CURL_EPS);

export interface CurlOut { x:number; y:number; z:number }

export function curlNoise3(x:number,y:number,z:number,t:number,out:CurlOut):CurlOut {
  const e=CURL_EPS;
  const n1=_n4(x,y+e,z,t),n2=_n4(x,y-e,z,t);
  const n3=_n4(x,y,z+e,t),n4=_n4(x,y,z-e,t);
  const n5=_n4(x+e,y,z,t),n6=_n4(x-e,y,z,t);
  const n7=_n4(x,y,z+e,t),n8=_n4(x,y,z-e,t);
  const n9=_n4(x+e,y,z,t),n10=_n4(x-e,y,z,t);
  const n11=_n4(x,y+e,z,t),n12=_n4(x,y-e,z,t);
  out.x=((n1-n2)-(n3-n4))*CURL_INV;
  out.y=((n5-n6)-(n7-n8))*CURL_INV;
  out.z=((n9-n10)-(n11-n12))*CURL_INV;
  return out;
}

export function smoothstep(edge0:number,edge1:number,x:number):number {
  const t=clamp01((x-edge0)/(edge1-edge0));
  return t*t*(3-2*t);
}

export function clamp01(v:number):number { return v<0?0:v>1?1:v; }
export function clamp(v:number,min:number,max:number):number { return v<min?min:v>max?max:v; }
export function lerp(a:number,b:number,t:number):number { return a+(b-a)*t; }
export function mix(a:number,b:number,t:number):number { return a+(b-a)*t; }

export function fadeCurve(age:number,lifetime:number,fadeIn:number,fadeOut:number):number {
  if(lifetime<=0) return 0;
  const inT=fadeIn>0?smoothstep(0,fadeIn,age):1;
  const outStart=lifetime-fadeOut;
  const outT=fadeOut>0?1-smoothstep(outStart,lifetime,age):1;
  return clamp01(Math.min(inT,outT));
}

export function wrapAngle(a:number):number {
  const twoPi=Math.PI*2;
  let r=a%twoPi;
  if(r<0) r+=twoPi;
  return r;
}

export function vecLenSq(x:number,y:number,z:number):number { return x*x+y*y+z*z; }
export function vecLen(x:number,y:number,z:number):number { return Math.sqrt(x*x+y*y+z*z); }

export interface Vec3Out { x:number; y:number; z:number }

export function clampLength(x:number,y:number,z:number,maxLen:number,out:Vec3Out):Vec3Out {
  const lenSq=vecLenSq(x,y,z);
  const maxSq=maxLen*maxLen;
  if(lenSq<=maxSq||lenSq===0){ out.x=x;out.y=y;out.z=z;return out; }
  const scale=maxLen/Math.sqrt(lenSq);
  out.x=x*scale;out.y=y*scale;out.z=z*scale;
  return out;
}

export function applyDrag(vx:number,vy:number,vz:number,drag:number,dt:number,out:Vec3Out):Vec3Out {
  const f=Math.max(0,1-drag*dt);
  out.x=vx*f;out.y=vy*f;out.z=vz*f;
  return out;
}

export function attractorForce(px:number,py:number,pz:number,ax:number,ay:number,az:number,strength:number,radius:number,repel:boolean,out:Vec3Out):Vec3Out {
  const dx=ax-px,dy=ay-py,dz=az-pz;
  const distSq=vecLenSq(dx,dy,dz);
  const dist=Math.sqrt(distSq)||0.0001;
  if(dist>radius){ out.x=0;out.y=0;out.z=0;return out; }
  const falloff=1-dist/radius;
  const mag=strength*falloff*(repel?-1:1);
  const inv=1/dist;
  out.x=dx*inv*mag;out.y=dy*inv*mag;out.z=dz*inv*mag;
  return out;
}

export function vortexForce(px:number,py:number,pz:number,cx:number,cy:number,cz:number,strength:number,out:Vec3Out):Vec3Out {
  const dx=px-cx,dz=pz-cz;
  out.x=-dz*strength;out.y=0;out.z=dx*strength;
  return out;
}

export function sphereRandomPoint(rng:RNG,radius:number,out:Vec3Out):Vec3Out {
  const u=rng(),v=rng();
  const theta=2*Math.PI*u;
  const phi=Math.acos(2*v-1);
  const r=radius*Math.cbrt(rng());
  out.x=r*Math.sin(phi)*Math.cos(theta);
  out.y=r*Math.sin(phi)*Math.sin(theta);
  out.z=r*Math.cos(phi);
  return out;
}

export function boxRandomPoint(rng:RNG,sx:number,sy:number,sz:number,out:Vec3Out):Vec3Out {
  out.x=randSpread(rng,sx*0.5);
  out.y=randSpread(rng,sy*0.5);
  out.z=randSpread(rng,sz*0.5);
  return out;
}

export function cylinderRandomPoint(rng:RNG,radius:number,height:number,out:Vec3Out):Vec3Out {
  const angle=rng()*Math.PI*2;
  const r=radius*Math.sqrt(rng());
  out.x=Math.cos(angle)*r;
  out.z=Math.sin(angle)*r;
  out.y=randSpread(rng,height*0.5);
  return out;
}

export function lineRandomPoint(rng:RNG,ax:number,ay:number,az:number,bx:number,by:number,bz:number,out:Vec3Out):Vec3Out {
  const t=rng();
  out.x=lerp(ax,bx,t);out.y=lerp(ay,by,t);out.z=lerp(az,bz,t);
  return out;
}

export function splineRandomPoint(rng:RNG,points:[number,number,number][],out:Vec3Out):Vec3Out {
  if(points.length===0){ out.x=0;out.y=0;out.z=0;return out; }
  if(points.length===1){ const p=points[0];out.x=p[0];out.y=p[1];out.z=p[2];return out; }
  const segCount=points.length-1;
  const segT=rng()*segCount;
  const idx=Math.min(Math.floor(segT),segCount-1);
  const localT=segT-idx;
  const a=points[idx],b=points[idx+1];
  out.x=lerp(a[0],b[0],localT);out.y=lerp(a[1],b[1],localT);out.z=lerp(a[2],b[2],localT);
  return out;
}

export function lodScaleForDistance(distance:number,nearDist:number,medDist:number,farDist:number,medScale:number,farScale:number):number {
  if(distance<=nearDist) return 1;
  if(distance<=medDist) return lerp(1,medScale,smoothstep(nearDist,medDist,distance));
  if(distance<=farDist) return lerp(medScale,farScale,smoothstep(medDist,farDist,distance));
  return 0;
}