/**
 * Data Flow Test Suite
 * Vérifie que les données transitent correctement:
 * Seed Data → Bots/Agents → API Routes → Frontend Pages
 */

interface TestResult {
  endpoint: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  timestamp: string;
  dataReceived: boolean;
  itemCount?: number;
  sample?: unknown;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const TEST_RESULTS: TestResult[] = [];

function logResult(result: TestResult) {
  TEST_RESULTS.push(result);
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${result.endpoint}] ${result.message}`);
  if (result.sample) {
    console.log(`   Sample: ${JSON.stringify(result.sample).substring(0, 100)}...`);
  }
}

// Test 1: Health Check - Verify API is running
export async function testHealthCheck(): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    logResult({
      endpoint: '/api/health',
      status: response.ok ? 'PASS' : 'FAIL',
      message: `Health check: ${data.status}`,
      timestamp: new Date().toISOString(),
      dataReceived: !!data.status,
      sample: data
    });
  } catch (error) {
    logResult({
      endpoint: '/api/health',
      status: 'FAIL',
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      dataReceived: false
    });
  }
}

// Test 2: Firms List - Verify seed data is loaded
export async function testFirmsEndpoint(): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/api/firms`);
    const data = await response.json();
    
    const itemCount = Array.isArray(data) ? data.length : data?.firms?.length || 0;
    const hasValidData = itemCount > 0;
    
    logResult({
      endpoint: '/api/firms',
      status: hasValidData ? 'PASS' : 'FAIL',
      message: `Firms list: ${itemCount} items retrieved`,
      timestamp: new Date().toISOString(),
      dataReceived: hasValidData,
      itemCount,
      sample: Array.isArray(data) ? data[0] : data?.firms?.[0]
    });
  } catch (error) {
    logResult({
      endpoint: '/api/firms',
      status: 'FAIL',
      message: `Firms endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      dataReceived: false
    });
  }
}

// Test 3: Single Firm Data - Verify firm details endpoint
export async function testFirmDetailsEndpoint(): Promise<void> {
  try {
    // First get a firm ID from the list
    const firmsResponse = await fetch(`${BASE_URL}/api/firms`);
    const firmsData = await firmsResponse.json();
    const firms = Array.isArray(firmsData) ? firmsData : firmsData?.firms || [];
    
    if (firms.length === 0) {
      throw new Error('No firms available to test');
    }
    
    const firmId = firms[0]?.id || firms[0]?.firm_id || 'test-firm-1';
    const response = await fetch(`${BASE_URL}/api/firm?id=${firmId}`);
    const data = await response.json();
    
    const hasValidData = !!data && Object.keys(data).length > 0;
    
    logResult({
      endpoint: `/api/firm?id=${firmId}`,
      status: hasValidData ? 'PASS' : 'FAIL',
      message: `Firm details: Retrieved data for ${firmId}`,
      timestamp: new Date().toISOString(),
      dataReceived: hasValidData,
      sample: data
    });
  } catch (error) {
    logResult({
      endpoint: '/api/firm',
      status: 'FAIL',
      message: `Firm details failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      dataReceived: false
    });
  }
}

// Test 4: Firm History - Verify historical data
export async function testFirmHistoryEndpoint(): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/api/firm-history?id=test-firm-1`);
    const data = await response.json();
    
    const itemCount = Array.isArray(data) ? data.length : 0;
    const hasValidData = itemCount > 0;
    
    logResult({
      endpoint: '/api/firm-history',
      status: hasValidData ? 'PASS' : 'WARNING',
      message: `Firm history: ${itemCount} history entries`,
      timestamp: new Date().toISOString(),
      dataReceived: hasValidData || data?.message !== undefined,
      itemCount,
      sample: Array.isArray(data) ? data[0] : data
    });
  } catch (error) {
    logResult({
      endpoint: '/api/firm-history',
      status: 'FAIL',
      message: `Firm history failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      dataReceived: false
    });
  }
}

// Test 5: Snapshots - Verify agent data snapshots
export async function testSnapshotsEndpoint(): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/api/snapshots`);
    const data = await response.json();
    
    const itemCount = Array.isArray(data) ? data.length : 0;
    const hasValidData = itemCount > 0 || data?.snapshots?.length > 0;
    
    logResult({
      endpoint: '/api/snapshots',
      status: hasValidData ? 'PASS' : 'WARNING',
      message: `Snapshots: ${itemCount || data?.snapshots?.length || 0} snapshots available`,
      timestamp: new Date().toISOString(),
      dataReceived: hasValidData,
      itemCount,
      sample: Array.isArray(data) ? data[0] : data?.snapshots?.[0]
    });
  } catch (error) {
    logResult({
      endpoint: '/api/snapshots',
      status: 'FAIL',
      message: `Snapshots failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      dataReceived: false
    });
  }
}

// Test 6: Agents Status - Verify agent data
export async function testAgentsEndpoint(): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/api/agents/status`);
    const data = await response.json();
    
    const hasValidData = !!data && Object.keys(data).length > 0;
    
    logResult({
      endpoint: '/api/agents/status',
      status: hasValidData ? 'PASS' : 'WARNING',
      message: `Agents status: Retrieved agent metrics`,
      timestamp: new Date().toISOString(),
      dataReceived: hasValidData,
      sample: data
    });
  } catch (error) {
    logResult({
      endpoint: '/api/agents/status',
      status: 'FAIL',
      message: `Agents endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      dataReceived: false
    });
  }
}

// Test 7: Evidence - Verify agent evidence data
export async function testEvidenceEndpoint(): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/api/evidence`);
    const data = await response.json();
    
    const itemCount = Array.isArray(data) ? data.length : data?.evidence?.length || 0;
    const hasValidData = itemCount > 0 || data?.message !== undefined;
    
    logResult({
      endpoint: '/api/evidence',
      status: hasValidData ? 'PASS' : 'WARNING',
      message: `Evidence: ${itemCount} evidence items`,
      timestamp: new Date().toISOString(),
      dataReceived: hasValidData,
      itemCount,
      sample: Array.isArray(data) ? data[0] : data?.evidence?.[0]
    });
  } catch (error) {
    logResult({
      endpoint: '/api/evidence',
      status: 'FAIL',
      message: `Evidence failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      dataReceived: false
    });
  }
}

// Test 8: Events - Verify event data
export async function testEventsEndpoint(): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/api/events?limit=10`);
    const data = await response.json();
    
    const itemCount = Array.isArray(data) ? data.length : data?.events?.length || 0;
    const hasValidData = itemCount > 0 || data?.message !== undefined;
    
    logResult({
      endpoint: '/api/events',
      status: hasValidData ? 'PASS' : 'WARNING',
      message: `Events: ${itemCount} events retrieved`,
      timestamp: new Date().toISOString(),
      dataReceived: hasValidData,
      itemCount,
      sample: Array.isArray(data) ? data[0] : data?.events?.[0]
    });
  } catch (error) {
    logResult({
      endpoint: '/api/events',
      status: 'FAIL',
      message: `Events failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      dataReceived: false
    });
  }
}

// Test 9: Validation Metrics - Verify validation pipeline
export async function testValidationMetricsEndpoint(): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/api/validation/metrics`);
    const data = await response.json();
    
    const hasValidData = !!data && Object.keys(data).length > 0;
    
    logResult({
      endpoint: '/api/validation/metrics',
      status: hasValidData ? 'PASS' : 'WARNING',
      message: `Validation metrics: Retrieved validation data`,
      timestamp: new Date().toISOString(),
      dataReceived: hasValidData,
      sample: data
    });
  } catch (error) {
    logResult({
      endpoint: '/api/validation/metrics',
      status: 'FAIL',
      message: `Validation metrics failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      dataReceived: false
    });
  }
}

// Test 10: Latest Pointer - Verify pointer tracking
export async function testLatestPointerEndpoint(): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/api/latest-pointer`);
    const data = await response.json();
    
    const hasValidData = !!data && (data.pointer !== undefined || data.latest !== undefined);
    
    logResult({
      endpoint: '/api/latest-pointer',
      status: hasValidData ? 'PASS' : 'WARNING',
      message: `Latest pointer: ${data.pointer || data.latest || 'No pointer data'}`,
      timestamp: new Date().toISOString(),
      dataReceived: hasValidData,
      sample: data
    });
  } catch (error) {
    logResult({
      endpoint: '/api/latest-pointer',
      status: 'FAIL',
      message: `Latest pointer failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      dataReceived: false
    });
  }
}

// Generate Summary Report
export function generateSummaryReport(): string {
  const passed = TEST_RESULTS.filter(r => r.status === 'PASS').length;
  const failed = TEST_RESULTS.filter(r => r.status === 'FAIL').length;
  const warnings = TEST_RESULTS.filter(r => r.status === 'WARNING').length;
  const total = TEST_RESULTS.length;
  
  const report = `
╔════════════════════════════════════════════════════════════════════╗
║                     DATA FLOW TEST REPORT                          ║
╚════════════════════════════════════════════════════════════════════╝

📊 SUMMARY:
  Total Tests: ${total}
  ✅ Passed: ${passed} (${((passed/total)*100).toFixed(1)}%)
  ❌ Failed: ${failed} (${((failed/total)*100).toFixed(1)}%)
  ⚠️  Warnings: ${warnings} (${((warnings/total)*100).toFixed(1)}%)

🔍 DETAILED RESULTS:
${TEST_RESULTS.map(r => 
  `  ${r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️'} ${r.endpoint.padEnd(30)} - ${r.message}`
).join('\n')}

📈 DATA FLOW ASSESSMENT:
${failed === 0 ? '✅ ALL CRITICAL PATHS OPERATIONAL' : `❌ ${failed} CRITICAL PATHS DOWN`}
${warnings === 0 ? '✅ NO WARNINGS' : `⚠️ ${warnings} WARNINGS - Check optional endpoints`}

🎯 NEXT STEPS:
${failed === 0 ? 
  '1. All API endpoints are responding correctly\n  2. Data is flowing from agents/bots to pages\n  3. Run frontend integration tests' : 
  '1. Fix failing endpoints\n  2. Check API route configurations\n  3. Verify database/seed data is loaded\n  4. Check service status'}

Generated: ${new Date().toISOString()}
`;
  
  return report;
}

// Run all tests
export async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Data Flow Tests...\n');
  
  await testHealthCheck();
  await testFirmsEndpoint();
  await testFirmDetailsEndpoint();
  await testFirmHistoryEndpoint();
  await testSnapshotsEndpoint();
  await testAgentsEndpoint();
  await testEvidenceEndpoint();
  await testEventsEndpoint();
  await testValidationMetricsEndpoint();
  await testLatestPointerEndpoint();
  
  console.log('\n' + generateSummaryReport());
  
  // Export results for CI/CD
  console.log('\n📄 Test Results (JSON):', JSON.stringify(TEST_RESULTS, null, 2));
}

// For Node.js execution
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests().catch(console.error);
}
