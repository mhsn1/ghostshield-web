'use client'
import Navbar from './components/Navbar'
import { useState, useEffect } from 'react'

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
  critical: '#ff4444',
  high: '#ff8800',
  medium: '#ffab00',
  low: '#00c853',
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
  { text: '  ● [PERSONA]      ████████████████░░░░  testing...', delay: 2200, color: '#ff4444' },
  { text: '  ● [ENCODING]     ████████████░░░░░░░░  testing...', delay: 2700, color: '#ff8800' },
  { text: '  ● [TECHNICAL]    ██████████░░░░░░░░░░  testing...', delay: 3100, color: '#ff8800' },
  { text: '  ● [MULTILINGUAL] ███████░░░░░░░░░░░░░  testing...', delay: 3500, color: '#ffab00' },
  { text: '', delay: 3900 },
  { text: '  Evaluator LLM reviewing responses...', delay: 4200, dim: true },
  { text: '', delay: 4600 },
  { text: '  ✓ Scan complete. Results saved to report.json', delay: 5000, color: '#00c853' },
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
          background: highlight ? '#ff4444' : 'transparent',
          color: highlight ? 'white' : '#888',
          border: highlight ? 'none' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '6px', fontSize: '14px', fontWeight: 500,
          cursor: 'pointer', transition: 'all 0.2s',
          fontFamily: 'DM Sans, sans-serif',
        }}
        onMouseEnter={e => {
          if (highlight) e.currentTarget.style.opacity = '0.85'
          else { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#f5f5f5' }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.opacity = '1'
          if (!highlight) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#888' }
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
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          {/* Modal Box */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#111', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px', padding: '32px', width: '420px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#f5f5f5', margin: 0 }}>
                  Pay with USDC
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
                >×</button>
              </div>
              <p style={{ fontSize: '14px', color: '#555', margin: 0, fontFamily: 'DM Mono' }}>
                {amount} USDC / month
              </p>
            </div>

            {/* Network label */}
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
              Select a network to pay on:
            </p>

            {/* Ethereum */}
            <button
              onClick={() => handleEth('eth')}
              disabled={!!loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '16px 20px', marginBottom: '10px',
                background: loading === 'eth' ? 'rgba(98,126,234,0.1)' : '#0d0d0d',
                border: '1px solid rgba(98,126,234,0.3)',
                borderRadius: '10px', cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(98,126,234,0.1)'}
              onMouseLeave={e => { if (loading !== 'eth') e.currentTarget.style.background = '#0d0d0d' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(98,126,234,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>⟠</div>
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#f5f5f5' }}>
                  {loading === 'eth' ? 'Opening MetaMask...' : 'Ethereum'}
                </span>
              </div>
              <span style={{ fontSize: '14px', color: '#888', fontFamily: 'DM Mono' }}>{amount} USDC</span>
            </button>

            {/* Base */}
            <button
              onClick={() => handleEth('base')}
              disabled={!!loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '16px 20px', marginBottom: '10px',
                background: loading === 'base' ? 'rgba(0,82,255,0.1)' : '#0d0d0d',
                border: '1px solid rgba(0,82,255,0.3)',
                borderRadius: '10px', cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,82,255,0.1)'}
              onMouseLeave={e => { if (loading !== 'base') e.currentTarget.style.background = '#0d0d0d' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(0,82,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🔵</div>
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#f5f5f5' }}>
                  {loading === 'base' ? 'Opening MetaMask...' : 'Base'}
                </span>
              </div>
              <span style={{ fontSize: '14px', color: '#888', fontFamily: 'DM Mono' }}>{amount} USDC</span>
            </button>

            {/* Solana */}
            <button
              onClick={handleSolana}
              disabled={!!loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '16px 20px', marginBottom: '10px',
                background: loading === 'sol' ? 'rgba(153,69,255,0.1)' : '#0d0d0d',
                border: '1px solid rgba(153,69,255,0.3)',
                borderRadius: '10px', cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(153,69,255,0.1)'}
              onMouseLeave={e => { if (loading !== 'sol') e.currentTarget.style.background = '#0d0d0d' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(153,69,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>◎</div>
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#f5f5f5' }}>
                  {loading === 'sol' ? 'Opening Phantom...' : 'Solana'}
                </span>
              </div>
              <span style={{ fontSize: '14px', color: '#888', fontFamily: 'DM Mono' }}>{amount} USDC</span>
            </button>

            {/* Footer note */}
            <p style={{ fontSize: '12px', color: '#333', textAlign: 'center', marginTop: '16px', marginBottom: 0 }}>
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
      fontSize: '10px', fontFamily: 'DM Mono',
      color: '#818cf8', letterSpacing: '0.5px',
    }}>
      ◎ USDC · ETH
    </span>
  )
}

function Terminal() {
  const [visible, setVisible] = useState<number[]>([])
  useEffect(() => {
    TERMINAL_LINES.forEach((line, i) => {
      setTimeout(() => setVisible(v => [...v, i]), line.delay)
    })
  }, [])

  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px', padding: '24px',
      fontFamily: 'DM Mono, monospace', fontSize: '13px',
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
          color: line.color || (line.dim ? '#444' : '#bbb'),
          minHeight: '1.8em',
        }}>
          {line.text}
        </div>
      ))}
    </div>
  )
}

function ScoreRing({ score }: { score: number }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 80 ? '#00c853' : score >= 60 ? '#ffab00' : '#ff4444'
  return (
    <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1.2s ease' }} />
      <text x="70" y="70" textAnchor="middle" dominantBaseline="central"
        style={{ transform: 'rotate(90deg)', transformOrigin: '70px 70px' }}
        fill={color} fontSize="24" fontWeight="700" fontFamily="DM Sans">{score}</text>
      <text x="70" y="88" textAnchor="middle"
        style={{ transform: 'rotate(90deg)', transformOrigin: '70px 70px' }}
        fill="#555" fontSize="10" fontFamily="DM Sans">/100</text>
    </svg>
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

  return (
    <section style={{
      padding: '120px 80px',
      borderTop: '1px solid rgba(255,255,255,0.04)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)',
        width: '700px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(255,68,68,0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '100px', alignItems: 'start' }}>

          {/* LEFT — sticky header */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <div style={{
              fontSize: '11px', fontFamily: 'DM Mono', color: '#ff4444',
              letterSpacing: '3px', marginBottom: '20px',
            }}>FAQ</div>
            <h2 style={{
              fontSize: '42px', fontWeight: 700, letterSpacing: '-1.5px',
              lineHeight: 1.05, marginBottom: '20px',
            }}>
              Frequently<br />
              <span style={{ color: '#333' }}>Asked</span><br />
              Questions
            </h2>
            <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.8, marginBottom: '32px' }}>
              Everything you need to know about GhostShield. Can&apos;t find your answer?
            </p>
            <a
              href="mailto:support@ghostshield.dev"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px',
                background: 'rgba(255,68,68,0.06)',
                border: '1px solid rgba(255,68,68,0.2)',
                borderRadius: '8px', textDecoration: 'none',
                fontSize: '13px', color: '#ff6666',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,68,68,0.12)'
                e.currentTarget.style.borderColor = 'rgba(255,68,68,0.35)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,68,68,0.06)'
                e.currentTarget.style.borderColor = 'rgba(255,68,68,0.2)'
              }}
            >
              ✉ Email us →
            </a>
          </div>

          {/* RIGHT — accordion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {FAQS.map((faq, i) => {
              const isOpen = open === i
              return (
                <div
                  key={i}
                  style={{
                    background: isOpen ? 'rgba(255,255,255,0.02)' : 'transparent',
                    border: `1px solid ${isOpen ? 'rgba(255,68,68,0.18)' : 'rgba(255,255,255,0.05)'}`,
                    borderLeft: `3px solid ${isOpen ? '#ff4444' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: '8px',
                    transition: 'all 0.25s',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    style={{
                      width: '100%', background: 'none', border: 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '20px 24px', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'DM Sans, sans-serif', gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                      <span style={{
                        fontSize: '11px', fontFamily: 'DM Mono',
                        color: isOpen ? '#ff4444' : '#333',
                        minWidth: '24px', transition: 'color 0.2s',
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{
                        fontSize: '15px', fontWeight: 500,
                        color: isOpen ? '#f5f5f5' : '#888',
                        transition: 'color 0.2s',
                      }}>
                        {faq.q}
                      </span>
                    </div>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      border: `1px solid ${isOpen ? 'rgba(255,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      transition: 'all 0.25s',
                      color: isOpen ? '#ff4444' : '#444',
                      fontSize: '16px', lineHeight: 1,
                    }}>+</div>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 24px 22px', paddingLeft: '64px' }}>
                      <p style={{
                        fontSize: '14px', color: '#666', lineHeight: 1.85, margin: 0,
                        borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '16px',
                      }}>
                        {faq.a}
                      </p>
                    </div>
                  )}
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
    <div style={{ background: '#000', minHeight: '100vh', color: '#f5f5f5' }}>

      <Navbar />

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: '120px 80px 80px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(255,68,68,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: '1200px', margin: '0 auto', width: '100%',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center',
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)',
              borderRadius: '20px', padding: '4px 12px', marginBottom: '32px',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4444', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '12px', color: '#ff4444', fontFamily: 'DM Mono', letterSpacing: '0.5px' }}>
                REAL ATTACKS. ZERO DUMMY DATA.
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 300,
              lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '24px',
            }}>
              Your AI has<br />
              <span style={{ fontWeight: 700 }}>vulnerabilities</span><br />
              <span style={{ color: '#444' }}>you can&apos;t see.</span>
            </h1>

            <p style={{ fontSize: '17px', color: '#888', lineHeight: 1.7, marginBottom: '40px', maxWidth: '440px' }}>
              GhostShield runs 88 real attack probes against your system prompts.
              Not simulations — actual LLM attacks, evaluated by a second AI for accuracy.
            </p>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <a href="#pricing" style={{
                background: '#ff4444', color: 'white', padding: '12px 28px',
                borderRadius: '8px', textDecoration: 'none', fontWeight: 500,
                fontSize: '15px', transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >Get Started</a>
              <a href="https://github.com/mhsn1/ghostshield" target="_blank" style={{
                color: '#888', padding: '12px 20px', textDecoration: 'none',
                fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f5f5f5')}
                onMouseLeave={e => (e.currentTarget.style.color = '#888')}
              >View on GitHub →</a>
            </div>

            <div style={{
              display: 'flex', gap: '32px', marginTop: '56px', paddingTop: '40px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              {STATS.map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'DM Mono', color: '#f5f5f5', marginBottom: '4px' }}>{s.value}</div>
                  <div style={{ fontSize: '12px', color: '#555' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <Terminal />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '100px 80px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '64px' }}>
            <div style={{ fontSize: '12px', fontFamily: 'DM Mono', color: '#555', letterSpacing: '2px', marginBottom: '16px' }}>HOW IT WORKS</div>
            <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1px' }}>Two AIs. One finds the holes.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
            {[
              { n: '01', title: 'Attacker LLM', desc: 'Sends 88 real attack probes across 15 categories — persona jailbreaks, encoding tricks, social engineering, technical injection, and more.' },
              { n: '02', title: 'Your System', desc: 'Your system prompt is tested against every attack vector. Responses are captured verbatim — nothing is filtered or sanitized.' },
              { n: '03', title: 'Evaluator LLM', desc: 'A separate LLM independently judges each response for leakage depth: none → hint → fragment → substantial → complete extraction.' },
            ].map(s => (
              <div key={s.n} style={{
                padding: '40px', background: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.04)', transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)')}
              >
                <div style={{ fontSize: '11px', fontFamily: 'DM Mono', color: '#333', marginBottom: '20px' }}>{s.n}</div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>{s.title}</h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ATTACK CATEGORIES */}
      <section style={{ padding: '100px 80px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', fontFamily: 'DM Mono', color: '#555', letterSpacing: '2px', marginBottom: '16px' }}>ATTACK COVERAGE</div>
            <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1px', marginBottom: '16px' }}>15 categories.<br />88 real attacks.</h2>
            <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.7, marginBottom: '32px' }}>
              Every probe is a real attack technique documented in security research.
              No synthetic or made-up attacks — each one has been observed in the wild against production LLM systems.
            </p>
            <div style={{ display: 'flex', gap: '24px' }}>
              {Object.entries(SEVERITY_COLOR).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: v }} />
                  <span style={{ fontSize: '12px', color: '#555', textTransform: 'capitalize' }}>{k}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {CATEGORIES.map((cat, i) => (
              <div key={cat.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px',
                background: activeProbe === i ? '#111' : 'transparent',
                border: `1px solid ${activeProbe === i ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
                borderRadius: '6px', transition: 'all 0.3s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: SEVERITY_COLOR[cat.severity] }} />
                  <span style={{ fontSize: '14px', color: activeProbe === i ? '#f5f5f5' : '#666', transition: 'color 0.3s' }}>{cat.name}</span>
                </div>
                <span style={{ fontSize: '12px', fontFamily: 'DM Mono', color: '#333' }}>{cat.count} probes</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REAL RESULTS */}
      <section style={{ padding: '100px 80px', borderTop: '1px solid rgba(255,255,255,0.04)', background: '#040404' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ fontSize: '12px', fontFamily: 'DM Mono', color: '#555', letterSpacing: '2px', marginBottom: '16px' }}>VERIFIED RESULTS</div>
            <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1px' }}>Real scan. Real vulnerabilities.</h2>
            <p style={{ fontSize: '16px', color: '#666', marginTop: '12px' }}>llama-3.1-8b-instant — manually verified in Groq Playground</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '60px', alignItems: 'center', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '48px' }}>
            <div style={{ textAlign: 'center' }}>
              <ScoreRing score={79} />
              <div style={{ fontSize: '13px', color: '#555', marginTop: '12px' }}>Security Score</div>
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Total Probes', value: '88', color: '#f5f5f5' },
                  { label: 'Vulnerabilities', value: '43', color: '#ff4444' },
                  { label: 'Critical', value: '3', color: '#ff4444' },
                  { label: 'High', value: '18', color: '#ff8800' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '16px 20px', background: '#111', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'DM Mono', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '16px 20px', background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.15)', borderRadius: '8px', fontFamily: 'DM Mono', fontSize: '13px', color: '#ff6666' }}>
                ● [PERSONA] Developer Mode — CRITICAL: Full system prompt + admin credentials leaked
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '100px 80px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontFamily: 'DM Mono', color: '#555', letterSpacing: '2px', marginBottom: '16px' }}>PRICING</div>
            <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1px' }}>Simple, honest pricing.</h2>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '20px', padding: '6px 16px',
              fontSize: '13px', color: '#818cf8', fontFamily: 'DM Mono',
            }}>
              ◎ Payments accepted in USDC · Ethereum via MetaMask
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px', maxWidth: '800px', margin: '0 auto' }}>
            {PRICING.map(plan => (
              <div key={plan.name} style={{
                padding: '40px',
                background: plan.highlight ? '#0e0e0e' : '#080808',
                border: plan.highlight ? '1px solid rgba(255,68,68,0.25)' : '1px solid rgba(255,255,255,0.04)',
                borderRadius: '2px', position: 'relative',
              }}>
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
                    background: '#ff4444', color: 'white', fontSize: '10px',
                    fontFamily: 'DM Mono', letterSpacing: '1px', padding: '3px 12px',
                  }}>MOST POPULAR</div>
                )}

                <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>{plan.name}</div>

                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  {plan.usdc ? (
                    <>
                      <span style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1px' }}>{plan.price}</span>
                      <span style={{ fontSize: '14px', color: '#555' }}>USDC {plan.sub}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1px' }}>{plan.price}</span>
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
                      <span style={{ color: '#00c853', fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                      <span style={{ fontSize: '14px', color: '#888' }}>{f}</span>
                    </div>
                  ))}
                </div>

                {plan.usdc ? (
                  <PayButton amount={plan.amount} highlight={plan.highlight} />
                ) : (
                  <a href={plan.href} target="_blank" style={{
                    display: 'block', textAlign: 'center', padding: '11px',
                    background: 'transparent', color: '#888',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px', textDecoration: 'none', fontSize: '14px',
                    fontWeight: 500, transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
                      e.currentTarget.style.color = '#f5f5f5'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                      e.currentTarget.style.color = '#888'
                    }}
                  >{plan.cta}</a>
                )}
              </div>
            ))}
          </div>

          {/* Enterprise CTA */}
          <div style={{
            marginTop: '48px', textAlign: 'center',
            padding: '24px', background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px',
          }}>
            <span style={{ fontSize: '14px', color: '#666' }}>
              Need custom quotas, SSO, or on-premise deployment?{' '}
            </span>
            <a
              href="/contact"
              style={{
                fontSize: '14px', color: '#ff4444', textDecoration: 'none',
                fontWeight: 500, transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Contact Sales →
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>

        {/* Top row — links */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '32px 80px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ fontSize: '13px', color: '#333' }}>
            Built by{' '}
            <a href="https://github.com/mhsn1" target="_blank" style={{ color: '#555', textDecoration: 'none' }}>mhsn1</a>
            {' '}· Open source · MIT License
          </div>
          <div style={{ display: 'flex', gap: '28px' }}>
            {[
              { label: 'GitHub', href: 'https://github.com/mhsn1/ghostshield' },
              { label: 'Docs', href: '#' },
              { label: 'Whitepaper', href: '/whitepaper' },
              { label: 'Terms', href: '/terms' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Contact', href: '/contact' },
            ].map(l => (
              <a key={l.label} href={l.href}
                style={{ fontSize: '13px', color: '#333', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#888')}
                onMouseLeave={e => (e.currentTarget.style.color = '#333')}
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
            background: 'radial-gradient(ellipse, rgba(255,68,68,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            fontSize: 'clamp(80px, 14vw, 180px)',
            fontWeight: 900,
            letterSpacing: '-4px',
            lineHeight: 0.9,
            background: 'linear-gradient(180deg, #2a2a2a 0%, #111 60%, #000 100%)',
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
          fontSize: '12px', color: '#222', fontFamily: 'DM Mono',
        }}>
          © {new Date().getFullYear()} GhostShield · All rights reserved
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}