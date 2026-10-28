import Link from "next/link";
import { projects } from "@/lib/portfolioData";
import ProjectArtwork from "./ProjectArtwork";
import styles from "./Projects.module.css";

export default function ProjectIndex() {
  const featured = projects.filter((project) => project.featured);
  const more = projects.filter((project) => !project.featured);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/">SHIJIL<span>.DEV</span></Link>
        <nav aria-label="Main navigation"><Link href="/">← Island</Link><a href="#featured-title">Featured work ↓</a></nav>
      </header>

      <section className={styles.hero}>
        <p className={styles.kicker}>SELECTED WORK · FULL-STACK / MOBILE / INTERACTIVE</p>
        <h1>Projects built<br /><em>to do useful things.</em></h1>
        <div className={styles.heroBottom}>
          <p>Production platforms, mobile products, and interactive worlds. A selection of work across full-stack and creative development.</p>
          <span>{String(projects.length).padStart(2, "0")} PROJECTS<br />SCROLL TO EXPLORE ↓</span>
        </div>
      </section>

      <section className={styles.featuredSection} aria-labelledby="featured-title">
        <div className={styles.sectionHead}><p className={styles.kicker}>THE HIGHLIGHTS</p><h2 id="featured-title">Featured projects</h2><span>01 — 03</span></div>
        <div className={styles.featuredGrid}>
          {featured.map((project, index) => (
            <article className={styles.featuredCard} key={project.slug}>
              <Link className={styles.artLink} href={`/projects/${project.slug}`} aria-label={`Read the ${project.title} case study`}>
                <ProjectArtwork project={project} />
                <span className={styles.cardNumber}>{String(index + 1).padStart(2, "0")}</span>
              </Link>
              <div className={styles.cardInfo}>
                <div><span className={styles.cardType}>{project.role} · {project.tags.join(" · ")}</span><h3><Link href={`/projects/${project.slug}`}>{project.title}</Link></h3></div>
                <Link className={styles.arrowLink} href={`/projects/${project.slug}`} aria-label={`View ${project.title} case study`}>↗</Link>
              </div>
              <p className={styles.outcome}>{project.outcome}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.moreSection} aria-labelledby="more-title">
        <div className={styles.sectionHead}><p className={styles.kicker}>MORE WORK</p><h2 id="more-title">Other projects</h2><span>{String(featured.length + 1).padStart(2, "0")} — {String(projects.length).padStart(2, "0")}</span></div>
        <div className={styles.projectList}>
          {more.map((project, index) => (
            <Link className={styles.listItem} href={`/projects/${project.slug}`} key={project.slug}>
              <span className={styles.listNumber}>{String(index + featured.length + 1).padStart(2, "0")}</span>
              <div className={styles.listArt}><ProjectArtwork project={project} compact /></div>
              <div className={styles.listCopy}><h3>{project.title}</h3><p>{project.role} · {project.outcome}</p><div>{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
              <span className={styles.listArrow}>↗</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className={styles.footer}><span>SHIJIL P · FULL-STACK DEVELOPER & CREATIVE TECHNOLOGIST</span><Link href="/">Return to the island ↑</Link></footer>
    </main>
  );
}
