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
