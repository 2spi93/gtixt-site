import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth';
import { auditLogger } from '@/lib/audit-logger';
import { sandboxManager } from '@/lib/sandbox-manager';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { executeJob, JOB_REGISTRY } from '@/lib/jobExecutor';
import { runSafeOperatorAction } from '@/lib/autonomous-lab/operator';
import { runDecisionEngine } from '@/lib/autonomous-lab/decision-engine';
import { recordDecisionSnapshot } from '@/lib/autonomous-lab/decision-history';

const execFileAsync = promisify(execFile);

interface CopilotAction {
  type: string;
  params?: Record<string, any>;
  label?: string;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  try {
    // Enhanced auth - supports both session and header auth
    const auth = await requireAdminUser(request, ['admin', 'lead_reviewer']);
    if (auth instanceof NextResponse) return auth;

    const sameOriginError = requireSameOrigin(request);
    if (sameOriginError) return sameOriginError;

    const body = await request.json();
    const { action } = body as { action?: CopilotAction };

    if (!action?.type) {
      return NextResponse.json({ error: 'action.type is required' }, { status: 400 });
    }

    console.warn(`[COPILOT] Executing action: ${action.type}`);
    let result: any = {};

    // Execute based on action type
    switch (action.type) {
      case 'read_file':
        if (!action.params?.filePath) {
          return NextResponse.json({ error: 'read_file requires filePath parameter' }, { status: 400 });
        }
        result = await executeReadFile(action.params);
        break;

      case 'launch_crawl':
        result = await executeLaunchCrawl(action.params);
        break;

      case 'run_job':
        result = await executeRunJob(action.params);
        break;

      case 'show_diff':
        result = await executeShowDiff(action.params);
        break;

      case 'generate_patch':
        result = await executeGeneratePatch(action.params);
        break;

      case 'analyze_impact':
        result = await executeAnalyzeImpact(action.params);
        break;

      case 'action_plan':
        result = await executeActionPlan(action.params);
        break;

      case 'autoresearch_cycle':
        result = await executeAutoResearchCycle(request, action.params);
        break;

      case 'openclaw_action':
        result = await executeOpenClawAction(
          action.params,
          {
            role: String((auth as any)?.user?.role || 'reviewer'),
            username: String((auth as any)?.user?.username || 'unknown'),
          }
        );
        break;

      case 'system_health':
        result = await executeSystemHealth();
        break;

      case 'workspace_audit':
        result = await executeWorkspaceAudit(action.params);
        break;

      case 'data_quality':
        result = await executeDataQuality();
        break;

      case 'analyze_page':
      case 'page_analyze':
        result = await executeAnalyzePage(action.params);
        break;

      case 'firm_consistency_audit':
        result = await executeFirmConsistencyAudit(action.params);
        break;

      case 'decision_state': {
        const baseUrl =
          request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://127.0.0.1:3000';
        const decision = await runDecisionEngine(baseUrl);
        await recordDecisionSnapshot({
          source: 'copilot_action',
          decision,
          dedupeWindowSeconds: 240,
          metadata: {
            route: '/api/admin/copilot/execute',
            action: 'decision_state',
          },
        }).catch(() => null);
        result = { decision };
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unsupported action: ${action.type}` },
          { status: 400 }
        );
    }

    // Log operation to database
    await prisma.adminOperations.create({
      data: {
        id: `op_${Date.now()}`,
        operationType: 'copilot_execute',
        operation: action.label || action.type,
        firmId: null,
        userId: 'system',
        status: 'success',
        details: { action: action.type, ipAddress: ip, result } as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }).catch(err => console.warn('Failed to log operation:', err));

    // Log to audit
    await auditLogger.log({
      action: `copilot_execute_${action.type}`,
      userId: 'system',
      ipAddress: ip,
      details: JSON.stringify({ action: action.type }),
      success: true,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      action: action.type,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[COPILOT] Execution error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Execute show_diff action
 */
async function executeShowDiff(params: Record<string, any> | undefined): Promise<any> {
  const file1 = String(params?.file1 || '').trim();
  const file2 = String(params?.file2 || '').trim();
  if (!file1 || !file2) {
    throw new Error('show_diff requires file1 and file2');
  }

  const [content1, content2] = await Promise.all([
    sandboxManager.readFile(file1),
    sandboxManager.readFile(file2),
  ]);

  if (content1 === content2) {
    return { success: true, identical: true, message: 'Files are identical', file1, file2 };
  }

  const lines1 = content1.split('\n');
  const lines2 = content2.split('\n');
  const max = Math.max(lines1.length, lines2.length);
  const preview: string[] = [];

  for (let i = 0; i < max && preview.length < 120; i++) {
    const a = lines1[i] ?? '';
    const b = lines2[i] ?? '';
    if (a !== b) {
      preview.push(`- ${i + 1}: ${a}`);
      preview.push(`+ ${i + 1}: ${b}`);
    }
  }

  return {
    success: true,
    identical: false,
    file1,
    file2,
    preview,
    message: 'Diff preview generated',
  };
}

/**
 * Execute generate_patch action
 */
async function executeGeneratePatch(params: Record<string, any> | undefined): Promise<any> {
  const target = String(params?.target || params?.filePath || 'workspace');
  const objective = String(params?.objective || 'unspecified objective');

  return {
    success: true,
    mode: 'planning',
    target,
    objective,
    patchPlan: [
      'Inspect impacted code path',
      'Design minimal safe patch',
      'Apply patch in constrained scope',
      'Run diagnostics/tests on touched files',
      'Return final diff and rollout notes',
    ],
  };
}

/**
 * Execute analyze_impact action
 */
async function executeAnalyzeImpact(params: Record<string, any> | undefined): Promise<any> {
  const change = String(params?.change || 'unspecified change');
  return {
    success: true,
    change,
    impact: {
      build: 'review required',
      runtime: 'review required',
      apiCompatibility: 'review required',
      security: 'review required',
    },
    nextChecks: [
      'TypeScript diagnostics on touched files',
      'API contract checks',
      'Audit trail verification for privileged actions',
    ],
  };
}

/**
 * Execute action_plan action
 */
async function executeActionPlan(params: Record<string, any> | undefined): Promise<any> {
  const objective = String(params?.objective || 'unspecified objective');
  return {
    success: true,
    objective,
    plan: [
      'Clarify objective and constraints',
      'Collect context from code and runtime',
      'Prepare bounded implementation steps',
      'Validate with diagnostics and smoke tests',
      'Document rollout and fallback',
    ],
  };
}

/**
 * Execute autoresearch_cycle action
 */
async function executeAutoResearchCycle(
  request: NextRequest,
  params: Record<string, any> | undefined
): Promise<any> {
  const baseUrl = request.nextUrl.origin || 'http://127.0.0.1:3000';
  const targetMin = Number(params?.targetMin ?? 120);
  const batchSize = Number(params?.batchSize ?? 12);
  const sampleLimit = Number(params?.sampleLimit ?? 1000);

  const res = await fetch(`${baseUrl}/api/admin/autonomous-lab/cycle`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: request.headers.get('cookie') || '',
      origin: baseUrl,
    },
    body: JSON.stringify({
      targetMin,
      batchSize,
      sampleLimit,
      baseUrl,
    }),
    cache: 'no-store',
  });

  const payload = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok) {
    throw new Error(String((payload as any)?.error || `autoresearch cycle failed (${res.status})`));
  }

  return {
    success: true,
    mode: 'autoresearch',
    targetMin,
    batchSize,
    sampleLimit,
    cycle: (payload as any)?.data || payload,
  };
}

/**
 * Execute openclaw_action
 */
async function executeOpenClawAction(
  params: Record<string, any> | undefined,
  actor: { role?: string; username?: string }
): Promise<any> {
  const actionType = String(params?.actionType || '').trim();

  const allowed = new Set(['queue_job', 'warm_cache', 'redis_health', 'snapshot_cache_invalidate']);
  if (!allowed.has(actionType)) {
    throw new Error(`openclaw_action requires valid actionType: ${Array.from(allowed).join(', ')}`);
  }

  const result = await runSafeOperatorAction(
    {
      type: actionType as 'queue_job' | 'warm_cache' | 'redis_health' | 'snapshot_cache_invalidate',
      payload: params?.payload || {},
    },
    actor
  );

  return {
    success: true,
    mode: 'openclaw',
    actionType,
    result,
  };
}

/**
 * Execute read_file action - Read files from workspace with security
 */
async function executeReadFile(params: Record<string, any> | undefined): Promise<any> {
  if (!params?.filePath) {
    throw new Error('filePath parameter is required');
  }

  try {
    const content = await sandboxManager.readFile(params.filePath);
    return {
      success: true,
      filePath: params.filePath,
      content,
      length: content.length,
    };
  } catch (error) {
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Execute launch_crawl action - Start data collection crawl
 */
async function executeLaunchCrawl(params: Record<string, any> | undefined): Promise<any> {
  try {
    const crawlId = `crawl_${Date.now()}`;
    
    // Store in database
    await prisma.adminCrawls.create({
      data: {
        id: crawlId,
        name: params?.name || 'priority_crawl',
        status: 'pending',
        url: params?.url || 'manual_crawl',
        resultsCount: 0,
        errorCount: 0,
        updatedAt: new Date(),
      },
    });

    // Trigger background crawl (fire and forget)
    execFileAsync('python3', ['/opt/gpti/run-complete-crawl.py'], {
      timeout: 600000,
      maxBuffer: 10 * 1024 * 1024,
    }).catch(err => console.error('Crawl script error:', err));

    return {
      success: true,
      crawlId,
      message: 'Crawl launched successfully',
      status: 'pending',
    };
  } catch (error) {
    throw new Error(`Failed to launch crawl: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Execute run_job action - Execute data enrichment jobs
 */
async function executeRunJob(params: Record<string, any> | undefined): Promise<any> {
  const requested = (params?.jobName || params?.jobType || 'scoring_update') as string;
  const aliases: Record<string, string> = {
    scoring: 'scoring_update',
    enrichment: 'enrichment_daily',
    compliance: 'enrichment_daily',
    full_deep: 'full_pipeline',
    fields: 'enrichment_daily',
    provenance: 'snapshot_export',
  };
  const jobName = aliases[requested] || requested;

  try {
    const config = JOB_REGISTRY[jobName];
    if (!config) {
      throw new Error(`Unknown job: ${jobName}`);
    }

    await fs.access(config.scriptPath);

    const execId = `job_${Date.now()}`;

    // Store in database
    await prisma.adminJobs.create({
      data: {
        id: execId,
        name: jobName,
        status: 'running',
        durationMs: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Execute job in the background using the canonical job executor.
    executeJob(jobName)
      .then((result) => {
        console.warn(`[JOB] ${jobName} completed:`, result.success ? 'SUCCESS' : 'FAILED');
        prisma.adminJobs.update({
          where: { id: execId },
          data: { status: result.success ? 'completed' : 'failed', durationMs: (result.duration || 0) * 1000, updatedAt: new Date() },
        }).catch(() => {});
      })
      .catch(err => {
        console.error(`[JOB] ${jobName} error:`, err);
        prisma.adminJobs.update({
          where: { id: execId },
          data: { status: 'failed', updatedAt: new Date() },
        }).catch(() => {});
      });

    return {
      success: true,
      jobId: execId,
      jobName,
      jobLabel: config.description,
      message: `${config.description} started`,
      status: 'running',
    };
  } catch (error) {
    throw new Error(`Failed to run job: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Execute system_health action
 */
async function executeSystemHealth(): Promise<any> {
  try {
    let database = 'OK';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'ERROR';
    }

    const activeCrawls = await prisma.adminCrawls.count({ where: { status: { in: ['pending', 'running'] } } });
    const failedJobs = await prisma.adminJobs.count({ where: { status: 'failed' } });
    const alerts = await prisma.adminAlerts.count({ where: { acknowledged: false } });

    const health = {
      status: database === 'OK' && failedJobs === 0 ? 'healthy' : database === 'OK' ? 'warning' : 'critical',
      services: {
        database,
        activeCrawls,
        failedJobs,
        alerts,
      },
    };

    return {
      success: true,
      status: health.status || 'unknown',
      services: health.services || {},
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to fetch health status: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Execute workspace_audit action
 */
async function executeWorkspaceAudit(_params: Record<string, any> | undefined): Promise<any> {
  try {
    const auditPath = '/opt/gpti';
    const stats = await fs.stat(auditPath);

    return {
      success: true,
      workspace: auditPath,
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
      message: 'Workspace audit completed',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to audit workspace: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Execute data_quality action
 */
async function executeDataQuality(): Promise<any> {
  try {
    // Query database for data quality metrics
    const totalFirms = await prisma.firms.count();
    const completeRecords = await prisma.firms.count({
      where: {
        AND: [
          { firm_id: { not: null } },
          { name: { not: null } },
          { status: { not: null } },
          { jurisdiction: { not: null } },
        ],
      },
    });

    const incompleteness = totalFirms > 0 ? ((totalFirms - completeRecords) / totalFirms * 100).toFixed(1) : 'N/A';

    return {
      success: true,
      dataQualityScore: totalFirms > 0 ? (completeRecords / totalFirms).toFixed(2) : 0,
      totalRecords: totalFirms,
      completeRecords,
      incompleteness: `${incompleteness}%`,
      recommendations: [
        'Run FCA/ASIC enrichment job',
        'Execute missing fields enrichment',
        'Backfill evidence provenance',
      ],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to assess data quality: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Execute analyze_page action
 * When no URL is provided, returns a curated list of available client pages instead of throwing.
 */
async function executeAnalyzePage(params: Record<string, any> | undefined): Promise<any> {
  const BASE_URL = (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://127.0.0.1:3000'
  ).replace(/\/$/, '');

  const pageUrl: string | undefined = params?.url ? String(params.url).trim() : undefined;

  if (!pageUrl) {
    // No URL given – return the list of navigable client pages for the user to pick
    return {
      success: true,
      mode: 'page_list',
      operationId: `pagelist_${Date.now()}`,
      message: 'No URL provided. Available client pages to analyze:',
      pages: [
        { label: 'Rankings', url: `${BASE_URL}/rankings` },
        { label: 'Firms Directory', url: `${BASE_URL}/firms` },
        { label: 'Methodology', url: `${BASE_URL}/methodology` },
        { label: 'Radar', url: `${BASE_URL}/radar` },
        { label: 'Best Prop Firms', url: `${BASE_URL}/best-prop-firms` },
        { label: 'Research', url: `${BASE_URL}/research` },
        { label: 'Index', url: `${BASE_URL}/index` },
      ],
      hint: 'Re-run the action with one of the above URLs as the `url` parameter.',
    };
  }

  // Resolve relative paths to the base URL
  const resolvedUrl = pageUrl.startsWith('http') ? pageUrl : `${BASE_URL}${pageUrl}`;

  try {
    const response = await fetch(resolvedUrl, { signal: AbortSignal.timeout(12000) });

    if (!response.ok) {
      throw new Error(`Page returned ${response.status}`);
    }

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    const headingsMatch = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || [];

    return {
      success: true,
      operationId: `analyze_${Date.now()}`,
      url: resolvedUrl,
      title: titleMatch?.[1] || 'No title',
      description: descMatch?.[1] || 'No description',
      headingCount: headingsMatch.length,
      contentLength: html.length,
      isAccessible: response.status === 200,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to analyze page: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Execute firm_consistency_audit
 * Cross-checks DB records vs public /api/firms vs live public pages.
 * Returns a structured report of missing names, broken slugs, API gaps.
 */
async function executeFirmConsistencyAudit(params: Record<string, any> | undefined): Promise<any> {
  const limit = Math.min(Number(params?.limit ?? 100), 300);
  const BASE_URL = (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://127.0.0.1:3000'
  ).replace(/\/$/, '');

  const operationId = `consistency_${Date.now()}`;

  // 1. Fetch DB firms
  const dbFirms = await prisma.firms.findMany({
    where: { operational_status: 'active' },
    select: { firm_id: true, name: true, brand_name: true, website_root: true, status: true, operational_status: true },
    take: limit,
    orderBy: { updated_at: 'desc' },
  });

  // 2. Fetch public API firms
  let apiFirms: any[] = [];
  try {
    const apiRes = await fetch(`${BASE_URL}/api/firms?limit=${limit}`, {
      signal: AbortSignal.timeout(12_000),
    });
    const apiData = await apiRes.json().catch(() => ({ firms: [] }));
    apiFirms = apiData.firms ?? [];
  } catch {
    // API unavailable — report as partial
  }

  const apiById = new Map(apiFirms.map((f: any) => [f.firm_id, f]));

  // 3. Analysis
  const missingNames = dbFirms.filter((f) => !f.name && !f.brand_name);

  const missingInApi = dbFirms.filter(
    (f) => f.firm_id && !apiById.has(f.firm_id)
  );

  const nameMismatch = dbFirms
    .filter((f) => {
      const apiF = apiById.get(f.firm_id ?? '');
      return apiF?.name && f.name && apiF.name !== f.name;
    })
    .map((f) => ({
      firm_id: f.firm_id,
      db_name: f.name,
      api_name: apiById.get(f.firm_id ?? '')?.name,
    }));

  const missingSlug = apiFirms.filter(
    (f: any) => !f.firm_id || String(f.firm_id).trim() === ''
  );

  // Spot-check: pick 5 random API firms and verify their public page responds
  const sample = apiFirms
    .filter((f: any) => f.firm_id)
    .slice(0, 5);
  const pageChecks = await Promise.all(
    sample.map(async (f: any) => {
      const url = `${BASE_URL}/firms/${f.firm_id}`;
      try {
        const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(6000) });
        return { firm_id: f.firm_id, name: f.name, url, status: res.status, ok: res.ok };
      } catch (err) {
        return { firm_id: f.firm_id, name: f.name, url, status: 0, ok: false, error: String(err) };
      }
    })
  );
  const brokenPages = pageChecks.filter((c) => !c.ok);

  return {
    success: true,
    mode: 'firm_consistency_audit',
    operationId,
    summary: {
      dbTotal: dbFirms.length,
      apiTotal: apiFirms.length,
      missingNamesCount: missingNames.length,
      missingInApiCount: missingInApi.length,
      nameMismatchCount: nameMismatch.length,
      missingSlugCount: missingSlug.length,
      brokenPublicPages: brokenPages.length,
    },
    issues: {
      missingNames: missingNames.slice(0, 20).map((f) => ({
        firm_id: f.firm_id,
        brand_name: f.brand_name,
        status: f.status,
      })),
      missingInApi: missingInApi.slice(0, 20).map((f) => ({
        firm_id: f.firm_id,
        name: f.name ?? f.brand_name,
      })),
      nameMismatch: nameMismatch.slice(0, 10),
      missingSlug: missingSlug.slice(0, 10).map((f: any) => ({ firm_id: f.firm_id, name: f.name })),
      brokenPublicPages: brokenPages,
    },
    timestamp: new Date().toISOString(),
  };
}
