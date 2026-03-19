#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const repoRoot = process.cwd()
const manifestPath = path.join(repoRoot, 'docs', 'ops', 'route-visual-manifest-latest.json')
const adminManifestPath = path.join(repoRoot, 'docs', 'ops', 'admin-route-visual-manifest-latest.json')
const matrixPath = path.join(repoRoot, 'docs', 'VISUAL_COMPLIANCE_MATRIX_20260319.md')

function updateVisualBlock(matrixContent, manifest, adminManifest) {
  const start = '<!-- VISUAL_QA_START -->'
  const end = '<!-- VISUAL_QA_END -->'
  const redirects = manifest.authRedirects ?? 0

  const lines = [
    start,
    `Last run: ${manifest.generatedAt}`,
    '',
    `Captured: ${manifest.capturedRoutes}/${manifest.totalRoutes} routes.`,
    `Auth redirects observed: ${redirects}.`,
    '',
    'Evidence files:',
    '- docs/ops/route-visual-evidence-latest.md',
    '- docs/ops/route-visual-manifest-latest.json',
    '- test-results/route-visual-proof/*.png',
    '',
  ]

  if (adminManifest) {
    lines.push(`Authenticated admin captures: ${adminManifest.capturedRoutes}/${adminManifest.totalRoutes}.`)
    lines.push(`Unexpected admin auth redirects: ${adminManifest.unexpectedAuthRedirects ?? 0}.`)
    lines.push('- docs/ops/admin-route-visual-evidence-latest.md')
    lines.push('- docs/ops/admin-route-visual-manifest-latest.json')
    lines.push('- test-results/admin-route-visual-proof/*.png')
    lines.push('')
  }

  lines.push(end)
  const block = lines.join('\n')
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`)
  if (!pattern.test(matrixContent)) {
    throw new Error('Visual QA matrix markers not found')
  }

  return matrixContent.replace(pattern, block)
}

function main() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Missing visual manifest. Run qa:visual:routes first.')
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const adminManifest = fs.existsSync(adminManifestPath)
    ? JSON.parse(fs.readFileSync(adminManifestPath, 'utf8'))
    : null
  const matrix = fs.readFileSync(matrixPath, 'utf8')
  const updated = updateVisualBlock(matrix, manifest, adminManifest)
  fs.writeFileSync(matrixPath, updated, 'utf8')
  console.log('Visual evidence block synced into compliance matrix.')
}

main()
