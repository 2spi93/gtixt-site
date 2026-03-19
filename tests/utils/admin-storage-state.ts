import fs from 'fs'
import path from 'path'
import { expect, type Browser } from '@playwright/test'

export const ADMIN_STORAGE_STATE_PATH = path.resolve('test-results', '.auth', 'admin-storage-state.json')

type AdminAuthPreparation = {
  ready: boolean
  reason?: string
  storageStatePath?: string
}

function resolveAdminAuthConfig() {
  return {
    username: process.env.PLAYWRIGHT_ADMIN_USERNAME?.trim() || '',
    password: process.env.PLAYWRIGHT_ADMIN_PASSWORD?.trim() || '',
    totp: process.env.PLAYWRIGHT_ADMIN_TOTP?.trim() || '',
  }
}

export function hasAdminAuthConfig() {
  const config = resolveAdminAuthConfig()
  return Boolean(config.username && config.password)
}

export async function ensureAdminStorageState(browser: Browser, baseURL: string): Promise<AdminAuthPreparation> {
  const config = resolveAdminAuthConfig()
  if (!config.username || !config.password) {
    return {
      ready: false,
      reason: 'Missing PLAYWRIGHT_ADMIN_USERNAME or PLAYWRIGHT_ADMIN_PASSWORD.',
    }
  }

  fs.mkdirSync(path.dirname(ADMIN_STORAGE_STATE_PATH), { recursive: true })

  const context = await browser.newContext({ baseURL })
  const page = await context.newPage()

  try {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded', timeout: 90000 })
    await page.getByPlaceholder('Enter your username').fill(config.username)
    await page.getByPlaceholder('Enter your password').fill(config.password)
    await page.getByRole('button', { name: /sign in|verify/i }).click()

    const totpField = page.getByPlaceholder('000000')
    const totpRequired = await totpField.isVisible({ timeout: 4000 }).catch(() => false)

    if (totpRequired) {
      if (!config.totp) {
        return {
          ready: false,
          reason: 'Admin login requires TOTP but PLAYWRIGHT_ADMIN_TOTP is not set.',
        }
      }

      await totpField.fill(config.totp)
      await page.getByRole('button', { name: /verify/i }).click()
    }

    await page.waitForURL((url) => !url.pathname.startsWith('/admin/login'), { timeout: 30000 })
    await expect(page).not.toHaveURL(/\/admin\/login/)

    const authProbe = await page.evaluate(async () => {
      const response = await fetch('/api/internal/auth/me', { credentials: 'include' })
      return { ok: response.ok, status: response.status }
    })

    if (!authProbe.ok) {
      return {
        ready: false,
        reason: `Admin auth probe failed with status ${authProbe.status}.`,
      }
    }

    await context.storageState({ path: ADMIN_STORAGE_STATE_PATH })

    return {
      ready: true,
      storageStatePath: ADMIN_STORAGE_STATE_PATH,
    }
  } finally {
    await context.close()
  }
}