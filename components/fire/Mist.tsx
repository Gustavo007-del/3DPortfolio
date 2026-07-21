// components/Environment/Mist/Mist.tsx
"use client";

import * as THREE from "three";
import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useWind } from "@/components/fire/WindContext";
import { MistMaterial, MistMaterialParams } from "./MistMaterial";
export interface MistPatch {
  position: [number, number, number];
  seed: number;
  noiseOffset: [number, number];
  scale: number;
  rotation: number;
  /** Small radians offset from a pure vertical billboard (cylindrical
   * billboarding tilted slightly around the camera-forward axis), so
   * patches don't all read as an identical "wall of cards". */
  tilt: number;
  opacityRand: number;
  densityRand: number;
  speedRand: number;
}

export interface MistProps {
  patches: MistPatch[];
  material?: MistMaterialParams;
  /** Base quad size before per-instance aScale is applied. */
  baseSize?: number;
}

/**
 * Mist
 * Renders `patches.length` cylindrically-billboarded fog quads as a
 * single THREE.InstancedMesh draw call. All per-instance variation
 * (offset, seed, noise offset, scale, rotation, tilt, opacity/density/
 * speed random) lives in InstancedBufferAttributes consumed by
 * MistMaterial's vertex shader — the CPU never touches instanceMatrix,
 * so there is zero per-frame allocation and zero per-frame CPU matrix
 * math.
 *
 * Billboarding is cylindrical (locked to world-up), not spherical:
 * each card's vertical edge always stays aligned to world Y instead of
 * fully facing the camera. That's what keeps ground fog reading as
 * grounded volume instead of flattening into a disc/line when the
 * camera pitches or views a cluster of patches edge-on.
 *
 * The only per-frame work is mutating two existing uniform objects
 * (uTime as a number, uWindVector via .set()) — no new objects, no
 * array rebuilding, no attribute re-upload.
 */
export default function Mist({ patches, material, baseSize = 18 }: MistProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<MistMaterial>(null);
  const wind = useWind();

  // Reusable quad geometry, built once. A simple 2-triangle plane
  // centered at origin; the vertex shader billboards + rotates it
  // per-instance, so this geometry is shared across all patches.
  const geometry = useMemo(() => {
    const geo = new THREE.InstancedBufferGeometry();
    const base = new THREE.PlaneGeometry(1, 1, 1, 1);
    geo.index = base.index;
    geo.attributes.position = base.attributes.position;
    geo.attributes.uv = base.attributes.uv;
    geo.attributes.normal = base.attributes.normal;

    const count = patches.length;

    const aOffset = new Float32Array(count * 3);
    const aSeed = new Float32Array(count);
    const aNoiseOffset = new Float32Array(count * 2);
    const aScale = new Float32Array(count);
    const aRotation = new Float32Array(count);
    const aTilt = new Float32Array(count);
    const aOpacityRand = new Float32Array(count);
    const aDensityRand = new Float32Array(count);
    const aSpeedRand = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const p = patches[i];

      aOffset[i * 3 + 0] = p.position[0];
      aOffset[i * 3 + 1] = p.position[1];
      aOffset[i * 3 + 2] = p.position[2];

      aSeed[i] = p.seed;

      aNoiseOffset[i * 2 + 0] = p.noiseOffset[0];
      aNoiseOffset[i * 2 + 1] = p.noiseOffset[1];

      aScale[i] = p.scale;
      aRotation[i] = p.rotation;
      aTilt[i] = p.tilt;
      aOpacityRand[i] = p.opacityRand;
      aDensityRand[i] = p.densityRand;
      aSpeedRand[i] = p.speedRand;
    }

    geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(aOffset, 3));
    geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(aSeed, 1));
    geo.setAttribute("aNoiseOffset", new THREE.InstancedBufferAttribute(aNoiseOffset, 2));
    geo.setAttribute("aScale", new THREE.InstancedBufferAttribute(aScale, 1));
    geo.setAttribute("aRotation", new THREE.InstancedBufferAttribute(aRotation, 1));
    geo.setAttribute("aTilt", new THREE.InstancedBufferAttribute(aTilt, 1));
    geo.setAttribute("aOpacityRand", new THREE.InstancedBufferAttribute(aOpacityRand, 1));
    geo.setAttribute("aDensityRand", new THREE.InstancedBufferAttribute(aDensityRand, 1));
    geo.setAttribute("aSpeedRand", new THREE.InstancedBufferAttribute(aSpeedRand, 1));

    // instanceCount is read from InstancedMesh's `count` prop, but
    // InstancedBufferGeometry also needs to know it for attribute sizing.
    geo.instanceCount = count;

    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patches]);

  const mistMaterial = useMemo(() => new MistMaterial(material), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {

    const mat = materialRef.current;
    if (!mat || !material) return;

    mat.uniforms.uColor.value.set(material.color ?? "#dfe6ea");
    mat.uniforms.uOpacity.value = material.opacity ?? 0.35;
    mat.uniforms.uDensity.value = material.density ?? 1.0;
    mat.uniforms.uSpeed.value = material.speed ?? 1.0;
    mat.uniforms.uWindStrength.value = material.windStrength ?? 1.0;
    mat.uniforms.uHeightFadeStart.value = material.heightFadeStart ?? 0.0;
    mat.uniforms.uHeightFadeEnd.value = material.heightFadeEnd ?? 8.0;
    mat.uniforms.uFalloffRadius.value = material.falloffRadius ?? 0.45;
    mat.uniforms.uDitherStrength.value = material.ditherStrength ?? 0.01;
    mat.uniforms.uNearFade.value = material.nearFade ?? 1.2;
    mat.uniforms.uFarFade.value = material.farFade ?? 260.0;
    mat.uniforms.uSoftness.value = material.softness ?? 0.16;
    mat.uniforms.uEdgeNoise.value = material.edgeNoise ?? 0.18;

}, [material]);
  // Dummy matrix identity — every instance uses the SAME identity
  // transform because all positioning happens in the shader via
  // aOffset/aScale/aRotation. We set this once, never touched again.
  useMemo(() => {
    if (!meshRef.current) return;
  }, []);

  useFrame((state) => {
    const mat = materialRef.current;
    if (!mat) return;

    // Zero-allocation per-frame updates: primitive assignment + .set()
    // on already-existing Vector2, no `new` anywhere in this callback.
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uWindVector.value.set(wind.vector[0], wind.vector[1]);
    mat.uniforms.uWindStrength.value = 0.6 + wind.strength * 0.8;
  });

  const count = patches.length;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, count]}
      frustumCulled={false}
      renderOrder={10}
    >
      <primitive object={mistMaterial} ref={materialRef} attach="material" />
    </instancedMesh>
  );
}