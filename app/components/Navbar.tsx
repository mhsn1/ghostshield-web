'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

// Types
interface Drop {
  id: number
  x: number
  y: number
  speed: number
  char: string
  opacity: number
}

interface Bolt {
  id: number
  clipPath: string
  opacity: number
}

interface MatrixPreloaderProps {
  onComplete: () => void
}

// Preloader — clean, premium logo reveal
function MatrixPreloader({ onComplete }: MatrixPreloaderProps) {
  const [mounted, setMounted] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [exiting, setExiting] = useState<boolean>(false)
  const WORD = 'GhostShield'

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    const DURATION = 1500
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - start) / DURATION, 1)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      setProgress(eased)
      if (p < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setTimeout(() => {
          setExiting(true)
          setTimeout(onComplete, 600)
        }, 280)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [mounted, onComplete])

  if (!mounted) {
    return <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999 }} />
  }

  const pct = Math.round(progress * 100)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '26px', overflow: 'hidden',
      opacity: exiting ? 0 : 1,
      transition: 'opacity 0.6s ease',
      pointerEvents: exiting ? 'none' : 'auto',
    }}>
      {/* soft ambient glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '560px', height: '560px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,68,68,0.10), transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Shield icon draws itself in */}
      <svg viewBox="0 0 24 24" width="60" height="60" fill="none" style={{ position: 'relative' }}>
        <path
          d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
          stroke="#ff4444" strokeWidth="1.5" strokeLinejoin="round"
          style={{
            strokeDasharray: 100, strokeDashoffset: 100 * (1 - progress),
            filter: 'drop-shadow(0 0 10px rgba(255,68,68,0.5))',
          }}
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          style={{ opacity: progress > 0.62 ? (progress - 0.62) / 0.38 : 0, transition: 'opacity 0.2s ease' }}
        />
      </svg>

      {/* Wordmark — crisp pure-white, reveals letter by letter */}
      <div style={{
        position: 'relative', display: 'flex',
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
        fontSize: 'clamp(30px, 6vw, 50px)', letterSpacing: '-1.5px', lineHeight: 1,
      }}>
        {WORD.split('').map((ch, i) => {
          const shown = progress > (i / WORD.length) * 0.9
          return (
            <span key={i} style={{
              color: '#ffffff',
              opacity: shown ? 1 : 0.1,
              transform: shown ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}>{ch}</span>
          )
        })}
      </div>

      {/* Progress bar */}
      <div style={{
        width: '220px', height: '2px', marginTop: '2px',
        background: 'rgba(255,255,255,0.10)', borderRadius: '2px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(90deg, #ff4444, #ff8800)',
          boxShadow: '0 0 12px rgba(255,68,68,0.55)',
        }} />
      </div>

      {/* Percentage */}
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#555', letterSpacing: '3px' }}>
        {pct.toString().padStart(3, '0')}
      </div>
    </div>
  )
}

// Matrix Rain Component - Client only
function MatrixRain() {
  const [mounted, setMounted] = useState<boolean>(false)
  const [drops, setDrops] = useState<Drop[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const createDrop = (): Drop => ({
      id: Math.random(),
      x: Math.random() * 100,
      y: -10,
      speed: 2 + Math.random() * 3,
      char: String.fromCharCode(0x30A0 + Math.random() * 96),
      opacity: 0.1 + Math.random() * 0.4,
    })

    const interval = setInterval(() => {
      setDrops((prev: Drop[]) => {
        const newDrops = prev.map((d: Drop) => ({
          ...d,
          y: d.y + d.speed,
          char: Math.random() > 0.95 ? String.fromCharCode(0x30A0 + Math.random() * 96) : d.char
        })).filter((d: Drop) => d.y < 110)

        if (newDrops.length < 50) {
          newDrops.push(createDrop())
        }

        return newDrops
      })
    }, 50)

    setDrops(Array.from({ length: 30 }, createDrop))

    return () => clearInterval(interval)
  }, [mounted])

  if (!mounted) return null

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      opacity: 0.6,
    }}>
      {drops.map((drop: Drop) => (
        <div
          key={drop.id}
          style={{
            position: 'absolute',
            left: `${drop.x}%`,
            top: `${drop.y}%`,
            color: '#ff4444',
            fontSize: '14px',
            fontFamily: 'monospace',
            opacity: drop.opacity,
            textShadow: '0 0 5px #ff4444',
            transition: 'none',
          }}
        >
          {drop.char}
        </div>
      ))}
    </div>
  )
}

// Lightning Effect Component - Client only
function LightningEffect() {
  const [mounted, setMounted] = useState<boolean>(false)
  const [bolts, setBolts] = useState<Bolt[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const createBolt = (): Bolt => {
      const points: string[] = []
      let x = 50
      let y = 0
      while (y < 100) {
        x += (Math.random() - 0.5) * 20
        y += 5 + Math.random() * 10
        points.push(`${x}% ${y}%`)
      }
      return {
        id: Math.random(),
        clipPath: `polygon(${points.join(', ')})`,
        opacity: Math.random(),
      }
    }

    const interval = setInterval(() => {
      setBolts(Array.from({ length: 3 }, createBolt))
      setTimeout(() => setBolts([]), 100)
    }, 200)

    setTimeout(() => clearInterval(interval), 600)

    return () => clearInterval(interval)
  }, [mounted])

  if (!mounted) return null

  return (
    <>
      {bolts.map((bolt: Bolt) => (
        <div
          key={bolt.id}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, transparent, #ff4444, #ffffff, #ff4444, transparent)',
            clipPath: bolt.clipPath,
            opacity: bolt.opacity * 0.8,
            filter: 'blur(1px)',
            zIndex: 5,
          }}
        />
      ))}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(255,68,68,0.1)',
        animation: 'flash 0.1s ease-out',
        pointerEvents: 'none',
      }} />
      <style jsx>{`
        @keyframes flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </>
  )
}

// Main Navbar Component
export default function Navbar() {
  const [scrolled, setScrolled] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [logoAnimated, setLogoAnimated] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!loading && mounted) {
      setTimeout(() => setLogoAnimated(true), 100)
    }
  }, [loading, mounted])

  const links = [
    { href: '/dashboard', label: 'Product' },
    { href: '/docs', label: 'Docs' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/shieldbench', label: 'ShieldBench' },
  ]

  if (!mounted) {
    return (
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'transparent',
        padding: '0 48px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#f5f5f5' }}>GhostShield</span>
      </nav>
    )
  }

  return (
    <>
      {loading && <MatrixPreloader onComplete={() => setLoading(false)} />}

      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        background: scrolled ? 'rgba(0,0,0,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        transition: 'all 0.3s',
        padding: '0 48px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: logoAnimated ? 1 : 0,
            transform: logoAnimated ? 'translateX(0)' : 'translateX(-20px)',
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div style={{
            width: '28px',
            height: '28px',
            position: 'relative',
            animation: logoAnimated ? 'shieldGlow 3s ease-in-out infinite' : 'none',
          }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: '100%', height: '100%' }}>
              <path
                d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
                fill="none"
                stroke="#ff4444"
                strokeWidth="2"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(255,68,68,0.6))',
                  animation: logoAnimated ? 'draw 1s ease-out forwards' : 'none',
                  strokeDasharray: 100,
                  strokeDashoffset: logoAnimated ? 0 : 100,
                }}
              />
              <path
                d="M9 12l2 2 4-4"
                stroke="#f5f5f5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  opacity: logoAnimated ? 1 : 0,
                  transition: 'opacity 0.3s 0.5s',
                }}
              />
            </svg>
          </div>

          <span style={{
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '-0.5px',
            color: '#f5f5f5',
            position: 'relative',
          }}>
            {'GhostShield'.split('').map((char, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity: logoAnimated ? 1 : 0,
                  transform: logoAnimated ? 'translateY(0)' : 'translateY(10px)',
                  transition: `all 0.4s ${0.1 + i * 0.03}s`,
                }}
              >
                {char}
              </span>
            ))}
          </span>
        </Link>

        <div className="nav-actions" style={{
          display: 'flex',
          gap: '28px',
          alignItems: 'center',
          opacity: logoAnimated ? 1 : 0,
          transform: logoAnimated ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 0.5s 0.3s',
        }}>
          {links.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              className="nav-link"
              style={{
                color: pathname === l.href ? '#f5f5f5' : '#666',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'color 0.2s',
                opacity: logoAnimated ? 1 : 0,
                transform: logoAnimated ? 'translateY(0)' : 'translateY(-10px)',
                transitionDelay: `${0.4 + i * 0.05}s`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f5f5f5' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = pathname === l.href ? '#f5f5f5' : '#666' }}
            >
              {l.label}
            </Link>
          ))}

          <Link
            href="https://github.com/mhsn1/ghostshield"
            target="_blank"
            style={{
              color: '#f5f5f5',
              fontSize: '13px',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '6px',
              padding: '6px 14px',
              transition: 'all 0.2s',
              opacity: logoAnimated ? 1 : 0,
              transform: logoAnimated ? 'scale(1)' : 'scale(0.9)',
              transitionDelay: '0.6s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            GitHub
          </Link>

          <Link
            href="/auth"
            style={{
              background: '#ff4444',
              color: 'white',
              fontSize: '13px',
              textDecoration: 'none',
              borderRadius: '6px',
              padding: '6px 16px',
              fontWeight: 500,
              transition: 'all 0.2s',
              opacity: logoAnimated ? 1 : 0,
              transform: logoAnimated ? 'scale(1)' : 'scale(0.9)',
              transitionDelay: '0.65s',
              boxShadow: '0 0 20px rgba(255,68,68,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.85'
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(255,68,68,0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255,68,68,0.3)'
            }}
          >
            Get Started
          </Link>
        </div>

        <button
          className="nav-burger"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
          style={{ background: 'none', border: 'none', color: '#f5f5f5', cursor: 'pointer', padding: '8px', display: 'none', alignItems: 'center' }}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="nav-panel" style={{
          position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 99,
          background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 20px 24px', display: 'flex', flexDirection: 'column', gap: '2px',
        }}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              style={{ color: pathname === l.href ? '#f5f5f5' : '#aaa', fontSize: '16px', textDecoration: 'none', padding: '13px 6px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {l.label}
            </Link>
          ))}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <Link href="https://github.com/mhsn1/ghostshield" target="_blank" onClick={() => setMenuOpen(false)}
              style={{ flex: 1, textAlign: 'center', color: '#f5f5f5', fontSize: '14px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', padding: '12px' }}>
              GitHub
            </Link>
            <Link href="/auth" onClick={() => setMenuOpen(false)}
              style={{ flex: 1, textAlign: 'center', background: '#ff4444', color: 'white', fontSize: '14px', textDecoration: 'none', borderRadius: '8px', padding: '12px', fontWeight: 500 }}>
              Get Started
            </Link>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes shieldGlow {
          0%, 100% { filter: drop-shadow(0 0 5px rgba(255,68,68,0.4)); }
          50% { filter: drop-shadow(0 0 15px rgba(255,68,68,0.8)); }
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </>
  )
}