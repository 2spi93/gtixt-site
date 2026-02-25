// Unified MinIO configuration - allow relative base on client, normalize on server
const RAW_MINIO_BASE_URL = process.env.NEXT_PUBLIC_MINIO_BASE;
const MINIO_INTERNAL_ROOT = process.env.MINIO_INTERNAL_ROOT || 'http://localhost:9002/gpti-snapshots';
const isServer = typeof window === 'undefined';

const normalizeBaseUrl = (baseUrl?: string): string => {
  if (!baseUrl) {
    if (isServer) return MINIO_INTERNAL_ROOT;
    throw new Error(
      'Missing NEXT_PUBLIC_MINIO_BASE. Set in .env.production for production or .env.development for local'
    );
  }
  if (!isServer) return baseUrl;
  if (/^https?:\/\//i.test(baseUrl)) return baseUrl;
  const root = MINIO_INTERNAL_ROOT.replace(/\/+$/, '');
  if (baseUrl === '/snapshots' || baseUrl === '/snapshots/') return root;
  const path = baseUrl.startsWith('/snapshots/')
    ? baseUrl.replace(/^\/snapshots\//, '')
    : baseUrl.replace(/^\/+/, '');
  return `${root}/${path}`;
};

const MINIO_BASE_URL = normalizeBaseUrl(RAW_MINIO_BASE_URL).replace(/\/+$/, '');
const POINTER_URL = `${MINIO_BASE_URL}/${process.env.NEXT_PUBLIC_LATEST_POINTER || 'latest.json'}`;
const MINIO_BASE = `${MINIO_BASE_URL}/${process.env.NEXT_PUBLIC_BUCKET || 'universe_v0.1_public'}`;

export async function fetchLatestPointer(): Promise<any> {
  const res = await fetch(POINTER_URL);
  if (!res.ok) throw new Error(`Failed to fetch pointer: ${res.status}`);
  return await res.json();
}

export async function fetchSnapshotJson(object: string): Promise<any> {
  const url = snapshotUrlFromObject(object);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch snapshot: ${res.status}`);
  return await res.json();
}

export function snapshotUrlFromObject(object: string): string {
  return `${MINIO_BASE}/${object}`;
}