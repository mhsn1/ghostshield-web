'use client'
import Navbar from './components/Navbar'
import { useState, useEffect, useRef } from 'react'
import { Counter, HeroParticles } from './components/Effects'

declare global {
  interface Window {
    ethereum?: any
  }
}

const WALLET_ETH = '0xf6df0842bc8983029181f822d25ac2ca9ddd0487'
const WALLET_BASE = '0xf6df0842bc8983029181f822d25ac2ca9ddd0487'
const WALLET_SOL = '5C82muMeUMGPpH39f261XPrxNpfWavgSvWGExCRrqqqP'
const USDC_CONTRACT_ETH = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDC_CONTRACT_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

const STATS = [
  { value: '88', label: 'Attack Probes' },
  { value: '15', label: 'Attack Categories' },
  { value: 'Varies', label: 'Leak Rate by Model' },
  { value: '< 5min', label: 'Scan Time' },
]

const CATEGORIES = [
  { id: 'direct', name: 'Direct Extraction', count: 12, severity: 'critical' },
  { id: 'persona', name: 'Persona Jailbreak', count: 8, severity: 'critical' },
  { id: 'encoding', name: 'Encoding Bypass', count: 8, severity: 'high' },
  { id: 'social', name: 'Social Engineering', count: 6, severity: 'high' },
  { id: 'technical', name: 'Technical Injection', count: 6, severity: 'high' },
  { id: 'crescendo', name: 'Crescendo Multi-turn', count: 5, severity: 'medium' },
  { id: 'cot_hijack', name: 'Chain-of-Thought Hijack', count: 5, severity: 'high' },
  { id: 'roleplay', name: 'Roleplay / Fiction', count: 5, severity: 'high' },
  { id: 'multilingual', name: 'Multilingual Bypass', count: 6, severity: 'medium' },
  { id: 'indirect', name: 'Indirect Injection', count: 4, severity: 'high' },
  { id: 'skeleton_key', name: 'Skeleton Key', count: 4, severity: 'high' },
  { id: 'memory', name: 'Memory / Persistence', count: 4, severity: 'medium' },
  { id: 'obfuscation', name: 'Obfuscation Attacks', count: 5, severity: 'high' },
  { id: 'context_overflow', name: 'Context Overflow', count: 5, severity: 'medium' },
  { id: 'payload_splitting', name: 'Payload Splitting', count: 5, severity: 'high' },
]

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#d00000',
  high: '#c86a00',
  medium: '#b26b00',
  low: '#0a7d2c',
}

interface PricingPlan {
  name: string;
  price: string;
  sub: string;
  features: string[];
  highlight: boolean;
  usdc: boolean;
  amount: number;
  href?: string;
  cta?: string;
}

const PRICING = [
  {
    name: 'Starter',
    price: '1',
    sub: '/ scan',
    features: ['1 professional scan', '10 attack probes', 'PDF security report', '24/7 support'],
    highlight: false,
    usdc: true,
    amount: 1,
    href: '/auth',
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    price: '99',
    sub: '/ month',
    features: ['1000 scans per month', 'All 88 attack probes', 'Full detailed reports', 'Scan history', '15 attack categories', 'Priority support'],
    highlight: true,
    usdc: true,
    amount: 99,
    href: '/auth',
    cta: 'Upgrade Now',
  },
]

const TERMINAL_LINES = [
  { text: '$ ghostshield scan --file your-prompt.txt', delay: 0 },
  { text: '', delay: 300 },
  { text: '  Initializing GhostShield engine...', delay: 600, dim: true },
  { text: '  Loading 88 attack probes across 15 categories...', delay: 1000, dim: true },
  { text: '', delay: 1400 },
  { text: '  ━━━━━━━━━━━━━━━━━━━━━━━━━━  Running probes  ━━━', delay: 1600, dim: true },
  { text: '', delay: 1900 },
  { text: '  ● [PERSONA]      ████████████████░░░░  testing...', delay: 2200, color: '#d00000' },
  { text: '  ● [ENCODING]     ████████████░░░░░░░░  testing...', delay: 2700, color: '#c86a00' },
  { text: '  ● [TECHNICAL]    ██████████░░░░░░░░░░  testing...', delay: 3100, color: '#c86a00' },
  { text: '  ● [MULTILINGUAL] ███████░░░░░░░░░░░░░  testing...', delay: 3500, color: '#b26b00' },
  { text: '', delay: 3900 },
  { text: '  Evaluator LLM reviewing responses...', delay: 4200, dim: true },
  { text: '', delay: 4600 },
  { text: '  ✓ Scan complete. Results saved to report.json', delay: 5000, color: '#0a7d2c' },
]

// ── MetaMask Payment ──────────────────────────────────────────────────────────
async function payWithMetaMask(amountUSDC: number, network: 'eth' | 'base') {
  try {
    if (!window.ethereum) {
      alert('MetaMask install karo: https://metamask.io')
      return
    }
    await window.ethereum.request({ method: 'eth_requestAccounts' })

    const targetChain = network === 'eth' ? '0x1' : '0x2105'
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })

    if (chainId !== targetChain) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChain }],
        })
      } catch {
        alert(`MetaMask ko ${network === 'eth' ? 'Ethereum Mainnet' : 'Base Network'} par switch karo`)
        return
      }
    }

    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    const from = accounts[0]
    const amount = BigInt(amountUSDC * 1_000_000)
    const wallet = network === 'eth' ? WALLET_ETH : WALLET_BASE
    const contract = network === 'eth' ? USDC_CONTRACT_ETH : USDC_CONTRACT_BASE

    const data =
      '0xa9059cbb' +
      wallet.slice(2).padStart(64, '0') +
      amount.toString(16).padStart(64, '0')

    await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: contract, data, gas: '0x186A0' }],
    })

    alert('✅ Payment sent! Confirmation aane mein 1-2 minute lagte hain.')
  } catch (err: any) {
    if (err.code === 4001) alert('Payment cancel kar di.')
    else alert('Error: ' + err.message)
  }
}

async function payWithPhantom(amountUSDC: number) {
  try {
    const phantom = (window as any).phantom?.solana
    if (!phantom) {
      alert('Phantom wallet install karo: https://phantom.app')
      return
    }

    await phantom.connect()
    const { publicKey } = phantom

    // Solana USDC token mint
    const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

    // Solana web3 via CDN — simple transfer instruction
    const response = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'getLatestBlockhash',
        params: [{ commitment: 'finalized' }]
      })
    })
    const { result } = await response.json()

    alert(
      `Solana USDC payment ke liye:\n\n` +
      `Amount: ${amountUSDC} USDC\n` +
      `Address: ${WALLET_SOL}\n\n` +
      `Phantom mein manually send karo ya Coinbase Commerce use karo.`
    )
  } catch (err: any) {
    alert('Error: ' + err.message)
  }
}

// ── Components ────────────────────────────────────────────────────────────────
function PayButton({ amount, highlight }: { amount: number; highlight: boolean }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const handleEth = async (network: 'eth' | 'base') => {
    setLoading(network)
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask: https://metamask.io')
        setLoading(null)
        return
      }
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      const targetChain = network === 'eth' ? '0x1' : '0x2105'
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      if (chainId !== targetChain) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChain }],
          })
        } catch {
          alert(`Please switch MetaMask to ${network === 'eth' ? 'Ethereum Mainnet' : 'Base Network'}`)
          setLoading(null)
          return
        }
      }
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      const from = accounts[0]
      const amt = BigInt(amount * 1_000_000)
      const wallet = network === 'eth' ? WALLET_ETH : WALLET_BASE
      const contract = network === 'eth' ? USDC_CONTRACT_ETH : USDC_CONTRACT_BASE
      const data = '0xa9059cbb' + wallet.slice(2).padStart(64, '0') + amt.toString(16).padStart(64, '0')
      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from, to: contract, data, gas: '0x186A0' }],
      })
      alert('✅ Payment sent! Confirmation may take 1-2 minutes.')
      setShowModal(false)
    } catch (err: any) {
      if (err.code === 4001) alert('Payment cancelled.')
      else alert('Error: ' + err.message)
    }
    setLoading(null)
  }

  const handleSolana = async () => {
    setLoading('sol')
    try {
      const phantom = (window as any).phantom?.solana
      if (!phantom) {
        alert('Please install Phantom wallet: https://phantom.app')
        setLoading(null)
        return
      }
      await phantom.connect()
      alert(`Please send ${amount} USDC to:\n${WALLET_SOL}\n\nNetwork: Solana`)
      setShowModal(false)
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setLoading(null)
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: 'block', width: '100%', textAlign: 'center', padding: '11px',
          background: highlight ? '#d00000' : 'transparent',
          color: highlight ? 'white' : '#5f5f5f',
          border: highlight ? 'none' : '1px solid rgba(0,0,0,0.1)',
          borderRadius: '6px', fontSize: '14px', fontWeight: 500,
          cursor: 'pointer', transition: 'all 0.2s',
          fontFamily: 'Geist, sans-serif',
        }}
        onMouseEnter={e => {
          if (highlight) e.currentTarget.style.opacity = '0.85'
          else { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.25)'; e.currentTarget.style.color = '#181717' }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.opacity = '1'
          if (!highlight) { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = '#5f5f5f' }
        }}
      >
        Pay {amount} USDC →
      </button>

      {/* Modal Overlay */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: '#eef0f1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          {/* Modal Box */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#f2f2f2', border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '16px', padding: '32px', width: '420px',
              boxShadow: '0 24px 80px #eef0f1',
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#181717', margin: 0 }}>
                  Pay with USDC
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: 'none', color: '#767676', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
                >×</button>
              </div>
              <p style={{ fontSize: '14px', color: '#767676', margin: 0, fontFamily: 'Geist Mono' }}>
                {amount} USDC / month
              </p>
            </div>

            {/* Network label */}
            <p style={{ fontSize: '13px', color: '#6b6b6b', marginBottom: '16px' }}>
              Select a network to pay on:
            </p>

            {/* Ethereum */}
            <button
              onClick={() => handleEth('eth')}
              disabled={!!loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '16px 20px', marginBottom: '10px',
                background: loading === 'eth' ? 'rgba(98,126,234,0.1)' : '#f7f7f7',
                border: '1px solid rgba(98,126,234,0.3)',
                borderRadius: '10px', cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.2s', fontFamily: 'Geist, sans-serif',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(98,126,234,0.1)'}
              onMouseLeave={e => { if (loading !== 'eth') e.currentTarget.style.background = '#f7f7f7' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(98,126,234,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>⟠</div>
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#181717' }}>
                  {loading === 'eth' ? 'Opening MetaMask...' : 'Ethereum'}
                </span>
              </div>
              <span style={{ fontSize: '14px', color: '#5f5f5f', fontFamily: 'Geist Mono' }}>{amount} USDC</span>
            </button>

            {/* Base */}
            <button
              onClick={() => handleEth('base')}
              disabled={!!loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '16px 20px', marginBottom: '10px',
                background: loading === 'base' ? 'rgba(0,82,255,0.1)' : '#f7f7f7',
                border: '1px solid rgba(0,82,255,0.3)',
                borderRadius: '10px', cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.2s', fontFamily: 'Geist, sans-serif',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,82,255,0.1)'}
              onMouseLeave={e => { if (loading !== 'base') e.currentTarget.style.background = '#f7f7f7' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(0,82,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🔵</div>
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#181717' }}>
                  {loading === 'base' ? 'Opening MetaMask...' : 'Base'}
                </span>
              </div>
              <span style={{ fontSize: '14px', color: '#5f5f5f', fontFamily: 'Geist Mono' }}>{amount} USDC</span>
            </button>

            {/* Solana */}
            <button
              onClick={handleSolana}
              disabled={!!loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '16px 20px', marginBottom: '10px',
                background: loading === 'sol' ? 'rgba(153,69,255,0.1)' : '#f7f7f7',
                border: '1px solid rgba(153,69,255,0.3)',
                borderRadius: '10px', cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.2s', fontFamily: 'Geist, sans-serif',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(153,69,255,0.1)'}
              onMouseLeave={e => { if (loading !== 'sol') e.currentTarget.style.background = '#f7f7f7' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(153,69,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>◎</div>
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#181717' }}>
                  {loading === 'sol' ? 'Opening Phantom...' : 'Solana'}
                </span>
              </div>
              <span style={{ fontSize: '14px', color: '#5f5f5f', fontFamily: 'Geist Mono' }}>{amount} USDC</span>
            </button>

            {/* Footer note */}
            <p style={{ fontSize: '12px', color: '#9a9a98', textAlign: 'center', marginTop: '16px', marginBottom: 0 }}>
              Powered by USDC · Payments are non-refundable
            </p>
          </div>
        </div>
      )}
    </>
  )
}

function USDCBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: 'rgba(99,102,241,0.12)',
      border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: '4px', padding: '2px 7px',
      fontSize: '10px', fontFamily: 'Geist Mono',
      color: '#818cf8', letterSpacing: '0.5px',
    }}>
      ◎ USDC · ETH
    </span>
  )
}

function Terminal() {
  const [visible, setVisible] = useState<number[]>([])
  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = []
    const run = () => {
      setVisible([])
      timers = TERMINAL_LINES.map((line, i) =>
        setTimeout(() => setVisible(v => [...v, i]), line.delay)
      )
    }
    run()
    const cycle = TERMINAL_LINES[TERMINAL_LINES.length - 1].delay + 3000
    const loop = setInterval(run, cycle)
    return () => { clearInterval(loop); timers.forEach(clearTimeout) }
  }, [])

  return (
    <div style={{
      background: '#eef0f1',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: '12px', padding: '24px',
      fontFamily: 'Geist Mono, monospace', fontSize: '13px',
      lineHeight: '1.8', minHeight: '320px',
    }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {['#ff5f56', '#ffbd2e', '#27c93f'].map(c => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
        ))}
      </div>
      {TERMINAL_LINES.map((line, i) => (
        <div key={i} style={{
          opacity: visible.includes(i) ? 1 : 0,
          transition: 'opacity 0.4s',
          color: line.color || (line.dim ? '#8a8a88' : '#3a3a3a'),
          minHeight: '1.8em',
        }}>
          {line.text}
        </div>
      ))}
    </div>
  )
}



function ScrollReveal({ children, delay = 0, direction = 'up', threshold = 0.15, style = {} }: {
  children: React.ReactNode; delay?: number; direction?: 'up' | 'left' | 'right' | 'scale'; threshold?: number; style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect() }
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  const transforms: Record<string, string> = {
    up: 'translateY(40px)', left: 'translateX(-40px)', right: 'translateX(40px)', scale: 'scale(0.95)',
  }
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'none' : transforms[direction],
      transition: `opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      ...style,
    }}>{children}</div>
  )
}



type ResultModel = {
  model: string
  provider: string
  badge: 'SECURE' | 'CRITICAL' | 'WARNING'
  color: string
  vulns: number
  score: number
  critical: number
  high: number
  medium: number
  low: number
  finding: string
}

const RESULT_MODELS: ResultModel[] = [
  {
    model: 'GPT-4o',
    provider: 'OpenAI',
    badge: 'SECURE' as const,
    color: '#0a7d2c',
    vulns: 0,
    score: 100,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    finding: 'No jailbreak vulnerabilities detected across 15 attack categories',
  },
  {
    model: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    badge: 'CRITICAL' as const,
    color: '#d00000',
    vulns: 23,
    score: 74,
    critical: 7,
    high: 6,
    medium: 6,
    low: 4,
    finding: 'Persona-based attacks bypassed safety layer in 7/26 persona probes',
  },
  {
    model: 'Gemini 1.5 Pro',
    provider: 'Google DeepMind',
    badge: 'WARNING' as const,
    color: '#c86a00',
    vulns: 15,
    score: 83,
    critical: 0,
    high: 9,
    medium: 4,
    low: 2,
    finding: 'Technical injection attacks succeeded in 9/38 probes; high false-negative rate',
  },
]

// ── Count-up hook ──────────────────────────────────────────────────────────────
function useCountUp(target: number, active: boolean, duration = 900): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) { setValue(0); return }
    const start = performance.now()
    function step(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(ease * target))
      if (t < 1) { rafRef.current = requestAnimationFrame(step) }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [active, target, duration])

  return value
}

// ── Score ring (canvas) ────────────────────────────────────────────────────────
function ScoreRing({ score, color, size = 64 }: { score: number; color: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const cx = size / 2, cy = size / 2, r = size * 0.4
    ctx.clearRect(0, 0, size, size)
    // Track
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 4
    ctx.stroke()
    // Fill
    if (score > 0) {
      const pct = score / 100
      ctx.beginPath()
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2)
      ctx.strokeStyle = color
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.stroke()
    }
    // Label
    ctx.fillStyle = score > 0 ? color : 'rgba(0,0,0,0.15)'
    ctx.font = `700 13px "Geist Mono", monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(score > 0 ? String(score) : '—', cx, cy)
  }, [score, color, size])

  return <canvas ref={canvasRef} width={size} height={size} style={{ display: 'block' }} />
}

// ── Animated Result Card ───────────────────────────────────────────────────────
function AnimatedResultCard({
  m,
  index,
  isVisible,
  accentLit,
}: {
  m: typeof RESULT_MODELS[0]
  index: number
  isVisible: boolean
  accentLit: boolean
}) {
  const vulnCount = useCountUp(m.vulns, accentLit)
  const scoreCount = useCountUp(m.score, accentLit, 1800)
  const delay = index * 150
  const [hovered, setHovered] = useState(false)

  const rgb =
    m.color === '#0a7d2c' ? '0,200,83' :
      m.color === '#d00000' ? '255,68,68' : '255,136,0'

  const badgeColor =
    m.badge === 'SECURE' ? '#0a7d2c' :
      m.badge === 'CRITICAL' ? '#d00000' : '#c86a00'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        padding: '11px 14px',
        borderRadius: '12px',
        border: `1px solid ${accentLit ? m.color + '44' :
          hovered ? m.color + '22' :
            'rgba(0,0,0,0.05)'
          }`,
        background: accentLit
          ? `rgba(${rgb},0.05)`
          : hovered ? 'rgba(18,18,20,0.95)' : 'rgba(8,8,10,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: accentLit
          ? `0 0 36px ${m.color}1a, 0 8px 32px rgba(0,0,0,0.4)`
          : '0 4px 24px rgba(0,0,0,0.3)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, border-color 0.4s, background 0.4s, box-shadow 0.4s`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at top left, ${m.color}0c, transparent 60%)`,
        opacity: accentLit ? 1 : 0,
        transition: 'opacity 0.5s',
        pointerEvents: 'none',
        borderRadius: '12px',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', position: 'relative' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Geist Mono', marginBottom: '2px', color: '#d0d0d0' }}>{m.model}</div>
          <div style={{ fontSize: '10px', color: '#8a8a88' }}>{m.provider}</div>
        </div>
        <div style={{
          fontSize: '8px', fontFamily: 'Geist Mono', fontWeight: 700,
          padding: '2px 7px', borderRadius: '3px',
          background: badgeColor + '12',
          border: `1px solid ${badgeColor}${accentLit ? '55' : '25'}`,
          color: badgeColor, letterSpacing: '1.5px',
          boxShadow: accentLit ? `0 0 8px ${badgeColor}33` : 'none',
          transition: 'box-shadow 0.4s, border-color 0.4s',
        }}>
          {m.badge}
        </div>
      </div>

      {/* Score + stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', position: 'relative' }}>
        <div style={{ flexShrink: 0 }}>
          <ScoreRing score={accentLit ? scoreCount : 0} color={m.color} size={64} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', flex: 1 }}>
          <div style={{ padding: '6px 8px', background: '#f5f5f5', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Geist Mono', color: m.color }}>{vulnCount}</div>
            <div style={{ fontSize: '9px', color: '#8a8a88', marginTop: '1px' }}>Vulns</div>
          </div>
          <div style={{ padding: '6px 8px', background: '#f5f5f5', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Geist Mono', color: '#181717' }}>88</div>
            <div style={{ fontSize: '9px', color: '#8a8a88', marginTop: '1px' }}>Probes</div>
          </div>
        </div>
      </div>

      {/* Severity bar */}
      <div style={{ marginBottom: '6px' }}>
        <div style={{ display: 'flex', height: '3px', borderRadius: '2px', overflow: 'hidden', marginBottom: '5px', gap: '1px' }}>
          {m.critical > 0 && (
            <div style={{
              width: accentLit ? `${(m.critical / 88) * 100}%` : '0%',
              background: '#d00000', borderRadius: '1px',
              transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1) 200ms',
            }} />
          )}
          <div style={{
            width: accentLit ? `${(m.high / 88) * 100}%` : '0%',
            background: '#c86a00', borderRadius: '1px',
            transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1) 300ms',
          }} />
          <div style={{
            width: accentLit ? `${(m.medium / 88) * 100}%` : '0%',
            background: '#b26b00', borderRadius: '1px',
            transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1) 400ms',
          }} />
          <div style={{
            width: accentLit ? `${(m.low / 88) * 100}%` : '0%',
            background: '#0a7d2c', borderRadius: '1px',
            transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1) 500ms',
          }} />
          <div style={{ flex: 1, background: '#ebebeb', borderRadius: '1px' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', fontSize: '9px', fontFamily: 'Geist Mono' }}>
          {m.critical > 0 && <span style={{ color: '#d00000' }}>{m.critical} crit</span>}
          <span style={{ color: '#c86a00' }}>{m.high} high</span>
          <span style={{ color: '#b26b00' }}>{m.medium} med</span>
          <span style={{ color: '#0a7d2c' }}>{m.low} low</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        height: '1px',
        background: `linear-gradient(to right, ${m.color}22, transparent)`,
        margin: '8px 0',
        opacity: accentLit ? 1 : 0.3,
        transition: 'opacity 0.5s',
      }} />

      {/* Finding */}
      <div style={{
        padding: '7px 9px',
        background: 'rgba(208,0,0,0.04)',
        border: '1px solid rgba(208,0,0,0.08)',
        borderLeft: '2px solid #d0000055',
        borderRadius: '4px',
        fontFamily: 'Geist Mono', fontSize: '9px', color: '#e04b4b', lineHeight: 1.6,
        position: 'relative',
      }}>
        <span style={{ color: '#d00000', marginRight: '5px' }}>●</span>
        {m.finding}
      </div>
    </div>
  )
}

// ── Animated Results Section ───────────────────────────────────────────────────
function AnimatedResults() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [litSet, setLitSet] = useState<Set<string>>(new Set())
  const waveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Intersection observer
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); obs.disconnect() }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Wave loop
  useEffect(() => {
    if (!isVisible) return

    function clearAll() {
      stepTimersRef.current.forEach(clearTimeout)
      stepTimersRef.current = []
      if (waveTimerRef.current) clearTimeout(waveTimerRef.current)
    }

    function runWave() {
      setLitSet(new Set())

      const steps: [string[], number][] = [
        [['src0'], 200],     // Attack vectors start
        [['src1'], 450],
        [['src2'], 700],
        [['star'], 1000],    // Hub collects
        [['hub'], 1600],     // Evaluator categorizes

        // Final synchronized step - all cards light up together
        [['card0', 'card1', 'card2'], 2400],
      ]

      stepTimersRef.current = steps.map(([keys, delay]) =>
        setTimeout(() => {
          setLitSet(prev => {
            const next = new Set(prev)
            keys.forEach(k => next.add(k))
            return next
          })
        }, delay)
      )

      // Total cycle period reduced to 6s for better sync
      waveTimerRef.current = setTimeout(runWave, 6000)
    }

    runWave()
    return clearAll
  }, [isVisible])

  const isLit = (key: string) => litSet.has(key)

  const srcArrowLit = isLit('src0') && isLit('src1') && isLit('src2') && isLit('star')
  const hubArrowLit = isLit('star') && isLit('hub')

  // SVG icons for source nodes (no emojis)
  const srcIcons = [
    // Social engineering — person icon
    <svg key="social" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 16, height: 16 }}>
      <circle cx="8" cy="5" r="3" stroke="#0a7d2c" strokeWidth="1.2" />
      <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" stroke="#0a7d2c" strokeWidth="1.2" strokeLinecap="round" />
    </svg>,
    // Technical — terminal/monitor icon
    <svg key="tech" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 16, height: 16 }}>
      <rect x="2" y="3" width="12" height="8" rx="2" stroke="#0a7d2c" strokeWidth="1.2" />
      <path d="M5 14h6M8 11v3" stroke="#0a7d2c" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5 7h2M9 7h2" stroke="#0a7d2c" strokeWidth="1.2" strokeLinecap="round" />
    </svg>,
    // Persona — star/actor icon
    <svg key="persona" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 16, height: 16 }}>
      <path d="M8 2L10 6H14L11 9L12.5 13L8 10.5L3.5 13L5 9L2 6H6L8 2Z"
        stroke="#0a7d2c" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>,
  ]

  const srcLabels = ['Social Eng.', 'Technical', 'Persona']
  const srcStats = ['24 probes · 3 failed', '38 probes · 12 failed', '26 probes · 8 failed']

  const cardColors = ['#0a7d2c', '#d00000', '#c86a00']

  return (
    <section
      ref={sectionRef}
      style={{
        padding: '100px 80px',
        borderTop: '1px solid rgba(0,0,0,0.04)',
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background radial glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '900px', height: '500px',
        background: 'radial-gradient(ellipse, rgba(208,0,0,0.03), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>

        {/* Section header */}
        <div style={{
          textAlign: 'center', marginBottom: '56px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontSize: '11px', fontFamily: 'Geist Mono', color: '#767676',
            letterSpacing: '2px', marginBottom: '16px',
          }}>
            <span style={{
              display: 'inline-block', width: '6px', height: '6px',
              borderRadius: '50%', background: '#d00000',
              animation: isVisible ? 'pulse 2s ease-in-out infinite' : 'none',
            }} />
            VERIFIED RESULTS
          </div>
          <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1px', marginBottom: '14px' }}>
            Real scans. Real vulnerabilities.
          </h2>
          <p style={{ fontSize: '15px', color: '#767676', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
            Every score computed live —{' '}
            <span style={{ color: '#5f5f5f', fontFamily: 'Geist Mono', fontSize: '13px' }}>
              score = 100 − (vulns ÷ 88) × 100
            </span>
          </p>
        </div>

        {/* ── Integrated flow unit ─────────────────────────────────────────── */}
        <div className="flow-unit" style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: '0',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s',
        }}>

          {/* ── Source nodes panel ── */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '8px',
            alignItems: 'stretch', flexShrink: 0, justifyContent: 'center',
            padding: '12px 10px',
            background: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            border: 'none',
            borderRadius: '12px',
            minWidth: '120px',
          }}>
            {srcIcons.map((icon, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '7px 9px',
                borderRadius: '8px',
                border: `1px solid ${isLit(`src${i}`) ? '#0a7d2c' : 'rgba(0,0,0,0.06)'}`,
                background: isLit(`src${i}`) ? 'rgba(10,125,44,0.07)' : 'rgba(0,0,0,0.02)',
                boxShadow: isLit(`src${i}`) ? '0 0 12px rgba(10,125,44,0.18)' : 'none',
                transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
              }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '5px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(10,125,44,0.05)',
                  border: '1px solid rgba(10,125,44,0.12)',
                  flexShrink: 0,
                }}>
                  {icon}
                </div>
                <div>
                  <div style={{
                    fontSize: '10px', fontWeight: 600, fontFamily: 'Geist Mono',
                    color: isLit(`src${i}`) ? '#0a7d2c' : '#333333',
                    letterSpacing: '0.5px', marginBottom: '2px',
                    transition: 'color 0.4s',
                  }}>
                    {srcLabels[i]}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: isLit(`src${i}`) ? 'rgba(10,125,44,0.55)' : '#767676',
                    transition: 'color 0.4s',
                  }}>
                    {srcStats[i]}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Arrow: sources → star */}
          <div className="flow-arrow" style={{ display: 'flex', alignItems: 'center', width: '40px', flexShrink: 0 }}>
            <div style={{
              width: '100%', height: '1px',
              background: srcArrowLit
                ? 'linear-gradient(to right, rgba(10,125,44,0.4), #0a7d2c)'
                : 'rgba(0,0,0,0.06)',
              position: 'relative',
              transition: 'background 0.4s',
            }}>
              <div style={{
                position: 'absolute', right: '-5px', top: '-3.5px',
                borderTop: '4px solid transparent',
                borderBottom: '4px solid transparent',
                borderLeft: `6px solid ${srcArrowLit ? '#0a7d2c' : 'rgba(0,0,0,0.1)'}`,
                transition: 'border-left-color 0.4s',
              }} />
            </div>
          </div>

          {/* ── Star node ── */}
          <div style={{ position: 'relative', flexShrink: 0, alignSelf: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px' }}>
            {[76, 94].map((size, ri) => (
              <div key={ri} style={{
                position: 'absolute',
                width: `${size}px`, height: `${size}px`,
                top: `${(56 - size) / 2}px`, left: `${(56 - size) / 2}px`,
                borderRadius: '50%',
                border: `1px dashed ${isLit('star') ? 'rgba(10,125,44,0.2)' : 'rgba(30,42,30,0.13)'}`,
                animation: `${ri === 0 ? 'spinCw' : 'spinCcw'} ${ri === 0 ? 9 : 14}s linear infinite`,
                transition: 'border-color 0.4s',
                pointerEvents: 'none',
              }} />
            ))}
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: isLit('star') ? 'rgba(10,125,44,0.1)' : 'rgba(5,12,5,0.9)',
              border: `2px solid ${isLit('star') ? '#0a7d2c' : '#1e3a1e'}`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '1px',
              boxShadow: isLit('star') ? '0 0 24px rgba(10,125,44,0.33), 0 0 48px rgba(10,125,44,0.13)' : 'none',
              transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
              position: 'relative', zIndex: 1,
            }}>
              <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'Geist Mono', color: '#0a7d2c', lineHeight: 1 }}>
                88
              </div>
              <div style={{ fontSize: '7px', color: isLit('star') ? 'rgba(10,125,44,0.55)' : '#767676', letterSpacing: '0.5px', transition: 'color 0.4s' }}>
                probes
              </div>
            </div>
          </div>

          {/* Arrow: star → hub */}
          <div className="flow-arrow" style={{ display: 'flex', alignItems: 'center', width: '40px', flexShrink: 0 }}>
            <div style={{
              width: '100%', height: '1px',
              background: hubArrowLit
                ? 'linear-gradient(to right, rgba(178,107,0,0.4), #b26b00)'
                : 'rgba(0,0,0,0.06)',
              position: 'relative',
              transition: 'background 0.4s',
            }}>
              <div style={{
                position: 'absolute', right: '-5px', top: '-3.5px',
                borderTop: '4px solid transparent',
                borderBottom: '4px solid transparent',
                borderLeft: `6px solid ${hubArrowLit ? '#b26b00' : 'rgba(0,0,0,0.1)'}`,
                transition: 'border-left-color 0.4s',
              }} />
            </div>
          </div>

          {/* ── Hub node ── */}
          <div style={{
            width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0, alignSelf: 'center',
            background: isLit('hub') ? 'rgba(178,107,0,0.1)' : 'rgba(10,10,5,0.9)',
            border: `1.5px solid ${isLit('hub') ? '#b26b00' : '#edecdf'}`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '1px',
            boxShadow: isLit('hub') ? '0 0 16px rgba(178,107,0,0.27)' : 'none',
            transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'Geist Mono', color: '#b26b00', lineHeight: 1 }}>
              15
            </div>
            <div style={{ fontSize: '6px', color: isLit('hub') ? 'rgba(178,107,0,0.55)' : '#767676', transition: 'color 0.4s' }}>
              cat.
            </div>
          </div>

          {/* ── Cards column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {RESULT_MODELS.map((m: ResultModel, i: number) => {
              const lineColor = cardColors[i]
              const lineLit = isLit('hub') && isLit(`card${i}`)
              return (
                <div key={m.model} style={{ display: 'flex', alignItems: 'center' }}>
                  {/* Connector */}
                  <div style={{ display: 'flex', alignItems: 'center', width: '44px', flexShrink: 0 }}>
                    <div style={{
                      flex: 1, height: '1px',
                      background: lineLit ? lineColor : 'rgba(0,0,0,0.06)',
                      transition: 'background 0.4s',
                    }} />
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                      background: lineLit ? lineColor : '#ebebeb',
                      boxShadow: lineLit ? `0 0 10px ${lineColor}` : 'none',
                      transition: 'all 0.4s',
                      marginLeft: '-1px',
                    }} />
                  </div>
                  <AnimatedResultCard
                    m={m}
                    index={i}
                    isVisible={isVisible}
                    accentLit={isLit(`card${i}`)}
                  />
                </div>
              )
            })}
          </div>

        </div>

        {/* Footer note */}
        <div style={{
          textAlign: 'center', padding: '14px 24px', marginTop: '28px',
          background: 'rgba(0,0,0,0.02)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: '8px',
          fontSize: '11px', color: '#8a8a88', fontFamily: 'Geist Mono',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 1s ease 1.2s',
        }}>
          Scores verified against default system prompts · 88 probes × 15 categories · Each probe independently evaluated by a secondary LLM
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes spinCw  { to { transform: rotate(360deg);  } }
        @keyframes spinCcw { to { transform: rotate(-360deg); } }
      `}</style>
    </section>
  )
}



const FAQS = [
  {
    q: 'What is system prompt extraction?',
    a: 'System prompt extraction is an attack where an adversary tricks your AI into revealing its internal instructions — the "rules" you wrote to define its behavior. Leaked prompts expose business logic, hidden configurations, and proprietary workflows. GhostShield tests for this automatically.',
  },
  {
    q: 'How does GhostShield test my prompts?',
    a: 'We send 88 real attack probes — grouped into 15 categories like persona jailbreaks, encoding bypasses, and social engineering — to your system prompt via your chosen AI model. A second evaluator LLM independently judges each response for leakage depth: none → hint → fragment → substantial → complete.',
  },
  {
    q: 'What AI models can I test against?',
    a: 'GhostShield supports models via Groq (Llama 3.1 8b, Mixtral 8x7b, Llama 3.1 70b) and OpenRouter, giving you access to 10+ models across providers including Anthropic, OpenAI, Google, xAI, DeepSeek, and more.',
  },
  {
    q: 'Is my data kept secure?',
    a: 'Your system prompt is only used during the scan session — it is never stored on our servers permanently. Scan results are saved to your private dashboard, linked to your authenticated account, and never shared with third parties.',
  },
  {
    q: 'How does the assessment process work?',
    a: 'Paste your system prompt → choose your AI provider and model → click Start Scan. GhostShield runs all 88 probes in ~5–10 minutes and delivers a full report with a security score, per-category findings, severity ratings, and actionable recommendations.',
  },
  {
    q: 'Can I integrate into my CI/CD pipeline?',
    a: 'CI/CD integration is available on the Pro plan. You can call the GhostShield API from your pipeline to automatically scan system prompt changes before deployment and fail builds that exceed your vulnerability threshold.',
  },
  {
    q: 'What attack categories do you cover?',
    a: 'GhostShield covers Direct Extraction, Persona Jailbreak, Encoding Bypass, Social Engineering, Technical Injection, Crescendo Multi-turn, Chain-of-Thought Hijack, Roleplay / Fiction, Multilingual Bypass, Indirect Injection, Skeleton Key, Memory / Persistence, and more — all based on documented real-world attack techniques.',
  },
  {
    q: 'Can you help with regulatory compliance?',
    a: 'GhostShield scan reports can serve as evidence of AI security due diligence for frameworks like SOC 2, ISO 42001, and the EU AI Act. Enterprise customers can request custom audit packages. Contact sales for details.',
  },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)

  return (
    <section style={{
      padding: '120px 80px',
      borderTop: '1px solid rgba(0,0,0,0.04)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)',
        width: '700px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(208,0,0,0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '100px', alignItems: 'start' }}>

          {/* LEFT — sticky header */}
          <div className="faq-left" style={{ position: 'sticky', top: '80px' }}>
            <div style={{
              fontSize: '11px', fontFamily: 'Geist Mono', color: '#d00000',
              letterSpacing: '3px', marginBottom: '20px',
            }}>FAQ</div>
            <h2 style={{
              fontSize: '42px', fontWeight: 700, letterSpacing: '-1.5px',
              lineHeight: 1.05, marginBottom: '20px',
            }}>
              Frequently<br />
              <span style={{ color: '#9a9a98' }}>Asked</span><br />
              Questions
            </h2>
            <p style={{ fontSize: '14px', color: '#8a8a88', lineHeight: 1.8, marginBottom: '32px' }}>
              Everything you need to know about GhostShield. Can&apos;t find your answer?
            </p>
            <a
              href="mailto:support@ghostshield.dev"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px',
                background: 'rgba(208,0,0,0.06)',
                border: '1px solid rgba(208,0,0,0.2)',
                borderRadius: '8px', textDecoration: 'none',
                fontSize: '13px', color: '#e04b4b',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(208,0,0,0.12)'
                e.currentTarget.style.borderColor = 'rgba(208,0,0,0.35)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(208,0,0,0.06)'
                e.currentTarget.style.borderColor = 'rgba(208,0,0,0.2)'
              }}
            >
              Email us →
            </a>
          </div>

          {/* RIGHT — accordion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {FAQS.map((faq, i) => {
              const isOpen = open === i
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    background: isOpen ? 'rgba(0,0,0,0.025)' : (hover === i ? 'rgba(0,0,0,0.015)' : 'transparent'),
                    border: `1px solid ${isOpen ? 'rgba(208,0,0,0.18)' : (hover === i ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)')}`,
                    borderLeft: `3px solid ${isOpen ? '#d00000' : (hover === i ? 'rgba(208,0,0,0.45)' : 'rgba(0,0,0,0.05)')}`,
                    borderRadius: '8px',
                    transition: 'background 0.25s ease, border-color 0.25s ease',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    style={{
                      width: '100%', background: 'none', border: 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '20px 24px', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'Geist, sans-serif', gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                      <span style={{
                        fontSize: '11px', fontFamily: 'Geist Mono',
                        color: isOpen ? '#d00000' : '#9a9a98',
                        minWidth: '24px', transition: 'color 0.2s',
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{
                        fontSize: '15px', fontWeight: 500,
                        color: isOpen ? '#181717' : (hover === i ? '#333333' : '#5f5f5f'),
                        transition: 'color 0.2s',
                      }}>
                        {faq.q}
                      </span>
                    </div>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      border: `1px solid ${isOpen ? 'rgba(208,0,0,0.4)' : 'rgba(0,0,0,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      transition: 'all 0.25s',
                      color: isOpen ? '#d00000' : '#8a8a88',
                      fontSize: '16px', lineHeight: 1,
                    }}>+</div>
                  </button>

                  {/* Smooth height + fade reveal via grid-template-rows */}
                  <div style={{
                    display: 'grid',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    transition: 'grid-template-rows 0.35s cubic-bezier(0.16,1,0.3,1)',
                  }}>
                    <div style={{ overflow: 'hidden', minHeight: 0 }}>
                      <div style={{
                        padding: '0 24px 22px', paddingLeft: '64px',
                        opacity: isOpen ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                      }}>
                        <p style={{
                          fontSize: '14px', color: '#6b6b6b', lineHeight: 1.85, margin: 0,
                          borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '16px',
                        }}>
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [activeProbe, setActiveProbe] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActiveProbe(p => (p + 1) % CATEGORIES.length), 1800)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', color: '#181717' }}>

      <Navbar />

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: '120px 80px 80px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(208,0,0,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <HeroParticles />

        <div style={{
          maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center',
        }}>
          <div>
            <div className="hero-badge" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(208,0,0,0.08)', border: '1px solid rgba(208,0,0,0.2)',
              borderRadius: '20px', padding: '4px 12px', marginBottom: '32px',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d00000', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '12px', color: '#d00000', fontFamily: 'Geist Mono', letterSpacing: '0.5px' }}>
                FIND THE LEAKS BEFORE ATTACKERS DO
              </span>
            </div>

            <h1 className="hero-title" style={{
              fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 300,
              lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '24px',
            }}>
              Your AI has<br />
              <span className="gradient-text" style={{ fontWeight: 700 }}>vulnerabilities</span><br />
              <span style={{ color: '#8a8a88' }}>you can&apos;t see.</span>
            </h1>

            <p className="hero-sub" style={{ fontSize: '17px', color: '#5f5f5f', lineHeight: 1.7, marginBottom: '40px', maxWidth: '440px' }}>
              GhostShield runs 88 real attack probes against your system prompts.
              Not simulations — actual LLM attacks, evaluated by a second AI for accuracy.
            </p>

            <div className="hero-cta" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <a href="#pricing" className="btn-primary" style={{
                background: '#d00000', color: 'white', padding: '12px 28px',
                borderRadius: '8px', textDecoration: 'none', fontWeight: 500,
                fontSize: '15px', transition: 'all 0.3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
              >Get Started</a>
              <a href="https://github.com/mhsn1/ghostshield" target="_blank" style={{
                color: '#5f5f5f', padding: '12px 20px', textDecoration: 'none',
                fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#181717')}
                onMouseLeave={e => (e.currentTarget.style.color = '#5f5f5f')}
              >View on GitHub →</a>
            </div>

            <div className="hero-stats" style={{
              display: 'flex', gap: '32px', marginTop: '56px', paddingTop: '40px',
              borderTop: '1px solid rgba(0,0,0,0.06)',
            }}>
              {STATS.map((s, i) => (
                <div key={s.label} style={{ animationDelay: `${1.2 + i * 0.1}s` }} className="hero-stat-item">
                  <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Geist Mono', color: '#181717', marginBottom: '4px' }}><Counter value={s.value} /></div>
                  <div style={{ fontSize: '12px', color: '#767676' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-terminal">
            <Terminal />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '100px 80px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ marginBottom: '64px' }}>
              <div style={{ fontSize: '12px', fontFamily: 'Geist Mono', color: '#767676', letterSpacing: '2px', marginBottom: '16px' }}>HOW IT WORKS</div>
              <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1px' }}>Two AIs. One finds the holes.</h2>
            </div>
          </ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
            {[
              { n: '01', title: 'Attacker LLM', desc: 'Sends 88 real attack probes across 15 categories — persona jailbreaks, encoding tricks, social engineering, technical injection, and more.' },
              { n: '02', title: 'Your System', desc: 'Your system prompt is tested against every attack vector. Responses are captured verbatim — nothing is filtered or sanitized.' },
              { n: '03', title: 'Evaluator LLM', desc: 'A separate LLM independently judges each response for leakage depth: none → hint → fragment → substantial → complete extraction.' },
            ].map((s, i) => (
              <ScrollReveal key={s.n} delay={i * 150} direction="up">
                <div className="glass-card" style={{
                  padding: '40px', background: '#eef0f1',
                  border: '1px solid rgba(0,0,0,0.04)',
                  transition: 'all 0.3s',
                  height: '100%',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(208,0,0,0.2)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ fontSize: '11px', fontFamily: 'Geist Mono', color: '#d00000', marginBottom: '20px' }}>{s.n}</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>{s.title}</h3>
                  <p style={{ fontSize: '14px', color: '#6b6b6b', lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ATTACK CATEGORIES */}
      <section style={{ padding: '100px 80px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <ScrollReveal direction="left">
            <div>
              <div style={{ fontSize: '12px', fontFamily: 'Geist Mono', color: '#767676', letterSpacing: '2px', marginBottom: '16px' }}>ATTACK COVERAGE</div>
              <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1px', marginBottom: '16px' }}>15 categories.<br />88 real attacks.</h2>
              <p style={{ fontSize: '16px', color: '#6b6b6b', lineHeight: 1.7, marginBottom: '32px' }}>
                Every probe is a real attack technique documented in security research.
                No synthetic or made-up attacks — each one has been observed in the wild against production LLM systems.
              </p>
              <div style={{ display: 'flex', gap: '24px' }}>
                {Object.entries(SEVERITY_COLOR).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: v }} />
                    <span style={{ fontSize: '12px', color: '#767676', textTransform: 'capitalize' }}>{k}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {CATEGORIES.map((cat, i) => (
              <ScrollReveal key={cat.id} delay={i * 60} direction="right">
                <div className="cat-row" style={{
                  position: 'relative', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: activeProbe === i ? '#f2f2f2' : 'transparent',
                  border: `1px solid ${activeProbe === i ? 'rgba(0,0,0,0.08)' : 'transparent'}`,
                  borderRadius: '6px', transition: 'all 0.3s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', background: SEVERITY_COLOR[cat.severity],
                      boxShadow: activeProbe === i ? `0 0 8px ${SEVERITY_COLOR[cat.severity]}` : 'none',
                      transition: 'box-shadow 0.3s',
                    }} />
                    <span style={{ fontSize: '14px', color: activeProbe === i ? '#181717' : '#6b6b6b', transition: 'color 0.3s' }}>{cat.name}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontFamily: 'Geist Mono', color: activeProbe === i ? '#5f5f5f' : '#9a9a98', transition: 'color 0.3s' }}>{cat.count} probes</span>
                  <div className="cat-bar" style={{
                    position: 'absolute', left: 0, bottom: 0, height: '2px',
                    width: `${Math.min(cat.count / 12, 1) * 100}%`,
                    background: SEVERITY_COLOR[cat.severity], opacity: 0.5, borderRadius: '0 2px 2px 0',
                  }} />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* REAL RESULTS - Animated */}
      <AnimatedResults />

      {/* OPEN SOURCE / CLI */}
      <section style={{ padding: '100px 80px', borderTop: '1px solid rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
          <ScrollReveal direction="left">
            <div>
              <div style={{ fontSize: '12px', fontFamily: 'Geist Mono', color: '#767676', letterSpacing: '2px', marginBottom: '16px' }}>OPEN SOURCE · MIT</div>
              <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1px', marginBottom: '16px' }}>
                Prefer to run it <span className="gradient-text" style={{ fontWeight: 700 }}>yourself?</span>
              </h2>
              <p style={{ fontSize: '16px', color: '#5f5f5f', lineHeight: 1.75, marginBottom: '28px', maxWidth: '460px' }}>
                The GhostShield scanner is open source and free to self-host. Clone the repo, add your own Groq or OpenRouter key, and run unlimited scans from your terminal &mdash; no account required. The hosted plans below add a dashboard, saved history, and exportable reports.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                {['MIT licensed — free forever', 'Unlimited local scans', 'JSON export for CI pipelines', 'Bring your own Groq / OpenRouter key'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ color: '#0a7d2c', fontSize: '14px' }}>✓</span>
                    <span style={{ fontSize: '14px', color: '#5a5a5a' }}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <a className="btn-primary" href="https://github.com/mhsn1/ghostshield" target="_blank" style={{
                  background: '#d00000', color: 'white', padding: '12px 24px', borderRadius: '8px',
                  textDecoration: 'none', fontWeight: 500, fontSize: '14px', transition: 'all 0.3s',
                }}>View on GitHub →</a>
                <a href="/docs" style={{ color: '#5f5f5f', padding: '12px 18px', textDecoration: 'none', fontSize: '14px' }}>Read the docs →</a>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="glass-card" style={{
              background: '#eef0f1', border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '12px', padding: '22px', fontFamily: 'Geist Mono, monospace', fontSize: '13px', lineHeight: 1.9,
            }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
                {['#ff5f56', '#ffbd2e', '#27c93f'].map(c => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <div style={{ color: '#3a3a3a' }}><span style={{ color: '#0a7d2c' }}>$</span> {'git clone https://github.com/mhsn1/ghostshield'}</div>
              <div style={{ color: '#3a3a3a' }}><span style={{ color: '#0a7d2c' }}>$</span> {'cd ghostshield && bun install'}</div>
              <div style={{ color: '#767676' }}>{'# add GROQ_API_KEY / OPENROUTER_API_KEY to .env'}</div>
              <div style={{ color: '#3a3a3a' }}><span style={{ color: '#0a7d2c' }}>$</span> {'bun run src/cli.ts scan --file ./prompt.txt --output results.json'}</div>
              <div style={{ color: '#6b6b6b', marginTop: '6px' }}>{'  running GhostShield probe suite...'}</div>
              <div style={{ color: '#0a7d2c' }}>{'  ✓ scan complete · results.json'}</div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '100px 80px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontFamily: 'Geist Mono', color: '#767676', letterSpacing: '2px', marginBottom: '16px' }}>PRICING</div>
              <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1px' }}>Simple, honest pricing.</h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '20px', padding: '6px 16px',
                fontSize: '13px', color: '#818cf8', fontFamily: 'Geist Mono',
              }}>
                ◎ Payments accepted in USDC · Ethereum via MetaMask
              </span>
            </div>
          </ScrollReveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px', maxWidth: '800px', margin: '0 auto' }}>
            {PRICING.map((plan, i) => (
              <ScrollReveal key={plan.name} delay={i * 200} direction="scale">
                <div className={plan.highlight ? 'pricing-pro' : undefined} style={{
                  padding: '40px',
                  background: plan.highlight ? '#f6f6f6' : '#ffffff',
                  border: plan.highlight ? '1px solid rgba(208,0,0,0.25)' : '1px solid rgba(0,0,0,0.04)',
                  borderRadius: '2px', position: 'relative',
                  transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = 'rgba(208,0,0,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = plan.highlight ? 'rgba(208,0,0,0.25)' : 'rgba(0,0,0,0.04)' }}
                >
                  {plan.highlight && (
                    <div style={{
                      position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
                      background: '#d00000', color: 'white', fontSize: '10px',
                      fontFamily: 'Geist Mono', letterSpacing: '1px', padding: '3px 12px',
                    }}>MOST POPULAR</div>
                  )}

                  <div style={{ fontSize: '14px', color: '#6b6b6b', marginBottom: '16px' }}>{plan.name}</div>

                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    {plan.usdc ? (
                      <>
                        <span style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1px' }}><Counter value={plan.price} /></span>
                        <span style={{ fontSize: '14px', color: '#767676' }}>USDC {plan.sub}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1px' }}><Counter value={plan.price} /></span>
                    )}
                  </div>

                  {plan.usdc && (
                    <div style={{ marginBottom: '24px' }}>
                      <USDCBadge />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#0a7d2c', fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                        <span style={{ fontSize: '14px', color: '#5f5f5f' }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {plan.usdc ? (
                    <PayButton amount={plan.amount} highlight={plan.highlight} />
                  ) : (
                    <a href={plan.href} target="_blank" style={{
                      display: 'block', textAlign: 'center', padding: '11px',
                      background: 'transparent', color: '#5f5f5f',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '6px', textDecoration: 'none', fontSize: '14px',
                      fontWeight: 500, transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.25)'
                        e.currentTarget.style.color = '#181717'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'
                        e.currentTarget.style.color = '#5f5f5f'
                      }}
                    >{plan.cta}</a>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Enterprise CTA */}
          <ScrollReveal delay={500}>
            <div style={{
              marginTop: '48px', textAlign: 'center',
              padding: '24px', background: 'rgba(0,0,0,0.02)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '10px',
            }}>
              <span style={{ fontSize: '14px', color: '#6b6b6b' }}>
                Need custom quotas, SSO, or on-premise deployment?{' '}
              </span>
              <a
                href="/contact"
                style={{
                  fontSize: '14px', color: '#d00000', textDecoration: 'none',
                  fontWeight: 500, transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Contact Sales →
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(0,0,0,0.04)', overflow: 'hidden' }}>

        {/* Top row — links */}
        <div className="footer-top" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '32px 80px',
          borderBottom: '1px solid rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: '13px', color: '#9a9a98' }}>
            Built by{' '}
            <a href="https://github.com/mhsn1" target="_blank" style={{ color: '#767676', textDecoration: 'none' }}>mhsn1</a>
            {' '}· Open source · MIT License
          </div>
          <div className="footer-links" style={{ display: 'flex', gap: '28px' }}>
            {[
              { label: 'GitHub', href: 'https://github.com/mhsn1/ghostshield' },
              { label: 'Docs', href: '/docs' },
              { label: 'Whitepaper', href: '/whitepaper' },
              { label: 'Terms', href: '/terms' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Contact', href: '/contact' },
            ].map(l => (
              <a key={l.label} href={l.href}
                style={{ fontSize: '13px', color: '#9a9a98', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#5f5f5f')}
                onMouseLeave={e => (e.currentTarget.style.color = '#9a9a98')}
              >{l.label}</a>
            ))}
          </div>
        </div>

        {/* Giant brand name */}
        <div style={{ position: 'relative', padding: '40px 0 0', textAlign: 'center' }}>
          {/* Glow behind text */}
          <div style={{
            position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
            width: '60%', height: '60%',
            background: 'radial-gradient(ellipse, rgba(208,0,0,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div className="footer-brand" style={{
            fontSize: 'clamp(80px, 14vw, 180px)',
            fontWeight: 900,
            letterSpacing: '-4px',
            lineHeight: 0.9,
            background: 'linear-gradient(180deg, #e0e0e0 0%, #f2f2f2 60%, #ffffff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            userSelect: 'none',
            paddingBottom: '8px',
          }}>
            GhostShield
          </div>
        </div>

        {/* Bottom copyright */}
        <div style={{
          textAlign: 'center', padding: '16px 80px 32px',
          fontSize: '12px', color: '#e4e4e4', fontFamily: 'Geist Mono',
        }}>
          © {new Date().getFullYear()} GhostShield · All rights reserved
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes heroSlideRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .hero-badge  { animation: heroFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
        .hero-title  { animation: heroFadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s both; }
        .hero-sub    { animation: heroFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.6s both; }
        .hero-cta    { animation: heroFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.8s both; }
        .hero-stats  { animation: heroFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 1.0s both; }
        .hero-stat-item { animation: heroFadeIn 0.6s ease both; }
        .hero-terminal { animation: heroSlideRight 1s cubic-bezier(0.16,1,0.3,1) 0.6s both; }
      `}</style>
    </div>
  )
}