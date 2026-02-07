import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // Auto-inject axe on every page
    await page.addInitScript(() => {
      window.addEventListener('DOMContentLoaded', () => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js';
        document.head.appendChild(script);
      });
    });
    await use(page);
  },
});

export { expect } from '@playwright/test';
