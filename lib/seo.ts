import type { Metadata } from 'next'

type PublicMetadataInput = {
  title: string
  description: string
  path: string
  keywords?: string[]
  noIndex?: boolean
  canonicalPath?: string
}

const DEFAULT_SITE_URL = 'https://gtixt.com'

const BASE_KEYWORDS = [
  'GTIXT',
  'prop firm rankings',
  'prop trading intelligence',
  'payout reliability',
  'risk integrity',
]

function getSiteUrl(): string {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL
  return candidate.endsWith('/') ? candidate : `${candidate}/`
}

function normalizePath(path: string): string {
  if (!path) return '/'
  const withoutQuery = path.split('?')[0]?.split('#')[0] || '/'
  if (withoutQuery === '/') return '/'
  return withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`
}

function buildAbsoluteUrl(path: string): string {
  return new URL(normalizePath(path), getSiteUrl()).toString()
}

function buildTitle(title: string): string {
  return title.includes('GTIXT') ? title : `${title} | GTIXT`
}

type LegacySeoInput = PublicMetadataInput & {
  type?: 'website' | 'article'
}

export type LegacySeoMetadata = {
  title: string
  description: string
  canonical: string
  url: string
  robots: string
  openGraphType: 'website' | 'article'
  twitterCard: 'summary_large_image'
}

export function buildPublicMetadata({
  title,
  description,
  path,
  keywords = [],
  noIndex = false,
  canonicalPath,
}: PublicMetadataInput): Metadata {
  const fullTitle = buildTitle(title)
  const canonical = normalizePath(canonicalPath || path)
  const url = buildAbsoluteUrl(canonical)

  return {
    title: fullTitle,
    description,
    keywords: [...new Set([...BASE_KEYWORDS, ...keywords])],
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'website',
      url,
      siteName: 'GTIXT',
      locale: 'en_US',
      title: fullTitle,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
    robots: noIndex
      ? {
          index: false,
          follow: true,
          googleBot: {
            index: false,
            follow: true,
          },
        }
      : {
          index: true,
          follow: true,
        },
  }
}

export function buildLegacySeo({
  title,
  description,
  path,
  noIndex = false,
  canonicalPath,
  type = 'website',
}: LegacySeoInput): LegacySeoMetadata {
  const fullTitle = buildTitle(title)
  const canonical = normalizePath(canonicalPath || path)
  const url = buildAbsoluteUrl(canonical)

  return {
    title: fullTitle,
    description,
    canonical,
    url,
    robots: noIndex ? 'noindex,follow' : 'index,follow',
    openGraphType: type,
    twitterCard: 'summary_large_image',
  }
}