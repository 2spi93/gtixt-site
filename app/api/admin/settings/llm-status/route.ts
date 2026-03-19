/**
 * LLM Provider Status Check
 * Tests connectivity and key presence for OpenAI plus open-source models
 * Uses in-memory cache from lib/llm-health.ts to avoid probing on every request.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-api-auth'
import { getPipelineModelAssignments } from '@/lib/jobExecutor'
import { getLlmHealth, getLlmHealthCached, warmupFastModels } from '@/lib/llm-health'
import { getSecretEnv } from '@/lib/secret-env'

export const dynamic = 'force-dynamic'

type ProviderStatus = {
  configured: boolean
  model: string
  reachable: boolean | null
  error?: string
  masked_key?: string
}

async function probeOpenAI(apiKey: string, model: string): Promise<{ reachable: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
        max_tokens: 5,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      const body = await res.text()
      return { reachable: false, error: `HTTP ${res.status}: ${body.slice(0, 120)}` }
    }
    return { reachable: true }
  } catch (err) {
    return { reachable: false, error: err instanceof Error ? err.message : 'Connection failed' }
  }
}

function buildOpenAICompatibleUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '')
  if (trimmed.endsWith('/chat/completions')) return trimmed
  if (trimmed.endsWith('/v1')) return `${trimmed}/chat/completions`
  return `${trimmed}/v1/chat/completions`
}

async function probeOpenSource(
  baseUrl: string,
  apiKey: string,
  model: string
): Promise<{ reachable: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`
    }
    const res = await fetch(buildOpenAICompatibleUrl(baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
        max_tokens: 5,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      const body = await res.text()
      return { reachable: false, error: `HTTP ${res.status}: ${body.slice(0, 120)}` }
    }
    return { reachable: true }
  } catch (err) {
    return { reachable: false, error: err instanceof Error ? err.message : 'Connection failed' }
  }
}

function maskKey(key: string): string {
  if (key.length < 12) return '***'
  return `${key.slice(0, 8)}...${key.slice(-4)}`
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminUser(req, ['admin'])
  if (auth instanceof NextResponse) return auth

  const probe = req.nextUrl.searchParams.get('probe') === '1'
  const warmup = req.nextUrl.searchParams.get('warmup') === '1'

  // Trigger fire-and-forget warmup if requested
  if (warmup) warmupFastModels()

  const openaiKey = getSecretEnv('OPENAI_API_KEY')
  const ossApiKey = getSecretEnv('OSS_LLM_API_KEY')
  const ossBaseUrl = process.env.OSS_LLM_API_BASE_URL || process.env.OLLAMA_API_URL || ''

  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o'
  const llamaModel = process.env.LLAMA_MODEL || 'llama-4-maverick'
  const deepseekModel = process.env.DEEPSEEK_MODEL || 'deepseek-v3'
  const glmModel = process.env.GLM_MODEL || 'glm-5'

  const openaiStatus: ProviderStatus = {
    configured: openaiKey.length > 0,
    model: openaiModel,
    reachable: null,
    ...(openaiKey ? { masked_key: maskKey(openaiKey) } : {}),
  }
  const llamaStatus: ProviderStatus = {
    configured: ossBaseUrl.length > 0,
    model: llamaModel,
    reachable: null,
    ...(ossApiKey ? { masked_key: maskKey(ossApiKey) } : {}),
  }
  const deepseekStatus: ProviderStatus = {
    configured: ossBaseUrl.length > 0,
    model: deepseekModel,
    reachable: null,
    ...(ossApiKey ? { masked_key: maskKey(ossApiKey) } : {}),
  }
  const glmStatus: ProviderStatus = {
    configured: ossBaseUrl.length > 0,
    model: glmModel,
    reachable: null,
    ...(ossApiKey ? { masked_key: maskKey(ossApiKey) } : {}),
  }

  // probe=1 → run live probes and refresh health cache
  // (no probe) → return cached snapshot if available to avoid latency
  if (probe) {
    // Use the cached health lib for fast models; still run OSS-compat probes for deeper status
    const healthSnap = await getLlmHealth(true)
    const glmEntry = healthSnap.models.find((m) => m.model.includes('glm') || m.model === (process.env.OLLAMA_GENERAL_MODEL || 'glm4:9b'))
    const oaiEntry = healthSnap.models.find((m) => m.endpoint === 'openai')

    // backfill light models from cache
    if (glmEntry) {
      glmStatus.reachable = glmEntry.reachable
      if (glmEntry.error) glmStatus.error = glmEntry.error
    }
    if (oaiEntry) {
      openaiStatus.reachable = oaiEntry.reachable
      if (oaiEntry.error) openaiStatus.error = oaiEntry.error
    }

    // for the heavier OSS models keep the existing probe (they go through OpenAI-compat)
    const [llamaResult, deepseekResult] = await Promise.all([
      ossBaseUrl ? probeOpenSource(ossBaseUrl, ossApiKey, llamaModel) : Promise.resolve({ reachable: false, error: 'OSS_LLM_API_BASE_URL not set' }),
      ossBaseUrl ? probeOpenSource(ossBaseUrl, ossApiKey, deepseekModel) : Promise.resolve({ reachable: false, error: 'OSS_LLM_API_BASE_URL not set' }),
    ])
    llamaStatus.reachable = llamaResult.reachable
    if (llamaResult.error) llamaStatus.error = llamaResult.error
    deepseekStatus.reachable = deepseekResult.reachable
    if (deepseekResult.error) deepseekStatus.error = deepseekResult.error
  } else {
    // Return cached fast-model status without blocking
    const snap = getLlmHealthCached()
    if (snap) {
      const glmEntry = snap.models.find((m) => m.endpoint === 'ollama')
      const oaiEntry = snap.models.find((m) => m.endpoint === 'openai')
      if (glmEntry) { glmStatus.reachable = glmEntry.reachable; glmStatus.model = glmEntry.model }
      if (oaiEntry) { openaiStatus.reachable = oaiEntry.reachable }
    }
  }

  const pipelineAssignments = getPipelineModelAssignments()

  return NextResponse.json({
    providers: {
      openai: openaiStatus,
      llama: llamaStatus,
      deepseek: deepseekStatus,
      glm: glmStatus,
    },
    summary: {
      total: 4,
      configured: [openaiKey, ossBaseUrl, ossBaseUrl, ossBaseUrl].filter(Boolean).length,
      ...(probe
        ? {
            reachable: [openaiStatus.reachable, llamaStatus.reachable, deepseekStatus.reachable, glmStatus.reachable].filter(
              Boolean
            ).length,
          }
        : {}),
    },
    pipeline: {
      crawl: {
        model: pipelineAssignments.crawl,
        purpose: 'Discovery crawl, extraction, HTML and structured normalization',
      },
      enrichment: {
        model: pipelineAssignments.enrichment,
        purpose: 'Entity resolution, consolidation, evidence reasoning',
      },
      rescoring: {
        model: pipelineAssignments.rescoring,
        purpose: 'Score review, anomaly detection, validation reasoning',
      },
      snapshot: {
        model: pipelineAssignments.snapshot,
        purpose: 'Snapshot packaging, metadata and publication support',
      },
      pageDisplay: {
        model: pipelineAssignments.pageDisplay,
        purpose: 'Fast page summaries and public-facing response formatting',
      },
      fullPipeline: {
        model: pipelineAssignments.fullPipeline,
        purpose: 'Orchestration across crawl, enrichment, scoring and snapshot',
      },
    },
  })
}
