'use client'
import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'

const SEVERITY_COLOR: Record<string, string> = {
  secure: '#00c853', low: '#ffab00', medium: '#ff8800', high: '#ff4444', critical: '#ff0000',
}

const LEADERBOARD = [
  { rank: 1, name: 'GPT-4o', org: 'OpenAI', score: 97, status: 'secure', scans: 12, vulns: 2, trend: '+2' },
  { rank: 2, name: 'Claude 3.5 Sonnet', org: 'Anthropic', score: 95, status: 'secure', scans: 8, vulns: 4, trend: '0' },
  { rank: 3, name: 'Gemini 1.5 Pro', org: 'Google', score: 91, status: 'secure', scans: 6, vulns: 7, trend: '+1' },
  { rank: 4, name: 'Mixtral 8x7b', org: 'Mistral', score: 88, status: 'secure', scans: 5, vulns: 10, trend: '-1' },
  { rank: 5, name: 'Llama 3.1 70b', org: 'Meta', score: 82, status: 'low', scans: 9, vulns: 15, trend: '+3' },
  { rank: 6, name: 'Llama 3.1 8b', org: 'Meta', score: 79, status: 'low', scans: 11, vulns: 43, trend: '0' },
  { rank: 7, name: 'Mistral 7b', org: 'Mistral', score: 71, status: 'low', scans: 4, vulns: 26, trend: '-2' },
  { rank: 8, name: 'Qwen 2.5 7b', org: 'Alibaba', score: 64, status: 'medium', scans: 3, vulns: 31, trend: '+1' },
  { rank: 9, name: 'Phi-3 Mini', org: 'Microsoft', score: 58, status: 'medium', scans: 2, vulns: 38, trend: '-1' },
  { rank: 10, name: 'Gemma 2b', org: 'Google', score: 41, status: 'high', scans: 3, vulns: 52, trend: '-3' },
]

const COMMUNITY = [
  { rank: 1, project: 'AutoGPT', desc: 'Open-source autonomous AI agent', score: 47, status: 'critical', scans: 5 },
  { rank: 2, project: 'Zeroclaw', desc: 'Fast, small autonomous AI assistant', score: 41, status: 'critical', scans: 1 },
  { rank: 3, project: 'OpenDevin', desc: 'Open-source AI software engineer', score: 55, status: 'medium', scans: 3 },
  { rank: 4, project: 'MetaGPT', desc: 'Multi-agent framework for software dev', score: 63, status: 'medium', scans: 2 },
  { rank: 5, project: 'CrewAI', desc: 'Framework for orchestrating AI agents', score: 78, status: 'low', scans: 4 },
]

function useInView(ref: React.RefObject<HTMLElement>, threshold = 0.1) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return inView
}

function AnimatedScore({ target, size = 44, delay = 0 }: { target: number; size?: number; delay?: number }) {
  const [score, setScore] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) {
        setStarted(true)
        setTimeout(() => {
          let current = 0
          const step = target / 40
          const interval = setInterval(() => {
            current += step
            if (current >= target) { setScore(target); clearInterval(interval) }
            else setScore(Math.round(current))
          }, 20)
        }, delay)
      }
    }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target, delay, started])

  const r = size * 0.38
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 90 ? '#00c853' : score >= 70 ? '#ffab00' : score >= 50 ? '#ff8800' : '#ff4444'

  return (
    <svg ref={ref} width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.05s linear, stroke 0.3s' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
        fill={color} fontSize={size * 0.22} fontWeight="700" fontFamily="DM Sans">{score}</text>
    </svg>
  )
}

function AnimatedRow({ row, index, type }: { row: any; index: number; type: 'model' | 'community' }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.05 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const isModel = type === 'model'

  return (
    <div ref={ref} style={{
      display: 'grid',
      gridTemplateColumns: isModel ? '40px 1fr 80px 80px 80px 80px 80px' : '40px 1fr 80px 80px 60px',
      gap: '16px', alignItems: 'center',
      padding: '14px 20px', background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px',
      cursor: 'default',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: `opacity 0.5s ease ${index * 60}ms, transform 0.5s ease ${index * 60}ms, border-color 0.2s`,
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
        e.currentTarget.style.background = '#0f0f0f'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'
        e.currentTarget.style.background = '#0a0a0a'
      }}
    >
      <div style={{ fontSize: '13px', fontFamily: 'DM Mono', color: row.rank <= 3 ? '#ffab00' : '#333' }}>
        {isModel && row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : row.rank}
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 500 }}>{isModel ? row.name : row.project}</div>
        <div style={{ fontSize: '12px', color: '#444' }}>{isModel ? row.org : row.desc}</div>
      </div>
      <AnimatedScore target={row.score} size={44} delay={index * 60 + 200} />
      <div style={{
        fontSize: '11px', padding: '3px 8px', borderRadius: '12px',
        background: `${SEVERITY_COLOR[row.status]}12`,
        color: SEVERITY_COLOR[row.status],
        border: `1px solid ${SEVERITY_COLOR[row.status]}25`,
        textAlign: 'center', fontWeight: 500, width: 'fit-content',
        transition: 'all 0.3s',
      }}>{row.status.toUpperCase()}</div>
      {isModel && (
        <>
          <div style={{ fontSize: '14px', color: '#ff4444', fontFamily: 'DM Mono' }}>{row.vulns}</div>
          <div style={{ fontSize: '14px', color: '#555', fontFamily: 'DM Mono' }}>{row.scans}</div>
          <div style={{
            fontSize: '13px', fontFamily: 'DM Mono',
            color: row.trend.startsWith('+') ? '#00c853' : row.trend === '0' ? '#444' : '#ff4444',
          }}>{row.trend === '0' ? '—' : row.trend}</div>
        </>
      )}
      {!isModel && (
        <div style={{ fontSize: '14px', color: '#555', fontFamily: 'DM Mono' }}>{row.scans}</div>
      )}
    </div>
  )
}

function CountUp({ end, duration = 1500, delay = 0 }: { end: number; duration?: number; delay?: number }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        setTimeout(() => {
          const start = Date.now()
          const tick = () => {
            const elapsed = Date.now() - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setVal(Math.round(eased * end))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }, delay)
      }
    }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end, duration, delay])

  return <span ref={ref}>{val}</span>
}

export default function ShieldBench() {
  const [tab, setTab] = useState<'models' | 'community'>('models')
  const [submitUrl, setSubmitUrl] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const headerVisible = useInView(headerRef as React.RefObject<HTMLElement>)

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#f5f5f5', fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      {/* Animated bg */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,68,68,0.04) 0%, transparent 60%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 48px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div ref={headerRef} style={{
          marginBottom: '64px',
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          <div style={{
            fontSize: '11px', fontFamily: 'DM Mono', color: '#ff4444',
            letterSpacing: '3px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: '#ff4444',
              animation: 'pulse 2s infinite'
            }} />
            PUBLIC LEADERBOARD
          </div>
          <h1 style={{
            fontSize: 'clamp(36px,5vw,56px)', fontWeight: 700, letterSpacing: '-2px',
            marginBottom: '16px', lineHeight: 1.1
          }}>ShieldBench</h1>
          <p style={{ fontSize: '16px', color: '#555', maxWidth: '480px', lineHeight: 1.7, marginBottom: '40px' }}>
            Weekly security scans of popular AI models and open-source projects,
            ranked by prompt extraction resistance.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '40px' }}>
            {[
              { label: 'Models Tested', end: 10 },
              { label: 'Total Scans', end: 63 },
              { label: 'Vulnerabilities Found', end: 198 },
            ].map((s, i) => (
              <div key={s.label}>
                <div style={{
                  fontSize: '28px', fontWeight: 700, fontFamily: 'DM Mono',
                  color: '#f5f5f5', marginBottom: '4px'
                }}>
                  <CountUp end={s.end} delay={i * 150} />
                </div>
                <div style={{ fontSize: '12px', color: '#444' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '2px', marginBottom: '32px',
          background: '#0a0a0a', padding: '3px', borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content'
        }}>
          {(['models', 'community'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', border: 'none', borderRadius: '6px',
              background: tab === t ? '#1a1a1a' : 'transparent',
              color: tab === t ? '#f5f5f5' : '#555',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', transition: 'all 0.25s',
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
            }}>{t === 'models' ? '🤖 AI Models' : '🔓 Community Projects'}</button>
          ))}
        </div>

        {/* Models */}
        {tab === 'models' && (
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 80px 80px 80px',
              gap: '16px', padding: '10px 20px', marginBottom: '4px'
            }}>
              {['#', 'Model', 'Score', 'Status', 'Vulns', 'Scans', 'Trend'].map(h => (
                <div key={h} style={{ fontSize: '11px', color: '#333', fontWeight: 600, letterSpacing: '0.5px' }}>{h}</div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {LEADERBOARD.map((row, i) => <AnimatedRow key={row.rank} row={row} index={i} type="model" />)}
            </div>
          </div>
        )}

        {/* Community */}
        {tab === 'community' && (
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 60px',
              gap: '16px', padding: '10px 20px', marginBottom: '4px'
            }}>
              {['#', 'Project', 'Score', 'Status', 'Scans'].map(h => (
                <div key={h} style={{ fontSize: '11px', color: '#333', fontWeight: 600, letterSpacing: '0.5px' }}>{h}</div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '32px' }}>
              {COMMUNITY.map((row, i) => <AnimatedRow key={row.rank} row={row} index={i} type="community" />)}
            </div>

            {/* Submit */}
            <div style={{
              padding: '32px', background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px'
            }}>
              <div style={{ fontSize: '11px', color: '#444', letterSpacing: '2px', marginBottom: '12px' }}>README BADGE</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Submit your project</h3>
              <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px', lineHeight: 1.7 }}>
                Open-source AI projects can be listed on ShieldBench. Add our security badge to your README.
              </p>
              {submitted ? (
                <div style={{
                  padding: '14px 18px', background: 'rgba(0,200,83,0.08)',
                  border: '1px solid rgba(0,200,83,0.2)', borderRadius: '8px', fontSize: '14px', color: '#00c853'
                }}>
                  ✓ Submitted! We'll scan your project within 24 hours.
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input value={submitUrl} onChange={e => setSubmitUrl(e.target.value)}
                    placeholder="https://github.com/your/ai-project"
                    style={{
                      flex: 1, padding: '10px 14px', background: '#111',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px',
                      color: '#f5f5f5', fontSize: '14px', fontFamily: 'DM Mono', outline: 'none'
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,68,68,0.3)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                  <button onClick={() => { if (submitUrl.trim()) setSubmitted(true) }} style={{
                    padding: '10px 20px', background: '#ff4444', border: 'none',
                    borderRadius: '7px', color: 'white', fontSize: '14px',
                    fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans',
                  }}>Submit</button>
                </div>
              )}
              <div style={{
                marginTop: '20px', padding: '14px 18px', background: '#111',
                borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontSize: '11px', color: '#444', marginBottom: '8px', fontFamily: 'DM Mono' }}>BADGE PREVIEW</div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '4px', padding: '4px 10px'
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffab00' }} />
                  <span style={{ fontSize: '12px', fontFamily: 'DM Mono', color: '#888' }}>
                    GhostShield | score: 79 | LOW
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{
          marginTop: '48px', fontSize: '12px', color: '#222',
          fontFamily: 'DM Mono', textAlign: 'center'
        }}>
          Last updated: March 28, 2026 · Updated weekly
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
      `}</style>
    </div>
  )
}
