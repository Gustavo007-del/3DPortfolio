"use client"
import { motion, useMotionValue, useSpring, useInView } from "framer-motion"
import { useEffect, useRef } from "react"

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const count = useMotionValue(0)
  const rounded = useSpring(count, { stiffness: 80, damping: 20 })

  useEffect(() => {
    if (inView) count.set(to)
  }, [inView, to, count])

  useEffect(() => rounded.on("change", v => {
    if (ref.current) ref.current.textContent = Math.round(v) + suffix
  }), [rounded, suffix])

  return <span ref={ref}>0{suffix}</span>
}

const stats = [
  { label: "Projects Built", value: 10, suffix: "+", icon: "🏗️", color: "from-blue-500/20 to-blue-600/20", border: "border-blue-500/30" },
  { label: "GitHub Commits", value: 400, suffix: "+", icon: "📦", color: "from-green-500/20 to-green-600/20", border: "border-green-500/30" },
  { label: "Technologies", value: 15, suffix: "+", icon: "⚡", color: "from-yellow-500/20 to-orange-500/20", border: "border-yellow-500/30" },
  { label: "Months Experience", value: 18, suffix: "", icon: "📅", color: "from-purple-500/20 to-pink-500/20", border: "border-purple-500/30" },
  { label: "APIs Integrated", value: 8, suffix: "+", icon: "🔌", color: "from-cyan-500/20 to-blue-500/20", border: "border-cyan-500/30" },
  { label: "Lines of Code", value: 25, suffix: "k+", icon: "💻", color: "from-rose-500/20 to-pink-500/20", border: "border-rose-500/30" },
]

export default function StatsSection() {
  return (
    <section id="stats" className="py-24 px-6 max-w-5xl mx-auto">
      <motion.h2
        className="text-4xl font-black text-center mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      >
        By The Numbers
      </motion.h2>
      <p className="text-center text-slate-400 mb-16">Coding stats & achievements</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {stats.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }} viewport={{ once: true }}
            whileHover={{ scale: 1.05, y: -4 }}
            className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-6 text-center`}
          >
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-4xl font-black text-white mb-1">
              <Counter to={s.value} suffix={s.suffix} />
            </div>
            <div className="text-slate-400 text-sm">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
