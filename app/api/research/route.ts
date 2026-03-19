import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

type ResearchItem = {
  id: string
  title: string
  excerpt: string
  category: string
  date: string
  readTime: string
  author: string
  sourceFile: string
}

export const dynamic = 'force-dynamic'

function resolveCategory(fileName: string): string {
  const lower = fileName.toLowerCase()
  if (lower.includes('whitepaper')) return 'Whitepaper'
  if (lower.includes('manifesto') || lower.includes('governance') || lower.includes('ethics')) return 'Governance'
  if (lower.includes('architecture') || lower.includes('spec')) return 'Methodology'
  if (lower.includes('monitoring') || lower.includes('alerting') || lower.includes('https')) return 'Operations'
  if (lower.includes('guide') || lower.includes('credentials') || lower.includes('user-guide')) return 'Guides'
  return 'Research'
}

function estimateReadTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 220))
  return `${minutes} min`
}

function pickTitle(fileName: string, content: string): string {
  const heading = content
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('#'))

  if (heading) {
    return heading.replace(/^#+\s*/, '').trim()
  }

  return fileName
    .replace(/\.md$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function pickExcerpt(content: string): string {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('```'))

  const paragraph = lines.find((line) => line.length > 60) || lines[0] || 'GTIXT institutional research document.'
  return paragraph.slice(0, 180)
}

export async function GET() {
  try {
    const docsDir = path.join(process.cwd(), 'docs')
    const entries = await fs.readdir(docsDir, { withFileTypes: true })
    const markdownFiles = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))

    const docs = await Promise.all(
      markdownFiles.map(async (entry) => {
        const filePath = path.join(docsDir, entry.name)
        const [rawContent, stat] = await Promise.all([fs.readFile(filePath, 'utf-8'), fs.stat(filePath)])

        const title = pickTitle(entry.name, rawContent)
        const excerpt = pickExcerpt(rawContent)

        const item: ResearchItem = {
          id: entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title,
          excerpt,
          category: resolveCategory(entry.name),
          date: stat.mtime.toISOString().slice(0, 10),
          readTime: estimateReadTime(rawContent),
          author: 'GTIXT Research Office',
          sourceFile: entry.name,
        }

        return item
      })
    )

    docs.sort((a, b) => (a.date < b.date ? 1 : -1))

    return NextResponse.json({
      success: true,
      count: docs.length,
      data: docs,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load research documents',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
