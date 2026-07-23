// components/Environment/Birds/BirdField.tsx
import { forwardRef, useImperativeHandle, useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, InstancedBufferAttribute, Matrix4, Quaternion, Vector3, Euler } from 'three';
import { createNoise3D } from 'simplex-noise';
import { createBirdGeometry } from './BirdGeometry';
import { createBirdMaterial } from './BirdMaterial';
import { BirdData, Species, SPECIES_PROFILES, FlockingWeights, BirdRuntimeParams, BirdState } from './birdTypes';
import { useWind } from '@/hooks/useWind';

const noise3D = createNoise3D();

export interface BirdFieldProps {
  center: [number, number, number]; radius: number; height: number;
  count: number; speed: number; species: Species;
  weights: FlockingWeights; params: BirdRuntimeParams;
}

export interface BirdFieldHandle { getBirds(): BirdData[]; center: Vector3; radius: number; }

const UP = new Vector3(0, 1, 0);
let idCounter = 0;

function createBird(center: Vector3, radius: number, height: number, speed: number, species: Species): BirdData {
  const angle = Math.random() * Math.PI * 2;
  const orbitRadius = radius * (0.4 + Math.random() * 0.6);
  const orbitHeight = height * (0.7 + Math.random() * 0.6);
  const pos = new Vector3(center.x + Math.cos(angle) * orbitRadius, center.y + orbitHeight, center.z + Math.sin(angle) * orbitRadius);
  const tangent = new Vector3(-Math.sin(angle), 0, Math.cos(angle)).multiplyScalar(speed * (0.6 + Math.random() * 0.5));
  const profile = SPECIES_PROFILES[species];
  return {
    position: pos, velocity: tangent, acceleration: new Vector3(),
    forward: tangent.clone().normalize(), up: UP.clone(),
    homeCenter: center.clone(), orbitAngle: angle, orbitRadius, orbitHeight,
    species, state: 'flying', bank: 0, pitch: 0,
    wingPhase: Math.random() * Math.PI * 2, wingSpeed: profile.wingSpeedBase * (0.85 + Math.random() * 0.3),
    wingAmplitude: profile.wingAmplitudeBase, glideChance: profile.glideChanceBase,
    glideTimer: Math.random() * 4, glideDuration: 1 + Math.random() * 2, isGliding: false,
    scatterAmount: 0, seed: Math.random() * 1000, id: idCounter++,
  };
}

const BirdField = forwardRef<BirdFieldHandle, BirdFieldProps>(function BirdField(
  { center, radius, height, count, speed, species, weights, params }, ref
) {
  const meshRef = useRef<InstancedMesh>(null!);
  const centerVec = useMemo(() => new Vector3(...center), [center[0], center[1], center[2]]);
  const profile = SPECIES_PROFILES[species];

  const birds = useMemo<BirdData[]>(
    () => Array.from({ length: count }, () => createBird(centerVec, radius, height, speed, species)),
    [centerVec, radius, height, count, speed, species]
  );

  const geometry = useMemo(() => {
    const geo = createBirdGeometry(profile);
    const n = geo.attributes.position.count;
    geo.setAttribute('aWingPhase', new InstancedBufferAttribute(new Float32Array(count), 1));
    geo.setAttribute('aWingSpeed', new InstancedBufferAttribute(new Float32Array(count), 1));
    geo.setAttribute('aWingAmp', new InstancedBufferAttribute(new Float32Array(count), 1));
    geo.setAttribute('aGlide', new InstancedBufferAttribute(new Float32Array(count), 1));
    void n;
    return geo;
  }, [profile, count]);

  const material = useMemo(() => createBirdMaterial({ color: profile.color }), [profile]);

  useImperativeHandle(ref, () => ({ getBirds: () => birds, center: centerVec, radius }), [birds, centerVec, radius]);

  const wind = useWind();
  const tmpMatrix = useMemo(() => new Matrix4(), []);
  const tmpQuat = useMemo(() => new Quaternion(), []);
  const tmpEuler = useMemo(() => new Euler(), []);
  const tmpScale = useMemo(() => new Vector3(1, 1, 1), []);
  const tmpSep = useMemo(() => new Vector3(), []);
  const tmpAli = useMemo(() => new Vector3(), []);
  const tmpCoh = useMemo(() => new Vector3(), []);
  const tmpDiff = useMemo(() => new Vector3(), []);
  const tmpWander = useMemo(() => new Vector3(), []);
  const tmpOrbitTarget = useMemo(() => new Vector3(), []);
  const tmpDesired = useMemo(() => new Vector3(), []);
  const tmpWind = useMemo(() => new Vector3(), []);
  const tmpCam = useMemo(() => new Vector3(), []);
  const tmpToCam = useMemo(() => new Vector3(), []);
  const tmpTargetDir = useMemo(() => new Vector3(), []);
  const tmpBankAxis = useMemo(() => new Vector3(), []);

  useEffect(() => { if (meshRef.current) meshRef.current.frustumCulled = false; }, []);

  const SEP_RADIUS = radius * 0.15, ALI_RADIUS = radius * 0.4, COH_RADIUS = radius * 0.45;

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = state.clock.elapsedTime;
    const mesh = meshRef.current;
    if (!mesh) return;
    if ((material as any).setTime) (material as any).setTime(t);

    tmpWind.set(wind.vector[0], 0, wind.vector[1]);
    state.camera.getWorldPosition(tmpCam);

    const aWingPhase = mesh.geometry.attributes.aWingPhase as InstancedBufferAttribute;
    const aWingSpeed = mesh.geometry.attributes.aWingSpeed as InstancedBufferAttribute;
    const aWingAmp = mesh.geometry.attributes.aWingAmp as InstancedBufferAttribute;
    const aGlide = mesh.geometry.attributes.aGlide as InstancedBufferAttribute;

    for (let i = 0; i < birds.length; i++) {
      const b = birds[i];
      b.glideChance = params.glideChance;

      // ---- state machine ----
      tmpToCam.copy(b.position).sub(tmpCam);
      const distToCam = tmpToCam.length();
      if (distToCam < params.scatterDistance) {
        b.state = 'scared';
        b.scatterAmount = Math.min(1, b.scatterAmount + dt * 3);
      } else if (b.state === 'scared') {
        b.state = 'returning';
        b.scatterAmount = Math.max(0, b.scatterAmount - dt * 1.5);
        if (b.scatterAmount <= 0.01) b.state = 'flying';
      }

      if (b.state !== 'scared' && b.state !== 'returning') {
        b.glideTimer += dt;
        if (b.glideTimer > b.glideDuration) {
          b.glideTimer = 0;
          b.isGliding = Math.random() < b.glideChance;
          b.glideDuration = b.isGliding ? 1.5 + Math.random() * 2.5 : 2 + Math.random() * 4;
          b.state = b.isGliding ? 'gliding' : 'flying';
        }
      }

      // ---- flocking: separation / alignment / cohesion (same-field neighbors) ----
      tmpSep.set(0, 0, 0); tmpAli.set(0, 0, 0); tmpCoh.set(0, 0, 0);
      let sepCount = 0, aliCount = 0, cohCount = 0;
      for (let j = 0; j < birds.length; j++) {
        if (j === i) continue;
        const o = birds[j];
        tmpDiff.copy(b.position).sub(o.position);
        const d = tmpDiff.length();
        if (d < SEP_RADIUS && d > 0.0001) { tmpSep.addScaledVector(tmpDiff, 1 / d); sepCount++; }
        if (d < ALI_RADIUS) { tmpAli.add(o.velocity); aliCount++; }
        if (d < COH_RADIUS) { tmpCoh.add(o.position); cohCount++; }
      }
      if (sepCount > 0) tmpSep.multiplyScalar(1 / sepCount).multiplyScalar(weights.separationWeight);
      if (aliCount > 0) tmpAli.multiplyScalar(1 / aliCount).sub(b.velocity).multiplyScalar(weights.alignmentWeight * 0.2);
      if (cohCount > 0) { tmpCoh.multiplyScalar(1 / cohCount).sub(b.position).multiplyScalar(weights.cohesionWeight * 0.05); }

      // ---- orbit target (slowly rotating home point) ----
      b.orbitAngle += weights.orbitSpeed * dt * (b.state === 'circling' ? 2.2 : 1);
      tmpOrbitTarget.set(b.homeCenter.x + Math.cos(b.orbitAngle) * b.orbitRadius, b.homeCenter.y + b.orbitHeight, b.homeCenter.z + Math.sin(b.orbitAngle) * b.orbitRadius);
      tmpTargetDir.copy(tmpOrbitTarget).sub(b.position).multiplyScalar(0.6);

      // ---- wander (simplex, per-bird via seed) ----
      const nx = noise3D(b.seed + t * 0.15, 0, 0);
      const ny = noise3D(0, b.seed + t * 0.15, 0);
      const nz = noise3D(0, 0, b.seed + t * 0.15);
      tmpWander.set(nx, ny * 0.4, nz).multiplyScalar(weights.wanderStrength);

      // ---- avoidance: floor clamp (stay above sea/ground) ----
      const minY = b.homeCenter.y + b.orbitHeight * 0.15;
      const avoidY = b.position.y < minY ? (minY - b.position.y) * 2 : 0;

      // ---- combine into desired acceleration ----
      tmpDesired.copy(tmpSep).add(tmpAli).add(tmpCoh).add(tmpTargetDir).add(tmpWander);
      tmpDesired.y += avoidY;
      tmpDesired.addScaledVector(tmpWind, 0.15);

      if (b.state === 'scared') {
        tmpDesired.copy(tmpToCam).normalize().multiplyScalar(params.scatterSpeed);
        tmpDesired.y += 1.5;
      } else if (b.state === 'returning') {
        tmpDesired.multiplyScalar(params.returnSpeed);
      }

      b.acceleration.lerp(tmpDesired, Math.min(1, dt * 1.5));
      b.velocity.addScaledVector(b.acceleration, dt);

      const maxSpeed = speed * (b.isGliding ? 0.85 : 1) * (b.state === 'scared' ? 2.2 : 1);
      const sp = b.velocity.length();
      if (sp > maxSpeed) b.velocity.multiplyScalar(maxSpeed / sp);
      if (sp < maxSpeed * 0.4) b.velocity.multiplyScalar((maxSpeed * 0.4) / Math.max(sp, 0.0001));

      b.position.addScaledVector(b.velocity, dt);

      // ---- orientation: forward from velocity, bank from lateral turn rate ----
      const targetForward = tmpDiff.copy(b.velocity).normalize();
      b.forward.lerp(targetForward, Math.min(1, dt * 4));
      if (b.forward.lengthSq() < 0.0001) b.forward.set(0, 0, 1);

      tmpBankAxis.crossVectors(UP, b.forward);
      const turnSignal = tmpBankAxis.dot(b.acceleration);
      const targetBank = Math.max(-1, Math.min(1, -turnSignal * 0.4)) * params.bankAmount * profile.bankAmountBase;
      b.bank += (targetBank - b.bank) * Math.min(1, dt * 3);
      const targetPitch = Math.max(-0.6, Math.min(0.6, b.forward.y * 1.2));
      b.pitch += (targetPitch - b.pitch) * Math.min(1, dt * 3);

      tmpEuler.set(0, Math.atan2(b.forward.x, b.forward.z), 0, 'YXZ');
      tmpQuat.setFromEuler(tmpEuler);
      const pitchQuat = tmpQuat.clone().setFromAxisAngle(new Vector3(1, 0, 0), -b.pitch);
      const bankQuat = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), b.bank);
      tmpQuat.multiply(pitchQuat).multiply(bankQuat);

      tmpScale.setScalar(params.birdScale * profile.scale);
      tmpMatrix.compose(b.position, tmpQuat, tmpScale);
      mesh.setMatrixAt(i, tmpMatrix);

      const flapMult = b.isGliding ? 0.15 : 1;
      aWingPhase.setX(i, b.wingPhase);
      aWingSpeed.setX(i, b.wingSpeed * params.wingSpeed * (b.state === 'scared' ? 2.4 : flapMult));
      aWingAmp.setX(i, b.wingAmplitude * params.wingAmplitude);
      aGlide.setX(i, b.isGliding && b.state !== 'scared' ? 1 : 0);
    }

    mesh.instanceMatrix.needsUpdate = true;
    aWingPhase.needsUpdate = true; aWingSpeed.needsUpdate = true; aWingAmp.needsUpdate = true; aGlide.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} castShadow receiveShadow />;
});

export default BirdField;