const fs = require('fs');
const path = require('path');

const nextDir = path.join(process.cwd(), '.next');

try {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('[build] Removed stale .next directory');
} catch (error) {
  console.error('[build] Failed to remove .next directory:', error);
  process.exit(1);
}