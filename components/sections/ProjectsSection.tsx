"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const projects = [
  {
    title: "Temple Event Management",
    desc: "Full-stack booking & event management platform with Razorpay payment integration and admin dashboard.",
    tags: ["Django", "PostgreSQL", "Razorpay", "Tailwind"],
    category: "fullstack",
    metrics: { stars: 12, commits: 87, users: "50+" },
    color: "from-orange-500/20 to-red-500/20",
    border: "border-orange-500/30",
    link: "#",
  },
  {
    title: "Movie Wishlist App",
    desc: "Interactive movie discovery and rating app with drag-and-drop wishlist and TMDB API integration.",
    tags: ["Django", "JavaScript", "TMDB API", "CSS"],
    category: "fullstack",
    metrics: { stars: 8, commits: 54, users: "20+" },
    color: "from-blue-500/20 to-purple-500/20",
    border: "border-blue-500/30",
    link: "#",
  },
  {
    title: "Birthday Interactive Site",
    desc: "Interactive birthday website with Three.js animations, candle game, parallax stars, and polaroid gallery.",
    tags: ["Next.js", "Three.js", "Framer Motion", "Tailwind"],
    category: "frontend",
    metrics: { stars: 24, commits: 63, users: "1" },
    color: "from-pink-500/20 to-rose-500/20",
    border: "border-pink-500/30",
    link: "#",
  },
  {
    title: "Food Management System",
    desc: "Restaurant food ordering and management system with real-time order tracking and admin panel.",
    tags: ["Django", "PostgreSQL", "Tailwind", "JS"],
    category: "fullstack",
    metrics: { stars: 6, commits: 45, users: "30+" },
    color: "from-green-500/20 to-teal-500/20",
    border: "border-green-500/30",
    link: "#",
  },
  {
    title: "Portfolio Website (This!)",
    desc: "3D interactive developer portfolio with avatar, animations, and responsive UI built with Next.js 16.",
    tags: ["Next.js", "R3F", "Three.js", "Framer Motion"],
    category: "frontend",
    metrics: { stars: 31, commits: 92, users: "∞" },
    color: "from-purple-500/20 to-indigo-500/20",
    border: "border-purple-500/30",
    link: "#",
  },
]

const filters = ["all", "fullstack", "frontend"]

export default function ProjectsSection() {
  const [active, setActive] = useState("all")
  const filtered = active === "all" ? projects : projects.filter(p => p.category === active)

  return (
    <section id="projects" className="py-24 px-6 max-w-6xl mx-auto">
      <motion.h2
        className="text-4xl font-black text-center mb-4 bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      >
        Projects
      </motion.h2>
      <p className="text-center text-slate-400 mb-10">Things I've built</p>

      {/* Filter tabs */}
      <div className="flex justify-center gap-3 mb-12">
        {filters.map(f => (
          <button key={f} onClick={() => setActive(f)}
            className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-all ${active === f ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Project grid */}
      <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filtered.map((p, i) => (
            <motion.div key={p.title} layout
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.07 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`bg-gradient-to-br ${p.color} border ${p.border} rounded-2xl p-6 flex flex-col gap-4 cursor-pointer group`}
            >
              <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">{p.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
              <div className="flex flex-wrap gap-2">
                {p.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 text-xs bg-white/10 rounded-full text-slate-300">{t}</span>
                ))}
              </div>
              {/* Metrics */}
              <div className="flex gap-4 pt-2 border-t border-white/10 text-xs text-slate-400">
                <span>⭐ {p.metrics.stars}</span>
                <span>📦 {p.metrics.commits} commits</span>
                <span>👥 {p.metrics.users}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}
