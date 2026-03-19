import { test } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import {
  ADMIN_STORAGE_STATE_PATH,
  ensureAdminStorageState,
  hasAdminAuthConfig,
} from './utils/admin-storage-state'

test.describe('Authenticated Admin Route Visual Proof', () => {
  test.describe.configure({ mode: 'serial' })

  test('capture authenticated admin route screenshots and evidence manifest', async ({ browser, baseURL }) => {
    test.setTimeout(15 * 60 * 1000)
    test.skip(!hasAdminAuthConfig(), 'Authenticated admin capture requires Playwright admin credentials.')

    const resolvedBaseUrl = baseURL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
    const prep = await ensureAdminStorageState(browser, resolvedBaseUrl)
    test.skip(!prep.ready, prep.reason || 'Unable to prepare admin storage state.')

    const routes = [
      '/admin',
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
      '/admin/integrity',
      '/admin/integrity/calibration',
      '/admin/jobs',
      '/admin/logs',
      '/admin/monitoring',
      '/admin/operations',
      '/admin/planning',
      '/admin/review',
      '/admin/security',
      '/admin/security/2fa',
      '/admin/security/password',
      '/admin/sessions',
      '/admin/users',
      '/admin/validation',
      '/admin/webgl-monitor',
    ]

    const timestamp = new Date().toISOString()
    const outputDir = path.resolve('test-results', 'admin-route-visual-proof')
    const docsOpsDir = path.resolve('docs', 'ops')
    const manifestPath = path.resolve(docsOpsDir, 'admin-route-visual-manifest-latest.json')
    const evidenceMdPath = path.resolve(docsOpsDir, 'admin-route-visual-evidence-latest.md')

    fs.mkdirSync(outputDir, { recursive: true })
    fs.mkdirSync(docsOpsDir, { recursive: true })

    const context = await browser.newContext({
      baseURL: resolvedBaseUrl,
      storageState: ADMIN_STORAGE_STATE_PATH,
    })
    const page = await context.newPage()

    try {
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
        const safe = route.replace(/^\//, '').replace(/[\/\[\]]+/g, '_')
        const screenshotRel = path.join('test-results', 'admin-route-visual-proof', `${String(index + 1).padStart(2, '0')}-${safe}.png`)
        const screenshotAbs = path.resolve(screenshotRel)

        const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => null)
        await page.waitForTimeout(350)
        await page.screenshot({ path: screenshotAbs, fullPage: true })

        const statusCode = response ? response.status() : null
        const finalUrl = page.url()
        const note = finalUrl.includes('/admin/login') ? 'unexpected auth redirect' : 'ok'

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
        baseURL: resolvedBaseUrl,
        totalRoutes: routes.length,
        capturedRoutes: results.length,
        unexpectedAuthRedirects: results.filter((item) => item.note.includes('redirect')).length,
        storageState: ADMIN_STORAGE_STATE_PATH,
        results,
      }

      fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

      const mdLines = [
        '# Authenticated Admin Route Visual Evidence (Playwright)',
        '',
        `Generated at: ${timestamp}`,
        `Base URL: ${resolvedBaseUrl}`,
        `Storage state: ${ADMIN_STORAGE_STATE_PATH}`,
        '',
        '| # | Route | HTTP | Final URL | Screenshot | Note |',
        '|---|---|---|---|---|---|',
        ...results.map((item) => (
          `| ${item.order} | ${item.route} | ${item.statusCode ?? 'N/A'} | ${item.finalUrl} | ${item.screenshot} | ${item.note} |`
        )),
      ]

      fs.writeFileSync(evidenceMdPath, `${mdLines.join('\n')}\n`, 'utf8')
    } finally {
      await context.close()
    }
  })
})