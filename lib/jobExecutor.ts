// /opt/gpti/gpti-site/lib/jobExecutor.ts
// Real job execution service that runs Python scripts

import { spawn } from 'child_process';
import { prisma } from '@/lib/prisma';

export interface JobConfig {
  name: string;
  category: 'enrichment' | 'scoring' | 'maintenance';
  description: string;
  scriptPath: string;
  args?: string[];
  timeout?: number; // in milliseconds
  enabled: boolean;
}

export const JOB_REGISTRY: Record<string, JobConfig> = {
  enrichment_daily: {
    name: 'enrichment_daily',
    category: 'enrichment',
    description: 'Daily enrichment of missing fields',
    scriptPath: '/opt/gpti/gpti-data-bot/scripts/auto_enrich_missing.py',
    args: ['--limit', '50', '--resume'],
    timeout: 30 * 60 * 1000, // 30 minutes
    enabled: true,
  },
  scoring_update: {
    name: 'scoring_update',
    category: 'scoring',
    description: 'Update firm scores and rankings',
    scriptPath: '/opt/gpti/gpti-data-bot/run_agents.py',
    args: ['--limit', '50'],
    timeout: 20 * 60 * 1000, // 20 minutes
    enabled: true,
  },
  discovery_scan: {
    name: 'discovery_scan',
    category: 'enrichment',
    description: 'Discover new firms from crawl data',
    scriptPath: '/opt/gpti/gpti-data-bot/scripts/run_discovery_collection.py',
    args: [],
    timeout: 15 * 60 * 1000, // 15 minutes
    enabled: true,
  },
  sentiment_analysis: {
    name: 'sentiment_analysis',
    category: 'enrichment',
    description: 'Run sentiment analysis on news',
    scriptPath: '/opt/gpti/gpti-data-bot/sentiment_enrichment_free.py',
    args: [],
    timeout: 10 * 60 * 1000, // 10 minutes
    enabled: true,
  },
  asic_sync: {
    name: 'asic_sync',
    category: 'enrichment',
    description: 'Sync Australian firms (ASIC)',
    scriptPath: '/opt/gpti/gpti-data-bot/asic_auto_sync_cli.py',
    args: ['sync', '--limit', '100'],
    timeout: 20 * 60 * 1000, // 20 minutes
    enabled: true,
  },
  full_pipeline: {
    name: 'full_pipeline',
    category: 'enrichment',
    description: 'Run complete pipeline (crawl + score + snapshot)',
    scriptPath: '/opt/gpti/gpti-data-bot/scripts/run-complete-pipeline.py',
    args: [],
    timeout: 60 * 60 * 1000, // 60 minutes
    enabled: true,
  },
  database_cleanup: {
    name: 'database_cleanup',
    category: 'maintenance',
    description: 'Clean up old logs and temp files',
    scriptPath: '/opt/gpti/gpti-data-bot/scripts/dashboard_monitor.py',
    args: ['--cleanup'],
    timeout: 5 * 60 * 1000, // 5 minutes
    enabled: false, // Manual only
  },
  snapshot_export: {
    name: 'snapshot_export',
    category: 'maintenance',
    description: 'Generate and export public snapshot',
    scriptPath: '/opt/gpti/gpti-data-bot/phase6_publisher.py',
    args: [],
    timeout: 10 * 60 * 1000, // 10 minutes
    enabled: true,
  },
};

export interface JobExecutionResult {
  success: boolean;
  output: string;
  exitCode: number;
  duration: number;
  startTime: Date;
  endTime: Date;
}

export async function executeJob(
  jobName: string,
  user: string = 'admin'
): Promise<JobExecutionResult> {
  const job = JOB_REGISTRY[jobName];
  if (!job) {
    throw new Error(`Job not found: ${jobName}`);
  }

  if (!job.enabled) {
    throw new Error(`Job is disabled: ${jobName}`);
  }

  const startTime = new Date();
  let output = '';
  let exitCode = 0;

  return new Promise((resolve, reject) => {
    const pythonPath = '/usr/bin/python3';
    const args = [job.scriptPath, ...(job.args || [])];

    const pythonProc = spawn(pythonPath, args, {
      cwd: '/opt/gpti/gpti-data-bot',
      env: {
        ...globalThis.process.env,
        PYTHONPATH: '/opt/gpti/gpti-data-bot/src',
      },
    });

    // Setup timeout
    const timeout = setTimeout(() => {
      pythonProc.kill('SIGTERM');
      output += '\n[ERROR] Job timed out';
      exitCode = 124; // Timeout exit code
    }, job.timeout || 30 * 60 * 1000);

    // Capture stdout
    pythonProc.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Capture stderr
    pythonProc.stderr.on('data', (data) => {
      output += data.toString();
    });

    // Handle completion
    pythonProc.on('close', (code) => {
      clearTimeout(timeout);
      exitCode = code || 0;
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

      const result: JobExecutionResult = {
        success: exitCode === 0,
        output: output.substring(0, 50000), // Limit to 50KB
        exitCode,
        duration,
        startTime,
        endTime,
      };

      resolve(result);
    });

    pythonProc.on('error', (error) => {
      clearTimeout(timeout);
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

      reject({
        success: false,
        output: `[ERROR] Failed to start job: ${error.message}\n${output}`,
        exitCode: 1,
        duration,
        startTime,
        endTime,
      });
    });
  });
}

export async function logJobExecution(
  jobName: string,
  result: JobExecutionResult,
  user: string = 'admin'
) {
  try {
    await prisma.adminJobs.create({
      data: {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jobType: jobName,
        status: result.success ? 'success' : 'failed',
        executionCount: 1,
        successCount: result.success ? 1 : 0,
        failureCount: result.success ? 0 : 1,
        lastExecutedAt: result.endTime,
        updatedAt: new Date(),
      },
    });

    // Also log to AdminOperations for audit trail
    await prisma.adminOperations.create({
      data: {
        id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user,
        operationType: 'job',
        operation: 'job_execution',
        firmId: null,
        status: result.success ? 'success' : 'failed',
        details: {
          jobName,
          success: result.success,
          duration: result.duration,
          exitCode: result.exitCode,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log job execution:', error);
  }
}

export function getAvailableJobs(): JobConfig[] {
  return Object.values(JOB_REGISTRY);
}

export function getJobStatus(jobName: string): 'idle' | 'running' | 'disabled' {
  const job = JOB_REGISTRY[jobName];
  if (!job) return 'idle';
  if (!job.enabled) return 'disabled';
  // In a real system, check if job is currently running
  return 'idle';
}
