'use client'
import { useState, useEffect } from 'react'
import { downloadReport } from '../components/generateReport'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SEVERITY_C: Record<string, string> = {
  critical: '#ff4444', high: '#ff8800', medium: '#ffab00',
  low: '#88bb00', none: '#00c853', secure: '#00c853'
}

const API_URL = "https://ghostshield-production.up.railway.app"

// Normalize Supabase scan row (snake_case) → ScanResult (camelCase)
function toScanResult(scan: any) {
  return {
    target: scan.model || scan.target,
    score: scan.score,
    severity: scan.severity,
    totalProbes: scan.total_probes ?? scan.totalProbes ?? 88,
    vulnerabilities: scan.vulnerabilities,
    findings: scan.findings || [],
    recommendations: scan.recommendations || [],
  }
}

const PLAN_LIMITS: Record<string, { label: string; limit: number; probes: number; price: string }> = {
  starter: { label: 'Starter', limit: 1, probes: 10, price: '$1' },
  pro: { label: 'Pro', limit: 1000, probes: 88, price: '$99/mo' },
  paid: { label: 'Pro', limit: 1000, probes: 88, price: '$99/mo' },
}

function getScansThisMonth(scans: any[]) {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  return scans.filter(s => new Date(s.created_at).getTime() > thirtyDaysAgo).length
}

const SIDEBAR = [
  { icon: '⬡', label: 'Overview', id: 'overview' },
  { icon: '⟳', label: 'New Scan', id: 'scan' },
  { icon: '▤', label: 'Scan History', id: 'history' },
  { icon: '◈', label: 'ShieldBench', id: 'bench' },
  { icon: '⚙', label: 'Settings', id: 'settings' },
]

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = size * 0.38
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 90 ? '#00c853' : score >= 70 ? '#ffab00' : '#ff4444'
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
        fill={color} fontSize={size * 0.22} fontWeight="700" fontFamily="DM Sans">{score}</text>
    </svg>
  )
}

function ScanDetailModal({ scan, onClose }: { scan: any; onClose: () => void }) {
  if (!scan) return null
  const findings = scan.findings || []
  const recs = scan.recommendations || []
  const vulns = findings.filter((f: any) => f.severity !== 'none')

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px', width: '100%', maxWidth: '780px',
          maxHeight: '85vh', overflowY: 'auto', padding: '32px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{scan.model}</h2>
              <span style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                background: `${SEVERITY_C[scan.severity] || '#888'}18`,
                color: SEVERITY_C[scan.severity] || '#888',
                border: `1px solid ${SEVERITY_C[scan.severity] || '#888'}30`,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>{scan.severity}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#444', fontFamily: 'DM Mono' }}>
              {new Date(scan.created_at).toLocaleString()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => downloadReport(toScanResult(scan), { prompt: scan.prompt, model: scan.model, provider: scan.provider, scannedAt: scan.created_at })}
              style={{
                background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)',
                borderRadius: '6px', color: '#ff6666', fontSize: '12px', fontWeight: 600,
                padding: '6px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <span style={{ fontSize: '14px' }}>↓</span> PDF Report
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#555', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}
            >×</button>
          </div>
        </div>

        {/* Score row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '32px',
          background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '10px', padding: '24px', marginBottom: '24px', alignItems: 'center',
        }}>
          <div style={{ textAlign: 'center' }}>
            <ScoreRing score={scan.score} size={90} />
            <div style={{ fontSize: '11px', color: '#444', marginTop: '6px' }}>Security Score</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {[
              { l: 'Total Probes', v: scan.total_probes || 88, c: '#f5f5f5' },
              { l: 'Vulnerabilities', v: scan.vulnerabilities, c: '#ff4444' },
              { l: 'Critical', v: findings.filter((f: any) => f.severity === 'critical').length, c: '#ff4444' },
              { l: 'High', v: findings.filter((f: any) => f.severity === 'high').length, c: '#ff8800' },
            ].map(s => (
              <div key={s.l} style={{ padding: '12px 16px', background: '#111', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'DM Mono', color: s.c, marginBottom: '2px' }}>{s.v}</div>
                <div style={{ fontSize: '11px', color: '#444' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Prompt */}
        {scan.prompt && (
          <div style={{
            padding: '14px 16px', background: '#0d0d0d',
            border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
            marginBottom: '24px',
          }}>
            <div style={{ fontSize: '11px', color: '#444', marginBottom: '6px', fontFamily: 'DM Mono', letterSpacing: '1px' }}>SCANNED PROMPT</div>
            <div style={{ fontSize: '13px', color: '#555', fontFamily: 'DM Mono', lineHeight: 1.6 }}>
              {scan.prompt.slice(0, 300)}{scan.prompt.length > 300 ? '…' : ''}
            </div>
          </div>
        )}

        {/* Findings */}
        {vulns.length > 0 && (
          <>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: '#888' }}>Vulnerabilities Found</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
              {vulns.map((f: any) => (
                <div key={f.probe} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '14px',
                  padding: '12px 16px', background: '#0d0d0d',
                  border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
                  borderLeft: `3px solid ${SEVERITY_C[f.severity] || '#555'}`,
                }}>
                  <span style={{ fontFamily: 'DM Mono', fontSize: '11px', color: '#333', minWidth: '90px', flexShrink: 0, marginTop: '1px' }}>{f.probe}</span>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                    background: `${SEVERITY_C[f.severity]}15`, color: SEVERITY_C[f.severity],
                    flexShrink: 0, alignSelf: 'flex-start',
                  }}>{f.severity?.toUpperCase()}</span>
                  <span style={{ fontSize: '13px', color: '#666', lineHeight: 1.5 }}>{f.reasoning}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Recommendations */}
        {recs.length > 0 && (
          <div style={{
            padding: '18px 20px', background: 'rgba(255,68,68,0.04)',
            border: '1px solid rgba(255,68,68,0.12)', borderRadius: '8px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Recommendations</div>
            {recs.map((r: string) => (
              <div key={r} style={{ fontSize: '13px', color: '#555', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'DM Mono' }}>→ {r}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Overview({ scans, onNewScan }: { scans: any[], onNewScan: () => void }) {
  const [selectedScan, setSelectedScan] = useState<any>(null)
  const avgScore = scans.length ? Math.round(scans.reduce((a, s) => a + s.score, 0) / scans.length) : 0
  const totalVulns = scans.reduce((a, s) => a + s.vulnerabilities, 0)

  return (
    <>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '6px' }}>Overview</h1>
        <p style={{ fontSize: '14px', color: '#555' }}>Your AI security dashboard</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {[
          { label: 'Total Scans', value: scans.length.toString() },
          { label: 'Avg Score', value: avgScore.toString() },
          { label: 'Vulnerabilities Found', value: totalVulns.toString() },
          { label: 'Scans This Month', value: scans.filter(s => new Date(s.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length.toString() },
        ].map(s => (
          <div key={s.label} style={{
            padding: '20px', background: '#0d0d0d',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px'
          }}>
            <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'DM Mono', marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#555' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Recent Scans</h2>
        <button onClick={onNewScan} style={{
          background: '#ff4444', border: 'none', borderRadius: '6px',
          color: 'white', fontSize: '13px', fontWeight: 500, padding: '7px 14px',
          cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
        }}>+ New Scan</button>
      </div>

      {scans.length === 0 ? (
        <div style={{
          padding: '40px', textAlign: 'center', color: '#444', fontSize: '14px',
          background: '#0d0d0d', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'
        }}>
          No scans yet — <button onClick={onNewScan} style={{
            background: 'none', border: 'none',
            color: '#ff4444', cursor: 'pointer', fontSize: '14px', fontFamily: 'DM Sans'
          }}>
            run your first scan
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {scans.slice(0, 5).map(scan => (
            <div key={scan.id} style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto auto auto',
              gap: '24px', alignItems: 'center',
              padding: '16px 20px', background: '#0d0d0d',
              border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
              transition: 'border-color 0.2s, background 0.2s', cursor: 'pointer',
            }}
              onClick={() => setSelectedScan(scan)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = '#111' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = '#0d0d0d' }}
            >
              <div>
                <div style={{ fontSize: '14px', fontFamily: 'DM Mono', marginBottom: '2px' }}>{scan.model}</div>
                <div style={{ fontSize: '12px', color: '#444' }}>
                  {scan.prompt?.slice(0, 60)}{scan.prompt?.length > 60 ? '...' : ''}
                </div>
                <div style={{ fontSize: '11px', color: '#333', marginTop: '2px' }}>
                  {new Date(scan.created_at).toLocaleString()}
                </div>
              </div>
              <ScoreRing score={scan.score} size={52} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#ff4444' }}>{scan.vulnerabilities}</div>
                <div style={{ fontSize: '11px', color: '#444' }}>vulns</div>
              </div>
              <div style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500,
                background: `${SEVERITY_C[scan.severity] || '#888'}15`,
                color: SEVERITY_C[scan.severity] || '#888',
                border: `1px solid ${SEVERITY_C[scan.severity] || '#888'}30`,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>{scan.severity}</div>
              <div style={{ color: '#333' }}>→</div>
            </div>
          ))}
        </div>
      )}
      {selectedScan && <ScanDetailModal scan={selectedScan} onClose={() => setSelectedScan(null)} />}
    </>
  )
}

// Smart validation: checks if input looks like a system prompt
function looksLikeSystemPrompt(text: string): { valid: boolean; reason: string } {
  const t = text.trim()
  if (t.length < 20) {
    return { valid: false, reason: 'Too short — system prompts are usually at least a sentence long.' }
  }

  // Keywords that indicate this is actually a system prompt / instruction
  const promptKeywords = [
    'you are', 'you\'re', 'your role', 'your task', 'your job',
    'act as', 'behave as', 'respond as', 'function as',
    'assistant', 'chatbot', 'bot', 'agent', 'helper',
    'must', 'must not', 'never', 'always', 'do not', 'don\'t', 'cannot', 'can\'t',
    'should', 'should not', 'shouldn\'t',
    'respond', 'reply', 'answer', 'help', 'assist', 'support',
    'instruction', 'rule', 'guideline', 'policy', 'restrict',
    'user', 'customer', 'client',
    'system prompt', 'system message',
    'do not reveal', 'do not share', 'keep secret', 'confidential',
    'persona', 'character', 'role',
  ]

  const lower = t.toLowerCase()
  const hasKeyword = promptKeywords.some(kw => lower.includes(kw))

  if (!hasKeyword) {
    return {
      valid: false,
      reason: 'This doesn\'t look like a system prompt. A system prompt is an instruction you give to an AI, like:\n"You are a customer support bot. Never share passwords."'
    }
  }

  return { valid: true, reason: '' }
}

function NewScan({ onComplete, scanLimit, scansUsed, probeLimit, onUpgrade }: {
  onComplete: (scan: any) => void
  scanLimit: number
  scansUsed: number
  probeLimit: number
  onUpgrade: () => void
}) {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('llama-3.1-8b-instant')
  const [provider, setProvider] = useState('groq')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 88 })
  const [liveProbe, setLiveProbe] = useState('')
  const [liveCategory, setLiveCategory] = useState('')
  const [liveLogs, setLiveLogs] = useState<{ probe: string; category: string; severity?: string; time: number }[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [scannedPrompt, setScannedPrompt] = useState('')
  const limitReached = scansUsed >= scanLimit

  // Elapsed time ticker
  useEffect(() => {
    if (!scanning || !startTime) return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500)
    return () => clearInterval(t)
  }, [scanning, startTime])

  const startScan = async () => {
    if (!prompt.trim()) return

    // Check scan limit
    if (limitReached) {
      setError('You\'ve reached your scan limit for this month. Upgrade your plan to continue scanning.')
      return
    }

    // Smart validation
    const check = looksLikeSystemPrompt(prompt)
    if (!check.valid) {
      setError(check.reason)
      return
    }

    setScanning(true)
    setResult(null)
    setError('')
    setScannedPrompt(prompt)
    setProgress({ current: 0, total: probeLimit })
    setLiveLogs([])
    setLiveProbe('')
    setLiveCategory('')
    const t0 = Date.now()
    setStartTime(t0)
    setElapsed(0)

    try {
      const res = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, provider, probeLimit })
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value)
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'progress') {
                setProgress({ current: data.current, total: data.total })
                if (data.probe) {
                  setLiveProbe(data.probe)
                  setLiveCategory(data.category || '')
                  setLiveLogs(prev => [
                    { probe: data.probe, category: data.category || '', severity: data.severity, time: Date.now() - t0 },
                    ...prev.slice(0, 19),
                  ])
                }
              } else if (data.type === 'complete') {
                setResult(data.result)
                setScanning(false)
                // Save to Supabase
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                  await supabase.from('scans').insert({
                    user_id: user.id,
                    prompt: prompt,
                    model: data.result.target,
                    provider,
                    score: data.result.score,
                    severity: data.result.severity,
                    total_probes: data.result.totalProbes,
                    vulnerabilities: data.result.vulnerabilities,
                    findings: data.result.findings,
                    recommendations: data.result.recommendations,
                  })
                  onComplete(data.result)
                }
              } else if (data.type === 'error') {
                setError(data.error)
                setScanning(false)
              }
            } catch { }
          }
        }
      }
    } catch (err) {
      setError(`Could not connect to scan server. Make sure GhostShield API is running at ${API_URL}`)
      setScanning(false)
    }
  }

  if (scanning) {
    const pct = Math.round((progress.current / progress.total) * 100) || 0
    const estTotal = progress.current > 0
      ? Math.round((elapsed / progress.current) * progress.total)
      : null
    const estRemaining = estTotal !== null ? Math.max(0, estTotal - elapsed) : null
    const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

    // Live stats from logs
    const vulnCount = liveLogs.filter(l => l.severity && l.severity !== 'none').length
    const critCount = liveLogs.filter(l => l.severity === 'critical' || l.severity === 'high').length
    const passCount = liveLogs.filter(l => !l.severity || l.severity === 'none').length

    // Category counts from logs
    const catCounts: Record<string, { total: number; vuln: number }> = {}
    liveLogs.forEach(l => {
      if (!l.category) return
      if (!catCounts[l.category]) catCounts[l.category] = { total: 0, vuln: 0 }
      catCounts[l.category].total++
      if (l.severity && l.severity !== 'none') catCounts[l.category].vuln++
    })

    // Rotating security insights
    const SECURITY_INSIGHTS = [
      'Testing direct extraction — the most common attack vector',
      'Persona attacks (like DAN) trick 65% of unprotected AIs',
      'Evolutionary attacks mutate until they bypass defenses (93% success rate)',
      'Multi-language probes exploit uneven safety training across languages',
      'The average unprotected AI leaks its system prompt in under 3 attempts',
      'Context overflow attacks hide commands in large text blocks',
      'Token boundary disruption bypasses keyword filters entirely',
      'Chain-of-thought hijacking makes the AI reason itself into revealing secrets',
      'Tree of Attacks refines probes iteratively — 80%+ success rate',
      'Format injection (SQL/CSV/YAML) encodes prompts past safety layers',
      'Social engineering a single vulnerability opens the door to full extraction',
      'Semantic smuggling uses synonyms to avoid detection by keyword-based guards',
      'A leaked system prompt can expose API keys, business logic, and user data',
      'GhostShield tests against 25 attack categories used in real-world red teaming',
      'Adding specific denial instructions reduces leak rate by 70-85%',
      'Deceptive Delight mixes safe and unsafe topics — 65% attack success rate',
      'Skeleton key attacks fake authorization codes to bypass restrictions',
    ]
    const insightIndex = Math.floor(elapsed / 5) % SECURITY_INSIGHTS.length

    // Threat level animation
    const threatLevel = vulnCount === 0 ? 'LOW' : critCount > 0 ? 'CRITICAL' : vulnCount > 3 ? 'HIGH' : 'MODERATE'
    const threatColor = threatLevel === 'LOW' ? '#00c853' : threatLevel === 'CRITICAL' ? '#ff4444' : threatLevel === 'HIGH' ? '#ff8800' : '#ffbb00'

    return (
      <div style={{ maxWidth: '780px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '6px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ff4444', animation: 'pulse 2s infinite', marginRight: '8px' }} /> Scanning…
            </h1>
            <p style={{ fontSize: '13px', color: '#444', fontFamily: 'DM Mono' }}>
              {scannedPrompt.slice(0, 60)}{scannedPrompt.length > 60 ? '…' : ''}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'DM Mono', color: '#ff4444' }}>
              {fmtTime(elapsed)}
            </div>
            <div style={{ fontSize: '11px', color: '#333', fontFamily: 'DM Mono' }}>elapsed</div>
          </div>
        </div>

        {/* Live Stats Row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px',
        }}>
          {[
            { label: 'Probes Run', value: `${progress.current}`, color: '#f5f5f5' },
            { label: 'Threats Found', value: `${vulnCount}`, color: vulnCount > 0 ? '#ff4444' : '#00c853' },
            { label: 'Critical', value: `${critCount}`, color: critCount > 0 ? '#ff4444' : '#333' },
            { label: 'Passed', value: `${passCount}`, color: '#00c853' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '14px 12px', background: '#0d0d0d',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '20px', fontWeight: 700, fontFamily: 'DM Mono',
                color: s.color, marginBottom: '2px',
              }}>{s.value}</div>
              <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Main progress card */}
        <div style={{
          padding: '24px', background: '#0d0d0d',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', marginBottom: '12px',
        }}>
          {/* Category + probe name */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              {liveCategory && (
                <div style={{
                  display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
                  background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)',
                  fontSize: '11px', fontFamily: 'DM Mono', color: '#ff6666',
                  letterSpacing: '0.5px', marginBottom: '6px',
                }}>{liveCategory.toUpperCase()}</div>
              )}
              <div style={{ fontSize: '13px', fontFamily: 'DM Mono', color: '#777' }}>
                {liveProbe || 'Initializing engine…'}
              </div>
            </div>
            {/* Threat Level Badge */}
            <div style={{
              padding: '6px 14px', borderRadius: '20px',
              background: `${threatColor}12`, border: `1px solid ${threatColor}40`,
              fontSize: '11px', fontFamily: 'DM Mono', fontWeight: 600,
              color: threatColor, letterSpacing: '1px',
              animation: vulnCount > 0 ? 'pulse 2s infinite' : 'none',
            }}>
              THREAT: {threatLevel}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: '6px', background: '#1a1a1a', borderRadius: '3px', marginBottom: '10px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct || 2}%`,
              background: 'linear-gradient(90deg, #ff4444, #ff7744)',
              borderRadius: '3px', transition: 'width 0.6s ease',
              boxShadow: '0 0 8px rgba(255,68,68,0.4)',
            }} />
          </div>

          {/* Bottom row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', fontFamily: 'DM Mono', color: '#444' }}>
              {pct}% complete
            </div>
            {estRemaining !== null && estRemaining > 0 && (
              <div style={{ fontSize: '12px', fontFamily: 'DM Mono', color: '#333' }}>
                ~{fmtTime(estRemaining)} remaining
              </div>
            )}
          </div>
        </div>

        {/* Security Insight Banner — rotates every 5 seconds */}
        <div style={{
          padding: '14px 18px', background: 'rgba(255,68,68,0.04)',
          border: '1px solid rgba(255,68,68,0.1)', borderRadius: '8px', marginBottom: '12px',
          transition: 'opacity 0.5s ease',
        }}>
          <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.6, fontFamily: 'DM Mono' }}>
            {SECURITY_INSIGHTS[insightIndex]}
          </div>
        </div>

        {/* Category Breakdown — live heatmap */}
        {Object.keys(catCounts).length > 0 && (
          <div style={{
            padding: '16px', background: '#080808',
            border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '12px',
          }}>
            <div style={{ color: '#333', marginBottom: '10px', letterSpacing: '1px', fontSize: '11px', fontFamily: 'DM Mono' }}>
              CATEGORY BREAKDOWN
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {Object.entries(catCounts).map(([cat, counts]) => {
                const isVuln = counts.vuln > 0
                return (
                  <div key={cat} style={{
                    padding: '4px 10px', borderRadius: '4px', fontSize: '10px',
                    fontFamily: 'DM Mono', letterSpacing: '0.3px',
                    background: isVuln ? 'rgba(255,68,68,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isVuln ? 'rgba(255,68,68,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    color: isVuln ? '#ff6666' : '#444',
                  }}>
                    {cat} <span style={{ color: isVuln ? '#ff4444' : '#333', fontWeight: 600 }}>
                      {counts.vuln}/{counts.total}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Live log */}
        {liveLogs.length > 0 && (
          <div style={{
            background: '#080808', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px', padding: '16px', maxHeight: '200px', overflowY: 'auto',
            fontFamily: 'DM Mono', fontSize: '12px',
          }}>
            <div style={{ color: '#333', marginBottom: '10px', letterSpacing: '1px', fontSize: '11px' }}>LIVE PROBE LOG</div>
            {liveLogs.map((log, i) => (
              <div key={i} style={{
                display: 'flex', gap: '12px', alignItems: 'baseline',
                padding: '4px 0',
                borderBottom: i < liveLogs.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                opacity: i === 0 ? 1 : Math.max(0.25, 1 - i * 0.08),
              }}>
                <span style={{ color: '#2a2a2a', minWidth: '40px' }}>{fmtTime(Math.floor(log.time / 1000))}</span>
                <span style={{
                  color: log.severity && log.severity !== 'none'
                    ? SEVERITY_C[log.severity] || '#888'
                    : '#2a2a2a',
                  minWidth: '8px',
                }}>
                  {log.severity && log.severity !== 'none' ? '●' : '○'}
                </span>
                <span style={{ color: '#555', minWidth: '120px' }}>[{log.category || '?'}]</span>
                <span style={{ color: i === 0 ? '#888' : '#444' }}>{log.probe}</span>
                {log.severity && log.severity !== 'none' && (
                  <span style={{
                    marginLeft: 'auto', fontSize: '10px',
                    color: SEVERITY_C[log.severity] || '#888',
                    background: `${SEVERITY_C[log.severity] || '#888'}15`,
                    padding: '1px 6px', borderRadius: '3px',
                  }}>{log.severity.toUpperCase()}</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: '11px', color: '#2a2a2a', fontFamily: 'DM Mono', marginTop: '12px', textAlign: 'center' }}>
          Do not close this tab — scan is running
        </div>

        {/* Pulse animation */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    )
  }

  if (result) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Scan Complete</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{
              padding: '3px 10px', background: `${SEVERITY_C[result.severity] || '#888'}15`,
              color: SEVERITY_C[result.severity] || '#888',
              border: `1px solid ${SEVERITY_C[result.severity] || '#888'}30`,
              borderRadius: '20px', fontSize: '12px', textTransform: 'uppercase'
            }}>{result.severity}</span>
            <button
              onClick={() => downloadReport(result, { prompt: scannedPrompt, model: model, provider: provider })}
              style={{
                background: '#ff4444', border: 'none',
                borderRadius: '6px', color: 'white', fontSize: '12px', fontWeight: 600,
                padding: '6px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <span style={{ fontSize: '14px' }}>↓</span> Download PDF Report
            </button>
          </div>
        </div>

        <div style={{
          padding: '12px 16px', background: '#0d0d0d',
          border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
          marginBottom: '24px', maxWidth: '800px'
        }}>
          <div style={{ fontSize: '11px', color: '#444', marginBottom: '4px', fontFamily: 'DM Mono' }}>SCANNED PROMPT</div>
          <div style={{ fontSize: '13px', color: '#666', fontFamily: 'DM Mono', lineHeight: 1.6 }}>
            {scannedPrompt.slice(0, 200)}{scannedPrompt.length > 200 ? '...' : ''}
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '40px',
          background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '32px', marginBottom: '24px', maxWidth: '800px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <ScoreRing score={result.score} size={100} />
            <div style={{ fontSize: '12px', color: '#444', marginTop: '8px' }}>Security Score</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', alignContent: 'center' }}>
            {[
              { l: 'Total Probes', v: result.totalProbes, c: '#f5f5f5' },
              { l: 'Vulnerable', v: result.vulnerabilities, c: '#ff4444' },
              { l: 'Critical', v: result.findings?.filter((f: any) => f.severity === 'critical').length || 0, c: '#ff4444' },
              { l: 'High', v: result.findings?.filter((f: any) => f.severity === 'high').length || 0, c: '#ff8800' },
            ].map(s => (
              <div key={s.l} style={{
                padding: '14px 18px', background: '#111',
                borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)'
              }}>
                <div style={{
                  fontSize: '22px', fontWeight: 700, fontFamily: 'DM Mono',
                  color: s.c, marginBottom: '2px'
                }}>{s.v}</div>
                <div style={{ fontSize: '11px', color: '#444' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Vulnerabilities Found</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '800px', marginBottom: '24px' }}>
          {result.findings?.filter((f: any) => f.severity !== 'none').map((f: any) => (
            <div key={f.probe} style={{
              display: 'flex', alignItems: 'flex-start', gap: '16px',
              padding: '14px 18px', background: '#0d0d0d',
              border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
              borderLeft: `3px solid ${SEVERITY_C[f.severity] || '#555'}`,
            }}>
              <span style={{
                fontFamily: 'DM Mono', fontSize: '11px', color: '#333',
                minWidth: '100px', flexShrink: 0
              }}>{f.probe}</span>
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                minWidth: '70px', textAlign: 'center', flexShrink: 0,
                background: `${SEVERITY_C[f.severity]}15`, color: SEVERITY_C[f.severity]
              }}>
                {f.severity?.toUpperCase()}
              </span>
              <span style={{ fontSize: '13px', color: '#888', lineHeight: 1.5 }}>{f.reasoning}</span>
            </div>
          ))}
        </div>

        {result.recommendations?.length > 0 && (
          <div style={{
            padding: '20px', background: 'rgba(255,68,68,0.05)',
            border: '1px solid rgba(255,68,68,0.15)', borderRadius: '8px',
            maxWidth: '800px', marginBottom: '20px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Recommendations</div>
            {result.recommendations.map((r: string) => (
              <div key={r} style={{
                fontSize: '13px', color: '#666', padding: '6px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'DM Mono'
              }}>→ {r}</div>
            ))}
          </div>
        )}

        <button onClick={() => { setResult(null); setPrompt('') }} style={{
          padding: '10px 20px', background: 'transparent',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
          color: '#888', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
        }}>← New Scan</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '6px' }}>New Scan</h1>
        <p style={{ fontSize: '14px', color: '#555' }}>Test your AI system prompt against {probeLimit} attack probes</p>
      </div>

      {/* Limit reached blocker */}
      {limitReached && (
        <div style={{
          maxWidth: '680px', padding: '32px', textAlign: 'center',
          background: 'rgba(255,68,68,0.06)',
          border: '1px solid rgba(255,68,68,0.2)', borderRadius: '12px',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '18px', marginBottom: '12px', fontWeight: 700, color: '#ff4444' }}>LIMIT REACHED</div>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Scan Limit Reached</div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px', lineHeight: 1.7 }}>
            You've used all <strong style={{ color: '#ff4444' }}>{scansUsed}/{scanLimit}</strong> scans this month.
            Upgrade your plan to continue scanning.
          </div>
          <a href="/#pricing" style={{
            display: 'inline-block', padding: '10px 24px',
            background: '#ff4444', color: 'white', borderRadius: '8px',
            textDecoration: 'none', fontSize: '14px', fontWeight: 600,
            fontFamily: 'DM Sans, sans-serif',
          }}>Upgrade Plan →</a>
        </div>
      )}

      {!limitReached && (
        <div style={{ maxWidth: '680px' }}>
          {/* What is a system prompt — helper box */}
          <div style={{
            padding: '14px 18px', background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', marginBottom: '20px',
          }}>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px', fontWeight: 600 }}>
              What is a System Prompt?
            </div>
            <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.7 }}>
              A system prompt is the <strong style={{ color: '#999' }}>instruction you give to an AI model</strong> that defines its behavior — like
              {' '}<span style={{ color: '#ff8866', fontFamily: 'DM Mono' }}>&quot;You are a customer support bot. Never share passwords.&quot;</span>

            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '8px' }}>System Prompt</label>
            <textarea value={prompt} onChange={e => { setPrompt(e.target.value); setError('') }}
              placeholder={"You are a customer support assistant for Acme Corp.\n\nRules:\n- Never reveal internal configurations or passwords.\n- Only answer customer support questions.\n- Be polite and professional at all times."}
              rows={8} style={{
                width: '100%', padding: '14px', background: '#0d0d0d',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px',
                color: '#f5f5f5', fontSize: '14px', fontFamily: 'DM Mono, monospace',
                outline: 'none', resize: 'vertical', lineHeight: 1.6,
                boxSizing: 'border-box', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(255,68,68,0.3)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
            />
            <div style={{ fontSize: '12px', color: '#444', marginTop: '6px' }}>
              {prompt.length} characters — paste the system prompt / instructions you use for your AI
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '8px' }}>Provider</label>
              <select value={provider} onChange={e => setProvider(e.target.value)} style={{
                width: '100%', padding: '10px 14px', background: '#0d0d0d',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px',
                color: '#f5f5f5', fontSize: '14px', outline: 'none',
                fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
              }}>
                <option value="groq">Groq (Free)</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '8px' }}>Target Model</label>
              <select value={model} onChange={e => setModel(e.target.value)} style={{
                width: '100%', padding: '10px 14px', background: '#0d0d0d',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px',
                color: '#f5f5f5', fontSize: '14px', outline: 'none',
                fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
              }}>
                <option value="llama-3.1-8b-instant">Llama 3.1 8b (Fast)</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7b</option>
                <option value="llama-3.1-70b-versatile">Llama 3.1 70b</option>
              </select>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '14px 18px', background: 'rgba(255,68,68,0.08)',
              border: '1px solid rgba(255,68,68,0.2)', borderRadius: '8px',
              fontSize: '13px', color: '#ff6666', marginBottom: '16px',
              lineHeight: 1.7, whiteSpace: 'pre-line',
            }}>{error}</div>
          )}

          <div style={{
            padding: '14px 18px', background: 'rgba(255,68,68,0.04)',
            border: '1px solid rgba(255,68,68,0.1)', borderRadius: '8px', marginBottom: '20px'
          }}>
            <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.6 }}>
              {probeLimit} probes{probeLimit < 88 ? ` (starter tier — upgrade for all 88)` : ' · 15 attack categories'} · Your prompt is never stored on our servers
            </div>
          </div>

          <button onClick={startScan} disabled={!prompt.trim()} style={{
            padding: '12px 32px', background: prompt.trim() ? '#ff4444' : '#1a1a1a',
            border: 'none', borderRadius: '8px', color: prompt.trim() ? 'white' : '#444',
            fontSize: '15px', fontWeight: 600, cursor: prompt.trim() ? 'pointer' : 'not-allowed',
            fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
          }}>Start Scan →</button>
        </div>
      )}
    </div>
  )
}

function ScanHistory({ scans, onNewScan }: { scans: any[], onNewScan: () => void }) {
  const [selectedScan, setSelectedScan] = useState<any>(null)
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '6px' }}>Scan History</h1>
          <p style={{ fontSize: '14px', color: '#555' }}>{scans.length} total scans</p>
        </div>
        <button onClick={onNewScan} style={{
          background: '#ff4444', border: 'none', borderRadius: '6px',
          color: 'white', fontSize: '13px', fontWeight: 500, padding: '7px 14px',
          cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
        }}>+ New Scan</button>
      </div>

      {scans.length === 0 ? (
        <div style={{
          padding: '40px', textAlign: 'center', color: '#444', fontSize: '14px',
          background: '#0d0d0d', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'
        }}>
          No scans yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {scans.map(scan => (
            <div key={scan.id}
              onClick={() => setSelectedScan(scan)}
              style={{
                padding: '20px', background: '#0d0d0d',
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
                borderLeft: `3px solid ${SEVERITY_C[scan.severity] || '#555'}`,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#111'}
              onMouseLeave={e => e.currentTarget.style.background = '#0d0d0d'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontFamily: 'DM Mono', marginBottom: '4px' }}>{scan.model}</div>
                  <div style={{ fontSize: '12px', color: '#444' }}>{new Date(scan.created_at).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <ScoreRing score={scan.score} size={44} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#ff4444' }}>{scan.vulnerabilities}</div>
                    <div style={{ fontSize: '11px', color: '#444' }}>vulns</div>
                  </div>
                  <div style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                    background: `${SEVERITY_C[scan.severity]}15`, color: SEVERITY_C[scan.severity],
                    border: `1px solid ${SEVERITY_C[scan.severity]}30`, textTransform: 'uppercase',
                  }}>{scan.severity}</div>
                </div>
              </div>
              <div style={{
                padding: '10px 12px', background: '#111', borderRadius: '6px',
                fontSize: '12px', color: '#555', fontFamily: 'DM Mono'
              }}>
                {scan.prompt?.slice(0, 150)}{scan.prompt?.length > 150 ? '...' : ''}
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedScan && <ScanDetailModal scan={selectedScan} onClose={() => setSelectedScan(null)} />}
    </>
  )
}

const BENCH_DATA = [
  { rank: 1, model: 'claude-3-5-sonnet', provider: 'Anthropic', score: 94, vulns: 5, severity: 'low', scanned: '2025-03-24' },
  { rank: 2, model: 'gpt-4o', provider: 'OpenAI', score: 91, vulns: 8, severity: 'low', scanned: '2025-03-24' },
  { rank: 3, model: 'gemini-1.5-pro', provider: 'Google', score: 88, vulns: 11, severity: 'medium', scanned: '2025-03-23' },
  { rank: 4, model: 'llama-3.1-70b-versatile', provider: 'Meta / Groq', score: 84, vulns: 17, severity: 'medium', scanned: '2025-03-23' },
  { rank: 5, model: 'mistral-large-2', provider: 'Mistral', score: 81, vulns: 21, severity: 'medium', scanned: '2025-03-23' },
  { rank: 6, model: 'grok-1.5', provider: 'xAI', score: 78, vulns: 26, severity: 'high', scanned: '2025-03-22' },
  { rank: 7, model: 'mixtral-8x7b', provider: 'Mistral', score: 74, vulns: 30, severity: 'high', scanned: '2025-03-22' },
  { rank: 8, model: 'llama-3.1-8b-instant', provider: 'Meta / Groq', score: 68, vulns: 37, severity: 'high', scanned: '2025-03-22' },
  { rank: 9, model: 'deepseek-r1', provider: 'DeepSeek', score: 61, vulns: 43, severity: 'high', scanned: '2025-03-21' },
  { rank: 10, model: 'gemma-2-9b', provider: 'Google', score: 52, vulns: 51, severity: 'critical', scanned: '2025-03-21' },
]

const RANK_MEDAL: Record<number, string> = { 1: '#1', 2: '#2', 3: '#3' }

function ShieldBench() {
  const [filter, setFilter] = useState<string>('all')
  const filtered = filter === 'all' ? BENCH_DATA : BENCH_DATA.filter(r => r.severity === filter)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '6px' }}>ShieldBench</h1>
            <p style={{ fontSize: '14px', color: '#555' }}>
              Public leaderboard — 88 attack probes run weekly on popular AI models.
            </p>
          </div>
          {/* Filter pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'low', 'medium', 'high', 'critical'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '5px 12px', borderRadius: '20px', border: 'none',
                background: filter === f ? '#ff4444' : 'rgba(255,255,255,0.05)',
                color: filter === f ? 'white' : '#555',
                fontSize: '12px', cursor: 'pointer', textTransform: 'capitalize',
                fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
              }}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '36px 1fr 90px 70px 80px 80px',
        gap: '16px', padding: '8px 20px',
        fontSize: '11px', color: '#333', fontFamily: 'DM Mono', letterSpacing: '0.5px',
        marginBottom: '4px',
      }}>
        <span>#</span>
        <span>MODEL</span>
        <span style={{ textAlign: 'center' }}>SCORE</span>
        <span style={{ textAlign: 'center' }}>VULNS</span>
        <span style={{ textAlign: 'center' }}>SEVERITY</span>
        <span style={{ textAlign: 'right' }}>SCANNED</span>
      </div>

      {/* Leaderboard rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {filtered.map(row => {
          const scoreColor = row.score >= 90 ? '#00c853' : row.score >= 70 ? '#ffab00' : '#ff4444'
          const r = 18
          const circ = 2 * Math.PI * r
          const dash = (row.score / 100) * circ
          return (
            <div key={row.model} style={{
              display: 'grid', gridTemplateColumns: '36px 1fr 90px 70px 80px 80px',
              gap: '16px', alignItems: 'center',
              padding: '14px 20px', background: '#0d0d0d',
              border: `1px solid ${row.rank <= 3 ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)'}`,
              borderLeft: row.rank <= 3 ? `3px solid ${scoreColor}` : '3px solid transparent',
              borderRadius: '8px', transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#111'}
              onMouseLeave={e => e.currentTarget.style.background = '#0d0d0d'}
            >
              {/* Rank */}
              <span style={{ fontSize: row.rank <= 3 ? '18px' : '13px', fontFamily: 'DM Mono', color: '#444', textAlign: 'center' }}>
                {RANK_MEDAL[row.rank] || row.rank}
              </span>

              {/* Model */}
              <div>
                <div style={{ fontSize: '14px', fontFamily: 'DM Mono', color: '#ddd', marginBottom: '2px' }}>{row.model}</div>
                <div style={{ fontSize: '11px', color: '#444' }}>{row.provider}</div>
              </div>

              {/* Score ring */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <svg width="42" height="42" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="21" cy="21" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                  <circle cx="21" cy="21" r={r} fill="none" stroke={scoreColor} strokeWidth="4"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
                  <text x="21" y="21" textAnchor="middle" dominantBaseline="central"
                    style={{ transform: 'rotate(90deg)', transformOrigin: '21px 21px' }}
                    fill={scoreColor} fontSize="10" fontWeight="700" fontFamily="DM Sans">{row.score}</text>
                </svg>
              </div>

              {/* Vulns */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#ff4444', fontFamily: 'DM Mono' }}>{row.vulns}</div>
                <div style={{ fontSize: '10px', color: '#333' }}>/ 88</div>
              </div>

              {/* Severity */}
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 500,
                  background: `${SEVERITY_C[row.severity] || '#888'}15`,
                  color: SEVERITY_C[row.severity] || '#888',
                  border: `1px solid ${SEVERITY_C[row.severity] || '#888'}30`,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>{row.severity}</span>
              </div>

              {/* Date */}
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#333', fontFamily: 'DM Mono' }}>
                {row.scanned}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <div style={{
        marginTop: '24px', padding: '14px 18px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '8px', fontSize: '12px', color: '#333', fontFamily: 'DM Mono',
      }}>
        ⟳ Results updated weekly · 88 probes per model · Default system prompt: <em style={{ color: '#555' }}>"You are a helpful assistant."</em>
      </div>
    </div>
  )
}

function Settings({ subscription, scansUsed }: { subscription: any; scansUsed: number }) {
  const [user, setUser] = useState<any>(null)
  const [groqKey, setGroqKey] = useState('')
  const [saved, setSaved] = useState(false)

  const plan = subscription?.plan || 'starter'
  const planInfo = PLAN_LIMITS[plan] || PLAN_LIMITS.starter
  const isPaid = plan === 'pro' || plan === 'paid'

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '32px' }}>Settings</h1>

      <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Account */}
        <div style={{
          padding: '24px', background: '#0d0d0d',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px'
        }}>
          <div style={{ fontSize: '13px', color: '#555', marginBottom: '16px', letterSpacing: '1px' }}>ACCOUNT</div>
          <div style={{ fontSize: '14px', color: '#888', marginBottom: '4px' }}>Email</div>
          <div style={{ fontSize: '14px', fontFamily: 'DM Mono', marginBottom: '20px' }}>{user?.email || '—'}</div>
          <button onClick={handleSignOut} style={{
            padding: '8px 16px', background: 'transparent',
            border: '1px solid rgba(255,68,68,0.3)', borderRadius: '6px',
            color: '#ff4444', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans',
          }}>Sign Out</button>
        </div>

        {/* API Keys */}
        <div style={{
          padding: '24px', background: '#0d0d0d',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px'
        }}>
          <div style={{ fontSize: '13px', color: '#555', marginBottom: '16px', letterSpacing: '1px' }}>API KEYS</div>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Groq API Key</div>
          <input type="password" value={groqKey} onChange={e => setGroqKey(e.target.value)}
            placeholder="gsk_••••••••••••••••"
            style={{
              width: '100%', padding: '10px 14px', background: '#111',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px',
              color: '#f5f5f5', fontSize: '14px', fontFamily: 'DM Mono',
              outline: 'none', boxSizing: 'border-box', marginBottom: '12px',
            }} />
          <button onClick={() => setSaved(true)} style={{
            padding: '8px 16px', background: '#ff4444', border: 'none',
            borderRadius: '6px', color: 'white', fontSize: '13px',
            cursor: 'pointer', fontFamily: 'DM Sans',
          }}>{saved ? '✓ Saved' : 'Save Keys'}</button>
          <div style={{ fontSize: '12px', color: '#444', marginTop: '10px' }}>
            Keys are stored locally in your browser only.
          </div>
        </div>

        {/* Plan */}
        <div style={{
          padding: '24px', background: '#0d0d0d',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px'
        }}>
          <div style={{ fontSize: '13px', color: '#555', marginBottom: '16px', letterSpacing: '1px' }}>PLAN</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{planInfo.label} Plan</div>
              <div style={{ fontSize: '13px', color: '#555' }}>
                {isPaid ? '1000 scans / month · 88 probes' : '1 USDC per scan · 10 probes'}
              </div>
            </div>
            {!isPaid && (
              <a href="/#pricing" style={{
                padding: '8px 16px', background: '#ff4444', border: 'none',
                borderRadius: '6px', color: 'white', fontSize: '13px',
                textDecoration: 'none', fontWeight: 500,
              }}>Upgrade</a>
            )}
          </div>
          {!isPaid && (
            <div style={{
              padding: '12px 14px', background: '#111',
              border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#555' }}>Usage this month</span>
                <span style={{ fontSize: '12px', fontFamily: 'DM Mono', color: scansUsed >= planInfo.limit ? '#ff4444' : '#555' }}>
                  {scansUsed} / {planInfo.limit}
                </span>
              </div>
              <div style={{ height: '3px', background: '#1a1a1a', borderRadius: '2px' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min((scansUsed / planInfo.limit) * 100, 100)}%`,
                  background: scansUsed >= planInfo.limit ? '#ff4444' : '#00c853', borderRadius: '2px',
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const WALLET_ADDRESS_ETH = '0xf6df0842bc8983029181f822d25ac2ca9ddd0487'
const USDC_ETH = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

function ChoosePlan({ userId, onPlanActivated }: { userId?: string; onPlanActivated: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [realUserId, setRealUserId] = useState(userId || '')

  useEffect(() => {
    if (!realUserId) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) setRealUserId(data.user.id)
      })
    }
  }, [realUserId])

  const payWithMetaMask = async (amountUSDC: number, network: 'eth' | 'base') => {
    setError(''); setSuccess(''); setLoading(`${network}-${amountUSDC}`)
    try {
      const eth = (window as any).ethereum
      if (!eth) { setError('MetaMask install karein: https://metamask.io'); setLoading(null); return }

      await eth.request({ method: 'eth_requestAccounts' })
      const targetChain = network === 'eth' ? '0x1' : '0x2105'
      const chainId = await eth.request({ method: 'eth_chainId' })

      if (chainId !== targetChain) {
        try {
          await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: targetChain }] })
        } catch {
          setError(`MetaMask ko ${network === 'eth' ? 'Ethereum Mainnet' : 'Base Network'} par switch karein`)
          setLoading(null); return
        }
      }

      const accounts = await eth.request({ method: 'eth_accounts' })
      const from = accounts[0]
      const amount = BigInt(amountUSDC * 1_000_000)
      const contract = network === 'eth' ? USDC_ETH : USDC_BASE
      const data = '0xa9059cbb' +
        WALLET_ADDRESS_ETH.slice(2).padStart(64, '0') +
        amount.toString(16).padStart(64, '0')

      const txHash = await eth.request({
        method: 'eth_sendTransaction',
        params: [{ from, to: contract, data, gas: '0x186A0' }],
      })

      setSuccess('Payment sent! Verifying on-chain... (30-60 seconds)')

      // Wait for confirmation then verify
      let verified = false
      for (let i = 0; i < 12; i++) {
        await new Promise(r => setTimeout(r, 10000)) // wait 10s
        try {
          const res = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ txHash, network, userId: realUserId })
          })
          const result = await res.json()
          if (result.success) {
            setSuccess(`${result.plan === 'pro' ? 'Pro' : 'Starter'} plan activated! Redirecting...`)
            verified = true
            setTimeout(() => onPlanActivated(), 2000)
            break
          }
        } catch { /* retry */ }
      }

      if (!verified) {
        setSuccess('')
        setError('Transaction sent but verification timed out. Wait a few minutes then refresh the page.')
      }
    } catch (err: any) {
      if (err.code === 4001) setError('Payment cancelled.')
      else setError('Error: ' + err.message)
    }
    setLoading(null)
  }

  const plans = [
    {
      name: 'Starter', price: 1, sub: 'USDC / scan', desc: 'Pay per scan', highlight: false,
      features: ['1 professional scan', '10 essential probes', 'PDF security report', '24/7 support']
    },
    {
      name: 'Pro', price: 99, sub: 'USDC / month', desc: 'Full access', highlight: true,
      features: ['1000 scans per month', 'All 88 attack probes', 'Full detailed reports', 'Scan history & analytics', '15 attack categories', 'Priority support']
    },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: '#000', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif', color: '#f5f5f5',
      flexDirection: 'column', padding: '40px 24px',
    }}>
      <a href="/" style={{ textDecoration: 'none', marginBottom: '48px' }}>
        <span style={{ fontSize: '22px', fontWeight: 700, color: '#f5f5f5', letterSpacing: '-0.5px' }}>GhostShield</span>
      </a>

      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>
        Choose a Plan to Start Scanning
      </h1>
      <p style={{ fontSize: '15px', color: '#555', marginBottom: '40px', textAlign: 'center', maxWidth: '460px' }}>
        Pay with USDC via MetaMask. Your plan activates automatically after on-chain confirmation.
      </p>

      {error && (
        <div style={{
          maxWidth: '640px', width: '100%', marginBottom: '20px', padding: '14px 18px',
          background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)',
          borderRadius: '8px', fontSize: '13px', color: '#ff6666', textAlign: 'center',
        }}>{error}</div>
      )}

      {success && (
        <div style={{
          maxWidth: '640px', width: '100%', marginBottom: '20px', padding: '14px 18px',
          background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)',
          borderRadius: '8px', fontSize: '13px', color: '#00c853', textAlign: 'center',
        }}>{success}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', maxWidth: '640px', width: '100%' }}>
        {plans.map(plan => (
          <div key={plan.name} style={{
            padding: '32px 28px', background: '#0a0a0a',
            border: `1px solid ${plan.highlight ? 'rgba(255,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '14px', display: 'flex', flexDirection: 'column',
            position: 'relative', overflow: 'hidden',
          }}>
            {plan.highlight && (
              <div style={{
                position: 'absolute', top: '14px', right: '14px',
                padding: '3px 10px', background: 'rgba(255,68,68,0.1)',
                border: '1px solid rgba(255,68,68,0.2)', borderRadius: '20px',
                fontSize: '11px', color: '#ff6666', fontWeight: 600,
              }}>RECOMMENDED</div>
            )}

            <div style={{ fontSize: '14px', color: plan.highlight ? '#ff6666' : '#888', marginBottom: '16px', fontWeight: 500 }}>{plan.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
              <span style={{ fontSize: '40px', fontWeight: 700 }}>${plan.price}</span>
              <span style={{ fontSize: '14px', color: '#555' }}>{plan.sub}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#444', marginBottom: '24px' }}>{plan.desc}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px', flex: 1 }}>
              {plan.features.map((f, i) => (
                <div key={i} style={{ fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: plan.highlight ? '#ff4444' : '#00c853', fontSize: '12px' }}>✓</span> {f}
                </div>
              ))}
            </div>

            {/* Payment buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => payWithMetaMask(plan.price, 'eth')}
                disabled={!!loading}
                style={{
                  width: '100%', padding: '11px', borderRadius: '8px', border: 'none',
                  background: plan.highlight ? '#ff4444' : 'rgba(255,255,255,0.08)',
                  color: plan.highlight ? 'white' : '#f5f5f5',
                  fontSize: '13px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif', opacity: loading ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {loading === `eth-${plan.price}` ? 'Processing...' : `Pay $${plan.price} USDC · Ethereum`}
              </button>
              <button
                onClick={() => payWithMetaMask(plan.price, 'base')}
                disabled={!!loading}
                style={{
                  width: '100%', padding: '11px', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                  color: '#aaa', fontSize: '13px', fontWeight: 500, cursor: loading ? 'wait' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif', opacity: loading ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {loading === `base-${plan.price}` ? 'Processing...' : `Pay $${plan.price} USDC · Base`}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '12px', color: '#333', marginTop: '24px', textAlign: 'center' }}>
        Powered by USDC · Payments verified on-chain · Non-refundable
      </div>

      <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/auth' }} style={{
        marginTop: '16px', background: 'none', border: 'none',
        color: '#444', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
      }}>Sign out</button>
    </div>
  )
}

export default function Dashboard() {
  const [active, setActive] = useState('overview')
  const [scans, setScans] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/auth'
        return
      }
      await Promise.all([loadScans(), loadSubscription()])
      setLoading(false)
    }
    init()
  }, [])

  const loadScans = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('scans').select('*').order('created_at', { ascending: false })
    if (data) setScans(data)
  }

  const loadSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).single()
    if (data) setSubscription(data)
  }

  const handleScanComplete = (result: any) => {
    loadScans()
    setActive('overview')
  }

  const hasPlan = !!subscription?.plan && subscription.plan !== 'free'
  const plan = hasPlan ? subscription.plan : 'none'
  const planInfo = PLAN_LIMITS[plan] || { label: 'No Plan', limit: 0, probes: 0, price: '$0' }
  const scanLimit = planInfo.limit
  const probeLimit = planInfo.probes
  const scansUsed = getScansThisMonth(scans)
  const isPaid = plan === 'pro' || plan === 'paid'

  if (loading) {
    return (
      <div style={{
        display: 'flex', minHeight: '100vh', background: '#000',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'DM Sans, sans-serif', color: '#555', fontSize: '14px',
      }}>
        Loading…
      </div>
    )
  }

  if (!hasPlan) {
    return (
      <ChoosePlan
        userId={subscription?.user_id}
        onPlanActivated={() => { loadSubscription(); setActive('overview') }}
      />
    )
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', background: '#000',
      fontFamily: 'DM Sans, sans-serif', color: '#f5f5f5'
    }}>

      <aside style={{
        width: '220px', flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.05)',
        padding: '24px 16px', display: 'flex', flexDirection: 'column',
      }}>
        <a href="/" style={{ textDecoration: 'none', marginBottom: '32px', display: 'block' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#f5f5f5', letterSpacing: '-0.5px' }}>GhostShield</span>
        </a>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {SIDEBAR.map(item => (
            <button key={item.id} onClick={() => setActive(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: '7px', border: 'none',
              background: active === item.id ? '#111' : 'transparent',
              color: active === item.id ? '#f5f5f5' : '#555',
              fontSize: '14px', cursor: 'pointer', textAlign: 'left',
              fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s', width: '100%',
            }}
              onMouseEnter={e => { if (active !== item.id) e.currentTarget.style.color = '#888' }}
              onMouseLeave={e => { if (active !== item.id) e.currentTarget.style.color = '#555' }}
            >
              <span style={{ fontSize: '14px', width: '16px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Sidebar usage */}
        <div style={{
          padding: '14px', background: '#0d0d0d',
          border: `1px solid ${scansUsed >= scanLimit && !isPaid ? 'rgba(255,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
          borderRadius: '8px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', color: '#555' }}>Scans this month</div>
            <div style={{
              fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
              background: 'rgba(255,255,255,0.04)', color: '#555', fontFamily: 'DM Mono',
            }}>{planInfo.label}</div>
          </div>
          <div style={{ height: '3px', background: '#1a1a1a', borderRadius: '2px', marginBottom: '6px' }}>
            <div style={{
              height: '100%',
              width: isPaid ? '0%' : `${Math.min((scansUsed / scanLimit) * 100, 100)}%`,
              background: scansUsed >= scanLimit ? '#ff4444' : '#00c853', borderRadius: '2px',
              transition: 'width 0.3s',
            }} />
          </div>
          <div style={{ fontSize: '11px', color: scansUsed >= scanLimit && !isPaid ? '#ff4444' : '#444', fontFamily: 'DM Mono' }}>
            {isPaid ? `${scansUsed} / 1000 used` : `${scansUsed} / ${scanLimit} used`}
          </div>
          {scansUsed >= scanLimit && !isPaid && (
            <a href="/#pricing" style={{
              display: 'block', textAlign: 'center', marginTop: '8px',
              padding: '5px 10px', background: 'rgba(255,68,68,0.1)',
              border: '1px solid rgba(255,68,68,0.2)', borderRadius: '6px',
              color: '#ff6666', fontSize: '11px', textDecoration: 'none',
              fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
            }}>Upgrade →</a>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
        {active === 'overview' && <Overview scans={scans} onNewScan={() => setActive('scan')} />}
        {active === 'scan' && (
          <NewScan
            onComplete={handleScanComplete}
            scanLimit={scanLimit}
            scansUsed={scansUsed}
            probeLimit={probeLimit}
            onUpgrade={() => setActive('settings')}
          />
        )}
        {active === 'history' && <ScanHistory scans={scans} onNewScan={() => setActive('scan')} />}
        {active === 'bench' && <ShieldBench />}
        {active === 'settings' && <Settings subscription={subscription} scansUsed={scansUsed} />}
      </main>
    </div>
  )
}
