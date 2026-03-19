#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const repoRoot = process.cwd()
const cssPath = path.join(repoRoot, 'styles', 'gtixt-institutional.css')
const outJsonPath = path.join(repoRoot, 'docs', 'ops', 'wcag-contrast-latest.json')
const outMdPath = path.join(repoRoot, 'docs', 'ops', 'wcag-contrast-latest.md')
const matrixPath = path.join(repoRoot, 'docs', 'VISUAL_COMPLIANCE_MATRIX_20260319.md')

function parseRootVars(cssContent) {
  const vars = {}
  const rootMatch = cssContent.match(/:root\s*\{([\s\S]*?)\n\}/)
  if (!rootMatch) return vars
  const body = rootMatch[1]
  const varRegex = /--([a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g

  let match
  while ((match = varRegex.exec(body)) !== null) {
    vars[`--${match[1]}`] = match[2].trim()
  }

  return vars
}

function normalizeHex(hex) {
  const raw = hex.trim()
  if (!raw.startsWith('#')) return null
  if (raw.length === 4) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase()
  }
  if (raw.length === 7) {
    return raw.toLowerCase()
  }
  return null
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex)
  if (!normalized) return null
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  }
}

function toLinear(value) {
  const channel = value / 255
  return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
}

function luminance(rgb) {
  const r = toLinear(rgb.r)
  const g = toLinear(rgb.g)
  const b = toLinear(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(foregroundHex, backgroundHex) {
  const fg = hexToRgb(foregroundHex)
  const bg = hexToRgb(backgroundHex)
  if (!fg || !bg) {
    throw new Error(`Invalid color pair: ${foregroundHex} / ${backgroundHex}`)
  }

  const l1 = luminance(fg)
  const l2 = luminance(bg)
  const light = Math.max(l1, l2)
  const dark = Math.min(l1, l2)
  return (light + 0.05) / (dark + 0.05)
}

function resolveColor(vars, colorRef) {
  if (colorRef.startsWith('--')) {
    const value = vars[colorRef]
    if (!value) {
      throw new Error(`Unknown token reference: ${colorRef}`)
    }
    const normalized = normalizeHex(value)
    if (!normalized) {
      throw new Error(`Token is not a hex color: ${colorRef}=${value}`)
    }
    return normalized
  }

  const normalized = normalizeHex(colorRef)
  if (!normalized) {
    throw new Error(`Unsupported color value: ${colorRef}`)
  }

  return normalized
}

const componentChecks = [
  {
    component: 'Global body text',
    role: 'normal-text',
    thresholdAA: 4.5,
    foreground: '--gtixt-silver-mist',
    background: '--gtixt-slate-void',
  },
  {
    component: 'Global paragraph secondary',
    role: 'normal-text',
    thresholdAA: 4.5,
    foreground: '--gtixt-steel-grey',
    background: '--gtixt-slate-void',
  },
  {
    component: 'Route briefing title',
    role: 'normal-text',
    thresholdAA: 4.5,
    foreground: '#f1f5f9',
    background: '#0f172a',
  },
  {
    component: 'Route briefing body copy',
    role: 'normal-text',
    thresholdAA: 4.5,
    foreground: '#e2e8f0',
    background: '#0f172a',
  },
  {
    component: 'Route briefing chip text',
    role: 'normal-text',
    thresholdAA: 4.5,
    foreground: '#dbeafe',
    background: '#334155',
  },
  {
    component: 'Admin nav link text',
    role: 'normal-text',
    thresholdAA: 4.5,
    foreground: '#e2e8f0',
    background: '#0f172a',
  },
  {
    component: 'Admin action button text',
    role: 'normal-text',
    thresholdAA: 4.5,
    foreground: '#f1f5f9',
    background: '#1e293b',
  },
  {
    component: 'Client ribbon chip text',
    role: 'normal-text',
    thresholdAA: 4.5,
    foreground: '#c7ebff',
    background: '#0b3554',
  },
  {
    component: 'Accent heading cyan large text',
    role: 'large-text',
    thresholdAA: 3.0,
    foreground: '--gtixt-neon-cyan',
    background: '--gtixt-slate-void',
  },
]

function buildMarkdown(report) {
  const lines = []
  lines.push('# WCAG Contrast Audit (AA)')
  lines.push('')
  lines.push(`Generated at: ${report.generatedAt}`)
  lines.push('')
  lines.push(`Checks: ${report.summary.total} | Passed: ${report.summary.passed} | Failed: ${report.summary.failed}`)
  lines.push('')
  lines.push('| Component | Foreground | Background | Role | Ratio | Threshold AA | Status |')
  lines.push('|---|---|---|---|---|---|---|')

  for (const item of report.results) {
    lines.push(`| ${item.component} | ${item.foreground} | ${item.background} | ${item.role} | ${item.ratio.toFixed(2)}:1 | ${item.thresholdAA.toFixed(1)}:1 | ${item.pass ? 'PASS' : 'FAIL'} |`)
  }

  lines.push('')
  lines.push('Method: Relative luminance and contrast formula from WCAG 2.1.')
  return lines.join('\n')
}

function updateMatrixBlock(matrixContent, report) {
  const start = '<!-- WCAG_AUDIT_START -->'
  const end = '<!-- WCAG_AUDIT_END -->'

  const summary = [
    start,
    `Last run: ${report.generatedAt}`,
    '',
    `Result: ${report.summary.passed}/${report.summary.total} checks pass (${report.summary.failed} fail).`,
    '',
    '| Component | Ratio | AA Threshold | Status |',
    '|---|---|---|---|',
    ...report.results.map((item) => `| ${item.component} | ${item.ratio.toFixed(2)}:1 | ${item.thresholdAA.toFixed(1)}:1 | ${item.pass ? 'PASS' : 'FAIL'} |`),
    '',
    'Detailed report: docs/ops/wcag-contrast-latest.md',
    end,
  ].join('\n')

  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`)
  if (!pattern.test(matrixContent)) {
    throw new Error('WCAG matrix markers not found')
  }

  return matrixContent.replace(pattern, summary)
}

function main() {
  const cssContent = fs.readFileSync(cssPath, 'utf8')
  const vars = parseRootVars(cssContent)
  const generatedAt = new Date().toISOString()

  const results = componentChecks.map((check) => {
    const foreground = resolveColor(vars, check.foreground)
    const background = resolveColor(vars, check.background)
    const ratio = contrastRatio(foreground, background)
    const pass = ratio >= check.thresholdAA

    return {
      component: check.component,
      role: check.role,
      thresholdAA: check.thresholdAA,
      foreground,
      background,
      ratio,
      pass,
    }
  })

  const summary = {
    total: results.length,
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass).length,
  }

  const report = { generatedAt, summary, results }

  fs.mkdirSync(path.dirname(outJsonPath), { recursive: true })
  fs.writeFileSync(outJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  fs.writeFileSync(outMdPath, `${buildMarkdown(report)}\n`, 'utf8')

  const matrixContent = fs.readFileSync(matrixPath, 'utf8')
  const updatedMatrix = updateMatrixBlock(matrixContent, report)
  fs.writeFileSync(matrixPath, updatedMatrix, 'utf8')

  if (summary.failed > 0) {
    console.error(`WCAG contrast audit failed: ${summary.failed} component(s) below AA threshold.`)
    process.exitCode = 1
    return
  }

  console.log(`WCAG contrast audit passed (${summary.passed}/${summary.total}).`)
}

main()
