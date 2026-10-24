import ProjectsJourney from './ProjectsJourney'
import { projects } from '@/lib/portfolioData'

export default function Page() {
  return (
    <ProjectsJourney projects={projects.filter(project => project.title !== '3D Island Portfolio')} />
  )
}
