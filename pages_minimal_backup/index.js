import Head from 'next/head'
import { useState, useEffect } from 'react'

export default function Home() {
  const [latest, setLatest] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [theme, setTheme] = useState('institutional') // 'institutional' or 'terminal'
  const [sortBy, setSortBy] = useState('score')
  const [filterBy, setFilterBy] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch latest metadata
      const latestResponse = await fetch('https://gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json')
      if (!latestResponse.ok) {
        throw new Error(`Failed to fetch latest: ${latestResponse.status}`)
      }
      const latestData = await latestResponse.json()
      setLatest(latestData)

      // Fetch actual data
      const dataResponse = await fetch(`https://gtixt.com/gpti-snapshots/${latestData.object}`)
      if (!dataResponse.ok) {
        throw new Error(`Failed to fetch data: ${dataResponse.status}`)
      }
      const dataJson = await dataResponse.json()
      setData(dataJson)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'high'
    if (confidence >= 0.6) return 'medium'
    return 'low'
  }

  const getJurisdictionTier = (country) => {
    const tier1 = ['US', 'GB', 'DE', 'FR', 'CH', 'CA', 'AU', 'JP', 'SG']
    const tier2 = ['NL', 'SE', 'DK', 'NO', 'HK', 'AE', 'IL']
    return tier1.includes(country) ? 'Tier 1' : tier2.includes(country) ? 'Tier 2' : 'Tier 3'
  }

  const sortedData = data?.records
    ?.filter(firm => filterBy === 'all' || getConfidenceColor(firm.confidence) === filterBy)
    ?.sort((a, b) => {
      if (sortBy === 'score') return (b.score || 0) - (a.score || 0)
      if (sortBy === 'name') return a.name?.localeCompare(b.name)
      if (sortBy === 'country') return a.country?.localeCompare(b.country)
      return 0
    }) || []

  return (
    <div className={`app ${theme}`}>
      <Head>
        <title>GTIXT — The Global Prop Trading Index</title>
        <meta name="description" content="Rules-based benchmark for proprietary trading firms. Institutional-grade methodology with complete transparency." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Theme Toggle */}
      <div className="theme-toggle">
        <button
          className={theme === 'institutional' ? 'active' : ''}
          onClick={() => setTheme('institutional')}
        >
          Institutional
        </button>
        <button
          className={theme === 'terminal' ? 'active' : ''}
          onClick={() => setTheme('terminal')}
        >
          Terminal
        </button>
      </div>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>GTIXT</h1>
          <p className="tagline">The Global Prop Trading Index</p>
          <p className="subtitle">Rules-based benchmark for proprietary trading firms with institutional-grade methodology and complete transparency.</p>

          <div className="cta-buttons">
            <a href="#index" className="cta primary">View Live Index</a>
            <a href="/methodology" className="cta secondary">Methodology v1.0</a>
          </div>
        </div>
      </section>

      {/* Index Tape */}
      {latest && (
        <section className="index-tape">
          <div className="tape-item">
            <span className="label">Latest Snapshot:</span>
            <span className="value">{new Date(latest.created_at).toLocaleString()}</span>
          </div>
          <div className="tape-item">
            <span className="label">Publishable Firms:</span>
            <span className="value">{latest.count}</span>
          </div>
          <div className="tape-item">
            <span className="label">Median Score:</span>
            <span className="value">{data ? (data.records.reduce((sum, f) => sum + (f.score || 0), 0) / data.records.length).toFixed(2) : 'N/A'}</span>
          </div>
          <div className="tape-item">
            <span className="label">Pass Rate:</span>
            <span className="value">{((latest.count / 92) * 100).toFixed(1)}%</span>
          </div>
          <div className="tape-item">
            <span className="label">SHA256:</span>
            <span className="value">{latest.sha256.substring(0, 16)}...</span>
          </div>
        </section>
      )}

      {/* Main Index Table */}
      <section id="index" className="index-section">
        <div className="index-header">
          <h2>Live Index</h2>
          <div className="controls">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="score">Sort by Score</option>
              <option value="name">Sort by Name</option>
              <option value="country">Sort by Country</option>
            </select>
            <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
              <option value="all">All Firms</option>
              <option value="high">High Confidence</option>
              <option value="medium">Medium Confidence</option>
              <option value="low">Low Confidence</option>
            </select>
          </div>
        </div>

        {loading && <div className="loading">Loading index data...</div>}
        {error && <div className="error">Error: {error}</div>}

        {data && (
          <div className="index-table-container">
            <table className="index-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Firm Name</th>
                  <th>Score</th>
                  <th>Confidence</th>
                  <th>NA Rate</th>
                  <th>Jurisdiction</th>
                  <th>Tier</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.slice(0, 50).map((firm, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{firm.name || 'Unknown'}</td>
                    <td className="score">{firm.score ? firm.score.toFixed(2) : 'N/A'}</td>
                    <td>
                      <span className={`confidence ${getConfidenceColor(firm.confidence)}`}>
                        {getConfidenceColor(firm.confidence).toUpperCase()}
                      </span>
                    </td>
                    <td>{firm.na_rate ? `${(firm.na_rate * 100).toFixed(1)}%` : 'N/A'}</td>
                    <td>{firm.country || 'N/A'}</td>
                    <td>{getJurisdictionTier(firm.country)}</td>
                    <td>
                      <button className="view-profile">View Profile</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style jsx>{`
        .app {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-height: 100vh;
          transition: all 0.3s ease;
        }

        .app.institutional {
          background: #ffffff;
          color: #1a1a1a;
        }

        .app.terminal {
          background: #0a0a0a;
          color: #e0e0e0;
        }

        .theme-toggle {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
        }

        .theme-toggle button {
          padding: 8px 16px;
          margin-left: 8px;
          border: 1px solid #333;
          background: transparent;
          color: inherit;
          cursor: pointer;
          border-radius: 4px;
        }

        .theme-toggle button.active {
          background: #0070f3;
          color: white;
        }

        .hero {
          padding: 100px 20px;
          text-align: center;
          border-bottom: 1px solid #e0e0e0;
        }

        .hero h1 {
          font-size: 4rem;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .tagline {
          font-size: 1.5rem;
          color: #666;
          margin: 10px 0 20px;
        }

        .subtitle {
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0 auto 40px;
          line-height: 1.6;
        }

        .cta-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .cta {
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .cta.primary {
          background: #0070f3;
          color: white;
        }

        .cta.secondary {
          border: 1px solid #0070f3;
          color: #0070f3;
        }

        .index-tape {
          background: #f8f9fa;
          padding: 12px 20px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          gap: 30px;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
        }

        .app.terminal .index-tape {
          background: #1a1a1a;
          border-bottom: 1px solid #333;
        }

        .tape-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tape-item .label {
          color: #666;
        }

        .tape-item .value {
          font-weight: 600;
          color: #0070f3;
        }

        .index-section {
          padding: 40px 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .index-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .index-header h2 {
          margin: 0;
          font-size: 2rem;
        }

        .controls {
          display: flex;
          gap: 15px;
        }

        .controls select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
        }

        .app.terminal .controls select {
          background: #2a2a2a;
          border-color: #444;
          color: inherit;
        }

        .index-table-container {
          overflow-x: auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }

        .app.terminal .index-table-container {
          border-color: #333;
        }

        .index-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .index-table th,
        .index-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #f0f0f0;
        }

        .app.terminal .index-table th,
        .app.terminal .index-table td {
          border-bottom-color: #333;
        }

        .index-table th {
          background: #f8f9fa;
          font-weight: 600;
          position: sticky;
          top: 0;
        }

        .app.terminal .index-table th {
          background: #1a1a1a;
        }

        .score {
          font-weight: 600;
          font-family: 'Courier New', monospace;
        }

        .confidence {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .confidence.high {
          background: #d4edda;
          color: #155724;
        }

        .confidence.medium {
          background: #fff3cd;
          color: #856404;
        }

        .confidence.low {
          background: #f8d7da;
          color: #721c24;
        }

        .app.terminal .confidence.high {
          background: #1a3d2e;
          color: #4ade80;
        }

        .app.terminal .confidence.medium {
          background: #3d3520;
          color: #fbbf24;
        }

        .app.terminal .confidence.low {
          background: #3d2020;
          color: #f87171;
        }

        .view-profile {
          padding: 6px 12px;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .loading, .error {
          text-align: center;
          padding: 40px;
          font-size: 1.1rem;
        }

        .error {
          color: #dc3545;
        }

        @media (max-width: 768px) {
          .hero h1 {
            font-size: 2.5rem;
          }

          .index-tape {
            flex-direction: column;
            gap: 10px;
          }

          .index-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }

          .controls {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  )
}