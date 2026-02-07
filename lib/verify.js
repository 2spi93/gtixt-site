function bufToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256HexFromText(text) {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufToHex(digest);
}

export async function verifySha256OfJsonUrl(url, expectedHex) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`download failed: ${r.status}`);
  const text = await r.text(); // IMPORTANT: hash sur le JSON brut
  const hex = await sha256HexFromText(text);
  return { ok: hex === expectedHex, computed: hex, expected: expectedHex, bytes: text.length };
}