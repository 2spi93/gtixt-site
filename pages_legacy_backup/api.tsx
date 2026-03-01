import Head from "next/head";
import { useTranslation } from "../lib/useTranslationStub";
import InstitutionalHeader from "../components/InstitutionalHeader";

export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/api-docs",
      permanent: false,
    },
  };
}

export default function ApiRedirectPage() {
  return null;
}

export function APIDocumentation() {
  const { t } = useTranslation("common");

  return (
    <div style={styles.container} suppressHydrationWarning>
      <Head>
        <title>{t("api.metaTitle")}</title>
        <meta name="description" content={t("api.metaDescription")} />
      </Head>

      <InstitutionalHeader
        breadcrumbs={[
          { label: t("api.breadcrumb"), href: "/api" },
        ]}
      />

      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div style={styles.container}>
          <p style={styles.eyebrow}>{t("api.eyebrow")}</p>
          <h1 style={styles.h1}>{t("api.title")}</h1>
          <p style={styles.lead}>{t("api.lead")}</p>
        </div>
      </div>

      {/* Content */}
      <div style={styles.maxWidth}>
        {/* Overview */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("api.overview.title")}</h2>
          <p style={styles.p}>
            {t("api.overview.description")}
          </p>
          <p style={styles.p}>
            <strong>{t("api.overview.principlesTitle")}</strong>
          </p>
          <ul style={styles.ul}>
            <li><strong>{t("api.overview.principle1")}:</strong> {t("api.overview.principle1Desc")}</li>
            <li><strong>{t("api.overview.principle2")}:</strong> {t("api.overview.principle2Desc")}</li>
            <li><strong>{t("api.overview.principle3")}:</strong> {t("api.overview.principle3Desc")}</li>
            <li><strong>{t("api.overview.principle4")}:</strong> {t("api.overview.principle4Desc")}</li>
            <li><strong>{t("api.overview.principle5")}:</strong> {t("api.overview.principle5Desc")}</li>
          </ul>
        </section>

        {/* latest.json Endpoint */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("api.endpoint1.title")}</h2>
          <h3 style={styles.h3}>{t("api.endpoint1.endpointLabel")} <code style={styles.code}>latest.json</code></h3>
          <p style={styles.p}>
            {t("api.endpoint1.description")}
          </p>

          <div style={styles.card}>
            <div style={styles.cardTitle}>{t("api.requestLabel")}</div>
            <pre style={styles.pre}>
GET /gpti-snapshots/universe_v0.1_public/_public/latest.json
Host: data.gtixt.com</pre>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>{t("api.responseLabel")}</div>
            <pre style={styles.pre}>{`{
  "object": "universe_v0.1_public/_public/20260214T040316.702244+0000_6d909f1f475e.json",
  "sha256": "6d909f1f475e5877870ff19f4bde71c1b881f2c62d70b3263953eb7c244c3f8a",
  "created_at": "2026-02-14T04:03:16.702244+00:00",
  "count": 230
}
`}</pre>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>{t("api.responseSchemaLabel")}</div>
            <ul style={styles.ul}>
              <li><code style={styles.code}>object</code> — {t("api.endpoint1.field1")}</li>
              <li><code style={styles.code}>sha256</code> — {t("api.endpoint1.field2")}</li>
              <li><code style={styles.code}>created_at</code> — {t("api.endpoint1.field3")}</li>
              <li><code style={styles.code}>count</code> — {t("api.endpoint1.field4")}</li>
            </ul>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>{t("api.exampleCurlLabel")}</div>
            <pre style={styles.pre}>{`curl -s "https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json" | jq '.'`}</pre>
          </div>
        </section>

        {/* Snapshot Endpoint */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("api.endpoint2.title")}</h2>
          <h3 style={styles.h3}>{t("api.endpoint2.endpointLabel")} <code style={styles.code}>{"/{object}"}</code></h3>
          <p style={styles.p}>
            {t("api.endpoint2.description")}
          </p>

          <div style={styles.card}>
            <div style={styles.cardTitle}>{t("api.requestLabel")}</div>
            <pre style={styles.pre}>
GET /gpti-snapshots/{"{universe_v0.1_public/_public/20260214T040316...json}"}
Host: data.gtixt.com</pre>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>{t("api.responseStructureLabel")}</div>
            <pre style={styles.pre}>{`{
  "meta": {
    "snapshot_version": "universe_v0.1",
    "generated_at_utc": "2026-02-14T04:03:16.702244+00:00",
    "count": 230
  },
  "records": [
    {
      "firm_id": "FIRM_123",
      "brand_name": "Example Capital Partners",
      "website_root": "https://example-capital.com",
      "model_type": "CFD_FX",
      "jurisdiction": "Global",
      "jurisdiction_tier": "Global",
      "confidence": 0.9,
      "na_rate": 42.86,
      "score_0_100": 50.75,
      "pillar_scores": {
        "A_transparency": 0.7,
        "B_payout_reliability": 0.65,
        "C_risk_model": 0.1,
        "D_legal_compliance": 0.5,
        "E_reputation_support": 0.5
      },
      "metric_scores": {
        "rvi": 0.5,
        "rem": 0.4,
        "sss": 0.3
      }
    },
    ...
  ]
}
`}</pre>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>{t("api.recordFieldsLabel")}</div>
            <ul style={styles.ul}>
              <li><code style={styles.code}>firm_id</code> - {t("api.endpoint2.field1")}</li>
              <li><code style={styles.code}>brand_name</code> - {t("api.endpoint2.field2")}</li>
              <li><code style={styles.code}>website_root</code> - {t("api.endpoint2.field3")}</li>
              <li><code style={styles.code}>model_type</code> - {t("api.endpoint2.field4")}</li>
              <li><code style={styles.code}>jurisdiction_tier</code> - {t("api.endpoint2.field5")}</li>
              <li><code style={styles.code}>confidence</code> - {t("api.endpoint2.field6")}</li>
              <li><code style={styles.code}>na_rate</code> - {t("api.endpoint2.field7")}</li>
              <li><code style={styles.code}>score_0_100</code> - {t("api.endpoint2.field8")}</li>
              <li><code style={styles.code}>pillar_scores</code> - {t("api.endpoint2.field9")}</li>
              <li><code style={styles.code}>metric_scores</code> - {t("api.endpoint2.field10")}</li>
            </ul>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>{t("api.exampleCurlLabel")} + {t("api.extractLabel")}</div>
            <pre style={styles.pre}>{`# Get snapshot object from latest
SNAPSHOT=$(curl -s "https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json" | jq -r '.object')

# Fetch full snapshot
curl -s "https://data.gtixt.com/gpti-snapshots/$SNAPSHOT" | jq '.records | length'`}</pre>
          </div>
        </section>

        {/* Integrity Verification */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("api.verification.title")}</h2>
          <p style={styles.p}>
            {t("api.verification.description")}
          </p>

          <div style={styles.card}>
            <div style={styles.cardTitle}>{t("api.verification.serverSide")}</div>
            <pre style={styles.pre}>{`SNAPSHOT=$(curl -s "https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json" | jq -r '.object')
EXPECTED_SHA=$(curl -s "https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json" | jq -r '.sha256')

ACTUAL_SHA=$(curl -s "https://data.gtixt.com/gpti-snapshots/$SNAPSHOT" | sha256sum | cut -d' ' -f1)

if [ "$EXPECTED_SHA" = "$ACTUAL_SHA" ]; then
  echo "✓ Snapshot verified (SHA-256 match)"
else
  echo "✗ Integrity check failed"
  exit 1
fi`}</pre>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>{t("api.verification.clientSide")}</div>
            <pre style={styles.pre}>{`// In browser or Node.js with Web Crypto
async function verifySha256(data, expectedHash) {
  const buffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex.toUpperCase() === expectedHash.toUpperCase();
}

// Usage
const latestRes = await fetch('https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json');
const latest = await latestRes.json();
const snapshotRes = await fetch(\`https://data.gtixt.com/gpti-snapshots/\${latest.object}\`);
const snapshotText = await snapshotRes.text();

const isValid = await verifySha256(snapshotText, latest.sha256);
console.log(isValid ? '✓ Verified' : '✗ Failed');`}</pre>
          </div>
        </section>

        {/* Usage Examples */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("api.workflows.title")}</h2>

          <h3 style={styles.h3}>{t("api.workflows.A")}</h3>
          <pre style={styles.pre}>{`FIRM_ID="FIRM_123"
SNAPSHOT=$(curl -s "https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json" | jq -r '.object')

curl -s "https://data.gtixt.com/gpti-snapshots/$SNAPSHOT" | \\
  jq ".records[] | select(.firm_id == \\"$FIRM_ID\\")"
`}</pre>

          <h3 style={styles.h3}>{t("api.workflows.B")}</h3>
          <pre style={styles.pre}>{`SNAPSHOT=$(curl -s "https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json" | jq -r '.object')

curl -s "https://data.gtixt.com/gpti-snapshots/$SNAPSHOT" | \\
  jq '.records | sort_by(-.score_0_100) | .[0:10] | .[] | {brand_name, score_0_100}'
`}</pre>

          <h3 style={styles.h3}>{t("api.workflows.C")}</h3>
          <pre style={styles.pre}>{`SNAPSHOT=$(curl -s "https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json" | jq -r '.object')

curl -s "https://data.gtixt.com/gpti-snapshots/$SNAPSHOT" | \\
  jq '.records[] | select(.jurisdiction_tier == "Tier 1 (Major Regulatory)")'
`}</pre>

          <h3 style={styles.h3}>{t("api.workflows.D")}</h3>
          <pre style={styles.pre}>{`SNAPSHOT=$(curl -s "https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json" | jq -r '.object')

curl -s "https://data.gtixt.com/gpti-snapshots/$SNAPSHOT" | \\
  jq -r '.records[] | [.firm_id, .brand_name, .score_0_100] | @csv' > export.csv
`}</pre>
        </section>

        {/* Error Handling */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("api.errors.title")}</h2>

          <div style={styles.card}>
            <div style={styles.cardTitle}>{t("api.errors.statusCodesLabel")}</div>
            <ul style={styles.ul}>
              <li><code style={styles.code}>200 OK</code> - {t("api.errors.status200")}</li>
              <li><code style={styles.code}>404 Not Found</code> - {t("api.errors.status404")}</li>
              <li><code style={styles.code}>500 Server Error</code> - {t("api.errors.status500")}</li>
            </ul>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>{t("api.errors.retryPolicyLabel")}</div>
            <p style={styles.p}>
              {t("api.errors.retryPolicyDesc")}
            </p>
            <pre style={styles.pre}>{`async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, { timeout: 5000 });
      if (res.ok) return res;
      if (res.status === 404) throw new Error('Not found');
      // Server error: retry
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    } catch (e) {
      if (i === maxRetries - 1) throw e;
    }
  }
}

const latest = await fetchWithRetry('https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json');`}</pre>
          </div>
        </section>

        {/* CORS & Production */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("api.production.title")}</h2>

          <div style={styles.card}>
            <div style={styles.cardTitle}>{t("api.production.corsLabel")}</div>
            <p style={styles.p}>
              {t("api.production.corsDesc")}
            </p>
            <pre style={styles.pre}>{`Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400`}</pre>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>{t("api.production.httpsLabel")}</div>
            <p style={styles.p}>
              {t("api.production.httpsDesc")}
            </p>
            <ul style={styles.ul}>
              <li>{t("api.production.option1")}</li>
              <li>{t("api.production.option2")}</li>
              <li>{t("api.production.option3")}</li>
            </ul>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>{t("api.production.envLabel")}</div>
            <pre style={styles.pre}>{`# .env.local (development)
NEXT_PUBLIC_LATEST_POINTER_URL=https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json
NEXT_PUBLIC_MINIO_PUBLIC_ROOT=https://data.gtixt.com/gpti-snapshots/

# .env.production (or netlify.toml)
NEXT_PUBLIC_LATEST_POINTER_URL=https://snapshots.example.com/universe_v0.1_public/_public/latest.json
NEXT_PUBLIC_MINIO_PUBLIC_ROOT=https://snapshots.example.com/gpti-snapshots/`}</pre>
          </div>
        </section>

        {/* Support */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("api.support.title")}</h2>
          <p style={styles.p}>
            <strong>{t("api.support.versionLabel")}:</strong> {t("api.support.versionValue")}
          </p>
          <p style={styles.p}>
            <strong>{t("api.support.contactLabel")}:</strong> {t("api.support.contactValue")}
          </p>
          <p style={{ ...styles.p, color: "#9CA3AF", fontSize: "0.9rem" }}>
            {t("api.support.lastUpdated")}
          </p>
        </section>
      </div>

      <style jsx>{`
        code {
          background: rgba(0, 209, 193, 0.1);
          border: 1px solid rgba(0, 209, 193, 0.2);
          border-radius: 4px;
          padding: 0.2rem 0.4rem;
          font-family: 'Monaco', 'Courier New', monospace;
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #070B12 0%, #0F1620 100%)",
    color: "#E5E7EB",
    padding: "0",
    fontFamily: "system-ui, sans-serif",
  },
  pageHeader: {
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "4rem 0 3rem",
    background: "rgba(0, 20, 40, 0.4)",
  },
  eyebrow: {
    margin: "0 0 0.75rem 0",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#00D1C1",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  h1: {
    margin: "0 0 1rem 0",
    fontSize: "2.5rem",
    fontWeight: 700,
    lineHeight: 1.2,
  },
  lead: {
    margin: "0",
    fontSize: "1.125rem",
    lineHeight: 1.6,
    color: "rgba(255, 255, 255, 0.75)",
    maxWidth: "800px",
  },
  maxWidth: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "2rem",
  },
  section: {
    marginBottom: "3rem",
  },
  h2: {
    margin: "0 0 1rem 0",
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "#FFFFFF",
  },
  h3: {
    margin: "1rem 0 0.75rem 0",
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.9)",
  },
  p: {
    margin: "0 0 1rem 0",
    lineHeight: "1.6",
  },
  ul: {
    margin: "1rem 0",
    paddingLeft: "2rem",
    lineHeight: "1.8",
  },
  code: {
    background: "rgba(0, 209, 193, 0.1)",
    border: "1px solid rgba(0, 209, 193, 0.2)",
    borderRadius: "4px",
    padding: "0.2rem 0.4rem",
    fontFamily: "'Monaco', 'Courier New', monospace",
    fontSize: "0.9rem",
  },
  pre: {
    background: "#0F1620",
    border: "1px solid #1F2937",
    borderRadius: "8px",
    padding: "1rem",
    overflow: "auto",
    fontSize: "0.85rem",
    lineHeight: "1.5",
    margin: "0",
    color: "#E5E7EB",
  },
  card: {
    background: "rgba(15, 23, 42, 0.8)",
    border: "1px solid #1F2937",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    backdropFilter: "blur(10px)",
  },
  cardTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#00D1C1",
    marginBottom: "1rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
};

