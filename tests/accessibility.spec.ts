import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test('Homepage should be accessible', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  });

  test('Rankings page should be accessible', async ({ page }) => {
    await page.goto('/rankings');
    await injectAxe(page);
    await checkA11y(page);
  });

  test('Firms page should be accessible', async ({ page }) => {
    await page.goto('/firms');
    await injectAxe(page);
    await checkA11y(page);
  });

  test('Data page should be accessible', async ({ page }) => {
    await page.goto('/data');
    await injectAxe(page);
    await checkA11y(page);
  });

  test('Methodology page should be accessible', async ({ page }) => {
    await page.goto('/methodology');
    await injectAxe(page);
    await checkA11y(page);
  });

  test('Keyboard navigation should work', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const firstFocus = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocus).toBeTruthy();
    
    // Verify skip link
    await page.keyboard.press('Tab');
    const skipLink = page.locator('[href="#main-content"]').first();
    if (await skipLink.isVisible()) {
      await skipLink.press('Enter');
      const mainContent = await page.locator('#main-content').isVisible();
      expect(mainContent).toBeTruthy();
    }
  });

  test('Images should have alt text', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('Forms should have labels', async ({ page }) => {
    await page.goto('/');
    const inputs = page.locator('input[type="text"], input[type="email"], select, textarea');
    const count = await inputs.count();
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('Color contrast should be sufficient', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    
    const results = await page.evaluate(() => {
      return new Promise((resolve) => {
        // @ts-ignore
        window.axe.run({
          rules: {
            'color-contrast': { enabled: true }
          }
        }, (err: any, results: any) => {
          resolve(results.violations.filter((v: any) => v.id === 'color-contrast'));
        });
      });
    });
    
    expect(results).toHaveLength(0);
  });
});
