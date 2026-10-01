'use client'
import Navbar from '../components/Navbar'
import { useState } from 'react'

// ✅ Step 1: Sign up free at https://formspree.io
// ✅ Step 2: Create a new form there
// ✅ Step 3: Replace YOUR_FORM_ID below with your actual form ID (e.g. "xpwrgkla")
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xzdkpynw'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name,
          company: form.company,
          email: form.email,
          message: form.message,
        }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        setError(data?.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection.')
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#ffffff',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#181717',
    fontFamily: 'Geist, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', color: '#181717' }}>
      <style>{`
        @media (max-width: 768px) {
          .ct-section { padding: 120px 18px 72px !important; }
          .ct-grid { gap: 40px !important; }
          .ct-form-card { padding: 24px 20px !important; }
          .ct-copy p { max-width: 100% !important; }
        }
      `}</style>
      <Navbar />

      <section className="ct-section" style={{ padding: '140px 80px 100px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="ct-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '100px', alignItems: 'start' }}>

          {/* Left — copy */}
          <div className="ct-copy">
            <div style={{
              fontSize: '12px', fontFamily: 'Geist Mono', color: '#767676',
              letterSpacing: '2px', marginBottom: '20px',
            }}>
              CONTACT SALES
            </div>
            <h1 style={{
              fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 700,
              letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: '20px',
            }}>
              Let&apos;s build something<br />
              <span style={{ color: '#8a8a88' }}>secure together.</span>
            </h1>
            <p style={{ fontSize: '16px', color: '#767676', lineHeight: 1.8, marginBottom: '48px', maxWidth: '420px' }}>
              Need custom quotas, SSO, on-premise deployment, or a tailored security audit?
              Tell us what you need and we&apos;ll get back to you within one business day.
            </p>

          </div>

          {/* Right — form */}
          <div className="ct-form-card" style={{
            background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: '16px', padding: '40px',
          }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '10px' }}>Message sent!</h2>
                <p style={{ fontSize: '14px', color: '#767676' }}>
                  We&apos;ll get back to you within one business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.5px' }}>
                  Get in touch
                </h2>
                <p style={{ fontSize: '13px', color: '#8a8a88', marginBottom: '8px', marginTop: 0 }}>
                  We respond within 1 business day.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#767676', display: 'block', marginBottom: '6px', fontFamily: 'Geist Mono' }}>
                      NAME
                    </label>
                    <input
                      required
                      style={inputStyle}
                      placeholder="Jane Smith"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(208,0,0,0.35)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)')}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#767676', display: 'block', marginBottom: '6px', fontFamily: 'Geist Mono' }}>
                      COMPANY
                    </label>
                    <input
                      style={inputStyle}
                      placeholder="Acme Inc."
                      value={form.company}
                      onChange={e => setForm({ ...form, company: e.target.value })}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(208,0,0,0.35)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)')}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#767676', display: 'block', marginBottom: '6px', fontFamily: 'Geist Mono' }}>
                    WORK EMAIL
                  </label>
                  <input
                    required
                    type="email"
                    style={inputStyle}
                    placeholder="jane@company.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(208,0,0,0.35)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)')}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#767676', display: 'block', marginBottom: '6px', fontFamily: 'Geist Mono' }}>
                    WHAT DO YOU NEED?
                  </label>
                  <textarea
                    required
                    rows={5}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    placeholder="Describe your use case, quote, or question…"
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(208,0,0,0.35)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '13px',
                    background: loading ? 'rgba(208,0,0,0.5)' : '#d00000',
                    color: 'white', border: 'none', borderRadius: '8px',
                    fontSize: '15px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
                    fontFamily: 'Geist, sans-serif', transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  {loading ? 'Sending…' : 'Send Message →'}
                </button>

                {error && (
                  <p style={{ fontSize: '13px', color: '#d00000', textAlign: 'center', margin: 0 }}>
                    ⚠ {error}
                  </p>
                )}

                <p style={{ fontSize: '12px', color: '#9a9a98', textAlign: 'center', margin: 0 }}>
                  Or email directly:{' '}
                  <a href="mailto:sales@ghostshield.dev" style={{ color: '#767676', textDecoration: 'none' }}>
                    sales@ghostshield.dev
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
