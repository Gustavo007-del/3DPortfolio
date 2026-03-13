import HeroSection from "../components/HeroSection"
import { currentColor } from "../config/colors"
import AboutSection from "../components/sections/AboutSection"
import SkillsSection from "../components/sections/SkillsSection"
import ProjectsSection from "../components/sections/ProjectsSection"
import TimelineSection from "../components/sections/TimelineSection"
import StatsSection from "../components/sections/StatsSection"
import TestimonialsSection from "../components/sections/TestimonialsSection"
import ContactSection from "../components/sections/ContactSection"
import NavBar from "../components/NavBar"

export default function Home() {
  return (
    <main className="text-white" style={{ backgroundColor: currentColor }}>
      <NavBar />
      <HeroSection />
      <AboutSection />
      <SkillsSection />
      <ProjectsSection />
      <TimelineSection />
      <StatsSection />
      <TestimonialsSection />
      <ContactSection />
    </main>
  )
}
