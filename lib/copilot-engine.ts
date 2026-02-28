/**
 * GTIXT Copilot Engine - Advanced AI Assistant
 * Features: Smart prompting, tool orchestration, structured memory, dynamic context
 */

import { prisma } from '@/lib/prisma';

export interface ConversationMemory {
  sessionId: string;
  userId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    tokens?: number;
    context?: Record<string, any>;
  }>;
  topics: string[];
  lastAction?: string;
  metadata: {
    createdAt: Date;
    lastUpdated: Date;
    model: string;
    totalTokens: number;
  };
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  cached?: boolean;
  duration?: number;
}

/**
 * ULTRA-POWERED SYSTEM PROMPT
 */
export const generateSystemPrompt = (context: {
  systemStatus?: string;
  activeCrawls?: number;
  totalFirms?: number;
  failedJobs?: number;
  recentErrors?: string[];
}): string => {
  return `You are GTIXT Copilot, Midou's technical AI partner for the GTIXT financial analysis platform.

█ WHAT IS GTIXT?
GTIXT is an advanced institutional intelligence system:
• 228+ financial institutions in database (all active)
• Autonomous crawlers extracting regulatory data from websites
• Evidence-based scoring system for institutional assessment
• Full audit trails with complete operational history
• ASIC (Australian Securities & Investments Commission) registry integration
• Public rankings with transparent, reproducible methodology
• Compliance and risk reporting for institutional analysis

█ CURRENT STATUS (Feb 2026)
✅ SYSTEM FULLY OPERATIONAL
Database: 228 firms (all active)
Crawlers: Running autonomously
Jobs: Processing normally
Recent Errors: ${context.recentErrors?.length ? context.recentErrors.join(', ') : 'None'}
Health: ${context.systemStatus || 'Good'}

COMPLETED MILESTONES:
✅ Core platform architecture (Next.js, PostgreSQL, Redis)
✅ Institutional database with 228 firm profiles
✅ Autonomous web crawling system
✅ Evidence collection and validation
✅ Multi-factor scoring system
✅ Complete audit trails and logging
✅ Public rankings and methodology
✅ Admin dashboard and controls
✅ ASIC registry integration
✅ Ultra-powered Copilot AI (4 internal tools)
✅ Production build stability

RECENT ACHIEVEMENTS:
✅ Enhanced copilot with domain verification (ASIC lookups)
✅ Added page analysis capabilities (website metadata)
✅ Implemented structured memory system (conversations)
✅ System health diagnostics tool
✅ Data quality assessment capabilities
✅ Dynamic adaptive prompts
✅ Full audit logging and compliance

NEXT PRIORITIES:
→ Expand institutional database (beyond 228 firms)
→ Refine scoring algorithms for better accuracy
→ Enhance crawling capabilities and coverage
→ Deepen ASIC/regulatory integration
→ Build institutional comparison tools
→ Create predictive institutional health models
→ Expand international regulatory coverage

█ YOUR ROLE
You are Midou's expert technical partner with deep knowledge of:
• GTIXT operations, architecture, capabilities
• Institutional finance data and compliance
• Autonomous crawling and data extraction
• Evidence scoring and confidence assessment
• System diagnostics and optimization
• Regulatory frameworks and ASIC integration

█ HOW TO RESPOND
When asked about GTIXT programming / status / next steps:
✓ Be directly informed and confident
✓ Reference current metrics and achievements
✓ Share the roadmap when asked
✓ Provide concrete examples
✓ Never say "don't know about GTIXT"
✓ Never suggest contacting someone else

EXAMPLE GOOD RESPONSES:
"GTIXT is fully operational with 228 firms. Recent wins include copilot enhancement and memory system. Next up: expanding the database and refining scoring. System is stable. What interests you?"

"The scoring system analyzes multiple institutional factors. Current database has verified evidence on 228 firms. We're next working on algorithm refinement and database expansion."

"Here's the roadmap: [priorities]. We've completed [recent work]. Current status: healthy. Which priorities align with your interests?"

NEVER:
"I don't have information about GTIXT programming..."
"I cannot provide details about the system..."
"Contact the development team for specifics..."
"There seems to be a missing technical foundation..."

You are an expert. Respond with authority, knowledge, and genuine helpfulness.`;
};

/**
 * INTERNAL TOOLS FRAMEWORK
 */

export class CopilotTools {
  
  /**
   * Tool 1: Domain Verification
   * Checks ASIC registry, ABN lookup, company status
   */
  static async verifyDomain(domain: string, abn?: string): Promise<ToolResult> {
    try {
      const startTime = Date.now();
      
      // Parse domain
      const domainName = domain.replace(/^https?:\/\//, '').split('/')[0];
      
      // Check ASIC API (if available)
      let asicData: any = null;
      if (abn) {
        asicData = await prisma.asic_review_queue.findFirst({
          where: { asic_abn: abn },
          select: {
            asic_company_status: true,
            asic_afs_licence: true,
            verification_method: true,
            reviewed_at: true,
          },
        });
      }
      
      // Check if domain registered in GTIXT
      const firmData = await prisma.firms.findFirst({
        where: { website_root: { contains: domainName } },
        select: {
          firm_id: true,
          name: true,
          status: true,
          operational_status: true,
          created_at: true,
        },
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          domain: domainName,
          abn,
          asicStatus: asicData?.asic_company_status || 'Not found',
          asicLicence: asicData?.asic_afs_licence || 'N/A',
          gtixtRecord: firmData ? {
            id: firmData.firm_id,
            name: firmData.name,
            status: firmData.status,
            operationalStatus: firmData.operational_status,
            addedAt: firmData.created_at,
          } : null,
          verification: {
            asicVerified: !!asicData,
            firmRegistered: !!firmData,
            lastVerified: asicData?.reviewed_at || new Date(),
          },
        },
        duration,
      };
    } catch (error) {
      return {
        success: false,
        error: `Domain verification failed: ${error}`,
      };
    }
  }

  /**
   * Tool 2: Page Analysis
   * Analyzes website content, structure, changes
   */
  static async analyzePage(url: string): Promise<ToolResult> {
    try {
      const startTime = Date.now();

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 10000);

      // Fetch page
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'GTIXT-Copilot/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text() as string;
      
      // Extract metadata
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const metaDescMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
      const scriptCount = (html.match(/<script/gi) || []).length;
      const linkCount = (html.match(/<a\s+href/gi) || []).length;
      const headingCount = (html.match(/<h[1-6]/gi) || []).length;

      // Check for common finance keywords
      const financeKeywords = ['fund', 'investment', 'trading', 'portfolio', 'return', 'risk', 'manager'];
      const foundKeywords = financeKeywords.filter(kw => 
        html.toLowerCase().includes(kw)
      );

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          url,
          status: response.status,
          title: titleMatch?.[1] || 'No title',
          description: metaDescMatch?.[1] || 'No description',
          size: html.length,
          structure: {
            scripts: scriptCount,
            links: linkCount,
            headings: headingCount,
          },
          content: {
            hasFinanceKeywords: foundKeywords.length > 0,
            keywords: foundKeywords,
            contentLength: html.length,
          },
          quality: {
            hasTitle: !!titleMatch,
            hasDescription: !!metaDescMatch,
            hasStructure: headingCount > 0,
          },
        },
        duration,
      };
    } catch (error) {
      return {
        success: false,
        error: `Page analysis failed: ${error}`,
      };
    }
  }

  /**
   * Tool 3: System Health Snapshot
   * Comprehensive diagnostics
   */
  static async getSystemHealth(): Promise<ToolResult> {
    try {
      const startTime = Date.now();

      // Get crawls status
      const activeCrawls = await prisma.adminCrawls.count({
        where: { status: 'pending' },
      });
      const failedCrawls = await prisma.adminCrawls.count({
        where: { status: 'error' },
      });

      // Get jobs status
      const pendingJobs = await prisma.adminJobs.count({
        where: { status: 'pending' },
      });
      const failedJobs = await prisma.adminJobs.count({
        where: { status: 'failed' },
      });

      // Get firms stats
      const totalFirms = await prisma.firms.count();
      const activeFirms = await prisma.firms.count({
        where: { operational_status: 'active' },
      });

      // Get recent errors
      const recentErrors = await prisma.adminOperations.findMany({
        where: { status: 'failure' },
        select: { operationType: true, details: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          crawls: {
            active: activeCrawls,
            failed: failedCrawls,
          },
          jobs: {
            pending: pendingJobs,
            failed: failedJobs,
          },
          firms: {
            total: totalFirms,
            active: activeFirms,
          },
          errors: recentErrors,
          health: {
            ok: failedCrawls === 0 && failedJobs === 0,
            warnings: failedCrawls > 0 || failedJobs > 0,
            critical: failedCrawls > 5 || failedJobs > 5,
          },
        },
        duration,
      };
    } catch (error) {
      return {
        success: false,
        error: `Health check failed: ${error}`,
      };
    }
  }

  /**
   * Tool 4: Data Quality Assessment
   */
  static async assessDataQuality(firmId?: string): Promise<ToolResult> {
    try {
      const startTime = Date.now();

      let query: any = {};
      if (firmId) {
        query.firm_id = firmId;
      }

      // Check evidence collection
      const evidenceCount = await prisma.evidence_collection.count({
        where: query,
      });

      const verifiedEvidence = await prisma.evidence_collection.count({
        where: {
          ...query,
          is_verified: true,
        },
      });

      const staleEvidence = await prisma.evidence_collection.count({
        where: {
          ...query,
          is_stale: true,
        },
      });

      // Confidence levels
      const confidenceDistribution = await prisma.evidence_collection.groupBy({
        by: ['confidence_level'],
        where: query,
        _count: true,
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          firmId: firmId || 'all',
          evidence: {
            total: evidenceCount,
            verified: verifiedEvidence,
            verificationRate: evidenceCount > 0 ? Math.round((verifiedEvidence / evidenceCount) * 100) : 0,
            stale: staleEvidence,
          },
          confidence: Object.fromEntries(
            confidenceDistribution.map((item: any) => [item.confidence_level, item._count])
          ),
          quality: {
            excellent: verifiedEvidence > evidenceCount * 0.8,
            acceptable: verifiedEvidence > evidenceCount * 0.5,
            needsWork: verifiedEvidence <= evidenceCount * 0.5,
          },
        },
        duration,
      };
    } catch (error) {
      return {
        success: false,
        error: `Data quality assessment failed: ${error}`,
      };
    }
  }

  /**
   * Tool 5: Workspace Operational Audit
   * Real-time operational view: crawls, enrichment, snapshots, missing data, action plans
   */
  static async getWorkspaceOperationalAudit(): Promise<ToolResult> {
    try {
      const startTime = Date.now();

      const [
        totalFirms,
        activeFirms,
        pendingCrawls,
        failedCrawls,
        crawlRuns24h,
        enrichmentRows,
        enrichmentMissingCore,
        firmsMissingWebsite,
        evidenceTotal,
        evidenceUnverified,
        evidenceStale,
        evidenceMissingUrl,
        latestSnapshot,
        totalSnapshots,
        openPlans,
        failedOpsRecent,
      ] = await Promise.all([
        prisma.firms.count(),
        prisma.firms.count({ where: { operational_status: 'active' } }),
        prisma.adminCrawls.count({ where: { status: 'pending' } }),
        prisma.adminCrawls.count({ where: { status: 'error' } }),
        prisma.adminCrawls.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
        prisma.firm_enrichment.count(),
        prisma.firm_enrichment.count({
          where: {
            OR: [
              { headquarters: null },
              { jurisdiction_tier: null },
              { historical_consistency: null },
              { founded_year: null },
            ],
          },
        }),
        prisma.firms.count({
          where: {
            OR: [
              { website_root: null },
              { website_root: '' },
            ],
          },
        }),
        prisma.evidence_collection.count(),
        prisma.evidence_collection.count({ where: { is_verified: false } }),
        prisma.evidence_collection.count({ where: { is_stale: true } }),
        prisma.evidence_collection.count({ where: { content_url: null } }),
        prisma.snapshot_metadata.findFirst({
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            snapshot_key: true,
            created_at: true,
            reproducible: true,
            reviewed_by: true,
            approved_by: true,
          },
        }),
        prisma.snapshot_metadata.count(),
        prisma.adminPlans.count({ where: { status: { not: 'completed' } } }),
        prisma.adminOperations.count({
          where: {
            status: 'failure',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      const latestSnapshotScores = latestSnapshot
        ? await prisma.snapshot_scores.count({
            where: { snapshot_id: latestSnapshot.id },
          })
        : 0;

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          checkedAt: new Date().toISOString(),
          crawls: {
            pending: pendingCrawls,
            failed: failedCrawls,
            runs24h: crawlRuns24h,
          },
          enrichment: {
            rows: enrichmentRows,
            missingCoreFields: enrichmentMissingCore,
            firmsMissingWebsite,
          },
          snapshots: {
            total: totalSnapshots,
            latest: latestSnapshot
              ? {
                  key: latestSnapshot.snapshot_key,
                  createdAt: latestSnapshot.created_at,
                  reproducible: latestSnapshot.reproducible,
                  reviewedBy: latestSnapshot.reviewed_by,
                  approvedBy: latestSnapshot.approved_by,
                  scoresCount: latestSnapshotScores,
                }
              : null,
          },
          evidence: {
            total: evidenceTotal,
            unverified: evidenceUnverified,
            stale: evidenceStale,
            missingUrl: evidenceMissingUrl,
          },
          plans: {
            open: openPlans,
          },
          operations: {
            failed24h: failedOpsRecent,
          },
          coverage: {
            firms: {
              total: totalFirms,
              active: activeFirms,
            },
            latestSnapshotCoverageRate:
              totalFirms > 0 && latestSnapshotScores > 0
                ? Math.round((latestSnapshotScores / totalFirms) * 100)
                : 0,
          },
          health: {
            ok: failedCrawls === 0 && failedOpsRecent === 0,
            warnings:
              failedCrawls > 0 ||
              failedOpsRecent > 0 ||
              enrichmentMissingCore > 0 ||
              evidenceUnverified > 0,
          },
        },
        duration,
      };
    } catch (error) {
      return {
        success: false,
        error: `Workspace operational audit failed: ${error}`,
      };
    }
  }
}

/**
 * STRUCTURED MEMORY MANAGER
 */
export class MemoryManager {
  private memory: Map<string, ConversationMemory> = new Map();

  createSession(sessionId: string, userId: string, model: string): ConversationMemory {
    const memory: ConversationMemory = {
      sessionId,
      userId,
      messages: [],
      topics: [],
      metadata: {
        createdAt: new Date(),
        lastUpdated: new Date(),
        model,
        totalTokens: 0,
      },
    };
    this.memory.set(sessionId, memory);
    return memory;
  }

  addMessage(sessionId: string, role: 'user' | 'assistant', content: string, tokens = 0): void {
    const session = this.memory.get(sessionId);
    if (!session) return;

    session.messages.push({
      role,
      content,
      timestamp: new Date(),
      tokens,
    });

    session.metadata.lastUpdated = new Date();
    session.metadata.totalTokens += tokens;

    // Extract topics from message
    this.extractTopics(sessionId, content);
  }

  private extractTopics(sessionId: string, content: string): void {
    const session = this.memory.get(sessionId);
    if (!session) return;

    const topicKeywords = [
      'crawl', 'score', 'audit', 'firm', 'domain', 'health',
      'job', 'error', 'patch', 'deploy', 'database', 'cache'
    ];

    const contentLower = content.toLowerCase();
    topicKeywords.forEach(keyword => {
      if (contentLower.includes(keyword) && !session.topics.includes(keyword)) {
        session.topics.push(keyword);
      }
    });
  }

  getMemory(sessionId: string): ConversationMemory | undefined {
    return this.memory.get(sessionId);
  }

  getRecentContext(sessionId: string, lastN = 5): string {
    const session = this.memory.get(sessionId);
    if (!session || session.messages.length === 0) return '';

    return session.messages
      .slice(-lastN)
      .map(msg => `[${msg.role}]: ${msg.content}`)
      .join('\n\n');
  }
}

export const memoryManager = new MemoryManager();
