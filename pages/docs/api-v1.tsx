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
            No authentication required—free for institutional and research use.
          </p>
        </section>

        {/* Overview */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Overview</h2>
          <p style={styles.sectionLead}>
            The GTIXT API provides programmatic access to all published data, including firm scores, 
            pillar breakdowns, evidence excerpts, and snapshot metadata.
          </p>

          <div style={styles.overviewGrid}>
            <div style={styles.overviewCard}>
              <div style={styles.overviewIcon}>🔓</div>
              <h4 style={styles.overviewTitle}>Public & Free</h4>
              <p style={styles.overviewText}>
                No API keys, no rate limits, no authentication. All endpoints are publicly accessible 
                for institutional and research use.
              </p>
            </div>

            <div style={styles.overviewCard}>
              <div style={styles.overviewIcon}>🔄</div>
              <h4 style={styles.overviewTitle}>Versioned</h4>
              <p style={styles.overviewText}>
                All endpoints are versioned (/v1/). Breaking changes will be introduced in new versions 
                with backward compatibility preserved.
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

          <div style={styles.baseUrlCard}>
            <h4 style={styles.baseUrlTitle}>Base URL</h4>
            <div style={styles.codeBlock}>
              <code style={styles.codeText}>http://localhost:3000/api</code>
            </div>
            <p style={styles.baseUrlNote}>
              Production URL: <code style={styles.inlineCode}>https://api.gtixt.org/v1</code> (coming soon)
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
              Retrieve snapshot metadata. Use pagination and inspect the `latest` field for the newest snapshot.
            </p>

            <h5 style={styles.subTitle}>Query Parameters</h5>
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

            <h5 style={styles.subTitle}>Example Request</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`curl "http://localhost:3000/api/snapshots?limit=1"`}</pre>
            </div>

            <h5 style={styles.subTitle}>Example Response</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`{
  "success": true,
  "snapshots": [
    {
      "object": "universe_v0.1_public/_public/20260131T171443.939607+0000_36d717685b01.json",
      "sha256": "36d717685b019c1f9d8f5e7dca0f892d8e5bf892aa8cab7563cb06",
      "created_at": "2026-01-31T17:14:43.939607Z",
      "count": 127
    }
  ],
  "total": 3,
  "latest": {
    "object": "universe_v0.1_public/_public/20260131T171443.939607+0000_36d717685b01.json",
    "sha256": "36d717685b019c1f9d8f5e7dca0f892d8e5bf892aa8cab7563cb06",
    "created_at": "2026-01-31T17:14:43.939607Z",
    "count": 127
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
                  <td style={styles.tableCell}>Max results (1-100)</td>
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

            <h5 style={styles.subTitle}>Example Request</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`curl "http://localhost:3000/api/firms?limit=10&sort=score"`}</pre>
            </div>

            <h5 style={styles.subTitle}>Example Response</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`{
  "success": true,
  "count": 1,
  "total": 53,
  "limit": 10,
  "offset": 0,
  "firms": [
    {
      "firm_id": "ftmocom",
      "name": "FTMO",
      "status": "active",
      "score_0_100": 87.5,
      "model_type": "challenge",
      "jurisdiction_tier": "tier1",
      "confidence": "HIGH",
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
    "object": "universe_v0.1_public/_public/20260131T171443.939607+0000_36d717685b01.json",
    "sha256": "36d717685b019c1f9d8f5e7dca0f892d8e5bf892aa8cab7563cb06",
    "created_at": "2026-01-31T17:14:43.939607Z",
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
            <p style={styles.paramNote}>*Either <code style={styles.inlineCode}>id</code> or <code style={styles.inlineCode}>name</code> is required.</p>

            <h5 style={styles.subTitle}>Example Request</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`curl "http://localhost:3000/api/firm?id=ftmocom"`}</pre>
            </div>

            <h5 style={styles.subTitle}>Example Response</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`{
  "firm": {
    "firm_id": "ftmocom",
    "name": "FTMO",
    "status": "active",
    "score_0_100": 87.5,
    "model_type": "challenge",
    "jurisdiction_tier": "tier1",
    "confidence": "HIGH",
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
    "object": "universe_v0.1_public/_public/20260131T171443.939607+0000_36d717685b01.json",
    "sha256": "36d717685b019c1f9d8f5e7dca0f892d8e5bf892aa8cab7563cb06",
    "created_at": "2026-01-31T17:14:43.939607Z",
    "count": 127
  }
}`}</pre>
            </div>
          </div>
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
  "id": "string",              // Unique firm identifier
  "name": "string",            // Display name
  "score": 0-100,              // GTIXT composite score
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "rank": integer,             // Current ranking (1-N)
  "pillars": {
    "transparency": 0.0-1.0,
    "payout_reliability": 0.0-1.0,
    "risk_model": 0.0-1.0,
    "legal_compliance": 0.0-1.0,
    "reputation": 0.0-1.0
  },
  "metadata": {
    "jurisdiction": "US" | "EU" | "APAC" | "OTHER",
    "website": "string",
    "last_updated": "ISO8601 timestamp"
  },
  "evidence": [EvidenceExcerpt]  // Optional, see below
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

          <div style={styles.versionGrid}>
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
              <div style={{...styles.versionBadge, backgroundColor: "#1E2630", color: "#2F81F7"}}>v1.1</div>
              <h5 style={styles.versionTitle}>Planned (Q2 2026)</h5>
              <p style={styles.versionText}>
                Expand snapshot history via /snapshots?before=timestamp, enhanced filtering by jurisdiction 
                and confidence, and evidence excerpt expansion.
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

          <div style={styles.integrityGrid}>
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
curl "http://localhost:3000/api/snapshots?limit=1" > pointer.json

# 2. Extract object path and hash
OBJECT=$(cat pointer.json | jq -r '.latest.object')
EXPECTED_HASH=$(cat pointer.json | jq -r '.latest.sha256')

# 3. Download snapshot
curl "http://51.210.246.61:9000/gpti-snapshots/$OBJECT" > snapshot.json

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
              <pre style={styles.codeText}>{`curl -X GET "http://localhost:3000/api/snapshots?limit=1" \\
  -H "Accept: application/json"`}</pre>
            </div>
          </div>

          <div style={styles.exampleCard}>
            <h5 style={styles.exampleTitle}>Python: Fetch All Firms</h5>
            <div style={styles.codeBlock}>
              <pre style={styles.codeText}>{`import requests

# Fetch all firms
response = requests.get(
    "http://localhost:3000/api/firms",
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
    \`http://localhost:3000/api/firm?id=\${firmId}\`
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
pointer = requests.get("http://localhost:3000/api/snapshots?limit=1").json()

# 2. Download snapshot
snapshot_url = f"http://51.210.246.61:9000/gpti-snapshots/{pointer['latest']['object']}"
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
        <section style={styles.ctaSection}>
          <h3 style={styles.ctaTitle}>Need Help?</h3>
          <p style={styles.ctaText}>
            For API support, integration questions, or bug reports, visit our documentation hub 
            or verify data integrity through the Integrity Beacon.
          </p>
          <div style={styles.ctaButtons}>
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
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#C9D1D9",
    lineHeight: "1.8",
    whiteSpace: "pre",
    margin: 0,
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
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
  },
  errorCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #D64545",
    borderRadius: "12px",
    padding: "28px",
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
