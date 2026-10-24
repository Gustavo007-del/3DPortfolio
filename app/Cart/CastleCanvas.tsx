'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import CastleScene from './BullockCartScene'
import type { MutableRefObject } from 'react'
import type { JourneyMotion } from './ProjectsJourney'
import { ACESFilmicToneMapping } from 'three'

export default function CastleCanvas({ motion }: { motion: MutableRefObject<JourneyMotion> }) {
  return (
    <Canvas
      camera={{ position: [0, 16, -135], fov: 40 }}
      gl={{ alpha: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        background: '#243638',
      }}
    >
      <color attach="background" args={['#243638']} />
      <ambientLight intensity={0.35} color="#d9d3bf" />
      <hemisphereLight args={['#d4e3dc', '#444537', 1.25]} />
      <directionalLight position={[-35, 55, -45]} color="#ffe0ae" intensity={2.6} />
      <directionalLight position={[30, 20, 30]} color="#91b8bd" intensity={1.1} />

      <Suspense fallback={null}>
        <CastleScene motion={motion} />
      </Suspense>
    </Canvas>
  )
}
