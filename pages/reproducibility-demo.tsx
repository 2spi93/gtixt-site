import { useState } from 'react';
import Head from 'next/head';
import InstitutionalHeader from '../components/InstitutionalHeader';
import Footer from '../components/Footer';

interface ScoreStep {
  step: number;
  name: string;
  description: string;
  input: string;
  output: string;
  formula?: string;
}

export default function ReproducibilityDemo() {
  const [expanded, setExpanded] = useState<number | null>(0);

  // Example calculation steps for score reproducibility
  const steps: ScoreStep[] = [
    {
      step: 1,
      name: 'Load Specification',
      description: 'Load GTIXT Scoring Specification v1.0.0 with pillar weights',
      input: 'gtixt-scoring-specification-v1.0.json',
      output: '7 pillars with weights defined',
      formula: 'Σ(weights) = 1.0',
    },
    {
      step: 2,
      name: 'Load Evidence',
      description: 'Retrieve captured evidence for firm from specified date',
      input: 'firm_id=example-corp, snapshot_date=2026-02-24',
      output: '21 evidence items with timestamps and confidence scores',
    },
    {
      step: 3,
      name: 'Score Pillars',
      description: 'Score each pillar based on evidence and rules',
      input: 'Regulatory: No enforcement actions → Score 0.85',
      output: 'Pillar scores: [0.85, 0.90, 0.80, 0.82, 0.75, 0.88, 0.92]',
    },
    {
      step: 4,
      name: 'Normalize Scores',
      description: 'Ensure all pillar scores on 0-1.0 scale',
      input: '[0.85, 0.90, 0.80, 0.82, 0.75, 0.88, 0.92]',
      output: '[0.85, 0.90, 0.80, 0.82, 0.75, 0.88, 0.92] (already normalized)',
      formula: 'IF score > 1 THEN score / 100 ELSE score',
    },
    {
      step: 5,
      name: 'Apply Weights',
      description: 'Multiply each pillar score by its weight',
      input: 'Regulatory (0.85) × 0.30 = 0.255',
      output: 'Weighted pillars: [0.255, 0.225, 0.160, 0.123, 0.038, 0.026, 0.018]',
      formula: 'weighted_score = pillar_score × pillar_weight',
    },
    {
      step: 6,
      name: 'Aggregate Scores',
      description: 'Sum weighted pillar scores',
      input: '[0.255, 0.225, 0.160, 0.123, 0.038, 0.026, 0.018]',
      output: '0.845',
      formula: 'final_score = Σ(weighted_pillars)',
    },
    {
      step: 7,
      name: 'Scale to 0-100',
      description: 'Convert 0-1.0 score to 0-100 scale for reporting',
      input: '0.832',
      output: '83.2',
      formula: 'reported_score = final_score × 100',
    },
    {
      step: 8,
      name: 'Compute Hash',
      description: 'Create SHA-256 hash of snapshot for verification',
      input: 'Snapshot JSON with all scores and data',
      output: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz...',
      formula: 'sha256(snapshot_json)',
    },
    {
      step: 9,
      name: 'Verify Result',
      description: 'Compare computed score with published snapshot',
      input: 'Computed: 83.2, Published: 83.2, Hash matches: YES',
      output: '✅ VERIFIED - Score is reproducible and correct',
    },
  ];

  return (
    <>
      <Head>
        <title>Reproducibility Demo — GTIXT</title>
        <meta
          name="description"
          content="Step-by-step demonstration of how GTIXT scores are computed and verified"
        />
      </Head>

      <InstitutionalHeader
        breadcrumbs={[{ label: 'Reproducibility Demo', href: '/reproducibility-demo' }]}
      />

      <main style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.eyebrow}>SCORE REPRODUCIBILITY</div>
          <h1 style={styles.h1}>Verify Scores Step-by-Step</h1>
          <p style={styles.lead}>
            See exactly how GTIXT computes and verifies scores. Every step is deterministic, 
            reproducible, and auditable. Click any step to expand.
          </p>
        </section>

        {/* Main Proposition */}
        <section style={styles.section}>
          <div style={styles.propositionBox}>
            <h2 style={styles.propositionTitle}>The Promise</h2>
            <p style={styles.propositionText}>
              "Given the same evidence, specification, and methodology version, 
              <strong> anyone can reproduce our exact score.</strong>"
            </p>
            <p style={styles.propositionSubtext}>
              Below is a complete walkthrough of how this works.
            </p>
          </div>
        </section>

        {/* Step-by-Step Process */}
        <section style={styles.section}>
          <div style={styles.stepsContainer}>
            {steps.map((step) => (
              <div key={step.step} style={styles.stepCard}>
                <button
                  style={{
                    ...styles.stepButton,
                    borderBottomColor: expanded === step.step - 1 ? '#7FB3FF' : '#1e293b',
                  }}
                  onClick={() => setExpanded(expanded === step.step - 1 ? null : step.step - 1)}
                >
                  <div style={styles.stepNumber}>{step.step}</div>
                  <div style={styles.stepInfo}>
                    <h3 style={styles.stepName}>{step.name}</h3>
                    <p style={styles.stepDescription}>{step.description}</p>
                  </div>
                  <div style={styles.stepChevron}>
                    {expanded === step.step - 1 ? '▼' : '▶'}
                  </div>
                </button>

                {expanded === step.step - 1 && (
                  <div style={styles.stepContent}>
                    <div style={styles.stepSection}>
                      <h4 style={styles.stepSectionTitle}>Input</h4>
                      <code style={styles.stepCode}>{step.input}</code>
                    </div>

                    <div style={styles.stepSection}>
                      <h4 style={styles.stepSectionTitle}>Output</h4>
                      <code style={styles.stepCode}>{step.output}</code>
                    </div>

                    {step.formula && (
                      <div style={styles.stepSection}>
                        <h4 style={styles.stepSectionTitle}>Formula</h4>
                        <code style={styles.stepCode}>{step.formula}</code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Key Principles */}
        <section style={styles.section}>
          <div style={styles.principlesGrid}>
            <div style={styles.principleCard}>
              <div style={styles.principleIcon}>✅</div>
              <h3 style={styles.principleTitle}>Deterministic</h3>
              <p style={styles.principleText}>
                Same inputs always produce same outputs. No randomness, no estimation.
              </p>
            </div>

            <div style={styles.principleCard}>
              <div style={styles.principleIcon}>🔍</div>
              <h3 style={styles.principleTitle}>Transparent</h3>
              <p style={styles.principleText}>
                All rules published. All evidence inspectable. All calculations visible.
              </p>
            </div>

            <div style={styles.principleCard}>
              <div style={styles.principleIcon}>✔️</div>
              <h3 style={styles.principleTitle}>Verifiable</h3>
              <p style={styles.principleText}>
                Third parties can independently reproduce scores and verify integrity.
              </p>
            </div>

            <div style={styles.principleCard}>
              <div style={styles.principleIcon}>⛓️</div>
              <h3 style={styles.principleTitle}>Auditable</h3>
              <p style={styles.principleText}>
                Complete audit trail from evidence capture through score publication.
              </p>
            </div>
          </div>
        </section>

        {/* How to Verify */}
        <section style={styles.section}>
          <div style={styles.instructionBox}>
            <h2 style={styles.instructionTitle}>How to Verify a Score Yourself</h2>
            <ol style={styles.instructionList}>
              <li>Download GTIXT specification (gtixt-scoring-specification-v1.0.json)</li>
              <li>Request evidence for a firm and date (/api/evidence/firm-id)</li>
              <li>Follow the algorithm steps above in order</li>
              <li>Compute SHA-256 hash of your result</li>
              <li>Compare with published snapshot SHA-256</li>
              <li>If hashes match: ✅ Score verified as correct</li>
            </ol>
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
  propositionBox: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px',
    borderRadius: '12px',
    textAlign: 'center',
  },
  propositionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '16px',
  },
  propositionText: {
    fontSize: '18px',
    color: '#ffffff',
    marginBottom: '12px',
  },
  propositionSubtext: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.9)',
  },
  stepsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  stepCard: {
    backgroundColor: '#0f1428',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  stepButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '24px',
    backgroundColor: '#0f1428',
    border: 'none',
    borderBottom: '2px solid #1e293b',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.2s',
  },
  stepNumber: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#7FB3FF',
    minWidth: '40px',
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0,
  },
  stepDescription: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: '6px 0 0 0',
  },
  stepChevron: {
    fontSize: '12px',
    color: '#7FB3FF',
    fontWeight: 'bold',
  },
  stepContent: {
    padding: '24px',
    backgroundColor: '#1e293b',
  },
  stepSection: {
    marginBottom: '16px',
  },
  stepSectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#7FB3FF',
    marginBottom: '8px',
  },
  stepCode: {
    display: 'block',
    padding: '12px',
    backgroundColor: '#0f1428',
    borderRadius: '8px',
    color: '#10b981',
    fontSize: '13px',
    fontFamily: 'monospace',
    overflowX: 'auto',
  },
  principlesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
  },
  principleCard: {
    backgroundColor: '#0f1428',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
  },
  principleIcon: {
    fontSize: '32px',
    marginBottom: '16px',
  },
  principleTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '12px',
  },
  principleText: {
    fontSize: '14px',
    color: '#cbd5e1',
    lineHeight: '1.6',
  },
  instructionBox: {
    backgroundColor: '#0f1428',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '32px',
  },
  instructionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '24px',
  },
  instructionList: {
    listStyle: 'decimal',
    paddingLeft: '24px',
    color: '#cbd5e1',
    fontSize: '15px',
    lineHeight: '1.8',
  },
};
