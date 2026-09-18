'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import CastleScene from './BullockCartScene'

export default function CastleCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 16, -135], fov: 40 }}
      gl={{ alpha: true }}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: '#ffffff',
      }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />

      <Suspense fallback={null}>
        <CastleScene scrollRotations={1} />
      </Suspense>
    </Canvas>
  )
}