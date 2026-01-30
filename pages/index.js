import Head from 'next/head'
import { useState, useEffect } from 'react'

export default function Home() {
  const [latest, setLatest] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  return (
    <div className="container">
      <Head>
        <title>GPTI XT - Global Prop Trading Index</title>
        <meta name="description" content="Global Prop Trading Index - Token platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>GPTI XT</h1>
        <p>Global Prop Trading Index - Token Platform</p>

        {loading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}

        {latest && data && (
          <div>
            <h2>Latest Snapshot</h2>
            <p><strong>Count:</strong> {latest.count} firms</p>
            <p><strong>Created:</strong> {new Date(latest.created_at).toLocaleString()}</p>
            <p><strong>SHA256:</strong> {latest.sha256.substring(0, 16)}...</p>

            <h3>Sample Firms</h3>
            <div className="firms-grid">
              {data.records.slice(0, 10).map((firm, index) => (
                <div key={index} className="firm-card">
                  <h4>{firm.name || 'Unknown'}</h4>
                  <p>{firm.country || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .container {
          padding: 0 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .firms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
          margin-top: 2rem;
        }
        .firm-card {
          border: 1px solid #ddd;
          padding: 1rem;
          border-radius: 8px;
        }
      `}</style>
    </div>
  )
}