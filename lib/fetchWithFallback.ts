export async function fetchJsonWithFallback<T>(
  urls: string[],
  init?: RequestInit
): Promise<{ data: T; url: string }> {
  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
      const data = (await res.json()) as T;
      return { data, url };
    } catch (err) {
      lastError = err as Error;
    }
  }
  throw lastError || new Error("All fallback URLs failed");
}

export function parseFallbackRoots(envValue?: string): string[] {
  if (!envValue) return [];
  return envValue
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
