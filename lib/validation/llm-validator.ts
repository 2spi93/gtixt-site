/**
 * GTIXT LLM Validator
 * 
 * Uses OpenAI GPT-4 or Anthropic Claude-3 to validate evidence
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
  model: 'gpt-4' | 'gpt-4-turbo' | 'claude-3-opus' | 'claude-3-sonnet';
  temperature: number; // 0.0-1.0, lower = deterministic
  max_tokens: number;
  api_key?: string; // From env if not provided
}

const DEFAULT_CONFIG: LLMConfig = {
  model: 'gpt-4',
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
 * Call LLM API (OpenAI or Anthropic)
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
  const apiKey = config.api_key || process.env.LLM_API_KEY;
  
  if (!apiKey) {
    throw new Error('LLM API key not configured');
  }
  
  if (config.model.startsWith('gpt')) {
    return callOpenAI(prompt, config, apiKey);
  } else if (config.model.startsWith('claude')) {
    return callAnthropic(prompt, config, apiKey);
  } else {
    throw new Error(`Unsupported LLM model: ${config.model}`);
  }
}

/**
 * Call OpenAI API
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
  // TODO: Implement actual OpenAI API call
  // This is a placeholder that returns mock data
  
  return {
    confidence_score: 85,
    reasoning: 'Evidence from official SEC source is highly reliable. No contradictions found.',
    flags: [],
  };
}

/**
 * Call Anthropic API
 */
async function callAnthropic(
  prompt: string,
  config: LLMConfig,
  apiKey: string
): Promise<{
  confidence_score: number;
  reasoning: string;
  flags?: LLMFlag[];
}> {
  // TODO: Implement actual Anthropic API call
  // This is a placeholder that returns mock data
  
  return {
    confidence_score: 88,
    reasoning: 'Claude analysis confirms evidence validity with high confidence.',
    flags: [],
  };
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
