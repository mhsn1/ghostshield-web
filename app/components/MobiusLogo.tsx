'use client'

// Möbius strip mark: a single continuous lemniscate (the Möbius strip's
// 2D projection) in ink, with a red highlight that travels the whole loop
// and returns — evoking the one-sided surface. Pure SVG + CSS, no deps.
export default function MobiusLogo({ size = 28, travel = true }: { size?: number; travel?: boolean }) {
  // lemniscate / figure-eight path, normalized to pathLength 100
  const d =
    'M32 20 C 42 6, 60 10, 58 20 C 56 30, 40 30, 32 20 C 24 10, 8 10, 6 20 C 4 30, 22 34, 32 20 Z'
  return (
    <span style={{ display: 'inline-flex', width: size, height: size * 0.62, lineHeight: 0 }} aria-hidden="true">
      <svg viewBox="0 0 64 40" width={size} height={size * 0.62} fill="none" style={{ overflow: 'visible' }}>
        {/* base band */}
        <path d={d} pathLength={100} stroke="var(--text, #181717)" strokeWidth={3.4}
          strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
        {/* subtle offset twin to hint the twist */}
        <path d={d} pathLength={100} stroke="var(--text, #181717)" strokeWidth={1.1}
          strokeLinecap="round" opacity={0.18} transform="translate(0,1.4)" />
        {/* travelling red highlight = the continuous one-sided path */}
        {travel && (
          <path className="mobius-travel" d={d} pathLength={100} stroke="var(--accent, #d00000)"
            strokeWidth={3.6} strokeLinecap="round" strokeDasharray="14 86" strokeDashoffset={0} />
        )}
      </svg>
      <style>{`
        @keyframes mobiusTravel { to { stroke-dashoffset: -100; } }
        .mobius-travel { animation: mobiusTravel 3.4s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .mobius-travel { animation: none; } }
      `}</style>
    </span>
  )
}
