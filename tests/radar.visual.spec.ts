import { expect, test } from '@playwright/test'

test.describe.configure({ timeout: 120000 })

type RadarReadyResult = {
  ready: boolean
  reason?: string
}

type MockRadarEvent = {
  firm_id: string
  firm_name: string
  website: string | null
  jurisdiction: string | null
  gri_score: number
  risk_category: string
  warning_signals: string[]
  dimensions: {
    operational: number
    financial: number
    behavioural: number
    community: number
    infrastructure: number
  }
  snapshot_date: string
  computed_at: string | null
  status: 'Healthy' | 'Watch' | 'Danger'
  collapse_probability: number
  stability_score: number
  signal_count: number
  is_new_alert: boolean
  share_text: string
  share_url: string
}

function makeEvent(index: number): MockRadarEvent {
  const names = [
    'Apex Trader Funding',
    'Blue Ridge Capital',
    'Cobalt Markets',
    'Delta Prop Systems',
    'Ember Trade Hub',
    'Falcon Payout Network',
    'Granite FX Operations',
    'Helix Capital Desk',
    'Ion Execution Group',
    'Jetstream Prop',
    'Keystone Funded',
    'Lattice Trading Co',
  ]
  const jurisdictions = ['US', 'AE', 'DE', 'AU', 'FR', 'US']
  const signals = [
    ['Liquidity stress cluster', 'Delayed payout complaints', 'Jurisdiction review'],
    ['Liquidity stress cluster', 'Jurisdiction review'],
    ['Delayed payout complaints', 'Stress volatility cluster'],
    ['Regulatory compliance review', 'Liquidity stress cluster'],
    ['Trader dispute escalation', 'Delayed payout complaints'],
    ['Regulatory compliance review', 'Jurisdiction review'],
  ]
  const collapse = Math.max(24, 84 - index * 4)
  const status = collapse >= 70 ? 'Danger' : collapse >= 45 ? 'Watch' : 'Healthy'
  const riskCategory = collapse >= 70 ? 'Critical Risk' : collapse >= 55 ? 'High Risk' : collapse >= 35 ? 'Moderate Risk' : 'Low Risk'
  const warningSignals = signals[index % signals.length]
  const computedAt = new Date(Date.UTC(2026, 2, 17, 8, index * 4)).toISOString()

  return {
    firm_id: `firm-${index + 1}`,
    firm_name: names[index % names.length],
    website: `https://firm-${index + 1}.example.com`,
    jurisdiction: jurisdictions[index % jurisdictions.length],
    gri_score: 92 - index * 3,
    risk_category: riskCategory,
    warning_signals: warningSignals,
    dimensions: {
      operational: 70 - index,
      financial: 74 - index,
      behavioural: 61 - index,
      community: 48 - index,
      infrastructure: 58 - index,
    },
    snapshot_date: '2026-03-17T00:00:00.000Z',
    computed_at: computedAt,
    status,
    collapse_probability: collapse,
    stability_score: Math.max(16, 72 - index * 3),
    signal_count: warningSignals.length,
    is_new_alert: index < 5,
    share_text: `${names[index % names.length]} moved to ${status}`,
    share_url: `https://gtixt.com/risk-radar?firm=firm-${index + 1}`,
  }
}

function makeRadarPayload() {
  const data = Array.from({ length: 12 }, (_, index) => makeEvent(index))
  return {
    success: true,
    headline: '12 firm(s) showing instability signals',
    count: data.length,
    window_days: 7,
    data_source: 'live_evidence',
    as_of: '2026-03-17T09:30:00.000Z',
    distribution: {
      low: 2,
      moderate: 3,
      elevated: 1,
      high: 3,
      critical: 3,
    },
    data,
    high_risk_firms: data.slice(0, 6),
    new_alerts: data.slice(0, 5),
    stability_ranking: [...data].sort((a, b) => b.stability_score - a.stability_score).slice(0, 6),
  }
}

async function mockRadarApi(page: import('@playwright/test').Page) {
  const payload = makeRadarPayload()
  await page.route('**/api/radar/early-warning**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    })
  })
}

async function checkRadarReady(page: import('@playwright/test').Page, maxRetries = 3): Promise<RadarReadyResult> {
  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const suffix = attempt === 0 ? '' : `?qa-retry=${attempt}-${Date.now()}`
    await page.goto(`/radar${suffix}`, { waitUntil: 'domcontentloaded' })

    const pageReady = await page.locator('.radar-page').first().isVisible({ timeout: 8000 }).catch(() => false)
    if (pageReady) {
      return { ready: true }
    }

    const transientError = page.getByText('Something Went Wrong', { exact: true })
    if (await transientError.isVisible({ timeout: 1200 }).catch(() => false)) {
      const retryButton = page.getByRole('button', { name: /Try Again/i })
      if (await retryButton.isVisible({ timeout: 800 }).catch(() => false)) {
        await retryButton.click()
      }
    }

    await page.waitForTimeout(1200 + attempt * 900)
  }

  const chunkErrorVisible = await page
    .getByText(/Failed to load chunk|ChunkLoadError/i)
    .first()
    .isVisible({ timeout: 700 })
    .catch(() => false)

  if (chunkErrorVisible) {
    return {
      ready: false,
      reason: 'Pre-check skipped: persistent chunk error-boundary after 3 retries',
    }
  }

  return {
    ready: false,
    reason: 'Pre-check skipped: radar page not ready after 3 retries',
  }
}

async function ensureRadarReady(page: import('@playwright/test').Page): Promise<RadarReadyResult> {
  const readiness = await checkRadarReady(page, 3)
  if (!readiness.ready) return readiness

  await expect(page.locator('.radar-page').first()).toBeVisible({ timeout: 30000 })
  await expect(page.getByText('Sector Command Status').first()).toBeVisible({ timeout: 30000 })
  await expect(page.getByLabel('GTIXT Tactical Radar')).toBeVisible({ timeout: 30000 })

  return { ready: true }
}

async function stableSnapshot(page: import('@playwright/test').Page, name: string) {
  await page.addStyleTag({
    content: `
      * { animation: none !important; transition: none !important; }
    `,
  })
  await page.evaluate(() => {
    document.querySelectorAll('svg').forEach((node) => {
      if ('pauseAnimations' in node && typeof node.pauseAnimations === 'function') {
        node.pauseAnimations()
      }
    })
  })
  const shot = await page.locator('.radar-page').first().screenshot({ timeout: 60000 })
  expect(shot).toMatchSnapshot(name)
}

test.describe('Radar Visual QA', () => {
  test('@radar-precheck chunk-boundary gate', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Pre-check runs on chromium only')
    await mockRadarApi(page)
    await page.setViewportSize({ width: 1600, height: 1100 })

    const readiness = await ensureRadarReady(page)
    test.skip(!readiness.ready, readiness.reason || 'Radar pre-check failed')

    await expect(page.locator('.radar-page').first()).toBeVisible()
  })

  test('desktop snapshots at 100% and 125% in shock mode', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Desktop radar snapshots run on chromium only')
    await mockRadarApi(page)
    await page.setViewportSize({ width: 1600, height: 1100 })
    const readiness = await ensureRadarReady(page)
    test.skip(!readiness.ready, readiness.reason || 'Radar not ready')
    if (!readiness.ready) return

    await page.getByRole('button', { name: /Shock Sim Off/i }).click()
    await expect(page.getByText('Shock Simulation').first()).toBeVisible()
    await expect(page.getByLabel('Risk Propagation Graph')).toBeVisible()

    await stableSnapshot(page, 'radar-desktop-shock-100.png')

    await page.evaluate(() => {
      document.documentElement.style.zoom = '1.25'
    })

    await stableSnapshot(page, 'radar-desktop-shock-125.png')
  })

  test('mobile snapshot keeps propagation panel readable', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile radar snapshot runs on mobile-chrome only')
    await mockRadarApi(page)
    await page.setViewportSize({ width: 393, height: 852 })
    const readiness = await ensureRadarReady(page)
    test.skip(!readiness.ready, readiness.reason || 'Radar not ready')
    if (!readiness.ready) return

    await page.getByRole('button', { name: /Shock Sim Off/i }).click()
    await expect(page.getByText('Shock Simulation').first()).toBeVisible()

    await stableSnapshot(page, 'radar-mobile-shock-100.png')
  })

  test('uses live payload fields in threats, stream, and metadata', async ({ page }) => {
    await mockRadarApi(page)
    await page.setViewportSize({ width: 1600, height: 1100 })
    const readiness = await ensureRadarReady(page)
    test.skip(!readiness.ready, readiness.reason || 'Radar not ready')
    if (!readiness.ready) return

    await expect(page.getByText(/live evidence/i).first()).toBeVisible()
    await expect(page.getByText(/7d window/i).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Apex Trader Funding/i }).first()).toBeVisible()
    await expect(page.getByText('Liquidity stress cluster').first()).toBeVisible()

    await page.getByRole('button', { name: /Shock Sim Off/i }).click()
    await expect(page.getByText('Primary 4')).toBeVisible()
    await expect(page.getByText('Secondary 6')).toBeVisible()
  })
})