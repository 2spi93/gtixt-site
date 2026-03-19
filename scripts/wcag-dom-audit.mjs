#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { chromium } from '@playwright/test'

const repoRoot = process.cwd()
const outJsonPath = path.join(repoRoot, 'docs', 'ops', 'wcag-dom-latest.json')
const outMdPath = path.join(repoRoot, 'docs', 'ops', 'wcag-dom-latest.md')
const tokenJsonPath = path.join(repoRoot, 'docs', 'ops', 'wcag-contrast-latest.json')
const matrixPath = path.join(repoRoot, 'docs', 'VISUAL_COMPLIANCE_MATRIX_20260319.md')
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

const checks = [
  {
    component: 'Home route briefing title',
    route: '/',
    selector: '.route-briefing-title',
  },
  {
    component: 'Home route briefing body copy',
    route: '/',
    selector: '.route-briefing-copy',
  },
  {
    component: 'Home route briefing chip',
    route: '/',
    selector: '.route-briefing-chip',
  },
  {
    component: 'Industry map route briefing body copy',
    route: '/industry-map',
    selector: '.route-briefing-copy',
  },
  {
    component: 'Radar route briefing body copy',
    route: '/radar',
    selector: '.route-briefing-copy',
  },
  {
    component: 'Admin login submit button',
    route: '/admin/login',
    selector: 'button[type="submit"]',
  },
]

function toLinear(value) {
  const channel = value / 255
  return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
}

function luminance(rgb) {
  const red = toLinear(rgb.r)
  const green = toLinear(rgb.g)
  const blue = toLinear(rgb.b)
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrastRatio(foreground, background) {
  const l1 = luminance(foreground)
  const l2 = luminance(background)
  const light = Math.max(l1, l2)
  const dark = Math.min(l1, l2)
  return (light + 0.05) / (dark + 0.05)
}

function rgbToHex(rgb) {
  return `#${[rgb.r, rgb.g, rgb.b].map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('')}`
}

function isLargeText(fontSizePx, fontWeight) {
  const numericWeight = Number(fontWeight)
  return fontSizePx >= 24 || (fontSizePx >= 18.66 && numericWeight >= 700)
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function buildMarkdown(report) {
  const lines = []
  lines.push('# WCAG Rendered DOM Audit (AA)')
  lines.push('')
  lines.push(`Generated at: ${report.generatedAt}`)
  lines.push(`Base URL: ${report.baseURL}`)
  lines.push('')
  lines.push(`Checks: ${report.summary.total} | Passed: ${report.summary.passed} | Failed: ${report.summary.failed}`)
  lines.push('')
  lines.push('| Component | Route | Selector | Font | Weight | Large Text | Ratio | Threshold AA | Status |')
  lines.push('|---|---|---|---|---|---|---|---|---|')

  for (const item of report.results) {
    lines.push(`| ${item.component} | ${item.route} | ${item.selector} | ${item.fontSizePx.toFixed(2)}px | ${item.fontWeight} | ${item.largeText ? 'Yes' : 'No'} | ${item.ratio.toFixed(2)}:1 | ${item.thresholdAA.toFixed(1)}:1 | ${item.pass ? 'PASS' : 'FAIL'} |`)
  }

  lines.push('')
  lines.push('Method: contrast computed from rendered DOM styles, with AA threshold selected from actual font size and weight.')
  return lines.join('\n')
}

function updateMatrixBlock(matrixContent, tokenReport, domReport) {
  const start = '<!-- WCAG_AUDIT_START -->'
  const end = '<!-- WCAG_AUDIT_END -->'
  const tokenSummary = tokenReport
    ? `Token audit: ${tokenReport.summary.passed}/${tokenReport.summary.total} pass (${tokenReport.summary.failed} fail).`
    : 'Token audit: not available.'
  const domSummary = `Rendered DOM audit: ${domReport.summary.passed}/${domReport.summary.total} pass (${domReport.summary.failed} fail).`

  const lines = [
    start,
    `Last run: ${domReport.generatedAt}`,
    '',
    tokenSummary,
    domSummary,
    '',
    '| Audit | Checks | Passed | Failed | Detail |',
    '|---|---|---|---|---|',
    `| Token palette | ${tokenReport?.summary.total ?? 'N/A'} | ${tokenReport?.summary.passed ?? 'N/A'} | ${tokenReport?.summary.failed ?? 'N/A'} | docs/ops/wcag-contrast-latest.md |`,
    `| Rendered DOM | ${domReport.summary.total} | ${domReport.summary.passed} | ${domReport.summary.failed} | docs/ops/wcag-dom-latest.md |`,
    '',
    '| Rendered Component | Route | Ratio | AA Threshold | Status |',
    '|---|---|---|---|---|',
    ...domReport.results.map((item) => `| ${item.component} | ${item.route} | ${item.ratio.toFixed(2)}:1 | ${item.thresholdAA.toFixed(1)}:1 | ${item.pass ? 'PASS' : 'FAIL'} |`),
    '',
    'Detailed reports: docs/ops/wcag-contrast-latest.md, docs/ops/wcag-dom-latest.md',
    end,
  ]

  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`)
  if (!pattern.test(matrixContent)) {
    throw new Error('WCAG matrix markers not found')
  }

  return matrixContent.replace(pattern, lines.join('\n'))
}

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ baseURL })
  const page = await context.newPage()
  const generatedAt = new Date().toISOString()

  try {
    const results = []

    for (const check of checks) {
      await page.goto(check.route, { waitUntil: 'domcontentloaded', timeout: 90000 })
      await page.locator(check.selector).first().waitFor({ state: 'visible', timeout: 30000 })

      const sample = await page.locator(check.selector).first().evaluate((node) => {
        const parseRgb = (raw) => {
          const match = raw.match(/rgba?\(([^)]+)\)/i)
          if (!match) return null
          const parts = match[1].split(',').map((value) => Number.parseFloat(value.trim()))
          if (parts.length < 3) return null
          return {
            r: parts[0],
            g: parts[1],
            b: parts[2],
            a: Number.isFinite(parts[3]) ? parts[3] : 1,
          }
        }

        const resolveBackground = (element) => {
          let current = element
          while (current) {
            const color = parseRgb(window.getComputedStyle(current).backgroundColor)
            if (color && color.a > 0) {
              return color
            }
            current = current.parentElement
          }

          return { r: 255, g: 255, b: 255, a: 1 }
        }

        const style = window.getComputedStyle(node)
        const foreground = parseRgb(style.color)
        const background = resolveBackground(node)

        return {
          text: (node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
          fontSizePx: Number.parseFloat(style.fontSize),
          fontWeight: style.fontWeight,
          foreground,
          background,
        }
      })

      if (!sample.foreground || !sample.background) {
        throw new Error(`Unable to resolve rendered colors for ${check.component}`)
      }

      const largeText = isLargeText(sample.fontSizePx, sample.fontWeight)
      const thresholdAA = largeText ? 3.0 : 4.5
      const ratio = contrastRatio(sample.foreground, sample.background)

      results.push({
        component: check.component,
        route: check.route,
        selector: check.selector,
        text: sample.text,
        fontSizePx: sample.fontSizePx,
        fontWeight: sample.fontWeight,
        largeText,
        thresholdAA,
        ratio,
        pass: ratio >= thresholdAA,
        foreground: rgbToHex(sample.foreground),
        background: rgbToHex(sample.background),
      })
    }

    const summary = {
      total: results.length,
      passed: results.filter((item) => item.pass).length,
      failed: results.filter((item) => !item.pass).length,
    }

    const report = {
      generatedAt,
      baseURL,
      summary,
      results,
    }

    fs.mkdirSync(path.dirname(outJsonPath), { recursive: true })
    fs.writeFileSync(outJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
    fs.writeFileSync(outMdPath, `${buildMarkdown(report)}\n`, 'utf8')

    const tokenReport = readJsonIfExists(tokenJsonPath)
    const matrixContent = fs.readFileSync(matrixPath, 'utf8')
    const updatedMatrix = updateMatrixBlock(matrixContent, tokenReport, report)
    fs.writeFileSync(matrixPath, updatedMatrix, 'utf8')

    if (summary.failed > 0) {
      console.error(`WCAG rendered DOM audit failed: ${summary.failed} component(s) below AA threshold.`)
      process.exitCode = 1
      return
    }

    console.log(`WCAG rendered DOM audit passed (${summary.passed}/${summary.total}).`)
  } finally {
    await context.close()
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})