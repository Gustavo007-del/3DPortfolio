"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const links = ["About", "Skills", "Projects", "Timeline", "Stats", "Contact"]

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [dark, setDark] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-slate-900/90 backdrop-blur-md shadow-lg shadow-black/30 border-b border-white/5" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <motion.span
          className="text-xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
          whileHover={{ scale: 1.05 }}
        >
          Shijil.dev
        </motion.span>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200 hover:underline underline-offset-4"
            >
              {l}
            </a>
          ))}
          <button
            onClick={() => setDark(d => !d)}
            className="ml-2 px-3 py-1.5 rounded-full border border-white/20 text-xs text-slate-300 hover:bg-white/10 transition-all"
          >
            {dark ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-white" onClick={() => setOpen(o => !o)}>
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-slate-900/95 px-6 pb-4 flex flex-col gap-4"
          >
            {links.map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)}
                className="text-slate-300 py-1 border-b border-white/5">
                {l}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
