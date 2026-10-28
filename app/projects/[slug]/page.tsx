import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectArtwork from "@/components/Projects/ProjectArtwork";
import { projects } from "@/lib/portfolioData";
import styles from "@/components/Projects/Projects.module.css";

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) return { title: "Project not found | Shijil P" };
  return { title: `${project.title} | Shijil P`, description: project.outcome };
}

export default async function ProjectCaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const projectIndex = projects.findIndex((item) => item.slug === slug);
  const project = projects[projectIndex];
  if (!project) notFound();
  const nextProject = projects[(projectIndex + 1) % projects.length];

  return (
    <main className={`${styles.page} ${styles.casePage}`}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/">SHIJIL<span>.DEV</span></Link>
        <nav aria-label="Project navigation"><Link href="/projects">All projects</Link><Link href="/">Island ↗</Link></nav>
      </header>
      <article>
        <section className={styles.caseHero}>
          <p className={styles.kicker}>PROJECT {String(projectIndex + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")} · CASE STUDY</p>
          <h1>{project.title}</h1>
          <p className={styles.caseLead}>{project.description}</p>
          <div className={styles.caseTags}>{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <div className={styles.caseArtwork}><ProjectArtwork project={project} /></div>
        </section>

        <section className={styles.caseBody}>
          <div className={styles.caseOverview}>
            <div><p className={styles.kicker}>OVERVIEW</p><h2>What it does</h2><p>{project.caseStudy}</p></div>
            <dl>
              <div><dt>ROLE</dt><dd>{project.role}</dd></div>
              <div><dt>STACK</dt><dd>{project.tags.join(" · ")}</dd></div>
              <div><dt>OUTCOME</dt><dd>{project.outcome}</dd></div>
              <div><dt>CONTEXT</dt><dd>{project.coordinates}</dd></div>
            </dl>
          </div>
          <div className={styles.caseHighlights}>
            <p className={styles.kicker}>WHAT I BUILT</p>
            <ul>{project.highlights.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className={styles.caseLinks}>
            <p className={styles.kicker}>PROJECT LINKS</p>
            <div>
              {project.link && <a href={project.link} target="_blank" rel="noreferrer">Open live project ↗</a>}
              {project.sourceLink && <a href={project.sourceLink} target="_blank" rel="noreferrer">View source code ↗</a>}
              {!project.link && !project.sourceLink && <span>Live and source links are not available in this project yet.</span>}
            </div>
          </div>
        </section>
      </article>
      <footer className={styles.caseFooter}>
        <Link href="/projects">← All projects</Link>
        <Link href={`/projects/${nextProject.slug}`}>Next: {nextProject.title} ↗</Link>
      </footer>
    </main>
  );
}
