import { useState } from 'react';
import Head from 'next/head';
import InstitutionalHeader from '../components/InstitutionalHeader';
import Footer from '../components/Footer';

interface Evidence {
  pillar: string;
  type: string;
  description: string;
  confidence: string;
  timestamp: string;
  source: string;
}

interface PillarData {
  pillar_id: string;
  pillar_name: string;
  weight: number;
  score: number;
  evidence: Evidence[];
}

export default function EvidenceInspector() {
  const [firmId, setFirmId] = useState('');
  const [snapshotDate, setSnapshotDate] = useState('2026-02-24');
  const [loading, setLoading] = useState(false);
  const [evidence, setEvidence] = useState<PillarData[] | null>(null);
  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/evidence/${firmId}?snapshot_date=${snapshotDate}`
      );
      const data = await response.json();

      if (data.success) {
        setEvidence(data.evidence_by_pillar);
        setTotalScore(data.total_score);
      } else {
        setError(data.message || 'Error loading evidence');
      }
    } catch (err) {
      setError('Failed to fetch evidence');
    } finally {
      setLoading(false);
    }
  };

  const confidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <>
      <Head>
        <title>Evidence Inspector — GTIXT</title>
        <meta
          name="description"
          content="Inspect evidence and data supporting GTIXT scores"
        />
      </Head>

      <InstitutionalHeader
        breadcrumbs={[{ label: 'Evidence Inspector', href: '/evidence-inspector' }]}
      />

      <main style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.eyebrow}>EVIDENCE INSPECTOR</div>
          <h1 style={styles.h1}>Inspect Evidence Behind Every Score</h1>
          <p style={styles.lead}>
            View the evidence captured for any firm's GTIXT score. See exactly what data was used,
            when it was captured, and how confident each piece of evidence is.
          </p>
        </section>

        {/* Search Form */}
        <section style={styles.section}>
          <form onSubmit={handleSearch} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Firm ID or Name</label>
              <input
                type="text"
                value={firmId}
                onChange={(e) => setFirmId(e.target.value)}
                placeholder="e.g., example-prop-firm"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Snapshot Date</label>
              <input
                type="date"
                value={snapshotDate}
                onChange={(e) => setSnapshotDate(e.target.value)}
                style={styles.input}
              />
            </div>

            <button type="submit" disabled={!firmId || loading} style={styles.button}>
              {loading ? 'Searching...' : 'Inspect Evidence'}
            </button>
          </form>

          {error && <div style={styles.error}>{error}</div>}
        </section>

        {/* Results */}
        {evidence && totalScore && (
          <section style={styles.section}>
            <div style={styles.scoreCard}>
              <div style={styles.scoreValue}>{totalScore}</div>
              <div style={styles.scoreLabel}>GTIXT Score</div>
              <div style={styles.scoreDate}>as of {snapshotDate}</div>
            </div>

            <div style={styles.pillarGrid}>
              {evidence.map((pillar) => (
                <div key={pillar.pillar_id} style={styles.pillarCard}>
                  <div style={styles.pillarHeader}>
                    <h3 style={styles.pillarName}>{pillar.pillar_name}</h3>
                    <div style={styles.pillarScore}>{(pillar.score * 100).toFixed(1)}%</div>
                  </div>
                  <div style={styles.pillarWeight}>Weight: {(pillar.weight * 100).toFixed(0)}%</div>

                  <div style={styles.evidenceList}>
                    {pillar.evidence.map((ev, idx) => (
                      <div key={idx} style={styles.evidenceItem}>
                        <div style={styles.evidenceHeader}>
                          <span style={styles.evidenceType}>{ev.type}</span>
                          <span
                            style={{
                              ...styles.confidenceBadge,
                              backgroundColor: confidenceColor(ev.confidence),
                            }}
                          >
                            {ev.confidence}
                          </span>
                        </div>
                        <p style={styles.evidenceDescription}>{ev.description}</p>
                        <div style={styles.evidenceFooter}>
                          <span style={styles.evidenceSource}>Source: {ev.source}</span>
                          <span style={styles.evidenceTime}>
                            {new Date(ev.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Info Section */}
        <section style={styles.section}>
          <div style={styles.infoBox}>
            <h3 style={styles.infoTitle}>How to Read Evidence</h3>
            <ul style={styles.infoList}>
              <li>
                <strong>Pillar Score:</strong> 0-100 scale based on captured evidence
              </li>
              <li>
                <strong>Confidence Levels:</strong>
                <br />- High: Evidence from official regulatory sources
                <br />- Medium: Multiple sources or qualified analysis
                <br />- Low: Limited evidence or inference
              </li>
              <li>
                <strong>Timestamp:</strong> When evidence was captured or published
              </li>
              <li>
                <strong>Weighted Score:</strong> Pillar score × weight = contribution to final score
              </li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '80px 20px',
  },
  hero: {
    marginBottom: '80px',
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#7FB3FF',
    marginBottom: '16px',
  },
  h1: {
    fontSize: '48px',
    fontWeight: '700',
    marginBottom: '24px',
    color: '#ffffff',
  },
  lead: {
    fontSize: '18px',
    color: '#a0a9c9',
    maxWidth: '600px',
    margin: '0 auto',
  },
  section: {
    marginBottom: '60px',
  },
  form: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr auto',
    gap: '20px',
    padding: '40px',
    backgroundColor: '#0f1428',
    borderRadius: '12px',
    border: '1px solid #1e293b',
    marginBottom: '40px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#cbd5e1',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#1e293b',
    color: '#ffffff',
    fontSize: '14px',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#7FB3FF',
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-end',
  },
  error: {
    padding: '16px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  scoreCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px',
    borderRadius: '12px',
    textAlign: 'center',
    marginBottom: '40px',
  },
  scoreValue: {
    fontSize: '64px',
    fontWeight: '700',
    color: '#ffffff',
  },
  scoreLabel: {
    fontSize: '18px',
    color: '#e0e7ff',
    marginTop: '12px',
  },
  scoreDate: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)',
    marginTop: '8px',
  },
  pillarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '24px',
  },
  pillarCard: {
    backgroundColor: '#0f1428',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '24px',
  },
  pillarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  pillarName: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0,
  },
  pillarScore: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#7FB3FF',
  },
  pillarWeight: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '16px',
  },
  evidenceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  evidenceItem: {
    backgroundColor: '#1e293b',
    padding: '12px',
    borderRadius: '8px',
    borderLeft: '3px solid #7FB3FF',
  },
  evidenceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  evidenceType: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#94a3b8',
  },
  confidenceBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#ffffff',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  evidenceDescription: {
    fontSize: '14px',
    color: '#cbd5e1',
    margin: '8px 0',
  },
  evidenceFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#64748b',
  },
  evidenceSource: {
    fontWeight: '600',
  },
  evidenceTime: {},
  infoBox: {
    backgroundColor: '#0f1428',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '32px',
  },
  infoTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '16px',
  },
  infoList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    fontSize: '15px',
    color: '#cbd5e1',
    lineHeight: '1.6',
  },
};
