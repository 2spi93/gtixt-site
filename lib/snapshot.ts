const POINTER_URL = process.env.NEXT_PUBLIC_MINIO_BASE
  ? `${process.env.NEXT_PUBLIC_MINIO_BASE}/${process.env.NEXT_PUBLIC_LATEST_POINTER}`
  : "https://pointer.gtix.org/latest.json";
const MINIO_BASE = process.env.NEXT_PUBLIC_MINIO_BASE
  ? `${process.env.NEXT_PUBLIC_MINIO_BASE}/${process.env.NEXT_PUBLIC_BUCKET}`
  : "http://minio.gtix.org:9000/gtix";

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