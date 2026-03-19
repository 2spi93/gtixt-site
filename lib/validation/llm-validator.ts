/**
 * GTIXT LLM Validator
 * 
 * Uses OpenAI or OpenAI-compatible open-source models to validate evidence
 * through analytical reasoning and fact-checking
 * 
 * @module lib/validation/llm-validator
 * @version 1.0.0
 */

import type { InstitutionalEvidenceItem, LLMValidation } from '../institutional-data-models';

// =====================================================
// CONFIGURATION
// =====================================================

interface LLMConfig {
  model: string; // e.g. 'gpt-4o', 'llama-4-maverick', 'deepseek-v3', 'glm-5'
  temperature: number; // 0.0-1.0, lower = deterministic
  max_tokens: number;
  api_key?: string; // From env if not provided
}

const DEFAULT_CONFIG: LLMConfig = {
  model: process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'deepseek-v3',
  temperature: 0.3, // Low for consistency
  max_tokens: 500,
};

interface LLMFlag {
  type: 'warning' | 'inconsistency' | 'unverifiable' | 'contradiction';
  severity: 'warning' | 'error';
  description: string;
}

// =====================================================
// PROMPT TEMPLATES
// =====================================================

function buildValidationPrompt(evidence: InstitutionalEvidenceItem): string {
  return `You are an expert financial analyst validating evidence about proprietary trading firms.

Analyze the following evidence item and provide:
1. Confidence score (0-100) on whether this information is accurate and relevant
2. Any inconsistencies, red flags, or concerns
3. Assessment of source reliability
4. Specific reasoning for your confidence score

Evidence Details:
- Type: ${evidence.type}
- Description: ${evidence.description}
- Source: ${evidence.source}
- Extraction Date: ${evidence.provenance.extraction_timestamp}
- Claimed Impact on Score: ${evidence.value ?? 0} points
- Source System: ${evidence.provenance.source_system}
- Extraction Method: ${evidence.provenance.extraction_method}

Provide your analysis in JSON format:
{
  \"confidence_score\": <0-100>,
  \"reasoning\": \"<detailed reasoning>\",
  \"flags\": [
    {
      \"type\": \"warning|inconsistency|unverifiable|contradiction\",
      \"severity\": \"warning|error\",
      \"description\": \"<description>\"
    }
  ],
  \"recommendations\": \"<any corrections or clarifications needed>\"
}`;
}

// =====================================================
// LLM VALIDATION
// =====================================================

/**
 * Validate evidence using LLM-based reasoning
 * 
 * @param evidence - Evidence item to validate
 * @param config - LLM configuration
 * @returns LLM validation result
 */
export async function validateWithLLM(
  evidence: InstitutionalEvidenceItem,
  config: LLMConfig = DEFAULT_CONFIG
): Promise<LLMValidation> {
  const startTime = Date.now();
  const promptVersion = '1.0';
  
  try {
    // Call LLM API
    const result = await callLLMAPI(evidence, config);
    
    const endTime = Date.now();
    const promptTokens = estimateTokens(buildValidationPrompt(evidence));
    const completionTokens = estimateTokens(result.reasoning);
    
    return {
      model: config.model,
      prompt_version: promptVersion,
      confidence_score: result.confidence_score,
      reasoning: result.reasoning,
      timestamp: new Date().toISOString(),
      flags: result.flags || [],
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
      },
    };
  } catch (error: any) {
    console.error('LLM validation error:', error);
    
    // Return degraded response on error
    return {
      model: config.model,
      prompt_version: promptVersion,
      confidence_score: 50, // Neutral score if error
      reasoning: `LLM validation failed: ${error.message}. Proceeding with other validation methods.`,
      timestamp: new Date().toISOString(),
      flags: [
        {
          type: 'warning',
          severity: 'warning',
          description: 'LLM validation unavailable',
        },
      ],
      tokens: {
        prompt: 0,
        completion: 0,
        total: 0,
      },
    };
  }
}

// =====================================================
// LLM API CALLS
// =====================================================

/**
 * Call LLM API (OpenAI or OpenAI-compatible open-source provider)
 */
async function callLLMAPI(
  evidence: InstitutionalEvidenceItem,
  config: LLMConfig
): Promise<{
  confidence_score: number;
  reasoning: string;
  flags?: LLMFlag[];
}> {
  const prompt = buildValidationPrompt(evidence);
  const model = (config.model || '').toLowerCase();

  if (model.startsWith('gpt') || model.startsWith('o')) {
    const apiKey = config.api_key || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');
    return callOpenAI(prompt, config, apiKey);
  }

  if (model.includes('llama') || model.includes('deepseek') || model.includes('glm')) {
    const baseUrl = process.env.OSS_LLM_API_BASE_URL || process.env.OLLAMA_API_URL || '';
    const apiKey = config.api_key || process.env.OSS_LLM_API_KEY || '';
    if (!baseUrl) {
      throw new Error('OSS_LLM_API_BASE_URL not configured');
    }
    return callOpenAICompatible(prompt, config, baseUrl, apiKey || undefined);
  } else {
    throw new Error(`Unsupported LLM model: ${config.model}`);
  }
}

/**
 * Call OpenAI API (GPT-5, GPT-4o, etc.)
 */
async function callOpenAI(
  prompt: string,
  config: LLMConfig,
  apiKey: string
): Promise<{
  confidence_score: number;
  reasoning: string;
  flags?: LLMFlag[];
}> {
  const model = process.env.OPENAI_MODEL || config.model;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are an expert financial analyst. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const content: string = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty response');
  return parseLLMResponse(content);
}

/**
 * Build OpenAI-compatible completion URL from a base URL
 */
function buildOpenAICompatibleUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/chat/completions')) return trimmed;
  if (trimmed.endsWith('/v1')) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
}

/**
 * Call OpenAI-compatible API (Llama, DeepSeek, GLM)
 */
async function callOpenAICompatible(
  prompt: string,
  config: LLMConfig,
  baseUrl: string,
  apiKey?: string
): Promise<{
  confidence_score: number;
  reasoning: string;
  flags?: LLMFlag[];
}> {
  const model = config.model;
  const endpoint = buildOpenAICompatibleUrl(baseUrl);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are an expert financial analyst. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI-compatible API error ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const content: string = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI-compatible provider returned empty response');
  return parseLLMResponse(content);
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Estimate token count for text
 * Rough estimate: 1 token ≈ 4 characters
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Parse LLM response
 */
function parseLLMResponse(response: string): {
  confidence_score: number;
  reasoning: string;
  flags?: LLMFlag[];
} {
  try {
    return JSON.parse(response);
  } catch (error) {
    // If JSON parsing fails, extract values from text
    const scoreMatch = response.match(/confidence[\\s:]*([0-9]+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    
    return {
      confidence_score: Math.min(100, Math.max(0, score)),
      reasoning: response,
    };
  }
}

/**
 * Validate LLM response
 */
function validateLLMResponse(response: any): response is {
  confidence_score: number;
  reasoning: string;
  flags?: LLMFlag[];
} {
  return (
    typeof response.confidence_score === 'number' &&
    response.confidence_score >= 0 &&
    response.confidence_score <= 100 &&
    typeof response.reasoning === 'string'
  );
}

/**
 * Cache LLM results to reduce API calls
 * Key: hash(evidence + prompt version)
 */
const validationCache = new Map<string, LLMValidation>();

export function clearLLMCache(): void {
  validationCache.clear();
}

export function getLLMCacheStats(): { size: number; maxSize: number } {
  return {
    size: validationCache.size,
    maxSize: 1000, // Limit cache to 1000 entries
  };
}
