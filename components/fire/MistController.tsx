// components/Environment/Mist/MistController.tsx
"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { useControls, folder } from "leva";
import Mist, { MistPatch } from "./Mist";
import { MistMaterialParams } from "./MistMaterial";

export interface MistControllerProps {
  count?: number;
  center?: [number, number];
  centerY?: number;
  innerRadius?: number;
  outerRadius?: number;
  minY?: number;
  maxY?: number;
  minScale?: number;
  maxScale?: number;
  seed?: number;
  material?: MistMaterialParams;
  baseSize?: number;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function MistController(props: MistControllerProps) {
  const {
    count: countProp,
    center: centerProp,
    centerY: centerYProp,
    innerRadius: innerRadiusProp,
    outerRadius: outerRadiusProp,
    minY: minYProp,
    maxY: maxYProp,
    minScale: minScaleProp,
    maxScale: maxScaleProp,
    seed: seedProp,
    material: materialProp,
    baseSize: baseSizeProp,
  } = props;

  const layout = useControls("Mist", {
    layout: folder(
      {
        count: { value: countProp ?? 60, min: 0, max: 300, step: 1 },
        centerX: { value: centerProp?.[0] ?? -2, min: -200, max: 200, step: 1 },
        centerZ: { value: centerProp?.[1] ?? -22, min: -200, max: 200, step: 1 },
        centerY: { value: centerYProp ?? 2.3, min: -51.8, max: 50, step: 0.1 },
        innerRadius: { value: innerRadiusProp ?? 13, min: 0, max: 200, step: 1 },
        outerRadius: { value: outerRadiusProp ?? 0, min: 0, max: 400, step: 1 },
        minY: { value: minYProp ?? -1.5, min: -4.1, max: 20, step: 0.1 },
        maxY: { value: maxYProp ?? 3.5, min: 2.7, max: 40, step: 0.1 },
        minScale: { value: minScaleProp ?? 2.0, min: 1, max: 100, step: 0.5 },
        maxScale: { value: maxScaleProp ?? 24.5, min: 1, max: 150, step: 0.5 },
        seed: { value: seedProp ?? 1337, min: 0, max: 99999, step: 1 },
        baseSize: { value: baseSizeProp ?? 18, min: 1, max: 100, step: 1 },
      },
      { collapsed: true }
    ),
  });

  const materialControls = useControls("Mist", {
    material: folder(
      {
        color: { value: (materialProp?.color as string) ?? "#ffd200" },
        opacity: { value: materialProp?.opacity ?? 1, min: 0, max: 1, step: 0.01 },
        density: { value: materialProp?.density ?? 3, min: 0, max: 3, step: 0.01 },
        speed: { value: materialProp?.speed ?? 0.48, min: 0, max: 5, step: 0.01 },
        windStrength: { value: materialProp?.windStrength ?? 1.0, min: 0, max: 5, step: 0.01 },
        heightFadeStart: { value: materialProp?.heightFadeStart ?? 20.0, min: -20, max: 20, step: 0.1 },
        heightFadeEnd: { value: materialProp?.heightFadeEnd ?? 60.0, min: -20, max: 60, step: 0.1 },
        falloffRadius: { value: materialProp?.falloffRadius ?? 0, min: 0, max: 1, step: 0.01 },
        ditherStrength: { value: materialProp?.ditherStrength ?? 0., min: 0, max: 0.2, step: 0.002 },
        nearFade: { value: materialProp?.nearFade ?? 1.2, min: 0, max: 20, step: 0.1 },
        farFade: { value: materialProp?.farFade ?? 1000.0, min: 10, max: 1000, step: 5 },
        // NEW: controls noise-contrast on the density curve. Keep this
        // low (0.05-0.3) — the shader clamps it to max 0.32 anyway, so
        // pushing past that has no further effect.
        softness: { value: materialProp?.softness ?? 0.02, min: 0.02, max: 0.32, step: 0.005 },
        // NEW: how wobbly each patch's silhouette is vs a perfect
        // circle. 0 = disc (the bug you just saw), 0.3+ = very ragged.
        edgeNoise: { value: materialProp?.edgeNoise ?? 0.0, min: 0, max: 0.5, step: 0.01 },
      },
      { collapsed: true }
    ),
  });

  const count = countProp ?? layout.count;
  const center: [number, number] = centerProp ?? [layout.centerX, layout.centerZ];
  const centerY = centerYProp ?? layout.centerY;
  const innerRadius = innerRadiusProp ?? layout.innerRadius;
  const outerRadius = outerRadiusProp ?? layout.outerRadius;
  const minY = minYProp ?? layout.minY;
  const maxY = maxYProp ?? layout.maxY;
  const minScale = minScaleProp ?? layout.minScale;
  const maxScale = maxScaleProp ?? layout.maxScale;
  const seed = seedProp ?? layout.seed;
  const baseSize = baseSizeProp ?? layout.baseSize;

  const material: MistMaterialParams = useMemo(
    () => ({
      color: materialControls.color,
      opacity: materialControls.opacity,
      density: materialControls.density,
      speed: materialControls.speed,
      windStrength: materialControls.windStrength,
      heightFadeStart: materialControls.heightFadeStart,
      heightFadeEnd: materialControls.heightFadeEnd,
      falloffRadius: materialControls.falloffRadius,
      ditherStrength: materialControls.ditherStrength,
      nearFade: materialControls.nearFade,
      farFade: materialControls.farFade,
      softness: materialControls.softness,
      edgeNoise: materialControls.edgeNoise,
    }),
    [
      materialControls.color,
      materialControls.opacity,
      materialControls.density,
      materialControls.speed,
      materialControls.windStrength,
      materialControls.heightFadeStart,
      materialControls.heightFadeEnd,
      materialControls.falloffRadius,
      materialControls.ditherStrength,
      materialControls.nearFade,
      materialControls.farFade,
      materialControls.softness,
      materialControls.edgeNoise,
    ]
  );

  const patches = useMemo<MistPatch[]>(() => {
    const rand = mulberry32(seed);
    const result: MistPatch[] = [];

    for (let i = 0; i < count; i++) {
      const radialT = Math.pow(rand(), 1.8);
      const radius = innerRadius + radialT * (outerRadius - innerRadius);

      const angle = rand() * Math.PI * 2;
      const x = center[0] + Math.cos(angle) * radius;
      const z = center[1] + Math.sin(angle) * radius;

      const jitterX = (rand() - 0.5) * 6;
      const jitterZ = (rand() - 0.5) * 6;

      const heightT = Math.pow(rand(), 2.2);
      const y = centerY + minY + heightT * (maxY - minY);

      const scale = minScale + rand() * (maxScale - minScale);
      const rotation = rand() * Math.PI * 2;

      const seedVal = rand();
      const noiseOffset: [number, number] = [rand() * 100, rand() * 100];

      const opacityRand = THREE.MathUtils.lerp(0.55, 1.15, rand()) * (1.0 - heightT * 0.35);
      const densityRand = THREE.MathUtils.lerp(0.6, 1.25, rand());
      const speedRand = rand();
      const tilt = THREE.MathUtils.lerp(-0.15, 0.15, rand());

      result.push({
    position: [x + jitterX, y, z + jitterZ],
    seed: seedVal,
    noiseOffset,
    scale,
    rotation,
    tilt,
    opacityRand,
    densityRand,
    speedRand,
});
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, center[0], center[1], centerY, innerRadius, outerRadius, minY, maxY, minScale, maxScale, seed]);

  return <Mist patches={patches} material={material} baseSize={baseSize} />;
}