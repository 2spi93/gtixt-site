/**
 * GTIXT Copilot Context Provider
 * Provides dynamic context about current page, standards, and system state
 */

export interface CopilotContext {
  page?: string;
  module?: string;
  standards: GTIXTStandards;
  systemState?: SystemState;
  pageAnalysis?: PageAnalysis;
}

export interface GTIXTStandards {
  design: {
    colorPrimary: string;
    colorSecondary: string;
    philosophy: string;
    spacing: string;
    typography: string;
  };
  architecture: {
    framework: string;
    database: string;
    cache: string;
    storage: string;
    ai: string;
  };
  security: {
    authentication: string;
    authorization: string;
    audit: string;
    rateLimit: string;
  };
  quality: {
    noDestructiveActions: boolean;
    diffsRequired: boolean;
    auditTrail: boolean;
    reproductibility: boolean;
  };
}

export interface SystemState {
  activeCrawls: number;
  totalCrawls: number;
  failedJobs: number;
  alerts: number;
  activeWorkers: number;
  systemStatus: 'ok' | 'warning' | 'critical';
}

export interface PageAnalysis {
  url: string;
  components: string[];
  issues?: string[];
  suggestions?: string[];
}

/**
 * GTIXT Standards - Design & Architecture
 */
export const GTIXT_STANDARDS: GTIXTStandards = {
  design: {
    colorPrimary: 'Turquoise Deep (#00D1C1)',
    colorSecondary: 'Blue Institutional (#1A73E8)',
    philosophy: 'Institutionnel, Premium, Audit-ready, Brutaliste moderne',
    spacing: 'Cohérent, grille structurée, pas de tassement',
    typography: 'Inter pour UI, IBM Plex Mono pour code',
  },
  architecture: {
    framework: 'Next.js 13.5.6 (App Router) + TypeScript',
    database: 'PostgreSQL 16 + Prisma ORM',
    cache: 'Redis pour rate limiting et sessions',
    storage: 'MinIO pour snapshots et artefacts',
    ai: 'Ollama local + OpenAI API',
  },
  security: {
    authentication: 'Session-based avec JWT tokens + TOTP 2FA',
    authorization: 'RBAC 4 roles (admin/auditor/lead_reviewer/reviewer)',
    audit: 'Audit trail complet sur toutes actions admin',
    rateLimit: '50 req/h par IP, quota tokens journalier',
  },
  quality: {
    noDestructiveActions: true,
    diffsRequired: true,
    auditTrail: true,
    reproductibility: true,
  },
};

/**
 * Get context for current page
 */
export function getPageContext(url: string): PageAnalysis | null {
  const path = url.replace(/^https?:\/\/[^\/]+/, '');

  // Copilot page
  if (path.includes('/admin/copilot')) {
    return {
      url: path,
      components: [
        'Sidebar (System Status, Quick Actions, File Explorer, History)',
        'Main Chat Container (Messages Stream)',
        'Prompt Input Zone',
        'Header with controls',
      ],
      issues: [],
      suggestions: [
        'Le layout est maintenant centré avec max-width',
        'Les actions rapides ne sont plus dupliquées',
        'Le chat a un cadre clair avec borders',
      ],
    };
  }

  // Audit page
  if (path.includes('/admin/audit')) {
    return {
      url: path,
      components: [
        'Timeline view',
        'Table view',
        'Analytics view',
        'Filters (user, action, status, dates)',
        'CSV export',
      ],
      suggestions: ['Audit trail complet avec authentification'],
    };
  }

  // Users management
  if (path.includes('/admin/users')) {
    return {
      url: path,
      components: ['User CRUD', 'Role management', 'Password reset', 'Deactivation'],
      suggestions: ['Admin-only access avec RBAC'],
    };
  }

  return null;
}

/**
 * Build complete context for Copilot
 */
export function buildCopilotContext(
  url?: string,
  systemState?: SystemState
): CopilotContext {
  const context: CopilotContext = {
    standards: GTIXT_STANDARDS,
  };

  if (url) {
    context.page = url;
    const pageAnalysis = getPageContext(url);
    if (pageAnalysis) {
      context.pageAnalysis = pageAnalysis;
    }
  }

  if (systemState) {
    context.systemState = systemState;
  }

  return context;
}

/**
 * Format context for system message (compact, non-intrusive)
 */
export function formatContextForPrompt(context: CopilotContext): string {
  const parts: string[] = [];

  // System state (only if critical)
  if (context.systemState) {
    const state = context.systemState;
    if (state.systemStatus !== 'ok' || state.failedJobs > 0 || state.alerts > 0) {
      parts.push(
        `STATUS: ${state.systemStatus.toUpperCase()} | Crawls: ${state.activeCrawls}/${state.totalCrawls} | Erreurs: ${state.failedJobs} | Alertes: ${state.alerts}`
      );
    }
  }

  // Page context (only if available)
  if (context.pageAnalysis) {
    parts.push(`PAGE: ${context.pageAnalysis.url}`);
    if (context.pageAnalysis.issues && context.pageAnalysis.issues.length > 0) {
      parts.push(`ISSUES: ${context.pageAnalysis.issues.join(', ')}`);
    }
  }

  return parts.join('\n');
}
