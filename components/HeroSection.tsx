"use client"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { currentColor } from "../config/colors"

// Critical fix for Next.js 16 + R3F: never SSR the 3D canvas
const AvatarCanvas = dynamic(() => import("./AvatarCanvas"), {
  ssr: false,
  loading: () => (
    <div style={{ position: "absolute", inset: 0, background: currentColor }} />
  ),
})

export default function HeroSection() {
  return (
    <section
      style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}
    >
      {/* === 3D CANVAS (client only) === */}
      <AvatarCanvas />
    </section>
  )
}
