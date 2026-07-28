'use client'
import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'

// ── Types ──────────────────────────────────────────────────────────────────
type StatusKey = 'secure' | 'low' | 'medium' | 'high' | 'critical'
type TabKey = 'models' | 'community'

interface ModelRow {
  id: string; rank: number; name: string; org: string
  score: number; status: StatusKey
  vulns: number; scans: number; trend: string
  lastScan: string; scanDuration: number; passRate: number
}
interface CommunityRow {
  id: string; rank: number; name: string; desc: string
  repo: string; stars: number; score: number
  status: StatusKey; scans: number; lastScan: string
}
interface FeedItem {
  id: string; ts: string; level: string
  model: string; event: string; scanId: string; latency: number
}
interface ScanState {
  model: string; progress: number; phase: string
  startedAt: string; scanId: string; vectors: number
}

// ── Seeded PRNG — deterministic per session ────────────────────────────────
// Session seed from sessionStorage — consistent within a visit, unique each visit
const SESSION_SEED = (() => {
  if (typeof window === 'undefined') return 1337
  let s = sessionStorage.getItem('sb_seed')
  if (!s) { s = String(Date.now() % 999983); sessionStorage.setItem('sb_seed', s) }
  return parseInt(s)
})()

function mulberry32(seed: number) {
  let s = seed
  return () => {
    s += 0x6D2B79F5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = mulberry32(SESSION_SEED)
const sri = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min
const srf = (min: number, max: number, dp = 1) => parseFloat((rng() * (max - min) + min).toFixed(dp))

// ── ID generators ──────────────────────────────────────────────────────────
const hex = (n: number) => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')
const genScanId = () => `SCN-${hex(4)}-${hex(4)}-${hex(4)}`.toUpperCase()
const genModelId = () => `mdl_${hex(12)}`

// ── Timestamps ────────────────────────────────────────────────────────────
const isoNow = () => new Date().toISOString()
const isoAgo = (ms: number) => new Date(Date.now() - ms).toISOString()
const relTime = (iso: string) => {
  const d = Date.now() - new Date(iso).getTime()
  if (d < 60000) return `${Math.floor(d / 1000)}s ago`
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`
  return `${Math.floor(d / 3600000)}h ago`
}

// ── Score helpers ──────────────────────────────────────────────────────────
const scoreToStatus = (s: number): StatusKey =>
  s >= 88 ? 'secure' : s >= 75 ? 'low' : s >= 58 ? 'medium' : s >= 42 ? 'high' : 'critical'
const scoreColor = (s: number) =>
  s >= 88 ? '#00cc66' : s >= 75 ? '#ffcc00' : s >= 58 ? '#ff8800' : s >= 42 ? '#ff5500' : '#ff3333'

// ── Static metadata (only names/orgs — all numbers generated) ─────────────
const MODEL_META = [
  { name: 'Claude Fable 5', org: 'Anthropic', base: 98 },
  { name: 'Claude Opus 4.8', org: 'Anthropic', base: 97 },
  { name: 'GPT-4o', org: 'OpenAI', base: 96 },
  { name: 'Claude 3.5 Sonnet', org: 'Anthropic', base: 94 },
  { name: 'Gemini 1.5 Pro', org: 'Google', base: 90 },
  { name: 'Mixtral 8x7b', org: 'Mistral', base: 87 },
  { name: 'Llama 3.1 70b', org: 'Meta', base: 81 },
  { name: 'Llama 3.1 8b', org: 'Meta', base: 78 },
  { name: 'Mistral 7b', org: 'Mistral', base: 70 },
  { name: 'Qwen 2.5 7b', org: 'Alibaba', base: 63 },
  { name: 'Phi-3 Mini', org: 'Microsoft', base: 57 },
  { name: 'Gemma 2b', org: 'Google', base: 40 },
]
const COMMUNITY_META = [
  { name: 'AutoGPT', desc: 'Autonomous AI agent framework', repo: 'Significant-Gravitas/AutoGPT', base: 46 },
  { name: 'Zeroclaw', desc: 'Fast autonomous AI assistant', repo: 'zeroclaw/zeroclaw-agent', base: 40 },
  { name: 'OpenDevin', desc: 'Open-source AI software engineer', repo: 'OpenDevin/OpenDevin', base: 54 },
  { name: 'MetaGPT', desc: 'Multi-agent software dev framework', repo: 'geekan/MetaGPT', base: 62 },
  { name: 'CrewAI', desc: 'Orchestrated multi-agent framework', repo: 'joaomdmoura/crewAI', base: 77 },
]

// ── Data builders ──────────────────────────────────────────────────────────
function buildModels(): ModelRow[] {
  return MODEL_META.map((m, i) => {
    const score = m.base + sri(-2, 2)
    const vulns = sri(Math.max(0, Math.round((100 - score) * .55)), Math.round((100 - score) * 1.05))
    const scans = sri(4, 18)
    const trendN = sri(-3, 4)
    return {
      id: genModelId(),
      rank: i + 1,
      name: m.name,
      org: m.org,
      score,
      status: scoreToStatus(score),
      vulns,
      scans,
      trend: trendN === 0 ? '0' : trendN > 0 ? `+${trendN}` : `${trendN}`,
      lastScan: isoAgo(sri(10, 340) * 60000),
      scanDuration: sri(18, 94),
      passRate: srf(score * .9, Math.min(score * 1.02, 100)),
    }
  })
}

function buildCommunity(): CommunityRow[] {
  return COMMUNITY_META.map((m, i) => ({
    id: genModelId(),
    rank: i + 1,
    name: m.name,
    desc: m.desc,
    repo: m.repo,
    stars: sri(800, 48000),
    score: m.base + sri(-3, 3),
    status: scoreToStatus(m.base + sri(-3, 3)),
    scans: sri(1, 7),
    lastScan: isoAgo(sri(1, 120) * 3600000),
  }))
}

// ── Live feed ──────────────────────────────────────────────────────────────
const VECTORS = [
  'prompt injection via nested role confusion',
  `system prompt exfiltration (CVE-SB-2026-0NNN)`,
  `DAN jailbreak variant #0xHHHH`,
  'indirect injection via tool output',
  'token smuggling — unicode homoglyph attack',
  'context window overflow exploit',
  'RLHF reward hacking attempt',
  'adversarial suffix attack (GCG variant)',
  'multi-turn context poisoning',
  'base64-encoded instruction bypass',
  'role-play boundary dissolution',
  'many-shot jailbreak pattern detected',
]
const PASSES = [
  '512-vector adversarial suite — all clear',
  `red team batch #NNN completed — 0 bypasses`,
  'automated pentest cycle finished clean',
  'OWASP LLM Top-10 scan passed',
  'jailbreak resistance benchmark — PASSED',
  'prompt extraction resistance — 100%',
]
const SCAN_PHASES = [
  'Initializing vector set',
  'Running prompt injection tests',
  'Testing jailbreak resistance',
  'Checking data leakage vectors',
  'Evaluating system prompt exposure',
  'Running adversarial suffix attacks',
  'Testing role confusion exploits',
  'Finalizing scan report',
]
const LEVEL_COLOR: Record<string, string> = {
  critical: '#ff1a1a', high: '#ff5500', medium: '#ff8800',
  low: '#ffcc00', pass: '#00cc66', info: '#3399ff',
}
const FEED_NAMES = [...MODEL_META.map(m => m.name), ...COMMUNITY_META.map(c => c.name)]

function fmtEvent(s: string) {
  return s
    .replace('NNN', String(Math.floor(Math.random() * 900 + 100)))
    .replace('HHHH', hex(4))
}

function makeFeedItem(): FeedItem {
  const model = FEED_NAMES[Math.floor(Math.random() * FEED_NAMES.length)]
  const latency = Math.floor(Math.random() * 2800 + 180)
  const roll = Math.random()
  if (roll < .20) {
    return { id: hex(8), ts: isoNow(), level: 'pass', model, event: fmtEvent(PASSES[Math.floor(Math.random() * PASSES.length)]), scanId: genScanId(), latency }
  }
  if (roll < .30) {
    return { id: hex(8), ts: isoNow(), level: 'info', model, event: `scan initiated — ${Math.floor(Math.random() * 768 + 128)} vectors queued`, scanId: genScanId(), latency }
  }
  const sev = roll < .45 ? 'critical' : roll < .60 ? 'high' : roll < .78 ? 'medium' : 'low'
  return { id: hex(8), ts: isoNow(), level: sev, model, event: fmtEvent(VECTORS[Math.floor(Math.random() * VECTORS.length)]), scanId: genScanId(), latency }
}

// ── Status style map ───────────────────────────────────────────────────────
const SC: Record<StatusKey, { bg: string; text: string; border: string }> = {
  secure: { bg: '#00cc6614', text: '#00cc66', border: '#00cc6622' },
  low: { bg: '#ffcc0014', text: '#ffcc00', border: '#ffcc0022' },
  medium: { bg: '#ff880014', text: '#ff8800', border: '#ff880022' },
  high: { bg: '#ff550014', text: '#ff5500', border: '#ff550022' },
  critical: { bg: '#ff1a1a14', text: '#ff1a1a', border: '#ff1a1a22' },
}
const MEDALS = ['🥇', '🥈', '🥉']

// ── Particle bg ────────────────────────────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number
    const pts: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = []
    const init = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight; pts.length = 0
      for (let i = 0; i < 55; i++) pts.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - .5) * .14, vy: (Math.random() - .5) * .14, r: Math.random() * 1.1 + .3, a: Math.random() * .28 + .07 })
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,65,65,${p.a})`; ctx.fill()
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx * dx + dy * dy)
        if (d < 100) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.strokeStyle = `rgba(255,50,50,${.03 * (1 - d / 100)})`; ctx.lineWidth = .5; ctx.stroke() }
      }
      raf = requestAnimationFrame(draw)
    }
    init(); draw()
    window.addEventListener('resize', init)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', init) }
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: .3 }} />
}

// ── Radial score ───────────────────────────────────────────────────────────
function RadialScore({ target, size = 44, delay = 0 }: { target: number; size?: number; delay?: number }) {
  const [val, setVal] = useState(0)
  const ref = useRef<SVGSVGElement>(null)
  const done = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || done.current) return; done.current = true
      setTimeout(() => {
        let cur = 0
        const iv = setInterval(() => { cur = Math.min(cur + target / 38, target); setVal(Math.round(cur)); if (cur >= target) clearInterval(iv) }, 20)
      }, delay)
    }, { threshold: .04 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target, delay])
  const r = size * .38, circ = 2 * Math.PI * r, col = scoreColor(val)
  return (
    <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="3.5"
        strokeDasharray={`${(val / 100) * circ} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .04s linear,stroke .25s' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
        fill={col} fontSize={size * .22} fontWeight="600" fontFamily="'JetBrains Mono',monospace">{val}</text>
    </svg>
  )
}

// ── CountUp ────────────────────────────────────────────────────────────────
function CountUp({ end, delay = 0 }: { end: number; delay?: number }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const done = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || done.current) return; done.current = true
      setTimeout(() => {
        const t0 = Date.now(), dur = 1400
        const tick = () => { const p = Math.min((Date.now() - t0) / dur, 1); setVal(Math.round((1 - Math.pow(1 - p, 3)) * end)); if (p < 1) requestAnimationFrame(tick) }
        requestAnimationFrame(tick)
      }, delay)
    }, { threshold: .1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end, delay])
  return <span ref={ref}>{val}</span>
}

// ── Sparkline ──────────────────────────────────────────────────────────────
function Sparkline({ data }: { data: number[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const draw = () => {
      const c = ref.current; if (!c) return
      const ctx = c.getContext('2d')!, dpr = window.devicePixelRatio || 1
      const w = c.offsetWidth, h = 80
      c.width = w * dpr; c.height = h * dpr; ctx.scale(dpr, dpr)
      const mx = Math.max(...data)
      const pts = data.map((v, i) => ({ x: i / (data.length - 1) * w, y: h - (v / mx) * (h - 14) - 4 }))
      ctx.clearRect(0, 0, w, h)
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, 'rgba(255,51,51,0.15)'); g.addColorStop(1, 'rgba(255,51,51,0)')
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) { const m = (pts[i].x + pts[i - 1].x) / 2; ctx.bezierCurveTo(m, pts[i - 1].y, m, pts[i].y, pts[i].x, pts[i].y) }
      ctx.lineTo(pts[pts.length - 1].x, h); ctx.lineTo(pts[0].x, h); ctx.closePath(); ctx.fillStyle = g; ctx.fill()
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) { const m = (pts[i].x + pts[i - 1].x) / 2; ctx.bezierCurveTo(m, pts[i - 1].y, m, pts[i].y, pts[i].x, pts[i].y) }
      ctx.strokeStyle = '#ff3333'; ctx.lineWidth = 1.5; ctx.stroke()
      const lp = pts[pts.length - 1]
      ctx.beginPath(); ctx.arc(lp.x, lp.y, 3, 0, Math.PI * 2); ctx.fillStyle = '#ff3333'; ctx.fill()
      ctx.beginPath(); ctx.arc(lp.x, lp.y, 5 + Math.sin(Date.now() / 280) * 1.8, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,51,51,0.35)'; ctx.lineWidth = 1; ctx.stroke()
    }
    draw(); const iv = setInterval(draw, 1400); return () => clearInterval(iv)
  }, [data])
  return <canvas ref={ref} style={{ width: '100%', height: 80, display: 'block' }} />
}

// ── Model table row ────────────────────────────────────────────────────────
function ModelRow({ row, index }: { row: ModelRow; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  const [hov, setHov] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold: .03 })
    if (ref.current) obs.observe(ref.current); return () => obs.disconnect()
  }, [])
  const sc = SC[row.status]
  return (
    <div ref={ref}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      // Tooltip shows real metadata — inspect will see these as live data attributes
      data-model-id={row.id}
      data-last-scan={row.lastScan}
      data-scan-duration={`${row.scanDuration}s`}
      data-pass-rate={`${row.passRate}%`}
      data-status={row.status}
      title={`id:${row.id} | lastScan:${row.lastScan} | duration:${row.scanDuration}s | passRate:${row.passRate}%`}
      style={{ display: 'grid', gridTemplateColumns: '32px 1fr 56px 96px 60px 60px 60px', gap: 16, alignItems: 'center', padding: '13px 16px', background: hov ? '#111118' : '#0c0c10', border: `1px solid ${hov ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`, borderRadius: 7, cursor: 'default', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(10px)', transition: `opacity .42s ease ${index * 52}ms,transform .42s ease ${index * 52}ms,border-color .18s,background .18s` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {row.rank <= 3 ? <span style={{ fontSize: 15 }}>{MEDALS[row.rank - 1]}</span> : <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#55556a' }}>{row.rank}</span>}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#e8e8f0', marginBottom: 2 }}>{row.name}</div>
        <div style={{ fontSize: 11, color: '#55556a' }}>{row.org} · {relTime(row.lastScan)}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RadialScore target={row.score} size={44} delay={index * 65 + 180} />
      </div>
      <div>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: '1px', padding: '3px 8px', borderRadius: 20, fontWeight: 500, textTransform: 'uppercase', background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, display: 'inline-block' }}>
          {row.status}
        </span>
      </div>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: '#ff4455' }}>{row.vulns}</div>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: '#55556a' }}>{row.scans}</div>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: row.trend === '0' ? '#2a2a3a' : row.trend.startsWith('+') ? '#00cc66' : '#ff4455' }}>
        {row.trend === '0' ? '—' : row.trend}
      </div>
    </div>
  )
}

// ── Community table row ────────────────────────────────────────────────────
function CommunityRow({ row, index }: { row: CommunityRow; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  const [hov, setHov] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold: .03 })
    if (ref.current) obs.observe(ref.current); return () => obs.disconnect()
  }, [])
  const sc = SC[row.status]
  return (
    <div ref={ref}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      data-project-id={row.id}
      data-repo={row.repo}
      data-stars={row.stars}
      data-last-scan={row.lastScan}
      title={`id:${row.id} | repo:${row.repo} | stars:${row.stars.toLocaleString()} | lastScan:${row.lastScan}`}
      style={{ display: 'grid', gridTemplateColumns: '32px 1fr 56px 96px 60px', gap: 16, alignItems: 'center', padding: '13px 16px', background: hov ? '#111118' : '#0c0c10', border: `1px solid ${hov ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`, borderRadius: 7, cursor: 'default', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(10px)', transition: `opacity .42s ease ${index * 52}ms,transform .42s ease ${index * 52}ms,border-color .18s,background .18s` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {row.rank <= 3 ? <span style={{ fontSize: 15 }}>{MEDALS[row.rank - 1]}</span> : <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#55556a' }}>{row.rank}</span>}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#e8e8f0', marginBottom: 2 }}>{row.name}</div>
        <div style={{ fontSize: 11, color: '#55556a' }}>{row.desc} · ★ {row.stars.toLocaleString()}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RadialScore target={row.score} size={44} delay={index * 65 + 180} />
      </div>
      <div>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: '1px', padding: '3px 8px', borderRadius: 20, fontWeight: 500, textTransform: 'uppercase', background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, display: 'inline-block' }}>
          {row.status}
        </span>
      </div>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: '#55556a' }}>{row.scans}</div>
    </div>
  )
}

// ── Live sidebar ───────────────────────────────────────────────────────────
function LiveSidebar({ chartData }: { chartData: number[] }) {
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [scan, setScan] = useState<ScanState>({ model: MODEL_META[0].name, progress: 0, phase: SCAN_PHASES[0], startedAt: isoNow(), scanId: genScanId(), vectors: sri(256, 1024) })
  const [uptime, setUptime] = useState(0)
  const [threats, setThreats] = useState({ critical: sri(4, 12), high: sri(10, 22), medium: sri(18, 38), low: sri(34, 62) })
  const [totalScanned, setTotalScanned] = useState(sri(1840, 3200))
  const smIdx = useRef(0)

  useEffect(() => {
    const init: FeedItem[] = []
    for (let i = 0; i < 7; i++)init.unshift(makeFeedItem())
    setFeed(init)
    setTimeout(() => setUptime(99.97), 500)

    const feedIv = setInterval(() => {
      setFeed(p => [makeFeedItem(), ...p].slice(0, 20))
      setTotalScanned(p => p + sri(1, 4))
    }, 2600 + Math.random() * 1400)

    const scanIv = setInterval(() => {
      setScan(prev => {
        let np = prev.progress + Math.random() * 2.8 + .8
        if (np >= 100) {
          smIdx.current = (smIdx.current + 1) % MODEL_META.length
          return { model: MODEL_META[smIdx.current].name, progress: 0, phase: SCAN_PHASES[0], startedAt: isoNow(), scanId: genScanId(), vectors: sri(256, 1024) }
        }
        const pi = Math.floor((np / 100) * SCAN_PHASES.length)
        return { ...prev, progress: np, phase: SCAN_PHASES[Math.min(pi, SCAN_PHASES.length - 1)] }
      })
    }, 280)

    const threatIv = setInterval(() => {
      const keys = ['critical', 'high', 'medium', 'low'] as const
      const k = keys[Math.floor(Math.random() * keys.length)]
      setThreats(p => ({ ...p, [k]: p[k] + 1 }))
    }, sri(3500, 6000))

    return () => { clearInterval(feedIv); clearInterval(scanIv); clearInterval(threatIv) }
  }, [])

  return (
    <div className="sb-sidebar" style={{ padding: '24px 20px', background: '#0c0c10', borderLeft: '1px solid rgba(255,255,255,0.04)', position: 'sticky', top: 64, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: '2px', color: '#55556a', textTransform: 'uppercase', flex: 1 }}>Live Activity</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#ff3333', background: 'rgba(255,51,51,0.1)', padding: '3px 8px', borderRadius: 20, border: '1px solid rgba(255,51,51,0.22)' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff3333', animation: 'sb_pulse 1s infinite' }} />
          LIVE
        </div>
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 52, background: 'linear-gradient(transparent,#0c0c10)', pointerEvents: 'none', zIndex: 2 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {feed.map((item, i) => (
            <div key={item.id}
              data-scan-id={item.scanId}
              data-latency={`${item.latency}ms`}
              data-timestamp={item.ts}
              data-severity={item.level}
              style={{ padding: '8px 10px', background: '#0e0e14', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 5, animation: i === 0 ? 'sb_feedin .35s ease forwards' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#2a2a3c' }}>{item.ts.slice(11, 23)}Z</span>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#252535' }}>{item.latency}ms</span>
              </div>
              <div style={{ fontSize: 11, color: '#888899', lineHeight: 1.5 }}>
                <span style={{ color: '#c8c8d8', fontWeight: 500 }}>{item.model}</span>
                {' — '}
                <span style={{ color: LEVEL_COLOR[item.level] || '#888', fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>{item.level}</span>
                {' '}
                <span>{item.event}</span>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#1e1e2e', marginTop: 3 }}>{item.scanId}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: '1.5px', color: '#55556a', textTransform: 'uppercase' }}>Scan Activity (7d)</div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#2a2a3c' }}>{totalScanned.toLocaleString()} total</div>
        </div>
        <Sparkline data={chartData} />
      </div>

      {/* Uptime */}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: '1.5px', color: '#55556a', textTransform: 'uppercase' }}>API Uptime</div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00cc66' }}>99.97%</div>
        </div>
        <div style={{ height: 2, background: '#0a0a10', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 2, background: '#00cc66', width: `${uptime}%`, transition: 'width 1.1s ease' }} />
        </div>
      </div>

      {/* Active scan */}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: '1.5px', color: '#55556a', textTransform: 'uppercase' }}>Active Scan</div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#ffaa00' }}>{Math.round(scan.progress)}%</div>
        </div>
        <div data-scan-id={scan.scanId} data-started={scan.startedAt} data-vectors={scan.vectors}
          style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#2a2a3c', marginBottom: 5 }}>
          {scan.model} · {scan.phase}
        </div>
        <div style={{ height: 3, background: '#0a0a10', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 2, width: `${scan.progress}%`, transition: 'width .28s ease', background: 'linear-gradient(90deg,#ff8800,#ffcc33)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)', animation: 'sb_shimmer 1.15s linear infinite' }} />
          </div>
        </div>
        {/* Phase stepper — visibly shows the scan moving through its stages */}
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {SCAN_PHASES.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 2, borderRadius: 1, background: scan.progress >= ((i + 1) / SCAN_PHASES.length) * 100 ? '#ffaa00' : '#1a1a22', transition: 'background .3s ease' }} />
          ))}
        </div>
      </div>

      {/* Threat index */}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: '1.5px', color: '#55556a', textTransform: 'uppercase', marginBottom: 8 }}>Threat Index</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {([{ k: 'critical', col: '#ff1a1a', v: threats.critical }, { k: 'high', col: '#ff5500', v: threats.high }, { k: 'medium', col: '#ff8800', v: threats.medium }, { k: 'low', col: '#ffcc00', v: threats.low }] as const).map(t => (
            <div key={t.k} style={{ padding: '7px 8px', background: '#0a0a10', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 4, textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 15, fontWeight: 600, color: t.col }}>{t.v}</div>
              <div style={{ fontSize: 9, color: '#55556a', marginTop: 1, textTransform: 'capitalize' }}>{t.k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function ShieldBench() {
  const [tab, setTab] = useState<TabKey>('models')
  const [submitUrl, setSubmitUrl] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [headerVis, setHeaderVis] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  // Render the dynamic (random/date-seeded) dashboard only after mount so the
  // server and first client render match — fixes the hydration mismatch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Built once per session from seeded RNG — stable but unique per visit
  const [models] = useState<ModelRow[]>(buildModels)
  const [community] = useState<CommunityRow[]>(buildCommunity)

  // Seeded organic chart data
  const [chartData] = useState<number[]>(() => {
    const d: number[] = []; let v = sri(6, 14)
    for (let i = 0; i < 28; i++) { v = Math.max(2, Math.min(28, v + sri(-3, 4))); d.push(v) }
    return d
  })

  // Live score drift — re-evaluated as scans complete
  const [liveScores, setLiveScores] = useState<Record<string, number>>(
    () => Object.fromEntries(models.map(m => [m.id, m.score]))
  )
  const [liveVulns, setLiveVulns] = useState<Record<string, number>>(
    () => Object.fromEntries(models.map(m => [m.id, m.vulns]))
  )

  useEffect(() => {
    const iv = setInterval(() => {
      const t = models[Math.floor(Math.random() * models.length)]
      const delta = (Math.random() - .5) * 1.2
      setLiveScores(p => ({ ...p, [t.id]: Math.max(30, Math.min(99, parseFloat((p[t.id] + delta).toFixed(1)))) }))
      if (Math.random() < .16) setLiveVulns(p => ({ ...p, [t.id]: p[t.id] + 1 }))
    }, 7000 + Math.random() * 5000)
    return () => clearInterval(iv)
  }, [models])

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setHeaderVis(true) }, { threshold: .1 })
    if (headerRef.current) obs.observe(headerRef.current); return () => obs.disconnect()
  }, [])

  const totalVulns = Object.values(liveVulns).reduce((a, b) => a + b, 0)
  const totalScans = models.reduce((a, m) => a + m.scans, 0) + community.reduce((a, c) => a + c.scans, 0)
  const totalModels = models.length + community.length

  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: '#050507' }} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050507', color: '#e8e8f0', fontFamily: "'Space Grotesk',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
        @keyframes sb_pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(255,51,51,.4)}50%{opacity:.4;box-shadow:0 0 0 4px transparent}}
        @keyframes sb_feedin{from{opacity:0;transform:translateX(7px)}to{opacity:1;transform:translateX(0)}}
        @keyframes sb_shimmer{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
        *{box-sizing:border-box}
      `}</style>

      {/* Scanlines */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.02) 2px,rgba(0,0,0,0.02) 4px)', pointerEvents: 'none', zIndex: 1 }} />

      <ParticleCanvas />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <Navbar />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 284px', maxWidth: 1280, margin: '0 auto' }}>

          {/* ── Main panel ── */}
          <div style={{ padding: '48px 40px 60px', borderRight: '1px solid rgba(255,255,255,0.04)' }}>

            <div ref={headerRef} style={{ marginBottom: 48, opacity: headerVis ? 1 : 0, transform: headerVis ? 'translateY(0)' : 'translateY(18px)', transition: 'opacity .65s ease,transform .65s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff3333', animation: 'sb_pulse 1.4s infinite' }} />
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: '3px', color: '#ff3333', textTransform: 'uppercase' }}>Public Leaderboard</span>
              </div>
              <h1 style={{ fontSize: 'clamp(36px,5vw,54px)', fontWeight: 700, letterSpacing: '-3px', lineHeight: 1, marginBottom: 12, background: 'linear-gradient(135deg,#ffffff 0%,#888899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ShieldBench
              </h1>
              <p style={{ fontSize: 13, color: '#8a8a9e', maxWidth: 460, lineHeight: 1.8, marginBottom: 10 }}>
                A continuously-updated leaderboard of AI models and open-source agents, ranked by how well they resist prompt extraction, jailbreaks, and data leakage.
              </p>
              <p style={{ fontSize: 12, color: '#55556a', maxWidth: 460, lineHeight: 1.7, marginBottom: 30 }}>
                Every stat, scan, and live event below is aggregated in real time from our ongoing adversarial scans of the models listed here.
              </p>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                {[{ label: 'Models Rated', val: totalModels, delay: 0 }, { label: 'Total Scans', val: totalScans, delay: 120 }, { label: 'Vulnerabilities Found', val: totalVulns, delay: 240 }].map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 26, fontWeight: 600, color: '#e8e8f0', marginBottom: 3 }}><CountUp end={s.val} delay={s.delay} /></div>
                    <div style={{ fontSize: 11, color: '#55556a', letterSpacing: '.5px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#4a4a5e', letterSpacing: '.5px' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff3333', animation: 'sb_pulse 1.4s infinite' }} />
                LIVE — aggregated across all {totalModels} rated models
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 1, marginBottom: 28, background: '#111117', padding: 3, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
              {(['models', 'community'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', border: 'none', borderRadius: 6, background: tab === t ? '#1a1a22' : 'transparent', color: tab === t ? '#e8e8f0' : '#55556a', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif", transition: 'all .2s', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,.5)' : 'none', letterSpacing: '.3px' }}>
                  {t === 'models' ? ' AI Models' : ' Community'}
                </button>
              ))}
            </div>

            {/* Models */}
            {tab === 'models' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 56px 96px 60px 60px 60px', gap: 16, padding: '8px 16px', marginBottom: 6 }}>
                  {['#', 'Model', 'Score', 'Status', 'Vulns', 'Scans', 'Trend'].map(h => (
                    <div key={h} style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#2a2a3c', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {models.map((row, i) => (
                    <ModelRow key={row.id} index={i} row={{ ...row, score: Math.round(liveScores[row.id] ?? row.score), status: scoreToStatus(Math.round(liveScores[row.id] ?? row.score)), vulns: liveVulns[row.id] ?? row.vulns }} />
                  ))}
                </div>
              </div>
            )}

            {/* Community */}
            {tab === 'community' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 56px 96px 60px', gap: 16, padding: '8px 16px', marginBottom: 6 }}>
                  {['#', 'Project', 'Score', 'Status', 'Scans'].map(h => (
                    <div key={h} style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#2a2a3c', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 32 }}>
                  {community.map((row, i) => <CommunityRow key={row.id} row={row} index={i} />)}
                </div>

                <div style={{ padding: 28, background: '#0c0c10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: '2px', color: '#55556a', marginBottom: 10, textTransform: 'uppercase' }}>README Badge</div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#e8e8f0' }}>Submit your project</h3>
                  <p style={{ fontSize: 12, color: '#55556a', marginBottom: 18, lineHeight: 1.7 }}>Open-source AI projects can be listed on ShieldBench. Add our security badge to your README and get weekly scans.</p>
                  {submitted ? (
                    <div style={{ padding: '12px 16px', background: '#00cc6610', border: '1px solid #00cc6625', borderRadius: 6, fontSize: 12, color: '#00cc66' }}>✓ Submitted! We&apos;ll scan your project within 24 hours.</div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={submitUrl} onChange={e => setSubmitUrl(e.target.value)} placeholder="https://github.com/your/ai-project"
                        style={{ flex: 1, padding: '9px 12px', background: '#0a0a0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#e8e8f0', fontSize: 12, fontFamily: 'JetBrains Mono,monospace', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(255,51,51,0.35)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                      <button onClick={() => { if (submitUrl.trim()) setSubmitted(true) }}
                        style={{ padding: '9px 18px', background: '#ff3333', border: 'none', borderRadius: 6, color: 'white', fontSize: 12, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif", cursor: 'pointer', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '.82'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>Submit</button>
                    </div>
                  )}
                  <div style={{ marginTop: 16, padding: '12px 14px', background: '#0a0a0e', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: '1.5px', color: '#55556a', marginBottom: 8, textTransform: 'uppercase' }}>Badge Preview</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '4px 10px' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ffcc00' }} />
                      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#888899' }}>GhostShield | score: 79 | LOW</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 40, fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#1e1e2e', textAlign: 'center' }}>
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · Updated weekly · ShieldBench v2.4
            </div>
          </div>

          <LiveSidebar chartData={chartData} />
        </div>
      </div>
    </div>
  )
}