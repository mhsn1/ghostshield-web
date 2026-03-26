
export interface ScanFinding {
  probe: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'none'
  reasoning: string
}

export interface ScanResult {
  target?: string
  score: number
  severity: string
  totalProbes: number
  vulnerabilities: number
  findings?: ScanFinding[]
  recommendations?: string[]
}

export interface ReportMeta {
  prompt?: string
  model?: string
  provider?: string
  scannedAt?: string // ISO string, defaults to now
}

/* ── Color helpers ── */

const SEV_COLOR: Record<string, string> = {
  critical: '#c0392b',
  high:     '#d35400',
  medium:   '#e67e22',
  low:      '#27ae60',
  none:     '#27ae60',
  secure:   '#27ae60',
}

const SEV_BG: Record<string, string> = {
  critical: '#fdecea',
  high:     '#fef3e8',
  medium:   '#fef9e7',
  low:      '#eafaf1',
  none:     '#eafaf1',
  secure:   '#eafaf1',
}

const SEV_BORDER: Record<string, string> = {
  critical: '#e74c3c',
  high:     '#e67e22',
  medium:   '#f39c12',
  low:      '#2ecc71',
  none:     '#2ecc71',
  secure:   '#2ecc71',
}

function scoreColor(score: number): string {
  if (score >= 90) return '#27ae60'
  if (score >= 70) return '#e67e22'
  return '#c0392b'
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 60) return 'Fair'
  if (score >= 40) return 'Poor'
  return 'Critical Risk'
}

function scoreLabelSimple(score: number): string {
  if (score >= 90) return 'Your AI is very well protected.'
  if (score >= 75) return 'Your AI has decent security but some weaknesses.'
  if (score >= 60) return 'Your AI has noticeable security gaps.'
  if (score >= 40) return 'Your AI has serious security issues.'
  return 'Your AI is highly vulnerable to attacks.'
}



function sevLabelSimple(sev: string): string {
  const m: Record<string, string> = {
    critical: '🔴 Critical — AI fully leaked its instructions',
    high: '🟠 High — AI revealed significant information',
    medium: '🟡 Medium — AI gave partial hints',
    low: '🟢 Low — Very minor issue',
    none: '✅ Passed — AI resisted the attack',
  }
  return m[sev] || sev
}

/* ── SVG ring for score ── */

function svgRing(score: number): string {
  const size = 100
  const r = 38
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = scoreColor(score)
  return `
    <svg width="${size}" height="${size}" style="transform:rotate(-90deg)">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#e8e8e8" stroke-width="8"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="8"
        stroke-dasharray="${dash} ${circ}" stroke-linecap="round"/>
      <text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="central"
        style="transform:rotate(90deg);transform-origin:${size/2}px ${size/2}px"
        fill="${color}" font-size="24" font-weight="800" font-family="Inter,sans-serif">${score}</text>
    </svg>
  `
}

/* ── Main HTML builder ── */

function buildHTML(result: ScanResult, meta: ReportMeta): string {
  const date = meta.scannedAt
    ? new Date(meta.scannedAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })
    : new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })

  const vulnFindings = (result.findings || []).filter(f => f.severity !== 'none')
  const critCount = vulnFindings.filter(f => f.severity === 'critical').length
  const highCount = vulnFindings.filter(f => f.severity === 'high').length
  const medCount  = vulnFindings.filter(f => f.severity === 'medium').length
  const lowCount  = vulnFindings.filter(f => f.severity === 'low').length
  const passedCount = (result.findings || []).filter(f => f.severity === 'none').length

  const sc = scoreColor(result.score)

  const findingRows = vulnFindings.map(f => `
    <tr>
      <td style="padding:10px 12px;font-family:monospace;font-size:11px;color:#555;border-bottom:1px solid #eee;vertical-align:top">${f.probe}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;vertical-align:top">
        <span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:0.5px;
          background:${SEV_BG[f.severity]||'#f5f5f5'};color:${SEV_COLOR[f.severity]||'#555'};border:1px solid ${SEV_BORDER[f.severity]||'#ddd'};">
          ${f.severity.toUpperCase()}
        </span>
      </td>
      <td style="padding:10px 12px;font-size:12px;color:#444;line-height:1.6;border-bottom:1px solid #eee;vertical-align:top">${f.reasoning || '—'}</td>
    </tr>
  `).join('')

  const recRows = (result.recommendations || []).map((r, i) => `
    <div style="display:flex;gap:10px;padding:10px 0;border-bottom:${i < (result.recommendations!.length - 1) ? '1px solid #f0f0f0' : 'none'}">
      <span style="color:#e74c3c;font-size:14px;flex-shrink:0;margin-top:1px;">→</span>
      <span style="font-size:13px;color:#444;font-family:monospace;line-height:1.6">${r}</span>
    </div>
  `).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>GhostShield Security Report</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#fff;color:#1a1a1a;font-family:'Inter',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:14px;line-height:1.6}
  @page{size:A4;margin:15mm 20mm}
  @media print{
    .no-print{display:none!important}
    .page{page-break-after:always}
    .page:last-child{page-break-after:avoid}
    body{font-size:12px}
  }
  h1,h2,h3{color:#1a1a1a}

  .print-btn{
    position:fixed;bottom:24px;right:24px;z-index:999;
    padding:12px 24px;border-radius:8px;border:none;cursor:pointer;
    background:#c0392b;color:white;font-size:14px;font-weight:700;font-family:'Inter',sans-serif;
    box-shadow:0 4px 16px rgba(192,57,43,0.35);
    display:flex;align-items:center;gap:8px;
  }
  .print-btn:hover{background:#a93226}
</style>
</head>
<body>

<!-- Print button (hidden when printing) -->
<button class="print-btn no-print" onclick="window.print()">
  ⬇ Save as PDF
</button>

<!-- ═══════════════════════════════════════════════════
     PAGE 1 — COVER + SUMMARY
════════════════════════════════════════════════════ -->
<div class="page" style="padding:40px 48px;min-height:100vh;display:flex;flex-direction:column">

  <!-- Header bar -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:2px solid #e74c3c;margin-bottom:32px">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:36px;height:36px;background:linear-gradient(135deg,#e74c3c,#c0392b);border-radius:8px;display:flex;align-items:center;justify-content:center">
        <span style="font-size:18px;color:white;font-weight:900">G</span>
      </div>
      <div>
        <div style="font-size:18px;font-weight:800;color:#c0392b;letter-spacing:0.5px">GhostShield</div>
        <div style="font-size:10px;color:#888;letter-spacing:1.5px;text-transform:uppercase">AI Security Report</div>
      </div>
    </div>
    <div style="text-align:right;font-size:11px;color:#999;font-family:'JetBrains Mono',monospace">
      ${date}<br/>Report ID: GS-${Date.now().toString(36).toUpperCase()}
    </div>
  </div>

  <!-- Title -->
  <h1 style="font-size:28px;font-weight:800;margin-bottom:4px;color:#1a1a1a">Security Audit Report</h1>
  <p style="font-size:14px;color:#888;margin-bottom:32px">Comprehensive AI security assessment</p>

  <!-- Summary box — plain language -->
  <div style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:12px;padding:24px;margin-bottom:28px;border-left:4px solid ${sc}">
    <div style="font-size:16px;font-weight:700;margin-bottom:12px;color:#1a1a1a">
      📋 Summary
    </div>
    <div style="font-size:14px;color:#333;line-height:1.8;margin-bottom:12px">
      We tested your AI with <strong>${result.totalProbes} attack attempts</strong>.
      <strong style="color:${sc}">${result.vulnerabilities}</strong> attacks succeeded.
      Your AI's security score is <strong style="color:${sc}">${result.score}/100</strong> — <strong>${scoreLabel(result.score)}</strong>.
    </div>
    <div style="font-size:13px;color:#666;line-height:1.8">
      ${scoreLabelSimple(result.score)}
    </div>
  </div>

  <!-- Score + Stats grid -->
  <div style="display:grid;grid-template-columns:auto 1fr;gap:32px;align-items:center;background:#fff;border:1px solid #e8e8e8;border-radius:12px;padding:24px;margin-bottom:28px">
    <div style="text-align:center">
      ${svgRing(result.score)}
      <div style="font-size:12px;color:#999;margin-top:4px">Security Score</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr) repeat(2,1fr);gap:12px">
      ${[
        { label: 'Total Tests', value: result.totalProbes.toString(), color: '#2c3e50' },
        { label: 'Failed', value: result.vulnerabilities.toString(), color: '#c0392b' },
        { label: 'Passed', value: passedCount.toString(), color: '#27ae60' },
        { label: 'Critical', value: critCount.toString(), color: '#c0392b' },
      ].map(s => `
        <div style="padding:14px;background:#f8f9fa;border-radius:8px;border:1px solid #eee">
          <div style="font-size:24px;font-weight:700;font-family:'JetBrains Mono',monospace;color:${s.color};margin-bottom:2px">${s.value}</div>
          <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px">${s.label}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- Severity breakdown bar -->
  <div style="margin-bottom:28px">
    <div style="font-size:12px;font-weight:600;color:#999;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px">Severity Breakdown</div>
    ${[
      { label: 'Critical', count: critCount, color: '#c0392b', bg: '#fdecea' },
      { label: 'High', count: highCount, color: '#d35400', bg: '#fef3e8' },
      { label: 'Medium', count: medCount, color: '#e67e22', bg: '#fef9e7' },
      { label: 'Low', count: lowCount, color: '#27ae60', bg: '#eafaf1' },
    ].map(s => {
      const pct = result.totalProbes > 0 ? Math.round((s.count / result.totalProbes) * 100) : 0
      return `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <div style="width:100px;font-size:11px;color:#666">${s.label}</div>
          <div style="flex:1;height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${s.color};border-radius:4px;min-width:${s.count > 0 ? 4 : 0}px"></div>
          </div>
          <div style="width:30px;text-align:right;font-size:12px;font-family:'JetBrains Mono',monospace;color:${s.color};font-weight:600">${s.count}</div>
        </div>
      `
    }).join('')}
  </div>

  <!-- Model & Prompt info -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
    <div style="padding:14px;background:#f8f9fa;border:1px solid #eee;border-radius:8px">
      <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Model Tested</div>
      <div style="font-size:14px;font-weight:600;color:#333;font-family:'JetBrains Mono',monospace">${meta.model || result.target || 'Unknown'}</div>
    </div>
    <div style="padding:14px;background:#f8f9fa;border:1px solid #eee;border-radius:8px">
      <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Provider</div>
      <div style="font-size:14px;font-weight:600;color:#333">${(meta.provider || 'groq').toUpperCase()}</div>
    </div>
  </div>

  ${meta.prompt ? `
  <div style="padding:14px;background:#f8f9fa;border:1px solid #eee;border-radius:8px;margin-bottom:20px">
    <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">System Prompt Tested</div>
    <div style="font-size:12px;color:#555;font-family:'JetBrains Mono',monospace;line-height:1.7;white-space:pre-wrap">${meta.prompt.slice(0, 600)}${meta.prompt.length > 600 ? '\n[… truncated]' : ''}</div>
  </div>
  ` : ''}

  <!-- Footer -->
  <div style="margin-top:auto;padding-top:20px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:10px;color:#bbb;font-family:'JetBrains Mono',monospace">Generated by GhostShield · ghostshield.ai</div>
    <div style="font-size:10px;color:#bbb;font-family:'JetBrains Mono',monospace">Confidential Report</div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════
     PAGE 2 — VULNERABILITY DETAILS
════════════════════════════════════════════════════ -->
<div class="page" style="padding:40px 48px;min-height:100vh;display:flex;flex-direction:column">
  <!-- Page header -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid #eee;margin-bottom:24px">
    <div style="display:flex;align-items:center;gap:8px">
      <div style="width:20px;height:20px;background:linear-gradient(135deg,#e74c3c,#c0392b);border-radius:4px;display:flex;align-items:center;justify-content:center">
        <span style="font-size:10px;color:white;font-weight:900">G</span>
      </div>
      <span style="font-size:12px;font-weight:600;color:#999">GhostShield Security Report</span>
    </div>
    <span style="font-size:11px;color:#bbb;font-family:'JetBrains Mono',monospace">Page 2 — Vulnerability Details</span>
  </div>

  <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">Vulnerabilities Found</h2>
  <p style="font-size:13px;color:#888;margin-bottom:20px">${vulnFindings.length} attack${vulnFindings.length !== 1 ? 's' : ''} succeeded out of ${result.totalProbes} total tests</p>

  ${vulnFindings.length === 0
    ? `<div style="padding:32px;text-align:center;color:#27ae60;background:#eafaf1;border-radius:10px;border:1px solid #d1f2e1;font-size:15px;font-weight:600">
        ✅ No vulnerabilities detected — your AI is well protected!
       </div>`
    : `<table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead>
          <tr style="background:#f8f9fa">
            <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#999;border-bottom:2px solid #eee;width:120px">Test ID</th>
            <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#999;border-bottom:2px solid #eee;width:90px">Risk Level</th>
            <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#999;border-bottom:2px solid #eee">What Happened</th>
          </tr>
        </thead>
        <tbody>${findingRows}</tbody>
      </table>`
  }
</div>

<!-- ═══════════════════════════════════════════════════
     PAGE 3 — RECOMMENDATIONS + ABOUT
════════════════════════════════════════════════════ -->
<div style="padding:40px 48px;min-height:100vh;display:flex;flex-direction:column">
  <!-- Page header -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid #eee;margin-bottom:24px">
    <div style="display:flex;align-items:center;gap:8px">
      <div style="width:20px;height:20px;background:linear-gradient(135deg,#e74c3c,#c0392b);border-radius:4px;display:flex;align-items:center;justify-content:center">
        <span style="font-size:10px;color:white;font-weight:900">G</span>
      </div>
      <span style="font-size:12px;font-weight:600;color:#999">GhostShield Security Report</span>
    </div>
    <span style="font-size:11px;color:#bbb;font-family:'JetBrains Mono',monospace">Page 3 — Recommendations</span>
  </div>

  <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">What You Should Do</h2>
  <p style="font-size:13px;color:#888;margin-bottom:20px">Add these lines to your system prompt to improve security</p>

  ${(result.recommendations || []).length === 0
    ? `<div style="padding:32px;text-align:center;color:#27ae60;background:#eafaf1;border-radius:10px;border:1px solid #d1f2e1;font-size:14px">
        No specific recommendations — your prompt is already well-hardened!
       </div>`
    : `<div style="padding:20px 24px;background:#fff8f0;border:1px solid #fdebd0;border-radius:10px;border-left:4px solid #e74c3c;margin-bottom:24px">
        <div style="font-size:14px;font-weight:700;margin-bottom:14px;color:#c0392b">
          💡 Add these to your system prompt
        </div>
        ${recRows}
      </div>`
  }

  <div style="height:1px;background:#eee;margin:24px 0"></div>

  <!-- About the assessment -->
  <h3 style="font-size:14px;font-weight:700;margin-bottom:14px;color:#555">About This Assessment</h3>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">
    ${[
      { title: 'Prompt Injection', desc: 'Tries to override AI instructions with crafted inputs.' },
      { title: 'Jailbreak Resistance', desc: 'Tests if AI can be tricked into ignoring its rules.' },
      { title: 'Data Leakage', desc: 'Checks if AI accidentally reveals its secret instructions.' },
      { title: 'Social Engineering', desc: 'Tests if AI can be manipulated through fake authority or emotions.' },
      { title: 'Encoding Attacks', desc: 'Tries to extract instructions via base64, ROT13, etc.' },
      { title: 'Roleplay Bypass', desc: 'Checks if AI reveals instructions through stories or scripts.' },
    ].map(c => `
      <div style="padding:14px;background:#f8f9fa;border:1px solid #eee;border-radius:8px">
        <div style="font-size:12px;font-weight:600;margin-bottom:4px;color:#333">${c.title}</div>
        <div style="font-size:11px;color:#888;line-height:1.5">${c.desc}</div>
      </div>
    `).join('')}
  </div>

  <!-- Final footer -->
  <div style="margin-top:auto;padding-top:24px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:10px;color:#bbb;font-family:'JetBrains Mono',monospace">
      Generated by GhostShield AI Security Platform · ghostshield.ai
    </div>
    <div style="font-size:10px;color:#bbb;font-family:'JetBrains Mono',monospace">
      ${date}
    </div>
  </div>
</div>

</body>
</html>`
}

/**
 * Opens a new window with a full GhostShield-branded report and
 * triggers the browser print dialog (Save as PDF).
 */
export function downloadReport(result: ScanResult, meta: ReportMeta = {}): void {
  const html = buildHTML(result, meta)
  const win = window.open('', '_blank', 'width=1024,height=800')
  if (!win) {
    alert('Pop-up blocked — please allow pop-ups for this site and try again.')
    return
  }
  win.document.write(html)
  win.document.close()
  // Let fonts load then auto-open print dialog
  win.onload = () => setTimeout(() => { win.focus(); win.print() }, 800)
}
