import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Firm {
  firm_id?: string;
  name?: string;
  firm_name?: string;
  score?: number;
  score_0_100?: number;
  model_type?: string;
  jurisdiction?: string;
}

export default function UniverseIndex() {
  const [stats, setStats] = useState({
    total: 0,
    core: 0,
    infrastructure: 0,
    institutional: 0,
  });

  useEffect(() => {
    fetch("/api/firms/?limit=500", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const firms = data.firms || [];
        const counts = {
          total: firms.length,
          core: 0,
          infrastructure: 0,
          institutional: 0,
        };

        firms.forEach((firm: Firm) => {
          const name = ((firm.name || firm.firm_name) || "").toLowerCase();
          if (
            name.includes("citadel") ||
            name.includes("jump") ||
            name.includes("drw") ||
            name.includes("wintermute") ||
            name.includes("optiver")
          ) {
            counts.institutional++;
          } else if (
            name.includes("broker") ||
            name.includes("payment") ||
            name.includes("platform")
          ) {
            counts.infrastructure++;
          } else {
            counts.core++;
          }
        });

        setStats(counts);
      });
  }, []);

  return (
    <>
      <Head>
        <title>GTIXT Index - Universe Explorer</title>
      </Head>

      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>🌍 GTIXT Index</h1>
          <p style={styles.subtitle}>3-Universe Model of Proprietary Trading</p>
        </header>

        <section style={styles.overview}>
          <h2 style={styles.sectionTitle}>Understanding GTIXT</h2>
          <p style={styles.description}>
            GTIXT measures the economy of retail-funded proprietary trading through 3 distinct universes:
          </p>
        </section>

        <div style={styles.universeGrid}>
          {/* Core Universe */}
          <Link href="/rankings" style={styles.universeLink}>
            <div
              style={{
                ...styles.universeCard,
                borderLeftColor: "#1E88E5",
                backgroundColor: "#f5f7fc",
              }}
            >
              <div style={styles.universeIcon}>Rankings</div>
              <h3 style={styles.universeTitle}>Core Index</h3>
              <p style={styles.universeSubtitle}>Prop Firms Retail Funded</p>
              <div style={styles.universeStats}>
                <div style={styles.statBox}>
                  <div style={styles.statValue}>{stats.core}</div>
                  <div style={styles.statLabel}>Current</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statValue}>75–100</div>
                  <div style={styles.statLabel}>Target</div>
                </div>
              </div>
              <p style={styles.universeDescription}>
                Dedicated retail prop firms offering funded trader programs (challenge/evaluation model, profit split ≥50%, trader capital allocation)
              </p>
              <div style={styles.examplesLabel}>Examples:</div>
              <ul style={styles.examples}>
                <li>FTMO</li>
                <li>FundedNext</li>
                <li>The5ers</li>
                <li>Topstep</li>
                <li>Apex Trader Funding</li>
              </ul>
              <button style={styles.button}>
                View Core Universe →
              </button>
            </div>
          </Link>

          {/* Infrastructure Universe */}
          <div
            style={{
              ...styles.universeCard,
              borderLeftColor: "#00897B",
              backgroundColor: "#f5faf9",
            }}
          >
            <div style={styles.universeIcon}>🏗️</div>
            <h3 style={styles.universeTitle}>Infrastructure</h3>
            <p style={styles.universeSubtitle}>B2B Support Services</p>
            <div style={styles.universeStats}>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{stats.infrastructure}</div>
                <div style={styles.statLabel}>Current</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValue}>10–20</div>
                <div style={styles.statLabel}>Target</div>
              </div>
            </div>
            <p style={styles.universeDescription}>
              Technology & services supporting prop firms (brokers B2B, risk engines, payment rails, analytics platforms)
            </p>
            <div style={styles.examplesLabel}>Categories:</div>
            <ul style={styles.examples}>
              <li>Execution Brokers</li>
              <li>Risk Management</li>
              <li>Payment Rails</li>
              <li>Analytics</li>
            </ul>
            <button style={styles.button} disabled>
              Coming Soon
            </button>
          </div>

          {/* Institutional Universe */}
          <div
            style={{
              ...styles.universeCard,
              borderLeftColor: "#666",
              backgroundColor: "#fafafa",
            }}
          >
            <div style={styles.universeIcon}>🏢</div>
            <h3 style={styles.universeTitle}>Institutional</h3>
            <p style={styles.universeSubtitle}>Market Makers & Quant Firms</p>
            <div style={styles.universeStats}>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{stats.institutional}</div>
                <div style={styles.statLabel}>Current</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValue}>10–25</div>
                <div style={styles.statLabel}>Target</div>
              </div>
            </div>
            <p style={styles.universeDescription}>
              Market makers, quant funds, and hedge funds (NOT retail-focused, separate analysis)
            </p>
            <div style={styles.examplesLabel}>Examples:</div>
            <ul style={styles.examples}>
              <li>Citadel Securities</li>
              <li>Jump Crypto</li>
              <li>DRW Trading</li>
              <li>Wintermute</li>
              <li>Tower Research</li>
            </ul>
            <button style={styles.button} disabled>
              Separate Index
            </button>
          </div>
        </div>

        <section style={styles.statsSection}>
          <h2 style={styles.sectionTitle}>Universe Summary</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statCardValue}>{stats.total}</div>
              <div style={styles.statCardLabel}>Total Firms</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statCardValue}>{stats.core}</div>
              <div style={styles.statCardLabel}>Core (Main Index)</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statCardValue}>{stats.infrastructure}</div>
              <div style={styles.statCardLabel}>Infrastructure</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statCardValue}>{stats.institutional}</div>
              <div style={styles.statCardLabel}>Institutional</div>
            </div>
          </div>
        </section>

        <section style={styles.infoSection}>
          <h2 style={styles.sectionTitle}>Why Three Universes?</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoCard}>
              <h4 style={styles.infoTitle}>🎯 Clarity</h4>
              <p>Each universe measures a different economy with distinct indicators</p>
            </div>
            <div style={styles.infoCard}>
              <h4 style={styles.infoTitle}>📊 Accuracy</h4>
              <p>Prevent mixing retail prop with institutional trading metrics</p>
            </div>
            <div style={styles.infoCard}>
              <h4 style={styles.infoTitle}>✅ Transparency</h4>
              <p>Users understand why firms are categorized this way</p>
            </div>
            <div style={styles.infoCard}>
              <h4 style={styles.infoTitle}>🔄 Comparability</h4>
              <p>Compare apples-to-apples within each universe</p>
            </div>
          </div>
        </section>

        <footer style={styles.footer}>
          <p>GTIXT Index v2.0 · Institutional-Grade Prop Firms Scoring</p>
        </footer>
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "40px 20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    backgroundColor: "#fafafa",
    minHeight: "100vh",
  } as React.CSSProperties,

  header: {
    textAlign: "center" as const,
    marginBottom: "60px",
    paddingBottom: "40px",
    borderBottom: "1px solid #eee",
  },

  title: {
    fontSize: "48px",
    fontWeight: "bold",
    marginBottom: "12px",
    color: "#1a1a1a",
  },

  subtitle: {
    fontSize: "20px",
    color: "#666",
  },

  overview: {
    textAlign: "center" as const,
    marginBottom: "60px",
  },

  sectionTitle: {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "16px",
    color: "#1a1a1a",
  },

  description: {
    fontSize: "16px",
    color: "#666",
    maxWidth: "700px",
    margin: "0 auto",
  },

  universeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "24px",
    marginBottom: "80px",
  } as React.CSSProperties,

  universeLink: {
    textDecoration: "none",
    color: "inherit",
  },

  universeCard: {
    padding: "32px",
    borderRadius: "12px",
    border: "2px solid #eee",
    borderLeftWidth: "6px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
  } as React.CSSProperties,

  universeIcon: {
    fontSize: "48px",
    marginBottom: "12px",
  },

  universeTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "4px",
    color: "#1a1a1a",
  },

  universeSubtitle: {
    fontSize: "14px",
    color: "#999",
    marginBottom: "20px",
  },

  universeStats: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
  } as React.CSSProperties,

  statBox: {
    flex: 1,
    padding: "12px",
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: "6px",
    textAlign: "center" as const,
  },

  statValue: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1a1a1a",
  },

  statLabel: {
    fontSize: "12px",
    color: "#999",
    marginTop: "4px",
  },

  universeDescription: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "16px",
    lineHeight: "1.6",
  },

  examplesLabel: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#999",
    textTransform: "uppercase" as const,
    marginTop: "12px",
    marginBottom: "8px",
  },

  examples: {
    fontSize: "13px",
    color: "#666",
    margin: "0 0 16px 20px",
    padding: 0,
    lineHeight: "1.8",
  } as React.CSSProperties,

  button: {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "#1E88E5",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.2s",
  } as React.CSSProperties,

  statsSection: {
    marginBottom: "80px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  } as React.CSSProperties,

  statCard: {
    padding: "24px",
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid #eee",
    textAlign: "center" as const,
  },

  statCardValue: {
    fontSize: "40px",
    fontWeight: "bold",
    color: "#1E88E5",
    marginBottom: "8px",
  },

  statCardLabel: {
    fontSize: "14px",
    color: "#666",
  },

  infoSection: {
    marginBottom: "60px",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
  } as React.CSSProperties,

  infoCard: {
    padding: "24px",
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid #eee",
  },

  infoTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "8px",
    color: "#1a1a1a",
  },

  footer: {
    textAlign: "center" as const,
    padding: "40px 0",
    borderTop: "1px solid #eee",
    color: "#999",
    fontSize: "14px",
  },
};
