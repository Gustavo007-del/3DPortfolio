// components/Environment/Birds/BirdDebug.tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import { BufferGeometry, BufferAttribute, LineSegments, Vector3 } from 'three';
import BirdController from './BirdController';
import { BirdFieldHandle } from './BirdField';
import { FlockingWeights, BirdRuntimeParams, FieldConfig } from './birdTypes';

const FIELD_NAMES = ['Castle', 'Bridge', 'Dock', 'Mountains', 'Sea'];
const MAX_BIRDS_PER_FIELD = 250;

function VectorOverlay({ getRefs, color, mode }: { getRefs: () => Record<string, BirdFieldHandle | null>; color: string; mode: 'velocity' | 'forward' }) {
  const lineRef = useRef<LineSegments>(null!);
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(new Float32Array(FIELD_NAMES.length * MAX_BIRDS_PER_FIELD * 2 * 3), 3));
    geo.setDrawRange(0, 0);
    return geo;
  }, []);
  const tmp = useMemo(() => new Vector3(), []);

  useFrame(() => {
    const refs = getRefs();
    const pos = geometry.attributes.position as BufferAttribute;
    let idx = 0;
    for (const name of FIELD_NAMES) {
      const handle = refs[name];
      if (!handle) continue;
      for (const b of handle.getBirds()) {
        pos.setXYZ(idx * 2, b.position.x, b.position.y, b.position.z);
        tmp.copy(mode === 'velocity' ? b.velocity : b.forward);
        tmp.multiplyScalar(mode === 'forward' ? 1.5 : 0.4);
        pos.setXYZ(idx * 2 + 1, b.position.x + tmp.x, b.position.y + tmp.y, b.position.z + tmp.z);
        idx++;
      }
    }
    geometry.setDrawRange(0, idx * 2);
    pos.needsUpdate = true;
  });

  return <lineSegments ref={lineRef} geometry={geometry}><lineBasicMaterial attach="material" color={color} transparent opacity={0.7} /></lineSegments>;
}

function PathOverlay({ getRefs, color }: { getRefs: () => Record<string, BirdFieldHandle | null>; color: string }) {
  const trailsRef = useRef<Record<number, Vector3[]>>({});
  const lineRef = useRef<LineSegments>(null!);
  const TRAIL_LEN = 20;
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(new Float32Array(FIELD_NAMES.length * MAX_BIRDS_PER_FIELD * TRAIL_LEN * 2 * 3), 3));
    geo.setDrawRange(0, 0);
    return geo;
  }, []);

  useFrame(() => {
    const refs = getRefs();
    const pos = geometry.attributes.position as BufferAttribute;
    let idx = 0;
    for (const name of FIELD_NAMES) {
      const handle = refs[name];
      if (!handle) continue;
      for (const b of handle.getBirds()) {
        let trail = trailsRef.current[b.id];
        if (!trail) { trail = []; trailsRef.current[b.id] = trail; }
        if (trail.length === 0 || trail[trail.length - 1].distanceToSquared(b.position) > 0.04) {
          trail.push(b.position.clone());
          if (trail.length > TRAIL_LEN) trail.shift();
        }
        for (let k = 0; k < trail.length - 1; k++) {
          pos.setXYZ(idx * 2, trail[k].x, trail[k].y, trail[k].z);
          pos.setXYZ(idx * 2 + 1, trail[k + 1].x, trail[k + 1].y, trail[k + 1].z);
          idx++;
        }
      }
    }
    geometry.setDrawRange(0, idx * 2);
    pos.needsUpdate = true;
  });

  return <lineSegments ref={lineRef} geometry={geometry}><lineBasicMaterial attach="material" color={color} transparent opacity={0.35} /></lineSegments>;
}

function TargetOverlay({ getRefs, color }: { getRefs: () => Record<string, BirdFieldHandle | null>; color: string }) {
  const groupRef = useRef<any>(null);
  useFrame(() => {
    const refs = getRefs();
    const group = groupRef.current;
    if (!group) return;
    let i = 0;
    for (const name of FIELD_NAMES) {
      const handle = refs[name];
      if (!handle) continue;
      const mesh = group.children[i];
      if (mesh) { mesh.position.copy(handle.center); mesh.visible = true; }
      i++;
    }
  });
  return <group ref={groupRef}>{FIELD_NAMES.map((n) => <mesh key={n}><sphereGeometry args={[0.3, 8, 8]} /><meshBasicMaterial color={color} wireframe /></mesh>)}</group>;
}

function FieldRadiusOverlay({ fields, show, showBounding }: { fields: FieldConfig[]; show: boolean; showBounding: boolean }) {
  if (!show && !showBounding) return null;
  return (
    <>
      {show && fields.map(f => (
        <mesh key={f.name + '-radius'} position={f.center}><sphereGeometry args={[f.radius, 16, 12]} /><meshBasicMaterial color="#4fd1ff" wireframe transparent opacity={0.15} /></mesh>
      ))}
      {showBounding && fields.map(f => (
        <mesh key={f.name + '-bounds'} position={[f.center[0], f.center[1] + f.height, f.center[2]]}><sphereGeometry args={[f.radius * 0.7, 12, 10]} /><meshBasicMaterial color="#ff6b6b" wireframe transparent opacity={0.25} /></mesh>
      ))}
    </>
  );
}

const BASE_FIELD_DEFS: FieldConfig[] = [
  { name: 'Castle', center: [30, 26, 8], radius: 20, height: 10, count: 60, speed: 4, species: 'seagull' },
  { name: 'Bridge', center: [0, 12, 0], radius: 10, height: 5, count: 25, speed: 3.4, species: 'crow' },
  { name: 'Dock', center: [12, 8, -20], radius: 14, height: 6, count: 30, speed: 3.8, species: 'seagull' },
  { name: 'Mountains', center: [-40, 45, -10], radius: 35, height: 18, count: 20, speed: 3.8, species: 'eagle' },
  { name: 'Sea', center: [0, 10, 60], radius: 40, height: 8, count: 45, speed: 4, species: 'seagull' },
];

export default function BirdDebug() {
  const {
    enabled, birdCount, fieldRadius, fieldHeight, orbitSpeed, wanderStrength,
    separationWeight, alignmentWeight, cohesionWeight, glideChance,
    wingSpeed, wingAmplitude, bankAmount, scatterDistance, scatterSpeed, returnSpeed, birdScale,
  } = useControls('Birds', {
    enabled: true,
    birdCount: { value: 0, min: 0, max: 250, step: 5, label: 'birdCount (0=default)' },
    fieldRadius: { value: 0, min: 0, max: 60, step: 1, label: 'fieldRadius (0=default)' },
    fieldHeight: { value: 0, min: 0, max: 40, step: 1, label: 'fieldHeight (0=default)' },
    orbitSpeed: { value: 0.15, min: 0, max: 1, step: 0.01 },
    wanderStrength: { value: 0.6, min: 0, max: 3, step: 0.05 },
    separationWeight: { value: 1.5, min: 0, max: 5, step: 0.05 },
    alignmentWeight: { value: 1, min: 0, max: 5, step: 0.05 },
    cohesionWeight: { value: 0.8, min: 0, max: 5, step: 0.05 },
    glideChance: { value: 0.3, min: 0, max: 1, step: 0.02 },
    wingSpeed: { value: 1, min: 0, max: 3, step: 0.05 },
    wingAmplitude: { value: 1, min: 0, max: 3, step: 0.05 },
    bankAmount: { value: 1, min: 0, max: 2, step: 0.05 },
    scatterDistance: { value: 4, min: 0.5, max: 15, step: 0.5 },
    scatterSpeed: { value: 6, min: 1, max: 20, step: 0.5 },
    returnSpeed: { value: 1.2, min: 0.1, max: 5, step: 0.1 },
    birdScale: { value: 1, min: 0.2, max: 3, step: 0.05 },
  });

  const { debugPaths, debugTargets, showBoundingSphere, showFieldRadius, showVelocity, showForward } = useControls('Birds - Debug Draw', {
    debugPaths: false, debugTargets: false, showBoundingSphere: false, showFieldRadius: false, showVelocity: false, showForward: false,
  });

  const fieldRefs = useRef<Record<string, BirdFieldHandle | null>>({});
  const getRefs = () => fieldRefs.current;

  const weights = useMemo<FlockingWeights>(() => ({ separationWeight, alignmentWeight, cohesionWeight, wanderStrength, orbitSpeed }), [separationWeight, alignmentWeight, cohesionWeight, wanderStrength, orbitSpeed]);
  const params = useMemo<BirdRuntimeParams>(() => ({ wingSpeed, wingAmplitude, bankAmount, scatterDistance, scatterSpeed, returnSpeed, birdScale, glideChance }), [wingSpeed, wingAmplitude, bankAmount, scatterDistance, scatterSpeed, returnSpeed, birdScale, glideChance]);

  const fieldOverrides = useMemo(() => {
    const o: Partial<Record<string, Partial<FieldConfig>>> = {};
    for (const name of FIELD_NAMES) {
      const ov: Partial<FieldConfig> = {};
      if (birdCount > 0) ov.count = birdCount;
      if (fieldRadius > 0) ov.radius = fieldRadius;
      if (fieldHeight > 0) ov.height = fieldHeight;
      o[name] = ov;
    }
    return o;
  }, [birdCount, fieldRadius, fieldHeight]);

  const displayFields = useMemo(() => BASE_FIELD_DEFS.map(f => ({ ...f, ...fieldOverrides[f.name] })), [fieldOverrides]);

  if (!enabled) return null;

  return (
    <>
      <BirdController weights={weights} params={params} fieldOverrides={fieldOverrides} onFieldRefs={(r) => { fieldRefs.current = r; }} />
      {showVelocity && <VectorOverlay getRefs={getRefs} color="#00ff88" mode="velocity" />}
      {showForward && <VectorOverlay getRefs={getRefs} color="#ffcc00" mode="forward" />}
      {debugPaths && <PathOverlay getRefs={getRefs} color="#8888ff" />}
      {debugTargets && <TargetOverlay getRefs={getRefs} color="#ff00ff" />}
      <FieldRadiusOverlay fields={displayFields} show={showFieldRadius} showBounding={showBoundingSphere} />
    </>
  );
}