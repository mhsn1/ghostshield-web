'use client'
import Navbar from '../components/Navbar'

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using GhostShield ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. GhostShield reserves the right to update these terms at any time. Continued use after changes constitutes acceptance.',
  },
  {
    title: '2. Description of Service',
    body: 'GhostShield is an AI security testing platform that runs automated adversarial probes against system prompts and AI configurations to identify prompt extraction vulnerabilities. The Service is provided for legitimate security research and hardening purposes only.',
  },
  {
    title: '3. Acceptable Use',
    body: 'You may use GhostShield only to test AI systems you own, operate, or have explicit written authorization to test. You may not use the Service to attack third-party systems, to generate malicious content, to circumvent security controls on systems you do not own, or to violate any applicable law.',
  },
  {
    title: '4. Account Responsibilities',
    body: 'You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activity that occurs under your account. You must notify us immediately of any unauthorized use at support@ghostshield.dev.',
  },
  {
    title: '5. Intellectual Property',
    body: 'All GhostShield software, probe logic, scoring methodology, and report formats are proprietary to GhostShield. Scan reports generated from your system prompts belong to you. You may not reverse-engineer, decompile, or reproduce the probe engine or evaluator logic.',
  },
  {
    title: '6. Payment Terms',
    body: 'Paid plans are billed monthly in USDC. All payments are non-refundable unless required by applicable law. We reserve the right to suspend access for non-payment. Usage limits reset on the first of each calendar month.',
  },
  {
    title: '7. Disclaimers',
    body: 'GhostShield is provided "as is." We do not guarantee that the Service will identify every vulnerability in your AI system. Security testing is probabilistic — passing a GhostShield scan does not certify that your system is free from risk. We disclaim all warranties, express or implied, to the extent permitted by law.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'To the fullest extent permitted by law, GhostShield shall not be liable for any indirect, incidental, special, or consequential damages arising from use of the Service. Our total liability for any claim arising from these terms shall not exceed the amount you paid us in the three months preceding the claim.',
  },
  {
    title: '9. Termination',
    body: 'We may suspend or terminate your account for violation of these terms without notice. You may cancel your account at any time from your dashboard settings. Upon termination, your right to use the Service ends immediately.',
  },
  {
    title: '10. Governing Law',
    body: 'These terms are governed by the laws of the jurisdiction in which GhostShield is incorporated, without regard to conflict of law provisions. Any disputes shall be resolved by binding arbitration, except where prohibited by law.',
  },
  {
    title: '11. Contact',
    body: 'For legal inquiries, contact us at legal@ghostshield.dev.',
  },
]

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p style={{ fontSize: '14px', color: '#444', fontFamily: 'DM Mono' }}>
            Last updated: January 20, 2026
          </p>
        </div>

        {/* Intro */}
        <div style={{
          padding: '20px 24px', background: 'rgba(255,68,68,0.04)',
          border: '1px solid rgba(255,68,68,0.12)', borderRadius: '8px', marginBottom: '56px',
        }}>
          <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.8, margin: 0 }}>
            Please read these terms carefully before using GhostShield. These terms govern your access to and use of the GhostShield security testing platform.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {SECTIONS.map(s => (
            <section key={s.title}>
              <h2 style={{
                fontSize: '16px', fontWeight: 600, marginBottom: '12px',
                color: '#f5f5f5', letterSpacing: '-0.2px',
              }}>{s.title}</h2>
              <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.9, margin: 0 }}>{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
