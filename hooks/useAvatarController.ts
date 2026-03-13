"use client"
import { useEffect } from "react"
import { useAnimation } from "../components/Avatar"

// Hook for controlling animations programmatically
export function useAvatarController() {
  const { playAnimation, pauseAnimation, setAnimationSpeed, getCurrentAnimation } = useAnimation()

  return {
    // Play specific animations with options
    playIdle: () => playAnimation("idle", { loop: true, speed: 1.0 }),
    playWalk: () => playAnimation("walk", { loop: true, speed: 1.0 }),
    playRun: () => playAnimation("run", { loop: true, speed: 1.2 }),
    playWave: () => playAnimation("wave", { loop: false, speed: 1.0 }),
    playDance: () => playAnimation("dance", { loop: true, speed: 1.0 }),
    
    // Custom animation control
    playAnimation,
    pauseAnimation,
    setAnimationSpeed,
    getCurrentAnimation,
    
    // Debug function to list available animations
    getAvailableAnimations: () => {
      // This will be implemented to show what animations are actually in the GLB file
      console.log("Checking available animations...")
      return ["idle", "walk", "run", "wave", "dance"] // Common placeholder - actual list will come from GLB
    },
    
    // Preset scenarios
    greet: () => {
      playAnimation("wave", { loop: false, fadeIn: 0.3 })
      setTimeout(() => playAnimation("idle"), 2000)
    },
    
    celebrate: () => {
      playAnimation("dance", { loop: true, speed: 1.5 })
      setTimeout(() => setAnimationSpeed(1.0), 3000)
    },
    
    walkThenStop: () => {
      playAnimation("walk", { loop: true, speed: 1.0 })
      setTimeout(() => playAnimation("idle"), 5000)
    }
  }
}
