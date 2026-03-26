'use client'
import Navbar from '../components/Navbar'

const SECTIONS = [
  {
    title: '1. What We Collect',
    body: 'We collect only what is necessary to operate the Service:\n\n▸ Account data — email address and authentication credentials when you sign up\n▸ Scan metadata — model name, provider, security score, finding categories, and timestamps\n▸ System prompts — transmitted for scanning and discarded after the session (never stored persistently)\n▸ Usage data — feature interactions, error logs, and performance metrics for service improvement\n▸ Payment records — transaction timestamps and amounts processed via USDC; we do not store wallet addresses beyond confirmation',
  },
  {
    title: '2. What We Do Not Collect',
    body: 'We do not store your system prompts. They are used within the scan session, transmitted over TLS, processed in isolated execution contexts, and are never written to persistent storage. We do not sell, license, or share your data with third parties for advertising or commercial purposes. We do not use your prompts or scan results to train models.',
  },
  {
    title: '3. How We Use Your Data',
    body: 'Account data is used to authenticate you and manage your subscription. Scan metadata is stored in your private dashboard and used to generate reports and track your scan history. Usage data is used to improve reliability and identify issues. We do not use any of this data for advertising.',
  },
  {
    title: '4. Data Storage and Security',
    body: 'Scan results and account data are stored in Supabase with row-level security — your data is accessible only to your authenticated account. All data in transit is encrypted via TLS 1.2+. We apply least-privilege access controls internally. No employee has routine access to customer scan results.',
  },
  {
    title: '5. Data Retention',
    body: 'Scan results and account data are retained for as long as your account is active. You may delete individual scans from your dashboard at any time. Upon account deletion, all associated data is purged within 30 days. System prompts are never retained — there is nothing to delete.',
  },
  {
    title: '6. Third-Party Services',
    body: 'We use the following third-party services to operate GhostShield:\n\n▸ Supabase — authentication and database (EU/US infrastructure)\n▸ Groq / OpenRouter — LLM inference for scan execution (prompts are sent per-request and not retained by us)\n▸ Formspree — contact form submission handling\n▸ Vercel — hosting and edge delivery\n\nEach provider operates under their own privacy policy. We share only the minimum data required for each service to function.',
  },
  {
    title: '7. Cookies',
    body: 'We use only essential cookies required for authentication and session management. We do not use tracking cookies, advertising cookies, or third-party analytics cookies. You cannot opt out of essential cookies without losing access to authenticated features.',
  },
  {
    title: '8. Your Rights',
    body: 'You have the right to access, correct, export, or delete your personal data at any time. To exercise these rights, contact us at privacy@ghostshield.dev. We will respond within 30 days. Where applicable, you also have the right to lodge a complaint with your local data protection authority.',
  },
  {
    title: '9. Children',
    body: 'GhostShield is not directed at children under 16. We do not knowingly collect personal data from anyone under 16. If you believe a child has provided us with personal data, contact us at privacy@ghostshield.dev and we will delete it promptly.',
  },
  {
    title: '10. Changes to This Policy',
    body: 'We may update this policy to reflect changes in how we operate or changes in applicable law. We will notify registered users by email before material changes take effect. The date at the top of this page reflects the most recent revision.',
  },
  {
    title: '11. Contact',
    body: 'For privacy-related inquiries: privacy@ghostshield.dev\nFor security disclosures: security@ghostshield.dev',
  },
]

export default function PrivacyPage() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#f5f5f5', fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '140px 80px 120px' }}>
        {/* Header */}
        <div style={{ marginBottom: '64px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'DM Mono', color: '#ff4444', letterSpacing: '2px', marginBottom: '16px' }}>
            LEGAL
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: 700, letterSpacing: '-1.5px', marginBottom: '16px' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '14px', color: '#444', fontFamily: 'DM Mono' }}>
            Last updated: January 20, 2026
          </p>
        </div>

        {/* Commitment box */}
        <div style={{
          padding: '20px 24px', background: 'rgba(0,200,83,0.04)',
          border: '1px solid rgba(0,200,83,0.12)', borderRadius: '8px', marginBottom: '56px',
        }}>
          <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.8, margin: 0 }}>
            <span style={{ color: '#00c853', fontWeight: 600 }}>Our core commitment:</span>{' '}
            Your system prompts are never stored. Scan results are private to your account.
            We do not sell data. We do not use your content to train models.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {SECTIONS.map(s => {
            const hasBlock = s.body.includes('\n')
            return (
              <section key={s.title}>
                <h2 style={{
                  fontSize: '16px', fontWeight: 600, marginBottom: '12px',
                  color: '#f5f5f5', letterSpacing: '-0.2px',
                }}>{s.title}</h2>
                {hasBlock ? (
                  <div style={{
                    padding: '16px 20px', background: '#080808',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderLeft: '3px solid rgba(255,68,68,0.2)',
                    borderRadius: '8px', fontFamily: 'DM Mono',
                    fontSize: '13px', color: '#555', lineHeight: 2,
                    whiteSpace: 'pre-line',
                  }}>{s.body}</div>
                ) : (
                  <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.9, margin: 0 }}>{s.body}</p>
                )}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
