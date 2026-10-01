'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * Soft red spotlight that follows the cursor (desktop / fine-pointer only).
 * Uses `mix-blend-mode: screen` so it only *adds* light — never muddies text.
 */
// Removed for the clean light theme — kept as a no-op so existing imports work.
export function SpotlightCursor() {
  return null
}

/**
 * Counts an embedded number up from 0 the first time it scrolls into view.
 * Preserves any prefix/suffix ("< 5min" -> animates the 5; "Varies" -> as-is).
 */
export function Counter({ value, style, className }: { value: string; style?: React.CSSProperties; className?: string }) {
  const match = value.match(/\d+/)
  const build = (n: number) =>
    match ? value.slice(0, match.index) + n + value.slice((match.index ?? 0) + match[0].length) : value
  const [display, setDisplay] = useState<string>(match ? build(0) : value)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!match) { setDisplay(value); return }
    const el = ref.current
    if (!el) return
    const target = parseInt(match[0], 10)
    let done = false
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done) {
        done = true
        const dur = 1300
        const t0 = performance.now()
        const tick = (now: number) => {
          const p = Math.min((now - t0) / dur, 1)
          const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
          setDisplay(build(Math.round(eased * target)))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        obs.disconnect()
      }
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <span ref={ref} className={className} style={style}>{display}</span>
}

/** Thin red progress bar at the very top that fills as the page scrolls. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current
      if (!el) return
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      const p = max > 0 ? h.scrollTop / max : 0
      el.style.transform = `scaleX(${Math.min(Math.max(p, 0), 1)})`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '2px', zIndex: 200, pointerEvents: 'none' }}>
      <div ref={ref} style={{
        height: '100%', width: '100%', transformOrigin: '0 50%', transform: 'scaleX(0)',
        background: '#d00000',
      }} />
    </div>
  )
}

// Removed for the clean light theme — kept as a no-op so existing imports work.
export function HeroParticles() {
  return null
}
