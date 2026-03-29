import fs from 'fs'

function readSecretFile(path: string): string | null {
  try {
    const value = fs.readFileSync(/* turbopackIgnore: true */ path, 'utf-8').trim()
    return value || null
  } catch {
    return null
  }
}

export function getSecretEnv(name: string, fallback = ''): string {
  const inline = String(process.env[name] || '').trim()
  if (inline) return inline

  const fileKey = `${name}_FILE`
  const filePath = String(process.env[fileKey] || '').trim()
  if (filePath) {
    const fromFile = readSecretFile(filePath)
    if (fromFile) return fromFile
  }

  return fallback
}
