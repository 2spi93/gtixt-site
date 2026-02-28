import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth';
import { auditLogger } from '@/lib/audit-logger';
import { sandboxManager } from '@/lib/sandbox-manager';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

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
    const auth = await requireAdminUser(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const sameOriginError = requireSameOrigin(request);
    if (sameOriginError) return sameOriginError;

    const body = await request.json();
    const { action } = body as { action?: CopilotAction };

    if (!action?.type) {
      return NextResponse.json({ error: 'action.type is required' }, { status: 400 });
    }

    console.log(`[COPILOT] Executing action: ${action.type}`);
    let result: any = {};

    // Execute based on action type
    switch (action.type) {
      case 'read_file':
        result = await executeReadFile(action.params);
        break;

      case 'launch_crawl':
        result = await executeLaunchCrawl(action.params);
        break;

      case 'run_job':
        result = await executeRunJob(action.params);
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
        result = await executeAnalyzePage(action.params);
        break;

      default:
        // Fallback for basic actions
        result = 'Action executed.';
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
  const jobType = params?.jobType || 'scoring';

  try {
    let scriptPath = '';
    let jobLabel = '';

    switch (jobType) {
      case 'scoring':
      case 'enrichment':
      case 'compliance':
        scriptPath = '/opt/gpti/enrich_fca_asic_compliance.py';
        jobLabel = 'FCA/ASIC Compliance Enrichment';
        break;
      case 'fields':
        scriptPath = '/opt/gpti/enrich-missing-fields.py';
        jobLabel = 'Missing Fields Enrichment';
        break;
      case 'provenance':
        scriptPath = '/opt/gpti/backfill_evidence_provenance.py';
        jobLabel = 'Evidence Provenance Backfill';
        break;
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }

    // Check if script exists
    await fs.access(scriptPath);

    const execId = `job_${Date.now()}`;

    // Store in database
    await prisma.adminJobs.create({
      data: {
        id: execId,
        jobType,
        status: 'running',
        executionCount: 1,
        successCount: 0,
        failureCount: 0,
        lastExecutedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Execute job (fire and forget for now)
    execFileAsync('python3', [scriptPath], {
      timeout: 300000,
      maxBuffer: 10 * 1024 * 1024,
    })
      .then(({ stdout }) => {
        console.log(`[JOB] ${jobType} completed:`, stdout.slice(0, 200));
        prisma.adminJobs.update({
          where: { id: execId },
          data: { status: 'completed', successCount: 1, updatedAt: new Date() },
        }).catch(() => {});
      })
      .catch(err => {
        console.error(`[JOB] ${jobType} error:`, err);
        prisma.adminJobs.update({
          where: { id: execId },
          data: { status: 'failed', failureCount: 1, updatedAt: new Date() },
        }).catch(() => {});
      });

    return {
      success: true,
      jobId: execId,
      jobType,
      jobLabel,
      message: `${jobLabel} started`,
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
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const health = await response.json();

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
async function executeWorkspaceAudit(params: Record<string, any> | undefined): Promise<any> {
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
 */
async function executeAnalyzePage(params: Record<string, any> | undefined): Promise<any> {
  const pageUrl = params?.url;

  if (!pageUrl) {
    throw new Error('url parameter is required for analyze_page');
  }

  try {
    const response = await fetch(pageUrl, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) {
      throw new Error(`Page returned ${response.status}`);
    }

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    const headingsMatch = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || [];

    return {
      success: true,
      url: pageUrl,
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
