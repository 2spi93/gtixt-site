// lib/integrity.js
export function shortHash(hex, n = 6) {
  if (!hex) return "—";
  return `${hex.slice(0, n)}…${hex.slice(-n)}`;
}

export async function fetchLatestPointer(latestUrl) {
  const r = await fetch(latestUrl, { cache: "no-store" });
  if (!r.ok) throw new Error(`latest.json fetch failed: ${r.status}`);
  return await r.json(); // { object, sha256, created_at, count }
}

export function joinObjectUrl(baseBucketUrl, objectPath) {
  const base = baseBucketUrl.replace(/\/$/, "");
  const obj = objectPath.replace(/^\//, "");
  return `${base}/${obj}`;
}

export async function sha256HexFromArrayBuffer(buf) {
  // WebCrypto secure context note (HTTPS required in some browsers)
  if (!globalThis.crypto?.subtle?.digest) {
    throw new Error("WebCrypto not available (need HTTPS / secure context).");
  }
  const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function verifySnapshotIntegrity({ latestUrl, baseBucketUrl }) {
  const latest = await fetchLatestPointer(latestUrl);
  const objectUrl = joinObjectUrl(baseBucketUrl, latest.object);

  const r = await fetch(objectUrl, { cache: "no-store" });
  if (!r.ok) throw new Error(`snapshot fetch failed: ${r.status}`);

  const buf = await r.arrayBuffer();
  const computed = await sha256HexFromArrayBuffer(buf);

  const expected = String(latest.sha256 || "").toLowerCase();
  const ok = computed.toLowerCase() === expected;

  return {
    ok,
    expected,
    computed,
    objectUrl,
    latest,
    bytes: buf.byteLength,
  };
}