import { test, expect } from '@playwright/test'

test.describe.configure({ timeout: 120000 })

type MockNode = {
  id: string
  label: string
  slug: string
  modelType: string
  score: number
  riskIndex: number
  riskCategory: string
  jurisdiction: string
  rviStatus: string
  payoutReliability: number
  operationalStability: number
  earlyWarning: boolean
}

type MockEdge = {
  source: string
  target: string
  relation: 'jurisdiction' | 'risk-cluster' | 'warning-signal'
  weight: number
}

const makePayload = (nodeCount: number, highWarningBias = false) => {
  const jurisdictions = ['US', 'FR', 'DE', 'AE', 'AU']
  const nodes: MockNode[] = Array.from({ length: nodeCount }).map((_, i) => {
    const risk = highWarningBias ? 60 + (i % 38) : 12 + (i % 80)
    const category = risk >= 65 ? 'Critical' : risk >= 48 ? 'High' : risk >= 30 ? 'Moderate' : 'Low'
    const earlyWarning = highWarningBias ? i % 2 === 0 : i % 5 === 0
    return {
      id: `firm-${i + 1}`,
      label: `Firm ${i + 1}`,
      slug: `firm-${i + 1}`,
      modelType: i % 3 === 0 ? 'CHALLENGE' : i % 3 === 1 ? 'INSTANT' : 'HYBRID',
      score: Math.max(20, 96 - (i % 50)),
      riskIndex: risk,
      riskCategory: category,
      jurisdiction: jurisdictions[i % jurisdictions.length],
      rviStatus: i % 4 === 0 ? 'Verified' : 'Pending',
      payoutReliability: Math.max(15, 92 - (i % 35)),
      operationalStability: Math.max(10, 88 - (i % 45)),
      earlyWarning,
    }
  })

  const edges: MockEdge[] = []
  for (let i = 0; i < nodeCount - 1; i += 1) {
    edges.push({
      source: `firm-${i + 1}`,
      target: `firm-${i + 2}`,
      relation: i % 3 === 0 ? 'warning-signal' : i % 3 === 1 ? 'risk-cluster' : 'jurisdiction',
      weight: 1 + (i % 5),
    })
  }

  return {
    success: true,
    count: nodes.length,
    clusters: {
      highRisk: nodes.filter((n) => n.riskIndex >= 48).length,
      stable: nodes.filter((n) => n.riskIndex < 30).length,
      earlyWarning: nodes.filter((n) => n.earlyWarning).length,
    },
    timeline: {
      minYear: 2024,
      maxYear: 2026,
      years: [2024, 2025, 2026],
      minPeriod: '2025-01',
      maxPeriod: '2026-03',
      periods: ['2025-01', '2025-06', '2025-12', '2026-03'],
      yearlyTotals: [
        { year: 2024, nodeCount: Math.max(20, Math.floor(nodeCount * 0.5)), earlyWarningCount: 6, avgRisk: 42 },
        { year: 2025, nodeCount: Math.max(30, Math.floor(nodeCount * 0.75)), earlyWarningCount: 10, avgRisk: 49 },
        { year: 2026, nodeCount, earlyWarningCount: nodes.filter((n) => n.earlyWarning).length, avgRisk: 58 },
      ],
      monthlyTotals: [
        { period: '2025-12', nodeCount: Math.max(30, Math.floor(nodeCount * 0.8)), earlyWarningCount: 8, avgRisk: 51 },
        { period: '2026-03', nodeCount, earlyWarningCount: nodes.filter((n) => n.earlyWarning).length, avgRisk: 58 },
      ],
      perFirm: Object.fromEntries(
        nodes.map((n) => [
          n.id,
          {
            firstPeriod: '2025-01',
            lastPeriod: '2026-03',
            firstYear: 2025,
            lastYear: 2026,
            monthly: [
              { period: '2025-12', avgRisk: Math.max(0, n.riskIndex - 4), earlyWarning: n.earlyWarning && n.riskIndex > 54 },
              { period: '2026-03', avgRisk: n.riskIndex, earlyWarning: n.earlyWarning },
            ],
            yearly: [
              { year: 2025, avgRisk: Math.max(0, n.riskIndex - 6), earlyWarning: n.earlyWarning && n.riskIndex > 55 },
              { year: 2026, avgRisk: n.riskIndex, earlyWarning: n.earlyWarning },
            ],
          },
        ])
      ),
    },
    nodes,
    edges,
  }
}

async function mockIndustryApis(page: import('@playwright/test').Page, extreme = false) {
  const payload = makePayload(extreme ? 220 : 90, extreme)

  await page.route('**/api/industry-map?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    })
  })

  await page.route('**/api/intelligence/firm/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          firm_id: 'firm-1',
          name: 'Firm 1',
          gtixt_score: 78.5,
          risk_index: 71,
          risk_category: 'Critical',
          early_warning: true,
          regulatory_status: 'Verified',
          rvi_status: 'Verified',
          rvi_score: 84,
          payout_reliability: 66,
          operational_stability: 53,
        },
      }),
    })
  })
}

async function ensureIndustryMapReady(page: import('@playwright/test').Page) {
  await page.goto('/industry-map', { waitUntil: 'networkidle' })

  const transientError = page.getByText('Something Went Wrong', { exact: true })
  if (await transientError.isVisible({ timeout: 1200 }).catch(() => false)) {
    const retryButton = page.getByRole('button', { name: /Try Again/i })
    if (await retryButton.isVisible({ timeout: 800 }).catch(() => false)) {
      await retryButton.click()
      await page.waitForLoadState('networkidle')
    }
  }

  await expect(page.locator('.institutional-page').first()).toBeVisible({ timeout: 30000 })
  await expect(page.getByText('GTIXT Globe').first()).toBeVisible({ timeout: 30000 })
}

async function stableSnapshot(page: import('@playwright/test').Page, name: string) {
  await page.addStyleTag({
    content: `
      * { animation: none !important; transition: none !important; }
      canvas { visibility: hidden !important; }
    `,
  })
  const shot = await page.locator('.institutional-page').first().screenshot({ timeout: 60000 })
  expect(shot).toMatchSnapshot(name)
}

test.describe('Industry Map Visual QA', () => {
  test('desktop snapshots at 100% and 125%', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop snapshot test runs only on desktop project')
    await mockIndustryApis(page, false)
    await page.setViewportSize({ width: 1600, height: 1100 })
    await ensureIndustryMapReady(page)
    await page.getByText('Priority Queue').first().click()

    await stableSnapshot(page, 'industry-map-desktop-100.png')

    await page.evaluate(() => {
      document.documentElement.style.zoom = '1.25'
    })

    await stableSnapshot(page, 'industry-map-desktop-125.png')
  })

  test('mobile snapshots at 100% and 125%', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes('mobile'), 'Mobile snapshot test runs only on mobile project')
    await mockIndustryApis(page, false)
    await page.setViewportSize({ width: 393, height: 852 })
    await ensureIndustryMapReady(page)

    await stableSnapshot(page, 'industry-map-mobile-100.png')

    await page.evaluate(() => {
      document.documentElement.style.zoom = '1.25'
    })

    await stableSnapshot(page, 'industry-map-mobile-125.png')
  })

  test('extreme dataset UX remains usable', async ({ page }) => {
    await mockIndustryApis(page, true)
    await page.setViewportSize({ width: 1600, height: 1100 })
    await ensureIndustryMapReady(page)

    await expect(page.getByText('Signals').first()).toBeVisible()
    await expect(page.getByText('Integrated Radar').first()).toBeVisible()

    await page.getByRole('button', { name: /Priority Queue/i }).click({ force: true })
    const queueRows = page.locator('button').filter({ hasText: /Firm \d+/ })
    await expect(queueRows.first()).toBeVisible()
    await expect(queueRows).toHaveCount(40)

    const isScrollable = await queueRows.first().evaluate((row) => {
      let parent = row.parentElement as HTMLElement | null
      while (parent) {
        const cls = parent.className || ''
        const styles = window.getComputedStyle(parent)
        const looksScrollable = styles.overflowY === 'auto' || styles.overflowY === 'scroll'
        const isQueueContainer = typeof cls === 'string' && cls.includes('max-h-[148px]')
        if ((looksScrollable || isQueueContainer) && parent.scrollHeight > parent.clientHeight) {
          return true
        }
        parent = parent.parentElement
      }
      return false
    })
    expect(isScrollable).toBeTruthy()

    await expect(page.getByText('Node size = market relevance').first()).toBeVisible()
    await expect(page.getByText('CriticalHighMediumLowRegulatory MeshRisk ClusterWarning Lattice')).toHaveCount(0)
  })
})
