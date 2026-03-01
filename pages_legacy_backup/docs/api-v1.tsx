import Head from "next/head";
import Link from "next/link";
import InstitutionalHeader from "../../components/InstitutionalHeader";
import Footer from "../../components/Footer";
import { useIsMounted } from "../../lib/useIsMounted";
import { useTranslation } from "../../lib/useTranslationStub";

export default function ApiV1() {
  const { t } = useTranslation("common");
  const isMounted = useIsMounted();

  return (
    <>
      <Head>
        <title>API Documentation — GTIXT</title>
        <meta
          name="description"
          content="GTIXT API V1 reference. Programmatic access to institutional benchmarking data, snapshots, and rankings."
        />
      </Head>

      <style jsx global>{responsiveStyles}</style>

      <InstitutionalHeader
        breadcrumbs={isMounted ? [
          { label: "Documentation", href: "/docs" },
          { label: "API V1", href: "/docs/api-v1" }
        ] : []}
      />

      <main style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.eyebrow}>GTIXT API V1</div>
          <h1 style={styles.h1}>Programmatic Access to the Global Prop Trading Index</h1>
          <p style={styles.lead}>
            Access GTIXT institutional benchmarking data, rankings, and historical snapshots through 
            a public RESTful API. All endpoints return JSON with cryptographic integrity verification. 
            Advanced institutional endpoints provide multi-level hashing, provenance tracking, and 
            reproducibility verification. No authentication required—free for institutional and research use.
          </p>
        </section>

        {/* Overview */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Overview</h2>
          <p style={styles.sectionLead}>
            The GTIXT API provides programmatic access to all published data, including firm scores, 
            pillar breakdowns, evidence excerpts, snapshot metadata, and institutional-grade provenance tracking.
          </p>

          <div style={styles.overviewGrid}>
            <div style={styles.overviewCard}>
              <div style={styles.overviewIcon}>🔓</div>
              <h4 style={styles.overviewTitle}>Public & Free</h4>
              <p style={styles.overviewText}>
                No API keys and no authentication. Light rate limits apply for fair use across 
                institutional and research workloads.
              </p>
            </div>

            <div style={styles.overviewCard}>
              <div style={styles.overviewIcon}>🔄</div>
              <h4 style={styles.overviewTitle}>Versioned</h4>
              <p style={styles.overviewText}>
                API documentation follows semantic versioning. Breaking changes ship under a new 
                documentation version with backward compatibility preserved where possible.
              </p>
            </div>

            <div style={styles.overviewCard}>
              <div style={styles.overviewIcon}>⚙️</div>
              <h4 style={styles.overviewTitle}>Deterministic</h4>
              <p style={styles.overviewText}>
                Every response is reproducible and traceable to immutable snapshots. SHA-256 hashes 
                ensure data integrity.
              </p>
            </div>

            <div style={styles.overviewCard}>
              <div style={styles.overviewIcon}>📊</div>
              <h4 style={styles.overviewTitle}>JSON Format</h4>
              <p style={styles.overviewText}>
                All responses are JSON with standard schemas. Designed for integration with data 
                pipelines, dashboards, and research tools.
              </p>
            </div>
          </div>

          <div style={styles.baseUrlCard} className="api-base-url-card">
            <h4 style={styles.baseUrlTitle}>Base URL</h4>
            <div style={styles.codeBlock}>
              <code style={styles.codeText}>https://gtixt.com/api</code>
            </div>
            <p style={styles.baseUrlNote}>
              Snapshot objects are hosted at <code style={styles.inlineCode}>https://data.gtixt.com/gpti-snapshots/</code>
            </p>
          </div>
        </section>

        {/* Endpoints */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Endpoints</h2>
          <p style={styles.sectionLead}>
            All endpoints support GET requests and return JSON. CORS is enabled for browser-based applications.
          </p>

          {/* GET /snapshots */}
          <div style={styles.endpointCard}>
            <div style={styles.endpointHeader}>
              <div style={styles.methodBadge}>GET</div>
              <code style={styles.endpointPath}>/snapshots</code>
            </div>
            <p style={styles.endpointDesc}>
              Retrieve snapshot metadata. The API currently returns the latest snapshot only; pagination fields 
              are reserved for the archive endpoint.
            </p>

            <h5 style={styles.subTitle}>Query Parameters</h5>
            <div style={styles.tableWrapper}>
              <table style={styles.paramTable}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Parameter</th>
                    <th style={styles.tableHeader}>Type</th>
                    <th style={styles.tableHeader}>Default</th>
                    <th style={styles.tableHeader}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={styles.tableCell}><code style={styles.inlineCode}>limit</code></td>
                    <td style={styles.tableCell}>integer</td>
                    <td style={styles.tableCell}>10</td>
                    <td style={styles.tableCell}>Max results (1-50)</td>
                  </tr>
                  <tr>
                    <td style={styles.tableCell}><code style={styles.inlineCode}>before</code></td>
                    <td style={styles.tableCell}>string</td>
                    <td style={styles.tableCell}>latest</td>
                    <td style={styles.tableCell}>ISO timestamp to paginate older snapshots</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h5 style={styles.subTitle}>Example Request</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`curl "https://gtixt.com/api/snapshots?limit=1"`}</pre>
            </div>

            <h5 style={styles.subTitle}>Example Response</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`{
  "success": true,
  "snapshots": [
    {
      "object": "universe_v0.1_public/_public/20260212T191715.391605+0000_62fbf6f82af5.json",
      "sha256": "62fbf6f82af59591b05ddeba45e8373df7651d02785661667bdbf35d7a895d76",
      "created_at": "2026-02-12T19:17:15.391605Z",
      "count": 106
    }
  ],
  "total": 1,
  "latest": {
    "object": "universe_v0.1_public/_public/20260212T191715.391605+0000_62fbf6f82af5.json",
    "sha256": "62fbf6f82af59591b05ddeba45e8373df7651d02785661667bdbf35d7a895d76",
    "created_at": "2026-02-12T19:17:15.391605Z",
    "count": 106
  }
}`}</pre>
            </div>
          </div>

          {/* GET /firms */}
          <div style={styles.endpointCard}>
            <div style={styles.endpointHeader}>
              <div style={styles.methodBadge}>GET</div>
              <code style={styles.endpointPath}>/firms</code>
            </div>
            <p style={styles.endpointDesc}>
              Retrieve list of all firms in the latest snapshot with scores, confidence, and metadata.
            </p>

            <h5 style={styles.subTitle}>Query Parameters</h5>
            <div style={styles.tableWrapper}>
              <table style={styles.paramTable}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Parameter</th>
                    <th style={styles.tableHeader}>Type</th>
                    <th style={styles.tableHeader}>Default</th>
                    <th style={styles.tableHeader}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={styles.tableCell}><code style={styles.inlineCode}>limit</code></td>
                    <td style={styles.tableCell}>integer</td>
                    <td style={styles.tableCell}>50</td>
                    <td style={styles.tableCell}>Max results (1-500)</td>
                  </tr>
                  <tr>
                    <td style={styles.tableCell}><code style={styles.inlineCode}>offset</code></td>
                    <td style={styles.tableCell}>integer</td>
                    <td style={styles.tableCell}>0</td>
                    <td style={styles.tableCell}>Pagination offset</td>
                  </tr>
                  <tr>
                    <td style={styles.tableCell}><code style={styles.inlineCode}>sort</code></td>
                    <td style={styles.tableCell}>string</td>
                    <td style={styles.tableCell}>score</td>
                    <td style={styles.tableCell}>Sort by: score, name, status</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h5 style={styles.subTitle}>Example Request</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`curl "https://gtixt.com/api/firms?limit=10&sort=score"`}</pre>
            </div>

            <h5 style={styles.subTitle}>Example Response</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`{
  "success": true,
  "count": 1,
  "total": 106,
  "limit": 10,
  "offset": 0,
  "firms": [
    {
      "firm_id": "ftmocom",
      "name": "FTMO",
      "status": "active",
      "gtixt_status": "pass",
      "score_0_100": 87.5,
      "model_type": "challenge",
      "jurisdiction_tier": "tier1",
      "confidence": 0.9,
      "na_rate": 0.02,
      "pillar_scores": {
        "transparency": 0.92,
        "payout_reliability": 0.88,
        "risk_model": 0.85,
        "legal_compliance": 0.90,
        "reputation": 0.82
      },
      "agent_c_reasons": []
    }
  ],
  "snapshot_info": {
    "object": "universe_v0.1_public/_public/20260212T191715.391605+0000_62fbf6f82af5.json",
    "sha256": "62fbf6f82af59591b05ddeba45e8373df7651d02785661667bdbf35d7a895d76",
    "created_at": "2026-02-12T19:17:15.391605Z",
    "source": "remote"
  }
}`}</pre>
            </div>
          </div>

          {/* GET /firm */}
          <div style={styles.endpointCard}>
            <div style={styles.endpointHeader}>
              <div style={styles.methodBadge}>GET</div>
              <code style={styles.endpointPath}>/firm</code>
            </div>
            <p style={styles.endpointDesc}>
              Retrieve a specific firm record and the snapshot metadata it came from.
            </p>

            <h5 style={styles.subTitle}>Query Parameters</h5>
            <div style={styles.tableWrapper}>
              <table style={styles.paramTable}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Parameter</th>
                    <th style={styles.tableHeader}>Type</th>
                    <th style={styles.tableHeader}>Required</th>
                    <th style={styles.tableHeader}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={styles.tableCell}><code style={styles.inlineCode}>id</code></td>
                    <td style={styles.tableCell}>string</td>
                    <td style={styles.tableCell}>Yes*</td>
                    <td style={styles.tableCell}>Firm ID (e.g., "ftmocom")</td>
                  </tr>
                  <tr>
                    <td style={styles.tableCell}><code style={styles.inlineCode}>name</code></td>
                    <td style={styles.tableCell}>string</td>
                    <td style={styles.tableCell}>Yes*</td>
                    <td style={styles.tableCell}>Firm name (URL-encoded)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={styles.paramNote}>*Either <code style={styles.inlineCode}>id</code> or <code style={styles.inlineCode}>name</code> is required.</p>

            <h5 style={styles.subTitle}>Example Request</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`curl "https://gtixt.com/api/firm?id=ftmocom"`}</pre>
            </div>

            <h5 style={styles.subTitle}>Example Response</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`{
  "firm": {
    "firm_id": "ftmocom",
    "name": "FTMO",
    "status": "active",
    "gtixt_status": "pass",
    "score_0_100": 87.5,
    "model_type": "challenge",
    "jurisdiction_tier": "tier1",
    "confidence": 0.9,
    "na_rate": 0.02,
    "pillar_scores": {
      "transparency": 0.92,
      "payout_reliability": 0.88,
      "risk_model": 0.85,
      "legal_compliance": 0.90,
      "reputation": 0.82
    },
    "agent_c_reasons": []
  },
  "snapshot": {
    "object": "universe_v0.1_public/_public/20260212T191715.391605+0000_62fbf6f82af5.json",
    "sha256": "62fbf6f82af59591b05ddeba45e8373df7651d02785661667bdbf35d7a895d76",
    "created_at": "2026-02-12T19:17:15.391605Z",
    "count": 106
  }
}`}</pre>
            </div>
          </div>
        </section>

        {/* Institutional Endpoints - Provenance & Verification */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Institutional Endpoints</h2>
          <p style={styles.sectionLead}>
            Advanced endpoints for cryptographic verification, provenance tracking, and multi-level hashing validation.
            These endpoints provide institutional-grade auditability and data integrity confirmation.
          </p>

          {/* GET /api/provenance/trace/:snapshot_id */}
          <div style={styles.endpointCard}>
            <div style={styles.endpointHeader}>
              <div style={styles.methodBadge}>GET</div>
              <code style={styles.endpointPath}>/api/provenance/trace/:snapshot_id</code>
            </div>
            <p style={styles.endpointDesc}>
              Retrieve the complete hash chain and verification status for a snapshot. Shows evidence → pillar → firm → dataset 
              hash cascade to enable reproducibility verification.
            </p>

            <h5 style={styles.subTitle}>Path Parameters</h5>
            <div style={styles.tableWrapper}>
              <table style={styles.paramTable}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Parameter</th>
                    <th style={styles.tableHeader}>Type</th>
                    <th style={styles.tableHeader}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={styles.tableCell}><code style={styles.inlineCode}>snapshot_id</code></td>
                    <td style={styles.tableCell}>UUID</td>
                    <td style={styles.tableCell}>Snapshot identifier from versioned_snapshots table</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h5 style={styles.subTitle}>Example Request</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`curl "https://gtixt.com/api/provenance/trace/2ec9923b-0cc5-48a4-bb68-a25c4d0be361"`}</pre>
            </div>

            <h5 style={styles.subTitle}>Example Response</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`{
  "success": true,
  "snapshot_id": "2ec9923b-0cc5-48a4-bb68-a25c4d0be361",
  "trace": {
    "dataset_hash": "abc123...",
    "firm_hash": "def456...",
    "pillar_hash": "ghi789...",
    "evidence_hash": "jkl012...",
    "firm_hash_valid": true,
    "chain_valid": true,
    "snapshot_signature": "ECDSA signature...",
    "signature_verified": true
  },
  "timestamp": "2026-02-24T04:03:19.831941+00:00"
}`}</pre>
            </div>
          </div>

          {/* GET /api/provenance/graph/:firm_id/:date */}
          <div style={styles.endpointCard}>
            <div style={styles.endpointHeader}>
              <div style={styles.methodBadge}>GET</div>
              <code style={styles.endpointPath}>/api/provenance/graph/:firm_id/:date</code>
            </div>
            <p style={styles.endpointDesc}>
              Retrieve the complete data lineage graph for a firm on a specific date. Returns all transformations, 
              validation steps, and the DAG structure showing how the score was derived.
            </p>

            <h5 style={styles.subTitle}>Path Parameters</h5>
            <div style={styles.tableWrapper}>
              <table style={styles.paramTable}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Parameter</th>
                    <th style={styles.tableHeader}>Type</th>
                    <th style={styles.tableHeader}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={styles.tableCell}><code style={styles.inlineCode}>firm_id</code></td>
                    <td style={styles.tableCell}>string</td>
                    <td style={styles.tableCell}>Firm identifier (e.g., "ftmocom")</td>
                  </tr>
                  <tr>
                    <td style={styles.tableCell}><code style={styles.inlineCode}>date</code></td>
                    <td style={styles.tableCell}>ISO8601</td>
                    <td style={styles.tableCell}>Date for historical lineage (e.g., "2026-02-24")</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h5 style={styles.subTitle}>Example Request</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`curl "https://gtixt.com/api/provenance/graph/ftmocom/2026-02-24"`}</pre>
            </div>

            <h5 style={styles.subTitle}>Example Response</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`{
  "success": true,
  "firm_id": "ftmocom",
  "date": "2026-02-24",
  "graph": {
    "nodes": [
      {
        "id": "evidence-001",
        "type": "evidence",
        "data": {"source": "PLC register", "value": 0.92}
      },
      {
        "id": "pillar-transparency",
        "type": "pillar",
        "data": {"name": "Transparency", "score": 0.92}
      }
    ],
    "edges": [
      {
        "from": "evidence-001",
        "to": "pillar-transparency",
        "operation": "SHA-256 hash aggregate"
      }
    ]
  },
  "reproducibility": {
    "all_sources_available": true,
    "all_hashes_valid": true
  }
}`}</pre>
            </div>
          </div>

          {/* GET /api/provenance/evidence/:evidence_id */}
          <div style={styles.endpointCard}>
            <div style={styles.endpointHeader}>
              <div style={styles.methodBadge}>GET</div>
              <code style={styles.endpointPath}>/api/provenance/evidence/:evidence_id</code>
            </div>
            <p style={styles.endpointDesc}>
              Retrieve full provenance for a single evidence item, including source system, transformation chain, 
              validation metadata, and cryptographic hashes at each step.
            </p>

            <h5 style={styles.subTitle}>Path Parameters</h5>
            <div style={styles.tableWrapper}>
              <table style={styles.paramTable}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Parameter</th>
                    <th style={styles.tableHeader}>Type</th>
                    <th style={styles.tableHeader}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={styles.tableCell}><code style={styles.inlineCode}>evidence_id</code></td>
                    <td style={styles.tableCell}>UUID</td>
                    <td style={styles.tableCell}>Evidence identifier from evidence_provenance table</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h5 style={styles.subTitle}>Example Request</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`curl "https://gtixt.com/api/provenance/evidence/a1b2c3d4-e5f6-4g7h-8i9j-k0l1m2n3o4p5"`}</pre>
            </div>

            <h5 style={styles.subTitle}>Example Response</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`{
  "success": true,
  "evidence_id": "a1b2c3d4-e5f6-4g7h-8i9j-k0l1m2n3o4p5",
  "provenance": {
    "source_system": "FCA_REGISTER",
    "raw_data_hash": "sha256_hash_of_original",
    "transformation_chain": [
      {
        "step": 1,
        "operation": "Extract from PDF",
        "input_hash": "...",
        "output_hash": "..."
      }
    ],
    "validation": {
      "llm_validation": {"result": "PASS", "confidence": 0.95},
      "rule_validation": {"result": "PASS"},
      "heuristic_validation": {"result": "PASS"}
    },
    "evidence_hash": "final_evidence_hash...",
    "immutable": {
      "locked": true,
      "created_at": "2026-02-24T04:03:19Z",
      "signature": "ECDSA_signature..."
    }
  }
}`}</pre>
            </div>
          </div>

          {/* POST /api/provenance/verify */}
          <div style={styles.endpointCard}>
            <div style={styles.endpointHeader}>
              <div style={styles.methodBadge}>POST</div>
              <code style={styles.endpointPath}>/api/provenance/verify</code>
            </div>
            <p style={styles.endpointDesc}>
              Verify dataset or evidence integrity using multi-level hashing. Accepts evidence IDs, firm IDs, or 
              dataset timestamps and returns cryptographic verification of the complete hash chain.
            </p>

            <h5 style={styles.subTitle}>Request Body</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`{
  "type": "evidence|firm|dataset",  // Verification scope
  "evidence_id": "UUID",              // Required if type=evidence
  "firm_id": "string",                // Required if type=firm
  "dataset_timestamp": "ISO8601",      // Required if type=dataset
  "include_chain": true               // Optional: return full hash chain
}`}</pre>
            </div>

            <h5 style={styles.subTitle}>Example Request</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`curl -X POST "https://gtixt.com/api/provenance/verify" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "dataset",
    "dataset_timestamp": "2026-02-24T04:03:19.831941+00:00",
    "include_chain": true
  }'`}</pre>
            </div>

            <h5 style={styles.subTitle}>Example Response</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`{
  "success": true,
  "verification": {
    "type": "dataset",
    "dataset_hash_valid": true,
    "merkle_root_valid": true,
    "total_firms_verified": 157,
    "all_signatures_valid": true,
    "chain": {
      "evidence_level": "✓ Valid",
      "pillar_level": "✓ Valid",
      "firm_level": "✓ Valid",
      "dataset_level": "✓ Valid"
    }
  },
  "timestamp": "2026-02-24T04:03:19.831941+00:00",
  "verification_timestamp": "2026-02-24T12:15:30Z"
}`}</pre>
            </div>
          </div>

          <p style={styles.endpointNote}>
            <strong>Note:</strong> All institutional endpoints include ECDSA-secp256k1 signature verification. 
            Sign requests with your institutional key for authenticated access.
          </p>
        </section>

        {/* Data Models */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Data Models</h2>
          <p style={styles.sectionLead}>
            Standard JSON schemas for all API responses. Every field is typed and documented.
          </p>

          <div style={styles.modelCard}>
            <h4 style={styles.modelTitle}>Firm Object</h4>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`{
  "firm_id": "string",
  "name": "string",
  "status": "active" | "candidate" | "watchlist" | "excluded",
  "gtixt_status": "pass" | "review" | "fail",
  "score_0_100": 0-100,
  "confidence": 0.0-1.0,
  "na_rate": 0.0-1.0,
  "model_type": "challenge" | "hybrid" | "other",
  "jurisdiction": "string",
  "jurisdiction_tier": "Tier 1" | "Tier 2" | "Tier 3",
  "pillar_scores": { "metric": 0.0-1.0 },
  "metric_scores": { "metric": 0.0-1.0 },
  "agent_c_reasons": []
}`}</pre>
            </div>
          </div>

          <div style={styles.modelCard}>
            <h4 style={styles.modelTitle}>Evidence Excerpt</h4>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`{
  "pillar": "string",           // Pillar name
  "metric": "string",           // Metric key (e.g., "rules.clarity")
  "value": 0.0-1.0,             // Normalized metric value
  "source_uri": "string",       // Original source URL
  "captured_at": "ISO8601",     // Capture timestamp
  "excerpt": "string"           // Optional text excerpt
}`}</pre>
            </div>
          </div>

          <div style={styles.modelCard}>
            <h4 style={styles.modelTitle}>Snapshot Pointer</h4>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`{
  "object": "string",           // MinIO object path
  "sha256": "string",           // SHA-256 hash
  "created_at": "ISO8601",      // Publication timestamp
  "count": integer              // Total firms in snapshot
}`}</pre>
            </div>
          </div>
        </section>

        {/* Error Codes */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Error Codes</h2>
          <p style={styles.sectionLead}>
            All errors return JSON with a standard error object containing code, message, and timestamp.
          </p>

          <div style={styles.errorGrid}>
            <div style={styles.errorCard}>
              <div style={styles.errorCode}>400</div>
              <h5 style={styles.errorTitle}>Bad Request</h5>
              <p style={styles.errorText}>
                Missing required parameter or invalid query format.
              </p>
              <div style={styles.codeBlock}>
                <pre style={styles.codeText}>{`{
  "error": "missing_parameter",
  "message": "Required parameter 'id' or 'name' not provided",
  "status": 400
}`}</pre>
              </div>
            </div>

            <div style={styles.errorCard}>
              <div style={styles.errorCode}>404</div>
              <h5 style={styles.errorTitle}>Not Found</h5>
              <p style={styles.errorText}>
                Firm ID or snapshot ID does not exist in the database.
              </p>
              <div style={styles.codeBlock}>
                <pre style={styles.codeText}>{`{
  "error": "firm_not_found",
  "message": "Firm with id 'invalid123' not found",
  "status": 404
}`}</pre>
              </div>
            </div>

            <div style={styles.errorCard}>
              <div style={styles.errorCode}>500</div>
              <h5 style={styles.errorTitle}>Internal Error</h5>
              <p style={styles.errorText}>
                Server error. Retry with exponential backoff.
              </p>
              <div style={styles.codeBlock}>
                <pre style={styles.codeText}>{`{
  "error": "internal_error",
  "message": "Database connection failed",
  "status": 500
}`}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* Versioning */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Versioning & Evolution</h2>
          <p style={styles.sectionLead}>
            The GTIXT API follows semantic versioning. Breaking changes are introduced in new major versions.
          </p>

          <div style={styles.versionGrid} className="api-version-grid">
            <div style={styles.versionCard}>
              <div style={styles.versionBadge}>v1.0</div>
              <h5 style={styles.versionTitle}>Current Stable</h5>
              <p style={styles.versionText}>
                Initial public release with /snapshots, /firms, and /firm endpoints. 
                Supports pagination, sorting, and basic filtering.
              </p>
              <p style={styles.versionDate}>Released: January 2026</p>
            </div>

            <div style={styles.versionCard}>
              <div style={{...styles.versionBadge}}>v1.1</div>
              <h5 style={styles.versionTitle}>Current - Institutional</h5>
              <p style={styles.versionText}>
                Institutional-grade provenance tracking: /api/provenance/trace, /api/provenance/graph, 
                /api/provenance/evidence, and /api/provenance/verify endpoints. Multi-level hashing, 
                ECDSA signature verification, and complete data lineage graphs.
              </p>
              <p style={styles.versionDate}>Released: February 2026</p>
            </div>

            <div style={styles.versionCard}>
              <div style={{...styles.versionBadge, backgroundColor: "#1E2630", color: "#2F81F7"}}>v1.2</div>
              <h5 style={styles.versionTitle}>Planned (Q2 2026)</h5>
              <p style={styles.versionText}>
                Extend snapshot history via /snapshots?before=timestamp, enhanced filtering by jurisdiction 
                and confidence, evidence excerpt expansion, and agent validation endpoints.
              </p>
              <p style={styles.versionDate}>Target: April 2026</p>
            </div>

            <div style={styles.versionCard}>
              <div style={{...styles.versionBadge, backgroundColor: "#1E2630", color: "#2F81F7"}}>v2.0</div>
              <h5 style={styles.versionTitle}>Future (Q3 2026)</h5>
              <p style={styles.versionText}>
                Breaking changes: introduce /rankings endpoint, deprecate /firms pagination in favor 
                of cursor-based pagination, add GraphQL support.
              </p>
              <p style={styles.versionDate}>Target: July 2026</p>
            </div>
          </div>

          <div style={styles.compatibilityCard}>
            <h5 style={styles.compatibilityTitle}>Backward Compatibility Policy</h5>
            <ul style={styles.compatibilityList}>
              <li style={styles.compatibilityItem}>
                <strong>Minor versions (v1.0 → v1.1):</strong> Additive changes only. No breaking changes.
              </li>
              <li style={styles.compatibilityItem}>
                <strong>Major versions (v1 → v2):</strong> Breaking changes allowed. Previous version 
                supported for 6 months after new release.
              </li>
              <li style={styles.compatibilityItem}>
                <strong>Deprecation:</strong> All deprecated endpoints receive 3-month warning via API response headers.
              </li>
            </ul>
          </div>
        </section>

        {/* Integrity & Verification */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Integrity & Verification</h2>
          <p style={styles.sectionLead}>
            All GTIXT data is cryptographically verified. Every snapshot is immutable and traceable 
            to its SHA-256 hash and MinIO object URI.
          </p>

          <div style={styles.integrityGrid} className="api-integrity-grid">
            <div style={styles.integrityCard}>
              <div style={styles.integrityIcon}>🔒</div>
              <h5 style={styles.integrityTitle}>SHA-256 Hashes</h5>
              <p style={styles.integrityText}>
                Every snapshot includes a SHA-256 hash. Verify data integrity by downloading the 
                snapshot from MinIO and computing the hash locally.
              </p>
            </div>

            <div style={styles.integrityCard}>
              <div style={styles.integrityIcon}>📦</div>
              <h5 style={styles.integrityTitle}>MinIO Objects</h5>
              <p style={styles.integrityText}>
                Snapshot objects are stored in public MinIO buckets. Access via the <code style={styles.inlineCode}>latest.object</code> 
                field in /snapshots response.
              </p>
            </div>

            <div style={styles.integrityCard}>
              <div style={styles.integrityIcon}>⛓️</div>
              <h5 style={styles.integrityTitle}>Pointer Chain</h5>
              <p style={styles.integrityText}>
                Pointer → Snapshot → SHA-256. This chain ensures every datapoint can be traced 
                back to its immutable source.
              </p>
            </div>
          </div>

          <div style={styles.verificationCard}>
            <h5 style={styles.verificationTitle}>Verification Example</h5>
            <p style={styles.verificationText}>
              Download and verify the latest snapshot:
            </p>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`# 1. Get latest pointer
curl "https://gtixt.com/api/snapshots?limit=1" > pointer.json

# 2. Extract object path and hash
OBJECT=$(cat pointer.json | jq -r '.latest.object')
EXPECTED_HASH=$(cat pointer.json | jq -r '.latest.sha256')

# 3. Download snapshot
curl "https://data.gtixt.com/gpti-snapshots/$OBJECT" > snapshot.json

# 4. Compute SHA-256
COMPUTED_HASH=$(sha256sum snapshot.json | awk '{print $1}')

# 5. Verify
if [ "$COMPUTED_HASH" = "$EXPECTED_HASH" ]; then
  echo "✓ Verified: Hash matches"
else
  echo "✗ Mismatch: Data corrupted"
fi`}</pre>
            </div>
          </div>

          <p style={styles.integrityNote}>
            For browser-based verification, use the{" "}
            <Link href="/integrity" style={styles.integrityLink}>Integrity Beacon</Link> tool.
          </p>
        </section>

        {/* Examples */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Code Examples</h2>
          <p style={styles.sectionLead}>
            Complete working examples in curl, Python, and JavaScript for common API operations.
          </p>

          <div style={styles.exampleCard}>
            <h5 style={styles.exampleTitle}>cURL: Get Latest Snapshot Metadata</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`curl -X GET "https://gtixt.com/api/snapshots?limit=1" \\
  -H "Accept: application/json"`}</pre>
            </div>
          </div>

          <div style={styles.exampleCard}>
            <h5 style={styles.exampleTitle}>Python: Fetch All Firms</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`import requests

# Fetch all firms
response = requests.get(
  "https://gtixt.com/api/firms",
    params={"limit": 100, "sort": "score"}
)

payload = response.json()
firms = payload["firms"]

for firm in firms:
    print(f"{firm['firm_id']}. {firm['name']}: {firm['score_0_100']}")`}</pre>
            </div>
          </div>

          <div style={styles.exampleCard}>
            <h5 style={styles.exampleTitle}>JavaScript: Get Firm Details</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`async function getFirm(firmId) {
  const response = await fetch(
    \`https://gtixt.com/api/firm?id=\${firmId}\`
  );
  
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}\`);
  }
  
  const payload = await response.json();
  const firm = payload.firm;
  console.log(\`\${firm.name}: Score \${firm.score_0_100}\`);
  console.log("Pillars:", firm.pillar_scores);
  
  return firm;
}

// Usage
getFirm("ftmocom").catch(console.error);`}</pre>
            </div>
          </div>

          <div style={styles.exampleCard}>
            <h5 style={styles.exampleTitle}>Python: Verify Snapshot Integrity</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`import hashlib
import requests

# 1. Get pointer
pointer = requests.get("https://gtixt.com/api/snapshots?limit=1").json()

# 2. Download snapshot
snapshot_url = f"https://data.gtixt.com/gpti-snapshots/{pointer['latest']['object']}"
snapshot = requests.get(snapshot_url).content

# 3. Compute hash
computed = hashlib.sha256(snapshot).hexdigest()
expected = pointer["latest"]["sha256"]

# 4. Verify
if computed == expected:
    print("✓ Verified: Hash matches")
else:
    print("✗ Mismatch: Data corrupted")`}</pre>
            </div>
          </div>
        </section>

        {/* Support */}
        <section style={styles.ctaSection} className="api-cta-section">
          <h3 style={styles.ctaTitle}>Need Help?</h3>
          <p style={styles.ctaText}>
            For API support, integration questions, or bug reports, visit our documentation hub 
            or verify data integrity through the Integrity Beacon.
          </p>
          <div style={styles.ctaButtons} className="api-cta-buttons">
            <Link href="/integrity" style={{...styles.button, ...styles.buttonPrimary}}>
              🔒 Integrity Beacon
            </Link>
            <Link href="/methodology" style={{...styles.button, ...styles.buttonSecondary}}>
              📚 Methodology
            </Link>
            <Link href="/data" style={{...styles.button, ...styles.buttonGhost}}>
              📊 Data Access
            </Link>
          </div>
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
    color: "#2F81F7",
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
    color: "#8B949E",
    lineHeight: "1.7",
    maxWidth: "800px",
    margin: "0 auto",
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
  overviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },
  overviewCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
    textAlign: "center",
  },
  overviewIcon: {
    fontSize: "40px",
    marginBottom: "16px",
  },
  overviewTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  overviewText: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  baseUrlCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
  },
  baseUrlTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "16px",
  },
  baseUrlNote: {
    fontSize: "13px",
    color: "#8B949E",
    marginTop: "12px",
  },
  endpointCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "32px",
    marginBottom: "24px",
  },
  endpointHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  methodBadge: {
    display: "inline-block",
    padding: "6px 14px",
    fontSize: "13px",
    fontWeight: "700",
    backgroundColor: "#1E2630",
    color: "#3FB950",
    borderRadius: "6px",
  },
  endpointPath: {
    fontSize: "18px",
    fontWeight: "600",
    fontFamily: "monospace",
    color: "#C9D1D9",
  },
  endpointDesc: {
    fontSize: "15px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "24px",
  },
  endpointNote: {
    fontSize: "14px",
    color: "#2F81F7",
    lineHeight: "1.6",
    padding: "16px",
    backgroundColor: "#1E2630",
    borderLeft: "4px solid #2F81F7",
    borderRadius: "4px",
    marginTop: "24px",
  },
  subTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginTop: "24px",
    marginBottom: "12px",
  },
  paramNote: {
    fontSize: "14px",
    color: "#8B949E",
    marginBottom: "16px",
    fontStyle: "italic",
  },
  paramTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "20px",
    fontSize: "14px",
  },
  tableWrapper: {
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    marginBottom: "20px",
    borderRadius: "8px",
  },
  tableHeader: {
    backgroundColor: "#0B0E11",
    padding: "12px",
    textAlign: "left",
    fontWeight: "700",
    color: "#C9D1D9",
    borderBottom: "2px solid #2F81F7",
  },
  tableCell: {
    padding: "12px",
    borderBottom: "1px solid #2F81F7",
    color: "#8B949E",
  },
  codeBlock: {
    backgroundColor: "#0B0E11",
    border: "1px solid #2F81F7",
    borderRadius: "8px",
    padding: "20px",
    overflow: "auto",
    marginBottom: "16px",
    minWidth: 0,
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#C9D1D9",
    lineHeight: "1.8",
    whiteSpace: "pre",
    margin: 0,
    minWidth: 0,
  },
  inlineCode: {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#2F81F7",
    backgroundColor: "#0B0E11",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  modelCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
    marginBottom: "24px",
  },
  modelTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "16px",
  },
  errorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
  },
  errorCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #D64545",
    borderRadius: "12px",
    padding: "28px",
    overflow: "hidden",
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0,
  },
  errorCode: {
    display: "inline-block",
    padding: "8px 16px",
    fontSize: "20px",
    fontWeight: "700",
    backgroundColor: "#1E2630",
    color: "#D64545",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  errorTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  errorText: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "16px",
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
    padding: "8px 16px",
    fontSize: "16px",
    fontWeight: "700",
    backgroundColor: "#2F81F7",
    color: "#0B0E11",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  versionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "8px",
  },
  versionText: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "12px",
  },
  versionDate: {
    fontSize: "13px",
    color: "#8B949E",
    fontStyle: "italic",
  },
  compatibilityCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
  },
  compatibilityTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "16px",
  },
  compatibilityList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  compatibilityItem: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "12px",
    paddingLeft: "20px",
    position: "relative",
  },
  integrityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },
  integrityCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
    textAlign: "center",
  },
  integrityIcon: {
    fontSize: "40px",
    marginBottom: "16px",
  },
  integrityTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  integrityText: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  verificationCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
    marginBottom: "20px",
  },
  verificationTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  verificationText: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "16px",
  },
  integrityNote: {
    fontSize: "14px",
    color: "#8B949E",
    textAlign: "center",
  },
  integrityLink: {
    color: "#2F81F7",
    textDecoration: "underline",
    fontWeight: "600",
  },
  exampleCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
    marginBottom: "24px",
  },
  exampleTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "16px",
  },
  ctaSection: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "16px",
    padding: "48px",
    textAlign: "center",
  },
  ctaTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "16px",
  },
  ctaText: {
    fontSize: "16px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "32px",
  },
  ctaButtons: {
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
    backgroundColor: "#2F81F7",
    color: "#C9D1D9",
  },
  buttonSecondary: {
    backgroundColor: "#1E2630",
    color: "#C9D1D9",
  },
  buttonGhost: {
    backgroundColor: "transparent",
    color: "#2F81F7",
    border: "2px solid #2F81F7",
  },
};

// Add responsive styles at the bottom of the component
const responsiveStyles = `
  @media (max-width: 768px) {
    main[class*="container"] { padding: 20px 16px !important; max-width: 100% !important; }
    h1 { font-size: 24px !important; line-height: 1.2 !important; }
    h2 { font-size: 20px !important; }
    h3, h4, h5 { font-size: 16px !important; }
    p { font-size: 14px !important; line-height: 1.5 !important; }
    
    /* Override grid layouts */
    div[style*="grid-template-columns"] { 
      display: grid !important;
      grid-template-columns: 1fr !important; 
      gap: 16px !important; 
    }
    
    /* Tables wrapper - Force horizontal scroll */
    table { 
      font-size: 10px !important; 
      min-width: 100% !important;
      display: table !important;
      width: max-content !important;
    }
    table th, table td { 
      padding: 8px 6px !important; 
      font-size: 10px !important;
      white-space: nowrap !important;
    }
    
    /* Wrapper for table scroll */
    table:not([style*="width"]) {
      display: block !important;
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }
    
    /* Code blocks */
    pre, code { 
      font-size: 10px !important; 
      overflow-x: auto !important; 
      white-space: pre !important;
      display: block !important;
      -webkit-overflow-scrolling: touch !important;
    }
    div[style*="codeBlock"] {
      padding: 12px !important;
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }
    
    /* Endpoint cards */
    div[style*="endpointCard"] { 
      padding: 16px !important; 
      margin-bottom: 16px !important;
    }
    div[style*="endpointHeader"] { 
      flex-direction: column !important; 
      align-items: flex-start !important; 
      gap: 8px !important; 
    }
    
    /* Error Grid - Keep grid layout like version grid */
    div[style*="errorGrid"] {
      display: grid !important;
      grid-template-columns: 1fr !important;
      gap: 16px !important;
      padding: 0 !important;
      width: 100% !important;
    }
    div[style*="errorCard"] {
      padding: 12px !important;
      margin-bottom: 0 !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
      width: 100% !important;
      min-width: 0 !important;
    }
    div[style*="errorCard"] div[style*="codeBlock"] {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      min-width: 0 !important;
    }
    div[style*="errorCard"] pre {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      min-width: 0 !important;
    }
    div[style*="errorCode"] {
      font-size: 32px !important;
    }
    
    /* Buttons */
    div[style*="ctaButtons"] { 
      flex-direction: column !important; 
      width: 100% !important;
    }
    div[style*="ctaButtons"] a,
    div[style*="ctaButtons"] button {
      width: 100% !important;
      text-align: center !important;
    }
    
    /* Cards */
    div[style*="Card"] { 
      padding: 16px !important; 
    }
    
    /* CTA Section */
    section[style*="ctaSection"] {
      padding: 24px 16px !important;
    }
  }

  @media (max-width: 480px) {
    h1 { font-size: 20px !important; }
    h2 { font-size: 18px !important; }
    
    /* Even smaller tables on tiny screens */
    table { font-size: 9px !important; }
    table th, table td { 
      padding: 6px 4px !important; 
      font-size: 9px !important; 
    }
    
    /* Smaller code */
    pre, code { font-size: 9px !important; }
    
    /* Error cards */
    div[style*="errorCard"] {
      padding: 12px !important;
    }
    div[style*="errorCode"] {
      font-size: 28px !important;
    }
  }
`;
