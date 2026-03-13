"use client"
import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import Avatar from "./Avatar"
import AnimationDebugger from "./AnimationDebugger"
import { currentColor } from "../config/colors"

export default function AvatarCanvas() {
  return (
    <>
      <Canvas
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        camera={{ position: [0, 0, 3.5], fov: 35 }}
      >
        <color attach="background" args={["#1a1a1a"]} />
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        <pointLight position={[0, 2, 2]} intensity={0.6} color="#a78bfa" />
        <Suspense fallback={null}>
          <Avatar scale={0.9} position={[1.4, -0.8, 0]} rotation={[0, -Math.PI / 4, 0]} />
        </Suspense>
      </Canvas>
      
      {/* Debug overlay */}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 1000 }}>
        <AnimationDebugger />
      </div>
    </>
  )
}
