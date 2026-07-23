// components/Environment/Fireflies/FireflyController.tsx
import { useMemo } from 'react';
import FireflyField from './FireflyField';
import { useControls } from 'leva';
import { Distribution, MovementStyle } from './Firefly';

interface FieldConfig {
  name: string; center: [number, number, number]; radius: number;
  count: number; heightMin: number; heightMax: number; density?: number;
}

const FIELD_DEFS: FieldConfig[] = [
  { name: 'Forest', center: [-24, 2, 18], radius: 14, count: 400, heightMin: 0.4, heightMax: 3.5, density: 1 },
  { name: 'Bridge', center: [0, 5, 0], radius: 6, count: 120, heightMin: 1, heightMax: 2.5, density: 0.7 },
  { name: 'Dock', center: [12, 1.5, -20], radius: 8, count: 150, heightMin: 0.3, heightMax: 2, density: 0.8 },
  { name: 'Castle', center: [30, 10, 10], radius: 16, count: 350, heightMin: 1, heightMax: 6, density: 1 },
  { name: 'Courtyard', center: [30, 4, -6], radius: 10, count: 220, heightMin: 0.5, heightMax: 3, density: 0.9 },
  { name: 'Tower', center: [30, 22, 4], radius: 5, count: 100, heightMin: 0, heightMax: 4, density: 0.6 },
];

// FIELD_DEFS is a fixed, module-level constant — same length/order every render,
// so mapping a hook over it is safe despite normally avoiding hooks-in-loops.
function useFieldControls(f: FieldConfig) {
  return useControls(`Fireflies - ${f.name}`, {
    x: { value: f.center[0], min: f.center[0] - 30, max: f.center[0] + 30, step: 0.5 },
    y: { value: f.center[1], min: f.center[1] - 10, max: f.center[1] + 10, step: 0.5 },
    z: { value: f.center[2], min: f.center[2] - 30, max: f.center[2] + 30, step: 0.5 },
    radius: { value: f.radius, min: 1, max: 40, step: 0.5 },
    distribution: { value: 'disc' as Distribution, options: ['disc', 'ring', 'cluster'] },
    movementStyle: { value: 'wide' as MovementStyle, options: ['tight', 'wide', 'still'] },
  });
}

const QUALITY_SCALE = { low: 0.4, medium: 0.7, high: 2 };

export default function FireflyController() {
  const { enabled, quality, size, brightness, movementSpeed, windInfluence, fireflyColor, coreColor } = useControls('Fireflies', {
    enabled: true,
    quality: { value: 'low', options: ['low', 'medium', 'high'] },
    size: { value: 1, min: 0.2, max: 3, step: 0.05 },
    brightness: { value: 1, min: 0, max: 3, step: 0.05 },
    movementSpeed: { value: 1, min: 0, max: 3, step: 0.05 },
    windInfluence: { value: 0.3, min: 0, max: 2, step: 0.05 },
    fireflyColor: '#ffb347',
    coreColor: '#fff6d5',
  });

  const fieldControls = FIELD_DEFS.map(useFieldControls);

  const fields = useMemo(() => {
    const scale = QUALITY_SCALE[quality as keyof typeof QUALITY_SCALE];
    return FIELD_DEFS.map((f, i) => ({
      ...f,
      center: [fieldControls[i].x, fieldControls[i].y, fieldControls[i].z] as [number, number, number],
      radius: fieldControls[i].radius,
      distribution: fieldControls[i].distribution as Distribution,
      movementStyle: fieldControls[i].movementStyle as MovementStyle,
      count: Math.max(20, Math.round(f.count * (f.density ?? 1) * scale)),
    }));
  }, [quality, fieldControls]);

  if (!enabled) return null;

  return (
    <group name="fireflies">
      {fields.map(f => (
        <FireflyField
          key={f.name}
          center={f.center} radius={f.radius} count={f.count}
          heightMin={f.heightMin} heightMax={f.heightMax}
          distribution={f.distribution} movementStyle={f.movementStyle}
          size={size} brightness={brightness} movementSpeed={movementSpeed} windInfluence={windInfluence}
          fireflyColor={fireflyColor} coreColor={coreColor}
        />
      ))}
    </group>
  );
}