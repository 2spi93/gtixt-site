export async function sha256Hex(bytes: BufferSource): Promise<string> {
  // SubtleCrypto.digest requires secure context (HTTPS).
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const arr = Array.from(new Uint8Array(hash));
  return arr.map(b => b.toString(16).padStart(2, "0")).join("");
}