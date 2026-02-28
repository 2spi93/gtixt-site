// /opt/gpti/gpti-site/lib/path-guard.ts

import path from 'path';

const ALLOWED_ROOTS = [
  '/opt/gpti/gpti-site/app',
  '/opt/gpti/workers',
  '/opt/gpti/crawlers',
  '/opt/gpti/schemas',
  '/opt/gpti/gpti-site/components',
  '/opt/gpti/docker',
];

const FORBIDDEN_PATTERNS = [
  '.env',
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.cache',
];

export const isPathAllowed = (requestedPath: string): { allowed: boolean; reason?: string } => {
  const resolved = path.resolve(requestedPath);
  const inAllowedRoot = ALLOWED_ROOTS.some(root => resolved.startsWith(path.resolve(root)));

  if (!inAllowedRoot) {
    return { allowed: false, reason: 'Path not in allowed roots' };
  }

  const hasForbidden = FORBIDDEN_PATTERNS.some(pattern => resolved.includes(pattern));
  if (hasForbidden) {
    return { allowed: false, reason: 'Path contains forbidden pattern' };
  }

  return { allowed: true };
};

export const getAllowedRoots = (): string[] => [...ALLOWED_ROOTS];
