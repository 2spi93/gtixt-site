import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { auditLogger } from '@/lib/audit-logger';
import { sandboxManager } from '@/lib/sandbox-manager';
import { checkRateLimit, getTokenUsage, trackTokenUsage } from '@/lib/rate-limit';
import { copilotRequestsTotal, copilotRequestDuration, copilotTokensUsed } from '@/lib/metrics';
import { isPathAllowed } from '@/lib/path-guard';
import { buildCopilotContext, formatContextForPrompt, type SystemState } from '@/lib/copilot-context';
import { generateSystemPrompt, CopilotTools, memoryManager } from '@/lib/copilot-engine';

const execFileAsync = promisify(execFile);

// Enhanced actions with more capabilities
const buildActions = (message: string) => {
  const actions = [] as Array<{ type: string; label: string; description: string }>;
  const text = message.toLowerCase();

  if (text.includes('crawl')) {
    actions.push({
      type: 'launch_crawl',
      label: 'Launch Crawl',
      description: 'Start a priority crawl run',
    });
  }

  if (text.includes('score') || text.includes('rescore')) {
    actions.push({
      type: 'run_job',
      label: 'Run Scoring Update',
      description: 'Execute the scoring update job',
    });
  }

  if (text.includes('health') || text.includes('status')) {
    actions.push({
      type: 'system_health',
      label: 'System Health Check',
      description: 'Fetch current system health metrics',
    });
  }

  if (text.includes('read') || text.includes('file') || text.includes('code')) {
    actions.push({
      type: 'read_file',
      label: 'Read File',
      description: 'Read a file from the workspace',
    });
  }

  if (text.includes('patch') || text.includes('fix') || text.includes('change')) {
    actions.push({
      type: 'generate_patch',
      label: 'Generate Patch',
      description: 'Create a code patch or fix',
    });
  }

  if (text.includes('diff') || text.includes('compare')) {
    actions.push({
      type: 'show_diff',
      label: 'Show Diff',
      description: 'Generate a diff comparison',
    });
  }

  if (text.includes('impact') || text.includes('analyze')) {
    actions.push({
      type: 'analyze_impact',
      label: 'Analyze Impact',
      description: 'Analyze changes and their impacts',
    });
  }

  if (text.includes('plan') || text.includes('action')) {
    actions.push({
      type: 'action_plan',
      label: 'Create Action Plan',
      description: 'Generate a detailed action plan',
    });
  }

  // NEW INTELLIGENT TOOL DETECTION
  if (text.includes('domain') || text.includes('verify') || text.includes('abn') || 
      text.includes('asic') || text.includes('company')) {
    actions.push({
      type: 'domain_verify',
      label: 'Verify Domain',
      description: 'Check domain registration, ASIC status, company details',
    });
  }

  if (text.includes('page') || text.includes('analyze') || text.includes('website') ||
      text.includes('extract') || text.includes('metadata')) {
    actions.push({
      type: 'page_analyze',
      label: 'Analyze Page',
      description: 'Extract content, metadata, and structure from website',
    });
  }

  if (text.includes('data quality') || text.includes('evidence')) {
    actions.push({
      type: 'data_quality',
      label: 'Data Quality Assessment',
      description: 'Assess data verification, staleness, and quality metrics',
    });
  }

  if (
    text.includes('workspace') ||
    text.includes('temps réel') ||
    text.includes('temps reel') ||
    text.includes('realtime') ||
    text.includes('real-time') ||
    text.includes('enrichissement') ||
    text.includes('enrichment') ||
    text.includes('snapshot') ||
    text.includes('snap') ||
    text.includes('donnée manquante') ||
    text.includes('donnee manquante') ||
    text.includes('missing data') ||
    text.includes('plan d\'action') ||
    text.includes('action plan') ||
    text.includes('programmation manquante')
  ) {
    actions.push({
      type: 'workspace_audit',
      label: 'Workspace Operational Audit',
      description: 'Real-time audit of crawls, enrichment, snapshots, missing data, and plans',
    });
  }

  return actions;
};

// Enhanced tool for reading files
const readWorkspaceFile = async (filePath: string, userId?: string, ipAddress?: string): Promise<string> => {
  try {
    const content = await sandboxManager.readFile(filePath, userId, ipAddress);
    return content;
  } catch (error) {
    return `Error reading file: ${error}`;
  }
};

// Enhanced tool for generating diffs
const generateDiff = async (file1: string, file2: string): Promise<string> => {
  const file1Check = isPathAllowed(file1);
  const file2Check = isPathAllowed(file2);

  if (!file1Check.allowed || !file2Check.allowed) {
    return `Access denied - invalid path`;
  }

  try {
    const { stdout } = await execFileAsync('diff', ['-u', file1, file2]);
    return stdout;
  } catch (error: any) {
    // diff returns exit code 1 when files differ, which is expected
    return error.stdout || `Error: ${error}`;
  }
};

// Enhanced tool for listing workspace files
const listWorkspaceFiles = async (directory: string = ''): Promise<string[]> => {
  try {
    const fullPath = path.isAbsolute(directory)
      ? directory
      : path.join('/opt/gpti/gpti-site', directory);

    const pathCheck = isPathAllowed(fullPath);
    if (!pathCheck.allowed) {
      return [`Access denied - ${pathCheck.reason || 'invalid path'}`];
    }

    const files = await fs.readdir(fullPath);
    return files;
  } catch (error) {
    return [`Error listing files: ${error}`];
  }
};

const buildFallbackResponse = (message: string, context?: Record<string, unknown>) => {
  // Simple natural fallback without headers or verbose lists
  const greeting = message.toLowerCase().includes('bonjour') || message.toLowerCase().includes('salut');
  
  if (greeting) {
    return "Salut ! Je suis là pour t'aider avec l'infrastructure GTIXT. Que veux-tu faire ?";
  }
  
  return "Je suis prêt à t'aider. Pose-moi une question ou demande-moi d'effectuer une action.";
};

// Ollama API client
const callOllamaAPI = async (
  messages: Array<{ role: string; content: string }>,
  model: string = 'llama3.2:1b'
): Promise<string> => {
  const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
  
  try {
    // Convert messages to Ollama format (simple prompt concatenation)
    const prompt = messages
      .map((msg) => {
        if (msg.role === 'system') return `SYSTEM: ${msg.content}\n\n`;
        if (msg.role === 'user') return `USER: ${msg.content}\n\n`;
        if (msg.role === 'assistant') return `ASSISTANT: ${msg.content}\n\n`;
        return '';
      })
      .join('');

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: prompt + 'ASSISTANT: ',
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 1000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || "Je n'ai pas pu générer de réponse.";
  } catch (error) {
    console.error('Ollama API error:', error);
    throw new Error(`Ollama unavailable: ${error}`);
  }
};

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userId = request.headers.get('x-user-id') || 'anonymous';

  let actionName = 'message';
  let stopTimer: (() => void) | null = null;

  try {
    const body = await request.json();
    const { message, context, conversationHistory, agentMode, action, aiModel } = body as {
      message?: string;
      context?: Record<string, unknown>;
      conversationHistory?: Array<{ role: string; content: string }>;
      agentMode?: boolean;
      action?: { type: string; params?: any };
      aiModel?: 'openai' | 'ollama' | 'gpt-5-mini' | 'gpt-5.2-codex';
    };

    if (!message && !action) {
      return NextResponse.json({ error: 'message or action is required' }, { status: 400 });
    }

    const selectedModel = aiModel || 'ollama'; // Default to Ollama (free)
    actionName = action?.type || 'message';

    const rateLimit = await checkRateLimit(`copilot:${ip}`, 50, 3600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetAt: rateLimit.resetAt },
        { status: 429 }
      );
    }

    const maxTokensPerDay = parseInt(process.env.COPILOT_MAX_TOKENS_PER_DAY || '50000', 10);
    if (actionName === 'message') {
      const currentTokens = await getTokenUsage(`copilot:${userId}`);
      if (currentTokens >= maxTokensPerDay) {
        return NextResponse.json(
          { error: 'Token quota exceeded', quotaRemaining: 0 },
          { status: 429 }
        );
      }
    }

    stopTimer = copilotRequestDuration.startTimer({ action: actionName });

    // Handle special actions
    if (action) {
      let actionResult: any = {};

      switch (action.type) {
        case 'read_file':
          if (action.params?.filePath) {
            const content = await readWorkspaceFile(action.params.filePath, userId, ip);
            actionResult = { fileContent: content, filePath: action.params.filePath };
          }
          break;

        case 'list_files':
          const files = await listWorkspaceFiles(action.params?.directory || '');
          actionResult = { files };
          await auditLogger.log({
            action: 'list_files',
            userId,
            ipAddress: ip,
            details: `Listed files in: ${action.params?.directory || 'root'}`,
          });
          break;

        case 'generate_diff':
          if (action.params?.file1 && action.params?.file2) {
            const diff = await generateDiff(action.params.file1, action.params.file2);
            actionResult = { diff };
            await auditLogger.log({
              action: 'generate_diff',
              userId,
              ipAddress: ip,
              details: `Generated diff: ${action.params.file1} vs ${action.params.file2}`,
            });
          }
          break;

        case 'write_file':
          if (action.params?.filePath && action.params?.content) {
            await sandboxManager.writeFile(
              action.params.filePath,
              action.params.content,
              userId,
              ip
            );
            actionResult = {
              success: true,
              filePath: action.params.filePath,
              sandboxMode: sandboxManager.isSandboxEnabled(),
            };
          }
          break;

        // NEW INTERNAL TOOLS
        case 'domain_verify':
          if (action.params?.domain) {
            const verifyResult = await CopilotTools.verifyDomain(
              action.params.domain,
              action.params.abn
            );
            actionResult = verifyResult;
            await auditLogger.log({
              action: 'domain_verify',
              userId,
              ipAddress: ip,
              details: `Domain verification: ${action.params.domain}`,
            });
          }
          break;

        case 'page_analyze':
          if (action.params?.url) {
            const analyzeResult = await CopilotTools.analyzePage(action.params.url);
            actionResult = analyzeResult;
            await auditLogger.log({
              action: 'page_analyze',
              userId,
              ipAddress: ip,
              details: `Page analysis: ${action.params.url}`,
            });
          }
          break;

        case 'system_health':
          const healthResult = await CopilotTools.getSystemHealth();
          actionResult = healthResult;
          await auditLogger.log({
            action: 'system_health',
            userId,
            ipAddress: ip,
            details: 'System health check',
          });
          break;

        case 'data_quality':
          const qualityResult = await CopilotTools.assessDataQuality(action.params?.firmId);
          actionResult = qualityResult;
          await auditLogger.log({
            action: 'data_quality',
            userId,
            ipAddress: ip,
            details: `Data quality assessment: ${action.params?.firmId || 'all'}`,
          });
          break;

        case 'workspace_audit':
          const workspaceAuditResult = await CopilotTools.getWorkspaceOperationalAudit();
          actionResult = workspaceAuditResult;
          await auditLogger.log({
            action: 'workspace_audit',
            userId,
            ipAddress: ip,
            details: 'Real-time workspace operational audit',
          });
          break;

        default:
          actionResult = { status: 'Action not implemented yet' };
      }

      copilotRequestsTotal.inc({ action: actionName, status: 'success' });
      if (stopTimer) stopTimer();

      return NextResponse.json({
        success: true,
        actionResult,
        sandboxMode: sandboxManager.isSandboxEnabled(),
      });
    }

    // Check if OpenAI is requested but not configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (selectedModel !== 'ollama' && !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured. Please use Ollama or configure OPENAI_API_KEY.',
        response: 'OpenAI n\'est pas configuré. Utilise Ollama (gratuit) ou configure OPENAI_API_KEY.',
      }, { status: 400 });
    }

    // Get system metrics for context enrichment
    let systemMetrics: any = {};
    try {
      const health = await CopilotTools.getSystemHealth();
      if (health.success && health.data) {
        systemMetrics = health.data;
      }
    } catch (e) {
      // Silently fail - use empty metrics
    }

    // Generate ULTRA-POWERED system prompt with current context
    const systemPrompt = generateSystemPrompt({
      systemStatus: systemMetrics.health?.ok ? 'System operational' : 
                    systemMetrics.health?.critical ? 'CRITICAL ISSUES' : 'Warnings present',
      activeCrawls: systemMetrics.crawls?.active || 0,
      totalFirms: systemMetrics.firms?.total || 0,
      failedJobs: systemMetrics.jobs?.failed || 0,
      recentErrors: systemMetrics.errors?.map((e: any) => e.operationType) || [],
    });

    // Build conversation history
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // MEMORY MANAGEMENT: Initialize or retrieve session memory
    const sessionId = `${userId}:${Date.now()}`;
    let sessionMemory = memoryManager.getMemory(sessionId);
    if (!sessionMemory) {
      sessionMemory = memoryManager.createSession(sessionId, userId, selectedModel);
    }

    // Add recent context from memory if available
    const recentMemoryContext = memoryManager.getRecentContext(sessionId, 3);
    if (recentMemoryContext) {
      messages.push({
        role: 'system',
        content: `MÉMOIRE DE SESSION (contexte récent):\n${recentMemoryContext}`,
      });
    }

    // Build intelligent context using GTIXT standards and page analysis
    if (context && Object.keys(context).length > 0) {
      const systemState: SystemState = {
        activeCrawls: context.activeCrawls as number || 0,
        totalCrawls: context.totalCrawls as number || 0,
        failedJobs: context.failedJobs as number || 0,
        alerts: context.alerts as number || 0,
        activeWorkers: context.activeWorkers as number || 0,
        systemStatus: (context.systemStatus as 'ok' | 'warning' | 'critical') || 'ok',
      };

      const copilotContext = buildCopilotContext(
        request.headers.get('referer') || undefined,
        systemState
      );

      const contextPrompt = formatContextForPrompt(copilotContext);
      if (contextPrompt) {
        messages.push({ 
          role: 'system', 
          content: `CONTEXTE (utilise-le uniquement si nécessaire pour ta réponse) :\n${contextPrompt}` 
        });
      }
    }

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.slice(-5).forEach((msg) => {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      });
    }

    // Add current message WITHOUT context injection
    messages.push({
      role: 'user',
      content: message!,
    });

    let response: string;
    let tokensUsed = 0;
    let modelUsed = '';

    // Choose between OpenAI and Ollama
    if (selectedModel === 'ollama') {
      // Use local Ollama (free)
      const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2:1b';
      modelUsed = `ollama:${ollamaModel}`;
      
      try {
        response = await callOllamaAPI(messages, ollamaModel);
      } catch (error) {
        response = buildFallbackResponse(message!, context) + 
          '\n\n⚠️ Ollama indisponible. Essaye OpenAI ou vérifie que Ollama est actif.';
      }
    } else {
      // Use OpenAI (paid)
      const openai = new OpenAI({ apiKey: apiKey! });
      const openaiModel = selectedModel === 'openai'
        ? (process.env.OPENAI_MODEL || 'gpt-4-turbo')
        : selectedModel;
      modelUsed = openaiModel;

      const completion = await openai.chat.completions.create({
        model: modelUsed,
        messages,
        temperature: agentMode ? 0.8 : 0.6,
        max_tokens: 2000,
        presence_penalty: 0.2,
        frequency_penalty: 0.3,
      });

      response = completion.choices[0]?.message?.content?.trim() ||
        buildFallbackResponse(message!, context);

      tokensUsed = completion.usage?.total_tokens || 0;
      
      if (tokensUsed > 0) {
        const tokenResult = await trackTokenUsage(`copilot:${userId}`, tokensUsed, maxTokensPerDay);
        copilotTokensUsed.inc({ model: modelUsed }, tokensUsed);

        if (!tokenResult.allowed) {
          return NextResponse.json(
            { error: 'Token quota exceeded', quotaRemaining: 0 },
            { status: 429 }
          );
        }
      }
    }

    await auditLogger.logCopilotAction(
      'message',
      message!,
      { response, actions: buildActions(message!), model: modelUsed },
      userId,
      ip
    );

    // MEMORY LOGGING: Add messages to session memory
    if (sessionMemory) {
      memoryManager.addMessage(sessionId, 'user', message!, tokensUsed);
      memoryManager.addMessage(sessionId, 'assistant', response, tokensUsed);
    }

    copilotRequestsTotal.inc({ action: actionName, status: 'success' });
    if (stopTimer) stopTimer();

    return NextResponse.json({
      success: true,
      response,
      actions: buildActions(message!),
      model: modelUsed,
      tokensUsed: tokensUsed || undefined,
      sandboxMode: sandboxManager.isSandboxEnabled(),
    });
  } catch (error) {
    if (stopTimer) stopTimer();
    copilotRequestsTotal.inc({ action: actionName, status: 'error' });

    await auditLogger.log({
      action: 'copilot_error',
      userId,
      ipAddress: ip,
      success: false,
      errorMsg: String(error),
    });

    console.error('POST /api/admin/copilot failed:', error);
    return NextResponse.json(
      { error: 'Failed to process copilot request', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'ok',
  });
}
