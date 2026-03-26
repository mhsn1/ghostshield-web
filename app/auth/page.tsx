'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Navbar from '../components/Navbar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleEmail = async () => {
    setLoading(true); setError(''); setMessage('')
    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else setMessage(mode === 'login' ? 'Logged in!' : 'Check your email to confirm signup.')
    setLoading(false)
  }

  const handleGitHub = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'https://ghostshield-web-2ibe-b906dowo2-mhsn1s-projects.vercel.app/dashboard' }
    })
    if (error) setError(error.message)
  }

  const handleGoogle = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
    if (error) setError(error.message)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#000', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif'
    }}>
      <Navbar />
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#f5f5f5', letterSpacing: '-0.5px' }}>GhostShield</span>
        </div>

        <div style={{
          background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px', padding: '36px'
        }}>

          {/* Toggle */}
          <div style={{
            display: 'flex', background: '#111', borderRadius: '8px',
            padding: '3px', marginBottom: '28px'
          }}>
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '6px',
                background: mode === m ? '#1a1a1a' : 'transparent',
                color: mode === m ? '#f5f5f5' : '#555',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
              }}>{m === 'login' ? 'Sign in' : 'Sign up'}</button>
            ))}
          </div>

          <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '6px', color: '#f5f5f5' }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ fontSize: '14px', color: '#555', marginBottom: '24px' }}>
            {mode === 'login' ? 'Sign in to your GhostShield account' : 'Start testing your AI systems for free'}
          </p>

          {/* OAuth buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            <button onClick={handleGitHub} style={{
              width: '100%', padding: '11px', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px',
              color: '#ccc', fontSize: '14px', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ccc' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>

            <button onClick={handleGoogle} style={{
              width: '100%', padding: '11px', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px',
              color: '#ccc', fontSize: '14px', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ccc' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: '12px', color: '#444' }}>or with email</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Email fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{
                width: '100%', padding: '10px 14px', background: '#111',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px',
                color: '#f5f5f5', fontSize: '14px', outline: 'none',
                fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(255,68,68,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 14px', background: '#111',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px',
                color: '#f5f5f5', fontSize: '14px', outline: 'none',
                fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(255,68,68,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />

            {error && <div style={{
              fontSize: '13px', color: '#ff4444', padding: '8px 12px',
              background: 'rgba(255,68,68,0.08)', borderRadius: '6px'
            }}>{error}</div>}
            {message && <div style={{
              fontSize: '13px', color: '#00c853', padding: '8px 12px',
              background: 'rgba(0,200,83,0.08)', borderRadius: '6px'
            }}>{message}</div>}

            <button onClick={handleEmail} disabled={loading || !email || !password} style={{
              width: '100%', padding: '11px', background: '#ff4444', border: 'none',
              borderRadius: '7px', color: 'white', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              opacity: loading || !email || !password ? 0.5 : 1, transition: 'opacity 0.2s',
            }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#444', marginTop: '20px' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{
            background: 'none', border: 'none', color: '#888', cursor: 'pointer',
            fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
          }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
