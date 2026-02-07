import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('Homepage should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:3005/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
    console.log(`Homepage loaded in ${loadTime}ms`);
  });

  test('Rankings page should have good Core Web Vitals', async ({ page }) => {
    await page.goto('http://localhost:3005/rankings');
    
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const entry = entries[0] as any;
          resolve({
            FCP: entry.startTime,
            LCP: entry.renderTime || entry.loadTime,
          });
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        
        setTimeout(() => resolve({ FCP: 0, LCP: 0 }), 5000);
      });
    });
    
    console.log('Core Web Vitals:', metrics);
    // LCP should be < 2.5s for good performance
    expect((metrics as any).LCP).toBeLessThan(2500);
  });

  test('API response times should be acceptable', async ({ request }) => {
    const endpoints = [
      '/api/health',
      '/api/rankings',
      '/api/countries',
    ];
    
    for (const endpoint of endpoints) {
      const startTime = Date.now();
      const response = await request.get(`http://localhost:3005${endpoint}`);
      const duration = Date.now() - startTime;
      
      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(500); // API should respond < 500ms
      console.log(`${endpoint} responded in ${duration}ms`);
    }
  });

  test('Page size should be reasonable', async ({ page }) => {
    const requests: any[] = [];
    page.on('response', (response) => {
      requests.push({
        url: response.url(),
        size: response.headers()['content-length'] || 0,
      });
    });
    
    await page.goto('http://localhost:3005/');
    await page.waitForLoadState('networkidle');
    
    const totalSize = requests.reduce((sum, req) => sum + parseInt(req.size), 0);
    const totalMB = (totalSize / 1024 / 1024).toFixed(2);
    
    console.log(`Total page size: ${totalMB}MB`);
    expect(totalSize).toBeLessThan(5 * 1024 * 1024); // < 5MB
  });

  test('Images should be optimized', async ({ page }) => {
    await page.goto('http://localhost:3005/');
    
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        const response = await page.context().request.get(src);
        const size = parseInt(response.headers()['content-length'] || '0');
        
        // Images should be < 500KB
        expect(size).toBeLessThan(500 * 1024);
      }
    }
  });

  test('Should handle concurrent requests', async ({ request }) => {
    const concurrentRequests = 20;
    const promises = Array(concurrentRequests).fill(0).map(() => 
      request.get('http://localhost:3005/api/rankings')
    );
    
    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });
    
    console.log(`${concurrentRequests} concurrent requests completed in ${duration}ms`);
    expect(duration).toBeLessThan(5000);
  });

  test('Memory usage should be stable', async ({ page }) => {
    await page.goto('http://localhost:3005/');
    
    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Navigate through pages
    await page.click('a[href*="/rankings"]');
    await page.waitForLoadState('networkidle');
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Get final memory
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      const increasePercent = (memoryIncrease / initialMemory) * 100;
      
      console.log(`Memory increase: ${increasePercent.toFixed(2)}%`);
      // Memory shouldn't increase more than 50%
      expect(increasePercent).toBeLessThan(50);
    }
  });
});
