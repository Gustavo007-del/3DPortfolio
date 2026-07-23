// components/Environment/Birds/BirdController.tsx
import { useRef, useMemo } from 'react';
import BirdField, { BirdFieldHandle } from './BirdField';
import { FieldConfig, Species, DEFAULT_FLOCKING_WEIGHTS, DEFAULT_RUNTIME_PARAMS, FlockingWeights, BirdRuntimeParams } from './birdTypes';

const FIELD_DEFS: FieldConfig[] = [
//   { name: 'Castle', center: [30, 26, 8], radius: 20, height: 10, count: 60, speed: 4, species: 'seagull' },
  { name: 'Bridge', center: [0, 12, -20], radius: 10, height: 5, count: 25, speed: 3.4, species: 'crow' },
//   { name: 'Dock', center: [12, 8, -20], radius: 14, height: 6, count: 30, speed: 3.8, species: 'seagull' },
  { name: 'Mountains', center: [-40, 45, -10], radius: 35, height: 18, count: 20, speed: 3.8, species: 'eagle' },
//   { name: 'Sea', center: [0, 10, 60], radius: 40, height: 8, count: 45, speed: 4, species: 'seagull' },
];

export interface BirdControllerProps {
  enabled?: boolean;
  qualityScale?: number;
  weights?: Partial<FlockingWeights>;
  params?: Partial<BirdRuntimeParams>;
  fieldOverrides?: Partial<Record<string, Partial<FieldConfig>>>;
  onFieldRefs?: (refs: Record<string, BirdFieldHandle | null>) => void;
}

export default function BirdController({ enabled = true, qualityScale = 1, weights, params, fieldOverrides,  onFieldRefs  }: BirdControllerProps) {
  const fieldRefs = useRef<Record<string, BirdFieldHandle | null>>({});

  const mergedWeights = useMemo<FlockingWeights>(() => ({ ...DEFAULT_FLOCKING_WEIGHTS, ...weights }), [weights]);
  const mergedParams = useMemo<BirdRuntimeParams>(() => ({ ...DEFAULT_RUNTIME_PARAMS, ...params }), [params]);

  const fields = useMemo(() => FIELD_DEFS.map(f => {
    const o = fieldOverrides?.[f.name];
    const merged = { ...f, ...o };
    return { ...merged, count: Math.max(4, Math.round(merged.count * qualityScale)) };
  }), [qualityScale, fieldOverrides]);

  if (!enabled) return null;

  return (
    <group name="birds">
      {fields.map(f => (
        <BirdField
          key={f.name}
          ref={(el) => { fieldRefs.current[f.name] = el; onFieldRefs?.(fieldRefs.current); }}
          center={f.center} radius={f.radius} height={f.height} count={f.count} speed={f.speed} species={f.species as Species}
          weights={mergedWeights} params={mergedParams}
        />
      ))}
    </group>
  );
}

export function getBirdFieldRefs() { return {} as Record<string, BirdFieldHandle | null>; }