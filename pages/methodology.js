import Head from 'next/head'
import { useState } from 'react'

export default function Methodology() {
  const [selectedPillar, setSelectedPillar] = useState('overview')

  const pillars = {
    overview: {
      title: 'Overview',
      content: `
        <h3>GTIXT Methodology v1.0</h3>
        <p>Rules-based benchmark for proprietary trading firms with institutional-grade methodology.</p>

        <h4>Core Principles</h4>
        <ul>
          <li><strong>Rules-based:</strong> No human intervention in scoring or selection</li>
          <li><strong>Transparent:</strong> Complete methodology documentation and audit trails</li>
          <li><strong>Accountable:</strong> Versioned methodology with change logs</li>
          <li><strong>Data-driven:</strong> Evidence-based scoring with confidence metrics</li>
        </ul>

        <h4>Index Construction</h4>
        <ol>
          <li>Data collection from public sources</li>
          <li>Automated scoring across 5 pillars</li>
          <li>Quality gates (Agent C verification)</li>
          <li>Public snapshot publication with integrity proofs</li>
        </ol>
      `
    },
    regulatory: {
      title: 'Regulatory Compliance',
      content: `
        <h3>Regulatory Compliance Pillar</h3>
        <p>Assessment of regulatory framework quality and enforcement.</p>

        <h4>Jurisdiction Tiers</h4>
        <div class="tier-grid">
          <div class="tier">
            <h5>Tier 1</h5>
            <p>US, UK, Germany, France, Switzerland, Canada, Australia, Japan, Singapore</p>
            <p>Score multiplier: 1.0</p>
          </div>
          <div class="tier">
            <h5>Tier 2</h5>
            <p>Netherlands, Sweden, Denmark, Norway, Hong Kong, UAE, Israel</p>
            <p>Score multiplier: 0.9</p>
          </div>
          <div class="tier">
            <h5>Tier 3</h5>
            <p>All other jurisdictions</p>
            <p>Score multiplier: 0.7</p>
          </div>
        </div>

        <h4>Assessment Criteria</h4>
        <ul>
          <li>Licensing requirements</li>
          <li>Capital adequacy rules</li>
          <li>Client protection measures</li>
          <li>Regulatory oversight quality</li>
        </ul>
      `
    },
    operational: {
      title: 'Operational Excellence',
      content: `
        <h3>Operational Excellence Pillar</h3>
        <p>Evaluation of operational capabilities and risk management.</p>

        <h4>Key Metrics</h4>
        <ul>
          <li>Technology infrastructure</li>
          <li>Risk management systems</li>
          <li>Operational scalability</li>
          <li>Business continuity planning</li>
        </ul>

        <h4>Scoring Methodology</h4>
        <p>Points awarded based on evidence of:</p>
        <ul>
          <li>Advanced trading platforms</li>
          <li>Real-time risk monitoring</li>
          <li>Automated compliance systems</li>
          <li>Disaster recovery capabilities</li>
        </ul>
      `
    },
    financial: {
      title: 'Financial Strength',
      content: `
        <h3>Financial Strength Pillar</h3>
        <p>Assessment of financial stability and capital adequacy.</p>

        <h4>Capital Requirements</h4>
        <ul>
          <li>Minimum capital thresholds by jurisdiction</li>
          <li>Capital adequacy ratios</li>
          <li>Liquidity requirements</li>
          <li>Financial reporting quality</li>
        </ul>

        <h4>Risk-Adjusted Scoring</h4>
        <p>Financial strength scores are risk-adjusted based on:</p>
        <ul>
          <li>Business model complexity</li>
          <li>Market exposure</li>
          <li>Geographic diversification</li>
        </ul>
      `
    },
    transparency: {
      title: 'Transparency & Governance',
      content: `
        <h3>Transparency & Governance Pillar</h3>
        <p>Evaluation of disclosure practices and governance quality.</p>

        <h4>Disclosure Requirements</h4>
        <ul>
          <li>Public financial reporting</li>
          <li>Risk disclosure quality</li>
          <li>Corporate governance structure</li>
          <li>Stakeholder communication</li>
        </ul>

        <h4>Governance Scoring</h4>
        <p>Points awarded for:</p>
        <ul>
          <li>Independent board oversight</li>
          <li>Audit committee presence</li>
          <li>Risk committee effectiveness</li>
          <li>Shareholder rights protection</li>
        </ul>
      `
    },
    market: {
      title: 'Market Impact',
      content: `
        <h3>Market Impact Pillar</h3>
        <p>Assessment of market contribution and ecosystem influence.</p>

        <h4>Market Contribution Metrics</h4>
        <ul>
          <li>Liquidity provision</li>
          <li>Market making activities</li>
          <li>Innovation in trading technology</li>
          <li>Educational content and research</li>
        </ul>

        <h4>Ecosystem Influence</h4>
        <p>Evaluation based on:</p>
        <ul>
          <li>Industry partnerships</li>
          <li>Open source contributions</li>
          <li>Market data sharing</li>
          <li>Regulatory engagement</li>
        </ul>
      `
    }
  }

  return (
    <div className="methodology-page">
      <Head>
        <title>Methodology v1.0 - GTIXT</title>
        <meta name="description" content="Complete methodology documentation for the Global Prop Trading Index" />
      </Head>

      <div className="methodology-container">
        <header className="methodology-header">
          <h1>Methodology Explorer</h1>
          <p className="version">Version 1.0 - Rules-based benchmark framework</p>
        </header>

        <div className="methodology-content">
          <nav className="pillar-nav">
            {Object.entries(pillars).map(([key, pillar]) => (
              <button
                key={key}
                className={`pillar-button ${selectedPillar === key ? 'active' : ''}`}
                onClick={() => setSelectedPillar(key)}
              >
                {pillar.title}
              </button>
            ))}
          </nav>

          <main className="pillar-content">
            <div dangerouslySetInnerHTML={{ __html: pillars[selectedPillar].content }} />
          </main>
        </div>

        <section className="methodology-footer">
          <h3>Quality Assurance</h3>
          <div className="qa-grid">
            <div className="qa-item">
              <h4>Agent C Verification</h4>
              <p>Automated quality gates ensure data sufficiency and integrity</p>
            </div>
            <div className="qa-item">
              <h4>Confidence Scoring</h4>
              <p>Each firm receives a confidence rating based on data completeness</p>
            </div>
            <div className="qa-item">
              <h4>Integrity Proofs</h4>
              <p>SHA256 hashes and audit trails for complete accountability</p>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .methodology-page {
          min-height: 100vh;
          background: #ffffff;
          color: #1a1a1a;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .methodology-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .methodology-header {
          text-align: center;
          margin-bottom: 50px;
          padding-bottom: 30px;
          border-bottom: 1px solid #e0e0e0;
        }

        .methodology-header h1 {
          font-size: 3rem;
          font-weight: 700;
          margin: 0 0 10px;
          letter-spacing: -0.02em;
        }

        .version {
          color: #666;
          font-size: 1.1rem;
          margin: 0;
        }

        .methodology-content {
          display: grid;
          grid-template-columns: 250px 1fr;
          gap: 40px;
          margin-bottom: 60px;
        }

        .pillar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pillar-button {
          padding: 12px 16px;
          border: 1px solid #e0e0e0;
          background: white;
          text-align: left;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .pillar-button:hover {
          border-color: #0070f3;
          background: #f8f9fa;
        }

        .pillar-button.active {
          border-color: #0070f3;
          background: #0070f3;
          color: white;
        }

        .pillar-content {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .pillar-content h3 {
          margin-top: 0;
          color: #1a1a1a;
        }

        .pillar-content h4 {
          color: #333;
          margin-top: 30px;
        }

        .pillar-content ul {
          margin: 15px 0;
          padding-left: 20px;
        }

        .pillar-content li {
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .tier-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }

        .tier {
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          background: white;
        }

        .tier h5 {
          margin: 0 0 10px;
          color: #0070f3;
          font-weight: 600;
        }

        .tier p {
          margin: 5px 0;
          font-size: 0.9rem;
          color: #666;
        }

        .methodology-footer {
          border-top: 1px solid #e0e0e0;
          padding-top: 40px;
        }

        .methodology-footer h3 {
          text-align: center;
          margin-bottom: 30px;
        }

        .qa-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .qa-item {
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          background: white;
        }

        .qa-item h4 {
          margin: 0 0 10px;
          color: #0070f3;
        }

        .qa-item p {
          margin: 0;
          color: #666;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .methodology-content {
            grid-template-columns: 1fr;
          }

          .pillar-nav {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 10px;
          }

          .pillar-button {
            white-space: nowrap;
            min-width: 120px;
          }

          .methodology-header h1 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  )
}