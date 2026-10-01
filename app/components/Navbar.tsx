'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import MobiusLogo from './MobiusLogo'

export default function Navbar() {
  const [scrolled, setScrolled] = useState<boolean>(false)
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
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
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        borderBottom: scrolled ? '1px solid #ebebeb' : '1px solid transparent',
        background: scrolled ? 'rgba(255,255,255,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
        transition: 'all 0.3s', padding: '0 48px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MobiusLogo size={30} />
          <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            <span style={{ color: '#181717' }}>Ghost</span><span style={{ color: '#d00000' }}>Shield</span>
          </span>
        </Link>

        <div className="nav-actions" style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link"
              style={{
                color: pathname === l.href ? '#181717' : '#6b6b6b',
                fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s',
                fontFamily: 'Geist, sans-serif',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#181717' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = pathname === l.href ? '#181717' : '#6b6b6b' }}
            >
              {l.label}
            </Link>
          ))}

          <Link href="https://github.com/mhsn1/ghostshield" target="_blank"
            style={{
              color: '#181717', fontSize: '13px', textDecoration: 'none',
              border: '1px solid #dbdbdb', borderRadius: '8px', padding: '7px 14px',
              transition: 'all 0.2s', fontFamily: 'Geist, sans-serif',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#181717' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#dbdbdb' }}
          >
            GitHub
          </Link>

          <Link href="/auth"
            style={{
              background: '#181717', color: '#fff', fontSize: '13px', textDecoration: 'none',
              borderRadius: '8px', padding: '8px 16px', fontWeight: 500,
              transition: 'all 0.2s', fontFamily: 'Geist, sans-serif',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#d00000' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#181717' }}
          >
            Get Started
          </Link>
        </div>

        <button className="nav-burger" aria-label="Toggle menu" onClick={() => setMenuOpen((v) => !v)}
          style={{ background: 'none', border: 'none', color: '#181717', cursor: 'pointer', padding: '8px', display: 'none', alignItems: 'center' }}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="nav-panel" style={{
          position: 'fixed', top: '64px', left: 0, right: 0, zIndex: 99,
          background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(18px)',
          borderBottom: '1px solid #ebebeb',
          padding: '12px 20px 24px', display: 'flex', flexDirection: 'column', gap: '2px',
        }}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              style={{ color: pathname === l.href ? '#181717' : '#555', fontSize: '16px', textDecoration: 'none', padding: '13px 6px', borderBottom: '1px solid #f0f0f0', fontFamily: 'Geist, sans-serif' }}>
              {l.label}
            </Link>
          ))}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <Link href="https://github.com/mhsn1/ghostshield" target="_blank" onClick={() => setMenuOpen(false)}
              style={{ flex: 1, textAlign: 'center', color: '#181717', fontSize: '14px', textDecoration: 'none', border: '1px solid #dbdbdb', borderRadius: '8px', padding: '12px', fontFamily: 'Geist, sans-serif' }}>
              GitHub
            </Link>
            <Link href="/auth" onClick={() => setMenuOpen(false)}
              style={{ flex: 1, textAlign: 'center', background: '#181717', color: '#fff', fontSize: '14px', textDecoration: 'none', borderRadius: '8px', padding: '12px', fontWeight: 500, fontFamily: 'Geist, sans-serif' }}>
              Get Started
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
