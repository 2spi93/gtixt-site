/**
 * Verification Widget for Firm Tearsheet
 * Displays FCA and Sanctions verification results from Phase 3 API
 */

import { useState, useEffect } from 'react';
import {
  verifyFirm,
  checkAPIHealth,
  formatVerificationStatus,
  formatRiskScore,
  CombinedVerificationResult,
} from '../lib/verification-api';

interface VerificationWidgetProps {
  firmName: string;
  country?: string;
}

export default function VerificationWidget({ firmName, country }: VerificationWidgetProps) {
  const [verification, setVerification] = useState<CombinedVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVerification() {
      setLoading(true);
      setError(null);

      // Check if API is available
      try {
        const healthy = await checkAPIHealth();
        setApiAvailable(healthy);

        if (!healthy) {
          setLoading(false);
          // Don't set error in dev mode when API is simply not running
          if (process.env.NODE_ENV !== 'development') {
            setError('Verification API unavailable');
          }
          return;
        }

        // Fetch verification
        const result = await verifyFirm(firmName, country);
        if (result) {
          setVerification(result);
        } else {
          setError('Failed to verify firm');
        }
      } catch (err) {
        console.error('Verification widget error:', err);
        setApiAvailable(false);
      }

      setLoading(false);
    }

    if (firmName) {
      loadVerification();
    }
  }, [firmName, country]);

  if (!apiAvailable && !loading) {
    // In dev mode, hide the widget completely if API is not available
    if (process.env.NODE_ENV === 'development') {
      return null;
    }

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.icon}>🔒</span>
          <h3 style={styles.title}>Verification Status</h3>
        </div>
        <div style={styles.unavailable}>
          <p style={styles.unavailableText}>
            ⚠️ Verification service currently unavailable
          </p>
          <p style={styles.unavailableSubtext}>
            Real-time FCA and sanctions screening requires the verification API to be running.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.icon}>🔒</span>
          <h3 style={styles.title}>Verification Status</h3>
        </div>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Verifying firm...</p>
        </div>
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.icon}>🔒</span>
          <h3 style={styles.title}>Verification Status</h3>
        </div>
        <div style={styles.error}>
          <p style={styles.errorText}>❌ {error || 'Verification failed'}</p>
        </div>
      </div>
    );
  }

  const overallStatusStyle = formatVerificationStatus(verification.overallStatus);
  const riskScoreStyle = formatRiskScore(verification.riskScore);
  const fcaStatusStyle = formatVerificationStatus(verification.fca.status);
  const sanctionsStatusStyle = formatVerificationStatus(verification.sanctions.status);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>🔒</span>
        <h3 style={styles.title}>Verification Status</h3>
        <span style={{ ...styles.badge, backgroundColor: overallStatusStyle.color }}>
          {overallStatusStyle.icon} {overallStatusStyle.text}
        </span>
      </div>

      {/* Overall Summary */}
      <div style={styles.summary}>
        <div style={styles.summaryItem}>
          <span style={styles.label}>Overall Status:</span>
          <span style={{ ...styles.value, color: overallStatusStyle.color }}>
            {overallStatusStyle.text}
          </span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.label}>Risk Score:</span>
          <span style={{ ...styles.value, color: riskScoreStyle.color }}>
            {riskScoreStyle.text}
          </span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.label}>Verified:</span>
          <span style={styles.value}>
            {new Date(verification.timestamp).toLocaleString()}
          </span>
        </div>
      </div>

      {/* FCA Verification */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionIcon}>🏛️</span>
          <h4 style={styles.sectionTitle}>FCA Registry</h4>
          <span style={{ ...styles.statusBadge, backgroundColor: fcaStatusStyle.color }}>
            {fcaStatusStyle.icon} {fcaStatusStyle.text}
          </span>
        </div>
        {verification.fca.status === 'AUTHORIZED' && (
          <div style={styles.details}>
            {verification.fca.frn && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>FRN:</span>
                <span style={styles.detailValue}>{verification.fca.frn}</span>
              </div>
            )}
            {verification.fca.authorizationDate && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Authorized:</span>
                <span style={styles.detailValue}>
                  {new Date(verification.fca.authorizationDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {verification.fca.permissions && verification.fca.permissions.length > 0 && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Permissions:</span>
                <div style={styles.permissions}>
                  {verification.fca.permissions.map((perm, idx) => (
                    <span key={idx} style={styles.permission}>{perm}</span>
                  ))}
                </div>
              </div>
            )}
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Confidence:</span>
              <span style={styles.detailValue}>
                {Math.round(verification.fca.confidence * 100)}%
              </span>
            </div>
          </div>
        )}
        {verification.fca.status === 'NOT_FOUND' && (
          <p style={styles.notFound}>Firm not found in FCA registry</p>
        )}
      </div>

      {/* Sanctions Screening */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionIcon}>⚖️</span>
          <h4 style={styles.sectionTitle}>Sanctions Screening</h4>
          <span style={{ ...styles.statusBadge, backgroundColor: sanctionsStatusStyle.color }}>
            {sanctionsStatusStyle.icon} {sanctionsStatusStyle.text}
          </span>
        </div>
        <div style={styles.details}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Matches Found:</span>
            <span style={styles.detailValue}>{verification.sanctions.matches}</span>
          </div>
          {verification.sanctions.entities && verification.sanctions.entities.length > 0 && (
            <div style={styles.matchesList}>
              <span style={styles.detailLabel}>Entities:</span>
              {verification.sanctions.entities.map((entity, idx) => (
                <div key={idx} style={styles.matchItem}>
                  <div style={styles.matchName}>{entity.name}</div>
                  <div style={styles.matchDetails}>
                    <span style={styles.matchBadge}>{entity.list}</span>
                    <span style={styles.matchBadge}>{entity.matchType}</span>
                    <span style={styles.matchScore}>
                      {Math.round(entity.score * 100)}% match
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Response Time */}
      <div style={styles.footer}>
        <span style={styles.footerText}>
          ⚡ Verified in {verification.duration}ms
        </span>
        <span style={styles.footerText}>
          🔄 Phase 3 API integration
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(0, 209, 193, 0.3)',
    borderRadius: '8px',
    padding: '24px',
    marginTop: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  icon: {
    fontSize: '24px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: '#fff',
    flex: 1,
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#000',
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '6px',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  value: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
  },
  section: {
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  sectionIcon: {
    fontSize: '20px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    flex: 1,
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#000',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '6px 0',
  },
  detailLabel: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
    minWidth: '120px',
  },
  detailValue: {
    fontSize: '14px',
    color: '#fff',
    fontWeight: 500,
  },
  permissions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  permission: {
    padding: '2px 8px',
    backgroundColor: 'rgba(0, 209, 193, 0.2)',
    border: '1px solid rgba(0, 209, 193, 0.4)',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#00D1C1',
    fontFamily: 'monospace',
  },
  notFound: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
    margin: 0,
  },
  matchesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  },
  matchItem: {
    padding: '8px 12px',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    border: '1px solid rgba(255, 107, 107, 0.3)',
    borderRadius: '4px',
  },
  matchName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#FF6B6B',
    marginBottom: '4px',
  },
  matchDetails: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  matchBadge: {
    padding: '2px 6px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
  },
  matchScore: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    flexWrap: 'wrap',
    gap: '8px',
  },
  footerText: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    gap: '12px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(0, 209, 193, 0.2)',
    borderTop: '3px solid #00D1C1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
  },
  error: {
    padding: '20px',
    textAlign: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: '14px',
  },
  unavailable: {
    padding: '20px',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    border: '1px solid rgba(255, 149, 0, 0.3)',
    borderRadius: '6px',
  },
  unavailableText: {
    color: '#FF9500',
    fontSize: '14px',
    fontWeight: 600,
    margin: '0 0 8px 0',
  },
  unavailableSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '12px',
    margin: 0,
  },
};
