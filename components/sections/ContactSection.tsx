"use client"
import { motion } from "framer-motion"
import { useState } from "react"

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Replace with your EmailJS / API call here
    await new Promise(r => setTimeout(r, 1500))
    setSent(true)
    setLoading(false)
  }

  return (
    <section id="contact" className="py-24 px-6 max-w-2xl mx-auto">
      <motion.h2
        className="text-4xl font-black text-center mb-4 bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      >
        Contact
      </motion.h2>
      <p className="text-center text-slate-400 mb-12">Let's build something together</p>

      {sent ? (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center bg-green-500/10 border border-green-500/30 rounded-3xl p-12">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-green-400 mb-2">Message Sent!</h3>
          <p className="text-slate-400">I'll get back to you within 24 hours.</p>
        </motion.div>
      ) : (
        <motion.form onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-slate-900 border border-white/10 rounded-3xl p-8 space-y-5"
        >
          {[
            { label: "Name", key: "name", type: "text", placeholder: "Your name" },
            { label: "Email", key: "email", type: "email", placeholder: "your@email.com" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm text-slate-400 mb-2">{f.label}</label>
              <input
                type={f.type} placeholder={f.placeholder} required
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Message</label>
            <textarea rows={4} placeholder="What's on your mind?" required
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>
          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl font-semibold text-white disabled:opacity-50 transition-all"
          >
            {loading ? "Sending..." : "Send Message →"}
          </motion.button>

          {/* Resume download */}
          <motion.a href="/resume.pdf" download
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="block w-full py-4 border border-white/20 rounded-xl font-medium text-center text-slate-300 hover:bg-white/5 transition-all"
          >
            📄 Download Resume
          </motion.a>
        </motion.form>
      )}

      {/* Social links */}
      <motion.div
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="flex justify-center gap-6 mt-10"
      >
        {[
          { label: "GitHub", href: "https://github.com", icon: "🐙" },
          { label: "LinkedIn", href: "https://linkedin.com", icon: "💼" },
          { label: "Email", href: "mailto:shijil@email.com", icon: "📧" },
        ].map(s => (
          <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            {s.icon} {s.label}
          </a>
        ))}
      </motion.div>

      {/* Footer */}
      <p className="text-center text-slate-600 text-xs mt-16">
        Built with Next.js 16 · Three.js · Framer Motion · Tailwind · ❤️
      </p>
    </section>
  )
}
