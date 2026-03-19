import { test } from '@playwright/test'
import fs from 'fs'
import path from 'path'

test.describe('Route Visual Proof', () => {
  test.describe.configure({ mode: 'serial' })

  test('capture ordered route screenshots and evidence manifest', async ({ page, baseURL }) => {
    test.setTimeout(20 * 60 * 1000)

    const routes = [
      '/analytics',
      '/api-docs',
      '/best-prop-firms',
      '/data',
      '/firms/ftmo',
      '/firms',
      '/ftmo-review',
      '/fundingpips-review',
      '/index',
      '/industry-map',
      '/methodology',
      '/',
      '/prop-firm-payouts',
      '/radar',
      '/rankings',
      '/research',
      '/risk-radar',
      '/simulator',
      '/strategy-simulator',
      '/style-guide',
      '/verify',
      '/admin/agents',
      '/admin/agents/policies',
      '/admin/ai-assistant',
      '/admin/audit',
      '/admin/autonomous-lab',
      '/admin/copilot',
      '/admin/crawls',
      '/admin/discovery',
      '/admin/execution',
      '/admin/firms',
      '/admin/health',
      '/admin/info',
      '/admin/integrity/calibration',
      '/admin/integrity',
      '/admin/jobs',
      '/admin/login',
      '/admin/logs',
      '/admin/monitoring',
      '/admin/operations',
      '/admin',
      '/admin/planning',
      '/admin/review',
      '/admin/security/2fa',
      '/admin/security',
      '/admin/security/password',
      '/admin/sessions',
      '/admin/users',
      '/admin/validation',
      '/admin/webgl-monitor',
    ]

    const timestamp = new Date().toISOString()
    const outputDir = path.resolve('test-results', 'route-visual-proof')
    const docsOpsDir = path.resolve('docs', 'ops')
    const manifestPath = path.resolve(docsOpsDir, 'route-visual-manifest-latest.json')
    const evidenceMdPath = path.resolve(docsOpsDir, 'route-visual-evidence-latest.md')

    fs.mkdirSync(outputDir, { recursive: true })
    fs.mkdirSync(docsOpsDir, { recursive: true })

    const results = [] as Array<{
      order: number
      route: string
      statusCode: number | null
      finalUrl: string
      screenshot: string
      note: string
    }>

    for (let index = 0; index < routes.length; index += 1) {
      const route = routes[index]
      const safe = route === '/' ? 'root' : route.replace(/^\//, '').replace(/[\/\[\]]+/g, '_')
      const screenshotRel = path.join('test-results', 'route-visual-proof', `${String(index + 1).padStart(2, '0')}-${safe}.png`)
      const screenshotAbs = path.resolve(screenshotRel)

      const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => null)
      await page.waitForTimeout(350)
      await page.screenshot({ path: screenshotAbs, fullPage: true })

      const statusCode = response ? response.status() : null
      const finalUrl = page.url()
      const note = finalUrl.includes('/admin/login') && route !== '/admin/login'
        ? 'auth-gated: redirected to admin login'
        : 'ok'

      results.push({
        order: index + 1,
        route,
        statusCode,
        finalUrl,
        screenshot: screenshotRel,
        note,
      })
    }

    const manifest = {
      generatedAt: timestamp,
      baseURL: baseURL || '',
      totalRoutes: routes.length,
      capturedRoutes: results.length,
      authRedirects: results.filter((r) => r.note.startsWith('auth-gated')).length,
      results,
    }

    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

    const mdLines = [
      '# Route Visual Evidence (Playwright)',
      '',
      `Generated at: ${timestamp}`,
      `Base URL: ${baseURL || ''}`,
      '',
      '| # | Route | HTTP | Final URL | Screenshot | Note |',
      '|---|---|---|---|---|---|',
      ...results.map((r) => (
        `| ${r.order} | ${r.route} | ${r.statusCode ?? 'N/A'} | ${r.finalUrl} | ${r.screenshot} | ${r.note} |`
      )),
    ]

    fs.writeFileSync(evidenceMdPath, `${mdLines.join('\n')}\n`, 'utf8')
  })
})
