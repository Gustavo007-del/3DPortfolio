"use client"
import { useRef, useEffect, createContext, useContext } from "react"
import { useGLTF, useAnimations } from "@react-three/drei"
import * as THREE from "three"

// Animation context for programmatic control
const AnimationContext = createContext<{
  playAnimation: (name: string, options?: AnimationOptions) => void
  pauseAnimation: () => void
  setAnimationSpeed: (speed: number) => void
  getCurrentAnimation: () => string
} | null>(null)

export type AnimationOptions = {
  loop?: boolean
  speed?: number
  fadeIn?: number
  crossfade?: boolean
}

export function AnimationProvider({ children, ...props }: { children: React.ReactNode } & any) {
  const groupRef = useRef<THREE.Group>(null!)
  const gltf = useGLTF("/models/avatar.glb")
  const { scene, animations } = gltf
  const { actions } = useAnimations(animations, scene)
  
  const currentAnimationRef = useRef<string>("idle")
  const currentActionRef = useRef<any>(null)
  
  // Check for loading errors
  if (!scene) {
    console.error("Failed to load avatar model")
    return (
      <mesh>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
    )
  }

  const playAnimation = (name: string, options: AnimationOptions = {}) => {
    if (!actions || !actions[name]) {
      console.warn(`Animation "${name}" not found. Available:`, Object.keys(actions || {}))
      return
    }

    const {
      loop = true,
      speed = 1.0,
      fadeIn = 0.5,
      crossfade = true
    } = options

    // Stop current animation with crossfade
    if (currentActionRef.current && crossfade) {
      currentActionRef.current.fadeOut(fadeIn)
    }

    // Play new animation
    const newAction = actions[name]
    newAction.reset()
    newAction.setEffectiveTimeScale(speed)
    newAction.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity)
    
    if (crossfade && currentActionRef.current) {
      newAction.fadeIn(fadeIn).play()
    } else {
      newAction.play()
    }

    currentActionRef.current = newAction
    currentAnimationRef.current = name
    
    console.log(`🎬 Animation: ${name} | Speed: ${speed}x | Loop: ${loop}`)
  }

  const pauseAnimation = () => {
    if (currentActionRef.current) {
      currentActionRef.current.paused = true
    }
  }

  const setAnimationSpeed = (speed: number) => {
    if (currentActionRef.current) {
      currentActionRef.current.setEffectiveTimeScale(speed)
    }
  }

  const getCurrentAnimation = () => currentAnimationRef.current

  // Auto-play first animation on load
  useEffect(() => {
    if (animations && animations.length > 0) {
      // If it's Call_Me_Clean, play it at slow speed
      if (animations[0].name === "Call_Me_Clean") {
        playAnimation(animations[0].name, { loop: false, speed: 0.8 })
      } else {
        playAnimation(animations[0].name)
      }
    }
  }, [animations])

  return (
    <AnimationContext.Provider value={{
      playAnimation,
      pauseAnimation,
      setAnimationSpeed,
      getCurrentAnimation
    }}>
      <group ref={groupRef} {...props} dispose={null}>
        <primitive object={scene} />
        {children}
      </group>
    </AnimationContext.Provider>
  )
}

export function useAnimation() {
  const context = useContext(AnimationContext)
  if (!context) {
    throw new Error("useAnimation must be used within AnimationProvider")
  }
  return context
}

// Hook to get available animations from the GLB file
export function useAvailableAnimations() {
  const gltf = useGLTF("/models/avatar.glb")
  const { animations } = gltf
  
  return animations.map(anim => anim.name)
}

// Main Avatar Component
export default function Avatar(props: any) {
  return (
    <AnimationProvider {...props}>
      <group />
    </AnimationProvider>
  )
}
