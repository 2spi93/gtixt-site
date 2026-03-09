import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { TypeBadge } from "../components/TypeBadge";
import { useTypesData, getTypeForFirm } from "../lib/useTypesData";

interface Firm {
  firm_id?: string;
  name?: string;
  firm_name?: string;
  score?: number;
  score_0_100?: number;
  model_type?: string;
  jurisdiction?: string;
  status?: string;
  gtixt_status?: string;
  confidence?: string | number;
  data_completeness?: number;
  data_badge?: string;
}

interface UniverseSegment {
  category: 'core' | 'infrastructure' | 'institutional';
  categoryLabel: string;
  description: string;
  firms: Firm[];
  expectedSize: string;
  color: string;
  icon: string;
}

const UNIVERSE_SEGMENTS = {
  core: {
    category: 'core',
    categoryLabel: 'Retail firms - Prop Firms Retail Funded',
    description: 'Dedicated retail prop firms offering funded trader programs (challenge/evaluation model)',
    expectedSize: '75-100 firms',
    color: '#1E88E5',
    icon: '📊',
    keywords: ['FTMO', 'FundedNext', 'The5ers', 'Topstep', 'Apex']
  },
  infrastructure: {
    category: 'infrastructure',
    categoryLabel: '🏗️ Infrastructure - B2B Support Services',
    description: 'Technology & services that support prop firms (brokers B2B, risk engines, payment rails)',
    expectedSize: '10-20 firms',
    color: '#00897B',
    icon: '🔧',
    keywords: ['broker', 'payment', 'risk', 'analytics', 'platform']
  },
  institutional: {
    category: 'institutional',
    categoryLabel: '🏢 Institutional Trading - Separate Index',
    description: 'Market makers, quant firms, hedge funds (NOT retail-focused)',
    expectedSize: '10-25 firms',
    color: '#7A5CFF',
    icon: '📈',
    keywords: ['market maker', 'citadel', 'jump', 'drw', 'wintermute']
  }
};

const classifyFirm = (firm: Firm): 'core' | 'infrastructure' | 'institutional' => {
  const name = (firm.name || firm.firm_name || '').toLowerCase();
  const modelType = (firm.model_type || '').toLowerCase();
  
  // Institutional patterns
  const institutionalPatterns = [
    'citadel', 'jump crypto', 'drw', 'wintermute', 'tower research',
    'jane street', 'optiver', 'imc', 'two sigma', 'quantlab',
    'akuna capital', 'xtx markets', 'market maker', 'hedge fund',
    'flow traders', 'sig trading', 'hrt', 'hudson river'
  ];
  
  for (const pattern of institutionalPatterns) {
    if (name.includes(pattern) || modelType.includes(pattern)) {
      return 'institutional';
    }
  }
  
  // Infrastructure patterns
  const infrastructurePatterns = [
    'broker', 'payment', 'risk engine', 'analytics', 'platform',
    'exchange', 'clearinghouse'
  ];
  
  for (const pattern of infrastructurePatterns) {
    if (name.includes(pattern) || modelType.includes(pattern)) {
      return 'infrastructure';
    }
  }
  
  // Default: Core retail prop firm
  return 'core';
};

export default function RankingsOptimized() {
  const [allFirms, setAllFirms] = useState<Firm[]>([]);
  const [segments, setSegments] = useState<UniverseSegment[]>([]);
  const [activeSegment, setActiveSegment] = useState<'core' | 'infrastructure' | 'institutional' | 'all'>('core');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFirms = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/firms/?limit=500', { cache: 'no-store' });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        
        const firms = (data.firms || []) as Firm[];
        setAllFirms(firms);

        // Classify and segment
        const coreSegment: UniverseSegment = {
          category: 'core',
          categoryLabel: UNIVERSE_SEGMENTS.core.categoryLabel,
          description: UNIVERSE_SEGMENTS.core.description,
          expectedSize: UNIVERSE_SEGMENTS.core.expectedSize,
          color: UNIVERSE_SEGMENTS.core.color,
          icon: UNIVERSE_SEGMENTS.core.icon,
          firms: firms.filter(f => classifyFirm(f) === 'core')
        };

        const infrastructureSegment: UniverseSegment = {
          category: 'infrastructure',
          categoryLabel: UNIVERSE_SEGMENTS.infrastructure.categoryLabel,
          description: UNIVERSE_SEGMENTS.infrastructure.description,
          expectedSize: UNIVERSE_SEGMENTS.infrastructure.expectedSize,
          color: UNIVERSE_SEGMENTS.infrastructure.color,
          icon: UNIVERSE_SEGMENTS.infrastructure.icon,
          firms: firms.filter(f => classifyFirm(f) === 'infrastructure')
        };

        const institutionalSegment: UniverseSegment = {
          category: 'institutional',
          categoryLabel: UNIVERSE_SEGMENTS.institutional.categoryLabel,
          description: UNIVERSE_SEGMENTS.institutional.description,
          expectedSize: UNIVERSE_SEGMENTS.institutional.expectedSize,
          color: UNIVERSE_SEGMENTS.institutional.color,
          icon: UNIVERSE_SEGMENTS.institutional.icon,
          firms: firms.filter(f => classifyFirm(f) === 'institutional')
        };

        setSegments([coreSegment, infrastructureSegment, institutionalSegment]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFirms();
  }, []);

  return (
    <>
      <Head>
        <title>GTIXT Index - Prop Firms Universe</title>
        <meta name="description" content="GTIXT Index: 3 universes of prop firms (Core Retail, Infrastructure, Institutional)" />
      </Head>

      <div style={styles.container}>
        {/* Hero */}
        <section style={styles.hero}>
          <h1 style={styles.h1}>🌍 GTIXT Universe Index</h1>
          <p style={styles.lead}>
            Complete coverage of prop firms retail, infrastructure services, and institutional trading firms
          </p>
        </section>

        {/* Universe Overview */}
        <section style={styles.overviewSection}>
          <h2 style={styles.sectionTitle}>The GTIXT 3-Universe Model</h2>
          <p style={styles.sectionSubtitle}>
            GTIXT measures the economy of retail-funded proprietary trading. The index is structured in 3 distinct universes:
          </p>

          <div style={styles.universeCarousel}>
            {segments.map((segment) => (
              <button
                key={segment.category}
                onClick={() => setActiveSegment(segment.category)}
                style={{
                  ...styles.universeCard,
                  ...(activeSegment === segment.category ? styles.universeCardActive : {}),
                  borderLeftColor: segment.color
                }}
              >
                <div style={styles.universeIcon}>{segment.icon}</div>
                <div style={styles.universeTitle}>{segment.categoryLabel.split(' - ')[0]}</div>
                <div style={styles.universeCount}>
                  {segment.firms.length} firms
                  <br />
                  <small>{segment.expectedSize}</small>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Main Content */}
        {isLoading ? (
          <div style={styles.loading}>Loading firms...</div>
        ) : error ? (
          <div style={styles.error}>{error}</div>
        ) : activeSegment === 'all' ? (
          // Show summary of all universes
          <div>
            {segments.map((segment) => (
              <UniverseSection key={segment.category} segment={segment} />
            ))}
          </div>
        ) : (
          // Show active segment
          segments.map((segment) =>
            activeSegment === segment.category ? (
              <UniverseSection key={segment.category} segment={segment} expanded={true} />
            ) : null
          )
        )}
      </div>
    </>
  );
}

function UniverseSection({ segment, expanded = false }: { segment: UniverseSegment; expanded?: boolean }) {
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score');
  const { types } = useTypesData();

  const sortedFirms = [...segment.firms].sort((a, b) => {
    if (sortBy === 'score') {
      return (b.score_0_100 || b.score || 0) - (a.score_0_100 || a.score || 0);
    } else {
      return ((a.name || a.firm_name) || '').localeCompare((b.name || b.firm_name) || '');
    }
  });

  return (
    <section style={{...styles.universeSection, display: expanded ? 'block' : 'none'}}>
      <div style={styles.universeHeader}>
        <div>
          <h2 style={{...styles.universeTitle, color: segment.color}}>
            {segment.categoryLabel}
          </h2>
          <p style={styles.universeDescription}>{segment.description}</p>
          <div style={styles.universeStats}>
            <span>📊 {segment.firms.length} firms</span>
            <span>📈 Target: {segment.expectedSize}</span>
            <span>✅ {Math.round((segment.firms.length / parseInt(segment.expectedSize?.split('-')[1] || '100')) * 100)}% filled</span>
          </div>
        </div>
      </div>

      {segment.firms.length > 0 ? (
        <>
          {/* Controls */}
          <div style={styles.controls}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'score' | 'name')}
              style={styles.select}
            >
              <option value="score">Sort by Score</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>

          {/* Table */}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Firm Name</th>
                  <th style={styles.th}>Model Type</th>
                  <th style={styles.th}>Type A/B/C</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>Jurisdiction</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedFirms.map((firm, idx) => (
                  <tr key={firm.firm_id || idx} style={styles.row}>
                    <td style={styles.td}>{idx + 1}</td>
                    <td style={styles.tdName}>
                      <strong>{firm.firm_name || firm.name || 'Unknown'}</strong>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.modelBadge}>{firm.model_type || 'Unknown'}</span>
                    </td>
                    <td style={styles.td}>
                      {(() => {
                        const typeData = getTypeForFirm(firm.firm_name || firm.name, firm.firm_id, types || {});
                        if (!typeData?.firm_type) return '—';

                        return (
                          <TypeBadge
                            type={typeData.firm_type as 'A' | 'B' | 'C' | 'INSTITUTIONAL'}
                            confidence={typeData.type_confidence}
                            size="small"
                          />
                        );
                      })()}
                    </td>
                    <td style={styles.tdScore}>
                      <span style={getScoreStyle(firm.score_0_100 || firm.score || 0)}>
                        {(firm.score_0_100 || firm.score || 0).toFixed(1)}
                      </span>
                    </td>
                    <td style={styles.td}>{firm.jurisdiction || '—'}</td>
                    <td style={styles.td}>
                      <Link
                        href={`/firm/${encodeURIComponent(firm.firm_id || firm.firm_name || '')}`}
                        style={styles.viewBtn}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={styles.noResults}>
          No firms in this universe yet. Expected: {segment.expectedSize}
        </div>
      )}
    </section>
  );
}

function getScoreStyle(score: number) {
  const baseStyle = {
    fontWeight: 'bold',
    padding: '4px 8px',
    borderRadius: '4px',
    display: 'inline-block',
  };

  if (score >= 75) {
    return { ...baseStyle, backgroundColor: '#E3F2FD', color: '#1565C0' };
  } else if (score >= 60) {
    return { ...baseStyle, backgroundColor: '#E0F2F1', color: '#00695C' };
  } else if (score >= 45) {
    return { ...baseStyle, backgroundColor: '#FFF3E0', color: '#E65100' };
  } else {
    return { ...baseStyle, backgroundColor: '#FFEBEE', color: '#C62828' };
  }
}

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,
  hero: {
    textAlign: 'center' as const,
    marginBottom: '60px',
  },
  h1: {
    fontSize: '40px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#1a1a1a',
  },
  lead: {
    fontSize: '18px',
    color: '#666',
    maxWidth: '600px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#1a1a1a',
  },
  sectionSubtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px',
  },
  overviewSection: {
    marginBottom: '60px',
  },
  universeCarousel: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  } as React.CSSProperties,
  universeCard: {
    padding: '24px',
    border: '2px solid #eee',
    borderLeftWidth: '6px',
    borderRadius: '8px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'left' as const,
  },
  universeCardActive: {
    backgroundColor: '#f5f5f5',
    borderColor: '#1E88E5',
    boxShadow: '0 4px 12px rgba(30,136,229,0.15)',
  } as React.CSSProperties,
  universeIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  universeTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  universeCount: {
    fontSize: '14px',
    color: '#666',
  },
  universeSection: {
    marginBottom: '60px',
    padding: '40px',
    backgroundColor: '#fafafa',
    borderRadius: '12px',
  } as React.CSSProperties,
  universeHeader: {
    marginBottom: '30px',
  },
  universeDescription: {
    fontSize: '16px',
    color: '#666',
    marginTop: '8px',
  },
  universeStats: {
    display: 'flex',
    gap: '24px',
    marginTop: '16px',
    fontSize: '14px',
  } as React.CSSProperties,
  controls: {
    marginBottom: '20px',
    display: 'flex',
    gap: '12px',
  } as React.CSSProperties,
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  } as React.CSSProperties,
  tableWrapper: {
    overflowX: 'auto' as const,
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #ddd',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  headerRow: {
    backgroundColor: '#f5f5f5',
    borderBottom: '2px solid #ddd',
  } as React.CSSProperties,
  th: {
    padding: '12px',
    textAlign: 'left' as const,
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#333',
  } as React.CSSProperties,
  row: {
    borderBottom: '1px solid #eee',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  td: {
    padding: '12px',
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  tdName: {
    padding: '12px',
    fontSize: '14px',
    color: '#1a1a1a',
    fontWeight: '500',
  } as React.CSSProperties,
  tdScore: {
    padding: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
  } as React.CSSProperties,
  modelBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    backgroundColor: '#e8eaf6',
    color: '#3f51b5',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  } as React.CSSProperties,
  viewBtn: {
    color: '#1E88E5',
    textDecoration: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
  } as React.CSSProperties,
  noResults: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#999',
    fontSize: '16px',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    fontSize: '16px',
    color: '#666',
  } as React.CSSProperties,
  error: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#c62828',
    fontSize: '16px',
  } as React.CSSProperties,
};
