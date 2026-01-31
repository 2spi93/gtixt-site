import Head from 'next/head'
import { useState } from 'react'

export default function API() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('latest')

  const endpoints = {
    latest: {
      title: 'Latest Snapshot',
      method: 'GET',
      url: 'https://gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json',
      description: 'Get metadata for the most recent published snapshot',
      response: `{
  "object": "universe_v0.1_public/_public/20260130T190729.744722+0000_9237bf7bd902.json",
  "sha256": "9237bf7bd90239a1d826535979d42ae2e6760ef9774a01f04dbdac320f74620f",
  "created_at": "2026-01-30T19:07:29.744722+00:00",
  "count": 53
}`
    },
    snapshot: {
      title: 'Snapshot Data',
      method: 'GET',
      url: 'https://gtixt.com/gpti-snapshots/{object}',
      description: 'Get the complete snapshot data using the object path from latest.json',
      response: `{
  "meta": {
    "version": "v1.0",
    "generated_at_utc": "2026-01-30T19:07:29.744722+00:00",
    "count": 53,
    "sha256": "9237bf7bd90239a1d826535979d42ae2e6760ef9774a01f04dbdac320f74620f"
  },
  "records": [
    {
      "name": "Example Firm",
      "country": "US",
      "score": 8.45,
      "confidence": 0.92,
      "na_rate": 0.03,
      "pillars": {
        "regulatory": 9.2,
        "operational": 8.1,
        "financial": 8.8,
        "transparency": 7.9,
        "market": 8.3
      }
    }
  ]
}`
    },
    firms: {
      title: 'Firms List',
      method: 'GET',
      url: 'https://gtixt.com/gpti-snapshots/universe_v0.1_public/_public/firms.json',
      description: 'Get a simplified list of all firms with basic information',
      response: `[
  {
    "id": "firm_001",
    "name": "Example Firm",
    "country": "US",
    "score": 8.45,
    "confidence": "high"
  }
]`
    }
  }

  const schema = {
    firm: `{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Firm name"
    },
    "country": {
      "type": "string",
      "description": "Country code (ISO 3166-1 alpha-2)"
    },
    "score": {
      "type": "number",
      "minimum": 0,
      "maximum": 10,
      "description": "Overall score (0-10 scale)"
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1,
      "description": "Data confidence score"
    },
    "na_rate": {
      "type": "number",
      "minimum": 0,
      "maximum": 1,
      "description": "Rate of missing data"
    },
    "pillars": {
      "type": "object",
      "properties": {
        "regulatory": { "type": "number" },
        "operational": { "type": "number" },
        "financial": { "type": "number" },
        "transparency": { "type": "number" },
        "market": { "type": "number" }
      }
    }
  }
}`
  }

  return (
    <div className="api-page">
      <Head>
        <title>API Documentation - GTIXT</title>
        <meta name="description" content="Complete API documentation for the Global Prop Trading Index" />
      </Head>

      <div className="api-container">
        <header className="api-header">
          <h1>GTIXT API</h1>
          <p className="version">Version 1.0 - Developer-first access to benchmark data</p>
        </header>

        <div className="api-content">
          <nav className="endpoint-nav">
            <h3>Endpoints</h3>
            {Object.entries(endpoints).map(([key, endpoint]) => (
              <button
                key={key}
                className={`endpoint-button ${selectedEndpoint === key ? 'active' : ''}`}
                onClick={() => setSelectedEndpoint(key)}
              >
                {endpoint.title}
              </button>
            ))}
          </nav>

          <main className="endpoint-content">
            <div className="endpoint-details">
              <div className="endpoint-header">
                <span className={`method ${endpoints[selectedEndpoint].method.toLowerCase()}`}>
                  {endpoints[selectedEndpoint].method}
                </span>
                <code className="url">{endpoints[selectedEndpoint].url}</code>
              </div>

              <p className="description">{endpoints[selectedEndpoint].description}</p>

              <h4>Example Response</h4>
              <pre className="response-example">
                <code>{endpoints[selectedEndpoint].response}</code>
              </pre>
            </div>
          </main>
        </div>

        <section className="api-schema">
          <h3>Data Schema</h3>
          <div className="schema-content">
            <h4>Firm Object</h4>
            <pre className="schema-example">
              <code>{schema.firm}</code>
            </pre>
          </div>
        </section>

        <section className="api-usage">
          <h3>Usage Examples</h3>
          <div className="examples-grid">
            <div className="example">
              <h4>JavaScript (Browser)</h4>
              <pre><code>{`// Fetch latest snapshot metadata
const latest = await fetch('https://gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json')
  .then(r => r.json());

// Fetch complete data
const data = await fetch(\`https://gtixt.com/gpti-snapshots/\${latest.object}\`)
  .then(r => r.json());

console.log(\`Found \${latest.count} firms\`);
console.log(\`Data integrity: \${crypto.subtle.digest('SHA-256', JSON.stringify(data)) === latest.sha256}\`);`}</code></pre>
            </div>

            <div className="example">
              <h4>Python</h4>
              <pre><code>{`import requests
import hashlib
import json

# Fetch latest metadata
latest = requests.get('https://gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json').json()

# Fetch data
data = requests.get(f'https://gtixt.com/gpti-snapshots/{latest["object"]}').json()

# Verify integrity
data_str = json.dumps(data, sort_keys=True)
sha256 = hashlib.sha256(data_str.encode()).hexdigest()
assert sha256 == latest['sha256']

print(f"Verified {latest['count']} firms")`}</code></pre>
            </div>
          </div>
        </section>

        <section className="api-limits">
          <h3>Rate Limits & Terms</h3>
          <div className="limits-grid">
            <div className="limit">
              <h4>Anonymous Access</h4>
              <p>100 requests/hour</p>
              <p>Public endpoints only</p>
            </div>
            <div className="limit">
              <h4>API Keys (Future)</h4>
              <p>10,000 requests/hour</p>
              <p>Historical data access</p>
            </div>
            <div className="limit">
              <h4>Terms of Use</h4>
              <p>Free for non-commercial use</p>
              <p>Attribution required</p>
              <p>No redistribution without permission</p>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .api-page {
          min-height: 100vh;
          background: #ffffff;
          color: #1a1a1a;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .api-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .api-header {
          text-align: center;
          margin-bottom: 50px;
          padding-bottom: 30px;
          border-bottom: 1px solid #e0e0e0;
        }

        .api-header h1 {
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

        .api-content {
          display: grid;
          grid-template-columns: 250px 1fr;
          gap: 40px;
          margin-bottom: 60px;
        }

        .endpoint-nav h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #666;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .endpoint-button {
          display: block;
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e0e0e0;
          background: white;
          text-align: left;
          cursor: pointer;
          border-radius: 6px;
          margin-bottom: 8px;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .endpoint-button:hover {
          border-color: #0070f3;
          background: #f8f9fa;
        }

        .endpoint-button.active {
          border-color: #0070f3;
          background: #0070f3;
          color: white;
        }

        .endpoint-content {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .endpoint-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .method {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
        }

        .method.get {
          background: #28a745;
        }

        .url {
          font-family: 'Courier New', monospace;
          background: #2d3748;
          color: #e2e8f0;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .description {
          color: #666;
          margin-bottom: 30px;
          line-height: 1.6;
        }

        .response-example, .schema-example {
          background: #2d3748;
          color: #e2e8f0;
          padding: 20px;
          border-radius: 6px;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .api-schema, .api-usage, .api-limits {
          margin-bottom: 50px;
        }

        .api-schema h3, .api-usage h3, .api-limits h3 {
          margin-bottom: 30px;
          color: #1a1a1a;
        }

        .schema-content h4 {
          margin-bottom: 15px;
          color: #333;
        }

        .examples-grid, .limits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
        }

        .example, .limit {
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          background: white;
        }

        .example h4, .limit h4 {
          margin: 0 0 15px;
          color: #0070f3;
        }

        .example pre, .limit p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .example code {
          font-family: 'Courier New', monospace;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
          display: block;
          overflow-x: auto;
        }

        @media (max-width: 768px) {
          .api-content {
            grid-template-columns: 1fr;
          }

          .endpoint-nav {
            margin-bottom: 20px;
          }

          .endpoint-button {
            display: inline-block;
            width: auto;
            margin-right: 10px;
            margin-bottom: 10px;
          }

          .api-header h1 {
            font-size: 2rem;
          }

          .examples-grid, .limits-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}