"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

const demoProjects = [
  {
    id: 1,
    title: "CloudSync Pro",
    desc: "Real-time cloud collaboration platform with live document editing, team workspaces, and version history.",
    tags: ["React", "Node.js", "WebSocket", "MongoDB"],
    category: "fullstack",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    metrics: { stars: 234, forks: 45, users: "1.2k+" },
    gradient: "from-blue-500 to-cyan-500",
    borderColor: "border-cyan-500/30",
    link: "#",
  },
  {
    id: 2,
    title: "PixelForge AI",
    desc: "AI-powered image generation and editing tool with style transfer, background removal, and batch processing.",
    tags: ["Python", "TensorFlow", "FastAPI", "React"],
    category: "ai",
    image: "https://images.unsplash.com/photo-1676299081847-824916de030a?w=600&h=400&fit=crop",
    metrics: { stars: 892, forks: 123, users: "5k+" },
    gradient: "from-purple-500 to-pink-500",
    borderColor: "border-purple-500/30",
    link: "#",
  },
  {
    id: 3,
    title: "DevTrack Dashboard",
    desc: "Developer productivity dashboard with GitHub analytics, sprint tracking, and team performance metrics.",
    tags: ["Next.js", "TypeScript", "Chart.js", "Prisma"],
    category: "frontend",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
    metrics: { stars: 156, forks: 28, users: "800+" },
    gradient: "from-orange-500 to-red-500",
    borderColor: "border-orange-500/30",
    link: "#",
  },
  {
    id: 4,
    title: "SwiftCart",
    desc: "Modern e-commerce platform with AR product preview, smart recommendations, and one-click checkout.",
    tags: ["Next.js", "Stripe", "PostgreSQL", "Redis"],
    category: "fullstack",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
    metrics: { stars: 312, forks: 67, users: "2.5k+" },
    gradient: "from-green-500 to-emerald-500",
    borderColor: "border-green-500/30",
    link: "#",
  },
  {
    id: 5,
    title: "NeuralChat",
    desc: "AI chatbot with context-aware conversations, code generation, and multi-language support.",
    tags: ["React", "OpenAI", "Node.js", "Socket.io"],
    category: "ai",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop",
    metrics: { stars: 567, forks: 89, users: "3k+" },
    gradient: "from-violet-500 to-indigo-500",
    borderColor: "border-violet-500/30",
    link: "#",
  },
  {
    id: 6,
    title: "FitQuest",
    desc: "Gamified fitness app with workout tracking, social challenges, and AI coaching.",
    tags: ["React Native", "Firebase", "Node.js", "MongoDB"],
    category: "mobile",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop",
    metrics: { stars: 198, forks: 34, users: "1.5k+" },
    gradient: "from-rose-500 to-orange-500",
    borderColor: "border-rose-500/30",
    link: "#",
  },
  {
    id: 7,
    title: "CodeMentor",
    desc: "Live code collaboration platform with real-time pair programming, code review, and mentorship matching.",
    tags: ["WebRTC", "React", "Express", "Docker"],
    category: "fullstack",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop",
    metrics: { stars: 276, forks: 52, users: "900+" },
    gradient: "from-amber-500 to-yellow-500",
    borderColor: "border-amber-500/30",
    link: "#",
  },
  {
    id: 8,
    title: "SmartHome Hub",
    desc: "IoT smart home dashboard with device automation, energy monitoring, and voice control integration.",
    tags: ["Vue.js", "Python", "MQTT", "InfluxDB"],
    category: "iot",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop",
    metrics: { stars: 145, forks: 23, users: "600+" },
    gradient: "from-teal-500 to-blue-500",
    borderColor: "border-teal-500/30",
    link: "#",
  },
  {
    id: 9,
    title: "ArtVault",
    desc: "NFT marketplace with 3D gallery viewing, auction system, and creator royalty management.",
    tags: ["Three.js", "Solidity", "Next.js", "IPFS"],
    category: "blockchain",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop",
    metrics: { stars: 423, forks: 78, users: "4k+" },
    gradient: "from-fuchsia-500 to-purple-500",
    borderColor: "border-fuchsia-500/30",
    link: "#",
  },
]

const filters = ["all", "fullstack", "frontend", "ai", "mobile", "blockchain", "iot"]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
} as const

export default function ProjectsPage() {
  const [active, setActive] = useState("all")
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const filtered = active === "all" ? demoProjects : demoProjects.filter(p => p.category === active)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Back to Portfolio
          </Link>
          <h1 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            My Projects
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            A collection of projects I&apos;ve built — from full-stack apps to AI tools. Each one taught me something new.
          </p>
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-14"
        >
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium capitalize transition-all duration-300 ${
                active === f
                  ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-purple-500/25 scale-105"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-white/5"
              }`}
            >
              {f}
            </button>
          ))}
        </motion.div>

        {/* Projects grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filtered.map((project) => (
              <motion.div
                key={project.id}
                variants={itemVariants}
                onHoverStart={() => setHoveredId(project.id)}
                onHoverEnd={() => setHoveredId(null)}
                className="group relative"
              >
                <div
                  className={`relative bg-slate-900/50 backdrop-blur-sm border ${project.borderColor} rounded-3xl overflow-hidden transition-all duration-500 ${
                    hoveredId === project.id ? "scale-[1.03] shadow-2xl" : "shadow-lg"
                  }`}
                >
                  {/* Project image */}
                  <div className="relative h-48 overflow-hidden">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-20`}
                    />
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

                    {/* Category badge */}
                    <span className="absolute top-4 right-4 px-3 py-1 text-xs font-semibold bg-black/40 backdrop-blur-md text-white rounded-full border border-white/10 capitalize">
                      {project.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
                      {project.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-5 line-clamp-2">
                      {project.desc}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 text-xs bg-white/5 border border-white/10 rounded-lg text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Metrics bar */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-400">★</span> {project.metrics.stars}
                        </span>
                        <span>⑂ {project.metrics.forks}</span>
                        <span>👥 {project.metrics.users}</span>
                      </div>
                      <span className="text-xs font-medium text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        View →
                      </span>
                    </div>
                  </div>

                  {/* Hover glow effect */}
                  <div
                    className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${project.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty state */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-slate-500 text-lg">No projects in this category yet.</p>
          </motion.div>
        )}

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mt-24 mb-12"
        >
          <p className="text-slate-500 text-sm mb-4">Want to see more?</p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            View on GitHub
          </a>
        </motion.div>
      </div>
    </div>
  )
}
