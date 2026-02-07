export function getMinioUrls() {
  const base = process.env.NEXT_PUBLIC_MINIO_BASE;
  const bucket = process.env.NEXT_PUBLIC_BUCKET;
  const pointer = process.env.NEXT_PUBLIC_LATEST_POINTER;
  if (!base || !bucket || !pointer) {
    throw new Error("Missing NEXT_PUBLIC_MINIO_* env vars");
  }
  const pointerUrl = `${base}/${bucket}/${pointer}`;
  return { base, bucket, pointer, pointerUrl };
}

export async function fetchLatestPointer() {
  const { pointerUrl } = getMinioUrls();
  const r = await fetch(pointerUrl, { cache: "no-store" });
  if (!r.ok) throw new Error(`latest.json fetch failed: ${r.status}`);
  return await r.json(); // { object, sha256, created_at, count }
}

export async function fetchSnapshotObject(objectPath) {
  const { base, bucket } = getMinioUrls();
  const url = `${base}/${bucket}/${objectPath}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`snapshot fetch failed: ${r.status}`);
  return { url, json: await r.json() }; // { meta, records }
}