// components/Environment/Fireflies/FireflyField.tsx
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, InstancedBufferAttribute, Matrix4, Quaternion, Vector3, PlaneGeometry } from 'three';
import { createFirefly, updateFirefly, FireflyData, Distribution, MovementStyle } from './Firefly';
import { fireflyMaterialDefaults } from './FireflyMaterial';
import { useWind } from '@/hooks/useWind';

export interface FireflyFieldProps {
  center: [number, number, number];
  radius: number;
  count: number;
  heightMin?: number;
  heightMax?: number;
  size: number;
  brightness: number;
  movementSpeed: number;
  windInfluence: number;
  fireflyColor: string;
  coreColor: string;
  distribution?: Distribution;
  movementStyle?: MovementStyle;
}

const IDENTITY_QUAT = new Quaternion();

export default function FireflyField({
  center, radius, count, heightMin = 0.5, heightMax = 4,
  size, brightness, movementSpeed, windInfluence,
  fireflyColor, coreColor,
  distribution = 'disc', movementStyle = 'wide',
}: FireflyFieldProps) {
  const meshRef = useRef<InstancedMesh>(null!);
  const centerVec = useMemo(() => new Vector3(...center), [center[0], center[1], center[2]]);
  const fireflies = useMemo<FireflyData[]>(
    () => Array.from({ length: count }, () => createFirefly(centerVec, radius, heightMin, heightMax, distribution, movementStyle)),
    [centerVec, radius, count, heightMin, heightMax, distribution, movementStyle]
  );

  const geometry = useMemo(() => {
    const geo = new PlaneGeometry(1, 1);
    geo.setAttribute('aSize', new InstancedBufferAttribute(new Float32Array(count), 1));
    geo.setAttribute('aBlinkSpeed', new InstancedBufferAttribute(new Float32Array(count), 1));
    geo.setAttribute('aBlinkOffset', new InstancedBufferAttribute(new Float32Array(count), 1));
    geo.setAttribute('aBrightness', new InstancedBufferAttribute(new Float32Array(count), 1));
    geo.setAttribute('aSeed', new InstancedBufferAttribute(new Float32Array(count), 1));
    fireflies.forEach((f, i) => {
      (geo.attributes.aSize as InstancedBufferAttribute).setX(i, f.size);
      (geo.attributes.aBlinkSpeed as InstancedBufferAttribute).setX(i, f.blinkSpeed);
      (geo.attributes.aBlinkOffset as InstancedBufferAttribute).setX(i, f.blinkOffset);
      (geo.attributes.aBrightness as InstancedBufferAttribute).setX(i, f.brightness);
      (geo.attributes.aSeed as InstancedBufferAttribute).setX(i, f.seed);
    });
    return geo;
  }, [fireflies, count]);

  const wind = useWind();
  const tmpMatrix = useMemo(() => new Matrix4(), []);
  const tmpScale = useMemo(() => new Vector3(1, 1, 1), []);
  const tmpA = useMemo(() => new Vector3(), []);
  const tmpB = useMemo(() => new Vector3(), []);
  const tmpWind = useMemo(() => new Vector3(), []);
  const tmpCam = useMemo(() => new Vector3(), []);

  useEffect(() => { if (meshRef.current) meshRef.current.frustumCulled = false; }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const mesh = meshRef.current;
    if (!mesh) return;
    tmpWind.set(wind.vector[0], 0, wind.vector[1]);
    state.camera.getWorldPosition(tmpCam);
    for (let i = 0; i < fireflies.length; i++) {
      const f = fireflies[i];
      updateFirefly(f, t, dt * movementSpeed, tmpWind, tmpCam, tmpA, tmpB);
      tmpMatrix.compose(f.position, IDENTITY_QUAT, tmpScale);
      mesh.setMatrixAt(i, tmpMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if ((mesh.material as any).uniforms) {
      (mesh.material as any).uniforms.uTime.value = t;
      (mesh.material as any).uniforms.uSizeMult.value = size;
      (mesh.material as any).uniforms.uBrightnessMult.value = brightness;
      (mesh.material as any).uniforms.uWind.value = [wind.vector[0] * windInfluence, 0, wind.vector[1] * windInfluence];
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]}>
      <fireflyMaterial attach="material" {...fireflyMaterialDefaults} uColor={fireflyColor} uCoreColor={coreColor} />
    </instancedMesh>
  );
}