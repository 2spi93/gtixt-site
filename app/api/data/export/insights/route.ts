/**
 * Export API: Market Insights
 *
 * Auto-generated narratives + watchlist slices
 * Formats: JSON (default), markdown
 * Cache: 120s
 */

import { NextResponse } from 'next/server'
import { loadPublicFirmUniverse } from '@/lib/public-firms'
import { computeSystemicRisk } from '@/lib/risk-engine'
import { buildMarketInsightsReport } from '@/lib/market-insights'

export const revalidate = 120

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') || 'json'

  try {
    const { firms } = await loadPublicFirmUniverse()
    const systemic = computeSystemicRisk(firms)
    const report = buildMarketInsightsReport(firms)

    if (format === 'markdown') {
      return markdownResponse(systemic, report)
    }

    // Default: JSON
    return NextResponse.json(
      {
        success: true,
        export_date: new Date().toISOString(),
        systemic_risk: {
          level: systemic.level,
          stress_ratio_percent: Number((systemic.stressRatio * 100).toFixed(1)),
          deteriorating_count: systemic.deterioratingCount,
          high_risk_count: systemic.highRiskCount,
          early_warning_count: systemic.earlyWarningCount,
          rising_count: systemic.risingCount,
        },
        market_insights: report.insights.map((insight) => ({
          title: insight.title,
          summary: insight.summary,
          tone: insight.tone,
          kicker: insight.kicker,
          link: `https://gtixt.com${insight.href}`,
        })),
        watchlists: {
          rising: {
            count: report.rising.length,
            firms: report.rising.map((f) => ({
              firm_id: f.slug,
              name: f.name,
              score: f.score,
              link: `https://gtixt.com/firms/${f.slug}`,
            })),
          },
          warnings: {
            count: report.warnings.length,
            firms: report.warnings.map((f) => ({
              firm_id: f.slug,
              name: f.name,
              score: f.score,
              warning_label: f.label,
              severity: f.severity,
              link: `https://gtixt.com/firms/${f.slug}`,
            })),
          },
          stressed: {
            count: report.stressed.length,
            firms: report.stressed.map((f) => ({
              firm_id: f.slug,
              name: f.name,
              score: f.score,
              signal: f.signalLabel,
              link: `https://gtixt.com/firms/${f.slug}`,
            })),
          },
        },
        export_format: 'json-v1',
        schema_version: '2026-03-19',
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=120',
        },
      }
    )
  } catch (error) {
    console.error('[export/insights] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}

// ── Markdown Export Helper ─────────────────────────────────────────────────────

function markdownResponse(systemic: any, report: any) {
  const date = new Date().toISOString().split('T')[0]

  const md = `# GTIXT Market Intelligence Report
**Generated:** ${new Date().toISOString()}

## Systemic Risk Status

| Metric | Value |
|--------|-------|
| **Level** | ${systemic.level.toUpperCase()} |
| **Stress Ratio** | ${(systemic.stressRatio * 100).toFixed(1)}% |
| **Deteriorating Firms** | ${systemic.deterioratingCount} |
| **High Risk Firms** | ${systemic.highRiskCount} |
| **Early Warnings** | ${systemic.earlyWarningCount} |
| **Rising Firms** | ${systemic.risingCount} |

---

## Market Insights

${report.insights
  .map(
    (insight: any, i: number) =>
      `### ${i + 1}. ${insight.title}

**Tone:** ${insight.tone.toUpperCase()}  
${insight.summary}

[View Details](https://gtixt.com${insight.href})`
  )
  .join('\n\n')}

---

## Rising Firms (${report.rising.length})

${report.rising.length > 0 ? report.rising.map((f: any) => `- **${f.name}** - Score: ${f.score}/100 → [Profile](https://gtixt.com/firms/${f.slug})`).join('\n') : '_No rising firms in current slice_'}

---

## Warning Firms (${report.warnings.length})

${report.warnings.length > 0 ? report.warnings.map((f: any) => `- **${f.name}** (${f.severity}) - Score: ${f.score}/100 - ${f.label} → [Profile](https://gtixt.com/firms/${f.slug})`).join('\n') : '_No warnings in current slice_'}

---

## Stressed Firms (${report.stressed.length})

${report.stressed.length > 0 ? report.stressed.map((f: any) => `- **${f.name}** - ${f.signalLabel} - Score: ${f.score}/100 → [Profile](https://gtixt.com/firms/${f.slug})`).join('\n') : '_No heavily stressed firms in current slice_'}

---

## API Reference

**Export endpoints:**
- \`/api/data/export/firms-snapshot?format=json\` - Full firm snapshot with predictions
- \`/api/data/export/firms-snapshot?format=csv\` - CSV export for spreadsheets
- \`/api/data/export/predictions?format=json\` - Risk predictions with triggers
- \`/api/data/export/predictions?format=jsonl\` - Line-delimited predictions for streaming
- \`/api/data/export/insights?format=json\` - Market narratives (this output)
- \`/api/data/export/insights?format=markdown\` - Markdown report (this format)

**Query parameters:**
- \`format\`: output format (json, csv, jsonl, markdown)
- \`score_min\`: filter firms by minimum score (0-100)
- \`risk_max\`: filter by maximum risk (0-1)
- \`risk_type\`: filter predictions (any, closure, fraud, stress)
- \`min_risk\`: minimum risk threshold for predictions (0-1)

---

Generated by GTIXT Intelligence Engine v1.2.0
`

  return new NextResponse(md, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="gtixt-insights-${date}.md"`,
      'Cache-Control': 'public, max-age=120',
    },
  })
}
