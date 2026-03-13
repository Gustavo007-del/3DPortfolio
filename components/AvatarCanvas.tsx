"use client"
import { Suspense, useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import Avatar from "./Avatar"
import AnimationDebugger from "./AnimationDebugger"
import { currentColor } from "../config/colors"
import { motion } from "framer-motion"

export default function AvatarCanvas() {
  const [isHovered, setIsHovered] = useState(false)
  const [messages, setMessages] = useState<{ id: string; text: string; timestamp: number }[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Clean up old messages after 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setMessages(prev => prev.filter(msg => now - msg.timestamp < 5000))
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: inputValue.trim(),
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, newMessage])
      setInputValue("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitMessage(e as any)
    }
  }
  
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
          <Avatar 
            scale={isMobile ? 0.6 : 0.9} 
            position={isMobile ? [0.3, -0.6, 0] : [1.4, -0.8, 0]} 
            rotation={[0, isMobile ? -Math.PI / 12 : -Math.PI / 4, 0]} 
          />
        </Suspense>
      </Canvas>
      
      {/* Center message display area */}
      <div 
        style={{ 
          position: "absolute", 
          top: "50%", 
          left: "50%", 
          transform: "translate(-50%, -50%)", 
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          pointerEvents: "none"
        }}
      >
        {messages.map((message) => {
          const age = Date.now() - message.timestamp
          const fadeStart = 3500 // Start fading at 3.5 seconds
          const opacity = age > fadeStart ? 1 - ((age - fadeStart) / 1500) : 1
          
          return (
            <div key={message.id} style={{ display: "flex", alignItems: "center" }}>
              {/* Decorative line on the left side of message */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{
                  width: "2px",
                  height: "40px",
                  background: "linear-gradient(180deg, transparent, #a78bfa, transparent)",
                  marginRight: "15px",
                  flexShrink: 0
                }}
              />
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: opacity, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "16px",
                  background: "rgba(167, 139, 250, 0.2)",
                  border: "2px solid rgba(167, 139, 250, 0.4)",
                  color: "#f3e8ff",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  wordBreak: "break-word",
                  backdropFilter: "blur(15px)",
                  boxShadow: "0 8px 20px rgba(167, 139, 250, 0.3)",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  width: "auto"
                }}
              >
                {message.text}
              </motion.div>
            </div>
          )
        })}
      </div>
      
      {/* Debug overlay */}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 1000 }}>
        <AnimationDebugger />
      </div>
      
      {/* Left side UI overlay */}
      <div 
        style={{ 
          position: "absolute", 
          left: isMobile ? 10 : 40, 
          top: "50%", 
          transform: "translateY(-50%)", 
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: isMobile ? "15px" : "20px"
        }}
      >
        
        {/* Message input */}
        <form onSubmit={handleSubmitMessage} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder="Type a message..."
            style={{
              padding: "10px 14px",
              borderRadius: "20px",
              border: isInputFocused ? "2px solid #a78bfa" : "1px solid rgba(167, 139, 250, 0.3)",
              background: "rgba(167, 139, 250, 0.05)",
              color: "#e9d5ff",
              fontSize: "0.9rem",
              outline: "none",
              width: "200px",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease"
            }}
          />
        </form>

        {/* Cool text overlay */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{
            fontSize: "1.2rem",
            fontWeight: "600",
            color: "#a78bfa",
            textShadow: "0 0 20px rgba(167, 139, 250, 0.5)",
            fontFamily: "monospace"
          }}
        >
          how is this kochu
        </motion.div>
        
        {/* Cool floating elements */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 10px 30px rgba(102, 126, 234, 0.4)"
          }}
        >
          <motion.div
            animate={{ rotate: isHovered ? 360 : 0 }}
            transition={{ duration: 0.5 }}
            style={{
              fontSize: "24px",
              color: "white"
            }}
          >
            ✨
          </motion.div>
        </motion.div>
        
        {/* Status indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 16px",
            borderRadius: "20px",
            background: "rgba(167, 139, 250, 0.1)",
            border: "1px solid rgba(167, 139, 250, 0.3)",
            backdropFilter: "blur(10px)"
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#10b981"
            }}
          />
          <span style={{ fontSize: "0.9rem", color: "#a78bfa" }}>Online</span>
        </motion.div>
        
              </div>
    </>
  )
}
