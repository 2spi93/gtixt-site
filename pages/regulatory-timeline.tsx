import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function RegulatoryTimeline() {
  return (
    <>
      <Head>
        <title>Regulatory Timeline 2025-2026 | GTIXT</title>
        <meta name="description" content="Understanding the regulatory wave for proprietary trading firms. Why GTIXT is building the standard before regulation arrives." />
      </Head>

      <div className="page-container">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-badge">🚨 REGULATORY URGENCY</div>
          <h1 className="hero-title">The Regulatory Wave: 2025-2026</h1>
          <p className="hero-subtitle">
            Global regulators are converging on proprietary trading firms. GTIXT provides the 
            transparency infrastructure before enforcement arrives—giving firms time to prepare, 
            traders confidence to choose, and institutions a benchmark to trust.
          </p>
        </section>

        {/* 3 Phases */}
        <section className="phases-section">
          <h2 className="section-title">The Three Phases</h2>
          
          <div className="phase-card">
            <div className="phase-header">
              <div className="phase-icon">👁️</div>
              <div>
                <div className="phase-period">2024-2025</div>
                <h3 className="phase-title">Phase 1: Observation</h3>
              </div>
            </div>
            <div className="phase-content">
              <p className="phase-description">
                Regulators in the EU (ESMA), UK (FCA), US (CFTC, SEC), and Australia (ASIC) began 
                gathering data on proprietary trading firms following the 2023-2024 wave of firm 
                collapses and trader complaints. This is the "quiet phase" where authorities build 
                their understanding of the market.
              </p>
              <div className="phase-impact">
                <strong>Impact for Prop Firms:</strong>
                <ul>
                  <li>Increased scrutiny on payout practices and trader complaints</li>
                  <li>Data requests from financial authorities becoming more frequent</li>
                  <li>Industry reputation under pressure from media coverage</li>
                </ul>
              </div>
              <div className="phase-gtixt">
                <strong>GTIXT Role:</strong> Provides a voluntary, transparent framework that firms 
                can adopt to demonstrate credibility during the observation period.
              </div>
            </div>
          </div>

          <div className="phase-card active">
            <div className="phase-header">
              <div className="phase-icon">📋</div>
              <div>
                <div className="phase-period">2025</div>
                <h3 className="phase-title">Phase 2: Formalization (Current)</h3>
              </div>
            </div>
            <div className="phase-content">
              <p className="phase-description">
                Standards and guidelines begin to emerge. Regulators publish consultation papers, 
                industry bodies form working groups, and early movers adopt compliance frameworks. 
                This is when the "rules of the game" are written.
              </p>
              <div className="phase-impact">
                <strong>Impact for Prop Firms:</strong>
                <ul>
                  <li>Need to participate in regulatory consultations or risk unfavorable rules</li>
                  <li>First-mover advantage for firms adopting transparency early</li>
                  <li>Market consolidation as weaker firms exit before enforcement</li>
                </ul>
              </div>
              <div className="phase-gtixt">
                <strong>GTIXT Role:</strong> Serves as the de facto benchmark that regulators can 
                reference. Firms using GTIXT can demonstrate proactive compliance.
              </div>
            </div>
          </div>

          <div className="phase-card">
            <div className="phase-header">
              <div className="phase-icon">⚖️</div>
              <div>
                <div className="phase-period">2026+</div>
                <h3 className="phase-title">Phase 3: Application & Enforcement</h3>
              </div>
            </div>
            <div className="phase-content">
              <p className="phase-description">
                Formal regulations take effect. Licensing requirements, capital adequacy rules, 
                payout transparency mandates, and trader protection measures become law. 
                Non-compliant firms face fines, restrictions, or closure.
              </p>
              <div className="phase-impact">
                <strong>Impact for Prop Firms:</strong>
                <ul>
                  <li>Mandatory compliance with transparency and payout rules</li>
                  <li>Licensing and registration requirements</li>
                  <li>Penalties for non-compliance (fines, operational restrictions)</li>
                </ul>
              </div>
              <div className="phase-gtixt">
                <strong>GTIXT Role:</strong> Firms already using GTIXT are ahead of the curve. 
                The index becomes a reference for "what good looks like" in regulatory terms.
              </div>
            </div>
          </div>
        </section>

        {/* Regional Timeline */}
        <section className="regional-section">
          <h2 className="section-title">Regional Regulatory Timelines</h2>
          <p className="section-subtitle">Different jurisdictions, similar direction</p>

          <div className="region-grid">
            <div className="region-card">
              <div className="region-flag">🇪🇺</div>
              <h3 className="region-name">European Union</h3>
              <div className="region-body">
                <div className="timeline-item">
                  <div className="timeline-date">Q2 2025</div>
                  <div className="timeline-event">ESMA consultation paper on prop trading</div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-date">Q4 2025</div>
                  <div className="timeline-event">Draft MiFID III amendments published</div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-date">2026</div>
                  <div className="timeline-event">Formal regulations likely in effect</div>
                </div>
              </div>
              <div className="region-context">
                EU typically leads on financial regulation. Expect strict transparency 
                and trader protection requirements.
              </div>
            </div>

            <div className="region-card">
              <div className="region-flag">🇬🇧</div>
              <h3 className="region-name">United Kingdom</h3>
              <div className="region-body">
                <div className="timeline-item">
                  <div className="timeline-date">Q1 2025</div>
                  <div className="timeline-event">FCA review of prop firm practices</div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-date">Q3 2025</div>
                  <div className="timeline-event">Guidance on payout transparency</div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-date">2026</div>
                  <div className="timeline-event">Licensing regime for prop firms</div>
                </div>
              </div>
              <div className="region-context">
                Post-Brexit, UK may move faster than EU. FCA has already signaled concern 
                about prop firm practices.
              </div>
            </div>

            <div className="region-card">
              <div className="region-flag">🇺🇸</div>
              <h3 className="region-name">United States</h3>
              <div className="region-body">
                <div className="timeline-item">
                  <div className="timeline-date">Q2 2025</div>
                  <div className="timeline-event">CFTC/SEC joint working group formation</div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-date">Q4 2025</div>
                  <div className="timeline-event">Public comment period on prop trading rules</div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-date">2026-2027</div>
                  <div className="timeline-event">State-level and federal regulations emerge</div>
                </div>
              </div>
              <div className="region-context">
                US regulation will be fragmented (state vs federal), but momentum is building 
                after high-profile firm failures.
              </div>
            </div>

            <div className="region-card">
              <div className="region-flag">🇦🇺</div>
              <h3 className="region-name">Australia</h3>
              <div className="region-body">
                <div className="timeline-item">
                  <div className="timeline-date">Q1 2025</div>
                  <div className="timeline-event">ASIC inquiry into prop firm practices</div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-date">Q3 2025</div>
                  <div className="timeline-event">Draft licensing requirements published</div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-date">2026</div>
                  <div className="timeline-event">Mandatory registration and reporting</div>
                </div>
              </div>
              <div className="region-context">
                ASIC historically strict on retail trading. Prop firms will face rigorous 
                compliance requirements.
              </div>
            </div>
          </div>
        </section>

        {/* Key Takeaways */}
        <section className="takeaways-section">
          <h2 className="section-title">Key Takeaways</h2>
          
          <div className="takeaway-grid">
            <div className="takeaway-card">
              <div className="takeaway-icon">⏰</div>
              <h3 className="takeaway-title">NOW is Critical</h3>
              <p className="takeaway-text">
                By 2026, compliance will be mandatory. Firms adopting transparency frameworks 
                now will have a 12-18 month head start over competitors.
              </p>
            </div>

            <div className="takeaway-card">
              <div className="takeaway-icon">🔍</div>
              <h3 className="takeaway-title">Transparency = Survival</h3>
              <p className="takeaway-text">
                Regulators will require disclosure of payout rates, rule changes, and compliance 
                history. Firms hiding data will struggle to survive.
              </p>
            </div>

            <div className="takeaway-card">
              <div className="takeaway-icon">📊</div>
              <h3 className="takeaway-title">Measurement Matters</h3>
              <p className="takeaway-text">
                GTIXT provides the 5-pillar framework (Transparency, Payout, Risk, Legal, Reputation) 
                that regulators are likely to reference.
              </p>
            </div>

            <div className="takeaway-card">
              <div className="takeaway-icon">🤝</div>
              <h3 className="takeaway-title">Partnership {'>'} Solo</h3>
              <p className="takeaway-text">
                Working with an independent index like GTIXT signals maturity and reduces 
                regulatory risk compared to "going it alone."
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-box">
            <h2 className="cta-title">See What GTIXT Measures</h2>
            <p className="cta-description">
              Explore the full rankings, methodology, and integrity infrastructure that puts 
              transparency first—before regulators require it.
            </p>
            <div className="cta-buttons">
              <Link href="/rankings" className="btn-primary">
                View Current Rankings →
              </Link>
              <Link href="/methodology" className="btn-secondary">
                Read Methodology v1.0
              </Link>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .page-container { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }

        /* Hero */
        .hero { text-align: center; margin-bottom: 48px; }
        .hero-badge { 
          display: inline-block; 
          padding: 8px 16px; 
          border-radius: 24px; 
          background: rgba(255,119,0,0.15); 
          border: 1px solid rgba(255,150,0,0.35);
          color: #FFB366; 
          font-weight: 800; 
          font-size: 12px; 
          letter-spacing: 0.08em; 
          margin-bottom: 16px;
        }
        .hero-title { 
          font-weight: 900; 
          font-size: 42px; 
          letter-spacing: -0.02em; 
          margin-bottom: 16px;
          background: linear-gradient(135deg, #FFFFFF, rgba(255,200,100,0.95)); 
          -webkit-background-clip: text; 
          background-clip: text; 
          color: transparent;
        }
        .hero-subtitle { 
          color: rgba(234,240,255,0.78); 
          font-size: 17px; 
          line-height: 1.65; 
          max-width: 72ch; 
          margin: 0 auto;
        }

        /* Sections */
        .section-title { 
          font-weight: 900; 
          font-size: 32px; 
          letter-spacing: -0.02em; 
          margin-bottom: 12px; 
          text-align: center;
        }
        .section-subtitle { 
          color: rgba(234,240,255,0.68); 
          font-size: 15px; 
          text-align: center; 
          margin-bottom: 32px;
        }

        /* Phases */
        .phases-section { margin: 48px 0; }
        .phase-card { 
          margin-bottom: 24px; 
          padding: 28px; 
          border-radius: 18px; 
          border: 1px solid rgba(255,255,255,0.10); 
          background: rgba(5,8,18,0.60);
          transition: all 0.2s ease;
        }
        .phase-card.active { 
          border-color: rgba(255,150,0,0.40); 
          background: rgba(255,119,0,0.08);
          box-shadow: 0 0 24px rgba(255,119,0,0.15);
        }
        .phase-header { 
          display: flex; 
          align-items: center; 
          gap: 16px; 
          margin-bottom: 16px;
        }
        .phase-icon { font-size: 42px; }
        .phase-period { 
          font-size: 11px; 
          color: rgba(255,183,0,0.75); 
          font-weight: 800; 
          letter-spacing: 0.08em; 
          margin-bottom: 4px;
        }
        .phase-title { font-weight: 800; font-size: 22px; }
        .phase-content { padding-left: 58px; }
        .phase-description { 
          color: rgba(234,240,255,0.82); 
          font-size: 15px; 
          line-height: 1.65; 
          margin-bottom: 16px;
        }
        .phase-impact, .phase-gtixt { 
          margin-top: 16px; 
          padding: 16px; 
          border-radius: 12px; 
          background: rgba(5,8,18,0.50);
        }
        .phase-impact strong, .phase-gtixt strong { 
          display: block; 
          margin-bottom: 8px; 
          color: rgba(255,183,0,0.92); 
          font-size: 14px;
        }
        .phase-impact ul { margin: 8px 0 0 18px; }
        .phase-impact li { 
          color: rgba(234,240,255,0.75); 
          font-size: 14px; 
          line-height: 1.6; 
          margin-bottom: 6px;
        }
        .phase-gtixt { 
          border-left: 3px solid rgba(0,209,193,0.45); 
          color: rgba(234,240,255,0.75); 
          font-size: 14px; 
          line-height: 1.6;
        }

        /* Regional Timeline */
        .regional-section { margin: 48px 0; }
        .region-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
          gap: 20px;
        }
        .region-card { 
          padding: 24px; 
          border-radius: 16px; 
          border: 1px solid rgba(255,255,255,0.10); 
          background: rgba(5,8,18,0.60);
        }
        .region-flag { font-size: 42px; margin-bottom: 12px; }
        .region-name { font-weight: 800; font-size: 18px; margin-bottom: 16px; }
        .region-body { margin-bottom: 16px; }
        .timeline-item { 
          margin-bottom: 12px; 
          padding-left: 12px; 
          border-left: 2px solid rgba(0,209,193,0.30);
        }
        .timeline-date { 
          font-size: 11px; 
          color: rgba(0,209,193,0.75); 
          font-weight: 800; 
          margin-bottom: 3px;
        }
        .timeline-event { 
          color: rgba(234,240,255,0.78); 
          font-size: 13px; 
          line-height: 1.5;
        }
        .region-context { 
          padding-top: 12px; 
          border-top: 1px solid rgba(255,255,255,0.08); 
          color: rgba(234,240,255,0.65); 
          font-size: 12px; 
          line-height: 1.55; 
          font-style: italic;
        }

        /* Takeaways */
        .takeaways-section { margin: 48px 0; }
        .takeaway-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); 
          gap: 18px;
        }
        .takeaway-card { 
          padding: 24px; 
          border-radius: 16px; 
          border: 1px solid rgba(255,255,255,0.10); 
          background: rgba(5,8,18,0.60); 
          text-align: center;
        }
        .takeaway-icon { font-size: 42px; margin-bottom: 12px; }
        .takeaway-title { font-weight: 800; font-size: 16px; margin-bottom: 8px; }
        .takeaway-text { 
          color: rgba(234,240,255,0.72); 
          font-size: 13px; 
          line-height: 1.6;
        }

        /* CTA */
        .cta-section { margin: 48px 0; }
        .cta-box { 
          padding: 40px 32px; 
          border-radius: 18px; 
          background: linear-gradient(135deg, rgba(0,209,193,0.12), rgba(0,150,180,0.08)); 
          border: 1px solid rgba(0,209,193,0.30); 
          text-align: center;
        }
        .cta-title { 
          font-weight: 900; 
          font-size: 28px; 
          margin-bottom: 12px;
        }
        .cta-description { 
          color: rgba(234,240,255,0.78); 
          font-size: 15px; 
          line-height: 1.65; 
          max-width: 60ch; 
          margin: 0 auto 24px;
        }
        .cta-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn-primary { 
          padding: 14px 28px; 
          border-radius: 12px; 
          background: linear-gradient(135deg, #FF7700, #FF9500); 
          color: #FFFFFF; 
          font-weight: 800; 
          font-size: 15px; 
          border: none;
          transition: all 0.2s ease;
          display: inline-block;
        }
        .btn-primary:hover { 
          background: linear-gradient(135deg, #FF8800, #FFA500); 
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(255,119,0,0.35);
        }
        .btn-secondary { 
          padding: 14px 28px; 
          border-radius: 12px; 
          background: transparent; 
          color: rgba(0,209,193,0.92); 
          font-weight: 800; 
          font-size: 15px;
          border: 1px solid rgba(0,209,193,0.35);
          transition: all 0.2s ease;
          display: inline-block;
        }
        .btn-secondary:hover { 
          border-color: rgba(0,209,193,0.55); 
          background: rgba(0,209,193,0.08);
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 32px; }
          .phase-content { padding-left: 0; }
          .region-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
