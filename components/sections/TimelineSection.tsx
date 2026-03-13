"use client"
import { motion } from "framer-motion"

const events = [
  { year: "2022", title: "Started Coding Journey", desc: "Learned Python and built first Django projects.", icon: "🚀", color: "border-blue-500" },
  { year: "2023", title: "First Full-Stack App", desc: "Built a complete food management system with Django + PostgreSQL.", icon: "🍕", color: "border-green-500" },
  { year: "2024", title: "Django Internship", desc: "Joined as Django intern, built temple/event booking platform with Razorpay.", icon: "💼", color: "border-orange-500" },
  { year: "2024", title: "Learned React & Next.js", desc: "Expanded to modern frontend — Next.js, TypeScript, Tailwind, Framer Motion.", icon: "⚛️", color: "border-cyan-500" },
  { year: "2025", title: "React Native & Mobile", desc: "Started building cross-platform apps with React Native and Supabase.", icon: "📱", color: "border-purple-500" },
  { year: "2026", title: "3D Web Development", desc: "Building interactive 3D experiences with Three.js, R3F and Next.js 16.", icon: "🎮", color: "border-pink-500" },
]

export default function TimelineSection() {
  return (
    <section id="timeline" className="py-24 px-6 max-w-4xl mx-auto">
      <motion.h2
        className="text-4xl font-black text-center mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      >
        Journey
      </motion.h2>
      <p className="text-center text-slate-400 mb-16">My development timeline</p>

      <div className="relative">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-pink-500/50 -translate-x-1/2" />

        <div className="space-y-12">
          {events.map((e, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`flex ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"} items-center gap-8`}
            >
              <div className={`flex-1 ${i % 2 === 0 ? "text-right" : "text-left"}`}>
                <div className={`inline-block bg-slate-900 border ${e.color} rounded-2xl p-5 max-w-sm`}>
                  <div className="flex items-center gap-2 mb-2 flex-row">
                    <span className="text-2xl">{e.icon}</span>
                    <div>
                      <span className="text-xs text-slate-500 block">{e.year}</span>
                      <h3 className="font-bold text-white text-sm">{e.title}</h3>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{e.desc}</p>
                </div>
              </div>

              {/* Center dot */}
              <div className={`w-4 h-4 rounded-full border-2 ${e.color} bg-slate-900 flex-shrink-0 relative z-10`} />

              <div className="flex-1" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
