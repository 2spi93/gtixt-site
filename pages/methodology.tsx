import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import InstitutionalHeader from "../components/InstitutionalHeader";
import Footer from "../components/Footer";
import { useIsMounted } from "../lib/useIsMounted";
import { useTranslation } from "../lib/useTranslationStub";

interface SnapshotStats {
  totalFirms: number;
  avgScore: number;
  passRate: number;
  naRate: number;
}

interface SnapshotPointer {
  object?: string;
  sha256?: string;
  created_at?: string;
  count?: number;
}

export default function MethodologyPage() {
  const isMounted = useIsMounted();
  const { t } = useTranslation("common");
  const [stats, setStats] = useState<SnapshotStats>({
    totalFirms: 0,
    avgScore: 0,
    passRate: 0,
    naRate: 0,
  });
  const [pointer, setPointer] = useState<SnapshotPointer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const latestPointerUrl =
          process.env.NEXT_PUBLIC_LATEST_POINTER_URL ||
          "http://51.210.246.61:9000/gpti-snapshots/universe_v0.1_public/_public/latest.json";
        const minioRoot =
          process.env.NEXT_PUBLIC_MINIO_PUBLIC_ROOT ||
          "http://51.210.246.61:9000/gpti-snapshots/";

        const pointerRes = await fetch(latestPointerUrl, { cache: "no-store" });
        if (!pointerRes.ok) throw new Error(`latest.json HTTP ${pointerRes.status}`);
        const pointerData = (await pointerRes.json()) as SnapshotPointer;
        setPointer(pointerData);

        if (!pointerData?.object) {
          setLoading(false);
          return;
        }

        const snapshotUrl = `${minioRoot.replace(/\/+$/, "")}/${pointerData.object.replace(/^\/+/, "")}`;
        const response = await fetch(snapshotUrl, { cache: "no-store" });
        if (!response.ok) throw new Error(`snapshot HTTP ${response.status}`);
        const data = await response.json();
        const records = data.records || [];

        if (records.length > 0) {
          // Calculate statistics
          const totalFirms = records.length;
          const avgScore = Math.round(
            records.reduce((sum: number, r: any) => sum + (r.score_0_100 || 0), 0) / totalFirms
          );
          
          // Pass rate = firms with score >= 60
          const passCount = records.filter((r: any) => (r.score_0_100 || 0) >= 60).length;
          const passRate = Math.round((passCount / totalFirms) * 100);
          
          // NA rate = average na_rate across firms
          const naRate = Math.round(
            records.reduce((sum: number, r: any) => sum + (r.na_rate || 0), 0) / totalFirms
          );

          setStats({
            totalFirms,
            avgScore,
            passRate,
            naRate,
          });
        }
      } catch (error) {
        console.error("Failed to load snapshot stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <>
      <Head>
        <title>Methodology — GTIXT</title>
        <meta
          name="description"
          content="GTIXT Methodology — institutional benchmark design, scoring pillars, NA policy, integrity and versioning."
        />
      </Head>

      <InstitutionalHeader
        breadcrumbs={isMounted ? [{ label: t("methodology.breadcrumb"), href: "/methodology" }] : []}
      />

      <main id="main-content" style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.eyebrow}>Institutional Benchmark • Transparency-First • Audit-Friendly</div>
          <h1 style={styles.h1}>GTIXT — Integrity Beacon for Global Prop Trading</h1>
          <p style={styles.lead}>
            The first public, versioned benchmark that converts messy prop firm reality into an institutional-grade signal: transparency, payout reliability, risk model integrity, and compliance.
          </p>

          <div style={styles.heroCtas}>
            <Link href="/rankings" style={{...styles.button, ...styles.buttonPrimary}}>
              📊 Explorer l'Index
            </Link>
            <Link href="/integrity" style={{...styles.button, ...styles.buttonSecondary}}>
              🔒 Vérification
            </Link>
            <Link href="/methodology" style={{...styles.button, ...styles.buttonGhost}}>
              📖 Méthodologie
            </Link>
          </div>

          {/* Pillar Tags */}
          <div style={{...styles.pillarTags}}>
            <span style={styles.pillarTag}>A • Transparency</span>
            <span style={styles.pillarTag}>B • Payout Reliability</span>
            <span style={styles.pillarTag}>C • Risk Model</span>
            <span style={styles.pillarTag}>D • Legal & Compliance</span>
            <span style={styles.pillarTag}>E • Reputation & Support</span>
          </div>
        </section>

        {/* Index Overview Section */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Index Overview</h2>
          <p style={styles.sectionLead}>Real-time benchmark metrics</p>

          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <div style={styles.metricValue}>{stats.totalFirms}</div>
              <div style={styles.metricLabel}>Total Firms</div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricValue}>{stats.avgScore}</div>
              <div style={styles.metricLabel}>Avg Score</div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricValue}>{stats.passRate}%</div>
              <div style={styles.metricLabel}>Pass Rate</div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricValue}>{stats.naRate}%</div>
              <div style={styles.metricLabel}>NA Rate</div>
            </div>
          </div>

          <div style={styles.snapshotInfo}>
            <div style={styles.snapshotDetail}>
              <strong>Snapshot:</strong> {pointer?.object || "—"}
            </div>
            <div style={styles.snapshotDetail}>
              <strong>SHA-256:</strong> {pointer?.sha256 || "—"}
            </div>
            <div style={styles.snapshotDetail}>
              <strong>Updated:</strong> {pointer?.created_at ? new Date(pointer.created_at).toLocaleString("fr-FR") : "—"}
            </div>
          </div>

          <div style={styles.verificationButtons}>
            <Link href="/integrity" style={{...styles.button, ...styles.buttonSecondary}}>
              🔐 Verify SHA-256
            </Link>
            <Link href="/rankings" style={{...styles.button, ...styles.buttonPrimary}}>
              📈 View Ranking
            </Link>
          </div>
        </section>

        {/* Design Principles */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("methodology.designPrinciples.title")}</h2>
          <p style={styles.sectionLead}>
            {t("methodology.designPrinciples.lead")}
          </p>

          <div style={styles.principlesGrid}>
            <div style={styles.principleCard}>
              <div style={styles.principleIcon}>⚙️</div>
              <h3 style={styles.principleTitle}>{t("methodology.designPrinciples.cards.deterministic.title")}</h3>
              <p style={styles.principleText}>
                {t("methodology.designPrinciples.cards.deterministic.text")}
              </p>
            </div>

            <div style={styles.principleCard}>
              <div style={styles.principleIcon}>📋</div>
              <h3 style={styles.principleTitle}>{t("methodology.designPrinciples.cards.auditTrail.title")}</h3>
              <p style={styles.principleText}>
                {t("methodology.designPrinciples.cards.auditTrail.text")}
              </p>
            </div>

            <div style={styles.principleCard}>
              <div style={styles.principleIcon}>⚖️</div>
              <h3 style={styles.principleTitle}>{t("methodology.designPrinciples.cards.naNeutral.title")}</h3>
              <p style={styles.principleText}>
                {t("methodology.designPrinciples.cards.naNeutral.text")}
              </p>
            </div>

            <div style={styles.principleCard}>
              <div style={styles.principleIcon}>🔄</div>
              <h3 style={styles.principleTitle}>{t("methodology.designPrinciples.cards.versioned.title")}</h3>
              <p style={styles.principleText}>
                {t("methodology.designPrinciples.cards.versioned.text")}
              </p>
            </div>
          </div>
        </section>

        {/* Scoring Framework */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("methodology.scoringFramework.title")}</h2>
          <p style={styles.sectionLead}>
            {t("methodology.scoringFramework.lead")}
          </p>

          <div style={styles.formulaCard}>
            <div style={styles.formulaLabel}>{t("methodology.scoringFramework.formula.label")}</div>
            <div style={styles.formulaBox}>
              <code style={styles.formulaCode}>
                score = 100 × Σ (weight × pillar_score)
              </code>
            </div>
            <p style={styles.formulaNote}>
              {t("methodology.scoringFramework.formula.note")}
            </p>
          </div>

          <div style={styles.frameworkGrid}>
            <div style={styles.frameworkCard}>
              <h3 style={styles.frameworkTitle}>{t("methodology.scoringFramework.cards.normalization.title")}</h3>
              <p style={styles.frameworkText}>
                {t("methodology.scoringFramework.cards.normalization.text")}
              </p>
            </div>

            <div style={styles.frameworkCard}>
              <h3 style={styles.frameworkTitle}>{t("methodology.scoringFramework.cards.aggregation.title")}</h3>
              <p style={styles.frameworkText}>
                {t("methodology.scoringFramework.cards.aggregation.text")}
              </p>
            </div>

            <div style={styles.frameworkCard}>
              <h3 style={styles.frameworkTitle}>{t("methodology.scoringFramework.cards.fallbackChain.title")}</h3>
              <p style={styles.frameworkText}>
                {t("methodology.scoringFramework.cards.fallbackChain.text")}
              </p>
            </div>
          </div>
        </section>

        {/* Data Collection Agents */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("methodology.dataCollectionAgents.title")}</h2>
          <p style={styles.sectionLead}>
            {t("methodology.dataCollectionAgents.lead")}
          </p>

          <div style={styles.agentsGrid}>
            <div style={styles.agentCard}>
              <h3 style={styles.agentTitle}>{t("methodology.dataCollectionAgents.agents.agentA.title")}</h3>
              <p style={styles.agentDesc}>{t("methodology.dataCollectionAgents.agents.agentA.description")}</p>
              <div style={styles.agentMetrics}>
                <span style={styles.agentTag}>{t("methodology.dataCollectionAgents.agents.agentA.evidence")}: {t("methodology.dataCollectionAgents.agents.agentA.inputs")}</span>
              </div>
            </div>

            <div style={styles.agentCard}>
              <h3 style={styles.agentTitle}>{t("methodology.dataCollectionAgents.agents.agentB.title")}</h3>
              <p style={styles.agentDesc}>{t("methodology.dataCollectionAgents.agents.agentB.description")}</p>
              <div style={styles.agentMetrics}>
                <span style={styles.agentTag}>{t("methodology.dataCollectionAgents.agents.agentB.evidence")}</span>
                <span style={styles.agentTag}>{t("methodology.dataCollectionAgents.agents.agentB.feeds")}</span>
              </div>
            </div>

            <div style={styles.agentCard}>
              <h3 style={styles.agentTitle}>{t("methodology.dataCollectionAgents.agents.rvi.title")}</h3>
              <p style={styles.agentDesc}>{t("methodology.dataCollectionAgents.agents.rvi.description")}</p>
              <div style={styles.agentMetrics}>
                <span style={styles.agentTag}>{t("methodology.dataCollectionAgents.agents.rvi.evidence")}</span>
                <span style={styles.agentTag}>{t("methodology.dataCollectionAgents.agents.rvi.feeds")}</span>
              </div>
            </div>

            <div style={styles.agentCard}>
              <h3 style={styles.agentTitle}>{t("methodology.dataCollectionAgents.agents.sss.title")}</h3>
              <p style={styles.agentDesc}>{t("methodology.dataCollectionAgents.agents.sss.description")}</p>
              <div style={styles.agentMetrics}>
                <span style={styles.agentTag}>{t("methodology.dataCollectionAgents.agents.sss.evidence")}</span>
                <span style={styles.agentTag}>{t("methodology.dataCollectionAgents.agents.sss.feeds")}</span>
              </div>
            </div>

            <div style={styles.agentCard}>
              <h3 style={styles.agentTitle}>{t("methodology.dataCollectionAgents.agents.rem.title")}</h3>
              <p style={styles.agentDesc}>{t("methodology.dataCollectionAgents.agents.rem.description")}</p>
              <div style={styles.agentMetrics}>
                <span style={styles.agentTag}>{t("methodology.dataCollectionAgents.agents.rem.evidence")}</span>
                <span style={styles.agentTag}>{t("methodology.dataCollectionAgents.agents.rem.feeds")}</span>
              </div>
            </div>

            <div style={styles.agentCard}>
              <h3 style={styles.agentTitle}>{t("methodology.dataCollectionAgents.agents.irs.title")}</h3>
              <p style={styles.agentDesc}>{t("methodology.dataCollectionAgents.agents.irs.description")}</p>
              <div style={styles.agentMetrics}>
                <span style={styles.agentTag}>{t("methodology.dataCollectionAgents.agents.irs.evidence")}</span>
                <span style={styles.agentTag}>{t("methodology.dataCollectionAgents.agents.irs.feeds")}</span>
              </div>
            </div>

            <div style={styles.agentCard}>
              <h3 style={styles.agentTitle}>{t("methodology.dataCollectionAgents.agents.frp.title")}</h3>
              <p style={styles.agentDesc}>{t("methodology.dataCollectionAgents.agents.frp.description")}</p>
              <div style={styles.agentMetrics}>
                <span style={styles.agentTag}>{t("methodology.dataCollectionAgents.agents.frp.evidence")}</span>
                <span style={styles.agentTag}>{t("methodology.dataCollectionAgents.agents.frp.feeds")}</span>
              </div>
            </div>

            <div style={styles.agentCard}>
              <h3 style={styles.agentTitle}>{t("methodology.dataCollectionAgents.agents.mis.title")}</h3>
              <p style={styles.agentDesc}>{t("methodology.dataCollectionAgents.agents.mis.description")}</p>
              <div style={styles.agentMetrics}>
                <span style={styles.agentTag}>{t("methodology.dataCollectionAgents.agents.mis.evidence")}</span>
                <span style={styles.agentTag}>{t("methodology.dataCollectionAgents.agents.mis.feeds")}</span>
              </div>
            </div>
          </div>

          <div style={styles.agentNoteCard}>
            <h3 style={styles.agentNoteTitle}>{t("methodology.dataCollectionAgents.agentC.title")}</h3>
            <p style={styles.agentNoteText}>
              {t("methodology.dataCollectionAgents.agentC.description")}
            </p>
          </div>
        </section>

        {/* The 5 Pillars */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("methodology.pillars.title")}</h2>
          <p style={styles.sectionLead}>
            {t("methodology.pillars.lead")}
          </p>

          <div style={styles.pillarsGrid}>
            <div style={styles.pillarCard}>
              <div style={styles.pillarHeader}>
                <h3 style={styles.pillarTitle}>{t("methodology.pillars.cards.transparency.title")}</h3>
                <div style={styles.pillarWeight}>25%</div>
              </div>
              <p style={styles.pillarDesc}>
                {t("methodology.pillars.cards.transparency.desc")}
              </p>
              <div style={styles.pillarMetrics}>
                <span style={styles.metricTag}>rules.clarity</span>
                <span style={styles.metricTag}>rules.accessible</span>
                <span style={styles.metricTag}>fees.disclosed</span>
                <span style={styles.metricTag}>pricing.clear</span>
              </div>
            </div>

            <div style={styles.pillarCard}>
              <div style={styles.pillarHeader}>
                <h3 style={styles.pillarTitle}>{t("methodology.pillars.cards.payoutReliability.title")}</h3>
                <div style={styles.pillarWeight}>25%</div>
              </div>
              <p style={styles.pillarDesc}>
                {t("methodology.pillars.cards.payoutReliability.desc")}
              </p>
              <div style={styles.pillarMetrics}>
                <span style={styles.metricTag}>payout.structure</span>
                <span style={styles.metricTag}>payout.conditions</span>
                <span style={styles.metricTag}>payout.logic</span>
              </div>
            </div>

            <div style={styles.pillarCard}>
              <div style={styles.pillarHeader}>
                <h3 style={styles.pillarTitle}>{t("methodology.pillars.cards.riskModel.title")}</h3>
                <div style={styles.pillarWeight}>20%</div>
              </div>
              <p style={styles.pillarDesc}>
                {t("methodology.pillars.cards.riskModel.desc")}
              </p>
              <div style={styles.pillarMetrics}>
                <span style={styles.metricTag}>risk.model.type</span>
                <span style={styles.metricTag}>loss.limits</span>
                <span style={styles.metricTag}>drawdown.logic</span>
              </div>
            </div>

            <div style={styles.pillarCard}>
              <div style={styles.pillarHeader}>
                <h3 style={styles.pillarTitle}>{t("methodology.pillars.cards.legalCompliance.title")}</h3>
                <div style={styles.pillarWeight}>20%</div>
              </div>
              <p style={styles.pillarDesc}>
                {t("methodology.pillars.cards.legalCompliance.desc")}
              </p>
              <div style={styles.pillarMetrics}>
                <span style={styles.metricTag}>jurisdiction.tier</span>
                <span style={styles.metricTag}>disclaimer.quality</span>
                <span style={styles.metricTag}>exposure.risk</span>
              </div>
            </div>

            <div style={styles.pillarCard}>
              <div style={styles.pillarHeader}>
                <h3 style={styles.pillarTitle}>{t("methodology.pillars.cards.reputationSupport.title")}</h3>
                <div style={styles.pillarWeight}>10%</div>
              </div>
              <p style={styles.pillarDesc}>
                {t("methodology.pillars.cards.reputationSupport.desc")}
              </p>
              <div style={styles.pillarMetrics}>
                <span style={styles.metricTag}>trustpilot.score</span>
                <span style={styles.metricTag}>domain.age</span>
                <span style={styles.metricTag}>support.signals</span>
              </div>
            </div>
          </div>
        </section>

        {/* Open Specification */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("methodology.openSpec.title")}</h2>
          <p style={styles.sectionLead}>
            {t("methodology.openSpec.lead")}
          </p>

          <div style={styles.specCard}>
            <div style={styles.specHeader}>
              <h3 style={styles.specTitle}>gpti.score.v1</h3>
              <a
                href="/spec/gpti_score_v1.json"
                target="_blank"
                rel="noreferrer"
                style={styles.specLink}
              >
                📥 {t("methodology.openSpec.downloadJson")}
              </a>
            </div>

            <div tabIndex={0} aria-label="Scoring formula" style={styles.codeBlock}>
              <pre style={styles.codeText}>{`{
  "version": "gpti.score.v1",
  "description": "GTIXT scoring specification v1.0",
  "pillars": {
    "transparency": {
      "weight": 0.25,
      "metrics": {
        "rules.clarity": {
          "type": "score_map",
          "weight": 0.35,
          "mapping": {
            "0": 0.1, "25": 0.4, "50": 0.6,
            "75": 0.85, "100": 1.0
          }
        },
        "rules.accessible": {
          "type": "boolean",
          "weight": 0.30,
          "mapping": { "true": 1.0, "false": 0.0 }
        },
        "fees.disclosed": {
          "type": "boolean",
          "weight": 0.20,
          "mapping": { "true": 1.0, "false": 0.0 }
        }
      }
    },
    "payout_reliability": { "weight": 0.25 },
    "risk_model": { "weight": 0.20 },
    "legal_compliance": { "weight": 0.20 },
    "reputation_support": { "weight": 0.10 }
  },
  "na_policy": {
    "default_score": 0.5,
    "description": "Missing inputs default to neutral"
  }
}`}</pre>
            </div>

            <p style={styles.specNote}>
              {t("methodology.openSpec.note")}
            </p>
          </div>
        </section>

        {/* Versioning */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("methodology.versioning.title")}</h2>
          <p style={styles.sectionLead}>
            {t("methodology.versioning.lead")}
          </p>

          <div style={styles.versionGrid}>
            <div style={styles.versionCard}>
              <div style={styles.versionBadge}>v1.0</div>
              <h3 style={styles.versionTitle}>{t("methodology.versioning.cards.v1_0.title")}</h3>
              <p style={styles.versionDate}>{t("methodology.versioning.cards.v1_0.date")}</p>
              <p style={styles.versionDesc}>
                {t("methodology.versioning.cards.v1_0.desc")}
              </p>
              <a href="/whitepaper/GTIXT_Whitepaper_v1.pdf" target="_blank" rel="noreferrer" style={styles.versionLink}>
                {t("methodology.versioning.cards.v1_0.link")}
              </a>
            </div>

            <div style={styles.versionCard}>
              <div style={styles.versionBadge}>v1.1</div>
              <h3 style={styles.versionTitle}>{t("methodology.versioning.cards.v1_1.title")}</h3>
              <p style={styles.versionDate}>{t("methodology.versioning.cards.v1_1.date")} (Q2-Q3 2026 - Planned)</p>
              <p style={styles.versionDesc}>
                {t("methodology.versioning.cards.v1_1.desc")}
              </p>
              <p style={{...styles.versionLink, color: "#D0D7DE", marginTop: "12px", fontSize: "13px", fontStyle: "italic"}}
                >
                 ⏳ In development - Full details available upon release
              </p>
            </div>

            <div style={styles.versionCard}>
              <div style={{...styles.versionBadge, backgroundColor: "#1E2630", color: "#7FB3FF"}}>v2.0</div>
              <h3 style={styles.versionTitle}>{t("methodology.versioning.cards.v2_0.title")}</h3>
              <p style={styles.versionDate}>{t("methodology.versioning.cards.v2_0.date")} (2027 - Strategic Planning)</p>
              <p style={styles.versionDesc}>
                {t("methodology.versioning.cards.v2_0.desc")}
              </p>
            </div>
          </div>

          <div style={styles.versionPolicyCard}>
            <h3 style={styles.versionPolicyTitle}>{t("methodology.versioning.policy.title")}</h3>
            <ul style={styles.versionPolicyList}>
              <li style={styles.versionPolicyItem}>
                <strong>{t("methodology.versioning.policy.items.major.label")}</strong> {t("methodology.versioning.policy.items.major.text")}
              </li>
              <li style={styles.versionPolicyItem}>
                <strong>{t("methodology.versioning.policy.items.minor.label")}</strong> {t("methodology.versioning.policy.items.minor.text")}
              </li>
              <li style={styles.versionPolicyItem}>
                <strong>{t("methodology.versioning.policy.items.historical.label")}</strong> {t("methodology.versioning.policy.items.historical.text")}
              </li>
            </ul>
          </div>
        </section>

        {/* Evidence Model */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("methodology.evidenceModel.title")}</h2>
          <p style={styles.sectionLead}>
            {t("methodology.evidenceModel.lead")}
          </p>

          <div style={styles.evidenceGrid}>
            <div style={styles.evidenceCard}>
              <div style={styles.evidenceIcon}>🔍</div>
              <h3 style={styles.evidenceTitle}>{t("methodology.evidenceModel.cards.excerpts.title")}</h3>
              <p style={styles.evidenceText}>
                {t("methodology.evidenceModel.cards.excerpts.text")}
              </p>
            </div>

            <div style={styles.evidenceCard}>
              <div style={styles.evidenceIcon}>🔗</div>
              <h3 style={styles.evidenceTitle}>{t("methodology.evidenceModel.cards.uriProvenance.title")}</h3>
              <p style={styles.evidenceText}>
                {t("methodology.evidenceModel.cards.uriProvenance.text")}
              </p>
            </div>

            <div style={styles.evidenceCard}>
              <div style={styles.evidenceIcon}>⛓️</div>
              <h3 style={styles.evidenceTitle}>{t("methodology.evidenceModel.cards.cryptoChain.title")}</h3>
              <p style={styles.evidenceText}>
                {t("methodology.evidenceModel.cards.cryptoChain.text")}
              </p>
            </div>
          </div>

          <div style={styles.evidenceFlowCard}>
            <h3 style={styles.evidenceFlowTitle}>{t("methodology.evidenceModel.flow.title")}</h3>
            <div style={styles.evidenceFlow}>
              <div style={styles.flowStep}>
                <div style={styles.flowStepNumber}>1</div>
                <div style={styles.flowStepText}>
                  <strong>{t("methodology.evidenceModel.flow.steps.capture.label")}</strong> {t("methodology.evidenceModel.flow.steps.capture.text")}
                </div>
              </div>
              <div style={styles.flowStep}>
                <div style={styles.flowStepNumber}>2</div>
                <div style={styles.flowStepText}>
                  <strong>{t("methodology.evidenceModel.flow.steps.validate.label")}</strong> {t("methodology.evidenceModel.flow.steps.validate.text")}
                </div>
              </div>
              <div style={styles.flowStep}>
                <div style={styles.flowStepNumber}>3</div>
                <div style={styles.flowStepText}>
                  <strong>{t("methodology.evidenceModel.flow.steps.score.label")}</strong> {t("methodology.evidenceModel.flow.steps.score.text")}
                </div>
              </div>
              <div style={styles.flowStep}>
                <div style={styles.flowStepNumber}>4</div>
                <div style={styles.flowStepText}>
                  <strong>{t("methodology.evidenceModel.flow.steps.snapshot.label")}</strong> {t("methodology.evidenceModel.flow.steps.snapshot.text")}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Universe & Scope */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("methodology.indexScope.title")}</h2>
          <p style={styles.sectionLead}>
            {t("methodology.indexScope.lead")}
          </p>

          <div style={styles.scopeGrid}>
            <div style={styles.scopeCard}>
              <h3 style={styles.scopeTitle}>{t("methodology.indexScope.cards.universeStates.title")}</h3>
              <ul style={styles.scopeList}>
                <li style={styles.scopeListItem}>
                  <strong>{t("methodology.indexScope.cards.universeStates.items.candidate.label")}</strong> {t("methodology.indexScope.cards.universeStates.items.candidate.text")}
                </li>
                <li style={styles.scopeListItem}>
                  <strong>{t("methodology.indexScope.cards.universeStates.items.watchlist.label")}</strong> {t("methodology.indexScope.cards.universeStates.items.watchlist.text")}
                </li>
                <li style={styles.scopeListItem}>
                  <strong>{t("methodology.indexScope.cards.universeStates.items.excluded.label")}</strong> {t("methodology.indexScope.cards.universeStates.items.excluded.text")}
                </li>
              </ul>
            </div>

            <div style={styles.scopeCard}>
              <h3 style={styles.scopeTitle}>{t("methodology.indexScope.cards.dataRequirements.title")}</h3>
              <ul style={styles.scopeList}>
                <li style={styles.scopeListItem}>{t("methodology.indexScope.cards.dataRequirements.items.rules")}</li>
                <li style={styles.scopeListItem}>{t("methodology.indexScope.cards.dataRequirements.items.pricing")}</li>
                <li style={styles.scopeListItem}>{t("methodology.indexScope.cards.dataRequirements.items.footprint")}</li>
                <li style={styles.scopeListItem}>{t("methodology.indexScope.cards.dataRequirements.items.evidence")}</li>
              </ul>
            </div>
          </div>

          <div style={styles.integrityGateCard}>
            <h3 style={styles.integrityGateTitle}>{t("methodology.indexScope.integrityGate.title")}</h3>
            <p style={styles.integrityGateText}>
              {t("methodology.indexScope.integrityGate.text")}
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <section style={styles.disclaimerSection}>
          <p style={styles.disclaimerText}>
            <strong>{t("methodology.disclaimer.label")}</strong> {t("methodology.disclaimer.text")}
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "80px 20px",
  },
  hero: {
    marginBottom: "80px",
    textAlign: "center",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "#7FB3FF",
    marginBottom: "16px",
  },
  h1: {
    fontSize: "48px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "20px",
    lineHeight: "1.1",
  },
  lead: {
    fontSize: "18px",
    color: "#D0D7DE",
    lineHeight: "1.7",
    maxWidth: "800px",
    margin: "0 auto 32px",
  },
  heroCtas: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  button: {
    display: "inline-block",
    padding: "14px 28px",
    fontSize: "15px",
    fontWeight: "600",
    border: "1px solid transparent",
    borderRadius: "8px",
    cursor: "pointer",
    textDecoration: "none",
    textAlign: "center",
    transition: "all 0.2s ease",
  },
  buttonPrimary: {
    backgroundColor: "#1A5CE0",
    color: "#FFFFFF",
  },
  buttonSecondary: {
    backgroundColor: "#1E2630",
    color: "#C9D1D9",
  },
  buttonGhost: {
    backgroundColor: "transparent",
    color: "#E6EDF3",
    border: "2px solid #E6EDF3",
  },
  section: {
    marginBottom: "80px",
    backgroundColor: "#11161C",
    padding: "60px 20px",
    borderRadius: "16px",
  },
  h2: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "20px",
    textAlign: "center",
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
  },
  sectionLead: {
    fontSize: "17px",
    color: "#C9D1D9",
    lineHeight: "1.6",
    textAlign: "center",
    maxWidth: "700px",
    margin: "0 auto 40px",
    fontWeight: "500",
  },
  principlesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "24px",
  },
  principleCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "32px",
    textAlign: "center",
  },
  principleIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  principleTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  principleText: {
    fontSize: "14px",
    color: "#D0D7DE",
    lineHeight: "1.6",
  },
  formulaCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "32px",
    textAlign: "center",
    marginBottom: "32px",
  },
  formulaLabel: {
    fontSize: "14px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "#7FB3FF",
    marginBottom: "16px",
  },
  formulaBox: {
    backgroundColor: "#0B0E11",
    border: "1px solid #2F81F7",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "12px",
  },
  formulaCode: {
    fontFamily: "monospace",
    fontSize: "18px",
    color: "#C9D1D9",
    fontWeight: "600",
  },
  formulaNote: {
    fontSize: "13px",
    color: "#D0D7DE",
    fontStyle: "italic",
  },
  frameworkGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  },
  frameworkCard: {
    backgroundColor: "#1E2630",
    border: "1px solid #2F81F7",
    borderRadius: "12px",
    padding: "24px",
  },
  frameworkTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  frameworkText: {
    fontSize: "14px",
    color: "#D0D7DE",
    lineHeight: "1.6",
  },
  pillarsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
  },
  pillarCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
  },
  pillarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  pillarTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#C9D1D9",
  },
  pillarWeight: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#3FB950",
    backgroundColor: "#1E2630",
    padding: "6px 12px",
    borderRadius: "8px",
  },
  pillarDesc: {
    fontSize: "14px",
    color: "#D0D7DE",
    lineHeight: "1.6",
    marginBottom: "16px",
  },
  pillarMetrics: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  metricTag: {
    fontSize: "11px",
    fontWeight: "600",
    fontFamily: "monospace",
    color: "#E6EDF3",
    backgroundColor: "#0B0E11",
    border: "1px solid rgba(127, 179, 255, 0.6)",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  specCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "32px",
  },
  specHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "12px",
  },
  specTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#C9D1D9",
    fontFamily: "monospace",
  },
  specLink: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#E6EDF3",
    textDecoration: "underline",
  },
  codeBlock: {
    backgroundColor: "#0B0E11",
    border: "1px solid #2F81F7",
    borderRadius: "8px",
    padding: "20px",
    overflow: "auto",
    marginBottom: "16px",
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#C9D1D9",
    lineHeight: "1.8",
    whiteSpace: "pre",
    margin: 0,
  },
  specNote: {
    fontSize: "14px",
    color: "#D0D7DE",
    lineHeight: "1.6",
  },
  versionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },
  versionCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
  },
  versionBadge: {
    display: "inline-block",
    fontSize: "14px",
    fontWeight: "700",
    color: "#0B0E11",
    backgroundColor: "#2F81F7",
    padding: "6px 14px",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  versionTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "8px",
  },
  versionDate: {
    fontSize: "13px",
    color: "#D0D7DE",
    marginBottom: "12px",
    fontStyle: "italic",
  },
  versionDesc: {
    fontSize: "14px",
    color: "#D0D7DE",
    lineHeight: "1.6",
    marginBottom: "16px",
  },
  versionLink: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#E6EDF3",
    textDecoration: "underline",
  },
  versionPolicyCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
  },
  versionPolicyTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "16px",
  },
  versionPolicyList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  versionPolicyItem: {
    fontSize: "14px",
    color: "#D0D7DE",
    lineHeight: "1.6",
    marginBottom: "12px",
    paddingLeft: "20px",
    position: "relative",
  },
  evidenceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },
  evidenceCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #D64545",
    borderRadius: "12px",
    padding: "28px",
    textAlign: "center",
  },
  evidenceIcon: {
    fontSize: "40px",
    marginBottom: "16px",
  },
  evidenceTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  evidenceText: {
    fontSize: "14px",
    color: "#D0D7DE",
    lineHeight: "1.6",
  },
  evidenceFlowCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "32px",
  },
  evidenceFlowTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "24px",
    textAlign: "center",
  },
  evidenceFlow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  },
  flowStep: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  flowStepNumber: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#2F81F7",
    color: "#0B0E11",
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "12px",
  },
  flowStepText: {
    fontSize: "13px",
    color: "#D0D7DE",
    lineHeight: "1.5",
  },
  scopeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },
  scopeCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
  },
  scopeTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "16px",
  },
  scopeList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  scopeListItem: {
    fontSize: "14px",
    color: "#D0D7DE",
    lineHeight: "1.6",
    marginBottom: "12px",
  },
  integrityGateCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #D64545",
    borderRadius: "12px",
    padding: "28px",
  },
  integrityGateTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  integrityGateText: {
    fontSize: "14px",
    color: "#D0D7DE",
    lineHeight: "1.6",
  },
  disclaimerSection: {
    marginBottom: "40px",
    textAlign: "center",
  },
  disclaimerText: {
    fontSize: "13px",
    color: "#D0D7DE",
    lineHeight: "1.6",
    maxWidth: "800px",
    margin: "0 auto",
    fontStyle: "italic",
  },
  agentsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  agentCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "24px",
  },
  agentTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  agentDesc: {
    fontSize: "14px",
    color: "#D0D7DE",
    lineHeight: "1.6",
    marginBottom: "16px",
  },
  agentMetrics: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  agentTag: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#E6EDF3",
    backgroundColor: "#0B0E11",
    border: "1px solid #2F81F7",
    padding: "4px 10px",
    borderRadius: "4px",
  },
  agentNoteCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #F0A500",
    borderRadius: "12px",
    padding: "28px",
    marginTop: "12px",
  },
  agentNoteTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  agentNoteText: {
    fontSize: "14px",
    color: "#D0D7DE",
    lineHeight: "1.6",
  },
  pillarTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    justifyContent: "center",
    marginTop: "32px",
  },
  pillarTag: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#E6EDF3",
    backgroundColor: "#1E2630",
    border: "1px solid #2F81F7",
    padding: "8px 16px",
    borderRadius: "8px",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },
  metricCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "32px",
    textAlign: "center",
  },
  metricValue: {
    fontSize: "42px",
    fontWeight: "700",
    color: "#3FB950",
    marginBottom: "8px",
  },
  metricLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#D0D7DE",
  },
  snapshotInfo: {
    backgroundColor: "#1E2630",
    border: "1px solid #2F81F7",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "24px",
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  snapshotDetail: {
    fontSize: "13px",
    color: "#D0D7DE",
    fontFamily: "monospace",
  },
  verificationButtons: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
  },};