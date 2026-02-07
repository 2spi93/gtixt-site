export async function fetchJson(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { ...(opts.headers || {}) } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.json();
}