// Example usage component showing how to control animations programmatically
"use client"
import { useEffect } from "react"
import { useAvatarController } from "../hooks/useAvatarController"

export default function ExampleAnimationScenarios() {
  const { playIdle, playWalk, playWave, greet, celebrate, walkThenStop } = useAvatarController()

  // Example 1: Greet user on page load
  useEffect(() => {
    setTimeout(() => greet(), 1000) // Wait 1 second, then wave
  }, [])

  // Example 2: Celebrate on user action
  const handleSuccess = () => {
    celebrate()
  }

  // Example 3: Walk animation
  const handleWalk = () => {
    walkThenStop()
  }

  // Example 4: Time-based animations
  useEffect(() => {
    const hour = new Date().getHours()
    
    // Different animations based on time of day
    if (hour < 12) {
      playIdle() // Morning: calm
    } else if (hour < 18) {
      playWalk() // Afternoon: active
    } else {
      greet() // Evening: friendly
    }
  }, [])

  return (
    <div className="fixed bottom-4 left-4 space-x-2">
      <button onClick={handleSuccess} className="bg-green-500 text-white px-4 py-2 rounded">
        Celebrate 🎉
      </button>
      <button onClick={handleWalk} className="bg-blue-500 text-white px-4 py-2 rounded">
        Walk 🚶
      </button>
      <button onClick={greet} className="bg-purple-500 text-white px-4 py-2 rounded">
        Wave 👋
      </button>
    </div>
  )
}
