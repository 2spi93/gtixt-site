# GTIXT System Architecture v1
## Architecture des agents & data contracts

### Vue d’ensemble
GTIXT repose sur une architecture multi-agents, chacun avec un rôle strictement défini, reliés par des data contracts versionnés.

- Aucun agent ne décide seul.
- Chaque sortie est vérifiable, rejouable, auditée.

---

### Agent 1 — Measurement Engine
**“Measure what exists”**

**Rôle**
- Crawl des données publiques
- Extraction rules / pricing / disclosures
- Normalisation
- Scoring déterministe
- Snapshots versionnés

**Inputs**
- Websites
- Terms & Conditions
- FAQ
- Pricing pages
- Legal pages

**Outputs**
- datapoints
- snapshot_scores
- evidence
- public_snapshot.json

**Garanties**
- déterminisme
- NA neutre
- pas d’interprétation subjective

---

### Agent 2 — Market Intelligence Engine
**“Detect what is changing”**

**Rôle**
- Détection de nouvelles prop firms
- Détection de changements structurels
- Surveillance régulatoire
- Classification automatique des modèles
- Pré-analyse des nouveaux entrants

**Inputs**
- Diff snapshots
- Crawls périodiques
- Flux régulateurs (ESMA, FCA, ASIC…)

**Outputs**
- alerts
- RVI
- REM updates
- model archetypes
- early risk flags

**Garanties**
- enrichissement continu
- pas de modification rétroactive

---

### Agent 3 — Risk & Integrity Engine
**“Protect the system itself”**

**Rôle**
- Surveillance du pipeline
- Détection d’anomalies de score
- Dérive méthodologique
- Intégrité des snapshots
- Validation qualité finale (Gate)

**Inputs**
- snapshot_scores
- agent_c_audit
- pipeline metrics

**Outputs**
- verdict pass/review
- publishable_firms
- alerts (Slack / email)
- audit trail

**Garanties**
- séparation totale data / publication
- protection contre biais et erreurs

---

## Data Contracts (extrait)
| Contract | Description |
|---|---|
| datapoints.v1 | données brutes normalisées |
| snapshot_scores.v1 | scores versionnés |
| agent_c_audit.v1 | décisions qualité |
| public_snapshot.v1 | export public |
| validation_metrics.v1 | santé du système |

Chaque contract est versionné, backward-compatible, documenté.
