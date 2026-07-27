import type { Metadata } from 'next'
import './globals.css'
import Navbar from './components/Navbar'
import { SpotlightCursor, ScrollProgress } from './components/Effects'
export const metadata: Metadata = {
  title: 'GhostShield — AI Security Scanner',
  description: 'Test your AI systems for prompt injection vulnerabilities. Real attacks. Zero dummy data.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><ScrollProgress /><SpotlightCursor />{children}</body>
    </html>
  )
}
