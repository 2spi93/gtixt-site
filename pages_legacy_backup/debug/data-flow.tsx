/**
 * Interactive Data Flow Debugger
 * Affiche le chemin complet des données avec logs détaillés
 */

import { useState, useEffect } from 'react';

interface ApiTest {
  name: string;
  endpoint: string;
  description: string;
  expectedFields?: string[];
}

const API_TESTS: ApiTest[] = [
  {
    name: 'Health Check',
    endpoint: '/api/health',
    description: 'Vérifier que les services sont actifs',
    expectedFields: ['status', 'services']
  },
  {
    name: 'Firms List',
    endpoint: '/api/firms?limit=5',
    description: 'Charger les 5 premières entreprises (seed data)',
    expectedFields: ['firms', 'count']
  },
  {
    name: 'Agent Status',
    endpoint: '/api/agents/status',
    description: 'Récupérer les métriques des agents',
    expectedFields: ['agents', 'totalAgents']
  },
  {
    name: 'Evidence',
    endpoint: '/api/evidence?limit=5',
    description: 'Récupérer les preuves collectées',
    expectedFields: ['evidence']
  },
  {
    name: 'Validation Metrics',
    endpoint: '/api/validation/metrics',
    description: 'Métriques de validation',
    expectedFields: ['metrics']
  },
  {
    name: 'Events',
    endpoint: '/api/events?limit=10',
    description: 'Flux d\'événements en direct',
    expectedFields: ['events']
  },
  {
    name: 'Snapshots',
    endpoint: '/api/snapshots',
    description: 'Snapshots des données agents',
    expectedFields: ['snapshots']
  }
];

interface ApiResponse {
  firms?: Array<{ firm_id: string; [key: string]: unknown }>;
  events?: Array<{ id: string; [key: string]: unknown }>;
  evidence?: Array<{ id: string; [key: string]: unknown }>;
  agents?: Array<{ id: string; [key: string]: unknown }>;
  snapshots?: Array<{ id: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

interface TestResult {
  endpoint: string;
  status: 'pending' | 'success' | 'error' | 'loading';
  statusCode?: number;
  data?: ApiResponse;
  error?: string;
  duration?: number;
}

export default function DataFlowDebugger() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/health');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        runAllTests();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const testEndpoint = async (endpoint: string) => {
    setResults(prev => ({
      ...prev,
      [endpoint]: { endpoint, status: 'loading' }
    }));

    try {
      const startTime = performance.now();
      const response = await fetch(endpoint);
      const duration = performance.now() - startTime;
      
      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          endpoint,
          status: response.ok ? 'success' : 'error',
          statusCode: response.status,
          data,
          duration: Math.round(duration)
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          endpoint,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };

  const runAllTests = async () => {
    for (const test of API_TESTS) {
      await testEndpoint(test.endpoint);
      // Petit délai pour ne pas surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'loading': return '⏳';
      default: return '⏹️';
    }
  };

  const selectedResult = results[selectedEndpoint];

  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      background: '#f5f5f5'
    }}>
      <h1>🔍 GPTI Data Flow Debugger</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => runAllTests()}
          style={{
            padding: '8px 16px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ▶️ Run All Tests
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh (5s)
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Panel: Test List */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2>📋 API Endpoints</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {API_TESTS.map(test => {
              const result = results[test.endpoint];
              const status = result?.status || 'pending';
              
              return (
                <button
                  key={test.endpoint}
                  onClick={() => {
                    setSelectedEndpoint(test.endpoint);
                    testEndpoint(test.endpoint);
                  }}
                  style={{
                    padding: '12px',
                    background: selectedEndpoint === test.endpoint ? '#e7f3ff' : '#f9f9f9',
                    border: selectedEndpoint === test.endpoint ? '2px solid #007bff' : '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{getStatusIcon(status)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{test.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{test.endpoint}</div>
                    </div>
                    {result?.duration && (
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {result.duration}ms
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Details */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2>📊 Response Details</h2>
          
          {selectedResult ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Endpoint</div>
                <code style={{ 
                  background: '#f5f5f5', 
                  padding: '8px', 
                  borderRadius: '4px',
                  display: 'block',
                  wordBreak: 'break-all'
                }}>
                  {selectedResult.endpoint}
                </code>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Status</div>
                <div style={{ 
                  padding: '8px', 
                  background: selectedResult.status === 'success' ? '#d4edda' : '#f8d7da',
                  color: selectedResult.status === 'success' ? '#155724' : '#721c24',
                  borderRadius: '4px'
                }}>
                  {getStatusIcon(selectedResult.status)} {selectedResult.status.toUpperCase()}
                  {selectedResult.statusCode && ` (${selectedResult.statusCode})`}
                  {selectedResult.duration && ` - ${selectedResult.duration}ms`}
                </div>
              </div>

              {selectedResult.error && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Error</div>
                  <div style={{ 
                    background: '#ffebee', 
                    color: '#c62828',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {selectedResult.error}
                  </div>
                </div>
              )}

              {selectedResult.data && (
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Response Data</div>
                  <pre style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '4px',
                    maxHeight: '400px',
                    overflow: 'auto',
                    fontSize: '12px',
                    lineHeight: '1.4'
                  }}>
                    {JSON.stringify(selectedResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#999', textAlign: 'center', padding: '40px 20px' }}>
              ⏹️ Select an endpoint and click test
            </div>
          )}
        </div>
      </div>

      {/* Summary Table */}
      <div style={{ marginTop: '20px', background: 'white', borderRadius: '8px', padding: '16px' }}>
        <h2>📈 Summary</h2>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Endpoint</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
              <th style={{ textAlign: 'right', padding: '8px' }}>Duration</th>
              <th style={{ textAlign: 'right', padding: '8px' }}>Items</th>
            </tr>
          </thead>
          <tbody>
            {API_TESTS.map(test => {
              const result = results[test.endpoint];
              const itemCount = result?.data ? 
                (result.data.firms?.length || result.data.events?.length || result.data.evidence?.length || 
                 result.data.agents?.length || result.data.snapshots?.length || 0) : 0;
              
              return (
                <tr key={test.endpoint} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>
                    <code style={{ fontSize: '12px' }}>{test.endpoint.split('?')[0]}</code>
                  </td>
                  <td style={{ padding: '8px' }}>
                    {getStatusIcon(result?.status || 'pending')} {(result?.status || 'pending').toUpperCase()}
                  </td>
                  <td style={{ textAlign: 'right', padding: '8px', color: '#666' }}>
                    {result?.duration ? `${result.duration}ms` : '—'}
                  </td>
                  <td style={{ textAlign: 'right', padding: '8px', color: '#666' }}>
                    {itemCount > 0 ? itemCount : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Data Flow Diagram */}
      <div style={{ marginTop: '20px', background: 'white', borderRadius: '8px', padding: '16px' }}>
        <h2>🔄 Data Flow Path</h2>
        <code style={{
          display: 'block',
          background: '#f5f5f5',
          padding: '16px',
          borderRadius: '4px',
          fontSize: '12px',
          lineHeight: '1.8'
        }}>
          {`seed.json (100 firms)
  ↓
Bots/Agents Process
  ↓
MinIO Storage (Object lock)
  ↓
API Routes (/api/*)
  ↓
Frontend Pages
  ├─ /agents-dashboard
  ├─ /phase2
  ├─ /firms
  ├─ /firm/[id]
  └─ /data
  ↓
Browser (React Components)
  ↓
User Interface`}
        </code>
      </div>
    </div>
  );
}
