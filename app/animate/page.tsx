"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import SolarSystem from "@/components/scene/SolarSystem";

export default function AnimatePage() {
  return (
    <div className="h-screen w-full relative">
      {/* Overlay info */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <h1 className="text-white text-2xl font-light tracking-[0.3em] uppercase">
          Cosmic Voyage
        </h1>
        <p className="text-white/40 text-sm mt-1 tracking-widest">
          Drag to explore · Scroll to zoom
        </p>
      </div>

      <Canvas
        camera={{
          position: [0, 6, 22],
          fov: 50,
          near: 0.1,
          far: 500,
        }}
        style={{ background: '#050510' }}
        gl={{ antialias: true, alpha: false }}
      >
        <ambientLight intensity={0.2} />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          autoRotate
          autoRotateSpeed={0.5}
          minDistance={5}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2.2}
        />

        <SolarSystem />

        {/* Subtle fog for depth */}
        <fog attach="fog" args={['#050510', 30, 100]} />
      </Canvas>
    </div>
  );
}