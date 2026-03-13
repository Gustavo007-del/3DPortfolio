"use client"
import { motion } from "framer-motion"

const skills = [
  { name: "Django", level: 85, color: "from-green-500 to-emerald-400", icon: "🐍" },
  { name: "Next.js", level: 80, color: "from-white to-slate-300", icon: "▲" },
  { name: "React / React Native", level: 78, color: "from-cyan-400 to-blue-400", icon: "⚛️" },
  { name: "TypeScript", level: 72, color: "from-blue-500 to-blue-400", icon: "📘" },
  { name: "PostgreSQL / Supabase", level: 75, color: "from-sky-500 to-cyan-400", icon: "🗄️" },
  { name: "Tailwind CSS", level: 90, color: "from-teal-400 to-cyan-300", icon: "🎨" },
  { name: "Python", level: 82, color: "from-yellow-400 to-orange-400", icon: "🐍" },
  { name: "REST API", level: 80, color: "from-purple-500 to-pink-400", icon: "🔌" },
]

const techIcons = [
  { name: "Django", bg: "bg-green-900/50", text: "text-green-400", icon: "🐍" },
  { name: "Next.js", bg: "bg-white/10", text: "text-white", icon: "▲" },
  { name: "React", bg: "bg-cyan-900/50", text: "text-cyan-400", icon: "⚛️" },
  { name: "TypeScript", bg: "bg-blue-900/50", text: "text-blue-400", icon: "TS" },
  { name: "Python", bg: "bg-yellow-900/50", text: "text-yellow-400", icon: "🐍" },
  { name: "PostgreSQL", bg: "bg-sky-900/50", text: "text-sky-400", icon: "🐘" },
  { name: "Tailwind", bg: "bg-teal-900/50", text: "text-teal-400", icon: "💨" },
  { name: "Git", bg: "bg-orange-900/50", text: "text-orange-400", icon: "🌿" },
  { name: "Razorpay", bg: "bg-indigo-900/50", text: "text-indigo-400", icon: "💳" },
  { name: "Supabase", bg: "bg-emerald-900/50", text: "text-emerald-400", icon: "⚡" },
  { name: "Docker", bg: "bg-blue-900/50", text: "text-blue-300", icon: "🐳" },
  { name: "VS Code", bg: "bg-blue-900/50", text: "text-blue-400", icon: "💙" },
]

export default function SkillsSection() {
  return (
    <section id="skills" className="py-24 px-6 max-w-5xl mx-auto">
      <motion.h2
        className="text-4xl font-black text-center mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      >
        Skills
      </motion.h2>
      <p className="text-center text-slate-400 mb-16">Technologies I work with daily</p>

      {/* Skill bars */}
      <div className="grid md:grid-cols-2 gap-6 mb-20">
        {skills.map((s, i) => (
          <motion.div key={s.name}
            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }} viewport={{ once: true }}
            className="bg-slate-900 border border-white/5 rounded-2xl p-5"
          >
            <div className="flex justify-between mb-3">
              <span className="font-medium text-white flex gap-2 items-center">
                <span>{s.icon}</span> {s.name}
              </span>
              <span className="text-slate-400 text-sm">{s.level}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${s.color}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${s.level}%` }}
                transition={{ duration: 1.2, delay: i * 0.08, ease: "easeOut" }}
                viewport={{ once: true }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tech icon grid */}
      <motion.h3
        className="text-2xl font-bold text-center mb-8 text-slate-300"
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
      >
        Tech Stack
      </motion.h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {techIcons.map((t, i) => (
          <motion.div key={t.name}
            initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }} viewport={{ once: true }}
            whileHover={{ scale: 1.1, y: -4 }}
            className={`${t.bg} border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2 cursor-default`}
          >
            <span className="text-2xl">{t.icon}</span>
            <span className={`text-xs font-medium ${t.text}`}>{t.name}</span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
