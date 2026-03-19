import fs from 'fs'
import path from 'path'
import { inferJurisdictionFromUrl, normalizeScore, parseNumber } from '@/lib/dataUtils'
import { fetchJsonWithFallback, parseFallbackRoots } from '@/lib/fetchWithFallback'

export type PublicFirmRecord = {
  firm_id?: string
  name?: string
  website_root?: string
  jurisdiction?: string
  jurisdiction_tier?: string
  score_0_100?: number
  payout_reliability?: number
  risk_model_integrity?: number
  operational_stability?: number
  historical_consistency?: number
  payout_frequency?: string
  account_size_usd?: number
  founded_year?: number
  status?: string
  rule_changes_frequency?: string
}

type SnapshotRecord = Record<string, unknown>

type SnapshotPayload = {
  records?: SnapshotRecord[]
}

export type LatestPointer = {
  object: string
  sha256?: string
  created_at?: string
}

const MINIO_BASE_URL = (
  process.env.MINIO_INTERNAL_ROOT ||
  process.env.NEXT_PUBLIC_MINIO_BASE ||
  'http://localhost:9002/gpti-snapshots'
).replace(/\/+$/, '')

const LATEST_POINTER_URL =
  process.env.SNAPSHOT_LATEST_URL ||
  `${MINIO_BASE_URL}/universe_v0.1_public/_public/latest.json`

const MINIO_PUBLIC_ROOT = `${MINIO_BASE_URL}/`
const FALLBACK_POINTER_URLS = parseFallbackRoots(process.env.NEXT_PUBLIC_LATEST_POINTER_FALLBACKS)
const FALLBACK_MINIO_ROOTS = parseFallbackRoots(process.env.NEXT_PUBLIC_MINIO_FALLBACK_ROOTS)

const INDEX_EXCLUDED_STATUSES = new Set([
  'controversial',
  'exclude',
  'excluded',
  'banned',
  'blacklist',
  'blacklisted',
  'non_compliant',
  'non-compliant',
  'noncompliant',
  'reject',
  'rejected',
  'fail',
  'failed',
  'do_not_index',
  'do-not-index',
])

const NON_FIRM_IDS = new Set([
  'asset-management',
  'authorisation',
  'authorised-or-registered-institutions-persons-and-products',
  'banks-and-securities-firms',
  'contact',
  'documents',
  'getting-authorised',
  'home',
  'insurance-intermediaries',
  'insurers',
  'jobs',
  'media',
  'news',
  'portfolio-managers-and-trustees',
  'supervisory-organisations',
  'types-of-authorisation',
])

export function normalizePublicFirmSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

function readOverridesFile(fileName: string): Record<string, Partial<PublicFirmRecord>> {
  try {
    const filePath = path.join(process.cwd(), 'data', fileName)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as Record<string, Partial<PublicFirmRecord>>

    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([key]) => !key.startsWith('_'))
        .map(([key, value]) => [key.toLowerCase(), value])
    )
  } catch {
    return {}
  }
}

function loadOverrides(): Record<string, Partial<PublicFirmRecord>> {
  return {
    ...readOverridesFile('firm-overrides.auto.json'),
    ...readOverridesFile('firm-overrides.json'),
  }
}

function isPlaceholderFirm(record: PublicFirmRecord): boolean {
  const name = String(record.name || '')
  const firmId = String(record.firm_id || '')
  return /^placeholder_/i.test(name) || /^placeholder_/i.test(firmId)
}

function isTestFirm(record: PublicFirmRecord): boolean {
  const name = String(record.name || '')
  const firmId = String(record.firm_id || '')
  return /(test|qa|manual|dummy|sample|sandbox|mock|temp)/i.test(name)
    || /(test|qa|manual|dummy|sample|sandbox|mock|temp)/i.test(firmId)
}

function isIndexExcluded(record: PublicFirmRecord): boolean {
  const status = String(record.status || '').toLowerCase().trim()
  return INDEX_EXCLUDED_STATUSES.has(status)
}

function isNonFirmId(record: PublicFirmRecord): boolean {
  const firmId = String(record.firm_id || '').toLowerCase().trim()
  return NON_FIRM_IDS.has(firmId)
}

function normalizeFirmRecord(raw: SnapshotRecord): PublicFirmRecord {
  const websiteRoot = String(raw.website_root || raw.website || '').trim() || undefined
  const inferredJurisdiction = inferJurisdictionFromUrl(websiteRoot)
  const rawJurisdiction = typeof raw.jurisdiction === 'string' ? raw.jurisdiction.trim() : ''
  const resolvedJurisdiction =
    (rawJurisdiction && rawJurisdiction.length <= 40 ? rawJurisdiction : undefined) ||
    inferredJurisdiction ||
    (typeof websiteRoot === 'string' && /\.(com|net|org|co)(\/|$)/i.test(websiteRoot) ? 'Global' : undefined)

  return {
    firm_id: String(raw.firm_id || raw.id || '').trim() || undefined,
    name: String(raw.firm_name || raw.name || raw.brand_name || '').trim() || undefined,
    website_root: websiteRoot,
    jurisdiction: resolvedJurisdiction,
    jurisdiction_tier: typeof raw.jurisdiction_tier === 'string' ? raw.jurisdiction_tier : undefined,
    score_0_100: normalizeScore(raw.score_0_100 ?? raw.score ?? raw.integrity_score) ?? 0,
    payout_reliability: parseNumber(raw.payout_reliability) ?? 0,
    risk_model_integrity: parseNumber(raw.risk_model_integrity) ?? 0,
    operational_stability: parseNumber(raw.operational_stability) ?? 0,
    historical_consistency: parseNumber(raw.historical_consistency) ?? 0,
    payout_frequency: typeof raw.payout_frequency === 'string' ? raw.payout_frequency : undefined,
    account_size_usd: parseNumber(raw.account_size_usd ?? raw.max_account_size_usd ?? raw.account_size) ?? undefined,
    founded_year: parseNumber(raw.founded_year) ?? undefined,
    status: typeof raw.status === 'string' ? raw.status : undefined,
    rule_changes_frequency: typeof raw.rule_changes_frequency === 'string' ? raw.rule_changes_frequency : undefined,
  }
}

export async function loadPublicFirmUniverse(): Promise<{ firms: PublicFirmRecord[]; snapshotInfo: LatestPointer }> {
  const pointerUrls = [LATEST_POINTER_URL, ...FALLBACK_POINTER_URLS]
  const { data: latest } = await fetchJsonWithFallback<LatestPointer>(pointerUrls, { cache: 'no-store' })

  const snapshotRoots = [MINIO_PUBLIC_ROOT, ...FALLBACK_MINIO_ROOTS]
  const snapshotUrlCandidates = snapshotRoots.map((root) => `${root}${latest.object}`)
  const { data: snapshot } = await fetchJsonWithFallback<SnapshotPayload>(snapshotUrlCandidates, { cache: 'no-store' })

  const overrides = loadOverrides()
  const firms = (snapshot.records || [])
    .map((raw) => normalizeFirmRecord(raw))
    .filter((record) => Boolean(record.firm_id))
    .filter((record) => !isNonFirmId(record) && !isPlaceholderFirm(record) && !isTestFirm(record) && !isIndexExcluded(record))
    .map((record) => {
      const override = record.firm_id ? overrides[String(record.firm_id).toLowerCase()] : undefined
      return override ? { ...record, ...override } : record
    })

  return { firms, snapshotInfo: latest }
}