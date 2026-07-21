// components/Environment/Fireflies/FireflyController.tsx
import { useMemo } from 'react';
import FireflyField from './FireflyField';
import { useControls } from "leva";

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

export interface FireflyControllerProps {
  quality?: 'low' | 'medium' | 'high';
  enabled?: boolean;
}

const QUALITY_SCALE = { low: 0.4, medium: 0.7, high: 2 };

export default function FireflyController() {

    const {
        enabled,
        quality,
        size,
        brightness,
        movementSpeed,
        windInfluence,
        fireflyColor,
        coreColor,
    } = useControls("Fireflies", {

        enabled: true,

        quality: {
            value: "low",
            options: ["low", "medium", "high"],
        },

        size: {
            value: 1,
            min: 0.2,
            max: 3,
            step: 0.05,
        },

        brightness: {
            value: 1,
            min: 0,
            max: 3,
            step: 0.05,
        },

        movementSpeed: {
            value: 1,
            min: 0,
            max: 3,
            step: 0.05,
        },

        windInfluence: {
            value: 0.3,
            min: 0,
            max: 2,
            step: 0.05,
        },

        fireflyColor: "#ffb347",

        coreColor: "#fff6d5",

    });

    const fields = useMemo(() => {
    const scale = QUALITY_SCALE[quality];
    return FIELD_DEFS.map(f => ({ ...f, count: Math.max(20, Math.round(f.count * (f.density ?? 1) * scale)) }));
  }, [quality]);

  if (!enabled) return null;

  return (
    <group name="fireflies">
      {fields.map(f => <FireflyField key={f.name} center={f.center} radius={f.radius} count={f.count} heightMin={f.heightMin} heightMax={f.heightMax} size={size}
    brightness={brightness}
    movementSpeed={movementSpeed}
    windInfluence={windInfluence}

    fireflyColor={fireflyColor}
    coreColor={coreColor} />)}
    </group>
  );
}