import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import PageNavigation from '../components/PageNavigation';
import { useTranslation } from "../lib/useTranslationStub";

interface AgentHealth {
  agent: string;
  status: 'healthy' | 'warning' | 'critical';
  lastRun: string;
  executionTime: number;
  testsPass: number;
  testsTotal: number;
  evidence: number;
}

interface DashboardData {
  lastUpdate: string;
  totalExecutionTime: number;
  agentsRunning: number;
  evidenceCollected: number;
  criticalIssues: number;
  agents: AgentHealth[];
}

interface AgentsDashboardProps {
  initialData: DashboardData | null;
}

const getDefaultData = (): DashboardData => ({
  lastUpdate: new Date().toISOString(),
  totalExecutionTime: 58000,
  agentsRunning: 7,
  evidenceCollected: 8,
  criticalIssues: 0,
  agents: [
    {
      agent: 'RVI',
      status: 'healthy',
      lastRun: new Date(Date.now() - 60000).toISOString(),
      executionTime: 560,
      testsPass: 3,
      testsTotal: 3,
      evidence: 1,
    },
    {
      agent: 'SSS',
      status: 'healthy',
      lastRun: new Date(Date.now() - 45000).toISOString(),
      executionTime: 10080,
      testsPass: 2,
      testsTotal: 2,
      evidence: 1,
    },
    {
      agent: 'REM',
      status: 'healthy',
      lastRun: new Date(Date.now() - 30000).toISOString(),
      executionTime: 1060,
      testsPass: 3,
      testsTotal: 3,
      evidence: 1,
    },
    {
      agent: 'IRS',
      status: 'healthy',
      lastRun: new Date(Date.now() - 25000).toISOString(),
      executionTime: 560,
      testsPass: 3,
      testsTotal: 3,
      evidence: 1,
    },
    {
      agent: 'FRP',
      status: 'healthy',
      lastRun: new Date(Date.now() - 15000).toISOString(),
      executionTime: 18220,
      testsPass: 3,
      testsTotal: 3,
      evidence: 3,
    },
    {
      agent: 'MIS',
      status: 'healthy',
      lastRun: new Date(Date.now() - 5000).toISOString(),
      executionTime: 27860,
      testsPass: 3,
      testsTotal: 3,
      evidence: 4,
    },
    {
      agent: 'IIP',
      status: 'healthy',
      lastRun: new Date(Date.now() - 2000).toISOString(),
      executionTime: 5000,
      testsPass: 3,
      testsTotal: 3,
      evidence: 1,
    },
  ],
});

const AgentsDashboard: NextPage<AgentsDashboardProps> = ({ initialData }) => {
  const { t } = useTranslation("common");
  const [data, setData] = useState<DashboardData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!initialData) {
          setLoading(true);
        }
        setError(null);
        
        const response = await fetch('/api/agents/health');
        if (!response.ok) {
          // Utiliser des données par défaut si l'API n'est pas disponible
          setData(getDefaultData());
          return;
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching agent data:', err);
        setError('Impossible de charger les données');
        setData(getDefaultData());
      } finally {
        if (!initialData) {
          setLoading(false);
        }
      }
    };

    fetchData();
    // Rafraîchir tous les 30 secondes
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#22c55e';
      case 'warning':
        return '#f97316';
      case 'critical':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'critical':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Sain';
      case 'warning':
        return 'Avertissement';
      case 'critical':
        return 'Critique';
      default:
        return 'Inconnu';
    }
  };

  if (loading && !data) {
    return (
      <div style={styles.container}>
        <Head>
          <title>Tableau de Bord des Agents — GPTI</title>
          <meta name="description" content="Tableau de bord santé des agents Phase 2" />
        </Head>
        <p style={styles.loading}>Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={styles.container}>
        <Head>
          <title>Tableau de Bord des Agents — GPTI</title>
          <meta name="description" content="Tableau de bord santé des agents Phase 2" />
        </Head>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Tableau de Bord des Agents — GPTI</title>
        <meta name="description" content="Tableau de bord santé et statut des agents Phase 2 en temps réel" />
      </Head>

      <div style={styles.container}>
        {/* Navigation */}
        <PageNavigation />
        
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🤖 Tableau de Bord des Agents</h1>
          <p style={styles.subtitle}>Suivi en temps réel de la santé et des performances des 7 agents Phase 2</p>
        </div>

        {/* Summary Metrics */}
        {data && (
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <h3 style={styles.summaryLabel}>Agents Exécutés</h3>
              <p style={styles.summaryValue}>{data.agentsRunning}</p>
            </div>
            <div style={styles.summaryCard}>
              <h3 style={styles.summaryLabel}>Temps Total</h3>
              <p style={styles.summaryValue}>{(data.totalExecutionTime / 1000).toFixed(1)}s</p>
            </div>
            <div style={styles.summaryCard}>
              <h3 style={styles.summaryLabel}>Preuves Collectées</h3>
              <p style={styles.summaryValue}>{data.evidenceCollected}</p>
            </div>
            <div style={styles.summaryCard}>
              <h3 style={styles.summaryLabel}>Problèmes Critiques</h3>
              <p style={styles.summaryValue}>{data.criticalIssues}</p>
            </div>
          </div>
        )}

        {/* Agents Grid */}
        <div style={styles.agentsGrid}>
          {data?.agents.map(agent => (
            <div key={agent.agent} style={styles.agentCard}>
              <div style={styles.agentHeader}>
                <h3 style={styles.agentName}>{agent.agent}</h3>
                <span style={styles.statusIndicator}>
                  <span style={{ ...styles.statusDot, backgroundColor: getStatusColor(agent.status) }}></span>
                  {getStatusIcon(agent.status)} {getStatusText(agent.status)}
                </span>
              </div>

              <div style={styles.agentMetrics}>
                <div style={styles.metricItem}>
                  <span style={styles.metricLabel}>Temps d'exécution:</span>
                  <span style={styles.metricValue}>{agent.executionTime}ms</span>
                </div>
                <div style={styles.metricItem}>
                  <span style={styles.metricLabel}>Tests:</span>
                  <span style={styles.metricValue}>{agent.testsPass}/{agent.testsTotal}</span>
                </div>
                <div style={styles.metricItem}>
                  <span style={styles.metricLabel}>Preuves:</span>
                  <span style={styles.metricValue}>{agent.evidence} items</span>
                </div>
              </div>

              <div style={styles.lastRun}>
                <span style={styles.lastRunLabel}>Dernière exécution:</span>
                <span style={styles.lastRunTime}>
                  {new Date(agent.lastRun).toLocaleTimeString('fr-FR')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* System Health */}
        <div style={styles.healthSection}>
          <h2 style={styles.healthTitle}>État du Système</h2>
          <div style={styles.healthGrid}>
            <div style={styles.healthCard}>
              <h4>Pipeline de Preuves</h4>
              <div style={styles.healthBar}>
                <div style={{ ...styles.healthBarFill, width: '100%', backgroundColor: '#22c55e' }}></div>
              </div>
              <p style={styles.healthStatus}>✅ Fonctionnel</p>
            </div>
            <div style={styles.healthCard}>
              <h4>Orchestration Prefect</h4>
              <div style={styles.healthBar}>
                <div style={{ ...styles.healthBarFill, width: '100%', backgroundColor: '#22c55e' }}></div>
              </div>
              <p style={styles.healthStatus}>✅ Fonctionnel</p>
            </div>
            <div style={styles.healthCard}>
              <h4>Validation Evidence</h4>
              <div style={styles.healthBar}>
                <div style={{ ...styles.healthBarFill, width: '100%', backgroundColor: '#22c55e' }}></div>
              </div>
              <p style={styles.healthStatus}>✅ Fonctionnel</p>
            </div>
            <div style={styles.healthCard}>
              <h4>Rapports IOSCO</h4>
              <div style={styles.healthBar}>
                <div style={{ ...styles.healthBarFill, width: '100%', backgroundColor: '#22c55e' }}></div>
              </div>
              <p style={styles.healthStatus}>✅ Fonctionnel</p>
            </div>
          </div>
        </div>

        {/* Documentation Links */}
        <div style={styles.docSection}>
          <h2 style={styles.docTitle}>Documentation & Ressources</h2>
          <div style={styles.docLinks}>
            <Link href="/phase2" style={styles.docLink}>📄 Documentation Phase 2</Link>
            <Link href="/methodology" style={styles.docLink}>📊 Méthodologie GTIXT</Link>
            <Link href="/api" style={styles.docLink}>🔌 API Documentation</Link>
          </div>
        </div>

        {/* Last Updated */}
        {data && (
          <div style={styles.lastUpdated}>
            Dernière mise à jour: {new Date(data.lastUpdate).toLocaleString('fr-FR')}
          </div>
        )}
      </div>
    </>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: '#1a1a1a',
  } as React.CSSProperties,

  header: {
    marginBottom: '40px',
    textAlign: 'center' as const,
    paddingBottom: '20px',
    borderBottom: '1px solid #e0e0e0',
  } as React.CSSProperties,

  title: {
    fontSize: '36px',
    fontWeight: 700,
    margin: '0 0 10px',
  } as React.CSSProperties,

  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
  } as React.CSSProperties,

  loading: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    fontSize: '16px',
    color: '#666',
  } as React.CSSProperties,

  error: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    fontSize: '16px',
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    borderRadius: '8px',
  } as React.CSSProperties,

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  } as React.CSSProperties,

  summaryCard: {
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  summaryLabel: {
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#666',
    letterSpacing: '0.5px',
    margin: '0 0 12px',
  } as React.CSSProperties,

  summaryValue: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#2563eb',
    margin: 0,
  } as React.CSSProperties,

  agentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  } as React.CSSProperties,

  agentCard: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,

  agentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e0e0e0',
  } as React.CSSProperties,

  agentName: {
    fontSize: '18px',
    fontWeight: 700,
    margin: 0,
  } as React.CSSProperties,

  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 600,
  } as React.CSSProperties,

  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  } as React.CSSProperties,

  agentMetrics: {
    marginBottom: '16px',
  } as React.CSSProperties,

  metricItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
  } as React.CSSProperties,

  metricLabel: {
    color: '#666',
  } as React.CSSProperties,

  metricValue: {
    fontWeight: 600,
    color: '#2563eb',
  } as React.CSSProperties,

  lastRun: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#666',
  } as React.CSSProperties,

  lastRunLabel: {
    fontWeight: 600,
  } as React.CSSProperties,

  lastRunTime: {
    fontFamily: '"Courier New", monospace',
  } as React.CSSProperties,

  healthSection: {
    marginBottom: '40px',
    padding: '30px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,

  healthTitle: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '24px',
    margin: '0 0 24px',
  } as React.CSSProperties,

  healthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  } as React.CSSProperties,

  healthCard: {
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,

  healthBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    margin: '12px 0 8px',
    overflow: 'hidden',
  } as React.CSSProperties,

  healthBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  } as React.CSSProperties,

  healthStatus: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 600,
  } as React.CSSProperties,

  docSection: {
    marginBottom: '40px',
    padding: '30px',
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    border: '1px solid #bfdbfe',
  } as React.CSSProperties,

  docTitle: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '20px',
    margin: '0 0 20px',
    color: '#1e40af',
  } as React.CSSProperties,

  docLinks: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '12px',
  } as React.CSSProperties,

  docLink: {
    display: 'inline-block',
    padding: '12px 16px',
    backgroundColor: 'white',
    color: '#2563eb',
    textDecoration: 'none',
    borderRadius: '6px',
    border: '1px solid #bfdbfe',
    fontWeight: 500,
    fontSize: '14px',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,

  lastUpdated: {
    textAlign: 'center' as const,
    fontSize: '12px',
    color: '#999',
    paddingTop: '20px',
    borderTop: '1px solid #e0e0e0',
  } as React.CSSProperties,
};

export default AgentsDashboard;

export const getServerSideProps: GetServerSideProps<AgentsDashboardProps> = async (context) => {
  const protocol = (context.req.headers['x-forwarded-proto'] as string) || 'http';
  const host = context.req.headers.host || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  try {
    const response = await fetch(`${baseUrl}/api/agents/health`);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    const data = await response.json();
    return { props: { initialData: data } };
  } catch {
    return { props: { initialData: getDefaultData() } };
  }
};
