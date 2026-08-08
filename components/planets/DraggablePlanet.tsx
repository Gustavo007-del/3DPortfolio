// components/planets/DraggablePlanet.tsx
"use client";
import { useRef, ReactNode } from "react";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { useDraggable } from "@/hooks/useDraggable";

export default function DraggablePlanet({ children }: { children: ReactNode }) {
  const groupRef = useRef<Group>(null);
  const { applyOffset, onPointerDown, onPointerMove, onPointerUp, isDragging } = useDraggable();

  useFrame((_, delta) => {
    if (groupRef.current) applyOffset(groupRef.current, delta);
  });

  return (
    <group
      ref={groupRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOver={() => { document.body.style.cursor = isDragging.current ? "grabbing" : "grab"; }}
      onPointerOut={() => { if (!isDragging.current) document.body.style.cursor = "auto"; }}
    >
      {children}
    </group>
  );
}