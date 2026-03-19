'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import InfoTooltip from '@/components/ui/InfoTooltip'

type Scope = 'public' | 'admin'

type Briefing = {
  title: string
  microcopy: string
  help: string
  chips: string[]
}

const PUBLIC_BRIEFINGS: Record<string, Briefing> = {
  '/': {
    title: 'Market Integrity Overview',
    microcopy: 'Use this page as your executive snapshot before drilling into firms, risk and methodology details.',
    help: 'Executive summary view: score pulse, data freshness and direct links to detailed intelligence modules.',
    chips: ['Executive Snapshot', 'Live Pulse', 'Navigation Hub'],
  },
  '/analytics': {
    title: 'Institutional Analytics Terminal',
    microcopy: 'Review trend and regime context first, then validate assumptions against rankings and firm profiles.',
    help: 'Designed for comparative intelligence, not execution. Cross-check regime, stability and risk before any decision.',
    chips: ['Comparative Intelligence', 'Regime Context', 'Signal Validation'],
  },
  '/api-docs': {
    title: 'Public API Contract',
    microcopy: 'Reference payloads and endpoint behavior from this page before wiring integrations.',
    help: 'API examples are aligned to public data routes and should be validated against your own rate and cache policy.',
    chips: ['Contract Clarity', 'Payload Examples', 'Integration Ready'],
  },
  '/best-prop-firms': {
    title: 'Top Firm Leaderboard',
    microcopy: 'A concise ranking page focused on immediate shortlist identification.',
    help: 'Use this page for first-pass screening, then continue with full rankings and firm-level evidence pages.',
    chips: ['Quick Shortlist', 'Score-Driven', 'Actionable'],
  },
  '/data': {
    title: 'Data Access Center',
    microcopy: 'Compare dataset purpose and freshness before exporting records into downstream workflows.',
    help: 'Each dataset serves a distinct monitoring use case: snapshot, ranking, risk distribution and integrity controls.',
    chips: ['Dataset Catalog', 'Freshness', 'Export Workflow'],
  },
  '/firms': {
    title: 'Firm Directory',
    microcopy: 'Filter the universe by jurisdiction and risk profile before opening a firm intelligence page.',
    help: 'Directory is optimized for discovery. Detailed evidence and history are on each firm profile.',
    chips: ['Universe Coverage', 'Filter-First', 'Drilldown Ready'],
  },
  '/ftmo-review': {
    title: 'Focused Firm Review',
    microcopy: 'This review template highlights score context, payout behavior and operational stability in one view.',
    help: 'Single-firm review pages are compact by design and should be paired with comparative pages for full context.',
    chips: ['Single-Firm Lens', 'Payout Context', 'Stability Signals'],
  },
  '/fundingpips-review': {
    title: 'Focused Firm Review',
    microcopy: 'This review template highlights score context, payout behavior and operational stability in one view.',
    help: 'Single-firm review pages are compact by design and should be paired with comparative pages for full context.',
    chips: ['Single-Firm Lens', 'Payout Context', 'Stability Signals'],
  },
  '/index': {
    title: 'Index Snapshot',
    microcopy: 'Read this page as the mid-level bridge between top-line overview and detailed pages.',
    help: 'The index aggregates KPI, distribution and sector perspective so teams can align on shared situational context.',
    chips: ['Mid-Level View', 'KPI Synthesis', 'Sector Context'],
  },
  '/industry-map': {
    title: 'Ecosystem Intelligence Map',
    microcopy: 'Use filters to isolate the cluster you need before opening firm-level intelligence.',
    help: 'The map is exploratory. Confirm key conclusions against firm profiles and rankings before escalation.',
    chips: ['Graph Intelligence', 'Cluster Filters', 'Exploration'],
  },
  '/methodology': {
    title: 'Scoring Methodology',
    microcopy: 'Keep this page as the reference baseline for interpreting every score and ranking output.',
    help: 'Methodology is the institutional anchor: pillar logic, weighting and interpretation conventions are documented here.',
    chips: ['Reference Baseline', 'Weighting Logic', 'Interpretability'],
  },
  '/prop-firm-payouts': {
    title: 'Payout Reliability Leaderboard',
    microcopy: 'Use this page when payout continuity is the primary decision constraint.',
    help: 'Payout-focused ranking should be triangulated with regulatory and stability context for final conclusions.',
    chips: ['Payout Focus', 'Reliability Lens', 'Comparison'],
  },
  '/radar': {
    title: 'Risk Early Warning Radar',
    microcopy: 'Track active events and watchlist pressure before they become broad systemic shifts.',
    help: 'Radar highlights directional risk pressure; use evidence pages for root-cause confirmation.',
    chips: ['Early Warning', 'Watchlist Pressure', 'Escalation Cues'],
  },
  '/rankings': {
    title: 'Institutional Rankings',
    microcopy: 'Apply filters first, then sort to isolate candidates that match your governance constraints.',
    help: 'Rankings provide broad comparability; individual pages supply deeper evidence and temporal context.',
    chips: ['Comparability', 'Filter Discipline', 'Transparent Ordering'],
  },
  '/research': {
    title: 'Research Intelligence Feed',
    microcopy: 'Use tags and search to narrow insights to the market regime you are reviewing.',
    help: 'Research entries provide qualitative context that complements quantitative scoring and monitoring signals.',
    chips: ['Qualitative Layer', 'Searchable', 'Regime Context'],
  },
  '/simulator': {
    title: 'Scenario Simulator',
    microcopy: 'Test assumptions here before translating outcomes into policy or capital decisions.',
    help: 'Simulation output is scenario guidance and should be interpreted with confidence ranges, not as certainty.',
    chips: ['Scenario Testing', 'Probability Framing', 'Decision Support'],
  },
  '/style-guide': {
    title: 'Design Reference System',
    microcopy: 'This page documents approved presentation tokens for institutional consistency.',
    help: 'Use style guide references to keep micro-copy hierarchy, contrast and component rhythm consistent.',
    chips: ['Design Governance', 'Token Reference', 'Consistency'],
  },
  '/verify': {
    title: 'Integrity Verification',
    microcopy: 'Validate hash and source alignment here whenever provenance is questioned.',
    help: 'Verification confirms cryptographic consistency between published artifacts and source records.',
    chips: ['Provenance Control', 'Hash Match', 'Audit Trail'],
  },
}

const ADMIN_BRIEFINGS: Record<string, Briefing> = {
  '/admin': {
    title: 'Operations Dashboard',
    microcopy: 'Start here to assess global status before triggering any operational action.',
    help: 'Dashboard is your command summary: health signals, activity state and direct escalation paths.',
    chips: ['Control Overview', 'Operational Pulse', 'Escalation Ready'],
  },
  '/admin/agents': {
    title: 'Agent Fleet Control',
    microcopy: 'Check policy state and runtime health before changing any agent behavior.',
    help: 'Use this section to supervise agent orchestration, permissions and execution confidence.',
    chips: ['Fleet Governance', 'Runtime Safety', 'Policy-Aware'],
  },
  '/admin/agents/policies': {
    title: 'Agent Policy Registry',
    microcopy: 'Treat this page as the source of truth for allowed autonomous behaviors.',
    help: 'Policy changes should follow least-privilege and traceable approval before activation.',
    chips: ['Source of Truth', 'Least Privilege', 'Traceable Changes'],
  },
  '/admin/ai-assistant': {
    title: 'AI Assistant Console',
    microcopy: 'Review context quality and guardrails before deploying assistant workflows.',
    help: 'Assistant actions must remain explainable and auditable across prompts, tools and outputs.',
    chips: ['Guardrailed AI', 'Explainability', 'Operational Support'],
  },
  '/admin/audit': {
    title: 'Audit Command Center',
    microcopy: 'Use this page to verify decisions, controls and policy changes with evidence continuity.',
    help: 'Audit view is designed for chronological traceability and compliance reporting readiness.',
    chips: ['Evidence Continuity', 'Chronological Trace', 'Compliance Ready'],
  },
  '/admin/autonomous-lab': {
    title: 'Autonomous Lab',
    microcopy: 'Run controlled experiments with explicit safety gates and post-run evidence review.',
    help: 'Laboratory mode is for supervised experimentation, never for blind production execution.',
    chips: ['Controlled Testing', 'Safety Gates', 'Post-Run Evidence'],
  },
  '/admin/copilot': {
    title: 'Copilot Operations',
    microcopy: 'Use copilot actions as assisted operations with human validation checkpoints.',
    help: 'Copilot recommendations are decision support artifacts and should be reviewed before enforcement.',
    chips: ['Assisted Ops', 'Human Validation', 'Traceable Actions'],
  },
  '/admin/crawls': {
    title: 'Crawl Supervision',
    microcopy: 'Confirm source quality and cadence before launching broad collection cycles.',
    help: 'Crawl reliability depends on source trust, schedule discipline and pipeline observability.',
    chips: ['Source Quality', 'Cadence Control', 'Pipeline Visibility'],
  },
  '/admin/discovery': {
    title: 'Discovery Intake',
    microcopy: 'Prioritize candidate signals here before promotion into verified workflows.',
    help: 'Discovery stage captures uncertain signals and prepares evidence for downstream validation.',
    chips: ['Signal Intake', 'Triage', 'Promotion Flow'],
  },
  '/admin/execution': {
    title: 'Execution Desk',
    microcopy: 'Track active workflows and ensure safeguards remain active during execution.',
    help: 'Execution controls should maintain rollback paths and clear operator accountability.',
    chips: ['Workflow Runtime', 'Safeguards', 'Accountability'],
  },
  '/admin/firms': {
    title: 'Firm Administration',
    microcopy: 'Create or update firm records with complete metadata and evidence pointers.',
    help: 'Firm administration quality directly impacts rankings, alerts and downstream analytics.',
    chips: ['Data Quality', 'Record Integrity', 'Downstream Impact'],
  },
  '/admin/health': {
    title: 'Platform Health',
    microcopy: 'Use this page to confirm system readiness before and after major operations.',
    help: 'Health checks should include service availability, integration freshness and queue status.',
    chips: ['Readiness', 'Freshness', 'Operational Safety'],
  },
  '/admin/info': {
    title: 'System Information',
    microcopy: 'Reference versions, environment details and integration states from this panel.',
    help: 'This section supports diagnostics and controlled change planning for operations teams.',
    chips: ['Diagnostic Context', 'Versioning', 'Change Planning'],
  },
  '/admin/integrity': {
    title: 'Integrity Controls',
    microcopy: 'Monitor consistency checks and confidence thresholds before releasing outputs.',
    help: 'Integrity controls prevent drift and ensure institutional trust in published intelligence.',
    chips: ['Consistency Gates', 'Confidence Thresholds', 'Trust Controls'],
  },
  '/admin/integrity/calibration': {
    title: 'Integrity Calibration',
    microcopy: 'Tune thresholds carefully and keep calibration decisions documented.',
    help: 'Calibration should balance sensitivity and false positives while preserving explainability.',
    chips: ['Threshold Tuning', 'Explainability', 'Decision Log'],
  },
  '/admin/jobs': {
    title: 'Job Orchestration',
    microcopy: 'Supervise job queue health and runtime outcomes before triggering retries.',
    help: 'Retry decisions should consider root cause and dependency freshness, not only status flags.',
    chips: ['Queue Health', 'Runtime Outcomes', 'Controlled Retry'],
  },
  '/admin/logs': {
    title: 'Operational Logs',
    microcopy: 'Use scoped filters to isolate anomalies quickly and preserve investigation context.',
    help: 'Logs are evidence artifacts; maintain correlation across job id, route and timestamp.',
    chips: ['Anomaly Triage', 'Correlation', 'Evidence Trace'],
  },
  '/admin/monitoring': {
    title: 'Monitoring Hub',
    microcopy: 'Observe pressure signals continuously and escalate before service quality degrades.',
    help: 'Monitoring should combine technical telemetry, data freshness and workflow latency cues.',
    chips: ['Continuous Watch', 'Pressure Signals', 'Early Escalation'],
  },
  '/admin/operations': {
    title: 'Operations Control',
    microcopy: 'Plan operational sequences with explicit ownership and rollback paths.',
    help: 'Reliable operations require procedural discipline, measurable checkpoints and clear ownership.',
    chips: ['Runbook Discipline', 'Ownership', 'Rollback Ready'],
  },
  '/admin/planning': {
    title: 'Planning Board',
    microcopy: 'Define delivery sequence and dependencies before committing execution slots.',
    help: 'Planning quality reduces operational surprises and improves cross-team synchronization.',
    chips: ['Dependency Clarity', 'Delivery Sequence', 'Coordination'],
  },
  '/admin/review': {
    title: 'Review Workbench',
    microcopy: 'Validate outcomes against policy and evidence before final approval.',
    help: 'Review stage is the control checkpoint between raw outputs and trusted publication.',
    chips: ['Control Checkpoint', 'Policy Match', 'Approval Discipline'],
  },
  '/admin/security': {
    title: 'Security Governance',
    microcopy: 'Treat this page as the command layer for identity and access controls.',
    help: 'Security posture improves through least privilege, rotation cadence and traceable changes.',
    chips: ['Identity Control', 'Least Privilege', 'Traceability'],
  },
  '/admin/security/2fa': {
    title: 'Two-Factor Security',
    microcopy: 'Enforce and verify second-factor coverage for all privileged roles.',
    help: '2FA compliance is a baseline control; monitor enrollment drift and remediation lead time.',
    chips: ['2FA Coverage', 'Privileged Roles', 'Compliance Baseline'],
  },
  '/admin/security/password': {
    title: 'Password Security',
    microcopy: 'Monitor policy adherence and remediation backlog for credential hygiene.',
    help: 'Credential controls should align complexity, expiration and breach response standards.',
    chips: ['Credential Hygiene', 'Policy Adherence', 'Remediation'],
  },
  '/admin/sessions': {
    title: 'Session Oversight',
    microcopy: 'Track active sessions and revoke risky contexts without delay.',
    help: 'Session oversight supports rapid containment when account behavior deviates from baseline.',
    chips: ['Active Sessions', 'Containment', 'Risk Response'],
  },
  '/admin/users': {
    title: 'User Administration',
    microcopy: 'Manage role assignments with explicit rationale and audit visibility.',
    help: 'Identity governance depends on clear role boundaries and periodic access review.',
    chips: ['Role Governance', 'Access Review', 'Audit Visibility'],
  },
  '/admin/validation': {
    title: 'Validation Pipeline',
    microcopy: 'Confirm all validation gates before publishing decisions or analytics outputs.',
    help: 'Validation enforces quality boundaries and protects downstream consumers from noisy artifacts.',
    chips: ['Gate Enforcement', 'Quality Boundary', 'Publication Safety'],
  },
  '/admin/webgl-monitor': {
    title: 'WebGL Runtime Monitor',
    microcopy: 'Track rendering telemetry and degraded performance scenarios in real time.',
    help: 'WebGL monitor data helps stabilize visual intelligence modules and canary decisions.',
    chips: ['Telemetry', 'Runtime Stability', 'Canary Inputs'],
  },
}

const defaultBriefing = (scope: Scope): Briefing => ({
  title: scope === 'public' ? 'GTIXT Intelligence Page' : 'GTIXT Admin Page',
  microcopy:
    scope === 'public'
      ? 'Use this page with methodology and verification references for institution-grade decisions.'
      : 'Use this admin page with role-based controls and evidence traceability in mind.',
  help:
    scope === 'public'
      ? 'Public views are decision-support surfaces and should be triangulated with source evidence.'
      : 'Admin views are operational controls and should remain auditable and policy-aligned.',
  chips: scope === 'public' ? ['Institutional Context', 'Transparent Evidence'] : ['Operational Control', 'Traceability'],
})

function resolveBriefing(pathname: string, scope: Scope): Briefing {
  if (scope === 'public') {
    if (pathname.startsWith('/firms/')) {
      return {
        title: 'Firm Intelligence Profile',
        microcopy: 'Assess score context, payout profile and risk posture before making comparative conclusions.',
        help: 'Firm detail pages contain deeper evidence and should be compared with market-level pages before final decisions.',
        chips: ['Deep Evidence', 'Firm-Level Context', 'Comparative Review'],
      }
    }
    return PUBLIC_BRIEFINGS[pathname] ?? defaultBriefing(scope)
  }

  if (pathname === '/admin/login') {
    return {
      title: 'Secure Access',
      microcopy: 'Authentication page for authorized operators only.',
      help: 'Use approved credentials and second-factor verification where required.',
      chips: ['Restricted Access', 'Identity Verification'],
    }
  }

  return ADMIN_BRIEFINGS[pathname] ?? defaultBriefing(scope)
}

export default function RouteBriefingBanner({ scope }: { scope: Scope }) {
  const pathname = usePathname() || '/'

  const briefing = useMemo(() => resolveBriefing(pathname, scope), [pathname, scope])

  return (
    <section className="route-briefing-banner" aria-label="Route briefing and guidance">
      <div className="route-briefing-header">
        <h2 className="route-briefing-title">{briefing.title}</h2>
        <InfoTooltip content={briefing.help} label="Route guidance" />
      </div>
      <p className="route-briefing-copy">{briefing.microcopy}</p>
      <div className="route-briefing-chip-row">
        {briefing.chips.map((chip) => (
          <span key={chip} className="route-briefing-chip">
            {chip}
          </span>
        ))}
      </div>
    </section>
  )
}
