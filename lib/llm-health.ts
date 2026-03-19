/**
 * LLM Health Cache
 * Probes fast Ollama models + OpenAI and caches the result.
 * The cache is refreshed lazily when stale (TTL = 5 min).
 * Admin UI polls /api/admin/settings/llm-status every 60s to keep it fresh.
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FAST_PROBE_TIMEOUT_MS = 10_000; // 10s – only fast models for routine health

export type LlmModelStatus = {
  model: string;
  endpoint: 'ollama' | 'openai';
  reachable: boolean;
  latencyMs?: number;
  error?: string;
  checkedAt: string;
};

export type LlmHealthSnapshot = {
  models: LlmModelStatus[];
  updatedAt: string;
  expiresAt: number;
};

// Module-level cache – lives in Node.js process memory (single-process Next.js server)
let _cache: LlmHealthSnapshot | null = null;

// ────────────────────────────────────────────────────────────
// Internal probes
// ────────────────────────────────────────────────────────────

async function probeOllama(model: string, baseUrl: string, timeoutMs = FAST_PROBE_TIMEOUT_MS): Promise<LlmModelStatus> {
  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // num_predict: 1 makes the call as lightweight as possible (forces model load)
      body: JSON.stringify({ model, prompt: 'ok', stream: false, options: { num_predict: 1 } }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      return { model, endpoint: 'ollama', reachable: false, latencyMs, error: `HTTP ${res.status}`, checkedAt: new Date().toISOString() };
    }
    return { model, endpoint: 'ollama', reachable: true, latencyMs, checkedAt: new Date().toISOString() };
  } catch (err) {
    return { model, endpoint: 'ollama', reachable: false, latencyMs: Date.now() - start, error: String(err), checkedAt: new Date().toISOString() };
  }
}

async function probeOpenAI(model: string, apiKey: string, timeoutMs = FAST_PROBE_TIMEOUT_MS): Promise<LlmModelStatus> {
  const start = Date.now();
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: 'ok' }], max_tokens: 3 }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      return { model, endpoint: 'openai', reachable: false, latencyMs, error: `HTTP ${res.status}`, checkedAt: new Date().toISOString() };
    }
    return { model, endpoint: 'openai', reachable: true, latencyMs, checkedAt: new Date().toISOString() };
  } catch (err) {
    return { model, endpoint: 'openai', reachable: false, latencyMs: Date.now() - start, error: String(err), checkedAt: new Date().toISOString() };
  }
}

// ────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────

/**
 * Refresh the health cache by probing fast models.
 * We only probe the two quick Ollama models (glm4:9b, vision) + OpenAI.
 * The 32B models are NOT pinged here – they're too slow for routine health-check.
 */
export async function refreshLlmHealth(): Promise<LlmHealthSnapshot> {
  const ollamaBase = process.env.OLLAMA_API_URL || 'http://localhost:11434';
  const openaiKey = process.env.OPENAI_API_KEY || '';
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o';

  const checks: Promise<LlmModelStatus>[] = [
    probeOllama(process.env.OLLAMA_GENERAL_MODEL || 'glm4:9b', ollamaBase),
    probeOllama(process.env.OLLAMA_VISION_MODEL || 'llama3.2-vision:11b', ollamaBase),
  ];

  if (openaiKey) {
    checks.push(probeOpenAI(openaiModel, openaiKey));
  }

  const models = await Promise.all(checks);
  _cache = {
    models,
    updatedAt: new Date().toISOString(),
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
  return _cache;
}

/**
 * Get cached health (refresh if stale or force-refresh requested).
 */
export async function getLlmHealth(forceRefresh = false): Promise<LlmHealthSnapshot> {
  if (!forceRefresh && _cache && Date.now() < _cache.expiresAt) {
    return _cache;
  }
  return refreshLlmHealth();
}

/**
 * Synchronous read of the in-memory cache (may be null if never populated).
 */
export function getLlmHealthCached(): LlmHealthSnapshot | null {
  return _cache;
}

/**
 * Fire-and-forget warmup of fast Ollama models.
 * Calling this primes the models into Ollama's VRAM so the first real
 * user request doesn't hit a cold-start.
 */
export function warmupFastModels(): void {
  const ollamaBase = process.env.OLLAMA_API_URL || 'http://localhost:11434';
  const fastModels = [
    process.env.OLLAMA_GENERAL_MODEL || 'glm4:9b',
    process.env.OLLAMA_VISION_MODEL || 'llama3.2-vision:11b',
  ];
  for (const model of fastModels) {
    probeOllama(model, ollamaBase, 30_000).catch(() => {});
  }
}
