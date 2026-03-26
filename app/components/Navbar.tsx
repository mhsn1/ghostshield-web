'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { href: '/dashboard', label: 'Product' },
    { href: '/docs', label: 'Docs' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/shieldbench', label: 'ShieldBench' },
  ]

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      background: scrolled ? 'rgba(0,0,0,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      transition: 'all 0.3s',
      padding: '0 48px', height: '60px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px', color: '#f5f5f5' }}>GhostShield</span>
        <span style={{
          fontSize: '10px', fontFamily: 'DM Mono', color: '#ff4444',
          border: '1px solid rgba(255,68,68,0.3)', borderRadius: '4px',
          padding: '2px 6px', letterSpacing: '1px',
        }}>BETA</span>
      </Link>

      <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
        {links.map(l => (
          <Link key={l.href} href={l.href} style={{
            color: pathname === l.href ? '#f5f5f5' : '#666',
            fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f5f5f5')}
            onMouseLeave={e => (e.currentTarget.style.color = pathname === l.href ? '#f5f5f5' : '#666')}
          >{l.label}</Link>
        ))}
        <Link href="https://github.com/mhsn1/ghostshield" target="_blank" style={{
          color: '#f5f5f5', fontSize: '13px', textDecoration: 'none',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px',
          padding: '6px 14px', transition: 'border-color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
        >GitHub</Link>
        <Link href="/auth" style={{
          background: '#ff4444', color: 'white', fontSize: '13px',
          textDecoration: 'none', borderRadius: '6px', padding: '6px 16px',
          fontWeight: 500, transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >Start Free Trial</Link>
      </div>
    </nav>
  )
}
