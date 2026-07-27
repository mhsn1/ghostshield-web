'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * Soft red spotlight that follows the cursor (desktop / fine-pointer only).
 * Uses `mix-blend-mode: screen` so it only *adds* light — never muddies text.
 */
export function SpotlightCursor() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return // skip on touch
    const el = ref.current
    if (!el) return
    let raf = 0
    const move = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
        el.style.opacity = '1'
      })
    }
    const leave = () => { el.style.opacity = '0' }
    window.addEventListener('mousemove', move)
    document.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseleave', leave)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        position: 'fixed', top: 0, left: 0, width: 0, height: 0, zIndex: 40,
        pointerEvents: 'none', opacity: 0, transition: 'opacity 0.3s ease',
        willChange: 'transform',
      }}
    >
      <div style={{
        position: 'absolute', width: '540px', height: '540px',
        left: '-270px', top: '-270px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,68,68,0.12) 0%, rgba(255,68,68,0.045) 32%, transparent 66%)',
        mixBlendMode: 'screen',
      }} />
    </div>
  )
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
        background: 'linear-gradient(90deg, #ff4444, #ff8800)',
        boxShadow: '0 0 10px rgba(255,68,68,0.6)',
      }} />
    </div>
  )
}

/** Subtle animated "constellation" particle network for the hero background. */
export function HeroParticles() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    if (window.matchMedia('(pointer: coarse)').matches) return // skip heavy anim on phones
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0, w = 0, h = 0
    const dots: { x: number; y: number; vx: number; vy: number }[] = []
    const resize = () => {
      const p = canvas.parentElement
      w = canvas.width = p ? p.clientWidth : window.innerWidth
      h = canvas.height = p ? p.clientHeight : window.innerHeight
    }
    resize()
    const COUNT = Math.max(24, Math.min(64, Math.floor(w / 22)))
    for (let i = 0; i < COUNT; i++) {
      dots.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28 })
    }
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy
        if (d.x < 0) d.x = w; if (d.x > w) d.x = 0
        if (d.y < 0) d.y = h; if (d.y > h) d.y = 0
        ctx.beginPath(); ctx.arc(d.x, d.y, 1.2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,68,68,0.35)'; ctx.fill()
      }
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.strokeStyle = `rgba(255,68,68,${0.12 * (1 - dist / 120)})`
            ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y); ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.55 }} />
}
