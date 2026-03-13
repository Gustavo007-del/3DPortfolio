"use client"
import { motion } from "framer-motion"
import { useState } from "react"

const testimonials = [
  {
    name: "Mentor / Senior Dev",
    role: "Django Internship",
    text: "Shijil picked up Django and REST APIs incredibly fast. His attention to detail in backend logic and database design is impressive for a junior developer.",
    avatar: "👨‍💻",
    stars: 5,
  },
  {
    name: "Team Lead",
    role: "Project Collaboration",
    text: "Clean code, good communication, and always asks the right questions. Shijil's UI implementations with Tailwind are pixel-perfect.",
    avatar: "👩‍💼",
    stars: 5,
  },
  {
    name: "Client",
    role: "Booking Platform Project",
    text: "The payment integration and admin dashboard worked flawlessly from day one. Very professional delivery.",
    avatar: "🧑‍🦱",
    stars: 5,
  },
]

export default function TestimonialsSection() {
  const [active, setActive] = useState(0)

  return (
    <section className="py-24 px-6 max-w-4xl mx-auto">
      <motion.h2
        className="text-4xl font-black text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      >
        Testimonials
      </motion.h2>
      <p className="text-center text-slate-400 mb-16">What people say</p>

      <div className="relative">
        <motion.div
          key={active}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="bg-slate-900 border border-purple-500/20 rounded-3xl p-8 md:p-12 text-center"
        >
          <div className="text-5xl mb-6">{testimonials[active].avatar}</div>
          <div className="flex justify-center gap-1 mb-6">
            {Array(testimonials[active].stars).fill(0).map((_, i) => (
              <span key={i} className="text-yellow-400 text-lg">★</span>
            ))}
          </div>
          <p className="text-slate-300 text-lg leading-relaxed mb-8 italic">
            "{testimonials[active].text}"
          </p>
          <div>
            <p className="text-white font-bold">{testimonials[active].name}</p>
            <p className="text-slate-500 text-sm">{testimonials[active].role}</p>
          </div>
        </motion.div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`w-2 h-2 rounded-full transition-all ${active === i ? "bg-purple-400 w-6" : "bg-slate-600"}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
