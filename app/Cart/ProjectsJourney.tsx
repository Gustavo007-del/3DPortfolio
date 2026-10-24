"use client"

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Project } from '@/lib/portfolioData'
import CastleCanvas from './CastleCanvas'
import styles from './ProjectsJourney.module.css'

export type JourneyMotion = { progress: number; moving: boolean }
type Phase = 'intro' | 'closing' | 'travel' | 'reading'
const palettes = ['#dfad68', '#8db8ff', '#a5ce91', '#e69ab0', '#b7a0ee', '#e9b680']
const symbols = ['✦', 'T', '↗', '▶', 'E', '✺']
const categories = ['Devotion, connected.', 'Made for the everyday.', 'Rooted in possibility.', 'A seat to the story.', 'Bring people together.', 'A place. A tradition.']
const number = (n: number) => String(n).padStart(2, '0')

export default function ProjectsJourney({ projects }: { projects: Project[] }) {
  const motion = useRef<JourneyMotion>({ progress: 0, moving: false })
  const stage = useRef<HTMLElement>(null)
  const [index, setIndex] = useState(-1)
  const [phase, setPhase] = useState<Phase>('intro')
  const indexRef = useRef(-1)
  const busy = useRef(false)
  const frame = useRef(0)
  const reduced = useRef(false)
  const lastWheel = useRef(0)
  const mounted = useRef(true)

  const go = useCallback((target: number) => {
    if (busy.current || target < -1 || target >= projects.length || target === indexRef.current) return
    busy.current = true
    const from = motion.current.progress
    const to = (target + 1) / projects.length
    const closing = indexRef.current >= 0 && !reduced.current ? 340 : 0
    const duration = reduced.current ? 0 : 1800
    const started = performance.now()
    setPhase(closing ? 'closing' : 'travel')
    const tick = (now: number) => {
      if (!mounted.current) return
      const elapsed = now - started - closing
      if (elapsed < 0) { frame.current = requestAnimationFrame(tick); return }
      const t = duration ? Math.min(elapsed / duration, 1) : 1
      // A single exact timeline drives both the world and the card reveal.
      const eased = t * t * (3 - 2 * t)
      motion.current = { progress: from + (to - from) * eased, moving: t < 1 }
      setPhase('travel')
      if (t < 1) frame.current = requestAnimationFrame(tick)
      else {
        indexRef.current = target
        setIndex(target)
        setPhase(target < 0 ? 'intro' : 'reading')
        busy.current = false
      }
    }
    frame.current = requestAnimationFrame(tick)
  }, [projects.length])

  useEffect(() => {
    mounted.current = true
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { reduced.current = media.matches }
    update()
    media.addEventListener('change', update)
    const element = stage.current!
    let accumulated = 0
    let touchY = 0
    let touchWasReading = false
    const canReadScroll = (target: EventTarget | null, direction: number) => {
      const reader = (target as HTMLElement)?.closest('[data-reader]') as HTMLElement | null
      return reader && (direction > 0 ? reader.scrollTop + reader.clientHeight < reader.scrollHeight - 2 : reader.scrollTop > 2)
    }
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      if (canReadScroll(event.target, event.deltaY)) return
      event.preventDefault()
      const now = performance.now()
      const gap = now - lastWheel.current
      lastWheel.current = now
      if (busy.current) { accumulated = 0; return }
      // Require a fresh gesture after arrival, ignoring trackpad momentum.
      if (gap > 180) accumulated = 0
      else if (!accumulated) return
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1)
      if (Math.sign(delta) !== Math.sign(accumulated)) accumulated = 0
      accumulated += delta
      if (Math.abs(accumulated) >= 35) {
        go(indexRef.current + Math.sign(accumulated))
        accumulated = 0
      }
    }
    const start = (event: TouchEvent) => {
      touchY = event.changedTouches[0].clientY
      const reader = (event.target as HTMLElement).closest('[data-reader]') as HTMLElement | null
      touchWasReading = Boolean(reader && reader.scrollHeight > reader.clientHeight + 2)
    }
    const end = (event: TouchEvent) => {
      const delta = touchY - event.changedTouches[0].clientY
      if (!touchWasReading && Math.abs(delta) > 55 && !canReadScroll(event.target, delta)) go(indexRef.current + Math.sign(delta))
    }
    const key = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest('button, a, input, textarea, select')) return
      const direction = ['ArrowDown', 'PageDown', ' '].includes(event.key) ? 1 : ['ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0
      if (direction && !canReadScroll(event.target, direction)) { event.preventDefault(); go(indexRef.current + direction) }
    }
    element.addEventListener('wheel', wheel, { passive: false })
    element.addEventListener('touchstart', start, { passive: true })
    element.addEventListener('touchend', end, { passive: true })
    window.addEventListener('keydown', key)
    return () => {
      mounted.current = false
      cancelAnimationFrame(frame.current)
      media.removeEventListener('change', update)
      element.removeEventListener('wheel', wheel)
      element.removeEventListener('touchstart', start)
      element.removeEventListener('touchend', end)
      window.removeEventListener('keydown', key)
    }
  }, [go])

  const project = projects[index]
  const reading = phase === 'reading'
  const accent = palettes[Math.max(index, 0) % palettes.length]
  return (
    <main ref={stage} className={styles.stage} style={{ '--accent': accent } as CSSProperties} data-phase={phase}>
      <div className={styles.world}><CastleCanvas motion={motion} /></div>
      <div className={styles.atmosphere} />
      <header className={styles.header}>
        <Link href="/" className={styles.back}>↖ <span>Back to island</span></Link>
        <span className={styles.wordmark}>SHIJIL <span>/ SELECTED WORK</span></span>
        <span className={styles.edition}>SIX STOPS · ONE JOURNEY</span>
      </header>

      {phase === 'intro' && <section className={styles.intro}>
        <p className={styles.kicker}>THE PROJECT EXPEDITION</p>
        <h1>A little journey.<br /><em>A world of work.</em></h1>
        <p>Follow the cart around the castle.<br />Six stops. Six things I brought to life.</p>
        <button className={styles.primary} onClick={() => go(0)}>Begin exploring <span>↗</span></button>
        <span className={styles.hint}>SCROLL OR SWIPE TO SET OFF</span>
      </section>}

      <div className={styles.travelLabel} aria-hidden={phase !== 'travel'}>
        <span className={styles.compass}>✳</span><p>ON THE WAY</p><span>The next story is around the corner.</span>
      </div>

      {project && <article key={index} className={styles.card} data-open={reading} aria-hidden={!reading} inert={!reading}>
        <div className={styles.art} data-art={index}>
          {project.image && <img className={styles.projectImage} src={project.image} alt={`${project.title} project preview`} />}
          <div className={styles.artGrid} />
          <span className={styles.artLabel}>{project.image ? 'PROJECT PREVIEW' : 'PROJECT STUDY'} / {number(index + 1)}</span>
          <div className={styles.emblem} aria-hidden="true"><span>{symbols[index]}</span></div>
          <div className={styles.artCaption}><span>SELECTED WORK</span><strong>{categories[index]}</strong></div>
          <span className={styles.artNumber} aria-hidden="true">{number(index + 1)}</span>
        </div>
        <div className={styles.details} data-reader tabIndex={0}>
          <div className={styles.cardMeta}><span>CHAPTER {number(index + 1)}</span><span>✦ {project.coordinates}</span></div>
          <h2>{project.title}</h2>
          <p className={styles.description}>{project.description}</p>
          <div className={styles.tags}>{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
          <div className={styles.links}>
            <a href={project.link || `https://example.com/?project=${encodeURIComponent(project.title)}`} target="_blank" rel="noopener noreferrer">{project.link ? 'View project' : 'Demo link'} <span>↗</span></a>
            {project.sourceLink && <a href={project.sourceLink} target="_blank" rel="noopener noreferrer">Source code ↗</a>}
          </div>
          {!project.link && <small className={styles.demoNote}>Placeholder destination · live link coming soon</small>}
          <div className={styles.cardBottom}><span>{index === projects.length - 1 ? 'YOU’VE REACHED THE FINAL STOP' : 'THERE’S MORE AROUND THE CORNER'}</span>
            <button onClick={() => go(index === projects.length - 1 ? -1 : index + 1)}>{index === projects.length - 1 ? 'Explore again ↺' : 'Next project →'}</button>
          </div>
        </div>
      </article>}

      <footer className={styles.footer}>
        <div className={styles.status} aria-live="polite"><span className={styles.statusDot} />{phase === 'travel' ? 'IN TRANSIT' : index < 0 ? 'READY TO EXPLORE' : `STOP ${number(index + 1)} / ${number(projects.length)}`}</div>
        <nav className={styles.stops} aria-label="Project stops">{projects.map((item, i) => <button key={item.title} aria-label={`Go to ${item.title}`} aria-current={i === index ? 'step' : undefined} disabled={phase === 'travel' || phase === 'closing'} onClick={() => go(i)}><span>{number(i + 1)}</span><i /></button>)}</nav>
        <div className={styles.controls}><button aria-label="Previous stop" disabled={index < 0 || busy.current} onClick={() => go(index - 1)}>←</button><button aria-label={index === projects.length - 1 ? 'Restart journey' : 'Next stop'} disabled={busy.current} onClick={() => go(index === projects.length - 1 ? -1 : index + 1)}>→</button></div>
      </footer>
    </main>
  )
}
