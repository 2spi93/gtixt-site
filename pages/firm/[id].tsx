/**
 * Firm Detail Page with Complete Profile
 * Shows comprehensive firm analysis with all metrics, evidence, and audit trail
 */

import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Layout from '../../components/Layout';
import SeoHead from '../../components/SeoHead';
import PageNavigation from '../../components/PageNavigation';
import AgentEvidence from '../../components/AgentEvidence';
import MetricsDetailPanel from '../../components/MetricsDetailPanel';
import FirmDetailsSection from '../../components/FirmDetailsSection';
import ComplianceFlags from '../../components/ComplianceFlags';
import SnapshotHistory from '../../components/SnapshotHistory';
import IntegrityAuditTrail from '../../components/IntegrityAuditTrail';
import InterpretationLayer from '../../components/InterpretationLayer';
import ComparativePositioning from '../../components/ComparativePositioning';
import { useTranslation } from '../../lib/useTranslationStub';
import {
  parseNumber,
  normalizeScore,
  normalizeNaRate,
  normalizeConfidence,
  formatConfidenceLabel,
  pickFirst,
  normalizeFirmName,
  inferJurisdictionFromUrl,
  normalizePercentile,
} from '../../lib/dataUtils';
import type { NormalizedFirm as Firm, SnapshotMeta, HistoryRecord } from '../../lib/types';

interface FirmDetailProps {
  initialFirm: Firm | null;
  initialSnapshot: SnapshotMeta | null;
  initialHistory: HistoryRecord[];
  initialFirmId: string | null;
}

const normalizeFirmPayload = (firmData: any): Firm => ({
  firm_id: pickFirst(firmData?.firm_id, firmData?.id, '') as string,
  firm_name: pickFirst(firmData?.firm_name, firmData?.name, firmData?.brand_name, 'Unknown') as string,
  name: pickFirst(firmData?.name, firmData?.firm_name, firmData?.brand_name, 'Unknown') as string,
  score_0_100: normalizeScore(
    pickFirst(
      firmData?.score_0_100,
      firmData?.score,
      firmData?.integrity_score,
      firmData?.metric_scores?.score_0_100,
      firmData?.metric_scores?.score
    )
  ) ?? 0,
  confidence: normalizeConfidence(
    pickFirst(
      firmData?.confidence,
      firmData?.metric_scores?.confidence,
      firmData?.status === 'watchlist' ? 'low' : 
      firmData?.status === 'candidate' ? 'medium' : undefined
    )
  ) ?? 0.75,
  na_rate: normalizeNaRate(firmData?.na_rate) ?? 0,
  status: pickFirst(firmData?.status, firmData?.status_gtixt, firmData?.gtixt_status),
  website_root: pickFirst(
    firmData?.website_root,
    firmData?.website,
    firmData?.site,
    firmData?.homepage
  ),
  logo_url: pickFirst(firmData?.logo_url, firmData?.logo) ?? null,
  jurisdiction: pickFirst(
    firmData?.jurisdiction,
    firmData?.registered_jurisdiction,
    inferJurisdictionFromUrl(
      pickFirst(firmData?.website_root, firmData?.website, firmData?.homepage) as string | undefined
    )
  ),
  founded_year: parseNumber(
    pickFirst(firmData?.founded_year, firmData?.year_founded, firmData?.year_established)
  ),
  founded: pickFirst(firmData?.founded, firmData?.founded_date),
        headquarters: pickFirst(
          firmData?.headquarters,
          firmData?.hq_location,
          firmData?.jurisdiction,
          firmData?.registered_jurisdiction
        ),
  jurisdiction_tier: pickFirst(firmData?.jurisdiction_tier, firmData?.tier),
  model_type: pickFirst(firmData?.model_type, firmData?.business_model),
  payout_frequency: pickFirst(firmData?.payout_frequency, firmData?.frequency),
  max_drawdown_rule: parseNumber(pickFirst(firmData?.max_drawdown_rule, firmData?.drawdown)),
  daily_drawdown_rule: parseNumber(pickFirst(firmData?.daily_drawdown_rule, firmData?.daily_drawdown)),
  rule_changes_frequency: pickFirst(firmData?.rule_changes_frequency, firmData?.rules_change_freq),
  executive_summary: pickFirst(firmData?.executive_summary, firmData?.summary),
  audit_verdict: pickFirst(firmData?.audit_verdict, firmData?.verdict),
  agent_verdict: pickFirst(firmData?.agent_verdict),
  oversight_gate_verdict: pickFirst(firmData?.oversight_gate_verdict, firmData?.gate_verdict),
  pillar_scores: firmData?.pillar_scores,
  metric_scores: firmData?.metric_scores,
  payout_reliability: parseNumber(firmData?.payout_reliability),
  risk_model_integrity: parseNumber(firmData?.risk_model_integrity),
  operational_stability: parseNumber(firmData?.operational_stability),
  historical_consistency: parseNumber(firmData?.historical_consistency),
  snapshot_id: pickFirst(firmData?.snapshot_id, firmData?.snapshot_key),
  na_policy_applied: typeof firmData?.na_policy_applied === 'boolean' ? firmData.na_policy_applied : undefined,
  percentile_vs_universe: normalizePercentile(firmData?.percentile_vs_universe),
  percentile_vs_model_type: normalizePercentile(firmData?.percentile_vs_model_type),
  percentile_vs_jurisdiction: normalizePercentile(firmData?.percentile_vs_jurisdiction),
});

export default function FirmDetail({
  initialFirm,
  initialSnapshot,
  initialHistory,
  initialFirmId,
}: FirmDetailProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;

  const [firm, setFirm] = useState<Firm | null>(initialFirm);
  const [snapshot, setSnapshot] = useState<SnapshotMeta | null>(initialSnapshot);
  const [history, setHistory] = useState<HistoryRecord[]>(initialHistory);
  const [loading, setLoading] = useState(!initialFirm);
  const [error, setError] = useState<string | null>(null);

  const resolveFirmId = useCallback((): string | undefined => {
    if (initialFirmId) return initialFirmId;
    const queryId = Array.isArray(id) ? id[0] : id;
    if (queryId) return queryId;
    if (typeof window === 'undefined') return undefined;
    const path = window.location.pathname.replace(/\/+$/, '');
    const parts = path.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    const prev = parts[parts.length - 2];
    if (prev === 'firm' && last) return last;
    return undefined;
  }, [id]);

  const fetchFirmDetails = useCallback(async (options?: { silent?: boolean }) => {
    try {
      const firmId = resolveFirmId();
      if (!firmId) {
        setError(t('firmDetail.notFound'));
        setLoading(false);
        return;
      }
      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);
      const response = await fetch(`/api/firm?id=${encodeURIComponent(firmId)}`);
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      const data = await response.json();
      const firmData = data.firm || data;
      const normalizedFirm = normalizeFirmPayload(firmData);
      setFirm(normalizedFirm);
      setSnapshot(data.snapshot || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load firm');
      console.error('Failed to fetch firm:', err);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [resolveFirmId, t]);

  const fetchHistory = useCallback(async () => {
    try {
      const firmId = resolveFirmId();
      if (!firmId) return;
      const response = await fetch(`/api/firm-history?id=${encodeURIComponent(firmId)}`);
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data.history)) return;
      const mapped = data.history.map((item: any) => ({
        snapshot_key: item.snapshot_id || item.snapshot_key || '—',
        score: Number(item.score_0_100 ?? item.score ?? 0) || 0,
        date: item.date,
        confidence: normalizeConfidence(item.confidence),
      }));
      setHistory(mapped);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, [resolveFirmId]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!resolveFirmId()) {
      setError(t('firmDetail.notFound'));
      setLoading(false);
      return;
    }
    if (initialFirm) {
      fetchFirmDetails({ silent: true });
    } else {
      fetchFirmDetails();
    }
    fetchHistory();
  }, [router.isReady, resolveFirmId, fetchFirmDetails, fetchHistory, initialFirm, t]);

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t('firmDetail.loading')}</p>
        </div>
        <style jsx>{`
          .loading-container {
            text-align: center;
            padding: 4rem;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #0066cc;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </Layout>
    );
  }

  if (!firm) {
    return (
      <Layout>
        <div className="error-container">
          <h1>{t('firmDetail.notFound')}</h1>
          <p>{error || t('firmDetail.notFoundDescription')}</p>
          <button onClick={() => router.push('/rankings')}>
            {t('firmDetail.backToFirms')}
          </button>
        </div>
        <style jsx>{`
          .error-container {
            text-align: center;
            padding: 4rem;
          }
          button {
            margin-top: 1rem;
            padding: 0.75rem 1.5rem;
            background: #0066cc;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          button:hover {
            background: #0052a3;
          }
        `}</style>
      </Layout>
    );
  }

  const scoreValue = firm.score_0_100 ?? 0;
  const confidenceValue = firm.confidence ?? 0.85;
  const naRateValue = firm.na_rate ?? 0;
  const statusValue = firm.status || 'unknown';

  return (
    <>
      <SeoHead
        title={`${firm.name} - GTIXT`}
        description={`Detailed analysis and agent verification for ${firm.name}`}
      />
      <Layout>
        {/* Navigation principale */}
        <PageNavigation />
        
        <div className="firm-detail">
          <div className="firm-header">
            <div className="firm-header-left">
              {firm.logo_url && (
                <Image src={firm.logo_url} alt={firm.name} className="firm-logo" width={60} height={60} />
              )}
              <div className="firm-title">
                <div className="title-row">
                  <h1>{firm.name}</h1>
                  <span className={`status-badge status-${statusValue}`}>{statusValue}</span>
                </div>
                <p className="firm-subtitle">
                  Founded {firm.founded_year || '—'} • {firm.jurisdiction || '—'}
                </p>
              </div>
            </div>
            <div className="firm-header-right">
              <div className={`score-badge score-${
                scoreValue < 40 ? 'insufficient' : 
                scoreValue < 60 ? 'review' : 
                'institutional'
              }`}>
                <div className="score-number">{scoreValue}<span className="score-max">/100</span></div>
                <div className="score-category">
                  {scoreValue < 40 ? '🔴 Insufficient' : 
                   scoreValue < 60 ? '🟡 Under Review' : 
                   '🟢 Institutional Grade'}
                </div>
                <div className="score-label">GTIXT Score</div>
                <div className="score-bar">
                  <div className="score-bar-fill" style={{ width: `${scoreValue}%` }}></div>
                  <div className="score-bar-threshold"></div>
                </div>
              </div>
              {firm.website_root && (
                <a
                  href={firm.website_root}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="website-button"
                >
                  Visit Website
                </a>
              )}
            </div>
          </div>

          <MetricsDetailPanel metrics={firm} />

          <FirmDetailsSection firm={firm} snapshot={snapshot || undefined} />

          <ComplianceFlags
            naRate={naRateValue}
            score={scoreValue}
            confidence={confidenceValue}
          />

          <SnapshotHistory history={history} />

          <IntegrityAuditTrail
            firmId={firm.firm_id}
            snapshotId={snapshot?.snapshot_key || snapshot?.object || '—'}
            snapshotObject={snapshot?.object}
            sha256={snapshot?.sha256 || '—'}
            oversightGateVerdict={
              firm.oversight_gate_verdict ||
              firm.audit_verdict ||
              firm.agent_verdict ||
              '—'
            }
            naPolicy={naRateValue !== undefined && naRateValue !== null ? `${naRateValue}% NA rate` : '—'}
          />

          <InterpretationLayer
            score={scoreValue}
            confidence={confidenceValue}
            methodologyNotes={firm.executive_summary}
          />

          <ComparativePositioning
            score={scoreValue}
            modelType={firm.model_type}
            jurisdiction={firm.jurisdiction || firm.jurisdiction_tier}
          />

          <AgentEvidence firmId={firm.firm_id} />
        </div>

        <style jsx>{`
          .firm-detail {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
          }

          .firm-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 2px solid #e5e5e5;
            gap: 1.5rem;
          }

          .firm-header-left {
            display: flex;
            align-items: center;
            gap: 1.5rem;
          }

          .firm-logo {
            height: 60px;
            width: auto;
            object-fit: contain;
          }

          .firm-title h1 {
            margin: 0;
            font-size: 2rem;
            color: #1a1a1a;
          }

          .title-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
          }

          .status-ranked,
          .status-active {
            background: #d1f4e0;
            color: #0f5132;
          }

          .status-candidate {
            background: #fff3cd;
            color: #856404;
          }

          .status-unknown {
            background: #f0f0f0;
            color: #666;
          }

          .firm-subtitle {
            margin: 0.25rem 0 0 0;
            color: #666;
            font-size: 0.95rem;
          }

          .firm-header-right {
            display: flex;
            align-items: center;
            gap: 2rem;
          }

          .score-badge {
            color: white;
            border-radius: 16px;
            padding: 1.75rem 2.25rem;
            text-align: center;
            min-width: 180px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            position: relative;
            overflow: hidden;
          }

          /* Gradients identiques au diagramme */
          .score-insufficient {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
          }

          .score-review {
            background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
          }

          .score-institutional {
            background: linear-gradient(135deg, #28a745 0%, #20c997 50%, #6f42c1 100%);
          }

          .score-number {
            font-size: 2.8rem;
            font-weight: 700;
            line-height: 1;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }

          .score-max {
            font-size: 1.2rem;
            font-weight: 500;
            opacity: 0.85;
          }

          .score-category {
            font-size: 0.85rem;
            font-weight: 600;
            margin-top: 0.5rem;
            letter-spacing: 0.5px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          }

          .score-label {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-top: 0.25rem;
            opacity: 0.8;
          }

          .score-bar {
            margin-top: 1rem;
            height: 6px;
            background: rgba(255,255,255,0.3);
            border-radius: 3px;
            position: relative;
            overflow: hidden;
          }

          .score-bar-fill {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            background: white;
            border-radius: 3px;
            box-shadow: 0 0 8px rgba(255,255,255,0.5);
            transition: width 0.6s ease;
          }

          .score-bar-threshold {
            position: absolute;
            left: 60%;
            top: -2px;
            width: 2px;
            height: 10px;
            background: rgba(255,255,255,0.9);
            border-radius: 1px;
          }

          .score-bar-threshold::before {
            content: '60';
            position: absolute;
            top: -18px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.65rem;
            font-weight: 600;
            opacity: 0.85;
            white-space: nowrap;
          }

          .website-button {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: #0066cc;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: background 0.3s;
          }

          .website-button:hover {
            background: #0052a3;
          }

          @media (max-width: 768px) {
            .firm-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 1rem;
            }

            .firm-header-right {
              flex-direction: column;
              width: 100%;
              align-items: stretch;
            }

            .website-button {
              width: 100%;
              text-align: center;
            }
          }
        `}</style>
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<FirmDetailProps> = async (context) => {
  const idParam = context.params?.id;
  const firmId = Array.isArray(idParam) ? idParam[0] : idParam || null;

  if (!firmId) {
    return {
      props: {
        initialFirm: null,
        initialSnapshot: null,
        initialHistory: [],
        initialFirmId: null,
      },
    };
  }

  const protocol = (context.req.headers['x-forwarded-proto'] as string) || 'http';
  const host = context.req.headers.host || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  try {
    const response = await fetch(`${baseUrl}/api/firm?id=${encodeURIComponent(firmId)}`);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    const data = await response.json();
    const normalizedFirm = data?.firm ? normalizeFirmPayload(data.firm) : null;
    // Remove undefined values for Next.js serialization
    const serializedFirm = normalizedFirm ? JSON.parse(JSON.stringify(normalizedFirm)) : null;
    return {
      props: {
        initialFirm: serializedFirm,
        initialSnapshot: data?.snapshot || null,
        initialHistory: [],
        initialFirmId: firmId,
      },
    };
  } catch {
    return {
      props: {
        initialFirm: null,
        initialSnapshot: null,
        initialHistory: [],
        initialFirmId: firmId,
      },
    };
  }
};
