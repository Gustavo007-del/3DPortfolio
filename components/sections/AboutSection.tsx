"use client"
import { motion } from "framer-motion"
import { useState, useEffect, useRef } from "react"

const lines = [
  "$ whoami",
  "> Shijil — Junior Full-Stack Developer",
  "$ cat skills.txt",
  "> Django · Next.js · React Native · PostgreSQL · Tailwind",
  "$ cat hobbies.txt",
  "> Building web apps · UI/UX · Movies · Problem Solving",
  "$ cat location.txt",
  "> Kanayannur, Kerala, India 🇮🇳",
  "$ status",
  "> Open to work · Available for freelance ✅",
  "$ _",
]

export default function AboutSection() {
  const [displayed, setDisplayed] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState(0)
  const [currentChar, setCurrentChar] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || currentLine >= lines.length) return
    if (currentChar < lines[currentLine].length) {
      const t = setTimeout(() => setCurrentChar(c => c + 1), 30)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setDisplayed(d => [...d, lines[currentLine]])
        setCurrentLine(l => l + 1)
        setCurrentChar(0)
      }, 300)
      return () => clearTimeout(t)
    }
  }, [visible, currentLine, currentChar])

  return (
    <section id="about" ref={ref} className="py-24 px-6 max-w-4xl mx-auto">
      <motion.h2
        className="text-4xl font-black text-center mb-12 bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      >
        About Me
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="bg-slate-900 border border-green-500/30 rounded-2xl p-6 font-mono text-sm shadow-2xl shadow-green-500/5"
      >
        {/* Terminal header */}
        <div className="flex gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-2 text-slate-500 text-xs">shijil@portfolio:~</span>
        </div>
        <div className="space-y-1">
          {displayed.map((line, i) => (
            <p key={i} className={line.startsWith("$") ? "text-green-400" : "text-slate-300"}>
              {line}
            </p>
          ))}
          {currentLine < lines.length && (
            <p className={lines[currentLine].startsWith("$") ? "text-green-400" : "text-slate-300"}>
              {lines[currentLine].slice(0, currentChar)}
              <span className="animate-pulse">█</span>
            </p>
          )}
        </div>
      </motion.div>
    </section>
  )
}
