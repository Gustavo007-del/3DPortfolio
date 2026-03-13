"use client"
import { useState, useEffect } from "react"
import { useAvailableAnimations } from "./Avatar"

export default function AnimationDebugger() {
  const [isVisible, setIsVisible] = useState(false)
  const availableAnimations = useAvailableAnimations()

  // Toggle visibility with keyboard shortcut (Ctrl/Cmd + D)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        setIsVisible(prev => !prev)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (!isVisible) {
    // Small toggle button when hidden
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: "fixed",
          bottom: 23,
          left: 65,
          zIndex: 1000,
          padding: "4px 8px",
          fontSize: "12px",
          backgroundColor: "rgba(0,0,0,0.7)",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
        title="Show Debug (Ctrl/Cmd + D)"
      >
        🐛
      </button>
    )
  }

  return (
    <div style={{ position: "fixed", bottom: 20, left: 20, zIndex: 1000 }}>
      <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg max-w-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold">Animation Debugger</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700 text-sm"
            title="Hide (Ctrl/Cmd + D)"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-3">
          <p className="font-semibold text-sm">Available Animations ({availableAnimations.length}):</p>
          <ul className="list-disc list-inside text-xs max-h-32 overflow-y-auto">
            {availableAnimations.map(name => (
              <li key={name} className={name.toLowerCase().includes("call") || name.toLowerCase().includes("clean") ? "text-green-600 font-bold" : ""}>
                {name}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          {availableAnimations.some(name => name.toLowerCase().includes("call") || name.toLowerCase().includes("clean")) ? (
            <p className="text-green-600 text-xs">✅ Found Call/Clean related animation!</p>
          ) : (
            <p className="text-red-600 text-xs">❌ No Call/Clean animation found</p>
          )}
          
          <p className="text-xs text-gray-600">
            Press Ctrl/Cmd + D to toggle
          </p>
        </div>
      </div>
    </div>
  )
}
