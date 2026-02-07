import { CONFIG } from "./config";
import { fetchJson } from "./fetchJson";

export async function getLatestPointer() {
  // { object, sha256, created_at, count }
  return await fetchJson(CONFIG.LATEST_URL);
}

export function makeSnapshotUrl(objectPath) {
  // objectPath ex: universe_v0.1_public/_public/....json
  return `${CONFIG.MINIO_BASE}/${objectPath}`;
}

export async function getLatestSnapshot() {
  const pointer = await getLatestPointer();
  const url = makeSnapshotUrl(pointer.object);
  const payload = await fetchJson(url);
  return { pointer, url, payload };
}