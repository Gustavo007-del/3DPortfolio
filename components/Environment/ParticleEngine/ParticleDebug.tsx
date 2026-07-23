// components/Environment/ParticleEngine/ParticleDebug.tsx

"use client";

import * as THREE from "three";
import { useMemo, useRef, useState, useEffect } from "react";
import { Html, TransformControls  } from "@react-three/drei";
import { useParticleEngine } from "./ParticleEngine";
import { ControllerFieldEntry, EmitterShape } from "./particleTypes";
import { useControls } from "leva";
import { useThree } from "@react-three/fiber";

function EmitterOutline({entry}:{entry:ControllerFieldEntry}){
  const {emitter}=entry.config;
  const [cx,cy,cz]=emitter.center;
  if(emitter.shape===EmitterShape.Sphere){
    return (
      <mesh position={[cx,cy,cz]}>
        <sphereGeometry args={[emitter.radius??5,12,8]} />
        <meshBasicMaterial color="#39ff88" wireframe transparent opacity={0.35} />
      </mesh>
    );
  }
  if(emitter.shape===EmitterShape.Box){
    const [sx,sy,sz]=emitter.size??[10,10,10];
    return (
      <mesh position={[cx,cy,cz]}>
        <boxGeometry args={[sx,sy,sz]} />
        <meshBasicMaterial color="#39ff88" wireframe transparent opacity={0.35} />
      </mesh>
    );
  }
  if(emitter.shape===EmitterShape.Cylinder){
    return (
      <mesh position={[cx,cy,cz]}>
        <cylinderGeometry args={[emitter.radius??5,emitter.radius??5,emitter.height??5,10]} />
        <meshBasicMaterial color="#39ff88" wireframe transparent opacity={0.35} />
      </mesh>
    );
  }
  return null;
}

function BoundsOutline({entry}:{entry:ControllerFieldEntry}){
  const {emitter,forces,lifetime}=entry.config;
  const radius=useMemo(()=>{
    if(emitter.radius) return emitter.radius+forces.maxSpeed*lifetime;
    if(emitter.size) return Math.max(...emitter.size)+forces.maxSpeed*lifetime;
    return 20;
  },[emitter,forces,lifetime]);
  return (
    <mesh position={emitter.center}>
      <sphereGeometry args={[radius,10,6]} />
      <meshBasicMaterial color="#ffaa33" wireframe transparent opacity={0.15} />
    </mesh>
  );
}

function LODRings({entry}:{entry:ControllerFieldEntry}){
  const {lod,emitter}=entry.config;
  const rings:[number,string][]=[[lod.nearDistance,"#4dd2ff"],[lod.mediumDistance,"#ffd24d"],[lod.farDistance,"#ff4d4d"]];
  return (
    <group position={emitter.center}>
      {rings.map(([dist,color])=>(
        <mesh key={dist} rotation={[Math.PI/2,0,0]}>
          <ringGeometry args={[dist-0.1,dist,32]} />
          <meshBasicMaterial color={color} transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function FieldLabel({entry}:{entry:ControllerFieldEntry}){
  const {emitter}=entry.config;
  return (
    <Html position={emitter.center} center distanceFactor={15}>
      <div style={{color:"#9dffb0",fontSize:"10px",fontFamily:"monospace",background:"rgba(0,0,0,0.5)",padding:"2px 5px",borderRadius:"3px",whiteSpace:"nowrap"}}>
        {entry.label} · {entry.config.count}
      </div>
    </Html>
  );
}
function PositionGizmo({entry}:{entry:ControllerFieldEntry}){
  const meshRef=useRef<THREE.Mesh>(null);
  const controlsRef=useRef<any>(null);
  const {controls}=useThree() as any;

  useEffect(()=>{
    const [cx,cy,cz]=entry.config.emitter.center;
    meshRef.current?.position.set(cx,cy,cz);
  },[entry]);

  const worldPosRef = useRef(new THREE.Vector3());

const logPosition = () => {
  const mesh = meshRef.current;
  if (!mesh) return;
  mesh.updateWorldMatrix(true, false);
  const p = mesh.getWorldPosition(worldPosRef.current);
  console.log(`${entry.label} center: [${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}]`);
};

  return (
    <TransformControls
      ref={controlsRef}
      mode="translate"
      onMouseDown={()=>{ if(controls) controls.enabled=false; }}
      onMouseUp={()=>{ if(controls) controls.enabled=true; logPosition(); }}
      onObjectChange={logPosition}
    >
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.6,0]} />
        <meshBasicMaterial color="#ff3b9a" wireframe />
      </mesh>
    </TransformControls>
  );
}

function PositionGizmoPanel({fields}:{fields:ControllerFieldEntry[]}){
  const options=useMemo(()=>{
    const map:Record<string,string>={None:""};
    fields.forEach(f=>{ map[f.label]=f.id; });
    return map;
  },[fields]);

  const {activeField}=useControls("Particles.PositionGizmo",{
    activeField:{value:"",options},
  });

  const entry=fields.find(f=>f.id===activeField);
  if(!entry) return null;
  return <PositionGizmo key={entry.id} entry={entry} />;
}

export interface ParticleDebugProps {
  fields:ControllerFieldEntry[];
}

export function ParticleDebug({fields}:ParticleDebugProps){
  const engine=useParticleEngine();
  const {debug}=engine;

  const anyDebugOn=debug.showEmitters||debug.showBounds||debug.showLOD||debug.showIds||debug.showGPUStats;

  return (
    <group>
      {anyDebugOn&&fields.map(entry=>(
        <group key={entry.id}>
          {debug.showEmitters&&<EmitterOutline entry={entry} />}
          {debug.showBounds&&<BoundsOutline entry={entry} />}
          {debug.showLOD&&<LODRings entry={entry} />}
          {debug.showIds&&<FieldLabel entry={entry} />}
        </group>
      ))}
      {debug.showGPUStats&&<GPUStatsOverlay fields={fields} />}
      <PositionGizmoPanel fields={fields} />
    </group>
  );
}


function GPUStatsOverlay({fields}:{fields:ControllerFieldEntry[]}){
  const total=useMemo(()=>fields.reduce((sum,f)=>sum+f.config.count,0),[fields]);
  return (
    <Html position={[0,0,0]} calculatePosition={()=>[12,12]} style={{pointerEvents:"none"}}>
      <div style={{position:"fixed",top:8,left:8,color:"#9dffb0",fontSize:"11px",fontFamily:"monospace",background:"rgba(0,0,0,0.6)",padding:"6px 10px",borderRadius:"4px"}}>
        <div>Particle Fields: {fields.length}</div>
        <div>Total Instances: {total}</div>
        <div>Draw Calls: {fields.length} (1 InstancedMesh/field)</div>
      </div>
    </Html>
  );
}