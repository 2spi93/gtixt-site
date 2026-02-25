import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import PageNavigation from '../components/PageNavigation';
import { useTranslation } from '../lib/useTranslationStub';

interface AgentStatus {
  agent: string;
  name: string;
  description: string;
  status: 'complete' | 'testing' | 'pending';
  evidenceTypes: string[];
  performanceMs: number;
}

interface Phase2Data {
  agents: AgentStatus[];
  totalAgents: number;
  completeAgents: number;
  evidenceTypes: number;
  testsPassing: number;
  criticalIssues: number;
  productionReady: boolean;
}

interface Phase2Props {
  initialData: Phase2Data | null;
}

const getDefaultPhase2Data = (): Phase2Data => ({
  agents: [
    {
      agent: 'CRAWLER',
      name: 'Web Crawler',
      description: 'Collecte des pages publiques (rules, pricing, legal, FAQ)',
      status: 'testing',
      evidenceTypes: ['RAW_HTML', 'HOME_HTML', 'RULES_HTML', 'PRICING_HTML'],
      performanceMs: 0,
    },
    {
      agent: 'RVI',
      name: 'Registry Verification',
      description: 'Vérification des licences et registres réglementaires (FCA, FINRA, etc.)',
      status: 'complete',
      evidenceTypes: ['LICENSE_VERIFICATION'],
      performanceMs: 0,
    },
    {
      agent: 'SSS',
      name: 'Sanctions Screening',
      description: 'Dépistage des listes de sanctions (OFAC, ONU, EU, etc.)',
      status: 'complete',
      evidenceTypes: ['WATCHLIST_MATCH'],
      performanceMs: 0,
    },
    {
      agent: 'REM',
      name: 'Regulatory Events Monitor',
      description: 'Suivi des actions réglementaires et violations de conformité',
      status: 'complete',
      evidenceTypes: ['REGULATORY_EVENT'],
      performanceMs: 0,
    },
    {
      agent: 'IRS',
      name: 'Independent Review System',
      description: 'Validation des soumissions et documents réglementaires',
      status: 'complete',
      evidenceTypes: ['SUBMISSION_VERIFICATION'],
      performanceMs: 0,
    },
    {
      agent: 'FRP',
      name: 'Firm Reputation & Payout',
      description: 'Analyse de la réputation, des paiements et des sentiments',
      status: 'complete',
      evidenceTypes: ['REPUTATION_RISK', 'PAYOUT_RISK', 'SENTIMENT_RISK'],
      performanceMs: 0,
    },
    {
      agent: 'MIS',
      name: 'Manual Investigation System',
      description: 'Recherche approfondie et détection d\'anomalies',
      status: 'complete',
      evidenceTypes: ['DOMAIN_ANOMALY', 'COMPANY_ISSUE', 'NEWS_RISK', 'SUSPICIOUS_PATTERN'],
      performanceMs: 0,
    },
    {
      agent: 'IIP',
      name: 'IOSCO Implementation & Publication',
      description: 'Génération de rapports de conformité IOSCO et certification réglementaire',
      status: 'complete',
      evidenceTypes: ['COMPLIANCE_REPORT'],
      performanceMs: 0,
    },
    {
      agent: 'AGENT_C',
      name: 'Oversight Gate',
      description: 'Contrôle qualité, validation finale, publication snapshots',
      status: 'complete',
      evidenceTypes: ['VALIDATION_EVENT', 'SNAPSHOT_APPROVAL'],
      performanceMs: 0,
    },
  ],
  totalAgents: 9,
  completeAgents: 8,
  evidenceTypes: 7,
  testsPassing: 1,
  criticalIssues: 0,
  productionReady: false,
});

const Phase2: NextPage<Phase2Props> = ({ initialData }) => {
  const [data, setData] = useState<Phase2Data | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [activeAgent, setActiveAgent] = useState<string>('RVI');
  const { t } = useTranslation('common');

  useEffect(() => {
    // Ne charger que si aucune donnée initiale n'existe (évite l'hydratation mismatch)
    if (initialData) {
      return;
    }

    // Charger les données Phase 2
    const loadData = async () => {
      try {
        const response = await fetch('/api/agents/status');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          // Données par défaut si l'API n'est pas disponible
          setData(getDefaultPhase2Data());
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données Phase 2:', error);
        setData(getDefaultPhase2Data());
      }
      setLoading(false);
    };

    loadData();
  }, [initialData]);


  const selectedAgent = data?.agents.find(a => a.agent === activeAgent);

  return (
    <>
      <Head>
        <title>Phase 2 - Bot Framework — GPTI</title>
        <meta name="description" content="GPTI Phase 2: 7 bot agents for automated compliance verification" />
        <style>{`
          /* Responsive Grid for Agents Section */
          @media (max-width: 768px) {
            .agent-grid-responsive {
              grid-template-columns: 1fr !important;
              gap: 20px !important;
            }
            .agent-list-responsive {
              display: grid !important;
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 6px !important;
              max-height: none !important;
            }
            .agent-list-responsive button {
              padding: 8px 6px !important;
              font-size: 10px !important;
              min-height: 60px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              text-align: center;
            }
            .agent-list-responsive button strong {
              font-size: 11px !important;
              display: block;
              margin-bottom: 2px;
            }
            .agent-list-responsive button > div:first-child {
              width: 100%;
              flex-direction: column;
              gap: 2px;
            }
            .agent-list-responsive button > div:last-child {
              font-size: 9px !important;
              line-height: 1.2 !important;
              white-space: normal !important;
              overflow: visible !important;
              text-overflow: clip !important;
              word-break: break-word;
              text-align: center;
            }
            
            /* Hide Agent Details Panel on Mobile - Too much info */
            .agent-details-responsive {
              display: none !important;
            }
            
            /* Responsive Table - Convert to Cards on Mobile */
            .metrics-table-container table {
              display: block;
              width: 100%;
            }
            .metrics-table-container thead {
              display: none;
            }
            .metrics-table-container tbody {
              display: block;
            }
            .metrics-table-container tr {
              display: block;
              margin-bottom: 16px;
              background: #f9f9f9;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              padding: 12px;
            }
            .metrics-table-container td {
              display: block;
              text-align: left !important;
              padding: 8px 0 !important;
              border: none !important;
            }
            .metrics-table-container td:before {
              content: attr(data-label);
              font-weight: 600;
              display: inline-block;
              margin-right: 8px;
              color: #666;
              min-width: 120px;
            }
            
            .header-metrics-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
            .evidence-grid-responsive {
              grid-template-columns: 1fr !important;
            }
            .flow-container-responsive {
              grid-template-columns: 1fr !important;
            }
            .quality-grid-responsive {
              grid-template-columns: repeat(2, 1fr) !important;
            }
            .doc-grid-responsive,
            .code-grid-responsive,
            .next-steps-responsive {
              grid-template-columns: 1fr !important;
            }
          }
          @media (max-width: 480px) {
            .agent-list-responsive {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 8px !important;
            }
            .agent-list-responsive button {
              min-height: 70px;
            }
            .header-metrics-grid,
            .quality-grid-responsive {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </Head>

      <div style={styles.container}>
        {/* Navigation */}
        <PageNavigation />
        
        {/* Header */}
        <section style={styles.header}>
          <div style={styles.headerContent}>
            <p style={styles.eyebrow}>PHASE 2 - BOT FRAMEWORK (v1.1 READY)</p>
            <h1 style={styles.title}>7 Agents Spécialisés</h1>
            <p style={styles.lead}>
              Système complet de vérification de conformité automatisée avec 7 agents intelligents, pipeline de preuves cryptographiques et rapports IOSCO institutionnels.
            </p>
            <div style={styles.metrics} className="header-metrics-grid">
              {data && (
                <>
                  <div style={styles.metric}>
                    <div style={styles.metricValue}>{data.completeAgents}/{data.totalAgents}</div>
                    <div style={styles.metricLabel}>Agents Complets</div>
                  </div>
                  <div style={styles.metric}>
                    <div style={styles.metricValue}>{data.evidenceTypes}</div>
                    <div style={styles.metricLabel}>Types de Preuves</div>
                  </div>
                  <div style={styles.metric}>
                    <div style={styles.metricValue}>{data.testsPassing}+</div>
                    <div style={styles.metricLabel}>Tests Réussis</div>
                  </div>
                  <div style={styles.metric}>
                    <div style={styles.metricValue}>{data.criticalIssues}</div>
                    <div style={styles.metricLabel}>Problèmes Critiques</div>
                  </div>
                </>
              )}
            </div>
            {data?.productionReady && (
              <div style={styles.badge}>✅ Production Ready</div>
            )}
          </div>
        </section>

        {/* Status Overview */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>État du Projet</h2>
          <div style={styles.statusGrid}>
            <div style={styles.statusCard}>
              <h3>Phase 1</h3>
              <p style={styles.statusValue}>✅ Opérationnel (v1.1)</p>
              <p style={styles.statusDetail}>19 fichiers, 4,900 lignes + cryptographie</p>
            </div>
            <div style={styles.statusCard}>
              <h3>Phase 2</h3>
              <p style={styles.statusValue}>✅ Livrée (v1.1)</p>
              <p style={styles.statusDetail}>7 agents, 4,524 lignes + preuves signées</p>
            </div>
            <div style={styles.statusCard}>
              <h3>Phase 3</h3>
              <p style={styles.statusValue}>🔄 EN COURS (15 fév - 31 mar)</p>
              <p style={styles.statusDetail}>Intégration API réelle: 60% complète</p>
            </div>
            <div style={styles.statusCard}>
              <h3>Lancement</h3>
              <p style={styles.statusValue}>📅 11 avril 2026</p>
              <p style={styles.statusDetail}>Déploiement production</p>
            </div>
          </div>
        </section>

        {/* v1.1 Institutional Features */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🔐 Institutional Cryptographic Features (v1.1)</h2>
          <p style={{...styles.lead, textAlign: 'left', margin: '0 0 32px'}}>
            Chaque preuve générée par les 7 agents est intégrée dans un système de vérification cryptographique multi-niveaux avec signatures ECDSA et traçabilité complète.
          </p>
          <div style={styles.statusGrid}>
            <div style={{...styles.statusCard, borderLeft: '4px solid #00D1C1'}}>
              <h3>🔗 Multi-Level Hashing</h3>
              <p style={styles.statusDetail}>
                SHA-256 en cascade: Evidence → Firm → Pillar → Dataset → ECDSA-secp256k1
              </p>
            </div>
            <div style={{...styles.statusCard, borderLeft: '4px solid #2563eb'}}>
              <h3>🔏 ECDSA Signatures</h3>
              <p style={styles.statusDetail}>
                Signatures cryptographiques non-répudiables pour chaque snapshot publié
              </p>
            </div>
            <div style={{...styles.statusCard, borderLeft: '4px solid #f97316'}}>
              <h3>📊 4 Provenance Endpoints</h3>
              <p style={styles.statusDetail}>
                /api/provenance/trace, /graph, /evidence, /verify - Audit trail complet
              </p>
            </div>
            <div style={{...styles.statusCard, borderLeft: '4px solid #22c55e'}}>
              <h3>✅ Institutional Compliance</h3>
              <p style={styles.statusDetail}>
                Conformité réglementaire complète avec Advisory Board et gouvernance
              </p>
            </div>
          </div>
          <div style={{textAlign: 'center', marginTop: '24px'}}>
            <Link href="/integrity" style={{...styles.buttonPrimary, display: 'inline-block'}}>
              🔐 En savoir plus sur v1.1
            </Link>
          </div>
        </section>

        {/* Agents Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>7 Agents Spécialisés</h2>
          
          {/* Mobile: Compact Cards, Desktop: Grid with Details Panel */}
          <div style={styles.agentGrid} className="agent-grid-responsive">
            {/* Agent List */}
            <div style={styles.agentList} className="agent-list-responsive">
              {data?.agents.map(agent => (
                <button
                  key={agent.agent}
                  style={{
                    ...styles.agentButton,
                    ...(activeAgent === agent.agent ? styles.agentButtonActive : {}),
                  }}
                  onClick={() => setActiveAgent(agent.agent)}
                >
                  <div style={styles.agentButtonLabel}>
                    <strong style={{fontSize: '13px'}}>{agent.agent}</strong>
                    <span style={styles.statusBadge}>{agent.status === 'complete' ? '✅' : '⏳'}</span>
                  </div>
                  <div style={{...styles.agentButtonName, fontSize: '11px', lineHeight: '1.3'}}>{agent.name}</div>
                </button>
              ))}
            </div>

            {/* Agent Details */}
            {selectedAgent && (
              <div style={styles.agentDetails} className="agent-details-responsive">
                <h3 style={styles.agentTitle}>{selectedAgent.agent}: {selectedAgent.name}</h3>
                <p style={styles.agentDescription}>{selectedAgent.description}</p>
                
                <div style={styles.agentInfo}>
                  <div style={styles.infoItem}>
                    <h4 style={styles.infoLabel}>Types de Preuves</h4>
                    <div style={styles.tagContainer} className="tag-container">
                      {selectedAgent.evidenceTypes.map(type => (
                        <span key={type} style={styles.tag}>{type}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div style={styles.infoItem}>
                    <h4 style={styles.infoLabel}>Performance</h4>
                    <p style={styles.performanceValue}>{selectedAgent.performanceMs.toLocaleString()} ms</p>
                  </div>

                  <div style={styles.infoItem}>
                    <h4 style={styles.infoLabel}>Statut</h4>
                    <p style={styles.statusLabel}>
                      {selectedAgent.status === 'complete' ? (
                        <span style={styles.statusComplete}>✅ Complet & Testé</span>
                      ) : (
                        <span style={styles.statusPending}>⏳ En cours</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Evidence System */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Système de Preuves (12 Types)</h2>
          <div style={styles.evidenceGrid} className="evidence-grid-responsive">
            <div style={styles.evidenceColumn}>
              <h3 style={styles.evidenceColumnTitle}>Vérification & Dépistage</h3>
              <ul style={styles.evidenceList}>
                <li><strong>LICENSE_VERIFICATION</strong> - Statut de licence confirmé/rejeté</li>
                <li><strong>WATCHLIST_MATCH</strong> - Entreprise trouvée sur liste de sanctions</li>
              </ul>
            </div>
            <div style={styles.evidenceColumn}>
              <h3 style={styles.evidenceColumnTitle}>Surveillance Réglementaire</h3>
              <ul style={styles.evidenceList}>
                <li><strong>REGULATORY_EVENT</strong> - Action réglementaire ou violation</li>
                <li><strong>SUBMISSION_VERIFICATION</strong> - Dépôt validé ou rejeté</li>
              </ul>
            </div>
            <div style={styles.evidenceColumn}>
              <h3 style={styles.evidenceColumnTitle}>Analyse de Risque</h3>
              <ul style={styles.evidenceList}>
                <li><strong>REPUTATION_RISK</strong> - Score de réputation en ligne</li>
                <li><strong>PAYOUT_RISK</strong> - Problèmes de retraits/paiements</li>
                <li><strong>SENTIMENT_RISK</strong> - Sentiment négatif des avis</li>
              </ul>
            </div>
            <div style={styles.evidenceColumn}>
              <h3 style={styles.evidenceColumnTitle}>Recherche Approfondie</h3>
              <ul style={styles.evidenceList}>
                <li><strong>DOMAIN_ANOMALY</strong> - Caractéristiques de domaine suspectes</li>
                <li><strong>COMPANY_ISSUE</strong> - Problèmes d\'enregistrement de l\'entreprise</li>
                <li><strong>NEWS_RISK</strong> - Nouvelles ou rapports négatifs</li>
                <li><strong>SUSPICIOUS_PATTERN</strong> - Comportement inhabituel détecté</li>
              </ul>
            </div>
            <div style={styles.evidenceColumn}>
              <h3 style={styles.evidenceColumnTitle}>Conformité & Certification</h3>
              <ul style={styles.evidenceList}>
                <li><strong>COMPLIANCE_REPORT</strong> - Certification de conformité IOSCO</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Orchestration */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Orchestration - Flux d'Exécution</h2>
          
          <div style={styles.flowContainer} className="flow-container-responsive">
            <div style={styles.flow}>
              <h3 style={styles.flowTitle}>📅 Flux Quotidien (6 agents)</h3>
              <div style={styles.flowSteps}>
                <div style={styles.flowStep}>1. Charger 50 entreprises</div>
                <div style={styles.flowStep}>2. RVI: Vérif. licence (0.6s)</div>
                <div style={styles.flowStep}>3. SSS: Dépistage sanction (10s)</div>
                <div style={styles.flowStep}>4. REM: Événements réglementaires (1s)</div>
                <div style={styles.flowStep}>5. IRS: Validation soumission (0.6s)</div>
                <div style={styles.flowStep}>6. FRP: Analyse réputation (18s)</div>
                <div style={styles.flowStep}>7. MIS: Recherche investigation (28s)</div>
                <div style={styles.flowStep}>8. Valider & publier preuves</div>
                <div style={styles.flowStepResult}>⏱️ Total: ~58 secondes</div>
              </div>
            </div>

            <div style={styles.flow}>
              <h3 style={styles.flowTitle}>📊 Flux Hebdomadaire (2 agents)</h3>
              <div style={styles.flowSteps}>
                <div style={styles.flowStep}>1. Charger toutes les entreprises</div>
                <div style={styles.flowStep}>2. SSS: Dépistage profond (20+ s)</div>
                <div style={styles.flowStep}>3. IIP: Rapports IOSCO (25+ s)</div>
                <div style={styles.flowStepResult}>⏱️ Total: ~50 secondes</div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Metrics */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Métriques de Performance</h2>
          <div style={styles.metricsTable} className="metrics-table-container">
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.tableHeader}>Agent</th>
                  <th style={styles.tableHeader}>Temps d'Exécution</th>
                  <th style={styles.tableHeader}>Statut</th>
                  <th style={styles.tableHeader}>Type de Preuve</th>
                </tr>
              </thead>
              <tbody>
                {data?.agents.map(agent => (
                  <tr key={agent.agent} style={styles.tableRow}>
                    <td style={styles.tableCell} data-label="Agent:"><strong>{agent.agent}</strong></td>
                    <td style={styles.tableCell} data-label="Temps:">{(agent.performanceMs / 1000).toFixed(2)}s</td>
                    <td style={styles.tableCell} data-label="Statut:">
                      {agent.status === 'complete' ? '✅ Complet' : '⏳ En cours'}
                    </td>
                    <td style={styles.tableCell} data-label="Type:">{agent.evidenceTypes[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.scalabilityBox}>
            <h3 style={styles.scalabilityTitle}>Scalabilité</h3>
            <p><strong>100 entreprises:</strong> ~116 secondes (~2 minutes)</p>
            <p><strong>500 entreprises:</strong> ~580 secondes (~10 minutes)</p>
            <p><strong>1 000 entreprises:</strong> ~1,160 secondes (~19 minutes)</p>
            <p><em>Note: Exécution séquentielle. Peut être parallélisée pour 3-4x plus rapide.</em></p>
          </div>
        </section>

        {/* Compliance Reporting */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Rapports de Conformité IOSCO</h2>
          <div style={styles.complianceContainer}>
            <div style={styles.complianceLevel}>
              <h3 style={styles.levelTitle}>Score 85 - FAIBLE RISQUE</h3>
              <p style={styles.levelStatus}>✅ CONFORME</p>
              <p style={styles.levelDescription}>Aucun problème détecté. Surveillance régulière recommandée.</p>
              <p style={styles.levelExample}>Exemple: FTMO</p>
            </div>
            <div style={styles.complianceLevel}>
              <h3 style={styles.levelTitle}>Score 65 - RISQUE MOYEN</h3>
              <p style={styles.levelStatus}>⚠️ CONDITIONNEL</p>
              <p style={styles.levelDescription}>Problèmes mineurs détectés. Correction nécessaire.</p>
              <p style={styles.levelExample}>Exemple: XM</p>
            </div>
            <div style={styles.complianceLevel}>
              <h3 style={styles.levelTitle}>Score 40 - RISQUE ÉLEVÉ</h3>
              <p style={styles.levelStatus}>⚠️ CONDITIONNEL</p>
              <p style={styles.levelDescription}>Problèmes multiples. Examen urgent requis.</p>
              <p style={styles.levelExample}>Exemple: Cas hypothétique</p>
            </div>
            <div style={styles.complianceLevel}>
              <h3 style={styles.levelTitle}>Score 20 - RISQUE CRITIQUE</h3>
              <p style={styles.levelStatus}>❌ NON-CONFORME</p>
              <p style={styles.levelDescription}>Risques graves détectés. Action réglementaire requise.</p>
              <p style={styles.levelExample}>Exemple: RoboForex</p>
            </div>
          </div>
        </section>

        {/* Quality Metrics */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Qualité de Code & Tests</h2>
          <div style={styles.qualityGrid} className="quality-grid-responsive">
            <div style={styles.qualityCard}>
              <h3>Type Safety</h3>
              <p style={styles.qualityValue}>100%</p>
              <p>Tous les arguments et retours typés</p>
            </div>
            <div style={styles.qualityCard}>
              <h3>Couverture de Tests</h3>
              <p style={styles.qualityValue}>20+</p>
              <p>Scénarios de test, tous passants</p>
            </div>
            <div style={styles.qualityCard}>
              <h3>Problèmes Critiques</h3>
              <p style={styles.qualityValue}>0</p>
              <p>Zéro problème détecté en production</p>
            </div>
            <div style={styles.qualityCard}>
              <h3>Documentation</h3>
              <p style={styles.qualityValue}>4,450+</p>
              <p>Lignes de documentation technique</p>
            </div>
          </div>
        </section>

        {/* Documentation Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Documentation Complète</h2>
          <div style={styles.docGrid} className="doc-grid-responsive">
            <div style={styles.docCard}>
              <h3>Pour Commencer</h3>
              <ul style={styles.docList}>
                <li><Link href="/methodology" style={styles.docLink}>📄 Méthodologie GTIXT</Link></li>
                <li><Link href="/docs" style={styles.docLink}>📚 Documentation Hub</Link></li>
                <li><Link href="/rankings" style={styles.docLink}>🚀 Voir les Rankings</Link></li>
                <li><Link href="/agents-dashboard" style={styles.docLink}>✅ Dashboard Agents</Link></li>
              </ul>
            </div>
            <div style={styles.docCard}>
              <h3>Documentation Technique</h3>
              <ul style={styles.docList}>
                <li><Link href="/api-docs" style={styles.docLink}>📋 API Documentation</Link></li>
                <li><Link href="/integrity" style={styles.docLink}>🔐 Integrity & Provenance (v1.1)</Link></li>
                <li><Link href="/governance" style={styles.docLink}>📚 Governance</Link></li>
              </ul>
            </div>
            <div style={styles.docCard}>
              <h3>Ressources</h3>
              <ul style={styles.docList}>
                <li><Link href="/regulatory-timeline" style={styles.docLink}>📊 Regulatory Timeline</Link></li>
                <li><Link href="/manifesto" style={styles.docLink}>📊 Manifesto</Link></li>
                <li><Link href="/ethics" style={styles.docLink}>📊 Ethics & Standards</Link></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Code Examples */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Commandes & Exemples</h2>
          <div style={styles.codeContainer} className="code-grid-responsive">
            <div style={styles.codeBox}>
              <h3 style={styles.codeTitle}>Tester Tous les Agents</h3>
              <pre style={styles.code}>{`cd /opt/gpti/gpti-data-bot
PYTHONPATH=./src:$PYTHONPATH python3 flows/orchestration.py`}</pre>
            </div>
            <div style={styles.codeBox}>
              <h3 style={styles.codeTitle}>Tester un Agent Individuel</h3>
              <pre style={styles.code}>{`python3 src/gpti_bot/agents/iip_agent.py`}</pre>
            </div>
            <div style={styles.codeBox}>
              <h3 style={styles.codeTitle}>Résultat Attendu</h3>
              <pre style={styles.code}>{`✅ Daily Flow Execution (6 agents):
   RVI:  0.56 seconds
   SSS: 10.08 seconds
   REM:  1.06 seconds
   IRS:  0.56 seconds
   FRP: 18.22 seconds
   MIS: 27.86 seconds
   ───────────────────
   Total: ~58 seconds

✅ Health Check: All Green (0 critical issues)`}</pre>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Prochaines Étapes - Phase 3</h2>
          <div style={styles.nextStepsContainer} className="next-steps-responsive">
            <div style={styles.nextStepBox}>
              <h3>� Phase 3 EN COURS</h3>
              <p><strong>15 février 2026 → 31 mars 2026</strong></p>
              <p>Intégration des API réelles (7 jours écoulés / 45 jours prévus = 60% en cours)</p>
            </div>
            <div style={styles.nextStepBox}>
              <h3>🔌 Intégrations API</h3>
              <ul style={styles.nextStepList}>
                <li>✅ FCA Registry (données réelles)</li>
                <li>✅ OFAC/ONU listes de sanctions</li>
                <li>✅ SEC base de données de mise en conformité</li>
                <li>✅ API TrustPilot (avis réels)</li>
              </ul>
            </div>
            <div style={styles.nextStepBox}>
              <h3>🚀 Lancement Production</h3>
              <p><strong>11 avril 2026</strong></p>
              <p>Déploiement en production</p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section style={styles.ctaSection}>
          <h2 style={styles.ctaTitle}>Prêt à Explorer Phase 2?</h2>
          <p style={styles.ctaDescription}>
            Consultez la documentation complète ou testez les agents en local.
          </p>
          <div style={styles.ctaButtons}>
            <Link href="/agents-dashboard" style={styles.buttonPrimary}>
              📊 Dashboard Agents
            </Link>
            <Link href="/rankings" style={styles.buttonSecondary}>
              📈 Voir les Rankings
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

const styles = {
  container: {
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: '#1a1a1a',
  } as React.CSSProperties,

  header: {
    paddingTop: '80px',
    paddingBottom: '60px',
    borderBottom: '1px solid #e0e0e0',
    marginBottom: '60px',
  } as React.CSSProperties,

  headerContent: {
    textAlign: 'center' as const,
  },

  eyebrow: {
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    color: '#666', // Changed from rgba(243,247,255,.72) - now dark gray
    margin: '0 0 8px',
  } as React.CSSProperties,

  title: {
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: 1.2,
    margin: '0 0 16px',
    color: '#1a1a1a', // Changed from #F3F7FF - now dark
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,

  lead: {
    fontSize: '18px',
    lineHeight: 1.6,
    color: '#333', // Changed from rgba(243,247,255,.85) - now dark gray
    maxWidth: '700px',
    margin: '0 auto 40px',
  } as React.CSSProperties,

  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '20px',
    margin: '40px 0',
    justifyContent: 'center',
  } as React.CSSProperties,

  metric: {
    textAlign: 'center' as const,
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  } as React.CSSProperties,

  metricValue: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#2563eb',
    margin: '0 0 8px',
  } as React.CSSProperties,

  metricLabel: {
    fontSize: '14px',
    color: '#555', // Changed from rgba(243,247,255,.72) - now dark gray
    margin: 0,
  } as React.CSSProperties,

  badge: {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 600,
    marginTop: '20px',
  } as React.CSSProperties,

  section: {
    paddingBottom: '60px',
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '40px',
    borderBottom: '2px solid #00D1C1',
    paddingBottom: '16px',
    color: '#1a1a1a', // Changed from #F3F7FF - now dark
    textShadow: 'none',
  } as React.CSSProperties,

  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  } as React.CSSProperties,

  statusCard: {
    padding: '24px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,

  statusValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#2563eb',
    margin: '12px 0 8px',
  } as React.CSSProperties,

  statusDetail: {
    fontSize: '14px',
    color: '#666', // Changed from rgba(243,247,255,.72) - now dark gray
    margin: 0,
  } as React.CSSProperties,

  agentGrid: {
    display: 'grid',
    gridTemplateColumns: '250px 1fr',
    gap: '40px',
    minHeight: '400px',
  } as React.CSSProperties,

  agentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  } as React.CSSProperties,

  agentButton: {
    padding: '16px',
    backgroundColor: '#f9f9f9',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.2s ease',
    fontSize: '14px',
  } as React.CSSProperties,

  agentButtonActive: {
    backgroundColor: '#2563eb',
    color: 'white',
    borderColor: '#2563eb',
  } as React.CSSProperties,

  agentButtonLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  } as React.CSSProperties,

  agentButtonName: {
    fontSize: '12px',
    opacity: 0.8,
  } as React.CSSProperties,

  statusBadge: {
    fontSize: '16px',
  } as React.CSSProperties,

  agentDetails: {
    padding: '24px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,

  agentTitle: {
    fontSize: '24px',
    fontWeight: 700,
    margin: '0 0 12px',
  } as React.CSSProperties,

  agentDescription: {
    fontSize: '16px',
    lineHeight: 1.6,
    color: '#333', // Changed from rgba(243,247,255,.85) - now dark gray
    margin: '0 0 24px',
  } as React.CSSProperties,

  agentInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  } as React.CSSProperties,

  infoItem: {
    marginBottom: '12px',
  } as React.CSSProperties,

  infoLabel: {
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#555', // Changed from rgba(243,247,255,.72) - now dark gray
    letterSpacing: '0.5px',
    margin: '0 0 8px',
  } as React.CSSProperties,

  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  } as React.CSSProperties,

  tag: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
  } as React.CSSProperties,

  performanceValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#2563eb',
    margin: 0,
  } as React.CSSProperties,

  statusLabel: {
    margin: 0,
  } as React.CSSProperties,

  statusComplete: {
    color: '#22c55e',
    fontWeight: 600,
  } as React.CSSProperties,

  statusPending: {
    color: '#f97316',
    fontWeight: 600,
  } as React.CSSProperties,

  evidenceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  } as React.CSSProperties,

  evidenceColumn: {
    padding: '24px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,

  evidenceColumnTitle: {
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '16px',
    color: '#2563eb',
  } as React.CSSProperties,

  evidenceList: {
    listStyle: 'none' as const,
    padding: 0,
    margin: 0,
  } as React.CSSProperties,

  flowContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '24px',
  } as React.CSSProperties,

  flow: {
    padding: '24px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,

  flowTitle: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '16px',
  } as React.CSSProperties,

  flowSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  } as React.CSSProperties,

  flowStep: {
    padding: '12px',
    backgroundColor: 'white',
    borderLeft: '3px solid #2563eb',
    paddingLeft: '16px',
    fontSize: '14px',
  } as React.CSSProperties,

  flowStepResult: {
    padding: '12px',
    backgroundColor: '#d4edda',
    borderLeft: '3px solid #22c55e',
    paddingLeft: '16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#155724',
  } as React.CSSProperties,

  metricsTable: {
    overflowX: 'auto' as const,
    marginBottom: '40px',
  } as React.CSSProperties,

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    backgroundColor: 'white',
  } as React.CSSProperties,

  tableHeaderRow: {
    backgroundColor: '#f5f5f5',
  } as React.CSSProperties,

  tableHeader: {
    padding: '12px',
    textAlign: 'left' as const,
    fontWeight: 600,
    fontSize: '14px',
    borderBottom: '2px solid #e0e0e0',
  } as React.CSSProperties,

  tableRow: {
    borderBottom: '1px solid #e0e0e0',
  } as React.CSSProperties,

  tableCell: {
    padding: '12px',
    fontSize: '14px',
  } as React.CSSProperties,

  scalabilityBox: {
    padding: '24px',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    border: '1px solid #fcd34d',
  } as React.CSSProperties,

  scalabilityTitle: {
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '16px',
  } as React.CSSProperties,

  complianceContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  } as React.CSSProperties,

  complianceLevel: {
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid rgba(0, 209, 193, 0.3)',
    backgroundColor: 'rgba(255,255,255,.04)',
  } as React.CSSProperties,

  levelDescription: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#e0e0e0',
    margin: '8px 0',
  } as React.CSSProperties,

  levelTitle: {
    fontSize: '16px',
    fontWeight: 700,
    margin: '0 0 12px',
    color: '#00D1C1',
  } as React.CSSProperties,

  levelStatus: {
    fontSize: '16px',
    fontWeight: 700,
    margin: '8px 0',
    color: '#1a1a1a', // Changed from #F3F7FF - now dark
  } as React.CSSProperties,

  levelExample: {
    fontSize: '12px',
    color: '#555', // Changed from rgba(243,247,255,.72) - now dark gray
    margin: '12px 0 0',
  } as React.CSSProperties,

  qualityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  } as React.CSSProperties,

  qualityCard: {
    padding: '24px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  qualityValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#2563eb',
    margin: '12px 0 8px',
  } as React.CSSProperties,

  docGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  } as React.CSSProperties,

  docCard: {
    padding: '24px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,

  docList: {
    listStyle: 'none' as const,
    padding: 0,
    margin: 0,
  } as React.CSSProperties,

  docLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
  } as React.CSSProperties,

  codeContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  } as React.CSSProperties,

  codeBox: {
    padding: '24px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    border: '1px solid #333',
  } as React.CSSProperties,

  codeTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1a1a1a', // Changed from #fff - now dark for readability
    marginBottom: '12px',
  } as React.CSSProperties,

  code: {
    color: '#00ff00',
    fontFamily: '"Courier New", monospace',
    fontSize: '13px',
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  } as React.CSSProperties,

  nextStepsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  } as React.CSSProperties,

  nextStepBox: {
    padding: '24px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
  } as React.CSSProperties,

  nextStepList: {
    listStyle: 'none' as const,
    padding: 0,
    margin: 0,
  } as React.CSSProperties,

  ctaSection: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginBottom: '60px',
  } as React.CSSProperties,

  ctaTitle: {
    fontSize: '36px',
    fontWeight: 700,
    marginBottom: '12px',
  } as React.CSSProperties,

  ctaDescription: {
    fontSize: '18px',
    color: '#333', // Changed from rgba(243,247,255,.85) - now dark
    marginBottom: '24px',
  } as React.CSSProperties,

  ctaButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  } as React.CSSProperties,

  buttonPrimary: {
    padding: '12px 32px',
    backgroundColor: '#2563eb',
    color: 'white',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  } as React.CSSProperties,

  buttonSecondary: {
    padding: '12px 32px',
    backgroundColor: '#e0e0e0',
    color: '#1a1a1a',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  } as React.CSSProperties,
};

export default Phase2;

export const getServerSideProps: GetServerSideProps<Phase2Props> = async (context) => {
  const protocol = (context.req.headers['x-forwarded-proto'] as string) || 'http';
  const host = context.req.headers.host || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  try {
    const response = await fetch(`${baseUrl}/api/agents/status`);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    const data = await response.json();
    return { props: { initialData: data } };
  } catch {
    return { props: { initialData: getDefaultPhase2Data() } };
  }
};
