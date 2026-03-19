// /opt/gpti/gpti-site/lib/jobExecutor.ts
// Real job execution service that runs Python scripts

import { spawn } from 'child_process';
import { prisma } from '@/lib/prisma';
import { buildAgentRuntimeEnv } from '@/lib/agent-learning/agent-tuner';
import { runAgentLearningLoop, scoreRunQuality } from '@/lib/agent-learning/agent-feedback';
import {
  createAgentPolicySnapshot,
  finalizeAgentPolicySnapshot,
} from '@/lib/agent-learning/agent-policy-snapshot';
import { runPolicyPromotionDecision, runPolicyRollbackCheck } from '@/lib/agent-learning/policy-governance';
import { getSecretEnv } from '@/lib/secret-env';

export interface JobConfig {
  name: string;
  category: 'enrichment' | 'scoring' | 'maintenance';
  description: string;
  scriptPath: string;
  args?: string[];
  timeout?: number; // in milliseconds
  enabled: boolean;
}

export interface JobModelAssignment {
  stage: 'crawl' | 'enrichment' | 'rescoring' | 'snapshot' | 'page-display' | 'pipeline-orchestrator' | 'maintenance';
  model: string;
  purpose: string;
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
    args: ['sync'],
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
  risk_alerts: {
    name: 'risk_alerts',
    category: 'maintenance',
    description: 'Dispatch High/Critical risk escalation alerts (Slack/email)',
    scriptPath: '/opt/gpti/gpti-data-bot/scripts/risk_alerts.py',
    args: [],
    timeout: 5 * 60 * 1000, // 5 minutes
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
  model: string;
  stage: JobModelAssignment['stage'];
  learning?: {
    agentName: string;
    taskType: string;
    score: number;
    successRate: number;
    avgLatency: number;
    errorRate: number;
  };
}

function getAgentLearningMapping(jobName: string): { agentName: string; taskType: string } {
  switch (jobName) {
    case 'discovery_scan':
      return { agentName: 'discovery_agent', taskType: 'discovery_query' };
    case 'enrichment_daily':
      return { agentName: 'enrichment_agent', taskType: 'enrichment_pattern' };
    case 'full_pipeline':
      return { agentName: 'crawl_agent', taskType: 'crawl_strategy' };
    case 'scoring_update':
      return { agentName: 'scoring_agent', taskType: 'score_validation' };
    default:
      return { agentName: 'operator_agent', taskType: 'job_execution' };
  }
}

export function getJobModelAssignment(jobName: string): JobModelAssignment {
  const crawlModel = process.env.OLLAMA_CRAWL_MODEL || process.env.OLLAMA_CODE_MODEL || 'qwen2.5-coder:32b';
  const enrichmentModel = process.env.OLLAMA_ENRICHMENT_MODEL || process.env.OLLAMA_AGENT_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-r1:32b';
  const scoringModel = process.env.OLLAMA_RESCORING_MODEL || process.env.OLLAMA_AGENT_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-r1:32b';
  const snapshotModel = process.env.OLLAMA_SNAPSHOT_MODEL || process.env.OLLAMA_GENERAL_MODEL || process.env.GLM_MODEL || 'glm4:9b';
  const pageDisplayModel = process.env.OLLAMA_PAGE_MODEL || process.env.OLLAMA_GENERAL_MODEL || process.env.GLM_MODEL || 'glm4:9b';
  const orchestratorModel = process.env.OLLAMA_PIPELINE_MODEL || process.env.OLLAMA_AGENT_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-r1:32b';
  const maintenanceModel = process.env.OLLAMA_GENERAL_MODEL || process.env.GLM_MODEL || 'glm4:9b';

  switch (jobName) {
    case 'discovery_scan':
      return { stage: 'crawl', model: crawlModel, purpose: 'Structured extraction, crawling hints, HTML/data normalization' };
    case 'enrichment_daily':
    case 'asic_sync':
    case 'sentiment_analysis':
      return { stage: 'enrichment', model: enrichmentModel, purpose: 'Entity matching, evidence consolidation, regulatory reasoning' };
    case 'scoring_update':
      return { stage: 'rescoring', model: scoringModel, purpose: 'Validation reasoning, score review, anomaly checks' };
    case 'snapshot_export':
      return { stage: 'snapshot', model: snapshotModel, purpose: 'Snapshot packaging, metadata summary, publish-time formatting' };
    case 'full_pipeline':
      return { stage: 'pipeline-orchestrator', model: orchestratorModel, purpose: 'Cross-step orchestration for crawl, enrichment, scoring, and snapshot flow' };
    case 'database_cleanup':
    case 'risk_alerts':
      return { stage: 'maintenance', model: maintenanceModel, purpose: 'Low-cost maintenance assistance and summaries' };
    default:
      return { stage: 'page-display', model: pageDisplayModel, purpose: 'Fast public-facing summaries and page content support' };
  }
}

export function getPipelineModelAssignments() {
  return {
    crawl: process.env.OLLAMA_CRAWL_MODEL || process.env.OLLAMA_CODE_MODEL || 'qwen2.5-coder:32b',
    enrichment: process.env.OLLAMA_ENRICHMENT_MODEL || process.env.OLLAMA_AGENT_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-r1:32b',
    rescoring: process.env.OLLAMA_RESCORING_MODEL || process.env.OLLAMA_AGENT_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-r1:32b',
    snapshot: process.env.OLLAMA_SNAPSHOT_MODEL || process.env.OLLAMA_GENERAL_MODEL || process.env.GLM_MODEL || 'glm4:9b',
    pageDisplay: process.env.OLLAMA_PAGE_MODEL || process.env.OLLAMA_GENERAL_MODEL || process.env.GLM_MODEL || 'glm4:9b',
    fullPipeline: process.env.OLLAMA_PIPELINE_MODEL || process.env.OLLAMA_AGENT_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-r1:32b',
  };
}

function getSiteBaseUrl(): string {
  return (
    process.env.INTERNAL_BASE_URL ||
    process.env.SITE_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_BASE_URL ||
    'http://127.0.0.1:3000'
  )
    .trim()
    .replace(/\/$/, '')
}

function buildAlsServiceEnv(): Record<string, string> {
  const baseUrl = getSiteBaseUrl()
  const feedbackUrl = `${baseUrl}/api/admin/agent-learning/feedback`
  const tuningUrl = `${baseUrl}/api/admin/agent-learning/tuning`
  const token = getSecretEnv('ALS_API_TOKEN') || getSecretEnv('ALS_SERVICE_TOKEN')

  return {
    ALS_ENABLED: process.env.ALS_ENABLED || '1',
    ALS_FEEDBACK_URL: process.env.ALS_FEEDBACK_URL || feedbackUrl,
    ALS_TUNING_URL: process.env.ALS_TUNING_URL || tuningUrl,
    ALS_API_TOKEN: token,
  }
}

function deriveCohortKey(jobName: string): string {
  const explicit = String(process.env.ALS_COHORT_KEY || process.env.GTIXT_POLICY_COHORT || '').trim()
  if (explicit) return explicit.slice(0, 80)

  switch (jobName) {
    case 'discovery_scan':
      return 'known_source'
    case 'enrichment_daily':
      return 'prop_like'
    case 'full_pipeline':
      return 'mixed'
    default:
      return 'global'
  }
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
  const modelAssignment = getJobModelAssignment(jobName);
  const learningTarget = getAgentLearningMapping(jobName);
  const runtimeLearningEnv = await buildAgentRuntimeEnv().catch(() => ({} as Record<string, string>));
  const alsServiceEnv = buildAlsServiceEnv();
  const cohortKey = deriveCohortKey(jobName);
  const policySnapshot = await createAgentPolicySnapshot({
    jobName,
    agentName: learningTarget.agentName,
    taskType: learningTarget.taskType,
    cohortKey,
    stage: modelAssignment.stage,
    runtimeEnv: runtimeLearningEnv,
    policy: {},
    runStartedAt: startTime.toISOString(),
  }).catch(() => null);

  return new Promise((resolve, reject) => {
    // Allow using a project virtualenv interpreter when available.
    const pythonPath = process.env.GTIXT_PYTHON_PATH || '/usr/bin/python3';
    const args = [job.scriptPath, ...(job.args || [])];

    const pythonProc = spawn(pythonPath, args, {
      cwd: '/opt/gpti/gpti-data-bot',
      env: {
        ...globalThis.process.env,
        ...runtimeLearningEnv,
        ...alsServiceEnv,
        PYTHONPATH: '/opt/gpti/gpti-data-bot/src',
        OLLAMA_MODEL: modelAssignment.model,
        LLM_MODEL: modelAssignment.model,
        GTIXT_JOB_NAME: jobName,
        GTIXT_JOB_STAGE: modelAssignment.stage,
        GTIXT_POLICY_COHORT: cohortKey,
        GTIXT_JOB_MODEL: modelAssignment.model,
        GTIXT_JOB_PURPOSE: modelAssignment.purpose,
        GTIXT_CRAWL_MODEL: process.env.OLLAMA_CRAWL_MODEL || process.env.OLLAMA_CODE_MODEL || 'qwen2.5-coder:32b',
        GTIXT_ENRICHMENT_MODEL: process.env.OLLAMA_ENRICHMENT_MODEL || process.env.OLLAMA_AGENT_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-r1:32b',
        GTIXT_RESCORING_MODEL: process.env.OLLAMA_RESCORING_MODEL || process.env.OLLAMA_AGENT_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-r1:32b',
        GTIXT_SNAPSHOT_MODEL: process.env.OLLAMA_SNAPSHOT_MODEL || process.env.OLLAMA_GENERAL_MODEL || process.env.GLM_MODEL || 'glm4:9b',
        GTIXT_PAGE_MODEL: process.env.OLLAMA_PAGE_MODEL || process.env.OLLAMA_GENERAL_MODEL || process.env.GLM_MODEL || 'glm4:9b',
        GTIXT_PIPELINE_MODEL: process.env.OLLAMA_PIPELINE_MODEL || process.env.OLLAMA_AGENT_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-r1:32b',
      },
    });

    output += `[MODEL] ${modelAssignment.model}\n[STAGE] ${modelAssignment.stage}\n[PURPOSE] ${modelAssignment.purpose}\n`;

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
      const learningScore = scoreRunQuality({
        success: exitCode === 0,
        exitCode,
        durationSec: duration,
        output,
      });

      const result: JobExecutionResult = {
        success: exitCode === 0,
        output: output.substring(0, 50000), // Limit to 50KB
        exitCode,
        duration,
        startTime,
        endTime,
        model: modelAssignment.model,
        stage: modelAssignment.stage,
      };

      runAgentLearningLoop({
        agentName: learningTarget.agentName,
        taskType: learningTarget.taskType,
        input: {
          jobName,
          args: job.args || [],
          stage: modelAssignment.stage,
        },
        output: {
          outputPreview: output.substring(0, 3000),
          exitCode,
        },
        success: result.success,
        score: learningScore,
        confidence: learningScore,
        latencyMs: duration * 1000,
        error: result.success ? null : `job_exit_${exitCode}`,
        metadata: {
          jobName,
          stage: modelAssignment.stage,
          model: modelAssignment.model,
          source: 'job_executor',
          policySnapshotId: policySnapshot?.id || null,
        },
      })
        .then((learning) => {
          result.learning = {
            agentName: learning.event.agentName,
            taskType: learning.event.taskType,
            score: learning.event.score,
            successRate: learning.performance.successRate,
            avgLatency: learning.performance.avgLatency,
            errorRate: learning.performance.errorRate,
          };
        })
        .catch(() => {
          // Learning loop is best-effort and must not break job execution.
        })
        .finally(() => {
          runPolicyPromotionDecision({
            agentName: learningTarget.agentName,
            taskType: learningTarget.taskType,
            cohortKey,
            stage: modelAssignment.stage,
          })
            .then(() =>
              runPolicyRollbackCheck({
                agentName: learningTarget.agentName,
                taskType: learningTarget.taskType,
                cohortKey,
                stage: modelAssignment.stage,
              }),
            )
            .catch(() => {
              // Policy governance is best-effort.
            });

          if (policySnapshot?.id) {
            finalizeAgentPolicySnapshot(policySnapshot.id, {
              success: result.success,
              score: learningScore,
              exitCode,
              durationSec: duration,
              outputPreview: output.substring(0, 3000),
              error: result.success ? null : `job_exit_${exitCode}`,
            }).catch(() => {
              // Snapshot finalization is best-effort.
            });
          }
          resolve(result);
        });

      return;
    });

    pythonProc.on('error', (error) => {
      clearTimeout(timeout);
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

      if (policySnapshot?.id) {
        finalizeAgentPolicySnapshot(policySnapshot.id, {
          success: false,
          score: 0,
          exitCode: 1,
          durationSec: duration,
          outputPreview: output.substring(0, 1000),
          error: error.message,
        }).catch(() => {
          // Snapshot finalization is best-effort.
        });
      }

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
        name: jobName,
        status: result.success ? 'completed' : 'failed',
        durationMs: result.duration || 0,
        createdAt: new Date(),
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
